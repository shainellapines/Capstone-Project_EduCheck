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
