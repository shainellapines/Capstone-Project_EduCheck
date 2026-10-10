const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const teacherRoutes = require("./routes/teacherRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const sectionRoutes = require("./routes/sectionRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const consolidationRoutes = require("./routes/consolidationRoutes");
const submissionRoutes = require("./routes/submissionRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const repositoryRoutes = require("./routes/repositoryRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const auditLogRoutes = require("./routes/auditLogRoutes");
const parserTestRoutes = require("./routes/parserTestRoutes");
const sf10Routes = require("./routes/sf10Routes");

const {
    authenticateToken,
    authorizeRoles
} = require("./middleware/authMiddleware");

const express = require("express");
const cors = require("cors");
require("dotenv").config();

// Refuse to start with no signing key, or the placeholder from .env.example:
// anyone who knows it could forge an Admin token.
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === "change-me") {
    console.error("JWT_SECRET is missing or still 'change-me' in backend/.env. Set a long random value (see .env.example).");
    process.exit(1);
}

const pool = require("./db");

const app = express();
const PORT = process.env.PORT || 5000;

// Which web origins may call the API. Set CORS_ORIGIN in backend/.env to a
// comma-separated list (e.g. http://192.168.1.20:5173) once the frontend is
// opened from other computers. Unset = any origin (local development).
// The mobile app sends no Origin header, so this never blocks it.
const allowedOrigins = (process.env.CORS_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);

// Middleware
app.use(cors(allowedOrigins.length > 0 ? { origin: allowedOrigins } : undefined));
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/sections", sectionRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/consolidation", consolidationRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/repository", repositoryRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/audit-logs", auditLogRoutes);
app.use("/api/sf10", sf10Routes);

app.use(
    "/api/parser-test",
    parserTestRoutes
);

// API test route
app.get("/", (req, res) => {
    res.json({
        message: "EduCheck API is running"
    });
});

// Database connection test
app.get("/api/health/db", async (req, res) => {
    try {
        const result = await pool.query("SELECT current_database()");

        res.json({
            status: "connected",
            database: result.rows[0].current_database
        });
    } catch (error) {
        console.error("Database connection error:", error);

        res.status(500).json({
            status: "error",
            message: "Database connection failed"
        });
    }
});

app.get(
    "/api/test/adviser",
    authenticateToken,
    authorizeRoles("adviser"),
    (req, res) => {
        res.json({
            message: "Adviser authorization successful.",
            user: req.user
        });
    }
);

// Start server
app.listen(PORT, () => {
    console.log(`EduCheck backend running on http://localhost:${PORT}`);
});