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
    grade_level VARCHAR(20) NOT NULL
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
    grade_level VARCHAR(20) NOT NULL
);


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

    CONSTRAINT fk_class_record_teacher
        FOREIGN KEY (teacher_id)
        REFERENCES teachers(teacher_id),

    CONSTRAINT fk_class_record_subject
        FOREIGN KEY (subject_id)
        REFERENCES subjects(subject_id),

    CONSTRAINT fk_class_record_school_year
        FOREIGN KEY (school_year_id)
        REFERENCES school_years(school_year_id)
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
