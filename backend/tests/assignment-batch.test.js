const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup } = require("./helpers/env");

// Assigning one teacher's whole load in a section at once (several subjects
// and/or the Class Adviser slot). All-or-nothing: if any item breaks a rule,
// nothing is saved (SPMP §6.2, US-009).
describe("Batch assignment: one teacher, several subjects in one save", () => {
    let t;
    let math5;
    let science5;

    before(async () => {
        t = await setup();
        const subjectId = async (name) =>
            (await t.pool.query("SELECT subject_id FROM subjects WHERE subject_name=$1 AND grade_level='5'", [name]))
                .rows[0].subject_id;
        math5 = await subjectId("Mathematics");
        science5 = await subjectId("Science");
    });
    after(async () => t.teardown());

    const batch = (body) => t.request("POST", "/api/assignments/batch", { token: t.tokens.admin, body });
    const lunaCount = async () =>
        Number(
            (await t.pool.query("SELECT COUNT(*) FROM teacher_assignments WHERE section_id=$1", [t.ids.luna])).rows[0]
                .count
        );

    it("BAT-01 an Adviser account gets the Class Adviser slot and two subjects in one save", async () => {
        const res = await batch({
            teacher_id: t.ids.adviserATeacher,
            section_id: t.ids.luna,
            school_year_id: t.ids.schoolYear,
            class_adviser: true,
            subject_ids: [t.ids.english5, math5],
        });
        assert.equal(res.status, 201, JSON.stringify(res.body));
        assert.equal(res.body.assignments.length, 3);
        assert.equal(await lunaCount(), 3);

        const logged = await t.pool.query(
            "SELECT COUNT(*) FROM audit_logs WHERE entity_type='teacher_assignment' AND action='create' AND entity_id = ANY($1)",
            [res.body.assignments.map((a) => a.assignment_id)]
        );
        assert.equal(Number(logged.rows[0].count), 3, "each assignment is in the audit log");
    });

    it("BAT-02 the Adviser's new subjects become their upload options", async () => {
        const res = await t.request("GET", "/api/uploads/options", { token: t.tokens.adviser_a });
        const luna = res.body.options.filter((o) => o.section_id === t.ids.luna).map((o) => o.subject_id).sort();
        assert.deepEqual(luna, [t.ids.english5, math5].sort());
    });

    it("BAT-03 a subject already held by another teacher is refused, naming it, and nothing is saved", async () => {
        const before = await lunaCount();
        const res = await batch({
            teacher_id: t.ids.subjectTeacher,
            section_id: t.ids.luna,
            school_year_id: t.ids.schoolYear,
            subject_ids: [science5, t.ids.english5],
        });
        assert.equal(res.status, 409);
        assert.match(res.body.message, /English \(Ana Adviser-A\)/);
        assert.equal(await lunaCount(), before, "Science must not be saved either");
    });

    it("BAT-04 a Subject Teacher account cannot take the Class Adviser slot (409), nothing saved", async () => {
        const before = await lunaCount();
        const res = await batch({
            teacher_id: t.ids.subjectTeacher,
            section_id: t.ids.rizal,
            school_year_id: t.ids.schoolYear,
            class_adviser: true,
            subject_ids: [],
        });
        assert.equal(res.status, 409);
        assert.match(res.body.message, /Only an Adviser account/);
        assert.equal(await lunaCount(), before);
    });

    it("BAT-05 a subject from another grade level is refused (409), nothing saved", async () => {
        const before = await lunaCount();
        const res = await batch({
            teacher_id: t.ids.subjectTeacher,
            section_id: t.ids.luna,
            school_year_id: t.ids.schoolYear,
            subject_ids: [science5, t.ids.math4],
        });
        assert.equal(res.status, 409);
        assert.match(res.body.message, /Grade 4 subject/);
        assert.equal(await lunaCount(), before);
    });

    it("BAT-06 nothing chosen, or a bad subject list, is a 400", async () => {
        const base = { teacher_id: t.ids.subjectTeacher, section_id: t.ids.luna, school_year_id: t.ids.schoolYear };
        assert.equal((await batch({ ...base, subject_ids: [] })).status, 400);
        assert.equal((await batch({ ...base, subject_ids: "1,2" })).status, 400);
        assert.equal((await batch({ ...base, subject_ids: [999999] })).status, 400);
    });

    it("BAT-07 a valid batch for a Subject Teacher saves every subject", async () => {
        const res = await batch({
            teacher_id: t.ids.subjectTeacher,
            section_id: t.ids.luna,
            school_year_id: t.ids.schoolYear,
            subject_ids: [science5],
        });
        assert.equal(res.status, 201, JSON.stringify(res.body));
        assert.equal(res.body.assignments[0].subject_id, science5);
    });
});
