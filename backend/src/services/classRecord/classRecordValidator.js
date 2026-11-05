const workbookStructure = require("../../utils/workbookStructure");

const TERM_CONFIG = [
    { key: "term1", label: "TERM1", summaryField: "term1_grade" },
    { key: "term2", label: "TERM2", summaryField: "term2_grade" },
    { key: "term3", label: "TERM3", summaryField: "term3_grade" },
];

const getRecordKey = (record) =>
    `${record.learner_number}|${record.learner_name.trim().toLowerCase()}`;

const isNumber = (value) =>
    typeof value === "number" && Number.isFinite(value);

const createIssue = ({
    code,
    severity = "error",
    learner,
    term = null,
    field = null,
    message,
}) => ({
    code,
    severity,
    learner_number: learner?.learner_number ?? null,
    learner_name: learner?.learner_name ?? null,
    term,
    field,
    message,
});

// The three score groups on a term sheet, in the order they appear.
const ASSESSMENTS = [
    { key: "written_oral", name: "Written/Oral", columns: workbookStructure.termColumns.writtenOral.scoreColumns },
    { key: "performance_tasks", name: "Performance Task", columns: workbookStructure.termColumns.performanceTasks.scoreColumns },
    { key: "summative", name: "Summative", columns: workbookStructure.termColumns.summative.scoreColumns },
];

const columnFor = (assessmentName, index) =>
    ASSESSMENTS.find((assessment) => assessment.name === assessmentName)?.columns[index] ?? null;

// "cell G14" when both are known, otherwise null so the caller can fall back.
const cellRef = (column, rowNumber) => (column && rowNumber ? `cell ${column}${rowNumber}` : null);

// Lists what makes a term incomplete: a blank score under a configured
// highest possible score, or a score group with no highest possible
// scores set at all (row 10). Mirrors classRecordParser's isAssessmentReady.
const describeMissingScores = (termRecord) => {
    const blanks = [];
    const unconfigured = [];

    ASSESSMENTS.forEach(({ key, name, columns }) => {
        const assessment = termRecord[key] || {};
        const scores = Array.isArray(assessment.scores) ? assessment.scores : [];
        const maximums = Array.isArray(assessment.highest_possible_scores) ? assessment.highest_possible_scores : [];
        const isSet = (value) => value !== null && value !== undefined;

        if (!maximums.some(isSet)) {
            unconfigured.push(name);
            return;
        }

        maximums.forEach((maximum, index) => {
            if (!isSet(maximum) || isSet(scores[index])) return;
            blanks.push(
                columns[index] && termRecord.row_number
                    ? `${name} ${index + 1} (${columns[index]}${termRecord.row_number})`
                    : `${name} ${index + 1}`
            );
        });
    });

    return { blanks, unconfigured };
};

const validateScoreRange = (learner, termLabel, assessmentName, assessment = {}, rowNumber = null) => {
    const issues = [];
    const scores = Array.isArray(assessment.scores) ? assessment.scores : [];
    const maximumScores = Array.isArray(assessment.highest_possible_scores)
        ? assessment.highest_possible_scores
        : [];

    scores.forEach((score, index) => {
        const maximum = maximumScores[index];

        if (score === null || score === undefined || maximum === null || maximum === undefined) {
            return;
        }

        if (!isNumber(score) || !isNumber(maximum) || score < 0 || score > maximum) {
            issues.push(
                createIssue({
                    code: "INVALID_SCORE_RANGE",
                    learner,
                    term: termLabel,
                    field: `${assessmentName}[${index + 1}]`,
                    message:
                        `${assessmentName} ${index + 1} score is ${score}, but the highest possible score is ${maximum}. ` +
                        `Correct ${cellRef(columnFor(assessmentName, index), rowNumber) || "the score"} in ${termLabel}, then upload again.`,
                })
            );
        }
    });

    return issues;
};

