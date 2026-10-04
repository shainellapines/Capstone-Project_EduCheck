-- ============================================
-- Migration 008: per-year section enrollment + approval snapshot
-- ============================================
-- 1. section_enrollments: students carries a single section_id /
--    school_year_id per LRN, overwritten by every upload, so it cannot
--    answer "which section is this learner in THIS school year" or detect
--    an upload into the wrong section. One row per (lrn, school_year_id)
--    is the authoritative class roster; students.section_id is kept as a
--    denormalised "latest" mirror so existing queries keep working.
-- 2. record_submissions.snapshot: a frozen copy of the consolidated record
--    (grades, teachers, adviser) written at approval time, so later
--    re-uploads or reassignments cannot silently rewrite approved history.

CREATE TABLE IF NOT EXISTS section_enrollments (
    lrn VARCHAR(20) NOT NULL,
    school_year_id INTEGER NOT NULL,
    section_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT section_enrollments_pkey
        PRIMARY KEY (lrn, school_year_id),

    CONSTRAINT fk_enrollment_student
        FOREIGN KEY (lrn) REFERENCES students(lrn),

    CONSTRAINT fk_enrollment_school_year
        FOREIGN KEY (school_year_id) REFERENCES school_years(school_year_id),

    CONSTRAINT fk_enrollment_section
        FOREIGN KEY (section_id) REFERENCES sections(section_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_section_year
    ON section_enrollments (section_id, school_year_id);

-- Backfill from the existing one-section-per-LRN data.
INSERT INTO section_enrollments (lrn, school_year_id, section_id)
SELECT lrn, school_year_id, section_id
FROM students
WHERE section_id IS NOT NULL AND school_year_id IS NOT NULL
ON CONFLICT (lrn, school_year_id) DO NOTHING;

ALTER TABLE record_submissions
    ADD COLUMN IF NOT EXISTS snapshot JSONB;
