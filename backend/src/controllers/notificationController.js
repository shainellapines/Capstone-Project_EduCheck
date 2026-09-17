const pool = require("../db");

// ==========================================
// GET MY NOTIFICATIONS
// ==========================================

const getMyNotifications = async (req, res) => {
    try {
        const result = await pool.query(
            `
            SELECT notification_id, title, message, status, created_at
            FROM notifications
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT 50
            `,
            [req.user.user_id]
        );

        const unreadCount = result.rows.filter((row) => row.status === "Unread").length;

        return res.json({
            notifications: result.rows,
            unread_count: unreadCount,
        });
    } catch (error) {
        console.error("Get notifications error:", error);

        return res.status(500).json({ message: "Failed to retrieve notifications." });
    }
};

// ==========================================
// MARK ONE NOTIFICATION READ
// ==========================================

const markNotificationRead = async (req, res) => {
    try {
        const notificationId = Number(req.params.notificationId);

        if (!Number.isInteger(notificationId) || notificationId <= 0) {
            return res.status(400).json({ message: "A valid notification ID is required." });
        }

        const result = await pool.query(
            `
            UPDATE notifications
            SET status = 'Read'
            WHERE notification_id = $1 AND user_id = $2
            RETURNING notification_id
            `,
            [notificationId, req.user.user_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Notification not found." });
        }

        return res.json({ message: "Notification marked as read." });
    } catch (error) {
        console.error("Mark notification read error:", error);

        return res.status(500).json({ message: "Failed to update the notification." });
    }
};

// ==========================================
// MARK ALL NOTIFICATIONS READ
// ==========================================

const markAllNotificationsRead = async (req, res) => {
    try {
        await pool.query(
            "UPDATE notifications SET status = 'Read' WHERE user_id = $1 AND status = 'Unread'",
            [req.user.user_id]
        );

        return res.json({ message: "All notifications marked as read." });
    } catch (error) {
        console.error("Mark all notifications read error:", error);

        return res.status(500).json({ message: "Failed to update notifications." });
    }
};

module.exports = {
    getMyNotifications,
    markNotificationRead,
    markAllNotificationsRead,
};
