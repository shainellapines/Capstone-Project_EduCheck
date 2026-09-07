import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    AlertTriangle,
    CheckCircle,
    XCircle,
    Copy,
    GitCompareArrows,
    Users,
    FileText,
    Loader2,
    Upload,
} from "lucide-react";

import "./Dashboard.css";
import "./ValidationResults.css";
import Sidebar from "../components/Sidebar";

const API_URL = "http://localhost:5000/api";

// Groups the validator's real issue codes (classRecordValidator.js) into
// the categories shown on this page. Every code the validator can
// currently produce is accounted for below — anything not listed here
// falls back to "missing" rather than being silently dropped from every
// category count.
const CATEGORY_BY_CODE = {
    MISSING_TERM_RECORD: "missing",
    INCOMPLETE_TERM: "missing",
    MISSING_TERM_GRADE: "missing",
    MISSING_SUMMARY_RECORD: "missing",
    NO_LEARNERS_DETECTED: "missing",
    NO_TERM_RECORDS_DETECTED: "missing",
    NO_SUMMARY_RECORDS_DETECTED: "missing",
    INVALID_SCORE_RANGE: "invalid",
    DUPLICATE_LEARNER_NUMBER: "duplicate",
    SUMMARY_TERM_MISMATCH: "mismatch",
    FINAL_GRADE_MISMATCH: "mismatch",
};

const CATEGORY_META = {
    missing: { label: "Missing Data", tone: "amber", icon: AlertTriangle },
    invalid: { label: "Invalid Scores", tone: "red", icon: XCircle },
    duplicate: { label: "Duplicate Entries", tone: "orange", icon: Copy },
    mismatch: { label: "Term/Summary Mismatch", tone: "purple", icon: GitCompareArrows },
};

function categorize(issues) {
    const counts = { missing: 0, invalid: 0, duplicate: 0, mismatch: 0 };

    issues.forEach((issue) => {
        const category = CATEGORY_BY_CODE[issue.code] || "missing";
        counts[category] += 1;
    });

    return counts;
}

function ValidationResults() {
    const { classRecordId } = useParams();
    const navigate = useNavigate();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchValidationResults = async () => {
            try {
                setLoading(true);
                setError("");

                const token = localStorage.getItem("educheck_token");

                if (!token) {
                    throw new Error("Authentication token not found.");
                }

                const response = await fetch(
                    `${API_URL}/uploads/my-records/${classRecordId}/validation`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const responseData = await response.json();

                if (!response.ok) {
                    throw new Error(
                        responseData.message ||
                        "Failed to retrieve validation results."
                    );
                }

                setData(responseData);
            } catch (fetchError) {
                setError(fetchError.message);
            } finally {
                setLoading(false);
            }
        };

        fetchValidationResults();
    }, [classRecordId]);

    const isReady = data?.validation?.ready_for_submission;
    const categoryCounts = data ? categorize(data.validation.issues) : null;

    return (
        <div className="dashboard-layout">

            <Sidebar activeKey="validation-results" />

            <main className="dashboard-main">

                <header className="dashboard-header">
                    <div>
                        <h1>Validation Results</h1>
                        <p>Review your e-Class Record before submission.</p>
                    </div>
                </header>

                <section className="dashboard-content">

                    {error && (
                        <div className="error-banner">
                            <AlertTriangle size={20} />
                            <span>{error}</span>
                        </div>
                    )}

                    {loading && (
                        <div className="loading-state">
                            <Loader2 size={20} className="spin-icon" />
                            Loading validation results...
                        </div>
                    )}

                    {!loading && !error && data && (
                        <>
                            <div className="content-card vr-summary-card">
                                <div>
                                    <h2>
                                        <FileText size={20} />
                                        {data.class_record.subject_name}
                                    </h2>

                                    <p>Grade Level: {data.class_record.grade_level}</p>
                                    <p>School Year: {data.class_record.school_year}</p>
                                    <p>File: {data.class_record.file_name}</p>
                                </div>

                                <div className={isReady ? "vr-readiness-pill ready" : "vr-readiness-pill not-ready"}>
                                    {isReady ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                                    {isReady ? "Ready for Submission" : "Needs Attention"}
                                </div>
                            </div>

                            <div className="vr-category-grid">

                                <div className="vr-category-card tone-green">
                                    <div className="label">
                                        <Users size={16} />
                                        Learners Reviewed
                                    </div>
                                    <p className="count">{data.validation.learner_count}</p>
                                </div>

                                {Object.entries(CATEGORY_META).map(([key, meta]) => {
                                    const Icon = meta.icon;

                                    return (
                                        <div key={key} className={`vr-category-card tone-${meta.tone}`}>
                                            <div className="label">
                                                <Icon size={16} />
                                                {meta.label}
                                            </div>
                                            <p className="count">{categoryCounts[key]}</p>
                                        </div>
                                    );
                                })}

                            </div>

                            {!isReady && (
                                <div className="vr-revise-bar">
                                    <span>
                                        Fix the issues below and re-upload this class record
                                        to update your submission.
                                    </span>

                                    <button
                                        type="button"
                                        className="vr-revise-button"
                                        onClick={() => navigate("/class-record-upload")}
                                    >
                                        <Upload size={16} />
                                        Revise Record
                                    </button>
                                </div>
                            )}

                            <div className="content-card">
                                <div className="card-header">
                                    <h3>Validation Issues</h3>
                                </div>

                                {data.validation.issues.length === 0 ? (
                                    <div className="success-banner vr-clean-banner">
                                        <CheckCircle size={20} />
                                        No validation issues found. This record is ready.
                                    </div>
                                ) : (
                                    data.validation.issues.map((issue) => {
                                        const category = CATEGORY_BY_CODE[issue.code] || "missing";
                                        const categoryLabel = CATEGORY_META[category].label;

                                        return (
                                            <div
                                                key={issue.validation_issue_id}
                                                className={
                                                    issue.severity === "warning"
                                                        ? "vr-issue-row severity-warning"
                                                        : "vr-issue-row"
                                                }
                                            >
                                                {issue.severity === "warning" ? (
                                                    <AlertTriangle size={20} color="#d97706" />
                                                ) : (
                                                    <AlertTriangle size={20} color="#dc2626" />
                                                )}

                                                <div>
                                                    <div className="issue-header">
                                                        {issue.learner_name || "Workbook"}
                                                        {issue.term ? ` — ${issue.term}` : ""}
                                                    </div>

                                                    <p>{issue.message}</p>

                                                    <span className="category-tag">{categoryLabel}</span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </>
                    )}

                </section>

            </main>

        </div>
    );
}

export default ValidationResults;
