import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Users,
    FileText,
    Upload,
    CheckCircle,
    AlertTriangle,
    Loader2,
} from "lucide-react";

import "./Dashboard.css";
import Sidebar from "../components/Sidebar";

const API_URL = "http://localhost:5000/api";

// Standard DepEd K-12 grade descriptor bands, used here to flag students
// whose weakest recorded subject grade suggests they need attention.
// (90-100 Outstanding, 85-89 Very Satisfactory, 80-84 Satisfactory,
// 75-79 Fairly Satisfactory, below 75 Did Not Meet Expectations.)
const classifyStudent = (student) => {
    const gradedSubjects = student.subjects
        .map((subject) => subject.final_grade)
        .filter((grade) => grade !== null);

    if (gradedSubjects.length === 0) return "ungraded";

    const lowestGrade = Math.min(...gradedSubjects);

    if (lowestGrade < 75) return "needs_intervention";
    if (lowestGrade < 80) return "at_risk";
    return "on_track";
};

function Dashboard() {
    const navigate = useNavigate();
    const storedUser = localStorage.getItem("educheck_user");
    const user = storedUser
        ? JSON.parse(storedUser)
        : { username: "adviser", role: "adviser" };

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

    const completeCount = students.filter((student) => student.all_subjects_submitted).length;
    const incompleteCount = students.length - completeCount;

    const performanceCounts = students.reduce(
        (counts, student) => {
            const classification = classifyStudent(student);
            counts[classification] += 1;
            return counts;
        },
        { on_track: 0, at_risk: 0, needs_intervention: 0, ungraded: 0 }
    );

    const recentUploads = Array.from(
        new Map(
            students
                .flatMap((student) => student.subjects)
                .map((subject) => [subject.class_record_id, subject])
        ).values()
    )
        .sort((a, b) => new Date(b.upload_date) - new Date(a.upload_date))
        .slice(0, 5);

    const getStatusBadgeClass = (status) => {
        if (status === "Validated") return "status-badge submitted";
        if (status === "Needs Attention") return "status-badge needs-attention";
        return "status-badge draft";
    };

    const isLoading = loadingSchoolYears || loadingData;
    const needsInterventionTotal = performanceCounts.at_risk + performanceCounts.needs_intervention;

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
                            Adviser (Homeroom Teacher)
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
                        <h2>Dashboard Overview</h2>
                        <p>
                            Track your academic records and student performance
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
                                        <span>Total Students</span>
                                        <strong>{students.length}</strong>
                                    </div>

                                    <div className="card-icon blue">
                                        <Users size={23} />
                                    </div>
                                </div>

                                <div className="overview-card">
                                    <div>
                                        <span>Complete Records</span>
                                        <strong className="green-text">{completeCount}</strong>
                                    </div>

                                    <div className="card-icon green">
                                        <CheckCircle size={23} />
                                    </div>
                                </div>

                                <div className="overview-card">
                                    <div>
                                        <span>Incomplete Records</span>
                                        <strong className="purple-text">{incompleteCount}</strong>
                                    </div>

                                    <div className="card-icon purple">
                                        <FileText size={23} />
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

                            {/* STUDENT SUMMARY */}
                            <div className="content-card">

                                <div className="card-header">
                                    <div>
                                        <h3>Student Performance Summary</h3>
                                        <p className="card-subtext">
                                            Based on each student's lowest recorded subject grade
                                        </p>
                                    </div>
                                </div>

                                <div className="student-summary-grid">

                                    <div className="summary-item green-summary">
                                        <CheckCircle size={20} />
                                        <div>
                                            <span>On Track</span>
                                            <strong>{performanceCounts.on_track}</strong>
                                        </div>
                                    </div>

                                    <div className="summary-item yellow-summary">
                                        <AlertTriangle size={20} />
                                        <div>
                                            <span>At Risk</span>
                                            <strong>{performanceCounts.at_risk}</strong>
                                        </div>
                                    </div>

                                    <div className="summary-item red-summary">
                                        <AlertTriangle size={20} />
                                        <div>
                                            <span>Needs Intervention</span>
                                            <strong>{performanceCounts.needs_intervention}</strong>
                                        </div>
                                    </div>

                                </div>

                            </div>

                            {/* INTERVENTION */}
                            {needsInterventionTotal > 0 && (
                                <div className="attention-card">

                                    <div className="attention-content">

                                        <AlertTriangle size={24} />

                                        <div>
                                            <h3>
                                                Students Needing Intervention
                                            </h3>

                                            <p>
                                                {needsInterventionTotal} student
                                                {needsInterventionTotal === 1 ? "" : "s"} require
                                                attention this school year
                                            </p>

                                            <div className="class-alert">
                                                <span>
                                                    {performanceCounts.at_risk} At Risk
                                                </span>

                                                <span>
                                                    {performanceCounts.needs_intervention} Needs Intervention
                                                </span>
                                            </div>
                                        </div>

                                    </div>

                                    <button onClick={() => navigate("/consolidated-records")}>
                                        View Details
                                    </button>

                                </div>
                            )}

                            {/* RECENT UPLOADS */}
                            <div className="content-card">

                                <div className="card-header">
                                    <h3>Recent Uploads</h3>

                                    <button
                                        className="text-button"
                                        onClick={() => navigate("/consolidated-records")}
                                    >
                                        View All Records
                                    </button>
                                </div>

                                {recentUploads.length === 0 && (
                                    <p className="empty-state-text">
                                        No subject uploads recorded for this school year yet.
                                    </p>
                                )}

                                {recentUploads.map((upload) => (
                                    <div className="record-row" key={upload.class_record_id}>

                                        <div>
                                            <strong>
                                                {upload.subject_name}
                                            </strong>

                                            <span>
                                                {upload.teacher_name} •{" "}
                                                {new Date(upload.upload_date).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <span className={getStatusBadgeClass(upload.status)}>
                                            {upload.status}
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

                            <button className="quick-action blue-action" style={{ cursor: "default" }}>
                                <FileText size={24} />
                                <strong>Encode Grades</strong>
                                <span>
                                    Input student grades by section
                                </span>
                            </button>

                            <button className="quick-action purple-action" style={{ cursor: "default" }}>
                                <Upload size={24} />
                                <strong>Upload Files</strong>
                                <span>
                                    Import subject grade files
                                </span>
                            </button>

                            <button
                                className="quick-action green-action"
                                onClick={() => navigate("/consolidated-records")}
                            >
                                <FileText size={24} />
                                <strong>Consolidated Records</strong>
                                <span>
                                    View student academic records
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
