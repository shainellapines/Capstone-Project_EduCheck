const express = require("express");

const {
    getMyNotifications,
    markNotificationRead,
    markAllNotificationsRead,
} = require("../controllers/notificationController");

const { authenticateToken } = require("../middleware/authMiddleware");

const router = express.Router();

// Any authenticated role reads/manages only their own notifications —
// no role restriction needed beyond being logged in.
router.use(authenticateToken);

router.get("/", getMyNotifications);

router.post("/read-all", markAllNotificationsRead);

router.post("/:notificationId/read", markNotificationRead);

module.exports = router;
