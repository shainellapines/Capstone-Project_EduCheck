const pool = require("../db");
const { buildRankedGradesQuery } = require("./consolidationController");

// ==========================================
// ACADEMIC / PERFORMANCE ANALYTICS
// ==========================================
// The "Academic Analytics" (Admin) and "Performance Analytics" (Adviser)
// nav items were both dead placeholders (path: null) until now — this is
// one shared endpoint behind both labels, same pattern as Consolidated
// Records/Section Progress already being one page for every role that can
// see it (Principal included, per SPMP's "progress/analytics/repository"
// framing for that role).
//
// grade_records.remarks exists in the schema but classRecordParser never
// populates it — every row has remarks = NULL, confirmed against the live
// dev DB. So "Passed"/"Failed" here is derived from final_grade against
// DepEd's 75 passing mark, not read off remarks.
const PASSING_GRADE = 75;

// DepEd's descriptor bands for a quarterly/final numeric grade
// (DepEd Order No. 8, s. 2015, Table 2). Ordered highest-first for display.
const GRADE_BANDS = [
    { band: "90-100", label: "Outstanding", min: 90, max: 100 },
    { band: "85-89", label: "Very Satisfactory", min: 85, max: 89.99 },
    { band: "80-84", label: "Satisfactory", min: 80, max: 84.99 },
    { band: "75-79", label: "Fairly Satisfactory", min: 75, max: 79.99 },
    { band: "Below 75", label: "Did Not Meet Expectations", min: -Infinity, max: 74.99 },
];

// Shared roll-up used for the school-wide overview and for each
// section/subject group below it — same shape every time so the frontend
// renders all three with one component.
const summarizeGrades = (finalGrades) => {
    const gradedEntries = finalGrades.length;

    if (gradedEntries === 0) {
        return {
            graded_entries: 0,
            average_final_grade: null,
            pass_rate: null,
            at_risk_count: 0,
        };
    }

    const sum = finalGrades.reduce((total, grade) => total + grade, 0);
    const atRiskCount = finalGrades.filter((grade) => grade < PASSING_GRADE).length;

    return {
        graded_entries: gradedEntries,
        average_final_grade: Math.round((sum / gradedEntries) * 100) / 100,
        pass_rate: Math.round(((gradedEntries - atRiskCount) / gradedEntries) * 1000) / 10,
        at_risk_count: atRiskCount,
    };
};

// ==========================================
// GET ACADEMIC ANALYTICS FOR A SCHOOL YEAR
// ==========================================
// Adviser/Admin/Principal — same read-only audience as /api/consolidation.
// Reuses consolidationController's "latest class_record per (student,
// subject) wins" ranked rows (a corrected re-upload already outranks a
// flagged/superseded one there) and aggregates that same data three ways:
// school-wide, per section, and per subject.

const getAnalyticsForSchoolYear = async (req, res) => {
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

        const rows = (await pool.query(buildRankedGradesQuery(""), [schoolYearId])).rows;

        // final_grade is NUMERIC over the wire — comes back as a string.
        // Every row here already has one (grade_records.final_grade is
        // populated by the parser for every persisted upload), but a null
        // is filtered out defensively rather than assumed away.
        const gradedRows = rows
            .filter((row) => row.final_grade !== null)
            .map((row) => ({ ...row, final_grade: Number(row.final_grade) }));

        const overview = summarizeGrades(gradedRows.map((row) => row.final_grade));

        const gradeDistribution = GRADE_BANDS.map((bandDef) => ({
            band: bandDef.band,
            label: bandDef.label,
            count: gradedRows.filter((row) => row.final_grade >= bandDef.min && row.final_grade <= bandDef.max)
                .length,
        }));

        // ---- Per section ----
        // Students with no section_id yet (not assigned through Section &
        // Teacher Assignments) are left out here, same as Section Progress
        // leaves them out of student_count — nothing to attribute them to.
        const sectionsLookup = await pool.query(
            "SELECT section_id, section_name, grade_level FROM sections ORDER BY grade_level, section_name"
        );

        const gradesBySection = new Map();

        gradedRows.forEach((row) => {
            if (row.section_id === null) return;

            if (!gradesBySection.has(row.section_id)) {
                gradesBySection.set(row.section_id, []);
            }

            gradesBySection.get(row.section_id).push(row.final_grade);
        });

        const sectionPerformance = sectionsLookup.rows
            .map((section) => ({
                section_id: section.section_id,
                section_name: section.section_name,
                grade_level: section.grade_level,
                ...summarizeGrades(gradesBySection.get(section.section_id) || []),
            }))
            .filter((section) => section.graded_entries > 0);

        // ---- Per subject ----
        // subject_name repeats across grade levels (e.g. "Mathematics" for
        // both Grade 1 and Grade 3), so subject_id is the real grouping key
        // — grade_level rides along per group for display only.
        const subjectGroups = new Map();

        gradedRows.forEach((row) => {
            if (!subjectGroups.has(row.subject_id)) {
                subjectGroups.set(row.subject_id, {
                    subject_id: row.subject_id,
                    subject_name: row.subject_name,
                    grade_level: row.grade_level,
                    grades: [],
                });
            }

            subjectGroups.get(row.subject_id).grades.push(row.final_grade);
        });

        const subjectPerformance = Array.from(subjectGroups.values())
            .map((group) => ({
                subject_id: group.subject_id,
                subject_name: group.subject_name,
                grade_level: group.grade_level,
                ...summarizeGrades(group.grades),
            }))
            .sort((a, b) => {
                if (a.grade_level !== b.grade_level) {
                    return Number(a.grade_level) - Number(b.grade_level);
                }

                return a.subject_name.localeCompare(b.subject_name);
            });

        return res.json({
            school_year: schoolYearResult.rows[0],
            passing_grade: PASSING_GRADE,
            overview,
            grade_distribution: gradeDistribution,
            section_performance: sectionPerformance,
            subject_performance: subjectPerformance,
        });
    } catch (error) {
        console.error("Get analytics error:", error);

        return res.status(500).json({
            message: "Failed to retrieve analytics.",
        });
    }
};

module.exports = {
    getAnalyticsForSchoolYear,
};
