import { useEffect, useState } from "react";
import {
    Users,
    Search,
    Plus,
    Pencil,
    Trash2,
    X,
    UserCheck,
    UserX,
    UserRoundX,
    Loader2,
    AlertCircle,
    CheckCircle,
} from "lucide-react";

import "./Accounts.css";
import Sidebar from "../../components/Sidebar";
import { API_URL } from "../../config";
import { getStoredUser } from "../../utils/session";


// One page for every account. Subject Teachers and Class Advisers also
// carry a teacher profile (name, employee number), entered in the same
// form; the server saves the account and the profile together.
const ROLE_LABELS = {
    subject: "Subject Teacher",
    adviser: "Class Adviser",
    admin: "School Administrator",
    principal: "Principal",
};

const TEACHER_ROLES = ["subject", "adviser"];

const DEPED_EMAIL = /^[^\s@]+@deped\.gov\.ph$/i;

const EMPTY_FORM = {
    email: "",
    username: "",
    password: "",
    role: "subject",
    status: "Active",
    first_name: "",
    last_name: "",
    employee_number: "",
    contact_number: "",
};

const isTeacherRole = (role) => TEACHER_ROLES.includes(role);

const fullNameOf = (account) =>
    account.first_name ? `${account.first_name} ${account.last_name}` : "";

// A teacher account made before the merged page may have no profile yet;
// it cannot be assigned to a section until one is added.
const isProfileMissing = (account) => isTeacherRole(account.role) && !account.teacher_id;


