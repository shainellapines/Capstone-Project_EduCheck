import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    AlertTriangle,
    ArrowLeft,
    Building2,
    CheckCircle2,
    Download,
    FileSpreadsheet,
    Info,
    Loader2,
    Pencil,
    Plus,
    Save,
    Trash2,
    UserRound,
    X,
} from "lucide-react";

import "./Dashboard.css";
import "./PermanentRecord.css";
import Sidebar from "../components/Sidebar";
import { getStoredUser } from "../utils/session";
import { API_URL } from "../config";


const GRADES = ["1", "2", "3", "4", "5", "6"];

// Card status shown on each Grade 1-6 card. "Pending" is derived on the
// page (an EduCheck year that exists but is not yet Admin-approved).
const CARD_STATUS = {
    Complete: { label: "Complete", tone: "success" },
    Partial: { label: "Partially filled", tone: "warning" },
    Unsupported: { label: "3-term year", tone: "info" },
    Unavailable: { label: "Unavailable", tone: "warning" },
    Pending: { label: "Awaiting approval", tone: "info" },
    Missing: { label: "No record", tone: "neutral" },
};

const READINESS = {
    READY: { label: "Ready to generate", tone: "success", hint: "Every grade is complete." },
    PARTIAL: {
        label: "Partially ready",
        tone: "warning",
        hint: "The SF10 can be generated; the gaps below will stay blank on the form.",
    },
    NOT_READY: {
        label: "Not ready",
        tone: "danger",
        hint: "No grade can be placed on the form yet. Add an earlier year graded in 4 quarters to generate.",
    },
};

// Grade-level gaps are already visible on the Grade cards, so the checklist
// collapses them into one line instead of six.
const GRADE_CODES = new Set(["MISSING_GRADE", "NOT_YET_APPROVED", "SCHEME_NOT_SUPPORTED"]);

const authHeaders = (json = false) => {
    const token = localStorage.getItem("educheck_token");
    if (!token) throw new Error("Authentication token not found. Please log in again.");
    return json ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { Authorization: `Bearer ${token}` };
};

const emptyYearForm = (gradeLevel = "1") => ({
    school_year: "",
    grade_level: gradeLevel,
    grading_scheme: "QUARTER_4",
    record_status: "Complete",
    school_name: "",
    school_id: "",
    district: "",
    division: "",
    region: "",
    section_name: "",
    adviser_name: "",
    general_average: "",
    ratings: {},
});

const toNumberOrNull = (value) => (value === "" || value === null || value === undefined ? null : Number(value));

const initials = (learner) =>
    `${learner.first_name?.[0] ?? ""}${learner.last_name?.[0] ?? ""}`.toUpperCase() || "?";

