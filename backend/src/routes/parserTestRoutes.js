const express = require("express");
const multer = require("multer");
const path = require("path");

const {
    parseClassRecord,
} = require("../controllers/classRecordParser");

const router = express.Router();

const upload = multer({
    dest: path.join(
        __dirname,
        "../uploads"
    ),
});

router.post(
    "/",
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