function Accounts() {
    const [accounts, setAccounts] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [formError, setFormError] = useState("");
    const [saving, setSaving] = useState(false);
    // The username follows the email until the admin edits it themselves.
    const [usernameEdited, setUsernameEdited] = useState(false);

    const token = localStorage.getItem("educheck_token");
    const currentUserId = getStoredUser()?.user_id;

    const fetchAccounts = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(`${API_URL}/users`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to retrieve accounts.");
            }

            setAccounts(data);
        } catch (fetchError) {
            setError(fetchError.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAccounts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const openAddModal = () => {
        setEditingAccount(null);
        setFormData(EMPTY_FORM);
        setUsernameEdited(false);
        setFormError("");
        setMessage("");
        setShowModal(true);
    };

    const openEditModal = (account) => {
        setEditingAccount(account);
        setFormData({
            email: account.email || "",
            username: account.username || "",
            password: "",
            role: account.role || "subject",
            status: account.status || "Active",
            first_name: account.first_name || "",
            last_name: account.last_name || "",
            employee_number: account.employee_number || "",
            contact_number: account.contact_number || "",
        });
        setUsernameEdited(true);
        setFormError("");
        setMessage("");
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingAccount(null);
        setFormError("");
    };

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => {
            const next = { ...previous, [name]: value };

            // juan.delacruz@deped.gov.ph suggests the username juan.delacruz.
            if (name === "email" && !usernameEdited) {
                next.username = value.split("@")[0].trim().toLowerCase();
            }

            return next;
        });

        if (name === "username") setUsernameEdited(true);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setFormError("");

        const emailChanged = !editingAccount || formData.email.trim() !== editingAccount.email;

        if (emailChanged && !DEPED_EMAIL.test(formData.email.trim())) {
            setFormError("Use the person's DepEd email address (ending in @deped.gov.ph).");
            return;
        }

        const teacher = isTeacherRole(formData.role);
        const body = {
            username: formData.username,
            email: formData.email,
            role: formData.role,
            status: formData.status,
            ...(editingAccount ? {} : { password: formData.password }),
            ...(teacher
                ? {
                      first_name: formData.first_name,
                      last_name: formData.last_name,
                      employee_number: formData.employee_number,
                      contact_number: formData.contact_number,
                  }
                : {}),
        };

        try {
            setSaving(true);

            const response = await fetch(
                editingAccount ? `${API_URL}/users/${editingAccount.user_id}` : `${API_URL}/users`,
                {
                    method: editingAccount ? "PUT" : "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(body),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to save the account.");
            }

            // A new password on Edit is a reset, sent to its own endpoint so
            // it is checked and audited apart from the account details.
            const resetPassword = editingAccount && formData.password;

            if (resetPassword) {
                const resetResponse = await fetch(
                    `${API_URL}/users/${editingAccount.user_id}/reset-password`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({ new_password: formData.password }),
                    }
                );

                const resetData = await resetResponse.json();

                if (!resetResponse.ok) {
                    await fetchAccounts();
                    throw new Error(resetData.message || "Unable to reset the password.");
                }
            }

            closeModal();
            setMessage(
                resetPassword
                    ? `Account updated. ${formData.username} can now sign in with the new password.`
                    : editingAccount
                    ? "Account updated successfully."
                    : "Account created successfully."
            );

            await fetchAccounts();
        } catch (saveError) {
            setFormError(saveError.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (account) => {
        const label = fullNameOf(account) || account.username;

        if (!window.confirm(`Delete the account of "${label}"? This cannot be undone.`)) {
            return;
        }

        try {
            setError("");
            setMessage("");

            const response = await fetch(`${API_URL}/users/${account.user_id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to delete the account.");
            }

            setMessage("Account deleted successfully.");
            await fetchAccounts();
        } catch (deleteError) {
            setError(deleteError.message);
        }
    };

    const query = search.trim().toLowerCase();

    const filteredAccounts = accounts.filter((account) =>
        [
            account.username,
            account.email,
            ROLE_LABELS[account.role],
            fullNameOf(account),
            account.employee_number,
        ].some((value) => value?.toLowerCase().includes(query))
    );

    const activeCount = accounts.filter((account) => account.status === "Active").length;
    const inactiveCount = accounts.length - activeCount;
    const missingProfileCount = accounts.filter(isProfileMissing).length;

    const isSelf = editingAccount && editingAccount.user_id === currentUserId;
    const showTeacherFields = isTeacherRole(formData.role);

    return (
        <div className="dashboard-layout">

            <Sidebar activeKey="accounts" />

            <main className="dashboard-main">
        <div className="user-management-page">

            {/* HEADER */}

            <div className="page-header">

                <div>
                    <div className="page-title-row">
                        <div className="page-title-icon">
                            <Users size={23} />
                        </div>

                        <div>
                            <h1>Accounts</h1>
                            <p>
                                Add and manage everyone who signs in to EduCheck. Teachers' names and
                                employee numbers are kept here too.
                            </p>
                        </div>
                    </div>
                </div>

                <button
                    className="add-user-button"
                    onClick={openAddModal}
                >
                    <Plus size={18} />
                    Add Account
                </button>

            </div>

            {/* FEEDBACK */}

            {message && (
                <div className="success-message">
                    <CheckCircle size={18} />
                    {message}
                </div>
            )}

            {error && (
                <div className="error-message">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            {/* SUMMARY */}

            <div className="user-summary-grid">

                <div className="user-summary-card">
                    <div className="summary-icon blue">
                        <Users size={21} />
                    </div>

                    <div>
                        <span>Total Accounts</span>
                        <strong>{accounts.length}</strong>
                    </div>
                </div>

                <div className="user-summary-card">
                    <div className="summary-icon green">
                        <UserCheck size={21} />
                    </div>

                    <div>
                        <span>Active</span>
                        <strong>{activeCount}</strong>
                    </div>
                </div>

                <div className="user-summary-card">
                    <div className="summary-icon gray">
                        <UserX size={21} />
                    </div>

                    <div>
                        <span>Inactive</span>
                        <strong>{inactiveCount}</strong>
                    </div>
                </div>

                <div className="user-summary-card">
                    <div className="summary-icon purple">
                        <UserRoundX size={21} />
                    </div>

                    <div>
                        <span>Teacher Details Missing</span>
                        <strong>{missingProfileCount}</strong>
                    </div>
                </div>

            </div>

            {/* ACCOUNT TABLE */}

            <div className="users-card">

                <div className="users-card-header">

                    <div>
                        <h2>All Accounts</h2>
                        <p>
                            Search by name, username, email, role, or employee number.
                        </p>
                    </div>

                    <div className="search-box">
                        <Search size={18} />

                        <input
                            type="text"
                            placeholder="Search accounts..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />

                        {search && (
                            <button
                                type="button"
                                className="clear-search"
                                onClick={() => setSearch("")}
                                aria-label="Clear search"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                </div>

                {loading ? (
                    <div className="table-state">
                        <Loader2 className="loading-icon" size={28} />
                        <p>Loading accounts...</p>
                    </div>
                ) : filteredAccounts.length === 0 ? (
                    <div className="table-state">
                        <Users size={34} />
                        <h3>No accounts found</h3>
                        <p>
                            {search
                                ? "Try a different search term."
                                : "No accounts yet. Click Add Account to create one."}
                        </p>
                    </div>
                ) : (
                    <div className="table-wrapper">

                        <table className="users-table">

                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Role</th>
                                    <th>Employee No.</th>
                                    <th>Email</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>

                                {filteredAccounts.map((account) => {
                                    const name = fullNameOf(account);

                                    return (
                                        <tr key={account.user_id}>

                                            <td>
                                                <div className="user-cell">
                                                    <div className="user-avatar">
                                                        {(name || account.username)?.charAt(0).toUpperCase()}
                                                    </div>

                                                    <div>
                                                        <strong>{name || account.username}</strong>
                                                        <span>@{account.username}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            <td>
                                                <span className={`role-pill role-${account.role}`}>
                                                    {ROLE_LABELS[account.role] || account.role}
                                                </span>
                                            </td>

                                            <td>
                                                {isProfileMissing(account) ? (
                                                    <button
                                                        type="button"
                                                        className="profile-missing"
                                                        onClick={() => openEditModal(account)}
                                                        title="Add this teacher's name and employee number"
                                                    >
                                                        <AlertCircle size={14} />
                                                        Add teacher details
                                                    </button>
                                                ) : (
                                                    account.employee_number || "—"
                                                )}
                                            </td>

                                            <td>{account.email}</td>

                                            <td>
                                                <span
                                                    className={`status-pill ${
                                                        account.status === "Active" ? "active" : "inactive"
                                                    }`}
                                                >
                                                    {account.status}
                                                </span>
                                            </td>

                                            <td>
                                                <div className="action-buttons">

                                                    <button
                                                        className="icon-button edit"
                                                        title="Edit account"
                                                        aria-label={`Edit ${name || account.username}`}
                                                        onClick={() => openEditModal(account)}
                                                    >
                                                        <Pencil size={17} />
                                                    </button>

                                                    <button
                                                        className="icon-button delete"
                                                        title="Delete account"
                                                        aria-label={`Delete ${name || account.username}`}
                                                        onClick={() => handleDelete(account)}
                                                    >
                                                        <Trash2 size={17} />
                                                    </button>

                                                </div>
                                            </td>

                                        </tr>
                                    );
                                })}

                            </tbody>

                        </table>

                    </div>
                )}

            </div>

            {/* ADD / EDIT MODAL */}

            {showModal && (
                <div
                    className="modal-overlay"
                    onClick={closeModal}
                >
                    <div
                        className="user-modal"
                        onClick={(event) => event.stopPropagation()}
                    >

                        <div className="modal-header">

                            <div>
                                <h2>{editingAccount ? "Edit Account" : "Add Account"}</h2>

                                <p>
                                    {editingAccount
                                        ? "Update the account and, for teachers, their details."
                                        : "Create a sign-in for a teacher, administrator, or principal."}
                                </p>
                            </div>

                            <button
                                className="close-modal"
                                onClick={closeModal}
                                aria-label="Close"
                            >
                                <X size={20} />
                            </button>

                        </div>

                        <form
                            className="user-form"
                            onSubmit={handleSubmit}
                        >

                            <p className="form-section-title">Account</p>

                            <div className="form-group">
                                <label htmlFor="account-email">DepEd Email</label>

                                <input
                                    id="account-email"
                                    type="email"
                                    name="email"
                                    placeholder="name@deped.gov.ph"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-row">

                                <div className="form-group">
                                    <label htmlFor="account-username">Username</label>

                                    <input
                                        id="account-username"
                                        type="text"
                                        name="username"
                                        autoComplete="off"
                                        value={formData.username}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="account-role">Role</label>

                                    <select
                                        id="account-role"
                                        name="role"
                                        value={formData.role}
                                        onChange={handleChange}
                                        disabled={isSelf}
                                    >
                                        {Object.entries(ROLE_LABELS).map(([value, label]) => (
                                            <option key={value} value={value}>
                                                {label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                            </div>

                            {!isSelf && (
                                <div className="form-row">

                                    <div className="form-group">
                                        <label htmlFor="account-password">
                                            {editingAccount ? "Reset Password" : "Password"}
                                        </label>

                                        <input
                                            id="account-password"
                                            type="password"
                                            name="password"
                                            autoComplete="new-password"
                                            placeholder={editingAccount ? "Leave blank to keep it" : ""}
                                            value={formData.password}
                                            onChange={handleChange}
                                            required={!editingAccount}
                                            minLength={8}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="account-status">Status</label>

                                        <select
                                            id="account-status"
                                            name="status"
                                            value={formData.status}
                                            onChange={handleChange}
                                        >
                                            <option value="Active">Active</option>
                                            <option value="Inactive">Inactive</option>
                                        </select>
                                    </div>

                                </div>
                            )}

                            {!isSelf && (
                                <span className="form-hint form-hint-block">
                                    Passwords need at least 8 characters with a letter and a number.
                                    {editingAccount && " Give the new one to the user and ask them to change it in Settings."}
                                </span>
                            )}

                            {showTeacherFields && (
                                <>
                                    <p className="form-section-title">Teacher Details</p>

                                    <div className="form-row">

                                        <div className="form-group">
                                            <label htmlFor="account-first-name">First Name</label>

                                            <input
                                                id="account-first-name"
                                                type="text"
                                                name="first_name"
                                                value={formData.first_name}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="account-last-name">Last Name</label>

                                            <input
                                                id="account-last-name"
                                                type="text"
                                                name="last_name"
                                                value={formData.last_name}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>

                                    </div>

                                    <div className="form-row">

                                        <div className="form-group">
                                            <label htmlFor="account-employee-number">Employee No.</label>

                                            <input
                                                id="account-employee-number"
                                                type="text"
                                                name="employee_number"
                                                value={formData.employee_number}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="account-contact">Contact No. (optional)</label>

                                            <input
                                                id="account-contact"
                                                type="tel"
                                                name="contact_number"
                                                value={formData.contact_number}
                                                onChange={handleChange}
                                            />
                                        </div>

                                    </div>
                                </>
                            )}

                            {formError && (
                                <div className="modal-error">
                                    <AlertCircle size={17} />
                                    {formError}
                                </div>
                            )}

                            <div className="modal-actions">

                                <button
                                    type="button"
                                    className="cancel-button"
                                    onClick={closeModal}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="save-user-button"
                                    disabled={saving}
                                >
                                    {editingAccount ? "Save Changes" : "Create Account"}
                                </button>

                            </div>

                        </form>

                    </div>
                </div>
            )}

        </div>
            </main>

        </div>
    );
}

export default Accounts;
