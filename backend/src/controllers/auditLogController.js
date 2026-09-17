const pool = require("../db");

const VALID_ENTITY_TYPES = ["section", "teacher_assignment"];

// ==========================================
// LIST AUDIT LOG ENTRIES (Admin only)
// ==========================================
// SPMP Risk Management §11 — read side of the audit_logs table sections/
// assignmentController write to (see utils/auditLog.js). Most-recent-first,
// optionally narrowed to one entity_type. Same "flat LIMIT + truncated
// flag" shape as repositoryController.searchStudents rather than real
// pagination — there's no cursor-based listing anywhere else in this app
// either, and an audit trail for two admin-only mutation surfaces isn't
// expected to grow past a few hundred rows in this deployment's lifetime.
const getAuditLogs = async (req, res) => {
    try {
        const entityType =
            typeof req.query.entity_type === "string" && req.query.entity_type.trim() !== ""
                ? req.query.entity_type.trim()
                : null;

        if (entityType && !VALID_ENTITY_TYPES.includes(entityType)) {
            return res.status(400).json({
                message: `entity_type must be one of: ${VALID_ENTITY_TYPES.join(", ")}.`,
            });
        }

        const result = await pool.query(
            `
            SELECT
                al.audit_log_id,
                al.actor_user_id,
                u.username AS actor_username,
                al.action,
                al.entity_type,
                al.entity_id,
                al.before_data,
                al.after_data,
                al.created_at
            FROM audit_logs al
            INNER JOIN users u ON u.user_id = al.actor_user_id
            WHERE $1::varchar IS NULL OR al.entity_type = $1
            ORDER BY al.created_at DESC, al.audit_log_id DESC
            LIMIT 200
            `,
            [entityType]
        );

        return res.json({
            logs: result.rows,
            result_count: result.rows.length,
            truncated: result.rows.length === 200,
        });
    } catch (error) {
        console.error("Get audit logs error:", error);

        return res.status(500).json({ message: "Failed to retrieve audit logs." });
    }
};

module.exports = { getAuditLogs };