function PermanentRecord() {
    const { lrn } = useParams();
    const navigate = useNavigate();
    const role = getStoredUser()?.role;
    const canEdit = role === "admin" || role === "adviser";

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [busy, setBusy] = useState(false);

    const [profile, setProfile] = useState({ middle_name: "", name_extension: "", sex: "", birth_date: "" });
    const [yearForm, setYearForm] = useState(null);
    const [settings, setSettings] = useState(null);

    const load = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            const response = await fetch(`${API_URL}/sf10/students/${lrn}`, { headers: authHeaders() });
            const body = await response.json();
            if (!response.ok) throw new Error(body.message || "Failed to load the permanent record.");

            setData(body);
            const learner = body.record.learner;
            setProfile({
                middle_name: learner.middle_name || "",
                name_extension: learner.name_extension || "",
                sex: learner.sex || "",
                birth_date: learner.birth_date ? String(learner.birth_date).slice(0, 10) : "",
            });
            setSettings(body.record.school_settings);
        } catch (loadError) {
            setError(loadError.message);
        } finally {
            setLoading(false);
        }
    }, [lrn]);

    useEffect(() => {
        load();
    }, [load]);

    // Escape closes the year dialog.
    useEffect(() => {
        if (!yearForm) return undefined;
        const onKey = (event) => event.key === "Escape" && setYearForm(null);
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [yearForm]);

    const catalog = data?.template.subject_catalog ?? {};

    // One view-model per Grade 1-6 card.
    const gradeCards = useMemo(() => {
        if (!data) return [];

        return GRADES.map((grade) => {
            const block = data.readiness.blocks.find((b) => b.grade_level === grade);
            const year = block?.school_year
                ? data.record.years.find((y) => y.school_year === block.school_year && y.source === block.source)
                : null;
            const pending = !year
                ? data.record.years.find((y) => y.grade_level === grade && y.source === "EDUCHECK" && !y.official)
                : null;
            const status = year ? block.status : pending ? "Pending" : "Missing";

            return { grade, status, year, pending };
        });
    }, [data]);

    const checklist = useMemo(() => {
        if (!data) return { items: [], missingGrades: [] };

        const issues = data.readiness.issues;
        return {
            items: issues.filter((issue) => !GRADE_CODES.has(issue.code)),
            missingGrades: issues.filter((issue) => issue.code === "MISSING_GRADE").map((issue) => issue.grade_level),
        };
    }, [data]);

    const run = async (action, successMessage) => {
        try {
            setBusy(true);
            setError("");
            setNotice("");
            await action();
            if (successMessage) setNotice(successMessage);
            await load();
        } catch (actionError) {
            setError(actionError.message);
        } finally {
            setBusy(false);
        }
    };

    const send = async (method, url, body) => {
        const response = await fetch(`${API_URL}${url}`, {
            method,
            headers: authHeaders(true),
            body: body ? JSON.stringify(body) : undefined,
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Request failed.");
        return result;
    };

    const saveProfile = () =>
        run(
            () =>
                send("PUT", `/sf10/students/${lrn}/profile`, {
                    middle_name: profile.middle_name,
                    name_extension: profile.name_extension,
                    sex: profile.sex || null,
                    birth_date: profile.birth_date || null,
                }),
            "Learner details saved."
        );

    const saveSettings = () => run(() => send("PUT", "/sf10/settings", settings), "School details saved.");

    const downloadSf10 = () =>
        run(async () => {
            const response = await fetch(`${API_URL}/sf10/students/${lrn}/download`, { headers: authHeaders() });
            if (!response.ok) {
                const body = await response.json();
                throw new Error(body.message || "Failed to generate the SF10.");
            }
            const blob = await response.blob();
            const disposition = response.headers.get("Content-Disposition") || "";
            const filename = /filename="([^"]+)"/.exec(disposition)?.[1] || `SF10-ES_${lrn}.xlsx`;
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = filename;
            link.click();
            URL.revokeObjectURL(url);
        }, "SF10 generated. Review it in Excel before printing; anything listed under Readiness stays blank on the form.");

    const editYear = (year) => {
        const ratings = {};
        year.subjects.forEach((subject) => {
            ratings[subject.subject_key] = {
                r: subject.ratings.map((value) => (value === null ? "" : String(value))),
                final: subject.final_rating === null ? "" : String(subject.final_rating),
            };
        });
        setYearForm({
            ...emptyYearForm(year.grade_level),
            school_year: year.school_year,
            grading_scheme: year.grading_scheme,
            record_status: year.record_status,
            ...Object.fromEntries(
                ["school_name", "school_id", "district", "division", "region"].map((key) => [key, year.school?.[key] || ""])
            ),
            section_name: year.section_name || "",
            adviser_name: year.adviser_name || "",
            general_average: year.general_average === null ? "" : String(year.general_average),
            ratings,
            editing: true,
        });
    };

    const deleteYear = (year) => {
        if (!window.confirm(`Delete the ${year.school_year} (Grade ${year.grade_level}) record?`)) return;
        run(() => send("DELETE", `/sf10/students/${lrn}/history/${year.historical_record_id}`), "Earlier year deleted.");
    };

    const saveYear = () => {
        const ratingCount = yearForm.grading_scheme === "QUARTER_4" ? 4 : 3;
        const subjects = (catalog[yearForm.grade_level] ?? [])
            .map(({ key }) => {
                const entry = yearForm.ratings[key];
                if (!entry) return null;
                const ratings = entry.r.slice(0, ratingCount).map(toNumberOrNull);
                const finalRating = toNumberOrNull(entry.final);
                if (ratings.every((value) => value === null) && finalRating === null) return null;
                return { subject_key: key, ratings, final_rating: finalRating };
            })
            .filter(Boolean);

        // eslint-disable-next-line no-unused-vars
        const { ratings: _ratings, editing: _editing, ...header } = yearForm;

        run(async () => {
            await send("PUT", `/sf10/students/${lrn}/history`, {
                ...header,
                general_average: toNumberOrNull(yearForm.general_average),
                subjects,
            });
            setYearForm(null);
        }, "Year saved.");
    };

    const setRating = (key, index, value) =>
        setYearForm((form) => {
            const entry = form.ratings[key] ?? { r: ["", "", "", ""], final: "" };
            const next = { ...entry, r: [...entry.r] };
            if (index === "final") next.final = value;
            else next.r[index] = value;
            return { ...form, ratings: { ...form.ratings, [key]: next } };
        });

    const learner = data?.record.learner;
    const readiness = data ? READINESS[data.readiness.status] : null;
    const filledCount = data?.readiness.filled_grade_levels.length ?? 0;
    const completeCount = gradeCards.filter((card) => card.status === "Complete").length;
    const ratingColumns = yearForm?.grading_scheme === "QUARTER_4" ? ["Q1", "Q2", "Q3", "Q4"] : ["T1", "T2", "T3"];

    return (
        <div className="dashboard-layout">
            <Sidebar activeKey="permanent-records" />

            <main className="dashboard-main">
                <header className="dashboard-header pr-header">
                    <div className="pr-header-main">
                        <button type="button" className="pr-back" onClick={() => navigate("/permanent-record")}>
                            <ArrowLeft size={15} /> SF10 Permanent Records
                        </button>

                        <div className="pr-identity">
                            <div className="pr-avatar" aria-hidden="true">
                                {learner ? initials(learner) : <UserRound size={22} />}
                            </div>
                            <div>
                                <h1>
                                    {learner
                                        ? `${learner.last_name}, ${learner.first_name}${learner.middle_name ? ` ${learner.middle_name}` : ""}${learner.name_extension ? ` ${learner.name_extension}` : ""}`
                                        : "Permanent Record"}
                                </h1>
                                {learner && (
                                    <div className="pr-identity-meta">
                                        <span className="pr-chip">LRN {learner.lrn}</span>
                                        {learner.sex && <span className="pr-chip">{learner.sex}</span>}
                                        <span className="pr-chip pr-chip-muted">SF10-ES · Learner's Permanent Academic Record</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {canEdit && data && (
                        <div className="pr-header-actions">
                            <button
                                type="button"
                                className="pr-btn pr-btn-primary"
                                onClick={downloadSf10}
                                disabled={busy || data.readiness.status === "NOT_READY"}
                            >
                                {busy ? <Loader2 size={16} className="spin-icon" /> : <Download size={16} />}
                                Generate SF10
                            </button>
                            {data.readiness.status === "NOT_READY" && (
                                <span className="pr-header-hint">Add a 4-quarter year to enable</span>
                            )}
                        </div>
                    )}
                </header>

                <section className="dashboard-content">
                    {error && (
                        <div className="error-banner">
                            <AlertTriangle size={20} />
                            <span>{error}</span>
                        </div>
                    )}

                    {notice && (
                        <div className="pr-toast" role="status">
                            <CheckCircle2 size={18} />
                            <span>{notice}</span>
                            <button type="button" aria-label="Dismiss" onClick={() => setNotice("")}>
                                <X size={16} />
                            </button>
                        </div>
                    )}

                    {loading && !data && (
                        <div className="loading-state">
                            <Loader2 size={20} className="spin-icon" />
                            Loading the permanent record...
                        </div>
                    )}

                    {data && (
                        <div className="pr-layout">
                            <div className="pr-main">
                                {/* Readiness summary */}
                                <div className={`pr-panel pr-summary pr-tone-${readiness.tone}`}>
                                    <div className="pr-summary-head">
                                        <div>
                                            <span className="pr-eyebrow">Readiness</span>
                                            <h2>{readiness.label}</h2>
                                            <p>{readiness.hint}</p>
                                        </div>
                                        <div className="pr-meter-figure">
                                            <div className="pr-meter-number">
                                                <strong>{filledCount}</strong>
                                                <span>/ 6</span>
                                            </div>
                                            <span>grades on the form</span>
                                        </div>
                                    </div>

                                    <div className="pr-meter" aria-hidden="true">
                                        {gradeCards.map((card) => (
                                            <span key={card.grade} className={`pr-meter-seg pr-seg-${card.status.toLowerCase()}`} />
                                        ))}
                                    </div>
                                    <div className="pr-meter-legend">
                                        <span><i className="pr-dot pr-seg-complete" />Complete {completeCount}</span>
                                        <span><i className="pr-dot pr-seg-partial" />Partial {gradeCards.filter((c) => c.status === "Partial").length}</span>
                                        <span><i className="pr-dot pr-seg-unsupported" />3-term / awaiting approval {gradeCards.filter((c) => c.status === "Unsupported" || c.status === "Pending").length}</span>
                                        <span><i className="pr-dot pr-seg-missing" />No record {gradeCards.filter((c) => c.status === "Missing").length}</span>
                                    </div>

                                    {(checklist.items.length > 0 || checklist.missingGrades.length > 0) && (
                                        <ul className="pr-checklist">
                                            {checklist.missingGrades.length > 0 && (
                                                <li className="pr-check-warning">
                                                    <AlertTriangle size={15} />
                                                    No record yet for Grade {checklist.missingGrades.join(", ")}.
                                                </li>
                                            )}
                                            {checklist.items.map((issue, index) => (
                                                <li key={`${issue.code}-${index}`} className={`pr-check-${issue.level}`}>
                                                    {issue.level === "info" ? <Info size={15} /> : <AlertTriangle size={15} />}
                                                    {issue.message}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>

                                {/* Grade 1-6 */}
                                <div className="pr-section-head">
                                    <div>
                                        <h2>Scholastic record</h2>
                                        <p>Grades 1 to 6, as they will appear on the form.</p>
                                    </div>
                                    {canEdit && (
                                        <button type="button" className="pr-btn pr-btn-ghost" onClick={() => setYearForm(emptyYearForm())}>
                                            <Plus size={16} /> Add earlier year
                                        </button>
                                    )}
                                </div>

                                <div className="pr-grade-grid">
                                    {gradeCards.map(({ grade, status, year, pending }) => {
                                        const statusInfo = CARD_STATUS[status];
                                        const ratingCount = year?.grading_scheme === "QUARTER_4" ? 4 : 3;

                                        return (
                                            <article key={grade} className={`pr-panel pr-grade pr-grade-${status.toLowerCase()}`}>
                                                <header className="pr-grade-head">
                                                    <div className="pr-grade-title">
                                                        <span className="pr-grade-number">{grade}</span>
                                                        <div>
                                                            <h3>Grade {grade}</h3>
                                                            <span className="pr-grade-sub">
                                                                {year
                                                                    ? year.school_year
                                                                    : pending
                                                                      ? `${pending.school_year} · EduCheck`
                                                                      : "Not yet recorded"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <span className={`pr-badge pr-badge-${statusInfo.tone}`}>{statusInfo.label}</span>
                                                </header>

                                                {year && (
                                                    <>
                                                        <div className="pr-grade-meta">
                                                            <span>
                                                                {year.source === "EDUCHECK" ? <FileSpreadsheet size={13} /> : <Pencil size={13} />}
                                                                {year.source === "EDUCHECK" ? "EduCheck (approved)" : "Entered manually"}
                                                            </span>
                                                            {year.section_name && <span>Section {year.section_name}</span>}
                                                            {year.school?.school_name && (
                                                                <span>
                                                                    <Building2 size={13} />
                                                                    {year.school.school_name}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {status === "Unsupported" && (
                                                            <p className="pr-grade-note">
                                                                Graded in 3 terms. Kept as recorded; it will be placed on the
                                                                form once DepEd releases a 3-term SF10.
                                                            </p>
                                                        )}

                                                        <div className="pr-table-wrap">
                                                            <table className="pr-table">
                                                                <thead>
                                                                    <tr>
                                                                        <th>Learning area</th>
                                                                        {Array.from({ length: ratingCount }, (_, i) => (
                                                                            <th key={i} className="pr-num">
                                                                                {ratingCount === 4 ? `Q${i + 1}` : `T${i + 1}`}
                                                                            </th>
                                                                        ))}
                                                                        <th className="pr-num">Final</th>
                                                                        <th>Remarks</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {year.subjects.map((subject) => (
                                                                        <tr key={subject.subject_key}>
                                                                            <td>{subject.label}</td>
                                                                            {subject.ratings.slice(0, ratingCount).map((rating, index) => (
                                                                                <td key={index} className="pr-num">
                                                                                    {rating ?? "-"}
                                                                                </td>
                                                                            ))}
                                                                            <td className="pr-num pr-strong">{subject.final_rating ?? "-"}</td>
                                                                            <td>
                                                                                {subject.remarks && (
                                                                                    <span
                                                                                        className={`pr-remark ${subject.remarks === "Failed" ? "pr-remark-failed" : ""}`}
                                                                                    >
                                                                                        {subject.remarks}
                                                                                    </span>
                                                                                )}
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>

                                                        <footer className="pr-grade-foot">
                                                            <div className="pr-ga">
                                                                <span>General average</span>
                                                                <strong>{year.general_average ?? "-"}</strong>
                                                            </div>
                                                            {canEdit && year.source === "HISTORICAL" && (
                                                                <div className="pr-icon-actions">
                                                                    <button type="button" onClick={() => editYear(year)} aria-label={`Edit Grade ${grade}`}>
                                                                        <Pencil size={15} />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        className="pr-icon-danger"
                                                                        onClick={() => deleteYear(year)}
                                                                        aria-label={`Delete Grade ${grade}`}
                                                                    >
                                                                        <Trash2 size={15} />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </footer>
                                                    </>
                                                )}

                                                {!year && (
                                                    <div className="pr-grade-empty">
                                                        <p>
                                                            {pending
                                                                ? `Uploaded in EduCheck (${pending.submission_status}). It counts once the Administrator approves it.`
                                                                : "No grades recorded for this level yet."}
                                                        </p>
                                                        {canEdit && !pending && (
                                                            <button
                                                                type="button"
                                                                className="pr-btn pr-btn-ghost pr-btn-sm"
                                                                onClick={() => setYearForm(emptyYearForm(grade))}
                                                            >
                                                                <Plus size={14} /> Add Grade {grade}
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </article>
                                        );
                                    })}
                                </div>
                            </div>

                            <aside className="pr-aside">
                                <div className="pr-panel">
                                    <div className="pr-panel-head">
                                        <UserRound size={18} />
                                        <div>
                                            <h2>Learner details</h2>
                                            <p>Not included in the e-Class Record.</p>
                                        </div>
                                    </div>
                                    <div className="pr-fields">
                                        <label className="pr-field">
                                            <span>Middle name</span>
                                            <input
                                                value={profile.middle_name}
                                                disabled={!canEdit}
                                                onChange={(e) => setProfile({ ...profile, middle_name: e.target.value })}
                                            />
                                        </label>
                                        <div className="pr-field-row">
                                            <label className="pr-field">
                                                <span>Extension</span>
                                                <input
                                                    value={profile.name_extension}
                                                    disabled={!canEdit}
                                                    placeholder="Jr., III"
                                                    onChange={(e) => setProfile({ ...profile, name_extension: e.target.value })}
                                                />
                                            </label>
                                            <label className="pr-field">
                                                <span>Sex</span>
                                                <select
                                                    value={profile.sex}
                                                    disabled={!canEdit}
                                                    onChange={(e) => setProfile({ ...profile, sex: e.target.value })}
                                                >
                                                    <option value="">Select</option>
                                                    <option value="Male">Male</option>
                                                    <option value="Female">Female</option>
                                                </select>
                                            </label>
                                        </div>
                                        <label className="pr-field">
                                            <span>Birthdate</span>
                                            <input
                                                type="date"
                                                value={profile.birth_date}
                                                disabled={!canEdit}
                                                onChange={(e) => setProfile({ ...profile, birth_date: e.target.value })}
                                            />
                                        </label>
                                    </div>
                                    {canEdit && (
                                        <button type="button" className="pr-btn pr-btn-secondary pr-btn-block" onClick={saveProfile} disabled={busy}>
                                            <Save size={15} /> Save details
                                        </button>
                                    )}
                                </div>

                                {settings && (
                                    <div className="pr-panel">
                                        <div className="pr-panel-head">
                                            <Building2 size={18} />
                                            <div>
                                                <h2>School details</h2>
                                                <p>Printed on years taken at this school.</p>
                                            </div>
                                        </div>
                                        {role === "admin" ? (
                                            <>
                                                <div className="pr-fields">
                                                    {[
                                                        ["school_name", "School name"],
                                                        ["school_id", "School ID"],
                                                        ["district", "District"],
                                                        ["division", "Division"],
                                                        ["region", "Region"],
                                                    ].map(([key, label]) => (
                                                        <label key={key} className="pr-field">
                                                            <span>{label}</span>
                                                            <input
                                                                value={settings[key] || ""}
                                                                onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
                                                            />
                                                        </label>
                                                    ))}
                                                </div>
                                                <button type="button" className="pr-btn pr-btn-secondary pr-btn-block" onClick={saveSettings} disabled={busy}>
                                                    <Save size={15} /> Save school details
                                                </button>
                                            </>
                                        ) : (
                                            <dl className="pr-dl">
                                                {[
                                                    ["School", settings.school_name],
                                                    ["School ID", settings.school_id],
                                                    ["District", settings.district],
                                                    ["Division", settings.division],
                                                    ["Region", settings.region],
                                                ].map(([label, value]) => (
                                                    <div key={label}>
                                                        <dt>{label}</dt>
                                                        <dd>{value || <span className="pr-muted">Not set by the Administrator</span>}</dd>
                                                    </div>
                                                ))}
                                            </dl>
                                        )}
                                    </div>
                                )}

                                <p className="pr-footnote">
                                    {data.template.name}. 3-term years are never converted into quarters.
                                </p>
                            </aside>
                        </div>
                    )}
                </section>
            </main>

            {yearForm && (
                <div className="pr-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setYearForm(null)}>
                    <div className="pr-modal" role="dialog" aria-modal="true" aria-labelledby="pr-modal-title">
                        <header className="pr-modal-head">
                            <div>
                                <h2 id="pr-modal-title">{yearForm.editing ? "Edit" : "Add"} Grade {yearForm.grade_level} record</h2>
                                <p>For years completed before EduCheck or at another school. Saving the same school year again replaces it.</p>
                            </div>
                            <button type="button" className="pr-modal-close" onClick={() => setYearForm(null)} aria-label="Close">
                                <X size={18} />
                            </button>
                        </header>

                        <div className="pr-modal-body">
                            <h3 className="pr-form-section">School year</h3>
                            <div className="pr-form-grid">
                                <label className="pr-field">
                                    <span>School year</span>
                                    <input
                                        value={yearForm.school_year}
                                        placeholder="2023-2024"
                                        onChange={(e) => setYearForm({ ...yearForm, school_year: e.target.value })}
                                    />
                                </label>
                                <label className="pr-field">
                                    <span>Grade</span>
                                    <select
                                        value={yearForm.grade_level}
                                        onChange={(e) => setYearForm({ ...yearForm, grade_level: e.target.value, ratings: {} })}
                                    >
                                        {GRADES.map((grade) => (
                                            <option key={grade} value={grade}>
                                                Grade {grade}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label className="pr-field">
                                    <span>Graded in</span>
                                    <select
                                        value={yearForm.grading_scheme}
                                        onChange={(e) => setYearForm({ ...yearForm, grading_scheme: e.target.value })}
                                    >
                                        <option value="QUARTER_4">4 quarters</option>
                                        <option value="TERM_3">3 terms</option>
                                    </select>
                                </label>
                                <label className="pr-field">
                                    <span>Record status</span>
                                    <select
                                        value={yearForm.record_status}
                                        onChange={(e) => setYearForm({ ...yearForm, record_status: e.target.value })}
                                    >
                                        <option value="Complete">Complete</option>
                                        <option value="Partial">Partial</option>
                                        <option value="Unavailable">Unavailable</option>
                                    </select>
                                </label>
                            </div>

                            <h3 className="pr-form-section">School and class</h3>
                            <div className="pr-form-grid">
                                {[
                                    ["school_name", "School"],
                                    ["school_id", "School ID"],
                                    ["district", "District"],
                                    ["division", "Division"],
                                    ["region", "Region"],
                                    ["section_name", "Section"],
                                    ["adviser_name", "Adviser"],
                                ].map(([key, label]) => (
                                    <label key={key} className="pr-field">
                                        <span>{label}</span>
                                        <input value={yearForm[key]} onChange={(e) => setYearForm({ ...yearForm, [key]: e.target.value })} />
                                    </label>
                                ))}
                            </div>

                            <h3 className="pr-form-section">Ratings</h3>
                            <p className="pr-muted pr-small">
                                Ratings are 60-100. Leave Final blank to compute it from the {yearForm.grading_scheme === "QUARTER_4" ? "quarters" : "terms"}.
                            </p>
                            <div className="pr-table-wrap">
                                <table className="pr-table pr-entry">
                                    <thead>
                                        <tr>
                                            <th>Learning area</th>
                                            {ratingColumns.map((label) => (
                                                <th key={label} className="pr-num">
                                                    {label}
                                                </th>
                                            ))}
                                            <th className="pr-num">Final</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(catalog[yearForm.grade_level] ?? []).map(({ key, label }) => {
                                            const entry = yearForm.ratings[key] ?? { r: ["", "", "", ""], final: "" };
                                            return (
                                                <tr key={key}>
                                                    <td>{label}</td>
                                                    {ratingColumns.map((column, index) => (
                                                        <td key={column} className="pr-num">
                                                            <input
                                                                type="number"
                                                                min="60"
                                                                max="100"
                                                                aria-label={`${label} ${column}`}
                                                                value={entry.r[index]}
                                                                onChange={(e) => setRating(key, index, e.target.value)}
                                                            />
                                                        </td>
                                                    ))}
                                                    <td className="pr-num">
                                                        <input
                                                            type="number"
                                                            min="60"
                                                            max="100"
                                                            aria-label={`${label} final rating`}
                                                            placeholder="auto"
                                                            value={entry.final}
                                                            onChange={(e) => setRating(key, "final", e.target.value)}
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div className="pr-form-grid pr-form-grid-narrow">
                                <label className="pr-field">
                                    <span>General average</span>
                                    <input
                                        type="number"
                                        min="60"
                                        max="100"
                                        placeholder="Computed if blank"
                                        value={yearForm.general_average}
                                        onChange={(e) => setYearForm({ ...yearForm, general_average: e.target.value })}
                                    />
                                </label>
                            </div>
                        </div>

                        <footer className="pr-modal-foot">
                            <button type="button" className="pr-btn pr-btn-secondary" onClick={() => setYearForm(null)}>
                                Cancel
                            </button>
                            <button type="button" className="pr-btn pr-btn-primary" onClick={saveYear} disabled={busy}>
                                {busy ? <Loader2 size={16} className="spin-icon" /> : <Save size={16} />}
                                Save record
                            </button>
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PermanentRecord;