const validateTerm = (learner, termLabel, termRecord) => {
    const issues = [];

    if (!termRecord) {
        issues.push(
            createIssue({
                code: "MISSING_TERM_RECORD",
                learner,
                term: termLabel,
                message: `Not found in the ${termLabel} sheet. Make the name and list number match the INPUT sheet, then upload again.`,
            })
        );

        return issues;
    }

    if (!termRecord.calculation?.ready) {
        const { blanks, unconfigured } = describeMissingScores(termRecord);
        const parts = [];

        if (blanks.length > 0) {
            const plural = blanks.length > 1 ? "s" : "";
            parts.push(`Blank score${plural} in ${termLabel}: ${blanks.join(", ")}. Enter the missing score${plural}`);
        }

        if (unconfigured.length > 0) {
            parts.push(`${unconfigured.join(" and ")} in ${termLabel} has no highest possible scores (row 10). Enter them`);
        }

        issues.push(
            createIssue({
                code: "INCOMPLETE_TERM",
                learner,
                term: termLabel,
                message: parts.length > 0
                    ? `${parts.join(". ")}, then upload again.`
                    : `${termLabel} has missing scores. Enter every score, then upload again.`,
            })
        );
    }

    if (termRecord.calculation?.ready && !isNumber(termRecord.term_grade)) {
        issues.push(
            createIssue({
                code: "MISSING_TERM_GRADE",
                learner,
                term: termLabel,
                field: "term_grade",
                message:
                    `The ${termLabel} grade (${cellRef(workbookStructure.termColumns.grade.termGrade, termRecord.row_number) || "Quarterly Grade column"}) is blank or not a number. ` +
                    "Restore the grade formula, save the file in Excel, then upload again.",
            })
        );
    }

    issues.push(
        ...validateScoreRange(learner, termLabel, "Written/Oral", termRecord.written_oral, termRecord.row_number),
        ...validateScoreRange(learner, termLabel, "Performance Task", termRecord.performance_tasks, termRecord.row_number),
        ...validateScoreRange(learner, termLabel, "Summative", termRecord.summative, termRecord.row_number)
    );

    return issues;
};

const validateSummary = (learner, terms, summaryRecord) => {
    const issues = [];

    if (!summaryRecord) {
        issues.push(
            createIssue({
                code: "MISSING_SUMMARY_RECORD",
                learner,
                message: "Not found in the SUMMARY OF GRADES sheet. Make the name and list number match the INPUT sheet, then upload again.",
            })
        );

        return issues;
    }

    const readyTerms = TERM_CONFIG.every(
        ({ key }) => terms[key]?.calculation?.ready && isNumber(terms[key]?.term_grade)
    );

    if (!readyTerms) {
        return issues;
    }

    TERM_CONFIG.forEach(({ key, label, summaryField }) => {
        const termGrade = terms[key].term_grade;
        const summaryGrade = summaryRecord[summaryField];

        if (termGrade !== summaryGrade) {
            issues.push(
                createIssue({
                    code: "SUMMARY_TERM_MISMATCH",
                    learner,
                    term: label,
                    field: summaryField,
                    message:
                        `${label} computes ${termGrade}, but SUMMARY OF GRADES shows ${summaryGrade ?? "a blank"}` +
                        `${summaryRecord.row_number ? ` (cell ${workbookStructure.summary[`${key}Grade`]}${summaryRecord.row_number})` : ""}. ` +
                        `Make it match the ${label} grade, then upload again.`,
                })
            );
        }
    });

    const expectedFinalGrade = Math.round(
        TERM_CONFIG.reduce((total, { key }) => total + terms[key].term_grade, 0) /
        TERM_CONFIG.length
    );

    if (summaryRecord.final_grade !== expectedFinalGrade) {
        issues.push(
            createIssue({
                code: "FINAL_GRADE_MISMATCH",
                learner,
                field: "final_grade",
                message:
                    `Expected final grade is ${expectedFinalGrade} (average of the 3 term grades), but SUMMARY OF GRADES shows ${summaryRecord.final_grade ?? "a blank"}` +
                    `${summaryRecord.row_number ? ` (cell ${workbookStructure.summary.finalGrade}${summaryRecord.row_number})` : ""}. ` +
                    `Change it to ${expectedFinalGrade}, then upload again.`,
            })
        );
    }

    return issues;
};

// learner_number restarts at 1 for each gender section in the E-Class
// Record template (Male 1..N, then Female 1..M — see LEARNER_SECTIONS in
// classRecordParser.js), so a duplicate is only meaningful WITHIN one
// gender group: a Male #1 and a Female #1 existing together is normal,
// not a collision. A genuine duplicate (two rows in the same section
// accidentally given the same list number) is a real data-entry mistake
// in the source workbook — worth flagging even though it doesn't
// currently break anything downstream (term/summary matching keys off
// number + name together, so it wouldn't silently corrupt those lookups),
// because it signals the uploader mis-typed a list number and should fix
// it before this class list is trusted for anything position-based.
const validateLearnerNumberUniqueness = (learners) => {
    const issues = [];
    const namesByGenderAndNumber = new Map();

    learners.forEach((learner) => {
        const groupKey = `${learner.gender}|${learner.learner_number}`;

        if (!namesByGenderAndNumber.has(groupKey)) {
            namesByGenderAndNumber.set(groupKey, []);
        }

        namesByGenderAndNumber.get(groupKey).push(learner.learner_name);
    });

    namesByGenderAndNumber.forEach((names, groupKey) => {
        if (names.length <= 1) return;

        const [gender, learnerNumber] = groupKey.split("|");

        issues.push(
            createIssue({
                code: "DUPLICATE_LEARNER_NUMBER",
                severity: "error",
                message: `List number ${learnerNumber} (${gender}) is used by ${names.join(", ")}. Give each learner a different number in the INPUT sheet, then upload again.`,
            })
        );
    });

    return issues;
};

