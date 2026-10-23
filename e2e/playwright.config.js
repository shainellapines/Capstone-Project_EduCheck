const { defineConfig } = require("@playwright/test");
const { E2E } = require("./setup/constants");

// Black-box UI tests. The files run one at a time in name order (01-..., 02-...)
// because later test cases build on earlier ones, just like the manual run sheet.
module.exports = defineConfig({
    testDir: "./tests",
    globalSetup: require.resolve("./setup/global-setup.js"),
    fullyParallel: false,
    workers: 1,
    retries: 0,
    timeout: 60_000,
    expect: { timeout: 10_000 },
    outputDir: ".run/artifacts",
    reporter: [
        ["list"],
        ["json", { outputFile: ".run/results.json" }],
        ["html", { outputFolder: ".run/html-report", open: "never" }],
    ],
    use: {
        baseURL: E2E.webUrl,
        // The Chrome installed on this computer; no browser download needed.
        channel: "chrome",
        headless: true,
        viewport: { width: 1440, height: 900 },
        screenshot: "on",
        trace: "retain-on-failure",
    },
});
