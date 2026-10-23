// Builds 03-Testing/EduCheck_Automated_UI_Test_Results.docx from the last
// `npm test` run (.run/results.json). The manual Status column of the UAT
// workbook is only read, never written: this is a separate report.
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { createRequire } = require("module");
const { chromium } = require("@playwright/test");
const {
    AlignmentType, BorderStyle, Document, Footer, HeadingLevel, ImageRun, Packer, PageBreak,
    PageNumber, Paragraph, ShadingType, Table, TableCell, TableRow, TextRun, WidthType,
} = require("docx");
const { ROOT, RUN_DIR, BACKEND_DIR } = require("../setup/constants");

const XLSX = createRequire(path.join(BACKEND_DIR, "package.json"))("xlsx");
const RESULTS = path.join(RUN_DIR, "results.json");
const WORKBOOK = path.join(ROOT, "03-Testing", "EduCheck_UAT_Test_Cases.xlsx");
const OUTPUT = path.join(ROOT, "03-Testing", "EduCheck_Automated_UI_Test_Results.docx");

// Seen while writing and running the tests. None stops a test case from
// passing; they are listed for the team to decide on.
const OBSERVATIONS = [
    ["TC-002", "The wrong-password message reads \"Username or password is incorrect. Check both and try again.\", not \"Invalid username or password.\" as written in the test case. It still does not say which field was wrong, so the intent is met; the test case wording can be updated."],
    ["TC-051", "The sidebar notification badge keeps the old count after Mark all read until its next timed refresh or a page load."],
    ["TC-035", "A record waiting for approval shows the badge \"Submitted\", while its tab is named \"Pending approval\". The two words mean the same state."],
    ["TC-042", "A revision request covers the subject's whole upload, so the section's other records waiting for approval are sent back too (by design: the Administrator should not approve grades the Adviser has flagged). They show the status \"Amendment Requested\" even though they were never approved, which users may misread."],
    ["Audit Log", "The Entity filter dropdown has no visible label, so screen readers announce it only as a list box."],
];

const C = { ink: "1F2937", muted: "6B7280", line: "D1D5DB", head: "E8EEF7", pass: "DCFCE7", passInk: "166534", fail: "FEE2E2", failInk: "991B1B", skip: "F3F4F6" };

const text = (value, opts = {}) => new TextRun({ text: String(value), font: "Calibri", size: opts.size || 20, color: opts.color || C.ink, bold: opts.bold, italics: opts.italics });
const para = (value, opts = {}) => new Paragraph({ spacing: { after: opts.after ?? 120 }, alignment: opts.align, children: Array.isArray(value) ? value : [text(value, opts)] });
const heading = (value, level = HeadingLevel.HEADING_1) => new Paragraph({ heading: level, keepNext: true, keepLines: true, spacing: { before: 240, after: 120 }, children: [new TextRun({ text: value, font: "Calibri", bold: true, color: "1E3A8A", size: level === HeadingLevel.HEADING_1 ? 28 : 24 })] });

const border = { style: BorderStyle.SINGLE, size: 4, color: C.line };
const borders = { top: border, bottom: border, left: border, right: border };
const cell = (value, { width, fill, bold, color } = {}) => new TableCell({
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
    borders,
    shading: fill ? { type: ShadingType.CLEAR, color: "auto", fill } : undefined,
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
    children: String(value).split("\n").map((line) => para(line, { size: 18, bold, color, after: 0 })),
});
const table = (headers, rows, widths) => new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
        new TableRow({ tableHeader: true, children: headers.map((h, i) => cell(h, { width: widths[i], fill: C.head, bold: true })) }),
        ...rows.map((row) => new TableRow({ cantSplit: true, children: row.map((value, i) => (value instanceof TableCell ? value : cell(value, { width: widths[i] }))) })),
    ],
});

const resultCell = (status, width) => {
    const look = { Pass: [C.pass, C.passInk], Fail: [C.fail, C.failInk] }[status] || [C.skip, C.muted];
    return cell(status, { width, fill: look[0], color: look[1], bold: true });
};

function readTestCases() {
    // raw: false keeps the Date column as the date shown in Excel.
    const rows = XLSX.utils.sheet_to_json(XLSX.readFile(WORKBOOK).Sheets["Test Cases"], { raw: false });
    return new Map(rows.filter((r) => /^TC-\d+/.test(r["TC ID"] || "")).map((r) => [r["TC ID"], r]));
}

