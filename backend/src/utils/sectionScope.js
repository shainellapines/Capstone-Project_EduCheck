const pool = require("../db");

// Per SPMP v1.0 §6.2: a Class Adviser has "full visibility, own section
// only"; Administrators and Principals see the whole school. Ownership is
// the teacher_assignments row with subject_id IS NULL ("Adviser for this
// section") for the given school year. Returns the set of section_ids this
// user (by user_id, not teacher_id) advises - an Adviser with no
// assignment yet gets an empty set, not an error.
const getAdviserSectionIds = async ({ userId, schoolYearId }) => {
    const result = await pool.query(
        `
        SELECT ta.section_id
        FROM teacher_assignments ta
        INNER JOIN teachers t ON t.teacher_id = ta.teacher_id
        WHERE t.user_id = $1
          AND ta.school_year_id = $2
          AND ta.subject_id IS NULL
        `,
        [userId, schoolYearId]
    );

    return new Set(result.rows.map((row) => row.section_id));
};

// null  => unrestricted (admin / principal)
// Set   => the only section_ids this user may read (adviser)
const getVisibleSectionIds = async (req, schoolYearId) => {
    if (req.user.role !== "adviser") return null;

    return getAdviserSectionIds({ userId: req.user.user_id, schoolYearId });
};

const isSectionVisible = (visibleSectionIds, sectionId) =>
    visibleSectionIds === null || (sectionId != null && visibleSectionIds.has(sectionId));

module.exports = { getAdviserSectionIds, getVisibleSectionIds, isSectionVisible };
