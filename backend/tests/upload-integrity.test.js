const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup, buildEcr, lrnGenerator } = require("./helpers/env");

describe("Upload integrity: roster, wrong-section, grade level (EPIC-02)", () => {
    let t;

    before(async () => (t = await setup()));
    after(async () => t.teardown());

    const uploadAs = (file, sectionId, subjectId = t.ids.english4, token = t.tokens.subject_t) =>
        t.upload({ token, subjectId, sectionId, file });

    const enrolled = async (sectionId) =>
        Number(
            (
                await t.pool.query(
                    "SELECT COUNT(*) FROM section_enrollments WHERE section_id=$1 AND school_year_id=$2",
                    [sectionId, t.ids.schoolYear]
                )
            ).rows[0].count
        );

    it("INT-01 the first upload into an empty section establishes its roster", async () => {
        const { file } = buildEcr({ lrnFor: lrnGenerator("3333"), limit: 10 });
        const res = await uploadAs(file, t.ids.mabini);
        assert.equal(res.status, 201, JSON.stringify(res.body));
        assert.equal(await enrolled(t.ids.mabini), 10);
    });

    it("INT-02 a second subject for the same class list uploads cleanly", async () => {
        const { file } = buildEcr({ lrnFor: lrnGenerator("3333"), limit: 10 });
        const res = await uploadAs(file, t.ids.mabini, t.ids.math4);
        assert.equal(res.status, 201, JSON.stringify(res.body));
        assert.equal(await enrolled(t.ids.mabini), 10);
        assert.ok(!res.body.integrity_warnings.some((w) => w.code === "LEARNERS_NOT_ON_ROSTER"));
    });

    it("INT-03 learners already enrolled in another section are rejected (409) and nothing is persisted", async () => {
        const before = (await t.pool.query("SELECT COUNT(*) FROM class_records")).rows[0].count;
        const { file } = buildEcr({ lrnFor: lrnGenerator("3333"), limit: 10 });
        const res = await uploadAs(file, t.ids.rizal);
        assert.equal(res.status, 409);
        assert.match(res.body.message, /another section/i);
        assert.ok(res.body.conflicting_lrns.length > 0);
        assert.equal(await enrolled(t.ids.rizal), 0);
        assert.equal((await t.pool.query("SELECT COUNT(*) FROM class_records")).rows[0].count, before);
    });

    it("INT-04 a file with zero overlap with an existing roster is rejected (409)", async () => {
        const { file } = buildEcr({ lrnFor: lrnGenerator("4444"), limit: 10 });
        const res = await uploadAs(file, t.ids.mabini);
        assert.equal(res.status, 409);
        assert.match(res.body.message, /class list/i);
        assert.equal(await enrolled(t.ids.mabini), 10);
    });

    it("INT-05 learners not on the roster are a warning and join the roster", async () => {
        // First 10 LRNs match Mabini's roster, learners 11-12 are new.
        const { file } = buildEcr({ lrnFor: lrnGenerator("3333"), limit: 12 });
        const res = await uploadAs(file, t.ids.mabini, t.ids.math4);
        assert.equal(res.status, 201, JSON.stringify(res.body));
        const warning = res.body.integrity_warnings.find((w) => w.code === "LEARNERS_NOT_ON_ROSTER");
        assert.ok(warning);
        assert.match(warning.message, /^2 learner/);
        assert.equal(await enrolled(t.ids.mabini), 12);
    });

    it("INT-06 a header that disagrees with the selection is a warning only", async () => {
        const { file } = buildEcr({
            lrnFor: lrnGenerator("5555"),
            limit: 3,
            header: { gradeSection: "Grade 6 - Bonifacio", subject: "Science", schoolYear: "2020-2021" },
        });
        const res = await uploadAs(file, t.ids.rizal);
        assert.equal(res.status, 201, JSON.stringify(res.body));
        const codes = res.body.integrity_warnings.map((w) => w.code).sort();
        assert.deepEqual(codes, ["HEADER_SCHOOL_YEAR_MISMATCH", "HEADER_SECTION_MISMATCH", "HEADER_SUBJECT_MISMATCH"]);
    });

    it("INT-07 a header that matches the selection produces no header warning", async () => {
        const { file } = buildEcr({
            lrnFor: lrnGenerator("5555"),
            limit: 3,
            header: { gradeSection: "Grade 4 - Rizal", subject: "English", schoolYear: "2026-2027" },
        });
        const res = await uploadAs(file, t.ids.rizal);
        assert.equal(res.status, 201, JSON.stringify(res.body));
        assert.equal(res.body.integrity_warnings.length, 0);
    });

    it("INT-08 an upload for a teacher/subject/section they are not assigned to is 403", async () => {
        const { file } = buildEcr({ lrnFor: lrnGenerator("6666"), limit: 3 });
        const res = await uploadAs(file, t.ids.luna, t.ids.english5);
        assert.equal(res.status, 403);
    });

    it("GRD-01 creating an assignment with a mismatched grade level is rejected (409)", async () => {
        const res = await t.request("POST", "/api/assignments", {
            token: t.tokens.admin,
            body: {
                teacher_id: t.ids.subjectTeacher,
                section_id: t.ids.luna, // Grade 5
                subject_id: t.ids.english4, // Grade 4
                school_year_id: t.ids.schoolYear,
            },
        });
        assert.equal(res.status, 409);
        assert.match(res.body.message, /Grade 4 subject/);
    });

    it("GRD-02 a matching grade level is accepted", async () => {
        const res = await t.request("POST", "/api/assignments", {
            token: t.tokens.admin,
            body: {
                teacher_id: t.ids.subjectTeacher,
                section_id: t.ids.luna,
                subject_id: t.ids.english5,
                school_year_id: t.ids.schoolYear,
            },
        });
        assert.equal(res.status, 201, JSON.stringify(res.body));
    });

    it("GRD-03 an upload is rejected when a legacy bad assignment pairs the wrong grade level", async () => {
        // Simulate a row created before the check existed (inserted directly).
        await t.pool.query(
            "INSERT INTO teacher_assignments (teacher_id, section_id, subject_id, school_year_id) VALUES ($1,$2,$3,$4)",
            [t.ids.subjectTeacher, t.ids.luna, t.ids.math4, t.ids.schoolYear]
        );
        const { file } = buildEcr({ lrnFor: lrnGenerator("7777"), limit: 3 });
        const res = await uploadAs(file, t.ids.luna, t.ids.math4);
        assert.equal(res.status, 409);
        assert.match(res.body.message, /Grade 4 subject/);
    });

    it("GRD-04 the Adviser assignment (no subject) is not subject to the grade-level check", async () => {
        const res = await t.request("POST", "/api/assignments", {
            token: t.tokens.admin,
            body: {
                teacher_id: t.ids.adviserATeacher,
                section_id: t.ids.luna,
                school_year_id: t.ids.schoolYear,
            },
        });
        assert.equal(res.status, 201, JSON.stringify(res.body));
    });

    it("INT-09 an unsupported file type is rejected (400) and a non-workbook is 422", async () => {
        const fs = require("fs");
        const os = require("os");
        const path = require("path");
        const txt = path.join(os.tmpdir(), `bad-${Date.now()}.txt`);
        fs.writeFileSync(txt, "not excel");
        const badType = await uploadAs(txt, t.ids.mabini);
        assert.equal(badType.status, 400);

        const fake = path.join(os.tmpdir(), `fake-${Date.now()}.xlsx`);
        fs.writeFileSync(fake, "not really a workbook");
        const badBook = await uploadAs(fake, t.ids.mabini);
        assert.ok([422, 500].includes(badBook.status));
        assert.notEqual(badBook.status, 201);
    });

    it("INT-10 a file over the 10 MB upload limit is rejected (413) with a readable message", async () => {
        const fs = require("fs");
        const os = require("os");
        const path = require("path");
        const big = path.join(os.tmpdir(), `big-${Date.now()}.xlsx`);
        fs.writeFileSync(big, Buffer.alloc(11 * 1024 * 1024));
        try {
            const res = await uploadAs(big, t.ids.mabini);
            assert.equal(res.status, 413);
            assert.match(res.body.message, /larger than 10 MB/);
        } finally {
            fs.unlinkSync(big);
        }
    });
});
