// Builds the world the UI tests run in, then tears it down afterwards:
//   1. an isolated PostgreSQL database (educheck_e2e) rebuilt from the schema,
//      seeded like the UAT setup (Rizal Grade 6 Departmentalized, Mabini Grade 3);
//   2. the real, unmodified backend on a private port, with emails written to
//      a file instead of being sent;
//   3. the uploads that are preconditions (every Rizal subject except
//      Mathematics, which TC-022 uploads through the UI);
//   4. a production build of the web app pointed at that backend, served on
//      its own port.
// It never touches the development database (educheck_db) or the backend
// test database (educheck_test).
const { spawn, execFileSync } = require("child_process");
const fs = require("fs");
const net = require("net");
const path = require("path");
const { createRequire } = require("module");

const { E2E, ROOT, BACKEND_DIR, FRONTEND_DIR, RUN_DIR, UAT_FILES, PASSWORD } = require("./constants");

const backendRequire = createRequire(path.join(BACKEND_DIR, "package.json"));
const { Client, Pool } = backendRequire("pg");
const bcrypt = backendRequire("bcryptjs");
backendRequire("dotenv").config({ path: path.join(BACKEND_DIR, ".env"), quiet: true });

const SCHEMA_FILE = path.join(ROOT, "02-Product Design/06-Database/SQL/educheck_schema.sql");

const dbConfig = (database) => ({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database,
});

const assertPortFree = (port) =>
    new Promise((resolve, reject) => {
        const server = net.createServer();
        server.once("error", () => reject(new Error(`Port ${port} is in use. Stop whatever is using it and run again.`)));
        server.listen(port, "127.0.0.1", () => server.close(resolve));
    });

const waitFor = async (url, label, child, getLog) => {
    const deadline = Date.now() + 30000;
    while (Date.now() < deadline) {
        if (child.exitCode !== null) break;
        try {
            const res = await fetch(url);
            if (res.ok) return;
        } catch {
            // not up yet
        }
        await new Promise((resolve) => setTimeout(resolve, 200));
    }
    child.kill();
    throw new Error(`${label} did not start:\n${getLog()}`);
};

const startProcess = (command, args, options, label) => {
    const child = spawn(command, args, { ...options, stdio: ["ignore", "pipe", "pipe"] });
    let log = "";
    child.stdout.on("data", (chunk) => (log += chunk));
    child.stderr.on("data", (chunk) => (log += chunk));
    return { child, getLog: () => `${label}:\n${log}` };
};

const rebuildDatabase = async () => {
    const admin = new Client(dbConfig("postgres"));
    await admin.connect();
    await admin.query(
        "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()",
        [E2E.db]
    );
    await admin.query(`DROP DATABASE IF EXISTS ${E2E.db}`);
    await admin.query(`CREATE DATABASE ${E2E.db}`);
    await admin.end();

    const client = new Client(dbConfig(E2E.db));
    await client.connect();
    await client.query(fs.readFileSync(SCHEMA_FILE, "utf8"));
    await client.end();
};

// Accounts and assignments as in the UAT setup (fictitious names).
const seed = async (pool) => {
    const hash = await bcrypt.hash(PASSWORD, 4);
    const ids = {};

    const addUser = async (username, role, email = `${username}@deped.gov.ph`) =>
        (
            await pool.query(
                "INSERT INTO users (username, password_hash, email, role) VALUES ($1,$2,$3,$4) RETURNING user_id",
                [username, hash, email, role]
            )
        ).rows[0].user_id;

    const addTeacher = async (userId, employeeNumber, first, last, contact) =>
        (
            await pool.query(
                `INSERT INTO teachers (user_id, employee_number, first_name, last_name, contact_number)
                 VALUES ($1,$2,$3,$4,$5) RETURNING teacher_id`,
                [userId, employeeNumber, first, last, contact]
            )
        ).rows[0].teacher_id;

    ids.adminUser = await addUser("admin.educheck", "admin");
    ids.principalUser = await addUser("principal.educheck", "principal");
    ids.adviserUser = await addUser("adviser.grade6a", "adviser");
    ids.subjectUser = await addUser("subject.grade6a", "subject");
    ids.adviserTeacher = await addTeacher(ids.adviserUser, "EMP-ADV-001", "Maria Teresa", "Santos", "09171234567");
    ids.subjectTeacher = await addTeacher(ids.subjectUser, "EMP-2026-002", "Jose Miguel", "Reyes", "09181234567");

    ids.schoolYear = (
        await pool.query("INSERT INTO school_years (school_year, status) VALUES ('2025-2026', 'Active') RETURNING school_year_id")
    ).rows[0].school_year_id;

    const addSection = async (name, grade) =>
        (
            await pool.query(
                "INSERT INTO sections (section_name, grade_level, staffing_mode) VALUES ($1,$2,'Departmentalized') RETURNING section_id",
                [name, grade]
            )
        ).rows[0].section_id;

    ids.rizal = await addSection("Rizal", "6");
    ids.mabini = await addSection("Mabini", "3");

    const subjects = (await pool.query("SELECT subject_id, subject_name FROM subjects WHERE grade_level='6'")).rows;
    ids.subjects = Object.fromEntries(subjects.map((s) => [s.subject_name, s.subject_id]));

    const assign = (teacherId, subjectName) =>
        pool.query(
            "INSERT INTO teacher_assignments (teacher_id, section_id, subject_id, school_year_id) VALUES ($1,$2,$3,$4)",
            [teacherId, ids.rizal, subjectName ? ids.subjects[subjectName] : null, ids.schoolYear]
        );

    await assign(ids.adviserTeacher, null); // Class Adviser of Rizal
    for (const s of ["Filipino", "English", "Science", "ESP"]) await assign(ids.adviserTeacher, s);
    for (const s of ["Mathematics", "Araling Panlipunan", "MAPEH", "TLE"]) await assign(ids.subjectTeacher, s);

    // Printed on the SF10 header.
    for (const [key, value] of [
        ["school_name", "E2E Test Elementary School"],
        ["school_id", "100000"],
        ["district", "Test District"],
        ["division", "Test Division"],
        ["region", "Test Region"],
    ]) {
        await pool.query("INSERT INTO school_settings (setting_key, setting_value) VALUES ($1,$2)", [key, value]);
    }

    return ids;
};

