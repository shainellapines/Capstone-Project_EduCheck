import { useEffect, useState } from "react";

import {
    LayoutDashboard,
    Upload,
    CheckCircle,
    Send,
    Bell,
    Settings,
    LogOut,
    FileText,
    AlertTriangle,
    Clock,
} from "lucide-react";

import "./Dashboard.css";

function SubjectDashboard() {

    const API_URL = "http://localhost:5000/api";

    const [records, setRecords] = useState([]);
    const [recordsLoading, setRecordsLoading] = useState(true);
    const [recordsError, setRecordsError] = useState("");

    const [summary, setSummary] = useState({
        total_uploaded: 0,
        pending_validation: 0,
        validated: 0,
        needs_attention: 0,
    });

    const [summaryLoading, setSummaryLoading] =
        useState(true);

    const [summaryError, setSummaryError] =
        useState("");


    const storedUser = localStorage.getItem("educheck_user");

    const user = storedUser
        ? JSON.parse(storedUser)
        : {
            username: "subject.grade6a",
            role: "subject",
        };

    const fetchMyRecords = async () => {
        try {
            setRecordsLoading(true);
            setRecordsError("");

            const token =
                localStorage.getItem("educheck_token");

            if (!token) {
                throw new Error(
                    "Authentication token not found."
                );
            }

            const response = await fetch(
                `${API_URL}/uploads/my-records`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Failed to retrieve class records."
                );
            }

            setRecords(
                data.records || []
            );

            console.log(
                "My class records:",
                data.records
            );

        } catch (error) {
            console.error(
                "Fetch class records error:",
                error
            );

            setRecordsError(
                error.message
            );

        } finally {
            setRecordsLoading(false);
        }
    };

    const fetchMyRecordSummary = async () => {
        try {
            setSummaryLoading(true);
            setSummaryError("");

            const token =
                localStorage.getItem("educheck_token");

            if (!token) {
                throw new Error(
                    "Authentication token not found."
                );
            }

            const response = await fetch(
                `${API_URL}/uploads/my-records/summary`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            console.log(
                "Dashboard summary:",
                data
            );

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Failed to retrieve record summary."
                );
            }

            setSummary(data);

        } catch (error) {
            console.error(
                "Fetch record summary error:",
                error
            );

            setSummaryError(
                error.message
            );

        } finally {
            setSummaryLoading(false);
        }
    };

    useEffect(() => {
        fetchMyRecords();
        fetchMyRecordSummary();
    }, []);

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
                    <Upload size={16} />
                    Subject Teacher
                </div>

                <nav className="sidebar-nav">

                    <a className="nav-item active">
                        <LayoutDashboard size={19} />
                        Dashboard
                    </a>

                    <a
                        className="nav-item"
                        onClick={() =>
                        (window.location.href =
                            "/class-record-upload")
                        }
                    >
                        <Upload size={19} />
                        Upload e-Class Record
                    </a>

                    <a className="nav-item">
                        <CheckCircle size={19} />
                        Validation Results
                    </a>

                    <a className="nav-item">
                        <Send size={19} />
                        Submission Status
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
                            Welcome, Subject Teacher
                        </h1>

                        <p>
                            Academic Record Submission
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
                            Manage your e-Class Record submissions and
                            monitor validation status
                        </p>
                    </div>

                    {/* OVERVIEW CARDS */}
                    <div className="overview-grid">

                        <div className="overview-card">
                            <div>
                                <span>Files Uploaded</span>

                                <strong>
                                    {summary.total_uploaded}
                                </strong>
                            </div>

                            <div className="card-icon blue">
                                <Upload size={23} />
                            </div>
                        </div>

                        <div className="overview-card">
                            <div>
                                <span>Pending Validation</span>
                                <strong className="green-text">
                                    {summary.pending_validation}
                                </strong>
                            </div>

                            <div className="card-icon green">
                                <Clock size={23} />
                            </div>
                        </div>

                        <div className="overview-card">
                            <div>
                                <span>Validated Records</span>
                                <strong className="purple-text">
                                    {summary.validated}
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
                                    {summary.needs_attention}
                                </strong>
                            </div>

                            <div className="card-icon red">
                                <AlertTriangle size={23} />
                            </div>
                        </div>

                    </div>

                    {/* RECORD SUMMARY */}
                    <div className="content-card">

                        <div className="card-header">
                            <div>
                                <h3>
                                    Record Submission Summary
                                </h3>
                            </div>
                        </div>

                        <div className="student-summary-grid">

                            <div className="summary-item blue-summary">
                                <FileText size={20} />

                                <div>
                                    <span>
                                        Uploaded
                                    </span>

                                    <strong>2</strong>
                                </div>
                            </div>

                            <div className="summary-item green-summary">
                                <CheckCircle size={20} />

                                <div>
                                    <span>
                                        Valid
                                    </span>

                                    <strong>1</strong>
                                </div>
                            </div>

                            <div className="summary-item yellow-summary">
                                <Clock size={20} />

                                <div>
                                    <span>
                                        Pending
                                    </span>

                                    <strong>1</strong>
                                </div>
                            </div>

                            <div className="summary-item red-summary">
                                <AlertTriangle size={20} />

                                <div>
                                    <span>
                                        With Issues
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
                                    Validation Status
                                </h3>

                                <p>
                                    Review the validation results of
                                    your uploaded academic records.
                                </p>

                                <div className="class-alert">
                                    <strong>
                                        Grade 6 - Mathematics
                                    </strong>

                                    <span>
                                        Pending Validation
                                    </span>
                                </div>
                            </div>

                        </div>

                        <button>
                            View Results
                        </button>

                    </div>

                    {/* RECENT UPLOADS */}

                    <div className="content-card">

                        <div className="card-header">

                            <h3>
                                Recent Uploads
                            </h3>

                            <button className="text-button">
                                View All
                            </button>

                        </div>

                        {/* LOADING */}

                        {recordsLoading && (
                            <div className="record-row">

                                <div>
                                    <strong>
                                        Loading records...
                                    </strong>

                                    <span>
                                        Retrieving your uploaded class records.
                                    </span>
                                </div>

                            </div>
                        )}

                        {/* ERROR */}

                        {!recordsLoading && recordsError && (
                            <div className="record-row">

                                <div>
                                    <strong>
                                        Unable to load records
                                    </strong>

                                    <span>
                                        {recordsError}
                                    </span>
                                </div>

                            </div>
                        )}

                        {/* NO RECORDS */}

                        {!recordsLoading &&
                            !recordsError &&
                            records.length === 0 && (
                                <div className="record-row">

                                    <div>
                                        <strong>
                                            No class records uploaded yet
                                        </strong>

                                        <span>
                                            Your uploaded e-Class Records will
                                            appear here.
                                        </span>
                                    </div>

                                </div>
                            )}

                        {/* REAL RECORDS */}

                        {!recordsLoading &&
                            !recordsError &&
                            records.map((record) => (
                                <div
                                    className="record-row"
                                    key={record.class_record_id}
                                >
                                    <div className="record-details">
                                        <strong>
                                            Grade {record.grade_level} - {record.subject_name}
                                        </strong>

                                        <span>
                                            {record.school_year} • {record.file_name}
                                        </span>
                                    </div>

                                    <div className="record-status">
                                        <span
                                            className={
                                                record.status?.toLowerCase() === "validated"
                                                    ? "status-badge submitted"
                                                    : record.status?.toLowerCase() === "needs attention"
                                                        ? "status-badge needs-attention"
                                                        : "status-badge draft"
                                            }
                                        >
                                            {record.status}
                                        </span>
                                    </div>

                                    <div className="record-actions">
                                        <button
                                            type="button"
                                            className="view-results-button"
                                            onClick={() =>
                                            (window.location.href =
                                                `/validation-results/${record.class_record_id}`)
                                            }
                                        >
                                            View Results
                                        </button>
                                    </div>
                                </div>
                            ))}

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
                                (window.location.href =
                                    "/class-record-upload")
                                }
                            >
                                <Upload size={24} />

                                <strong>
                                    Upload e-Class Record
                                </strong>

                                <span>
                                    Import an official DepEd
                                    e-Class Record
                                </span>
                            </button>

                            <button className="quick-action purple-action">
                                <CheckCircle size={24} />

                                <strong>
                                    Validation Results
                                </strong>

                                <span>
                                    Review automated validation
                                    results
                                </span>
                            </button>

                            <button className="quick-action green-action">
                                <Send size={24} />

                                <strong>
                                    Submission Status
                                </strong>

                                <span>
                                    Monitor submitted academic
                                    records
                                </span>
                            </button>

                            <button className="quick-action orange-action">
                                <FileText size={24} />

                                <strong>
                                    Recent Records
                                </strong>

                                <span>
                                    View your recent academic
                                    record uploads
                                </span>
                            </button>

                        </div>

                    </div>

                </section>

            </main>

        </div>
    );
}

export default SubjectDashboard; 