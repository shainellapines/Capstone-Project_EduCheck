import { Navigate } from "react-router-dom";
import { isSessionValid, getStoredUser, clearSession } from "../utils/session";

function ProtectedRoute({ children, allowedRoles }) {
    // Previously this only checked whether *something* was stored under
    // "educheck_user" — not whether the token alongside it was still
    // valid, or even present. That let an expired (or hand-edited)
    // session render the page shell instead of bouncing back to Login.
    if (!isSessionValid()) {
        clearSession();

        return <Navigate to="/" replace />;
    }

    const user = getStoredUser();

    if (!allowedRoles.includes(user.role)) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}

export default ProtectedRoute;