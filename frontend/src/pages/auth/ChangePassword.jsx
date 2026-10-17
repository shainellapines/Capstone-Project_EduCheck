import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ArrowRight, CircleAlert, Eye, EyeOff, KeyRound, LockKeyhole } from "lucide-react";
import logo from "../../assets/educheck-logo-white.png";
import logoOnPage from "../../assets/educheck-logo.png";
import schoolPhoto from "../../assets/login-photo.jpg";
import { API_URL } from "../../config";
import { clearSession, getStoredUser, getToken, isSessionValid, updateStoredUser } from "../../utils/session";

const SCHOOL_NAME = (import.meta.env.VITE_SCHOOL_NAME || "").trim();

const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

// Shown after signing in with a temporary password (from account setup or a
// reset). Every other page sends the user back here, and the server refuses
// other requests, until they choose their own password. Same look as Login.
function ChangePassword() {
    const navigate = useNavigate();
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPasswords, setShowPasswords] = useState(false);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    if (!isSessionValid()) {
        clearSession();
        return <Navigate to="/" replace />;
    }

    if (!getStoredUser()?.must_change_password) {
        return <Navigate to="/dashboard" replace />;
    }

    const signOut = () => {
        clearSession();
        navigate("/", { replace: true });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        if (!currentPassword || !newPassword || !confirmPassword) {
            setError("Fill in all three fields.");
            return;
        }

        if (!PASSWORD_RULE.test(newPassword)) {
            setError("Your new password needs at least 8 characters, with a letter and a number.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("The new password and its confirmation don't match.");
            return;
        }

        try {
            setSaving(true);

            const response = await fetch(`${API_URL}/auth/change-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getToken()}`,
                },
                body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data.message || "Could not change your password. Please try again.");
            }

            updateStoredUser({ must_change_password: false });
            navigate("/dashboard", { replace: true });
        } catch (changeError) {
            setError(changeError.message);
        } finally {
            setSaving(false);
        }
    };

    const inputType = showPasswords ? "text" : "password";

    return (
        <div className="login-page">

            <aside
                className="login-brand"
                style={{ "--login-photo": `url(${schoolPhoto})` }}
            >
                <div className="login-brand-inner">
                    <img className="login-brand-logo" src={logo} alt="EduCheck logo" width="80" height="80" />
                    <p className="login-brand-name">EduCheck</p>
                    <p className="login-brand-system">
                        Academic Record Validation &amp; Consolidation System
                    </p>
                    <p className="login-brand-tagline">
                        Catch grade errors before records are submitted.
                    </p>
                </div>

                {SCHOOL_NAME && <p className="login-brand-school">{SCHOOL_NAME}</p>}
            </aside>

            <main className="login-main">
                <div className="login-form-wrap">

                    <div className="login-compact-brand">
                        <img src={logoOnPage} alt="" width="56" height="56" />
                        <p>EduCheck</p>
                    </div>

                    <header className="login-head">
                        <h1>Set your own password</h1>
                        <p className="login-subtitle">
                            You signed in with a temporary password. Choose your own to continue; only you
                            will know it.
                        </p>
                    </header>

                    <form onSubmit={handleSubmit} noValidate>

                        <div className="login-field">
                            <label htmlFor="current-password">Temporary password</label>
                            <div className="login-input">
                                <KeyRound size={18} strokeWidth={1.75} aria-hidden="true" />
                                <input
                                    id="current-password"
                                    type={inputType}
                                    autoComplete="current-password"
                                    placeholder="From your email or your Administrator"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    disabled={saving}
                                />
                            </div>
                        </div>

                        <div className="login-field">
                            <label htmlFor="new-password">New password</label>
                            <div className="login-input">
                                <LockKeyhole size={18} strokeWidth={1.75} aria-hidden="true" />
                                <input
                                    id="new-password"
                                    type={inputType}
                                    autoComplete="new-password"
                                    placeholder="At least 8 characters, a letter and a number"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    disabled={saving}
                                />
                                <button
                                    type="button"
                                    className="login-reveal"
                                    onClick={() => setShowPasswords((shown) => !shown)}
                                    aria-label={showPasswords ? "Hide passwords" : "Show passwords"}
                                    aria-pressed={showPasswords}
                                >
                                    {showPasswords
                                        ? <EyeOff size={18} strokeWidth={1.75} aria-hidden="true" />
                                        : <Eye size={18} strokeWidth={1.75} aria-hidden="true" />}
                                </button>
                            </div>
                        </div>

                        <div className="login-field">
                            <label htmlFor="confirm-password">Confirm new password</label>
                            <div className="login-input">
                                <LockKeyhole size={18} strokeWidth={1.75} aria-hidden="true" />
                                <input
                                    id="confirm-password"
                                    type={inputType}
                                    autoComplete="new-password"
                                    placeholder="Type it again"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    disabled={saving}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="login-error" role="alert">
                                <CircleAlert size={16} strokeWidth={1.75} aria-hidden="true" />
                                <span>{error}</span>
                            </div>
                        )}

                        <button type="submit" className="login-button" disabled={saving} aria-busy={saving}>
                            {saving ? (
                                <>
                                    <span className="login-spinner" aria-hidden="true" />
                                    Saving…
                                </>
                            ) : (
                                <>
                                    Save and continue
                                    <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
                                </>
                            )}
                        </button>

                    </form>

                    <p className="login-note">
                        Not you?{" "}
                        <button type="button" className="login-link-button" onClick={signOut}>
                            Sign out
                        </button>
                    </p>

                </div>
            </main>
        </div>
    );
}

export default ChangePassword;
