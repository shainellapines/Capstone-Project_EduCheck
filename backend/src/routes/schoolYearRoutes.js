const express = require("express");

const {
    listSchoolYears,
    createSchoolYear,
    activateSchoolYear,
} = require("../controllers/schoolYearController");

const {
    authenticateToken,
    authorizeRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();

// Opening a school year and choosing the current one are Administrator
// settings (SPMP §6.2: "configure school and SF10 settings").
router.use(authenticateToken, authorizeRoles("admin"));

router.get("/", listSchoolYears);
router.post("/", createSchoolYear);
router.patch("/:schoolYearId/activate", activateSchoolYear);

module.exports = router;
