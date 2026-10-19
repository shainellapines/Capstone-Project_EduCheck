// Remote evaluation: lets someone outside the school network (an IT expert
// evaluator) use EduCheck through one temporary https link.
//
//   npm run remote
//
// What it does, in order:
//   1. starts a Cloudflare quick tunnel and waits for its https link;
//   2. builds the web app so it calls the API on that same link (/api);
//   3. starts the backend on its own port against the EVALUATION database
//      (educheck_eval by default), never the UAT data in educheck_db;
//   4. serves the web app and forwards /api to the backend, on one port,
//      which is what the tunnel exposes.
// The mobile app uses the same link as its Server address.
//
// The laptop must stay on and online while the evaluator works. The link
// changes every time this is started. Ctrl+C stops everything.
//
// Settings (optional, in the environment or backend/.env):
//   EVAL_DB_NAME   database to use          (default educheck_eval)
//   EVAL_SEND_EMAIL=yes  send account emails (off by default; see startBackend)
//   CLOUDFLARED    path to cloudflared.exe  (default ~/tools/cloudflared.exe, then PATH)

const { spawn, execFileSync } = require("child_process");
const fs = require("fs");
const http = require("http");
const os = require("os");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "..", ".env"), quiet: true });

const BACKEND_DIR = path.join(__dirname, "..");
const FRONTEND_DIR = path.join(BACKEND_DIR, "..", "frontend");
const WEB_DIR = path.join(os.tmpdir(), "educheck-remote-web");
const GATEWAY_PORT = 5170;
const BACKEND_PORT = 5055;
const EVAL_DB = process.env.EVAL_DB_NAME || "educheck_eval";
const SEND_EMAIL = process.env.EVAL_SEND_EMAIL === "yes";

const children = [];

const stopAll = (code = 0) => {
    for (const child of children) {
        try {
            child.kill();
        } catch {
            // already stopped
        }
    }
    process.exit(code);
};
process.on("SIGINT", () => stopAll(0));

const findCloudflared = () => {
    const candidates = [process.env.CLOUDFLARED, path.join(os.homedir(), "tools", "cloudflared.exe")].filter(Boolean);
    return candidates.find((file) => fs.existsSync(file)) || "cloudflared";
};

const startTunnel = () =>
    new Promise((resolve, reject) => {
        const tunnel = spawn(findCloudflared(), ["tunnel", "--no-autoupdate", "--url", `http://localhost:${GATEWAY_PORT}`]);
        children.push(tunnel);
        const timer = setTimeout(() => reject(new Error("No tunnel link after 60 seconds. Check the internet connection.")), 60000);
        const onData = (data) => {
            const match = String(data).match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
            if (match) {
                clearTimeout(timer);
                resolve(match[0]);
            }
        };
        tunnel.stdout.on("data", onData);
        tunnel.stderr.on("data", onData);
        tunnel.on("error", (error) => reject(new Error(`cloudflared could not start: ${error.message}`)));
        tunnel.on("exit", (code) => console.log(`\nThe tunnel stopped (code ${code}). The link no longer works.`));
    });

// VITE_API_URL "/" makes the web app call /api on whatever link it was opened from.
const buildWeb = () => {
    console.log("Building the web app...");
    const vite = path.join(FRONTEND_DIR, "node_modules", "vite", "bin", "vite.js");
    execFileSync(process.execPath, [vite, "build", "--outDir", WEB_DIR, "--emptyOutDir"], {
        cwd: FRONTEND_DIR,
        env: { ...process.env, VITE_API_URL: "/" },
        stdio: ["ignore", "ignore", "inherit"],
    });
};

const startBackend = (link) => {
    const backend = spawn(process.execPath, ["src/server.js"], {
        cwd: BACKEND_DIR,
        env: {
            ...process.env,
            DB_NAME: EVAL_DB,
            PORT: String(BACKEND_PORT),
            CORS_ORIGIN: link,
            APP_URL: link,
            // An evaluator may type any @deped.gov.ph address, which could
            // belong to a real person, so no email leaves the laptop: the
            // temporary password is shown on screen instead.
            ...(SEND_EMAIL ? {} : { SMTP_PASS: "" }),
        },
        stdio: ["ignore", "inherit", "inherit"],
    });
    children.push(backend);
    // Keep the evaluator's session alive: if the backend stops, start it again.
    backend.on("exit", (code) => {
        children.splice(children.indexOf(backend), 1);
        console.log(`\n${new Date().toLocaleTimeString()} The backend stopped (code ${code}); restarting it in 3 seconds.`);
        setTimeout(() => startBackend(link), 3000);
    });
};

const TYPES = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript",
    ".css": "text/css",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".ico": "image/x-icon",
    ".json": "application/json",
    ".woff2": "font/woff2",
};

const sendFile = (res, file) => {
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
};

// /api goes to the backend; anything else is a file of the web app, or
// index.html so that page links like /dashboard open the app.
const startGateway = () => {
    const server = http.createServer((req, res) => {
        if (req.url.startsWith("/api/") || req.url === "/api") {
            const headers = { ...req.headers, host: `localhost:${BACKEND_PORT}` };
            // Every request arrives from the tunnel on this computer; the
            // backend does not trust forwarded addresses, so drop them.
            delete headers["x-forwarded-for"];
            const upstream = http.request(
                { host: "localhost", port: BACKEND_PORT, path: req.url, method: req.method, headers },
                (answer) => {
                    res.writeHead(answer.statusCode, answer.headers);
                    answer.pipe(res);
                }
            );
            upstream.on("error", () => {
                res.writeHead(502, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ message: "The EduCheck server is not running." }));
            });
            req.pipe(upstream);
            return;
        }

        const requested = path.normalize(path.join(WEB_DIR, decodeURIComponent(req.url.split("?")[0])));
        const inside = requested.startsWith(WEB_DIR);
        if (inside && fs.existsSync(requested) && fs.statSync(requested).isFile()) return sendFile(res, requested);
        return sendFile(res, path.join(WEB_DIR, "index.html"));
    });
    server.listen(GATEWAY_PORT);
};

const main = async () => {
    console.log(`Remote evaluation: database "${EVAL_DB}" (the UAT data in "${process.env.DB_NAME}" is not used).`);
    console.log(SEND_EMAIL ? "Account emails: ON.\n" : "Account emails: OFF (temporary passwords are shown on screen).\n");
    console.log("Starting the tunnel...");
    const link = await startTunnel();
    buildWeb();
    startBackend(link);
    startGateway();

    console.log("\n==============================================================");
    console.log(" EduCheck is reachable at:");
    console.log(`   ${link}`);
    console.log(" Web: open the link. Mobile app: use the link as Server address.");
    console.log(" Keep this window open and the laptop online. Ctrl+C stops it.");
    console.log("==============================================================\n");
};

main().catch((error) => {
    console.error(`Remote evaluation failed: ${error.message}`);
    stopAll(1);
});
