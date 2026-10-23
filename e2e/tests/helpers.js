const fs = require("fs");
const path = require("path");
const { expect } = require("@playwright/test");
const { E2E, UAT_FILES, PASSWORD } = require("../setup/constants");

const state = () => JSON.parse(fs.readFileSync(E2E.stateFile, "utf8"));

const uatFile = (name) => path.join(UAT_FILES, name);
const perSubjectFile = (subject) => path.join(UAT_FILES, "per-subject", `ecr-rizal-${subject.replace(/ /g, "-")}.xlsx`);

// Sign in through the login page, as a user would.
const login = async (page, username, password = PASSWORD) => {
    await page.goto("/");
    const user = page.getByLabel("Username");
    // The fields stay read-only until clicked (it stops browsers autofilling).
    await user.click();
    await user.fill(username);
    const pass = page.getByLabel("Password", { exact: true });
    await pass.click();
    await pass.fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
};

const loginAs = async (page, username, password = PASSWORD) => {
    await login(page, username, password);
    await expect(page).toHaveURL(/\/dashboard$/);
    // The first-sign-in guide opens on every fresh browser; close it.
    const skip = page.getByRole("button", { name: "Skip" });
    if (await skip.isVisible({ timeout: 1500 }).catch(() => false)) await skip.click();
};

const logout = async (page) => {
    await page.getByRole("button", { name: "Logout" }).click();
    await expect(page).toHaveURL(/\/$/);
};

// The upload page has finished loading its subject tiles.
const uploadTilesLoaded = async (page) => {
    await expect(page.locator(".cru-tile").first()).toBeVisible();
    await expect(page.locator(".cru-tile.is-skeleton")).toHaveCount(0);
};

// Click a sidebar item by its visible label.
const openFromSidebar = (page, label) => page.locator("aside.sidebar").getByText(label, { exact: true }).click();

// Every email the backend "sent" during this run.
const outbox = () =>
    fs.existsSync(E2E.outbox)
        ? fs.readFileSync(E2E.outbox, "utf8").trim().split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line))
        : [];

// Direct API call, only for reading state the UI does not show.
const api = async (method, url, { username, body } = {}) => {
    let token;
    if (username) {
        const res = await fetch(`${E2E.apiUrl}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password: PASSWORD }),
        });
        token = (await res.json()).token;
    }
    const res = await fetch(`${E2E.apiUrl}${url}`, {
        method,
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { "Content-Type": "application/json" } : {}) },
        body: body ? JSON.stringify(body) : undefined,
    });
    return { status: res.status, body: await res.json().catch(() => null) };
};

module.exports = { uploadTilesLoaded, state, uatFile, perSubjectFile, login, loginAs, logout, openFromSidebar, outbox, api, PASSWORD };
