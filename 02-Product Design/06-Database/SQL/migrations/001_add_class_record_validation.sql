-- ============================================
-- Migration 001: Class Record Validation
-- ============================================
-- Adds the columns and table needed by the rule-based validation layer
-- (backend/src/controllers/classRecordValidator.js and uploadController.js).
--
-- Status: Already applied by hand to the live `educheck_db` while the
-- upload/validation feature was being built. This file documents that change
-- for the historical record and for anyone provisioning a new database from
-- scratch. Check your database before running this — it is written to be
-- safe to skip if already applied, but is NOT re-run-safe (no IF NOT EXISTS
-- guards), consistent with the rest of this schema.
--
-- Depends on: educheck_schema.sql (section 7 - CLASS RECORD) already applied.

ALTER TABLE class_records
    ADD COLUMN stored_file_name VARCHAR(255),
    ADD COLUMN validation_error_count INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN validation_warning_count INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN ready_for_submission BOOLEAN NOT NULL DEFAULT false;


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
