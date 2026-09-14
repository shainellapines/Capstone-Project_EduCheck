const express = require("express");

const { getAuditLogs } = require("../controllers/auditLogController");

const {
    authenticateToken,
    authorizeRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();

// Admin-only — same audience as the section/assignment mutation endpoints
// this log records (sectionRoutes, assignmentRoutes), not the
// adviser/admin/principal read audience the consolidation-side pages use.
router.use(
    authenticateToken,
    authorizeRoles("admin")
);

router.get("/", getAuditLogs);

module.exports = router;
