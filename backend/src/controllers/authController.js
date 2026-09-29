const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db");

// Same minimal complexity rule userController.js uses for admin-created/
// edited accounts - kept in sync so a self-service change can't set a
// weaker password than an admin-issued one would be allowed to.
const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            return res.status(400).json({
                message: "Username and password are required."
            });
        }

        // Find user
        const result = await pool.query(
            `SELECT user_id, username, password_hash, email, role, status
             FROM users
             WHERE username = $1`,
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                message: "Invalid username or password."
            });
        }

        const user = result.rows[0];

        // Check account status
        if (user.status && user.status.toLowerCase() !== "active") {
            return res.status(403).json({
                message: "This account is inactive."
            });
        }

        // Verify password
        const passwordMatch = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid username or password."
            });
        }

        // Create JWT
        const token = jwt.sign(
            {
                user_id: user.user_id,
                username: user.username,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "8h"
            }
        );

        res.json({
            message: "Login successful.",
            token,
            user: {
                user_id: user.user_id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Login error:", error);

        res.status(500).json({
            message: "Server error during login."
        });
    }
};

// ==========================================
// GET MY OWN ACCOUNT INFO
// ==========================================
// The JWT already carries user_id/username/role, but not email/status/
// created_at - this is what the Settings page's Account section actually
// needs, without adding a general-purpose "get any user" route outside
// the existing admin-only /api/users.

const getMe = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT user_id, username, email, role, status, created_at
             FROM users
             WHERE user_id = $1`,
            [req.user.user_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Account not found.",
            });
        }

        res.json({ user: result.rows[0] });
    } catch (error) {
        console.error("Get me error:", error);

        res.status(500).json({
            message: "Failed to retrieve account information.",
        });
    }
};

// ==========================================
// CHANGE MY OWN PASSWORD
// ==========================================
// Self-service only - acts on req.user.user_id from the JWT, never a
// user_id in the request body, so this can never be used to change
// someone else's password. An Admin resetting another account's password
// is a separate, already-existing path (PUT /api/users/:id).

const changePassword = async (req, res) => {
    try {
        const { current_password, new_password } = req.body;

        if (!current_password || !new_password) {
            return res.status(400).json({
                message: "Current password and new password are required.",
            });
        }

        if (!PASSWORD_RULE.test(new_password)) {
            return res.status(400).json({
                message: "New password must be at least 8 characters and include a letter and a number.",
            });
        }

        const result = await pool.query(
            `SELECT password_hash FROM users WHERE user_id = $1`,
            [req.user.user_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Account not found.",
            });
        }

        const currentMatch = await bcrypt.compare(current_password, result.rows[0].password_hash);

        if (!currentMatch) {
            return res.status(401).json({
                message: "Current password is incorrect.",
            });
        }

        const newHash = await bcrypt.hash(new_password, 10);

        await pool.query(
            `UPDATE users SET password_hash = $1 WHERE user_id = $2`,
            [newHash, req.user.user_id]
        );

        res.json({ message: "Password updated successfully." });
    } catch (error) {
        console.error("Change password error:", error);

        res.status(500).json({
            message: "Failed to update password.",
        });
    }
};

module.exports = {
    login,
    getMe,
    changePassword
};