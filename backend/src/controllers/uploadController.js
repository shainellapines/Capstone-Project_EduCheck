const fs = require("fs");
const path = require("path");
const { parseClassRecord } = require("./classRecordParser");
const { validateClassRecord } = require("./classRecordValidator");
const pool = require("../db");

const removeUploadedFile = (filePath) => {
    if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
};
// ==========================================
// GET SUBJECTS AND SCHOOL YEARS
// ==========================================

const getUploadOptions = async (req, res) => {
    try {
        const subjectsResult = await pool.query(`
            SELECT
                subject_id,
                subject_name,
                grade_level
            FROM subjects
            ORDER BY grade_level, subject_name
        `);

        const schoolYearsResult = await pool.query(`
            SELECT
                school_year_id,
                school_year,
                status
            FROM school_years
            ORDER BY school_year_id DESC
        `);

        res.json({
            subjects: subjectsResult.rows,
            school_years: schoolYearsResult.rows
        });

    } catch (error) {
        console.error(
            "Get upload options error:",
            error
        );

        res.status(500).json({
            message:
                "Failed to retrieve subjects and school years."
        });
    }
};

// ==========================================
// GET MY UPLOADED CLASS RECORDS
// ==========================================

const getMyClassRecords = async (req, res) => {
    try {

        // ==========================================
        // 1. CHECK AUTHENTICATED USER
        // ==========================================

        if (!req.user || !req.user.user_id) {
            return res.status(401).json({
                message:
                    "Authenticated user information is unavailable."
            });
        }

        const userId = req.user.user_id;

        // ==========================================
        // 2. FIND TEACHER PROFILE
        // ==========================================

        const teacherResult = await pool.query(
            `
            SELECT
                teacher_id,
                first_name,
                last_name
            FROM teachers
            WHERE user_id = $1
            `,
            [userId]
        );

        if (teacherResult.rows.length === 0) {
            return res.status(404).json({
                message:
                    "Teacher profile not found for the authenticated user."
            });
        }

        const teacher =
            teacherResult.rows[0];

        // ==========================================
        // 3. GET CLASS RECORDS
        // ==========================================

        const result = await pool.query(
            `
            SELECT
                cr.class_record_id,
                cr.teacher_id,
                cr.subject_id,
                cr.school_year_id,
                cr.upload_date,
                cr.file_name,
                cr.status,

                s.subject_name,
                s.grade_level,

                sy.school_year,
                sy.status AS school_year_status

            FROM class_records cr

            INNER JOIN subjects s
                ON cr.subject_id = s.subject_id

            INNER JOIN school_years sy
                ON cr.school_year_id = sy.school_year_id

            WHERE cr.teacher_id = $1

            ORDER BY cr.upload_date DESC
            `,
            [teacher.teacher_id]
        );

        // ==========================================
        // 4. RETURN RECORDS
        // ==========================================

        res.json({
            teacher: {
                teacher_id:
                    teacher.teacher_id,

                teacher_name:
                    `${teacher.first_name} ${teacher.last_name}`
            },

            records: result.rows
        });

    } catch (error) {

        console.error(
            "Get my class records error:",
            error
        );

        res.status(500).json({
            message:
                "Failed to retrieve your class records."
        });
    }
};

// ==========================================
// GET MY CLASS RECORD SUMMARY
// ==========================================

const getMyClassRecordSummary = async (req, res) => {
    try {
        // ==========================================
        // 1. CHECK AUTHENTICATED USER
        // ==========================================

        if (!req.user || !req.user.user_id) {
            return res.status(401).json({
                message:
                    "Authenticated user information is unavailable."
            });
        }

        const userId = req.user.user_id;

        // ==========================================
        // 2. FIND TEACHER PROFILE
        // ==========================================

        const teacherResult = await pool.query(
            `
            SELECT
                teacher_id
            FROM teachers
            WHERE user_id = $1
            `,
            [userId]
        );

        if (teacherResult.rows.length === 0) {
            return res.status(404).json({
                message:
                    "Teacher profile not found for the authenticated user."
            });
        }

        const teacherId =
            teacherResult.rows[0].teacher_id;

        // ==========================================
        // 3. GET RECORD COUNTS
        // ==========================================

        const result = await pool.query(
            `
            SELECT
                COUNT(*) AS total_uploaded,

                COUNT(*) FILTER (
                    WHERE LOWER(status) = 'uploaded'
                ) AS pending_validation,

                COUNT(*) FILTER (
                    WHERE LOWER(status) = 'validated'
                ) AS validated,

                COUNT(*) FILTER (
                    WHERE LOWER(status) IN (
                        'needs attention',
                        'rejected',
                        'invalid'
                    )
                ) AS needs_attention

            FROM class_records
            WHERE teacher_id = $1
            `,
            [teacherId]
        );

        const summary = result.rows[0];

        // ==========================================
        // 4. RETURN SUMMARY
        // ==========================================

        res.json({
            total_uploaded:
                Number(summary.total_uploaded),

            pending_validation:
                Number(summary.pending_validation),

            validated:
                Number(summary.validated),

            needs_attention:
                Number(summary.needs_attention)
        });

    } catch (error) {
        console.error(
            "Get class record summary error:",
            error
        );

        res.status(500).json({
            message:
                "Failed to retrieve class record summary."
        });
    }
};

