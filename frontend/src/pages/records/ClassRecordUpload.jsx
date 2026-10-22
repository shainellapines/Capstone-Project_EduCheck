import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    AlertTriangle,
    ArrowRight,
    Check,
    CheckCircle2,
    FileCheck2,
    FileSpreadsheet,
    Loader2,
    RotateCcw,
    ShieldCheck,
    TriangleAlert,
    Upload,
    X,
} from "lucide-react";

import "../../styles/Dashboard.css";
import "../../components/StatusBadge.css";
import "./ClassRecordUpload.css";
import Sidebar from "../../components/Sidebar";
import StatusBadge from "../../components/StatusBadge";
import { getStoredUser, getToken } from "../../utils/session";
import { API_URL } from "../../config";


// One option = one (subject, section, school year) combination this
// user is actually assigned/authorized to upload for - see
// uploadController.getUploadOptions. Stable per-row key since none of
// section_id/subject_id/school_year_id alone is unique across options.
const optionKey = (option) => `${option.section_id}-${option.subject_id}-${option.school_year_id}`;

function formatFileSize(bytes) {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Where a subject stands for this teacher, from its latest upload: shown on
// its tile so it's clear which subjects are done and which one is next.
const UPLOAD_STATE = {
    validated: { label: "Validated", icon: CheckCircle2 },
    "needs-fixes": { label: "Needs fixes", icon: TriangleAlert },
    "not-uploaded": { label: "Not uploaded yet", icon: null },
};

function uploadStateOf(latestUpload) {
    if (!latestUpload) return "not-uploaded";
    return latestUpload.status === "Validated" ? "validated" : "needs-fixes";
}

function formatShortDate(isoString) {
    return new Date(isoString).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function ClassRecordUpload() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const isAdviser = getStoredUser()?.role === "adviser";

    const [selectedFile, setSelectedFile] = useState(null);
    const [isDragActive, setIsDragActive] = useState(false);

    const [options, setOptions] = useState([]);
    const [selectedOptionKey, setSelectedOptionKey] = useState("");
    const [loadingOptions, setLoadingOptions] = useState(true);

    // This user's earlier uploads, newest first: each tile's status and date.
    const [previousUploads, setPreviousUploads] = useState([]);
    const [uploadsLoaded, setUploadsLoaded] = useState(false);

    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const [result, setResult] = useState(null);

    const selectedOption = options.find((option) => optionKey(option) === selectedOptionKey) || null;

    const fetchUploadOptions = async () => {
        try {
            setLoadingOptions(true);
            setError("");

            const token = getToken();

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

            setOptions(data.options || []);
        } catch (fetchError) {
            console.error("Load upload options error:", fetchError);
            setError(fetchError.message || "Failed to load your assigned subjects and sections.");
        } finally {
            setLoadingOptions(false);
        }
    };

    // Best effort: without it the tiles simply don't show a last-upload date.
    const fetchPreviousUploads = async () => {
        try {
            const token = getToken();
            if (!token) return;

            const response = await fetch(`${API_URL}/uploads/my-records`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) return;

            const data = await response.json();
            setPreviousUploads(data.records || []);
        } catch {
            setPreviousUploads([]);
        } finally {
            setUploadsLoaded(true);
        }
    };

    useEffect(() => {
        fetchUploadOptions();
        fetchPreviousUploads();
    }, []);

    // my-records is newest first, so the first match is the latest upload.
    const latestUploadFor = (option) =>
        previousUploads.find(
            (record) =>
                record.subject_id === option.subject_id &&
                record.section_id === option.section_id &&
                record.school_year_id === option.school_year_id
        ) || null;

    const uploadedCount = options.filter((option) => latestUploadFor(option)).length;

    // With nothing picked, start on the first subject not uploaded yet, so
    // the next one to do is already selected. Every tile stays clickable:
    // a validated subject can still be re-uploaded with corrections.
    const nextOption = options.find((option) => !latestUploadFor(option));
    const nextOptionKey = nextOption ? optionKey(nextOption) : "";

    useEffect(() => {
        if (loadingOptions || !uploadsLoaded || result || selectedOptionKey || !nextOptionKey) return;
        setSelectedOptionKey(nextOptionKey);
    }, [loadingOptions, uploadsLoaded, result, selectedOptionKey, nextOptionKey]);

    const schoolYears = Array.from(new Set(options.map((option) => option.school_year)));
    const singleSchoolYear = schoolYears.length === 1 ? schoolYears[0] : null;

    // Shared by both the file picker and drag-and-drop — same acceptance
    // rule (.xlsx/.xls only) either way a file arrives.
    const applySelectedFile = (file) => {
        setError("");
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
        // Lets the same file be picked again after Remove.
        e.target.value = "";
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragActive(false);

        if (uploading) return;

        applySelectedFile(e.dataTransfer.files?.[0]);
    };

    const openFilePicker = () => {
        if (!uploading) fileInputRef.current?.click();
    };

    const handleUpload = async () => {
        if (!selectedOption) {
            setError("Please select a subject and section first.");
            return;
        }

        if (!selectedFile) {
            setError("Please select an Excel file first.");
            return;
        }

        setUploading(true);
        setError("");
        setResult(null);

        try {
            const token = getToken();

            if (!token) {
                throw new Error("Authentication token not found. Please log in again.");
            }

            const formData = new FormData();
            formData.append("subject_id", selectedOption.subject_id);
            formData.append("section_id", selectedOption.section_id);
            formData.append("school_year_id", selectedOption.school_year_id);
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

            setResult(data);
            fetchPreviousUploads();
        } catch (uploadError) {
            console.error("Upload error:", uploadError);
            setError(uploadError.message || "Something went wrong while uploading the file.");
        } finally {
            setUploading(false);
        }
    };

    const startAnotherUpload = () => {
        setResult(null);
        setSelectedFile(null);
        setSelectedOptionKey("");
        setError("");
    };

    const isSubmitDisabled = !selectedFile || !selectedOption || uploading || loadingOptions;

    const record = result?.class_record;
    const validation = result?.validation;
    const isReady = Boolean(validation?.ready_for_submission ?? record?.ready_for_submission);

    return (
        <div className="dashboard-layout">

            <Sidebar activeKey="upload-record" />

            <main className="dashboard-main">

                <header className="dashboard-header">
                    <div>
                        <h1>Upload e-Class Record</h1>
                        <p>
                            Upload one subject's DepEd e-Class Record. EduCheck reads the grades and
                            checks them against DepEd rules as soon as it's uploaded.
                        </p>
                    </div>
                </header>

                <section className="dashboard-content">

                    <div className="cru-layout">

                        {/* ---------- RESULT ---------- */}
                        {result ? (
                            <div className="cru-card">
                                <div className={`cru-result-head ${isReady ? "is-ready" : "needs-fixes"}`}>
                                    <span className="cru-result-icon">
                                        {isReady ? <CheckCircle2 size={24} /> : <TriangleAlert size={24} />}
                                    </span>

                                    <div>
                                        <h2>
                                            {isReady ? "Uploaded and validated" : "Uploaded — corrections needed"}
                                        </h2>
                                        <p>
                                            {isReady
                                                ? "No errors were found. The grades are ready to consolidate."
                                                : "EduCheck found issues to fix in the file. Review them, correct the e-Class Record, and upload it again."}
                                        </p>
                                    </div>
                                </div>

                                {record && (
                                    <dl className="cru-summary">
                                        <div>
                                            <dt>Subject</dt>
                                            <dd>{record.subject_name}</dd>
                                        </div>
                                        <div>
                                            <dt>Section</dt>
                                            <dd>
                                                Grade {record.grade_level} · {record.section_name}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt>School year</dt>
                                            <dd>{record.school_year}</dd>
                                        </div>
                                        <div>
                                            <dt>Status</dt>
                                            <dd>
                                                <StatusBadge status={record.status} />
                                            </dd>
                                        </div>
                                        <div className="cru-summary-wide">
                                            <dt>File</dt>
                                            <dd className="cru-summary-file">
                                                <FileSpreadsheet size={16} aria-hidden="true" />
                                                <span>{record.file_name}</span>
                                            </dd>
                                        </div>
                                    </dl>
                                )}

                                <div className="cru-stats">
                                    <div className="cru-stat">
                                        <span>Learners read</span>
                                        <strong>{result.workbook?.learner_count ?? "—"}</strong>
                                    </div>
                                    <div className="cru-stat">
                                        <span>Grade records saved</span>
                                        <strong>{result.grade_records?.persisted_count ?? "—"}</strong>
                                    </div>
                                    <div className={`cru-stat${validation?.error_count > 0 ? " is-error" : ""}`}>
                                        <span>Errors</span>
                                        <strong>{validation?.error_count ?? record?.validation_error_count ?? 0}</strong>
                                    </div>
                                    <div className={`cru-stat${validation?.warning_count > 0 ? " is-warning" : ""}`}>
                                        <span>Warnings</span>
                                        <strong>{validation?.warning_count ?? record?.validation_warning_count ?? 0}</strong>
                                    </div>
                                </div>

                                {result.grade_records?.skipped_no_lrn_count > 0 && (
                                    <p className="cru-note">
                                        {result.grade_records.skipped_no_lrn_count} row
                                        {result.grade_records.skipped_no_lrn_count === 1 ? " was" : "s were"} skipped
                                        because the learner has no LRN in the file.
                                    </p>
                                )}

                                {result.integrity_warnings?.length > 0 && (
                                    <div className="cru-callout">
                                        <AlertTriangle size={18} aria-hidden="true" />
                                        <div>
                                            <strong>Please double-check</strong>
                                            <ul>
                                                {result.integrity_warnings.map((warning) => (
                                                    <li key={warning.code}>{warning.message}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                )}

                                <div className="cru-actions">
                                    <button type="button" className="cru-button secondary" onClick={startAnotherUpload}>
                                        <RotateCcw size={16} aria-hidden="true" />
                                        Upload another file
                                    </button>

                                    {record && (
                                        <button
                                            type="button"
                                            className="cru-button primary"
                                            onClick={() => navigate(`/validation-results/${record.class_record_id}`)}
                                        >
                                            View validation results
                                            <ArrowRight size={16} aria-hidden="true" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (

                        /* ---------- FORM ---------- */
                        <div className="cru-card">

                            {/* Step 1: assignment */}
                            <div className="cru-step">
                                <div className="cru-step-head">
                                    <span className={`cru-step-badge${selectedOption ? " is-done" : ""}`}>
                                        {selectedOption ? <Check size={14} strokeWidth={2.5} /> : "1"}
                                    </span>
                                    <div>
                                        <h2>Subject and section</h2>
                                        <p>Only the subjects and sections you're assigned to are listed.</p>
                                    </div>
                                    {singleSchoolYear && (
                                        <span className="cru-chip">School year {singleSchoolYear}</span>
                                    )}
                                </div>

                                {!loadingOptions && uploadsLoaded && options.length > 1 && (
                                    <div className="cru-progress">
                                        <span>
                                            <strong>{uploadedCount}</strong> of {options.length} uploaded
                                        </span>
                                        <span
                                            className="cru-progress-bar"
                                            role="img"
                                            aria-label={`${uploadedCount} of ${options.length} subjects uploaded`}
                                        >
                                            <span style={{ width: `${(uploadedCount / options.length) * 100}%` }} />
                                        </span>
                                        {uploadedCount === options.length && (
                                            <span className="cru-progress-done">
                                                <CheckCircle2 size={14} aria-hidden="true" />
                                                All subjects uploaded
                                            </span>
                                        )}
                                    </div>
                                )}

                                {loadingOptions ? (
                                    <div className="cru-tiles" aria-busy="true">
                                        {[0, 1, 2, 3].map((index) => (
                                            <div className="cru-tile is-skeleton" key={index} />
                                        ))}
                                    </div>
                                ) : options.length === 0 ? (
                                    <div className="cru-empty">
                                        <AlertTriangle size={18} aria-hidden="true" />
                                        <span>
                                            You don't have any subject or section assignments yet. Ask your
                                            School Administrator to assign you before you upload.
                                        </span>
                                    </div>
                                ) : (
                                    <div className="cru-tiles" role="radiogroup" aria-label="Subject and section">
                                        {options.map((option) => {
                                            const key = optionKey(option);
                                            const isSelected = key === selectedOptionKey;
                                            const latestUpload = latestUploadFor(option);
                                            const state = uploadStateOf(latestUpload);
                                            const StateIcon = UPLOAD_STATE[state].icon;

                                            return (
                                                <button
                                                    type="button"
                                                    role="radio"
                                                    aria-checked={isSelected}
                                                    key={key}
                                                    className={`cru-tile is-${state}${isSelected ? " is-selected" : ""}`}
                                                    onClick={() => {
                                                        setSelectedOptionKey(key);
                                                        setError("");
                                                    }}
                                                    disabled={uploading}
                                                >
                                                    <span className="cru-tile-check" aria-hidden="true">
                                                        {isSelected && <Check size={12} strokeWidth={3} />}
                                                    </span>
                                                    <strong>{option.subject_name}</strong>
                                                    <span className="cru-tile-meta">
                                                        Grade {option.grade_level} · {option.section_name}
                                                        {!singleSchoolYear && ` · ${option.school_year}`}
                                                    </span>
                                                    <span className={`cru-tile-state is-${state}`}>
                                                        {StateIcon && <StateIcon size={13} aria-hidden="true" />}
                                                        {UPLOAD_STATE[state].label}
                                                        {latestUpload && (
                                                            <span className="cru-tile-date">
                                                                · {formatShortDate(latestUpload.upload_date)}
                                                            </span>
                                                        )}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Step 2: file */}
                            <div className="cru-step">
                                <div className="cru-step-head">
                                    <span className={`cru-step-badge${selectedFile ? " is-done" : ""}`}>
                                        {selectedFile ? <Check size={14} strokeWidth={2.5} /> : "2"}
                                    </span>
                                    <div>
                                        <h2>e-Class Record file</h2>
                                        <p>The official DepEd template, saved as .xlsx or .xls.</p>
                                    </div>
                                </div>

                                <input
                                    ref={fileInputRef}
                                    id="class_record_file"
                                    className="cru-file-input"
                                    type="file"
                                    accept=".xlsx,.xls"
                                    onChange={handleFileChange}
                                    disabled={uploading}
                                />

                                {selectedFile ? (
                                    <div className="cru-file">
                                        <span className="cru-file-icon">
                                            <FileSpreadsheet size={22} aria-hidden="true" />
                                        </span>
                                        <div className="cru-file-text">
                                            <strong>{selectedFile.name}</strong>
                                            <span>{formatFileSize(selectedFile.size)} · Ready to upload</span>
                                        </div>
                                        <button
                                            type="button"
                                            className="cru-button ghost"
                                            onClick={openFilePicker}
                                            disabled={uploading}
                                        >
                                            Replace
                                        </button>
                                        <button
                                            type="button"
                                            className="cru-icon-button"
                                            onClick={() => setSelectedFile(null)}
                                            disabled={uploading}
                                            aria-label="Remove file"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <div
                                        className={`cru-dropzone${isDragActive ? " drag-active" : ""}`}
                                        role="button"
                                        tabIndex={0}
                                        onClick={openFilePicker}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ") {
                                                e.preventDefault();
                                                openFilePicker();
                                            }
                                        }}
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            if (!uploading) setIsDragActive(true);
                                        }}
                                        onDragLeave={() => setIsDragActive(false)}
                                        onDrop={handleDrop}
                                    >
                                        <span className="cru-dropzone-icon">
                                            <Upload size={22} aria-hidden="true" />
                                        </span>
                                        <p className="cru-dropzone-title">
                                            Drag the e-Class Record here, or <span>browse files</span>
                                        </p>
                                        <p className="cru-dropzone-hint">Excel workbook · .xlsx or .xls</p>
                                    </div>
                                )}
                            </div>

                            {error && (
                                <div className="error-banner cru-error">
                                    <AlertTriangle size={18} />
                                    <span>{error}</span>
                                </div>
                            )}

                            {/* Footer: what will be uploaded, and the action */}
                            <div className="cru-footer">
                                <p className="cru-footer-summary">
                                    {selectedOption ? (
                                        <>
                                            <strong>{selectedOption.subject_name}</strong>
                                            <span>
                                                Grade {selectedOption.grade_level} · {selectedOption.section_name}
                                            </span>
                                        </>
                                    ) : (
                                        <span>Choose a subject and a file to continue.</span>
                                    )}
                                </p>

                                <button
                                    type="button"
                                    className="cru-button primary"
                                    onClick={handleUpload}
                                    disabled={isSubmitDisabled}
                                >
                                    {uploading ? (
                                        <>
                                            <Loader2 size={16} className="spin-icon" aria-hidden="true" />
                                            Uploading and validating…
                                        </>
                                    ) : (
                                        <>
                                            <Upload size={16} aria-hidden="true" />
                                            Upload and validate
                                        </>
                                    )}
                                </button>
                            </div>

                        </div>
                        )}

                        {/* ---------- GUIDE ---------- */}
                        <aside className="cru-guide">
                            <div className="cru-guide-card">
                                <h3>How it works</h3>

                                <ol className="cru-steps">
                                    <li>
                                        <span className="cru-step-number">1</span>
                                        <div>
                                            <strong>Choose the subject</strong>
                                            <p>Pick the subject and section this file is for.</p>
                                        </div>
                                    </li>

                                    <li>
                                        <span className="cru-step-number">2</span>
                                        <div>
                                            <strong>Upload the file</strong>
                                            <p>Grades are read and checked automatically.</p>
                                        </div>
                                    </li>

                                    <li>
                                        <span className="cru-step-number">3</span>
                                        <div>
                                            <strong>Review the results</strong>
                                            <p>
                                                Fix anything flagged, then it's ready
                                                {isAdviser ? " to consolidate." : " for your Adviser to consolidate."}
                                            </p>
                                        </div>
                                    </li>
                                </ol>

                                <div className="cru-guide-divider" />

                                <h3>Before you upload</h3>

                                <ul className="cru-checklist">
                                    <li>
                                        <FileCheck2 size={16} aria-hidden="true" />
                                        Use the official DepEd e-Class Record template, with its structure unchanged.
                                    </li>
                                    <li>
                                        <ShieldCheck size={16} aria-hidden="true" />
                                        The subject in the file's header matches the one you picked.
                                    </li>
                                    <li>
                                        <CheckCircle2 size={16} aria-hidden="true" />
                                        Every learner row has an LRN.
                                    </li>
                                </ul>
                            </div>
                        </aside>

                    </div>

                </section>

            </main>

        </div>
    );
}

export default ClassRecordUpload;
