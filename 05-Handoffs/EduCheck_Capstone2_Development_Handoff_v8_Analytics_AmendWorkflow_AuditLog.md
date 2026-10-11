# EduCheck Capstone 2 — Development Handoff v8
## Analytics, Un-Approve/Amend Workflow, Audit Log, Docx Housekeeping — v7's Open List Fully Closed

**Written:** 2026-09-14.
**Supersedes context in:** `EduCheck_Capstone2_Development_Handoff_v7_SPMP_Gap_Table_Closed.md`. v7 is still fully accurate for what it covers (through commit `defa8c9`); this file picks up exactly where v7's §8 "Literal Next Step" candidates list left off, in a new session.

---

## 1. Where We Left Off

v7 ended with its own SPMP v1.0 gap table fully closed, and §8 listed four **unrequested, informed options** for what might matter next (explicitly *not* a queued backlog):

1. Academic/Performance Analytics (dead nav placeholder every role had)
2. The un-approve/amend workflow (contradiction between the subject-level revision-request path and the whole-student approval path)
3. An audit log for section/assignment changes (SPMP Risk Management §11)
4. Docx housekeeping (commit the `01-Project Managemet/` reorg)

This session built and verified all four, in that order, one commit each. **All four are now done.** There is no known open item carried over from v7's list — see §8 below for what's next instead (a smaller, freshly-found gap, not a leftover from before).

Four commits, in order, on top of v7's three:

1. `22eef11` — Academic/Performance Analytics
2. `170de27` — un-approve/amend workflow for `record_submissions`
3. `4cc5b92` — audit log for section/teacher-assignment changes
4. `30ff7c9` — docx housekeeping (old SPMP draft removed, SPMP v1.0 committed)

Same pattern as every prior session: scope against the real current code, confirm real decision points with the user (see the two `AskUserQuestion` calls below), build, live-verify against the real dev DB with actual HTTP requests (plus, new this session, actual Playwright screenshots — see §1a), revert any DB state touched purely for testing, commit with only that feature's own files staged.

### 1a. New this session: real browser verification, not just curl

Every prior session's "live verification" meant curl-driven HTTP tests only — no prior session had a way to actually render the frontend and look at it. This session installed **Playwright + Chromium** (in the scratchpad, not the project — nothing added to `package.json`) and used it to log in as each role and screenshot the real rendered pages. Confirmed zero console errors on Analytics (all 3 roles: admin, adviser, principal) and Audit Log (admin), both collapsed and expanded states. This is a capability, not a one-time artifact — the browser binary is cached locally (`C:\Users\NITRO V\AppData\Local\ms-playwright\`) and the driver script pattern (`chromium.launch()` → login via `.role-selector button:has-text(...)`, `#username`, `#password` → `page.goto()` the target route → `page.screenshot()`) can be reused next session without re-downloading anything.

### 1b. A correction, found via the SPMP docx directly, not just the handoff's paraphrase

At the end of this session the user asked "are we following what's on the SPMP — is the audit log necessary?" Rather than trust v7's own paraphrase of the SPMP, the actual `.docx` was unzipped and its `document.xml` converted to plain text to check directly. **Confirmed verbatim, §11 Risk Management:**

> **Risk:** Incorrect subject/section assignment — Low probability, High impact
> **Mitigation:** *"Administrator-only assignment control with a confirmation step and audit log."*

So the audit log built this session is correctly required, word-for-word. But that mitigation is a **three-part** sentence, and only two parts were ever actually checked:

1. **Admin-only control** — ✅ true (`sectionController`/`assignmentController` are `authorizeRoles("admin")`-gated).
2. **A confirmation step** — ⚠️ **partially true**. `SectionAssignments.jsx` already has `window.confirm(...)` on `handleDeleteSection` and `handleDeleteAssignment` (built in an earlier, pre-v4 session) — but **`handleCreateAssignment` (and section creation) have no confirmation step at all.** Creating the *wrong* assignment is the actual risk named ("**incorrect** subject/section assignment") — the delete path isn't where that risk lives. This gap was found in the last few minutes of the session and **not yet fixed** — see §8.
3. **Audit log** — ✅ done this session (`4cc5b92`).

