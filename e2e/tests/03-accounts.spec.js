const { test, expect } = require("@playwright/test");
const { login, loginAs, logout, openFromSidebar, outbox } = require("./helpers");

// One new account walks through the whole lifecycle across these test
// cases (create, approve, set up, first sign-in, reset, deactivate), so
// they run in order.
test.describe.configure({ mode: "serial" });

const NEW = { email: "test.teacher@deped.gov.ph", username: "test.teacher", first: "Test", last: "Teacher" };
const REJECTED = { email: "test.reject@deped.gov.ph", username: "test.reject", first: "Reject", last: "Me" };
const TEMP_PASSWORD = "Temp2026abc";
const OWN_PASSWORD = "MyOwnPass2026";
const RESET_PASSWORD = "Reset2026xyz";

const row = (page, text) => page.locator("tbody tr", { hasText: text });

const openAddAccount = async (page, { email, first, last }) => {
    await page.getByRole("button", { name: "Add Account" }).click();
    await page.getByLabel("DepEd Email").fill(email);
    await page.getByLabel("Role").selectOption({ label: "Subject Teacher" });
    await page.getByLabel("First Name").fill(first);
    await page.getByLabel("Last Name").fill(last);
};

test.describe("Accounts", () => {
    test("TC-072 Only DepEd email addresses are accepted", async ({ page }) => {
        await loginAs(page, "admin.educheck");
        await openFromSidebar(page, "Accounts");
        await openAddAccount(page, { email: "juan.delacruz@gmail.com", first: "Juan", last: "Dela Cruz" });
        await page.getByRole("button", { name: "Create Account" }).click();
        await expect(page.getByText(/DepEd email address \(ending in @deped\.gov\.ph\)/)).toBeVisible();
        await page.getByRole("button", { name: "Close" }).click();
        await expect(row(page, "juan.delacruz")).toHaveCount(0);
    });

    test("TC-012 Create an account (waits for the Principal)", async ({ page }) => {
        await loginAs(page, "admin.educheck");
        await openFromSidebar(page, "Accounts");
        await openAddAccount(page, NEW);
        // The username is suggested from the email.
        await expect(page.getByLabel("Username")).toHaveValue(NEW.username);
        await page.getByRole("button", { name: "Create Account" }).click();
        await expect(row(page, NEW.username)).toContainText("Pending Approval");
    });

    test("TC-015 Search accounts", async ({ page }) => {
        await loginAs(page, "admin.educheck");
        await openFromSidebar(page, "Accounts");
        await page.getByPlaceholder("Search accounts...").fill("grade6");
        await expect(row(page, "adviser.grade6a")).toBeVisible();
        await expect(row(page, "subject.grade6a")).toBeVisible();
        await expect(page.locator("tbody tr")).toHaveCount(2);
    });

    test("TC-016 Teacher details are kept with the account", async ({ page }) => {
        await loginAs(page, "admin.educheck");
        await openFromSidebar(page, "Accounts");
        await page.getByRole("button", { name: "Edit Jose Miguel Reyes" }).click();
        await page.getByLabel("Contact No. (optional)").fill("09998887777");
        await page.getByRole("button", { name: "Save Changes" }).click();
        await expect(page.getByRole("heading", { name: "Edit Account" })).toHaveCount(0);

        await page.reload();
        await page.getByRole("button", { name: "Edit Jose Miguel Reyes" }).click();
        await expect(page.getByLabel("Contact No. (optional)")).toHaveValue("09998887777");
        await page.getByRole("button", { name: "Close" }).click();

        // There is no separate Teacher Management page.
        await page.goto("/teachers");
        await expect(page).toHaveURL(/\/accounts$/);
    });

    test("TC-073 Principal approves a new account", async ({ page }) => {
        await loginAs(page, "principal.educheck");
        await expect(page.getByText(/1 account waiting for your approval/)).toBeVisible();
        await page.getByRole("button", { name: "Review", exact: true }).click();
        await expect(page).toHaveURL(/\/account-approvals$/);

        const request = row(page, NEW.email);
        await expect(request).toContainText("Test Teacher");
        await expect(request).toContainText("Subject Teacher");
        await request.getByRole("button", { name: "Approve" }).click();
        await expect(row(page, NEW.email)).toHaveCount(0);
        await logout(page);

        await loginAs(page, "admin.educheck");
        await openFromSidebar(page, "Accounts");
        await expect(row(page, NEW.username)).toContainText("Awaiting Setup");
        await expect(row(page, NEW.username).getByRole("button", { name: "Finish setup" })).toBeVisible();
    });

    test("TC-074 Principal rejects an account with a reason", async ({ page }) => {
        await loginAs(page, "admin.educheck");
        await openFromSidebar(page, "Accounts");
        await openAddAccount(page, REJECTED);
        await page.getByRole("button", { name: "Create Account" }).click();
        await expect(row(page, REJECTED.username)).toContainText("Pending Approval");
        await logout(page);

        await loginAs(page, "principal.educheck");
        await openFromSidebar(page, "Account Approvals");
        await row(page, REJECTED.email).getByRole("button", { name: "Reject" }).click();
        // Empty reason is refused.
        await page.getByRole("button", { name: "Confirm Reject" }).click();
        await expect(page.getByText("Give a reason so the Administrator knows what to correct.")).toBeVisible();
        await expect(row(page, REJECTED.email)).toHaveCount(1);

        await page.getByLabel("Reason (shown to the School Administrator)").fill("Not on the school's list of teachers.");
        await page.getByRole("button", { name: "Confirm Reject" }).click();
        await expect(row(page, REJECTED.email)).toHaveCount(0);
        await logout(page);

        await loginAs(page, "admin.educheck");
        await openFromSidebar(page, "Accounts");
        await expect(row(page, REJECTED.username)).toContainText("Rejected");
        await expect(row(page, REJECTED.username)).toContainText("Not on the school's list of teachers.");
    });

    test("TC-075 Admin finishes the setup of an approved account", async ({ page }) => {
        await loginAs(page, "admin.educheck");
        await openFromSidebar(page, "Accounts");
        await row(page, NEW.username).getByRole("button", { name: "Finish setup" }).click();
        await page.getByLabel("Employee No.").fill("EMP-2026-099");
        await page.getByLabel("Temporary Password").fill(TEMP_PASSWORD);
        await page.getByRole("button", { name: "Activate & Send Email" }).click();
        await page.getByRole("button", { name: "Done" }).click();
        await expect(row(page, NEW.username)).toContainText("Active");
        await expect(row(page, NEW.username)).toContainText("EMP-2026-099");

        // The email carries the username and the temporary password.
        const mail = outbox().filter((m) => m.to === NEW.email).pop();
        expect(mail, "an email to the new account").toBeTruthy();
        expect(mail.text).toContain(NEW.username);
        expect(mail.text).toContain(TEMP_PASSWORD);
    });

    test("TC-076 Temporary password must be replaced at first sign-in", async ({ page }) => {
        await login(page, NEW.username, TEMP_PASSWORD);
        await expect(page.getByRole("heading", { name: "Set your own password" })).toBeVisible();
        await page.goto("/dashboard");
        await expect(page.getByRole("heading", { name: "Set your own password" })).toBeVisible();

        await page.getByLabel("Temporary password").fill(TEMP_PASSWORD);
        await page.getByLabel("New password", { exact: true }).fill(OWN_PASSWORD);
        await page.getByLabel("Confirm new password").fill("Different2026");
        await page.getByRole("button", { name: "Save and continue" }).click();
        await expect(page.getByRole("alert")).toContainText(/match/i);

        await page.getByLabel("Confirm new password").fill(OWN_PASSWORD);
        await page.getByRole("button", { name: "Save and continue" }).click();
        await expect(page).toHaveURL(/\/dashboard$/);
        const skip = page.getByRole("button", { name: "Skip" });
        if (await skip.isVisible({ timeout: 1500 }).catch(() => false)) await skip.click();
        await logout(page);

        await login(page, NEW.username, TEMP_PASSWORD);
        await expect(page.getByText("Username or password is incorrect")).toBeVisible();
        await loginAs(page, NEW.username, OWN_PASSWORD);
    });

    test("TC-014 Admin resets a user's password", async ({ page }) => {
        await loginAs(page, "admin.educheck");
        await openFromSidebar(page, "Accounts");
        await page.getByRole("button", { name: "Edit Test Teacher" }).click();
        await page.getByLabel("Reset Password").fill(RESET_PASSWORD);
        await page.getByRole("button", { name: "Save Changes" }).click();
        await expect(page.getByRole("heading", { name: "Edit Account" })).toHaveCount(0);
        await logout(page);

        await login(page, NEW.username, OWN_PASSWORD);
        await expect(page.getByText("Username or password is incorrect")).toBeVisible();
        // The new password works and must be replaced, like a temporary one.
        await login(page, NEW.username, RESET_PASSWORD);
        await expect(page.getByRole("heading", { name: "Set your own password" })).toBeVisible();
    });

    test("TC-013 Edit an account and deactivate it", async ({ page }) => {
        await loginAs(page, "admin.educheck");
        await openFromSidebar(page, "Accounts");
        await page.getByRole("button", { name: "Edit Test Teacher" }).click();
        await page.getByLabel("Last Name").fill("Teacher-Edited");
        await page.getByLabel("Status").selectOption("Inactive");
        await page.getByRole("button", { name: "Save Changes" }).click();
        await expect(row(page, NEW.username)).toContainText("Teacher-Edited");
        await expect(row(page, NEW.username)).toContainText("Inactive");
    });

    test("TC-004 Inactive account cannot log in", async ({ page }) => {
        await login(page, NEW.username, RESET_PASSWORD);
        await expect(page.getByText("This account is inactive.")).toBeVisible();
        await expect(page).toHaveURL(/\/$/);
    });
});
