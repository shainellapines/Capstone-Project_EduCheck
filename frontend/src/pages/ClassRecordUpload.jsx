import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    Upload,
    FileSpreadsheet,
    CheckCircle,
    AlertTriangle,
    Loader2,
} from "lucide-react";

import "./Dashboard.css";
import "./ClassRecordUpload.css";
import Sidebar from "../components/Sidebar";

const API_URL = "http://localhost:5000/api";

function ClassRecordUpload() {
    const navigate = useNavigate();

    const [selectedFile, setSelectedFile] = useState(null);
    const [isDragActive, setIsDragActive] = useState(false);

    const [subjects, setSubjects] = useState([]);
    const [schoolYears, setSchoolYears] = useState([]);
    const [selectedSubjectId, setSelectedSubjectId] = useState("");
    const [selectedSchoolYearId, setSelectedSchoolYearId] = useState("");
    const [loadingOptions, setLoadingOptions] = useState(true);

    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [result, setResult] = useState(null);

    const fetchUploadOptions = async () => {
        try {
            setLoadingOptions(true);
            setError("");

            const token = localStorage.getItem("educheck_token");

            if (!token) {
                throw new Error("Authentication token not found. Please log in again.");
            }

            const response = await fetch(`${API_URL}/uploads/options`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to load upload options.");
            }

            setSubjects(data.subjects || []);
            setSchoolYears(data.school_years || []);
        } catch (fetchError) {
            console.error("Load upload options error:", fetchError);
            setError(fetchError.message || "Failed to load subjects and school years.");
        } finally {
            setLoadingOptions(false);
        }
    };

    useEffect(() => {
        fetchUploadOptions();
    }, []);

    // Shared by both the file picker and drag-and-drop — same acceptance
    // rule (.xlsx/.xls only) either way a file arrives.
    const applySelectedFile = (file) => {
        setError("");
        setSuccessMessage("");
        setResult(null);

        if (!file) {
            setSelectedFile(null);
            return;
        }

        const fileName = file.name.toLowerCase();
        const isExcelFile = fileName.endsWith(".xlsx") || fileName.endsWith(".xls");

        if (!isExcelFile) {
            setSelectedFile(null);
            setError("Please select an Excel file (.xlsx or .xls).");
            return;
        }

        setSelectedFile(file);
    };

    const handleFileChange = (e) => {
        applySelectedFile(e.target.files[0]);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragActive(false);

        if (uploading) return;

        applySelectedFile(e.dataTransfer.files?.[0]);
    };

    const handleUpload = async () => {
        if (!selectedSubjectId) {
            setError("Please select a subject first.");
            return;
        }

        if (!selectedSchoolYearId) {
            setError("Please select a school year first.");
            return;
        }

        if (!selectedFile) {
            setError("Please select an Excel file first.");
            return;
        }

        setUploading(true);
        setError("");
        setSuccessMessage("");
        setResult(null);

        try {
            const token = localStorage.getItem("educheck_token");

            if (!token) {
                throw new Error("Authentication token not found. Please log in again.");
            }

            const formData = new FormData();
            formData.append("subject_id", selectedSubjectId);
            formData.append("school_year_id", selectedSchoolYearId);
            formData.append("file", selectedFile);

            const response = await fetch(`${API_URL}/uploads`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            const responseText = await response.text();

            let data;

            try {
                data = JSON.parse(responseText);
            } catch {
                throw new Error(`Server returned a non-JSON response: ${responseText}`);
            }

            if (!response.ok) {
                throw new Error(data.message || "Failed to upload Excel file.");
            }

            setSuccessMessage("Excel file uploaded and class record created successfully.");
            setResult(data);
        } catch (uploadError) {
            console.error("Upload error:", uploadError);
            setError(uploadError.message || "Something went wrong while uploading the file.");
        } finally {
            setUploading(false);
        }
    };

    const isSubmitDisabled =
        !selectedFile || !selectedSubjectId || !selectedSchoolYearId || uploading || loadingOptions;

    return (
        <div className="dashboard-layout">

            <Sidebar activeKey="upload-record" />

            <main className="dashboard-main">

                <header className="dashboard-header">
                    <div>
                        <h1>Upload e-Class Record</h1>
                        <p>Upload an Excel academic record for processing and validation.</p>
                    </div>
                </header>

                <section className="dashboard-content">

                    <div className="cru-card">

                        <div className="cru-card-header">
                            <div className="cru-icon-badge">
                                <FileSpreadsheet size={24} />
                            </div>

                            <div>
                                <h2>Class Record Information</h2>
                                <p>Select the subject and school year before uploading the record.</p>
                            </div>
                        </div>

                        <div className="cru-field">
                            <label htmlFor="subject">Subject</label>

                            <select
                                id="subject"
                                value={selectedSubjectId}
                                onChange={(e) => setSelectedSubjectId(e.target.value)}
                                disabled={loadingOptions || uploading}
                            >
                                <option value="">Select a subject</option>

                                {subjects.map((subject) => (
                                    <option key={subject.subject_id} value={subject.subject_id}>
                                        {subject.subject_name} - Grade {subject.grade_level}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="cru-field">
                            <label htmlFor="school_year">School Year</label>

                            <select
                                id="school_year"
                                value={selectedSchoolYearId}
                                onChange={(e) => setSelectedSchoolYearId(e.target.value)}
                                disabled={loadingOptions || uploading}
                            >
                                <option value="">Select a school year</option>

                                {schoolYears.map((schoolYear) => (
                                    <option key={schoolYear.school_year_id} value={schoolYear.school_year_id}>
                                        {schoolYear.school_year} ({schoolYear.status})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div
                            className={isDragActive ? "cru-dropzone drag-active" : "cru-dropzone"}
                            onDragOver={(e) => {
                                e.preventDefault();
                                if (!uploading) setIsDragActive(true);
                            }}
                            onDragLeave={() => setIsDragActive(false)}
                            onDrop={handleDrop}
                        >
                            <Upload size={40} color="#2563eb" />

                            <h3>Choose an Excel file</h3>
                            <p>Drag and drop the e-Class Record here, or browse your files.</p>

                            <input
                                id="class_record_file"
                                className="cru-file-input"
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={handleFileChange}
                                disabled={uploading}
                            />

                            <label
                                htmlFor="class_record_file"
                                className={uploading ? "cru-browse-button disabled" : "cru-browse-button"}
                            >
                                Browse File
                            </label>
                        </div>

                        {selectedFile && (
                            <div className="cru-selected-file">
                                <FileSpreadsheet size={22} color="#16a34a" />

                                <div>
                                    <strong>{selectedFile.name}</strong>
                                    <div className="file-size">
                                        {(selectedFile.size / 1024).toFixed(1)} KB
                                    </div>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="error-banner">
                                <AlertTriangle size={20} />
                                <span>{error}</span>
                            </div>
                        )}

                        {successMessage && (
                            <div className="success-banner">
                                <CheckCircle size={20} />
                                <span>{successMessage}</span>
                            </div>
                        )}

                        <button
                            type="button"
                            className="cru-submit-button"
                            onClick={handleUpload}
                            disabled={isSubmitDisabled}
                        >
                            {uploading ? (
                                <>
                                    <Loader2 size={18} className="spin-icon" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <Upload size={18} />
                                    Upload e-Class Record
                                </>
                            )}
                        </button>

                    </div>

                    {result && (
                        <div className="cru-card">
                            <h2 className="cru-result-title">Class Record Created</h2>

                            {result.class_record && (
                                <div className="cru-result-block">
                                    <h3>Record Information</h3>

                                    <div className="cru-info-row">
                                        Class Record ID: <strong>{result.class_record.class_record_id}</strong>
                                    </div>

                                    <div className="cru-info-row">
                                        Teacher: <strong>{result.class_record.teacher_name}</strong>
                                    </div>

                                    <div className="cru-info-row">
                                        Subject: <strong>{result.class_record.subject_name}</strong>
                                    </div>

                                    <div className="cru-info-row">
                                        Grade Level: <strong>{result.class_record.grade_level}</strong>
                                    </div>

                                    <div className="cru-info-row">
                                        School Year: <strong>{result.class_record.school_year}</strong>
                                    </div>

                                    <div className="cru-info-row">
                                        File: <strong>{result.class_record.file_name}</strong>
                                    </div>

                                    <div className="cru-info-row">
                                        Status: <strong>{result.class_record.status}</strong>
                                    </div>

                                    <button
                                        type="button"
                                        className="cru-view-results-button"
                                        onClick={() =>
                                            navigate(`/validation-results/${result.class_record.class_record_id}`)
                                        }
                                    >
                                        <CheckCircle size={16} />
                                        View Validation Results
                                    </button>
                                </div>
                            )}

                            {result.workbook && (
                                <div className="cru-result-block">
                                    <h3>Workbook</h3>

                                    <div className="cru-info-row">
                                        Sheets: <strong>{result.workbook.sheet_count}</strong>
                                    </div>

                                    <div className="cru-info-row">
                                        Sheet Names: <strong>{result.workbook.sheet_names?.join(", ")}</strong>
                                    </div>
                                </div>
                            )}

                            {result.worksheet && (
                                <div className="cru-result-block">
                                    <h3>Worksheet</h3>

                                    <div className="cru-info-row">
                                        Name: <strong>{result.worksheet.name}</strong>
                                    </div>

                                    <div className="cru-info-row">
                                        Rows: <strong>{result.worksheet.row_count}</strong>
                                    </div>

                                    <div className="cru-info-row">
                                        Columns: <strong>{result.worksheet.columns?.join(", ")}</strong>
                                    </div>
                                </div>
                            )}

                            {result.preview && result.preview.length > 0 && (
                                <div>
                                    <h3 className="cru-result-title">Data Preview</h3>

                                    <div className="cru-preview-scroll">
                                        <table className="cru-table">
                                            <thead>
                                                <tr>
                                                    {Object.keys(result.preview[0]).map((column) => (
                                                        <th key={column}>{column}</th>
                                                    ))}
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {result.preview.map((row, rowIndex) => (
                                                    <tr key={rowIndex}>
                                                        {Object.keys(result.preview[0]).map((column) => (
                                                            <td key={column}>{row[column]}</td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                </section>

            </main>

        </div>
    );
}

export default ClassRecordUpload;
