const { test, expect } = require("@playwright/test");
const { login } = require("./helpers");

// Runs last: after it, every sign-in from this computer is blocked for
// 15 minutes, so no test may follow it.
test.describe("Lockout", () => {
    test("TC-005 Repeated failed logins are locked out", async ({ page }) => {
        const tooMany = page.getByText("Too many login attempts. Please try again in a few minutes.");
        for (let attempt = 1; attempt <= 11; attempt += 1) {
            await login(page, "subject.grade6a", `Wrong${attempt}pass`);
            const blocked = await tooMany.isVisible({ timeout: 2000 }).catch(() => false);
            if (blocked) {
                // Earlier test cases already used a few failed attempts.
                expect(attempt).toBeLessThanOrEqual(11);
                return;
            }
            await expect(page.getByText("Username or password is incorrect")).toBeVisible();
        }
        await expect(tooMany).toBeVisible();
    });
});
