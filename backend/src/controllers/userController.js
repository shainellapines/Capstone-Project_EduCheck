const bcrypt = require("bcryptjs");
const pool = require("../db");
const { recordAuditLog } = require("../utils/auditLog");

// Minimal complexity rule: 8+ characters, at least one letter and one
// number. Not a full policy (no symbol/case requirements) - just enough
// to rule out things like "12345678" or "password".
const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

const VALID_ROLES = ["admin", "principal", "adviser", "subject"];
const VALID_STATUSES = ["Active", "Inactive"];

const isActive = (status) => (status || "Active").toLowerCase() === "active";

// Rejects a role or status outside the fixed lists; null when both are fine
// (or not being set).
const invalidRoleOrStatus = ({ role, status }) => {
    if (role !== undefined && !VALID_ROLES.includes(role)) {
        return `Role must be one of: ${VALID_ROLES.join(", ")}.`;
    }
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
        return `Status must be one of: ${VALID_STATUSES.join(", ")}.`;
    }
    return null;
};

// Would this change leave the school with no active Administrator? Then
// nobody could manage accounts again without database access.
const removesLastActiveAdmin = async (target, nextRole, nextStatus) => {
    if (target.role !== "admin" || !isActive(target.status)) return false;
    if (nextRole === "admin" && isActive(nextStatus)) return false;

    const others = await pool.query(
        `SELECT COUNT(*) FROM users
         WHERE role = 'admin' AND user_id <> $1 AND LOWER(COALESCE(status, 'Active')) = 'active'`,
        [target.user_id]
    );
    return Number(others.rows[0].count) === 0;
};

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

        const invalid = invalidRoleOrStatus({ role, status });

        if (invalid) {
            return res.status(400).json({ message: invalid });
        }

        if (!PASSWORD_RULE.test(password)) {
            return res.status(400).json({
                message: "Password must be at least 8 characters and include both a letter and a number."
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

        const invalid = invalidRoleOrStatus({ role: role ?? undefined, status: status ?? undefined });

        if (invalid) {
            return res.status(400).json({ message: invalid });
        }

        const existing = await pool.query(`SELECT user_id, role, status FROM users WHERE user_id = $1`, [id]);

        if (existing.rows.length === 0) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        const target = existing.rows[0];
        const nextRole = role ?? target.role;
        const nextStatus = status ?? target.status;
        const isSelf = target.user_id === req.user.user_id;

        if (isSelf && (nextRole !== target.role || !isActive(nextStatus))) {
            return res.status(409).json({
                message: "You cannot change your own role or deactivate your own account. Ask another Administrator."
            });
        }

        if (await removesLastActiveAdmin(target, nextRole, nextStatus)) {
            return res.status(409).json({
                message: "This is the only active Administrator account. Create or activate another Administrator first."
            });
        }

        // The Class Adviser slot needs an Adviser account (see
        // assignmentController), so a role change may not strand one.
        if (target.role === "adviser" && nextRole !== "adviser") {
            const adviserSlots = await pool.query(
                `
                SELECT sec.section_name, sy.school_year
                FROM teacher_assignments ta
                INNER JOIN teachers t ON t.teacher_id = ta.teacher_id
                INNER JOIN sections sec ON sec.section_id = ta.section_id
                INNER JOIN school_years sy ON sy.school_year_id = ta.school_year_id
                WHERE t.user_id = $1 AND ta.subject_id IS NULL
                ORDER BY sy.school_year, sec.section_name
                `,
                [target.user_id]
            );

            if (adviserSlots.rows.length > 0) {
                const held = adviserSlots.rows.map((row) => `${row.section_name} (${row.school_year})`);
                return res.status(409).json({
                    message:
                        `This account is the Class Adviser of ${held.join(", ")}. ` +
                        "Remove those Class Adviser assignments before changing its role."
                });
            }
        }

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
        if (error.code === "23505") {
            return res.status(409).json({
                message: "Username or email already exists."
            });
        }

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

        const existing = await pool.query(`SELECT user_id, role, status FROM users WHERE user_id = $1`, [id]);

        if (existing.rows.length === 0) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        if (existing.rows[0].user_id === req.user.user_id) {
            return res.status(409).json({
                message: "You cannot delete your own account. Ask another Administrator."
            });
        }

        if (await removesLastActiveAdmin(existing.rows[0], null, null)) {
            return res.status(409).json({
                message: "This is the only active Administrator account. Create or activate another Administrator first."
            });
        }

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

// RESET another account's password (Admin only)
// The fix when a teacher forgets the password, or when an account still has
// the one the Administrator set. The user changes it afterwards in Settings.
// The password itself is never logged, only that a reset happened.
const resetUserPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { new_password } = req.body;

        if (!new_password || !PASSWORD_RULE.test(new_password)) {
            return res.status(400).json({
                message: "Password must be at least 8 characters and include both a letter and a number."
            });
        }

        const existing = await pool.query(`SELECT user_id, username FROM users WHERE user_id = $1`, [id]);

        if (existing.rows.length === 0) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        const target = existing.rows[0];

        if (target.user_id === req.user.user_id) {
            return res.status(409).json({
                message: "Change your own password in Settings, where your current password is checked."
            });
        }

        const passwordHash = await bcrypt.hash(new_password, 10);

        await pool.query(`UPDATE users SET password_hash = $1 WHERE user_id = $2`, [passwordHash, target.user_id]);

        await recordAuditLog({
            actorUserId: req.user.user_id,
            action: "update",
            entityType: "user",
            entityId: target.user_id,
            beforeData: null,
            afterData: { username: target.username, password_reset: true },
        });

        res.json({ message: `Password reset for ${target.username}.` });
    } catch (error) {
        console.error("Reset password error:", error);

        res.status(500).json({
            message: "Failed to reset the password."
        });
    }
};

module.exports = {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    searchUsers,
    resetUserPassword
};