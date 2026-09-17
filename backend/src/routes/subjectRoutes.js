const express = require("express");

const { getSubjects } = require("../controllers/subjectController");
const { authenticateToken } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authenticateToken, getSubjects);

module.exports = router;
