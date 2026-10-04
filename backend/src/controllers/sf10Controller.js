const pool = require("../db");
const { recordAuditLog } = require("../utils/auditLog");
const { subjectKeysForGrade } = require("../services/sf10/subjects");
const { SCHOOL_SETTING_KEYS, getSchoolSettings } = require("../services/sf10/cumulativeRecord");
const { previewSf10, generateSf10 } = require("../services/sf10/generator");

// ==========================================
// SF10 (Learner's Permanent Academic Record)
// ==========================================
// Access per SPMP §6.2: Admin full; Principal read-only (preview); an
// Adviser only for learners enrolled in a section they advise (in any
// school year). Subject Teachers are kept out at the route level.

const isValidLrn = (value) => typeof value === "string" && /^\d{12}$/.test(value);

const getLearnerAccess = async (req, lrn) => {
    if (req.user.role === "admin") return "write";
    if (req.user.role === "principal") return "read";
    if (req.user.role !== "adviser") return "none";

    const result = await pool.query(
        `
        SELECT 1
        FROM section_enrollments e
        INNER JOIN teacher_assignments ta
            ON ta.section_id = e.section_id
           AND ta.school_year_id = e.school_year_id
           AND ta.subject_id IS NULL
        INNER JOIN teachers t ON t.teacher_id = ta.teacher_id
        WHERE e.lrn = $1 AND t.user_id = $2
        LIMIT 1
        `,
        [lrn, req.user.user_id]
    );

    return result.rows.length > 0 ? "write" : "none";
};

// Resolves the LRN, the learner's existence and the caller's access in one
// place; sends the error response itself and returns null when denied.
const guardLearner = async (req, res, needed) => {
    const { lrn } = req.params;

    if (!isValidLrn(lrn)) {
        res.status(400).json({ message: "A valid 12-digit LRN is required." });
        return null;
    }

    const exists = await pool.query("SELECT 1 FROM students WHERE lrn = $1", [lrn]);
    if (exists.rows.length === 0) {
        res.status(404).json({ message: "Learner not found." });
        return null;
    }

    const access = await getLearnerAccess(req, lrn);
    if (access === "none" || (needed === "write" && access !== "write")) {
        res.status(403).json({
            message:
                req.user.role === "adviser"
                    ? "You can only manage the permanent record of learners in a section you advise."
                    : "You do not have permission to change this record.",
        });
        return null;
    }

    return lrn;
};

// ---------- school settings ----------

const getSettings = async (req, res) => {
    try {
        return res.json({ settings: await getSchoolSettings() });
    } catch (error) {
        console.error("Get school settings error:", error);
        return res.status(500).json({ message: "Failed to retrieve school settings." });
    }
};

const updateSettings = async (req, res) => {
    try {
        const body = req.body || {};
        const before = await getSchoolSettings();

        for (const key of SCHOOL_SETTING_KEYS) {
            if (!(key in body)) continue;
            const value = typeof body[key] === "string" ? body[key].trim() || null : null;

            await pool.query(
                `
                INSERT INTO school_settings (setting_key, setting_value, updated_at)
                VALUES ($1, $2, NOW())
                ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = NOW()
                `,
                [key, value]
            );
        }

        const after = await getSchoolSettings();

        await recordAuditLog({
            actorUserId: req.user.user_id,
            action: "update",
            entityType: "school_settings",
            entityId: 0,
            beforeData: before,
            afterData: after,
        });

        return res.json({ message: "School settings saved.", settings: after });
    } catch (error) {
        console.error("Update school settings error:", error);
        return res.status(500).json({ message: "Failed to save school settings." });
    }
};

// ---------- preview / download ----------

const getLearnerSf10 = async (req, res) => {
    try {
        const lrn = await guardLearner(req, res, "read");
        if (!lrn) return;

        const { _internal, ...preview } = await previewSf10(lrn);
        return res.json(preview);
    } catch (error) {
        console.error("SF10 preview error:", error);
        return res.status(500).json({ message: "Failed to build the permanent record." });
    }
};

