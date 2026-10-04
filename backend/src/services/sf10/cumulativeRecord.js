const pool = require("../../db");
const { fetchConsolidatedStudent } = require("../../controllers/consolidationController");
const {
    SUBJECT_LABELS,
    COMPONENT_KEYS,
    subjectKeyForName,
    requiredSubjectKeysForGrade,
} = require("./subjects");

// ==========================================
// CUMULATIVE ACADEMIC RECORD (computed, never stored)
// ==========================================
// One canonical JSON shape for a learner's whole elementary record, built
// from two sources:
//   EDUCHECK   - years consolidated in EduCheck. Only APPROVED years count
//                as official, and they are read from the frozen approval
//                snapshot (record_submissions.snapshot), not live grades.
//                Years still in progress are listed but marked unofficial.
//   HISTORICAL - years entered by hand (earlier grades, transferees).
// No cell coordinates live here - template adapters map this shape onto a
// specific SF10 edition, so a future 3-term form only needs a new adapter.

const PASSING_RATING = 75;

const SCHOOL_SETTING_KEYS = ["school_name", "school_id", "district", "division", "region"];

const toNumber = (value) => (value === null || value === undefined || value === "" ? null : Number(value));

const average = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;

// DepEd Order No. 8, s. 2015: final ratings and the general average are
// reported as whole numbers.
const computeFinalRating = (ratings, gradingScheme) => {
    const expected = gradingScheme === "QUARTER_4" ? 4 : 3;
    const present = ratings.slice(0, expected).filter((rating) => rating !== null);
    return present.length === expected ? Math.round(average(present)) : null;
};

const computeGeneralAverage = (subjects) => {
    // Learning areas only: MAPEH components are already inside MAPEH.
    const areas = subjects.filter((subject) => !COMPONENT_KEYS.has(subject.subject_key));
    if (areas.length === 0 || areas.some((subject) => subject.final_rating === null)) return null;
    return Math.round(average(areas.map((subject) => subject.final_rating)));
};

const remarkFor = (finalRating) =>
    finalRating === null ? null : finalRating >= PASSING_RATING ? "Passed" : "Failed";

const normalizeSubject = ({ subject_key, ratings, final_rating, remarks }, gradingScheme) => {
    const finalRating = toNumber(final_rating) ?? computeFinalRating(ratings, gradingScheme);

    return {
        subject_key,
        label: SUBJECT_LABELS[subject_key] ?? subject_key,
        ratings,
        final_rating: finalRating,
        remarks: remarks || remarkFor(finalRating),
    };
};

const getSchoolSettings = async () => {
    const result = await pool.query("SELECT setting_key, setting_value FROM school_settings");
    const settings = Object.fromEntries(SCHOOL_SETTING_KEYS.map((key) => [key, null]));
    result.rows.forEach((row) => {
        if (SCHOOL_SETTING_KEYS.includes(row.setting_key)) settings[row.setting_key] = row.setting_value;
    });
    return settings;
};

const loadHistoricalYears = async (lrn) => {
    const records = (
        await pool.query(
            `SELECT * FROM historical_academic_records WHERE lrn = $1 ORDER BY school_year`,
            [lrn]
        )
    ).rows;

    if (records.length === 0) return [];

    const grades = (
        await pool.query(
            `SELECT * FROM historical_subject_grades WHERE historical_record_id = ANY($1) ORDER BY historical_grade_id`,
            [records.map((record) => record.historical_record_id)]
        )
    ).rows;

    return records.map((record) => {
        const subjects = grades
            .filter((grade) => grade.historical_record_id === record.historical_record_id)
            .map((grade) =>
                normalizeSubject(
                    {
                        subject_key: grade.subject_key,
                        ratings: [grade.rating_1, grade.rating_2, grade.rating_3, grade.rating_4].map(toNumber),
                        final_rating: grade.final_rating,
                        remarks: grade.remarks,
                    },
                    record.grading_scheme
                )
            );

        return {
            source: "HISTORICAL",
            historical_record_id: record.historical_record_id,
            official: true,
            school_year: record.school_year,
            grade_level: String(record.grade_level),
            grading_scheme: record.grading_scheme,
            record_status: record.record_status,
            school: {
                school_name: record.school_name,
                school_id: record.school_id,
                district: record.district,
                division: record.division,
                region: record.region,
            },
            section_name: record.section_name,
            adviser_name: record.adviser_name,
            subjects,
            general_average: toNumber(record.general_average) ?? computeGeneralAverage(subjects),
            remarks: record.remarks,
        };
    });
};