function readRuns() {
    const report = JSON.parse(fs.readFileSync(RESULTS, "utf8"));
    const specs = [];
    const walk = (suite, file) => {
        for (const spec of suite.specs || []) specs.push({ ...spec, file: spec.file || file });
        for (const child of suite.suites || []) walk(child, suite.file || file);
    };
    report.suites.forEach((s) => walk(s, s.file));
    const runs = specs.map((spec) => {
        const result = spec.tests[0].results.at(-1) || {};
        const id = spec.title.match(/^TC-\d+/)[0];
        const status = { passed: "Pass", failed: "Fail", timedOut: "Fail", skipped: "Not run", interrupted: "Not run" }[result.status] || "Not run";
        const notes = [...(spec.tests[0].annotations || []), ...(result.annotations || [])]
            .filter((a) => a.type === "measured" || a.type === "finding")
            .map((a) => (a.type === "measured" ? `Measured: ${a.description}` : `Observation: ${a.description}`));
        if (status === "Fail" && result.errors?.length) notes.push(result.errors[0].message.replace(/\u001b\[[0-9;]*m/g, "").split("\n")[0]);
        const shot = (result.attachments || []).find((a) => a.contentType === "image/png" && a.path && fs.existsSync(a.path));
        return { id, title: spec.title.replace(/^TC-\d+\s*/, ""), file: spec.file, status, ms: result.duration || 0, start: result.startTime, notes: [...new Set(notes)], shot: shot && shot.path };
    });
    return { stats: report.stats, runs };
}

function manualReason(tc) {
    if (/mobile|android/i.test(tc.Platform || "")) return "Runs in the Android app; the automated tests drive the web app only.";
    if (/compatib/i.test(tc["ISO 25010"] || "")) return "Needs other browsers, devices or screen sizes.";
    if (/usab/i.test(tc["ISO 25010"] || "")) return "Needs a person's judgement (observation, SUS questionnaire).";
    return "Kept as a manual test case.";
}

async function chromeVersion() {
    try {
        const browser = await chromium.launch({ channel: "chrome", headless: true });
        const version = browser.version();
        await browser.close();
        return `Google Chrome ${version} (headless)`;
    } catch {
        return "Google Chrome (headless)";
    }
}

const pngSize = (file) => {
    const buf = fs.readFileSync(file);
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20), data: buf };
};

