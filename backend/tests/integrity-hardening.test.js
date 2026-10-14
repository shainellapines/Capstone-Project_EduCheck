const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const XLSX = require("xlsx");
const { setup, buildEcr, lrnGenerator } = require("./helpers/env");

// Holes found in the pre-UAT review (handoff v15): a record could be
// submitted and approved with subjects that failed validation, a record
// waiting for approval could still be re-uploaded, a duplicate LRN was
// only a warning, and account changes waited for the token to expire.

// Blanks the first learner's first written score on TERM3, so that
// learner's term 3 and final grade cannot be computed.
const breakTerm3 = (file) => {
    const workbook = XLSX.readFile(file);
    const sheet = workbook.Sheets.TERM3;
    for (let row = 1; row < 200; row++) {
        const number = sheet[`A${row}`]?.v;
        const name = sheet[`B${row}`]?.v;
        if (Number.isInteger(number) && number > 0 && typeof name === "string" && name.includes(",")) {
            delete sheet[`F${row}`];
            break;
        }
    }
    XLSX.writeFile(workbook, file);
    return file;
};

describe("Submission integrity: only validated, graded records move forward", () => {
    let t;
    let sy;
    let grade4;
    const lrn = "777700000001";
    const ecr = () => buildEcr({ lrnFor: lrnGenerator("7777"), limit: 3 }).file;

    before(async () => {
        t = await setup();
        sy = t.ids.schoolYear;
        await t.pool.query("UPDATE sections SET staffing_mode='Self-Contained' WHERE section_id=$1", [t.ids.mabini]);
        grade4 = (await t.pool.query("SELECT subject_id FROM subjects WHERE grade_level='4' ORDER BY 1")).rows.map(
            (row) => row.subject_id
        );
    });
    after(async () => t.teardown());

    const upload = (subjectId, file) =>
        t.upload({ token: t.tokens.adviser_a, subjectId, sectionId: t.ids.mabini, file });
    const submit = () =>
        t.request("POST", `/api/submissions/school-years/${sy}/students/${lrn}/submit`, { token: t.tokens.adviser_a });
    const approve = () =>
        t.request("POST", `/api/submissions/school-years/${sy}/students/${lrn}/approve`, {
            token: t.tokens.admin,
            body: {},
        });
    const submissionStatus = async () =>
        (await t.pool.query("SELECT status FROM record_submissions WHERE lrn=$1", [lrn])).rows[0]?.status;

    it("INT-01 a subject that failed validation keeps the record from being submitted", async () => {
        for (const [index, subjectId] of grade4.entries()) {
            const res = await upload(subjectId, index === 0 ? breakTerm3(ecr()) : ecr());
            assert.equal(res.status, 201, JSON.stringify(res.body));
        }

        const res = await submit();
        assert.equal(res.status, 409);
        assert.match(res.body.message, /validation errors/);
        assert.equal(res.body.subjects_not_ready.length, 1);
        assert.equal(await submissionStatus(), undefined, "nothing was submitted");

        const record = await t.request("GET", `/api/consolidation/school-years/${sy}/students/${lrn}`, {
            token: t.tokens.adviser_a,
        });
        assert.equal(record.body.student.ready_for_submission, false);
    });

    it("INT-02 a corrected re-upload makes it submittable", async () => {
        const res = await upload(grade4[0], ecr());
        assert.equal(res.status, 201);
        assert.equal((await submit()).status, 200);
        assert.equal(await submissionStatus(), "Pending Approval");
    });

    it("INT-03 a re-upload does not change a learner whose record waits for approval", async () => {
        const res = await upload(grade4[1], ecr());
        assert.equal(res.status, 201, JSON.stringify(res.body));
        const warning = res.body.integrity_warnings.find((w) => w.code === "LOCKED_LEARNERS_SKIPPED");
        assert.ok(warning.pending_lrns.includes(lrn));

        const saved = await t.pool.query("SELECT 1 FROM grade_records WHERE class_record_id=$1 AND lrn=$2", [
            res.body.class_record.class_record_id,
            lrn,
        ]);
        assert.equal(saved.rows.length, 0, "the pending learner's grades are not replaced");
    });

    it("INT-04 approval re-checks the record and refuses one that is no longer ready", async () => {
        const latest = (
            await t.pool.query(
                `SELECT cr.class_record_id FROM class_records cr JOIN grade_records gr USING (class_record_id)
                 WHERE gr.lrn=$1 AND cr.subject_id=$2 ORDER BY cr.upload_date DESC, cr.class_record_id DESC LIMIT 1`,
                [lrn, grade4[0]]
            )
        ).rows[0].class_record_id;
        await t.pool.query("UPDATE class_records SET status='Needs Attention' WHERE class_record_id=$1", [latest]);

        const res = await approve();
        assert.equal(res.status, 409);
        assert.match(res.body.message, /cannot be approved yet/);
        assert.equal(await submissionStatus(), "Pending Approval");

        await t.pool.query("UPDATE class_records SET status='Validated' WHERE class_record_id=$1", [latest]);
    });

    it("INT-05 a revision request sends a waiting record back, and the teacher can then re-upload", async () => {
        const classRecordId = (
            await t.pool.query(
                `SELECT cr.class_record_id FROM class_records cr JOIN grade_records gr USING (class_record_id)
                 WHERE gr.lrn=$1 AND cr.subject_id=$2 ORDER BY cr.upload_date DESC, cr.class_record_id DESC LIMIT 1`,
                [lrn, grade4[1]]
            )
        ).rows[0].class_record_id;

        const res = await t.request("POST", `/api/consolidation/class-records/${classRecordId}/request-revision`, {
            token: t.tokens.adviser_a,
            body: { remarks: "Recheck term 2 scores." },
        });
        assert.equal(res.status, 200, JSON.stringify(res.body));
        assert.ok(res.body.withdrawn_count >= 1);
        assert.equal(await submissionStatus(), "Amendment Requested");

        assert.equal((await upload(grade4[1], ecr())).status, 201);
    });

    it("INT-06 a valid record is approved, and approving it twice is refused", async () => {
        assert.equal((await submit()).status, 200);
        assert.equal((await approve()).status, 200);
        assert.equal(await submissionStatus(), "Approved");
        assert.equal((await approve()).status, 409);
    });
});

