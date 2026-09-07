import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    Upload,
    CheckCircle,
    Bell,
    AlertTriangle,
    Clock,
} from "lucide-react";

import "./Dashboard.css";
import Sidebar from "../components/Sidebar";

const API_URL = "http://localhost:5000/api";

// Statuses class_records can carry that mean the record can't move
// forward yet — mirrors the FILTER clause getMyClassRecordSummary uses
// server-side for its own "needs_attention" count, so the flagged list
// built here always agrees with that number.
const NEEDS_ATTENTION_STATUSES = ["needs attention", "rejected", "invalid"];

function SubjectDashboard() {
    const navigate = useNavigate();

    const [records, setRecords] = useState([]);
    const [recordsLoading, setRecordsLoading] = useState(true);
    const [recordsError, setRecordsError] = useState("");

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

    useEffect(() => {
        fetchMyRecords();
        fetchMyRecordSummary();
    }, []);

    // records comes back sorted by upload_date DESC (see getMyClassRecords),
    // so [0] is genuinely the most recent upload — used both for the
    // header's "most recent school year" and the Validation Results quick
    // action's destination.
    const latestRecord = records[0] || null;

    const flaggedRecords = records.filter((record) =>
        NEEDS_ATTENTION_STATUSES.includes(record.status?.toLowerCase())
    );

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
                            Academic Record Submission
                        </p>
                    </div>

                    <div className="school-year">
                        Most Recent School Year:{" "}
                        <strong>{latestRecord ? latestRecord.school_year : "No records yet"}</strong>
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
                                                navigate(`/validation-results/${record.class_record_id}`)
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
