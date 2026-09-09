const pool = require("../db");

// GET all subjects (the full official DepEd list - see migration 004).
// Used by the assignment admin UI to build its subject picker; the
// upload page itself uses the assignment-scoped list in
// uploadController.getUploadOptions instead, not this.
const getSubjects = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT subject_id, subject_name, grade_level
            FROM subjects
            ORDER BY grade_level, subject_name
        `);

        res.json(result.rows);
    } catch (error) {
        console.error("Get subjects error:", error);

        res.status(500).json({
            message: "Failed to retrieve subjects."
        });
    }
};

module.exports = {
    getSubjects
};