const loadEduCheckYears = async (lrn, schoolSettings) => {
    // Every school year this learner has an upload in, with its approval state.
    const years = (
        await pool.query(
            `
            SELECT DISTINCT
                cr.school_year_id,
                sy.school_year,
                rs.status AS submission_status,
                rs.snapshot,
                e.section_id AS enrolled_section_id
            FROM grade_records gr
            INNER JOIN class_records cr ON cr.class_record_id = gr.class_record_id
            INNER JOIN school_years sy ON sy.school_year_id = cr.school_year_id
            LEFT JOIN record_submissions rs ON rs.lrn = gr.lrn AND rs.school_year_id = cr.school_year_id
            LEFT JOIN section_enrollments e ON e.lrn = gr.lrn AND e.school_year_id = cr.school_year_id
            WHERE gr.lrn = $1
            ORDER BY sy.school_year
            `,
            [lrn]
        )
    ).rows;

    const sectionIds = [
        ...new Set(years.map((y) => y.snapshot?.section_id ?? y.enrolled_section_id).filter(Boolean)),
    ];
    const sections = new Map(
        (
            await pool.query("SELECT section_id, section_name, grade_level FROM sections WHERE section_id = ANY($1)", [
                sectionIds,
            ])
        ).rows.map((section) => [section.section_id, section])
    );

    const result = [];

    for (const year of years) {
        // Approved before migration 008 => no snapshot. Fall back to the
        // live consolidated grades, which the re-upload guard now protects.
        let approvedSubjects = null;
        if (year.submission_status === "Approved") {
            approvedSubjects =
                year.snapshot?.subjects ?? (await fetchConsolidatedStudent(year.school_year_id, lrn))?.subjects ?? null;
        }

        const approved = Boolean(approvedSubjects);
        const sectionId = year.snapshot?.section_id ?? year.enrolled_section_id;
        const section = sections.get(sectionId);

        const subjects = approved
            ? approvedSubjects
                  .map((subject) => ({ subject, key: subjectKeyForName(subject.subject_name) }))
                  .filter(({ key }) => key)
                  .map(({ subject, key }) =>
                      normalizeSubject(
                          {
                              subject_key: key,
                              ratings: [subject.term_1, subject.term_2, subject.term_3, null].map(toNumber),
                              final_rating: subject.final_grade,
                          },
                          "TERM_3"
                      )
                  )
            : [];

        result.push({
            source: "EDUCHECK",
            school_year_id: year.school_year_id,
            // Only an Admin-approved record is official SF10 material.
            official: approved,
            submission_status: year.submission_status ?? "Not Submitted",
            school_year: year.school_year,
            grade_level: String(year.snapshot?.grade_level ?? section?.grade_level ?? ""),
            // The current e-Class Record grades in 3 terms.
            grading_scheme: "TERM_3",
            record_status: approved ? "Complete" : "Partial",
            school: { ...schoolSettings },
            section_name: section?.section_name ?? null,
            adviser_name: year.snapshot?.adviser ?? null,
            subjects,
            general_average: approved ? computeGeneralAverage(subjects) : null,
            remarks: null,
        });
    }

    return result;
};

const buildCumulativeRecord = async (lrn) => {
    const learner = (
        await pool.query(
            `
            SELECT lrn, last_name, first_name, middle_name, name_extension, sex, birth_date
            FROM students WHERE lrn = $1
            `,
            [lrn]
        )
    ).rows[0];

    if (!learner) return null;

    const schoolSettings = await getSchoolSettings();
    const historical = await loadHistoricalYears(lrn);
    const educheck = await loadEduCheckYears(lrn, schoolSettings);

    // EduCheck's own approved data wins over a hand-entered row for the
    // same school year; the duplicate is surfaced by the readiness check.
    const educheckYears = new Set(educheck.filter((year) => year.official).map((year) => year.school_year));
    const years = [
        ...educheck,
        ...historical.map((year) => ({ ...year, superseded: educheckYears.has(year.school_year) })),
    ].sort((a, b) => a.school_year.localeCompare(b.school_year));

    return { learner, school_settings: schoolSettings, years };
};

// ==========================================
// READINESS / GAP REPORT
// ==========================================
// Decides which year fills each Grade 1-6 block and lists everything that
// stops the form from being complete. Never blocks generation outright - a
// partially filled SF10 is normal (schools complete some fields by hand) -
// but makes every gap explicit.

