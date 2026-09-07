# EduCheck Capstone 2 — Development Handoff v3
## SF10 Structural Mapping, Subject-Teacher Notifications, Duplicate-Learner-Number Validation, Searchable Records Repository

**Written:** 2026-09-07, at a deliberate pause point in an active session.
**Supersedes context in:** `EduCheck_Capstone2_Development_Handoff_v2_Consolidation_Submission_Workflow.md` (the consolidation/submission/notifications handoff). That document is still accurate for what it covers — this one picks up immediately after it and should be read as an addition, not a replacement. (v2 itself supersedes an earlier parser-only handoff.)

---

## 1. Where We Left Off

v2 ended with a working submission/approval/notification pipeline, but with the adviser as the only person notified of approve/reject decisions, one named validation gap, and no searchable way to find a student's record. This session closed all three, plus did the groundwork (not the actual generation) for SF10.

### The chain of work done, in order

1. **User already has the official SF10 template — for Grade 4 only, they asked.** Investigated: DepEd's SF10-ES (elementary) is one uniform document covering Grades 1–6, not a per-grade form — "Grade4" in the filename just names which student's copy was exported, not a scope restriction. Confirmed by reading the actual file.
2. **Inspected the template's real structure** (`Grade 4-School-Form-10-ES-Learners-Academic Permanent-Record-Grade4-032725.xlsx`, repo root) — 3 sheets (Front/Back/helper), 531+339 merged cells. Found: one-time personal-info/eligibility fields, then 6 repeated grade-year blocks (Front = Grades 1–4, Back's first block-row = Grades 5–6) each with the same Learning-Areas/Quarterly-Rating/Final-Rating/Remarks grid, plus a genuinely-blank spare block on Back unrelated to any specific grade, plus 3 stacked completer-certification boxes.
3. **Corrected my own mid-session mistake**: initially misread the Back sheet's blank spare block as "Grade 6 has no subjects because MATATAG hasn't finalized them yet." Re-inspection showed Grade 6 (Back, right side) is fully labeled (`Filipino, English, Mathematics, Science, GMRC, Araling Panlipunan, TLE, MAPEH, Music & Arts, PE & Health`) — all 6 grades are fixed and pre-printed. Corrected in conversation and in code comments.
4. **Built `sf10Structure.js`** — a coordinate map (same pattern as `workbookStructure.js`) of the template's cells, split by confidence level (see §5 below).
5. **User then corrected the real blocker**: the template obtained is DepEd's *older* 4-Quarter-per-year SF10 edition. The *current* E-Class Record (and this project's `grade_records` table) uses 3 Terms per year. DepEd has not released an SF10 revision matching the 3-term structure, and no official 3-term↔4-quarter conversion exists to fall back on. **SF10 generation is documented as BLOCKED on that DepEd release** — not on having a template, and not on a question the adviser can answer. Documented in both `sf10Structure.js` and `educheck_schema.sql`.
6. **Subject teachers still had no visibility into submission outcomes** (v2's known gap, §6/§7). Fixed: `consolidationController.js` now exposes each subject's `teacher_user_id`; `submissionController.js`'s approve/reject handler notifies every unique subject teacher involved (one notification per teacher, naming every subject of theirs in that record), not just the adviser.
7. **Testing that fix surfaced a second, separate pre-existing bug**: `SubjectDashboard.jsx` had a hardcoded, non-functional "Notifications" nav item (static fake badge showing "2", no real data, no click handler) — the same class of dead-mockup bug the adviser/admin dashboards had before v2. The backend fix was confirmed correct via direct DB query (notifications *were* being created correctly) before finding this — the bug was purely that the subject dashboard never had a real bell wired in at all. Fixed by wiring in the same `NotificationBell` component the other two dashboards already use.
8. **Closed the one named gap in the validation engine**: added `validateLearnerNumberUniqueness()` to `classRecordValidator.js` — flags two learners assigned the same list number within the same gender section (list numbers restart at 1 per gender section in the real template, confirmed against actual sample data, so the check is correctly scoped per-section, not global). Verified against a real sample file (0 false positives) and a synthetic duplicate (correctly caught).
9. **Built the Searchable Digital Repository** (a named, previously-0%-built Sprint feature): new `GET /api/repository/search` endpoint (LRN or name, optional grade-level filter, cross-school-year) plus a new `RecordsRepository.jsx` page. Search results deep-link into the existing `ConsolidatedRecords.jsx` (extended to read `?year=` and `?lrn=` and auto-expand/scroll/highlight that student) rather than duplicating that page's detail view.
10. **User asked, then confirmed, a real correctness gap in the repository's first version**: it initially showed one ambiguous `grade_level` per student even though a student can legitimately be in different grades across different school years. Fixed: grade level is now derived **per school year** from `grade_records → class_records → subjects.grade_level` (each subject belongs to one grade level, so this is accurate), instead of trusting `students.grade_level` (which is upserted to only the *most recent* upload and can't describe every year). Verified against the live DB and rebuilt clean.
11. **User tested the finished repository live and confirmed it worked.** Session paused here.

