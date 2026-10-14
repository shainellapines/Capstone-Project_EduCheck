const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup } = require("./helpers/env");

// A Self-Contained section's Class Adviser teaches every subject of its
// grade level, so its subjects are never assigned on their own: not to the
// Adviser (the upload page would list them twice) and not to a Subject
// Teacher (two teachers could upload the same subject).
describe("Self-Contained sections: the Class Adviser slot only", () => {
    let t;
    let bonifacio;
    let grade5Subjects;

    before(async () => {
        t = await setup();
        bonifacio = (
            await t.pool.query(
                "INSERT INTO sections (section_name, grade_level, staffing_mode) VALUES ('Bonifacio','5','Self-Contained') RETURNING section_id"
            )
        ).rows[0].section_id;
        grade5Subjects = (await t.pool.query("SELECT subject_id FROM subjects WHERE grade_level='5'")).rows.map(
            (row) => row.subject_id
        );
    });
    after(async () => t.teardown());

    const bonifacioCount = async () =>
        Number(
            (await t.pool.query("SELECT COUNT(*) FROM teacher_assignments WHERE section_id=$1", [bonifacio])).rows[0]
                .count
        );
    const batch = (body) => t.request("POST", "/api/assignments/batch", { token: t.tokens.admin, body });
    const base = () => ({ section_id: bonifacio, school_year_id: t.ids.schoolYear });

    it("SC-01 a Subject Teacher cannot take a subject in a Self-Contained section, nothing saved", async () => {
        const res = await batch({ ...base(), teacher_id: t.ids.subjectTeacher, subject_ids: [t.ids.english5] });
        assert.equal(res.status, 409);
        assert.match(res.body.message, /Bonifacio is Self-Contained/);
        assert.equal(await bonifacioCount(), 0);
    });

    it("SC-02 the Adviser cannot add subjects next to the Class Adviser slot, nothing saved", async () => {
        const res = await batch({
            ...base(),
            teacher_id: t.ids.adviserBTeacher,
            class_adviser: true,
            subject_ids: [t.ids.english5],
        });
        assert.equal(res.status, 409);
        assert.equal(await bonifacioCount(), 0);
    });

    it("SC-03 the single-assignment endpoint refuses a subject there too", async () => {
        const res = await t.request("POST", "/api/assignments", {
            token: t.tokens.admin,
            body: { ...base(), teacher_id: t.ids.subjectTeacher, subject_id: t.ids.english5 },
        });
        assert.equal(res.status, 409);
        assert.match(res.body.message, /Self-Contained/);
        assert.equal(await bonifacioCount(), 0);
    });

    it("SC-04 the Class Adviser slot alone gives the Adviser every subject, each listed once", async () => {
        const res = await batch({ ...base(), teacher_id: t.ids.adviserBTeacher, class_adviser: true });
        assert.equal(res.status, 201, JSON.stringify(res.body));

        const options = await t.request("GET", "/api/uploads/options", { token: t.tokens.adviser_b });
        const listed = options.body.options.filter((o) => o.section_id === bonifacio).map((o) => o.subject_id);
        assert.deepEqual([...listed].sort(), [...grade5Subjects].sort());
    });

    it("SC-05 a leftover subject row for the Adviser does not list that subject twice", async () => {
        await t.pool.query(
            "INSERT INTO teacher_assignments (teacher_id, section_id, subject_id, school_year_id) VALUES ($1,$2,$3,$4)",
            [t.ids.adviserBTeacher, bonifacio, t.ids.english5, t.ids.schoolYear]
        );

        const options = await t.request("GET", "/api/uploads/options", { token: t.tokens.adviser_b });
        const english = options.body.options.filter(
            (o) => o.section_id === bonifacio && o.subject_id === t.ids.english5
        );
        assert.equal(english.length, 1);
    });

    it("SC-06 a section with subject assignments cannot switch to Self-Contained", async () => {
        const res = await t.request("PUT", `/api/sections/${t.ids.mabini}`, {
            token: t.tokens.admin,
            body: { staffing_mode: "Self-Contained" },
        });
        assert.equal(res.status, 409);
        assert.match(res.body.message, /English \(.+\)/);

        const mode = await t.pool.query("SELECT staffing_mode FROM sections WHERE section_id=$1", [t.ids.mabini]);
        assert.equal(mode.rows[0].staffing_mode, "Departmentalized");
    });

    it("SC-07 a section with only a Class Adviser can switch to Self-Contained", async () => {
        const res = await t.request("PUT", `/api/sections/${t.ids.luna}`, {
            token: t.tokens.admin,
            body: { staffing_mode: "Self-Contained" },
        });
        assert.equal(res.status, 200, JSON.stringify(res.body));
    });
});
