const pool = require("../db");
const { fetchConsolidatedStudents, fetchConsolidatedStudent } = require("./consolidationController");

const isValidSchoolYearId = (value) => Number.isInteger(value) && value > 0;
const isValidLrn = (value) => typeof value === "string" && /^\d{12}$/.test(value);

// ==========================================
// SUBMIT ONE STUDENT'S RECORD FOR APPROVAL
// (Class Adviser)
// ==========================================
// Only allowed once every expected subject has a recorded grade — an
// incomplete record has nothing meaningful to review yet. Re-submitting a
// previously Rejected record is allowed (it re-enters "Pending Approval");
// re-submitting an Approved one is not — that record is final until a
// separate un-approve/amend workflow exists.

const submitForApproval = async (req, res) => {
    try {
        const schoolYearId = Number(req.params.schoolYearId);
        const { lrn } = req.params;

        if (!isValidSchoolYearId(schoolYearId)) {
            return res.status(400).json({ message: "A valid school year ID is required." });
        }

        if (!isValidLrn(lrn)) {
            return res.status(400).json({ message: "A valid 12-digit LRN is required." });
        }

        const student = await fetchConsolidatedStudent(schoolYearId, lrn);

        if (!student) {
            return res.status(404).json({
                message: "No consolidated record found for this LRN in this school year.",
            });
        }

        if (!student.all_subjects_submitted) {
            return res.status(409).json({
                message: "This student's record is incomplete — every expected subject must have a recorded grade before it can be submitted for approval.",
                subjects_expected: student.subjects_expected,
                subjects_recorded: student.subjects_recorded,
            });
        }

        if (student.submission.status === "Approved") {
            return res.status(409).json({
                message: "This record has already been approved and cannot be resubmitted.",
            });
        }

        const result = await pool.query(
            `
            INSERT INTO record_submissions
                (lrn, school_year_id, status, reviewed_by, reviewed_at, updated_at)
            VALUES
                ($1, $2, 'Pending Approval', $3, NOW(), NOW())
            ON CONFLICT (lrn, school_year_id) DO UPDATE SET
                status = 'Pending Approval',
                reviewed_by = EXCLUDED.reviewed_by,
                reviewed_at = NOW(),
                approved_by = NULL,
                approved_at = NULL,
                remarks = NULL,
                updated_at = NOW()
            RETURNING *
            `,
            [lrn, schoolYearId, req.user.user_id]
        );

        return res.json({
            message: "Submitted for approval.",
            submission: result.rows[0],
        });
    } catch (error) {
        console.error("Submit for approval error:", error);

        return res.status(500).json({ message: "Failed to submit this record for approval." });
    }
};

// ==========================================
// SUBMIT EVERY ELIGIBLE STUDENT AT ONCE
// (Class Adviser)
// ==========================================
// "Eligible" = complete (all_subjects_submitted) and not already Approved.
// Skips everyone else rather than erroring, and reports counts so the
// adviser can see what happened.

const submitAllEligible = async (req, res) => {
    try {
        const schoolYearId = Number(req.params.schoolYearId);

        if (!isValidSchoolYearId(schoolYearId)) {
            return res.status(400).json({ message: "A valid school year ID is required." });
        }

        const students = await fetchConsolidatedStudents(schoolYearId);
        const eligible = students.filter(
            (student) => student.all_subjects_submitted && student.submission.status !== "Approved"
        );

        let submittedCount = 0;

        for (const student of eligible) {
            await pool.query(
                `
                INSERT INTO record_submissions
                    (lrn, school_year_id, status, reviewed_by, reviewed_at, updated_at)
                VALUES
                    ($1, $2, 'Pending Approval', $3, NOW(), NOW())
                ON CONFLICT (lrn, school_year_id) DO UPDATE SET
                    status = 'Pending Approval',
                    reviewed_by = EXCLUDED.reviewed_by,
                    reviewed_at = NOW(),
                    approved_by = NULL,
                    approved_at = NULL,
                    remarks = NULL,
                    updated_at = NOW()
                `,
                [student.lrn, schoolYearId, req.user.user_id]
            );

            submittedCount += 1;
        }

        return res.json({
            message: `Submitted ${submittedCount} record(s) for approval.`,
            submitted_count: submittedCount,
            already_approved_count: students.filter((s) => s.submission.status === "Approved").length,
            incomplete_count: students.filter((s) => !s.all_subjects_submitted).length,
        });
    } catch (error) {
        console.error("Submit all eligible error:", error);

        return res.status(500).json({ message: "Failed to submit records for approval." });
    }
};

