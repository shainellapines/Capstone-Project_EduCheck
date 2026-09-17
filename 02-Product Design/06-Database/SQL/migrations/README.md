# Database Migrations

This folder tracks incremental schema changes as ordered, numbered SQL files.
It exists because `educheck_schema.sql` (one level up) was previously edited
directly whenever the schema changed, with no record of *when* or *why* — the
live `educheck_db` had ended up with columns/tables (`class_records.stored_file_name`,
`class_record_validation_issues`, etc.) that the checked-in schema file never
mentioned. Going forward, every schema change should land here first.

## Convention

- One file per change: `NNN_short_description.sql`, zero-padded, sequential,
  never reused or renumbered once committed.
- Each migration is additive and forward-only (`CREATE TABLE`, `ALTER TABLE ADD COLUMN`, …).
  If something needs correcting, write a new migration that fixes it — don't
  edit an already-applied one.
- Each file starts with a header comment: what it does, why, and the date.
- After writing a migration, also update `../educheck_schema.sql` so it stays
  a true snapshot of "all migrations applied, in order." The schema file is
  documentation of the current state; the migration files are the history of
  how it got there.
- Apply migrations manually, in numeric order, against `educheck_db` (e.g.
  via `psql -d educheck_db -f migrations/00X_name.sql` or pgAdmin's query
  tool) — there's no migration runner in this project, so track by hand
  which numbers have been applied to your local database.

## Applied so far

| # | File | Applied to live DB |
|---|------|---------------------|
| 001 | [001_add_class_record_validation.sql](001_add_class_record_validation.sql) | Yes — applied by hand before this history existed; captured here for the record. Also folded into `educheck_schema.sql`. |
| 002 | [002_grade_records_terms.sql](002_grade_records_terms.sql) | Yes — `grade_records` was empty at the time, so applied directly. Also folded into `educheck_schema.sql`. |
| 003 | [003_record_submissions.sql](003_record_submissions.sql) | Yes — new table, no conflict. Also folded into `educheck_schema.sql`. |
| 004 | [004_seed_subjects.sql](004_seed_subjects.sql) | Yes (applied in an earlier session). **Not yet folded into `educheck_schema.sql`** — pre-existing gap, not addressed here. |
| 005 | [005_section_staffing_and_assignments.sql](005_section_staffing_and_assignments.sql) | Yes (applied in an earlier session). **Not yet folded into `educheck_schema.sql`** — pre-existing gap, not addressed here. |
| 006 | [006_class_record_revision_requests.sql](006_class_record_revision_requests.sql) | Yes — applied live this session, verified end-to-end (see the SPMP v1.0 US-006 handoff). Not folded into `educheck_schema.sql` either, for the same reason: 004/005 already left it out of sync, and a partial fold (006 only) would make the snapshot more misleading, not less. Whoever tackles the 004/005 backfill should include 006 in the same pass. |
| 007 | [007_audit_logs.sql](007_audit_logs.sql) | Yes — new table, no conflict, applied and verified live this session (SPMP Risk Management §11: section/teacher-assignment audit trail). Same "not folded into `educheck_schema.sql`" gap as 004–006, for the same reason. |
