const express = require("express");

const {
    getAssignments,
    getMyAssignments,
    createAssignment,
    deleteAssignment
} = require("../controllers/assignmentController");

const {
    authenticateToken,
    authorizeRoles
} = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticateToken);

// A teacher/adviser checking their own assignments (drives the upload
// page's subject/section options) - any authenticated role.
router.get("/mine", getMyAssignments);

// Everything else (viewing/managing all assignments) is admin-only.
router.use(authorizeRoles("admin"));

router.get("/", getAssignments);
router.post("/", createAssignment);
router.delete("/:id", deleteAssignment);

module.exports = router;
