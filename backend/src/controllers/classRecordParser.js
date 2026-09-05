const XLSX = require("xlsx");
const workbookStructure = require("../utils/workbookStructure");

const REQUIRED_SHEETS = [workbookStructure.sheets.input, workbookStructure.sheets.term1, workbookStructure.sheets.term2, workbookStructure.sheets.term3, workbookStructure.sheets.summary];

const isMeaningfulValue = (value) => value !== undefined && value !== null && String(value).trim() !== "";
const cleanValue = (value) => (isMeaningfulValue(value) ? value : null);
const getCellValue = (sheet, column, rowNumber) => cleanValue(sheet[`${column}${rowNumber}`]?.v);
const getRowLimit = (sheet) => XLSX.utils.decode_range(sheet["!ref"] || "A1:A1").e.r + 1;
const isPositiveInteger = (value) => Number.isInteger(Number(value)) && Number(value) > 0;

// Unfilled INPUT slots are linked into term sheets as cached numeric 0 values.
const isLearnerName = (value) => typeof value === "string" && /[A-Za-zÀ-ÖØ-öø-ÿ]/.test(value.trim());
const getRecordKey = (record) => `${record.learner_number}|${record.learner_name.trim().toLowerCase()}`;

const readAssessment = (sheet, rowNumber, structure) => ({
    scores: structure.scoreColumns.map((column) => getCellValue(sheet, column, rowNumber)),
    highest_possible_scores: structure.scoreColumns.map((column) => getCellValue(sheet, column, 10)),
    total: getCellValue(sheet, structure.total, rowNumber),
    percentage_score: getCellValue(sheet, structure.percentageScore, rowNumber),
    weighted_score: getCellValue(sheet, structure.weightedScore, rowNumber),
});

const isAssessmentReady = (sheet, rowNumber, structure) => {
    const configured = structure.scoreColumns.filter((column) => isMeaningfulValue(getCellValue(sheet, column, 10)));
    return configured.length > 0 && configured.every((column) => isMeaningfulValue(getCellValue(sheet, column, rowNumber)));
};

const validateWorkbookStructure = (workbook) => {
    if (!workbook || !Array.isArray(workbook.SheetNames)) {
        throw new Error("Invalid Excel workbook.");
    }

    const missingSheets = REQUIRED_SHEETS.filter((sheetName) => !workbook.SheetNames.includes(sheetName));
    if (missingSheets.length > 0) {
        throw new Error(`Required worksheet(s) missing: ${missingSheets.join(", ")}`);
    }

    return true;
};

const extractLearners = (workbook) => {
    const sheet = workbook.Sheets[workbookStructure.sheets.input];
    const learners = [];
    const sections = [
        { gender: "Male", startRow: 12, endRow: 61 },
        { gender: "Female", startRow: 63, endRow: 112 },
    ];

    sections.forEach(({ gender, startRow, endRow }) => {
        for (let rowNumber = startRow; rowNumber <= endRow; rowNumber++) {
            const learnerNumber = getCellValue(sheet, workbookStructure.learner.numberColumn, rowNumber);
            const learnerName = getCellValue(sheet, workbookStructure.learner.nameColumn, rowNumber);
            if (!isPositiveInteger(learnerNumber) || !isLearnerName(learnerName)) continue;

            learners.push({ learner_number: Number(learnerNumber), learner_name: learnerName.trim(), gender });
        }
    });

    return learners;
};