This is the one concrete, SPMP-sourced, still-open item this handoff carries forward — not a vague "maybe" but a literal unclosed third of a requirement already two-thirds done.

---

## 2. Current File Structure (delta from v7 only)

```text
EduCheck/
├── 01-Project Managemet/
│   └── 01 - EduCheck_SPMP_v1.0_1.docx                    ← now committed (was untracked since v4); old
│                                                             "01-EduCheck Software Development Plan.docx" removed
├── 02-Product Design/06-Database/SQL/migrations/
│   ├── 007_audit_logs.sql                                 ← NEW
│   └── README.md                                           ← CHANGED — row added for 007
├── EduCheck_Capstone2_Development_Handoff_v8_...md          ← this file
├── backend/
│   └── src/
│       ├── controllers/
│       │   ├── analyticsController.js                       ← NEW
│       │   ├── auditLogController.js                        ← NEW
│       │   ├── assignmentController.js                       ← CHANGED — recordAuditLog on create/delete, RETURNING * on delete
│       │   ├── consolidationController.js                    ← CHANGED — buildRankedGradesQuery exported; requestRevision reopens Approved record_submissions rows
│       │   ├── sectionController.js                          ← CHANGED — recordAuditLog on create/update/delete, RETURNING * on delete, before-snapshot fetch on update
│       │   └── submissionController.js                       ← CHANGED — submitForApproval/submitAllEligible block while any subject is "Needs Revision"
│       ├── routes/
│       │   ├── analyticsRoutes.js                            ← NEW
│       │   └── auditLogRoutes.js                             ← NEW
│       ├── utils/
│       │   └── auditLog.js                                   ← NEW — recordAuditLog() write helper
│       └── server.js                                          ← CHANGED — /api/analytics, /api/audit-logs mounted
└── frontend/
    └── src/
        ├── App.jsx                                            ← CHANGED — /analytics, /audit-log routes
        ├── components/Sidebar.jsx                             ← CHANGED — Analytics nav item (all 3 roles, unified "analytics" key), Audit Log nav item (admin only)
        └── pages/
            ├── AdminDashboard.jsx                              ← CHANGED — "Academic Analytics" quick action now wired (was dead), Amendment Requested badge class
            ├── Analytics.jsx / .css                             ← NEW
            ├── AuditLog.jsx / .css                              ← NEW
            ├── ConsolidatedRecords.jsx / .css                   ← CHANGED — Amendment Requested badge/note, resubmit button covers it, bulk-eligible count excludes Needs-Revision subjects
            └── SectionProgress.jsx / .css                       ← CHANGED — Amendment Requested counted in per-section submission breakdown
```

Everything from v7's file structure (revision requests, Section Progress, Principal role, section staffing/assignments, auth hardening) is unchanged and already committed.

---

## 3. Current Database State

