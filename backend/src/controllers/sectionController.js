const pool = require("../db");
const { recordAuditLog } = require("../utils/auditLog");

const VALID_STAFFING_MODES = ["Self-Contained", "Departmentalized"];

// GET all sections
const getSections = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT section_id, section_name, grade_level, staffing_mode
            FROM sections
            ORDER BY grade_level, section_name
        `);

        res.json(result.rows);
    } catch (error) {
        console.error("Get sections error:", error);

        res.status(500).json({
            message: "Failed to retrieve sections."
        });
    }
};

// CREATE section
const createSection = async (req, res) => {
    try {
        const {
            section_name,
            grade_level,
            staffing_mode = "Departmentalized"
        } = req.body;

        if (!section_name || !grade_level) {
            return res.status(400).json({
                message: "Section name and grade level are required."
            });
        }

        if (!VALID_STAFFING_MODES.includes(staffing_mode)) {
            return res.status(400).json({
                message: `Staffing mode must be one of: ${VALID_STAFFING_MODES.join(", ")}.`
            });
        }

        const result = await pool.query(
            `INSERT INTO sections (section_name, grade_level, staffing_mode)
             VALUES ($1, $2, $3)
             RETURNING section_id, section_name, grade_level, staffing_mode`,
            [section_name, grade_level, staffing_mode]
        );

        await recordAuditLog({
            actorUserId: req.user.user_id,
            action: "create",
            entityType: "section",
            entityId: result.rows[0].section_id,
            beforeData: null,
            afterData: result.rows[0],
        });

        res.status(201).json({
            message: "Section created successfully.",
            section: result.rows[0]
        });
    } catch (error) {
        console.error("Create section error:", error);

        res.status(500).json({
            message: "Failed to create section."
        });
    }
};

// UPDATE section (name, grade level, and/or staffing mode)
const updateSection = async (req, res) => {
    try {
        const { id } = req.params;
        const { section_name, grade_level, staffing_mode } = req.body;

        if (staffing_mode && !VALID_STAFFING_MODES.includes(staffing_mode)) {
            return res.status(400).json({
                message: `Staffing mode must be one of: ${VALID_STAFFING_MODES.join(", ")}.`
            });
        }

        const beforeResult = await pool.query(
            `SELECT section_id, section_name, grade_level, staffing_mode FROM sections WHERE section_id = $1`,
            [id]
        );

        if (beforeResult.rows.length === 0) {
            return res.status(404).json({
                message: "Section not found."
            });
        }

        // A Self-Contained section's Class Adviser covers every subject, so
        // existing subject assignments would let two teachers upload the
        // same subject (see assignmentController). They go first.
        if (staffing_mode === "Self-Contained" && beforeResult.rows[0].staffing_mode !== "Self-Contained") {
            const subjectSlots = await pool.query(
                `
                SELECT sub.subject_name, t.first_name, t.last_name, sy.school_year
                FROM teacher_assignments ta
                INNER JOIN subjects sub ON sub.subject_id = ta.subject_id
                INNER JOIN teachers t ON t.teacher_id = ta.teacher_id
                INNER JOIN school_years sy ON sy.school_year_id = ta.school_year_id
                WHERE ta.section_id = $1
                ORDER BY sy.school_year, sub.subject_name
                `,
                [id]
            );

            if (subjectSlots.rows.length > 0) {
                const held = subjectSlots.rows.map(
                    (row) => `${row.subject_name} (${row.first_name} ${row.last_name}, ${row.school_year})`
                );
                return res.status(409).json({
                    message:
                        `${beforeResult.rows[0].section_name} still has subject assignments: ${held.join(", ")}. ` +
                        "In a Self-Contained section the Class Adviser teaches every subject, so remove these first."
                });
            }
        }

        const result = await pool.query(
            `UPDATE sections
             SET section_name = COALESCE($1, section_name),
                 grade_level = COALESCE($2, grade_level),
                 staffing_mode = COALESCE($3, staffing_mode)
             WHERE section_id = $4
             RETURNING section_id, section_name, grade_level, staffing_mode`,
            [section_name, grade_level, staffing_mode, id]
        );

        await recordAuditLog({
            actorUserId: req.user.user_id,
            action: "update",
            entityType: "section",
            entityId: result.rows[0].section_id,
            beforeData: beforeResult.rows[0],
            afterData: result.rows[0],
        });

        res.json({
            message: "Section updated successfully.",
            section: result.rows[0]
        });
    } catch (error) {
        console.error("Update section error:", error);

        res.status(500).json({
            message: "Failed to update section."
        });
    }
};

// DELETE section
const deleteSection = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `DELETE FROM sections WHERE section_id = $1 RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Section not found."
            });
        }

        await recordAuditLog({
            actorUserId: req.user.user_id,
            action: "delete",
            entityType: "section",
            entityId: result.rows[0].section_id,
            beforeData: result.rows[0],
            afterData: null,
        });

        res.json({
            message: "Section deleted successfully.",
            section: result.rows[0]
        });
    } catch (error) {
        console.error("Delete section error:", error);

        res.status(500).json({
            message: "Failed to delete section."
        });
    }
};

module.exports = {
    getSections,
    createSection,
    updateSection,
    deleteSection,
    VALID_STAFFING_MODES
};
