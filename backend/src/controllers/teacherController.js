const pool = require("../db");

// GET all teachers
const getTeachers = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                t.teacher_id,
                t.user_id,
                t.employee_number,
                t.first_name,
                t.last_name,
                t.contact_number,
                u.username,
                u.email,
                u.role,
                u.status
            FROM teachers t
            INNER JOIN users u
                ON t.user_id = u.user_id
            ORDER BY t.teacher_id
        `);

        res.json(result.rows);
    } catch (error) {
        console.error("Get teachers error:", error);

        res.status(500).json({
            message: "Failed to retrieve teachers."
        });
    }
};


// GET teacher by ID
const getTeacherById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            SELECT
                t.teacher_id,
                t.user_id,
                t.employee_number,
                t.first_name,
                t.last_name,
                t.contact_number,
                u.username,
                u.email,
                u.role,
                u.status
            FROM teachers t
            INNER JOIN users u
                ON t.user_id = u.user_id
            WHERE t.teacher_id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Teacher not found."
            });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Get teacher error:", error);

        res.status(500).json({
            message: "Failed to retrieve teacher."
        });
    }
};


// CREATE teacher
const createTeacher = async (req, res) => {
    try {
        const {
            user_id,
            employee_number,
            first_name,
            last_name,
            contact_number
        } = req.body;

        if (
            !user_id ||
            !employee_number ||
            !first_name ||
            !last_name
        ) {
            return res.status(400).json({
                message:
                    "user_id, employee_number, first_name, and last_name are required."
            });
        }

        // Verify that the user exists
        const userResult = await pool.query(
            `SELECT user_id
             FROM users
             WHERE user_id = $1`,
            [user_id]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                message: "Associated user account not found."
            });
        }

        // Prevent duplicate teacher profile for the same user
        const existingTeacher = await pool.query(
            `SELECT teacher_id
             FROM teachers
             WHERE user_id = $1
                OR employee_number = $2`,
            [user_id, employee_number]
        );

        if (existingTeacher.rows.length > 0) {
            return res.status(409).json({
                message:
                    "A teacher profile already exists for this user or employee number."
            });
        }

        const result = await pool.query(`
            INSERT INTO teachers
                (
                    user_id,
                    employee_number,
                    first_name,
                    last_name,
                    contact_number
                )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING
                teacher_id,
                user_id,
                employee_number,
                first_name,
                last_name,
                contact_number
        `, [
            user_id,
            employee_number,
            first_name,
            last_name,
            contact_number || null
        ]);

        res.status(201).json({
            message: "Teacher created successfully.",
            teacher: result.rows[0]
        });

    } catch (error) {
        console.error("Create teacher error:", error);

        res.status(500).json({
            message: "Failed to create teacher."
        });
    }
};


// UPDATE teacher
const updateTeacher = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            employee_number,
            first_name,
            last_name,
            contact_number
        } = req.body;

        const result = await pool.query(`
            UPDATE teachers
            SET
                employee_number = COALESCE($1, employee_number),
                first_name = COALESCE($2, first_name),
                last_name = COALESCE($3, last_name),
                contact_number = COALESCE($4, contact_number)
            WHERE teacher_id = $5
            RETURNING
                teacher_id,
                user_id,
                employee_number,
                first_name,
                last_name,
                contact_number
        `, [
            employee_number,
            first_name,
            last_name,
            contact_number,
            id
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Teacher not found."
            });
        }

        res.json({
            message: "Teacher updated successfully.",
            teacher: result.rows[0]
        });

    } catch (error) {
        console.error("Update teacher error:", error);

        res.status(500).json({
            message: "Failed to update teacher."
        });
    }
};


// DELETE teacher
const deleteTeacher = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            DELETE FROM teachers
            WHERE teacher_id = $1
            RETURNING teacher_id, user_id
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Teacher not found."
            });
        }

        res.json({
            message: "Teacher deleted successfully.",
            teacher: result.rows[0]
        });

    } catch (error) {
        console.error("Delete teacher error:", error);

        res.status(500).json({
            message: "Failed to delete teacher."
        });
    }
};


module.exports = {
    getTeachers,
    getTeacherById,
    createTeacher,
    updateTeacher,
    deleteTeacher
};