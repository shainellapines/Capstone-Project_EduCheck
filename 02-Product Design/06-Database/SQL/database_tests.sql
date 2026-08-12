SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;


SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'subjects'
ORDER BY ordinal_position;

SELECT * FROM subjects;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'students'
ORDER BY ordinal_position;

SELECT
    tc.constraint_name,
    tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_name = 'students';

SELECT * FROM students;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'class_records'
ORDER BY ordinal_position;

SELECT
    tc.constraint_name,
    tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_name = 'class_records';

SELECT * FROM class_records;

SELECT * FROM sections;

SELECT * FROM school_years;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'sections'
ORDER BY ordinal_position;

SELECT * FROM users;

SELECT * FROM teachers;


SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'school_years'
ORDER BY ordinal_position;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'teachers'
ORDER BY ordinal_position;

SELECT
    tc.constraint_name,
    tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_name = 'teachers';

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'grade_records'
ORDER BY ordinal_position;

SELECT
    tc.constraint_name,
    tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_name = 'grade_records';

SELECT * FROM grade_records;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'academic_records'
ORDER BY ordinal_position;

SELECT
    tc.constraint_name,
    tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_name = 'academic_records';

SELECT * FROM academic_records;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'validation_reports'
ORDER BY ordinal_position;

SELECT
    tc.constraint_name,
    tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_name = 'validation_reports';

SELECT * FROM validation_reports;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'sf10'
ORDER BY ordinal_position;

SELECT
    tc.constraint_name,
    tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_name = 'sf10';

SELECT * FROM sf10;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'submissions'
ORDER BY ordinal_position;

SELECT
    tc.constraint_name,
    tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_name = 'submissions';

SELECT * FROM submissions;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'notifications'
ORDER BY ordinal_position;

SELECT
    tc.constraint_name,
    tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_name = 'notifications';



SELECT
    table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;


SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS referenced_table,
    ccu.column_name AS referenced_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;