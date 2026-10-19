// Resets the remote-evaluation database (see remote-eval.js) to a clean start:
//
//   npm run remote:reset
//
// Rebuilds educheck_eval (or EVAL_DB_NAME) from the newest UAT-BASELINE_*.sql,
// applies the migrations made after that baseline (010, 011), and puts back
// the evaluation passwords the accounts had, so the access sheet stays valid.
// It never touches the UAT database named in backend/.env (DB_NAME).

const { execFileSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const readline = require("readline");
const { Client } = require("pg");

require("dotenv").config({ path: path.join(__dirname, "..", ".env"), quiet: true });

const MIGRATIONS_DIR = path.join(__dirname, "..", "..", "02-Product Design", "06-Database", "SQL", "migrations");
const AFTER_BASELINE = ["010_account_approval.sql", "011_account_setup.sql"];

const findPgTool = (name) => {
    const root = "C:\\Program Files\\PostgreSQL";
    if (process.platform === "win32" && fs.existsSync(root)) {
        const versions = fs
            .readdirSync(root)
            .filter((version) => fs.existsSync(path.join(root, version, "bin", `${name}.exe`)))
            .sort((a, b) => Number(b) - Number(a));
        if (versions.length > 0) return path.join(root, versions[0], "bin", `${name}.exe`);
    }
    return name;
};

const ask = (question) =>
    new Promise((resolve) => {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.trim().toLowerCase());
        });
    });

const connect = async (database) => {
    const client = new Client({
        host: process.env.DB_HOST || "localhost",
        port: process.env.DB_PORT || 5432,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database,
    });
    await client.connect();
    return client;
};

// The current password hashes, if the evaluation database already exists.
const savedPasswords = async (database) => {
    const admin = await connect("postgres");
    const exists = (await admin.query("SELECT 1 FROM pg_database WHERE datname = $1", [database])).rowCount > 0;
    await admin.end();
    if (!exists) return [];
    const client = await connect(database);
    const { rows } = await client.query("SELECT username, password_hash FROM users");
    await client.end();
    return rows;
};

const main = async () => {
    const database = process.env.EVAL_DB_NAME || "educheck_eval";
    if (!/^[A-Za-z0-9_]+$/.test(database)) throw new Error(`Unexpected database name "${database}".`);
    if (database === process.env.DB_NAME) throw new Error(`"${database}" is the UAT database; refusing to reset it.`);

    const backupDir = process.env.BACKUP_DIR || path.join(os.homedir(), "EduCheck-db-backups");
    const baselines = fs.readdirSync(backupDir).filter((name) => /^UAT-BASELINE_.*\.sql$/.test(name)).sort();
    if (baselines.length === 0) throw new Error(`No UAT-BASELINE_*.sql file in ${backupDir}.`);
    const baseline = path.join(backupDir, baselines[baselines.length - 1]);

    console.log(`This erases the evaluation database "${database}" and rebuilds it from:\n  ${baseline}`);
    console.log(`The UAT database "${process.env.DB_NAME}" is not touched. Stop "npm run remote" first.`);
    if ((await ask('Type "yes" to continue: ')) !== "yes") {
        console.log("Cancelled. Nothing was changed.");
        return;
    }

    const passwords = await savedPasswords(database);

    const psql = findPgTool("psql");
    const connection = ["-h", process.env.DB_HOST || "localhost", "-p", String(process.env.DB_PORT || 5432), "-U", process.env.DB_USER || "postgres"];
    const options = { env: { ...process.env, PGPASSWORD: process.env.DB_PASSWORD || "" }, stdio: ["ignore", "ignore", "inherit"] };
    const run = (args) => execFileSync(psql, [...connection, "-q", "-v", "ON_ERROR_STOP=1", ...args], options);

    run(["-d", "postgres", "-c", `DROP DATABASE IF EXISTS "${database}" WITH (FORCE)`, "-c", `CREATE DATABASE "${database}"`]);
    run(["-d", database, "-f", baseline]);
    for (const migration of AFTER_BASELINE) run(["-d", database, "-f", path.join(MIGRATIONS_DIR, migration)]);

    if (passwords.length > 0) {
        const client = await connect(database);
        for (const { username, password_hash } of passwords) {
            await client.query("UPDATE users SET password_hash = $1 WHERE username = $2", [password_hash, username]);
        }
        await client.end();
        console.log("Evaluation passwords kept.");
    } else {
        console.log("New database: the accounts have the baseline's passwords.");
    }

    console.log(`\nDone. "${database}" is back to ${path.basename(baseline)} (with migrations 010 and 011).`);
};

main().catch((error) => {
    console.error(`Reset failed: ${error.message}`);
    process.exit(1);
});
