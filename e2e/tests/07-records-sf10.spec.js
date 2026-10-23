const path = require("path");
const { createRequire } = require("module");
const { test, expect } = require("@playwright/test");
const { loginAs, logout, openFromSidebar } = require("./helpers");
const { BACKEND_DIR } = require("../setup/constants");

// Reads the generated SF10 workbook, as a tester would open it in Excel.
const XLSX = createRequire(path.join(BACKEND_DIR, "package.json"))("xlsx");

test.describe.configure({ mode: "serial" });
test.beforeEach(({ page }) => page.on("dialog", (dialog) => dialog.accept()));

const LEARNER = "100000000001";
let savedSf10; // the SF10 file of LEARNER, reused by TC-070 and TC-071

const openSf10 = async (page, lrn) => {
    await page.goto(`/permanent-record/${lrn}`);
    await expect(page.getByText("Scholastic record")).toBeVisible();
};

const gradeCard = (page, grade) => page.locator(".pr-year, li, article").filter({ hasText: new RegExp(`^\\s*${grade}\\s*Grade ${grade}`) }).first();

const fillYear = async (page, { schoolYear, rating }) => {
    const dialog = page.getByRole("dialog");
    await dialog.getByPlaceholder("2023-2024").fill(schoolYear);
    await dialog.locator("label.pr-field", { hasText: /^School$/ }).locator("input").fill("Sample Elementary School");
    const inputs = dialog.locator(".pr-entry input[aria-label]:not([aria-label$='final rating'])");
    const count = await inputs.count();
    for (let i = 0; i < count; i++) await inputs.nth(i).fill(String(rating));
    return dialog;
};

const cellsOf = (file) => {
    const wb = XLSX.readFile(file);
    return wb.SheetNames.flatMap((name) => Object.values(wb.Sheets[name]).map((cell) => cell && cell.v)).filter((v) => v !== undefined);
};

const generate = async (page, testInfo, name) => {
    const [download] = await Promise.all([
        page.waitForEvent("download"),
        page.getByRole("button", { name: "Generate SF10" }).click(),
    ]);
    const file = testInfo.outputPath(name);
    await download.saveAs(file);
    return { file, suggested: download.suggestedFilename() };
};

