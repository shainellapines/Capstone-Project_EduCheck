-- ============================================
-- EduCheck Database Schema
-- ============================================
-- Folded up to date with migrations/001 through migrations/009 as of
-- 2026-10-04 - this file alone is enough to provision a fresh database.
-- The migrations/ directory is kept for historical record (each file
-- documents the reasoning behind its change) but does not need to be
-- re-run against a database created from this file.

-- ============================================
-- 1. USER
-- ============================================

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(30) NOT NULL,
    status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================
-- 2. TEACHER
-- ============================================

CREATE TABLE teachers (
    teacher_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    employee_number VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    contact_number VARCHAR(20),

    CONSTRAINT fk_teacher_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);


-- ============================================
-- 3. SECTION
-- ============================================

CREATE TABLE sections (
    section_id SERIAL PRIMARY KEY,
    section_name VARCHAR(100) NOT NULL,
    grade_level VARCHAR(20) NOT NULL,

    -- Admin-configured, not derived from grade level. 'Self-Contained'
    -- means one Adviser teaches every subject for the section;
    -- 'Departmentalized' means each subject has its own Subject Teacher.
    staffing_mode VARCHAR(20) NOT NULL DEFAULT 'Departmentalized'
        CONSTRAINT sections_staffing_mode_check
        CHECK (staffing_mode IN ('Self-Contained', 'Departmentalized'))
);


-- ============================================
-- 4. SCHOOL YEAR
-- ============================================

CREATE TABLE school_years (
    school_year_id SERIAL PRIMARY KEY,
    school_year VARCHAR(20) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'Active'
);


-- ============================================
-- 5. SUBJECT
-- ============================================

CREATE TABLE subjects (
    subject_id SERIAL PRIMARY KEY,
    subject_name VARCHAR(100) NOT NULL,
    grade_level VARCHAR(20) NOT NULL,

    CONSTRAINT subjects_name_grade_level_key
        UNIQUE (subject_name, grade_level)
);

-- Official DepEd curriculum data, fixed per grade level - not something
-- any role edits through the app (the SPMP defines no "manage subjects"
-- responsibility for Admin or any other role), so it's seeded here as
-- static reference data rather than built as an admin-managed feature.
INSERT INTO subjects (subject_name, grade_level) VALUES
    -- Grade 1 (5 subjects)
    ('Reading and Literacy', '1'),
    ('Language', '1'),
    ('Mathematics', '1'),
    ('Makabansa', '1'),
    ('GMRC', '1'),
    -- Grade 2 (5 subjects)
    ('Filipino', '2'),
    ('English', '2'),
    ('Mathematics', '2'),
    ('Makabansa', '2'),
    ('GMRC', '2'),
    -- Grade 3 (6 subjects)
    ('Filipino', '3'),
    ('English', '3'),
    ('Mathematics', '3'),
    ('Science', '3'),
    ('Makabansa', '3'),
    ('GMRC', '3'),
    -- Grade 4 (8 subjects)
    ('Filipino', '4'),
    ('English', '4'),
    ('Mathematics', '4'),
    ('Science', '4'),
    ('Araling Panlipunan', '4'),
    ('EPP', '4'),
    ('MAPEH', '4'),
    ('GMRC', '4'),
    -- Grade 5 (8 subjects)
    ('Filipino', '5'),
    ('English', '5'),
    ('Mathematics', '5'),
    ('Science', '5'),
    ('Araling Panlipunan', '5'),
    ('EPP', '5'),
    ('MAPEH', '5'),
    ('GMRC', '5'),
    -- Grade 6 (8 subjects)
    ('Filipino', '6'),
    ('English', '6'),
    ('Mathematics', '6'),
    ('Science', '6'),
    ('Araling Panlipunan', '6'),
    ('TLE', '6'),
    ('MAPEH', '6'),
    ('ESP', '6')
ON CONFLICT (subject_name, grade_level) DO NOTHING;


