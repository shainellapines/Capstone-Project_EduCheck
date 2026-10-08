import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CircleAlert, Eye, EyeOff, LockKeyhole, UserRound } from "lucide-react";
import logo from "../assets/educheck-logo-white.png";
import logoOnPage from "../assets/educheck-logo.png";
import schoolPhoto from "../assets/login-photo.jpg";
import { API_URL } from "../config";
// The school's name, set once per installation in frontend/.env
// (VITE_SCHOOL_NAME=...). Hidden when not set.
const SCHOOL_NAME = (import.meta.env.VITE_SCHOOL_NAME || "").trim();

const WRONG_CREDENTIALS = "Username or password is incorrect. Check both and try again.";

function FieldError({ id, message }) {
    if (!message) return null;

    return (
        <p id={id} className="login-field-error" role="alert">
            <CircleAlert size={14} strokeWidth={2} aria-hidden="true" />
            <span>{message}</span>
        </p>
    );
}

function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    // Per-field messages shown under the inputs.
    const [fieldErrors, setFieldErrors] = useState({});
    // Anything that isn't about one field (server down, inactive account).
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    // Display only: lets the user check what they typed.
    const [showPassword, setShowPassword] = useState(false);
    const usernameRef = useRef(null);
    const passwordRef = useRef(null);
    const submittingRef = useRef(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();

        // Ignore a second submit while one is in flight.
        if (submittingRef.current) return;

        const missing = {};
        if (!username.trim()) missing.username = "Enter your username.";
        if (!password) missing.password = "Enter your password.";

        setError("");
        setFieldErrors(missing);

        if (missing.username) {
            usernameRef.current?.focus();
            return;
        }
        if (missing.password) {
            passwordRef.current?.focus();
            return;
        }

        submittingRef.current = true;
        setLoading(true);

        try {
            let response;
            try {
                response = await fetch(
                    `${API_URL}/auth/login/`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            username,
                            password,
                        }),
                    }
                );
            } catch {
                throw new Error(
                    "Can't reach EduCheck right now. Check your connection and try again."
                );
            }

            const data = await response.json().catch(() => ({}));

            if (response.status === 401) {
                // Keep the username, clear the password, and put the
                // cursor back in the password field (re-enabled first).
                flushSync(() => {
                    setPassword("");
                    setFieldErrors({ password: WRONG_CREDENTIALS });
                    setLoading(false);
                });
                passwordRef.current?.focus();
                return;
            }

            if (!response.ok) {
                throw new Error(
                    data.message || "Sign-in failed. Please try again."
                );
            }

            // Store authentication data temporarily
            localStorage.setItem("educheck_token", data.token);
            localStorage.setItem(
                "educheck_user",
                JSON.stringify(data.user)
            );

            // /dashboard sends each role to its own home page.
            navigate("/dashboard");

        } catch (error) {
            setError(error.message);
        } finally {
            submittingRef.current = false;
            setLoading(false);
        }
    };

    return (
        <div className="login-page">

            {/* BRAND: school photo under the teal gradient */}
            <aside
                className="login-brand"
                style={{ "--login-photo": `url(${schoolPhoto})` }}
            >
                <div className="login-brand-inner">
                    <img
                        className="login-brand-logo"
                        src={logo}
                        alt="EduCheck logo"
                        width="80"
                        height="80"
                    />
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

            {/* AUTHENTICATION: form directly on the ivory page */}
            <main className="login-main">
                <div className="login-form-wrap">

                    {/* Shown instead of the photo panel on narrow screens */}
                    <div className="login-compact-brand">
                        <img src={logoOnPage} alt="" width="56" height="56" />
                        <p>EduCheck</p>
                    </div>

                    <header className="login-head">
                        <h1>Sign in</h1>
                        <p className="login-subtitle">
                            Use the account issued by your School Administrator.
                        </p>
                    </header>

                    <form onSubmit={handleLogin} noValidate>

                        <div className="login-field">
                            <label htmlFor="username">Username</label>
                            <div className="login-input">
                                <UserRound size={18} strokeWidth={1.75} aria-hidden="true" />
                                <input
                                    ref={usernameRef}
                                    id="username"
                                    type="text"
                                    autoComplete="username"
                                    placeholder="Enter your username"
                                    value={username}
                                    onChange={(e) => {
                                        setUsername(e.target.value);
                                        setFieldErrors((prev) => ({ ...prev, username: "" }));
                                    }}
                                    disabled={loading}
                                    aria-invalid={Boolean(fieldErrors.username)}
                                    aria-describedby={fieldErrors.username ? "username-error" : undefined}
                                />
                            </div>
                            <FieldError id="username-error" message={fieldErrors.username} />
                        </div>

                        <div className="login-field">
                            <label htmlFor="password">Password</label>
                            <div className="login-input">
                                <LockKeyhole size={18} strokeWidth={1.75} aria-hidden="true" />
                                <input
                                    ref={passwordRef}
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        setFieldErrors((prev) => ({ ...prev, password: "" }));
                                    }}
                                    disabled={loading}
                                    aria-invalid={Boolean(fieldErrors.password)}
                                    aria-describedby={fieldErrors.password ? "password-error" : undefined}
                                />
                                <button
                                    type="button"
                                    className="login-reveal"
                                    onClick={() => setShowPassword((shown) => !shown)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                    aria-pressed={showPassword}
                                >
                                    {showPassword
                                        ? <EyeOff size={18} strokeWidth={1.75} aria-hidden="true" />
                                        : <Eye size={18} strokeWidth={1.75} aria-hidden="true" />}
                                </button>
                            </div>
                            <FieldError id="password-error" message={fieldErrors.password} />
                        </div>

                        {error && (
                            <div className="login-error" role="alert">
                                <CircleAlert size={16} strokeWidth={1.75} aria-hidden="true" />
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="login-button"
                            disabled={loading}
                            aria-busy={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="login-spinner" aria-hidden="true" />
                                    Signing in…
                                </>
                            ) : (
                                <>
                                    Sign in
                                    <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
                                </>
                            )}
                        </button>

                    </form>

                    <p className="login-note">
                        Password resets are handled by your School Administrator.
                    </p>

                </div>
            </main>
        </div>
    );
}

export default Login;