describe("Upload integrity: a duplicate LRN stops the upload", () => {
    let t;
    before(async () => (t = await setup()));
    after(async () => t.teardown());

    it("INT-07 two learners sharing one LRN are refused, nothing saved", async () => {
        const { file } = buildEcr({
            lrnFor: (index) => (index < 2 ? "555500000001" : `5555${String(index + 1).padStart(8, "0")}`),
            limit: 3,
        });
        const res = await t.upload({ token: t.tokens.subject_t, subjectId: t.ids.english4, sectionId: t.ids.mabini, file });
        assert.equal(res.status, 422);
        assert.match(res.body.message, /same LRN/);

        const saved = await t.pool.query("SELECT COUNT(*) FROM grade_records WHERE lrn='555500000001'");
        assert.equal(Number(saved.rows[0].count), 0);
    });
});

describe("Accounts: changes apply at once and the system cannot lock itself out", () => {
    let t;
    before(async () => (t = await setup()));
    after(async () => t.teardown());

    const userId = async (username) =>
        (await t.pool.query("SELECT user_id FROM users WHERE username=$1", [username])).rows[0].user_id;
    const updateUser = async (username, body) =>
        t.request("PUT", `/api/users/${await userId(username)}`, { token: t.tokens.admin, body });

    it("INT-08 a deactivated account's existing token stops working at once", async () => {
        assert.equal((await updateUser("subject_t", { status: "Inactive" })).status, 200);
        const res = await t.request("GET", "/api/uploads/options", { token: t.tokens.subject_t });
        assert.equal(res.status, 401);
    });

    it("INT-09 a role change applies to the existing token at once", async () => {
        assert.equal((await updateUser("adviser_none", { role: "subject" })).status, 200);
        const res = await t.request("GET", "/api/consolidation/school-years", { token: t.tokens.adviser_none });
        assert.equal(res.status, 403);
    });

    it("INT-10 an unknown role or status is refused", async () => {
        const res = await t.request("POST", "/api/users", {
            token: t.tokens.admin,
            body: { username: "odd", password: "abc12345", email: "odd@example.com", role: "superuser" },
        });
        assert.equal(res.status, 400);
        assert.equal((await updateUser("principal", { status: "Suspended" })).status, 400);
    });

    it("INT-11 an Administrator cannot deactivate or demote their own account", async () => {
        assert.equal((await updateUser("admin", { status: "Inactive" })).status, 409);
        assert.equal((await updateUser("admin", { role: "principal" })).status, 409);
        const res = await t.request("DELETE", `/api/users/${await userId("admin")}`, { token: t.tokens.admin });
        assert.equal(res.status, 409);
    });

    it("INT-12 an Adviser holding a Class Adviser slot cannot be changed to another role", async () => {
        const res = await updateUser("adviser_a", { role: "subject" });
        assert.equal(res.status, 409);
        assert.match(res.body.message, /Class Adviser of Mabini/);
    });
});
