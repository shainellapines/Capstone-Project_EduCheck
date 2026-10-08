import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CircleAlert, Eye, EyeOff, LockKeyhole, UserRound } from "lucide-react";
import logo from "../assets/educheck-logo-white.png";
import schoolPhoto from "../assets/login-photo.jpg";
// The school's name, set once per installation in frontend/.env
// (VITE_SCHOOL_NAME=...). Hidden when not set.
const SCHOOL_NAME = (import.meta.env.VITE_SCHOOL_NAME || "").trim();

function Login() {
    const [role, setRole] = useState("adviser");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    // Display only: lets the user check what they typed.
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {
            const response = await fetch(
                "http://localhost:5000/api/auth/login/",
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

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Login failed."
                );
            }

            // Verify that the selected role matches
            // the authenticated user's actual role.
            if (data.user.role !== role) {
                throw new Error(
                    `This account is registered as ${data.user.role}.`
                );
            }

            // Store authentication data temporarily
            localStorage.setItem("educheck_token", data.token);
            localStorage.setItem(
                "educheck_user",
                JSON.stringify(data.user)
            );

            navigate("/dashboard");

        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const roles = [
        { key: "adviser", label: "Adviser" },
        { key: "subject", label: "Subject" },
        { key: "admin", label: "Admin" },
        { key: "principal", label: "Principal" },
    ];

    return (
        <div className="login-page">

            {/* BRAND: school photo under an even #14545E veil */}
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
                        Validate, consolidate, and manage academic records with confidence.
                    </p>
                </div>

                {SCHOOL_NAME && <p className="login-brand-school">{SCHOOL_NAME}</p>}
            </aside>

            {/* AUTHENTICATION: form directly on the ivory page */}
            <main className="login-main">
                <div className="login-form-wrap">

                    <header className="login-head">
                        <h1>Sign in</h1>
                        <p className="login-subtitle">
                            Welcome back. Sign in to continue to EduCheck.
                        </p>
                    </header>

                    <form onSubmit={handleLogin}>

                        <fieldset className="login-roles">
                            <legend>Sign in as</legend>
                            <div className="role-selector">
                                {roles.map(({ key, label }) => (
                                    <button
                                        key={key}
                                        type="button"
                                        className="role"
                                        aria-pressed={role === key}
                                        onClick={() => setRole(key)}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </fieldset>

                        <div className="login-field">
                            <label htmlFor="username">Username</label>
                            <div className="login-input">
                                <UserRound size={18} strokeWidth={1.75} aria-hidden="true" />
                                <input
                                    id="username"
                                    type="text"
                                    autoComplete="username"
                                    placeholder="Enter your username"
                                    value={username}
                                    onChange={(e) =>
                                        setUsername(e.target.value)
                                    }
                                    required
                                />
                            </div>
                        </div>

                        <div className="login-field">
                            <label htmlFor="password">Password</label>
                            <div className="login-input">
                                <LockKeyhole size={18} strokeWidth={1.75} aria-hidden="true" />
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    required
                                />
                                <button
                                    type="button"
                                    className="login-reveal"
                                    onClick={() => setShowPassword((shown) => !shown)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                    aria-pressed={showPassword}
                                >
                                    {showPassword
                                        ? <EyeOff size={18} strokeWidth={1.75} />
                                        : <Eye size={18} strokeWidth={1.75} />}
                                </button>
                            </div>
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
                        >
                            {loading ? "Signing in…" : "Sign in"}
                            {!loading && <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />}
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
