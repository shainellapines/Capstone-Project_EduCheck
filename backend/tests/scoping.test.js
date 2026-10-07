const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup, buildEcr, lrnGenerator } = require("./helpers/env");

// SPMP §6.2: a Class Adviser has "full visibility, own section only";
// Admin and Principal are school-wide. Two sections (Mabini, Rizal) each get
// a different class list; adviser_a advises Mabini, adviser_b advises Rizal,
// adviser_none advises nothing.
describe("Adviser read scoping (CON-06, ANA-02)", () => {
    let t;
    let sy;
    let mabiniLrn;
    let rizalLrn;

    before(async () => {
        t = await setup();
        sy = t.ids.schoolYear;

        const mabini = buildEcr({ lrnFor: lrnGenerator("1111"), limit: 5 });
        const rizal = buildEcr({ lrnFor: lrnGenerator("2222"), limit: 5 });

        const up1 = await t.upload({
            token: t.tokens.subject_t,
            subjectId: t.ids.english4,
            sectionId: t.ids.mabini,
            file: mabini.file,
        });
        const up2 = await t.upload({
            token: t.tokens.subject_t,
            subjectId: t.ids.english4,
            sectionId: t.ids.rizal,
            file: rizal.file,
        });
        assert.equal(up1.status, 201, JSON.stringify(up1.body));
        assert.equal(up2.status, 201, JSON.stringify(up2.body));

        mabiniLrn = "111100000001";
        rizalLrn = "222200000001";
    });
    after(async () => t.teardown());

    const list = (role, query = "") =>
        t.request("GET", `/api/consolidation/school-years/${sy}${query}`, { token: t.tokens[role] });

    it("admin and principal see every section", async () => {
        for (const role of ["admin", "principal"]) {
            const res = await list(role);
            assert.equal(res.status, 200);
            assert.equal(res.body.student_count, 10, role);
        }
    });

    it("adviser_a sees only Mabini students", async () => {
        const res = await list("adviser_a");
        assert.equal(res.status, 200);
        assert.equal(res.body.student_count, 5);
        assert.ok(res.body.students.every((s) => s.section_id === t.ids.mabini));
    });

    it("adviser_b sees only Rizal students", async () => {
        const res = await list("adviser_b");
        assert.equal(res.body.student_count, 5);
        assert.ok(res.body.students.every((s) => s.section_id === t.ids.rizal));
    });

    it("an Adviser with no section assigned sees nothing (not an error)", async () => {
        const res = await list("adviser_none");
        assert.equal(res.status, 200);
        assert.equal(res.body.student_count, 0);
    });

    it("upload summary counts are scoped to the Adviser's section", async () => {
        const adviser = await list("adviser_a");
        const admin = await list("admin");
        assert.equal(adviser.body.upload_summary.total_uploads, 1);
        assert.equal(admin.body.upload_summary.total_uploads, 2);
    });

    it("?section_id outside the Adviser's set is 403; inside is allowed", async () => {
        const denied = await list("adviser_a", `?section_id=${t.ids.rizal}`);
        assert.equal(denied.status, 403);

        const allowed = await list("adviser_a", `?section_id=${t.ids.mabini}`);
        assert.equal(allowed.status, 200);
        assert.equal(allowed.body.student_count, 5);
    });

    it("student detail in another section is 403; own section is 200", async () => {
        const other = await t.request("GET", `/api/consolidation/school-years/${sy}/students/${rizalLrn}`, {
            token: t.tokens.adviser_a,
        });
        assert.equal(other.status, 403);

        const own = await t.request("GET", `/api/consolidation/school-years/${sy}/students/${mabiniLrn}`, {
            token: t.tokens.adviser_a,
        });
        assert.equal(own.status, 200);

        const admin = await t.request("GET", `/api/consolidation/school-years/${sy}/students/${rizalLrn}`, {
            token: t.tokens.admin,
        });
        assert.equal(admin.status, 200);
    });

    it("section progress lists only the Adviser's section", async () => {
        const res = await t.request("GET", `/api/consolidation/school-years/${sy}/sections`, {
            token: t.tokens.adviser_a,
        });
        assert.equal(res.status, 200);
        assert.deepEqual(
            res.body.sections.map((s) => s.section_id),
            [t.ids.mabini]
        );
        assert.equal(res.body.sections[0].student_count, 5);

        const admin = await t.request("GET", `/api/consolidation/school-years/${sy}/sections`, {
            token: t.tokens.admin,
        });
        assert.equal(admin.body.sections.length, 3);
    });

    it("analytics only aggregates the Adviser's section", async () => {
        const adviser = await t.request("GET", `/api/analytics/school-years/${sy}`, { token: t.tokens.adviser_a });
        const admin = await t.request("GET", `/api/analytics/school-years/${sy}`, { token: t.tokens.admin });
        assert.equal(adviser.status, 200);
        assert.equal(adviser.body.overview.graded_entries, 5);
        assert.equal(admin.body.overview.graded_entries, 10);
        assert.deepEqual(
            adviser.body.section_performance.map((s) => s.section_id),
            [t.ids.mabini]
        );
    });

    it("repository search only returns the Adviser's own learners", async () => {
        const own = await t.request("GET", `/api/repository/search?q=${mabiniLrn}`, { token: t.tokens.adviser_a });
        assert.equal(own.body.result_count, 1);

        const other = await t.request("GET", `/api/repository/search?q=${rizalLrn}`, { token: t.tokens.adviser_a });
        assert.equal(other.body.result_count, 0);

        const admin = await t.request("GET", `/api/repository/search?q=${rizalLrn}`, { token: t.tokens.admin });
        assert.equal(admin.body.result_count, 1);
    });

    it("repository search filters by school year (EPIC-07)", async () => {
        const inYear = await t.request("GET", `/api/repository/search?q=${rizalLrn}&school_year_id=${sy}`, {
            token: t.tokens.admin,
        });
        assert.equal(inYear.body.result_count, 1);

        const otherYear = await t.request(
            "GET",
            `/api/repository/search?q=${rizalLrn}&school_year_id=${sy + 9999}`,
            { token: t.tokens.admin }
        );
        assert.equal(otherYear.body.result_count, 0);

        // A school year alone is enough to search, and stays scoped for an Adviser.
        const yearOnly = await t.request("GET", `/api/repository/search?school_year_id=${sy}`, {
            token: t.tokens.adviser_a,
        });
        assert.equal(yearOnly.status, 200);
        assert.ok(yearOnly.body.students.every((s) => s.lrn.startsWith("1111")));

        const invalid = await t.request("GET", "/api/repository/search?school_year_id=abc", {
            token: t.tokens.admin,
        });
        assert.equal(invalid.status, 400);
    });
});
