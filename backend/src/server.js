const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const teacherRoutes = require("./routes/teacherRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const parserTestRoutes = require("./routes/parserTestRoutes");

const {
    authenticateToken,
    authorizeRoles
} = require("./middleware/authMiddleware");

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./db");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/uploads", uploadRoutes);

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