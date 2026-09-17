-- ============================================
-- Migration 003: Record Submissions
-- ============================================
-- Tracks the review/approval workflow for a student's consolidated
-- academic record for a given school year (Sprint 7: Submission Workflow).
-- Per the SPMP: the Class Adviser reviews a consolidated record and
-- submits it for approval; the School Administrator approves or rejects
-- it. Absence of a row for (lrn, school_year_id) means "Not Submitted" —
-- that state is never stored, only computed.
--
-- NOTE: educheck_schema.sql already has an older SUBMISSION table (its
-- section 12) keyed to a generated sf10_id — that's the original ERD
-- design for once SF10 generation exists, and nothing writes to it today
-- (no SF10 template exists yet). This table is the pragmatic version for
-- right now: submitting a student's CONSOLIDATED record (pre-SF10) for
-- review. When SF10 generation is built, reconcile these two rather than
-- keep both active in parallel.

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