const getMyClassRecordValidation = async (req, res) => {
    try {
        if (!req.user || !req.user.user_id) {
            return res.status(401).json({
                message: "Authenticated user information is unavailable.",
            });
        }

        const classRecordId = Number(req.params.classRecordId);

        if (!Number.isInteger(classRecordId) || classRecordId <= 0) {
            return res.status(400).json({
                message: "A valid class record ID is required.",
            });
        }

        const recordResult = await pool.query(
            `
            SELECT
                cr.class_record_id,
                cr.file_name,
                cr.status,
                cr.upload_date,
                cr.validation_error_count,
                cr.validation_warning_count,
                cr.ready_for_submission,

                s.subject_name,
                s.grade_level,

                sy.school_year

            FROM class_records cr

            INNER JOIN teachers t
                ON t.teacher_id = cr.teacher_id

            INNER JOIN subjects s
                ON s.subject_id = cr.subject_id

            INNER JOIN school_years sy
                ON sy.school_year_id = cr.school_year_id

            WHERE cr.class_record_id = $1
              AND t.user_id = $2
            `,
            [classRecordId, req.user.user_id]
        );

        if (recordResult.rows.length === 0) {
            return res.status(404).json({
                message: "Class record not found or you do not have access to it.",
            });
        }

        const record = recordResult.rows[0];

        const issuesResult = await pool.query(
            `
            SELECT
                validation_issue_id,
                learner_number,
                learner_name,
                term,
                field_name AS field,
                code,
                severity,
                message,
                created_at
            FROM class_record_validation_issues
            WHERE class_record_id = $1
            ORDER BY
                learner_name,
                term,
                validation_issue_id
            `,
            [classRecordId]
        );

        return res.json({
            class_record: {
                class_record_id: record.class_record_id,
                file_name: record.file_name,
                subject_name: record.subject_name,
                grade_level: record.grade_level,
                school_year: record.school_year,
                upload_date: record.upload_date,
                status: record.status,
            },

            validation: {
                ready_for_submission: record.ready_for_submission,
                error_count: record.validation_error_count,
                warning_count: record.validation_warning_count,
                issues: issuesResult.rows,
            },
        });
    } catch (error) {
        console.error("Get class record validation error:", error);

        return res.status(500).json({
            message: "Failed to retrieve validation results.",
        });
    }
};

// ==========================================
// UPLOAD AND READ E-CLASS RECORD
// ==========================================

