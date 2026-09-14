import { useEffect, useState } from "react";
import {
    AlertTriangle,
    BarChart3,
    CheckCircle2,
    ClipboardList,
    Loader2,
    TrendingUp,
} from "lucide-react";

import "./Dashboard.css";
import "./Analytics.css";
import Sidebar from "../components/Sidebar";
import { getToken } from "../utils/session";

const API_URL = "http://localhost:5000/api";

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
            } catch (fetchError) {
                setError(fetchError.message || "Failed to load analytics.");
                setAnalytics(null);
            } finally {
                setLoadingAnalytics(false);
            }
        };

        fetchAnalytics();
    }, [selectedSchoolYearId]);

    const isLoading = loadingSchoolYears || loadingAnalytics;
    const overview = analytics?.overview;
    const hasData = overview && overview.graded_entries > 0;
    const maxBandCount = hasData
        ? Math.max(...analytics.grade_distribution.map((band) => band.count))
        : 0;

    return (
        <div className="dashboard-layout">

            <Sidebar activeKey="analytics" />

            <main className="dashboard-main">

                <header className="dashboard-header">
                    <div>
                        <h1>Academic Analytics</h1>
                        <p>
                            School-wide grade performance — distribution, sections, and
                            subjects, for the selected school year.
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

                            <div className="content-card an-panel">
                                <div className="card-header">
                                    <h3>Grade Distribution</h3>
                                </div>

                                <div className="an-distribution">
                                    {analytics.grade_distribution.map((band) => {
                                        const barPercent =
                                            maxBandCount > 0 ? (band.count / maxBandCount) * 100 : 0;

                                        return (
                                            <div className="an-band-row" key={band.band}>
                                                <div className="an-band-label">
                                                    <span className="an-band-range">{band.band}</span>
                                                    <span className="an-band-descriptor">
                                                        {band.label}
                                                    </span>
                                                </div>

                                                <div className="an-band-bar-track">
                                                    <div
                                                        className="an-band-bar-fill"
                                                        style={{ width: `${barPercent}%` }}
                                                    />
                                                </div>

                                                <span className="an-band-count">{band.count}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="content-card an-panel">
                                <div className="card-header">
                                    <h3>Section Performance</h3>
                                </div>

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
                                                    <th>Graded Entries</th>
                                                    <th>Average Grade</th>
                                                    <th>Pass Rate</th>
                                                    <th>At-Risk</th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {analytics.section_performance.map((section) => (
                                                    <tr key={section.section_id}>
                                                        <td>{section.section_name}</td>
                                                        <td>Grade {section.grade_level}</td>
                                                        <td>{section.graded_entries}</td>
                                                        <td className="an-cell-strong">
                                                            {section.average_final_grade}
                                                        </td>
                                                        <td>{section.pass_rate}%</td>
                                                        <td>
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

                            <div className="content-card an-panel">
                                <div className="card-header">
                                    <h3>Subject Performance</h3>
                                </div>

                                <div className="an-table-wrap">
                                    <table className="an-table">
                                        <thead>
                                            <tr>
                                                <th>Subject</th>
                                                <th>Grade Level</th>
                                                <th>Graded Entries</th>
                                                <th>Average Grade</th>
                                                <th>Pass Rate</th>
                                                <th>At-Risk</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {analytics.subject_performance.map((subject) => (
                                                <tr key={subject.subject_id}>
                                                    <td>{subject.subject_name}</td>
                                                    <td>Grade {subject.grade_level}</td>
                                                    <td>{subject.graded_entries}</td>
                                                    <td className="an-cell-strong">
                                                        {subject.average_final_grade}
                                                    </td>
                                                    <td>{subject.pass_rate}%</td>
                                                    <td>
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
                        </>
                    )}

                </section>

            </main>

        </div>
    );
}

export default Analytics;