// ==========================================
// APPROVE / REJECT A PENDING SUBMISSION
// (School Administrator)
// ==========================================
// Both only act on a record currently "Pending Approval" — there is
// nothing to decide on a record nobody has submitted yet, and a decision
// already made (Approved/Rejected) is not silently overwritten here.

const decideSubmission = (targetStatus) => async (req, res) => {
    try {
        const schoolYearId = Number(req.params.schoolYearId);
        const { lrn } = req.params;
        const { remarks } = req.body || {};

        if (!isValidSchoolYearId(schoolYearId)) {
            return res.status(400).json({ message: "A valid school year ID is required." });
        }

        if (!isValidLrn(lrn)) {
            return res.status(400).json({ message: "A valid 12-digit LRN is required." });
        }

        const existing = await pool.query(
            `
            SELECT rs.status, rs.reviewed_by, s.first_name, s.last_name
            FROM record_submissions rs
            INNER JOIN students s ON s.lrn = rs.lrn
            WHERE rs.lrn = $1 AND rs.school_year_id = $2
            `,
            [lrn, schoolYearId]
        );

        if (existing.rows.length === 0 || existing.rows[0].status !== "Pending Approval") {
            return res.status(409).json({
                message: "This record is not currently pending approval.",
            });
        }

        const { reviewed_by: reviewedBy, first_name: firstName, last_name: lastName } = existing.rows[0];
        const studentName = `${lastName}, ${firstName}`;

        const result = await pool.query(
            `
            UPDATE record_submissions
            SET status = $1, approved_by = $2, approved_at = NOW(), remarks = $3, updated_at = NOW()
            WHERE lrn = $4 AND school_year_id = $5
            RETURNING *
            `,
            [targetStatus, req.user.user_id, remarks || null, lrn, schoolYearId]
        );

        if (reviewedBy) {
            const message =
                targetStatus === "Approved"
                    ? `${studentName}'s consolidated record was approved.`
                    : `${studentName}'s consolidated record was rejected.${remarks ? ` Reason: ${remarks}` : ""}`;

            await pool.query(
                `
                INSERT INTO notifications (user_id, title, message, status)
                VALUES ($1, $2, $3, 'Unread')
                `,
                [reviewedBy, `Submission ${targetStatus}`, message]
            );
        }

        // Notify each subject teacher whose uploaded grades fed into this
        // consolidated record too — previously only the adviser who
        // submitted it found out the outcome, and the teacher who actually
        // uploaded the underlying subject grades had no visibility into
        // what happened to it downstream. One notification per teacher
        // (not per subject) in case the same teacher owns more than one
        // subject for this student, naming every subject of theirs involved.
        const student = await fetchConsolidatedStudent(schoolYearId, lrn);

        if (student) {
            const subjectNamesByTeacher = new Map();

            student.subjects.forEach((subject) => {
                if (!subject.teacher_user_id) return;

                if (!subjectNamesByTeacher.has(subject.teacher_user_id)) {
                    subjectNamesByTeacher.set(subject.teacher_user_id, []);
                }

                subjectNamesByTeacher.get(subject.teacher_user_id).push(subject.subject_name);
            });

            for (const [teacherUserId, subjectNames] of subjectNamesByTeacher) {
                const subjectList = subjectNames.join(", ");
                const teacherMessage =
                    targetStatus === "Approved"
                        ? `${studentName}'s consolidated record — including your ${subjectList} grade(s) — was approved.`
                        : `${studentName}'s consolidated record — including your ${subjectList} grade(s) — was rejected.${remarks ? ` Reason: ${remarks}` : ""}`;

                await pool.query(
                    `
                    INSERT INTO notifications (user_id, title, message, status)
                    VALUES ($1, $2, $3, 'Unread')
                    `,
                    [teacherUserId, `Submission ${targetStatus}`, teacherMessage]
                );
            }
        }

        return res.json({
            message: `Record ${targetStatus.toLowerCase()}.`,
            submission: result.rows[0],
        });
    } catch (error) {
        console.error(`${targetStatus} submission error:`, error);

        return res.status(500).json({ message: `Failed to ${targetStatus.toLowerCase()} this record.` });
    }
};

const approveSubmission = decideSubmission("Approved");
const rejectSubmission = decideSubmission("Rejected");

module.exports = {
    submitForApproval,
    submitAllEligible,
    approveSubmission,
    rejectSubmission,
};
