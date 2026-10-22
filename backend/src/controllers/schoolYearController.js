const pool = require("../db");
const { recordAuditLog } = require("../utils/auditLog");

// ==========================================
// SCHOOL YEARS (Administrator)
// ==========================================
// A school year is opened here before anyone can be assigned to it, so
// learners can move up a grade: enrollments, uploads and records are all
// per school year, and a learner's LRN never changes. Exactly one school
// year is Active (the current one); the others are kept as Inactive and
// stay fully readable in the repository, dashboards and SF10.

const FORMAT = /^(\d{4})-(\d{4})$/;

const listSchoolYears = async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT school_year_id, school_year, status FROM school_years ORDER BY school_year DESC"
        );

        return res.json({ school_years: result.rows });
    } catch (error) {
        console.error("List school years error:", error);

        return res.status(500).json({ message: "Failed to retrieve school years." });
    }
};

const createSchoolYear = async (req, res) => {
    const schoolYear = String(req.body?.school_year ?? "").trim();
    const match = FORMAT.exec(schoolYear);

    if (!match || Number(match[2]) !== Number(match[1]) + 1) {
        return res.status(400).json({
            message: "Enter the school year as two consecutive years, for example 2026-2027.",
        });
    }

    try {
        const result = await pool.query(
            `
            INSERT INTO school_years (school_year, status)
            VALUES ($1, 'Inactive')
            RETURNING school_year_id, school_year, status
            `,
            [schoolYear]
        );

        await recordAuditLog({
            actorUserId: req.user.user_id,
            action: "create",
            entityType: "school_year",
            entityId: result.rows[0].school_year_id,
            beforeData: null,
            afterData: result.rows[0],
        });

        return res.status(201).json({ school_year: result.rows[0] });
    } catch (error) {
        // 23505 = unique violation on school_year
        if (error.code === "23505") {
            return res.status(409).json({ message: `School year ${schoolYear} already exists.` });
        }

        console.error("Create school year error:", error);

        return res.status(500).json({ message: "Failed to create the school year." });
    }
};

// Makes one school year the current one; every other year becomes Inactive.
const activateSchoolYear = async (req, res) => {
    const schoolYearId = Number(req.params.schoolYearId);
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const before = await client.query(
            "SELECT school_year_id, school_year, status FROM school_years WHERE school_year_id = $1 FOR UPDATE",
            [schoolYearId]
        );

        if (before.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({ message: "School year not found." });
        }

        await client.query("UPDATE school_years SET status = 'Inactive' WHERE school_year_id <> $1", [schoolYearId]);

        const after = await client.query(
            `
            UPDATE school_years SET status = 'Active'
            WHERE school_year_id = $1
            RETURNING school_year_id, school_year, status
            `,
            [schoolYearId]
        );

        await client.query("COMMIT");

        if (before.rows[0].status !== "Active") {
            await recordAuditLog({
                actorUserId: req.user.user_id,
                action: "update",
                entityType: "school_year",
                entityId: schoolYearId,
                beforeData: before.rows[0],
                afterData: after.rows[0],
            });
        }

        return res.json({ school_year: after.rows[0] });
    } catch (error) {
        await client.query("ROLLBACK").catch(() => {});
        console.error("Activate school year error:", error);

        return res.status(500).json({ message: "Failed to set the current school year." });
    } finally {
        client.release();
    }
};

module.exports = { listSchoolYears, createSchoolYear, activateSchoolYear };