### What's confirmed working via the user's own testing (not just automated checks)

Subject-teacher notifications (after the `SubjectDashboard.jsx` fix) and the Records Repository were both tested live by the user against the running app, not just verified in isolation.

---

## 2. Current File Structure

```text
EduCheck/
├── 01-Project Managemet/
├── 02-Product Design/
│   ├── 06-Database/
│   │   ├── SQL/
│   │   │   ├── educheck_schema.sql              — SF10-blocker note rewritten this session (§3)
│   │   │   ├── migrations/
│   │   │   │   └── (unchanged this session — see v2 for 001-003)
│   ├── 08-UI_UX/
│   │   └── Prototype Link_draft.docx             — exists; NOT yet reviewed by this assistant (see §6)
├── Grade 4-School-Form-10-ES-Learners-Academic    — NEW: real official SF10-ES template, repo root
│   Permanent-Record-Grade4-032725.xlsx              (older 4-quarter edition — see §3)
├── EduCheck_Capstone2_Development_Handoff_v2_...md — previous handoff (still valid, read first)
├── EduCheck_Capstone2_Development_Handoff_v3_...md — this file
├── backend/
│   └── src/
│       ├── server.js                              — mounts /api/repository this session
│       ├── controllers/
│       │   ├── classRecordValidator.js            — validateLearnerNumberUniqueness() added
│       │   ├── consolidationController.js         — teacher_user_id exposed per subject
│       │   ├── submissionController.js            — per-teacher notification on approve/reject
│       │   ├── repositoryController.js             — NEW this session
│       │   ├── notificationController.js           — unchanged since v2
│       │   ├── gradeRecordPersistence.js            — unchanged since v2
│       │   └── (auth/user/teacher/parser/upload controllers — unchanged)
│       ├── routes/
│       │   ├── repositoryRoutes.js                  — NEW this session
│       │   └── (consolidation/submission/notification routes — unchanged since v2)
│       └── utils/
│           ├── sf10Structure.js                     — NEW this session
│           └── workbookStructure.js                 — unchanged since v2
└── frontend/
    └── src/
        ├── App.jsx                                  — /records-repository route added
        ├── components/
        │   └── NotificationBell.jsx                 — unchanged; now used by 3 dashboards, not 2
        └── pages/
            ├── Dashboard.jsx                         — "Records Repository" nav item added
            ├── AdminDashboard.jsx                    — dead "Digital Repository" nav item wired live
            ├── SubjectDashboard.jsx                  — dead "Notifications" nav item replaced with real bell
            ├── ConsolidatedRecords.jsx                — reads ?year=/?lrn= deep links, auto-expand+scroll+highlight
            └── RecordsRepository.jsx                  — NEW this session
```