const extractTermData = (workbook, sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const termRecords = [];

    for (let rowNumber = 1; rowNumber <= getRowLimit(sheet); rowNumber++) {
        const learnerNumber = getCellValue(sheet, workbookStructure.learner.numberColumn, rowNumber);
        const learnerName = getCellValue(sheet, workbookStructure.learner.nameColumn, rowNumber);
        // Excludes titles, gender labels, statistic rows, and unfilled template slots.
        if (!isPositiveInteger(learnerNumber) || !isLearnerName(learnerName)) continue;

        const writtenOral = readAssessment(sheet, rowNumber, workbookStructure.termColumns.writtenOral);
        const performanceTasks = readAssessment(sheet, rowNumber, workbookStructure.termColumns.performanceTasks);
        const summativeAssessment = readAssessment(sheet, rowNumber, workbookStructure.termColumns.summative);
        const summative = {
            scores: summativeAssessment.scores,
            highest_possible_scores: summativeAssessment.highest_possible_scores,
            st1: summativeAssessment.scores[0],
            st2: summativeAssessment.scores[1],
            te: summativeAssessment.scores[2],
            total: summativeAssessment.total,
            percentage_score: summativeAssessment.percentage_score,
            weighted_score: summativeAssessment.weighted_score,
        };

        // Completeness uses score configuration (row 10) and entered scores,
        // never cached formula outputs such as the template default grade of 60.
        const inputsComplete = [
            workbookStructure.termColumns.writtenOral,
            workbookStructure.termColumns.performanceTasks,
            workbookStructure.termColumns.summative,
        ].every((structure) => isAssessmentReady(sheet, rowNumber, structure));
        const formulaCache = {
            initial_grade: getCellValue(sheet, workbookStructure.termColumns.grade.initialGrade, rowNumber),
            term_grade: getCellValue(sheet, workbookStructure.termColumns.grade.termGrade, rowNumber),
            descriptor: getCellValue(sheet, workbookStructure.termColumns.grade.descriptor, rowNumber),
        };

        termRecords.push({
            learner_number: Number(learnerNumber),
            learner_name: learnerName.trim(),
            written_oral: writtenOral,
            performance_tasks: performanceTasks,
            summative,
            // Semantic grades stay null until every configured score is present.
            initial_grade: inputsComplete ? formulaCache.initial_grade : null,
            term_grade: inputsComplete ? formulaCache.term_grade : null,
            descriptor: inputsComplete ? formulaCache.descriptor : null,
            calculation: { ready: inputsComplete, source: "assessment-inputs" },
            // Diagnostic-only: callers must not validate or submit from this cache.
            formula_cache: formulaCache,
        });
    }

    return termRecords;
};

const extractSummary = (workbook) => {
    const sheet = workbook.Sheets[workbookStructure.sheets.summary];
    if (!sheet) return [];

    const summaryRecords = [];
    for (let rowNumber = 1; rowNumber <= getRowLimit(sheet); rowNumber++) {
        const learnerNumber = getCellValue(sheet, workbookStructure.summary.learnerNumber, rowNumber);
        const learnerName = getCellValue(sheet, workbookStructure.summary.learnerName, rowNumber);
        if (!isPositiveInteger(learnerNumber) || !isLearnerName(learnerName)) continue;

        summaryRecords.push({
            learner_number: Number(learnerNumber),
            learner_name: learnerName.trim(),
            term1_grade: getCellValue(sheet, workbookStructure.summary.term1Grade, rowNumber),
            term2_grade: getCellValue(sheet, workbookStructure.summary.term2Grade, rowNumber),
            term3_grade: getCellValue(sheet, workbookStructure.summary.term3Grade, rowNumber),
            final_grade: getCellValue(sheet, workbookStructure.summary.finalGrade, rowNumber),
            descriptor: getCellValue(sheet, workbookStructure.summary.descriptor, rowNumber),
            remark: getCellValue(sheet, workbookStructure.summary.remark, rowNumber),
            reference_only: true,
        });
    }

    return summaryRecords;
};

const crossCheckLearners = (learners, term1, term2, term3, summary) => {
    const learnerKeys = new Set(learners.map(getRecordKey));
    const warnings = [];
    const checkRecords = (records, source) => records.forEach((record) => {
        if (!learnerKeys.has(getRecordKey(record))) {
            warnings.push({ type: "LEARNER_MISMATCH", source, learner: record.learner_name });
        }
    });

    checkRecords(term1, workbookStructure.sheets.term1);
    checkRecords(term2, workbookStructure.sheets.term2);
    checkRecords(term3, workbookStructure.sheets.term3);
    checkRecords(summary, workbookStructure.sheets.summary);
    return warnings;
};

const parseClassRecord = (filePath) => {
    const workbook = XLSX.readFile(filePath);
    validateWorkbookStructure(workbook);

    const learners = extractLearners(workbook);
    const term1 = extractTermData(workbook, workbookStructure.sheets.term1);
    const term2 = extractTermData(workbook, workbookStructure.sheets.term2);
    const term3 = extractTermData(workbook, workbookStructure.sheets.term3);
    const summary = extractSummary(workbook);
    const warnings = crossCheckLearners(learners, term1, term2, term3, summary);

    return {
        workbook: { sheet_count: workbook.SheetNames.length, sheet_names: workbook.SheetNames },
        learners,
        terms: { term1, term2, term3 },
        summary,
        validation: {
            learner_count: learners.length, term1_count: term1.length, term2_count: term2.length,
            term3_count: term3.length, summary_count: summary.length, warnings,
        },
    };
};

module.exports = {
    parseClassRecord,
    validateWorkbookStructure,
    extractLearners,
    extractTermData,
    extractSummary,
    crossCheckLearners,
};
