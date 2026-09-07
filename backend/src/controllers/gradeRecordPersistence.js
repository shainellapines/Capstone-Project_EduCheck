const { isValidLrn, getRecordKey } = require("./classRecordParser");

// The e-Class Record spells names as "Last, First" (e.g. "Dela Cruz, Daniel").
// Splitting on the first comma is enough for this template; there is no
// separate middle-name field to recover.
const splitLearnerName = (learnerName) => {
    const [lastPart, firstPart] = learnerName.split(",").map((part) => part?.trim());

    return {
        last_name: lastPart || learnerName,
        first_name: firstPart || "",
    };
};

// Mirrors classRecordValidator's expectedFinalGrade: only meaningful once
// every term is ready with a numeric grade, otherwise the student's record
// for this subject is still incomplete.
const computeFinalGrade = (term1, term2, term3) => {
    const terms = [term1, term2, term3];
    const allReady = terms.every((term) => term?.calculation?.ready && typeof term.term_grade === "number");

    if (!allReady) return null;

    return Math.round(terms.reduce((total, term) => total + term.term_grade, 0) / terms.length);
};

// Persists one grade_records row per learner (keyed by LRN) for this class
// record, and upserts a matching students row so the learner exists as a
// durable identity the system can later consolidate across subjects.
// Learners without a valid 12-digit LRN are skipped — see the
// MISSING_LRN / INVALID_LRN_FORMAT warnings from classRecordParser, which
// already flag exactly these learners for the uploader to fix.
const persistLearnerGradeRecords = async (dbClient, { classRecordId, parsedRecord, subject, schoolYear }) => {
    const termMaps = {
        term1: new Map(parsedRecord.terms.term1.map((record) => [getRecordKey(record), record])),
        term2: new Map(parsedRecord.terms.term2.map((record) => [getRecordKey(record), record])),
        term3: new Map(parsedRecord.terms.term3.map((record) => [getRecordKey(record), record])),
    };

    let persistedCount = 0;
    let skippedCount = 0;

    for (const learner of parsedRecord.learners) {
        if (!isValidLrn(learner.lrn)) {
            skippedCount += 1;
            continue;
        }

        const key = getRecordKey(learner);
        const term1 = termMaps.term1.get(key);
        const term2 = termMaps.term2.get(key);
        const term3 = termMaps.term3.get(key);
        const { first_name, last_name } = splitLearnerName(learner.learner_name);

        await dbClient.query(
            `
            INSERT INTO students
            (
                lrn,
                first_name,
                last_name,
                sex,
                grade_level,
                school_year_id
            )
            VALUES
            (
                $1, $2, $3, $4, $5, $6
            )
            ON CONFLICT (lrn) DO UPDATE SET
                first_name = EXCLUDED.first_name,
                last_name = EXCLUDED.last_name,
                sex = EXCLUDED.sex,
                grade_level = EXCLUDED.grade_level,
                school_year_id = EXCLUDED.school_year_id
            `,
            [learner.lrn, first_name, last_name, learner.gender, subject.grade_level, schoolYear.school_year_id]
        );

        const finalGrade = computeFinalGrade(term1, term2, term3);

        await dbClient.query(
            `
            INSERT INTO grade_records
            (
                class_record_id,
                lrn,
                term_1,
                term_2,
                term_3,
                final_grade
            )
            VALUES
            (
                $1, $2, $3, $4, $5, $6
            )
            `,
            [
                classRecordId,
                learner.lrn,
                term1?.term_grade ?? null,
                term2?.term_grade ?? null,
                term3?.term_grade ?? null,
                finalGrade,
            ]
        );

        persistedCount += 1;
    }

    return { persisted_count: persistedCount, skipped_no_lrn_count: skippedCount };
};

module.exports = {
    persistLearnerGradeRecords,
};
