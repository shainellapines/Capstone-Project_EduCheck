const { describe, it, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { buildEcr, lrnGenerator, removeRunDir } = require("./helpers/env");
const { parseClassRecord } = require("../src/services/classRecord/classRecordParser");
const { validateClassRecord } = require("../src/services/classRecord/classRecordValidator");
const { compareHeader, checkHeaderSubject, checkGradeLevel } = require("../src/services/classRecord/rosterCheck");

// Parser / validator / integrity helpers (EPIC-02, EPIC-04) - no server or DB.
describe("e-Class Record parser, validator and integrity helpers", () => {
    const files = [];
    const make = (opts) => buildEcr(opts);
    after(() => {
        files.forEach((f) => fs.existsSync(f) && fs.unlinkSync(f));
        removeRunDir();
    });

    it("PRS-01 reads 100 learners and the INPUT header", () => {
        // buildEcr blanks the subject cell unless asked, so name it here.
        const { file } = make({ lrnFor: lrnGenerator("9999"), header: { subject: "English" } });
        const parsed = parseClassRecord(file);
        assert.equal(parsed.learners.length, 100);
        assert.equal(parsed.header.grade_section, "Grade 4 - Mabini");
        assert.equal(parsed.header.subject, "English");
        assert.equal(parsed.header.school_year, "2026-2027");
        assert.match(parsed.learners[0].lrn, /^\d{12}$/);
    });

    it("PRS-02 a workbook without an LRN sheet warns and yields null LRNs", () => {
        const XLSX = require("xlsx");
        const path = require("path");
        const parsed = parseClassRecord(path.join(__dirname, "fixtures/ecr-sample.xlsx"));
        assert.ok(parsed.learners.every((l) => l.lrn === null));
        assert.ok(parsed.validation.warnings.some((w) => w.type === "LRN_SHEET_MISSING"));
        assert.ok(XLSX);
    });

    it("PRS-03 a short / duplicated LRN is flagged", () => {
        const { file } = make({ lrnFor: (i) => (i === 0 ? "123" : i === 1 ? "999900000099" : "999900000099") , limit: 3 });
        const parsed = parseClassRecord(file);
        const types = parsed.validation.warnings.map((w) => w.type);
        assert.ok(types.includes("INVALID_LRN_FORMAT") || types.includes("DUPLICATE_LRN"), types.join());
    });

    it("VAL-01 the clean sample validates as ready for submission", () => {
        const { file } = make({ lrnFor: lrnGenerator("9999") });
        const result = validateClassRecord(parseClassRecord(file));
        assert.equal(result.ready_for_submission, true);
        assert.equal(result.error_count, 0);
    });

    it("VAL-02 a non-workbook is rejected by the parser", () => {
        const os = require("os");
        const path = require("path");
        const bad = path.join(os.tmpdir(), `bad-${Date.now()}.xlsx`);
        fs.writeFileSync(bad, "garbage");
        files.push(bad);
        assert.throws(() => parseClassRecord(bad));
    });

    it("INT-H1 compareHeader is case/space-insensitive and tolerant of subject abbreviations", () => {
        const warnings = compareHeader({
            header: { grade_section: "GRADE 4  -  mabini", subject: "english", school_year: " 2026-2027 " },
            section: { section_name: "Mabini", grade_level: "4" },
            subject: { subject_name: "English" },
            schoolYear: { school_year: "2026-2027" },
        });
        assert.deepEqual(warnings, []);
    });

    it("INT-H3 checkHeaderSubject accepts the selected subject under its common names", () => {
        const accepted = [
            ["Mathematics", "MATHEMATICS 6"],
            ["Mathematics", "Math - Grade 6"],
            ["Araling Panlipunan", "AP"],
            ["ESP", "EsP"],
            ["ESP", "Edukasyon sa Pagpapakatao"],
            ["ESP", "GMRC"],
            ["GMRC", "Values Education"],
            ["TLE", "TLE/EPP"],
            ["EPP", "TLE"],
            ["MAPEH", "Music"],
            ["Science", "Sci"],
        ];
        for (const [subjectName, headerSubject] of accepted) {
            assert.equal(
                checkHeaderSubject({ header: { subject: headerSubject }, subject: { subject_name: subjectName } }),
                null,
                `"${headerSubject}" should be accepted for ${subjectName}`
            );
        }
    });

    it("INT-H4 checkHeaderSubject refuses another subject, but not a blank or unknown label", () => {
        const refusal = checkHeaderSubject({ header: { subject: "English" }, subject: { subject_name: "Mathematics" } });
        assert.equal(refusal.status, 409);
        assert.equal(refusal.code, "HEADER_SUBJECT_MISMATCH");
        // "pe" is a MAPEH alias but must not match inside another word.
        assert.ok(checkHeaderSubject({ header: { subject: "Filipino" }, subject: { subject_name: "Science" } }));
        assert.equal(checkHeaderSubject({ header: { subject: "" }, subject: { subject_name: "Mathematics" } }), null);
        assert.equal(checkHeaderSubject({ header: { subject: "Homeroom" }, subject: { subject_name: "Mathematics" } }), null);
        assert.equal(checkHeaderSubject({ header: null, subject: { subject_name: "Mathematics" } }), null);
    });

    it("INT-H2 checkGradeLevel flags a mismatch and passes a match", () => {
        assert.ok(
            checkGradeLevel({
                subject: { subject_name: "English", grade_level: "5" },
                section: { section_name: "Mabini", grade_level: "4" },
            })
        );
        assert.equal(
            checkGradeLevel({
                subject: { subject_name: "English", grade_level: "4" },
                section: { section_name: "Mabini", grade_level: "4" },
            }),
            null
        );
    });
});