const validateClassRecord = (parsedRecord) => {

    const learners = Array.isArray(parsedRecord.learners)
        ? parsedRecord.learners
        : [];

    const workbookIssues = [];

    if (learners.length === 0) {
        workbookIssues.push(
            createIssue({
                code: "NO_LEARNERS_DETECTED",
                severity: "error",
                message: "No learners found in the INPUT sheet. Enter each learner's list number (column A) and name (column B), save the file in Excel, then upload again.",
            })
        );
    }

    const termCounts = [
        { key: "term1", label: "TERM1" },
        { key: "term2", label: "TERM2" },
        { key: "term3", label: "TERM3" },
    ];

    termCounts.forEach(({ key, label }) => {
        if (!Array.isArray(parsedRecord.terms?.[key]) || parsedRecord.terms[key].length === 0) {
            workbookIssues.push(
                createIssue({
                    code: "NO_TERM_RECORDS_DETECTED",
                    severity: "error",
                    term: label,
                    message: `No learners found in the ${label} sheet. Make sure its names are still linked to the INPUT sheet, save the file in Excel, then upload again.`,
                })
            );
        }
    });

    if (!Array.isArray(parsedRecord.summary) || parsedRecord.summary.length === 0) {
        workbookIssues.push(
            createIssue({
                code: "NO_SUMMARY_RECORDS_DETECTED",
                severity: "error",
                message: "No learners found in the SUMMARY OF GRADES sheet. Make sure its names are still linked to the INPUT sheet, save the file in Excel, then upload again.",
            })
        );
    }

    workbookIssues.push(...validateLearnerNumberUniqueness(learners));

    const termMaps = {
        term1: new Map(parsedRecord.terms.term1.map((record) => [getRecordKey(record), record])),
        term2: new Map(parsedRecord.terms.term2.map((record) => [getRecordKey(record), record])),
        term3: new Map(parsedRecord.terms.term3.map((record) => [getRecordKey(record), record])),
    };

    const summaryMap = new Map(
        parsedRecord.summary.map((record) => [getRecordKey(record), record])
    );

    const learnerResults = learners.map((learner) => {
        const key = getRecordKey(learner);

        const terms = {
            term1: termMaps.term1.get(key),
            term2: termMaps.term2.get(key),
            term3: termMaps.term3.get(key),
        };

        const summary = summaryMap.get(key);
        const issues = [
            ...validateTerm(learner, "TERM1", terms.term1),
            ...validateTerm(learner, "TERM2", terms.term2),
            ...validateTerm(learner, "TERM3", terms.term3),
            ...validateSummary(learner, terms, summary),
        ];

        return {
            learner_number: learner.learner_number,
            learner_name: learner.learner_name,
            ready_for_submission: !issues.some((issue) => issue.severity === "error"),
            issues,
        };
    });

    const parserIssues = (parsedRecord.validation.warnings || []).map((warning) =>
        createIssue({
            code: warning.type || "PARSER_WARNING",
            severity: warning.severity || "warning",
            learner: { learner_number: warning.learner_number ?? null, learner_name: warning.learner || "Unknown" },
            message: warning.message || `Parser warning from ${warning.source || "workbook"}.`,
        })
    );

    const allIssues = [
        ...workbookIssues,
        ...parserIssues,
        ...learnerResults.flatMap((learner) => learner.issues),
    ];
    const errorCount = allIssues.filter((issue) => issue.severity === "error").length;
    const warningCount = allIssues.filter((issue) => issue.severity === "warning").length;

    return {
        ready_for_submission: errorCount === 0,
        error_count: errorCount,
        warning_count: warningCount,
        issues: allIssues,
        learners: learnerResults,
    };
};

module.exports = {
    validateClassRecord,
};