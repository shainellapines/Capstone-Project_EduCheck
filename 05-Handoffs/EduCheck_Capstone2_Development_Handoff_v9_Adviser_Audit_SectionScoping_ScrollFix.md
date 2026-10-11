# EduCheck Capstone 2 — Development Handoff v9
## Adviser Role Audit, Section-Scoping Authorization Fix, Admin Scroll Bug — Four Commits, All Pushed to Local Main

**Written:** 2026-09-17, pausing mid-session at the user's request.
**Supersedes context in:** `EduCheck_Capstone2_Development_Handoff_v8_Analytics_AmendWorkflow_AuditLog.md`. v8 is still fully accurate for what it covers (through commit `30ff7c9`); this file picks up from there, in a new session, and also covers non-code discussion (results/discussion drafting, scope Q&A) that shaped what got built.

---

## 1. Where We Left Off

This session had two halves: (1) drafting academic-documentation content for the user's capstone report (a Results & Discussion draft, and several scope/methodology Q&A exchanges — no code), then (2) a real code audit and fix pass on the Adviser role specifically, requested as "inspect if there's any redundancy that needs to be removed or fix, also check if everything functioning properly."

The audit surfaced 4 concrete issues (verified against the live code, not taken on faith from the sub-agent that first found them) plus one the user reported directly (a UI scroll bug on the Admin side, found while testing the adviser fixes). All 5 are now fixed, live-verified where applicable, and **committed in 4 separate commits** (one is a bundle of 3 small adviser UI/nav gaps):

| # | Commit | What |
|---|---|---|
| 1 | `4b60768` | frontend: confirm before creating a section or assignment |
| 2 | `51dcf04` | frontend: fix adviser nav/dashboard gaps, remove Encode Grades |
| 3 | `d185013` | frontend: fix scroll-to-top after approve/reject |
| 4 | `576ceaa` | backend: scope adviser actions to their own section |

