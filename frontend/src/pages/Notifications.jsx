import { useEffect, useMemo, useState } from "react";
import {
    Bell,
    CheckCircle,
    XCircle,
    Loader2,
    AlertTriangle,
    CheckCheck,
    Undo2,
    RefreshCcw,
} from "lucide-react";

import "./Dashboard.css";
import "./Notifications.css";
import Sidebar from "../components/Sidebar";
import { API_URL } from "../config";


// Icon/tone/category per notification title. Four titles actually exist
// across the backend (grep-confirmed against submissionController.js and
// consolidationController.js's requestRevision) — "Submission Approved"
// and "Submission Rejected" aren't the only two. Anything not in this map
// (a future notification type) falls through to a neutral bell/"other"
// category rather than guessing at a look for content that doesn't exist
// yet.
const NOTIFICATION_VISUALS = {
    "Submission Approved": { icon: CheckCircle, tone: "green", category: "approved" },
    "Submission Rejected": { icon: XCircle, tone: "red", category: "rejected" },
    "Revision Requested": { icon: Undo2, tone: "purple", category: "revisions" },
    "Approved Record Needs Amendment": { icon: RefreshCcw, tone: "purple", category: "revisions" },
};

const DEFAULT_VISUAL = { icon: Bell, tone: "blue", category: "other" };

function getNotificationVisual(title) {
    return NOTIFICATION_VISUALS[title] || DEFAULT_VISUAL;
}

const FILTERS = [
    { key: "all", label: "All" },
    { key: "unread", label: "Unread" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
    { key: "revisions", label: "Revisions" },
];

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
    const [activeFilter, setActiveFilter] = useState("all");

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

    const filterCounts = useMemo(() => {
        const counts = { all: 0, unread: 0, approved: 0, rejected: 0, revisions: 0 };

        (notifications || []).forEach((notification) => {
            counts.all += 1;
            if (notification.status === "Unread") counts.unread += 1;

            const { category } = getNotificationVisual(notification.title);
            if (category in counts) counts[category] += 1;
        });

        return counts;
    }, [notifications]);

    const visibleNotifications = useMemo(() => {
        if (!notifications) return [];
        if (activeFilter === "all") return notifications;
        if (activeFilter === "unread") return notifications.filter((n) => n.status === "Unread");

        return notifications.filter((n) => getNotificationVisual(n.title).category === activeFilter);
    }, [notifications, activeFilter]);

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
                            <div className="notif-filters">
                                {FILTERS.map((filter) => (
                                    <button
                                        type="button"
                                        key={filter.key}
                                        className={
                                            activeFilter === filter.key
                                                ? "notif-filter-pill active"
                                                : "notif-filter-pill"
                                        }
                                        onClick={() => setActiveFilter(filter.key)}
                                    >
                                        {filter.label}
                                        <span className="notif-filter-count">
                                            {filterCounts[filter.key]}
                                        </span>
                                    </button>
                                ))}
                            </div>

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

                    {!loading && notifications && notifications.length > 0 && visibleNotifications.length === 0 && (
                        <div className="content-card empty-state-card">
                            <Bell size={20} />
                            No notifications in this category.
                        </div>
                    )}

                    {!loading &&
                        notifications &&
                        visibleNotifications.map((notification) => {
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
