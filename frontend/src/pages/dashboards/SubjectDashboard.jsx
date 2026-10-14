import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    Upload,
    CheckCircle,
    Bell,
    AlertTriangle,
    Clock,
    ChevronDown,
    ChevronUp,
} from "lucide-react";

import "../../styles/Dashboard.css";
import Sidebar from "../../components/Sidebar";
import StatusBadge from "../../components/StatusBadge";
import NextSteps from "../../components/NextSteps";
import { API_URL } from "../../config";
import { getDisplayName } from "../../utils/session";


// Statuses class_records can carry that mean the record can't move
// forward yet — mirrors the FILTER clause getMyClassRecordSummary uses
// server-side for its own "needs_attention" count, so the flagged list
// built here always agrees with that number.
const NEEDS_ATTENTION_STATUSES = ["needs attention", "needs revision", "rejected", "invalid"];

// Every upload ever made previously rendered here unbounded — fine for a
// first upload, unusable after a school year of them. Collapsed to a
// short preview by default; "Show all" reveals the rest client-side
// (already fetched in one request, no extra call needed).
const RECORD_PREVIEW_LIMIT = 5;

function SubjectDashboard() {
    const navigate = useNavigate();

    const [records, setRecords] = useState([]);
    const [recordsLoading, setRecordsLoading] = useState(true);
    const [recordsError, setRecordsError] = useState("");
    const [showAllRecords, setShowAllRecords] = useState(false);

    // The (subject, section, school year) pairs this teacher is assigned,
    // for the Next steps panel. Optional: the panel hides without them.
    const [assignments, setAssignments] = useState([]);

    const [summary, setSummary] = useState({
        total_uploaded: 0,
        pending_validation: 0,
        validated: 0,
        needs_attention: 0,
    });

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

            const token = localStorage.getItem("educheck_token");

            if (!token) {
                throw new Error("Authentication token not found.");
            }

            const response = await fetch(`${API_URL}/uploads/my-records`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to retrieve class records.");
            }

            setRecords(data.records || []);
        } catch (fetchError) {
            console.error("Fetch class records error:", fetchError);
            setRecordsError(fetchError.message);
        } finally {
            setRecordsLoading(false);
        }
    };

    const fetchMyRecordSummary = async () => {
        try {
            const token = localStorage.getItem("educheck_token");

            if (!token) {
                throw new Error("Authentication token not found.");
            }

            const response = await fetch(`${API_URL}/uploads/my-records/summary`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to retrieve record summary.");
            }

            setSummary(data);
        } catch (fetchError) {
            console.error("Fetch record summary error:", fetchError);
        }
    };

    const fetchAssignments = async () => {
        try {
            const token = localStorage.getItem("educheck_token");
            if (!token) return;

            const response = await fetch(`${API_URL}/uploads/options`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) return;

            const data = await response.json();
            setAssignments(data.options || []);
        } catch {
            setAssignments([]);
        }
    };

    useEffect(() => {
        fetchMyRecords();
        fetchMyRecordSummary();
        fetchAssignments();
    }, []);

    // records comes back sorted by upload_date DESC (see getMyClassRecords),
    // so [0] is genuinely the most recent upload — used both for the
    // header's "most recent school year" and the Validation Results quick
    // action's destination.
    const latestRecord = records[0] || null;

    const flaggedRecords = records.filter((record) =>
        NEEDS_ATTENTION_STATUSES.includes(record.status?.toLowerCase())
    );

    // ---- Next steps: upload each assignment -> pass validation ----
    // Only the newest school year the teacher is assigned in counts.
    const currentSchoolYearId = Math.max(0, ...assignments.map((option) => option.school_year_id));
    const currentAssignments = assignments
        .filter((option) => option.school_year_id === currentSchoolYearId)
        .map((option) => ({
            ...option,
            // records is newest-first, so find() returns the upload that counts.
            latest: records.find(
                (record) =>
                    record.subject_id === option.subject_id &&
                    record.section_id === option.section_id &&
                    record.school_year_id === option.school_year_id
            ),
        }));

    const assignmentLabel = (option) =>
        `${option.subject_name} (Grade ${option.grade_level} · ${option.section_name})`;
    const listAssignments = (list) => {
        const names = list.map(assignmentLabel);
        return names.length > 2 ? `${names.slice(0, 2).join(", ")} +${names.length - 2} more` : names.join(", ");
    };

    const notUploaded = currentAssignments.filter((option) => !option.latest);
    const uploaded = currentAssignments.filter((option) => option.latest);
    const validated = uploaded.filter((option) => option.latest.status === "Validated");
    const needsFixing = uploaded.filter((option) =>
        NEEDS_ATTENTION_STATUSES.includes(option.latest.status?.toLowerCase())
    );
    const inReview = uploaded.length - validated.length - needsFixing.length;

    const nextSteps = [
        {
            key: "uploads",
            title: "Upload your subjects",
            state: notUploaded.length === 0 ? "done" : "active",
            value: uploaded.length,
            total: currentAssignments.length,
            unit: "uploaded",
            segments: [{ value: uploaded.length, tone: "done" }],
            detail:
                notUploaded.length === 0
                    ? "Every assigned subject has an upload."
                    : `Not uploaded: ${listAssignments(notUploaded)}.`,
            action:
                notUploaded.length > 0
                    ? { label: "Upload e-Class Record", onClick: () => navigate("/class-record-upload") }
                    : null,
        },
        {
            key: "validation",
            title: "Pass validation",
            state:
                currentAssignments.length > 0 && validated.length === currentAssignments.length
                    ? "done"
                    : needsFixing.length > 0
                        ? "active"
                        : "waiting",
            value: validated.length,
            total: currentAssignments.length,
            unit: "validated",
            segments: [
                { value: validated.length, tone: "done" },
                { value: needsFixing.length, tone: "warning" },
                { value: inReview, tone: "pending" },
            ],
            detail:
                needsFixing.length > 0
                    ? `Fix and re-upload: ${listAssignments(needsFixing)}.`
                    : validated.length === currentAssignments.length && currentAssignments.length > 0
                        ? "Every upload passed. Your Adviser can consolidate them."
                        : "Upload your subjects to have them checked.",
            action:
                needsFixing.length > 0
                    ? {
                        label: "View validation results",
                        onClick: () => navigate(`/validation-results/${needsFixing[0].latest.class_record_id}`),
                    }
                    : null,
        },
    ];

    return (
        <div className="dashboard-layout">

            <Sidebar activeKey="dashboard" />

            {/* MAIN CONTENT */}
            <main className="dashboard-main">

                {/* HEADER */}
                <header className="dashboard-header">

                    <div>
                        <p className="dashboard-eyebrow">
                            Subject Teacher · {getDisplayName(user)}
                        </p>

                        <h1>Dashboard</h1>

                        <p>
                            Manage your e-Class Record submissions and monitor validation status
                        </p>
                    </div>

                    <div className="school-year">
                        Most Recent School Year:{" "}
                        <strong>{latestRecord ? latestRecord.school_year : "No records yet"}</strong>
                    </div>

                </header>

                <section className="dashboard-content">

                    {/* NEXT STEPS */}
                    {currentAssignments.length > 0 && (
                        <NextSteps
                            context={`School year ${currentAssignments[0].school_year}`}
                            steps={nextSteps}
                        />
                    )}

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

                    {/* ATTENTION */}
                    {!recordsLoading && !recordsError && flaggedRecords.length > 0 && (
                        <div className="attention-card">

                            <div className="attention-content">

                                <AlertTriangle size={24} />

                                <div>
                                    <h3>
                                        Validation Status
                                    </h3>

                                    <p>
                                        {flaggedRecords.length} record{flaggedRecords.length === 1 ? "" : "s"}{" "}
                                        need{flaggedRecords.length === 1 ? "s" : ""} your attention before they
                                        can be submitted.
                                    </p>

                                    <div className="class-alert">
                                        <strong>
                                            Grade {flaggedRecords[0].grade_level} - {flaggedRecords[0].subject_name}
                                        </strong>

                                        <span>
                                            {flaggedRecords[0].status}
                                        </span>
                                    </div>

                                    {flaggedRecords[0].status?.toLowerCase() === "needs revision" &&
                                        flaggedRecords[0].revision_remarks && (
                                            <p className="revision-remarks-note">
                                                Your Adviser sent this back: "{flaggedRecords[0].revision_remarks}"
                                            </p>
                                        )}
                                </div>

                            </div>

                            <button
                                onClick={() =>
                                    navigate(`/validation-results/${flaggedRecords[0].class_record_id}`)
                                }
                            >
                                View Results
                            </button>

                        </div>
                    )}

                    {/* RECENT UPLOADS */}

                    <div className="content-card">

                        <div className="card-header">

                            <h3>
                                Recent Uploads
                            </h3>

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
                            (showAllRecords ? records : records.slice(0, RECORD_PREVIEW_LIMIT)).map((record) => (
                                <div
                                    className="record-row"
                                    key={record.class_record_id}
                                >
                                    <div className="record-details">
                                        <strong>
                                            Grade {record.grade_level} - {record.subject_name}
                                        </strong>

                                        <span>
                                            {record.school_year} · {record.file_name}
                                        </span>

                                        {record.status?.toLowerCase() === "needs revision" &&
                                            record.revision_remarks && (
                                                <span className="revision-remarks-note">
                                                    Adviser's note: "{record.revision_remarks}"
                                                </span>
                                            )}
                                    </div>

                                    <div className="record-status">
                                        <StatusBadge status={record.status} />
                                    </div>

                                    <div className="record-actions">
                                        <button
                                            type="button"
                                            className="view-results-button ghost"
                                            onClick={() =>
                                                navigate(`/validation-results/${record.class_record_id}`)
                                            }
                                        >
                                            View Results
                                        </button>
                                    </div>
                                </div>
                            ))}

                        {!recordsLoading && !recordsError && records.length > RECORD_PREVIEW_LIMIT && (
                            <button
                                type="button"
                                className="record-show-more"
                                onClick={() => setShowAllRecords((previous) => !previous)}
                            >
                                {showAllRecords ? (
                                    <>
                                        <ChevronUp size={15} />
                                        Show fewer
                                    </>
                                ) : (
                                    <>
                                        <ChevronDown size={15} />
                                        Show all {records.length} uploads
                                    </>
                                )}
                            </button>
                        )}

                    </div>

                    {/* QUICK ACTIONS */}
                    <div className="content-card">

                        <div className="card-header">
                            <h3>Quick Actions</h3>
                        </div>

                        <div className="quick-actions">

                            <button
                                className="quick-action blue-action"
                                onClick={() => navigate("/class-record-upload")}
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

                            <button
                                type="button"
                                className="quick-action purple-action"
                                onClick={() =>
                                    latestRecord && navigate(`/validation-results/${latestRecord.class_record_id}`)
                                }
                                disabled={!latestRecord}
                            >
                                <CheckCircle size={24} />

                                <strong>
                                    Validation Results
                                </strong>

                                <span>
                                    {latestRecord
                                        ? "Review your most recent upload"
                                        : "Upload a record first"}
                                </span>
                            </button>

                            <button
                                type="button"
                                className="quick-action green-action"
                                onClick={() => navigate("/notifications")}
                            >
                                <Bell size={24} />

                                <strong>
                                    Notifications
                                </strong>

                                <span>
                                    See submission approval and
                                    rejection updates
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
