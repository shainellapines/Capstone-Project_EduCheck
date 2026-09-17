import { useEffect, useState } from "react";
import {
    AlertTriangle,
    Loader2,
    Plus,
    Trash2,
    Layers,
    UserCheck,
} from "lucide-react";

import "./Dashboard.css";
import "./SectionAssignments.css";
import Sidebar from "../components/Sidebar";
import { getToken } from "../utils/session";

const API_URL = "http://localhost:5000/api";

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
    const [assignmentForm, setAssignmentForm] = useState({
        teacher_id: "",
        section_id: "",
        subject_id: "",
        school_year_id: "",
    });
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

    const handleAssignmentFormChange = (e) => {
        const { name, value } = e.target;
        setAssignmentForm((previous) => ({ ...previous, [name]: value }));
    };

    const handleCreateAssignment = async (e) => {
        e.preventDefault();

        const selectedTeacher = teachers.find(
            (teacher) => String(teacher.teacher_id) === String(assignmentForm.teacher_id)
        );
        const selectedSection = sections.find(
            (section) => String(section.section_id) === String(assignmentForm.section_id)
        );
        const selectedSubject = subjects.find(
            (subject) => String(subject.subject_id) === String(assignmentForm.subject_id)
        );

        const teacherLabel = selectedTeacher
            ? `${selectedTeacher.first_name} ${selectedTeacher.last_name}`
            : "this teacher";
        const sectionLabel = selectedSection ? selectedSection.section_name : "this section";
        const roleLabel = selectedSubject ? selectedSubject.subject_name : "Class Adviser";

        const confirmed = window.confirm(
            `Assign ${teacherLabel} to ${sectionLabel} as ${roleLabel}? Double-check the subject and section before confirming.`
        );

        if (!confirmed) return;

        setActionError("");
        setActionMessage("");
        setSavingAssignment(true);

        try {
            const response = await fetch(`${API_URL}/assignments`, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...authHeaders() },
                body: JSON.stringify({
                    teacher_id: Number(assignmentForm.teacher_id),
                    section_id: Number(assignmentForm.section_id),
                    subject_id: assignmentForm.subject_id ? Number(assignmentForm.subject_id) : null,
                    school_year_id: Number(assignmentForm.school_year_id),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to create assignment.");
            }

            setAssignmentForm({ teacher_id: "", section_id: "", subject_id: "", school_year_id: "" });
            setShowAssignmentForm(false);
            setActionMessage("Assignment created successfully.");
            await loadAll();
        } catch (createError) {
            setActionError(createError.message);
        } finally {
            setSavingAssignment(false);
        }
    };

    const handleDeleteAssignment = async (assignment) => {
        const confirmed = window.confirm(
            `Remove ${assignment.first_name} ${assignment.last_name}'s assignment to ${assignment.section_name}${
                assignment.subject_name ? ` (${assignment.subject_name})` : " (Adviser)"
            }?`
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
                                            <label htmlFor="subject_id">
                                                Subject <span>(leave blank for Class Adviser)</span>
                                            </label>
                                            <select
                                                id="subject_id"
                                                name="subject_id"
                                                value={assignmentForm.subject_id}
                                                onChange={handleAssignmentFormChange}
                                            >
                                                <option value="">— Class Adviser (no single subject) —</option>
                                                {subjects.map((subject) => (
                                                    <option key={subject.subject_id} value={subject.subject_id}>
                                                        {subject.subject_name} (Grade {subject.grade_level})
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
                                                {savingAssignment ? "Creating..." : "Create Assignment"}
                                            </button>
                                        </div>
                                    </form>
                                )}

                                <div className="table-container">
                                    <table className="sa-table">
                                        <thead>
                                            <tr>
                                                <th>Teacher</th>
                                                <th>Section</th>
                                                <th>Subject</th>
                                                <th>School Year</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {assignments.length === 0 && (
                                                <tr>
                                                    <td colSpan="5" className="empty-state">
                                                        No assignments yet.
                                                    </td>
                                                </tr>
                                            )}

                                            {assignments.map((assignment) => (
                                                <tr key={assignment.assignment_id}>
                                                    <td>
                                                        <strong>
                                                            {assignment.first_name} {assignment.last_name}
                                                        </strong>
                                                        <span className="sa-teacher-role">
                                                            {assignment.teacher_role === "adviser"
                                                                ? "Adviser"
                                                                : "Subject Teacher"}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {assignment.section_name} (Grade {assignment.grade_level})
                                                    </td>
                                                    <td>
                                                        {assignment.subject_name || (
                                                            <span className="sa-adviser-tag">
                                                                Adviser — all subjects
                                                                {assignment.staffing_mode === "Self-Contained"
                                                                    ? " (Self-Contained)"
                                                                    : " (review only, Departmentalized)"}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td>{assignment.school_year}</td>
                                                    <td>
                                                        <button
                                                            type="button"
                                                            className="sa-delete-button"
                                                            onClick={() => handleDeleteAssignment(assignment)}
                                                        >
                                                            <Trash2 size={15} />
                                                            Remove
                                                        </button>
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

export default SectionAssignments;
