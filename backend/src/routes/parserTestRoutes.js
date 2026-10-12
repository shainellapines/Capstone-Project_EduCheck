const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const {
    parseClassRecord,
} = require("../services/classRecord/classRecordParser");

const {
    authenticateToken,
    authorizeRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();

const upload = multer({
    dest: process.env.UPLOAD_DIR || path.join(
        __dirname,
        "../uploads"
    ),
});

// Dev diagnostic route (parse an Excel file without persisting anything).
// Admin only: it writes an uploaded file to disk, so it must not be open to
// every logged-in role (SEC-07). The temp file is always deleted after the
// parse, success or failure.
router.post(
    "/",
    authenticateToken,
    authorizeRoles("admin"),
    upload.single("file"),
    (req, res) => {

        try {

            if (!req.file) {
                return res.status(400).json({
                    message:
                        "No Excel file was uploaded.",
                });
            }

            const parsedData =
                parseClassRecord(
                    req.file.path
                );

            res.json({
                message:
                    "Class record parsed successfully.",

                data: parsedData,
            });

        } catch (error) {

            console.error(
                "Parser test error:",
                error
            );

            res.status(500).json({
                message:
                    error.message ||
                    "Failed to parse class record.",
            });
        } finally {
            if (req.file?.path && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
        }
    }
);

module.exports = router;