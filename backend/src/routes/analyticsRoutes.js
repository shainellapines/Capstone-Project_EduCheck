const express = require("express");

const { getAnalyticsForSchoolYear } = require("../controllers/analyticsController");

const {
    authenticateToken,
    authorizeRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();

// Same read-only audience as /api/consolidation and /api/repository —
// Academic Analytics (Admin) and Performance Analytics (Adviser) are one
// shared page/endpoint behind two nav labels, Principal included.
router.use(
    authenticateToken,
    authorizeRoles("adviser", "admin", "principal")
);

router.get(
    "/school-years/:schoolYearId",
    getAnalyticsForSchoolYear
);

module.exports = router;
