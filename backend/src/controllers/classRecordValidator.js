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

const validateScoreRange = (learner, termLabel, assessmentName, assessment = {}) => {
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
                    message: `${assessmentName} score ${score} must be between 0 and ${maximum}.`,
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
                message: `${termLabel} record is missing for this learner.`,
            })
        );

        return issues;
    }

    if (!termRecord.calculation?.ready) {
        issues.push(
            createIssue({
                code: "INCOMPLETE_TERM",
                learner,
                term: termLabel,
                message: `${termLabel} is incomplete because one or more required assessment scores are missing.`,
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
                message: `${termLabel} is marked complete but has no valid term grade.`,
            })
        );
    }

    issues.push(
        ...validateScoreRange(learner, termLabel, "Written/Oral", termRecord.written_oral),
        ...validateScoreRange(learner, termLabel, "Performance Task", termRecord.performance_tasks),
        ...validateScoreRange(learner, termLabel, "Summative", termRecord.summative)
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
                message: "Summary of Grades record is missing for this learner.",
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
                    message: `${label} grade is ${termGrade}, but Summary of Grades shows ${summaryGrade}.`,
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
                message: `Expected final grade is ${expectedFinalGrade}, but Summary of Grades shows ${summaryRecord.final_grade}.`,
            })
        );
    }

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
                message: "No learners were extracted from the workbook. The workbook may use an unsupported structure or contain unresolved formula values.",
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
                    message: `No learner records were extracted from ${label}.`,
                })
            );
        }
    });

    if (!Array.isArray(parsedRecord.summary) || parsedRecord.summary.length === 0) {
        workbookIssues.push(
            createIssue({
                code: "NO_SUMMARY_RECORDS_DETECTED",
                severity: "error",
                message: "No learner records were extracted from Summary of Grades.",
            })
        );
    }
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
            learner: { learner_number: null, learner_name: warning.learner || "Unknown" },
            message: `Parser warning from ${warning.source || "workbook"}.`,
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