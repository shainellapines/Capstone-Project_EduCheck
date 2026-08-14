import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
    const [role, setRole] = useState("adviser");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
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

    return (
        <div className="login-page">
            <div className="login-card">

                <div className="brand-icon">
                    🎓
                </div>

                <h1>EduCheck</h1>

                <p className="subtitle">
                    Academic Record Validation System
                </p>

                <div className="system-badge">
                    Subject-Based RBAC Enabled
                </div>

                <form onSubmit={handleLogin}>

                    <label>Login as</label>

                    <div className="role-selector">

                        <button
                            type="button"
                            className={role === "adviser" ? "role active" : "role"}
                            onClick={() => setRole("adviser")}
                        >
                            👤
                            <span>Adviser</span>
                        </button>

                        <button
                            type="button"
                            className={role === "subject" ? "role active" : "role"}
                            onClick={() => setRole("subject")}
                        >
                            📖
                            <span>Subject</span>
                        </button>

                        <button
                            type="button"
                            className={role === "admin" ? "role active" : "role"}
                            onClick={() => setRole("admin")}
                        >
                            🛡️
                            <span>Admin</span>
                        </button>

                    </div>

                    <label htmlFor="username">
                        Username
                    </label>

                    <input
                        id="username"
                        type="text"
                        placeholder="Enter your username"
                        value={username}
                        onChange={(e) =>
                            setUsername(e.target.value)
                        }
                        required
                    />

                    <label htmlFor="password">
                        Password
                    </label>

                    <input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) =>
                            setPassword(e.target.value)
                        }
                        required
                    />

                    {error && (
                        <div className="login-error">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="login-button"
                        disabled={loading}
                    >
                        {loading
                            ? "Signing in..."
                            : "Login to Dashboard"}
                    </button>

                </form>

                <div className="demo-credentials">
                    <strong>Development Account</strong>

                    <p>
                        Adviser: adviser.grade6a
                    </p>

                    <p>
                        Password: adviser123
                    </p>
                </div>

            </div>
        </div>
    );
}

export default Login;