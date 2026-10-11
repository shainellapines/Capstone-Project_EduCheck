# EduCheck Capstone 2 — Development Handoff v7
## SPMP v1.0 Gap Table Fully Closed: Adviser Revision Requests, Section Progress View, Principal Role

**Written:** 2026-09-09, same calendar day as v6 — this is a direct continuation, not a new session.
**Supersedes context in:** `EduCheck_Capstone2_Development_Handoff_v6_SPMP_v1_Section_Staffing_Assignments.md`. v6 is still fully accurate for what it covers (its §1a/§1b/§1c and everything through commit `6f1f84a`); this file picks up exactly where v6's §8 left off, in the same session.

---

## 1. Where We Left Off

v6 paused mid-feature by user request, with three rows of its own SPMP v1.0 gap table explicitly still open (§8 of v6, reproduced from the original comparison in §1b):

- Adviser return-to-subject-teacher correction (US-006, Must, Sprint 7)
- Section-level consolidation view
- Principal role (US-008, Should, Sprint 8)

This session built and live-verified all three, in that order, one commit each. **The entire seven-row gap table from v6 §1b is now closed** — every row that table listed as missing when SPMP v1.0 replaced the old scope document is now built:

| SPMP v1.0 requirement | Status after this session |
|---|---|
| US-011: Admin sets each section Self-Contained/Departmentalized | ✅ (prior session, v6) |
| US-009: Admin assigns Subject Teachers to (subject, section) pairs | ✅ (prior session, v6) |
| Subject Teacher restricted to their assigned subject+section | ✅ (prior session, v6) |
| Adviser uploads for Self-Contained sections | ✅ (prior session, v6) |
| Section consolidation status view | ✅ **this session** |
| Principal role (view-only) | ✅ **this session** |
| Adviser return-to-subject-teacher for correction | ✅ **this session** |

Three commits, in order:

1. `dc88316` — Adviser return-to-subject-teacher revision requests (US-006)
2. `41a6743` — section-level consolidation view ("Section Progress")
3. `defa8c9` — Principal role (view-only)

