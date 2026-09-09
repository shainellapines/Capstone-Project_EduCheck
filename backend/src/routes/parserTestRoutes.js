const express = require("express");
const multer = require("multer");
const path = require("path");

const {
    parseClassRecord,
} = require("../controllers/classRecordParser");

const {
    authenticateToken,
} = require("../middleware/authMiddleware");

const router = express.Router();

const upload = multer({
    dest: path.join(
        __dirname,
        "../uploads"
    ),
});

// Dev diagnostic route (parse an Excel file without persisting anything) —
// was mounted with no auth at all, so anyone who found the URL could POST
// arbitrary files to it. Not scoped to a specific role since it doesn't
// touch the database or any user's data, but it does need to require
// being logged in like every other route in this API.
router.post(
    "/",
    authenticateToken,
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
        }
    }
);

module.exports = router;