-- ============================================
-- 5B. TEACHER ASSIGNMENT
-- ============================================
-- One row = one teacher's responsibility over one section, for one school
-- year. subject_id NULL means "Class Adviser for this whole section"
-- (full visibility, upload access only if the section is Self-Contained).
-- subject_id NOT NULL means "Subject Teacher for this one subject in this
-- section" - valid regardless of the section's staffing mode, so a
-- specialist (e.g. MAPEH) can still be assigned inside an otherwise
-- Self-Contained section (SPMP's "partial departmentalization").

CREATE TABLE teacher_assignments (
    assignment_id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL,
    section_id INTEGER NOT NULL,
    subject_id INTEGER,
    school_year_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_assignment_teacher
        FOREIGN KEY (teacher_id)
        REFERENCES teachers(teacher_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_assignment_section
        FOREIGN KEY (section_id)
        REFERENCES sections(section_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_assignment_subject
        FOREIGN KEY (subject_id)
        REFERENCES subjects(subject_id),

    CONSTRAINT fk_assignment_school_year
        FOREIGN KEY (school_year_id)
        REFERENCES school_years(school_year_id)
);

-- One Adviser per section per school year (subject_id IS NULL rows).
CREATE UNIQUE INDEX uq_assignment_one_adviser_per_section
    ON teacher_assignments (section_id, school_year_id)
    WHERE subject_id IS NULL;

-- One Subject Teacher per (subject, section) per school year.
CREATE UNIQUE INDEX uq_assignment_one_teacher_per_subject_section
    ON teacher_assignments (section_id, subject_id, school_year_id)
    WHERE subject_id IS NOT NULL;


-- ============================================
-- 6. STUDENT
-- ============================================

CREATE TABLE students (
    lrn VARCHAR(20) PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    sex VARCHAR(20),
    birth_date DATE,
    -- SF10 personal info (migration 009); the e-Class Record never supplies it.
    name_extension VARCHAR(20),
    grade_level VARCHAR(20) NOT NULL,
    section_id INTEGER,
    school_year_id INTEGER,

    CONSTRAINT fk_student_section
        FOREIGN KEY (section_id)
        REFERENCES sections(section_id),

    CONSTRAINT fk_student_school_year
        FOREIGN KEY (school_year_id)
        REFERENCES school_years(school_year_id)
);


-- ============================================
-- 7. CLASS RECORD
-- ============================================

CREATE TABLE class_records (
    class_record_id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL,
    subject_id INTEGER NOT NULL,
    school_year_id INTEGER NOT NULL,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    file_name VARCHAR(255) NOT NULL,
    status VARCHAR(30) DEFAULT 'Uploaded',

    -- Stored filename on disk (multer-generated), distinct from the
    -- learner-facing original file_name above.
    stored_file_name VARCHAR(255),

    -- Populated by the rule-based validation layer (classRecordValidator.js)
    -- at upload time.
    validation_error_count INTEGER NOT NULL DEFAULT 0,
    validation_warning_count INTEGER NOT NULL DEFAULT 0,
    ready_for_submission BOOLEAN NOT NULL DEFAULT false,

    -- Which section this upload is for - lets assignment-based access
    -- control (isUploadAuthorized, getAdviserSectionIds) check an upload
    -- against the uploader's teacher_assignments row. Nullable: rows from
    -- before this column existed are left alone; new uploads set it.
    section_id INTEGER,

    -- Set by consolidationController.requestRevision (Class Adviser
    -- sending a subject back to its Subject Teacher for correction). No
    -- separate status enum - "Needs Revision" is just written into the
    -- unconstrained `status` column above like any other status string.
    revision_remarks TEXT,
    revision_requested_by INTEGER,
    revision_requested_at TIMESTAMP,

    CONSTRAINT fk_class_record_teacher
        FOREIGN KEY (teacher_id)
        REFERENCES teachers(teacher_id),

    CONSTRAINT fk_class_record_subject
        FOREIGN KEY (subject_id)
        REFERENCES subjects(subject_id),

    CONSTRAINT fk_class_record_school_year
        FOREIGN KEY (school_year_id)
        REFERENCES school_years(school_year_id),

    CONSTRAINT fk_class_record_section
        FOREIGN KEY (section_id)
        REFERENCES sections(section_id),

    CONSTRAINT fk_class_record_revision_requested_by
        FOREIGN KEY (revision_requested_by)
        REFERENCES users(user_id)
);


-- ============================================
-- 7B. CLASS RECORD VALIDATION ISSUE
-- ============================================
-- One row per issue raised by the rule-based validation layer
-- (classRecordValidator.js) for a given class record upload.

CREATE TABLE class_record_validation_issues (
    validation_issue_id SERIAL PRIMARY KEY,
    class_record_id INTEGER NOT NULL,
    learner_number INTEGER,
    learner_name VARCHAR(255),
    term VARCHAR(20),
    field_name VARCHAR(100),
    code VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT class_record_validation_issues_class_record_id_fkey
        FOREIGN KEY (class_record_id)
        REFERENCES class_records(class_record_id)
);


-- ============================================
-- 8. GRADE RECORD
-- ============================================

CREATE TABLE grade_records (
    grade_record_id SERIAL PRIMARY KEY,
    class_record_id INTEGER NOT NULL,
    lrn VARCHAR(20) NOT NULL,
    -- The E-Class Record template has 3 terms, not 4 quarters (see migration 002).
    term_1 NUMERIC(5,2),
    term_2 NUMERIC(5,2),
    term_3 NUMERIC(5,2),
    final_grade NUMERIC(5,2),
    remarks VARCHAR(255),

    CONSTRAINT fk_grade_record_class_record
        FOREIGN KEY (class_record_id)
        REFERENCES class_records(class_record_id),

    CONSTRAINT fk_grade_record_student
        FOREIGN KEY (lrn)
        REFERENCES students(lrn)
);


-- ============================================
-- 9. ACADEMIC RECORD
-- ============================================

CREATE TABLE academic_records (
    academic_record_id SERIAL PRIMARY KEY,
    lrn VARCHAR(20) NOT NULL,
    school_year_id INTEGER NOT NULL,
    general_average NUMERIC(5,2),
    consolidation_status VARCHAR(30) DEFAULT 'Pending',

    CONSTRAINT fk_academic_record_student
        FOREIGN KEY (lrn)
        REFERENCES students(lrn),

    CONSTRAINT fk_academic_record_school_year
        FOREIGN KEY (school_year_id)
        REFERENCES school_years(school_year_id),

    CONSTRAINT uq_academic_record_student_year
        UNIQUE (lrn, school_year_id)
);


-- ============================================
-- 10. VALIDATION REPORT
-- ============================================

CREATE TABLE validation_reports (
    validation_id SERIAL PRIMARY KEY,
    academic_record_id INTEGER NOT NULL,
    validation_status VARCHAR(30) NOT NULL,
    remarks TEXT,
    validated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_validation_academic_record
        FOREIGN KEY (academic_record_id)
        REFERENCES academic_records(academic_record_id)
);


-- ============================================
-- 11. SF10
-- ============================================

CREATE TABLE sf10 (
    sf10_id SERIAL PRIMARY KEY,
    academic_record_id INTEGER NOT NULL,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approval_status VARCHAR(30) DEFAULT 'Pending',

    CONSTRAINT fk_sf10_academic_record
        FOREIGN KEY (academic_record_id)
        REFERENCES academic_records(academic_record_id)
);


-- ============================================
-- 12. SUBMISSION
-- ============================================

CREATE TABLE submissions (
    submission_id SERIAL PRIMARY KEY,
    sf10_id INTEGER NOT NULL UNIQUE,
    teacher_id INTEGER NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(30) DEFAULT 'Pending',

    CONSTRAINT fk_submission_sf10
        FOREIGN KEY (sf10_id)
        REFERENCES sf10(sf10_id),

    CONSTRAINT fk_submission_teacher
        FOREIGN KEY (teacher_id)
        REFERENCES teachers(teacher_id)
);


-- ============================================
-- 13. NOTIFICATION
-- ============================================

CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'Unread',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notification_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);

-- ============================================
-- NOTE ON SECTIONS 10-12 (VALIDATION_REPORTS / SF10 / SUBMISSIONS)
-- ============================================
-- These three tables (and ACADEMIC_RECORD, section 9) are the original
-- ERD design and are not written to anywhere in the current backend.
-- The parser/validation work (Sprints 3-5) implemented a different, more
-- granular model instead: CLASS_RECORD -> GRADE_RECORD -> STUDENT (see
-- sections 6-8), because SF10 generation has not started - a copy of the
-- official SF10-ES template was obtained (repo root, see
-- backend/src/utils/sf10Structure.js), but it is DepEd's older
-- 4-Quarter-per-year edition. The current E-Class Record (and this
-- schema's grade_records table, migration 002) uses 3 Terms per year
-- instead - DepEd has not yet released an SF10 revision that matches the
-- 3-term structure, and there is no official 3-term<->4-quarter
-- conversion rule to fall back on, so SF10 generation stays BLOCKED on
-- that release, not on obtaining a template. Do not invent a term<->
-- quarter conversion to unblock this - see sf10Structure.js for the
-- fuller explanation. RECORD_SUBMISSION below tracks review/approval of
-- a student's CONSOLIDATED record (i.e. pre-SF10) using that newer
-- model. Once SF10 generation is actually unblocked, this table and the
-- SUBMISSIONS table above should be reconciled rather than both kept -
-- do not treat both as active in parallel.


-- ============================================
-- 14. RECORD SUBMISSION
-- ============================================
-- Tracks the review/approval workflow for a student's consolidated
-- academic record for one school year. Per the SPMP: the Class Adviser
-- reviews and submits it for approval; the School Administrator approves
-- or rejects it. No row for (lrn, school_year_id) means "Not Submitted" -
-- that state is computed, never stored.

CREATE TABLE record_submissions (
    submission_id SERIAL PRIMARY KEY,
    lrn VARCHAR(20) NOT NULL,
    school_year_id INTEGER NOT NULL,
    -- 'Pending Approval', 'Approved', 'Rejected'
    status VARCHAR(30) NOT NULL,
    reviewed_by INTEGER,
    reviewed_at TIMESTAMP,
    approved_by INTEGER,
    approved_at TIMESTAMP,
    remarks TEXT,
    -- Frozen copy of the consolidated record, written at approval time
    -- (migration 008).
    snapshot JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT record_submissions_lrn_school_year_key
        UNIQUE (lrn, school_year_id),

    CONSTRAINT fk_record_submission_student
        FOREIGN KEY (lrn)
        REFERENCES students(lrn),

    CONSTRAINT fk_record_submission_school_year
        FOREIGN KEY (school_year_id)
        REFERENCES school_years(school_year_id),

    CONSTRAINT fk_record_submission_reviewer
        FOREIGN KEY (reviewed_by)
        REFERENCES users(user_id),

    CONSTRAINT fk_record_submission_approver
        FOREIGN KEY (approved_by)
        REFERENCES users(user_id)
);


-- ============================================
-- 15. AUDIT LOG
-- ============================================
-- SPMP v1.0 Risk Management §11: an audit trail for the two admin-only
-- mutation surfaces that risk analysis flagged (sectionController,
-- assignmentController) - who changed a `sections` or `teacher_assignments`
-- row, and when. Deliberately generic (entity_type/entity_id/before_data/
-- after_data) rather than one column per table, so a future entity (e.g.
-- `users`) can write into the same table without another migration.
-- before_data is NULL on a create, after_data is NULL on a delete, both
-- populated on an update.

CREATE TABLE audit_logs (
    audit_log_id SERIAL PRIMARY KEY,
    actor_user_id INTEGER NOT NULL,
    -- 'create' | 'update' | 'delete'
    action VARCHAR(20) NOT NULL,
    -- 'section' | 'teacher_assignment'
    entity_type VARCHAR(30) NOT NULL,
    entity_id INTEGER NOT NULL,
    before_data JSONB,
    after_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_audit_log_actor
        FOREIGN KEY (actor_user_id)
        REFERENCES users(user_id)
);

CREATE INDEX idx_audit_logs_entity ON audit_logs (entity_type, entity_id);


-- ============================================
-- 16. SECTION ENROLLMENT
-- ============================================
-- Authoritative class roster: one row per learner per school year
-- (migration 008). students.section_id remains as a "latest" mirror.

CREATE TABLE section_enrollments (
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

CREATE INDEX idx_enrollments_section_year
    ON section_enrollments (section_id, school_year_id);


-- ============================================
-- 17. SF10 FOUNDATION (migration 009)
-- ============================================
-- Hand-entered earlier years / transferee records, and the school's own
-- SF10 header values. See migrations/009_sf10_foundation.sql.

CREATE TABLE historical_academic_records (
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

CREATE TABLE historical_subject_grades (
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

CREATE TABLE school_settings (
    setting_key VARCHAR(50) PRIMARY KEY,
    setting_value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
