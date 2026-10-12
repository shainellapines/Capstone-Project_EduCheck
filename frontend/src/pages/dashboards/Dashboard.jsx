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

import "../../styles/Dashboard.css";
import Sidebar from "../../components/Sidebar";
import StatusBadge from "../../components/StatusBadge";
import NextSteps from "../../components/NextSteps";
import { getToken, getStoredUser, getDisplayName } from "../../utils/session";
import { useCanUpload } from "../../utils/uploadAccess";
import { API_URL } from "../../config";


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
    const canUpload = useCanUpload();
    const user = getStoredUser() || { username: "adviser", role: "adviser" };

    const [schoolYears, setSchoolYears] = useState([]);
    const [selectedSchoolYearId, setSelectedSchoolYearId] = useState("");
    const [loadingSchoolYears, setLoadingSchoolYears] = useState(true);

    const [consolidatedData, setConsolidatedData] = useState(null);
    // Per-section subject progress (which subjects are missing or flagged)
    // for the Next steps panel. Optional: the panel hides without it.
    const [sectionProgress, setSectionProgress] = useState(null);
    const [loadingData, setLoadingData] = useState(false);
    const [error, setError] = useState("");

    const authHeaders = () => {
        const token = getToken();

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

                // Best effort: a failure here only hides the Next steps panel.
                try {
                    const progressResponse = await fetch(
                        `${API_URL}/consolidation/school-years/${selectedSchoolYearId}/sections`,
                        { headers: authHeaders() }
                    );
                    setSectionProgress(progressResponse.ok ? await progressResponse.json() : null);
                } catch {
                    setSectionProgress(null);
                }
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
        .slice(0, 4);

    const isLoading = loadingSchoolYears || loadingData;

    // ---- Next steps: uploads -> complete records -> submission ----
    const sections = sectionProgress?.sections || [];
    const sum = (pick) => sections.reduce((total, section) => total + pick(section), 0);

    const subjectsExpected = sum((section) => section.subjects_expected);
    const subjectsValidated = sum((section) => section.subjects_submitted);
    const flaggedSubjects = sections.flatMap((section) => section.flagged_subjects || []);
    const missingSubjects = sections.flatMap((section) => section.missing_subjects || []);
    const subjectsInReview = Math.max(
        subjectsExpected - subjectsValidated - flaggedSubjects.length - missingSubjects.length,
        0
    );

    const enrolledCount = sum((section) => section.student_count) || students.length;
    const statusCount = (status) => sum((section) => section.submission_status_counts?.[status] || 0);
    const approvedCount = statusCount("Approved");
    const pendingCount = statusCount("Pending Approval");
    const returnedCount = statusCount("Rejected") + statusCount("Amendment Requested");

    // Complete records not yet sent (or sent back): what "Submit" acts on.
    const readyToSubmitCount = students.filter(
        (student) =>
            student.all_subjects_submitted &&
            ["Not Submitted", "Rejected", "Amendment Requested"].includes(student.submission?.status)
    ).length;

    const listNames = (subjects) => {
        const names = subjects.map((subject) => subject.subject_name);
        return names.length > 3 ? `${names.slice(0, 3).join(", ")} +${names.length - 3} more` : names.join(", ");
    };

    const uploadDetail = [
        missingSubjects.length > 0 && `Not uploaded: ${listNames(missingSubjects)}.`,
        flaggedSubjects.length > 0 && `Needs fixing: ${listNames(flaggedSubjects)}.`,
    ].filter(Boolean).join(" ");

    const nextSteps = [
        {
            key: "uploads",
            title: "Upload subjects",
            state: subjectsExpected > 0 && subjectsValidated >= subjectsExpected ? "done" : "active",
            value: subjectsValidated,
            total: subjectsExpected,
            unit: "subjects validated",
            segments: [
                { value: subjectsValidated, tone: "done" },
                { value: flaggedSubjects.length, tone: "warning" },
                { value: subjectsInReview, tone: "pending" },
            ],
            detail: uploadDetail || "Every subject is uploaded and passed validation.",
            action:
                missingSubjects.length > 0 || flaggedSubjects.length > 0
                    ? canUpload
                        ? { label: "Upload files", onClick: () => navigate("/class-record-upload") }
                        : { label: "View section progress", onClick: () => navigate("/section-progress") }
                    : null,
        },
        {
            key: "records",
            title: "Complete learner records",
            state: enrolledCount > 0 && completeCount >= enrolledCount ? "done" : "active",
            value: completeCount,
            total: enrolledCount,
            unit: "learners complete",
            segments: [{ value: completeCount, tone: "done" }],
            detail:
                completeCount >= enrolledCount
                    ? "Every learner has a grade in every subject."
                    : `${enrolledCount - completeCount} learner${enrolledCount - completeCount === 1 ? " is" : "s are"} still missing a subject grade.`,
            action:
                completeCount < enrolledCount
                    ? { label: "Review records", onClick: () => navigate("/consolidated-records") }
                    : null,
        },
        {
            key: "submission",
            title: "Submit for approval",
            state:
                enrolledCount > 0 && approvedCount >= enrolledCount
                    ? "done"
                    : readyToSubmitCount > 0
                        ? "active"
                        : "waiting",
            value: approvedCount,
            total: enrolledCount,
            unit: "approved",
            segments: [
                { value: approvedCount, tone: "done" },
                { value: returnedCount, tone: "warning" },
                { value: pendingCount, tone: "pending" },
            ],
            detail:
                approvedCount >= enrolledCount && enrolledCount > 0
                    ? "Every record is approved."
                    : [
                        readyToSubmitCount > 0 && `${readyToSubmitCount} ready to submit.`,
                        pendingCount > 0 && `${pendingCount} waiting for the Administrator.`,
                        returnedCount > 0 && `${returnedCount} returned for changes.`,
                    ].filter(Boolean).join(" ") || "Complete the records above first.",
            action:
                readyToSubmitCount > 0
                    ? { label: "Submit records", onClick: () => navigate("/consolidated-records") }
                    : null,
        },
    ];

    const sectionContext = sections
        .map((section) => `Grade ${section.grade_level} · ${section.section_name}`)
        .join(", ");
    const needsInterventionTotal = performanceCounts.at_risk + performanceCounts.needs_intervention;

    return (
        <div className="dashboard-layout">

            <Sidebar activeKey="dashboard" />

            {/* MAIN CONTENT */}
            <main className="dashboard-main">

                {/* HEADER */}
                <header className="dashboard-header">

                    <div>
                        <p className="dashboard-eyebrow">
                            Class Adviser · {getDisplayName(user)}
                        </p>

                        <h1>Dashboard</h1>

                        <p>
                            Track your academic records and student performance
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
                            {sections.length > 0 && (
                                <NextSteps context={sectionContext} steps={nextSteps} />
                            )}

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
                                                {needsInterventionTotal === 1 ? " requires" : "s require"}{" "}
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

                                        <div className="record-details">
                                            <strong>
                                                {upload.subject_name}
                                            </strong>

                                            <span>
                                                {upload.teacher_name} ·{" "}
                                                {new Date(upload.upload_date).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <div className="record-status">
                                            <StatusBadge status={upload.status} />
                                        </div>

                                        <div className="record-actions">
                                            <button
                                                type="button"
                                                className="view-results-button ghost"
                                                onClick={() =>
                                                    navigate(`/validation-results/${upload.class_record_id}`)
                                                }
                                            >
                                                View Results
                                            </button>
                                        </div>

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

                            {canUpload && (
                                <button
                                    className="quick-action purple-action"
                                    onClick={() => navigate("/class-record-upload")}
                                >
                                    <Upload size={24} />
                                    <strong>Upload Files</strong>
                                    <span>
                                        Import subject grade files
                                    </span>
                                </button>
                            )}

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
