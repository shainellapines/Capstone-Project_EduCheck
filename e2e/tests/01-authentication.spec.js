const { test, expect } = require("@playwright/test");
const { login, loginAs, logout } = require("./helpers");

test.describe("Authentication", () => {
    test("TC-001 Log in with valid credentials", async ({ page }) => {
        await loginAs(page, "subject.grade6a");
        await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

        // Only the Subject Teacher's menu items.
        const sidebar = page.locator("aside.sidebar");
        await expect(sidebar.getByText("Upload e-Class Record")).toBeVisible();
        for (const other of ["Accounts", "Audit Log", "Submission Review", "Consolidated Records", "Account Approvals"]) {
            await expect(sidebar.getByText(other, { exact: true })).toHaveCount(0);
        }
    });

    test("TC-002 Log in with a wrong password", async ({ page }) => {
        await login(page, "subject.grade6a", "WrongPass1");
        const message = page.getByText("Username or password is incorrect");
        await expect(message).toBeVisible();
        // The message does not say which field was wrong.
        await expect(message).toContainText("Check both");
        await expect(page).toHaveURL(/\/$/);
    });

    test("TC-003 Log in with empty fields", async ({ page }) => {
        await page.goto("/");
        await page.getByRole("button", { name: "Sign in" }).click();
        await expect(page.getByText("Enter your username.")).toBeVisible();
        await expect(page).toHaveURL(/\/$/);

        const user = page.getByLabel("Username");
        await user.click();
        await user.fill("subject.grade6a");
        await page.getByRole("button", { name: "Sign in" }).click();
        await expect(page.getByText("Enter your password.")).toBeVisible();
        await expect(page).toHaveURL(/\/$/);
    });

    test("TC-006 Log out ends the session", async ({ page }) => {
        await loginAs(page, "subject.grade6a");
        await logout(page);

        await page.goBack();
        await expect(page).toHaveURL(/\/$/);
        await page.goto("/dashboard");
        await expect(page).toHaveURL(/\/$/);
        await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
    });

    test("TC-007 A role cannot open another role's page by URL", async ({ page }) => {
        await loginAs(page, "subject.grade6a");
        for (const url of ["/accounts", "/audit-log", "/consolidated-records"]) {
            await page.goto(url);
            await expect(page).toHaveURL(/\/dashboard$/);
            await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
        }
    });

    test("TC-067 Session expires", async ({ page }) => {
        await loginAs(page, "subject.grade6a");
        // An expired token stands in for 8 idle hours.
        await page.evaluate(() => {
            const b64 = (o) => btoa(JSON.stringify(o)).replace(/=+$/, "");
            localStorage.setItem("educheck_token", `${b64({ alg: "HS256" })}.${b64({ exp: 1 })}.x`);
        });
        await page.locator("aside.sidebar").getByText("Notifications", { exact: true }).click();
        await expect(page).toHaveURL(/\/$/);
        await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
    });
});
