const pool = require("../../db");
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

// Names a teacher may write in the header's subject cell (INPUT!Y7) for each
// learning area. Pairs that never share a grade level are one group (ESP is
// Grade 6's name for GMRC; TLE is Grade 6's EPP), so a header written for the
// other name of the same area still matches. MAPEH accepts its components.
const SUBJECT_ALIASES = {
    filipino: ["filipino", "fil"],
    english: ["english", "eng"],
    mathematics: ["mathematics", "math", "maths"],
    science: ["science", "sci"],
    "araling panlipunan": ["araling panlipunan", "ap", "social studies"],
    mapeh: ["mapeh", "music", "arts", "pe", "physical education", "health"],
    gmrc: ["gmrc", "good manners and right conduct", "esp", "edukasyon sa pagpapakatao", "values education", "values ed"],
    tle: ["tle", "technology and livelihood education", "epp", "edukasyong pantahanan at pangkabuhayan"],
    "reading and literacy": ["reading and literacy", "reading", "literacy"],
    language: ["language"],
    makabansa: ["makabansa"],
};

const words = (value) => ` ${norm(value).replace(/[^a-z0-9]+/g, " ").trim()} `;

// Learning areas named in a piece of text, matched on whole words, so
// "MATHEMATICS 6" and "Math - Grade 6" both name mathematics, and "pe"
// does not match inside "mapeh".
const subjectGroupsIn = (value) => {
    const text = words(value);
    return new Set(
        Object.keys(SUBJECT_ALIASES).filter((group) =>
            SUBJECT_ALIASES[group].some((alias) => text.includes(` ${alias} `))
        )
    );
};

// Refuse a file whose header names a different learning area from the one
// selected (an English record uploaded as Mathematics would save English
// grades as Mathematics). A blank header, or one naming no known subject,
// is left to compareHeader's warning so an unusual label never blocks a
// teacher.
const checkHeaderSubject = ({ header, subject }) => {
    if (!header?.subject) return null;

    const named = subjectGroupsIn(header.subject);
    if (named.size === 0) return null;

    const selected = subjectGroupsIn(subject.subject_name);
    if ([...selected].some((group) => named.has(group))) return null;

    return {
        status: 409,
        code: "HEADER_SUBJECT_MISMATCH",
        message:
            `This file is the e-Class Record for "${header.subject}", but you selected ${subject.subject_name}. ` +
            `Upload the ${subject.subject_name} e-Class Record, or correct the subject in the file's header (cell Y7 of the INPUT sheet).`,
    };
};

const headerSubjectMatches = (headerSubject, subjectName) => {
    const named = subjectGroupsIn(headerSubject);
    if ([...subjectGroupsIn(subjectName)].some((group) => named.has(group))) return true;

    return norm(headerSubject).includes(norm(subjectName)) || norm(subjectName).includes(norm(headerSubject));
};

// Warn (never block) when the workbook's own header disagrees with the
// form selection on section or school year. Sample files are reused across
// sections, so those mismatches alone cannot be authoritative; the roster
// check is what refuses another section's learners. A subject the header
// clearly names differently is refused by checkHeaderSubject first, so the
// subject warning here only covers labels that name no known subject.
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

    if (header.subject && !headerSubjectMatches(header.subject, subject.subject_name)) {
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

// Re-uploading changes grades. A learner whose consolidated record is
// Approved, or Pending Approval, is locked: approval freezes a snapshot,
// and the Administrator must approve exactly what the Adviser submitted.
// A revision request reopens them ('Amendment Requested'). An upload is
// not refused for them (an e-Class Record covers the whole class); their
// rows are simply not saved, and the rest of the class is. Only a file in
// which every learner is locked is refused, since it would change nothing.
// The section's Class Adviser, the one who can reopen locked learners.
const findSectionAdviser = async ({ sectionId, schoolYearId }) => {
    if (!sectionId) return null;

    const result = await pool.query(
        `
        SELECT t.user_id, t.first_name, t.last_name
        FROM teacher_assignments ta
        INNER JOIN teachers t ON t.teacher_id = ta.teacher_id
        WHERE ta.section_id = $1 AND ta.school_year_id = $2 AND ta.subject_id IS NULL
        `,
        [sectionId, schoolYearId]
    );

    const row = result.rows[0];
    return row ? { userId: row.user_id, name: `${row.first_name} ${row.last_name}` } : null;
};

// Says who reopens locked learners and where, so a teacher whose upload
// was blocked knows the next step without asking around.
const reopenInstruction = ({ adviser, uploaderUserId, subjectName }) => {
    const steps =
        `open Consolidated Records, expand one of the locked learners and click Request Revision on ` +
        `${subjectName || "this subject"}. Then upload the corrected file again.`;

    if (adviser && adviser.userId === uploaderUserId) {
        return `You are this section's Class Adviser: ${steps}`;
    }

    if (adviser) {
        return `To correct them, ask ${adviser.name} (Class Adviser) to ${steps} ${adviser.name} has been notified.`;
    }

    return `To correct them, ask the Class Adviser to ${steps}`;
};

const findLockedLearners = async ({ parsedRecord, schoolYearId, sectionId, subjectName, uploaderUserId }) => {
    const lrns = uniqueValidLrns(parsedRecord);
    const none = { error: null, lockedLrns: new Set(), warning: null, notifyAdviser: null };

    if (lrns.length === 0) return none;

    const result = await pool.query(
        `
        SELECT lrn, status FROM record_submissions
        WHERE school_year_id = $1 AND status IN ('Approved', 'Pending Approval') AND lrn = ANY($2)
        `,
        [schoolYearId, lrns]
    );

    if (result.rows.length === 0) return none;

    const approved = result.rows.filter((row) => row.status === "Approved").map((row) => row.lrn);
    const pending = result.rows.filter((row) => row.status === "Pending Approval").map((row) => row.lrn);
    const counts = [
        approved.length > 0 ? `${approved.length} Approved` : null,
        pending.length > 0 ? `${pending.length} waiting for approval` : null,
    ]
        .filter(Boolean)
        .join(" and ");
    const adviser = await findSectionAdviser({ sectionId, schoolYearId });
    const reopen = reopenInstruction({ adviser, uploaderUserId, subjectName });

    // The Adviser hears about it directly, unless they made the upload.
    const notifyAdviser =
        adviser && adviser.userId !== uploaderUserId
            ? {
                  userId: adviser.userId,
                  message:
                      `A ${subjectName || "subject"} upload could not update ${result.rows.length} learner(s) ` +
                      `because their records are locked (${counts}). If the teacher needs to correct grades, ` +
                      `request a revision for ${subjectName || "that subject"} in Consolidated Records.`,
              }
            : null;

    if (result.rows.length === lrns.length) {
        return {
            ...none,
            notifyAdviser,
            error: {
                status: 409,
                message: `Every learner in this file is locked (${counts}), so the upload would change nothing. ${reopen}`,
                approved_lrns: approved.slice(0, 20),
                pending_lrns: pending.slice(0, 20),
            },
        };
    }

    return {
        error: null,
        lockedLrns: new Set(result.rows.map((row) => row.lrn)),
        notifyAdviser,
        warning: {
            code: "LOCKED_LEARNERS_SKIPPED",
            message:
                `${result.rows.length} learner(s) were not updated because their records are locked (${counts}); ` +
                `the rest of the class was saved. ${reopen}`,
            approved_lrns: approved.slice(0, 20),
            pending_lrns: pending.slice(0, 20),
        },
    };
};

module.exports = { compareHeader, checkHeaderSubject, checkGradeLevel, checkRoster, findLockedLearners };
