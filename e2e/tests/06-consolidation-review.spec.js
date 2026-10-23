const { test, expect } = require("@playwright/test");
const { loginAs, logout, openFromSidebar, uatFile, api, state, uploadTilesLoaded } = require("./helpers");

// The record moves Ready -> Pending Approval -> Approved / Rejected across
// these test cases, so they run in order.
test.describe.configure({ mode: "serial" });
test.beforeEach(({ page }) => page.on("dialog", (dialog) => dialog.accept()));

const REASON = "Please re-check the Term 2 scores.";

const findLearner = async (page, lrn) => {
    await page.getByLabel("Search learners by name or LRN").fill(lrn);
    const row = page.locator(".cr-student-row");
    await expect(row).toHaveCount(1);
    return row;
};

const openLearner = async (page, lrn) => {
    const row = await findLearner(page, lrn);
    await row.locator(".cr-row-toggle").click();
    return row;
};

const subjectRow = (row, subject) => row.locator(".cr-table tbody tr").filter({ has: row.page().locator("td.cr-subject-name", { hasText: new RegExp(`^${subject}$`) }) });

const reuploadMathematics = async (page) => {
    await loginAs(page, "subject.grade6a");
    await openFromSidebar(page, "Upload e-Class Record");
    await uploadTilesLoaded(page);
    await page.locator(".cru-tile", { hasText: "Mathematics" }).click();
    await page.locator("#class_record_file").setInputFiles(uatFile("TC-022_valid-ecr-rizal.xlsx"));
    await page.getByRole("button", { name: "Upload and validate" }).click();
    await expect(page.getByRole("heading", { name: /^Uploaded/ })).toBeVisible();
};

