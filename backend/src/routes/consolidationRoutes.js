const express = require("express");

const {
    getSchoolYears,
    getConsolidatedRecordsForSchoolYear,
    getConsolidatedRecordForStudent,
    getSectionProgressForSchoolYear,
    requestRevision,
} = require("../controllers/consolidationController");

const {
    authenticateToken,
    authorizeRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();

// ==========================================
// ALL CONSOLIDATION ROUTES
// CLASS ADVISERS, ADMINS, AND (READ-ONLY) PRINCIPALS
// ==========================================
// Per the SPMP, the Class Adviser reviews consolidated records before
// submission; the School Administrator oversees/approves them. The
// Principal (US-008) gets the same read access — every route below is a
// GET except request-revision, which layers its own authorizeRoles("adviser")
// on top and stays off-limits to admin and principal alike.

router.use(
    authenticateToken,
    authorizeRoles("adviser", "admin", "principal")
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

// ==========================================
// GET SECTION PROGRESS FOR A SCHOOL YEAR
// ==========================================
// Section-level consolidation view (SPMP v1.0) — per-section learning-area
// submission progress, not one student's grades.

router.get(
    "/school-years/:schoolYearId/sections",
    getSectionProgressForSchoolYear
);

// ==========================================
// REQUEST REVISION ON A CLASS RECORD
// CLASS ADVISER ONLY (US-006)
// ==========================================

router.post(
    "/class-records/:classRecordId/request-revision",
    authorizeRoles("adviser"),
    requestRevision
);

module.exports = router;
