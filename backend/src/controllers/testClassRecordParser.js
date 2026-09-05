const path = require("path");
const { parseClassRecord } = require("./classRecordParser");

const filePath = path.join(
    __dirname,
    "../uploads",
    "E-Class-Record-Sample-Data-EDITABLE.xlsx"
);

try {
    const result = parseClassRecord(filePath);

    console.log("\n=================================");
    console.log("PARSER TEST RESULT");
    console.log("=================================\n");

    console.log("Learners:", result.learners);

    console.log("\n--- TERM 1 ---");
    console.dir(
        result.terms.term1[0],
        { depth: null }
    );

    console.log("\n--- TERM 2 ---");
    console.dir(
        result.terms.term2[0],
        { depth: null }
    );

    console.log("\n--- TERM 3 ---");
    console.dir(
        result.terms.term3[0],
        { depth: null }
    );

    console.log("\n--- SUMMARY ---");
    console.dir(
        result.summary[0],
        { depth: null }
    );

    console.log("\n--- VALIDATION ---");
    console.dir(
        result.validation,
        { depth: null }
    );

} catch (error) {
    console.error("\nPARSER TEST FAILED:");
    console.error(error);
}