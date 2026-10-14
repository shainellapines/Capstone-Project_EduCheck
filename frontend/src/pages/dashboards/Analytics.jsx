import { useEffect, useState } from "react";
import {
    AlertTriangle,
    BarChart3,
    CheckCircle2,
    ClipboardList,
    Loader2,
    TrendingUp,
} from "lucide-react";

import "../../styles/Dashboard.css";
import "./Analytics.css";
import Sidebar from "../../components/Sidebar";
import { SubjectRangeChart, TermTrendChart } from "./AnalyticsCharts";
import { getToken, getStoredUser } from "../../utils/session";
import { API_URL } from "../../config";


// Grade bands are ORDINAL (position in a performance sequence), not
// categorical — color encodes "which tier," bar length encodes "how many
// students." The four passing tiers share one green ramp (light->dark =
// lower->higher achievement); "Below 75" breaks the ramp entirely into the
// reserved danger/status color, since it isn't "one tier lower," it's a
// different state (failing) that needs to read as distinct at a glance.
const BAND_TONE = {
    "90-100": "outstanding",
    "85-89": "very-satisfactory",
    "80-84": "satisfactory",
    "75-79": "fairly-satisfactory",
    "Below 75": "below-passing",
};

// Same status scale, three fixed steps by how far below passing — not a
// generated gradient, so "48" and "74" never read as equally urgent.
function severityClass(grade) {
    if (grade < 60) return "severity-critical";
    if (grade < 70) return "severity-serious";
    return "severity-warning";
}