test.describe("Consolidation, submission and review", () => {
    test("TC-031 View own section's consolidated records", async ({ page }) => {
        await loginAs(page, "adviser.grade6a");
        await openFromSidebar(page, "Consolidated Records");
        await expect(page.getByRole("tab", { name: /All/ })).toContainText("100");
        const rows = page.locator(".cr-student-row");
        await expect(rows.first()).toContainText("Grade 6");
        await expect(rows.first().locator(".cr-subject-count")).toContainText("8 / 8");
    });

    test("TC-032 Adviser cannot see another section", async ({ page }) => {
        await loginAs(page, "adviser.grade6a");
        await openFromSidebar(page, "Section Progress");
        await expect(page.getByText("Grade 6 — Rizal")).toBeVisible();
        await expect(page.getByText(/Mabini/)).toHaveCount(0);

        // Asking for another section directly is refused.
        const { mabini } = state().ids;
        await page.goto(`/consolidated-records?section=${mabini}&section_label=Mabini`);
        await expect(page.getByText("You can only view a section you are the Adviser of.")).toBeVisible();

        await openFromSidebar(page, "Performance Analytics");
        await expect(page.getByText(/Mabini/)).toHaveCount(0);
    });

    test("TC-038 Section progress shows per-subject status", async ({ page }) => {
        await loginAs(page, "adviser.grade6a");
        await openFromSidebar(page, "Section Progress");
        const card = page.locator(".sp-card, .content-card, article, section").filter({ hasText: "Grade 6 — Rizal" }).first();
        await expect(card).toContainText("8 of 8 learning areas submitted");
        await expect(card).toContainText("100%");
        await expect(card).toContainText("100 students");
    });

    test("TC-034 Returning without a reason is refused", async ({ page }) => {
        await loginAs(page, "adviser.grade6a");
        await openFromSidebar(page, "Consolidated Records");
        const row = await openLearner(page, "100000000010");
        await subjectRow(row, "Mathematics").getByRole("button", { name: "Request revision" }).click();
        await page.getByRole("button", { name: "Confirm Request" }).click();
        await expect(page.getByText("A reason is required so the teacher knows what to correct.")).toBeVisible();
        await expect(subjectRow(row, "Mathematics")).not.toContainText("Needs Revision");
    });

    test("TC-033 Return a subject to its teacher", async ({ page }) => {
        await loginAs(page, "adviser.grade6a");
        await openFromSidebar(page, "Consolidated Records");
        const row = await openLearner(page, "100000000010");
        await subjectRow(row, "Mathematics").getByRole("button", { name: "Request revision" }).click();
        await page.getByPlaceholder(/Reason this Mathematics upload needs revision/).fill(REASON);
        await page.getByRole("button", { name: "Confirm Request" }).click();
        await expect(page.getByText("Revision requested. The teacher has been notified.")).toBeVisible();
        await expect(subjectRow(row, "Mathematics")).toContainText("Needs Revision");
        await expect(row).toContainText(`Revision reason: ${REASON}`);
        await logout(page);

        // The Subject Teacher gets a notification with the reason...
        await loginAs(page, "subject.grade6a");
        await openFromSidebar(page, "Notifications");
        await expect(page.getByText(REASON).first()).toBeVisible();
        await logout(page);

        // ...and fixes it by uploading again (restores the record for TC-035).
        await reuploadMathematics(page);
    });

    test("TC-036 Incomplete record cannot be submitted", async ({ page }) => {
        await loginAs(page, "adviser.grade6a");
        await openFromSidebar(page, "Consolidated Records");
        const row = await findLearner(page, "100000000099");
        await expect(row.locator(".cr-subject-count")).toContainText("7 / 8");
        await expect(row.locator(".cr-subject-count")).toContainText("incomplete");
        await expect(row.getByRole("button", { name: "Submit" })).toHaveCount(0);

        // The server refuses it too.
        const { schoolYear } = state().ids;
        const res = await api("POST", `/api/submissions/school-years/${schoolYear}/students/100000000099/submit`, { username: "adviser.grade6a" });
        expect(res.status).toBe(409);
        expect(res.body.message).toContain("every expected subject must have a recorded grade");
    });

    test("TC-035 Submit a complete record for approval", async ({ page }) => {
        await loginAs(page, "adviser.grade6a");
        await openFromSidebar(page, "Consolidated Records");
        const row = await findLearner(page, "100000000001");
        await row.getByRole("button", { name: "Submit" }).click();
        await expect(page.getByText("Submitted 100000000001 for approval.")).toBeVisible();
        // Pending Approval is shown with the "Submitted" badge.
        await expect(row.locator(".cr-col-status")).toContainText("Submitted");
        await logout(page);

        // The Administrator is notified.
        await loginAs(page, "admin.educheck");
        await openFromSidebar(page, "Notifications");
        await expect(page.getByText(/submitted/i).first()).toBeVisible();
    });

    test("TC-037 Submit all eligible records at once", async ({ page }) => {
        await loginAs(page, "adviser.grade6a");
        await openFromSidebar(page, "Consolidated Records");
        // 98 complete learners, one already submitted (TC-035): 97 eligible.
        await page.getByRole("button", { name: "Submit all eligible (97)" }).click();
        await expect(page.getByText("Submitted 97 record(s) for approval.")).toBeVisible();
        await expect(page.getByRole("tab", { name: /Pending approval/ })).toContainText("98");
        // The two incomplete learners are skipped.
        await expect(page.getByRole("tab", { name: /Incomplete/ })).toContainText("2");
    });

    test("TC-039 Approve a submitted record", async ({ page }) => {
        await loginAs(page, "admin.educheck");
        await openFromSidebar(page, "Submission Review");
        const row = await findLearner(page, "100000000005");
        await row.getByRole("button", { name: "Approve" }).click();
        await expect(page.getByText("Approved 100000000005.")).toBeVisible();
        await expect(row).toContainText("Approved");
        await logout(page);

        await loginAs(page, "adviser.grade6a");
        await openFromSidebar(page, "Notifications");
        await expect(page.getByText(/approved/i).first()).toBeVisible();
    });

    test("TC-040 Reject a submitted record with a reason", async ({ page }) => {
        const reason = "Check the MAPEH Term 3 grade.";
        await loginAs(page, "admin.educheck");
        await openFromSidebar(page, "Submission Review");
        const row = await findLearner(page, "100000000006");
        await row.getByRole("button", { name: "Reject" }).click();
        await page.getByPlaceholder("Reason for rejection (shown to the adviser)").fill(reason);
        await page.getByRole("button", { name: "Confirm Reject" }).click();
        await expect(page.getByText("Rejected 100000000006.")).toBeVisible();
        await expect(row).toContainText(`Returned by the Administrator: ${reason}`);
        await logout(page);

        await loginAs(page, "adviser.grade6a");
        await openFromSidebar(page, "Notifications");
        await expect(page.getByText(reason).first()).toBeVisible();
    });

    test("TC-041 Approved learner is locked against re-upload", async ({ page }) => {
        await reuploadMathematics(page);
        // Accepted for the rest of the class; locked learners listed as not updated.
        await expect(page.locator(".cru-callout")).toContainText("were not updated because their records are locked");
        await logout(page);

        await loginAs(page, "admin.educheck");
        await openFromSidebar(page, "Submission Review");
        const row = await findLearner(page, "100000000005");
        await expect(row).toContainText("Approved");
    });

    test("TC-042 Request an amendment on an approved record", async ({ page }) => {
        await loginAs(page, "adviser.grade6a");
        await openFromSidebar(page, "Consolidated Records");
        const row = await openLearner(page, "100000000005");
        await subjectRow(row, "MAPEH").getByRole("button", { name: "Request revision" }).click();
        await page.getByPlaceholder(/Reason this MAPEH upload needs revision/).fill(REASON);
        await page.getByRole("button", { name: "Confirm Request" }).click();
        await expect(page.getByText("Revision requested. The teacher has been notified.")).toBeVisible();
        await expect(row).toContainText("Amendment Requested");
        await logout(page);

        // The re-upload is then accepted.
        await loginAs(page, "subject.grade6a");
        await openFromSidebar(page, "Upload e-Class Record");
    await uploadTilesLoaded(page);
        await page.locator(".cru-tile", { hasText: "MAPEH" }).click();
        await page.locator("#class_record_file").setInputFiles(require("./helpers").perSubjectFile("MAPEH"));
        await page.getByRole("button", { name: "Upload and validate" }).click();
        await expect(page.getByRole("heading", { name: /^Uploaded/ })).toBeVisible();
    });
});
