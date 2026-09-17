-- ============================================
-- Migration 002: Grade Records - Terms, not Quarters
-- ============================================
-- The official DepEd E-Class Record this system imports has 3 terms
-- (TERM1/TERM2/TERM3), not 4 quarters. grade_records was modeled on
-- quarter_1..4 before the parser existed; this migration renames the first
-- 3 columns and drops the 4th so the table matches the actual data shape.
--
-- Safe to run as-is only while grade_records is empty (verified empty at
-- the time this migration was written — nothing in the codebase wrote to
-- this table yet). If it is no longer empty when you run this, back up any
-- quarter_4 data you care about first; this migration drops it.

ALTER TABLE grade_records
    RENAME COLUMN quarter_1 TO term_1;

ALTER TABLE grade_records
    RENAME COLUMN quarter_2 TO term_2;

ALTER TABLE grade_records
    RENAME COLUMN quarter_3 TO term_3;

ALTER TABLE grade_records
    DROP COLUMN quarter_4;
