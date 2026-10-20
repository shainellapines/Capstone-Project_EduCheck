// What still points at a section or an account. The database refuses to
// delete a row that other records reference, so these counts let the
// Administrator see why before trying, and let the API explain a refusal
// instead of answering with a generic failure.

const SECTION_BLOCKER_COUNTS = `
    (SELECT COUNT(*)::int FROM class_records c WHERE c.section_id = s.section_id) AS class_record_count,
    (SELECT COUNT(*)::int FROM (
        SELECT lrn FROM students st WHERE st.section_id = s.section_id
        UNION
        SELECT lrn FROM section_enrollments e WHERE e.section_id = s.section_id
    ) learners) AS learner_count
`;

// Expects the accounts query to alias users as u and teachers as t.
const ACCOUNT_BLOCKER_COUNT = `
    (
        (SELECT COUNT(*) FROM audit_logs a WHERE a.actor_user_id = u.user_id)
      + (SELECT COUNT(*) FROM class_records c WHERE c.revision_requested_by = u.user_id OR c.teacher_id = t.teacher_id)
      + (SELECT COUNT(*) FROM historical_academic_records h WHERE h.entered_by = u.user_id)
      + (SELECT COUNT(*) FROM record_submissions r WHERE r.reviewed_by = u.user_id OR r.approved_by = u.user_id)
      + (SELECT COUNT(*) FROM submissions sb WHERE sb.teacher_id = t.teacher_id)
    )::int AS linked_record_count
`;

const plural = (count, noun) => `${count} ${noun}${count === 1 ? "" : "s"}`;

// Null when nothing blocks the delete.
const sectionBlockerMessage = ({ class_record_count, learner_count }) => {
    const parts = [];
    if (class_record_count > 0) parts.push(plural(class_record_count, "class record"));
    if (learner_count > 0) parts.push(plural(learner_count, "learner"));
    if (parts.length === 0) return null;

    return `This section can't be deleted because it already has ${parts.join(" and ")}. ` +
        "Sections are kept so their grades and permanent records stay intact.";
};

const accountBlockerMessage = ({ linked_record_count }) => {
    if (!(linked_record_count > 0)) return null;

    return "This account can't be deleted because it already has records in EduCheck " +
        "(uploads, reviews, or activity in the audit log). " +
        "Edit the account and set its status to Inactive to stop it from signing in.";
};

// Postgres foreign_key_violation: something we did not count still points
// at the row.
const isForeignKeyViolation = (error) => error && error.code === "23503";

module.exports = {
    SECTION_BLOCKER_COUNTS,
    ACCOUNT_BLOCKER_COUNT,
    sectionBlockerMessage,
    accountBlockerMessage,
    isForeignKeyViolation,
};
