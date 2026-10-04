const path = require("path");
const sf10Structure = require("../../utils/sf10Structure");
const { loadTemplate } = require("./xlsxTemplate");
const { gradeBlockFor, subjectKeysForGrade, SUBJECT_LABELS } = require("./subjects");
const { buildCumulativeRecord, evaluateReadiness } = require("./cumulativeRecord");

// ==========================================
// TEMPLATE REGISTRY
// ==========================================
// Each adapter maps the canonical cumulative record onto one official
// SF10-ES edition and declares which grading schemes that edition prints.
// When DepEd releases a 3-term SF10, add an adapter declaring TERM_3 and
// make it the active one - nothing else changes.

const formatBirthdate = (value) => {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    const pad = (n) => String(n).padStart(2, "0");
    // DATE columns come back as local midnight - read local parts.
    return `${pad(date.getMonth() + 1)}/${pad(date.getDate())}/${date.getFullYear()}`;
};

// Replaces each run of 3+ underscores in a printed label ("School: ______")
// with the next value, leaving the run in place when that value is blank.
const fillUnderscores = (labelText, values) => {
    let index = 0;
    return labelText.replace(/_{3,}/g, (run) => {
        const value = values[index++];
        return value === null || value === undefined || value === "" ? run : String(value);
    });
};

const writeHeader = (template, sheetName, header, year) => {
    const values = {
        school: year.school?.school_name,
        schoolId: year.school?.school_id,
        district: year.school?.district,
        division: year.school?.division,
        region: year.school?.region,
        classifiedGrade: year.grade_level,
        section: year.section_name,
        schoolYear: year.school_year,
        adviser: year.adviser_name,
    };

    if (header.mode === "cells") {
        Object.entries(values).forEach(([field, value]) => {
            if (header[field]) template.set(sheetName, header[field], value);
        });
        return;
    }

    // inline mode (Back sheet): fields printed inside the label text.
    header.inline.forEach(({ cell, fields }) => {
        const label = template.getText(sheetName, cell);
        if (!label) return;
        const filled = fillUnderscores(label, fields.map((field) => values[field]));
        if (filled !== label) template.set(sheetName, cell, filled);
    });
    ["schoolId", "region", "schoolYear"].forEach((field) => {
        if (header[field]) template.set(sheetName, header[field], values[field]);
    });
};

const quarter4Adapter = {
    id: "sf10-es-revised-2025",
    name: "SF10-ES (Revised 2025, DO 10 s. 2024) - Quarters 1-4",
    file: path.join(__dirname, "templates/sf10-es-revised-2025.xlsx"),
    supportedSchemes: ["QUARTER_4"],

    fill: async (record, readiness) => {
        const template = await loadTemplate(quarter4Adapter.file);
        const front = sf10Structure.sheets.front;
        const info = sf10Structure.personalInfo;
        const { learner } = record;

        template.set(front, info.lastName, learner.last_name);
        template.set(front, info.firstName, learner.first_name);
        template.set(front, info.nameExtension, learner.name_extension);
        template.set(front, info.middleName, learner.middle_name);
        template.set(front, info.lrn, learner.lrn);
        template.set(front, info.birthdate, formatBirthdate(learner.birth_date));
        template.set(front, info.sex, learner.sex);

        readiness._blocks
            .filter((block) => block.status === "Complete" || block.status === "Partial")
            .forEach(({ grade_level: gradeLevel, year }) => {
                const block = gradeBlockFor(gradeLevel);
                const sheetName = sf10Structure.sheets[block.sheet];

                writeHeader(template, sheetName, block.header, year);

                year.subjects.forEach((subject) => {
                    const row = block.subjectRows[subject.subject_key];
                    if (!row) return;

                    block.columns.quarters.forEach((column, index) =>
                        template.set(sheetName, `${column}${row}`, subject.ratings[index])
                    );
                    template.set(sheetName, `${block.columns.final}${row}`, subject.final_rating);
                    template.set(sheetName, `${block.columns.remarks}${row}`, subject.remarks);
                });

                template.set(sheetName, `${block.columns.final}${block.generalAverageRow}`, year.general_average);
            });

        return template.toBuffer();
    },
};

const TEMPLATES = [quarter4Adapter];
const ACTIVE_TEMPLATE = quarter4Adapter;

const previewSf10 = async (lrn, adapter = ACTIVE_TEMPLATE) => {
    const record = await buildCumulativeRecord(lrn);
    if (!record) return null;

    const readiness = evaluateReadiness(record, adapter.supportedSchemes);
    const { _blocks, ...publicReadiness } = readiness;

    // Learning areas the form prints per grade, so the entry grid offers
    // exactly the rows that exist on the SF10.
    const subjectCatalog = Object.fromEntries(
        ["1", "2", "3", "4", "5", "6"].map((grade) => [
            grade,
            subjectKeysForGrade(grade).map((key) => ({ key, label: SUBJECT_LABELS[key] ?? key })),
        ])
    );

    return {
        template: {
            id: adapter.id,
            name: adapter.name,
            supported_schemes: adapter.supportedSchemes,
            subject_catalog: subjectCatalog,
        },
        record,
        readiness: publicReadiness,
        _internal: readiness,
    };
};

const generateSf10 = async (lrn, adapter = ACTIVE_TEMPLATE) => {
    const preview = await previewSf10(lrn, adapter);
    if (!preview) return null;

    const buffer = await adapter.fill(preview.record, preview._internal);
    const { learner } = preview.record;
    const safeName = `${learner.last_name}_${learner.first_name}`.replace(/[^A-Za-z0-9_-]+/g, "_");

    return {
        buffer,
        filename: `SF10-ES_${learner.lrn}_${safeName}.xlsx`,
        readiness: preview.readiness,
    };
};

module.exports = { TEMPLATES, ACTIVE_TEMPLATE, previewSf10, generateSf10, fillUnderscores, formatBirthdate };
