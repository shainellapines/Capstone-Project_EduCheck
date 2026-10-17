const bcrypt = require("bcryptjs");
const pool = require("../db");
const { recordAuditLog } = require("../utils/auditLog");
const {
    PENDING_APPROVAL,
    REJECTED,
    ROLE_LABELS,
    grantsMoreAccess,
    hasActivePrincipal,
    notifyActiveRole,
    findAdviserSlots,
    adviserSlotMessage,
} = require("../utils/accountApproval");

// Minimal complexity rule: 8+ characters, at least one letter and one
// number. Not a full policy (no symbol/case requirements) - just enough
// to rule out things like "12345678" or "password".
const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

const VALID_ROLES = ["admin", "principal", "adviser", "subject"];
const VALID_STATUSES = ["Active", "Inactive"];

const isActive = (status) => (status || "Active").toLowerCase() === "active";

// Subject Teachers and Class Advisers need a teacher profile (name and
// employee number) to be assigned to sections; Admin and Principal do not.
const TEACHER_ROLES = ["subject", "adviser"];

// Accounts use the person's real DepEd address, so notices reach them.
const DEPED_EMAIL = /^[^\s@]+@deped\.gov\.ph$/i;
const DEPED_EMAIL_MESSAGE = "Use the person's DepEd email address (ending in @deped.gov.ph).";

// One row per account with its teacher profile, if it has one.
const ACCOUNT_SELECT = `
    SELECT u.user_id, u.username, u.email, u.role, u.status, u.created_at,
           u.pending_role, u.approval_remarks, u.reviewed_at,
           t.teacher_id, t.first_name, t.last_name, t.employee_number, t.contact_number
    FROM users u
    LEFT JOIN teachers t ON t.user_id = u.user_id
`;

const PROFILE_FIELDS = ["first_name", "last_name", "employee_number", "contact_number"];

// The teacher profile fields sent with an account, trimmed; null when the
// request sent none of them (the profile is then left as it is).
const readProfile = (body) => {
    if (!PROFILE_FIELDS.some((field) => body[field] !== undefined)) return null;

    const value = (field) => (typeof body[field] === "string" ? body[field].trim() : "");
    return {
        first_name: value("first_name"),
        last_name: value("last_name"),
        employee_number: value("employee_number"),
        contact_number: value("contact_number") || null,
    };
};

const missingProfileMessage = (profile) =>
    !profile || !profile.first_name || !profile.last_name || !profile.employee_number
        ? "A Subject Teacher or Class Adviser needs a first name, last name, and employee number."
        : null;

// Creates the profile, or updates the one the account already has.
const saveProfile = (client, userId, profile) =>
    client.query(
        `
        INSERT INTO teachers (user_id, employee_number, first_name, last_name, contact_number)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (user_id) DO UPDATE SET
            employee_number = EXCLUDED.employee_number,
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            contact_number = EXCLUDED.contact_number
        `,
        [userId, profile.employee_number, profile.first_name, profile.last_name, profile.contact_number]
    );

const duplicateMessage = (error) =>
    error.constraint && error.constraint.includes("employee_number")
        ? "That employee number is already used by another teacher."
        : "Username or email already exists.";

const loadAccount = async (userId) =>
    (await pool.query(`${ACCOUNT_SELECT} WHERE u.user_id = $1`, [userId])).rows[0];

const accountLabel = (account) =>
    account.first_name ? `${account.first_name} ${account.last_name}` : account.username;

// What the audit log keeps of an account: never the password.
const auditView = (account) => ({
    username: account.username,
    role: account.role,
    status: account.status,
    pending_role: account.pending_role || null,
});

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
        const result = await pool.query(`${ACCOUNT_SELECT} ORDER BY u.user_id`);

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

        const account = await loadAccount(id);

        if (!account) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        res.json(account);
    } catch (error) {
        console.error("Get user error:", error);

        res.status(500).json({
            message: "Failed to retrieve user."
        });
    }
};

// CREATE user
// The account and, for a Subject Teacher or Class Adviser, the teacher
// profile are saved together: either both exist afterwards or neither does.
const createUser = async (req, res) => {
    const client = await pool.connect();

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

        if (!DEPED_EMAIL.test(email.trim())) {
            return res.status(400).json({ message: DEPED_EMAIL_MESSAGE });
        }

        if (!PASSWORD_RULE.test(password)) {
            return res.status(400).json({
                message: "Password must be at least 8 characters and include both a letter and a number."
            });
        }

        const profile = TEACHER_ROLES.includes(role) ? readProfile(req.body) : null;

        if (TEACHER_ROLES.includes(role)) {
            const missing = missingProfileMessage(profile);
            if (missing) return res.status(400).json({ message: missing });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        // New accounts wait for the Principal unless there is none yet.
        const needsApproval = await hasActivePrincipal();
        const initialStatus = needsApproval ? PENDING_APPROVAL : status;

        await client.query("BEGIN");

        const result = await client.query(
            `INSERT INTO users
                (username, password_hash, email, role, status)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING user_id`,
            [username.trim(), passwordHash, email.trim(), role, initialStatus]
        );
        const userId = result.rows[0].user_id;

        if (profile) await saveProfile(client, userId, profile);

        await client.query("COMMIT");

        const account = await loadAccount(userId);

        await recordAuditLog({
            actorUserId: req.user.user_id,
            action: "create",
            entityType: "user",
            entityId: userId,
            beforeData: null,
            afterData: auditView(account),
        });

        if (needsApproval) {
            await notifyActiveRole(
                "principal",
                "Account Awaiting Approval",
                `A new ${ROLE_LABELS[role]} account for ${accountLabel(account)} is waiting for your approval.`
            );
        }

        res.status(201).json({
            message: needsApproval
                ? "Account created and sent to the Principal for approval. It can be used once approved."
                : "Account created successfully.",
            user: account
        });
    } catch (error) {
        await client.query("ROLLBACK").catch(() => {});

        if (error.code === "23505") {
            return res.status(409).json({ message: duplicateMessage(error) });
        }

        console.error("Create user error:", error);

        res.status(500).json({
            message: "Failed to create user."
        });
    } finally {
        client.release();
    }
};