**Note on the new SF10 template file:** `Grade 4-School-Form-10-ES-Learners-Academic Permanent-Record-Grade4-032725.xlsx` sits at the repo root (not in `backend/src/uploads/` — it's a reference template, not an uploaded record). It is DepEd's older 4-Quarter edition — see §3 for why this blocks generation.

**Note on `backend/src/uploads/`:** grew further this session from the user's own live testing (new timestamped uploads). Same caution as v2 applies — mixes real testing activity with fixtures, don't delete casually.

---

## 3. Current Database State

### Schema
No structural changes this session (no new migration). One comment block in `educheck_schema.sql` was rewritten — the note on the dormant `academic_records → validation_reports → sf10 → submissions` chain (sections 9–12) now explains the **precise** SF10 blocker instead of the outdated "no template exists" reasoning:

> A copy of the official SF10-ES template was obtained, but it is DepEd's older 4-Quarter-per-year edition. The current E-Class Record (and `grade_records`) uses 3 Terms per year instead. DepEd has not yet released an SF10 revision matching the 3-term structure, and there is no official 3-term↔4-quarter conversion rule to fall back on — so SF10 generation stays BLOCKED on that release, not on obtaining a template. Do not invent a term↔quarter conversion to unblock this.

Same reasoning, more precisely, is documented at the top of `backend/src/utils/sf10Structure.js`.

### Live row counts (snapshot at time of writing — includes this session's own testing activity)
```
users: 5                teachers: 1              sections: 0
school_years: 1          subjects: 1              students: 100
class_records: 12        grade_records: 200       class_record_validation_issues: 90
record_submissions: 100  notifications: 29
```
(`class_records`/`grade_records`/`notifications` grew from v2's snapshot — 9→12, 100→200, 7→29 respectively — from the user's own live testing this session: re-uploads, bulk-approvals, and repository searches. Not something to reset without asking, same as v2's standing caution.)

`sections` still empty, `subjects` still just 1 row (Mathematics, grade 6) — unchanged since v2, still caps what grade-level filtering/completeness can meaningfully do.

### Seeded accounts
Unchanged from v2 — see that document §3. Notable for continuity: `subject.grade6a` (user_id 7) is the account with real notification history from this session's testing; `test.subject` (user_id 11) has none (expected — never the teacher on an approved/rejected record).

---

## 4. API Surface Added/Changed This Session

```js
app.use("/api/repository", repositoryRoutes);   // NEW
```

| Method | Path | Role | Purpose |
|---|---|---|---|
| GET | `/api/repository/search` | adviser, admin | Search students by LRN or name (either "Last, First" or "First Last"), optional `grade_level` filter, across ALL school years at once. Returns identity info + per-school-year grade level (see §5). Caps at 50 results, flags `truncated`. |

No other endpoints changed shape except what's noted in §5 (consolidation's per-subject objects gained `teacher_user_id`).

---

## 5. Exact Code Just Finished

### `backend/src/utils/sf10Structure.js` (full file — NEW)
Coordinate map for the SF10-ES template. Read the file's own header comment for full context — condensed here:
- **HIGH confidence** (verified directly against the template's merge layout, cross-checked identical across all 6 blocks): `personalInfo`, every `gradeBlocks[].columns` / `.subjectRows` / `.generalAverageRow`.
- **UNVERIFIED, deliberately left `null`**: every `gradeBlocks[].header` (School/District/Division/Region/Section/School Year/Adviser/Signature) and the eligibility-section checkboxes — several labels/fields share rows ambiguously; guessing here risked silently writing into the wrong box. Fastest fix path documented in the file: open in Excel and read each field's address from the Name Box, or run a marker-stamp script.
- **BLOCKED for real use**: the `quarters` columns are structurally correct (this is where a Quarter-graded SF10 wants its values) but must NOT be wired to real `term_1/2/3` data — see §3.

(Full ~270-line file already written to disk — see the actual file for the complete `gradeBlocks` array covering all 6 grades plus the spare block and certification boxes.)

### `backend/src/controllers/classRecordValidator.js` (new function + one call site added)
```js
// learner_number restarts at 1 for each gender section in the E-Class
// Record template (Male 1..N, then Female 1..M — see LEARNER_SECTIONS in
// classRecordParser.js), so a duplicate is only meaningful WITHIN one
// gender group: a Male #1 and a Female #1 existing together is normal,
// not a collision. A genuine duplicate (two rows in the same section
// accidentally given the same list number) is a real data-entry mistake
// in the source workbook — worth flagging even though it doesn't
// currently break anything downstream (term/summary matching keys off
// number + name together, so it wouldn't silently corrupt those lookups),
// because it signals the uploader mis-typed a list number and should fix
// it before this class list is trusted for anything position-based.
const validateLearnerNumberUniqueness = (learners) => {
    const issues = [];
    const namesByGenderAndNumber = new Map();

    learners.forEach((learner) => {
        const groupKey = `${learner.gender}|${learner.learner_number}`;

        if (!namesByGenderAndNumber.has(groupKey)) {
            namesByGenderAndNumber.set(groupKey, []);
        }

        namesByGenderAndNumber.get(groupKey).push(learner.learner_name);
    });

    namesByGenderAndNumber.forEach((names, groupKey) => {
        if (names.length <= 1) return;

        const [gender, learnerNumber] = groupKey.split("|");

        issues.push(
            createIssue({
                code: "DUPLICATE_LEARNER_NUMBER",
                severity: "error",
                message: `List number ${learnerNumber} (${gender}) is assigned to more than one learner in the INPUT sheet: ${names.join(", ")}. Each learner must have a unique list number within their section.`,
            })
        );
    });

    return issues;
};
```
Wired in via one line inside `validateClassRecord()`, right after the existing `NO_SUMMARY_RECORDS_DETECTED` check:
```js
workbookIssues.push(...validateLearnerNumberUniqueness(learners));
```
Verified: 0 false positives against a real sample file; correctly caught a synthetic duplicate (two Male learners both forced to list number 5) with a message naming both.

### `backend/src/controllers/consolidationController.js` (2 small additions)
The shared query (`buildRankedGradesQuery`) now also selects the teacher's login id, not just their name:
```sql
t.first_name AS teacher_first_name,
t.last_name AS teacher_last_name,
t.user_id AS teacher_user_id        -- ADDED
```
And `groupRowsByStudent()` attaches it to each per-subject object:
```js
// The teacher's users.user_id (not teachers.teacher_id) — this is
// what notifications.user_id needs, since notifications are keyed
// to a login, not a teacher profile. Used by submissionController
// to tell a subject teacher when their uploaded grades ended up in
// an approved/rejected consolidated record.
teacher_user_id: row.teacher_user_id,
```
(`teachers.teacher_id` and `teachers.user_id` are different columns in this schema — this had to be pulled in explicitly, it wasn't already available.)

### `backend/src/controllers/submissionController.js` (`decideSubmission` extended)
After the existing adviser notification block, added:
```js
// Notify each subject teacher whose uploaded grades fed into this
// consolidated record too — previously only the adviser who
// submitted it found out the outcome, and the teacher who actually
// uploaded the underlying subject grades had no visibility into
// what happened to it downstream. One notification per teacher
// (not per subject) in case the same teacher owns more than one
// subject for this student, naming every subject of theirs involved.
const student = await fetchConsolidatedStudent(schoolYearId, lrn);

if (student) {
    const subjectNamesByTeacher = new Map();

    student.subjects.forEach((subject) => {
        if (!subject.teacher_user_id) return;

        if (!subjectNamesByTeacher.has(subject.teacher_user_id)) {
            subjectNamesByTeacher.set(subject.teacher_user_id, []);
        }

        subjectNamesByTeacher.get(subject.teacher_user_id).push(subject.subject_name);
    });

    for (const [teacherUserId, subjectNames] of subjectNamesByTeacher) {
        const subjectList = subjectNames.join(", ");
        const teacherMessage =
            targetStatus === "Approved"
                ? `${studentName}'s consolidated record — including your ${subjectList} grade(s) — was approved.`
                : `${studentName}'s consolidated record — including your ${subjectList} grade(s) — was rejected.${remarks ? ` Reason: ${remarks}` : ""}`;

        await pool.query(
            `INSERT INTO notifications (user_id, title, message, status) VALUES ($1, $2, $3, 'Unread')`,
            [teacherUserId, `Submission ${targetStatus}`, teacherMessage]
        );
    }
}
```
(`studentName` was hoisted out of the adviser-only `if` block so both notification loops can use it.) Verified live: `subject.grade6a` (user_id 7) received correctly-worded notifications for every approval during testing.

### `frontend/src/pages/SubjectDashboard.jsx` (dead nav item → real bell)
```jsx
// BEFORE:
<a className="nav-item">
    <Bell size={19} />
    Notifications
    <span className="notification-badge">2</span>
</a>

// AFTER:
<NotificationBell />
```
(Plus: `import NotificationBell from "../components/NotificationBell";` added; the now-unused `Bell` icon import removed from the lucide-react import list.)

### `backend/src/controllers/repositoryController.js` (full file — NEW)
```js
const pool = require("../db");

// ==========================================
// SEARCH STUDENTS (Searchable Digital Repository)
// ==========================================
// Lets an adviser/admin look up a specific learner by LRN or name,
// optionally narrowed by grade level, WITHOUT first having to know which
// school year to pick — unlike /api/consolidation, which requires a
// school year up front and only shows that one year's students. Returns
// basic identity info plus, per school year that learner has at least one
// recorded grade in, the grade level they were actually in that year — so
// the caller can jump straight to
// /api/consolidation/school-years/:id/students/:lrn for the actual record
// rather than this endpoint duplicating that one's work.
//
// `students.grade_level` only stores the learner's MOST RECENT grade
// level — it's upserted to the latest value on every grade upload (see
// gradeRecordPersistence.js), not kept as year-by-year history, so it
// can't be trusted to describe every year a learner has records in. The
// per-year grade level below is derived properly instead, from
// grade_records -> class_records -> subjects.grade_level (subjects each
// belong to one grade level, and a class_record is always for one
// subject), which genuinely is recorded per year. `latest_grade_level` is
// kept alongside it for a quick "what grade are they in now" glance, but
// callers should prefer the per-year value for anything tied to a
// specific school year.
const searchStudents = async (req, res) => {
    try {
        const rawQuery = typeof req.query.q === "string" ? req.query.q.trim() : "";
        const gradeLevel =
            typeof req.query.grade_level === "string" && req.query.grade_level.trim() !== ""
                ? req.query.grade_level.trim()
                : null;

        if (rawQuery.length === 0 && !gradeLevel) {
            return res.status(400).json({
                message: "Provide a search term (LRN or name) or a grade level filter.",
            });
        }

        const likeQuery = `%${rawQuery}%`;

        const result = await pool.query(
            `
            SELECT
                s.lrn,
                s.first_name,
                s.last_name,
                s.grade_level AS latest_grade_level,
                COALESCE(
                    json_agg(
                        DISTINCT jsonb_build_object(
                            'school_year_id', cr.school_year_id,
                            'grade_level', subj.grade_level
                        )
                    ) FILTER (WHERE cr.school_year_id IS NOT NULL),
                    '[]'
                ) AS school_years
            FROM students s
            LEFT JOIN grade_records gr ON gr.lrn = s.lrn
            LEFT JOIN class_records cr ON cr.class_record_id = gr.class_record_id
            LEFT JOIN subjects subj ON subj.subject_id = cr.subject_id
            WHERE
                (
                    $1 = ''
                    OR s.lrn ILIKE $2
                    OR (s.last_name || ', ' || s.first_name) ILIKE $2
                    OR (s.first_name || ' ' || s.last_name) ILIKE $2
                )
                AND ($3::varchar IS NULL OR s.grade_level = $3)
            GROUP BY s.lrn, s.first_name, s.last_name, s.grade_level
            ORDER BY s.last_name, s.first_name
            LIMIT 50
            `,
            [rawQuery, likeQuery, gradeLevel]
        );

        const students = result.rows;

        return res.json({
            students,
            result_count: students.length,
            // 50 is a safety cap, not a "there are exactly 50" claim — tell
            // the caller when results may have been cut off so the UI can
            // prompt for a narrower search instead of implying completeness.
            truncated: students.length === 50,
        });
    } catch (error) {
        console.error("Repository search error:", error);

        return res.status(500).json({ message: "Failed to search records." });
    }
};

module.exports = { searchStudents };
```

### `backend/src/routes/repositoryRoutes.js` (full file — NEW)
```js
const express = require("express");

const { searchStudents } = require("../controllers/repositoryController");

const {
    authenticateToken,
    authorizeRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();

// Same access as /api/consolidation — this is a cross-year lookup layer
// in front of it, not a separate audience.
router.use(
    authenticateToken,
    authorizeRoles("adviser", "admin")
);

router.get("/search", searchStudents);

module.exports = router;
```

### `backend/src/server.js` (2 lines added)
```js
const repositoryRoutes = require("./routes/repositoryRoutes");   // with the other route requires
...
app.use("/api/repository", repositoryRoutes);                     // with the other app.use() mounts
```

**Frontend files not reproduced in full here** (long, inline-styled JSX consistent with the rest of the codebase — same convention as v2's handoff) — locate at:
- `frontend/src/pages/RecordsRepository.jsx` — NEW. Search form (LRN/name text input + optional grade-level text input), results list where each student shows their current grade level plus one clickable chip per school year they have records in, each chip labeled with that year's actual grade level (e.g. "View 2025-2026 (Grade 6)") and linking to `/consolidated-records?year=<id>&lrn=<lrn>`.
- `frontend/src/pages/ConsolidatedRecords.jsx` — extended, not new. Added `useSearchParams` to read `?year=` (preselects that school year on load if valid) and `?lrn=` (auto-expands that student's row once loaded, scrolls it into view, applies a light-blue highlight background). Guarded with a ref so it only auto-expands once — a later refetch (e.g. after approve/reject) won't silently re-expand a row the user manually collapsed.
- `frontend/src/pages/Dashboard.jsx` (adviser) — added a "Records Repository" nav item (new `Database` icon import from lucide-react) linking to `/records-repository`, placed right after "Consolidated Records".
- `frontend/src/pages/AdminDashboard.jsx` — the sidebar already had a **dead, unwired "Digital Repository" nav item** (Database icon, no `onClick`) sitting there from earlier in the project, same pattern as the "Submission Review" dead link v2 found and fixed. Wired it to `navigate("/records-repository")` rather than adding a redundant second item.
- `frontend/src/App.jsx` — added `/records-repository` route, `ProtectedRoute allowedRoles={["adviser", "admin"]}`, same access pattern as `/consolidated-records`.

All backend changes verified with `node --check` (syntax) plus direct DB-backed function calls (not just HTTP-level assumptions) before being called done. All frontend changes verified with a full `npm run build` (clean, no errors) after each round of edits.

---

## 6. Honest Gap Assessment (updated from v2 §6)

| Feature | Status |
|---|---|
| Direct DepEd e-Class Record Import | ✅ Built (v2) |
| Multi-Subject Consolidation | ✅ Built (v2) |
| Submission/Approval Workflow | ✅ Built (v2), notification gap closed (this session) |
| Rule-Based Validation Engine | ✅ Complete as originally scoped — the one named gap (duplicate learner number) is now closed |
| Searchable Digital Repository | ✅ Built this session — LRN/name search + grade-level filter, cross-school-year, tested live |
| Automatic SF10 Generation | ⛔ Still blocked — now for a precise, documented reason: template obtained is DepEd's older 4-quarter edition; no 3-term↔4-quarter conversion exists yet. Structural cell-mapping work (`sf10Structure.js`) is done and ready for whenever DepEd releases the matching edition. |
| Submission Readiness Assessment | ⚠️ Partial — unchanged since v2 (blocks on completeness, no field-level detail) |
| Academic Analytics Dashboard | ⚠️ Minimal — unchanged since v2 (On Track/At Risk/Needs Intervention only) |
| Offline-First | ❌ Not started — unchanged |
| Principal role | ❌ Confirmed absent — unchanged |
| Admin "generates reports" | ❌ Not built — unchanged |
| Subject Teacher visibility into submission outcomes | ✅ Fixed this session (was the "real gap identified, not yet fixed" item in v2 §6) |
| UI/UX polish against the user's prototype | ❌ Not started — deliberately deprioritized this session (user asked directly; agreed to build remaining functional gaps first and do one consolidated polish pass later, rather than polishing dashboards now and redoing it after each new page). **The prototype itself (`02-Product Design/08-UI_UX/Prototype Link_draft.docx`) has still not been reviewed by this assistant.** |

---

## 7. Literal Next Step

No task was left mid-flight — this is a clean pause after the repository feature was tested and confirmed working. Candidates for the next session, in the order they came up in conversation (not necessarily priority order):

1. **UI/UX polish pass against the prototype** — explicitly deferred this session, not abandoned. First step would be actually reading `02-Product Design/08-UI_UX/Prototype Link_draft.docx`, which hasn't happened yet.
2. **Fuller Academic Analytics Dashboard** — currently just 3 grade-band counts; the original v2.0 vision doc wanted class/subject performance, honor roll, grade distribution, promotion stats.
3. **SF10 generation** — stays blocked until DepEd releases a 3-term-matching SF10-ES edition, or confirms an official conversion. Nothing to do here proactively except wait/ask periodically.
4. **Principal role, offline/mobile, admin reporting** — all still fully unstarted, same as v2.

**No standing recommendation was made for which of 1–2 to pick first** — this pause happened right after a "great, i tested it" confirmation, before that conversation happened. Worth deciding fresh next session rather than assuming.

## 8. Operational Notes for Next Session

- **Start backend:** `cd backend && npm run dev` — confirm `EduCheck backend running on http://localhost:5000` prints.
- **Start frontend:** `cd frontend && npm run dev` — open the printed URL (typically `http://localhost:5173`).
- **Seeded test accounts:** see v2 §3. `subject.grade6a` (user_id 7) now has substantial real notification history from this session's testing — good account to demo the bell with. `test.subject` (user_id 11) still has zero notifications — correctly so, not a bug.
- **The live DB has real usage data from two sessions now** (v2 + this one) — do not wipe `record_submissions`, `notifications`, `students`, or `grade_records` without checking with the user first.
- **Git status at this pause:** everything described here (and everything from v2) is still uncommitted in the working tree. The user has not asked for a commit at any point across either session — confirm before committing or pushing.
- **The stray "ddgjsj" commit** on `main` noted in v2 as unreconciled is still unreconciled — nothing done about it this session either.
- **The new SF10 template file** (`Grade 4-School-Form-10-ES-Learners-Academic Permanent-Record-Grade4-032725.xlsx`, repo root) is real and useful for the structural work already done, but do not attempt to wire real grade values into it — see §3.
