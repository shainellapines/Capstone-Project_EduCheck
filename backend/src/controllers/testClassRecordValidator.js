const path = require("path");
const { parseClassRecord } = require("./classRecordParser");
const { validateClassRecord } = require("./classRecordValidator");

const fileName = process.argv[2];

if (!fileName) {
    throw new Error("Provide an uploaded workbook filename.");
}

const filePath = path.resolve(__dirname, "../uploads", fileName);

const parsedRecord = parseClassRecord(filePath);

const injectInvalidScore = process.argv.includes("--inject-invalid-score");

if (injectInvalidScore) {
    const firstTermRecord = parsedRecord.terms.term1[0];

    if (!firstTermRecord) {
        throw new Error("Cannot inject an invalid score because TERM1 has no learner records.");
    }

    firstTermRecord.written_oral.scores[0] = 21;

    console.log("\nTEST MODE: Injected invalid score 21 into TERM1 Written/Oral[1].");
}

const validationResult = validateClassRecord(parsedRecord);

console.log("\n=================================");
console.log("VALIDATION TEST RESULT");
console.log("=================================\n");

console.log({
    ready_for_submission: validationResult.ready_for_submission,
    error_count: validationResult.error_count,
    warning_count: validationResult.warning_count,
});

console.log("\n--- FIRST LEARNER RESULT ---");
console.dir(validationResult.learners[0], { depth: null });

console.log("\n--- FIRST 10 ISSUES ---");
console.dir(validationResult.issues.slice(0, 10), { depth: null });