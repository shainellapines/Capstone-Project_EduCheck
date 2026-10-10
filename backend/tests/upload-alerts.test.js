const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const XLSX = require("xlsx");
const { setup, buildEcr, lrnGenerator } = require("./helpers/env");

// Upload validation alerts (SPMP M-02): when rule-based validation flags an
// upload, the uploader gets a notification (which the mobile app polls);
// a clean upload sends nothing.
describe("Upload validation alerts (M-02)", () => {
    let t;

    before(async () => (t = await setup()));
    after(async () => t.teardown());

    const lrns = lrnGenerator("4444");
    const upload = (file) =>
        t.upload({ token: t.tokens.subject_t, subjectId: t.ids.english4, sectionId: t.ids.mabini, file });
    const alerts = async () =>
        (
            await t.pool.query(
                `SELECT n.title, n.message FROM notifications n JOIN users u USING (user_id)
                 WHERE u.username = 'subject_t' AND n.title LIKE 'Upload%' ORDER BY n.notification_id`
            )
        ).rows;

    it("NTF-01 a clean upload sends no alert", async () => {
        // Every learner has an LRN, so validation finds nothing.
        const { file } = buildEcr({ lrnFor: lrns });
        const res = await upload(file);
        assert.equal(res.status, 201, JSON.stringify(res.body));
        assert.equal(res.body.validation.error_count, 0);
        assert.equal(res.body.validation.warning_count, 0);
        assert.deepEqual(await alerts(), []);
    });

    it("NTF-02 warnings only: 'Upload Has Warnings', pointing to the validation results", async () => {
        // Only the first 10 learners keep an LRN: the rest are MISSING_LRN warnings.
        const { file } = buildEcr({ lrnFor: lrns, limit: 10 });
        const res = await upload(file);
        assert.equal(res.status, 201, JSON.stringify(res.body));
        assert.equal(res.body.validation.error_count, 0);
        assert.ok(res.body.validation.warning_count > 0);

        const [alert] = await alerts();
        assert.equal(alert.title, "Upload Has Warnings");
        assert.equal(
            alert.message,
            `Validation found ${res.body.validation.warning_count} warning(s) in your English upload for ` +
                "Grade 4 – Mabini. Review them on the validation results page."
        );
    });

    it("NTF-03 errors: 'Upload Needs Correction', telling the teacher to fix the file and re-upload", async () => {
        const { file } = buildEcr({ lrnFor: lrns });
        // Give the second learner the first learner's list number: a validation error.
        const workbook = XLSX.readFile(file);
        workbook.Sheets.INPUT.A13 = { ...workbook.Sheets.INPUT.A12 };
        XLSX.writeFile(workbook, file);

        const res = await upload(file);
        assert.equal(res.status, 201, JSON.stringify(res.body));
        assert.ok(res.body.validation.error_count > 0, "the duplicate list number should be an error");

        const all = await alerts();
        assert.equal(all.length, 2, "one alert per flagged upload");
        const latest = all[1];
        assert.equal(latest.title, "Upload Needs Correction");
        assert.match(
            latest.message,
            new RegExp(
                `^Validation found ${res.body.validation.error_count} error\\(s\\)( and \\d+ warning\\(s\\))? ` +
                    "in your English upload for Grade 4 – Mabini\\. Correct them in the e-Class Record and re-upload\\.$"
            )
        );
    });
});
