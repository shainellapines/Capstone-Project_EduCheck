const express = require("express");

const {
    submitForApproval,
    submitAllEligible,
    approveSubmission,
    rejectSubmission,
} = require("../controllers/submissionController");

const {
    authenticateToken,
    authorizeRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticateToken);

// ==========================================
// CLASS ADVISER: SUBMIT FOR APPROVAL
// ==========================================

router.post(
    "/school-years/:schoolYearId/students/:lrn/submit",
    authorizeRoles("adviser"),
    submitForApproval
);

router.post(
    "/school-years/:schoolYearId/submit-all",
    authorizeRoles("adviser"),
    submitAllEligible
);

// ==========================================
// SCHOOL ADMINISTRATOR: APPROVE / REJECT
// ==========================================

router.post(
    "/school-years/:schoolYearId/students/:lrn/approve",
    authorizeRoles("admin"),
    approveSubmission
);

router.post(
    "/school-years/:schoolYearId/students/:lrn/reject",
    authorizeRoles("admin"),
    rejectSubmission
);

module.exports = router;
