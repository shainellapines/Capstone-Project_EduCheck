const { test, expect } = require("@playwright/test");
const { loginAs, logout, openFromSidebar, uploadTilesLoaded } = require("./helpers");

test.describe.configure({ mode: "serial" });

// Confirmation dialogs are answered "OK", as a tester would.
test.beforeEach(({ page }) => page.on("dialog", (dialog) => dialog.accept()));

const slot = (page, name) => page.locator("label.sa-slot", { has: page.locator(".sa-slot-name", { hasText: new RegExp(`^${name}$`) }) });

const openAddAssignment = async (page, { section, teacher }) => {
    await page.getByRole("button", { name: "Add Assignment" }).click();
    await page.locator("#section_id").selectOption({ label: section });
    await page.locator("#school_year_id").selectOption({ label: "2025-2026" });
    await page.locator("#teacher_search").fill(teacher.split(", ")[0]);
    await page.getByRole("option").getByText(teacher).click();
};

const group = (page, sectionName) => page.locator("section.sa-group", { has: page.locator(".sa-group-header", { hasText: sectionName }) });

test.describe("Sections and teacher assignments", () => {
    test("TC-018 Only the section's own grade-level subjects are offered", async ({ page }) => {
        await loginAs(page, "admin.educheck");
        await openFromSidebar(page, "Section & Teacher Assignments");
        await openAddAssignment(page, { section: "Rizal (Grade 6 - Departmentalized)", teacher: "Reyes, Jose Miguel" });

        const offered = await page.locator("label.sa-slot .sa-slot-name").allTextContents();
        const grade6 = ["Filipino", "English", "Mathematics", "Science", "Araling Panlipunan", "TLE", "MAPEH", "ESP"];
        expect(offered.filter((name) => name !== "Class Adviser").sort()).toEqual([...grade6].sort());
        // Grade 3 subjects are not offered for a Grade 6 section.
        for (const grade3Only of ["Makabansa", "GMRC"]) expect(offered).not.toContain(grade3Only);
    });

    test("TC-017 Assign a teacher to several subjects of a section in one save", async ({ page }) => {
        await loginAs(page, "admin.educheck");
        await openFromSidebar(page, "Section & Teacher Assignments");

        // Subjects already held by another teacher show who holds them and cannot be ticked.
        await openAddAssignment(page, { section: "Rizal (Grade 6 - Departmentalized)", teacher: "Reyes, Jose Miguel" });
        await expect(slot(page, "English")).toContainText("assigned to Maria Teresa Santos");
        await expect(slot(page, "English").locator("input")).toBeDisabled();
        await page.getByRole("button", { name: "Cancel" }).click();

        await openAddAssignment(page, { section: "Mabini (Grade 3 - Departmentalized)", teacher: "Reyes, Jose Miguel" });
        await slot(page, "English").locator("input").check();
        await slot(page, "Science").locator("input").check();
        await page.getByRole("button", { name: "Save 2 Assignments" }).click();

        const mabini = group(page, "Mabini");
        await expect(mabini.getByRole("button", { name: "Remove English from Jose Miguel Reyes" })).toBeVisible();
        await expect(mabini.getByRole("button", { name: "Remove Science from Jose Miguel Reyes" })).toBeVisible();
        await logout(page);

        // The teacher now sees those subjects for that section on the upload page.
        await loginAs(page, "subject.grade6a");
        await openFromSidebar(page, "Upload e-Class Record");
        await uploadTilesLoaded(page);
        const tiles = page.locator(".cru-tile");
        await expect(tiles.filter({ hasText: "English" }).filter({ hasText: "Mabini" })).toHaveCount(1);
        await expect(tiles.filter({ hasText: "Science" }).filter({ hasText: "Mabini" })).toHaveCount(1);
    });

    test("TC-019 Subject Teacher account cannot be Class Adviser", async ({ page }) => {
        await loginAs(page, "admin.educheck");
        await openFromSidebar(page, "Section & Teacher Assignments");
        await openAddAssignment(page, { section: "Mabini (Grade 3 - Departmentalized)", teacher: "Reyes, Jose Miguel" });
        const adviserSlot = slot(page, "Class Adviser");
        await expect(adviserSlot.locator("input")).toBeDisabled();
        await expect(adviserSlot).toContainText("needs an Adviser account");
        await page.getByRole("button", { name: "Cancel" }).click();
        // The Adviser slot stays free.
        await expect(group(page, "Mabini")).toContainText("No Class Adviser yet");
    });

    test("TC-020 Set section staffing mode", async ({ page }) => {
        const tile = (subject) => page.locator(".cru-tile").filter({ hasText: subject }).filter({ hasText: "Mabini" });

        await loginAs(page, "admin.educheck");
        await openFromSidebar(page, "Section & Teacher Assignments");
        // A Self-Contained section can have no subject assignments (the Class
        // Adviser teaches every subject), so TC-017's are removed first.
        await group(page, "Mabini").locator(".sa-teacher-row", { hasText: "Jose Miguel Reyes" })
            .getByRole("button", { name: "Remove all" }).click();
        await expect(group(page, "Mabini").getByText("Jose Miguel Reyes")).toHaveCount(0);

        // Mabini gets a Class Adviser with no subject of their own.
        await openAddAssignment(page, { section: "Mabini (Grade 3 - Departmentalized)", teacher: "Santos, Maria Teresa" });
        await slot(page, "Class Adviser").locator("input").check();
        await page.getByRole("button", { name: "Save Assignment" }).click();
        await expect(group(page, "Mabini").getByRole("button", { name: "Remove Class Adviser from Maria Teresa Santos" })).toBeVisible();

        const modeSelect = page.locator("tr", { hasText: "Mabini" }).locator("select");
        await modeSelect.selectOption("Self-Contained");
        await expect(page.getByText("Mabini's staffing mode updated to Self-Contained.")).toBeVisible();
        await logout(page);

        // Self-Contained: the Adviser can upload every subject of the section.
        await loginAs(page, "adviser.grade6a");
        await openFromSidebar(page, "Upload Files");
        await uploadTilesLoaded(page);
        for (const subject of ["Filipino", "English", "Mathematics", "Science", "Makabansa", "GMRC"]) {
            await expect(tile(subject)).toHaveCount(1);
        }
        await logout(page);

        await loginAs(page, "admin.educheck");
        await openFromSidebar(page, "Section & Teacher Assignments");
        await page.locator("tr", { hasText: "Mabini" }).locator("select").selectOption("Departmentalized");
        await expect(page.getByText("Mabini's staffing mode updated to Departmentalized.")).toBeVisible();
        await logout(page);

        // Departmentalized: only the Adviser's own subjects (none in Mabini).
        await loginAs(page, "adviser.grade6a");
        await openFromSidebar(page, "Upload Files");
        await uploadTilesLoaded(page);
        await expect(page.locator(".cru-tile").filter({ hasText: "Mabini" })).toHaveCount(0);
        await logout(page);

        // Put Mabini back as it was (no Class Adviser).
        await loginAs(page, "admin.educheck");
        await openFromSidebar(page, "Section & Teacher Assignments");
        await group(page, "Mabini").getByRole("button", { name: "Remove Class Adviser from Maria Teresa Santos" }).click();
        await expect(group(page, "Mabini")).toContainText("No Class Adviser yet");
    });

    test("TC-021 Actions are recorded in the audit log", async ({ page }) => {
        await loginAs(page, "admin.educheck");
        await openFromSidebar(page, "Audit Log");
        // The "Entity:" filter has no <label>, so it is found by position.
        await page.locator(".dashboard-header select").selectOption({ label: "Teacher Assignments" });
        const entry = page.locator(".al-row").filter({ hasText: "Teacher Assignment" }).first();
        await expect(entry).toBeVisible();
        // Who did it, what was done and when.
        await expect(entry).toContainText("admin.educheck");
        await expect(entry).toContainText(/Created|Deleted/);
        await expect(entry).toContainText(/\d{1,2}:\d{2}\s?(AM|PM)/);
    });
});
