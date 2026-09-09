const express = require("express");

const {
    getSections,
    createSection,
    updateSection,
    deleteSection
} = require("../controllers/sectionController");

const {
    authenticateToken,
    authorizeRoles
} = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticateToken);

// Any authenticated role can read the section list (advisers/subject
// teachers need it to make sense of their own assignments); only
// administrators can create/edit/delete sections.
router.get("/", getSections);

router.post("/", authorizeRoles("admin"), createSection);
router.put("/:id", authorizeRoles("admin"), updateSection);
router.delete("/:id", authorizeRoles("admin"), deleteSection);

module.exports = router;
