const pool = require("../db");

// ==========================================
// SHARED QUERY: latest grade_records row per
// (student, subject) for a school year
// ==========================================
// A learner may have more than one class_records upload for the same
// subject (a corrected re-upload). Until re-uploads are formally linked
// (superseded_by or similar), "latest wins" is resolved here by
// upload_date, tie-broken by class_record_id.

const buildRankedGradesQuery = (extraWhere) => `
    WITH ranked_grades AS (
        SELECT
            gr.lrn,
            gr.term_1,
            gr.term_2,
            gr.term_3,
            gr.final_grade,
            gr.remarks,
            cr.class_record_id,
            cr.subject_id,
            cr.teacher_id,
            cr.upload_date,
            cr.ready_for_submission,
            cr.status,
            ROW_NUMBER() OVER (
                PARTITION BY gr.lrn, cr.subject_id
                ORDER BY cr.upload_date DESC, cr.class_record_id DESC
            ) AS rn
        FROM grade_records gr
        INNER JOIN class_records cr
            ON cr.class_record_id = gr.class_record_id
        WHERE cr.school_year_id = $1
        ${extraWhere}
    )
    SELECT
        rg.lrn,
        s.first_name,
        s.last_name,
        s.grade_level,
        subj.subject_id,
        subj.subject_name,
        rg.term_1,
        rg.term_2,
        rg.term_3,
        rg.final_grade,
        rg.remarks,
        rg.class_record_id,
        rg.upload_date,
        rg.ready_for_submission,
        rg.status,
        t.first_name AS teacher_first_name,
        t.last_name AS teacher_last_name,
        t.user_id AS teacher_user_id
    FROM ranked_grades rg
    INNER JOIN students s ON s.lrn = rg.lrn
    INNER JOIN subjects subj ON subj.subject_id = rg.subject_id
    INNER JOIN teachers t ON t.teacher_id = rg.teacher_id
    WHERE rg.rn = 1
    ORDER BY s.last_name, s.first_name, subj.subject_name
`;

// Groups the flat per-(student, subject) rows above into one entry per
// student, each carrying its list of per-subject grades.
const groupRowsByStudent = (rows) => {
    const studentsByLrn = new Map();

    rows.forEach((row) => {
        if (!studentsByLrn.has(row.lrn)) {
            studentsByLrn.set(row.lrn, {
                lrn: row.lrn,
                first_name: row.first_name,
                last_name: row.last_name,
                grade_level: row.grade_level,
                subjects: [],
            });
        }

        studentsByLrn.get(row.lrn).subjects.push({
            subject_id: row.subject_id,
            subject_name: row.subject_name,
            teacher_name: `${row.teacher_first_name} ${row.teacher_last_name}`,
            // The teacher's users.user_id (not teachers.teacher_id) — this is
            // what notifications.user_id needs, since notifications are keyed
            // to a login, not a teacher profile. Used by submissionController
            // to tell a subject teacher when their uploaded grades ended up in
            // an approved/rejected consolidated record.
            teacher_user_id: row.teacher_user_id,
            term_1: row.term_1 !== null ? Number(row.term_1) : null,
            term_2: row.term_2 !== null ? Number(row.term_2) : null,
            term_3: row.term_3 !== null ? Number(row.term_3) : null,
            final_grade: row.final_grade !== null ? Number(row.final_grade) : null,
            remarks: row.remarks,
            class_record_id: row.class_record_id,
            upload_date: row.upload_date,
            ready_for_submission: row.ready_for_submission,
            status: row.status,
        });
    });

    return Array.from(studentsByLrn.values());
};

// Attaches subjects_expected (how many subjects exist for this grade level)
// and subjects_recorded (how many the student actually has a grade for) so
// a reviewer can see at a glance whether a student's record is complete —
// this is a proxy only; it does not yet know about elective/optional
// subjects or subjects not tracked in this school's `subjects` table.
const attachCompleteness = async (students, gradeLevels) => {
    if (students.length === 0) return students;

    const expectedCounts = await pool.query(
        `
        SELECT grade_level, COUNT(*) AS subject_count
        FROM subjects
        WHERE grade_level = ANY($1)
        GROUP BY grade_level
        `,
        [gradeLevels]
    );

    const expectedByGradeLevel = new Map(
        expectedCounts.rows.map((row) => [row.grade_level, Number(row.subject_count)])
    );

    return students.map((student) => {
        const subjectsExpected = expectedByGradeLevel.get(student.grade_level) ?? null;
        const subjectsRecorded = student.subjects.length;
        const allSubjectsGraded = student.subjects.every((subject) => subject.final_grade !== null);

        return {
            ...student,
            subjects_expected: subjectsExpected,
            subjects_recorded: subjectsRecorded,
            all_subjects_submitted: subjectsExpected !== null ? subjectsRecorded >= subjectsExpected : null,
            all_subjects_graded: allSubjectsGraded,
        };
    });
};

// Attaches each student's submission workflow state (Sprint 7). Absence of
// a record_submissions row means "Not Submitted" — that state is computed
// here, never stored.
const attachSubmissionStatus = async (students, schoolYearId) => {
    if (students.length === 0) return students;

    const lrns = students.map((student) => student.lrn);

    const result = await pool.query(
        `
        SELECT lrn, status, reviewed_at, approved_at, remarks
        FROM record_submissions
        WHERE school_year_id = $1 AND lrn = ANY($2)
        `,
        [schoolYearId, lrns]
    );

    const submissionByLrn = new Map(result.rows.map((row) => [row.lrn, row]));

    return students.map((student) => {
        const submission = submissionByLrn.get(student.lrn);

        return {
            ...student,
            submission: submission
                ? {
                    status: submission.status,
                    reviewed_at: submission.reviewed_at,
                    approved_at: submission.approved_at,
                    remarks: submission.remarks,
                }
                : { status: "Not Submitted", reviewed_at: null, approved_at: null, remarks: null },
        };
    });
};

