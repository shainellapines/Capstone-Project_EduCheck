import {
    LayoutDashboard,
    Users,
    UserCog,
    ClipboardCheck,
    Database,
    BarChart3,
    Bell,
    Settings,
    LogOut,
    AlertTriangle,
    CheckCircle,
    Clock,
} from "lucide-react";

import "./Dashboard.css";

function AdminDashboard() {
    const storedUser = localStorage.getItem("educheck_user");

    const user = storedUser
        ? JSON.parse(storedUser)
        : {
              username: "admin.educheck",
              role: "admin",
          };

    const handleLogout = () => {
        localStorage.removeItem("educheck_token");
        localStorage.removeItem("educheck_user");

        window.location.href = "/";
    };

    return (
        <div className="dashboard-layout">

            {/* SIDEBAR */}
            <aside className="sidebar">

                <div className="sidebar-brand">
                    <div className="brand-logo">
                        🎓
                    </div>

                    <div>
                        <h2>EduCheck</h2>
                        <span>Academic Records</span>
                    </div>
                </div>

                <div className="role-badge">
                    <Users size={16} />
                    School Administrator
                </div>

                <nav className="sidebar-nav">

                    <a className="nav-item active">
                        <LayoutDashboard size={19} />
                        Dashboard
                    </a>

                    <a
                        className="nav-item"
                        href="/users"
                    >
                        <Users size={19} />
                        User Management
                    </a>

                    <a
                        className="nav-item"
                        href="/teachers"
                    >
                        <UserCog size={19} />
                        Teacher Management
                    </a>

                    <a className="nav-item">
                        <ClipboardCheck size={19} />
                        Submission Review
                    </a>

                    <a className="nav-item">
                        <Database size={19} />
                        Digital Repository
                    </a>

                    <a className="nav-item">
                        <BarChart3 size={19} />
                        Academic Analytics
                    </a>

                    <a className="nav-item">
                        <Bell size={19} />
                        Notifications
                        <span className="notification-badge">2</span>
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

            {/* MAIN CONTENT */}
            <main className="dashboard-main">

                {/* HEADER */}
                <header className="dashboard-header">

                    <div>
                        <h1>
                            Welcome, School Administrator
                        </h1>

                        <p>
                            EduCheck System Administration
                        </p>
                    </div>

                    <div className="school-year">
                        School Year:
                        <strong>2025-2026</strong>
                    </div>

                </header>

                <section className="dashboard-content">

                    <div className="section-heading">
                        <h2>Administration Overview</h2>

                        <p>
                            Monitor users, submissions, records, and
                            academic system activity
                        </p>
                    </div>

                    {/* OVERVIEW CARDS */}
                    <div className="overview-grid">

                        <div className="overview-card">
                            <div>
                                <span>Total Users</span>
                                <strong>2</strong>
                            </div>

                            <div className="card-icon blue">
                                <Users size={23} />
                            </div>
                        </div>

                        <div className="overview-card">
                            <div>
                                <span>Pending Submissions</span>
                                <strong>1</strong>
                            </div>

                            <div className="card-icon green">
                                <Clock size={23} />
                            </div>
                        </div>

                        <div className="overview-card">
                            <div>
                                <span>Approved Records</span>
                                <strong className="purple-text">
                                    1
                                </strong>
                            </div>

                            <div className="card-icon purple">
                                <CheckCircle size={23} />
                            </div>
                        </div>

                        <div className="overview-card">
                            <div>
                                <span>Needs Attention</span>
                                <strong className="red-text">
                                    0
                                </strong>
                            </div>

                            <div className="card-icon red">
                                <AlertTriangle size={23} />
                            </div>
                        </div>

                    </div>

                    {/* SUBMISSION SUMMARY */}
                    <div className="content-card">

                        <div className="card-header">
                            <div>
                                <h3>
                                    Submission Overview
                                </h3>
                            </div>
                        </div>

                        <div className="student-summary-grid">

                            <div className="summary-item blue-summary">
                                <Clock size={20} />

                                <div>
                                    <span>
                                        Pending Review
                                    </span>

                                    <strong>1</strong>
                                </div>
                            </div>

                            <div className="summary-item green-summary">
                                <CheckCircle size={20} />

                                <div>
                                    <span>
                                        Approved
                                    </span>

                                    <strong>1</strong>
                                </div>
                            </div>

                            <div className="summary-item yellow-summary">
                                <ClipboardCheck size={20} />

                                <div>
                                    <span>
                                        For Revision
                                    </span>

                                    <strong>0</strong>
                                </div>
                            </div>

                            <div className="summary-item red-summary">
                                <AlertTriangle size={20} />

                                <div>
                                    <span>
                                        Validation Issues
                                    </span>

                                    <strong>0</strong>
                                </div>
                            </div>

                        </div>

                    </div>

                    {/* ATTENTION */}
                    <div className="attention-card">

                        <div className="attention-content">

                            <AlertTriangle size={24} />

                            <div>
                                <h3>
                                    Records Requiring Attention
                                </h3>

                                <p>
                                    Review pending submissions and
                                    validation issues.
                                </p>

                                <div className="class-alert">
                                    <strong>
                                        Grade 6 - Sampaguita
                                    </strong>

                                    <span>
                                        1 Pending Review
                                    </span>
                                </div>
                            </div>

                        </div>

                        <button>
                            Review Submissions
                        </button>

                    </div>

                    {/* RECENT SUBMISSIONS */}
                    <div className="content-card">

                        <div className="card-header">
                            <h3>
                                Recent Submissions
                            </h3>

                            <button className="text-button">
                                View All
                            </button>
                        </div>

                        <div className="record-row">

                            <div>
                                <strong>
                                    Grade 6 - Sampaguita
                                </strong>

                                <span>
                                    2nd Quarter • 2025-2026
                                </span>
                            </div>

                            <span className="status-badge submitted">
                                Approved
                            </span>

                        </div>

                        <div className="record-row">

                            <div>
                                <strong>
                                    Grade 6 - Sampaguita
                                </strong>

                                <span>
                                    3rd Quarter • 2025-2026
                                </span>
                            </div>

                            <span className="status-badge draft">
                                Pending Review
                            </span>

                        </div>

                    </div>

                    {/* QUICK ACTIONS */}
                    <div className="content-card">

                        <div className="card-header">
                            <h3>Quick Actions</h3>
                        </div>

                        <div className="quick-actions">

                            <button
                                className="quick-action blue-action"
                                onClick={() =>
                                    (window.location.href = "/users")
                                }
                            >
                                <Users size={24} />

                                <strong>
                                    User Management
                                </strong>

                                <span>
                                    Manage EduCheck user accounts
                                </span>
                            </button>

                            <button className="quick-action purple-action">
                                <UserCog size={24} />

                                <strong>
                                    Teacher Management
                                </strong>

                                <span>
                                    Manage teacher information
                                </span>
                            </button>

                            <button className="quick-action green-action">
                                <ClipboardCheck size={24} />

                                <strong>
                                    Review Submissions
                                </strong>

                                <span>
                                    Review records awaiting approval
                                </span>
                            </button>

                            <button className="quick-action orange-action">
                                <BarChart3 size={24} />

                                <strong>
                                    Academic Analytics
                                </strong>

                                <span>
                                    View academic and submission reports
                                </span>
                            </button>

                        </div>

                    </div>

                </section>

            </main>

        </div>
    );
}

export default AdminDashboard;