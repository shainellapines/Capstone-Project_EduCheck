const pool = require("../db");
const { recordAuditLog } = require("../utils/auditLog");
const {
    PENDING_APPROVAL,
    REJECTED,
    AWAITING_SETUP,
    ROLE_LABELS,
    notifyActiveRole,
    findAdviserSlots,
    adviserSlotMessage,
} = require("../utils/accountApproval");

// ==========================================
// PRINCIPAL APPROVAL OF ACCOUNTS (migration 010)
// ==========================================
// Two kinds of request reach the Principal: a new account (status
// 'Pending Approval', cannot sign in) and a role change that gives more
// access (pending_role set; the account keeps its current role meanwhile).
// The Administrator sees the same list read-only, to follow up.

const REQUEST_SELECT = `
    SELECT u.user_id, u.username, u.email, u.role, u.status, u.pending_role, u.created_at,
           t.first_name, t.last_name, t.employee_number
    FROM users u
    LEFT JOIN teachers t ON t.user_id = u.user_id
`;

const labelOf = (row) => (row.first_name ? `${row.first_name} ${row.last_name}` : row.username);

const requestTypeOf = (row) => (row.status === PENDING_APPROVAL ? "new_account" : "role_change");

const auditView = (row) => ({
    username: row.username,
    role: row.role,
    status: row.status,
    pending_role: row.pending_role || null,
});

const listApprovalRequests = async (req, res) => {
    try {
        const result = await pool.query(
            `${REQUEST_SELECT}
             WHERE u.status = $1 OR u.pending_role IS NOT NULL
             ORDER BY u.created_at, u.user_id`,
            [PENDING_APPROVAL]
        );

        return res.json({
            requests: result.rows.map((row) => ({ ...row, request_type: requestTypeOf(row) })),
        });
    } catch (error) {
        console.error("List account approvals error:", error);
        return res.status(500).json({ message: "Failed to load account approvals." });
    }
};

// Loads the request behind :id, or answers 404/409 and returns null.
const loadRequest = async (req, res) => {
    const userId = Number(req.params.id);

    if (!Number.isInteger(userId) || userId <= 0) {
        res.status(400).json({ message: "A valid account ID is required." });
        return null;
    }

    const result = await pool.query(`${REQUEST_SELECT} WHERE u.user_id = $1`, [userId]);
    const row = result.rows[0];

    if (!row) {
        res.status(404).json({ message: "Account not found." });
        return null;
    }

    if (row.status !== PENDING_APPROVAL && !row.pending_role) {
        res.status(409).json({ message: "This account has nothing waiting for approval." });
        return null;
    }

    // Nobody approves a change to their own access.
    if (row.user_id === req.user.user_id) {
        res.status(409).json({ message: "You cannot approve a change to your own account." });
        return null;
    }

    return row;
};

const approveAccount = async (req, res) => {
    try {
        const row = await loadRequest(req, res);
        if (!row) return;

        const type = requestTypeOf(row);

        // The Class Adviser slot may have been given after the request.
        if (type === "role_change" && row.role === "adviser" && row.pending_role !== "adviser") {
            const held = await findAdviserSlots(row.user_id);
            if (held.length > 0) return res.status(409).json({ message: adviserSlotMessage(held) });
        }

        const result = await pool.query(
            `
            UPDATE users
            SET status = CASE WHEN status = $2 THEN $4 ELSE status END,
                role = COALESCE(pending_role, role),
                pending_role = NULL,
                approval_remarks = NULL,
                reviewed_by = $3,
                reviewed_at = NOW()
            WHERE user_id = $1 AND (status = $2 OR pending_role IS NOT NULL)
            RETURNING user_id, username, role, status, pending_role
            `,
            [row.user_id, PENDING_APPROVAL, req.user.user_id, AWAITING_SETUP]
        );

        // Decided by someone else in the meantime.
        if (result.rows.length === 0) {
            return res.status(409).json({ message: "This account has nothing waiting for approval." });
        }

        await recordAuditLog({
            actorUserId: req.user.user_id,
            action: "update",
            entityType: "user",
            entityId: row.user_id,
            beforeData: auditView(row),
            afterData: { ...auditView(result.rows[0]), approved: true },
        });

        const label = labelOf(row);
        await notifyActiveRole(
            "admin",
            "Account Approved",
            type === "new_account"
                ? `The Principal approved ${label}'s ${ROLE_LABELS[row.role]} account. Finish its setup in Accounts: ` +
                  "give the employee number and a temporary password."
                : `The Principal approved ${label}'s role change to ${ROLE_LABELS[row.pending_role]}.`
        );

        return res.json({
            message: type === "new_account" ? `${label}'s account was approved.` : `${label}'s role change was approved.`,
        });
    } catch (error) {
        console.error("Approve account error:", error);
        return res.status(500).json({ message: "Failed to approve the account." });
    }
};

const rejectAccount = async (req, res) => {
    try {
        const remarks = typeof req.body?.remarks === "string" ? req.body.remarks.trim() : "";

        if (!remarks) {
            return res.status(400).json({ message: "A reason is required so the Administrator knows what to correct." });
        }

        const row = await loadRequest(req, res);
        if (!row) return;

        const type = requestTypeOf(row);

        // A new account becomes Rejected (it still cannot sign in); a role
        // change is dropped and the account keeps the role it has.
        const result = await pool.query(
            `
            UPDATE users
            SET status = CASE WHEN status = $2 THEN $3 ELSE status END,
                pending_role = NULL,
                approval_remarks = $4,
                reviewed_by = $5,
                reviewed_at = NOW()
            WHERE user_id = $1 AND (status = $2 OR pending_role IS NOT NULL)
            RETURNING user_id, username, role, status, pending_role
            `,
            [row.user_id, PENDING_APPROVAL, REJECTED, remarks, req.user.user_id]
        );

        if (result.rows.length === 0) {
            return res.status(409).json({ message: "This account has nothing waiting for approval." });
        }

        await recordAuditLog({
            actorUserId: req.user.user_id,
            action: "update",
            entityType: "user",
            entityId: row.user_id,
            beforeData: auditView(row),
            afterData: { ...auditView(result.rows[0]), approved: false, remarks },
        });

        const label = labelOf(row);
        await notifyActiveRole(
            "admin",
            "Account Not Approved",
            type === "new_account"
                ? `The Principal did not approve ${label}'s account. Reason: ${remarks} Correct it in Accounts to send it back.`
                : `The Principal did not approve ${label}'s role change to ${ROLE_LABELS[row.pending_role]}. Reason: ${remarks}`
        );

        return res.json({
            message: type === "new_account" ? `${label}'s account was not approved.` : `${label}'s role change was not approved.`,
        });
    } catch (error) {
        console.error("Reject account error:", error);
        return res.status(500).json({ message: "Failed to reject the account." });
    }
};

module.exports = { listApprovalRequests, approveAccount, rejectAccount };
