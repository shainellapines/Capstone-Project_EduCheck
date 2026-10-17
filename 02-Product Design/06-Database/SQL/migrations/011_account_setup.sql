-- 011_account_setup.sql
-- 2026-10-17
--
-- What: the Administrator finishes an account only after the Principal
-- approves it.
--   * users.status gains 'Awaiting Setup' (approved, but the Administrator
--     has not yet given the employee number and temporary password; it
--     cannot sign in).
--   * teachers.employee_number may be empty until then. It stays UNIQUE;
--     PostgreSQL allows several NULLs under a UNIQUE constraint.
--   * users.must_change_password marks a temporary password the user has
--     to replace on first sign-in.
--
-- Why: the capstone adviser asked that the employee number be issued after
-- approval, and that the account's DepEd email receive the temporary
-- password. Existing accounts are not touched.

ALTER TABLE teachers
    ALTER COLUMN employee_number DROP NOT NULL;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;