// ==========================================
// SHARED: fetch consolidated students, with
// completeness + submission status attached
// ==========================================
// Used by the HTTP handlers below and reused by submissionController so
// submit/approve/reject can check completeness without a second round
// trip through HTTP.

const fetchConsolidatedStudents = async (schoolYearId) => {
    const rows = (await pool.query(buildRankedGradesQuery(""), [schoolYearId])).rows;
    const students = groupRowsByStudent(rows);
    const gradeLevels = [...new Set(students.map((student) => student.grade_level))];
    const withCompleteness = await attachCompleteness(students, gradeLevels);

    return attachSubmissionStatus(withCompleteness, schoolYearId);
};

const fetchConsolidatedStudent = async (schoolYearId, lrn) => {
    const rows = (await pool.query(buildRankedGradesQuery("AND gr.lrn = $2"), [schoolYearId, lrn])).rows;

    if (rows.length === 0) return null;

    const [student] = groupRowsByStudent(rows);
    const [withCompleteness] = await attachCompleteness([student], [student.grade_level]);
    const [withSubmission] = await attachSubmissionStatus([withCompleteness], schoolYearId);

    return withSubmission;
};

// ==========================================
// GET SCHOOL YEARS
// ==========================================
// Advisers/admins need this to pick which school year to review — the
// existing /api/uploads/options endpoint is restricted to subject teachers.

const getSchoolYears = async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT school_year_id, school_year, status FROM school_years ORDER BY school_year_id DESC"
        );

        return res.json({ school_years: result.rows });
    } catch (error) {
        console.error("Get school years error:", error);

        return res.status(500).json({
            message: "Failed to retrieve school years.",
        });
    }
};

// Raw upload counts by status for this school year — every class_records
// row, not deduped to "latest per subject" like the grades above, since
// this is about upload activity, not which grade currently counts.
const getUploadSummary = async (schoolYearId) => {
    const result = await pool.query(
        `
        SELECT status, COUNT(*) AS upload_count
        FROM class_records
        WHERE school_year_id = $1
        GROUP BY status
        `,
        [schoolYearId]
    );

    const countsByStatus = Object.fromEntries(
        result.rows.map((row) => [row.status, Number(row.upload_count)])
    );

    const totalUploads = Object.values(countsByStatus).reduce((sum, count) => sum + count, 0);

    return {
        total_uploads: totalUploads,
        validated: countsByStatus["Validated"] ?? 0,
        needs_attention: countsByStatus["Needs Attention"] ?? 0,
    };
};

// ==========================================
// GET CONSOLIDATED RECORDS FOR A SCHOOL YEAR
// ==========================================
// One entry per student who has at least one recorded subject grade in
// this school year, each with its per-subject breakdown.

const getConsolidatedRecordsForSchoolYear = async (req, res) => {
    try {
        const schoolYearId = Number(req.params.schoolYearId);

        if (!Number.isInteger(schoolYearId) || schoolYearId <= 0) {
            return res.status(400).json({
                message: "A valid school year ID is required.",
            });
        }

        const schoolYearResult = await pool.query(
            "SELECT school_year_id, school_year FROM school_years WHERE school_year_id = $1",
            [schoolYearId]
        );

        if (schoolYearResult.rows.length === 0) {
            return res.status(404).json({
                message: "School year not found.",
            });
        }

        const students = await fetchConsolidatedStudents(schoolYearId);
        const uploadSummary = await getUploadSummary(schoolYearId);

        return res.json({
            school_year: schoolYearResult.rows[0],
            student_count: students.length,
            upload_summary: uploadSummary,
            students,
        });
    } catch (error) {
        console.error("Get consolidated records error:", error);

        return res.status(500).json({
            message: "Failed to retrieve consolidated records.",
        });
    }
};

// ==========================================
// GET ONE STUDENT'S CONSOLIDATED RECORD
// ==========================================

const getConsolidatedRecordForStudent = async (req, res) => {
    try {
        const schoolYearId = Number(req.params.schoolYearId);
        const { lrn } = req.params;

        if (!Number.isInteger(schoolYearId) || schoolYearId <= 0) {
            return res.status(400).json({
                message: "A valid school year ID is required.",
            });
        }

        if (!lrn || !/^\d{12}$/.test(lrn)) {
            return res.status(400).json({
                message: "A valid 12-digit LRN is required.",
            });
        }

        const student = await fetchConsolidatedStudent(schoolYearId, lrn);

        if (!student) {
            return res.status(404).json({
                message: "No consolidated record found for this LRN in this school year.",
            });
        }

        return res.json({ student });
    } catch (error) {
        console.error("Get consolidated record error:", error);

        return res.status(500).json({
            message: "Failed to retrieve the consolidated record.",
        });
    }
};

module.exports = {
    getSchoolYears,
    getConsolidatedRecordsForSchoolYear,
    getConsolidatedRecordForStudent,
    fetchConsolidatedStudents,
    fetchConsolidatedStudent,
};
