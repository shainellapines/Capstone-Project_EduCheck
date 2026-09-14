const pool = require("../db");

// Shared write helper for the audit_logs table (SPMP Risk Management §11).
// Deliberately generic across entity types rather than one call site per
// table — sectionController and assignmentController both call this the
// same way. Not wrapped in its own try/catch: it runs inside the same
// try/catch as the mutation it's logging, same as how a notification
// insert already rides along an action elsewhere in this codebase (e.g.
// consolidationController.requestRevision) — a failed audit write fails
// the request rather than silently going unrecorded.
const recordAuditLog = async ({ actorUserId, action, entityType, entityId, beforeData, afterData }) => {
    await pool.query(
        `
        INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, before_data, after_data)
        VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [
            actorUserId,
            action,
            entityType,
            entityId,
            beforeData ? JSON.stringify(beforeData) : null,
            afterData ? JSON.stringify(afterData) : null,
        ]
    );
};

module.exports = { recordAuditLog };
