const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db");

// Same minimal complexity rule userController.js uses for admin-created/
// edited accounts - kept in sync so a self-service change can't set a
// weaker password than an admin-issued one would be allowed to.
const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

// Names live on the teacher profile (teachers table), which the Admin
// manages in Accounts. Admin and Principal accounts have no
// teacher profile, so they have no name and the UI shows the username.
const getTeacherProfile = async (userId) => {
    const result = await pool.query(
        `SELECT teacher_id, first_name, last_name, employee_number, contact_number
         FROM teachers
         WHERE user_id = $1`,
        [userId]
    );

    return result.rows[0] ?? null;
};

const fullNameOf = (profile) => (profile ? `${profile.first_name} ${profile.last_name}`.trim() : null);

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
            `SELECT user_id, username, password_hash, email, role, status, must_change_password
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

        // Checked after the password, so a wrong guess never reveals
        // whether an account exists or what state it is in.
        const status = (user.status || "Active").toLowerCase();

        if (status !== "active") {
            const message =
                status === "pending approval"
                    ? "Your account is waiting for the Principal's approval. You can sign in once it is approved."
                    : status === "rejected"
                    ? "Your account was not approved. Please contact your School Administrator."
                    : status === "awaiting setup"
                    ? "Your account was approved and is being set up. Your School Administrator will send your password."
                    : "This account is inactive.";

            return res.status(403).json({ message });
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

        const profile = await getTeacherProfile(user.user_id);

        res.json({
            message: "Login successful.",
            token,
            user: {
                user_id: user.user_id,
                username: user.username,
                email: user.email,
                role: user.role,
                full_name: fullNameOf(profile),
                // A temporary password from setup or a reset: the apps send
                // the user to replace it before anything else.
                must_change_password: user.must_change_password
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
            `SELECT user_id, username, email, role, status, created_at, must_change_password
             FROM users
             WHERE user_id = $1`,
            [req.user.user_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Account not found.",
            });
        }

        const profile = await getTeacherProfile(req.user.user_id);

        // The user's own sections/subjects, newest school year first. A null
        // subject is the Class Adviser assignment for the whole section.
        const assignments = profile
            ? (
                  await pool.query(
                      `
                      SELECT
                          ta.assignment_id,
                          sy.school_year,
                          sy.status AS school_year_status,
                          sec.section_name,
                          sec.grade_level,
                          sec.staffing_mode,
                          sub.subject_name
                      FROM teacher_assignments ta
                      INNER JOIN sections sec ON sec.section_id = ta.section_id
                      INNER JOIN school_years sy ON sy.school_year_id = ta.school_year_id
                      LEFT JOIN subjects sub ON sub.subject_id = ta.subject_id
                      WHERE ta.teacher_id = $1
                      ORDER BY sy.school_year DESC, sec.grade_level, sec.section_name, sub.subject_name NULLS FIRST
                      `,
                      [profile.teacher_id]
                  )
              ).rows
            : [];

        res.json({
            user: {
                ...result.rows[0],
                full_name: fullNameOf(profile),
            },
            profile: profile && {
                first_name: profile.first_name,
                last_name: profile.last_name,
                employee_number: profile.employee_number,
                contact_number: profile.contact_number,
            },
            assignments,
        });
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

        // 400, not 401: the apps treat 401 as an expired session and sign
        // the user out, which a typo in this field should not do.
        if (!currentMatch) {
            return res.status(400).json({
                message: "Current password is incorrect.",
            });
        }

        // Keeping the emailed temporary password would defeat the change.
        if (await bcrypt.compare(new_password, result.rows[0].password_hash)) {
            return res.status(400).json({
                message: "Choose a new password that is different from your current one.",
            });
        }

        const newHash = await bcrypt.hash(new_password, 10);

        await pool.query(
            `UPDATE users SET password_hash = $1, must_change_password = FALSE WHERE user_id = $2`,
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