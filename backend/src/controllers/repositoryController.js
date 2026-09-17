const pool = require("../db");

// ==========================================
// SEARCH STUDENTS (Searchable Digital Repository)
// ==========================================
// Lets an adviser/admin look up a specific learner by LRN or name,
// optionally narrowed by grade level, WITHOUT first having to know which
// school year to pick — unlike /api/consolidation, which requires a
// school year up front and only shows that one year's students. Returns
// basic identity info plus, per school year that learner has at least one
// recorded grade in, the grade level they were actually in that year — so
// the caller can jump straight to
// /api/consolidation/school-years/:id/students/:lrn for the actual record
// rather than this endpoint duplicating that one's work.
//
// `students.grade_level` only stores the learner's MOST RECENT grade
// level — it's upserted to the latest value on every grade upload (see
// gradeRecordPersistence.js), not kept as year-by-year history, so it
// can't be trusted to describe every year a learner has records in. The
// per-year grade level below is derived properly instead, from
// grade_records -> class_records -> subjects.grade_level (subjects each
// belong to one grade level, and a class_record is always for one
// subject), which genuinely is recorded per year. `latest_grade_level` is
// kept alongside it for a quick "what grade are they in now" glance, but
// callers should prefer the per-year value for anything tied to a
// specific school year.
const searchStudents = async (req, res) => {
    try {
        const rawQuery = typeof req.query.q === "string" ? req.query.q.trim() : "";
        const gradeLevel =
            typeof req.query.grade_level === "string" && req.query.grade_level.trim() !== ""
                ? req.query.grade_level.trim()
                : null;

        if (rawQuery.length === 0 && !gradeLevel) {
            return res.status(400).json({
                message: "Provide a search term (LRN or name) or a grade level filter.",
            });
        }

        const likeQuery = `%${rawQuery}%`;

        const result = await pool.query(
            `
            SELECT
                s.lrn,
                s.first_name,
                s.last_name,
                s.grade_level AS latest_grade_level,
                COALESCE(
                    json_agg(
                        DISTINCT jsonb_build_object(
                            'school_year_id', cr.school_year_id,
                            'grade_level', subj.grade_level
                        )
                    ) FILTER (WHERE cr.school_year_id IS NOT NULL),
                    '[]'
                ) AS school_years
            FROM students s
            LEFT JOIN grade_records gr ON gr.lrn = s.lrn
            LEFT JOIN class_records cr ON cr.class_record_id = gr.class_record_id
            LEFT JOIN subjects subj ON subj.subject_id = cr.subject_id
            WHERE
                (
                    $1 = ''
                    OR s.lrn ILIKE $2
                    OR (s.last_name || ', ' || s.first_name) ILIKE $2
                    OR (s.first_name || ' ' || s.last_name) ILIKE $2
                )
                AND ($3::varchar IS NULL OR s.grade_level = $3)
            GROUP BY s.lrn, s.first_name, s.last_name, s.grade_level
            ORDER BY s.last_name, s.first_name
            LIMIT 50
            `,
            [rawQuery, likeQuery, gradeLevel]
        );

        const students = result.rows;

        return res.json({
            students,
            result_count: students.length,
            // 50 is a safety cap, not a "there are exactly 50" claim — tell
            // the caller when results may have been cut off so the UI can
            // prompt for a narrower search instead of implying completeness.
            truncated: students.length === 50,
        });
    } catch (error) {
        console.error("Repository search error:", error);

        return res.status(500).json({ message: "Failed to search records." });
    }
};

module.exports = { searchStudents };
