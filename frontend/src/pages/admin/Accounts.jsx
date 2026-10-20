import { useEffect, useState } from "react";
import {
    Users,
    Search,
    Plus,
    Pencil,
    Trash2,
    X,
    UserCheck,
    Clock,
    UserRoundX,
    Loader2,
    AlertCircle,
    CheckCircle,
    KeyRound,
    Copy,
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

// A new account goes: Pending Approval (Principal) -> Awaiting Setup
// (Administrator gives employee number and temporary password) -> Active.
const isSetUp = (account) => ["Active", "Inactive"].includes(account.status);

// Something about the account is still waiting for the Principal or for setup.
const isWaiting = (account) =>
    ["Pending Approval", "Awaiting Setup"].includes(account.status) || Boolean(account.pending_role);

// Only approval and setup activate a new or rejected account, so its
// status cannot be picked here.
const canPickStatus = (account) => !account || isSetUp(account);

const STATUS_PILL_CLASS = {
    Active: "active",
    "Pending Approval": "pending",
    "Awaiting Setup": "setup",
    Rejected: "rejected",
};

// A readable temporary password that meets the rule (a letter and a
// number). Confusable characters (0/O, 1/l/I) are left out, since it may be
// read aloud or copied by hand when the email cannot be sent.
const generateTemporaryPassword = () => {
    const letters = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
    const digits = "23456789";
    const all = letters + digits;
    const random = new Uint32Array(10);
    crypto.getRandomValues(random);

    const chars = Array.from(random, (value, index) =>
        index === 0 ? letters[value % letters.length] : index === 1 ? digits[value % digits.length] : all[value % all.length]
    );

    return chars.join("");
};

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

    // Finish setup: employee number and temporary password after approval.
    const [setupAccount, setSetupAccount] = useState(null);
    const [setupForm, setSetupForm] = useState({ employee_number: "", temporary_password: "" });
    const [setupError, setSetupError] = useState("");
    const [setupResult, setSetupResult] = useState(null);
    const [settingUp, setSettingUp] = useState(false);

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
            ...(editingAccount && canPickStatus(editingAccount) ? { status: formData.status } : {}),
            ...(teacher
                ? {
                      first_name: formData.first_name,
                      last_name: formData.last_name,
                      ...(editingAccount && isSetUp(editingAccount)
                          ? { employee_number: formData.employee_number }
                          : {}),
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
            let resetMessage = "";

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

                resetMessage = resetData.message;
            }

            closeModal();
            // The server says when a change went to the Principal instead.
            setMessage(resetPassword ? resetMessage : data.message);

            await fetchAccounts();
        } catch (saveError) {
            setFormError(saveError.message);
        } finally {
            setSaving(false);
        }
    };

    const openSetupModal = (account) => {
        setSetupAccount(account);
        setSetupForm({ employee_number: account.employee_number || "", temporary_password: generateTemporaryPassword() });
        setSetupError("");
        setSetupResult(null);
        setMessage("");
    };

    const closeSetupModal = () => {
        setSetupAccount(null);
        setSetupResult(null);
    };

    const handleFinishSetup = async (event) => {
        event.preventDefault();
        setSetupError("");

        try {
            setSettingUp(true);

            const response = await fetch(`${API_URL}/users/${setupAccount.user_id}/finish-setup`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(setupForm),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to finish the setup.");
            }

            // Kept on screen when the email could not go out, so the
            // Administrator can hand the password over in person.
            setSetupResult({
                message: data.message,
                emailSent: data.email_sent,
                password: setupForm.temporary_password,
            });

            await fetchAccounts();
        } catch (setupFailure) {
            setSetupError(setupFailure.message);
        } finally {
            setSettingUp(false);
        }
    };

    const copyPassword = async () => {
        try {
            await navigator.clipboard.writeText(setupResult.password);
        } catch {
            // Clipboard can be blocked on plain-http school servers; the
            // password stays visible to copy by hand.
        }
    };

    const handleDelete = async (account) => {
        const label = fullNameOf(account) || account.username;

        // An account with uploads, reviews, or audit-log activity can't be
        // deleted (the database keeps that history); deactivating is the way.
        if (account.linked_record_count > 0) {
            setMessage("");
            setError(
                `Can't delete "${label}" because the account already has records in EduCheck. ` +
                "Edit the account and set its status to Inactive to stop it from signing in."
            );
            return;
        }

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
    const waitingCount = accounts.filter(isWaiting).length;
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
                        <Clock size={21} />
                    </div>

                    <div>
                        <span>Waiting (approval or setup)</span>
                        <strong>{waitingCount}</strong>
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
                                                        STATUS_PILL_CLASS[account.status] || "inactive"
                                                    }`}
                                                >
                                                    {account.status}
                                                </span>

                                                {account.pending_role && (
                                                    <span className="status-note">
                                                        Change to {ROLE_LABELS[account.pending_role]} awaiting the Principal
                                                    </span>
                                                )}

                                                {account.status === "Rejected" && account.approval_remarks && (
                                                    <span className="status-note is-danger">
                                                        Reason: {account.approval_remarks}
                                                    </span>
                                                )}
                                            </td>

                                            <td>
                                                <div className="action-buttons">

                                                    {account.status === "Awaiting Setup" && (
                                                        <button
                                                            type="button"
                                                            className="approval-button approve"
                                                            onClick={() => openSetupModal(account)}
                                                        >
                                                            <KeyRound size={15} />
                                                            Finish setup
                                                        </button>
                                                    )}

                                                    <button
                                                        className="icon-button edit"
                                                        title="Edit account"
                                                        aria-label={`Edit ${name || account.username}`}
                                                        onClick={() => openEditModal(account)}
                                                    >
                                                        <Pencil size={17} />
                                                    </button>

                                                    <button
                                                        className={`icon-button delete${
                                                            account.linked_record_count > 0 ? " is-blocked" : ""
                                                        }`}
                                                        title={
                                                            account.linked_record_count > 0
                                                                ? "Can't delete: this account has records. Set it to Inactive instead."
                                                                : "Delete account"
                                                        }
                                                        aria-disabled={account.linked_record_count > 0}
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

                            {editingAccount?.status === "Rejected" && (
                                <div className="modal-error">
                                    <AlertCircle size={17} />
                                    <span>
                                        The Principal did not approve this account
                                        {editingAccount.approval_remarks ? `: ${editingAccount.approval_remarks}` : "."} Saving
                                        your corrections sends it back for approval.
                                    </span>
                                </div>
                            )}

                            {!editingAccount && (
                                <p className="form-hint form-hint-block">
                                    The Principal approves new accounts first. Then you finish the setup here: the
                                    employee number and a temporary password, which is emailed to the DepEd address.
                                </p>
                            )}

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

                            {editingAccount && !isSelf && isSetUp(editingAccount) && (
                                <div className="form-row">

                                    <div className="form-group">
                                        <label htmlFor="account-password">Reset Password</label>

                                        <input
                                            id="account-password"
                                            type="password"
                                            name="password"
                                            autoComplete="new-password"
                                            placeholder="Leave blank to keep it"
                                            value={formData.password}
                                            onChange={handleChange}
                                            minLength={8}
                                        />
                                    </div>

                                    {canPickStatus(editingAccount) && (
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
                                    )}

                                </div>
                            )}

                            {editingAccount && !isSelf && isSetUp(editingAccount) && (
                                <span className="form-hint form-hint-block">
                                    At least 8 characters with a letter and a number. The new password is emailed to the
                                    user, who replaces it at their next sign-in.
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

                                        {editingAccount && isSetUp(editingAccount) && (
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
                                        )}

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

            {/* FINISH SETUP MODAL */}

            {setupAccount && (
                <div className="modal-overlay" onClick={closeSetupModal}>
                    <div className="user-modal" onClick={(event) => event.stopPropagation()}>

                        <div className="modal-header">
                            <div>
                                <h2>Finish Setup</h2>
                                <p>
                                    {fullNameOf(setupAccount) || setupAccount.username} ·{" "}
                                    {ROLE_LABELS[setupAccount.role]} · {setupAccount.email}
                                </p>
                            </div>

                            <button className="close-modal" onClick={closeSetupModal} aria-label="Close">
                                <X size={20} />
                            </button>
                        </div>

                        {setupResult ? (
                            <div className="user-form">
                                <div className={setupResult.emailSent ? "success-message" : "modal-error"}>
                                    {setupResult.emailSent ? <CheckCircle size={18} /> : <AlertCircle size={17} />}
                                    <span>{setupResult.message}</span>
                                </div>

                                {!setupResult.emailSent && (
                                    <div className="temp-password-box">
                                        <span>Temporary password</span>
                                        <code>{setupResult.password}</code>
                                        <button type="button" className="cancel-button" onClick={copyPassword}>
                                            <Copy size={15} /> Copy
                                        </button>
                                    </div>
                                )}

                                <div className="modal-actions">
                                    <button type="button" className="save-user-button" onClick={closeSetupModal}>
                                        Done
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <form className="user-form" onSubmit={handleFinishSetup}>
                                <p className="form-hint form-hint-block">
                                    The Principal approved this account. Activating it emails the username and the
                                    temporary password to the DepEd address; the user replaces the password at their first
                                    sign-in.
                                </p>

                                {isTeacherRole(setupAccount.role) && (
                                    <div className="form-group">
                                        <label htmlFor="setup-employee-number">Employee No.</label>
                                        <input
                                            id="setup-employee-number"
                                            type="text"
                                            value={setupForm.employee_number}
                                            onChange={(e) =>
                                                setSetupForm((previous) => ({ ...previous, employee_number: e.target.value }))
                                            }
                                            required
                                        />
                                    </div>
                                )}

                                <div className="form-group">
                                    <label htmlFor="setup-password">Temporary Password</label>
                                    <div className="temp-password-input">
                                        <input
                                            id="setup-password"
                                            type="text"
                                            autoComplete="off"
                                            spellCheck={false}
                                            value={setupForm.temporary_password}
                                            onChange={(e) =>
                                                setSetupForm((previous) => ({ ...previous, temporary_password: e.target.value }))
                                            }
                                            required
                                            minLength={8}
                                        />
                                        <button
                                            type="button"
                                            className="cancel-button"
                                            onClick={() =>
                                                setSetupForm((previous) => ({
                                                    ...previous,
                                                    temporary_password: generateTemporaryPassword(),
                                                }))
                                            }
                                        >
                                            Generate
                                        </button>
                                    </div>
                                    <span className="form-hint">At least 8 characters with a letter and a number.</span>
                                </div>

                                {setupError && (
                                    <div className="modal-error">
                                        <AlertCircle size={17} />
                                        {setupError}
                                    </div>
                                )}

                                <div className="modal-actions">
                                    <button type="button" className="cancel-button" onClick={closeSetupModal}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="save-user-button" disabled={settingUp}>
                                        {settingUp ? "Activating..." : "Activate & Send Email"}
                                    </button>
                                </div>
                            </form>
                        )}

                    </div>
                </div>
            )}

        </div>
            </main>

        </div>
    );
}

export default Accounts;
