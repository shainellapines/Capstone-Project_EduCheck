// Database backup (SPMP §11 risk table: "Schedule regular database backups").
//
//   npm run backup
//
// Writes a plain-SQL pg_dump of the database named in backend/.env to
// BACKUP_DIR (default: <home>/EduCheck-db-backups) as
// educheck_db_YYYY-MM-DD_HHMM.sql, then keeps only the newest BACKUP_KEEP
// files (default 14). Restore into an empty database with:
//   psql -U postgres -d educheck_db -f <file>.sql
// Schedule it with Windows Task Scheduler to make it regular.

const { execFileSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "..", ".env"), quiet: true });

const findPgDump = () => {
    if (process.env.PG_DUMP_PATH) return process.env.PG_DUMP_PATH;

    // Windows installs keep pg_dump off PATH: take the newest version folder.
    const root = "C:\\Program Files\\PostgreSQL";
    if (process.platform === "win32" && fs.existsSync(root)) {
        const versions = fs
            .readdirSync(root)
            .filter((name) => fs.existsSync(path.join(root, name, "bin", "pg_dump.exe")))
            .sort((a, b) => Number(b) - Number(a));
        if (versions.length > 0) return path.join(root, versions[0], "bin", "pg_dump.exe");
    }

    return "pg_dump";
};

const timestamp = () => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return (
        `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` +
        `_${pad(now.getHours())}${pad(now.getMinutes())}`
    );
};

const main = () => {
    const database = process.env.DB_NAME;
    if (!database) throw new Error("DB_NAME is not set in backend/.env.");

    const backupDir = process.env.BACKUP_DIR || path.join(os.homedir(), "EduCheck-db-backups");
    const keep = Number(process.env.BACKUP_KEEP) || 14;
    fs.mkdirSync(backupDir, { recursive: true });

    const file = path.join(backupDir, `${database}_${timestamp()}.sql`);
    execFileSync(
        findPgDump(),
        [
            "-h", process.env.DB_HOST || "localhost",
            "-p", String(process.env.DB_PORT || 5432),
            "-U", process.env.DB_USER || "postgres",
            "-d", database,
            "-f", file,
        ],
        { env: { ...process.env, PGPASSWORD: process.env.DB_PASSWORD || "" }, stdio: ["ignore", "inherit", "inherit"] }
    );

    const size = fs.statSync(file).size;
    if (size === 0) throw new Error(`pg_dump wrote an empty file: ${file}`);
    console.log(`Backup written: ${file} (${Math.round(size / 1024)} KB)`);

    // Keep the newest `keep` scheduled backups; other files in the folder are left alone.
    const pattern = new RegExp(`^${database}_\\d{4}-\\d{2}-\\d{2}_\\d{4}\\.sql$`);
    const old = fs
        .readdirSync(backupDir)
        .filter((name) => pattern.test(name))
        .sort()
        .reverse()
        .slice(keep);
    old.forEach((name) => fs.unlinkSync(path.join(backupDir, name)));
    if (old.length > 0) console.log(`Removed ${old.length} older backup(s); keeping the newest ${keep}.`);
};

try {
    main();
} catch (error) {
    console.error(`Backup failed: ${error.message}`);
    process.exit(1);
}
