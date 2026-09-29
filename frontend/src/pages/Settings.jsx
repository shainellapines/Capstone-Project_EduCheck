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
} from "lucide-react";

import "./Dashboard.css";
import "./Settings.css";
import Sidebar from "../components/Sidebar";
import { getToken } from "../utils/session";
import { getStoredTheme, setTheme } from "../utils/theme";

const API_URL = "http://localhost:5000/api";

const ROLE_LABEL = {
    admin: "School Administrator",
    adviser: "Class Adviser",
    subject: "Subject Teacher",
    principal: "Principal",
};

function Settings() {
    const [account, setAccount] = useState(null);
    const [loadingAccount, setLoadingAccount] = useState(true);
    const [accountError, setAccountError] = useState("");

    const [theme, setThemeState] = useState(getStoredTheme());

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [passwordSuccess, setPasswordSuccess] = useState("");
    const [changingPassword, setChangingPassword] = useState(false);

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
            } catch (fetchError) {
                setAccountError(fetchError.message || "Failed to load account information.");
            } finally {
                setLoadingAccount(false);
            }
        };

        fetchAccount();
    }, []);

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
                                                        ? "status-badge submitted"
                                                        : "status-badge draft"
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
                                    </div>
                                )
                            )}
                        </div>

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

                    </div>

                </section>

            </main>

        </div>
    );
}

export default Settings;
