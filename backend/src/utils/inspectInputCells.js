const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");

const uploadsDir = path.join(__dirname, "../uploads");

const files = fs.readdirSync(uploadsDir);

const candidates = files
    .map((file) => ({
        name: file,
        size: fs.statSync(path.join(uploadsDir, file)).size,
    }))
    .filter((file) => file.size > 500000);

console.log("\nLarge files found:");

console.table(candidates);

if (candidates.length === 0) {
    throw new Error(
        "No large workbook found. Check the uploads directory."
    );
}

const xlsxFile = candidates
    .sort((a, b) => b.size - a.size)[0]
    .name;

console.log("\nUsing workbook:", xlsxFile);

console.log("Using workbook:", xlsxFile);
if (!xlsxFile) {
    throw new Error("No XLSX file found in uploads folder.");
}

const filePath = path.join(uploadsDir, xlsxFile);

console.log("Using workbook:", xlsxFile);

const workbook = XLSX.readFile(filePath, {
    cellFormula: true,
});

const termSheets = [
    "TERM1",
    "TERM2",
    "TERM3",
];

for (const sheetName of termSheets) {

    console.log("\n=================================");
    console.log(` ${sheetName}`);
    console.log("=================================");

    const sheet = workbook.Sheets[sheetName];

    if (!sheet) {
        console.log(`Sheet ${sheetName} not found.`);
        continue;
    }

    const range = XLSX.utils.decode_range(sheet["!ref"]);

    console.log(
        "Range:",
        XLSX.utils.encode_range(range)
    );

    // Inspect the first learner row we already identified.
    const learnerRow = 63;

    console.log(`\n--- Row ${learnerRow} ---`);

    for (
        let column = range.s.c;
        column <= range.e.c;
        column++
    ) {

        const cellAddress =
            XLSX.utils.encode_cell({
                r: learnerRow - 1,
                c: column,
            });

        const cell = sheet[cellAddress];

        if (!cell) {
            continue;
        }

        console.log({
            cell: cellAddress,
            value: cell.v,
            formula: cell.f || null,
            type: cell.t,
        });
    }
}