const express = require("express");

const {
    getSchoolYears,
    getConsolidatedRecordsForSchoolYear,
    getConsolidatedRecordForStudent,
} = require("../controllers/consolidationController");

const {
    authenticateToken,
    authorizeRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();

// ==========================================
// ALL CONSOLIDATION ROUTES
// CLASS ADVISERS AND ADMINS ONLY
// ==========================================
// Per the SPMP, the Class Adviser reviews consolidated records before
// submission; the School Administrator oversees/approves them.

router.use(
    authenticateToken,
    authorizeRoles("adviser", "admin")
);

// ==========================================
// GET SCHOOL YEARS
// ==========================================

router.get(
    "/school-years",
    getSchoolYears
);

// ==========================================
// GET CONSOLIDATED RECORDS FOR A SCHOOL YEAR
// ==========================================

router.get(
    "/school-years/:schoolYearId",
    getConsolidatedRecordsForSchoolYear
);

// ==========================================
// GET ONE STUDENT'S CONSOLIDATED RECORD
// ==========================================

router.get(
    "/school-years/:schoolYearId/students/:lrn",
    getConsolidatedRecordForStudent
);

module.exports = router;
