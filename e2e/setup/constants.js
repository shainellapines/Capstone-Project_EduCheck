const path = require("path");

const ROOT = path.join(__dirname, "../..");
const RUN_DIR = path.join(__dirname, "../.run");

const E2E = {
    db: "educheck_e2e",
    apiPort: 5317,
    webPort: 4317,
    apiUrl: "http://127.0.0.1:5317",
    webUrl: "http://127.0.0.1:4317",
    outbox: path.join(RUN_DIR, "outbox.jsonl"),
    stateFile: path.join(RUN_DIR, "state.json"),
};

module.exports = {
    E2E,
    ROOT,
    RUN_DIR,
    BACKEND_DIR: path.join(ROOT, "backend"),
    FRONTEND_DIR: path.join(ROOT, "frontend"),
    UAT_FILES: path.join(ROOT, "03-Testing/UAT-files"),
    PASSWORD: "Passw0rd1",
};
