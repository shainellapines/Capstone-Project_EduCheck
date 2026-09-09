import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    AlertTriangle,
    ArrowRight,
    GraduationCap,
    Loader2,
    Users,
} from "lucide-react";

import "./Dashboard.css";
import "./SectionProgress.css";
import Sidebar from "../components/Sidebar";
import { getToken } from "../utils/session";

const API_URL = "http://localhost:5000/api";

const EMPTY_SUBMISSION_COUNTS = {
    "Not Submitted": 0,
    "Pending Approval": 0,
    "Approved": 0,
    "Rejected": 0,
};

// Section-level consolidation view (SPMP v1.0) — complements the
// per-student ConsolidatedRecords page with "which sections/subjects
// still need attention" at a glance: how many of a section's expected
// learning areas have a submitted upload yet, and where its students sit
// in the Adviser->Admin approval workflow. "View Students" drills into
// ConsolidatedRecords filtered to that one section.
function SectionProgress() {
    const navigate = useNavigate();

    const [schoolYears, setSchoolYears] = useState([]);
    const [selectedSchoolYearId, setSelectedSchoolYearId] = useState("");
    const [loadingSchoolYears, setLoadingSchoolYears] = useState(true);

    const [sections, setSections] = useState(null);
    const [loadingSections, setLoadingSections] = useState(false);
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

        const fetchSections = async () => {
            try {
                setLoadingSections(true);
                setError("");

                const response = await fetch(
                    `${API_URL}/consolidation/school-years/${selectedSchoolYearId}/sections`,
                    { headers: authHeaders() }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Failed to load section progress.");
                }

                setSections(data.sections || []);
            } catch (fetchError) {
                setError(fetchError.message || "Failed to load section progress.");
                setSections(null);
            } finally {
                setLoadingSections(false);
            }
        };

        fetchSections();
    }, [selectedSchoolYearId]);

    // section_label is passed along purely for display — so
    // ConsolidatedRecords can show "Filtered by: Grade 6 — Rizal" without a
    // second round trip just to look the name back up.
    const viewSectionStudents = (section) => {
        const sectionLabel = encodeURIComponent(`Grade ${section.grade_level} — ${section.section_name}`);

        navigate(
            `/consolidated-records?year=${selectedSchoolYearId}&section=${section.section_id}&section_label=${sectionLabel}`
        );
    };

    return (
        <div className="dashboard-layout">

            <Sidebar activeKey="section-progress" />

            <main className="dashboard-main">

                <header className="dashboard-header">
                    <div>
                        <h1>Section Progress</h1>
                        <p>
                            How many learning areas each section has submitted, and where its
                            students stand in the approval workflow.
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

                    {error && (
                        <div className="error-banner">
                            <AlertTriangle size={20} />
                            <span>{error}</span>
                        </div>
                    )}

                    {(loadingSchoolYears || loadingSections) && (
                        <div className="loading-state">
                            <Loader2 size={20} className="spin-icon" />
                            Loading...
                        </div>
                    )}

                    {!loadingSchoolYears && !loadingSections && sections && sections.length === 0 && (
                        <div className="content-card empty-state-card">
                            <Users size={20} />
                            No sections have been configured yet. Set them up in Section &amp;
                            Teacher Assignments.
                        </div>
                    )}

                    {!loadingSchoolYears && !loadingSections && sections && sections.length > 0 && (
                        <div className="sp-grid">
                            {sections.map((section) => {
                                const submissionCounts =
                                    section.submission_status_counts || EMPTY_SUBMISSION_COUNTS;

                                const progressPercent =
                                    section.subjects_expected > 0
                                        ? Math.round(
                                            (section.subjects_submitted / section.subjects_expected) * 100
                                        )
                                        : 0;

                                return (
                                    <div className="content-card sp-card" key={section.section_id}>
                                        <div className="sp-card-header">
                                            <div>
                                                <h3>
                                                    Grade {section.grade_level} — {section.section_name}
                                                </h3>
                                                <span className="sp-staffing-pill">
                                                    {section.staffing_mode}
                                                </span>
                                            </div>

                                            <div className="sp-student-count">
                                                <GraduationCap size={16} />
                                                {section.student_count} student
                                                {section.student_count === 1 ? "" : "s"}
                                            </div>
                                        </div>

                                        <div className="sp-progress-block">
                                            <div className="sp-progress-label">
                                                <span>
                                                    {section.subjects_submitted} of{" "}
                                                    {section.subjects_expected} learning areas submitted
                                                </span>
                                                <span>{progressPercent}%</span>
                                            </div>

                                            <div className="sp-progress-bar">
                                                <div
                                                    className="sp-progress-fill"
                                                    style={{ width: `${progressPercent}%` }}
                                                />
                                            </div>
                                        </div>

                                        {(section.subjects_needs_revision > 0 ||
                                            section.subjects_needs_attention > 0 ||
                                            section.subjects_not_started > 0) && (
                                            <div className="sp-subject-tags">
                                                {section.subjects_needs_revision > 0 && (
                                                    <span className="sp-tag sp-tag-revision">
                                                        {section.subjects_needs_revision} needs revision
                                                    </span>
                                                )}

                                                {section.subjects_needs_attention > 0 && (
                                                    <span className="sp-tag sp-tag-attention">
                                                        {section.subjects_needs_attention} needs attention
                                                    </span>
                                                )}

                                                {section.subjects_not_started > 0 && (
                                                    <span className="sp-tag sp-tag-pending">
                                                        {section.subjects_not_started} not started
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        <div className="sp-submission-row">
                                            <span className="sp-submission-item not-submitted">
                                                {submissionCounts["Not Submitted"]} Not Submitted
                                            </span>
                                            <span className="sp-submission-item pending-approval">
                                                {submissionCounts["Pending Approval"]} Pending
                                            </span>
                                            <span className="sp-submission-item approved">
                                                {submissionCounts["Approved"]} Approved
                                            </span>
                                            <span className="sp-submission-item rejected">
                                                {submissionCounts["Rejected"]} Rejected
                                            </span>
                                        </div>

                                        <button
                                            type="button"
                                            className="sp-view-button"
                                            onClick={() => viewSectionStudents(section)}
                                            disabled={section.student_count === 0}
                                        >
                                            View Students
                                            <ArrowRight size={14} />
                                        </button>
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

export default SectionProgress;
