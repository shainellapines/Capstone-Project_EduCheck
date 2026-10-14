const express = require("express");
const multer = require("multer");

const {
    getSettings,
    updateSettings,
    getLearnerSf10,
    downloadLearnerSf10,
    updateLearnerProfile,
    upsertHistoricalRecord,
    deleteHistoricalRecord,
    previewSf10Import,
} = require("../controllers/sf10Controller");

const { authenticateToken, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

// An imported SF10 is only read for its grades, never stored, so it stays
// in memory. Same 10 MB / one-file limit as e-Class Record uploads.
const MAX_IMPORT_MB = 10;
const importUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_IMPORT_MB * 1024 * 1024, files: 1 },
    fileFilter: (req, file, cb) => cb(null, /\.xlsx?$/i.test(file.originalname)),
});

const importSingleFile = (req, res, next) => {
    importUpload.single("file")(req, res, (error) => {
        if (!error) return next();
        if (error instanceof multer.MulterError) {
            const tooLarge = error.code === "LIMIT_FILE_SIZE";
            return res.status(tooLarge ? 413 : 400).json({
                message: tooLarge ? `The file is larger than ${MAX_IMPORT_MB} MB.` : "Upload one SF10 Excel file.",
            });
        }
        return next(error);
    });
};

// SF10 is a permanent record: Admin, Principal (read-only) and Advisers
// (own learners - enforced per learner in sf10Controller). Subject
// Teachers never reach it.
router.use(authenticateToken, authorizeRoles("admin", "principal", "adviser"));

router.get("/settings", getSettings);
router.put("/settings", authorizeRoles("admin"), updateSettings);

router.get("/students/:lrn", getLearnerSf10);
router.get("/students/:lrn/download", authorizeRoles("admin", "adviser"), downloadLearnerSf10);
router.put("/students/:lrn/profile", authorizeRoles("admin", "adviser"), updateLearnerProfile);
router.put("/students/:lrn/history", authorizeRoles("admin", "adviser"), upsertHistoricalRecord);
router.post("/students/:lrn/import-preview", authorizeRoles("admin", "adviser"), importSingleFile, previewSf10Import);
router.delete("/students/:lrn/history/:recordId", authorizeRoles("admin", "adviser"), deleteHistoricalRecord);

module.exports = router;
