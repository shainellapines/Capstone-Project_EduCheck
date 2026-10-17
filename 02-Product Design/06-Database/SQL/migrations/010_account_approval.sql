-- 010_account_approval.sql
-- 2026-10-17
--
-- What: lets the Principal approve accounts before they can be used.
--   * users.status gains two values (the column is free text, so no type
--     change): 'Pending Approval' (created, cannot sign in yet) and
--     'Rejected' (not approved; the reason is in approval_remarks).
--   * users.pending_role holds a role change that gives more access while
--     it waits for approval; the account keeps its current role until then.
--   * reviewed_by / reviewed_at record who decided, and when.
--
-- Why: the capstone adviser asked that the Administrator not be the only
-- one who grants access (separation of duties; the Principal issues
-- teacher designations in DepEd practice). Existing accounts are not
-- touched: they stay 'Active'.

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS pending_role VARCHAR(30),
    ADD COLUMN IF NOT EXISTS approval_remarks TEXT,
    ADD COLUMN IF NOT EXISTS reviewed_by INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP;
