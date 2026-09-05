import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    AlertTriangle,
    ArrowLeft,
    CheckCircle,
    FileText,
    Loader2,
} from "lucide-react";

function ValidationResults() {
    const API_URL = "http://localhost:5000/api";

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
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchValidationResults();
    }, [classRecordId]);

    const isReady = data?.validation?.ready_for_submission;

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "#f8fafc",
                padding: "40px 20px",
                fontFamily: "Arial, sans-serif",
            }}
        >
            <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
                <button
                    onClick={() => navigate("/dashboard")}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        border: "none",
                        background: "transparent",
                        color: "#2563eb",
                        fontWeight: "600",
                        cursor: "pointer",
                        marginBottom: "24px",
                    }}
                >
                    <ArrowLeft size={18} />
                    Back to Dashboard
                </button>

                {loading && (
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            padding: "30px",
                            background: "#ffffff",
                            borderRadius: "12px",
                        }}
                    >
                        <Loader2 size={22} />
                        Loading validation results...
                    </div>
                )}

                {!loading && error && (
                    <div
                        style={{
                            padding: "18px",
                            background: "#fef2f2",
                            color: "#b91c1c",
                            borderRadius: "10px",
                        }}
                    >
                        {error}
                    </div>
                )}

                {!loading && !error && data && (
                    <>
                        <header style={{ marginBottom: "24px" }}>
                            <h1 style={{ marginBottom: "8px", color: "#0f172a" }}>
                                Validation Results
                            </h1>

                            <p style={{ margin: 0, color: "#64748b" }}>
                                Review your E-Class Record before submission.
                            </p>
                        </header>

                        <section
                            style={{
                                background: "#ffffff",
                                borderRadius: "12px",
                                padding: "24px",
                                marginBottom: "20px",
                                border: "1px solid #e2e8f0",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    gap: "20px",
                                    flexWrap: "wrap",
                                }}
                            >
                                <div>
                                    <h2 style={{ marginTop: 0, color: "#0f172a" }}>
                                        <FileText
                                            size={20}
                                            style={{ verticalAlign: "middle", marginRight: "8px" }}
                                        />
                                        {data.class_record.subject_name}
                                    </h2>

                                    <p>Grade Level: {data.class_record.grade_level}</p>
                                    <p>School Year: {data.class_record.school_year}</p>
                                    <p>File: {data.class_record.file_name}</p>
                                </div>

                                <div
                                    style={{
                                        alignSelf: "flex-start",
                                        padding: "12px 16px",
                                        borderRadius: "8px",
                                        fontWeight: "700",
                                        background: isReady ? "#dcfce7" : "#fee2e2",
                                        color: isReady ? "#166534" : "#b91c1c",
                                    }}
                                >
                                    {isReady
                                        ? "Ready for Submission"
                                        : "Needs Attention"}
                                </div>
                            </div>
                        </section>

                        <section
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                                gap: "16px",
                                marginBottom: "20px",
                            }}
                        >
                            <div
                                style={{
                                    background: "#ffffff",
                                    borderRadius: "12px",
                                    padding: "20px",
                                    border: "1px solid #e2e8f0",
                                }}
                            >
                                <span style={{ color: "#64748b" }}>Errors</span>
                                <h2 style={{ color: "#dc2626", marginBottom: 0 }}>
                                    {data.validation.error_count}
                                </h2>
                            </div>

                            <div
                                style={{
                                    background: "#ffffff",
                                    borderRadius: "12px",
                                    padding: "20px",
                                    border: "1px solid #e2e8f0",
                                }}
                            >
                                <span style={{ color: "#64748b" }}>Warnings</span>
                                <h2 style={{ color: "#d97706", marginBottom: 0 }}>
                                    {data.validation.warning_count}
                                </h2>
                            </div>
                        </section>

                        <section
                            style={{
                                background: "#ffffff",
                                borderRadius: "12px",
                                padding: "24px",
                                border: "1px solid #e2e8f0",
                            }}
                        >
                            <h2 style={{ marginTop: 0, color: "#0f172a" }}>
                                Validation Issues
                            </h2>

                            {data.validation.issues.length === 0 ? (
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "10px",
                                        padding: "18px",
                                        background: "#f0fdf4",
                                        color: "#166534",
                                        borderRadius: "8px",
                                    }}
                                >
                                    <CheckCircle size={22} />
                                    No validation issues found. This record is ready.
                                </div>
                            ) : (
                                data.validation.issues.map((issue) => (
                                    <div
                                        key={issue.validation_issue_id}
                                        style={{
                                            display: "flex",
                                            gap: "12px",
                                            padding: "16px",
                                            marginBottom: "12px",
                                            background: "#fef2f2",
                                            borderLeft: "4px solid #dc2626",
                                            borderRadius: "8px",
                                        }}
                                    >
                                        <AlertTriangle
                                            size={22}
                                            color="#dc2626"
                                        />

                                        <div>
                                            <strong style={{ color: "#991b1b" }}>
                                                {issue.learner_name || "Workbook"}
                                                {issue.term ? ` — ${issue.term}` : ""}
                                            </strong>

                                            <p style={{ margin: "6px 0 0", color: "#7f1d1d" }}>
                                                {issue.message}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </section>
                    </>
                )}
            </div>
        </div>
    );
}

export default ValidationResults;