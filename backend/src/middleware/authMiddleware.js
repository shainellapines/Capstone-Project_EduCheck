const jwt = require("jsonwebtoken");
const pool = require("../db");

// While an account still has a temporary password (from setup or a reset,
// migration 011), only these calls work: reading the account and changing
// the password. Everything else answers 403 PASSWORD_CHANGE_REQUIRED, which
// both apps answer by opening their change-password screen.
const ALLOWED_BEFORE_PASSWORD_CHANGE = new Set(["/api/auth/me", "/api/auth/change-password"]);

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Authentication required."
        });
    }

    const token = authHeader.split(" ")[1];
    let decoded;

    try {
        decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );
    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token."
        });
    }

    // A token outlives changes to its account (it lasts 8 hours), so the
    // account is re-read on every request: a deactivated or deleted
    // account stops working at once, and a role change applies at once.
    try {
        const account = await pool.query(
            `SELECT username, role, status, must_change_password FROM users WHERE user_id = $1`,
            [decoded.user_id]
        );
        const user = account.rows[0];

        if (!user || (user.status && user.status.toLowerCase() !== "active")) {
            return res.status(401).json({
                message: "This account is no longer active. Please contact your Administrator."
            });
        }

        const path = req.originalUrl.split("?")[0].replace(/\/+$/, "");

        if (user.must_change_password && !ALLOWED_BEFORE_PASSWORD_CHANGE.has(path)) {
            res.set("X-Password-Change-Required", "1");
            return res.status(403).json({
                code: "PASSWORD_CHANGE_REQUIRED",
                message: "Replace your temporary password before continuing."
            });
        }

        req.user = { ...decoded, username: user.username, role: user.role };
    } catch (error) {
        console.error("Authentication account check error:", error);

        return res.status(500).json({
            message: "Could not verify your account. Please try again."
        });
    }

    next();
};

const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                message: "Authentication required."
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: "You do not have permission to access this resource."
            });
        }

        next();
    };
};

module.exports = {
    authenticateToken,
    authorizeRoles
};