const uploadClassRecord = async (req, res) => {
    try {
        if (!req.user || !req.user.user_id) {
            return res.status(401).json({
                message: "Authenticated user information is unavailable.",
            });
        }

        const { subject_id, school_year_id } = req.body;

        if (!subject_id || !school_year_id) {
            removeUploadedFile(req.file?.path);

            return res.status(400).json({
                message: "Subject and school year are required.",
            });
        }

        if (!req.file) {
            return res.status(400).json({
                message: "No Excel file was uploaded.",
            });
        }

        const file = req.file;

        const allowedExtensions = [".xlsx", ".xlsm", ".xls"];
        const fileExtension = path.extname(file.originalname).toLowerCase();

        if (!allowedExtensions.includes(fileExtension)) {
            removeUploadedFile(file.path);

            return res.status(400).json({
                message: "Invalid file type. Please upload an Excel file (.xlsx, .xlsm, or .xls).",
            });
        }

        const teacherResult = await pool.query(
            `
            SELECT
                teacher_id,
                first_name,
                last_name
            FROM teachers
            WHERE user_id = $1
            `,
            [req.user.user_id]
        );

        if (teacherResult.rows.length === 0) {
            removeUploadedFile(file.path);

            return res.status(404).json({
                message: "Teacher profile not found for the authenticated user.",
            });
        }

        const teacher = teacherResult.rows[0];

        const subjectResult = await pool.query(
            `
            SELECT
                subject_id,
                subject_name,
                grade_level
            FROM subjects
            WHERE subject_id = $1
            `,
            [subject_id]
        );

        if (subjectResult.rows.length === 0) {
            removeUploadedFile(file.path);

            return res.status(404).json({
                message: "Selected subject was not found.",
            });
        }

        const subject = subjectResult.rows[0];

        const schoolYearResult = await pool.query(
            `
            SELECT
                school_year_id,
                school_year
            FROM school_years
            WHERE school_year_id = $1
            `,
            [school_year_id]
        );

        if (schoolYearResult.rows.length === 0) {
            removeUploadedFile(file.path);

            return res.status(404).json({
                message: "Selected school year was not found.",
            });
        }

        const schoolYear = schoolYearResult.rows[0];

        let parsedRecord;
        let validationResult;

        try {
            parsedRecord = parseClassRecord(file.path);
            validationResult = validateClassRecord(parsedRecord);
        } catch (error) {
            removeUploadedFile(file.path);

            return res.status(422).json({
                message: "The uploaded file is not a supported E-Class Record workbook.",
                detail: error.message,
            });
        }

        const recordStatus = validationResult.ready_for_submission
            ? "Validated"
            : "Needs Attention";

        let classRecord;
        const dbClient = await pool.connect();

        try {
            await dbClient.query("BEGIN");

            const classRecordResult = await dbClient.query(
                `
        INSERT INTO class_records
        (
            teacher_id,
            subject_id,
            school_year_id,
            file_name,
            stored_file_name,
            status,
            validation_error_count,
            validation_warning_count,
            ready_for_submission
        )
        VALUES
        (
            $1, $2, $3, $4, $5, $6, $7, $8, $9
        )
        RETURNING
            class_record_id,
            teacher_id,
            subject_id,
            school_year_id,
            upload_date,
            file_name,
            stored_file_name,
            status,
            validation_error_count,
            validation_warning_count,
            ready_for_submission
        `,
                [
                    teacher.teacher_id,
                    subject.subject_id,
                    schoolYear.school_year_id,
                    file.originalname,
                    file.filename,
                    recordStatus,
                    validationResult.error_count,
                    validationResult.warning_count,
                    validationResult.ready_for_submission,
                ]
            );

            classRecord = classRecordResult.rows[0];

            for (const issue of validationResult.issues) {
                await dbClient.query(
                    `
            INSERT INTO class_record_validation_issues
            (
                class_record_id,
                learner_number,
                learner_name,
                term,
                field_name,
                code,
                severity,
                message
            )
            VALUES
            (
                $1, $2, $3, $4, $5, $6, $7, $8
            )
            `,
                    [
                        classRecord.class_record_id,
                        issue.learner_number,
                        issue.learner_name,
                        issue.term,
                        issue.field,
                        issue.code,
                        issue.severity,
                        issue.message,
                    ]
                );
            }

            await dbClient.query("COMMIT");
        } catch (error) {
            await dbClient.query("ROLLBACK");
            throw error;
        } finally {
            dbClient.release();
        }

        return res.status(201).json({
            message: validationResult.ready_for_submission
                ? "E-Class Record uploaded and validated successfully."
                : "E-Class Record uploaded, but corrections are required before submission.",

            class_record: {
                class_record_id: classRecord.class_record_id,
                teacher_id: classRecord.teacher_id,
                teacher_name: `${teacher.first_name} ${teacher.last_name}`,
                subject_id: classRecord.subject_id,
                subject_name: subject.subject_name,
                grade_level: subject.grade_level,
                school_year_id: classRecord.school_year_id,
                school_year: schoolYear.school_year,
                upload_date: classRecord.upload_date,
                file_name: classRecord.file_name,
                stored_file_name: classRecord.stored_file_name,
                validation_error_count: classRecord.validation_error_count,
                validation_warning_count: classRecord.validation_warning_count,
                ready_for_submission: classRecord.ready_for_submission,
                status: classRecord.status,
            },

            file: {
                original_name: file.originalname,
                stored_name: file.filename,
                size: file.size,
            },

            workbook: {
                sheet_count: parsedRecord.workbook.sheet_count,
                sheet_names: parsedRecord.workbook.sheet_names,
                learner_count: parsedRecord.validation.learner_count,
            },

            validation: {
                ready_for_submission: validationResult.ready_for_submission,
                error_count: validationResult.error_count,
                warning_count: validationResult.warning_count,
                issues: validationResult.issues,
            },
        });
    } catch (error) {
        console.error("Upload and validation error:", error);

        removeUploadedFile(req.file?.path);

        return res.status(500).json({
            message: "Server error while processing the E-Class Record.",
        });
    }
};

module.exports = {
    getUploadOptions,
    getMyClassRecords,
    getMyClassRecordSummary,
    getMyClassRecordValidation,
    uploadClassRecord
};