const downloadLearnerSf10 = async (req, res) => {
    try {
        const lrn = await guardLearner(req, res, "write");
        if (!lrn) return;

        const result = await generateSf10(lrn);

        if (result.readiness.status === "NOT_READY") {
            return res.status(409).json({
                message:
                    "There is nothing to put on the SF10 yet: no Grade 1-6 year has an approved record in a grading " +
                    "scheme the current form supports. See the readiness report.",
                readiness: result.readiness,
            });
        }

        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename="${result.filename}"`);
        res.setHeader("X-SF10-Readiness", result.readiness.status);
        res.setHeader("Access-Control-Expose-Headers", "Content-Disposition, X-SF10-Readiness");
        return res.send(result.buffer);
    } catch (error) {
        console.error("SF10 generate error:", error);
        return res.status(500).json({ message: "Failed to generate the SF10." });
    }
};

// ---------- learner profile (SF10 personal info) ----------

const updateLearnerProfile = async (req, res) => {
    try {
        const lrn = await guardLearner(req, res, "write");
        if (!lrn) return;

        const { middle_name, name_extension, sex, birth_date } = req.body || {};
        const clean = (value) => (typeof value === "string" ? value.trim() || null : null);

        if (sex !== undefined && sex !== null && !["Male", "Female"].includes(sex)) {
            return res.status(400).json({ message: "Sex must be Male or Female." });
        }

        if (birth_date) {
            const date = new Date(birth_date);
            if (!/^\d{4}-\d{2}-\d{2}$/.test(birth_date) || Number.isNaN(date.getTime()) || date > new Date()) {
                return res.status(400).json({ message: "Birthdate must be a valid past date (YYYY-MM-DD)." });
            }
        }

        const result = await pool.query(
            `
            UPDATE students SET
                middle_name = CASE WHEN $2 THEN $3 ELSE middle_name END,
                name_extension = CASE WHEN $4 THEN $5 ELSE name_extension END,
                sex = CASE WHEN $6 THEN $7 ELSE sex END,
                birth_date = CASE WHEN $8 THEN $9::date ELSE birth_date END
            WHERE lrn = $1
            RETURNING lrn, last_name, first_name, middle_name, name_extension, sex, birth_date
            `,
            [
                lrn,
                middle_name !== undefined,
                clean(middle_name),
                name_extension !== undefined,
                clean(name_extension),
                sex !== undefined,
                sex ?? null,
                birth_date !== undefined,
                birth_date || null,
            ]
        );

        return res.json({ message: "Learner details saved.", learner: result.rows[0] });
    } catch (error) {
        console.error("Update learner profile error:", error);
        return res.status(500).json({ message: "Failed to save learner details." });
    }
};

// ---------- historical records ----------

const GRADING_SCHEMES = ["QUARTER_4", "TERM_3"];
const RECORD_STATUSES = ["Complete", "Partial", "Unavailable"];
const HEADER_FIELDS = ["school_name", "school_id", "district", "division", "region", "section_name", "adviser_name"];

const isRating = (value) => value === null || value === undefined || (typeof value === "number" && value >= 60 && value <= 100);

// Returns an error message, or null when the payload is valid.
const validateHistoricalPayload = (body) => {
    const { school_year, grade_level, grading_scheme, record_status = "Complete", subjects = [], general_average } = body;

    const yearMatch = /^(\d{4})-(\d{4})$/.exec(school_year || "");
    if (!yearMatch || Number(yearMatch[2]) !== Number(yearMatch[1]) + 1) {
        return "School year must look like 2023-2024.";
    }
    if (!["1", "2", "3", "4", "5", "6"].includes(String(grade_level))) return "Grade level must be 1 to 6.";
    if (!GRADING_SCHEMES.includes(grading_scheme)) return "Grading scheme must be QUARTER_4 or TERM_3.";
    if (!RECORD_STATUSES.includes(record_status)) return "Record status must be Complete, Partial or Unavailable.";
    if (!Array.isArray(subjects)) return "Subjects must be a list.";
    if (!isRating(general_average)) return "General average must be between 60 and 100.";

    const allowed = new Set(subjectKeysForGrade(grade_level));
    const seen = new Set();

    for (const subject of subjects) {
        if (!allowed.has(subject.subject_key)) {
            return `"${subject.subject_key}" is not a Grade ${grade_level} learning area on the SF10.`;
        }
        if (seen.has(subject.subject_key)) return `"${subject.subject_key}" is listed twice.`;
        seen.add(subject.subject_key);

        const ratings = subject.ratings ?? [];
        if (!Array.isArray(ratings) || ratings.length > 4) return "Ratings must be a list of at most 4 values.";
        if (grading_scheme === "TERM_3" && ratings[3] !== undefined && ratings[3] !== null) {
            return "A TERM_3 year has only 3 ratings.";
        }
        if (!ratings.every(isRating) || !isRating(subject.final_rating)) {
            return `Ratings for ${subject.subject_key} must be between 60 and 100.`;
        }
    }

    return null;
};

const upsertHistoricalRecord = async (req, res) => {
    const client = await pool.connect();

    try {
        const lrn = await guardLearner(req, res, "write");
        if (!lrn) return;

        const body = req.body || {};
        const error = validateHistoricalPayload(body);
        if (error) return res.status(400).json({ message: error });

        const existing = await client.query(
            "SELECT * FROM historical_academic_records WHERE lrn = $1 AND school_year = $2",
            [lrn, body.school_year]
        );
        const header = HEADER_FIELDS.map((field) =>
            typeof body[field] === "string" ? body[field].trim() || null : null
        );

        await client.query("BEGIN");

        const recordResult = await client.query(
            `
            INSERT INTO historical_academic_records
                (lrn, school_year, grade_level, grading_scheme, record_status,
                 school_name, school_id, district, division, region, section_name, adviser_name,
                 general_average, remarks, entered_by)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
            ON CONFLICT (lrn, school_year) DO UPDATE SET
                grade_level = EXCLUDED.grade_level,
                grading_scheme = EXCLUDED.grading_scheme,
                record_status = EXCLUDED.record_status,
                school_name = EXCLUDED.school_name,
                school_id = EXCLUDED.school_id,
                district = EXCLUDED.district,
                division = EXCLUDED.division,
                region = EXCLUDED.region,
                section_name = EXCLUDED.section_name,
                adviser_name = EXCLUDED.adviser_name,
                general_average = EXCLUDED.general_average,
                remarks = EXCLUDED.remarks,
                entered_by = EXCLUDED.entered_by,
                updated_at = NOW()
            RETURNING *
            `,
            [
                lrn,
                body.school_year,
                String(body.grade_level),
                body.grading_scheme,
                body.record_status || "Complete",
                ...header,
                body.general_average ?? null,
                typeof body.remarks === "string" ? body.remarks.trim() || null : null,
                req.user.user_id,
            ]
        );
        const record = recordResult.rows[0];

        // Grades are replaced wholesale - the entry grid always sends the full year.
        await client.query("DELETE FROM historical_subject_grades WHERE historical_record_id = $1", [
            record.historical_record_id,
        ]);

        for (const subject of body.subjects || []) {
            const ratings = subject.ratings ?? [];
            await client.query(
                `
                INSERT INTO historical_subject_grades
                    (historical_record_id, subject_key, rating_1, rating_2, rating_3, rating_4, final_rating, remarks)
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
                `,
                [
                    record.historical_record_id,
                    subject.subject_key,
                    ratings[0] ?? null,
                    ratings[1] ?? null,
                    ratings[2] ?? null,
                    ratings[3] ?? null,
                    subject.final_rating ?? null,
                    typeof subject.remarks === "string" ? subject.remarks.trim() || null : null,
                ]
            );
        }

        await client.query("COMMIT");

        await recordAuditLog({
            actorUserId: req.user.user_id,
            action: existing.rows.length > 0 ? "update" : "create",
            entityType: "historical_record",
            entityId: record.historical_record_id,
            beforeData: existing.rows[0] ?? null,
            afterData: { ...record, subjects: body.subjects || [] },
        });

        return res.status(existing.rows.length > 0 ? 200 : 201).json({
            message: "Historical record saved.",
            record,
        });
    } catch (error) {
        await client.query("ROLLBACK").catch(() => {});
        console.error("Save historical record error:", error);
        return res.status(500).json({ message: "Failed to save the historical record." });
    } finally {
        client.release();
    }
};

const deleteHistoricalRecord = async (req, res) => {
    try {
        const lrn = await guardLearner(req, res, "write");
        if (!lrn) return;

        const recordId = Number(req.params.recordId);
        const result = await pool.query(
            "DELETE FROM historical_academic_records WHERE historical_record_id = $1 AND lrn = $2 RETURNING *",
            [recordId, lrn]
        );

        if (result.rows.length === 0) return res.status(404).json({ message: "Historical record not found." });

        await recordAuditLog({
            actorUserId: req.user.user_id,
            action: "delete",
            entityType: "historical_record",
            entityId: recordId,
            beforeData: result.rows[0],
            afterData: null,
        });

        return res.json({ message: "Historical record deleted." });
    } catch (error) {
        console.error("Delete historical record error:", error);
        return res.status(500).json({ message: "Failed to delete the historical record." });
    }
};

module.exports = {
    getSettings,
    updateSettings,
    getLearnerSf10,
    downloadLearnerSf10,
    updateLearnerProfile,
    upsertHistoricalRecord,
    deleteHistoricalRecord,
    validateHistoricalPayload,
};
