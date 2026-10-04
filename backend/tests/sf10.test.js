const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const XLSX = require("xlsx");
const { setup, buildEcr, lrnGenerator } = require("./helpers/env");
const { fillUnderscores } = require("../src/services/sf10/generator");

// SF10 foundation (EPIC-05): historical entry, cumulative record, readiness
// report and generation onto the official SF10-ES template.
describe("SF10 permanent record", () => {
    let t;
    const OWN = "111100000001"; // Mabini learner - adviser_a's section
    const OTHER = "222200000001"; // Rizal learner - adviser_b's section

    const GRADE3_QUARTER4 = {
        school_year: "2023-2024",
        grade_level: 3,
        grading_scheme: "QUARTER_4",
        school_name: "Previous Elementary School",
        school_id: "111222",
        district: "North",
        division: "Cebu City",
        region: "VII",
        section_name: "Sampaguita",
        adviser_name: "Lorna Reyes",
        subjects: ["filipino", "english", "mathematics", "science", "gmrc", "makabansa"].map((key, i) => ({
            subject_key: key,
            ratings: [80 + i, 82, 84, 86],
        })),
    };

    before(async () => {
        t = await setup();
        for (const [prefix, section] of [
            ["1111", t.ids.mabini],
            ["2222", t.ids.rizal],
        ]) {
            const { file } = buildEcr({ lrnFor: lrnGenerator(prefix), limit: 3 });
            const res = await t.upload({ token: t.tokens.subject_t, subjectId: t.ids.english4, sectionId: section, file });
            assert.equal(res.status, 201, JSON.stringify(res.body));
        }
    });
    after(async () => t.teardown());

    const preview = (lrn, role = "admin") => t.request("GET", `/api/sf10/students/${lrn}`, { token: t.tokens[role] });
    const saveHistory = (lrn, body, role = "adviser_a") =>
        t.request("PUT", `/api/sf10/students/${lrn}/history`, { token: t.tokens[role], body });
    const download = async (lrn, role = "admin") => {
        const res = await fetch(`${t.baseUrl}/api/sf10/students/${lrn}/download`, {
            headers: { Authorization: `Bearer ${t.tokens[role]}` },
        });
        const buffer = Buffer.from(await res.arrayBuffer());
        return { status: res.status, headers: res.headers, buffer };
    };

    it("SF-01 a learner with only an unapproved EduCheck year is NOT_READY", async () => {
        const res = await preview(OWN);
        assert.equal(res.status, 200);
        assert.equal(res.body.readiness.status, "NOT_READY");
        const g4 = res.body.readiness.blocks.find((b) => b.grade_level === "4");
        assert.equal(g4.status, "Missing");
        assert.ok(res.body.readiness.issues.some((i) => i.code === "NOT_YET_APPROVED" && i.grade_level === "4"));
    });

    it("SF-02 download is refused (409) while nothing is fillable", async () => {
        const res = await download(OWN);
        assert.equal(res.status, 409);
    });

    it("SF-03 the learner's own Adviser can enter a historical year; re-saving updates it", async () => {
        const created = await saveHistory(OWN, GRADE3_QUARTER4);
        assert.equal(created.status, 201, JSON.stringify(created.body));
        const updated = await saveHistory(OWN, { ...GRADE3_QUARTER4, section_name: "Rosal" });
        assert.equal(updated.status, 200);

        const audits = (
            await t.pool.query("SELECT action FROM audit_logs WHERE entity_type='historical_record' ORDER BY 1")
        ).rows.map((r) => r.action);
        assert.deepEqual(audits, ["create", "update"]);
    });

    it("SF-04 access: other Adviser 403, Principal read-only, Subject Teacher 403", async () => {
        assert.equal((await preview(OWN, "adviser_b")).status, 403);
        assert.equal((await saveHistory(OWN, GRADE3_QUARTER4, "adviser_b")).status, 403);
        assert.equal((await preview(OWN, "principal")).status, 200);
        assert.equal((await saveHistory(OWN, GRADE3_QUARTER4, "principal")).status, 403);
        assert.equal((await download(OWN, "principal")).status, 403);
        assert.equal((await preview(OWN, "subject_t")).status, 403);
        assert.equal((await preview(OTHER, "adviser_b")).status, 200);
        assert.equal((await preview("999999999999")).status, 404);
    });

    it("SF-05 invalid historical payloads are rejected (400)", async () => {
        const bad = [
            { ...GRADE3_QUARTER4, school_year: "2023-2025" },
            { ...GRADE3_QUARTER4, grade_level: 7 },
            { ...GRADE3_QUARTER4, grading_scheme: "SEMESTER" },
            { ...GRADE3_QUARTER4, subjects: [{ subject_key: "epp", ratings: [80, 80, 80, 80] }] }, // EPP is not Grade 3
            { ...GRADE3_QUARTER4, subjects: [{ subject_key: "english", ratings: [80, 80, 80, 101] }] },
            { ...GRADE3_QUARTER4, subjects: [{ subject_key: "english" }, { subject_key: "english" }] },
            { ...GRADE3_QUARTER4, grading_scheme: "TERM_3", subjects: [{ subject_key: "english", ratings: [80, 80, 80, 80] }] },
        ];
        for (const body of bad) {
            const res = await saveHistory(OWN, body);
            assert.equal(res.status, 400, JSON.stringify(body).slice(0, 120));
        }
    });

    it("SF-06 readiness: Grade 3 is filled with computed finals and general average", async () => {
        const res = await preview(OWN);
        assert.equal(res.body.readiness.status, "PARTIAL");
        assert.deepEqual(res.body.readiness.filled_grade_levels, ["3"]);

        const year = res.body.record.years.find((y) => y.school_year === "2023-2024");
        const filipino = year.subjects.find((s) => s.subject_key === "filipino");
        assert.equal(filipino.final_rating, 83); // round((80+82+84+86)/4)
        assert.equal(filipino.remarks, "Passed");
        // finals: 83,83,84,84,85,85 -> 84
        assert.equal(year.general_average, 84);
    });

    it("SF-07 a TERM_3 year is kept as-is, never converted, and flagged unsupported", async () => {
        const res = await saveHistory(OWN, {
            school_year: "2022-2023",
            grade_level: 2,
            grading_scheme: "TERM_3",
            subjects: [{ subject_key: "english", ratings: [85, 86, 87] }],
        });
        assert.equal(res.status, 201, JSON.stringify(res.body));

        const view = await preview(OWN);
        const g2 = view.body.readiness.blocks.find((b) => b.grade_level === "2");
        assert.equal(g2.status, "Unsupported");
        assert.ok(view.body.readiness.issues.some((i) => i.code === "SCHEME_NOT_SUPPORTED" && i.grade_level === "2"));
        const year = view.body.record.years.find((y) => y.school_year === "2022-2023");
        assert.deepEqual(year.subjects[0].ratings, [85, 86, 87, null]);
    });

    it("SF-08 learner details: validation and save", async () => {
        const badSex = await t.request("PUT", `/api/sf10/students/${OWN}/profile`, {
            token: t.tokens.adviser_a,
            body: { sex: "X" },
        });
        assert.equal(badSex.status, 400);
        const future = await t.request("PUT", `/api/sf10/students/${OWN}/profile`, {
            token: t.tokens.adviser_a,
            body: { birth_date: "2999-01-01" },
        });
        assert.equal(future.status, 400);

        const ok = await t.request("PUT", `/api/sf10/students/${OWN}/profile`, {
            token: t.tokens.adviser_a,
            body: { middle_name: "Santos", birth_date: "2016-05-07", name_extension: "Jr." },
        });
        assert.equal(ok.status, 200, JSON.stringify(ok.body));
        assert.equal(ok.body.learner.middle_name, "Santos");
    });

    it("SF-09 school settings: Admin only can change; everyone allowed can read", async () => {
        const denied = await t.request("PUT", "/api/sf10/settings", {
            token: t.tokens.adviser_a,
            body: { school_name: "X" },
        });
        assert.equal(denied.status, 403);

        const saved = await t.request("PUT", "/api/sf10/settings", {
            token: t.tokens.admin,
            body: { school_name: "EduCheck Elementary School", school_id: "999888", region: "VII" },
        });
        assert.equal(saved.status, 200);

        const read = await t.request("GET", "/api/sf10/settings", { token: t.tokens.principal });
        assert.equal(read.body.settings.school_name, "EduCheck Elementary School");
    });

    it("SF-10 download fills the official template: personal info + the Grade 3 block only", async () => {
        const res = await download(OWN, "adviser_a");
        assert.equal(res.status, 200);
        assert.match(res.headers.get("content-disposition"), /SF10-ES_111100000001_/);
        assert.equal(res.headers.get("x-sf10-readiness"), "PARTIAL");

        const wb = XLSX.read(res.buffer);
        const front = wb.Sheets.Front;
        const v = (cell) => front[cell]?.v;

        assert.equal(v("J10"), OWN);
        assert.equal(v("AQ9"), "Santos");
        assert.equal(v("AD9"), "Jr.");
        assert.equal(v("V10"), "05/07/2016");

        // Grade 3 block (Front, left, rows 52-75): header + Filipino row 60 + GA row 75.
        assert.equal(v("D52"), "Previous Elementary School");
        assert.equal(v("F54"), "3");
        assert.equal(v("J54"), "Rosal");
        assert.equal(v("S54"), "2023-2024");
        assert.equal(v("H55"), "Lorna Reyes");
        assert.deepEqual(["K60", "L60", "N60", "O60", "P60", "S60"].map(v), [80, 82, 84, 86, 83, "Passed"]);
        assert.equal(v("P75"), 84);

        // Grade 2 (TERM_3) and Grade 4 (not approved) blocks stay blank.
        assert.equal(v("AJ31"), undefined);
        assert.equal(v("AJ61"), undefined);

        // The template itself is intact.
        assert.equal(front["!merges"].length, 531);
        assert.deepEqual(wb.SheetNames, ["Front", "Back", "Sir Wedz Helper Table"]);
    });

    it("SF-11 an approved EduCheck (3-term) year is official but not written onto the 4-quarter form", async () => {
        const snapshot = {
            lrn: OWN,
            grade_level: "4",
            section_id: t.ids.mabini,
            adviser: "Ana Adviser-A",
            subjects: [{ subject_name: "English", teacher_name: "Sam Subject", term_1: 85, term_2: 86, term_3: 87, final_grade: 86 }],
        };
        await t.pool.query(
            `INSERT INTO record_submissions (lrn, school_year_id, status, snapshot) VALUES ($1,$2,'Approved',$3)`,
            [OWN, t.ids.schoolYear, JSON.stringify(snapshot)]
        );

        const view = await preview(OWN);
        const year = view.body.record.years.find((y) => y.source === "EDUCHECK");
        assert.equal(year.official, true);
        assert.equal(year.grading_scheme, "TERM_3");
        assert.equal(year.school.school_name, "EduCheck Elementary School");
        assert.equal(view.body.readiness.blocks.find((b) => b.grade_level === "4").status, "Unsupported");

        const file = await download(OWN);
        const front = XLSX.read(file.buffer).Sheets.Front;
        assert.equal(front.AJ61?.v, undefined, "3-term grades must not be placed in quarter columns");
    });

    it("SF-12 deleting a historical year removes it (and only the owner's learner)", async () => {
        const id = (
            await t.pool.query("SELECT historical_record_id FROM historical_academic_records WHERE school_year='2022-2023'")
        ).rows[0].historical_record_id;

        const wrongLearner = await t.request("DELETE", `/api/sf10/students/${OTHER}/history/${id}`, {
            token: t.tokens.admin,
        });
        assert.equal(wrongLearner.status, 404);

        const res = await t.request("DELETE", `/api/sf10/students/${OWN}/history/${id}`, { token: t.tokens.adviser_a });
        assert.equal(res.status, 200);
        const view = await preview(OWN);
        assert.ok(!view.body.record.years.some((y) => y.school_year === "2022-2023"));
    });

    it("SF-13 fillUnderscores fills runs in order and keeps a run when its value is blank", () => {
        assert.equal(fillUnderscores("District: _____ Division: _____", ["North", "Cebu"]), "District: North Division: Cebu");
        assert.equal(fillUnderscores("District: _____ Division: _____", [null, "Cebu"]), "District: _____ Division: Cebu");
    });
});
