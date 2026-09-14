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
            cr.revision_remarks,
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
        s.section_id,
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
        rg.revision_remarks,
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
                section_id: row.section_id,
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
            revision_remarks: row.revision_remarks,
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
// this school year, each with its per-subject breakdown. Optional
// ?section_id= filters to one section — used by the Section Progress
// view's "View Students" drill-down. Filtered in JS rather than added to
// buildRankedGradesQuery's WHERE clause, since that query is shared with
// submissionController and fetchConsolidatedStudent, neither of which
// needs section scoping.

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

        let students = await fetchConsolidatedStudents(schoolYearId);

        const sectionIdFilter = req.query.section_id ? Number(req.query.section_id) : null;

        if (sectionIdFilter) {
            students = students.filter((student) => student.section_id === sectionIdFilter);
        }

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
// GET SECTION PROGRESS FOR A SCHOOL YEAR
// ==========================================
// SPMP v1.0: the section-level consolidation view. Per section, how many
// of that grade level's expected learning areas have a submitted
// (Validated) upload for this section/school year yet, plus how many
// students in it sit at each submission-workflow stage. Complements, not
// replaces, the per-student view above — this is "which subjects/sections
// still need attention" at a glance, before drilling into individual
// students.
//
// student_count and submission_status_counts are read straight off
// students.section_id, which is not itself scoped to school_year_id
// (students only carries one section_id/grade_level, last-write-wins —
// the same pre-existing modeling limitation gradeRecordPersistence
// already has). Fine for a single-active-school-year deployment; would
// need real per-year enrollment to hold up across multiple years at once.