// UPDATE user
// A role change that gives more access waits for the Principal: the account
// keeps its current role and the requested one is held in pending_role.
// Removing access (a lower role, Inactive) applies at once.
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

        const existing = await pool.query(
            `SELECT user_id, username, email, role, status, pending_role FROM users WHERE user_id = $1`,
            [id]
        );

        if (existing.rows.length === 0) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        const target = existing.rows[0];
        const nextRole = role ?? target.role;
        const awaitingApproval = [PENDING_APPROVAL, REJECTED].includes(target.status);

        // Only the Principal's approval makes a new account active.
        if (awaitingApproval && status && status !== target.status) {
            return res.status(409).json({
                message: "This account has not been approved yet. The Principal approves it first."
            });
        }

        // Accounts made before this rule keep their address until it is changed.
        if (email && email.trim() !== target.email && !DEPED_EMAIL.test(email.trim())) {
            return res.status(400).json({ message: DEPED_EMAIL_MESSAGE });
        }

        const profile = TEACHER_ROLES.includes(nextRole) ? readProfile(req.body) : null;

        if (profile) {
            const missing = missingProfileMessage(profile);
            if (missing) return res.status(400).json({ message: missing });
        }

        const nextStatus = awaitingApproval ? target.status : status ?? target.status;
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
            const held = await findAdviserSlots(target.user_id);

            if (held.length > 0) {
                return res.status(409).json({ message: adviserSlotMessage(held) });
            }
        }

        const roleChanged = nextRole !== target.role;
        // A new account is still waiting anyway, so its role just changes.
        const roleNeedsApproval =
            roleChanged && !awaitingApproval && grantsMoreAccess(target.role, nextRole) && (await hasActivePrincipal());
        const appliedRole = roleNeedsApproval ? target.role : nextRole;
        const pendingRole = roleNeedsApproval ? nextRole : roleChanged ? null : target.pending_role;
        // Correcting a rejected account sends it back to the Principal.
        const resubmitted = target.status === REJECTED;
        const appliedStatus = resubmitted ? PENDING_APPROVAL : nextStatus;

        // Account and profile change together, as when they are created.
        const client = await pool.connect();

        try {
            await client.query("BEGIN");

            await client.query(
                `UPDATE users
                 SET username = COALESCE($1, username),
                     email = COALESCE($2, email),
                     role = $3,
                     status = $4,
                     pending_role = $5,
                     approval_remarks = CASE WHEN $6 THEN NULL ELSE approval_remarks END
                 WHERE user_id = $7`,
                [
                    username ? username.trim() : username,
                    email ? email.trim() : email,
                    appliedRole,
                    appliedStatus,
                    pendingRole,
                    resubmitted || roleNeedsApproval,
                    id
                ]
            );

            if (profile) await saveProfile(client, target.user_id, profile);

            await client.query("COMMIT");
        } catch (error) {
            await client.query("ROLLBACK").catch(() => {});
            throw error;
        } finally {
            client.release();
        }

        const account = await loadAccount(target.user_id);

        await recordAuditLog({
            actorUserId: req.user.user_id,
            action: "update",
            entityType: "user",
            entityId: target.user_id,
            beforeData: auditView(target),
            afterData: auditView(account),
        });

        if (roleNeedsApproval) {
            await notifyActiveRole(
                "principal",
                "Account Awaiting Approval",
                `${accountLabel(account)}'s role change from ${ROLE_LABELS[target.role]} to ` +
                    `${ROLE_LABELS[nextRole]} is waiting for your approval.`
            );
        } else if (resubmitted) {
            await notifyActiveRole(
                "principal",
                "Account Awaiting Approval",
                `${accountLabel(account)}'s account was corrected and sent back for your approval.`
            );
        }

        res.json({
            message: roleNeedsApproval
                ? `Saved. The change to ${ROLE_LABELS[nextRole]} needs the Principal's approval; ` +
                  "the account keeps its current role until then."
                : resubmitted
                ? "Saved and sent back to the Principal for approval."
                : "Account updated successfully.",
            user: account
        });
    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({ message: duplicateMessage(error) });
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
            `${ACCOUNT_SELECT}
             WHERE u.username ILIKE $1
                OR u.email ILIKE $1
                OR u.role ILIKE $1
                OR t.first_name ILIKE $1
                OR t.last_name ILIKE $1
                OR t.employee_number ILIKE $1
             ORDER BY u.user_id`,
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