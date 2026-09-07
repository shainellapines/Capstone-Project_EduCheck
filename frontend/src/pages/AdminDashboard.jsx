import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Users,
    UserCog,
    ClipboardCheck,
    BarChart3,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Clock,
    Loader2,
} from "lucide-react";

import "./Dashboard.css";
import Sidebar from "../components/Sidebar";

const API_URL = "http://localhost:5000/api";

function AdminDashboard() {
    const navigate = useNavigate();
    const storedUser = localStorage.getItem("educheck_user");

    const user = storedUser
        ? JSON.parse(storedUser)
        : { username: "admin", role: "admin" };

    const [totalUsers, setTotalUsers] = useState(null);

    const [schoolYears, setSchoolYears] = useState([]);
    const [selectedSchoolYearId, setSelectedSchoolYearId] = useState("");
    const [loadingSchoolYears, setLoadingSchoolYears] = useState(true);

    const [consolidatedData, setConsolidatedData] = useState(null);
    const [loadingData, setLoadingData] = useState(false);
    const [error, setError] = useState("");

    const authHeaders = () => {
        const token = localStorage.getItem("educheck_token");

        if (!token) {
            throw new Error("Authentication token not found. Please log in again.");
        }

        return { Authorization: `Bearer ${token}` };
    };

    useEffect(() => {
        const fetchUserCount = async () => {
            try {
                const response = await fetch(`${API_URL}/users`, {
                    headers: authHeaders(),
                });

                const data = await response.json();

                if (response.ok && Array.isArray(data)) {
                    setTotalUsers(data.length);
                }
            } catch {
                // Non-critical for this dashboard; leave totalUsers as null.
            }
        };

        fetchUserCount();
    }, []);

    useEffect(() => {
        const fetchSchoolYears = async () => {
            try {
                setLoadingSchoolYears(true);
                setError("");

                const response = await fetch(`${API_URL}/consolidation/school-years`, {
                    headers: authHeaders(),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Failed to load school years.");
                }

                setSchoolYears(data.school_years || []);

                if (data.school_years?.length > 0) {
                    setSelectedSchoolYearId(String(data.school_years[0].school_year_id));
                }
            } catch (fetchError) {
                setError(fetchError.message || "Failed to load school years.");
            } finally {
                setLoadingSchoolYears(false);
            }
        };

        fetchSchoolYears();
    }, []);

    useEffect(() => {
        if (!selectedSchoolYearId) return;

        const fetchConsolidatedData = async () => {
            try {
                setLoadingData(true);
                setError("");

                const response = await fetch(
                    `${API_URL}/consolidation/school-years/${selectedSchoolYearId}`,
                    { headers: authHeaders() }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Failed to load dashboard data.");
                }

                setConsolidatedData(data);
            } catch (fetchError) {
                setError(fetchError.message || "Failed to load dashboard data.");
                setConsolidatedData(null);
            } finally {
                setLoadingData(false);
            }
        };

        fetchConsolidatedData();
    }, [selectedSchoolYearId]);

    const students = consolidatedData?.students || [];
    const uploadSummary = consolidatedData?.upload_summary;

    const pendingCount = students.filter((s) => s.submission.status === "Pending Approval").length;
    const approvedCount = students.filter((s) => s.submission.status === "Approved").length;
    const rejectedCount = students.filter((s) => s.submission.status === "Rejected").length;

    const recentSubmissions = students
        .filter((s) => s.submission.status !== "Not Submitted")
        .sort((a, b) => {
            const aTime = new Date(a.submission.approved_at || a.submission.reviewed_at).getTime();
            const bTime = new Date(b.submission.approved_at || b.submission.reviewed_at).getTime();
            return bTime - aTime;
        })
        .slice(0, 5);

    const getStatusBadgeClass = (status) => {
        if (status === "Approved") return "status-badge submitted";
        if (status === "Rejected") return "status-badge needs-attention";
        return "status-badge draft";
    };

    const isLoading = loadingSchoolYears || loadingData;

    return (
        <div className="dashboard-layout">

            <Sidebar activeKey="dashboard" />

            {/* MAIN CONTENT */}
            <main className="dashboard-main">

                {/* HEADER */}
                <header className="dashboard-header">

                    <div>
                        <h1>
                            Welcome, {user.username}
                        </h1>

                        <p>
                            EduCheck System Administration
                        </p>
                    </div>

                    <div className="school-year">
                        School Year:{" "}
                        {schoolYears.length > 0 ? (
                            <select
                                className="school-year-select"
                                value={selectedSchoolYearId}
                                onChange={(e) => setSelectedSchoolYearId(e.target.value)}
                                disabled={loadingSchoolYears}
                            >
                                {schoolYears.map((schoolYear) => (
                                    <option
                                        key={schoolYear.school_year_id}
                                        value={schoolYear.school_year_id}
                                    >
                                        {schoolYear.school_year}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <strong>None set up yet</strong>
                        )}
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

                    {error && (
                        <div className="error-banner">
                            <AlertTriangle size={20} />
                            <span>{error}</span>
                        </div>
                    )}

                    {isLoading && (
                        <div className="loading-state">
                            <Loader2 size={20} className="spin-icon" />
                            Loading dashboard data...
                        </div>
                    )}

                    {!isLoading && consolidatedData && (
                        <>
                            {/* OVERVIEW CARDS */}
                            <div className="overview-grid">

                                <div className="overview-card">
                                    <div>
                                        <span>Total Users</span>
                                        <strong>{totalUsers ?? "—"}</strong>
                                    </div>

                                    <div className="card-icon blue">
                                        <Users size={23} />
                                    </div>
                                </div>

                                <div className="overview-card">
                                    <div>
                                        <span>Pending Submissions</span>
                                        <strong>{pendingCount}</strong>
                                    </div>

                                    <div className="card-icon green">
                                        <Clock size={23} />
                                    </div>
                                </div>

                                <div className="overview-card">
                                    <div>
                                        <span>Approved Records</span>
                                        <strong className="purple-text">{approvedCount}</strong>
                                    </div>

                                    <div className="card-icon purple">
                                        <CheckCircle size={23} />
                                    </div>
                                </div>

                                <div className="overview-card">
                                    <div>
                                        <span>Rejected Records</span>
                                        <strong className="orange-text">{rejectedCount}</strong>
                                    </div>

                                    <div className="card-icon orange">
                                        <XCircle size={23} />
                                    </div>
                                </div>

                                <div className="overview-card">
                                    <div>
                                        <span>Uploads Needing Attention</span>
                                        <strong className="red-text">
                                            {uploadSummary?.needs_attention ?? 0}
                                        </strong>
                                    </div>

                                    <div className="card-icon red">
                                        <AlertTriangle size={23} />
                                    </div>
                                </div>

                            </div>

                            {/* ATTENTION */}
                            {pendingCount > 0 && (
                                <div className="attention-card">

                                    <div className="attention-content">

                                        <AlertTriangle size={24} />

                                        <div>
                                            <h3>
                                                Records Awaiting Approval
                                            </h3>

                                            <p>
                                                {pendingCount} submission{pendingCount === 1 ? "" : "s"} pending
                                                your review
                                            </p>
                                        </div>

                                    </div>

                                    <button onClick={() => navigate("/consolidated-records")}>
                                        Review Submissions
                                    </button>

                                </div>
                            )}

                            {/* RECENT SUBMISSIONS */}
                            <div className="content-card">

                                <div className="card-header">
                                    <h3>
                                        Recent Submissions
                                    </h3>

                                    <button
                                        className="text-button"
                                        onClick={() => navigate("/consolidated-records")}
                                    >
                                        View All
                                    </button>
                                </div>

                                {recentSubmissions.length === 0 && (
                                    <p className="empty-state-text">
                                        No student records have been submitted for this school year yet.
                                    </p>
                                )}

                                {recentSubmissions.map((student) => (
                                    <div className="record-row" key={student.lrn}>

                                        <div>
                                            <strong>
                                                {student.last_name}, {student.first_name}
                                            </strong>

                                            <span>
                                                LRN: {student.lrn} • Grade {student.grade_level}
                                            </span>
                                        </div>

                                        <span className={getStatusBadgeClass(student.submission.status)}>
                                            {student.submission.status}
                                        </span>

                                    </div>
                                ))}

                            </div>
                        </>
                    )}

                    {/* QUICK ACTIONS */}
                    <div className="content-card">

                        <div className="card-header">
                            <h3>Quick Actions</h3>
                        </div>

                        <div className="quick-actions">

                            <button
                                className="quick-action blue-action"
                                onClick={() => navigate("/users")}
                            >
                                <Users size={24} />

                                <strong>
                                    User Management
                                </strong>

                                <span>
                                    Manage EduCheck user accounts
                                </span>
                            </button>

                            <button
                                className="quick-action purple-action"
                                onClick={() => navigate("/teachers")}
                            >
                                <UserCog size={24} />

                                <strong>
                                    Teacher Management
                                </strong>

                                <span>
                                    Manage teacher information
                                </span>
                            </button>

                            <button
                                className="quick-action green-action"
                                onClick={() => navigate("/consolidated-records")}
                            >
                                <ClipboardCheck size={24} />

                                <strong>
                                    Review Submissions
                                </strong>

                                <span>
                                    Review records awaiting approval
                                </span>
                            </button>

                            <button
                                className="quick-action orange-action"
                                style={{ cursor: "default" }}
                            >
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
