import { useEffect, useState } from "react";
import {
    User,
    Moon,
    Sun,
    Lock,
    AlertTriangle,
    CheckCircle,
    Loader2,
    ShieldCheck,
    ListChecks,
    BookOpen,
    CalendarDays,
} from "lucide-react";

import "../../styles/Dashboard.css";
import "./Settings.css";
import Sidebar from "../../components/Sidebar";
import "../../components/StatusBadge.css";
import { getToken, getStoredUser, updateStoredUser } from "../../utils/session";
import { getStoredTheme, setTheme } from "../../utils/theme";
import { API_URL } from "../../config";


const ROLE_LABEL = {
    admin: "School Administrator",
    adviser: "Class Adviser",
    subject: "Subject Teacher",
    principal: "Principal",
};

// What EduCheck checks on every e-Class Record upload, shown read-only to
// the Administrator. These follow DepEd's official template and grading
// rules, so they are fixed by design (SPMP §6.2, §6.3: modifying the DepEd
// grading formula is out of scope). Keep in step with
// classRecordParser.js, classRecordValidator.js and rosterCheck.js.
const OUTCOME_LABEL = {
    block: "Upload rejected",
    error: "Record flagged",
    warning: "Warning only",
};

const VALIDATION_RULES = [
    {
        name: "Official template structure",
        detail: "The workbook has the INPUT, TERM1, TERM2, TERM3 and Summary of Grades sheets of the DepEd e-Class Record.",
        outcome: "block",
    },
    {
        name: "Subject and section match",
        detail: "The subject's grade level matches the section's, and the teacher is assigned to that (subject, section).",
        outcome: "block",
    },
    {
        name: "Class roster",
        detail: "A learner already enrolled in another section this school year, or a file with no overlap with the section's class list, is refused.",
        outcome: "block",
    },
    {
        name: "Score range",
        detail: "Every score is between 0 and the highest possible score for that assessment.",
        outcome: "error",
    },
    {
        name: "Complete terms",
        detail: "Each learner has a record and every required score for all three terms, and each completed term has a term grade.",
        outcome: "error",
    },
    {
        name: "Summary of Grades matches",
        detail: "Each term grade in the Summary of Grades equals the term sheet's grade.",
        outcome: "error",
    },
    {
        name: "Final grade",
        detail: "The final grade equals the rounded average of the three term grades.",
        outcome: "error",
    },
    {
        name: "Unique learner numbers",
        detail: "No list number is used by two learners in the INPUT sheet.",
        outcome: "error",
    },
    {
        name: "Learners detected",
        detail: "Learners were read from the INPUT sheet, every term sheet and the Summary of Grades.",
        outcome: "error",
    },
    {
        name: "LRN",
        detail: "Each learner has a unique 12-digit LRN on the LRN sheet, so grades can be matched across subjects.",
        outcome: "warning",
    },
    {
        name: "Header agrees with selection",
        detail: "The grade, section, subject and school year written in the file's header match what the teacher selected.",
        outcome: "warning",
    },
];

