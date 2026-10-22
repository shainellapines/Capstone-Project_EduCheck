const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup, buildEcr, lrnGenerator } = require("./helpers/env");

// The Administrator opens a new school year so learners can move up a
// grade: enrollment is per school year, and a learner keeps one LRN for life.
describe("School years: opening a new year and moving learners up", () => {
    let t;
    let nextYear;

    before(async () => (t = await setup()));
    after(async () => t.teardown());

    const create = (school_year, token = t.tokens.admin) =>
        t.request("POST", "/api/school-years", { token, body: { school_year } });
    const activate = (id, token = t.tokens.admin) =>
        t.request("PATCH", `/api/school-years/${id}/activate`, { token });
    const statuses = async () =>
        Object.fromEntries(
            (await t.pool.query("SELECT school_year, status FROM school_years")).rows.map((row) => [
                row.school_year,
                row.status,
            ])
        );

    it("SY-01 only the Administrator can open or activate a school year", async () => {
        for (const role of ["principal", "adviser_a", "subject_t"]) {
            assert.equal((await create("2027-2028", t.tokens[role])).status, 403);
            assert.equal((await activate(t.ids.schoolYear, t.tokens[role])).status, 403);
        }
    });

    it("SY-02 a school year must be two consecutive years", async () => {
        for (const bad of ["2027", "2027-2029", "2027/2028", "", "abcd-efgh"]) {
            const res = await create(bad);
            assert.equal(res.status, 400, bad);
            assert.match(res.body.message, /consecutive years/);
        }
    });

    it("SY-03 a new school year is added as Inactive and logged; a duplicate is refused", async () => {
        const res = await create("2027-2028");
        assert.equal(res.status, 201, JSON.stringify(res.body));
        assert.equal(res.body.school_year.status, "Inactive");
        nextYear = res.body.school_year.school_year_id;

        const log = await t.pool.query(
            "SELECT action FROM audit_logs WHERE entity_type='school_year' AND entity_id=$1",
            [nextYear]
        );
        assert.deepEqual(log.rows.map((row) => row.action), ["create"]);

        const duplicate = await create("2027-2028");
        assert.equal(duplicate.status, 409);
    });

    it("SY-04 the current school year stays first in the shared list until the new one is activated", async () => {
        const first = async () =>
            (await t.request("GET", "/api/consolidation/school-years", { token: t.tokens.principal })).body
                .school_years[0].school_year;

        assert.equal(await first(), "2026-2027");

        const res = await activate(nextYear);
        assert.equal(res.status, 200, JSON.stringify(res.body));
        assert.deepEqual(await statuses(), { "2026-2027": "Inactive", "2027-2028": "Active" });
        assert.equal(await first(), "2027-2028");
    });

    it("SY-05 the same learners upload into a new grade and section in the new school year", async () => {
        const lrnFor = lrnGenerator("7777");

        // 2026-2027: Grade 4 - Rizal.
        const grade4 = buildEcr({ lrnFor, limit: 10 });
        const first = await t.upload({
            token: t.tokens.subject_t,
            subjectId: t.ids.english4,
            sectionId: t.ids.rizal,
            file: grade4.file,
        });
        assert.equal(first.status, 201, JSON.stringify(first.body));

        // Same school year, another section: still refused.
        const sameYear = await t.pool.query(
            "INSERT INTO teacher_assignments (teacher_id, section_id, subject_id, school_year_id) VALUES ($1,$2,$3,$4)",
            [t.ids.subjectTeacher, t.ids.luna, t.ids.english5, t.ids.schoolYear]
        );
        assert.equal(sameYear.rowCount, 1);
        const blocked = await t.upload({
            token: t.tokens.subject_t,
            subjectId: t.ids.english5,
            sectionId: t.ids.luna,
            file: buildEcr({ lrnFor, limit: 10 }).file,
        });
        assert.equal(blocked.status, 409);
        assert.match(blocked.body.message, /another section/i);

        // 2027-2028: the same LRNs move up to Grade 5 - Luna.
        const assign = await t.request("POST", "/api/assignments", {
            token: t.tokens.admin,
            body: {
                teacher_id: t.ids.subjectTeacher,
                section_id: t.ids.luna,
                subject_id: t.ids.english5,
                school_year_id: nextYear,
            },
        });
        assert.equal(assign.status, 201, JSON.stringify(assign.body));

        const movedUp = await t.upload({
            token: t.tokens.subject_t,
            subjectId: t.ids.english5,
            sectionId: t.ids.luna,
            file: buildEcr({ lrnFor, limit: 10 }).file,
            schoolYearId: nextYear,
        });
        assert.equal(movedUp.status, 201, JSON.stringify(movedUp.body));

        const enrollments = await t.pool.query(
            "SELECT section_id, school_year_id, COUNT(*)::int AS n FROM section_enrollments WHERE lrn LIKE '7777%' GROUP BY 1,2 ORDER BY 2"
        );
        assert.deepEqual(
            enrollments.rows.map((row) => [row.section_id, row.school_year_id, row.n]),
            [
                [t.ids.rizal, t.ids.schoolYear, 10],
                [t.ids.luna, nextYear, 10],
            ]
        );
    });
});
