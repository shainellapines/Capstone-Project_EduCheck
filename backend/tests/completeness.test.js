const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup, buildEcr, lrnGenerator } = require("./helpers/env");

// Record completeness (EPIC-03/06): a learner is complete only when every
// subject of their own grade level has a grade. A grade for another grade
// level's subject - legacy data from before the upload grade-level check -
// must not count toward completeness, Section Progress, or the approval
// snapshot (and so never reaches the SF10).
describe("Completeness counts only the learner's own grade-level subjects", () => {
    let t;
    let sy;
    let grade4Subjects;
    const lrn = "666600000001";
    const learners = () => buildEcr({ lrnFor: lrnGenerator("6666"), limit: 3 });

    const upload = (subjectId) =>
        t.upload({ token: t.tokens.adviser_a, subjectId, sectionId: t.ids.mabini, file: learners().file });
    const record = () =>
        t.request("GET", `/api/consolidation/school-years/${sy}/students/${lrn}`, { token: t.tokens.adviser_a });
    const submit = () =>
        t.request("POST", `/api/submissions/school-years/${sy}/students/${lrn}/submit`, { token: t.tokens.adviser_a });
    const mabiniProgress = async () => {
        const res = await t.request("GET", `/api/consolidation/school-years/${sy}/sections`, { token: t.tokens.admin });
        return res.body.sections.find((section) => section.section_id === t.ids.mabini);
    };

    before(async () => {
        t = await setup();
        sy = t.ids.schoolYear;

        // Mabini (Grade 4) is Self-Contained, so its Adviser uploads every subject.
        await t.pool.query("UPDATE sections SET staffing_mode='Self-Contained' WHERE section_id=$1", [t.ids.mabini]);
        grade4Subjects = (
            await t.pool.query("SELECT subject_id, subject_name FROM subjects WHERE grade_level='4' ORDER BY 1")
        ).rows;
        assert.equal(grade4Subjects.length, 8);

        // 7 of the 8 Grade 4 subjects.
        for (const { subject_id } of grade4Subjects.slice(0, 7)) {
            const res = await upload(subject_id);
            assert.equal(res.status, 201, JSON.stringify(res.body));
        }

        // A Grade 5 English upload for the same learners, inserted directly
        // the way legacy rows exist (the upload API now refuses it).
        const stray = await t.pool.query(
            `INSERT INTO class_records (teacher_id, subject_id, school_year_id, file_name, status, section_id, ready_for_submission)
             VALUES ($1, $2, $3, 'legacy-stray.xlsx', 'Validated', $4, true) RETURNING class_record_id`,
            [t.ids.adviserATeacher, t.ids.english5, sy, t.ids.mabini]
        );
        const lrns = (
            await t.pool.query("SELECT lrn FROM section_enrollments WHERE section_id=$1 AND school_year_id=$2", [
                t.ids.mabini,
                sy,
            ])
        ).rows;
        assert.ok(lrns.some((row) => row.lrn === lrn), "test learner should be enrolled in Mabini");
        for (const row of lrns) {
            await t.pool.query(
                `INSERT INTO grade_records (class_record_id, lrn, term_1, term_2, term_3, final_grade)
                 VALUES ($1, $2, 90, 90, 90, 90)`,
                [stray.rows[0].class_record_id, row.lrn]
            );
        }
    });
    after(async () => t.teardown());

    it("COMP-01 7 own subjects + 1 stray subject is 7/8, not complete", async () => {
        const res = await record();
        assert.equal(res.status, 200, JSON.stringify(res.body));
        const student = res.body.student ?? res.body;
        assert.equal(student.subjects_expected, 8);
        assert.equal(student.subjects_recorded, 7);
        assert.equal(student.all_subjects_submitted, false);
        assert.ok(
            student.subjects.every((subject) => subject.subject_id !== t.ids.english5),
            "the Grade 5 subject must not be listed as one of the learner's subjects"
        );
    });

    it("COMP-02 the incomplete record cannot be submitted (409)", async () => {
        const res = await submit();
        assert.equal(res.status, 409);
        assert.match(res.body.message, /incomplete/);
    });

    it("COMP-03 Section Progress ignores the stray subject", async () => {
        const section = await mabiniProgress();
        assert.equal(section.subjects_expected, 8);
        assert.equal(section.subjects_submitted, 7);
        assert.equal(section.subjects_not_started, 1);
    });

    it("COMP-04 once the 8th subject is uploaded the record is complete, and the snapshot holds only own-grade subjects", async () => {
        const res = await upload(grade4Subjects[7].subject_id);
        assert.equal(res.status, 201, JSON.stringify(res.body));

        const student = (await record()).body;
        const current = student.student ?? student;
        assert.equal(current.subjects_recorded, 8);
        assert.equal(current.all_subjects_submitted, true);

        assert.equal((await submit()).status, 200);
        const approved = await t.request("POST", `/api/submissions/school-years/${sy}/students/${lrn}/approve`, {
            token: t.tokens.admin,
        });
        assert.equal(approved.status, 200, JSON.stringify(approved.body));

        const snapshot = (
            await t.pool.query("SELECT snapshot FROM record_submissions WHERE lrn=$1 AND school_year_id=$2", [lrn, sy])
        ).rows[0].snapshot;
        assert.equal(snapshot.subjects.length, 8);
        assert.deepEqual(
            snapshot.subjects.map((subject) => subject.subject_name).sort(),
            grade4Subjects.map((subject) => subject.subject_name).sort()
        );
    });

    it("COMP-05 'submit all' submits the other complete learners and sends the Administrator one summary", async () => {
        const res = await t.request("POST", `/api/submissions/school-years/${sy}/submit-all`, {
            token: t.tokens.adviser_a,
        });
        assert.equal(res.status, 200, JSON.stringify(res.body));
        assert.equal(res.body.submitted_count, 2, "the two complete, not-yet-approved Mabini learners");

        const notices = (
            await t.pool.query(
                `SELECT n.message FROM notifications n JOIN users u USING (user_id)
                 WHERE u.username = 'admin' AND n.title = 'Records Submitted for Approval'`
            )
        ).rows;
        assert.equal(notices.length, 1, "one summary, not one per learner");
        assert.equal(
            notices[0].message,
            "Ana Adviser-A submitted 2 consolidated record(s) for approval (2 from Grade 4 – Mabini)."
        );
    });
});
