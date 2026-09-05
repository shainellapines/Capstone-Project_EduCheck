const XLSX = require("xlsx");
const path = require("path");

const filePath = path.join(
    __dirname,
    "../uploads/0a85bb5e9c386f04548b2ac116141577"
);

const workbook = XLSX.readFile(filePath, {
    cellFormula: true,
    cellNF: true,
    cellStyles: true,
});

console.log("\n=================================");
console.log("WORKBOOK FORMULA INSPECTION");
console.log("=================================\n");

console.log(
    "Sheets:",
    workbook.SheetNames
);

for (const sheetName of workbook.SheetNames) {

    const sheet =
        workbook.Sheets[sheetName];

    console.log(
        `\n========== ${sheetName} ==========`
    );

    const range =
        XLSX.utils.decode_range(
            sheet["!ref"] || "A1"
        );

    let formulaCount = 0;

    for (
        let row = range.s.r;
        row <= range.e.r;
        row++
    ) {

        for (
            let col = range.s.c;
            col <= range.e.c;
            col++
        ) {

            const address =
                XLSX.utils.encode_cell({
                    r: row,
                    c: col,
                });

            const cell =
                sheet[address];

            if (
                cell &&
                cell.f
            ) {

                formulaCount++;

                console.log({
                    cell: address,
                    formula: cell.f,
                    value: cell.v,
                });
            }
        }
    }

    console.log(
        `Formula count: ${formulaCount}`
    );
}