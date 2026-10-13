const path = require("path");
const XLSX = require("xlsx");
const sf10Structure = require("../../utils/sf10Structure");
const { requiredSubjectKeysForGrade, SUBJECT_LABELS } = require("./subjects");

// ==========================================
// SF10 IMPORT (read an existing SF10-ES workbook)
// ==========================================
// Reads a learner's existing SF10-ES file - one EduCheck generated, or one a
// school filled in on the same official edition - and turns each filled
// Grade 1-6 block into the payload the historical-entry form sends. Nothing
// is saved here: the controller returns these years as a preview and the
// user confirms each one through the normal historical-entry save, so
// imported years get the same validation and audit log as typed ones.

const TEMPLATE_FILE = path.join(__dirname, "templates/sf10-es-revised-2025.xlsx");

let templateLabels = null;
const templateText = (sheetName, ref) => {
    if (!templateLabels) templateLabels = XLSX.readFile(TEMPLATE_FILE).Sheets;
    const value = templateLabels[sheetName]?.[ref]?.v;
    return typeof value === "string" ? value : null;
};

const clean = (value) => {
    if (value === undefined || value === null) return null;
    const text = String(value).trim();
    // A run of underscores is the form's printed blank line, not a value.
    return text === "" || /^_+$/.test(text) ? null : text;
};

const toRating = (value) => {
    const text = clean(value);
    if (text === null) return null;
    const number = Number(text);
    return Number.isFinite(number) ? Number(number.toFixed(2)) : NaN;
};

const normalizeSchoolYear = (value) => {
    const match = /(\d{4})\s*[-–—/]\s*(\d{4})/.exec(clean(value) || "");
    return match ? `${match[1]}-${match[2]}` : clean(value);
};

// Turns a printed label such as "District: ____ Division: ____" into a
// pattern that captures whatever was written over each blank line.
const labelPattern = (label) => {
    const parts = label.trim().split(/_{3,}/);
    const body = parts
        .map((part) => part.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s*"))
        .join("\\s*(.*?)\\s*");
    return new RegExp(`^\\s*${body}\\s*$`, "s");
};

const readHeader = (sheet, sheetName, header) => {
    const cell = (ref) => clean(sheet[ref]?.v);
    const values = {};

    if (header.mode === "cells") {
        ["school", "schoolId", "district", "division", "region", "classifiedGrade", "section", "schoolYear", "adviser"]
            .forEach((field) => {
                if (header[field]) values[field] = cell(header[field]);
            });
        return values;
    }

    // Back sheet: blanks are printed inside the label text.
    header.inline.forEach(({ cell: ref, fields }) => {
        const label = templateText(sheetName, ref);
        const written = sheet[ref]?.v;
        if (!label || typeof written !== "string") return;
        const match = labelPattern(label).exec(written);
        if (!match) return;
        fields.forEach((field, index) => {
            values[field] = clean(match[index + 1]);
        });
    });
    ["schoolId", "region", "schoolYear"].forEach((field) => {
        if (header[field]) values[field] = cell(header[field]);
    });
    return values;
};

// The block's rating columns are labelled T1-T3 when the year was graded in
// 3 terms (that is how EduCheck prints such a year); otherwise 1-4.
const detectScheme = (sheet, block) => {
    const firstSubjectRow = Math.min(...Object.values(block.subjectRows));
    const label = clean(sheet[`${block.columns.quarters[0]}${firstSubjectRow - 1}`]?.v);
    const title = clean(sheet[`${block.columns.quarters[0]}${firstSubjectRow - 2}`]?.v);
    return /^t/i.test(label || "") || /term/i.test(title || "") ? "TERM_3" : "QUARTER_4";
};

const readBlock = (workbook, block) => {
    const sheetName = sf10Structure.sheets[block.sheet];
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) return null;

    const gradeLevel = String(block.grade);
    const scheme = detectScheme(sheet, block);
    const ratingColumns = scheme === "TERM_3" ? block.columns.quarters.slice(0, 3) : block.columns.quarters;
    const issues = [];

    const subjects = [];
    Object.entries(block.subjectRows).forEach(([subjectKey, row]) => {
        const ratings = ratingColumns.map((column) => toRating(sheet[`${column}${row}`]?.v));
        const finalRating = toRating(sheet[`${block.columns.final}${row}`]?.v);
        const remarks = clean(sheet[`${block.columns.remarks}${row}`]?.v);
        if (ratings.every((r) => r === null) && finalRating === null) return;

        if ([...ratings, finalRating].some((r) => Number.isNaN(r))) {
            issues.push(`${SUBJECT_LABELS[subjectKey] ?? subjectKey}: a rating is not a number.`);
            return;
        }
        subjects.push({ subject_key: subjectKey, ratings, final_rating: finalRating, remarks });
    });

    const header = readHeader(sheet, sheetName, block.header);
    const schoolYear = normalizeSchoolYear(header.schoolYear);
    if (subjects.length === 0 && !schoolYear) return null; // block never filled in

    const generalAverage = toRating(sheet[`${block.columns.final}${block.generalAverageRow}`]?.v);
    if (Number.isNaN(generalAverage)) issues.push("The general average is not a number.");

    const expected = scheme === "TERM_3" ? 3 : 4;
    const present = new Set(subjects.map((s) => s.subject_key));
    const complete =
        requiredSubjectKeysForGrade(gradeLevel).every((key) => present.has(key)) &&
        subjects.every((s) => s.ratings.slice(0, expected).every((r) => r !== null));

    if (header.classifiedGrade && /\d/.test(header.classifiedGrade) && !header.classifiedGrade.includes(gradeLevel)) {
        issues.push(`The block is for Grade ${gradeLevel} but its header says "${header.classifiedGrade}".`);
    }

    return {
        school_year: schoolYear,
        grade_level: Number(gradeLevel),
        grading_scheme: scheme,
        record_status: complete ? "Complete" : "Partial",
        school_name: header.school ?? null,
        school_id: header.schoolId ?? null,
        district: header.district ?? null,
        division: header.division ?? null,
        region: header.region ?? null,
        section_name: header.section ?? null,
        adviser_name: header.adviser ?? null,
        general_average: Number.isNaN(generalAverage) ? null : generalAverage,
        subjects,
        issues,
    };
};

// Throws when the file is not an SF10-ES workbook of this edition.
const readSf10Workbook = (buffer) => {
    let workbook;
    try {
        workbook = XLSX.read(buffer);
    } catch {
        throw new Error("The file could not be read as an Excel workbook.");
    }

    const { front, back } = sf10Structure.sheets;
    if (!workbook.Sheets[front] || !workbook.Sheets[back]) {
        throw new Error(
            `This does not look like an SF10-ES file: it needs the "${front}" and "${back}" sheets of the official form.`
        );
    }

    const info = sf10Structure.personalInfo;
    const frontSheet = workbook.Sheets[front];
    const learner = {
        lrn: clean(frontSheet[info.lrn]?.v)?.replace(/\D/g, "") || null,
        last_name: clean(frontSheet[info.lastName]?.v),
        first_name: clean(frontSheet[info.firstName]?.v),
    };

    const years = sf10Structure.gradeBlocks
        .filter((block) => block.grade !== "spare" && block.subjectRows && block.header)
        .map((block) => readBlock(workbook, block))
        .filter(Boolean);

    return { learner, years };
};

module.exports = { readSf10Workbook, labelPattern, normalizeSchoolYear };
