const { test, expect } = require("@playwright/test");
const { login, loginAs, logout, openFromSidebar, PASSWORD } = require("./helpers");

const changePassword = async (page, current, next, confirm = next) => {
    await page.getByLabel("Current Password").fill(current);
    await page.getByLabel("New Password", { exact: true }).fill(next);
    await page.getByLabel("Confirm New Password").fill(confirm);
    await page.getByRole("button", { name: "Update Password" }).click();
};

test.describe("Own account", () => {
    test("TC-009 Settings shows own profile and assignments", async ({ page }) => {
        await loginAs(page, "subject.grade6a");
        // The Dashboard header shows the full name.
        await expect(page.getByText("Jose Miguel Reyes").first()).toBeVisible();

        await openFromSidebar(page, "Settings");
        const info = page.locator(".settings-card", { hasText: "Account Information" });
        await expect(info.getByText("Jose Miguel Reyes")).toBeVisible();
        await expect(info.getByText("EMP-2026-002")).toBeVisible();
        await expect(info.getByText("09181234567")).toBeVisible();
        await expect(info.getByText(/ask the School Administrator/i)).toBeVisible();
        // Read-only: no inputs in the profile card.
        await expect(info.locator("input")).toHaveCount(0);

        const assignments = page.locator(".settings-card", { hasText: "My Assignments" });
        for (const subject of ["Mathematics", "Araling Panlipunan", "MAPEH", "TLE"]) {
            await expect(assignments.getByText(subject, { exact: true })).toBeVisible();
        }
        // Only this teacher's subjects, with the school year.
        for (const other of ["Filipino", "English", "Science", "ESP"]) {
            await expect(assignments.getByText(other, { exact: true })).toHaveCount(0);
        }
        await expect(assignments.getByText("2025-2026").first()).toBeVisible();
    });

    test("TC-010 Account without a teacher profile", async ({ page }) => {
        await loginAs(page, "principal.educheck");
        await openFromSidebar(page, "Settings");
        const info = page.locator(".settings-card", { hasText: "Account Information" });
        await expect(info.getByText("principal.educheck").first()).toBeVisible();
        await expect(info.getByText("principal.educheck@deped.gov.ph")).toBeVisible();
        await expect(info.getByText("Principal", { exact: true })).toBeVisible();
        await expect(info.getByText("Active", { exact: true })).toBeVisible();
        await expect(info.getByText("Full Name")).toHaveCount(0);
        await expect(page.getByText("My Assignments")).toHaveCount(0);
    });

    test("TC-011 Weak new password is rejected", async ({ page }) => {
        await loginAs(page, "principal.educheck");
        await openFromSidebar(page, "Settings");
        await changePassword(page, PASSWORD, "abcdefg");
        await expect(page.getByText(/at least 8 characters/i).last()).toBeVisible();
        await expect(page.getByText("Password updated successfully.")).toHaveCount(0);
    });

    test("TC-008 Change own password", async ({ page }) => {
        const newPassword = "Educheck2026";
        await loginAs(page, "principal.educheck");
        await openFromSidebar(page, "Settings");
        await changePassword(page, PASSWORD, newPassword);
        await expect(page.getByText("Password updated successfully.")).toBeVisible();
        await logout(page);

        // The old password no longer works...
        await login(page, "principal.educheck", PASSWORD);
        await expect(page.getByText("Username or password is incorrect")).toBeVisible();
        // ...and the new one does.
        await loginAs(page, "principal.educheck", newPassword);

        // Put the seeded password back for the later test cases.
        await openFromSidebar(page, "Settings");
        await changePassword(page, newPassword, PASSWORD);
        await expect(page.getByText("Password updated successfully.")).toBeVisible();
    });
});
