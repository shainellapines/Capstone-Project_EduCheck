import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Search,
    AlertTriangle,
    Loader2,
    Users,
    IdCard,
} from "lucide-react";

import "./Dashboard.css";
import "./RecordsRepository.css";
import Sidebar from "../components/Sidebar";
import { API_URL } from "../config";


// sf10Mode: the same search, opened from the "SF10 Permanent Records" nav
// item - each result's main action opens that learner's permanent record.
function RecordsRepository({ sf10Mode = false }) {
    const navigate = useNavigate();

    const [query, setQuery] = useState("");
    const [gradeLevel, setGradeLevel] = useState("");
    const [schoolYearFilter, setSchoolYearFilter] = useState("");

    const [schoolYears, setSchoolYears] = useState([]);
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [truncated, setTruncated] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const authHeaders = () => {
        const token = localStorage.getItem("educheck_token");

        if (!token) {
            throw new Error("Authentication token not found. Please log in again.");
        }

        return { Authorization: `Bearer ${token}` };
    };

    // Needed to turn each result's school_year_ids (just numbers) into
    // readable labels for the year chips below.
    useEffect(() => {
        const fetchSchoolYears = async () => {
            try {
                const response = await fetch(`${API_URL}/consolidation/school-years`, {
                    headers: authHeaders(),
                });

                const data = await response.json();

                if (response.ok) {
                    setSchoolYears(data.school_years || []);
                }
            } catch {
                // Non-fatal — chips fall back to showing the raw school
                // year ID if labels never load.
            }
        };

        fetchSchoolYears();
    }, []);

    const schoolYearLabel = (schoolYearId) =>
        schoolYears.find((year) => year.school_year_id === schoolYearId)?.school_year ||
        `School Year #${schoolYearId}`;

    const runSearch = async (event) => {
        event?.preventDefault();

        const trimmedQuery = query.trim();
        const trimmedGrade = gradeLevel.trim();

        if (trimmedQuery.length === 0 && trimmedGrade.length === 0 && !schoolYearFilter) {
            setError("Enter an LRN, a name, a grade level, or pick a school year to search.");
            return;
        }

        try {
            setLoading(true);
            setError("");
            setHasSearched(true);

            const params = new URLSearchParams();
            if (trimmedQuery) params.set("q", trimmedQuery);
            if (trimmedGrade) params.set("grade_level", trimmedGrade);
            if (schoolYearFilter) params.set("school_year_id", schoolYearFilter);

            const response = await fetch(`${API_URL}/repository/search?${params.toString()}`, {
                headers: authHeaders(),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to search records.");
            }

            setResults(data.students || []);
            setTruncated(Boolean(data.truncated));
        } catch (searchError) {
            setError(searchError.message || "Failed to search records.");
            setResults(null);
        } finally {
            setLoading(false);
        }
    };

    const openRecord = (lrn, schoolYearId) => {
        navigate(`/consolidated-records?year=${schoolYearId}&lrn=${lrn}`);
    };

    return (
        <div className="dashboard-layout">

            <Sidebar activeKey={sf10Mode ? "permanent-records" : "records-repository"} />

            <main className="dashboard-main">

                <header className="dashboard-header">
                    <div>
                        <h1>{sf10Mode ? "SF10 Permanent Records" : "Records Repository"}</h1>
                        <p>
                            {sf10Mode
                                ? "Find a learner by LRN, name, grade level or school year, then open their Grade 1-6 permanent record to review, complete and generate the SF10."
                                : "Look up any learner by LRN, name, grade level or school year. Leave the school year on \"All\" to search every year."}
                        </p>
                    </div>
                </header>

                <section className="dashboard-content">

                    <form onSubmit={runSearch} className="rr-search-form">
                        <div className="rr-field rr-field-query">
                            <label htmlFor="repository_query">LRN or Name</label>

                            <input
                                id="repository_query"
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="e.g. 100000000002 or Dela Cruz, Daniel"
                            />
                        </div>

                        <div className="rr-field rr-field-grade">
                            <label htmlFor="repository_grade">Grade Level</label>

                            <input
                                id="repository_grade"
                                type="text"
                                value={gradeLevel}
                                onChange={(e) => setGradeLevel(e.target.value)}
                                placeholder="e.g. 6"
                            />
                        </div>

                        <div className="rr-field rr-field-year">
                            <label htmlFor="repository_school_year">School Year</label>

                            <select
                                id="repository_school_year"
                                value={schoolYearFilter}
                                onChange={(e) => setSchoolYearFilter(e.target.value)}
                            >
                                <option value="">All school years</option>
                                {schoolYears.map((year) => (
                                    <option key={year.school_year_id} value={year.school_year_id}>
                                        {year.school_year}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button type="submit" className="rr-search-button" disabled={loading}>
                            {loading ? (
                                <Loader2 size={16} className="spin-icon" />
                            ) : (
                                <Search size={16} />
                            )}
                            Search
                        </button>
                    </form>

                    {error && (
                        <div className="error-banner">
                            <AlertTriangle size={20} />
                            <span>{error}</span>
                        </div>
                    )}

                    {truncated && !error && (
                        <div className="rr-notice">
                            <AlertTriangle size={20} />
                            <span>
                                Showing the first 50 matches. Narrow your search (add a
                                name or LRN) to see more specific results.
                            </span>
                        </div>
                    )}

                    {loading && (
                        <div className="loading-state">
                            <Loader2 size={20} className="spin-icon" />
                            Searching...
                        </div>
                    )}

                    {!loading && hasSearched && results && results.length === 0 && (
                        <div className="content-card empty-state-card">
                            <Users size={20} />
                            No learners matched that search.
                        </div>
                    )}

                    {!loading && results && results.length > 0 && (
                        <div className="content-card">

                            <div className="rr-result-count">
                                {results.length} learner{results.length === 1 ? "" : "s"} found
                            </div>

                            {results.map((student) => (
                                <div key={student.lrn} className="rr-result-row">
                                    <div className="rr-result-identity">
                                        <IdCard size={20} style={{ color: "var(--ec-text-muted)" }} />

                                        <div>
                                            <div className="name">
                                                {student.last_name}, {student.first_name}
                                            </div>

                                            <div className="meta">
                                                LRN: {student.lrn} • Currently Grade {student.latest_grade_level}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rr-year-chips">
                                        <button
                                            type="button"
                                            className="rr-year-chip rr-permanent-chip"
                                            onClick={() => navigate(`/permanent-record/${student.lrn}`)}
                                        >
                                            Permanent Record (SF10)
                                        </button>

                                        {!sf10Mode && student.school_years.length === 0 && (
                                            <span className="rr-empty-years">
                                                No recorded grades yet
                                            </span>
                                        )}

                                        {!sf10Mode && student.school_years.map(({ school_year_id, grade_level }) => (
                                            <button
                                                key={school_year_id}
                                                type="button"
                                                className="rr-year-chip"
                                                onClick={() => openRecord(student.lrn, school_year_id)}
                                            >
                                                View {schoolYearLabel(school_year_id)} (Grade {grade_level})
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                </section>

            </main>

        </div>
    );
}

export default RecordsRepository;
