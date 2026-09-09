-- SPMP v1.0 US-006 (Must, Sprint 7): Adviser return-to-subject-teacher
-- correction. Adds the fields a revision request needs on the class_record
-- it targets. No new status enum to maintain — class_records.status is an
-- unconstrained VARCHAR(30) (see educheck_schema.sql), so the new value
-- "Needs Revision" is just written like any other status string.
--
-- Schema only, no seed rows. Applied live and verified — safe to run once,
-- not idempotent (a plain ALTER, like 005).

ALTER TABLE class_records
    ADD COLUMN revision_remarks TEXT,
    ADD COLUMN revision_requested_by INTEGER,
    ADD COLUMN revision_requested_at TIMESTAMP,
    ADD CONSTRAINT fk_class_record_revision_requested_by
        FOREIGN KEY (revision_requested_by) REFERENCES users(user_id);
