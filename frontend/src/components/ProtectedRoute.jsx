import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, allowedRoles }) {
    const storedUser = localStorage.getItem("educheck_user");

    if (!storedUser) {
        return <Navigate to="/" replace />;
    }

    let user;

    try {
        user = JSON.parse(storedUser);
    } catch {
        localStorage.removeItem("educheck_user");
        localStorage.removeItem("educheck_token");

        return <Navigate to="/" replace />;
    }

    if (!allowedRoles.includes(user.role)) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}

export default ProtectedRoute;