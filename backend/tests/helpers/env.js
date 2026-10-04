// Test environment: an isolated PostgreSQL database (educheck_test) rebuilt
// from educheck_schema.sql, the real unmodified server spawned on a private
// port, and small helpers to call it as each role. Never touches the dev DB.
const { spawn } = require("child_process");
const fs = require("fs");
const net = require("net");
const os = require("os");
const path = require("path");
const { Client, Pool } = require("pg");
const bcrypt = require("bcryptjs");
const XLSX = require("xlsx");

require("dotenv").config({ path: path.join(__dirname, "../../.env"), quiet: true });

const TEST_DB = "educheck_test";
const BACKEND_DIR = path.join(__dirname, "../..");
const SCHEMA_FILE = path.join(BACKEND_DIR, "../02-Product Design/06-Database/SQL/educheck_schema.sql");
const FIXTURE = path.join(__dirname, "../fixtures/ecr-sample.xlsx");
const PASSWORD = "Passw0rd1";

const dbConfig = (database) => ({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database,
});

const getFreePort = () =>
    new Promise((resolve, reject) => {
        const server = net.createServer();
        server.listen(0, () => {
            const { port } = server.address();
            server.close(() => resolve(port));
        });
        server.on("error", reject);
    });

const rebuildDatabase = async () => {
    const admin = new Client(dbConfig("postgres"));
    await admin.connect();
    await admin.query(
        "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()",
        [TEST_DB]
    );
    await admin.query(`DROP DATABASE IF EXISTS ${TEST_DB}`);
    await admin.query(`CREATE DATABASE ${TEST_DB}`);
    await admin.end();

    const client = new Client(dbConfig(TEST_DB));
    await client.connect();
    await client.query(fs.readFileSync(SCHEMA_FILE, "utf8"));
    await client.end();
};

// Seed: 1 school year, 3 sections, one user per role plus a second Adviser
// (to prove scoping), and the assignments that tie them together.
const seed = async (pool) => {
    const hash = await bcrypt.hash(PASSWORD, 4);
    const ids = {};

    const addUser = async (username, role) => {
        const { rows } = await pool.query(
            "INSERT INTO users (username, password_hash, email, role) VALUES ($1,$2,$3,$4) RETURNING user_id",
            [username, hash, `${username}@test.local`, role]
        );
        return rows[0].user_id;
    };

    const addTeacher = async (userId, n, first, last) => {
        const { rows } = await pool.query(
            "INSERT INTO teachers (user_id, employee_number, first_name, last_name) VALUES ($1,$2,$3,$4) RETURNING teacher_id",
            [userId, `EMP-${n}`, first, last]
        );
        return rows[0].teacher_id;
    };

    await addUser("admin", "admin");
    await addUser("principal", "principal");
    const adviserAUser = await addUser("adviser_a", "adviser");
    const adviserBUser = await addUser("adviser_b", "adviser");
    await addUser("adviser_none", "adviser");
    const subjectUser = await addUser("subject_t", "subject");

    ids.adviserATeacher = await addTeacher(adviserAUser, 1, "Ana", "Adviser-A");
    ids.adviserBTeacher = await addTeacher(adviserBUser, 2, "Ben", "Adviser-B");
    ids.subjectTeacher = await addTeacher(subjectUser, 3, "Sam", "Subject");

    ids.schoolYear = (
        await pool.query("INSERT INTO school_years (school_year) VALUES ('2026-2027') RETURNING school_year_id")
    ).rows[0].school_year_id;

    const addSection = async (name, grade) =>
        (
            await pool.query(
                "INSERT INTO sections (section_name, grade_level) VALUES ($1,$2) RETURNING section_id",
                [name, grade]
            )
        ).rows[0].section_id;

    ids.mabini = await addSection("Mabini", "4");
    ids.rizal = await addSection("Rizal", "4");
    ids.luna = await addSection("Luna", "5");

    const subjectId = async (name, grade) =>
        (await pool.query("SELECT subject_id FROM subjects WHERE subject_name=$1 AND grade_level=$2", [name, grade]))
            .rows[0].subject_id;

    ids.english4 = await subjectId("English", "4");
    ids.math4 = await subjectId("Mathematics", "4");
    ids.english5 = await subjectId("English", "5");

    const assign = (teacher, section, subject) =>
        pool.query(
            "INSERT INTO teacher_assignments (teacher_id, section_id, subject_id, school_year_id) VALUES ($1,$2,$3,$4)",
            [teacher, section, subject, ids.schoolYear]
        );

    await assign(ids.adviserATeacher, ids.mabini, null);
    await assign(ids.adviserBTeacher, ids.rizal, null);
    await assign(ids.subjectTeacher, ids.mabini, ids.english4);
    await assign(ids.subjectTeacher, ids.rizal, ids.english4);
    await assign(ids.subjectTeacher, ids.mabini, ids.math4);

    return ids;
};

