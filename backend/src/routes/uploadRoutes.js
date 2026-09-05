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

const upload =
    multer({
        storage
    });

// ==========================================
// ALL UPLOAD ROUTES
// SUBJECT TEACHERS ONLY
// ==========================================

router.use(
    authenticateToken,
    authorizeRoles("subject")
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
    upload.single("file"),
    uploadClassRecord
);

module.exports = router;