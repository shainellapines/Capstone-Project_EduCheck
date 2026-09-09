-- ============================================
-- Migration 004: Seed Full DepEd Subject List
-- ============================================
-- `subjects` was never seeded beyond a single manually-inserted row
-- ("Mathematics", grade_level '6') added during early testing. That left
-- the Upload e-Class Record dropdown (ClassRecordUpload.jsx) able to
-- offer only that one grade/subject combination, blocking uploads for
-- every other grade level and subject.
--
-- Subjects are official DepEd curriculum data (fixed per grade level),
-- not something any role edits through the app - the SPMP defines no
-- "manage subjects" responsibility for Admin or any other role - so this
-- is seeded as static reference data via migration rather than built as
-- an admin-managed feature. See EduCheck_Capstone2_Development_Handoff_v4
-- for the full reasoning.
--
-- A (subject_name, grade_level) uniqueness guard is added first so this
-- can be re-run safely and so the pre-existing Mathematics/6 row (and
-- its subject_id, already referenced by any class_records that used it)
-- is left untouched rather than duplicated.

ALTER TABLE subjects
    ADD CONSTRAINT subjects_name_grade_level_key
    UNIQUE (subject_name, grade_level);

INSERT INTO subjects (subject_name, grade_level) VALUES
    -- Grade 1 (5 subjects)
    ('Reading and Literacy', '1'),
    ('Language', '1'),
    ('Mathematics', '1'),
    ('Makabansa', '1'),
    ('GMRC', '1'),
    -- Grade 2 (5 subjects)
    ('Filipino', '2'),
    ('English', '2'),
    ('Mathematics', '2'),
    ('Makabansa', '2'),
    ('GMRC', '2'),
    -- Grade 3 (6 subjects)
    ('Filipino', '3'),
    ('English', '3'),
    ('Mathematics', '3'),
    ('Science', '3'),
    ('Makabansa', '3'),
    ('GMRC', '3'),
    -- Grade 4 (8 subjects)
    ('Filipino', '4'),
    ('English', '4'),
    ('Mathematics', '4'),
    ('Science', '4'),
    ('Araling Panlipunan', '4'),
    ('EPP', '4'),
    ('MAPEH', '4'),
    ('GMRC', '4'),
    -- Grade 5 (8 subjects)
    ('Filipino', '5'),
    ('English', '5'),
    ('Mathematics', '5'),
    ('Science', '5'),
    ('Araling Panlipunan', '5'),
    ('EPP', '5'),
    ('MAPEH', '5'),
    ('GMRC', '5'),
    -- Grade 6 (8 subjects)
    ('Filipino', '6'),
    ('English', '6'),
    ('Mathematics', '6'),
    ('Science', '6'),
    ('Araling Panlipunan', '6'),
    ('TLE', '6'),
    ('MAPEH', '6'),
    ('ESP', '6')
ON CONFLICT (subject_name, grade_level) DO NOTHING;
