const pool = require("../db");
const { isValidLrn } = require("./classRecordParser");

// ==========================================
// UPLOAD INTEGRITY CHECKS
// ==========================================
// The e-Class Record only contributes learners, LRNs and scores - section,
// subject and school year come from the teacher's form selection. Without
// these checks a file for one class can be uploaded into another and
// silently move learners between sections. Hard failures return an
// { status, message } the controller sends as-is; soft findings come back
// as warnings that ride along in the upload response.

const norm = (value) => String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");

// Warn (never block) when the workbook's own header disagrees with the
// form selection. Sample files are reused across sections, so a header
// mismatch alone cannot be authoritative.
const compareHeader = ({ header, section, subject, schoolYear }) => {
    const warnings = [];
    if (!header) return warnings;

    if (header.grade_section) {
        const headerValue = norm(header.grade_section);

        if (!headerValue.includes(norm(section.section_name)) || !headerValue.includes(norm(section.grade_level))) {
            warnings.push({
                code: "HEADER_SECTION_MISMATCH",
                message: `The file's header says "${header.grade_section}" but you selected Grade ${section.grade_level} - ${section.section_name}.`,
            });
        }
    }

    if (
        header.subject &&
        !norm(header.subject).includes(norm(subject.subject_name)) &&
        !norm(subject.subject_name).includes(norm(header.subject))
    ) {
        warnings.push({
            code: "HEADER_SUBJECT_MISMATCH",
            message: `The file's header says subject "${header.subject}" but you selected ${subject.subject_name}.`,
        });
    }

    if (header.school_year && norm(header.school_year) !== norm(schoolYear.school_year)) {
        warnings.push({
            code: "HEADER_SCHOOL_YEAR_MISMATCH",
            message: `The file's header says school year "${header.school_year}" but you selected ${schoolYear.school_year}.`,
        });
    }

    return warnings;
};

// A subject's grade level must match the section's - a Grade 5 subject
// cannot be assigned to or uploaded for a Grade 4 section.
const checkGradeLevel = ({ subject, section }) => {
    if (String(subject.grade_level) !== String(section.grade_level)) {
        return {
            status: 409,
            message: `${subject.subject_name} is a Grade ${subject.grade_level} subject but ${section.section_name} is a Grade ${section.grade_level} section.`,
        };
    }

    return null;
};

const uniqueValidLrns = (parsedRecord) => [
    ...new Set(parsedRecord.learners.map((learner) => learner.lrn).filter(isValidLrn)),
];

// Roster check against section_enrollments for this school year.
//  - 409 if any learner is already enrolled in a DIFFERENT section
//  - 409 if the section already has a roster and the file shares no learner with it
//  - warning for learners not on the existing roster
//  - an empty section's first upload establishes the roster (no finding)
const checkRoster = async ({ parsedRecord, sectionId, schoolYearId }) => {
    const lrns = uniqueValidLrns(parsedRecord);
    const warnings = [];

    if (lrns.length === 0) return { error: null, warnings };

    const rosterResult = await pool.query(
        `SELECT lrn FROM section_enrollments WHERE section_id = $1 AND school_year_id = $2`,
        [sectionId, schoolYearId]
    );
    const roster = new Set(rosterResult.rows.map((row) => row.lrn));

    const elsewhere = await pool.query(
        `
        SELECT e.lrn, sec.section_name, sec.grade_level
        FROM section_enrollments e
        INNER JOIN sections sec ON sec.section_id = e.section_id
        WHERE e.school_year_id = $1 AND e.section_id <> $2 AND e.lrn = ANY($3)
        `,
        [schoolYearId, sectionId, lrns]
    );

    if (elsewhere.rows.length > 0) {
        const names = [...new Set(elsewhere.rows.map((row) => `Grade ${row.grade_level} - ${row.section_name}`))];

        return {
            error: {
                status: 409,
                message:
                    `${elsewhere.rows.length} learner(s) in this file are already enrolled in another section ` +
                    `this school year (${names.join(", ")}). This looks like the wrong section - upload cancelled.`,
                conflicting_lrns: elsewhere.rows.map((row) => row.lrn).slice(0, 20),
            },
            warnings,
        };
    }

    if (roster.size > 0) {
        const overlap = lrns.filter((lrn) => roster.has(lrn)).length;

        if (overlap === 0) {
            return {
                error: {
                    status: 409,
                    message:
                        "None of the learners in this file are on this section's class list. " +
                        "This looks like the wrong section or file - upload cancelled.",
                },
                warnings,
            };
        }

        const notOnRoster = lrns.length - overlap;

        if (notOnRoster > 0) {
            warnings.push({
                code: "LEARNERS_NOT_ON_ROSTER",
                message: `${notOnRoster} learner(s) in this file are not on this section's existing class list and will be added to it.`,
            });
        }
    }

    return { error: null, warnings };
};

// Re-uploading changes grades. Once a learner's consolidated record is
// Approved it is final until the Adviser reopens it (a revision request
// moves it to 'Amendment Requested'), so an upload that touches any
// Approved learner is refused.
const checkApprovedLearners = async ({ parsedRecord, schoolYearId }) => {
    const lrns = uniqueValidLrns(parsedRecord);

    if (lrns.length === 0) return null;

    const result = await pool.query(
        `
        SELECT lrn FROM record_submissions
        WHERE school_year_id = $1 AND status = 'Approved' AND lrn = ANY($2)
        `,
        [schoolYearId, lrns]
    );

    if (result.rows.length === 0) return null;

    return {
        status: 409,
        message:
            `${result.rows.length} learner(s) in this file already have an Approved record. ` +
            "Ask the Class Adviser to request a revision to reopen it before re-uploading.",
        approved_lrns: result.rows.map((row) => row.lrn).slice(0, 20),
    };
};

module.exports = { compareHeader, checkGradeLevel, checkRoster, checkApprovedLearners };
