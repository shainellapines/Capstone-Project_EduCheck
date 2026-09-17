import { useEffect, useState } from "react";
import {
    Bell,
    CheckCircle,
    XCircle,
    Loader2,
    AlertTriangle,
    CheckCheck,
} from "lucide-react";

import "./Dashboard.css";
import "./Notifications.css";
import Sidebar from "../components/Sidebar";

const API_URL = "http://localhost:5000/api";

// Icon/tone per notification title. The backend only ever creates two
// kinds of notification today — "Submission Approved" and "Submission
// Rejected" (see submissionController.js's decideSubmission) — so those
// are the only ones mapped by name. Anything else (a future notification
// type) falls through to a neutral bell rather than guessing at a look
// for content that doesn't exist yet.
const NOTIFICATION_VISUALS = {
    "Submission Approved": { icon: CheckCircle, tone: "green" },
    "Submission Rejected": { icon: XCircle, tone: "red" },
};

const DEFAULT_VISUAL = { icon: Bell, tone: "blue" };

function getNotificationVisual(title) {
    return NOTIFICATION_VISUALS[title] || DEFAULT_VISUAL;
}

function formatTimestamp(isoString) {
    return new Date(isoString).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    });
}

function Notifications() {
    const [notifications, setNotifications] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const authHeaders = () => {
        const token = localStorage.getItem("educheck_token");

        if (!token) {
            throw new Error("Authentication token not found. Please log in again.");
        }

        return { Authorization: `Bearer ${token}` };
    };

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(`${API_URL}/notifications`, {
                headers: authHeaders(),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to load notifications.");
            }

            setNotifications(data.notifications || []);
            setUnreadCount(data.unread_count || 0);
        } catch (fetchError) {
            setError(fetchError.message || "Failed to load notifications.");
            setNotifications(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const markOneRead = async (notificationId) => {
        setNotifications((previous) =>
            previous.map((n) =>
                n.notification_id === notificationId ? { ...n, status: "Read" } : n
            )
        );
        setUnreadCount((previous) => Math.max(0, previous - 1));

        try {
            await fetch(`${API_URL}/notifications/${notificationId}/read`, {
                method: "POST",
                headers: authHeaders(),
            });
        } catch {
            // Best-effort — a stale unread badge is not worth surfacing an
            // error for.
        }
    };

    const markAllRead = async () => {
        setNotifications((previous) => previous.map((n) => ({ ...n, status: "Read" })));
        setUnreadCount(0);

        try {
            await fetch(`${API_URL}/notifications/read-all`, {
                method: "POST",
                headers: authHeaders(),
            });
        } catch {
            // Best-effort, same as above.
        }
    };

    return (
        <div className="dashboard-layout">

            <Sidebar activeKey="notifications" />

            <main className="dashboard-main">

                <header className="dashboard-header">
                    <div>
                        <h1>Notifications</h1>
                        <p>Stay updated with your record submissions</p>
                    </div>

                    <div className="notif-header-status">
                        <Bell size={16} />
                        {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
                    </div>
                </header>

                <section className="dashboard-content">

                    {error && (
                        <div className="error-banner">
                            <AlertTriangle size={20} />
                            <span>{error}</span>
                        </div>
                    )}

                    {loading && (
                        <div className="loading-state">
                            <Loader2 size={20} className="spin-icon" />
                            Loading notifications...
                        </div>
                    )}

                    {!loading && notifications && notifications.length > 0 && (
                        <div className="notif-toolbar">
                            <button
                                type="button"
                                className="notif-mark-all"
                                onClick={markAllRead}
                                disabled={unreadCount === 0}
                            >
                                <CheckCheck size={16} />
                                Mark all read
                            </button>
                        </div>
                    )}

                    {!loading && notifications && notifications.length === 0 && (
                        <div className="content-card empty-state-card">
                            <Bell size={20} />
                            No notifications yet — you'll see submission decisions here
                            as they happen.
                        </div>
                    )}

                    {!loading &&
                        notifications &&
                        notifications.map((notification) => {
                            const { icon: Icon, tone } = getNotificationVisual(notification.title);
                            const isUnread = notification.status === "Unread";

                            return (
                                <button
                                    type="button"
                                    key={notification.notification_id}
                                    className={isUnread ? "notif-card unread" : "notif-card"}
                                    onClick={() => isUnread && markOneRead(notification.notification_id)}
                                >
                                    <div className={`notif-icon ${tone}`}>
                                        <Icon size={20} />
                                    </div>

                                    <div className="notif-body">
                                        <div className="notif-title">{notification.title}</div>
                                        <p className="notif-message">{notification.message}</p>
                                        <div className="notif-timestamp">
                                            {formatTimestamp(notification.created_at)}
                                        </div>
                                    </div>

                                    {isUnread && <span className="notif-unread-dot" />}
                                </button>
                            );
                        })}

                </section>

            </main>

        </div>
    );
}

export default Notifications;
