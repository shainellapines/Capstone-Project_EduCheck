import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    Users,
    FileText,
    Upload,
    BarChart3,
    ClipboardCheck,
    Database,
    Bell,
    Settings,
    LogOut,
    UserCheck,
    PieChart,
    Eye,
    History,
    PanelLeftClose,
    PanelLeftOpen,
} from "lucide-react";

import "../styles/Dashboard.css";
import logo from "../assets/educheck-logo.png";
import logoOnDark from "../assets/educheck-logo-white.png";
import { getStoredUser, getToken, clearSession } from "../utils/session";
import { useCanUpload } from "../utils/uploadAccess";
import { isSidebarCollapsed, setSidebarCollapsed } from "../utils/sidebar";
import { API_URL } from "../config";

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
        // For an Adviser of a Self-Contained section, or one assigned their
        // own subjects in a Departmentalized section. Hidden by useCanUpload
        // when the Adviser has no upload options.
        { key: "upload-files", label: "Upload Files", icon: Upload, path: "/class-record-upload", uploadOnly: true },
        { key: "consolidated-records", label: "Consolidated Records", icon: FileText, path: "/consolidated-records" },
        { key: "section-progress", label: "Section Progress", icon: PieChart, path: "/section-progress" },
        { key: "records-repository", label: "Records & SF10", icon: Database, path: "/records-repository" },
        { key: "analytics", label: "Performance Analytics", icon: BarChart3, path: "/analytics" },
    ],
    admin: [
        { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
        { key: "accounts", label: "Accounts", icon: Users, path: "/accounts" },
        { key: "section-assignments", label: "Section & Teacher Assignments", icon: UserCheck, path: "/section-assignments" },
        { key: "audit-log", label: "Audit Log", icon: History, path: "/audit-log" },
        { key: "consolidated-records", label: "Submission Review", icon: ClipboardCheck, path: "/consolidated-records" },
        { key: "section-progress", label: "Section Progress", icon: PieChart, path: "/section-progress" },
        { key: "records-repository", label: "Records & SF10", icon: Database, path: "/records-repository" },
        { key: "analytics", label: "Academic Analytics", icon: BarChart3, path: "/analytics" },
    ],
    subject: [
        { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
        { key: "upload-record", label: "Upload e-Class Record", icon: Upload, path: "/class-record-upload" },
    ],
    // SPMP v1.0 US-008: view-only. Every path below lands on a page that
    // is already read-only for any role but adviser/admin (ConsolidatedRecords'
    // approve/reject/request-revision actions, RecordsRepository's search-only
    // UI) — no separate "principal mode" needed on those pages themselves.
    principal: [
        { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
        { key: "consolidated-records", label: "Submission Review", icon: Eye, path: "/consolidated-records" },
        { key: "account-approvals", label: "Account Approvals", icon: UserCheck, path: "/account-approvals" },
        { key: "section-progress", label: "Section Progress", icon: PieChart, path: "/section-progress" },
        { key: "analytics", label: "Academic Analytics", icon: BarChart3, path: "/analytics" },
        { key: "records-repository", label: "Records & SF10", icon: Database, path: "/records-repository" },
    ],
};

const ROLE_BADGE_LABEL = {
    adviser: "Adviser",
    admin: "School Administrator",
    subject: "Subject Teacher",
    principal: "Principal",
};

// `activeKey` is one of the `key` values above — the page rendering the
// shell says which nav item represents it, rather than the sidebar trying
// to infer that from the current URL (several keys, like
// "consolidated-records", are reachable from more than one role's menu
// under different labels, so a path-based guess would be ambiguous).
function Sidebar({ activeKey }) {
    const navigate = useNavigate();
    const user = getStoredUser() || { username: "", role: "adviser" };

    const canUpload = useCanUpload();
    const navItems = (NAV_ITEMS_BY_ROLE[user.role] || []).filter(
        (item) => !item.uploadOnly || canUpload
    );

    const [unreadCount, setUnreadCount] = useState(0);
    const [collapsed, setCollapsed] = useState(isSidebarCollapsed);

    const toggleCollapsed = () => {
        setSidebarCollapsed(!collapsed);
        setCollapsed(!collapsed);
    };

    // Collapsed, the labels are hidden, so each item carries its name as a
    // hover tooltip instead. Expanded, the tooltip would just repeat the label.
    const tip = (label) => (collapsed ? label : undefined);

    useEffect(() => {
        const token = getToken();
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
        clearSession();

        window.location.href = "/";
    };

    return (
        <aside className="sidebar">

            <div className="sidebar-brand">
                {/* Navy mark on the light theme, white mark on the dark one */}
                <img className="brand-logo brand-logo-light" src={logo} alt="" width="40" height="40" />
                <img className="brand-logo brand-logo-dark" src={logoOnDark} alt="" width="40" height="40" />

                <div className="brand-text">
                    <h2>EduCheck</h2>
                    <span>Academic Records</span>
                </div>

                <button
                    type="button"
                    className="sidebar-toggle"
                    onClick={toggleCollapsed}
                    aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    aria-expanded={!collapsed}
                    title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
                </button>
            </div>

            <div
                className={`role-badge role-badge-${user.role}`}
                title={tip(ROLE_BADGE_LABEL[user.role] || user.role)}
            >
                <Users size={16} />
                <span className="nav-label">{ROLE_BADGE_LABEL[user.role] || user.role}</span>
            </div>

            <nav className="sidebar-nav">

                {navItems.map(({ key, label, icon: Icon, path }) => (
                    <a
                        key={key}
                        className={key === activeKey ? "nav-item active" : "nav-item"}
                        onClick={path ? () => navigate(path) : undefined}
                        style={{ cursor: path ? "pointer" : "default" }}
                        title={tip(label)}
                        aria-label={label}
                    >
                        <Icon size={19} />
                        <span className="nav-label">{label}</span>
                    </a>
                ))}

                <a
                    className={activeKey === "notifications" ? "nav-item active" : "nav-item"}
                    onClick={() => navigate("/notifications")}
                    style={{ cursor: "pointer" }}
                    title={tip("Notifications")}
                    aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
                >
                    <Bell size={19} />
                    <span className="nav-label">Notifications</span>
                    {unreadCount > 0 && (
                        <span className="notification-badge">{unreadCount}</span>
                    )}
                </a>

            </nav>

            <div className="sidebar-bottom">

                <a
                    className={activeKey === "settings" ? "nav-item active" : "nav-item"}
                    onClick={() => navigate("/settings")}
                    style={{ cursor: "pointer" }}
                    title={tip("Settings")}
                    aria-label="Settings"
                >
                    <Settings size={19} />
                    <span className="nav-label">Settings</span>
                </a>

                <button
                    className="nav-item logout-button"
                    onClick={handleLogout}
                    title={tip("Logout")}
                    aria-label="Logout"
                >
                    <LogOut size={19} />
                    <span className="nav-label">Logout</span>
                </button>

            </div>

        </aside>
    );
}

export default Sidebar;
