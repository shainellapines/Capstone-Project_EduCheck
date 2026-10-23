const { test, expect } = require("@playwright/test");
const { loginAs, openFromSidebar, uatFile, perSubjectFile, uploadTilesLoaded } = require("./helpers");

test.describe.configure({ mode: "serial" });

const tile = (page, subject, section = "Rizal") =>
    page.locator(".cru-tile").filter({ has: page.locator("strong", { hasText: new RegExp(`^${subject}$`) }) }).filter({ hasText: section });

// Pick the subject tile, choose the file, click Upload and validate.
const upload = async (page, subject, file) => {
    await tile(page, subject).click();
    await page.locator("#class_record_file").setInputFiles(file);
    await page.getByRole("button", { name: "Upload and validate" }).click();
};

const openUpload = async (page, username = "subject.grade6a", item = "Upload e-Class Record") => {
    await loginAs(page, username);
    await openFromSidebar(page, item);
    await uploadTilesLoaded(page);
};

test.describe("Upload and validation", () => {
    test("TC-023 Only assigned subjects and sections are offered", async ({ page }) => {
        await openUpload(page);
        const offered = (await page.locator(".cru-tile strong").allTextContents()).sort();
        expect(offered).toEqual(["Araling Panlipunan", "MAPEH", "Mathematics", "TLE"]);
        await expect(page.locator(".cru-tile").filter({ hasNotText: "Rizal" })).toHaveCount(0);
    });

    test("TC-024 Non-Excel file is rejected", async ({ page }) => {
        await openUpload(page);
        await tile(page, "Mathematics").click();
        await page.locator("#class_record_file").setInputFiles(uatFile("TC-024_not-excel.txt"));
        await expect(page.getByText("Please select an Excel file (.xlsx or .xls).")).toBeVisible();
        await expect(page.getByRole("button", { name: "Upload and validate" })).toBeDisabled();
    });

    test("TC-025 File over 10 MB is rejected", async ({ page }) => {
        await openUpload(page);
        await upload(page, "Mathematics", uatFile("TC-025_oversized-11MB.xlsx"));
        await expect(page.locator(".cru-error")).toContainText("The file is larger than 10 MB");
    });

    test("TC-026 Wrong-section roster is rejected", async ({ page }) => {
        await openUpload(page);
        await upload(page, "Mathematics", uatFile("TC-026_ecr-other-section.xlsx"));
        await expect(page.locator(".cru-error")).toContainText("None of the learners in this file are on this section's class list");
        await expect(tile(page, "Mathematics")).toContainText("Not uploaded yet");
    });

    test("TC-068 A file for another subject is refused", async ({ page }) => {
        await openUpload(page);
        await upload(page, "Mathematics", perSubjectFile("English"));
        await expect(page.locator(".cru-error")).toContainText('This file is the e-Class Record for "English", but you selected Mathematics');
        // Nothing is saved.
        await expect(tile(page, "Mathematics")).toContainText("Not uploaded yet");
    });

    test("TC-022 Upload a valid e-class record", async ({ page }) => {
        await openUpload(page);
        // The next subject not yet uploaded is already selected.
        await expect(tile(page, "Mathematics")).toHaveAttribute("aria-checked", "true");
        await upload(page, "Mathematics", uatFile("TC-022_valid-ecr-rizal.xlsx"));
        await expect(page.getByRole("heading", { name: "Uploaded and validated" })).toBeVisible();
        await expect(page.locator(".cru-stat", { hasText: "Errors" })).toContainText("0");

        await page.getByRole("button", { name: "Upload another file" }).click();
        await expect(tile(page, "Mathematics")).toContainText("Validated");
        await expect(page.getByText("4 of 4 uploaded")).toBeVisible();
    });

    test("TC-027 Validation errors are listed per learner", async ({ page }) => {
        await openUpload(page);
        await upload(page, "Mathematics", uatFile("TC-027_ecr-with-errors.xlsx"));
        await expect(page.getByRole("heading", { name: "Uploaded — corrections needed" })).toBeVisible();
        await expect(page.locator(".cru-stat", { hasText: "Errors" })).toContainText("3");

        await page.getByRole("button", { name: "View validation results" }).click();
        const issues = page.locator(".vr-issue-row");
        for (const learner of ["Aguilar", "Alcantara", "Andrada"]) {
            await expect(issues.filter({ hasText: learner }).first()).toBeVisible();
        }
        // Errors and warnings are told apart.
        await expect(issues.first().locator(".ec-badge")).toBeVisible();
    });

    test("TC-028 Correct by re-upload", async ({ page }) => {
        await openUpload(page);
        await expect(tile(page, "Mathematics")).toContainText("Needs fixes");
        await upload(page, "Mathematics", uatFile("TC-022_valid-ecr-rizal.xlsx"));
        await expect(page.getByRole("heading", { name: "Uploaded and validated" })).toBeVisible();
        await page.getByRole("button", { name: "Upload another file" }).click();
        await expect(tile(page, "Mathematics")).toContainText("Validated");
    });

    test("TC-061 Upload and validation time", async ({ page }, testInfo) => {
        await openUpload(page);
        const started = Date.now();
        await upload(page, "Mathematics", uatFile("TC-022_valid-ecr-rizal.xlsx"));
        await expect(page.getByRole("heading", { name: "Uploaded and validated" })).toBeVisible({ timeout: 60_000 });
        const seconds = ((Date.now() - started) / 1000).toFixed(1);
        testInfo.annotations.push({ type: "measured", description: `Upload and validation took ${seconds} s (local server)` });
    });

    test("TC-029 Validation rules are read-only", async ({ page }) => {
        await loginAs(page, "admin.educheck");
        await openFromSidebar(page, "Settings");
        const rules = page.locator(".settings-card", { hasText: "Validation Rules" });
        await expect(rules.getByText("Official template structure")).toBeVisible();
        await expect(rules.getByText("Score range")).toBeVisible();
        // No way to edit or switch them off.
        await expect(rules.locator("input, select, textarea, button")).toHaveCount(0);
    });

    test("TC-030 Adviser uploads their own assigned subject", async ({ page }) => {
        await openUpload(page, "adviser.grade6a", "Upload Files");
        const offered = (await page.locator(".cru-tile strong").allTextContents()).sort();
        expect(offered).toEqual(["ESP", "English", "Filipino", "Science"]);

        await upload(page, "English", perSubjectFile("English"));
        await expect(page.getByRole("heading", { name: "Uploaded and validated" })).toBeVisible();
    });
});
