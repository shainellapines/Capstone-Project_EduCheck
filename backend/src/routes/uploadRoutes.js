const express = require("express");
const multer = require("multer");
const path = require("path");

const {
    getUploadOptions,
    getMyClassRecords,
    getMyClassRecordSummary,
    getMyClassRecordValidation,
    uploadClassRecord
} = require("../controllers/uploadController");

const {
    authenticateToken,
    authorizeRoles
} = require("../middleware/authMiddleware");

const router = express.Router();

// ==========================================
// MULTER STORAGE
// ==========================================

const storage = multer.diskStorage({

    destination: (
        req,
        file,
        cb
    ) => {

        cb(
            null,
            path.join(
                __dirname,
                "../uploads"
            )
        );

    },

    filename: (
        req,
        file,
        cb
    ) => {

        const uniqueName =
            `${Date.now()}-${file.originalname}`;

        cb(
            null,
            uniqueName
        );

    }
});

// A real e-class record workbook is about 2 MB; 10 MB leaves headroom
// while stopping a huge file from filling the disk or stalling the parser.
const MAX_UPLOAD_MB = 10;

const upload =
    multer({
        storage,
        limits: {
            fileSize: MAX_UPLOAD_MB * 1024 * 1024,
            files: 1
        }
    });

// Turns multer's errors (oversized file, extra files) into a JSON message
// the upload page can show, instead of Express's default error page.
const uploadSingleFile = (req, res, next) => {
    upload.single("file")(req, res, (error) => {
        if (!error) return next();

        if (error instanceof multer.MulterError) {
            const tooLarge = error.code === "LIMIT_FILE_SIZE";
            return res.status(tooLarge ? 413 : 400).json({
                message: tooLarge
                    ? `The file is larger than ${MAX_UPLOAD_MB} MB. Upload the e-class record workbook only.`
                    : "Upload one Excel file at a time."
            });
        }

        return next(error);
    });
};

// ==========================================
// ALL UPLOAD ROUTES
// SUBJECT TEACHERS, plus ADVISERS for Self-Contained sections
// (per SPMP v1.0 US-011). Which specific (subject, section) pairs
// either role can actually use is enforced inside uploadController via
// teacher_assignments - this gate is just the coarse role check.
// ==========================================

router.use(
    authenticateToken,
    authorizeRoles("subject", "adviser")
);

// ==========================================
// GET SUBJECTS + SCHOOL YEARS
// ==========================================

router.get(
    "/options",
    getUploadOptions
);

// ==========================================
// GET MY UPLOADED CLASS RECORDS
// ==========================================

router.get(
    "/my-records",
    getMyClassRecords
);

// ==========================================
// GET MY CLASS RECORD SUMMARY
// ==========================================

router.get(
    "/my-records/summary",
    getMyClassRecordSummary
);

router.get(
    "/my-records/:classRecordId/validation",
    getMyClassRecordValidation
);

// ==========================================
// UPLOAD CLASS RECORD
// ==========================================

router.post(
    "/",
    uploadSingleFile,
    uploadClassRecord
);

module.exports = router;