const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { validateClassRecord } = require("../src/services/classRecord/classRecordValidator");

// White-box tests: each case is designed from a decision (branch) in
// classRecordValidator.js, using a hand-built parsed record so one path is
// exercised at a time. The line numbers name the branch under test.

const learner = (number, name, gender = "Male") => ({ learner_number: number, learner_name: name, gender });

const assessment = (scores, highest) => ({ scores, highest_possible_scores: highest });

const term = (who, grade, overrides = {}) => ({
    learner_number: who.learner_number,
    learner_name: who.learner_name,
    calculation: { ready: true },
    term_grade: grade,
    written_oral: assessment([18, 19], [20, 20]),
    performance_tasks: assessment([45], [50]),
    summative: assessment([28], [30]),
    ...overrides,
});

const summary = (who, grades, finalGrade) => ({
    learner_number: who.learner_number,
    learner_name: who.learner_name,
    term1_grade: grades[0],
    term2_grade: grades[1],
    term3_grade: grades[2],
    final_grade: finalGrade,
});

// A clean record for one learner, with parts that each test can replace.
const record = ({
    learners = [learner(1, "Cruz, Ana")],
    grades = [85, 86, 86],
    finalGrade = 86,
    termOverrides = {},
    summaries,
    warnings = [],
} = {}) => {
    const [t1, t2, t3] = ["term1", "term2", "term3"].map((key, i) =>
        learners.map((who) => term(who, grades[i], termOverrides[key] || {})));
    return {
        learners,
        terms: { term1: t1, term2: t2, term3: t3 },
        summary: summaries ?? learners.map((who) => summary(who, grades, finalGrade)),
        validation: { warnings },
    };
};

const codes = (result) => result.issues.map((issue) => issue.code);