All 4 are on `main`, **committed locally, not pushed** (no `git push` was run this session — matches every prior session's convention of leaving push decisions to the user).

### 1a. Non-code work this session (context for next session, not a code change)

- Drafted a full "Results and Discussion" section (Agile Scrum methodology, sprint-by-sprint narrative, difficulties, ~75% completion status) sourced directly from the three real Sprint progress-report `.docx` files and this repo's own v5/v7/v8 handoffs — not invented. The user has since converted/renamed this into their own working file, **`EduCheck_Chapter4_Results_and_Discussion_Sprints1-3.docx`** (27.9 KB, currently untracked in git) — that file is the user's own artifact now; nothing here should assume its content without re-reading it if referenced later.
- Confirmed, by reading the SPMP `.docx` directly: the system is **single-school by design** (no `school_id` anywhere in the schema), but **is** architected to generalize across different schools' staffing patterns — `staffing_mode` is a per-section, Admin-configurable field with zero hardcoded grade-level coupling anywhere in the backend (verified by grep). Each school would need its own separate deployment; one instance does not serve multiple schools at once.
- Confirmed the "Encode Grades" feature (dead on web, real-but-unwired 1,270-line screen on mobile) contradicts SPMP §2.3's own "No duplicate encoding" supporting innovation — this is what justified removing it from web this session (see commit 2 below). The mobile screen (`encode_grades_screen.dart`) was **not** touched — still an open flag for the team.
- Discussed testing/evaluation/deployment: SPMP §10.3 commits the team to Unit/Functional/Integration/UAT testing aligned to ISO/IEC 25010 (Functional Suitability, Usability, Performance, Security, Compatibility), referencing a "Proposal Manuscript" for exact procedure — **that manuscript is not in this repo** (grepped, not found; presumably a Capstone 1 deliverable held elsewhere). Worth locating before finalizing an evaluation instrument.

---

## 2. Current File Structure (delta from v8 only)

```text
EduCheck/
├── EduCheck_Capstone2_Development_Handoff_v9_...md          ← this file
├── EduCheck_Chapter4_Results_and_Discussion_Sprints1-3.docx  ← NEW, untracked — user's own file, not authored file-for-file by this session
├── backend/
│   └── src/
│       └── controllers/
│           ├── consolidationController.js                    ← CHANGED — getAdviserSectionIds() added+exported; requestRevision now section-scoped
│           └── submissionController.js                        ← CHANGED — submitForApproval/submitAllEligible now section-scoped
└── frontend/
    └── src/
        ├── App.jsx                                             ← CHANGED — /validation-results/:classRecordId now allows "adviser"
        ├── components/
        │   └── Sidebar.jsx                                      ← CHANGED — "Encode Grades" adviser nav item removed
        └── pages/
            ├── ConsolidatedRecords.jsx                           ← CHANGED — fetchStudents({ silent }) option; 5 action handlers use it
            ├── Dashboard.jsx                                     ← CHANGED — uses utils/session.js; "Upload Files" quick action wired; "Encode Grades" quick action removed
            └── SectionAssignments.jsx                            ← CHANGED — window.confirm() on handleCreateSection/handleCreateAssignment
```

Everything from v8's file structure (Analytics, amend workflow, audit log, docx housekeeping) is unchanged and already committed. `educheck_schema.sql` is still stale against migrations 004–007 — unchanged, unfixed, same pre-existing gap v6–v8 all inherited.

---

## 3. Current Database State

- **No schema changes this session** — no new migration file. All 5 fixes are application-logic-only.
- **`teacher_assignments`: net unchanged (3 rows), but not byte-identical in `assignment_id`.** Live-verifying the section-scoping fix required removing and re-adding `adviser.grade6a`'s Mabini (section 2) assignment through the **real admin API** (`DELETE`/`POST /api/assignments`) — a raw-SQL `DELETE` was attempted first and correctly blocked by the sandbox as a destructive action against shared dev data, so the app's own CRUD was used instead, same as a real admin would. The row is functionally identical (`teacher_id=5, section_id=2, subject_id=NULL, school_year_id=1`) but now has `assignment_id=6` instead of the original `3` — no code anywhere depends on that id's specific value.
- **`audit_logs`: 2 new real rows** from the above (one `delete`, one `create` on `teacher_assignments`) — accurate history of a real admin action, left in place rather than force-deleted, since `audit_logs` has no delete endpoint by design and raw-SQL cleanup wasn't attempted given the sandbox's stance on destructive queries.
- **`record_submissions` / `students` / `class_records` / etc.: unchanged** from v8's snapshot, modulo whatever the user's own interactive clicking during this session's Admin approve/reject scroll-bug testing may have changed (not tracked precisely — the user was live-using the Consolidated Records page while diagnosing the scroll issue).

---

## 4. API Surface Added/Changed This Session

No new routes. Three existing routes gained a new authorization check (same request/response shape, new possible `403`):

| Method | Path | Change |
|---|---|---|
| POST | `/api/consolidation/class-records/:classRecordId/request-revision` | Now 403s with `"You can only request a revision for a section you are the Adviser of."` if the class record's `section_id` isn't one the requesting adviser is assigned to (or is `NULL`). |
| POST | `/api/submissions/school-years/:schoolYearId/students/:lrn/submit` | Now 403s with `"You can only submit records for a section you are the Adviser of."` under the same condition, checked before the existing "incomplete"/"already Approved"/"Needs Revision" guards. |
| POST | `/api/submissions/school-years/:schoolYearId/submit-all` | Candidate student list is now pre-filtered to only students in the adviser's own assigned section(s) before eligibility is computed — no 403, just a narrower `submitted_count`/`already_approved_count`/`incomplete_count`. |

Also unchanged-shape but newly reachable: `GET /validation-results/:classRecordId` (frontend route, not an API route) now renders for `role: "adviser"`, not just `"subject"` — the backend endpoint it calls was already open to both roles.

---

## 5. Exact Code Just Finished

### 5a. Section-scoping authorization (`backend/src/controllers/consolidationController.js`, `submissionController.js`)

New shared helper, added to `consolidationController.js` right after `buildRankedGradesQuery` and exported:

```js
const getAdviserSectionIds = async ({ userId, schoolYearId }) => {
    const result = await pool.query(
        `
        SELECT ta.section_id
        FROM teacher_assignments ta
        INNER JOIN teachers t ON t.teacher_id = ta.teacher_id
        WHERE t.user_id = $1
          AND ta.school_year_id = $2
          AND ta.subject_id IS NULL
        `,
        [userId, schoolYearId]
    );

    return new Set(result.rows.map((row) => row.section_id));
};
```

`requestRevision` now selects `cr.section_id` (added to its existing query) and, right after confirming the record exists, checks it against `getAdviserSectionIds(...)` before doing anything — 403 if absent or unowned. `submitForApproval` does the same check against `student.section_id` (already present on `fetchConsolidatedStudent`'s return shape — no query change needed there) immediately after confirming the student exists, before the completeness/approved/needs-revision guards. `submitAllEligible` filters `fetchConsolidatedStudents(schoolYearId)`'s full result down to the adviser's own section(s) *before* computing the `eligible` subset, so the reported `already_approved_count`/`incomplete_count` are also now correctly scoped (previously system-wide, which was itself a minor information-leak inconsistency, now fixed as a side effect).

**Live-verified** (see §3 above for how): removed `adviser.grade6a`'s section-2 assignment via the real admin API → `request-revision` on a section-2 class record returned `403`; `submit` for a section-2 student returned `403`; `submit-all` correctly returned `0/0/0` (all 100 real dev-DB students currently live in section 2, so removing that access zeroed the adviser's visible pool entirely — expected, not a bug). Restored the assignment via the same API → `submit-all` returned to its original `99 already_approved / 100 incomplete`, confirming no regression to legitimate access. `node -c` syntax-checked both files; backend restarted clean under `nodemon`.

### 5b. Adviser nav/dashboard gaps (`App.jsx`, `Sidebar.jsx`, `Dashboard.jsx`)

- `App.jsx`: `/validation-results/:classRecordId`'s `allowedRoles` changed from `["subject"]` to `["subject", "adviser"]`. Root cause: `ClassRecordUpload.jsx` (shared by both roles) navigates here after every successful upload; a Self-Contained-section Adviser who uploaded was silently bounced to `/dashboard` by `ProtectedRoute`. Backend endpoint (`getMyClassRecordValidation`) already allowed both roles — this was a frontend-only allowlist gap.
- `Sidebar.jsx`: removed the `{ key: "encode-grades", label: "Encode Grades", icon: FileText, path: null }` entry from the `adviser` nav array.
- `Dashboard.jsx` (the Adviser's actual landing page, confirmed via `App.jsx`'s `RoleBasedDashboard` — admin/subject/principal each have their own dashboard component, only adviser renders this generic one): removed the dead "Encode Grades" quick-action button entirely; wired the previously-dead "Upload Files" quick-action (`style={{ cursor: "default" }}`, no `onClick`) to `navigate("/class-record-upload")`; replaced direct `localStorage.getItem("educheck_user"/"educheck_token")` and a hand-rolled `authHeaders()` with `getStoredUser()`/`getToken()` from `utils/session.js`, matching every other adviser-facing page.

**Verified**: `npm run lint` / `npm run build` clean in `frontend/` after each edit (only the pre-existing `UserManagement.jsx` `exhaustive-deps` warning, unchanged from every prior session).

### 5c. Confirmation step (`SectionAssignments.jsx`)

`handleCreateSection` now calls `window.confirm(...)` with the section name/grade/staffing mode before submitting (mirrors the existing `handleDeleteSection` pattern). `handleCreateAssignment` looks up the selected teacher/section/subject's display labels from already-loaded state (`teachers`/`sections`/`subjects` arrays) and confirms "Assign {teacher} to {section} as {subject or Class Adviser}? Double-check the subject and section before confirming." before submitting. This closes the last open third of SPMP §11's risk mitigation for "Incorrect subject/section assignment" — admin-only ✅ (pre-existing), audit log ✅ (v8), confirmation step ✅ **now on both create and delete** (was delete-only).

### 5d. Admin scroll-to-top bug (`ConsolidatedRecords.jsx`)

Root cause: every action handler (`submitForApproval`, `approveRecord`, `rejectRecord`, `requestRevision`, `submitAllEligible`) called `fetchStudents()` afterward, which set `loadingStudents = true` and unmounted the entire student table in favor of a loading placeholder while the refetch ran — collapsing page height mid-scroll and snapping the browser back to the top. Reported by the user as "when I scroll down and approve, it feels inconvenient."

`fetchStudents` now takes an options object (`{ silent = false }`); when `silent`, it skips `setLoadingStudents(true/false)` entirely so the table stays mounted and just swaps its data in place once the fetch resolves. All 5 action-handler call sites now pass `{ silent: true }`. The one remaining bare call (`fetchStudents()` in the `useEffect` on `selectedSchoolYearId`/`sectionFilterId` change) is intentionally left non-silent — jumping to the top on a year/section change is expected, correct behavior.

**Verified**: `npm run lint` / `npm run build` clean.

---

## 6. SPMP Alignment

No new gaps found against the SPMP this session beyond what was already open. One item from v8 §1b/§6/§8 is now **closed**:

- ✅ **Closed this session**: SPMP §11's "confirmation step" third of the assignment-risk mitigation (§5c above) — the mitigation sentence is now fully satisfied end-to-end (admin-only + confirmation step + audit log, all three parts).
- ✅ **Also newly closed, found and fixed together this session, not previously on any list**: the Adviser section-scoping gap (§5a) — this wasn't a named SPMP line item, but it directly serves the SPMP's own Target Users table language ("Class Adviser: ... Any section: review consolidated record, return a subject for correction, submit for approval. **Full visibility, own section only**" — the "own section only" half was previously unenforced).

Everything else carried forward from v8 §8 is **unchanged and still open**:
- Live-fire the "blocked while Needs Revision" resubmission guard end-to-end (still only code-reviewed — same pre-existing blocker: no dev-DB student currently has a fully complete record).
- `educheck_schema.sql` fold-up — still stale against migrations 004–007, one session further behind now (unchanged this session, no new migration was added).
- The "Amendment Requested" dashboard count-card question — still an open, unasked design decision.
- SF10 generation — still blocked on DepEd's 3-Term-compatible template release.
- Mobile's `encode_grades_screen.dart` — same "contradicts SPMP §2.3" finding that justified removing web's Encode Grades this session, still unresolved on the Flutter side.

### 6a. Full remaining-scope picture (~25%), checked this session against all 9 SPMP EPICs

The user asked directly "what's remaining in the 25%, overall" — not just the small punch-list above. Checked every EPIC in SPMP §8.2 against the actual code/git history (not just this session's own work) to answer it honestly:

**Done:** EPIC-01 Auth & User Mgmt, EPIC-02 e-Class Import, EPIC-03 Consolidation, EPIC-04 Validation, EPIC-06 Submission Workflow, EPIC-07 Digital Repository.

**Not done, in order of actual size:**

1. **Mobile app — the largest real gap, and it's stale.** `git log --oneline -- mobile/` shows the last commit touching `mobile/` was **2026-09-07** — nothing since, across every session including this one. `pubspec.yaml` has no `http`/`dio` package; every screen (login, adviser dashboard, consolidated records, encode-grades, analytics, upload-files, validation-results — thousands of lines) is UI-only scaffolding with **zero backend wiring**. SPMP §6.3 lists "Mobile Application" as co-equal included scope, so this isn't a minor loose end — it's an entire second implementation pass nobody has started since early September.
2. **EPIC-05 SF10 Generation — not built, externally blocked.** Structural mapping done; zero generation code exists (v5). Blocked on DepEd releasing a 3-Term-compatible template, not on more dev time.
3. **EPIC-08 Analytics' "Intervention flag list" — only half-built, newly found this session.** Checked `analyticsController.js`/`Analytics.jsx` directly: they only expose `at_risk_count`, a **number**. The SPMP's feature line says "Intervention flag list" — an actual named list of which students need intervention, not just a count on a card. Small, clearly-scoped, not yet started.
4. **EPIC-09 System Integration & Testing — hasn't started.** This is SPMP Sprint 9: formal Unit/Functional/Integration/UAT testing aligned to ISO/IEC 25010, plus pilot deployment. What's happened so far across all sessions (curl-driven live verification, a few Playwright screenshots) is ad-hoc developer smoke-testing, not the structured test-case/UAT process the SPMP commits the team to.
5. The small carried-over items already listed above (resubmission-guard live-fire, stale `educheck_schema.sql`, the Amendment-Requested card decision, mobile's `encode_grades_screen.dart` scope flag).

---

## 7. Live Servers — status at this pause

Both confirmed running at time of writing:
- Backend: `http://localhost:5000` (nodemon, auto-reloads)
- Frontend: `http://localhost:5173`

If picking this up fresh: `cd backend && npm run dev` / `cd frontend && npm run dev` as usual. No new migrations to run — this session added none.

---

## 8. Literal Next Step

**All 4 commits are local-only — not pushed.** The user explicitly asked to be the one to run `git add`/`git commit` themselves this session (done, confirmed via `git log`); pushing was never discussed and should not be assumed.

With this session's fixes closing out the confirmation-step and section-scoping gaps, what's left — small items first, then the larger ones from §6a:

1. **Analytics' "Intervention flag list"** (§6a item 3) — smallest, clearly-scoped remaining item found this session: expose an actual list of at-risk students, not just `at_risk_count`. Good candidate to pick up first if continuing straight into more code.
2. Live-verify the "blocked while Needs Revision" resubmission guard end-to-end, once a dev-DB student actually has a complete record.
3. Fold migrations 004–007 into `educheck_schema.sql` (now 4 migrations stale).
4. Decide whether Admin/Principal dashboards should get a dedicated "Amendment Requested" count card.
5. Raise the mobile `encode_grades_screen.dart` scope question with the team (out-of-scope per SPMP §2.3, same reasoning as the web-side removal this session) — not fixed, just flagged, same as v4 left it.
6. SF10 generation — still blocked on DepEd, not actionable.

**Bigger picture**, per this session's non-code discussion (§1a) and the full-scope check (§6a): the team is still inside SPMP Sprint-3-report-equivalent content. The two genuinely large remaining pieces are the **mobile app's backend integration** (frozen since 2026-09-07, zero API wiring — §6a item 1) and **EPIC-09 System Integration & Testing / Sprint 9** (formal UAT plus ISO/IEC 25010-aligned evaluation with real users at the pilot school — not started). Locating the "Proposal Manuscript" referenced in SPMP §10.3 (not found in this repo) would help nail down the exact expected testing procedure/instrument before that phase starts.

None of the above was requested this session — listed as informed options, same framing every prior handoff has used.

---

## 9. Operational Notes for Next Session

- **Start backend:** `cd backend && npm run dev` — confirm `EduCheck backend running on http://localhost:5000`.
- **Start frontend:** `cd frontend && npm run dev` — open the printed URL (was `5173` this session).
- **No new migration this session** — dev DB schema is identical to v8's end state.
- **Credentials, unchanged from v7/v8:**
  - `admin.educheck` / `admin12345`
  - `subject.grade6a` / `subject12345`
  - `adviser.grade6a` / `adviser123`
  - `principal.educheck` / `principal12345`
  - `test.subject`, `adviser.grade5a` — still no known password; not touched.
- **`teacher_assignments` row for adviser.grade6a↔Mabini is now `assignment_id=6`, not `3`** — purely cosmetic (no code depends on the literal id), noted here only so the id doesn't look unexplained in a future DB dump.
- **`audit_logs` has 2 real rows now** (from this session's live-verification of the section-scoping fix) — no longer empty, unlike v8's snapshot. That's accurate history, not a bug.
- **Git state:** 4 commits made this session (`4b60768`, `51dcf04`, `d185013`, `576ceaa`), all on `main`, **local only, not pushed**. Working tree is clean except this handoff file itself and the user's own `EduCheck_Chapter4_Results_and_Discussion_Sprints1-3.docx`, both deliberately left uncommitted, same convention as every prior handoff.
- **`EduCheck_Chapter4_Results_and_Discussion_Sprints1-3.docx` is the user's own file** — re-read it directly if a future session needs to build on its content; don't assume it matches this session's earlier markdown draft verbatim, since the user has since edited/renamed it outside this session's view.
