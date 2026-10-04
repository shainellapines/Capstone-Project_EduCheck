-- ============================================
-- Migration 009: SF10 foundation (2026-10-04)
-- ============================================
-- SF10-ES is a learner's CUMULATIVE Grade 1-6 record, but EduCheck only
-- holds the years uploaded through it. Earlier years (and transferees'
-- records from other schools) are entered by hand into
-- historical_academic_records / historical_subject_grades.
--
-- grading_scheme records how that year was actually graded:
--   QUARTER_4 - Quarters 1-4 (the scheme the current SF10-ES form prints)
--   TERM_3    - Terms 1-3 (the current e-Class Record)
-- The two are never converted into each other - DepEd has published no
-- conversion rule. A TERM_3 year is stored as-is and left off the
-- generated form until a 3-term SF10 edition exists.
--
-- school_settings holds the school's own header values (name, ID,
-- district, division, region) for years taken at this school.

CREATE TABLE IF NOT EXISTS historical_academic_records (
    historical_record_id SERIAL PRIMARY KEY,
    lrn VARCHAR(20) NOT NULL,
    school_year VARCHAR(20) NOT NULL,
    grade_level VARCHAR(20) NOT NULL,
    grading_scheme VARCHAR(20) NOT NULL
        CONSTRAINT historical_grading_scheme_check
        CHECK (grading_scheme IN ('QUARTER_4', 'TERM_3')),
    record_status VARCHAR(20) NOT NULL DEFAULT 'Complete'
        CONSTRAINT historical_record_status_check
        CHECK (record_status IN ('Complete', 'Partial', 'Unavailable')),
    school_name VARCHAR(150),
    school_id VARCHAR(30),
    district VARCHAR(100),
    division VARCHAR(100),
    region VARCHAR(100),
    section_name VARCHAR(100),
    adviser_name VARCHAR(150),
    general_average NUMERIC(5,2),
    remarks TEXT,
    entered_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT historical_records_lrn_school_year_key UNIQUE (lrn, school_year),

    CONSTRAINT fk_historical_student
        FOREIGN KEY (lrn) REFERENCES students(lrn),

    CONSTRAINT fk_historical_entered_by
        FOREIGN KEY (entered_by) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS historical_subject_grades (
    historical_grade_id SERIAL PRIMARY KEY,
    historical_record_id INTEGER NOT NULL,
    -- Canonical SF10 learning-area key (see services/sf10/subjects.js),
    -- e.g. 'filipino', 'musicAndArts' - not free text, so it maps to a row.
    subject_key VARCHAR(50) NOT NULL,
    -- rating_1..rating_4 are Quarters 1-4 for QUARTER_4 years, or Terms
    -- 1-3 (rating_4 NULL) for TERM_3 years.
    rating_1 NUMERIC(5,2),
    rating_2 NUMERIC(5,2),
    rating_3 NUMERIC(5,2),
    rating_4 NUMERIC(5,2),
    final_rating NUMERIC(5,2),
    remarks VARCHAR(50),

    CONSTRAINT historical_grades_record_subject_key UNIQUE (historical_record_id, subject_key),

    CONSTRAINT fk_historical_grade_record
        FOREIGN KEY (historical_record_id)
        REFERENCES historical_academic_records(historical_record_id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS school_settings (
    setting_key VARCHAR(50) PRIMARY KEY,
    setting_value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SF10 personal-information fields the e-Class Record never supplies.
ALTER TABLE students ADD COLUMN IF NOT EXISTS name_extension VARCHAR(20);