All three followed the same pattern: scope against the real current code first (not just the handoff doc's prior description of it, which had already drifted — see §1a below), confirm design/scope with the user where a real decision point existed, build, live-verify against the real dev DB with actual HTTP requests, revert any DB state touched purely for testing, then commit with only that feature's own files staged (the docx reorg and handoff markdown files stayed untouched throughout, exactly as v6 left them).

### 1a. A correction to v6's own framing, discovered while scoping US-006

Before writing any code for the Adviser revision-request feature, re-reading the actual current backend (not just v6's description of it) turned up that the codebase already had more workflow machinery than v6's gap table credited it with: a full `record_submissions` table and Adviser-submit/Admin-approve-reject pipeline already existed (`submissionController.js`, Sprint 7 work from *before* v6), operating at the **whole-student** level. What was actually missing was narrower than "a consolidation/review workflow" — it was specifically a **per-subject, Adviser-initiated** send-back, independent of that existing Admin pipeline. The feature built matches that narrower, accurate gap, not a rebuild of something that already existed.

Similarly, scoping the "uploads history view" for US-006 found that `SubjectDashboard.jsx` already had a working "Recent Uploads" list wired to a real `getMyClassRecords` endpoint — the user-facing gap was only that it didn't yet distinguish an Adviser's revision flag from the validator's own "Needs Attention," not that the list itself needed building from scratch.

---

## 2. Current File Structure (delta from v6 only)

```text
EduCheck/
├── 02-Product Design/06-Database/SQL/migrations/
│   ├── 006_class_record_revision_requests.sql          ← NEW
│   └── README.md                                        ← CHANGED — added rows for 004/005/006 (004/005 were applied but never logged there; see §9)
├── EduCheck_Capstone2_Development_Handoff_v7_...md       ← this file
├── backend/
│   └── src/
│       ├── controllers/
│       │   ├── consolidationController.js                ← CHANGED — requestRevision, getSectionProgressForSchoolYear, section_id threaded through the shared per-student query
│       │   └── uploadController.js                        ← CHANGED — revision fields surfaced on getMyClassRecords/getMyClassRecordValidation, needs_attention count includes "needs revision"
│       └── routes/
│           ├── consolidationRoutes.js                      ← CHANGED — new /sections route, request-revision route, "principal" added to the role gate
│           └── repositoryRoutes.js                          ← CHANGED — "principal" added to the role gate
└── frontend/
    └── src/
        ├── App.css                                          ← CHANGED — login role-selector grid 3→2 columns (now 4 role tabs)
        ├── App.jsx                                          ← CHANGED — /section-progress route, "principal" added to allowedRoles on 4 routes, RoleBasedDashboard branch
        ├── components/Sidebar.jsx                            ← CHANGED — Section Progress nav item (adviser+admin), full principal nav list, role badge label
        └── pages/
            ├── ConsolidatedRecords.jsx / .css                 ← CHANGED — per-subject Request Revision action, subject status badges, ?section= filter + banner
            ├── Dashboard.css                                  ← CHANGED — needs-revision badge/note styles (shared across dashboards)
            ├── Login.jsx                                       ← CHANGED — fourth role tab (Principal)
            ├── PrincipalDashboard.jsx                          ← NEW
            ├── SectionProgress.jsx / .css                      ← NEW
            ├── SubjectDashboard.jsx                            ← CHANGED — "Needs Revision" distinct from "Needs Attention", adviser's reason shown inline
            ├── UserManagement.jsx / .css                       ← CHANGED — Principal role option; fixed a live bug (see §5)
            └── ValidationResults.jsx / .css                    ← CHANGED — revision-reason banner
```

Everything from v6's file structure (session.js, the auth hardening, section staffing/assignments, the subject seed migration) is unchanged and already committed.

---

## 3. Current Database State

- **`class_records`: 13 rows, unchanged count.** Three new nullable columns from migration 006: `revision_remarks`, `revision_requested_by`, `revision_requested_at`. No row currently has them set — the live test that exercised them (record 21, temporarily flagged "Needs Revision" and temporarily given `section_id = 1`) was reverted to its exact prior state (`status = 'Validated'`, all three new fields `NULL`, `section_id = NULL`) immediately after verification.
- **`users`: 4 rows (was 3).** New: `principal.educheck` (`user_id = 15`, role `principal`), created through the real admin-facing API as a genuine, permanent demo account — not deleted after testing, same "leave real usable config in place" precedent v6 set with the `Rizal`/`Mabini` sections.
- **`teachers`: 2 rows, unchanged.** The Principal role has no teacher profile and doesn't need one — `authController.login` never requires one, confirmed by reading it directly.
- **`sections` / `teacher_assignments`: 2 / 3 rows, unchanged** from v6.
- **`students` / `subjects`: 100 / 40 rows, unchanged.**
- **One test notification was created and deleted** during US-006 verification (`notification_id = 36`, "Revision Requested" to `subject.grade6a`) — removed after confirming it rendered correctly on the teacher's side.

---

## 4. API Surface Added/Changed This Session

| Method | Path | Change |
|---|---|---|
| POST | `/api/consolidation/class-records/:classRecordId/request-revision` | **NEW** — adviser-only. Requires non-empty `remarks`. Sets that `class_records` row to `"Needs Revision"`, stores the reason + requester + timestamp, notifies the owning teacher. |
| GET | `/api/consolidation/school-years/:schoolYearId` | **Changed**: now accepts optional `?section_id=` — filters the existing per-student response to one section. |
| GET | `/api/consolidation/school-years/:schoolYearId/sections` | **NEW** — adviser/admin/principal. Per section: learning areas expected/submitted/needs-revision/needs-attention/not-started, student count, and a `record_submissions` status breakdown. |
| * | `/api/consolidation/*` (all routes) | Role gate widened from `adviser, admin` to `adviser, admin, principal` — every route here is a GET except request-revision, which layers its own adviser-only gate on top and is unaffected. |
| * | `/api/repository/*` (all routes) | Role gate widened from `adviser, admin` to `adviser, admin, principal`. |

No changes to `/api/uploads/*`, `/api/submissions/*`, or `/api/users/*` — Principal has zero access to any of those, verified live (§ below).

---

## 5. Exact Code Just Finished

*(Covers only what's new/changed since v6 — v6's own §5 still stands for everything through section staffing/assignments.)*

### US-006: Adviser return-to-subject-teacher revision requests

**Migration** `006_class_record_revision_requests.sql` (schema-only, additive):
```sql
ALTER TABLE class_records
    ADD COLUMN revision_remarks TEXT,
    ADD COLUMN revision_requested_by INTEGER,
    ADD COLUMN revision_requested_at TIMESTAMP,
    ADD CONSTRAINT fk_class_record_revision_requested_by
        FOREIGN KEY (revision_requested_by) REFERENCES users(user_id);
```
No new status enum needed — `class_records.status` is an unconstrained `VARCHAR(30)`, so `"Needs Revision"` is just another value written the same way `"Validated"`/`"Needs Attention"` already are.

**`consolidationController.requestRevision`** (new): validates a non-empty reason, updates the target `class_record`, and inserts a notification to its owning teacher (`teachers.user_id`, joined through `class_records.teacher_id`). Acts on the whole `class_record` — one upload covers every student in that subject/section/school-year — not a single student's row. A corrected re-upload creates a **new** `class_records` row that already outranks the flagged one in the "latest upload wins" ranking `buildRankedGradesQuery` uses, so no separate "clear the flag" action exists or is needed.

**Route**: `POST /consolidation/class-records/:classRecordId/request-revision`, gated `authorizeRoles("adviser")` on top of the router's own `adviser/admin/principal` gate — the only consolidation route Admin and Principal cannot call.

**Frontend**: `ConsolidatedRecords.jsx`'s expanded per-student subject table gained a per-subject "Request Revision" action (adviser-only) with a reason textarea, a `subject-status-badge` distinguishing Validated/Needs Attention/Needs Revision/Uploaded, and inline display of the stored reason. `SubjectDashboard.jsx`'s existing "Recent Uploads" list and `ValidationResults.jsx` both now show "Needs Revision" as its own badge/banner (not lumped into "Needs Attention"), with the Adviser's reason shown inline on both.

### Section-level consolidation view ("Section Progress")

**`consolidationController.getSectionProgressForSchoolYear`** (new): per section (from the `sections` table, not per-student), computes:
- `subjects_expected` — count of `subjects` for that section's grade level (same source `attachCompleteness` already used).
- `subjects_submitted` / `needs_revision` / `needs_attention` / `not_started` — from the **latest `class_record` per (section, subject) for that school year**, using the same "latest wins" `ROW_NUMBER()` ranking pattern as the per-student query, just re-keyed by `(section_id, subject_id)` instead of `(lrn, subject_id)`, since one upload already covers a whole section at once.
- `student_count` — distinct `students.section_id`.
- `submission_status_counts` — `record_submissions` status per student in that section, `LEFT JOIN`ed so "Not Submitted" (no row at all) is counted correctly.

Documented, not fixed, limitation: `students.section_id`/`grade_level` aren't themselves scoped to a school year (last-write-wins on one row per student), so `student_count` is school-year-agnostic — fine for the single-active-year deployment this is, would need real per-year enrollment to hold up otherwise.

**Route**: `GET /consolidation/school-years/:schoolYearId/sections`, same `adviser/admin/principal` gate as the rest of the router.

The existing per-student endpoint (`GET /consolidation/school-years/:schoolYearId`) also picked up an optional `?section_id=` filter — applied in JS against the already-fetched student list, not pushed into `buildRankedGradesQuery`'s SQL, since that query is shared with `submissionController` and neither of those callers needs section scoping.

**Frontend**: new `SectionProgress.jsx` (route `/section-progress`) — one card per section with a submitted/expected progress bar, colored tags for needs-revision/needs-attention/not-started counts, and a submission-status breakdown row. Its "View Students" button deep-links to `/consolidated-records?year=&section=&section_label=` — `section_label` rides along in the URL purely for display, so `ConsolidatedRecords.jsx` doesn't need a second request just to show which section it's filtered to, and gained a dismissible "Filtered by section" banner for it.

### Principal role (US-008)

No migration — `users.role` is unconstrained, "principal" is just another value.

- `consolidationRoutes.js` / `repositoryRoutes.js`: `"principal"` added to the router-level `authorizeRoles(...)` call in both files. Everything gated more narrowly than that router-level call (request-revision; anything admin-only elsewhere) stays exactly as restrictive as before.
- `PrincipalDashboard.jsx` (new): same `overview-grid`/`quick-actions` shell `AdminDashboard.jsx` uses, but with no "Total Users" card and no approve/reject affordance anywhere — every quick action lands on a page that is already read-only for this role.
- `App.jsx`: `RoleBasedDashboard` gained a `principal` branch; `/consolidated-records`, `/section-progress`, `/records-repository`, `/notifications` all added `"principal"` to `allowedRoles`.
- `Sidebar.jsx`: full `principal` nav list (Dashboard, Submission Review, Section Progress, Digital Repository) and a `"Principal"` role badge label.
- `Login.jsx`: a fourth role tab — **required**, not cosmetic. `Login.jsx` checks the selected tab against the authenticated account's actual role and refuses the login otherwise (`This account is registered as X.`); without a Principal tab, no principal account could ever sign in through the UI. `role-selector`'s CSS grid went from a fixed 3 columns to 2 (clean 2×2 for 4 tabs).
- **`ConsolidatedRecords.jsx` and `RecordsRepository.jsx` needed zero page-level changes** to become read-only for this role — their action buttons already key off `user.role === "adviser"` / `"admin"` specifically (never an "else show controls" fallback), so a principal viewer simply matches neither and the page renders with no controls, for free.

**Bug found and fixed along the way, unrelated to Principal but in the same file:** `UserManagement.jsx`'s role dropdown had `<option value="teacher">Subject Teacher</option>` — but every actual role check in the app (`authorizeRoles("subject", ...)`, `role === "subject"` in `Login.jsx`, `NAV_ITEMS_BY_ROLE.subject` in `Sidebar.jsx`) uses `"subject"`, never `"teacher"`. Any account created through that form as a Subject Teacher would have stored an unusable role and could never log in. Confirmed via the live DB that no such orphaned `"teacher"`-role account currently exists — this was a live landmine, not yet triggered. Fixed the option's `value` to `"subject"`; added a matching `.role-subject` pill style alongside the pre-existing (now-orphaned but harmless) `.role-teacher` one.

**Verification, every feature:** `npm run build` clean, `npm run lint` clean (same pre-existing `UserManagement.jsx` `exhaustive-deps` warning every prior session has documented — unrelated to the bug above), `node --check` on every backend file touched, and live curl-driven behavioral tests:
- US-006: 401/403/400/200 across no-auth, admin, empty-remarks, and valid-remarks attempts; confirmed the notification, the flag, and the stored reason all appeared correctly on both the Adviser's consolidated view and the Subject Teacher's own upload history + validation-results page; reverted the test record and deleted the test notification afterward.
- Section Progress: confirmed role gating (200 adviser/admin, 403 subject) and 400/404 on bad/missing school year IDs; confirmed the aggregation math itself by temporarily setting a real `class_record`'s `section_id`, observing `subjects_submitted`/`subjects_not_started` move correctly, and reverting immediately after.
- Principal: created the real `principal.educheck` account through the actual admin API, logged in as it, and confirmed `200` on every intended read route (school-years, consolidated records, section progress, repository search, notifications) and `403` on every disallowed one (request-revision, submission approve, uploads, user management).

---

## 6. SPMP Alignment

**The full seven-row gap table from v6 §1b is closed.** SPMP v1.0's Must/Should backlog items that motivated re-scoping this project mid-development are now all built:
- ✅ US-011 (staffing mode), US-009 (teacher assignment), upload restriction, Adviser-uploads-for-Self-Contained — prior session (v6).
- ✅ US-006 (Adviser return-to-subject-teacher correction, Must, Sprint 7) — this session.
- ✅ Section-level consolidation view — this session.
- ✅ US-008 (Principal role, Should, Sprint 8) — this session.

**Not part of that table, still open, mentioned for completeness (not urgent):**
- An audit log for assignment/section changes — SPMP's Risk Management §11 calls for one; nothing in this codebase logs who changed a `teacher_assignments` or `sections` row, or when.
- Real per-year student enrollment — `students.section_id`/`grade_level` are single-row-per-student, last-write-wins, not scoped to `school_year_id`. Fine for a single-active-year deployment (documented explicitly in `getSectionProgressForSchoolYear`'s own comment); would need real historical enrollment data to hold up across multiple years at once.
- An un-approve/amend workflow for `record_submissions` — both `submitForApproval` and the new `requestRevision` independently flag this same gap: nothing currently reconciles a subject-level revision request against a student record that's already been fully `Approved`.
- "Academic Analytics" / "Performance Analytics" — still dead `path: null` nav placeholders for Admin and Adviser respectively, same as every prior session found them. Deliberately **not** given to Principal either, rather than promising a page that doesn't exist for anyone yet — if Analytics gets built, Principal is the most likely next role to extend it to, given the "progress/analytics/repository" framing SPMP originally used for this role.
- The docx reorg in `01-Project Managemet/` remains uncommitted (old SPMP draft deleted, `01 - EduCheck_SPMP_v1.0_1.docx` untracked) — unchanged from v6, still deliberately out of scope for a code-focused session.

---

## 7. Live Servers — status at this pause

Both dev servers were confirmed live and used directly for this session's testing (backend hit repeatedly via `curl` throughout):
- Backend: `http://localhost:5000` (nodemon, auto-reloads on file changes)
- Frontend: `http://localhost:5173`

If picking this up fresh, `cd backend && npm run dev` / `cd frontend && npm run dev` as usual.

---

## 8. Literal Next Step

**Unlike v6, this session's three planned items are all finished — there is no half-built feature to resume.** The next session starts from a clean slate on functionality; what's left is judgment calls on what to build next, not gap-filling against SPMP v1.0's original comparison. Candidates, roughly in the order they'd likely matter for a capstone defense:

1. **Academic/Performance Analytics** — the one nav placeholder every role still has that goes nowhere. No backend or frontend work has started on this at all; would need real scoping (what charts/metrics, per role) before any code.
2. **The un-approve/amend workflow** flagged in §6 — closes the loop between the new subject-level revision-request path and the existing whole-student approval path, which can currently be told two contradictory things about the same student.
3. **An audit log** for section/assignment changes (SPMP Risk Management §11) — smaller, more mechanical than the other two; mostly a new table + a write on every `sectionController`/`assignmentController` mutation.
4. **The docx housekeeping** — commit the `01-Project Managemet/` reorg deliberately, whenever the docs side (not code) is the focus of a session.

None of these were requested this session; listed here as informed options, not a queued backlog.

---

## 9. Operational Notes for Next Session

- **Start backend:** `cd backend && npm run dev` — confirm `EduCheck backend running on http://localhost:5000`.
- **Start frontend:** `cd frontend && npm run dev` — open the printed URL (was `5173` this session).
- **New migration to run if working from a different DB snapshot:** `006_class_record_revision_requests.sql` — schema-only, additive, safe to run once (not idempotent, same convention as 004/005).
- **Migrations README housekeeping:** rows for 004/005/006 are now all listed in `migrations/README.md`, but **`educheck_schema.sql` itself is still not folded up to date past migration 003** — 004/005/006 all changed real schema (`teacher_assignments`, `sections.staffing_mode`, `class_records.section_id`/`revision_*`) that the checked-in snapshot doesn't reflect. This was already true before this session (v6 inherited it, didn't fix it); this session added to the same gap rather than fixing it, on the reasoning that a partial fold (006 only) would make the snapshot more misleading, not less. Whoever tackles the 004/005 backfill should fold in 006 in the same pass — see the migrations README's own note on this.
- **Credentials, current as of this pause:**
  - `admin.educheck` / `admin12345` (from v6)
  - `subject.grade6a` / `subject12345` (from v6)
  - `adviser.grade6a` / `adviser123` (unchanged, documented since v4/v5)
  - **`principal.educheck` / `principal12345` — new this session, write this down.**
  - `test.subject`, `adviser.grade5a` — still no known password; not touched.
- **Demo config now in place for every role**, safe to build on: the `Rizal`/`Mabini` section setup from v6, plus `principal.educheck` as a real, permanent view-only account (not test junk — created through the real admin API, left in place deliberately).
- **`frontend/src/utils/session.js` is still load-bearing** — `SectionProgress.jsx` and `PrincipalDashboard.jsx` both import `getToken`/`getStoredUser` from it rather than reading `localStorage` directly, continuing that pattern. (`ConsolidatedRecords.jsx` itself still reads `localStorage` directly for `educheck_user`/`educheck_token` — a pre-existing gap from before v6 that this session didn't introduce and didn't fix, since touching it wasn't part of any of the three features built.)
- **Verify before trusting any visual claim:** `npm run build` + `npm run lint` inside `frontend/` — both clean as of this pause, only the same pre-existing `UserManagement.jsx` `exhaustive-deps` warning every session since it was found has documented.
- **Live DB has real usage data across six sessions now** — don't wipe `record_submissions`, `notifications`, `students`, `grade_records`, `sections`, `teacher_assignments`, or `users` without checking with the user first.
- **Git status:** three commits made this session, all on `main`, local only (not pushed) — `dc88316`, `41a6743`, `defa8c9`, stacked on top of v6's six. The docx changes in `01-Project Managemet/` remain uncommitted, still deliberately out of scope.