const api = (baseUrl) => {
    const call = async (method, url, { token, body, form } = {}) => {
        const headers = {};
        if (token) headers.Authorization = `Bearer ${token}`;
        let payload;
        if (form) payload = form;
        else if (body !== undefined) {
            headers["Content-Type"] = "application/json";
            payload = JSON.stringify(body);
        }
        const res = await fetch(`${baseUrl}${url}`, { method, headers, body: payload });
        let json = null;
        try {
            json = await res.json();
        } catch {
            // non-JSON body
        }
        return { status: res.status, body: json };
    };
    return call;
};

const uploadFile = async (call, token, { subjectId, sectionId, schoolYearId, file }) => {
    const form = new FormData();
    form.append("subject_id", String(subjectId));
    form.append("section_id", String(sectionId));
    form.append("school_year_id", String(schoolYearId));
    form.append(
        "file",
        new Blob([fs.readFileSync(file)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
        path.basename(file)
    );
    return call("POST", "/api/uploads", { token, form });
};

module.exports = async () => {
    fs.rmSync(RUN_DIR, { recursive: true, force: true });
    fs.mkdirSync(RUN_DIR, { recursive: true });
    await assertPortFree(E2E.apiPort);
    await assertPortFree(E2E.webPort);

    await rebuildDatabase();
    const pool = new Pool(dbConfig(E2E.db));
    const ids = await seed(pool);
    await pool.end();

    const uploads = path.join(RUN_DIR, "uploads");
    fs.mkdirSync(uploads, { recursive: true });
    const backend = startProcess(process.execPath, ["src/server.js"], {
        cwd: BACKEND_DIR,
        env: {
            ...process.env,
            PORT: String(E2E.apiPort),
            DB_NAME: E2E.db,
            JWT_SECRET: "e2e-secret-do-not-use",
            UPLOAD_DIR: uploads,
            MAIL_OUTBOX: E2E.outbox,
            CORS_ORIGIN: "",
        },
    }, "backend");
    await waitFor(`${E2E.apiUrl}/`, "Backend", backend.child, backend.getLog);

    // Preconditions: every Rizal subject except Mathematics is uploaded and
    // validated, so the consolidated records are complete once TC-022 adds
    // Mathematics (LRN 100000000099/100 stay incomplete: no TLE grade).
    const call = api(E2E.apiUrl);
    const login = async (username) => (await call("POST", "/api/auth/login", { body: { username, password: PASSWORD } })).body.token;
    const tokens = { adviser: await login("adviser.grade6a"), subject: await login("subject.grade6a") };
    const perSubject = (name) => path.join(UAT_FILES, "per-subject", `ecr-rizal-${name.replace(/ /g, "-")}.xlsx`);
    for (const [who, subject] of [
        ["adviser", "Filipino"], ["adviser", "English"], ["adviser", "Science"], ["adviser", "ESP"],
        ["subject", "Araling Panlipunan"], ["subject", "MAPEH"], ["subject", "TLE"],
    ]) {
        const res = await uploadFile(call, tokens[who], {
            subjectId: ids.subjects[subject],
            sectionId: ids.rizal,
            schoolYearId: ids.schoolYear,
            file: perSubject(subject),
        });
        if (res.status !== 201) throw new Error(`Precondition upload ${subject} failed: ${res.status} ${JSON.stringify(res.body)}`);
    }

    // The web app, built for this backend.
    const webDir = path.join(RUN_DIR, "web");
    execFileSync(process.execPath, [path.join(FRONTEND_DIR, "node_modules/vite/bin/vite.js"), "build", "--outDir", webDir, "--emptyOutDir"], {
        cwd: FRONTEND_DIR,
        env: { ...process.env, VITE_API_URL: E2E.apiUrl },
        stdio: "ignore",
    });
    const web = startProcess(process.execPath, [
        path.join(FRONTEND_DIR, "node_modules/vite/bin/vite.js"), "preview", "--outDir", webDir,
        "--port", String(E2E.webPort), "--strictPort", "--host", "127.0.0.1",
    ], { cwd: FRONTEND_DIR }, "web");
    await waitFor(E2E.webUrl, "Web app", web.child, web.getLog);

    fs.writeFileSync(E2E.stateFile, JSON.stringify({ ids }, null, 2));

    return async () => {
        web.child.kill();
        backend.child.kill();
    };
};
