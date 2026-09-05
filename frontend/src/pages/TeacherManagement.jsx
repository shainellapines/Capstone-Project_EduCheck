import { useEffect, useState } from "react";
import {
    ArrowLeft,
    Plus,
    Search,
    Users,
    X,
    Pencil,
    Trash2,
} from "lucide-react";

import "./TeacherManagement.css";

function TeacherManagement() {
    const API_URL = "http://localhost:5000/api";

    // ==========================================
    // TEACHER DATA
    // ==========================================

    const [searchTerm, setSearchTerm] = useState("");
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // ==========================================
    // ADD TEACHER
    // ==========================================

    const [showAddModal, setShowAddModal] =
        useState(false);

    const [formData, setFormData] = useState({
        user_id: "",
        employee_number: "",
        first_name: "",
        last_name: "",
        contact_number: "",
    });

    const [addingTeacher, setAddingTeacher] =
        useState(false);

    // ==========================================
    // EDIT TEACHER
    // ==========================================

    const [showEditModal, setShowEditModal] =
        useState(false);

    const [editingTeacherId, setEditingTeacherId] =
        useState(null);

    const [editFormData, setEditFormData] =
        useState({
            employee_number: "",
            first_name: "",
            last_name: "",
            contact_number: "",
        });

    const [updatingTeacher, setUpdatingTeacher] =
        useState(false);

    // ==========================================
    // DELETE TEACHER
    // ==========================================

    const [deletingTeacherId, setDeletingTeacherId] =
        useState(null);

    // ==========================================
    // MESSAGES
    // ==========================================

    const [successMessage, setSuccessMessage] =
        useState("");

    const [formError, setFormError] =
        useState("");

    // ==========================================
    // GET TEACHERS
    // ==========================================

    const fetchTeachers = async () => {
        try {
            setLoading(true);
            setError("");

            const token =
                localStorage.getItem(
                    "educheck_token"
                );

            if (!token) {
                throw new Error(
                    "Authentication token not found."
                );
            }

            const response = await fetch(
                `${API_URL}/teachers`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Failed to retrieve teachers."
                );
            }

            setTeachers(data);

        } catch (error) {
            console.error(
                "Fetch teachers error:",
                error
            );

            setError(error.message);

        } finally {
            setLoading(false);
        }
    };

    // Load teachers when page opens
    useEffect(() => {
        fetchTeachers();
    }, []);

    // ==========================================
    // SUMMARY
    // ==========================================

    const activeTeachers =
        teachers.filter(
            (teacher) =>
                teacher.status &&
                teacher.status.toLowerCase() ===
                    "active"
        ).length;

    // ==========================================
    // SEARCH
    // ==========================================

    const filteredTeachers =
        teachers.filter((teacher) => {
            const fullName =
                `${teacher.first_name || ""} ${
                    teacher.last_name || ""
                }`.toLowerCase();

            const username =
                (
                    teacher.username || ""
                ).toLowerCase();

            const employeeNumber =
                (
                    teacher.employee_number || ""
                ).toLowerCase();

            const search =
                searchTerm.toLowerCase();

            return (
                fullName.includes(search) ||
                username.includes(search) ||
                employeeNumber.includes(search)
            );
        });

    // ==========================================
    // FORM CHANGE
    // ==========================================

    const handleFormChange = (e) => {
        const {
            name,
            value,
        } = e.target;

        setFormData((previousData) => ({
            ...previousData,
            [name]: value,
        }));
    };

    // ==========================================
    // ADD TEACHER
    // ==========================================

    const openAddModal = () => {
        setFormData({
            user_id: "",
            employee_number: "",
            first_name: "",
            last_name: "",
            contact_number: "",
        });

        setFormError("");
        setSuccessMessage("");

        setShowAddModal(true);
    };

    const closeAddModal = () => {
        if (addingTeacher) {
            return;
        }

        setShowAddModal(false);
        setFormError("");
    };

    const handleAddTeacher = async (e) => {
        e.preventDefault();

        setFormError("");
        setSuccessMessage("");
        setAddingTeacher(true);

        try {
            const token =
                localStorage.getItem(
                    "educheck_token"
                );

            if (!token) {
                throw new Error(
                    "Authentication token not found."
                );
            }

            const response = await fetch(
                `${API_URL}/teachers`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`,
                    },

                    body: JSON.stringify({
                        user_id: Number(
                            formData.user_id
                        ),

                        employee_number:
                            formData.employee_number,

                        first_name:
                            formData.first_name,

                        last_name:
                            formData.last_name,

                        contact_number:
                            formData.contact_number ||
                            null,
                    }),
                }
            );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Failed to create teacher."
                );
            }

            setShowAddModal(false);

            setFormData({
                user_id: "",
                employee_number: "",
                first_name: "",
                last_name: "",
                contact_number: "",
            });

            setSuccessMessage(
                "Teacher created successfully."
            );

            await fetchTeachers();

        } catch (error) {
            console.error(
                "Add teacher error:",
                error
            );

            setFormError(
                error.message
            );

        } finally {
            setAddingTeacher(false);
        }
    };

    // ==========================================
    // EDIT TEACHER
    // ==========================================

    const openEditModal = (teacher) => {
        setEditingTeacherId(
            teacher.teacher_id
        );

        setEditFormData({
            employee_number:
                teacher.employee_number || "",

            first_name:
                teacher.first_name || "",

            last_name:
                teacher.last_name || "",

            contact_number:
                teacher.contact_number || "",
        });

        setFormError("");
        setSuccessMessage("");

        setShowEditModal(true);
    };

    const closeEditModal = () => {
        if (updatingTeacher) {
            return;
        }

        setShowEditModal(false);
        setEditingTeacherId(null);
        setFormError("");
    };

    const handleEditFormChange = (e) => {
        const {
            name,
            value,
        } = e.target;

        setEditFormData(
            (previousData) => ({
                ...previousData,
                [name]: value,
            })
        );
    };

    const handleUpdateTeacher = async (e) => {
        e.preventDefault();

        setFormError("");
        setSuccessMessage("");
        setUpdatingTeacher(true);

        try {
            const token =
                localStorage.getItem(
                    "educheck_token"
                );

            if (!token) {
                throw new Error(
                    "Authentication token not found."
                );
            }

            const response = await fetch(
                `${API_URL}/teachers/${editingTeacherId}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`,
                    },

                    body: JSON.stringify({
                        employee_number:
                            editFormData.employee_number,

                        first_name:
                            editFormData.first_name,

                        last_name:
                            editFormData.last_name,

                        contact_number:
                            editFormData.contact_number ||
                            null,
                    }),
                }
            );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Failed to update teacher."
                );
            }

            setShowEditModal(false);
            setEditingTeacherId(null);

            setSuccessMessage(
                "Teacher updated successfully."
            );

            await fetchTeachers();

        } catch (error) {
            console.error(
                "Update teacher error:",
                error
            );

            setFormError(
                error.message
            );

        } finally {
            setUpdatingTeacher(false);
        }
    };

    // ==========================================
    // DELETE TEACHER
    // ==========================================

    const handleDeleteTeacher = async (teacher) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete the teacher profile for ${teacher.first_name} ${teacher.last_name}?`
        );

        if (!confirmed) {
            return;
        }

        setFormError("");
        setSuccessMessage("");
        setDeletingTeacherId(teacher.teacher_id);

        try {
            const token =
                localStorage.getItem(
                    "educheck_token"
                );

            if (!token) {
                throw new Error(
                    "Authentication token not found."
                );
            }

            const response = await fetch(
                `${API_URL}/teachers/${teacher.teacher_id}`,
                {
                    method: "DELETE",

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
                        "Failed to delete teacher."
                );
            }

            setSuccessMessage(
                "Teacher deleted successfully."
            );

            await fetchTeachers();

        } catch (error) {
            console.error(
                "Delete teacher error:",
                error
            );

            setFormError(
                error.message
            );

        } finally {
            setDeletingTeacherId(null);
        }
    };

    // ==========================================
    // UI
    // ==========================================

    return (
        <div className="teacher-management-page">

            {/* HEADER */}

            <header className="teacher-management-header">

                <div className="header-left">

                    <button
                        className="back-button"
                        onClick={() =>
                            (window.location.href =
                                "/dashboard")
                        }
                    >
                        <ArrowLeft size={18} />

                        Back to Dashboard
                    </button>

                    <div>
                        <h1>
                            Teacher Management
                        </h1>

                        <p>
                            Manage teacher profiles
                            and account information
                        </p>
                    </div>

                </div>

                <button
                    className="add-user-button"
                    onClick={openAddModal}
                >
                    <Plus size={18} />

                    Add Teacher
                </button>

            </header>

            {/* SUCCESS MESSAGE */}

            {successMessage && (
                <div className="teacher-success-message">
                    {successMessage}
                </div>
            )}

            {/* SUMMARY */}

            <section className="user-summary">

                <div className="summary-card">

                    <div>
                        <span>
                            Total Teachers
                        </span>

                        <strong>
                            {teachers.length}
                        </strong>
                    </div>

                    <div className="summary-icon blue">
                        <Users size={22} />
                    </div>

                </div>

                <div className="summary-card">

                    <div>
                        <span>
                            Active Teachers
                        </span>

                        <strong>
                            {activeTeachers}
                        </strong>
                    </div>

                    <div className="summary-icon green">
                        <Users size={22} />
                    </div>

                </div>

            </section>

            {/* TEACHER RECORDS */}

            <section className="user-management-card">

                <div className="user-management-card-header">

                    <div>
                        <h2>
                            Teacher Records
                        </h2>

                        <p>
                            View and manage registered
                            teacher profiles
                        </p>
                    </div>

                    <div className="search-container">

                        <Search size={18} />

                        <input
                            type="text"
                            placeholder="Search teachers..."
                            value={searchTerm}
                            onChange={(e) =>
                                setSearchTerm(
                                    e.target.value
                                )
                            }
                        />

                    </div>

                </div>

                <div className="table-container">

                    <table className="users-table">

                        <thead>

                            <tr>
                                <th>
                                    Teacher
                                </th>

                                <th>
                                    Email
                                </th>

                                <th>
                                    Role
                                </th>

                                <th>
                                    Status
                                </th>

                                <th>
                                    Actions
                                </th>
                            </tr>

                        </thead>

                        <tbody>

                            {/* LOADING */}

                            {loading && (
                                <tr>
                                    <td
                                        colSpan="5"
                                        className="empty-state"
                                    >
                                        Loading teacher
                                        records...
                                    </td>
                                </tr>
                            )}

                            {/* ERROR */}

                            {!loading &&
                                error && (
                                <tr>
                                    <td
                                        colSpan="5"
                                        className="empty-state"
                                    >
                                        <strong>
                                            Failed to load
                                            teacher records
                                        </strong>

                                        <span>
                                            {error}
                                        </span>
                                    </td>
                                </tr>
                            )}

                            {/* EMPTY */}

                            {!loading &&
                                !error &&
                                teachers.length ===
                                    0 && (
                                <tr>
                                    <td
                                        colSpan="5"
                                        className="empty-state"
                                    >
                                        <Users
                                            size={32}
                                        />

                                        <strong>
                                            No teacher
                                            records yet
                                        </strong>

                                        <span>
                                            Teacher records
                                            will appear
                                            here once they
                                            are added.
                                        </span>
                                    </td>
                                </tr>
                            )}

                            {/* RECORDS */}

                            {!loading &&
                                !error &&
                                filteredTeachers.map(
                                    (teacher) => (
                                        <tr
                                            key={
                                                teacher.teacher_id
                                            }
                                        >

                                            <td>
                                                <strong>
                                                    {
                                                        teacher.first_name
                                                    }{" "}
                                                    {
                                                        teacher.last_name
                                                    }
                                                </strong>

                                                <span className="teacher-username">
                                                    @
                                                    {
                                                        teacher.username
                                                    }
                                                </span>
                                            </td>

                                            <td>
                                                {
                                                    teacher.email
                                                }
                                            </td>

                                            <td>
                                                {teacher.role ===
                                                "adviser"
                                                    ? "Class Adviser"
                                                    : teacher.role ===
                                                      "subject"
                                                    ? "Subject Teacher"
                                                    : teacher.role}
                                            </td>

                                            <td>
                                                <span
                                                    className={
                                                        teacher.status?.toLowerCase() ===
                                                        "active"
                                                            ? "status-active"
                                                            : "status-inactive"
                                                    }
                                                >
                                                    {
                                                        teacher.status
                                                    }
                                                </span>
                                            </td>

                                            <td>

                                                <div className="teacher-action-buttons">

                                                    {/* EDIT */}

                                                    <button
                                                        type="button"
                                                        className="teacher-edit-button"
                                                        onClick={() =>
                                                            openEditModal(
                                                                teacher
                                                            )
                                                        }
                                                        disabled={
                                                            deletingTeacherId ===
                                                            teacher.teacher_id
                                                        }
                                                    >
                                                        <Pencil
                                                            size={
                                                                15
                                                            }
                                                        />

                                                        Edit
                                                    </button>

                                                    {/* DELETE */}

                                                    <button
                                                        type="button"
                                                        className="teacher-delete-button"
                                                        onClick={() =>
                                                            handleDeleteTeacher(
                                                                teacher
                                                            )
                                                        }
                                                        disabled={
                                                            deletingTeacherId ===
                                                            teacher.teacher_id
                                                        }
                                                    >
                                                        <Trash2
                                                            size={
                                                                15
                                                            }
                                                        />

                                                        {deletingTeacherId ===
                                                        teacher.teacher_id
                                                            ? "Deleting..."
                                                            : "Delete"}
                                                    </button>

                                                </div>

                                            </td>

                                        </tr>
                                    )
                                )}

                        </tbody>

                    </table>

                </div>

            </section>

            {/* ==========================================
                ADD TEACHER MODAL
                ========================================== */}

            {showAddModal && (
                <div className="teacher-modal-overlay">

                    <div className="teacher-modal">

                        <div className="teacher-modal-header">

                            <div>
                                <h2>
                                    Add Teacher
                                </h2>

                                <p>
                                    Create a teacher profile
                                    for an existing EduCheck
                                    user account.
                                </p>
                            </div>

                            <button
                                type="button"
                                className="teacher-modal-close"
                                onClick={
                                    closeAddModal
                                }
                            >
                                <X size={20} />
                            </button>

                        </div>

                        {formError && (
                            <div className="teacher-form-error">
                                {formError}
                            </div>
                        )}

                        <form
                            onSubmit={
                                handleAddTeacher
                            }
                        >

                            <div className="teacher-form-group">

                                <label htmlFor="user_id">
                                    User ID
                                </label>

                                <input
                                    id="user_id"
                                    name="user_id"
                                    type="number"
                                    min="1"
                                    placeholder="Example: 7"
                                    value={
                                        formData.user_id
                                    }
                                    onChange={
                                        handleFormChange
                                    }
                                    required
                                />

                                <small>
                                    Enter the ID of the
                                    existing EduCheck user
                                    account.
                                </small>

                            </div>

                            <div className="teacher-form-group">

                                <label htmlFor="employee_number">
                                    Employee Number
                                </label>

                                <input
                                    id="employee_number"
                                    name="employee_number"
                                    type="text"
                                    placeholder="Example: EMP-2026-001"
                                    value={
                                        formData.employee_number
                                    }
                                    onChange={
                                        handleFormChange
                                    }
                                    required
                                />

                            </div>

                            <div className="teacher-form-group">

                                <label htmlFor="first_name">
                                    First Name
                                </label>

                                <input
                                    id="first_name"
                                    name="first_name"
                                    type="text"
                                    placeholder="Enter first name"
                                    value={
                                        formData.first_name
                                    }
                                    onChange={
                                        handleFormChange
                                    }
                                    required
                                />

                            </div>

                            <div className="teacher-form-group">

                                <label htmlFor="last_name">
                                    Last Name
                                </label>

                                <input
                                    id="last_name"
                                    name="last_name"
                                    type="text"
                                    placeholder="Enter last name"
                                    value={
                                        formData.last_name
                                    }
                                    onChange={
                                        handleFormChange
                                    }
                                    required
                                />

                            </div>

                            <div className="teacher-form-group">

                                <label htmlFor="contact_number">
                                    Contact Number
                                    <span>
                                        {" "}
                                        (Optional)
                                    </span>
                                </label>

                                <input
                                    id="contact_number"
                                    name="contact_number"
                                    type="text"
                                    placeholder="Enter contact number"
                                    value={
                                        formData.contact_number
                                    }
                                    onChange={
                                        handleFormChange
                                    }
                                />

                            </div>

                            <div className="teacher-modal-actions">

                                <button
                                    type="button"
                                    className="cancel-button"
                                    onClick={
                                        closeAddModal
                                    }
                                    disabled={
                                        addingTeacher
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="save-teacher-button"
                                    disabled={
                                        addingTeacher
                                    }
                                >
                                    {addingTeacher
                                        ? "Creating..."
                                        : "Create Teacher"}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>
            )}

            {/* ==========================================
                EDIT TEACHER MODAL
                ========================================== */}

            {showEditModal && (
                <div className="teacher-modal-overlay">

                    <div className="teacher-modal">

                        <div className="teacher-modal-header">

                            <div>
                                <h2>
                                    Edit Teacher
                                </h2>

                                <p>
                                    Update the teacher's
                                    profile information.
                                </p>
                            </div>

                            <button
                                type="button"
                                className="teacher-modal-close"
                                onClick={
                                    closeEditModal
                                }
                            >
                                <X size={20} />
                            </button>

                        </div>

                        {formError && (
                            <div className="teacher-form-error">
                                {formError}
                            </div>
                        )}

                        <form
                            onSubmit={
                                handleUpdateTeacher
                            }
                        >

                            <div className="teacher-form-group">

                                <label htmlFor="edit_employee_number">
                                    Employee Number
                                </label>

                                <input
                                    id="edit_employee_number"
                                    name="employee_number"
                                    type="text"
                                    value={
                                        editFormData.employee_number
                                    }
                                    onChange={
                                        handleEditFormChange
                                    }
                                    required
                                />

                            </div>

                            <div className="teacher-form-group">

                                <label htmlFor="edit_first_name">
                                    First Name
                                </label>

                                <input
                                    id="edit_first_name"
                                    name="first_name"
                                    type="text"
                                    value={
                                        editFormData.first_name
                                    }
                                    onChange={
                                        handleEditFormChange
                                    }
                                    required
                                />

                            </div>

                            <div className="teacher-form-group">

                                <label htmlFor="edit_last_name">
                                    Last Name
                                </label>

                                <input
                                    id="edit_last_name"
                                    name="last_name"
                                    type="text"
                                    value={
                                        editFormData.last_name
                                    }
                                    onChange={
                                        handleEditFormChange
                                    }
                                    required
                                />

                            </div>

                            <div className="teacher-form-group">

                                <label htmlFor="edit_contact_number">
                                    Contact Number
                                    <span>
                                        {" "}
                                        (Optional)
                                    </span>
                                </label>

                                <input
                                    id="edit_contact_number"
                                    name="contact_number"
                                    type="text"
                                    value={
                                        editFormData.contact_number
                                    }
                                    onChange={
                                        handleEditFormChange
                                    }
                                />

                            </div>

                            <div className="teacher-modal-actions">

                                <button
                                    type="button"
                                    className="cancel-button"
                                    onClick={
                                        closeEditModal
                                    }
                                    disabled={
                                        updatingTeacher
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="save-teacher-button"
                                    disabled={
                                        updatingTeacher
                                    }
                                >
                                    {updatingTeacher
                                        ? "Saving..."
                                        : "Save Changes"}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>
            )}

        </div>
    );
}

export default TeacherManagement;