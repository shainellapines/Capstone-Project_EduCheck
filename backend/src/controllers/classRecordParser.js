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

// DepEd Learner Reference Numbers are always 12 digits.
const LRN_PATTERN = /^\d{12}$/;
const isValidLrn = (value) => typeof value === "string" && LRN_PATTERN.test(value.trim());

// Same row ranges as INPUT's learner sections, so the LRN sheet lines up
// with the class list by position as well as by name.
const LEARNER_SECTIONS = [
    { gender: "Male", startRow: 12, endRow: 61 },
    { gender: "Female", startRow: 63, endRow: 112 },
];

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

// Reads the optional LRN sheet (see workbookStructure.sheets.lrn). Returns
// null when the sheet is absent so callers can distinguish "not filled in
// yet" from "filled in with blanks" and warn accordingly.
const extractLrnRoster = (workbook) => {
    const sheet = workbook.Sheets[workbookStructure.sheets.lrn];
    if (!sheet) return null;

    const roster = [];

    LEARNER_SECTIONS.forEach(({ startRow, endRow }) => {
        for (let rowNumber = startRow; rowNumber <= endRow; rowNumber++) {
            const learnerNumber = getCellValue(sheet, workbookStructure.lrnSheet.numberColumn, rowNumber);
            const learnerName = getCellValue(sheet, workbookStructure.lrnSheet.nameColumn, rowNumber);
            if (!isPositiveInteger(learnerNumber) || !isLearnerName(learnerName)) continue;

            const lrnRaw = getCellValue(sheet, workbookStructure.lrnSheet.lrnColumn, rowNumber);

            roster.push({
                learner_number: Number(learnerNumber),
                learner_name: learnerName.trim(),
                lrn: isMeaningfulValue(lrnRaw) ? String(lrnRaw).trim() : null,
            });
        }
    });

    return roster;
};

const extractLearners = (workbook) => {
    const sheet = workbook.Sheets[workbookStructure.sheets.input];
    const lrnRoster = extractLrnRoster(workbook);
    const lrnByKey = new Map((lrnRoster || []).map((entry) => [getRecordKey(entry), entry.lrn]));
    const learners = [];

    LEARNER_SECTIONS.forEach(({ gender, startRow, endRow }) => {
        for (let rowNumber = startRow; rowNumber <= endRow; rowNumber++) {
            const learnerNumber = getCellValue(sheet, workbookStructure.learner.numberColumn, rowNumber);
            const learnerName = getCellValue(sheet, workbookStructure.learner.nameColumn, rowNumber);
            if (!isPositiveInteger(learnerNumber) || !isLearnerName(learnerName)) continue;

            const trimmedName = learnerName.trim();
            const key = getRecordKey({ learner_number: Number(learnerNumber), learner_name: trimmedName });

            learners.push({
                learner_number: Number(learnerNumber),
                learner_name: trimmedName,
                gender,
                // null when the LRN sheet is missing, blank for this learner,
                // or matched but not a valid 12-digit LRN (see checkLrnIssues).
                lrn: lrnByKey.get(key) ?? null,
            });
        }
    });

    return learners;
};

// Flags LRN problems as warnings (not errors) — consolidation across
// subjects doesn't exist yet, so a missing/invalid LRN shouldn't block
// today's per-subject validation, only surface as something to fix before
// that feature needs it.
const checkLrnIssues = (learners, hasLrnSheet) => {
    if (!hasLrnSheet) {
        return [{
            type: "LRN_SHEET_MISSING",
            message: "This workbook has no LRN sheet, so learners cannot yet be matched across subjects for consolidation. Add an LRN sheet listing each learner's name and 12-digit LRN.",
        }];
    }

    const warnings = [];
    const seenLrns = new Map();

    learners.forEach((learner) => {
        if (!isMeaningfulValue(learner.lrn)) {
            warnings.push({
                type: "MISSING_LRN",
                learner: learner.learner_name,
                learner_number: learner.learner_number,
                message: `${learner.learner_name} has no LRN recorded in the LRN sheet.`,
            });
            return;
        }

        if (!isValidLrn(learner.lrn)) {
            warnings.push({
                type: "INVALID_LRN_FORMAT",
                learner: learner.learner_name,
                learner_number: learner.learner_number,
                message: `${learner.learner_name}'s LRN "${learner.lrn}" must be exactly 12 digits.`,
            });
            return;
        }

        if (seenLrns.has(learner.lrn)) {
            warnings.push({
                type: "DUPLICATE_LRN",
                learner: learner.learner_name,
                learner_number: learner.learner_number,
                message: `LRN "${learner.lrn}" is used by both ${seenLrns.get(learner.lrn)} and ${learner.learner_name}.`,
            });
        } else {
            seenLrns.set(learner.lrn, learner.learner_name);
        }
    });

    return warnings;
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
    const hasLrnSheet = workbook.SheetNames.includes(workbookStructure.sheets.lrn);
    const lrnWarnings = checkLrnIssues(learners, hasLrnSheet);

    return {
        workbook: {
            sheet_count: workbook.SheetNames.length,
            sheet_names: workbook.SheetNames,
            has_lrn_sheet: hasLrnSheet,
        },
        learners,
        terms: { term1, term2, term3 },
        summary,
        validation: {
            learner_count: learners.length, term1_count: term1.length, term2_count: term2.length,
            term3_count: term3.length, summary_count: summary.length, warnings: [...warnings, ...lrnWarnings],
        },
    };
};

module.exports = {
    parseClassRecord,
    validateWorkbookStructure,
    extractLearners,
    extractLrnRoster,
    extractTermData,
    extractSummary,
    crossCheckLearners,
    checkLrnIssues,
    isValidLrn,
    getRecordKey,
};
