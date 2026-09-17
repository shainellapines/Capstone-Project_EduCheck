const express = require("express");
const rateLimit = require("express-rate-limit");
const { login } = require("../controllers/authController");

const router = express.Router();

// Caps brute-force login attempts per IP: 10 tries per 15 minutes.
// Only failed attempts count, so a legitimate user typing their own
// correct password repeatedly is never blocked.
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: "Too many login attempts. Please try again in a few minutes."
    }
});

router.post("/login", loginLimiter, login);

module.exports = router;