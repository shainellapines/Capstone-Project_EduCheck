import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    GraduationCap,
    LayoutDashboard,
    Users,
    UserCog,
    FileText,
    Upload,
    BarChart3,
    CheckCircle,
    ClipboardCheck,
    Send,
    Database,
    Bell,
    Settings,
    LogOut,
} from "lucide-react";

import "../pages/Dashboard.css";

const API_URL = "http://localhost:5000/api";
const POLL_INTERVAL_MS = 30000;

// Single source of truth for sidebar navigation, keyed by role. All three
// role pages used to define this same nav list inline, independently —
// the exact pattern that produced the dead "Digital Repository" /
// "Notifications" nav items earlier sessions found and fixed one at a
// time. Keeping it in one place means a page added or renamed here can't
// drift out of sync between roles again.
const NAV_ITEMS_BY_ROLE = {
    adviser: [
        { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
        { key: "encode-grades", label: "Encode Grades", icon: FileText, path: null },
        { key: "upload-files", label: "Upload Files", icon: Upload, path: null },
        { key: "consolidated-records", label: "Consolidated Records", icon: FileText, path: "/consolidated-records" },
        { key: "records-repository", label: "Records Repository", icon: Database, path: "/records-repository" },
        { key: "performance-analytics", label: "Performance Analytics", icon: BarChart3, path: null },
        { key: "validation-results", label: "Validation Results", icon: CheckCircle, path: null },
        { key: "submission-workflow", label: "Submission Workflow", icon: Send, path: null },
    ],
    admin: [
        { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
        { key: "user-management", label: "User Management", icon: Users, path: "/users" },
        { key: "teacher-management", label: "Teacher Management", icon: UserCog, path: "/teachers" },
        { key: "consolidated-records", label: "Submission Review", icon: ClipboardCheck, path: "/consolidated-records" },
        { key: "records-repository", label: "Digital Repository", icon: Database, path: "/records-repository" },
        { key: "academic-analytics", label: "Academic Analytics", icon: BarChart3, path: null },
    ],
    subject: [
        { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
        { key: "upload-record", label: "Upload e-Class Record", icon: Upload, path: "/class-record-upload" },
        { key: "validation-results", label: "Validation Results", icon: CheckCircle, path: null },
        { key: "submission-status", label: "Submission Status", icon: Send, path: null },
    ],
};

const ROLE_BADGE_LABEL = {
    adviser: "Adviser",
    admin: "School Administrator",
    subject: "Subject Teacher",
};

// `activeKey` is one of the `key` values above — the page rendering the
// shell says which nav item represents it, rather than the sidebar trying
// to infer that from the current URL (several keys, like
// "consolidated-records", are reachable from more than one role's menu
// under different labels, so a path-based guess would be ambiguous).
function Sidebar({ activeKey }) {
    const navigate = useNavigate();
    const storedUser = localStorage.getItem("educheck_user");
    const user = storedUser ? JSON.parse(storedUser) : { username: "", role: "adviser" };

    const navItems = NAV_ITEMS_BY_ROLE[user.role] || [];

    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const token = localStorage.getItem("educheck_token");
        if (!token) return;

        const fetchUnreadCount = async () => {
            try {
                const response = await fetch(`${API_URL}/notifications`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const data = await response.json();

                if (response.ok) {
                    setUnreadCount(data.unread_count || 0);
                }
            } catch {
                // Non-critical — the badge just stays at its last known
                // count rather than interrupting the rest of the shell.
            }
        };

        fetchUnreadCount();

        const interval = setInterval(fetchUnreadCount, POLL_INTERVAL_MS);
        return () => clearInterval(interval);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("educheck_token");
        localStorage.removeItem("educheck_user");

        window.location.href = "/";
    };

    return (
        <aside className="sidebar">

            <div className="sidebar-brand">
                <div className="brand-logo">
                    <GraduationCap size={28} color="#2447b8" strokeWidth={2.2} />
                </div>

                <div>
                    <h2>EduCheck</h2>
                    <span>Academic Records</span>
                </div>
            </div>

            <div className="role-badge">
                <Users size={16} />
                {ROLE_BADGE_LABEL[user.role] || user.role}
            </div>

            <nav className="sidebar-nav">

                {navItems.map(({ key, label, icon: Icon, path }) => (
                    <a
                        key={key}
                        className={key === activeKey ? "nav-item active" : "nav-item"}
                        onClick={path ? () => navigate(path) : undefined}
                        style={{ cursor: path ? "pointer" : "default" }}
                    >
                        <Icon size={19} />
                        {label}
                    </a>
                ))}

                <a
                    className={activeKey === "notifications" ? "nav-item active" : "nav-item"}
                    onClick={() => navigate("/notifications")}
                    style={{ cursor: "pointer" }}
                >
                    <Bell size={19} />
                    Notifications
                    {unreadCount > 0 && (
                        <span className="notification-badge">{unreadCount}</span>
                    )}
                </a>

            </nav>

            <div className="sidebar-bottom">

                <a className="nav-item">
                    <Settings size={19} />
                    Settings
                </a>

                <button
                    className="nav-item logout-button"
                    onClick={handleLogout}
                >
                    <LogOut size={19} />
                    Logout
                </button>

            </div>

        </aside>
    );
}

export default Sidebar;
