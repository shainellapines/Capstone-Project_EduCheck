const { test, expect } = require("@playwright/test");
const { loginAs, openFromSidebar } = require("./helpers");

test.describe.configure({ mode: "serial" });

test.describe("Analytics, notifications and performance", () => {
    test("TC-050 View academic analytics", async ({ page }) => {
        await loginAs(page, "admin.educheck");

        // A second school year to switch to (opened in Settings).
        await openFromSidebar(page, "Settings");
        await page.getByLabel("Add School Year").fill("2026-2027");
        await page.getByRole("button", { name: "Add", exact: true }).click();
        await expect(page.getByText(/School year 2026-2027 added/)).toBeVisible();

        await openFromSidebar(page, "Academic Analytics");
        const yearSelect = page.locator(".dashboard-header select");
        await expect(page.getByText("Intervention Flag List")).toBeVisible();
        await expect(page.getByText("Graded Entries").first()).toBeVisible();
        await expect(page.getByText(/Rizal/).first()).toBeVisible();

        // The figures follow the selected school year.
        await yearSelect.selectOption({ label: "2026-2027 (Inactive)" });
        await expect(page.getByText(/No graded uploads yet for 2026-2027/)).toBeVisible();
        await yearSelect.selectOption({ label: "2025-2026 (Active)" });
        await expect(page.getByText("Intervention Flag List")).toBeVisible();
    });

    test("TC-051 Notifications appear and can be marked read", async ({ page }, testInfo) => {
        await loginAs(page, "subject.grade6a");
        const badge = page.locator("aside.sidebar .notification-badge");
        await expect(badge).toBeVisible();
        const before = Number(await badge.textContent());
        expect(before).toBeGreaterThan(0);

        await openFromSidebar(page, "Notifications");
        await expect(page.locator(".notif-card").first()).toBeVisible();

        // Opening one marks it read.
        await page.locator(".notif-card.unread").first().click();
        await expect(page.locator(".notif-header-status")).toContainText(`${before - 1} unread`);

        await page.getByRole("button", { name: "Mark all read" }).click();
        await expect(page.locator(".notif-header-status")).toContainText("All caught up");
        await expect(page.locator(".notif-card.unread")).toHaveCount(0);
        // The sidebar badge is refreshed on a timer, not right away, so it
        // is checked after the page loads again.
        testInfo.annotations.push({ type: "finding", description: "The sidebar notification badge keeps the old count after Mark all read until the next refresh or page load." });
        await page.reload();
        await expect(page.locator(".notif-header-status")).toContainText("All caught up");
        await expect(badge).toHaveCount(0);
    });

    test("TC-062 Page load time", async ({ page }, testInfo) => {
        await loginAs(page, "admin.educheck");
        const timings = [];
        const measure = async (item, ready) => {
            const started = Date.now();
            await openFromSidebar(page, item);
            await expect(ready()).toBeVisible({ timeout: 20_000 });
            const seconds = (Date.now() - started) / 1000;
            timings.push(`${item}: ${seconds.toFixed(1)} s`);
            expect(seconds, `${item} should show its data without a timeout`).toBeLessThan(20);
        };

        await measure("Submission Review", () => page.locator(".cr-student-row").first());
        await measure("Academic Analytics", () => page.getByText("Intervention Flag List"));
        await measure("Records & SF10", () => page.getByLabel("LRN or Name"));
        await measure("Dashboard", () => page.getByText("Recent Submissions"));
        testInfo.annotations.push({ type: "measured", description: `${timings.join("; ")} (local server)` });
    });
});