const evaluateReadiness = (record, supportedSchemes) => {
    const issues = [];
    const add = (level, code, message, gradeLevel = null) => issues.push({ level, code, message, grade_level: gradeLevel });

    const { learner } = record;
    if (!learner.birth_date) add("warning", "MISSING_BIRTHDATE", "The learner's birthdate is not recorded.");
    if (!learner.sex) add("warning", "MISSING_SEX", "The learner's sex is not recorded.");
    if (!learner.middle_name) add("info", "MISSING_MIDDLE_NAME", "No middle name recorded (leave blank if none).");

    record.years
        .filter((year) => year.superseded)
        .forEach((year) =>
            add(
                "warning",
                "DUPLICATE_SCHOOL_YEAR",
                `${year.school_year} has both an approved EduCheck record and a hand-entered record; the EduCheck record is used.`,
                year.grade_level
            )
        );

    const blocks = [];

    for (let grade = 1; grade <= 6; grade++) {
        const gradeLevel = String(grade);
        const candidates = record.years.filter(
            (year) => year.grade_level === gradeLevel && year.official && !year.superseded
        );
        const pending = record.years.find(
            (year) => year.grade_level === gradeLevel && year.source === "EDUCHECK" && !year.official
        );

        if (candidates.length === 0) {
            if (pending) {
                add(
                    "warning",
                    "NOT_YET_APPROVED",
                    `Grade ${grade} (${pending.school_year}) is in EduCheck but not yet approved (${pending.submission_status}).`,
                    gradeLevel
                );
            } else {
                add("warning", "MISSING_GRADE", `No record for Grade ${grade}.`, gradeLevel);
            }
            blocks.push({ grade_level: gradeLevel, status: "Missing", year: null });
            continue;
        }

        if (candidates.length > 1) {
            add(
                "warning",
                "REPEATED_GRADE",
                `Grade ${grade} appears in ${candidates.length} school years (retained learner). The latest is placed in the Grade ${grade} block; the earlier year must be written in the form's spare block by hand.`,
                gradeLevel
            );
        }

        const year = candidates[candidates.length - 1];

        if (!supportedSchemes.includes(year.grading_scheme)) {
            add(
                "warning",
                "SCHEME_NOT_SUPPORTED",
                `Grade ${grade} (${year.school_year}) was graded in ${year.grading_scheme === "TERM_3" ? "3 terms" : year.grading_scheme}, ` +
                    "but the current SF10-ES form prints 4 quarters. It is not converted (DepEd has published no conversion rule) " +
                    "and stays blank on the form until DepEd releases a 3-term SF10 edition.",
                gradeLevel
            );
            blocks.push({ grade_level: gradeLevel, status: "Unsupported", year });
            continue;
        }

        if (year.record_status === "Unavailable") {
            add("warning", "RECORD_UNAVAILABLE", `Grade ${grade} (${year.school_year}) is marked Unavailable.`, gradeLevel);
            blocks.push({ grade_level: gradeLevel, status: "Unavailable", year });
            continue;
        }

        const present = new Set(year.subjects.map((subject) => subject.subject_key));
        const missing = requiredSubjectKeysForGrade(gradeLevel).filter((key) => !present.has(key));
        const unrated = year.subjects.filter((subject) => subject.final_rating === null);

        if (missing.length > 0) {
            add(
                "warning",
                "MISSING_SUBJECTS",
                `Grade ${grade} (${year.school_year}) has no rating for: ${missing.map((key) => SUBJECT_LABELS[key]).join(", ")}.`,
                gradeLevel
            );
        }
        if (unrated.length > 0) {
            add(
                "warning",
                "INCOMPLETE_RATINGS",
                `Grade ${grade} (${year.school_year}) has incomplete ratings for: ${unrated.map((s) => s.label).join(", ")}.`,
                gradeLevel
            );
        }

        const complete = missing.length === 0 && unrated.length === 0 && year.record_status === "Complete";
        blocks.push({ grade_level: gradeLevel, status: complete ? "Complete" : "Partial", year });
    }

    const fillable = blocks.filter((block) => block.status === "Complete" || block.status === "Partial");
    const status =
        fillable.length === 0
            ? "NOT_READY"
            : blocks.every((block) => block.status === "Complete") && !issues.some((i) => i.level === "warning")
              ? "READY"
              : "PARTIAL";

    return {
        status,
        filled_grade_levels: fillable.map((block) => block.grade_level),
        blocks: blocks.map((block) => ({
            grade_level: block.grade_level,
            status: block.status,
            school_year: block.year?.school_year ?? null,
            source: block.year?.source ?? null,
        })),
        issues,
        _blocks: blocks,
    };
};

module.exports = {
    PASSING_RATING,
    SCHOOL_SETTING_KEYS,
    buildCumulativeRecord,
    evaluateReadiness,
    computeFinalRating,
    computeGeneralAverage,
    getSchoolSettings,
};
