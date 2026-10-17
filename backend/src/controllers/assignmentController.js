const pool = require("../db");
const { recordAuditLog } = require("../utils/auditLog");
const { checkGradeLevel } = require("../services/classRecord/rosterCheck");

// A Self-Contained section's Class Adviser teaches every subject of its
// grade level (uploadController.getUploadOptions grants them all), so a
// subject there is never assigned on its own - not to the Adviser, which
// would list it twice, and not to anyone else, which would let two
// teachers upload the same subject.
const selfContainedSubjectMessage = (sectionName) =>
    `${sectionName} is Self-Contained: its Class Adviser teaches every subject, so subjects cannot be assigned separately. Assign the Class Adviser only.`;

// GET all assignments (admin view - joined with readable names)
const getAssignments = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                ta.assignment_id,
                ta.teacher_id,
                t.first_name,
                t.last_name,
                u.role AS teacher_role,
                ta.section_id,
                sec.section_name,
                sec.grade_level,
                sec.staffing_mode,
                ta.subject_id,
                sub.subject_name,
                ta.school_year_id,
                sy.school_year,
                ta.created_at
            FROM teacher_assignments ta
            INNER JOIN teachers t ON t.teacher_id = ta.teacher_id
            INNER JOIN users u ON u.user_id = t.user_id
            INNER JOIN sections sec ON sec.section_id = ta.section_id
            LEFT JOIN subjects sub ON sub.subject_id = ta.subject_id
            INNER JOIN school_years sy ON sy.school_year_id = ta.school_year_id
            ORDER BY sec.grade_level, sec.section_name, sub.subject_name NULLS FIRST
        `);

        res.json(result.rows);
    } catch (error) {
        console.error("Get assignments error:", error);

        res.status(500).json({
            message: "Failed to retrieve assignments."
        });
    }
};

// GET the authenticated user's own assignments (used by the upload page
// to know which subject/section combinations they're allowed to upload
// for - see uploadController.getUploadOptions).
const getMyAssignments = async (req, res) => {
    try {
        const teacherResult = await pool.query(
            `SELECT teacher_id FROM teachers WHERE user_id = $1`,
            [req.user.user_id]
        );

        if (teacherResult.rows.length === 0) {
            // No teacher profile yet (e.g. an Adviser the Administrator
            // hasn't set up as a teacher record) - just means no
            // assignments, not an error.
            return res.json([]);
        }

        const teacherId = teacherResult.rows[0].teacher_id;

        const result = await pool.query(
            `
            SELECT
                ta.assignment_id,
                ta.section_id,
                sec.section_name,
                sec.grade_level,
                sec.staffing_mode,
                ta.subject_id,
                sub.subject_name,
                ta.school_year_id
            FROM teacher_assignments ta
            INNER JOIN sections sec ON sec.section_id = ta.section_id
            LEFT JOIN subjects sub ON sub.subject_id = ta.subject_id
            WHERE ta.teacher_id = $1
            ORDER BY sec.grade_level, sec.section_name
            `,
            [teacherId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error("Get my assignments error:", error);

        res.status(500).json({
            message: "Failed to retrieve your assignments."
        });
    }
};

// CREATE assignment. subject_id omitted/null => Adviser assignment for
// the whole section (only one allowed per section per school year).
// subject_id set => Subject Teacher assignment for that one subject in
// that section (only one teacher per subject/section/year).
const createAssignment = async (req, res) => {
    try {
        const { teacher_id, section_id, subject_id = null, school_year_id } = req.body;

        if (!teacher_id || !section_id || !school_year_id) {
            return res.status(400).json({
                message: "teacher_id, section_id, and school_year_id are required."
            });
        }

        // The Class Adviser slot (no subject) needs an Adviser account: the
        // Adviser pages are gated by users.role, so any other account would
        // hold the section's only Adviser slot without being able to use it.
        // An Adviser account may still take a subject (partial
        // departmentalization), so the reverse is not checked.
        if (!subject_id) {
            const teacher = await pool.query(
                `SELECT u.role FROM teachers t INNER JOIN users u ON u.user_id = t.user_id WHERE t.teacher_id = $1`,
                [teacher_id]
            );
            if (teacher.rows[0] && teacher.rows[0].role !== "adviser") {
                return res.status(409).json({
                    message:
                        "Only an Adviser account can be assigned as Class Adviser. Choose a subject for this teacher, or change the account's role to Adviser in Accounts first."
                });
            }
        }
        // A subject belongs to one grade level; it can only be assigned to
        // a section of that same grade level.
        if (subject_id) {
            const levels = await pool.query(
                `
                SELECT sub.subject_name, sub.grade_level AS subject_grade,
                       sec.section_name, sec.grade_level AS section_grade, sec.staffing_mode
                FROM subjects sub, sections sec
                WHERE sub.subject_id = $1 AND sec.section_id = $2
                `,
                [subject_id, section_id]
            );

            if (levels.rows[0] && levels.rows[0].staffing_mode === "Self-Contained") {
                return res.status(409).json({ message: selfContainedSubjectMessage(levels.rows[0].section_name) });
            }

            const mismatch = levels.rows[0] ? checkGradeLevel({
                subject: { subject_name: levels.rows[0].subject_name, grade_level: levels.rows[0].subject_grade },
                section: { section_name: levels.rows[0].section_name, grade_level: levels.rows[0].section_grade },
            }) : null;

            if (mismatch) {
                return res.status(mismatch.status).json({ message: mismatch.message });
            }
        }

        const result = await pool.query(
            `INSERT INTO teacher_assignments (teacher_id, section_id, subject_id, school_year_id)
             VALUES ($1, $2, $3, $4)
             RETURNING assignment_id, teacher_id, section_id, subject_id, school_year_id, created_at`,
            [teacher_id, section_id, subject_id, school_year_id]
        );

        await recordAuditLog({
            actorUserId: req.user.user_id,
            action: "create",
            entityType: "teacher_assignment",
            entityId: result.rows[0].assignment_id,
            beforeData: null,
            afterData: result.rows[0],
        });

        res.status(201).json({
            message: "Assignment created successfully.",
            assignment: result.rows[0]
        });
    } catch (error) {
        // 23503 = FK violation (bad teacher/section/subject/school_year id)
        // 23505 = unique violation (a section already has an Adviser, or
        // that subject in that section already has a Subject Teacher)
        if (error.code === "23505") {
            return res.status(409).json({
                message: subject_id_conflict_message(req.body)
            });
        }

        if (error.code === "23503") {
            return res.status(400).json({
                message: "One of teacher_id, section_id, subject_id, or school_year_id does not exist."
            });
        }

        console.error("Create assignment error:", error);

        res.status(500).json({
            message: "Failed to create assignment."
        });
    }
};

// CREATE several assignments for one teacher in one section at once: any
// of the section's subjects, plus optionally its Class Adviser slot. Same
// rules as createAssignment, applied to every item; nothing is saved
// unless every item can be (one transaction), so the Administrator never
// ends up with half of a teacher's load assigned.
const createAssignmentsBatch = async (req, res) => {
    const { teacher_id, section_id, school_year_id, class_adviser = false, subject_ids = [] } = req.body || {};

    if (!teacher_id || !section_id || !school_year_id) {
        return res.status(400).json({
            message: "teacher_id, section_id, and school_year_id are required."
        });
    }

    if (!Array.isArray(subject_ids)) {
        return res.status(400).json({ message: "subject_ids must be a list." });
    }

    const subjectIds = [...new Set(subject_ids.map(Number))];

    if (subjectIds.some((id) => !Number.isInteger(id) || id <= 0)) {
        return res.status(400).json({ message: "subject_ids must be valid subject IDs." });
    }

    if (!class_adviser && subjectIds.length === 0) {
        return res.status(400).json({ message: "Choose Class Adviser, at least one subject, or both." });
    }

    const dbClient = await pool.connect();

    try {
        const teacher = await dbClient.query(
            `SELECT t.first_name, t.last_name, u.role
             FROM teachers t INNER JOIN users u ON u.user_id = t.user_id
             WHERE t.teacher_id = $1`,
            [teacher_id]
        );
        const section = await dbClient.query(
            `SELECT section_name, grade_level, staffing_mode FROM sections WHERE section_id = $1`,
            [section_id]
        );

        if (teacher.rows.length === 0 || section.rows.length === 0) {
            return res.status(400).json({ message: "The selected teacher or section does not exist." });
        }

        if (section.rows[0].staffing_mode === "Self-Contained" && subjectIds.length > 0) {
            return res.status(409).json({ message: selfContainedSubjectMessage(section.rows[0].section_name) });
        }

        if (class_adviser && teacher.rows[0].role !== "adviser") {
            return res.status(409).json({
                message:
                    "Only an Adviser account can be assigned as Class Adviser. Choose a subject for this teacher, or change the account's role to Adviser in Accounts first."
            });
        }

        const subjects = subjectIds.length
            ? (
                  await dbClient.query(
                      `SELECT subject_id, subject_name, grade_level FROM subjects WHERE subject_id = ANY($1)`,
                      [subjectIds]
                  )
              ).rows
            : [];

        if (subjects.length !== subjectIds.length) {
            return res.status(400).json({ message: "One or more selected subjects do not exist." });
        }

        for (const subject of subjects) {
            const mismatch = checkGradeLevel({ subject, section: section.rows[0] });
            if (mismatch) {
                return res.status(mismatch.status).json({ message: mismatch.message });
            }
        }

        // Name every slot that is already held, so the Administrator sees
        // all conflicts at once instead of one per attempt.
        const taken = await dbClient.query(
            `
            SELECT ta.subject_id, sub.subject_name, t.first_name, t.last_name
            FROM teacher_assignments ta
            INNER JOIN teachers t ON t.teacher_id = ta.teacher_id
            LEFT JOIN subjects sub ON sub.subject_id = ta.subject_id
            WHERE ta.section_id = $1 AND ta.school_year_id = $2
              AND (ta.subject_id = ANY($3) OR ($4 AND ta.subject_id IS NULL))
            `,
            [section_id, school_year_id, subjectIds, Boolean(class_adviser)]
        );

        if (taken.rows.length > 0) {
            const held = taken.rows.map(
                (row) => `${row.subject_name || "Class Adviser"} (${row.first_name} ${row.last_name})`
            );
            return res.status(409).json({
                message: `Already assigned for this section and school year: ${held.join(", ")}. Nothing was saved.`
            });
        }

        await dbClient.query("BEGIN");

        const created = [];
        const slots = [...(class_adviser ? [null] : []), ...subjectIds];

        for (const subjectId of slots) {
            const result = await dbClient.query(
                `INSERT INTO teacher_assignments (teacher_id, section_id, subject_id, school_year_id)
                 VALUES ($1, $2, $3, $4)
                 RETURNING assignment_id, teacher_id, section_id, subject_id, school_year_id, created_at`,
                [teacher_id, section_id, subjectId, school_year_id]
            );
            created.push(result.rows[0]);
        }

        await dbClient.query("COMMIT");

        for (const assignment of created) {
            await recordAuditLog({
                actorUserId: req.user.user_id,
                action: "create",
                entityType: "teacher_assignment",
                entityId: assignment.assignment_id,
                beforeData: null,
                afterData: assignment,
            });
        }

        res.status(201).json({
            message: `${created.length} assignment${created.length === 1 ? "" : "s"} created.`,
            assignments: created
        });
    } catch (error) {
        await dbClient.query("ROLLBACK").catch(() => {});

        // Another Administrator took a slot between the check and the save.
        if (error.code === "23505") {
            return res.status(409).json({
                message: "One of these slots was just assigned by someone else. Nothing was saved; reload and try again."
            });
        }

        if (error.code === "23503") {
            return res.status(400).json({
                message: "One of teacher_id, section_id, subject_ids, or school_year_id does not exist."
            });
        }

        console.error("Create assignments batch error:", error);

        res.status(500).json({ message: "Failed to create assignments." });
    } finally {
        dbClient.release();
    }
};

const subject_id_conflict_message = ({ subject_id }) =>
    subject_id
        ? "This subject already has a Subject Teacher assigned for this section and school year."
        : "This section already has a Class Adviser assigned for this school year.";

// DELETE assignment
const deleteAssignment = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `DELETE FROM teacher_assignments WHERE assignment_id = $1 RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Assignment not found."
            });
        }

        await recordAuditLog({
            actorUserId: req.user.user_id,
            action: "delete",
            entityType: "teacher_assignment",
            entityId: result.rows[0].assignment_id,
            beforeData: result.rows[0],
            afterData: null,
        });

        res.json({
            message: "Assignment removed successfully."
        });
    } catch (error) {
        console.error("Delete assignment error:", error);

        res.status(500).json({
            message: "Failed to remove assignment."
        });
    }
};

module.exports = {
    getAssignments,
    getMyAssignments,
    createAssignment,
    createAssignmentsBatch,
    deleteAssignment
};