test.describe("Records repository and SF10", () => {
    test("TC-045 Search the repository", async ({ page }) => {
        await loginAs(page, "admin.educheck");
        await openFromSidebar(page, "Records & SF10");
        const search = () => page.locator("button.rr-search-button").click();

        // An empty search asks for a search term.
        await search();
        await expect(page.getByText("Enter an LRN, a name, a grade level, or pick a school year to search.")).toBeVisible();

        await page.getByLabel("LRN or Name").fill(LEARNER);
        await search();
        await expect(page.getByText("1 learner found")).toBeVisible();
        await expect(page.getByText("Aguilar, Adrian")).toBeVisible();

        await page.getByLabel("LRN or Name").fill("Aguilar");
        await search();
        await expect(page.getByText("2 learners found")).toBeVisible();

        await page.getByLabel("LRN or Name").fill("");
        await page.getByLabel("Grade Level").fill("6");
        await page.getByLabel("School Year").selectOption({ label: "2025-2026" });
        await search();
        // A broad search lists the first 50 and asks to narrow it.
        await expect(page.getByText("50 learners found")).toBeVisible();
        await expect(page.getByText(/Showing the first 50 matches/)).toBeVisible();
    });

    test("TC-048 Enter historical (pre-EduCheck) grades", async ({ page }) => {
        await loginAs(page, "adviser.grade6a");
        await openSf10(page, LEARNER);

        for (const [grade, schoolYear, rating] of [["4", "2023-2024", 86], ["5", "2024-2025", 88]]) {
            await page.getByRole("button", { name: `Add Grade ${grade}` }).click();
            const dialog = await fillYear(page, { schoolYear, rating });
            await dialog.getByRole("button", { name: "Save record" }).click();
            await expect(page.getByText("Year saved.")).toBeVisible();
            await expect(page.getByRole("button", { name: `Delete Grade ${grade}` })).toBeVisible();
        }
        await expect(page.getByText(schoolYearText("2023-2024"))).toBeVisible();
        await logout(page);

        // The action is in the audit log.
        await loginAs(page, "admin.educheck");
        await openFromSidebar(page, "Audit Log");
        await expect(page.locator(".al-row").filter({ hasText: "SF10 Historical Record" }).first()).toContainText("adviser.grade6a");
    });

    test("TC-049 Invalid historical grades are refused", async ({ page }) => {
        await loginAs(page, "adviser.grade6a");
        await openSf10(page, LEARNER);

        await page.getByRole("button", { name: "Add Grade 3" }).click();
        let dialog = await fillYear(page, { schoolYear: "2022-2023", rating: 105 });
        await dialog.getByRole("button", { name: "Save record" }).click();
        await expect(page.locator(".error-banner")).toContainText("must be between 60 and 100");
        await expect(page.getByRole("button", { name: "Delete Grade 3" })).toHaveCount(0);

        dialog = await fillYear(page, { schoolYear: "2022-2024", rating: 85 });
        await dialog.getByRole("button", { name: "Save record" }).click();
        await expect(page.locator(".error-banner")).toContainText("School year must look like 2023-2024.");
        await expect(page.getByRole("button", { name: "Delete Grade 3" })).toHaveCount(0);
    });

    test("TC-046 Download an SF10", async ({ page }, testInfo) => {
        await loginAs(page, "admin.educheck");
        await openSf10(page, LEARNER);
        await expect(page.getByText("Partially ready")).toBeVisible();

        const { file, suggested } = await generate(page, testInfo, "sf10-100000000001.xlsx");
        expect(suggested).toMatch(/\.xlsx$/);
        savedSf10 = file;
        const wb = XLSX.readFile(file);
        expect(wb.SheetNames.slice(0, 2)).toEqual(["Front", "Back"]);
        const values = cellsOf(file);
        expect(values).toContain("2023-2024");
        expect(values).toContain("2024-2025");
    });

    test("TC-047 SF10 with no printable year shows a clear message", async ({ page }) => {
        await loginAs(page, "admin.educheck");
        await openSf10(page, "100000000020");
        // Generating is not possible, and the readiness report explains why.
        await expect(page.getByRole("button", { name: "Generate SF10" })).toBeDisabled();
        await expect(page.getByText("Add or import a year to enable")).toBeVisible();
        await expect(page.getByText("Not ready")).toBeVisible();
        await expect(page.getByText(/No grade can be placed on the form yet/)).toBeVisible();
        await expect(page.getByText(/No record yet for Grade/)).toBeVisible();
    });

    test("TC-069 A 3-term year prints as Terms 1-3", async ({ page }, testInfo) => {
        // A Rizal learner's 2025-2026 record is approved first. TC-042's
        // revision request reopened the pending records, so it is submitted again.
        await loginAs(page, "adviser.grade6a");
        await openFromSidebar(page, "Consolidated Records");
        await page.getByLabel("Search learners by name or LRN").fill("100000000007");
        await page.locator(".cr-student-row").getByRole("button", { name: "Submit" }).click();
        await expect(page.getByText("Submitted 100000000007 for approval.")).toBeVisible();
        await logout(page);

        await loginAs(page, "admin.educheck");
        await openFromSidebar(page, "Submission Review");
        await page.getByLabel("Search learners by name or LRN").fill("100000000007");
        await page.locator(".cr-student-row").getByRole("button", { name: "Approve" }).click();
        await expect(page.getByText("Approved 100000000007.")).toBeVisible();

        await openSf10(page, "100000000007");
        await expect(page.getByText(/Graded in 3 terms: printed as Term 1-3/)).toBeVisible();
        const { file } = await generate(page, testInfo, "sf10-100000000007.xlsx");
        const values = cellsOf(file);
        expect(values).toContain("Term Rating");
        expect(values).toEqual(expect.arrayContaining(["T1", "T2", "T3"]));
        // The school details from Settings are printed on the Grade 6 block.
        expect(values.some((v) => String(v).includes("E2E Test Elementary School"))).toBe(true);
        expect(values).toContain("2025-2026");
    });

    test("TC-071 Import refuses another learner's SF10", async ({ page }) => {
        test.skip(!savedSf10, "needs the SF10 file from TC-046");
        await loginAs(page, "adviser.grade6a");
        await openSf10(page, "100000000004");
        await page.locator("input[type=file][accept='.xlsx,.xls']").setInputFiles(savedSf10);
        await expect(page.locator(".error-banner")).toContainText("This SF10 belongs to LRN 100000000001, not 100000000004.");
        await expect(page.getByRole("dialog")).toHaveCount(0);
    });

    test("TC-070 Import earlier years from an existing SF10 file", async ({ page }) => {
        test.skip(!savedSf10, "needs the SF10 file from TC-046");
        await loginAs(page, "adviser.grade6a");
        await openSf10(page, LEARNER);
        await page.getByRole("button", { name: "Delete Grade 5" }).click();
        await expect(page.getByText("Earlier year deleted.")).toBeVisible();
        await expect(page.getByRole("button", { name: "Delete Grade 5" })).toHaveCount(0);

        await page.locator("input[type=file][accept='.xlsx,.xls']").setInputFiles(savedSf10);
        const preview = page.getByRole("dialog");
        await expect(preview.getByRole("heading", { name: "Import from SF10" })).toBeVisible();
        const grade4 = preview.locator("label.pr-import-pick").filter({ hasText: "Grade 4" });
        const grade5 = preview.locator("label.pr-import-pick").filter({ hasText: "Grade 5" });
        await expect(grade4).toBeVisible();
        await expect(grade5).toBeVisible();
        // Nothing is saved until Import is clicked; keep only Grade 5.
        if (await grade4.locator("input").isChecked()) await grade4.locator("input").uncheck();
        if (!(await grade5.locator("input").isChecked())) await grade5.locator("input").check();
        await preview.getByRole("button", { name: "Import 1 year" }).click();
        await expect(page.getByRole("button", { name: "Delete Grade 5" })).toBeVisible();
        await expect(page.getByText(schoolYearText("2024-2025"))).toBeVisible();
    });

    test("TC-043 Principal can view school-wide data", async ({ page }) => {
        await loginAs(page, "principal.educheck");
        await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

        await openFromSidebar(page, "Submission Review");
        await expect(page.getByRole("tab", { name: /All/ })).toContainText("100");
        await openFromSidebar(page, "Section Progress");
        await expect(page.getByText("Grade 6 — Rizal")).toBeVisible();
        await expect(page.getByText("Grade 3 — Mabini")).toBeVisible();
        await openFromSidebar(page, "Academic Analytics");
        await expect(page.getByText("Intervention Flag List")).toBeVisible();
        await openFromSidebar(page, "Records & SF10");
        await page.getByLabel("LRN or Name").fill(LEARNER);
        await page.locator("button.rr-search-button").click();
        await page.getByRole("button", { name: "Permanent Record (SF10)" }).click();
        await expect(page.getByText("Scholastic record")).toBeVisible();
    });

    test("TC-044 Principal cannot change records", async ({ page }) => {
        await loginAs(page, "principal.educheck");
        await openFromSidebar(page, "Submission Review");
        await expect(page.getByRole("button", { name: /^(Approve|Reject|Submit)/ })).toHaveCount(0);
        await page.locator(".cr-row-toggle").first().click();
        await expect(page.getByRole("button", { name: "Request revision" })).toHaveCount(0);

        await openSf10(page, LEARNER);
        for (const name of ["Generate SF10", "Import from SF10", "Add earlier year", "Save details"]) {
            await expect(page.getByRole("button", { name })).toHaveCount(0);
        }
        // No upload page for the Principal.
        await page.goto("/class-record-upload");
        await expect(page).toHaveURL(/\/dashboard$/);
    });
});

function schoolYearText(year) {
    return new RegExp(year);
}
