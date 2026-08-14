const bcrypt = require("bcryptjs");
const pool = require("../db");

// GET all users
const getUsers = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT user_id, username, email, role, status, created_at
             FROM users
             ORDER BY user_id`
        );

        res.json(result.rows);
    } catch (error) {
        console.error("Get users error:", error);

        res.status(500).json({
            message: "Failed to retrieve users."
        });
    }
};

// GET single user
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT user_id, username, email, role, status, created_at
             FROM users
             WHERE user_id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Get user error:", error);

        res.status(500).json({
            message: "Failed to retrieve user."
        });
    }
};

// CREATE user
const createUser = async (req, res) => {
    try {
        const {
            username,
            password,
            email,
            role,
            status = "Active"
        } = req.body;

        if (!username || !password || !email || !role) {
            return res.status(400).json({
                message: "Username, password, email, and role are required."
            });
        }

        const existingUser = await pool.query(
            `SELECT user_id
             FROM users
             WHERE username = $1 OR email = $2`,
            [username, email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                message: "Username or email already exists."
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `INSERT INTO users
                (username, password_hash, email, role, status)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING user_id, username, email, role, status, created_at`,
            [
                username,
                passwordHash,
                email,
                role,
                status
            ]
        );

        res.status(201).json({
            message: "User created successfully.",
            user: result.rows[0]
        });
    } catch (error) {
        console.error("Create user error:", error);

        res.status(500).json({
            message: "Failed to create user."
        });
    }
};

// UPDATE user
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            username,
            email,
            role,
            status
        } = req.body;

        const result = await pool.query(
            `UPDATE users
             SET username = COALESCE($1, username),
                 email = COALESCE($2, email),
                 role = COALESCE($3, role),
                 status = COALESCE($4, status)
             WHERE user_id = $5
             RETURNING user_id, username, email, role, status, created_at`,
            [
                username,
                email,
                role,
                status,
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        res.json({
            message: "User updated successfully.",
            user: result.rows[0]
        });
    } catch (error) {
        console.error("Update user error:", error);

        res.status(500).json({
            message: "Failed to update user."
        });
    }
};

// DELETE user
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `DELETE FROM users
             WHERE user_id = $1
             RETURNING user_id, username`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        res.json({
            message: "User deleted successfully.",
            user: result.rows[0]
        });
    } catch (error) {
        console.error("Delete user error:", error);

        res.status(500).json({
            message: "Failed to delete user."
        });
    }
};

// SEARCH users
const searchUsers = async (req, res) => {
    try {
        const { q = "" } = req.query;

        const result = await pool.query(
            `SELECT user_id, username, email, role, status, created_at
             FROM users
             WHERE username ILIKE $1
                OR email ILIKE $1
                OR role ILIKE $1
             ORDER BY user_id`,
            [`%${q}%`]
        );

        res.json(result.rows);
    } catch (error) {
        console.error("Search users error:", error);

        res.status(500).json({
            message: "Failed to search users."
        });
    }
};

module.exports = {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    searchUsers
};