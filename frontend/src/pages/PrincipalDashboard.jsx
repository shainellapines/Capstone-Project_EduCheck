import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    AlertTriangle,
    CheckCircle,
    Clock,
    Database,
    Eye,
    Layers,
    Loader2,
    PieChart,
    XCircle,
} from "lucide-react";

import "./Dashboard.css";
import Sidebar from "../components/Sidebar";
import { getToken, getStoredUser } from "../utils/session";

const API_URL = "http://localhost:5000/api";

// SPMP v1.0 US-008 (Should, Sprint 8): a School Principal is view-only —
// no upload, no approve/reject, no user/section management. This mirrors
// AdminDashboard's shape (same overview-card/quick-actions layout) but
// every quick action lands on a read-only page, and there is no "Total
// Users" card or approve/reject affordance anywhere on it.
function PrincipalDashboard() {
    const navigate = useNavigate();
    const user = getStoredUser() || { username: "principal", role: "principal" };

    const [schoolYears, setSchoolYears] = useState([]);
    const [selectedSchoolYearId, setSelectedSchoolYearId] = useState("");
    const [loadingSchoolYears, setLoadingSchoolYears] = useState(true);

    const [consolidatedData, setConsolidatedData] = useState(null);
    const [sections, setSections] = useState(null);
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

        const fetchOverviewData = async () => {
            try {
                setLoadingData(true);
                setError("");

                const [consolidatedResponse, sectionsResponse] = await Promise.all([
                    fetch(`${API_URL}/consolidation/school-years/${selectedSchoolYearId}`, {
                        headers: authHeaders(),
                    }),
                    fetch(`${API_URL}/consolidation/school-years/${selectedSchoolYearId}/sections`, {
                        headers: authHeaders(),
                    }),
                ]);

                const consolidatedJson = await consolidatedResponse.json();
                const sectionsJson = await sectionsResponse.json();

                if (!consolidatedResponse.ok) {
                    throw new Error(consolidatedJson.message || "Failed to load dashboard data.");
                }

                if (!sectionsResponse.ok) {
                    throw new Error(sectionsJson.message || "Failed to load section data.");
                }

                setConsolidatedData(consolidatedJson);
                setSections(sectionsJson.sections || []);
            } catch (fetchError) {
                setError(fetchError.message || "Failed to load dashboard data.");
                setConsolidatedData(null);
                setSections(null);
            } finally {
                setLoadingData(false);
            }
        };

        fetchOverviewData();
    }, [selectedSchoolYearId]);

    const students = consolidatedData?.students || [];
    const uploadSummary = consolidatedData?.upload_summary;

    const pendingCount = students.filter((s) => s.submission.status === "Pending Approval").length;
    const approvedCount = students.filter((s) => s.submission.status === "Approved").length;
    const rejectedCount = students.filter((s) => s.submission.status === "Rejected").length;

    const sectionsFullySubmittedCount = (sections || []).filter(
        (section) => section.subjects_expected > 0 && section.subjects_submitted >= section.subjects_expected
    ).length;

    const isLoading = loadingSchoolYears || loadingData;

    return (
        <div className="dashboard-layout">

            <Sidebar activeKey="dashboard" />

            <main className="dashboard-main">

                <header className="dashboard-header">

                    <div>
                        <h1>
                            Welcome, {user.username}
                        </h1>

                        <p>
                            School-wide academic record oversight
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

                    <div className="section-heading">
                        <h2>Overview</h2>

                        <p>
                            A read-only view of submission progress across every section —
                            approvals, rejections, and uploads still needing attention.
                        </p>
                    </div>

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
                        <div className="overview-grid">

                            <div className="overview-card">
                                <div>
                                    <span>Sections Fully Submitted</span>
                                    <strong>
                                        {sectionsFullySubmittedCount} / {sections?.length ?? 0}
                                    </strong>
                                </div>

                                <div className="card-icon blue">
                                    <Layers size={23} />
                                </div>
                            </div>

                            <div className="overview-card">
                                <div>
                                    <span>Pending Submissions</span>
                                    <strong>{pendingCount}</strong>
                                </div>

                                <div className="card-icon green">
                                    <Clock size={23} />
                                </div>
                            </div>

                            <div className="overview-card">
                                <div>
                                    <span>Approved Records</span>
                                    <strong className="purple-text">{approvedCount}</strong>
                                </div>

                                <div className="card-icon purple">
                                    <CheckCircle size={23} />
                                </div>
                            </div>

                            <div className="overview-card">
                                <div>
                                    <span>Rejected Records</span>
                                    <strong className="orange-text">{rejectedCount}</strong>
                                </div>

                                <div className="card-icon orange">
                                    <XCircle size={23} />
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
                    )}

                    {/* QUICK LINKS — every destination is view-only for this role */}
                    <div className="content-card">

                        <div className="card-header">
                            <h3>View Records</h3>
                        </div>

                        <div className="quick-actions">

                            <button
                                className="quick-action blue-action"
                                onClick={() => navigate("/section-progress")}
                            >
                                <PieChart size={24} />

                                <strong>
                                    Section Progress
                                </strong>

                                <span>
                                    Learning areas submitted per section
                                </span>
                            </button>

                            <button
                                className="quick-action green-action"
                                onClick={() => navigate("/consolidated-records")}
                            >
                                <Eye size={24} />

                                <strong>
                                    Submission Review
                                </strong>

                                <span>
                                    View consolidated student records
                                </span>
                            </button>

                            <button
                                className="quick-action purple-action"
                                onClick={() => navigate("/records-repository")}
                            >
                                <Database size={24} />

                                <strong>
                                    Digital Repository
                                </strong>

                                <span>
                                    Search records across school years
                                </span>
                            </button>

                        </div>

                    </div>

                </section>

            </main>

        </div>
    );
}

export default PrincipalDashboard;
