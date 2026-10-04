const express = require("express");

const {
    getSettings,
    updateSettings,
    getLearnerSf10,
    downloadLearnerSf10,
    updateLearnerProfile,
    upsertHistoricalRecord,
    deleteHistoricalRecord,
} = require("../controllers/sf10Controller");

const { authenticateToken, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

// SF10 is a permanent record: Admin, Principal (read-only) and Advisers
// (own learners - enforced per learner in sf10Controller). Subject
// Teachers never reach it.
router.use(authenticateToken, authorizeRoles("admin", "principal", "adviser"));

router.get("/settings", getSettings);
router.put("/settings", authorizeRoles("admin"), updateSettings);

router.get("/students/:lrn", getLearnerSf10);
router.get("/students/:lrn/download", authorizeRoles("admin", "adviser"), downloadLearnerSf10);
router.put("/students/:lrn/profile", authorizeRoles("admin", "adviser"), updateLearnerProfile);
router.put("/students/:lrn/history", authorizeRoles("admin", "adviser"), upsertHistoricalRecord);
router.delete("/students/:lrn/history/:recordId", authorizeRoles("admin", "adviser"), deleteHistoricalRecord);

module.exports = router;
