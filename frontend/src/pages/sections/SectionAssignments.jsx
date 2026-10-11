import { useEffect, useState } from "react";
import {
    AlertTriangle,
    Loader2,
    Plus,
    Trash2,
    Layers,
    UserCheck,
    X,
} from "lucide-react";

import "../../styles/Dashboard.css";
import "./SectionAssignments.css";
import Sidebar from "../../components/Sidebar";
import { getToken } from "../../utils/session";
import { API_URL } from "../../config";


// Per SPMP v1.0 US-009/US-011: the Administrator configures each
// section's staffing mode and assigns teachers to it here. This is the
// only place either of those exists - everything else (upload
// restriction, the Adviser's self-contained upload access) reads what
// gets set on this page.
function SectionAssignments() {
    const [sections, setSections] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [schoolYears, setSchoolYears] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionError, setActionError] = useState("");
    const [actionMessage, setActionMessage] = useState("");

    const [showSectionForm, setShowSectionForm] = useState(false);
    const [sectionForm, setSectionForm] = useState({
        section_name: "",
        grade_level: "",
        staffing_mode: "Departmentalized",
    });
    const [savingSection, setSavingSection] = useState(false);

    const [showAssignmentForm, setShowAssignmentForm] = useState(false);
    const emptyAssignmentForm = {
        teacher_id: "",
        section_id: "",
        school_year_id: "",
        class_adviser: false,
        subject_ids: [],
    };
    const [assignmentForm, setAssignmentForm] = useState(emptyAssignmentForm);
    const [savingAssignment, setSavingAssignment] = useState(false);

    const authHeaders = () => {
        const token = getToken();

        if (!token) {
            throw new Error("Authentication token not found. Please log in again.");
        }

        return { Authorization: `Bearer ${token}` };
    };

    const loadAll = async () => {
        try {
            setLoading(true);
            setError("");

            const headers = authHeaders();

            const [sectionsRes, assignmentsRes, teachersRes, subjectsRes, yearsRes] = await Promise.all([
                fetch(`${API_URL}/sections`, { headers }),
                fetch(`${API_URL}/assignments`, { headers }),
                fetch(`${API_URL}/teachers`, { headers }),
                fetch(`${API_URL}/subjects`, { headers }),
                fetch(`${API_URL}/consolidation/school-years`, { headers }),
            ]);

            const [sectionsData, assignmentsData, teachersData, subjectsData, yearsData] = await Promise.all([
                sectionsRes.json(),
                assignmentsRes.json(),
                teachersRes.json(),
                subjectsRes.json(),
                yearsRes.json(),
            ]);

            if (!sectionsRes.ok) throw new Error(sectionsData.message || "Failed to load sections.");
            if (!assignmentsRes.ok) throw new Error(assignmentsData.message || "Failed to load assignments.");
            if (!teachersRes.ok) throw new Error(teachersData.message || "Failed to load teachers.");
            if (!subjectsRes.ok) throw new Error(subjectsData.message || "Failed to load subjects.");
            if (!yearsRes.ok) throw new Error(yearsData.message || "Failed to load school years.");

            setSections(sectionsData);
            setAssignments(assignmentsData);
            setTeachers(teachersData);
            setSubjects(subjectsData);
            setSchoolYears(yearsData.school_years || []);
        } catch (loadError) {
            setError(loadError.message || "Failed to load section and assignment data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAll();
    }, []);

    // ==========================================
    // SECTIONS
    // ==========================================

    const handleSectionFormChange = (e) => {
        const { name, value } = e.target;
        setSectionForm((previous) => ({ ...previous, [name]: value }));
    };

    const handleCreateSection = async (e) => {
        e.preventDefault();

        const confirmed = window.confirm(
            `Create section "${sectionForm.section_name}" (Grade ${sectionForm.grade_level} - ${sectionForm.staffing_mode})?`
        );

        if (!confirmed) return;

        setActionError("");
        setActionMessage("");
        setSavingSection(true);

        try {
            const response = await fetch(`${API_URL}/sections`, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...authHeaders() },
                body: JSON.stringify(sectionForm),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to create section.");
            }

            setSectionForm({ section_name: "", grade_level: "", staffing_mode: "Departmentalized" });
            setShowSectionForm(false);
            setActionMessage("Section created successfully.");
            await loadAll();
        } catch (createError) {
            setActionError(createError.message);
        } finally {
            setSavingSection(false);
        }
    };

    const handleStaffingModeChange = async (section, newMode) => {
        setActionError("");
        setActionMessage("");

        try {
            const response = await fetch(`${API_URL}/sections/${section.section_id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", ...authHeaders() },
                body: JSON.stringify({ staffing_mode: newMode }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to update staffing mode.");
            }

            setActionMessage(`${section.section_name}'s staffing mode updated to ${newMode}.`);
            await loadAll();
        } catch (updateError) {
            setActionError(updateError.message);
        }
    };

    const handleDeleteSection = async (section) => {
        const confirmed = window.confirm(
            `Delete section "${section.section_name}"? This also removes any teacher assignments tied to it.`
        );

        if (!confirmed) return;

        setActionError("");
        setActionMessage("");

        try {
            const response = await fetch(`${API_URL}/sections/${section.section_id}`, {
                method: "DELETE",
                headers: authHeaders(),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to delete section.");
            }

            setActionMessage("Section deleted successfully.");
            await loadAll();
        } catch (deleteError) {
            setActionError(deleteError.message);
        }
    };

    // ==========================================
    // ASSIGNMENTS
    // ==========================================

    // Changing the teacher, section or school year changes which slots are
    // valid and which are already taken, so the ticked boxes start over.
    const handleAssignmentFormChange = (e) => {
        const { name, value } = e.target;
        setAssignmentForm((previous) => ({ ...previous, [name]: value, class_adviser: false, subject_ids: [] }));
    };

    const toggleAssignmentSubject = (subjectId) => {
        setAssignmentForm((previous) => ({
            ...previous,
            subject_ids: previous.subject_ids.includes(subjectId)
                ? previous.subject_ids.filter((id) => id !== subjectId)
                : [...previous.subject_ids, subjectId],
        }));
    };

    const formTeacher = teachers.find(
        (teacher) => String(teacher.teacher_id) === String(assignmentForm.teacher_id)
    );
    const formSection = sections.find(
        (section) => String(section.section_id) === String(assignmentForm.section_id)
    );
    const formSubjects = formSection
        ? subjects.filter((subject) => String(subject.grade_level) === String(formSection.grade_level))
        : [];

    // Who already holds a slot in the chosen section and school year
    // (subjectId null = the Class Adviser slot).
    const slotHolder = (subjectId) => {
        const held = assignments.find(
            (assignment) =>
                String(assignment.section_id) === String(assignmentForm.section_id) &&
                String(assignment.school_year_id) === String(assignmentForm.school_year_id) &&
                (subjectId === null ? assignment.subject_id === null : String(assignment.subject_id) === String(subjectId))
        );
        return held ? `${held.first_name} ${held.last_name}` : null;
    };

    const handleCreateAssignment = async (e) => {
        e.preventDefault();

        const teacherLabel = formTeacher ? `${formTeacher.first_name} ${formTeacher.last_name}` : "this teacher";
        const sectionLabel = formSection ? formSection.section_name : "this section";
        const chosenSubjects = formSubjects.filter((subject) =>
            assignmentForm.subject_ids.includes(subject.subject_id)
        );
        const roleLabels = [
            ...(assignmentForm.class_adviser ? ["Class Adviser"] : []),
            ...chosenSubjects.map((subject) => subject.subject_name),
        ];

        if (roleLabels.length === 0) {
            setActionMessage("");
            setActionError("Tick Class Adviser, at least one subject, or both.");
            return;
        }

        const confirmed = window.confirm(
            `Assign ${teacherLabel} to ${sectionLabel} as:\n\n• ${roleLabels.join("\n• ")}\n\nDouble-check before confirming.`
        );

        if (!confirmed) return;

        setActionError("");
        setActionMessage("");
        setSavingAssignment(true);

        try {
            const response = await fetch(`${API_URL}/assignments/batch`, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...authHeaders() },
                body: JSON.stringify({
                    teacher_id: Number(assignmentForm.teacher_id),
                    section_id: Number(assignmentForm.section_id),
                    school_year_id: Number(assignmentForm.school_year_id),
                    class_adviser: assignmentForm.class_adviser,
                    subject_ids: assignmentForm.subject_ids,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to create the assignments.");
            }

            setAssignmentForm(emptyAssignmentForm);
            setShowAssignmentForm(false);
            setActionMessage(data.message || "Assignments created successfully.");
            await loadAll();
        } catch (createError) {
            setActionError(createError.message);
        } finally {
            setSavingAssignment(false);
        }
    };

    // What a teacher loses with the Class Adviser slot: every Adviser page is
    // scoped to the sections whose slot they hold, not to their subjects.
    const classAdviserLossWarning = (teacherName, sectionName) =>
        `${teacherName} will no longer be ${sectionName}'s Class Adviser, so they can no longer see its ` +
        "consolidated records, submit records for approval, return subjects to teachers or request revisions. " +
        "Their subject uploads are not affected.";

    const handleDeleteAssignment = async (assignment) => {
        const teacherName = `${assignment.first_name} ${assignment.last_name}`;
        const confirmed = window.confirm(
            assignment.subject_name
                ? `Remove ${teacherName}'s ${assignment.subject_name} assignment in ${assignment.section_name}?`
                : `Remove ${teacherName} as Class Adviser of ${assignment.section_name}?\n\n` +
                      classAdviserLossWarning(teacherName, assignment.section_name)
        );

        if (!confirmed) return;

        setActionError("");
        setActionMessage("");

        try {
            const response = await fetch(`${API_URL}/assignments/${assignment.assignment_id}`, {
                method: "DELETE",
                headers: authHeaders(),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to remove assignment.");
            }

            setActionMessage("Assignment removed successfully.");
            await loadAll();
        } catch (deleteError) {
            setActionError(deleteError.message);
        }
    };

    // Removes every slot one teacher holds in one section and school year,
    // one DELETE per assignment (the same endpoint as a single removal).
    const handleRemoveTeacherLoad = async (load) => {
        const labels = load.slots.map((slot) => slot.subject_name || "Class Adviser");
        const holdsAdviserSlot = load.slots.some((slot) => slot.subject_id === null);
        const confirmed = window.confirm(
            `Remove all of ${load.name}'s assignments in ${load.sectionName} (${load.schoolYear})?\n\n• ${labels.join("\n• ")}` +
                (holdsAdviserSlot ? `\n\n${classAdviserLossWarning(load.name, load.sectionName)}` : "")
        );

        if (!confirmed) return;

        setActionError("");
        setActionMessage("");

        let removed = 0;

        try {
            for (const slot of load.slots) {
                const response = await fetch(`${API_URL}/assignments/${slot.assignment_id}`, {
                    method: "DELETE",
                    headers: authHeaders(),
                });
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Failed to remove assignment.");
                }

                removed += 1;
            }

            setActionMessage(`${removed} assignment${removed === 1 ? "" : "s"} removed.`);
        } catch (deleteError) {
            setActionError(
                removed > 0
                    ? `${removed} of ${load.slots.length} removed, then: ${deleteError.message}`
                    : deleteError.message
            );
        } finally {
            await loadAll();
        }
    };

    // One group per section and school year, each holding one entry per
    // teacher with all of that teacher's slots, plus what is still unstaffed.
    // Sections with no assignments at all are listed under the newest year.
    const sectionGroups = (() => {
        const groups = new Map();
        const newestYear = schoolYears[0];

        const groupFor = (section, schoolYearId, schoolYearLabel) => {
            const key = `${section.section_id}:${schoolYearId}`;
            if (!groups.has(key)) {
                groups.set(key, { key, section, schoolYearId, schoolYear: schoolYearLabel, teachers: new Map() });
            }
            return groups.get(key);
        };

        assignments.forEach((assignment) => {
            const section = sections.find((s) => s.section_id === assignment.section_id) || {
                section_id: assignment.section_id,
                section_name: assignment.section_name,
                grade_level: assignment.grade_level,
                staffing_mode: assignment.staffing_mode,
            };
            const group = groupFor(section, assignment.school_year_id, assignment.school_year);

            if (!group.teachers.has(assignment.teacher_id)) {
                group.teachers.set(assignment.teacher_id, {
                    teacherId: assignment.teacher_id,
                    name: `${assignment.first_name} ${assignment.last_name}`,
                    role: assignment.teacher_role,
                    sectionName: section.section_name,
                    schoolYear: assignment.school_year,
                    slots: [],
                });
            }
            group.teachers.get(assignment.teacher_id).slots.push(assignment);
        });

        if (newestYear) {
            sections.forEach((section) => {
                const hasAny = [...groups.values()].some((group) => group.section.section_id === section.section_id);
                if (!hasAny) groupFor(section, newestYear.school_year_id, newestYear.school_year);
            });
        }

        return [...groups.values()]
            .map((group) => {
                const teachers = [...group.teachers.values()].map((teacher) => ({
                    ...teacher,
                    isAdviser: teacher.slots.some((slot) => slot.subject_id === null),
                    // Class Adviser chip first, then subjects alphabetically.
                    slots: [...teacher.slots].sort((a, b) =>
                        a.subject_id === null ? -1 : b.subject_id === null ? 1 : a.subject_name.localeCompare(b.subject_name)
                    ),
                }));
                teachers.sort((a, b) => Number(b.isAdviser) - Number(a.isAdviser) || a.name.localeCompare(b.name));

                const gradeSubjects = subjects.filter(
                    (subject) => String(subject.grade_level) === String(group.section.grade_level)
                );
                const assignedIds = new Set(
                    teachers.flatMap((teacher) => teacher.slots.map((slot) => slot.subject_id)).filter(Boolean)
                );
                const hasAdviser = teachers.some((teacher) => teacher.isAdviser);
                const selfContained = group.section.staffing_mode === "Self-Contained";

                return {
                    ...group,
                    teachers,
                    hasAdviser,
                    selfContained,
                    totalSubjects: gradeSubjects.length,
                    assignedCount: gradeSubjects.filter((subject) => assignedIds.has(subject.subject_id)).length,
                    unassigned: gradeSubjects.filter((subject) => !assignedIds.has(subject.subject_id)),
                };
            })
            .sort(
                (a, b) =>
                    String(a.section.grade_level).localeCompare(String(b.section.grade_level), undefined, { numeric: true }) ||
                    a.section.section_name.localeCompare(b.section.section_name) ||
                    String(b.schoolYear).localeCompare(String(a.schoolYear))
            );
    })();

    return (
        <div className="dashboard-layout">
            <Sidebar activeKey="section-assignments" />

            <main className="dashboard-main">
                <header className="dashboard-header">
                    <div>
                        <h1>Section &amp; Teacher Assignments</h1>
                        <p>
                            Set each section's staffing mode and assign teachers to the
                            subjects and sections they actually teach. Upload access is
                            enforced from what's configured here.
                        </p>
                    </div>
                </header>

                <section className="dashboard-content">
                    {error && (
                        <div className="error-banner">
                            <AlertTriangle size={20} />
                            <span>{error}</span>
                        </div>
                    )}

                    {actionError && (
                        <div className="error-banner">
                            <AlertTriangle size={20} />
                            <span>{actionError}</span>
                        </div>
                    )}

                    {actionMessage && !actionError && (
                        <div className="sa-success-banner">{actionMessage}</div>
                    )}

                    {loading && (
                        <div className="loading-state">
                            <Loader2 size={20} className="spin-icon" />
                            Loading sections and assignments...
                        </div>
                    )}

                    {!loading && (
                        <>
                            {/* ================= SECTIONS ================= */}
                            <div className="content-card">
                                <div className="card-header">
                                    <h3>
                                        <Layers size={18} className="sa-header-icon" />
                                        Sections
                                    </h3>

                                    <button
                                        type="button"
                                        className="sa-add-button"
                                        onClick={() => setShowSectionForm((v) => !v)}
                                    >
                                        <Plus size={16} />
                                        Add Section
                                    </button>
                                </div>

                                {showSectionForm && (
                                    <form className="sa-inline-form" onSubmit={handleCreateSection}>
                                        <div className="sa-field">
                                            <label htmlFor="section_name">Section Name</label>
                                            <input
                                                id="section_name"
                                                name="section_name"
                                                type="text"
                                                placeholder="e.g. Rizal"
                                                value={sectionForm.section_name}
                                                onChange={handleSectionFormChange}
                                                required
                                            />
                                        </div>

                                        <div className="sa-field">
                                            <label htmlFor="grade_level">Grade Level</label>
                                            <input
                                                id="grade_level"
                                                name="grade_level"
                                                type="text"
                                                placeholder="e.g. 6"
                                                value={sectionForm.grade_level}
                                                onChange={handleSectionFormChange}
                                                required
                                            />
                                        </div>

                                        <div className="sa-field">
                                            <label htmlFor="staffing_mode">Staffing Mode</label>
                                            <select
                                                id="staffing_mode"
                                                name="staffing_mode"
                                                value={sectionForm.staffing_mode}
                                                onChange={handleSectionFormChange}
                                            >
                                                <option value="Departmentalized">Departmentalized</option>
                                                <option value="Self-Contained">Self-Contained</option>
                                            </select>
                                        </div>

                                        <div className="sa-form-actions">
                                            <button
                                                type="button"
                                                className="sa-cancel-button"
                                                onClick={() => setShowSectionForm(false)}
                                                disabled={savingSection}
                                            >
                                                Cancel
                                            </button>

                                            <button type="submit" className="sa-save-button" disabled={savingSection}>
                                                {savingSection ? "Creating..." : "Create Section"}
                                            </button>
                                        </div>
                                    </form>
                                )}

                                <div className="table-container">
                                    <table className="sa-table">
                                        <thead>
                                            <tr>
                                                <th>Section</th>
                                                <th>Grade Level</th>
                                                <th>Staffing Mode</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {sections.length === 0 && (
                                                <tr>
                                                    <td colSpan="4" className="empty-state">
                                                        No sections yet. Add one to start assigning teachers.
                                                    </td>
                                                </tr>
                                            )}

                                            {sections.map((section) => (
                                                <tr key={section.section_id}>
                                                    <td>
                                                        <strong>{section.section_name}</strong>
                                                    </td>
                                                    <td>Grade {section.grade_level}</td>
                                                    <td>
                                                        <select
                                                            className={
                                                                section.staffing_mode === "Self-Contained"
                                                                    ? "sa-mode-select sa-mode-self-contained"
                                                                    : "sa-mode-select sa-mode-departmentalized"
                                                            }
                                                            value={section.staffing_mode}
                                                            onChange={(e) =>
                                                                handleStaffingModeChange(section, e.target.value)
                                                            }
                                                        >
                                                            <option value="Departmentalized">Departmentalized</option>
                                                            <option value="Self-Contained">Self-Contained</option>
                                                        </select>
                                                    </td>
                                                    <td>
                                                        <button
                                                            type="button"
                                                            className="sa-delete-button"
                                                            onClick={() => handleDeleteSection(section)}
                                                        >
                                                            <Trash2 size={15} />
                                                            Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* ================= ASSIGNMENTS ================= */}
                            <div className="content-card">
                                <div className="card-header">
                                    <h3>
                                        <UserCheck size={18} className="sa-header-icon" />
                                        Teacher Assignments
                                    </h3>

                                    <button
                                        type="button"
                                        className="sa-add-button"
                                        onClick={() => setShowAssignmentForm((v) => !v)}
                                        disabled={sections.length === 0 || teachers.length === 0}
                                    >
                                        <Plus size={16} />
                                        Add Assignment
                                    </button>
                                </div>

                                {sections.length === 0 && (
                                    <p className="sa-hint">Add a section first before assigning teachers.</p>
                                )}

                                {showAssignmentForm && (
                                    <form className="sa-inline-form" onSubmit={handleCreateAssignment}>
                                        <div className="sa-field">
                                            <label htmlFor="teacher_id">Teacher</label>
                                            <select
                                                id="teacher_id"
                                                name="teacher_id"
                                                value={assignmentForm.teacher_id}
                                                onChange={handleAssignmentFormChange}
                                                required
                                            >
                                                <option value="" disabled>
                                                    Select a teacher
                                                </option>
                                                {teachers.map((teacher) => (
                                                    <option key={teacher.teacher_id} value={teacher.teacher_id}>
                                                        {teacher.first_name} {teacher.last_name} (
                                                        {teacher.role === "adviser" ? "Adviser" : "Subject Teacher"})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="sa-field">
                                            <label htmlFor="section_id">Section</label>
                                            <select
                                                id="section_id"
                                                name="section_id"
                                                value={assignmentForm.section_id}
                                                onChange={handleAssignmentFormChange}
                                                required
                                            >
                                                <option value="" disabled>
                                                    Select a section
                                                </option>
                                                {sections.map((section) => (
                                                    <option key={section.section_id} value={section.section_id}>
                                                        {section.section_name} (Grade {section.grade_level} -{" "}
                                                        {section.staffing_mode})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="sa-field">
                                            <label htmlFor="school_year_id">School Year</label>
                                            <select
                                                id="school_year_id"
                                                name="school_year_id"
                                                value={assignmentForm.school_year_id}
                                                onChange={handleAssignmentFormChange}
                                                required
                                            >
                                                <option value="" disabled>
                                                    Select a school year
                                                </option>
                                                {schoolYears.map((year) => (
                                                    <option key={year.school_year_id} value={year.school_year_id}>
                                                        {year.school_year}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <fieldset className="sa-slot-picker">
                                            <legend>
                                                Assign as <span>(tick everything this teacher handles in the section)</span>
                                            </legend>

                                            {!formSection || !assignmentForm.school_year_id ? (
                                                <p className="sa-slot-hint">
                                                    Choose a section and school year to see its subjects.
                                                </p>
                                            ) : (
                                                <>
                                                    {(() => {
                                                        const holder = slotHolder(null);
                                                        const notAdviser = formTeacher && formTeacher.role !== "adviser";
                                                        return (
                                                            <label className={`sa-slot${holder || notAdviser ? " is-disabled" : ""}`}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={assignmentForm.class_adviser}
                                                                    disabled={Boolean(holder) || notAdviser}
                                                                    onChange={(event) =>
                                                                        setAssignmentForm((previous) => ({
                                                                            ...previous,
                                                                            class_adviser: event.target.checked,
                                                                        }))
                                                                    }
                                                                />
                                                                <span className="sa-slot-name">Class Adviser</span>
                                                                {holder && <span className="sa-slot-note">assigned to {holder}</span>}
                                                                {!holder && notAdviser && (
                                                                    <span className="sa-slot-note">needs an Adviser account</span>
                                                                )}
                                                            </label>
                                                        );
                                                    })()}

                                                    <p className="sa-slot-group">Subjects (Grade {formSection.grade_level})</p>

                                                    <div className="sa-slot-grid">
                                                        {formSubjects.map((subject) => {
                                                            const holder = slotHolder(subject.subject_id);
                                                            return (
                                                                <label
                                                                    key={subject.subject_id}
                                                                    className={`sa-slot${holder ? " is-disabled" : ""}`}
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={assignmentForm.subject_ids.includes(subject.subject_id)}
                                                                        disabled={Boolean(holder)}
                                                                        onChange={() => toggleAssignmentSubject(subject.subject_id)}
                                                                    />
                                                                    <span className="sa-slot-name">{subject.subject_name}</span>
                                                                    {holder && <span className="sa-slot-note">assigned to {holder}</span>}
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                </>
                                            )}
                                        </fieldset>

                                        <div className="sa-form-actions">
                                            <button
                                                type="button"
                                                className="sa-cancel-button"
                                                onClick={() => setShowAssignmentForm(false)}
                                                disabled={savingAssignment}
                                            >
                                                Cancel
                                            </button>

                                            <button
                                                type="submit"
                                                className="sa-save-button"
                                                disabled={savingAssignment}
                                            >
                                                {(() => {
                                                    const count =
                                                        assignmentForm.subject_ids.length + (assignmentForm.class_adviser ? 1 : 0);
                                                    if (savingAssignment) return "Saving...";
                                                    return count > 1 ? `Save ${count} Assignments` : "Save Assignment";
                                                })()}
                                            </button>
                                        </div>
                                    </form>
                                )}

                                <div className="sa-groups">
                                    {sectionGroups.length === 0 && <p className="sa-hint">No assignments yet.</p>}

                                    {sectionGroups.map((group) => (
                                        <section key={group.key} className="sa-group">
                                            <header className="sa-group-header">
                                                <div>
                                                    <h4>{group.section.section_name}</h4>
                                                    <span>
                                                        Grade {group.section.grade_level} · {group.section.staffing_mode} ·{" "}
                                                        {group.schoolYear}
                                                    </span>
                                                </div>
                                                <span className="sa-group-count">
                                                    {group.selfContained && group.hasAdviser
                                                        ? "Class Adviser teaches every subject"
                                                        : `${group.assignedCount} of ${group.totalSubjects} subjects assigned`}
                                                </span>
                                            </header>

                                            {group.teachers.map((teacher) => (
                                                <div key={teacher.teacherId} className="sa-teacher-row">
                                                    <div className="sa-teacher-name">
                                                        <strong>{teacher.name}</strong>
                                                        <span className="sa-teacher-role">
                                                            {teacher.role === "adviser" ? "Adviser" : "Subject Teacher"}
                                                        </span>
                                                    </div>

                                                    <div className="sa-chips">
                                                        {teacher.slots.map((slot) => {
                                                            const label = slot.subject_name || "Class Adviser";
                                                            return (
                                                                <span
                                                                    key={slot.assignment_id}
                                                                    className={`sa-chip${slot.subject_id === null ? " sa-chip-adviser" : ""}`}
                                                                >
                                                                    {label}
                                                                    <button
                                                                        type="button"
                                                                        className="sa-chip-remove"
                                                                        aria-label={`Remove ${label} from ${teacher.name}`}
                                                                        title={`Remove ${label}`}
                                                                        onClick={() => handleDeleteAssignment(slot)}
                                                                    >
                                                                        <X size={13} />
                                                                    </button>
                                                                </span>
                                                            );
                                                        })}
                                                    </div>

                                                    <button
                                                        type="button"
                                                        className="sa-delete-button"
                                                        onClick={() => handleRemoveTeacherLoad(teacher)}
                                                    >
                                                        <Trash2 size={15} />
                                                        Remove all
                                                    </button>
                                                </div>
                                            ))}

                                            {(!group.hasAdviser || (!group.selfContained && group.unassigned.length > 0)) && (
                                                <div className="sa-gaps">
                                                    <AlertTriangle size={15} />
                                                    <span>
                                                        {[
                                                            ...(!group.hasAdviser ? ["No Class Adviser yet"] : []),
                                                            ...(!group.selfContained && group.unassigned.length > 0
                                                                ? [
                                                                      `Not yet assigned: ${group.unassigned
                                                                          .map((subject) => subject.subject_name)
                                                                          .join(", ")}`,
                                                                  ]
                                                                : []),
                                                        ].join(" · ")}
                                                    </span>
                                                </div>
                                            )}
                                        </section>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </section>
            </main>
        </div>
    );
}

export default SectionAssignments;
