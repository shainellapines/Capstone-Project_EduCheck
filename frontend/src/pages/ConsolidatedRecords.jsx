import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
    ChevronDown,
    ChevronUp,
    AlertTriangle,
    CheckCircle,
    Loader2,
    FileText,
    Users,
    Send,
    XCircle,
} from "lucide-react";

import "./Dashboard.css";
import "./ConsolidatedRecords.css";
import Sidebar from "../components/Sidebar";

const API_URL = "http://localhost:5000/api";

const SUBMISSION_BADGE_CLASS = {
    "Not Submitted": "not-submitted",
    "Pending Approval": "pending-approval",
    "Approved": "approved",
    "Rejected": "rejected",
};

function ConsolidatedRecords() {
    const [searchParams] = useSearchParams();

    const storedUser = localStorage.getItem("educheck_user");
    const user = storedUser ? JSON.parse(storedUser) : { role: "" };

    // Support deep links from the Records Repository search
    // (/consolidated-records?year=<id>&lrn=<lrn>) — preselect that school
    // year and auto-expand + scroll to that student once loaded, instead
    // of making the user find them again in the full list.
    const highlightedLrn = searchParams.get("lrn");
    const highlightedRowRef = useRef(null);
    const hasAutoExpandedRef = useRef(false);

    const [schoolYears, setSchoolYears] = useState([]);
    const [selectedSchoolYearId, setSelectedSchoolYearId] = useState("");
    const [loadingSchoolYears, setLoadingSchoolYears] = useState(true);

    const [students, setStudents] = useState(null);
    const [loadingStudents, setLoadingStudents] = useState(false);

    const [expandedLrns, setExpandedLrns] = useState(new Set());
    const [error, setError] = useState("");
    const [actionMessage, setActionMessage] = useState("");
    const [pendingLrns, setPendingLrns] = useState(new Set());
    const [rejectingLrn, setRejectingLrn] = useState(null);
    const [rejectReason, setRejectReason] = useState("");

    const authHeaders = (extra = {}) => {
        const token = localStorage.getItem("educheck_token");

        if (!token) {
            throw new Error("Authentication token not found. Please log in again.");
        }

        return { Authorization: `Bearer ${token}`, ...extra };
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
                    const yearParam = searchParams.get("year");
                    const yearParamIsAvailable = data.school_years.some(
                        (year) => String(year.school_year_id) === yearParam
                    );

                    setSelectedSchoolYearId(
                        yearParamIsAvailable ? yearParam : String(data.school_years[0].school_year_id)
                    );
                }
            } catch (fetchError) {
                setError(fetchError.message || "Failed to load school years.");
            } finally {
                setLoadingSchoolYears(false);
            }
        };

        fetchSchoolYears();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchStudents = async () => {
        if (!selectedSchoolYearId) return;

        try {
            setLoadingStudents(true);
            setError("");

            const response = await fetch(
                `${API_URL}/consolidation/school-years/${selectedSchoolYearId}`,
                { headers: authHeaders() }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to load consolidated records.");
            }

            setStudents(data.students || []);
        } catch (fetchError) {
            setError(fetchError.message || "Failed to load consolidated records.");
            setStudents(null);
        } finally {
            setLoadingStudents(false);
        }
    };

    useEffect(() => {
        fetchStudents();
        setExpandedLrns(new Set());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedSchoolYearId]);

    // Auto-expand and scroll to the student named in ?lrn= once their data
    // has loaded. Guarded to fire only once — otherwise every students
    // refetch (e.g. after approve/reject) would silently re-expand a row
    // the user had since collapsed on purpose.
    useEffect(() => {
        if (hasAutoExpandedRef.current) return;
        if (!highlightedLrn || !students) return;
        if (!students.some((student) => student.lrn === highlightedLrn)) return;

        hasAutoExpandedRef.current = true;
        setExpandedLrns((previous) => new Set(previous).add(highlightedLrn));
        highlightedRowRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, [students, highlightedLrn]);

    const toggleExpanded = (lrn) => {
        setExpandedLrns((previous) => {
            const next = new Set(previous);

            if (next.has(lrn)) {
                next.delete(lrn);
            } else {
                next.add(lrn);
            }

            return next;
        });
    };

    const withPending = async (lrn, action) => {
        setActionMessage("");
        setError("");
        setPendingLrns((previous) => new Set(previous).add(lrn));

        try {
            await action();
        } catch (actionError) {
            setError(actionError.message || "The action failed.");
        } finally {
            setPendingLrns((previous) => {
                const next = new Set(previous);
                next.delete(lrn);
                return next;
            });
        }
    };

    const submitForApproval = (lrn) =>
        withPending(lrn, async () => {
            const response = await fetch(
                `${API_URL}/submissions/school-years/${selectedSchoolYearId}/students/${lrn}/submit`,
                { method: "POST", headers: authHeaders() }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to submit for approval.");
            }

            setActionMessage(`Submitted ${lrn} for approval.`);
            await fetchStudents();
        });

    const approveRecord = (lrn) =>
        withPending(lrn, async () => {
            const response = await fetch(
                `${API_URL}/submissions/school-years/${selectedSchoolYearId}/students/${lrn}/approve`,
                { method: "POST", headers: authHeaders() }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to approve this record.");
            }

            setActionMessage(`Approved ${lrn}.`);
            await fetchStudents();
        });

    const rejectRecord = (lrn) =>
        withPending(lrn, async () => {
            const response = await fetch(
                `${API_URL}/submissions/school-years/${selectedSchoolYearId}/students/${lrn}/reject`,
                {
                    method: "POST",
                    headers: authHeaders({ "Content-Type": "application/json" }),
                    body: JSON.stringify({ remarks: rejectReason }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to reject this record.");
            }

            setActionMessage(`Rejected ${lrn}.`);
            setRejectingLrn(null);
            setRejectReason("");
            await fetchStudents();
        });

    const submitAllEligible = async () => {
        setActionMessage("");
        setError("");

        try {
            const response = await fetch(
                `${API_URL}/submissions/school-years/${selectedSchoolYearId}/submit-all`,
                { method: "POST", headers: authHeaders() }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to submit records for approval.");
            }

            setActionMessage(data.message);
            await fetchStudents();
        } catch (submitError) {
            setError(submitError.message || "Failed to submit records for approval.");
        }
    };

    const eligibleForBulkSubmit =
        students?.filter(
            (student) => student.all_subjects_submitted && student.submission.status !== "Approved"
        ).length || 0;

    return (
        <div className="dashboard-layout">

            <Sidebar activeKey="consolidated-records" />

            <main className="dashboard-main">

                <header className="dashboard-header">
                    <div>
                        <h1>Consolidated Records</h1>
                        <p>
                            Each student's grades merged across every subject uploaded
                            for the selected school year.
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
                                        {schoolYear.school_year} ({schoolYear.status})
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <strong>None set up yet</strong>
                        )}
                    </div>
                </header>

                <section className="dashboard-content">

                    {user.role === "adviser" && students && students.length > 0 && (
                        <div className="cr-toolbar">
                            <button
                                type="button"
                                className="cr-btn cr-btn-primary"
                                onClick={submitAllEligible}
                                disabled={eligibleForBulkSubmit === 0}
                            >
                                <Send size={16} />
                                Submit All Eligible ({eligibleForBulkSubmit})
                            </button>
                        </div>
                    )}

                    {error && (
                        <div className="error-banner">
                            <AlertTriangle size={20} />
                            <span>{error}</span>
                        </div>
                    )}

                    {actionMessage && !error && (
                        <div className="success-banner">
                            <CheckCircle size={20} />
                            <span>{actionMessage}</span>
                        </div>
                    )}

                    {(loadingSchoolYears || loadingStudents) && (
                        <div className="loading-state">
                            <Loader2 size={20} className="spin-icon" />
                            Loading...
                        </div>
                    )}

                    {!loadingSchoolYears && !loadingStudents && students && students.length === 0 && (
                        <div className="content-card empty-state-card">
                            <Users size={20} />
                            No students have a recorded grade for this school year yet.
                        </div>
                    )}

                    {!loadingSchoolYears && !loadingStudents && students && students.length > 0 && (
                        <div className="content-card">

                            <div className="cr-list-count">
                                {students.length} student{students.length === 1 ? "" : "s"}
                            </div>

                            {students.map((student) => {
                                const isExpanded = expandedLrns.has(student.lrn);
                                const isPending = pendingLrns.has(student.lrn);
                                const submissionStatus = student.submission.status;
                                const badgeClass =
                                    SUBMISSION_BADGE_CLASS[submissionStatus] || SUBMISSION_BADGE_CLASS["Not Submitted"];

                                const isHighlighted = student.lrn === highlightedLrn;

                                return (
                                    <div
                                        key={student.lrn}
                                        ref={isHighlighted ? highlightedRowRef : undefined}
                                        className={isHighlighted ? "cr-student-row highlighted" : "cr-student-row"}
                                    >
                                        <div className="cr-row-summary">
                                            <button
                                                type="button"
                                                className="cr-row-toggle"
                                                onClick={() => toggleExpanded(student.lrn)}
                                            >
                                                {isExpanded ? (
                                                    <ChevronUp size={18} color="#64748b" />
                                                ) : (
                                                    <ChevronDown size={18} color="#64748b" />
                                                )}

                                                <div>
                                                    <div className="name">
                                                        {student.last_name}, {student.first_name}
                                                    </div>

                                                    <div className="meta">
                                                        LRN: {student.lrn} • Grade {student.grade_level}
                                                    </div>
                                                </div>
                                            </button>

                                            <div className="cr-row-actions">
                                                <span className="cr-subject-count">
                                                    {student.subjects_recorded}
                                                    {student.subjects_expected !== null
                                                        ? ` / ${student.subjects_expected}`
                                                        : ""}{" "}
                                                    subjects
                                                </span>

                                                <span
                                                    className={
                                                        student.all_subjects_submitted
                                                            ? "pill-badge complete"
                                                            : "pill-badge incomplete"
                                                    }
                                                >
                                                    {student.all_subjects_submitted ? (
                                                        <CheckCircle size={14} />
                                                    ) : (
                                                        <AlertTriangle size={14} />
                                                    )}
                                                    {student.all_subjects_submitted
                                                        ? "Complete"
                                                        : "Incomplete"}
                                                </span>

                                                <span className={`submission-badge ${badgeClass}`}>
                                                    {submissionStatus}
                                                </span>

                                                {user.role === "adviser" &&
                                                    student.all_subjects_submitted &&
                                                    (submissionStatus === "Not Submitted" || submissionStatus === "Rejected") && (
                                                        <button
                                                            type="button"
                                                            className="cr-btn cr-btn-primary"
                                                            style={{ padding: "8px 14px", fontSize: "13px" }}
                                                            onClick={() => submitForApproval(student.lrn)}
                                                            disabled={isPending}
                                                        >
                                                            <Send size={14} />
                                                            Submit for Approval
                                                        </button>
                                                    )}

                                                {user.role === "admin" && submissionStatus === "Pending Approval" && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            className="cr-btn cr-btn-approve"
                                                            onClick={() => approveRecord(student.lrn)}
                                                            disabled={isPending}
                                                        >
                                                            <CheckCircle size={14} />
                                                            Approve
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="cr-btn cr-btn-reject"
                                                            onClick={() =>
                                                                setRejectingLrn(
                                                                    rejectingLrn === student.lrn ? null : student.lrn
                                                                )
                                                            }
                                                            disabled={isPending}
                                                        >
                                                            <XCircle size={14} />
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {rejectingLrn === student.lrn && (
                                            <div className="cr-reject-panel">
                                                <textarea
                                                    className="cr-reject-textarea"
                                                    value={rejectReason}
                                                    onChange={(e) => setRejectReason(e.target.value)}
                                                    placeholder="Reason for rejection (shown to the adviser)"
                                                    rows={2}
                                                />

                                                <button
                                                    type="button"
                                                    className="cr-btn cr-btn-reject"
                                                    onClick={() => rejectRecord(student.lrn)}
                                                    disabled={pendingLrns.has(student.lrn)}
                                                >
                                                    Confirm Reject
                                                </button>

                                                <button
                                                    type="button"
                                                    className="cr-btn cr-btn-cancel"
                                                    onClick={() => {
                                                        setRejectingLrn(null);
                                                        setRejectReason("");
                                                    }}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        )}

                                        {submissionStatus === "Rejected" && student.submission.remarks && (
                                            <div className="cr-rejection-reason">
                                                Rejection reason: {student.submission.remarks}
                                            </div>
                                        )}

                                        {isExpanded && (
                                            <div className="cr-subjects-panel">
                                                <table className="cr-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Subject</th>
                                                            <th>Teacher</th>
                                                            <th>Term 1</th>
                                                            <th>Term 2</th>
                                                            <th>Term 3</th>
                                                            <th>Final</th>
                                                            <th>Status</th>
                                                        </tr>
                                                    </thead>

                                                    <tbody>
                                                        {student.subjects.map((subject) => (
                                                            <tr key={subject.subject_id}>
                                                                <td>
                                                                    <FileText size={14} className="subject-icon" />
                                                                    {subject.subject_name}
                                                                </td>
                                                                <td>{subject.teacher_name}</td>
                                                                <td>{subject.term_1 ?? "—"}</td>
                                                                <td>{subject.term_2 ?? "—"}</td>
                                                                <td>{subject.term_3 ?? "—"}</td>
                                                                <td className="final-grade">
                                                                    {subject.final_grade ?? "—"}
                                                                </td>
                                                                <td>{subject.status}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                </section>

            </main>

        </div>
    );
}

export default ConsolidatedRecords;
