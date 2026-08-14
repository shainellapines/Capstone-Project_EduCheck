const express = require("express");

const {
    getTeachers,
    getTeacherById,
    createTeacher,
    updateTeacher,
    deleteTeacher
} = require("../controllers/teacherController");

const {
    authenticateToken,
    authorizeRoles
} = require("../middleware/authMiddleware");

const router = express.Router();

// Teacher management is restricted to administrators
router.use(
    authenticateToken,
    authorizeRoles("admin")
);

router.get("/", getTeachers);

router.get("/:id", getTeacherById);

router.post("/", createTeacher);

router.put("/:id", updateTeacher);

router.delete("/:id", deleteTeacher);

module.exports = router;