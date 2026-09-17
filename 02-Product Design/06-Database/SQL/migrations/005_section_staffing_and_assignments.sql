-- Implements SPMP v1.0 US-009 / US-011: per-section staffing mode
-- (Self-Contained vs Departmentalized, admin-configured, not derived from
-- grade level) and admin-driven teacher-to-(subject, section) assignment.
--
-- Schema only - no demo/seed rows. Unlike migration 004 (official DepEd
-- subject list, fixed reference data), sections and assignments are
-- operational data the Administrator is meant to configure through the
-- app itself; hardcoding them here would defeat the point of the feature.

-- ============================================
-- 1. SECTION STAFFING MODE
-- ============================================

ALTER TABLE sections
    ADD COLUMN staffing_mode VARCHAR(20) NOT NULL DEFAULT 'Departmentalized'
    CONSTRAINT sections_staffing_mode_check
        CHECK (staffing_mode IN ('Self-Contained', 'Departmentalized'));

-- ============================================
-- 2. TEACHER ASSIGNMENTS
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
-- 3. CLASS RECORD -> SECTION
-- ============================================
-- Uploads were never tied to a section at all (only subject + school
-- year) - class_records.section_id lets an upload declare which section
-- it's for, which is what assignment-based access control needs to check
-- against. Nullable: existing rows predate this column and are left
-- alone; new uploads are required (at the application layer) to set it.

ALTER TABLE class_records
    ADD COLUMN section_id INTEGER,
    ADD CONSTRAINT fk_class_record_section
        FOREIGN KEY (section_id)
        REFERENCES sections(section_id);