- **New table `audit_logs` (migration 007), currently 0 rows.** Generic shape: `actor_user_id`, `action` ('create'/'update'/'delete'), `entity_type` ('section'/'teacher_assignment'), `entity_id`, `before_data`/`after_data` (JSONB), `created_at`. Applied live, verified with a real create→update→delete cycle on a throwaway section and a throwaway assignment, then every test row deleted afterward — **the table is genuinely empty**, ready for real usage.
- **`record_submissions`: 100 rows, unchanged count.** Status breakdown: 82 `Pending Approval`, 18 `Approved`, 0 `Rejected`, 0 `Amendment Requested`. The `Amendment Requested` status is new (no migration needed — `status` is an unconstrained `VARCHAR(30)`, same convention as `class_records.status`); it was live-tested (a revision request against a shared class_record correctly flipped **18** already-Approved students to `Amendment Requested` at once, notified their approver) and then every one of those 18 rows reverted to `Approved` with their original `updated_at` restored — confirmed byte-for-byte against a pre-test snapshot.
- **`class_records` / `grade_records` / `students` / `subjects` / `sections` / `teacher_assignments` / `users` / `teachers`: unchanged from v7** (14 / 300 / 100 / 40 / 2 / 3 / 4 / 2 rows respectively).
- **`notifications`: 33 rows, unchanged count** (was 33 at the end of v7 too — 19 test notifications from this session's amend-workflow test were created and deleted, net zero).
- **No new users created this session** — `principal.educheck` (from v7) is still the newest account.

---

## 4. API Surface Added/Changed This Session

| Method | Path | Change |
|---|---|---|
| GET | `/api/analytics/school-years/:schoolYearId` | **NEW** — adviser/admin/principal. School-wide overview (graded entries, average final grade, pass rate, at-risk count), a 5-band grade distribution (DepEd descriptors), and per-section/per-subject roll-ups of the same shape. |
| GET | `/api/audit-logs` | **NEW** — admin-only. Optional `?entity_type=section\|teacher_assignment`. Most-recent-200, `truncated` flag, same shape convention as `repositoryController.searchStudents`. |
| POST | `/api/consolidation/class-records/:classRecordId/request-revision` | **Changed** — now also finds every student the flagged class_record covers and flips any of their already-`Approved` `record_submissions` rows to `Amendment Requested`, notifying the approving admin. Response now includes `amended_count`. |
| POST | `/api/submissions/school-years/:schoolYearId/students/:lrn/submit` | **Changed** — now also refuses (409) if any subject still carries a live `Needs Revision` flag, alongside the existing "incomplete" and "already Approved" guards. |
| POST | `/api/submissions/school-years/:schoolYearId/submit-all` | **Changed** — `submitAllEligible`'s eligibility filter now also excludes students with a `Needs Revision` subject. |
| POST/PUT/DELETE | `/api/sections`, `/api/assignments` | **Changed** — every mutation (`createSection`, `updateSection`, `deleteSection`, `createAssignment`, `deleteAssignment`) now writes an `audit_logs` row via `recordAuditLog()`. `deleteSection`/`deleteAssignment` widened their SQL `RETURNING` from an id/name pair to `RETURNING *` so the log can capture the full deleted row; `updateSection` now fetches the pre-update row first so the log has a real diff. No response shape change other than `deleteSection`'s `section` field now carrying `staffing_mode` too (additive, non-breaking). |

No changes to `/api/uploads/*`, `/api/repository/*`, `/api/users/*`, `/api/teachers/*`, or auth.

---

## 5. Exact Code Just Finished

*(Covers only what's new/changed since v7 — v7's own §5 still stands for everything through Principal role.)*

### Academic/Performance Analytics

One shared page/endpoint behind both the Admin "Academic Analytics" and Adviser "Performance Analytics" nav labels (previously both dead `path: null`), extended to Principal too — confirmed with the user via `AskUserQuestion` before building (both "one shared page" and "include Principal" were the recommended, chosen options).

**`analyticsController.getAnalyticsForSchoolYear`**: reuses `consolidationController.buildRankedGradesQuery` (newly exported) — the same "latest `class_record` per (student, subject) wins" ranked rows every other consolidation view already uses — and aggregates it three ways in JS (small dataset, same style as `getSectionProgressForSchoolYear`'s own JS-side `Map` aggregation):

- **Overview**: `graded_entries`, `average_final_grade`, `pass_rate`, `at_risk_count`.
- **Grade distribution**: 5 DepEd descriptor bands — `90-100` Outstanding, `85-89` Very Satisfactory, `80-84` Satisfactory, `75-79` Fairly Satisfactory, `Below 75` Did Not Meet Expectations.
- **Section performance** / **Subject performance**: same roll-up shape, grouped by `section_id` / `subject_id` respectively. Subjects are grouped by `subject_id`, not `subject_name` — confirmed live that subject names repeat across grade levels (e.g. "Mathematics" exists as a separate row per grade).

**Key data-integrity finding, confirmed against the live DB**: `grade_records.remarks` is defined in the schema but `classRecordParser.js` never writes it — every row is `NULL`. So `PASSING_GRADE = 75` (DepEd's standard) is used to derive pass/fail from `final_grade` directly, not read off `remarks`.

**Frontend**: `Analytics.jsx`/`.css` (route `/analytics`) — overview cards (reusing `Dashboard.css`'s `overview-grid`/`overview-card`/`card-icon` classes), a CSS bar-chart grade distribution, and two sortable-by-nothing-just-grouped tables (section/subject performance), styled after `ConsolidatedRecords.css`'s `.cr-table`. `Sidebar.jsx`'s three separate keys (`academic-analytics`, `performance-analytics`, none for principal) collapsed into one shared `analytics` key across all three roles' nav configs — same pattern `consolidated-records` already used. `AdminDashboard.jsx`'s "Academic Analytics" quick-action button, previously `style={{ cursor: "default" }}` with no `onClick`, now navigates to `/analytics`.

**Verified live**: 200 for adviser/admin/principal, 403 subject, 401 unauthenticated, 400 bad school year id, 404 missing one; full JSON payload checked against real numbers (200 graded entries after dedup, from 300 raw `grade_records` rows); **Playwright screenshots** of all three roles' rendered pages, zero console errors.

### Un-approve/amend workflow for `record_submissions`

Closes the exact contradiction both `submitForApproval`'s and `requestRevision`'s own code comments already named: a whole-student record could sit `Approved` while one of its subjects was independently flagged `Needs Revision` — nothing reconciled the two. Closed from both directions:

1. **`consolidationController.requestRevision`** (the Adviser action that flags one `class_record`, which can cover many students at once — one upload = one whole subject/section): after flagging the class_record, it now looks up every `lrn` in `grade_records` for that `class_record_id`, and:
   ```sql
   UPDATE record_submissions rs
   SET status = 'Amendment Requested', updated_at = NOW()
   FROM students s, grade_records gr
   WHERE rs.lrn = s.lrn
     AND gr.lrn = s.lrn
     AND gr.class_record_id = $1
     AND rs.school_year_id = $2
     AND rs.status = 'Approved'
   RETURNING rs.lrn, rs.approved_by, s.first_name, s.last_name
   ```
   Then sends one notification per affected `approved_by` admin. Response now reports `amended_count`.

2. **`submissionController.submitForApproval` / `submitAllEligible`**: both now also refuse to (re)submit while `student.subjects.some(s => s.status === "Needs Revision")` — a record can't move toward approval while it's still telling a subject teacher a correction is owed. `Amendment Requested` behaves like `Rejected` here (not blocked by the existing "already Approved" check, since it's a different literal string) — the Adviser resubmits once the flagged subject is corrected and re-uploaded, same "latest upload wins" mechanism as before, no separate "clear the flag" action.

**Frontend**: `Amendment Requested` gets its own badge everywhere a submission status renders — `ConsolidatedRecords.jsx` (`.submission-badge.amendment-requested`, violet, reusing the same color language as the existing subject-level "Needs Revision" badge), `AdminDashboard.jsx` (`getStatusBadgeClass` now maps it to the existing `.status-badge.needs-revision` class rather than falling through to a misleading gray "draft"), and `SectionProgress.jsx`'s per-section submission-status breakdown (`emptySubmissionCounts()` on the backend and `EMPTY_SUBMISSION_COUNTS` on the frontend both gained the new key; rendered conditionally, only when > 0, matching that page's existing convention for its rarer tags).

**Verified live**: a revision request against a class_record covering 18 already-Approved students correctly flipped all 18 to `Amendment Requested` and sent 18 notifications to their approver (`admin.educheck`); resubmission attempt returned 409 (from the pre-existing "incomplete" guard first, since **no student in the current dev dataset has a complete record** — every student is missing subjects — so the new "blocked while Needs Revision" guard was verified by code review against the same already-proven `subjects[].status` shape, not by an isolated live 409). All test state (1 class_record, 18 `record_submissions` rows, 19 notifications) reverted afterward, confirmed byte-for-byte against a pre-test snapshot.

### Audit log for section/teacher-assignment changes (SPMP Risk Management §11)

**Migration `007_audit_logs.sql`** (new table, additive): generic `audit_logs` table — `actor_user_id`, `action` ('create'/'update'/'delete'), `entity_type` ('section'/'teacher_assignment'), `entity_id`, `before_data`/`after_data` (JSONB, NULL as appropriate per action), `created_at`. Deliberately entity-agnostic so a future entity (e.g. `users`) can write into the same table without another migration.

**`utils/auditLog.js`**: single `recordAuditLog({ actorUserId, action, entityType, entityId, beforeData, afterData })` helper, called from all 5 mutation actions:
- `sectionController.createSection` / `updateSection` / `deleteSection`
- `assignmentController.createAssignment` / `deleteAssignment`

`updateSection` now does a `SELECT` before its `UPDATE` to capture a real before-snapshot; `deleteSection`/`deleteAssignment` both widened `RETURNING` from an id/name pair to `RETURNING *` so the log can capture the full row that was deleted, at no extra query cost.

**`GET /api/audit-logs`** (admin-only, `auditLogController.getAuditLogs`): most-recent-200, optional `?entity_type=`, `truncated` flag — same shape convention as `repositoryController.searchStudents` (no real pagination anywhere else in this app either).

**Frontend**: new `AuditLog.jsx`/`.css` (route `/audit-log`, Admin nav only, between "Section & Teacher Assignments" and "Submission Review"). Collapsed row list (action badge, entity + id, actor username, timestamp) that expands per-row into a diff table — `create`/`delete` show the full row as key:value pairs, `update` shows only the fields that actually changed (`diffFields()` helper, JSON-stringify-compares `before`/`after` per key, skips `created_at`).

**Verified live**: created → renamed → deleted a throwaway section, and created → deleted a throwaway teacher assignment, through the real admin API; confirmed all 5 resulting log entries via the API (including an accurate single-field diff — only `section_name` flagged as changed on the rename, not `grade_level`/`staffing_mode` which didn't change) and via **Playwright screenshots** (collapsed list + one row expanded, zero console errors); confirmed 403 adviser/principal, 401 unauthenticated, 400 on a bad `entity_type`. All 5 test log rows deleted afterward — **`audit_logs` starts genuinely empty for real usage**, along with the throwaway section and assignment themselves being deleted (sections/teacher_assignments tables back to their exact prior 2/3 rows).

### Docx housekeeping

`01-Project Managemet/01-EduCheck Software Development Plan.docx` (the original scope doc, already functionally superseded since before v4 — every session since has scoped against "SPMP v1.0" as the authoritative document) removed; `01-Project Managemet/01 - EduCheck_SPMP_v1.0_1.docx` (36.8 KB, verified as a real, non-corrupted `Microsoft Word 2007+` file before committing) added in its place. No content review of the docx was needed for this commit — it was pure version-control housekeeping, catching git up to a reorg that had already happened on disk.

---

## 6. SPMP Alignment

**v7's own four-item "candidates" list is now fully built.** Nothing from that list remains open. What v7 did *not* have — and what this session found by actually reading the SPMP `.docx` directly, not trusting a prior paraphrase — is the one concrete gap in §1b above:

- ⚠️ **Not yet fixed**: SPMP §11's "Incorrect subject/section assignment" risk mitigation reads *"Administrator-only assignment control **with a confirmation step** and audit log."* The confirmation step exists for **deleting** a section/assignment (`window.confirm` in `SectionAssignments.jsx`, pre-existing) but **not for creating one** — `handleCreateAssignment` and section-creation both submit immediately with no "are you sure" prompt. This is the literal next step — see §8.

Everything else v7 §6 listed as "not part of the table, still open, mentioned for completeness" is **unchanged and still open**, carried forward verbatim (none of it was touched this session):
- An amend-workflow edge case: `submitForApproval`'s new "blocked while Needs Revision" guard has never actually fired live (see §5 above) — worth a real click-through once a student with a complete record exists in the dev DB.
- Real per-year student enrollment (`students.section_id`/`grade_level` still last-write-wins, not scoped to `school_year_id`).
- "Academic Analytics" / "Performance Analytics" nav placeholders — **now resolved**, strike this from future copies of this list.
- `educheck_schema.sql` is now **four** migrations further out of date (004, 005, 006, and now **007** all changed real schema the checked-in snapshot doesn't reflect) — same pre-existing gap v6/v7 both inherited and didn't fix, now one migration deeper.
- SF10 generation still blocked on DepEd releasing a 3-term-compatible SF10 revision (see `sf10Structure.js`'s own comment) — unrelated to anything touched this session.

---

## 7. Live Servers — status at this pause

Both dev servers were confirmed live and used directly for this session's testing (backend hit repeatedly via `curl` and via Playwright's browser requests throughout):
- Backend: `http://localhost:5000` (nodemon, auto-reloads on file changes)
- Frontend: `http://localhost:5173`

If picking this up fresh, `cd backend && npm run dev` / `cd frontend && npm run dev` as usual.

**New this session**: Playwright + Chromium are installed in the scratchpad directory (session-specific temp path, NOT the project — nothing added to `frontend/package.json`), with the Chromium binary cached at `C:\Users\NITRO V\AppData\Local\ms-playwright\`. A fresh session can still use the cached browser binary directly (no re-download) if it `npm install playwright` again in a scratchpad and writes a driver script — see §1a for the login/navigate/screenshot pattern used this session.

---

## 8. Literal Next Step

**Unlike every prior handoff, there is no leftover half-built feature and no leftover candidates list — v7's list is fully closed.** The one concrete, well-scoped, SPMP-sourced item found at the very end of this session is the natural next step:

1. **Add a confirmation step to `handleCreateAssignment`** (and the analogous section-create action) in `SectionAssignments.jsx` — closes the last third of SPMP §11's "Incorrect subject/section assignment" mitigation sentence, which is otherwise now fully satisfied. Small, mechanical, one file. Not started.

Secondary, lower-priority options (unchanged from v7 §6, still genuinely open, none requested):

2. Live-verify the amend workflow's "blocked while Needs Revision" resubmission guard end-to-end once a dev-DB student actually has a complete record (currently code-reviewed only, not live-fired — see §5/§6).
3. `educheck_schema.sql` fold-up — now four migrations behind (004–007).
4. An amend-workflow-adjacent question not yet asked: should `PrincipalDashboard.jsx`/`AdminDashboard.jsx` gain a dedicated "Amendment Requested" count card, the way they have Pending/Approved/Rejected cards? Deliberately left out this session to keep the un-approve/amend work tightly scoped to the actual contradiction (a real status now displays correctly everywhere it already rendered submission status; a *new* summary card is a separate, larger question about dashboard information density).
5. SF10 generation — still blocked on DepEd's 3-term-compatible SF10 revision, not something to work around.

None of these were requested this session; listed here as informed options, not a queued backlog — same framing v7 used.

---

## 9. Operational Notes for Next Session

- **Start backend:** `cd backend && npm run dev` — confirm `EduCheck backend running on http://localhost:5000`.
- **Start frontend:** `cd frontend && npm run dev` — open the printed URL (was `5173` this session).
- **New migration to run if working from a different DB snapshot:** `007_audit_logs.sql` — schema-only (new table), additive, safe to run once (not idempotent, same convention as 003–006).
- **Migrations README housekeeping:** row for 007 is now listed in `migrations/README.md`. `educheck_schema.sql` itself is now **four** migrations behind (004, 005, 006, 007) — same pre-existing, deliberately-not-fixed gap v6/v7 both inherited; whoever eventually backfills 004/005 should fold in 006 and 007 in the same pass.
- **Credentials, unchanged from v7:**
  - `admin.educheck` / `admin12345`
  - `subject.grade6a` / `subject12345`
  - `adviser.grade6a` / `adviser123`
  - `principal.educheck` / `principal12345`
  - `test.subject`, `adviser.grade5a` — still no known password; not touched.
- **No new demo accounts this session** — v7's roster (Rizal/Mabini sections, all 4 role accounts) is unchanged and still the full set.
- **`audit_logs` starts genuinely empty** — every real section/assignment change from this point forward will show up there; don't be surprised it's blank on first look, that's correct, not a bug.
- **Playwright is available for real screenshots, not just curl** — see §1a/§7. Use it for any future frontend-facing verification rather than defaulting to API-only checks now that the capability exists.
- **Verify before trusting any visual claim:** `npm run build` + `npm run lint` inside `frontend/` — both clean as of this pause, only the same pre-existing `UserManagement.jsx` `exhaustive-deps` warning every session since it was found has documented.
- **Live DB has real usage data across eight sessions now** — don't wipe `record_submissions`, `notifications`, `students`, `grade_records`, `sections`, `teacher_assignments`, `users`, or `audit_logs` without checking with the user first.
- **Git status:** four commits made this session, all on `main`, local only (not pushed) — `22eef11`, `170de27`, `4cc5b92`, `30ff7c9`, stacked on top of v7's three. Working tree is clean except the handoff markdown files themselves (this one included), which stay deliberately uncommitted mid-session, same convention as every prior handoff.