// Shared "Academic Analytics" (Admin/Principal label) / "Performance
// Analytics" (Adviser label) page — one page and one endpoint behind both
// nav entries, same pattern as Consolidated Records/Section Progress
// already being one shared page for every role that can see it. Pulls
// aggregated numbers from /api/analytics rather than reusing the raw
// per-student endpoint — this needs distribution/section/subject roll-ups,
// not the row-per-student shape ConsolidatedRecords already handles.
function Analytics() {
    const [schoolYears, setSchoolYears] = useState([]);
    const [selectedSchoolYearId, setSelectedSchoolYearId] = useState("");
    const [loadingSchoolYears, setLoadingSchoolYears] = useState(true);

    const [analytics, setAnalytics] = useState(null);
    const [loadingAnalytics, setLoadingAnalytics] = useState(false);
    const [error, setError] = useState("");

    // Chart controls: the subject drawn against the overall term trend, and
    // the grade level the subject chart shows (Admin/Principal span several).
    const [compareSubjectId, setCompareSubjectId] = useState("");
    const [subjectGradeLevel, setSubjectGradeLevel] = useState("");

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

        const fetchAnalytics = async () => {
            try {
                setLoadingAnalytics(true);
                setError("");

                const response = await fetch(
                    `${API_URL}/analytics/school-years/${selectedSchoolYearId}`,
                    { headers: authHeaders() }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Failed to load analytics.");
                }

                setAnalytics(data);
                setCompareSubjectId("");
                setSubjectGradeLevel("");
            } catch (fetchError) {
                setError(fetchError.message || "Failed to load analytics.");
                setAnalytics(null);
            } finally {
                setLoadingAnalytics(false);
            }
        };

        fetchAnalytics();
    }, [selectedSchoolYearId]);

    // The backend already scopes an Adviser to their own section
    // (utils/sectionScope.js); the header just has to say so.
    const isAdviser = getStoredUser()?.role === "adviser";
    const isLoading = loadingSchoolYears || loadingAnalytics;
    const overview = analytics?.overview;
    const hasData = overview && overview.graded_entries > 0;
    const maxBandCount = hasData
        ? Math.max(...analytics.grade_distribution.map((band) => band.count))
        : 0;

    const scopeLabel = isAdviser ? "Your section" : "All sections";
    const termTrend = analytics?.term_trend || [];
    const hasTermData = termTrend.some((point) => point.average !== null);
    const subjects = analytics?.subject_performance || [];

    const gradeLevels = Array.from(new Set(subjects.map((subject) => String(subject.grade_level)))).sort(
        (a, b) => Number(a) - Number(b)
    );
    const activeGradeLevel = subjectGradeLevel || gradeLevels[0] || "";
    const visibleSubjects =
        gradeLevels.length > 1
            ? subjects.filter((subject) => String(subject.grade_level) === activeGradeLevel)
            : subjects;

    // Subject names repeat across grade levels, so name the grade when
    // more than one is on the page.
    const subjectOptionLabel = (subject) =>
        gradeLevels.length > 1 ? `${subject.subject_name} (Grade ${subject.grade_level})` : subject.subject_name;

    const compareSubject = subjects.find((subject) => String(subject.subject_id) === compareSubjectId);
    const overallSeries = {
        key: "overall",
        label: isAdviser ? "Section average" : "School average",
        points: termTrend,
    };
    const trendSeries = compareSubject
        ? [
            { ...overallSeries, tone: "context" },
            {
                key: "subject",
                label: subjectOptionLabel(compareSubject),
                tone: "accent",
                points: compareSubject.term_trend,
            },
        ]
        : [{ ...overallSeries, tone: "accent" }];

    return (
        <div className="dashboard-layout">

            <Sidebar activeKey="analytics" />

            <main className="dashboard-main">

                <header className="dashboard-header">
                    <div>
                        <h1>{isAdviser ? "Performance Analytics" : "Academic Analytics"}</h1>
                        <p>
                            {isAdviser ? "Your section's" : "School-wide"} grade performance and the intervention flag list —
                            distribution, sections, subjects, and at-risk students, for the
                            selected school year.
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

                    {isLoading && (
                        <div className="loading-state">
                            <Loader2 size={20} className="spin-icon" />
                            Loading analytics...
                        </div>
                    )}

                    {!isLoading && analytics && !hasData && (
                        <div className="content-card empty-state-card">
                            <BarChart3 size={20} />
                            No graded uploads yet for {analytics.school_year.school_year} — numbers
                            will appear here once class records are validated.
                        </div>
                    )}

                    {!isLoading && hasData && (
                        <>
                            <div className="overview-grid">

                                <div className="overview-card">
                                    <div>
                                        <span>Graded Entries</span>
                                        <strong>{overview.graded_entries}</strong>
                                    </div>

                                    <div className="card-icon blue">
                                        <ClipboardList size={23} />
                                    </div>
                                </div>

                                <div className="overview-card">
                                    <div>
                                        <span>Average Final Grade</span>
                                        <strong className="green-text">
                                            {overview.average_final_grade}
                                        </strong>
                                    </div>

                                    <div className="card-icon green">
                                        <TrendingUp size={23} />
                                    </div>
                                </div>

                                <div className="overview-card">
                                    <div>
                                        <span>Pass Rate ({analytics.passing_grade}+)</span>
                                        <strong className="purple-text">
                                            {overview.pass_rate}%
                                        </strong>
                                    </div>

                                    <div className="card-icon purple">
                                        <CheckCircle2 size={23} />
                                    </div>
                                </div>

                                <div className="overview-card">
                                    <div>
                                        <span>At-Risk Entries</span>
                                        <strong className="red-text">
                                            {overview.at_risk_count}
                                        </strong>
                                    </div>

                                    <div className="card-icon red">
                                        <AlertTriangle size={23} />
                                    </div>
                                </div>

                            </div>

                            <div className="content-card an-panel an-intervention-panel">
                                <div className="card-header">
                                    <h3>
                                        <AlertTriangle size={17} className="an-header-icon" />
                                        Intervention Flag List
                                    </h3>
                                </div>

                                <div className="an-panel-body">
                                    {analytics.intervention_flags.length === 0 ? (
                                        <p className="an-empty-note">
                                            No students are currently below the passing grade (
                                            {analytics.passing_grade}) for this school year.
                                        </p>
                                    ) : (
                                        <div className="an-table-wrap">
                                            <table className="an-table">
                                                <thead>
                                                    <tr>
                                                        <th>Student</th>
                                                        <th>Section</th>
                                                        <th>Failing Subjects</th>
                                                        <th>Lowest Grade</th>
                                                    </tr>
                                                </thead>

                                                <tbody>
                                                    {analytics.intervention_flags.map((student) => (
                                                        <tr
                                                            key={student.lrn}
                                                            className={`an-flag-row ${severityClass(student.lowest_grade)}`}
                                                        >
                                                            <td className="an-cell-strong">
                                                                {student.last_name}, {student.first_name}
                                                            </td>
                                                            <td>
                                                                {student.section_name
                                                                    ? `${student.section_name} (Grade ${student.grade_level})`
                                                                    : "Unassigned"}
                                                            </td>
                                                            <td>
                                                                <div className="an-flag-subjects">
                                                                    {student.failing_subjects.map((subject) => (
                                                                        <span
                                                                            className="an-flag-subject-pill"
                                                                            key={subject.subject_id}
                                                                        >
                                                                            {subject.subject_name} (
                                                                            {subject.final_grade})
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <span
                                                                    className={`an-severity-pill ${severityClass(student.lowest_grade)}`}
                                                                >
                                                                    {student.lowest_grade}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="an-chart-grid">

                                {/* TERM TREND */}
                                <div className="content-card an-panel">
                                    <div className="card-header an-card-header">
                                        <div>
                                            <h3>Grade Trend by Term</h3>
                                            <p className="an-card-subtitle">
                                                Average grade in each term, {scopeLabel.toLowerCase()}
                                            </p>
                                        </div>

                                        {analytics.subject_performance.length > 1 && (
                                            <label className="an-control">
                                                Compare
                                                <select
                                                    className="school-year-select"
                                                    value={compareSubjectId}
                                                    onChange={(e) => setCompareSubjectId(e.target.value)}
                                                >
                                                    <option value="">No subject</option>
                                                    {analytics.subject_performance.map((subject) => (
                                                        <option key={subject.subject_id} value={subject.subject_id}>
                                                            {subjectOptionLabel(subject)}
                                                        </option>
                                                    ))}
                                                </select>
                                            </label>
                                        )}
                                    </div>

                                    <div className="an-panel-body">
                                        {hasTermData ? (
                                            <TermTrendChart
                                                series={trendSeries}
                                                passingGrade={analytics.passing_grade}
                                            />
                                        ) : (
                                            <p className="an-empty-note">
                                                No term grades recorded yet for this school year.
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* GRADE DISTRIBUTION */}
                                <div className="content-card an-panel">
                                    <div className="card-header an-card-header">
                                        <div>
                                            <h3>Grade Distribution</h3>
                                            <p className="an-card-subtitle">
                                                Final grades by DepEd descriptor
                                            </p>
                                        </div>
                                    </div>

                                    <div className="an-panel-body">
                                        <div className="an-distribution">
                                            {analytics.grade_distribution.map((band) => {
                                                const barPercent =
                                                    maxBandCount > 0 ? (band.count / maxBandCount) * 100 : 0;
                                                const sharePercent =
                                                    overview.graded_entries > 0
                                                        ? Math.round((band.count / overview.graded_entries) * 100)
                                                        : 0;
                                                const tone = BAND_TONE[band.band] || "outstanding";

                                                return (
                                                    <div
                                                        className={`an-band-row tone-${tone}`}
                                                        key={band.band}
                                                        title={`${band.band} ${band.label}: ${band.count} (${sharePercent}%)`}
                                                    >
                                                        <div className="an-band-label">
                                                            <span className="an-band-range">{band.band}</span>
                                                            <span className="an-band-descriptor">
                                                                {band.label}
                                                            </span>
                                                        </div>

                                                        <div className="an-band-bar-track">
                                                            {band.count > 0 && (
                                                                <div
                                                                    className="an-band-bar-fill"
                                                                    style={{ width: `${Math.max(barPercent, 1.5)}%` }}
                                                                />
                                                            )}
                                                        </div>

                                                        <span className="an-band-count">
                                                            <strong>{band.count}</strong>
                                                            <span>{sharePercent}%</span>
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                            </div>

                            {/* SUBJECT PERFORMANCE */}
                            <div className="content-card an-panel">
                                <div className="card-header an-card-header">
                                    <div>
                                        <h3>Subject Performance</h3>
                                        <p className="an-card-subtitle">
                                            Average and spread of final grades per subject, highest first
                                        </p>
                                    </div>

                                    {gradeLevels.length > 1 && (
                                        <label className="an-control">
                                            Grade level
                                            <select
                                                className="school-year-select"
                                                value={activeGradeLevel}
                                                onChange={(e) => setSubjectGradeLevel(e.target.value)}
                                            >
                                                {gradeLevels.map((level) => (
                                                    <option key={level} value={level}>
                                                        Grade {level}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                    )}
                                </div>

                                <div className="an-panel-body">
                                    <SubjectRangeChart
                                        subjects={visibleSubjects}
                                        passingGrade={analytics.passing_grade}
                                    />

                                    <div className="an-table-wrap an-table-after-chart">
                                        <table className="an-table">
                                            <thead>
                                                <tr>
                                                    <th>Subject</th>
                                                    <th>Grade Level</th>
                                                    <th className="an-num">Graded Entries</th>
                                                    <th className="an-num">Average Grade</th>
                                                    <th className="an-num">Lowest</th>
                                                    <th className="an-num">Highest</th>
                                                    <th className="an-num">Pass Rate</th>
                                                    <th className="an-num">At-Risk</th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {visibleSubjects.map((subject) => (
                                                    <tr
                                                        key={subject.subject_id}
                                                        className={subject.at_risk_count > 0 ? "an-row-flagged" : undefined}
                                                    >
                                                        <td>{subject.subject_name}</td>
                                                        <td>Grade {subject.grade_level}</td>
                                                        <td className="an-num">{subject.graded_entries}</td>
                                                        <td className="an-num an-cell-strong">
                                                            {subject.average_final_grade}
                                                        </td>
                                                        <td className="an-num">{subject.lowest_final_grade}</td>
                                                        <td className="an-num">{subject.highest_final_grade}</td>
                                                        <td className="an-num">{subject.pass_rate}%</td>
                                                        <td className="an-num">
                                                            {subject.at_risk_count > 0 ? (
                                                                <span className="an-at-risk-pill">
                                                                    {subject.at_risk_count}
                                                                </span>
                                                            ) : (
                                                                "0"
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* SECTION PERFORMANCE */}
                            <div className="content-card an-panel">
                                <div className="card-header an-card-header">
                                    <div>
                                        <h3>Section Performance</h3>
                                    </div>
                                </div>

                                <div className="an-panel-body">
                                    {analytics.section_performance.length === 0 ? (
                                        <p className="an-empty-note">
                                            No graded entries are linked to an assigned section yet.
                                        </p>
                                    ) : (
                                        <div className="an-table-wrap">
                                            <table className="an-table">
                                                <thead>
                                                    <tr>
                                                        <th>Section</th>
                                                        <th>Grade Level</th>
                                                        <th className="an-num">Graded Entries</th>
                                                        <th className="an-num">Average Grade</th>
                                                        <th className="an-num">Pass Rate</th>
                                                        <th className="an-num">At-Risk</th>
                                                    </tr>
                                                </thead>

                                                <tbody>
                                                    {analytics.section_performance.map((section) => (
                                                        <tr
                                                            key={section.section_id}
                                                            className={section.at_risk_count > 0 ? "an-row-flagged" : undefined}
                                                        >
                                                            <td>{section.section_name}</td>
                                                            <td>Grade {section.grade_level}</td>
                                                            <td className="an-num">{section.graded_entries}</td>
                                                            <td className="an-num an-cell-strong">
                                                                {section.average_final_grade}
                                                            </td>
                                                            <td className="an-num">{section.pass_rate}%</td>
                                                            <td className="an-num">
                                                                {section.at_risk_count > 0 ? (
                                                                    <span className="an-at-risk-pill">
                                                                        {section.at_risk_count}
                                                                    </span>
                                                                ) : (
                                                                    "0"
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                </section>

            </main>

        </div>
    );
}

export default Analytics;