// Builds a copy of the sample e-Class Record with an LRN sheet attached
// (the stock sample has none). `lrnFor(index)` returns the LRN for the
// index-th learner; `limit` keeps only the first N learners' LRNs, so the
// rest are treated as having no LRN and are skipped by the importer.
const buildEcr = ({ lrnFor, limit, header = {} }) => {
    const workbook = XLSX.readFile(FIXTURE);
    const input = workbook.Sheets.INPUT;
    const rows = [];

    [
        [12, 61],
        [63, 112],
    ].forEach(([start, end]) => {
        for (let row = start; row <= end; row++) {
            const number = input[`A${row}`]?.v;
            const name = input[`B${row}`]?.v;
            if (number && typeof name === "string") rows.push({ number, name });
        }
    });

    // LRN sheet mirrors INPUT's row layout (A number, B name, C LRN).
    const sheet = {};
    let rowIndex = 0;
    [
        [12, 61],
        [63, 112],
    ].forEach(([start, end]) => {
        for (let row = start; row <= end; row++) {
            const number = input[`A${row}`]?.v;
            const name = input[`B${row}`]?.v;
            if (!number || typeof name !== "string") continue;
            sheet[`A${row}`] = { t: "n", v: number };
            sheet[`B${row}`] = { t: "s", v: name };
            if (limit === undefined || rowIndex < limit) {
                sheet[`C${row}`] = { t: "s", v: lrnFor(rowIndex) };
            }
            rowIndex += 1;
        }
    });
    sheet["!ref"] = "A1:C112";
    workbook.Sheets.LRN = sheet;
    if (!workbook.SheetNames.includes("LRN")) workbook.SheetNames.push("LRN");

    const headerCells = { gradeSection: "J7", teacher: "Q7", subject: "Y7", schoolYear: "Y5" };
    Object.entries(header).forEach(([key, value]) => {
        input[headerCells[key]] = { t: "s", v: value };
    });

    const file = path.join(os.tmpdir(), `ecr-${Date.now()}-${Math.random().toString(36).slice(2)}.xlsx`);
    XLSX.writeFile(workbook, file);
    return { file, learnerCount: rows.length };
};

// 12-digit LRN: 4-digit class prefix + 8-digit running number.
const lrnGenerator = (prefix) => (index) => `${prefix}${String(index + 1).padStart(8, "0")}`;

const startServer = async () => {
    const port = await getFreePort();
    const baseUrl = `http://127.0.0.1:${port}`;

    const child = spawn(process.execPath, ["src/server.js"], {
        cwd: BACKEND_DIR,
        env: { ...process.env, PORT: String(port), DB_NAME: TEST_DB, JWT_SECRET: "test-secret-do-not-use" },
        stdio: ["ignore", "pipe", "pipe"],
    });

    let log = "";
    child.stdout.on("data", (chunk) => (log += chunk));
    child.stderr.on("data", (chunk) => (log += chunk));

    const deadline = Date.now() + 15000;
    while (Date.now() < deadline) {
        try {
            const res = await fetch(`${baseUrl}/`);
            if (res.ok) return { child, baseUrl, getLog: () => log };
        } catch {
            // not up yet
        }
        await new Promise((resolve) => setTimeout(resolve, 150));
    }

    child.kill();
    throw new Error(`Test server failed to start:\n${log}`);
};

const setup = async () => {
    await rebuildDatabase();

    const pool = new Pool(dbConfig(TEST_DB));
    const ids = await seed(pool);
    const server = await startServer();
    const tokens = {};

    const request = async (method, url, { token, body, form } = {}) => {
        const headers = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        let payload;
        if (form) {
            payload = form;
        } else if (body !== undefined && method !== "GET" && method !== "HEAD") {
            headers["Content-Type"] = "application/json";
            payload = JSON.stringify(body);
        }

        const res = await fetch(`${server.baseUrl}${url}`, { method, headers, body: payload });
        let json = null;
        try {
            json = await res.json();
        } catch {
            // non-JSON body
        }
        return { status: res.status, body: json };
    };

    for (const username of ["admin", "principal", "adviser_a", "adviser_b", "adviser_none", "subject_t"]) {
        const res = await request("POST", "/api/auth/login", { body: { username, password: PASSWORD } });
        tokens[username] = res.body.token;
    }

    const upload = ({ token, subjectId, sectionId, file }) => {
        const form = new FormData();
        form.append("subject_id", String(subjectId));
        form.append("section_id", String(sectionId));
        form.append("school_year_id", String(ids.schoolYear));
        form.append(
            "file",
            new Blob([fs.readFileSync(file)], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            }),
            path.basename(file)
        );
        return request("POST", "/api/uploads", { token, form });
    };

    const teardown = async () => {
        server.child.kill();
        await pool.end();
    };

    return { baseUrl: server.baseUrl, pool, ids, tokens, request, upload, teardown, getLog: server.getLog };
};

module.exports = { setup, buildEcr, lrnGenerator, PASSWORD };
