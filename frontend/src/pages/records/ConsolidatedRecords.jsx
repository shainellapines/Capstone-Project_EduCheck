import { Fragment, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
    ChevronDown,
    AlertTriangle,
    CheckCircle,
    Loader2,
    Search,
    Users,
    Send,
    X,
    XCircle,
    Undo2,
} from "lucide-react";

import "../../styles/Dashboard.css";
import "./ConsolidatedRecords.css";
import Sidebar from "../../components/Sidebar";
import StatusBadge, { GradeCell } from "../../components/StatusBadge";
import { API_URL } from "../../config";

const PAGE_SIZE = 20;

const isAdviserRole = (role) => role === "adviser";

function ConsolidatedRecords() {
    const [searchParams, setSearchParams] = useSearchParams();

    const storedUser = localStorage.getItem("educheck_user");
    const user = storedUser ? JSON.parse(storedUser) : { role: "" };

    // Support deep links from the Records & SF10 search
    // (/consolidated-records?year=<id>&lrn=<lrn>) — preselect that school
    // year and auto-expand + scroll to that student once loaded, instead
    // of making the user find them again in the full list.
    const highlightedLrn = searchParams.get("lrn");
    const highlightedRowRef = useRef(null);
    const hasAutoExpandedRef = useRef(false);

    // Support the "View Students" drill-down from Section Progress
    // (/consolidated-records?year=<id>&section=<id>&section_label=<text>) —
    // section_label travels with the link purely for display, so this page
    // doesn't need a second request just to look the section's name back up.
    const sectionFilterId = searchParams.get("section");
    const sectionFilterLabel = searchParams.get("section_label");

    const clearSectionFilter = () => {
        setSearchParams((previous) => {
            const next = new URLSearchParams(previous);
            next.delete("section");
            next.delete("section_label");
            return next;
        });
    };

    const [schoolYears, setSchoolYears] = useState([]);
    const [selectedSchoolYearId, setSelectedSchoolYearId] = useState("");
    const [loadingSchoolYears, setLoadingSchoolYears] = useState(true);

    const [students, setStudents] = useState(null);
    // Sections visible to this user in the selected year: names each
    // learner's section and fills the section picker.
    const [sections, setSections] = useState([]);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    // List narrowing: free-text search (name or LRN) and a status tab.
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const [expandedLrns, setExpandedLrns] = useState(new Set());
    const [error, setError] = useState("");
    const [actionMessage, setActionMessage] = useState("");
    const [pendingLrns, setPendingLrns] = useState(new Set());
    const [rejectingLrn, setRejectingLrn] = useState(null);
    const [rejectReason, setRejectReason] = useState("");
    // Pending records the Administrator ticked for "Approve selected".
    const [selectedLrns, setSelectedLrns] = useState(new Set());
    const [approvingSelected, setApprovingSelected] = useState(false);

    // Adviser return-to-subject-teacher correction (SPMP v1.0 US-006) — acts
    // on one class_record_id, not one lrn, since one subject upload covers
    // every student in it. Separate pending/panel state from the reject flow
    // above, which is keyed by lrn for the whole-student Admin decision.
    const [pendingClassRecordIds, setPendingClassRecordIds] = useState(new Set());
    const [revisingClassRecordId, setRevisingClassRecordId] = useState(null);
    const [revisionReason, setRevisionReason] = useState("");

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

    // `silent` skips the loadingStudents flag, which normally unmounts the
    // whole table in favor of a loading placeholder (see the render logic
    // below). That's fine on the initial load/filter change, but doing it
    // after an approve/reject/submit action collapses the page's content
    // height mid-scroll, snapping the browser's scroll position back to
    // the top. Action handlers refetch silently instead so the table stays
    // mounted (and the scroll position stays put) while fresh data loads in.
    const fetchStudents = async ({ silent = false } = {}) => {
        if (!selectedSchoolYearId) return;

        try {
            if (!silent) setLoadingStudents(true);
            setError("");

            const query = sectionFilterId ? `?section_id=${sectionFilterId}` : "";

            const response = await fetch(
                `${API_URL}/consolidation/school-years/${selectedSchoolYearId}${query}`,
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
            if (!silent) setLoadingStudents(false);
        }
    };

    useEffect(() => {
        if (!selectedSchoolYearId) return;
        let active = true;

        // Best effort: without it rows just leave the section name out.
        fetch(`${API_URL}/consolidation/school-years/${selectedSchoolYearId}/sections`, {
            headers: authHeaders(),
        })
            .then((response) => (response.ok ? response.json() : { sections: [] }))
            .then((data) => {
                if (active) setSections(data.sections || []);
            })
            .catch(() => {
                if (active) setSections([]);
            });

        return () => {
            active = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedSchoolYearId]);

    const sectionLabel = (section) => `Grade ${section.grade_level} · ${section.section_name}`;
    const sectionNameById = new Map(sections.map((section) => [String(section.section_id), section.section_name]));

    // Same ?section= filter Section Progress links to, so the backend
    // narrows the list and those links keep working.
    const changeSectionFilter = (sectionId) => {
        const section = sections.find((item) => String(item.section_id) === sectionId);
        setSearchParams((previous) => {
            const next = new URLSearchParams(previous);
            if (section) {
                next.set("section", sectionId);
                next.set("section_label", sectionLabel(section));
            } else {
                next.delete("section");
                next.delete("section_label");
            }
            return next;
        });
    };

    // An Adviser of one section has nothing to choose between.
    const showSectionPicker = sections.length > 1 || (!isAdviserRole(user.role) && sections.length > 0);

    useEffect(() => {
        fetchStudents();
        setExpandedLrns(new Set());
        setSelectedLrns(new Set());
        setCurrentPage(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedSchoolYearId, sectionFilterId]);

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

        const highlightedIndex = students.findIndex((student) => student.lrn === highlightedLrn);
        if (highlightedIndex !== -1) {
            setCurrentPage(Math.floor(highlightedIndex / PAGE_SIZE) + 1);
        }

        // Deferred: the page-jump above only takes effect on the next render,
        // so the highlighted row's ref isn't attached to the DOM yet this tick.
        setTimeout(() => {
            highlightedRowRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 50);
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
            await fetchStudents({ silent: true });
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
            await fetchStudents({ silent: true });
        });

    const toggleSelected = (lrn) => {
        setSelectedLrns((previous) => {
            const next = new Set(previous);

            if (next.has(lrn)) {
                next.delete(lrn);
            } else {
                next.add(lrn);
            }

            return next;
        });
    };

    // Each record still gets the full approval checks on the server; any
    // that fail them are skipped and named here instead of approved.
    const approveSelected = async () => {
        const lrns = [...selectedLrns];
        if (lrns.length === 0) return;
        if (!window.confirm(`Approve ${lrns.length} selected record(s)? Approved records are locked.`)) return;

        setActionMessage("");
        setError("");
        setApprovingSelected(true);

        try {
            const response = await fetch(
                `${API_URL}/submissions/school-years/${selectedSchoolYearId}/approve-selected`,
                {
                    method: "POST",
                    headers: authHeaders({ "Content-Type": "application/json" }),
                    body: JSON.stringify({ lrns }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to approve the selected records.");
            }

            setActionMessage(data.message);
            if (data.skipped?.length) {
                // The success banner is hidden while an error shows, so the
                // count goes in here too.
                setError(
                    `${data.message} Not approved: ${data.skipped.map((item) => `${item.lrn} (${item.message})`).join("; ")}`
                );
            }
            setSelectedLrns(new Set());
            await fetchStudents({ silent: true });
        } catch (approveError) {
            setError(approveError.message || "Failed to approve the selected records.");
        } finally {
            setApprovingSelected(false);
        }
    };

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
            await fetchStudents({ silent: true });
        });

    const requestRevision = async (classRecordId) => {
        if (!revisionReason.trim()) {
            setError("A reason is required so the teacher knows what to correct.");
            return;
        }

        setActionMessage("");
        setError("");
        setPendingClassRecordIds((previous) => new Set(previous).add(classRecordId));

        try {
            const response = await fetch(
                `${API_URL}/consolidation/class-records/${classRecordId}/request-revision`,
                {
                    method: "POST",
                    headers: authHeaders({ "Content-Type": "application/json" }),
                    body: JSON.stringify({ remarks: revisionReason }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to request revision.");
            }

            setActionMessage("Revision requested. The teacher has been notified.");
            setRevisingClassRecordId(null);
            setRevisionReason("");
            await fetchStudents({ silent: true });
        } catch (actionError) {
            setError(actionError.message || "Failed to request revision.");
        } finally {
            setPendingClassRecordIds((previous) => {
                const next = new Set(previous);
                next.delete(classRecordId);
                return next;
            });
        }
    };

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
            await fetchStudents({ silent: true });
        } catch (submitError) {
            setError(submitError.message || "Failed to submit records for approval.");
        }
    };

    // Display only: a learner not yet submitted whose every subject is in,
    // validated and graded (the server's ready_for_submission) is shown as
    // Ready - the same test as the bulk-submit eligibility count below.
    const displayStatusOf = (student) =>
        student.submission.status === "Not Submitted" && student.ready_for_submission
            ? "ready"
            : student.submission.status;

    // Status tabs above the list. Client-side only: every student is
    // already loaded, the tabs just narrow what's shown.
    const FILTERS = [
        { key: "all", label: "All", test: () => true },
        { key: "ready", label: "Ready", test: (student) => displayStatusOf(student) === "ready" },
        { key: "incomplete", label: "Incomplete", test: (student) => !student.all_subjects_submitted },
        {
            key: "pending",
            label: "Pending approval",
            test: (student) => student.submission.status === "Pending Approval",
        },
        {
            key: "returned",
            label: "Returned",
            test: (student) => ["Rejected", "Amendment Requested"].includes(student.submission.status),
        },
        { key: "approved", label: "Approved", test: (student) => student.submission.status === "Approved" },
    ];

    const activeFilter = FILTERS.find((filter) => filter.key === statusFilter) || FILTERS[0];
    const normalizedQuery = searchQuery.trim().toLowerCase();

    const filteredStudents = (students || []).filter(
        (student) =>
            activeFilter.test(student) &&
            (!normalizedQuery ||
                student.lrn.includes(normalizedQuery) ||
                `${student.last_name}, ${student.first_name}`.toLowerCase().includes(normalizedQuery) ||
                `${student.first_name} ${student.last_name}`.toLowerCase().includes(normalizedQuery))
    );

    const totalPages = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE));
    const pagedStudents = filteredStudents.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    const pageStartIndex = (currentPage - 1) * PAGE_SIZE;

    const eligibleForBulkSubmit =
        students?.filter(
            (student) =>
                student.ready_for_submission &&
                !["Approved", "Pending Approval"].includes(student.submission.status)
        ).length || 0;

    const isAdviser = user.role === "adviser";
    const isAdmin = user.role === "admin";

    // "Select all" covers the Pending records the Administrator can see
    // after the search and status filters, not ones hidden by them.
    const selectablePending = filteredStudents.filter(
        (student) => student.submission.status === "Pending Approval"
    );
    const allPendingSelected =
        selectablePending.length > 0 && selectablePending.every((student) => selectedLrns.has(student.lrn));

    const toggleSelectAllPending = () => {
        setSelectedLrns(
            allPendingSelected ? new Set() : new Set(selectablePending.map((student) => student.lrn))
        );
    };
    const subjectColumnCount = isAdviser ? 8 : 7;

    return (
        <div className="dashboard-layout">

            <Sidebar activeKey="consolidated-records" />

            <main className="dashboard-main">

                <header className="dashboard-header">
                    <div>
                        <h1>{isAdviser ? "Consolidated Records" : "Submission Review"}</h1>
                        <p>
                            Each learner's grades merged across every subject uploaded for the selected
                            school year.
                        </p>
                    </div>

                    <div className="school-year cr-header-filters">
                        <span className="cr-header-filter">
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
                        </span>

                        {showSectionPicker && (
                            <span className="cr-header-filter">
                                <span className="cr-header-sep" aria-hidden="true" />
                                <label htmlFor="cr-section-select">Section:</label>
                                <select
                                    id="cr-section-select"
                                    className="school-year-select"
                                    value={sectionFilterId || ""}
                                    onChange={(e) => changeSectionFilter(e.target.value)}
                                    disabled={loadingSchoolYears}
                                >
                                    <option value="">All sections</option>
                                    {sections.map((section) => (
                                        <option key={section.section_id} value={section.section_id}>
                                            {sectionLabel(section)}
                                        </option>
                                    ))}
                                </select>
                            </span>
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
                            {sectionFilterId
                                ? `No learners in ${sectionFilterLabel || "this section"} yet. Learners appear here once their subjects are uploaded.`
                                : isAdviser
                                    ? "No students to show for this school year yet. Advisers only see learners in the section they are assigned to as Class Adviser."
                                    : "No students to show for this school year yet. Learners appear here once their subjects are uploaded."}
                        </div>
                    )}

                    {!loadingSchoolYears && !loadingStudents && students && students.length > 0 && (
                        <div className="content-card cr-card">

                            {/* TOOLBAR: search + bulk action, then the status tabs */}
                            <div className="cr-toolbar">
                                <div className="cr-toolbar-row">
                                    <label className="cr-search">
                                        <Search size={16} aria-hidden="true" />
                                        <input
                                            type="search"
                                            value={searchQuery}
                                            onChange={(e) => {
                                                setSearchQuery(e.target.value);
                                                setCurrentPage(1);
                                            }}
                                            placeholder="Search by name or LRN"
                                            aria-label="Search learners by name or LRN"
                                        />
                                    </label>

                                    {sectionFilterId && !showSectionPicker && (
                                        <span className="cr-filter-chip">
                                            Section: {sectionFilterLabel || `#${sectionFilterId}`}
                                            <button
                                                type="button"
                                                onClick={clearSectionFilter}
                                                aria-label="Clear section filter"
                                            >
                                                <X size={14} />
                                            </button>
                                        </span>
                                    )}

                                    {isAdviser && (
                                        <button
                                            type="button"
                                            className="cr-btn cr-btn-primary cr-bulk"
                                            onClick={submitAllEligible}
                                            disabled={eligibleForBulkSubmit === 0}
                                        >
                                            <Send size={15} />
                                            Submit all eligible ({eligibleForBulkSubmit})
                                        </button>
                                    )}

                                    {isAdmin && selectablePending.length > 0 && (
                                        <div className="cr-bulk cr-bulk-approve">
                                            <label className="cr-select-all">
                                                <input
                                                    type="checkbox"
                                                    checked={allPendingSelected}
                                                    onChange={toggleSelectAllPending}
                                                />
                                                Select all pending ({selectablePending.length})
                                            </label>

                                            <button
                                                type="button"
                                                className="cr-btn cr-btn-approve"
                                                onClick={approveSelected}
                                                disabled={selectedLrns.size === 0 || approvingSelected}
                                            >
                                                <CheckCircle size={15} />
                                                Approve selected ({selectedLrns.size})
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="cr-tabs" role="tablist" aria-label="Filter by status">
                                    {FILTERS.map((filter) => {
                                        const count = students.filter(filter.test).length;

                                        return (
                                            <button
                                                type="button"
                                                role="tab"
                                                aria-selected={statusFilter === filter.key}
                                                key={filter.key}
                                                className={`cr-tab${statusFilter === filter.key ? " is-active" : ""}`}
                                                onClick={() => {
                                                    setStatusFilter(filter.key);
                                                    setCurrentPage(1);
                                                }}
                                            >
                                                {filter.label}
                                                <span className="cr-tab-count">{count}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Column labels for the student rows */}
                            <div className="cr-list-head" aria-hidden="true">
                                <span />
                                <span>Learner</span>
                                <span>Subjects</span>
                                <span>Status</span>
                                <span className="cr-col-action">{filteredStudents.length > 0 ? "Action" : ""}</span>
                            </div>

                            {filteredStudents.length === 0 && (
                                <p className="cr-no-match">
                                    No learners match{normalizedQuery ? ` "${searchQuery.trim()}"` : ""}
                                    {statusFilter !== "all" ? ` in ${activeFilter.label}` : ""}.
                                </p>
                            )}

                            {pagedStudents.map((student) => {
                                const isExpanded = expandedLrns.has(student.lrn);
                                const isPending = pendingLrns.has(student.lrn);
                                const submissionStatus = student.submission.status;
                                const displayStatus = displayStatusOf(student);
                                const isHighlighted = student.lrn === highlightedLrn;
                                const canSubmit =
                                    isAdviser &&
                                    student.ready_for_submission &&
                                    ["Not Submitted", "Rejected", "Amendment Requested"].includes(submissionStatus);

                                return (
                                    <div
                                        key={student.lrn}
                                        ref={isHighlighted ? highlightedRowRef : undefined}
                                        className={`cr-student-row${isHighlighted ? " highlighted" : ""}${isExpanded ? " is-open" : ""}`}
                                    >
                                        <div className="cr-row-summary">
                                            <button
                                                type="button"
                                                className="cr-row-toggle"
                                                onClick={() => toggleExpanded(student.lrn)}
                                                aria-expanded={isExpanded}
                                            >
                                                <ChevronDown size={18} className="cr-chevron" aria-hidden="true" />

                                                <span className="cr-learner">
                                                    <span className="name">
                                                        {student.last_name}, {student.first_name}
                                                    </span>
                                                    <span className="meta">
                                                        LRN <span className="record-lrn">{student.lrn}</span> · Grade {student.grade_level}
                                                        {sectionNameById.has(String(student.section_id)) && (
                                                            <> · {sectionNameById.get(String(student.section_id))}</>
                                                        )}
                                                    </span>
                                                </span>
                                            </button>

                                            <span
                                                className={`cr-subject-count${student.ready_for_submission ? " is-complete" : " is-incomplete"}`}
                                                title={
                                                    !student.all_subjects_submitted
                                                        ? "Some subjects are still missing"
                                                        : student.ready_for_submission
                                                          ? "Every subject has a validated grade"
                                                          : `Not ready: ${(student.subjects_not_ready || [])
                                                                .map((subject) => `${subject.subject_name} (${subject.reason})`)
                                                                .join(", ")}`
                                                }
                                            >
                                                {student.ready_for_submission ? (
                                                    <CheckCircle size={15} aria-hidden="true" />
                                                ) : (
                                                    <AlertTriangle size={15} aria-hidden="true" />
                                                )}
                                                {student.subjects_recorded}
                                                {student.subjects_expected !== null ? ` / ${student.subjects_expected}` : ""}
                                                <span className="cr-sr-only">
                                                    {student.ready_for_submission
                                                        ? " subjects, complete"
                                                        : student.all_subjects_submitted
                                                          ? " subjects, not ready"
                                                          : " subjects, incomplete"}
                                                </span>
                                            </span>

                                            <span className="cr-col-status">
                                                <StatusBadge status={displayStatus} />
                                            </span>

                                            <div className="cr-row-actions">
                                                {canSubmit && (
                                                    <button
                                                        type="button"
                                                        className="cr-btn cr-btn-outline"
                                                        onClick={() => submitForApproval(student.lrn)}
                                                        disabled={isPending}
                                                    >
                                                        <Send size={14} />
                                                        Submit
                                                    </button>
                                                )}

                                                {user.role === "admin" && submissionStatus === "Pending Approval" && (
                                                    <>
                                                        <label className="cr-select-row" title="Select for Approve selected">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedLrns.has(student.lrn)}
                                                                onChange={() => toggleSelected(student.lrn)}
                                                                disabled={isPending || approvingSelected}
                                                                aria-label={`Select ${student.last_name}, ${student.first_name} for approval`}
                                                            />
                                                        </label>

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
                                            <div className="cr-note is-danger">
                                                <XCircle size={15} aria-hidden="true" />
                                                <span>
                                                    <strong>Returned by the Administrator:</strong> {student.submission.remarks}
                                                </span>
                                            </div>
                                        )}

                                        {submissionStatus === "Amendment Requested" && (
                                            <div className="cr-note is-warning">
                                                <AlertTriangle size={15} aria-hidden="true" />
                                                <span>
                                                    This record was previously approved, but a subject below was
                                                    flagged for revision and reopened it. Once the teacher's
                                                    correction is in, resolve the flag and submit again.
                                                </span>
                                            </div>
                                        )}

                                        {isExpanded && (
                                            <div className="cr-subjects-panel">
                                                <table className="cr-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Subject</th>
                                                            <th>Teacher</th>
                                                            <th className="cr-num">Term 1</th>
                                                            <th className="cr-num">Term 2</th>
                                                            <th className="cr-num">Term 3</th>
                                                            <th className="cr-num">Final</th>
                                                            <th>Status</th>
                                                            {isAdviser && <th className="cr-col-action"><span className="cr-sr-only">Actions</span></th>}
                                                        </tr>
                                                    </thead>

                                                    <tbody>
                                                        {student.subjects.map((subject) => {
                                                            const isRevisionRequested =
                                                                subject.status === "Needs Revision";
                                                            const isRevisionPanelOpen =
                                                                revisingClassRecordId === subject.class_record_id;
                                                            const isRevisionPending = pendingClassRecordIds.has(
                                                                subject.class_record_id
                                                            );

                                                            return (
                                                                <Fragment key={subject.subject_id}>
                                                                    <tr className={isRevisionPanelOpen ? "is-revising" : undefined}>
                                                                        <td className="cr-subject-name">{subject.subject_name}</td>
                                                                        <td className="cr-teacher">{subject.teacher_name}</td>
                                                                        <td className="cr-num"><GradeCell value={subject.term_1} /></td>
                                                                        <td className="cr-num"><GradeCell value={subject.term_2} /></td>
                                                                        <td className="cr-num"><GradeCell value={subject.term_3} /></td>
                                                                        <td className="cr-num final-grade">
                                                                            <GradeCell value={subject.final_grade} />
                                                                        </td>
                                                                        <td>
                                                                            <StatusBadge status={subject.status || "Uploaded"} />
                                                                        </td>

                                                                        {isAdviser && (
                                                                            <td className="cr-col-action">
                                                                                {!isRevisionRequested && (
                                                                                    <button
                                                                                        type="button"
                                                                                        className="cr-btn cr-btn-link"
                                                                                        onClick={() => {
                                                                                            setRevisingClassRecordId(
                                                                                                isRevisionPanelOpen
                                                                                                    ? null
                                                                                                    : subject.class_record_id
                                                                                            );
                                                                                            setRevisionReason("");
                                                                                        }}
                                                                                        disabled={isRevisionPending}
                                                                                    >
                                                                                        <Undo2 size={14} />
                                                                                        Request revision
                                                                                    </button>
                                                                                )}
                                                                            </td>
                                                                        )}
                                                                    </tr>

                                                                    {isRevisionRequested && subject.revision_remarks && (
                                                                        <tr>
                                                                            <td
                                                                                colSpan={subjectColumnCount}
                                                                                className="cr-revision-remarks-cell"
                                                                            >
                                                                                <strong>Revision reason:</strong> {subject.revision_remarks}
                                                                            </td>
                                                                        </tr>
                                                                    )}

                                                                    {isRevisionPanelOpen && (
                                                                        <tr className="is-revising">
                                                                            <td colSpan={subjectColumnCount}>
                                                                                <div className="cr-reject-panel is-inline">
                                                                                    <textarea
                                                                                        className="cr-reject-textarea"
                                                                                        value={revisionReason}
                                                                                        onChange={(e) =>
                                                                                            setRevisionReason(e.target.value)
                                                                                        }
                                                                                        placeholder={`Reason this ${subject.subject_name} upload needs revision (shown to the teacher)`}
                                                                                        rows={2}
                                                                                    />

                                                                                    <button
                                                                                        type="button"
                                                                                        className="cr-btn cr-btn-revision"
                                                                                        onClick={() =>
                                                                                            requestRevision(
                                                                                                subject.class_record_id
                                                                                            )
                                                                                        }
                                                                                        disabled={isRevisionPending}
                                                                                    >
                                                                                        Confirm Request
                                                                                    </button>

                                                                                    <button
                                                                                        type="button"
                                                                                        className="cr-btn cr-btn-cancel"
                                                                                        onClick={() => {
                                                                                            setRevisingClassRecordId(null);
                                                                                            setRevisionReason("");
                                                                                        }}
                                                                                    >
                                                                                        Cancel
                                                                                    </button>
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    )}
                                                                </Fragment>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {/* FOOTER: count + pagination */}
                            <div className="cr-list-foot">
                                <span>
                                    {filteredStudents.length === 0
                                        ? `0 of ${students.length} learners`
                                        : `Showing ${pageStartIndex + 1}–${Math.min(pageStartIndex + PAGE_SIZE, filteredStudents.length)} of ${filteredStudents.length}${filteredStudents.length !== students.length ? ` (of ${students.length})` : ""} learners`}
                                </span>

                                {totalPages > 1 && (
                                    <div className="cr-pagination">
                                        <button
                                            type="button"
                                            className="cr-btn cr-btn-cancel"
                                            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                                            disabled={currentPage === 1}
                                        >
                                            Previous
                                        </button>

                                        <span className="cr-pagination-status">
                                            Page {currentPage} of {totalPages}
                                        </span>

                                        <button
                                            type="button"
                                            className="cr-btn cr-btn-cancel"
                                            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                                            disabled={currentPage === totalPages}
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                </section>

            </main>

        </div>
    );
}

export default ConsolidatedRecords;
