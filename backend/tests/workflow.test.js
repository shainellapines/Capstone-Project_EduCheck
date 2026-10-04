const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup, buildEcr, lrnGenerator } = require("./helpers/env");

// Submission workflow (EPIC-06): Adviser submits, Admin approves/rejects,
// approval freezes a snapshot, and an approved record is protected from
// silent re-upload until the Adviser reopens it with a revision request.
describe("Submission workflow, snapshot and re-upload guard", () => {
    let t;
    let sy;
    let lrn;
    let classRecordIds;

    before(async () => {
        t = await setup();
        sy = t.ids.schoolYear;
        lrn = "888800000001";

        // Mabini is Self-Contained, so its Adviser uploads all 8 Grade 4 subjects.
        await t.pool.query("UPDATE sections SET staffing_mode='Self-Contained' WHERE section_id=$1", [t.ids.mabini]);
        const subjects = (await t.pool.query("SELECT subject_id FROM subjects WHERE grade_level='4' ORDER BY 1")).rows;
        assert.equal(subjects.length, 8);

        classRecordIds = [];
        for (const { subject_id } of subjects) {
            const { file } = buildEcr({ lrnFor: lrnGenerator("8888"), limit: 3 });
            const res = await t.upload({
                token: t.tokens.adviser_a,
                subjectId: subject_id,
                sectionId: t.ids.mabini,
                file,
            });
            assert.equal(res.status, 201, JSON.stringify(res.body));
            classRecordIds.push(res.body.class_record.class_record_id);
        }
    });
    after(async () => t.teardown());

    const submit = (role) =>
        t.request("POST", `/api/submissions/school-years/${sy}/students/${lrn}/submit`, { token: t.tokens[role] });
    const decide = (action, body = {}) =>
        t.request("POST", `/api/submissions/school-years/${sy}/students/${lrn}/${action}`, {
            token: t.tokens.admin,
            body,
        });
    const status = async () =>
        (await t.pool.query("SELECT * FROM record_submissions WHERE lrn=$1 AND school_year_id=$2", [lrn, sy])).rows[0];
    const reupload = () => {
        const { file } = buildEcr({ lrnFor: lrnGenerator("8888"), limit: 3 });
        return t.upload({ token: t.tokens.adviser_a, subjectId: t.ids.english4, sectionId: t.ids.mabini, file });
    };

    it("WF-01 the section owner can submit a complete record", async () => {
        const res = await submit("adviser_a");
        assert.equal(res.status, 200, JSON.stringify(res.body));
        assert.equal((await status()).status, "Pending Approval");
    });

    it("WF-02 another Adviser cannot submit it (403)", async () => {
        assert.equal((await submit("adviser_b")).status, 403);
    });

    it("WF-03 reject stores no snapshot; resubmitting and re-approving does", async () => {
        const rejected = await decide("reject", { remarks: "Check Math" });
        assert.equal(rejected.status, 200);
        const afterReject = await status();
        assert.equal(afterReject.status, "Rejected");
        assert.equal(afterReject.snapshot, null);

        assert.equal((await submit("adviser_a")).status, 200);
        const approved = await decide("approve");
        assert.equal(approved.status, 200, JSON.stringify(approved.body));
    });

    it("WF-04 approval freezes a snapshot with grades, teachers and the Adviser", async () => {
        const row = await status();
        assert.equal(row.status, "Approved");
        const snap = row.snapshot;
        assert.ok(snap, "snapshot should be stored");
        assert.equal(snap.lrn, lrn);
        assert.equal(snap.subjects.length, 8);
        assert.equal(snap.adviser, "Ana Adviser-A");
        assert.ok(snap.subjects.every((s) => s.teacher_name && "final_grade" in s));
    });

    it("WF-05 an approved record cannot be resubmitted (409)", async () => {
        assert.equal((await submit("adviser_a")).status, 409);
    });

    it("WF-06 re-uploading over an Approved learner is blocked (409)", async () => {
        const before = (await t.pool.query("SELECT COUNT(*) FROM class_records")).rows[0].count;
        const res = await reupload();
        assert.equal(res.status, 409);
        assert.match(res.body.message, /Approved/);
        assert.equal((await t.pool.query("SELECT COUNT(*) FROM class_records")).rows[0].count, before);
    });

    it("WF-07 only the section's own Adviser can request a revision (403 otherwise)", async () => {
        const res = await t.request("POST", `/api/consolidation/class-records/${classRecordIds[0]}/request-revision`, {
            token: t.tokens.adviser_b,
            body: { remarks: "x" },
        });
        assert.equal(res.status, 403);
    });

    it("WF-08 a revision request needs a reason (400)", async () => {
        const res = await t.request("POST", `/api/consolidation/class-records/${classRecordIds[0]}/request-revision`, {
            token: t.tokens.adviser_a,
            body: { remarks: "  " },
        });
        assert.equal(res.status, 400);
    });

    it("WF-09 the revision request reopens the approved record (Amendment Requested)", async () => {
        const res = await t.request("POST", `/api/consolidation/class-records/${classRecordIds[0]}/request-revision`, {
            token: t.tokens.adviser_a,
            body: { remarks: "Recompute term 2" },
        });
        assert.equal(res.status, 200, JSON.stringify(res.body));
        assert.ok(res.body.amended_count >= 1);
        assert.equal((await status()).status, "Amendment Requested");
    });

    it("WF-10 once reopened, the re-upload is accepted", async () => {
        const res = await reupload();
        assert.equal(res.status, 201, JSON.stringify(res.body));
    });

    it("WF-11 a record cannot be resubmitted while a subject is still flagged Needs Revision", async () => {
        // classRecordIds[0] is the Adviser-flagged upload (subject index 0). The
        // re-upload above targeted English (a different subject), so the flagged
        // subject is still outstanding.
        const flagged = (
            await t.pool.query("SELECT status FROM class_records WHERE class_record_id=$1", [classRecordIds[0]])
        ).rows[0].status;
        assert.equal(flagged, "Needs Revision");

        const blocked = await submit("adviser_a");
        assert.equal(blocked.status, 409);
        assert.match(blocked.body.message, /awaiting a teacher's revision/);
    });

    it("WF-12 approve/reject need a Pending Approval record (409 otherwise)", async () => {
        assert.equal((await decide("approve")).status, 409);
        assert.equal((await decide("reject")).status, 409);
    });

    it("WF-13 notifications reach the Adviser who submitted and the subject teachers", async () => {
        const rows = (
            await t.pool.query(
                "SELECT u.username, n.title FROM notifications n JOIN users u USING (user_id) ORDER BY n.notification_id"
            )
        ).rows;
        assert.ok(rows.some((r) => r.username === "adviser_a" && r.title === "Submission Approved"));
        assert.ok(rows.some((r) => r.username === "admin" && r.title === "Approved Record Needs Amendment"));
    });
});