describe("White box: classRecordValidator decision paths", () => {
    it("WB-01 a complete, consistent record has no issues and is ready (main path)", () => {
        const result = validateClassRecord(record());
        assert.deepEqual(codes(result), []);
        assert.equal(result.ready_for_submission, true);
        assert.equal(result.learners[0].ready_for_submission, true);
    });

    it("WB-02 a score above the highest possible score is flagged (line 44: score > maximum)", () => {
        const result = validateClassRecord(record({ termOverrides: { term2: { written_oral: assessment([21, 19], [20, 20]) } } }));
        const issue = result.issues.find((i) => i.code === "INVALID_SCORE_RANGE");
        assert.ok(issue);
        assert.equal(issue.term, "TERM2");
        assert.equal(issue.field, "Written/Oral[1]");
        assert.equal(result.ready_for_submission, false);
    });

    it("WB-03 a negative score is flagged (line 44: score < 0)", () => {
        const result = validateClassRecord(record({ termOverrides: { term1: { summative: assessment([-1], [30]) } } }));
        assert.deepEqual(codes(result), ["INVALID_SCORE_RANGE"]);
        assert.equal(result.issues[0].field, "Summative[1]");
    });

    it("WB-04 a non-numeric score is flagged (line 44: !isNumber(score))", () => {
        const result = validateClassRecord(record({ termOverrides: { term3: { performance_tasks: assessment(["abc"], [50]) } } }));
        assert.deepEqual(codes(result), ["INVALID_SCORE_RANGE"]);
        assert.equal(result.issues[0].field, "Performance Task[1]");
    });

    it("WB-05 a blank score or blank highest score is skipped, not flagged (line 40)", () => {
        const result = validateClassRecord(record({ termOverrides: { term1: { written_oral: assessment([null, 19], [20, null]) } } }));
        assert.deepEqual(codes(result), []);
    });

    it("WB-06 a score equal to the highest possible score is accepted (boundary of line 44)", () => {
        const result = validateClassRecord(record({ termOverrides: { term1: { written_oral: assessment([20, 0], [20, 20]) } } }));
        assert.deepEqual(codes(result), []);
    });

    it("WB-07 an assessment without a score list is treated as empty (line 32)", () => {
        const result = validateClassRecord(record({ termOverrides: { term1: { summative: {} } } }));
        assert.deepEqual(codes(result), []);
    });

    it("WB-08 a learner missing from a term sheet is flagged (line 63)", () => {
        const base = record();
        base.terms.term3 = [term(learner(2, "Other, Learner"), 85)];
        const result = validateClassRecord(base);
        assert.ok(codes(result).includes("MISSING_TERM_RECORD"));
        assert.equal(result.issues.find((i) => i.code === "MISSING_TERM_RECORD").term, "TERM3");
    });

    it("WB-09 a term with missing assessment scores is incomplete (line 76)", () => {
        const result = validateClassRecord(record({ termOverrides: { term2: { calculation: { ready: false } } } }));
        assert.ok(codes(result).includes("INCOMPLETE_TERM"));
        assert.equal(result.ready_for_submission, false);
    });

    it("WB-10 a term marked complete without a valid term grade is flagged (line 87)", () => {
        const result = validateClassRecord(record({ termOverrides: { term1: { term_grade: null } } }));
        assert.ok(codes(result).includes("MISSING_TERM_GRADE"));
    });

    it("WB-11 a learner missing from the Summary of Grades is flagged (line 111)", () => {
        const result = validateClassRecord(record({ summaries: [summary(learner(2, "Other, Learner"), [85, 86, 86], 86)] }));
        assert.ok(codes(result).includes("MISSING_SUMMARY_RECORD"));
    });

    it("WB-12 summary checks are skipped while a term is not ready (line 127)", () => {
        const result = validateClassRecord(record({
            termOverrides: { term2: { calculation: { ready: false } } },
            summaries: [summary(learner(1, "Cruz, Ana"), [99, 99, 99], 99)],
        }));
        assert.deepEqual(codes(result), ["INCOMPLETE_TERM"]);
    });

    it("WB-13 a Summary of Grades term grade that differs from the term sheet is flagged (line 135)", () => {
        const result = validateClassRecord(record({ summaries: [summary(learner(1, "Cruz, Ana"), [85, 90, 86], 86)] }));
        const issue = result.issues.find((i) => i.code === "SUMMARY_TERM_MISMATCH");
        assert.ok(issue);
        assert.equal(issue.term, "TERM2");
        assert.equal(issue.field, "term2_grade");
    });

    it("WB-14 a final grade that is not the rounded average of the terms is flagged (line 153)", () => {
        const result = validateClassRecord(record({ finalGrade: 85 }));
        assert.deepEqual(codes(result), ["FINAL_GRADE_MISMATCH"]);
        assert.match(result.issues[0].message, /Expected final grade is 86/);
    });

    it("WB-15 the final grade is rounded: (85 + 86 + 86) / 3 = 85.67 -> 86 is accepted (line 148)", () => {
        const result = validateClassRecord(record({ grades: [85, 86, 86], finalGrade: 86 }));
        assert.deepEqual(codes(result), []);
    });

    it("WB-16 the same list number twice in one gender group is a duplicate (line 193)", () => {
        const result = validateClassRecord(record({ learners: [learner(1, "Cruz, Ana"), learner(1, "Reyes, Ben")] }));
        assert.ok(codes(result).includes("DUPLICATE_LEARNER_NUMBER"));
    });

    it("WB-17 the same list number in the Male and Female groups is not a duplicate (line 183)", () => {
        const result = validateClassRecord(record({ learners: [learner(1, "Cruz, Ana", "Female"), learner(1, "Reyes, Ben", "Male")] }));
        assert.ok(!codes(result).includes("DUPLICATE_LEARNER_NUMBER"));
    });

    it("WB-18 a workbook with no learners is flagged (line 217)", () => {
        const result = validateClassRecord(record({ learners: [] }));
        assert.ok(codes(result).includes("NO_LEARNERS_DETECTED"));
        assert.equal(result.ready_for_submission, false);
    });

    it("WB-19 a term sheet with no records is flagged per term (line 234)", () => {
        const base = record();
        base.terms.term2 = [];
        const result = validateClassRecord(base);
        const issue = result.issues.find((i) => i.code === "NO_TERM_RECORDS_DETECTED");
        assert.ok(issue);
        assert.equal(issue.term, "TERM2");
    });

    it("WB-20 an empty Summary of Grades is flagged (line 246)", () => {
        const result = validateClassRecord(record({ summaries: [] }));
        assert.ok(codes(result).includes("NO_SUMMARY_RECORDS_DETECTED"));
    });

    it("WB-21 parser warnings are carried over as warnings and do not block submission (line 293)", () => {
        const result = validateClassRecord(record({ warnings: [{ type: "LRN_FORMAT", message: "LRN should be 12 digits.", learner: "Cruz, Ana", learner_number: 1 }] }));
        assert.equal(result.warning_count, 1);
        assert.equal(result.error_count, 0);
        assert.equal(result.issues[0].code, "LRN_FORMAT");
        assert.equal(result.issues[0].severity, "warning");
        assert.equal(result.ready_for_submission, true);
    });

    it("WB-22 a parser warning without a type or severity gets safe defaults (line 295)", () => {
        const result = validateClassRecord(record({ warnings: [{ source: "INPUT" }] }));
        assert.equal(result.issues[0].code, "PARSER_WARNING");
        assert.equal(result.issues[0].severity, "warning");
        assert.equal(result.issues[0].learner_name, "Unknown");
        assert.match(result.issues[0].message, /INPUT/);
    });
});
