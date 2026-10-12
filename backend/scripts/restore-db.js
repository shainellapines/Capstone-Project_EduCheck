// Database restore (the other half of backup-db.js).
//
//   npm run restore                 restores the newest UAT-BASELINE_*.sql
//   npm run restore -- <file.sql>   restores that file instead
//
// Takes a safety backup first, asks for "yes", then replaces the database
// named in backend/.env with the backup's contents. Used between UAT rounds
// to return to the baseline. Stop the backend first if you can; open
// connections are closed by the restore anyway.

const { execFileSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const readline = require("readline");

require("dotenv").config({ path: path.join(__dirname, "..", ".env"), quiet: true });

const findPgTool = (name) => {
    // Windows installs keep the PostgreSQL tools off PATH: take the newest version folder.
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

const pickFile = (backupDir) => {
    const given = process.argv[2];
    if (given) return path.resolve(given);

    const baselines = fs
        .readdirSync(backupDir)
        .filter((name) => /^UAT-BASELINE_.*\.sql$/.test(name))
        .sort();
    if (baselines.length === 0) throw new Error(`No UAT-BASELINE_*.sql file in ${backupDir}.`);
    return path.join(backupDir, baselines[baselines.length - 1]);
};

const main = async () => {
    const database = process.env.DB_NAME;
    if (!database) throw new Error("DB_NAME is not set in backend/.env.");
    if (!/^[A-Za-z0-9_]+$/.test(database)) throw new Error(`Unexpected DB_NAME "${database}".`);

    const backupDir = process.env.BACKUP_DIR || path.join(os.homedir(), "EduCheck-db-backups");
    const file = pickFile(backupDir);
    if (!fs.existsSync(file)) throw new Error(`File not found: ${file}`);

    console.log(`This replaces EVERYTHING in the "${database}" database with:\n  ${file}\n`);
    console.log("A safety backup of the current data is taken first.");
    if ((await ask('Type "yes" to continue: ')) !== "yes") {
        console.log("Cancelled. Nothing was changed.");
        return;
    }

    console.log("\nSafety backup:");
    execFileSync(process.execPath, [path.join(__dirname, "backup-db.js")], { stdio: "inherit" });

    const psql = findPgTool("psql");
    const connection = [
        "-h", process.env.DB_HOST || "localhost",
        "-p", String(process.env.DB_PORT || 5432),
        "-U", process.env.DB_USER || "postgres",
    ];
    const options = { env: { ...process.env, PGPASSWORD: process.env.DB_PASSWORD || "" }, stdio: ["ignore", "inherit", "inherit"] };

    console.log("\nRestoring...");
    execFileSync(psql, [...connection, "-d", "postgres", "-q", "-v", "ON_ERROR_STOP=1",
        "-c", `DROP DATABASE IF EXISTS "${database}" WITH (FORCE)`,
        "-c", `CREATE DATABASE "${database}"`], options);
    execFileSync(psql, [...connection, "-d", database, "-q", "-v", "ON_ERROR_STOP=1", "-f", file], options);

    console.log(`\nDone. "${database}" now matches ${path.basename(file)}.`);
    console.log("Restart the backend if it was running (npm run dev).");
};

main().catch((error) => {
    console.error(`Restore failed: ${error.message}`);
    process.exit(1);
});