function Settings() {
    const isAdmin = getStoredUser()?.role === "admin";

    const [account, setAccount] = useState(null);
    const [profile, setProfile] = useState(null);
    const [assignments, setAssignments] = useState([]);
    const [loadingAccount, setLoadingAccount] = useState(true);
    const [accountError, setAccountError] = useState("");

    const [theme, setThemeState] = useState(getStoredTheme());

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [passwordSuccess, setPasswordSuccess] = useState("");
    const [changingPassword, setChangingPassword] = useState(false);

    const [schoolYears, setSchoolYears] = useState([]);
    const [newSchoolYear, setNewSchoolYear] = useState("");
    const [schoolYearError, setSchoolYearError] = useState("");
    const [schoolYearSuccess, setSchoolYearSuccess] = useState("");
    const [savingSchoolYear, setSavingSchoolYear] = useState(false);

    const authHeaders = (extra = {}) => {
        const token = getToken();

        if (!token) {
            throw new Error("Authentication token not found. Please log in again.");
        }

        return { Authorization: `Bearer ${token}`, ...extra };
    };

    useEffect(() => {
        const fetchAccount = async () => {
            try {
                setLoadingAccount(true);
                setAccountError("");

                const response = await fetch(`${API_URL}/auth/me`, {
                    headers: authHeaders(),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Failed to load account information.");
                }

                setAccount(data.user);
                setProfile(data.profile || null);
                setAssignments(data.assignments || []);
                updateStoredUser({ full_name: data.user.full_name || null });
            } catch (fetchError) {
                setAccountError(fetchError.message || "Failed to load account information.");
            } finally {
                setLoadingAccount(false);
            }
        };

        fetchAccount();
    }, []);

    const fetchSchoolYears = async () => {
        try {
            const response = await fetch(`${API_URL}/school-years`, { headers: authHeaders() });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to load school years.");
            }

            setSchoolYears(data.school_years || []);
        } catch (fetchError) {
            setSchoolYearError(fetchError.message || "Failed to load school years.");
        }
    };

    useEffect(() => {
        if (isAdmin) fetchSchoolYears();
    }, [isAdmin]);

    // Shared by "Add" and "Set as current": both change the list, so it is
    // reloaded afterwards rather than patched locally.
    const saveSchoolYear = async ({ url, method, body, success }) => {
        setSchoolYearError("");
        setSchoolYearSuccess("");
        setSavingSchoolYear(true);

        try {
            const response = await fetch(url, {
                method,
                headers: authHeaders({ "Content-Type": "application/json" }),
                body: body ? JSON.stringify(body) : undefined,
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to save the school year.");
            }

            setSchoolYearSuccess(success(data.school_year));
            await fetchSchoolYears();
            return true;
        } catch (saveError) {
            setSchoolYearError(saveError.message || "Failed to save the school year.");
            return false;
        } finally {
            setSavingSchoolYear(false);
        }
    };

    const handleAddSchoolYear = async (e) => {
        e.preventDefault();

        const added = await saveSchoolYear({
            url: `${API_URL}/school-years`,
            method: "POST",
            body: { school_year: newSchoolYear.trim() },
            success: (year) =>
                `School year ${year.school_year} added. Assign teachers to it in Section & Teacher Assignments.`,
        });

        if (added) setNewSchoolYear("");
    };

    const handleActivateSchoolYear = (year) => {
        if (
            !window.confirm(
                `Make ${year.school_year} the current school year?\n\n` +
                    "Pages open on the current school year by default. Records of other school years stay available."
            )
        ) {
            return;
        }

        saveSchoolYear({
            url: `${API_URL}/school-years/${year.school_year_id}/activate`,
            method: "PATCH",
            success: (updated) => `${updated.school_year} is now the current school year.`,
        });
    };

    const handleThemeSelect = (next) => {
        setTheme(next);
        setThemeState(next);
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setPasswordError("");
        setPasswordSuccess("");

        if (newPassword !== confirmPassword) {
            setPasswordError("New password and confirmation don't match.");
            return;
        }

        setChangingPassword(true);

        try {
            const response = await fetch(`${API_URL}/auth/change-password`, {
                method: "POST",
                headers: authHeaders({ "Content-Type": "application/json" }),
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to update password.");
            }

            setPasswordSuccess("Password updated successfully.");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (changeError) {
            setPasswordError(changeError.message || "Failed to update password.");
        } finally {
            setChangingPassword(false);
        }
    };

    return (
        <div className="dashboard-layout">

            <Sidebar activeKey="settings" />

            <main className="dashboard-main">

                <header className="dashboard-header">
                    <div>
                        <h1>Settings</h1>
                        <p>Manage your account, security, and appearance.</p>
                    </div>
                </header>

                <section className="dashboard-content">

                    <div className="settings-grid">

                        {/* ACCOUNT INFORMATION */}
                        <div className="content-card settings-card">
                            <div className="card-header">
                                <h3>
                                    <User size={18} className="settings-header-icon" />
                                    Account Information
                                </h3>
                            </div>

                            {accountError && (
                                <div className="error-banner" style={{ margin: "0 24px 20px" }}>
                                    <AlertTriangle size={18} />
                                    <span>{accountError}</span>
                                </div>
                            )}

                            {loadingAccount ? (
                                <div className="loading-state" style={{ padding: "0 24px 24px" }}>
                                    <Loader2 size={18} className="spin-icon" />
                                    Loading...
                                </div>
                            ) : (
                                account && (
                                    <div className="settings-info-list">
                                        {profile && (
                                            <>
                                                <div className="settings-info-row">
                                                    <span>Full Name</span>
                                                    <strong>
                                                        {profile.first_name} {profile.last_name}
                                                    </strong>
                                                </div>

                                                <div className="settings-info-row">
                                                    <span>Employee No.</span>
                                                    <strong>{profile.employee_number}</strong>
                                                </div>

                                                <div className="settings-info-row">
                                                    <span>Contact Number</span>
                                                    <strong>{profile.contact_number || "Not provided"}</strong>
                                                </div>
                                            </>
                                        )}

                                        <div className="settings-info-row">
                                            <span>Username</span>
                                            <strong>{account.username}</strong>
                                        </div>

                                        <div className="settings-info-row">
                                            <span>Email</span>
                                            <strong>{account.email}</strong>
                                        </div>

                                        <div className="settings-info-row">
                                            <span>Role</span>
                                            <strong>{ROLE_LABEL[account.role] || account.role}</strong>
                                        </div>

                                        <div className="settings-info-row">
                                            <span>Account Status</span>
                                            <span
                                                className={
                                                    account.status === "Active"
                                                        ? "ec-badge ec-badge-success-outline"
                                                        : "ec-badge ec-badge-neutral"
                                                }
                                            >
                                                {account.status}
                                            </span>
                                        </div>

                                        <div className="settings-info-row">
                                            <span>Member Since</span>
                                            <strong>
                                                {new Date(account.created_at).toLocaleDateString(undefined, {
                                                    dateStyle: "long",
                                                })}
                                            </strong>
                                        </div>

                                        <p className="settings-info-note">
                                            {isAdmin
                                                ? "Account details are managed in Accounts."
                                                : "To correct your name, email or contact number, ask the School Administrator."}
                                        </p>
                                    </div>
                                )
                            )}
                        </div>

                        {/* MY ASSIGNMENTS (teachers only - Admin/Principal have no teacher profile) */}
                        {!loadingAccount && profile && (
                            <div className="content-card settings-card settings-card-wide">
                                <div className="card-header">
                                    <h3>
                                        <BookOpen size={18} className="settings-header-icon" />
                                        My Assignments
                                    </h3>
                                </div>

                                {assignments.length === 0 ? (
                                    <p className="settings-assignments-empty">
                                        You have no section or subject assignments yet. The School Administrator
                                        assigns them in Section &amp; Teacher Assignments.
                                    </p>
                                ) : (
                                    <div className="settings-assignments">
                                        {assignments.map((assignment) => (
                                            <div key={assignment.assignment_id} className="settings-assignment-row">
                                                <div>
                                                    <strong>
                                                        Grade {assignment.grade_level} – {assignment.section_name}
                                                    </strong>
                                                    <span>{assignment.subject_name || "Class Adviser"}</span>
                                                </div>
                                                <div className="settings-assignment-meta">
                                                    <span>{assignment.school_year}</span>
                                                    {assignment.school_year_status === "Active" && (
                                                        <span className="ec-badge ec-badge-success-outline">Current</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* APPEARANCE */}
                        <div className="content-card settings-card">
                            <div className="card-header">
                                <h3>
                                    <Sun size={18} className="settings-header-icon" />
                                    Appearance
                                </h3>
                            </div>

                            <div className="settings-theme-body">
                                <p className="settings-theme-hint">
                                    Choose how EduCheck looks on this device. Saved automatically.
                                </p>

                                <div className="settings-theme-options">
                                    <button
                                        type="button"
                                        className={theme === "light" ? "settings-theme-option active" : "settings-theme-option"}
                                        onClick={() => handleThemeSelect("light")}
                                    >
                                        <span className="settings-theme-preview light-preview">
                                            <Sun size={20} />
                                        </span>
                                        <strong>Light</strong>
                                    </button>

                                    <button
                                        type="button"
                                        className={theme === "dark" ? "settings-theme-option active" : "settings-theme-option"}
                                        onClick={() => handleThemeSelect("dark")}
                                    >
                                        <span className="settings-theme-preview dark-preview">
                                            <Moon size={20} />
                                        </span>
                                        <strong>Dark</strong>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* CHANGE PASSWORD */}
                        <div className="content-card settings-card settings-card-wide">
                            <div className="card-header">
                                <h3>
                                    <Lock size={18} className="settings-header-icon" />
                                    Change Password
                                </h3>
                            </div>

                            <form className="settings-password-form" onSubmit={handleChangePassword}>
                                <div className="settings-field">
                                    <label htmlFor="current_password">Current Password</label>
                                    <input
                                        id="current_password"
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="settings-field-row">
                                    <div className="settings-field">
                                        <label htmlFor="new_password">New Password</label>
                                        <input
                                            id="new_password"
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="settings-field">
                                        <label htmlFor="confirm_password">Confirm New Password</label>
                                        <input
                                            id="confirm_password"
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <p className="settings-password-hint">
                                    <ShieldCheck size={14} />
                                    At least 8 characters, including a letter and a number.
                                </p>

                                {passwordError && (
                                    <div className="error-banner">
                                        <AlertTriangle size={18} />
                                        <span>{passwordError}</span>
                                    </div>
                                )}

                                {passwordSuccess && (
                                    <div className="success-banner">
                                        <CheckCircle size={18} />
                                        <span>{passwordSuccess}</span>
                                    </div>
                                )}

                                <button type="submit" className="settings-submit-button" disabled={changingPassword}>
                                    {changingPassword ? (
                                        <>
                                            <Loader2 size={16} className="spin-icon" />
                                            Updating...
                                        </>
                                    ) : (
                                        "Update Password"
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* SCHOOL YEARS (Administrator) */}
                        {isAdmin && (
                            <div className="content-card settings-card settings-card-wide">
                                <div className="card-header">
                                    <h3>
                                        <CalendarDays size={18} className="settings-header-icon" />
                                        School Years
                                    </h3>
                                </div>

                                <div className="settings-rules-body">
                                    <p className="settings-theme-hint">
                                        Open a new school year before assigning teachers to it. A learner keeps the
                                        same LRN every year, so they can be uploaded under a new grade and section in
                                        the new school year.
                                    </p>

                                    <ul className="settings-rules-list">
                                        {schoolYears.map((year) => (
                                            <li key={year.school_year_id} className="settings-rule">
                                                <div>
                                                    <strong>{year.school_year}</strong>
                                                </div>

                                                {year.status === "Active" ? (
                                                    <span className="ec-badge ec-badge-success-outline">Current</span>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        className="settings-secondary-button"
                                                        onClick={() => handleActivateSchoolYear(year)}
                                                        disabled={savingSchoolYear}
                                                    >
                                                        Set as current
                                                    </button>
                                                )}
                                            </li>
                                        ))}
                                    </ul>

                                    <form className="settings-school-year-form" onSubmit={handleAddSchoolYear}>
                                        <div className="settings-field">
                                            <label htmlFor="new_school_year">Add School Year</label>
                                            <input
                                                id="new_school_year"
                                                type="text"
                                                placeholder="e.g. 2026-2027"
                                                pattern="\d{4}-\d{4}"
                                                title="Two consecutive years, for example 2026-2027"
                                                value={newSchoolYear}
                                                onChange={(e) => setNewSchoolYear(e.target.value)}
                                                required
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            className="settings-submit-button"
                                            disabled={savingSchoolYear}
                                        >
                                            {savingSchoolYear ? (
                                                <>
                                                    <Loader2 size={16} className="spin-icon" />
                                                    Saving...
                                                </>
                                            ) : (
                                                "Add"
                                            )}
                                        </button>
                                    </form>

                                    {schoolYearError && (
                                        <div className="error-banner">
                                            <AlertTriangle size={18} />
                                            <span>{schoolYearError}</span>
                                        </div>
                                    )}

                                    {schoolYearSuccess && (
                                        <div className="success-banner">
                                            <CheckCircle size={18} />
                                            <span>{schoolYearSuccess}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* VALIDATION RULES (Administrator, read-only) */}
                        {isAdmin && (
                            <div className="content-card settings-card settings-card-wide">
                                <div className="card-header">
                                    <h3>
                                        <ListChecks size={18} className="settings-header-icon" />
                                        Validation Rules
                                    </h3>
                                </div>

                                <div className="settings-rules-body">
                                    <p className="settings-theme-hint">
                                        Checks run on every e-Class Record upload. They follow DepEd's official
                                        e-Class Record template and grading rules (passing mark 75, DepEd Order
                                        No. 8, s. 2015), so they are fixed and cannot be edited.
                                    </p>

                                    <ul className="settings-rules-list">
                                        {VALIDATION_RULES.map((rule) => (
                                            <li key={rule.name} className="settings-rule">
                                                <div>
                                                    <strong>{rule.name}</strong>
                                                    <span>{rule.detail}</span>
                                                </div>

                                                <span className={`settings-rule-outcome outcome-${rule.outcome}`}>
                                                    {OUTCOME_LABEL[rule.outcome]}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}

                    </div>

                </section>

            </main>

        </div>
    );
}

export default Settings;
