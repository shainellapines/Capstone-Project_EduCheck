const pool = require("../db");
const { recordAuditLog } = require("../utils/auditLog");

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
    deleteAssignment
};