async function main() {
    if (!fs.existsSync(RESULTS)) throw new Error("No results yet. Run `npm test` first.");
    const cases = readTestCases();
    const { stats, runs } = readRuns();
    const runIds = new Set(runs.map((r) => r.id));
    const manual = [...cases.values()].filter((tc) => !runIds.has(tc["TC ID"]));
    const count = (s) => runs.filter((r) => r.status === s).length;
    // Manual results are whatever the testers entered in the workbook's Status column.
    const manualStatus = (tc) => (/^pass/i.test(tc.Status || "") ? "Pass" : /^fail/i.test(tc.Status || "") ? "Fail" : "Not run");
    const manualCount = (s) => manual.filter((tc) => manualStatus(tc) === s).length;
    const totalPass = count("Pass") + manualCount("Pass");
    const started = new Date(stats.startTime);
    const date = started.toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
    const time = started.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });
    let commit = "unknown";
    try { commit = execSync("git rev-parse --short HEAD", { cwd: ROOT }).toString().trim(); } catch { /* not a git checkout */ }
    const browser = await chromeVersion();
    const sorted = [...runs].sort((a, b) => a.id.localeCompare(b.id));

    const children = [
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: "EduCheck", font: "Calibri", bold: true, size: 40, color: "1E3A8A" })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 240 }, children: [new TextRun({ text: "Automated Black-Box UI Test Results", font: "Calibri", bold: true, size: 32, color: C.ink })] }),

        heading("1. Purpose and approach"),
        para("This report records an automated black-box test of the EduCheck web application. The tests use the same test case IDs as the UAT workbook (EduCheck_UAT_Test_Cases.xlsx), so each result can be traced to its test case. The Status column of that workbook is filled in by the human testers and is not changed by this report; the results of the test cases run by hand are copied from it into Section 6."),
        para("Black-box means the tests know nothing about the code. A script opens the real web app in Google Chrome and does what a tester would do: it signs in, clicks the sidebar, fills in forms, uploads the e-Class Record files in 03-Testing/UAT-files, downloads the SF10, and checks what the screen shows against the Expected Result of the test case. The tool is Playwright."),
        para("Every run starts from an empty, separate database (educheck_e2e). It is built from the project schema and seeded with test accounts, one school year (2025-2026) and two sections (Grade 6 Rizal, Grade 3 Mabini). The development database and the deployed site are never touched. Emails are written to a file instead of being sent."),

        heading("2. Test run"),
        table(["Item", "Value"], [
            ["Date and time", `${date}, ${time}`],
            ["Application version", `Git commit ${commit} (main)`],
            ["Browser", `${browser}, 1440 x 900 window`],
            ["Server", "Local backend and built web app on this computer"],
            ["Total duration", `${(stats.duration / 60000).toFixed(1)} minutes`],
            ["How to repeat", "cd e2e, then npm test, then npm run report"],
        ], [30, 70]),

        heading("3. Summary"),
        table(["Result", "Automated (Section 4)", "Manual (Section 6)", "All test cases"], ["Pass", "Fail", "Not run"].map((s) => [
            resultCell(s, 25), cell(count(s), { width: 25 }), cell(manualCount(s), { width: 25 }), cell(count(s) + manualCount(s), { width: 25 }),
        ]).concat([[cell("Total", { bold: true }), cell(runs.length, { bold: true }), cell(manual.length, { bold: true }), cell(cases.size, { bold: true })]]), [25, 25, 25, 25]),
        para(""),
        para(`${runs.length} of ${cases.size} test cases (${Math.round((runs.length / cases.size) * 100)}%) are automated; the other ${manual.length} were run by hand. ${totalPass} of ${cases.size} test cases passed (${Math.round((totalPass / cases.size) * 100)}%).`),

        heading("4. Results by test case"),
        table(["TC ID", "Module", "Test case", "Result", "Time", "Remarks"], sorted.map((r) => {
            const tc = cases.get(r.id) || {};
            return [r.id, tc.Module || "", tc["Test Case"] || r.title, resultCell(r.status, 9), `${(r.ms / 1000).toFixed(1)} s`, r.notes.join("\n")];
        }), [9, 15, 30, 9, 8, 29]),

        heading("5. Observations"),
        para((count("Fail") ? "Failed test cases are listed in Section 4 with their error. " : "No test case failed. ") + "The points below were seen while writing and running the tests. They do not stop a test case from passing, but the team may want to review them."),
        table(["Ref", "Observation"], OBSERVATIONS, [14, 86]),

        heading("6. Manual test cases"),
        para("These test cases are not automated. They were run by hand, and their results are taken from the Status, Tester and Date columns of the UAT workbook."),
        table(["TC ID", "Module", "Test case", "Why manual", "Result", "Tester", "Date"], manual.map((tc) => [
            tc["TC ID"], tc.Module || "", tc["Test Case"] || "", manualReason(tc), resultCell(manualStatus(tc), 9), tc.Tester || "", tc.Date || "",
        ]), [9, 12, 24, 22, 9, 12, 12]),

        new Paragraph({ children: [new PageBreak()] }),
        heading("Appendix A. Screenshot evidence"),
        para("Each screenshot was taken by the test at the end of the test case, showing the screen the last check was made on.", { italics: true, color: C.muted }),
    ];

    for (const r of sorted) {
        if (!r.shot) continue;
        const img = pngSize(r.shot);
        const width = 620;
        const height = Math.round((img.height / img.width) * width);
        children.push(
            heading(`${r.id} ${(cases.get(r.id) || {})["Test Case"] || r.title}`, HeadingLevel.HEADING_2),
            new Paragraph({ keepNext: true, children: [new ImageRun({ type: "png", data: img.data, transformation: { width, height } })] }),
            para(`Result: ${r.status}  |  ${new Date(r.start).toLocaleString("en-PH")}`, { size: 18, color: C.muted }),
        );
    }

    const doc = new Document({
        creator: "EduCheck team",
        title: "EduCheck Automated Black-Box UI Test Results",
        styles: { default: { document: { run: { font: "Calibri", size: 20 } } } },
        sections: [{
            properties: { page: { margin: { top: 1000, bottom: 1000, left: 1000, right: 1000 } } },
            footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [text("EduCheck Automated UI Test Results  |  Page ", { size: 16, color: C.muted }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: C.muted })] })] }) },
            children,
        }],
    });
    fs.writeFileSync(OUTPUT, await Packer.toBuffer(doc));
    console.log(`Wrote ${path.relative(ROOT, OUTPUT)}: ${count("Pass")} pass, ${count("Fail")} fail, ${count("Not run")} not run, ${manual.length} manual (${manualCount("Pass")} pass).`);
}

main().catch((err) => {
    console.error(err.message);
    process.exit(1);
});
