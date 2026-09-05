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
    quarter_1 NUMERIC(5,2),
    quarter_2 NUMERIC(5,2),
    quarter_3 NUMERIC(5,2),
    quarter_4 NUMERIC(5,2),
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