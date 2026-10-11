const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup, buildEcr, lrnGenerator } = require("./helpers/env");

// Partial departmentalization: a Departmentalized section whose Class Adviser
// also teaches some of its subjects, while Subject Teachers take the rest.
// The Adviser may upload only the subjects assigned to them, and their
// consolidated view combines everyone's uploads (SPMP §6.2, US-009, US-011).
describe("Departmentalized section where the Adviser teaches some subjects", () => {
    let t;
    const lrn = lrnGenerator("8888");
    let file;

    before(async () => {
        t = await setup();
        ({ file } = buildEcr({ lrnFor: lrn, limit: 5 }));
    });
    after(async () => t.teardown());

    // Rizal (Grade 4) is Departmentalized; adviser_b holds its Class Adviser
    // slot and subject_t teaches its English.
    it("DEP-01 an Adviser account can be assigned a subject in the section they advise", async () => {
        const res = await t.request("POST", "/api/assignments", {
            token: t.tokens.admin,
            body: {
                teacher_id: t.ids.adviserBTeacher,
                section_id: t.ids.rizal,
                subject_id: t.ids.math4,
                school_year_id: t.ids.schoolYear,
            },
        });
        assert.equal(res.status, 201, JSON.stringify(res.body));
    });

    it("DEP-02 the Adviser's upload options are only their own subject, not every subject", async () => {
        const res = await t.request("GET", "/api/uploads/options", { token: t.tokens.adviser_b });
        assert.equal(res.status, 200);
        const pairs = res.body.options.map((o) => `${o.section_id}:${o.subject_id}`);
        assert.deepEqual(pairs, [`${t.ids.rizal}:${t.ids.math4}`]);
    });

    it("DEP-03 the Adviser uploads their own subject", async () => {
        const res = await t.upload({ token: t.tokens.adviser_b, subjectId: t.ids.math4, sectionId: t.ids.rizal, file });
        assert.equal(res.status, 201, JSON.stringify(res.body));
    });

    it("DEP-04 the Adviser cannot upload the Subject Teacher's subject (403)", async () => {
        const res = await t.upload({ token: t.tokens.adviser_b, subjectId: t.ids.english4, sectionId: t.ids.rizal, file });
        assert.equal(res.status, 403);
    });

    it("DEP-05 the Subject Teacher uploads their subject in the same section", async () => {
        const res = await t.upload({ token: t.tokens.subject_t, subjectId: t.ids.english4, sectionId: t.ids.rizal, file });
        assert.equal(res.status, 201, JSON.stringify(res.body));
    });

    it("DEP-06 the Adviser's consolidated record holds both teachers' subjects", async () => {
        const res = await t.request("GET", `/api/consolidation/school-years/${t.ids.schoolYear}/students/${lrn(0)}`, {
            token: t.tokens.adviser_b,
        });
        assert.equal(res.status, 200, JSON.stringify(res.body));
        const subjects = res.body.student.subjects.map((s) => s.subject_name).sort();
        assert.deepEqual(subjects, ["English", "Mathematics"]);
    });
});
