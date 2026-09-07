const express = require("express");

const { searchStudents } = require("../controllers/repositoryController");

const {
    authenticateToken,
    authorizeRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();

// Same access as /api/consolidation — this is a cross-year lookup layer
// in front of it, not a separate audience.
router.use(
    authenticateToken,
    authorizeRoles("adviser", "admin")
);

router.get("/search", searchStudents);

module.exports = router;