const getSectionProgressForSchoolYear = async (req, res) => {
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

        const sectionsResult = await pool.query(
            "SELECT section_id, section_name, grade_level, staffing_mode FROM sections ORDER BY grade_level, section_name"
        );

        if (sectionsResult.rows.length === 0) {
            return res.json({ school_year: schoolYearResult.rows[0], sections: [] });
        }

        const expectedCounts = await pool.query(
            "SELECT grade_level, COUNT(*) AS subject_count FROM subjects GROUP BY grade_level"
        );

        const expectedByGradeLevel = new Map(
            expectedCounts.rows.map((row) => [row.grade_level, Number(row.subject_count)])
        );

        // Latest class_record per (section, subject) for this school year —
        // same "latest upload wins" ranking buildRankedGradesQuery uses, just
        // keyed by section+subject instead of student+subject, since one
        // upload covers a whole section at once.
        const latestSubjectStatusResult = await pool.query(
            `
            WITH ranked AS (
                SELECT
                    cr.section_id,
                    cr.subject_id,
                    cr.status,
                    ROW_NUMBER() OVER (
                        PARTITION BY cr.section_id, cr.subject_id
                        ORDER BY cr.upload_date DESC, cr.class_record_id DESC
                    ) AS rn
                FROM class_records cr
                WHERE cr.school_year_id = $1 AND cr.section_id IS NOT NULL
            )
            SELECT section_id, subject_id, status
            FROM ranked
            WHERE rn = 1
            `,
            [schoolYearId]
        );

        const subjectRowsBySection = new Map();

        latestSubjectStatusResult.rows.forEach((row) => {
            if (!subjectRowsBySection.has(row.section_id)) {
                subjectRowsBySection.set(row.section_id, []);
            }

            subjectRowsBySection.get(row.section_id).push(row);
        });

        const studentCountsResult = await pool.query(
            `
            SELECT section_id, COUNT(DISTINCT lrn) AS student_count
            FROM students
            WHERE section_id IS NOT NULL
            GROUP BY section_id
            `
        );

        const studentCountBySection = new Map(
            studentCountsResult.rows.map((row) => [row.section_id, Number(row.student_count)])
        );

        const emptySubmissionCounts = () => ({
            "Not Submitted": 0,
            "Pending Approval": 0,
            "Approved": 0,
            "Rejected": 0,
            // A subject revision request reopened a previously Approved
            // record — see consolidationController.requestRevision.
            "Amendment Requested": 0,
        });

        const submissionCountsResult = await pool.query(
            `
            SELECT
                s.section_id,
                COALESCE(rs.status, 'Not Submitted') AS submission_status,
                COUNT(*) AS student_count
            FROM students s
            LEFT JOIN record_submissions rs
                ON rs.lrn = s.lrn AND rs.school_year_id = $1
            WHERE s.section_id IS NOT NULL
            GROUP BY s.section_id, COALESCE(rs.status, 'Not Submitted')
            `,
            [schoolYearId]
        );

        const submissionCountsBySection = new Map();

        submissionCountsResult.rows.forEach((row) => {
            if (!submissionCountsBySection.has(row.section_id)) {
                submissionCountsBySection.set(row.section_id, emptySubmissionCounts());
            }

            submissionCountsBySection.get(row.section_id)[row.submission_status] = Number(row.student_count);
        });

        const sections = sectionsResult.rows.map((section) => {
            const subjectsExpected = expectedByGradeLevel.get(section.grade_level) ?? 0;
            const subjectRows = subjectRowsBySection.get(section.section_id) || [];

            return {
                section_id: section.section_id,
                section_name: section.section_name,
                grade_level: section.grade_level,
                staffing_mode: section.staffing_mode,
                subjects_expected: subjectsExpected,
                subjects_submitted: subjectRows.filter((row) => row.status === "Validated").length,
                subjects_needs_revision: subjectRows.filter((row) => row.status === "Needs Revision").length,
                subjects_needs_attention: subjectRows.filter((row) => row.status === "Needs Attention").length,
                subjects_not_started: Math.max(subjectsExpected - subjectRows.length, 0),
                student_count: studentCountBySection.get(section.section_id) || 0,
                submission_status_counts:
                    submissionCountsBySection.get(section.section_id) || emptySubmissionCounts(),
            };
        });

        return res.json({
            school_year: schoolYearResult.rows[0],
            sections,
        });
    } catch (error) {
        console.error("Get section progress error:", error);

        return res.status(500).json({
            message: "Failed to retrieve section progress.",
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

// ==========================================
// REQUEST REVISION ON ONE CLASS RECORD
// (Class Adviser only)
// ==========================================
// SPMP v1.0 US-006: lets the Adviser send one specific subject upload back
// to the Subject Teacher who owns it, independent of the Admin
// approve/reject pipeline in submissionController — a revision request can
// happen before that student's record is ever submitted to the Admin at
// all. Acts on the whole class_record (one uploaded file covers every
// student in that subject/section/school-year), not a single student's row
// — the Subject Teacher corrects and re-uploads the file, which creates a
// new class_records row that naturally outranks this one in the
// "latest upload wins" ranking the consolidated view already uses, so no
// separate "clear the flag" action is needed.
//
// If any of this class_record's students already had their whole record
// Approved via record_submissions, that approval is stale the moment a
// subject inside it is flagged — reopenApprovedSubmissions below reconciles
// that (record_submissions -> 'Amendment Requested') rather than leaving an
// "Approved" record silently sitting on top of a subject flagged "Needs
// Revision". submitForApproval refuses to resubmit while any subject is
// still flagged, so this can't be re-approved again until the flag clears.

const requestRevision = async (req, res) => {
    try {
        const classRecordId = Number(req.params.classRecordId);
        const { remarks } = req.body || {};

        if (!Number.isInteger(classRecordId) || classRecordId <= 0) {
            return res.status(400).json({
                message: "A valid class record ID is required.",
            });
        }

        if (!remarks || !remarks.trim()) {
            return res.status(400).json({
                message: "A reason is required so the teacher knows what to correct.",
            });
        }

        const recordResult = await pool.query(
            `
            SELECT
                cr.class_record_id,
                cr.school_year_id,
                t.user_id AS teacher_user_id,
                sub.subject_name,
                sec.section_name,
                sy.school_year
            FROM class_records cr
            INNER JOIN teachers t ON t.teacher_id = cr.teacher_id
            INNER JOIN subjects sub ON sub.subject_id = cr.subject_id
            LEFT JOIN sections sec ON sec.section_id = cr.section_id
            INNER JOIN school_years sy ON sy.school_year_id = cr.school_year_id
            WHERE cr.class_record_id = $1
            `,
            [classRecordId]
        );

        if (recordResult.rows.length === 0) {
            return res.status(404).json({
                message: "Class record not found.",
            });
        }

        const record = recordResult.rows[0];
        const trimmedRemarks = remarks.trim();

        await pool.query(
            `
            UPDATE class_records
            SET status = 'Needs Revision',
                revision_remarks = $1,
                revision_requested_by = $2,
                revision_requested_at = NOW()
            WHERE class_record_id = $3
            `,
            [trimmedRemarks, req.user.user_id, classRecordId]
        );

        const sectionLabel = record.section_name ? ` — ${record.section_name}` : "";

        await pool.query(
            `
            INSERT INTO notifications (user_id, title, message, status)
            VALUES ($1, $2, $3, 'Unread')
            `,
            [
                record.teacher_user_id,
                "Revision Requested",
                `Your ${record.subject_name}${sectionLabel} upload (${record.school_year}) needs revision. ` +
                    `Reason: ${trimmedRemarks} Please correct the file and re-upload.`,
            ]
        );

        // Reopen any already-Approved record_submissions rows this class
        // record's students are part of — one upload covers every student in
        // the subject/section, and some of them may have had their whole
        // record approved before this particular subject was flagged.
        const amendedResult = await pool.query(
            `
            UPDATE record_submissions rs
            SET status = 'Amendment Requested', updated_at = NOW()
            FROM students s, grade_records gr
            WHERE rs.lrn = s.lrn
              AND gr.lrn = s.lrn
              AND gr.class_record_id = $1
              AND rs.school_year_id = $2
              AND rs.status = 'Approved'
            RETURNING rs.lrn, rs.approved_by, s.first_name, s.last_name
            `,
            [classRecordId, record.school_year_id]
        );

        for (const amended of amendedResult.rows) {
            if (!amended.approved_by) continue;

            await pool.query(
                `
                INSERT INTO notifications (user_id, title, message, status)
                VALUES ($1, $2, $3, 'Unread')
                `,
                [
                    amended.approved_by,
                    "Approved Record Needs Amendment",
                    `${amended.last_name}, ${amended.first_name}'s consolidated record was previously ` +
                        `approved, but a ${record.subject_name}${sectionLabel} revision request has reopened ` +
                        "it for amendment.",
                ]
            );
        }

        const amendedNote =
            amendedResult.rows.length > 0
                ? ` ${amendedResult.rows.length} previously approved record(s) reopened for amendment.`
                : "";

        return res.json({
            message: `Revision requested. The teacher has been notified.${amendedNote}`,
            amended_count: amendedResult.rows.length,
        });
    } catch (error) {
        console.error("Request revision error:", error);

        return res.status(500).json({
            message: "Failed to request revision.",
        });
    }
};

module.exports = {
    getSchoolYears,
    getConsolidatedRecordsForSchoolYear,
    getConsolidatedRecordForStudent,
    getSectionProgressForSchoolYear,
    fetchConsolidatedStudents,
    fetchConsolidatedStudent,
    requestRevision,
    // Exported for analyticsController — same "latest class_record wins"
    // grade data, aggregated a different way (by grade band/section/subject
    // instead of grouped per student).
    buildRankedGradesQuery,
};
