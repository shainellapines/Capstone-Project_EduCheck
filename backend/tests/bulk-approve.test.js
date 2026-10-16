const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup, buildEcr, lrnGenerator } = require("./helpers/env");

// Admin approves several Pending records in one step: same checks and
// snapshot as a single approval, one summary notification per person.
describe("Approve selected records", () => {
    let t;
    let sy;
    const lrns = ["777700000001", "777700000002", "777700000003"];

    before(async () => {
        t = await setup();
        sy = t.ids.schoolYear;

        await t.pool.query("UPDATE sections SET staffing_mode='Self-Contained' WHERE section_id=$1", [t.ids.mabini]);
        const subjects = (await t.pool.query("SELECT subject_id FROM subjects WHERE grade_level='4' ORDER BY 1")).rows;

        for (const { subject_id } of subjects) {
            const { file } = buildEcr({ lrnFor: lrnGenerator("7777"), limit: 3 });
            const res = await t.upload({ token: t.tokens.adviser_a, subjectId: subject_id, sectionId: t.ids.mabini, file });
            assert.equal(res.status, 201, JSON.stringify(res.body));
        }

        const submitted = await t.request("POST", `/api/submissions/school-years/${sy}/submit-all`, {
            token: t.tokens.adviser_a,
        });
        assert.equal(submitted.body.submitted_count, 3, JSON.stringify(submitted.body));
    });
    after(async () => t.teardown());

    const approveSelected = (token, body) =>
        t.request("POST", `/api/submissions/school-years/${sy}/approve-selected`, { token, body });

    it("BULK-01 only the Administrator may approve in bulk, and needs a list of LRNs", async () => {
        assert.equal((await approveSelected(t.tokens.adviser_a, { lrns })).status, 403);
        assert.equal((await approveSelected(t.tokens.admin, { lrns: [] })).status, 400);
        assert.equal((await approveSelected(t.tokens.admin, { lrns: ["123"] })).status, 400);
    });

    it("BULK-02 approves the pending ones with a snapshot each, skips one that is not pending", async () => {
        await t.pool.query("UPDATE notifications SET status='Read'");
        const before = Number((await t.pool.query("SELECT COUNT(*) FROM notifications")).rows[0].count);

        const res = await approveSelected(t.tokens.admin, { lrns: [...lrns, "999999999999"] });
        assert.equal(res.status, 200, JSON.stringify(res.body));
        assert.equal(res.body.approved_count, 3);
        assert.deepEqual(res.body.skipped.map((s) => s.lrn), ["999999999999"]);

        const rows = (
            await t.pool.query("SELECT status, snapshot FROM record_submissions WHERE lrn = ANY($1) AND school_year_id=$2", [lrns, sy])
        ).rows;
        assert.equal(rows.length, 3);
        assert.ok(rows.every((r) => r.status === "Approved" && r.snapshot && r.snapshot.subjects.length === 8));

        // adviser_a both submitted and uploaded: one summary per role it played, not one per learner.
        const after = Number((await t.pool.query("SELECT COUNT(*) FROM notifications")).rows[0].count);
        assert.ok(after - before <= 2, `expected summary notifications, got ${after - before}`);
    });

    it("BULK-03 approving them again skips every one (already decided)", async () => {
        const res = await approveSelected(t.tokens.admin, { lrns });
        assert.equal(res.body.approved_count, 0);
        assert.equal(res.body.skipped.length, 3);
    });

    it("BULK-04 a Subject Teacher blocked by the lock is told who to ask; that Adviser is notified", async () => {
        await t.pool.query("UPDATE sections SET staffing_mode='Departmentalized' WHERE section_id=$1", [t.ids.mabini]);
        const { file } = buildEcr({ lrnFor: lrnGenerator("7777"), limit: 3 });
        const res = await t.upload({ token: t.tokens.subject_t, subjectId: t.ids.english4, sectionId: t.ids.mabini, file });

        assert.equal(res.status, 409, JSON.stringify(res.body));
        assert.match(res.body.message, /ask Ana Adviser-A \(Class Adviser\) to open Consolidated Records/);
        assert.match(res.body.message, /Request Revision on English/);

        const notices = (
            await t.pool.query(
                `SELECT n.message FROM notifications n JOIN users u USING (user_id)
                 WHERE u.username='adviser_a' AND n.title='Upload Blocked by Locked Records'`
            )
        ).rows;
        assert.equal(notices.length, 1);
        assert.match(notices[0].message, /3 learner\(s\)/);
    });
});
