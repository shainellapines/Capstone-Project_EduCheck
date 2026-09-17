-- SPMP v1.0 Risk Management §11: an audit trail for section and teacher-
-- assignment changes. Nothing in the codebase logged who changed a
-- `sections` or `teacher_assignments` row, or when — this closes that gap
-- for the two admin-only mutation surfaces that need it
-- (sectionController, assignmentController).
--
-- Deliberately generic (entity_type/entity_id/before_data/after_data)
-- rather than one column per table, so a future entity (e.g. `users`) can
-- write into the same table without another migration. before_data/
-- after_data store the full row as JSON — NULL before_data on a create,
-- NULL after_data on a delete, both populated on an update.
--
-- Schema only, no seed rows. Applied live and verified — safe to run once,
-- not idempotent (a plain CREATE TABLE, like 003).

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
