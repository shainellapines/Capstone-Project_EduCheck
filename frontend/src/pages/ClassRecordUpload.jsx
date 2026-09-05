import { useEffect, useState } from "react";

import {
    ArrowLeft,
    Upload,
    FileSpreadsheet,
    CheckCircle,
    AlertTriangle,
    Loader2,
} from "lucide-react";

function ClassRecordUpload() {

    const API_URL =
        "http://localhost:5000/api";

    // ==========================================
    // FILE
    // ==========================================

    const [selectedFile, setSelectedFile] =
        useState(null);

    // ==========================================
    // OPTIONS
    // ==========================================

    const [subjects, setSubjects] =
        useState([]);

    const [schoolYears, setSchoolYears] =
        useState([]);

    const [selectedSubjectId, setSelectedSubjectId] =
        useState("");

    const [selectedSchoolYearId, setSelectedSchoolYearId] =
        useState("");

    const [loadingOptions, setLoadingOptions] =
        useState(true);

    // ==========================================
    // UPLOAD
    // ==========================================

    const [uploading, setUploading] =
        useState(false);

    // ==========================================
    // MESSAGES
    // ==========================================

    const [error, setError] =
        useState("");

    const [successMessage, setSuccessMessage] =
        useState("");

    // ==========================================
    // RESULT
    // ==========================================

    const [result, setResult] =
        useState(null);

    // ==========================================
    // LOAD SUBJECTS + SCHOOL YEARS
    // ==========================================

    const fetchUploadOptions =
        async () => {

            try {

                setLoadingOptions(true);
                setError("");

                const token =
                    localStorage.getItem(
                        "educheck_token"
                    );

                if (!token) {
                    throw new Error(
                        "Authentication token not found. Please log in again."
                    );
                }

                const response =
                    await fetch(
                        `${API_URL}/uploads/options`,
                        {
                            headers: {
                                Authorization:
                                    `Bearer ${token}`,
                            },
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message ||
                        "Failed to load upload options."
                    );
                }

                setSubjects(
                    data.subjects || []
                );

                setSchoolYears(
                    data.school_years || []
                );

            } catch (error) {

                console.error(
                    "Load upload options error:",
                    error
                );

                setError(
                    error.message ||
                    "Failed to load subjects and school years."
                );

            } finally {

                setLoadingOptions(false);

            }
        };

    // Load options when page opens
    useEffect(() => {

        fetchUploadOptions();

    }, []);

    // ==========================================
    // FILE SELECTION
    // ==========================================

    const handleFileChange = (e) => {

        const file =
            e.target.files[0];

        setError("");
        setSuccessMessage("");
        setResult(null);

        if (!file) {

            setSelectedFile(null);

            return;
        }

        const fileName =
            file.name.toLowerCase();

        const isExcelFile =
            fileName.endsWith(".xlsx") ||
            fileName.endsWith(".xls");

        if (!isExcelFile) {

            setSelectedFile(null);

            setError(
                "Please select an Excel file (.xlsx or .xls)."
            );

            e.target.value = "";

            return;
        }

        setSelectedFile(file);
    };

    // ==========================================
    // UPLOAD FILE
    // ==========================================

    const handleUpload = async () => {

        // Check subject
        if (!selectedSubjectId) {

            setError(
                "Please select a subject first."
            );

            return;
        }

        // Check school year
        if (!selectedSchoolYearId) {

            setError(
                "Please select a school year first."
            );

            return;
        }

        // Check file
        if (!selectedFile) {

            setError(
                "Please select an Excel file first."
            );

            return;
        }

        setUploading(true);
        setError("");
        setSuccessMessage("");
        setResult(null);

        try {

            const token =
                localStorage.getItem(
                    "educheck_token"
                );

            if (!token) {

                throw new Error(
                    "Authentication token not found. Please log in again."
                );

            }

            const formData =
                new FormData();

            formData.append(
                "subject_id",
                selectedSubjectId
            );

            formData.append(
                "school_year_id",
                selectedSchoolYearId
            );

            formData.append(
                "file",
                selectedFile
            );

            const response = await fetch(
                `${API_URL}/uploads`,
                {
                    method: "POST",

                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },

                    body: formData,
                }
            );

            const responseText = await response.text();

            console.log("UPLOAD STATUS:", response.status);
            console.log("UPLOAD RESPONSE:", responseText);

            let data;

            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                throw new Error(
                    `Server returned a non-JSON response: ${responseText}`
                );
            }

            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Failed to upload Excel file."
                );

            }

            setSuccessMessage(
                "Excel file uploaded and class record created successfully."
            );

            setResult(data);

        } catch (error) {

            console.error(
                "Upload error:",
                error
            );

            setError(
                error.message ||
                "Something went wrong while uploading the file."
            );

        } finally {

            setUploading(false);

        }
    };

    // ==========================================
    // BACK TO DASHBOARD
    // ==========================================

    const handleBack = () => {

        window.location.href =
            "/dashboard";
    };

    return (

        <div
            style={{
                minHeight: "100vh",
                background: "#f5f7fb",
                padding: "30px",
                fontFamily:
                    "Arial, sans-serif",
            }}
        >

            {/* HEADER */}

            <div
                style={{
                    marginBottom: "30px",
                }}
            >

                <button
                    type="button"
                    onClick={handleBack}
                    style={{
                        display:
                            "flex",
                        alignItems:
                            "center",
                        gap: "6px",
                        border: "none",
                        background:
                            "transparent",
                        cursor:
                            "pointer",
                        color:
                            "#475569",
                        marginBottom:
                            "15px",
                        fontSize:
                            "14px",
                    }}
                >

                    <ArrowLeft
                        size={18}
                    />

                    Back to Dashboard

                </button>

                <h1
                    style={{
                        margin: 0,
                        color:
                            "#0f172a",
                    }}
                >
                    Upload e-Class Record
                </h1>

                <p
                    style={{
                        marginTop:
                            "8px",
                        color:
                            "#64748b",
                    }}
                >
                    Upload an Excel academic
                    record for processing and
                    validation.
                </p>

            </div>

            {/* UPLOAD CARD */}

            <div
                style={{
                    maxWidth:
                        "900px",
                    background:
                        "#ffffff",
                    borderRadius:
                        "12px",
                    padding:
                        "30px",
                    boxShadow:
                        "0 2px 8px rgba(0,0,0,0.06)",
                    border:
                        "1px solid #e2e8f0",
                }}
            >

                {/* TITLE */}

                <div
                    style={{
                        display:
                            "flex",
                        alignItems:
                            "center",
                        gap:
                            "12px",
                        marginBottom:
                            "20px",
                    }}
                >

                    <div
                        style={{
                            width:
                                "44px",
                            height:
                                "44px",
                            borderRadius:
                                "10px",
                            background:
                                "#eff6ff",
                            display:
                                "flex",
                            alignItems:
                                "center",
                            justifyContent:
                                "center",
                            color:
                                "#2563eb",
                        }}
                    >

                        <FileSpreadsheet
                            size={24}
                        />

                    </div>

                    <div>

                        <h2
                            style={{
                                margin: 0,
                                color:
                                    "#0f172a",
                            }}
                        >
                            Class Record Information
                        </h2>

                        <p
                            style={{
                                margin:
                                    "5px 0 0",
                                color:
                                    "#64748b",
                                fontSize:
                                    "14px",
                            }}
                        >
                            Select the subject and
                            school year before
                            uploading the record.
                        </p>

                    </div>

                </div>

                {/* SUBJECT */}

                <div
                    style={{
                        marginBottom:
                            "20px",
                    }}
                >

                    <label
                        htmlFor="subject"
                        style={{
                            display:
                                "block",
                            marginBottom:
                                "8px",
                            fontWeight:
                                "600",
                            color:
                                "#334155",
                        }}
                    >
                        Subject
                    </label>

                    <select
                        id="subject"
                        value={
                            selectedSubjectId
                        }
                        onChange={(e) =>
                            setSelectedSubjectId(
                                e.target.value
                            )
                        }
                        disabled={
                            loadingOptions ||
                            uploading
                        }
                        style={{
                            width:
                                "100%",
                            padding:
                                "12px",
                            border:
                                "1px solid #cbd5e1",
                            borderRadius:
                                "8px",
                            background:
                                "#ffffff",
                            fontSize:
                                "14px",
                            color:
                                "#334155",
                        }}
                    >

                        <option value="">
                            Select a subject
                        </option>

                        {subjects.map(
                            (subject) => (

                                <option
                                    key={
                                        subject.subject_id
                                    }
                                    value={
                                        subject.subject_id
                                    }
                                >
                                    {subject.subject_name}
                                    {" "}
                                    - Grade{" "}
                                    {subject.grade_level}
                                </option>

                            )
                        )}

                    </select>

                </div>

                {/* SCHOOL YEAR */}

                <div
                    style={{
                        marginBottom:
                            "20px",
                    }}
                >

                    <label
                        htmlFor="school_year"
                        style={{
                            display:
                                "block",
                            marginBottom:
                                "8px",
                            fontWeight:
                                "600",
                            color:
                                "#334155",
                        }}
                    >
                        School Year
                    </label>

                    <select
                        id="school_year"
                        value={
                            selectedSchoolYearId
                        }
                        onChange={(e) =>
                            setSelectedSchoolYearId(
                                e.target.value
                            )
                        }
                        disabled={
                            loadingOptions ||
                            uploading
                        }
                        style={{
                            width:
                                "100%",
                            padding:
                                "12px",
                            border:
                                "1px solid #cbd5e1",
                            borderRadius:
                                "8px",
                            background:
                                "#ffffff",
                            fontSize:
                                "14px",
                            color:
                                "#334155",
                        }}
                    >

                        <option value="">
                            Select a school year
                        </option>

                        {schoolYears.map(
                            (schoolYear) => (

                                <option
                                    key={
                                        schoolYear.school_year_id
                                    }
                                    value={
                                        schoolYear.school_year_id
                                    }
                                >
                                    {schoolYear.school_year}
                                    {" "}
                                    (
                                    {
                                        schoolYear.status
                                    }
                                    )
                                </option>

                            )
                        )}

                    </select>

                </div>

                {/* FILE INPUT */}

                <div
                    style={{
                        border:
                            "2px dashed #cbd5e1",
                        borderRadius:
                            "10px",
                        padding:
                            "35px",
                        textAlign:
                            "center",
                        marginBottom:
                            "20px",
                    }}
                >

                    <Upload
                        size={40}
                        color="#2563eb"
                    />

                    <h3
                        style={{
                            margin:
                                "12px 0 6px",
                            color:
                                "#334155",
                        }}
                    >
                        Choose an Excel file
                    </h3>

                    <p
                        style={{
                            color:
                                "#64748b",
                            fontSize:
                                "14px",
                            marginBottom:
                                "18px",
                        }}
                    >
                        Select the e-Class Record
                        you want to upload.
                    </p>

                    <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={
                            handleFileChange
                        }
                        disabled={
                            uploading
                        }
                    />

                </div>

                {/* SELECTED FILE */}

                {selectedFile && (

                    <div
                        style={{
                            display:
                                "flex",
                            alignItems:
                                "center",
                            gap:
                                "12px",
                            padding:
                                "15px",
                            background:
                                "#f8fafc",
                            borderRadius:
                                "8px",
                            marginBottom:
                                "20px",
                        }}
                    >

                        <FileSpreadsheet
                            size={22}
                            color="#16a34a"
                        />

                        <div>

                            <strong>
                                {
                                    selectedFile.name
                                }
                            </strong>

                            <div
                                style={{
                                    fontSize:
                                        "13px",
                                    color:
                                        "#64748b",
                                    marginTop:
                                        "3px",
                                }}
                            >
                                {(
                                    selectedFile.size /
                                    1024
                                ).toFixed(1)}
                                {" "}
                                KB
                            </div>

                        </div>

                    </div>

                )}

                {/* ERROR */}

                {error && (

                    <div
                        style={{
                            display:
                                "flex",
                            alignItems:
                                "center",
                            gap:
                                "10px",
                            padding:
                                "14px",
                            background:
                                "#fef2f2",
                            color:
                                "#b91c1c",
                            borderRadius:
                                "8px",
                            marginBottom:
                                "20px",
                        }}
                    >

                        <AlertTriangle
                            size={20}
                        />

                        <span>
                            {error}
                        </span>

                    </div>

                )}

                {/* SUCCESS */}

                {successMessage && (

                    <div
                        style={{
                            display:
                                "flex",
                            alignItems:
                                "center",
                            gap:
                                "10px",
                            padding:
                                "14px",
                            background:
                                "#f0fdf4",
                            color:
                                "#15803d",
                            borderRadius:
                                "8px",
                            marginBottom:
                                "20px",
                        }}
                    >

                        <CheckCircle
                            size={20}
                        />

                        <span>
                            {
                                successMessage
                            }
                        </span>

                    </div>

                )}

                {/* UPLOAD BUTTON */}

                <button
                    type="button"
                    onClick={
                        handleUpload
                    }
                    disabled={
                        !selectedFile ||
                        !selectedSubjectId ||
                        !selectedSchoolYearId ||
                        uploading ||
                        loadingOptions
                    }
                    style={{
                        display:
                            "flex",
                        alignItems:
                            "center",
                        justifyContent:
                            "center",
                        gap:
                            "8px",
                        width:
                            "100%",
                        padding:
                            "13px",
                        border:
                            "none",
                        borderRadius:
                            "8px",
                        background:
                            !selectedFile ||
                                !selectedSubjectId ||
                                !selectedSchoolYearId ||
                                uploading ||
                                loadingOptions
                                ? "#94a3b8"
                                : "#2563eb",
                        color:
                            "#ffffff",
                        fontSize:
                            "15px",
                        fontWeight:
                            "600",
                        cursor:
                            !selectedFile ||
                                !selectedSubjectId ||
                                !selectedSchoolYearId ||
                                uploading ||
                                loadingOptions
                                ? "not-allowed"
                                : "pointer",
                    }}
                >

                    {uploading ? (

                        <>
                            <Loader2
                                size={18}
                                style={{
                                    animation:
                                        "spin 1s linear infinite",
                                }}
                            />

                            Uploading...

                        </>

                    ) : (

                        <>
                            <Upload
                                size={18}
                            />

                            Upload e-Class Record

                        </>

                    )}

                </button>

            </div>

            {/* RESULT */}

            {result && (

                <div
                    style={{
                        maxWidth:
                            "900px",
                        background:
                            "#ffffff",
                        borderRadius:
                            "12px",
                        padding:
                            "30px",
                        marginTop:
                            "25px",
                        boxShadow:
                            "0 2px 8px rgba(0,0,0,0.06)",
                        border:
                            "1px solid #e2e8f0",
                    }}
                >

                    <h2
                        style={{
                            marginTop:
                                0,
                            color:
                                "#0f172a",
                        }}
                    >
                        Class Record Created
                    </h2>

                    {/* CLASS RECORD INFO */}

                    {result.class_record && (

                        <div
                            style={{
                                background:
                                    "#f8fafc",
                                padding:
                                    "20px",
                                borderRadius:
                                    "8px",
                                marginBottom:
                                    "25px",
                            }}
                        >

                            <h3>
                                Record Information
                            </h3>

                            <p>
                                Class Record ID:{" "}
                                <strong>
                                    {result.class_record.class_record_id}
                                </strong>
                            </p>

                            <button
                                type="button"
                                onClick={() =>
                                (window.location.href =
                                    `/validation-results/${result.class_record.class_record_id}`)
                                }
                                style={{
                                    border: "none",
                                    borderRadius: "8px",
                                    padding: "10px 14px",
                                    background: "#2563eb",
                                    color: "#ffffff",
                                    fontWeight: "600",
                                    cursor: "pointer",
                                    marginTop: "10px",
                                }}
                            >
                                View Validation Results
                            </button>

                            <p>
                                Teacher:{" "}
                                <strong>
                                    {
                                        result
                                            .class_record
                                            .teacher_name
                                    }
                                </strong>
                            </p>

                            <p>
                                Subject:{" "}
                                <strong>
                                    {
                                        result
                                            .class_record
                                            .subject_name
                                    }
                                </strong>
                            </p>

                            <p>
                                Grade Level:{" "}
                                <strong>
                                    {
                                        result
                                            .class_record
                                            .grade_level
                                    }
                                </strong>
                            </p>

                            <p>
                                School Year:{" "}
                                <strong>
                                    {
                                        result
                                            .class_record
                                            .school_year
                                    }
                                </strong>
                            </p>

                            <p>
                                File:{" "}
                                <strong>
                                    {
                                        result
                                            .class_record
                                            .file_name
                                    }
                                </strong>
                            </p>

                            <p>
                                Status:{" "}
                                <strong>
                                    {
                                        result
                                            .class_record
                                            .status
                                    }
                                </strong>
                            </p>

                        </div>

                    )}

                    {/* WORKBOOK INFO */}

                    {result.workbook && (

                        <div
                            style={{
                                marginBottom:
                                    "25px",
                            }}
                        >

                            <h3>
                                Workbook
                            </h3>

                            <p>
                                Sheets:{" "}
                                <strong>
                                    {
                                        result
                                            .workbook
                                            .sheet_count
                                    }
                                </strong>
                            </p>

                            <p>
                                Sheet Names:{" "}
                                <strong>
                                    {result
                                        .workbook
                                        .sheet_names
                                        ?.join(
                                            ", "
                                        )}
                                </strong>
                            </p>

                        </div>

                    )}

                    {/* WORKSHEET INFO */}

                    {result.worksheet && (

                        <div
                            style={{
                                marginBottom:
                                    "25px",
                            }}
                        >

                            <h3>
                                Worksheet
                            </h3>

                            <p>
                                Name:{" "}
                                <strong>
                                    {
                                        result
                                            .worksheet
                                            .name
                                    }
                                </strong>
                            </p>

                            <p>
                                Rows:{" "}
                                <strong>
                                    {
                                        result
                                            .worksheet
                                            .row_count
                                    }
                                </strong>
                            </p>

                            <p>
                                Columns:{" "}
                                <strong>
                                    {result
                                        .worksheet
                                        .columns
                                        ?.join(
                                            ", "
                                        )}
                                </strong>
                            </p>

                        </div>

                    )}

                    {/* PREVIEW DATA */}

                    {result.preview &&
                        result.preview.length >
                        0 && (

                            <div>

                                <h3>
                                    Data Preview
                                </h3>

                                <div
                                    style={{
                                        overflowX:
                                            "auto",
                                    }}
                                >

                                    <table
                                        style={{
                                            width:
                                                "100%",
                                            borderCollapse:
                                                "collapse",
                                        }}
                                    >

                                        <thead>

                                            <tr>

                                                {Object.keys(
                                                    result
                                                        .preview[0]
                                                ).map(
                                                    (
                                                        column
                                                    ) => (

                                                        <th
                                                            key={
                                                                column
                                                            }
                                                            style={{
                                                                textAlign:
                                                                    "left",
                                                                padding:
                                                                    "10px",
                                                                borderBottom:
                                                                    "1px solid #e2e8f0",
                                                                background:
                                                                    "#f8fafc",
                                                            }}
                                                        >
                                                            {
                                                                column
                                                            }
                                                        </th>

                                                    )
                                                )}

                                            </tr>

                                        </thead>

                                        <tbody>

                                            {result.preview.map(
                                                (
                                                    row,
                                                    rowIndex
                                                ) => (

                                                    <tr
                                                        key={
                                                            rowIndex
                                                        }
                                                    >

                                                        {Object.keys(
                                                            result
                                                                .preview[0]
                                                        ).map(
                                                            (
                                                                column
                                                            ) => (

                                                                <td
                                                                    key={
                                                                        column
                                                                    }
                                                                    style={{
                                                                        padding:
                                                                            "10px",
                                                                        borderBottom:
                                                                            "1px solid #e2e8f0",
                                                                    }}
                                                                >
                                                                    {
                                                                        row[
                                                                        column
                                                                        ]
                                                                    }
                                                                </td>

                                                            )
                                                        )}

                                                    </tr>

                                                )
                                            )}

                                        </tbody>

                                    </table>

                                </div>

                            </div>

                        )}

                </div>

            )}

        </div>
    );
}

export default ClassRecordUpload;