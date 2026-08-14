import {
    LayoutDashboard,
    Users,
    FileText,
    Upload,
    BarChart3,
    CheckCircle,
    Send,
    Bell,
    Settings,
    LogOut,
    AlertTriangle,
    Clock,
} from "lucide-react";

import "./Dashboard.css";

function Dashboard() {
    const storedUser = localStorage.getItem("educheck_user");
    const user = storedUser
        ? JSON.parse(storedUser)
        : {
              username: "adviser.grade6a",
              role: "adviser",
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
                    Adviser
                </div>

                <nav className="sidebar-nav">

                    <a className="nav-item active">
                        <LayoutDashboard size={19} />
                        Dashboard
                    </a>

                    <a className="nav-item">
                        <FileText size={19} />
                        Encode Grades
                    </a>

                    <a className="nav-item">
                        <Upload size={19} />
                        Upload Files
                    </a>

                    <a className="nav-item">
                        <FileText size={19} />
                        Consolidated Records
                    </a>

                    <a className="nav-item">
                        <BarChart3 size={19} />
                        Performance Analytics
                    </a>

                    <a className="nav-item">
                        <CheckCircle size={19} />
                        Validation Results
                    </a>

                    <a className="nav-item">
                        <Send size={19} />
                        Submission Workflow
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
                            Welcome, Maria Santos
                        </h1>

                        <p>
                            Adviser (Homeroom Teacher)
                            <span> • </span>
                            Class: Grade 6 - Sampaguita
                        </p>
                    </div>

                    <div className="school-year">
                        School Year:
                        <strong>2025-2026</strong>
                    </div>

                </header>

                <section className="dashboard-content">

                    <div className="section-heading">
                        <h2>Dashboard Overview</h2>
                        <p>
                            Track your academic records and student performance
                        </p>
                    </div>

                    {/* OVERVIEW CARDS */}
                    <div className="overview-grid">

                        <div className="overview-card">
                            <div>
                                <span>Pending Validation</span>
                                <strong>1</strong>
                            </div>

                            <div className="card-icon blue">
                                <FileText size={23} />
                            </div>
                        </div>

                        <div className="overview-card">
                            <div>
                                <span>Ready to Submit</span>
                                <strong className="green-text">0</strong>
                            </div>

                            <div className="card-icon green">
                                <CheckCircle size={23} />
                            </div>
                        </div>

                        <div className="overview-card">
                            <div>
                                <span>Submitted</span>
                                <strong className="purple-text">1</strong>
                            </div>

                            <div className="card-icon purple">
                                <Send size={23} />
                            </div>
                        </div>

                        <div className="overview-card">
                            <div>
                                <span>Needs Attention</span>
                                <strong className="red-text">0</strong>
                            </div>

                            <div className="card-icon red">
                                <AlertTriangle size={23} />
                            </div>
                        </div>

                    </div>

                    {/* STUDENT SUMMARY */}
                    <div className="content-card">

                        <div className="card-header">
                            <div>
                                <h3>Student Performance Summary</h3>
                            </div>
                        </div>

                        <div className="student-summary-grid">

                            <div className="summary-item blue-summary">
                                <FileText size={20} />
                                <div>
                                    <span>Total Students</span>
                                    <strong>3</strong>
                                </div>
                            </div>

                            <div className="summary-item green-summary">
                                <CheckCircle size={20} />
                                <div>
                                    <span>On Track</span>
                                    <strong>1</strong>
                                </div>
                            </div>

                            <div className="summary-item yellow-summary">
                                <AlertTriangle size={20} />
                                <div>
                                    <span>At Risk</span>
                                    <strong>1</strong>
                                </div>
                            </div>

                            <div className="summary-item red-summary">
                                <AlertTriangle size={20} />
                                <div>
                                    <span>Needs Intervention</span>
                                    <strong>1</strong>
                                </div>
                            </div>

                        </div>

                    </div>

                    {/* INTERVENTION */}
                    <div className="attention-card">

                        <div className="attention-content">

                            <AlertTriangle size={24} />

                            <div>
                                <h3>
                                    Students Needing Intervention
                                </h3>

                                <p>
                                    2 students across 1 class require attention
                                </p>

                                <div className="class-alert">
                                    <strong>
                                        Grade 6 - Sampaguita
                                    </strong>

                                    <span>
                                        1 At Risk
                                    </span>

                                    <span>
                                        1 Needs Intervention
                                    </span>
                                </div>
                            </div>

                        </div>

                        <button>
                            View Details
                        </button>

                    </div>

                    {/* RECENT RECORDS */}
                    <div className="content-card">

                        <div className="card-header">
                            <h3>Recent Records</h3>

                            <button className="text-button">
                                View All Records
                            </button>
                        </div>

                        <div className="record-row">

                            <div>
                                <strong>
                                    Grade 6 - Sampaguita
                                </strong>

                                <span>
                                    3rd Quarter • 2025-2026 • 0 students
                                </span>
                            </div>

                            <span className="status-badge draft">
                                Draft
                            </span>

                        </div>

                        <div className="record-row">

                            <div>
                                <strong>
                                    Grade 6 - Sampaguita
                                </strong>

                                <span>
                                    2nd Quarter • 2025-2026 • 3 students
                                </span>
                            </div>

                            <span className="status-badge submitted">
                                Submitted
                            </span>

                        </div>

                    </div>

                    {/* QUICK ACTIONS */}
                    <div className="content-card">

                        <div className="card-header">
                            <h3>Quick Actions</h3>
                        </div>

                        <div className="quick-actions">

                            <button className="quick-action blue-action">
                                <FileText size={24} />
                                <strong>Encode Grades</strong>
                                <span>
                                    Input student grades by section
                                </span>
                            </button>

                            <button className="quick-action purple-action">
                                <Upload size={24} />
                                <strong>Upload Files</strong>
                                <span>
                                    Import subject grade files
                                </span>
                            </button>

                            <button className="quick-action green-action">
                                <FileText size={24} />
                                <strong>Consolidated Records</strong>
                                <span>
                                    View student academic records
                                </span>
                            </button>

                            <button className="quick-action orange-action">
                                <BarChart3 size={24} />
                                <strong>Performance Analytics</strong>
                                <span>
                                    View student performance
                                </span>
                            </button>

                        </div>

                    </div>

                </section>

            </main>

        </div>
    );
}

export default Dashboard;