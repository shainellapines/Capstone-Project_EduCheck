# EduCheck Capstone 2 — Development Handoff v6
## SPMP v1.0 Realignment, Auth Hardening Completed, Section Staffing & Teacher Assignment Built

**Written:** 2026-09-09, pausing mid-session by user request.
**Supersedes context in:** `EduCheck_Capstone2_Development_Handoff_v5_Subject_Seed_Auth_Hardening.md`. v5 is still fully accurate for what it covers; this file picks up immediately after it, in the same calendar day (the demo v5 assumed was imminent has **not** happened yet — confirmed by the user mid-session).

---

## 1. Where We Left Off

This session had two distinct parts.

### 1a. Finished what v5 left pending

v5 ended with real, tested fixes sitting **uncommitted** in the working tree, plus two auth gaps explicitly flagged but not fixed. This session:

1. **Committed v5's pending work** exactly as v5 described it — the 40-subject seed migration, the `parser-test` auth fix, and the frontend session-guard rewrite. Three separate commits, no code changes from what v5 had already written and verified.
2. **Closed the two gaps v5 raised but left open**: login rate-limiting and a password-complexity rule (see §5). Both implemented, live-tested, committed.
3. **Did the one thing never yet done this whole project**: opened the running app in a real browser and clicked through it as a human (login → dashboard → consolidated records → notifications → repository → logout/re-login against the new rate limiter). User confirmed: **working fine.**

### 1b. The project-management folder changed mid-session — this reversed a same-day recommendation

While reviewing project docs, the `01-Project Managemet/` folder was found to have been reorganized by the team: the old SPMP draft plus three separate design docs (Mobile App, Final Workflow, System Design) were gone, replaced by one file — **`01 - EduCheck_SPMP_v1.0_1.docx`** (status: *Draft — Pending Adviser Review*; authored by all three team members: Shaine Ella Pines, Marjorie Gale Arizo, Aira Jeanelle Hepana). It has visibly absorbed the other docs' content.

**This matters because it directly reverses advice given earlier the same session.** The old SPMP left grade-band/section access control out of its official scope, which supported treating it as optional/Phase-2. **SPMP v1.0 puts section staffing mode and teacher assignment in as Must-have backlog items, scheduled at Sprint 2** (US-009, US-011) — i.e. the team's own current planning document says this should have been built near the *start* of development, not deferred to the end.

A full line-by-line comparison against the actual code found (full detail in that turn of the conversation, not repeated in full here — the important result is §1c below):

| SPMP v1.0 requirement | Code before this session |
|---|---|
| US-011: Admin sets each section Self-Contained/Departmentalized | `sections` table had no staffing concept at all |
| US-009: Admin assigns Subject Teachers to (subject, section) pairs | `teachers` had no subject/section fields; no assignment table existed |
| Subject Teacher restricted to their assigned subject+section | `uploadRoutes.js` gated only on role — any subject-role account could upload any subject at any grade |
| Adviser uploads for Self-Contained sections | Adviser role was blocked from `/api/uploads` entirely, regardless of section |
| Section consolidation status view | `consolidationController.js` grouped everything by `grade_level`, never `section_id`; `students.section_id` was a dead column, never written |
| Principal role (view-only) | Zero occurrences anywhere in the codebase |
| Adviser return-to-subject-teacher for correction | Only whole-record admin approve/reject existed |

The user's direction once this was surfaced: **"I need to finish it... can't we just follow what's on SPMP?"** — i.e. build it, not defer it. This session built the first two rows of that table (staffing mode + assignment + upload restriction). See §1c.

### 1c. Built: Section Staffing Mode + Teacher Assignment, enforced on upload

Full design, live verification, and exact code are in §4/§5 below. Summary: the Administrator now configures, through a real UI page, whether each section is Self-Contained or Departmentalized, and which teacher is assigned to which (subject, section) pair (or as the section's Adviser). The upload endpoint now checks this before accepting a file — a Subject Teacher can only upload their assigned subject for their assigned section; an Adviser can only upload at all if their section is Self-Contained.

**Verified live** with a real admin-created section/assignment setup (not just unit-style reasoning): assigned Subject Teacher upload succeeds; same teacher on an unassigned subject gets 403; Adviser on a Departmentalized section gets 403; same Adviser on a Self-Contained section succeeds; a real upload with valid LRNs correctly tags each resulting student row with the right `section_id`.

**Three rows of that table remain**, and none of them need more schema work — they build directly on what's here now (detail in §8):
- Adviser return-to-subject-teacher for correction (needs a new status + action + notification)
- Section-level consolidation view (needs `consolidationController` to group by `section_id`, which only means something now that students actually carry one)
- Principal role (independent of the above — new role value + read-only routes/pages)

---

## 2. Current File Structure (delta from v5 only)

```text
EduCheck/
├── 01-Project Managemet/
│   ├── 01-EduCheck Software Development Plan.docx      ← DELETED (superseded)
│   └── 01 - EduCheck_SPMP_v1.0_1.docx                  ← NEW, untracked — the current baseline
├── 02-Product Design/06-Database/SQL/migrations/
│   └── 005_section_staffing_and_assignments.sql        ← NEW
├── EduCheck_Capstone2_Development_Handoff_v6_...md      ← this file
├── backend/
│   ├── package.json / package-lock.json                 ← CHANGED — added express-rate-limit
│   └── src/
│       ├── server.js                                    ← CHANGED — mounts 3 new route files
│       ├── controllers/
│       │   ├── userController.js                        ← CHANGED — password-complexity rule
│       │   ├── uploadController.js                       ← CHANGED — assignment-scoped options + enforcement
│       │   ├── gradeRecordPersistence.js                 ← CHANGED — threads section_id onto students
│       │   ├── sectionController.js                      ← NEW
│       │   ├── assignmentController.js                   ← NEW
│       │   └── subjectController.js                      ← NEW
│       └── routes/
│           ├── authRoutes.js                             ← CHANGED — rate limiter on /login
│           ├── uploadRoutes.js                            ← CHANGED — role gate widened to include adviser
│           ├── sectionRoutes.js                           ← NEW
│           ├── assignmentRoutes.js                        ← NEW
│           └── subjectRoutes.js                           ← NEW
└── frontend/
    └── src/
        ├── App.jsx                                       ← CHANGED — new route, upload route allows adviser
        ├── components/Sidebar.jsx                        ← CHANGED — new admin nav item, adviser upload link wired
        └── pages/
            ├── ClassRecordUpload.jsx / .css               ← CHANGED — assignment-scoped, section-aware
            ├── SectionAssignments.jsx                     ← NEW — the admin UI for all of §1c
            └── SectionAssignments.css                     ← NEW
```

Everything from v5's file structure (session.js, the v5 auth fixes, the subject seed migration) is unchanged and already committed. `frontend/src/utils/session.js` is still load-bearing exactly as v5 described — nothing this session changed that.

---

## 3. Current Database State

- **`sections`: 2 rows** (was 0 — the column existed but table was empty). `Rizal` (Grade 6, Departmentalized), `Mabini` (Grade 3, Self-Contained) — both created live during this session's verification, left in place as real usable config, not test junk.
- **`teacher_assignments`: 3 rows** (new table). `subject.grade6a` → Mathematics @ Rizal. `adviser.grade6a` → Adviser @ Rizal (Departmentalized, so review-only — cannot upload there). `adviser.grade6a` → Adviser @ Mabini (Self-Contained, so **can** upload any subject there).
- **`teachers`: 2 rows** (was 1). A teacher profile was created for `adviser.grade6a` (previously had none — only Subject Teachers had profiles before, since Advisers never needed one until assignments existed).
- **`class_records`: 13 rows** — unchanged from before this session. Five test uploads made during verification (rows 23–27) were deleted afterward along with their `grade_records`/`validation_issues` and stored files, restoring this count to its pre-session baseline.
- **`students`: 100 rows** — unchanged in count. One verification upload legitimately touched 99 of these shared-test-LRN rows' `grade_level`/`section_id` fields (this table keys by LRN only, so re-uploading the same fake LRNs under a different subject/section overwrites their previous state — a pre-existing characteristic, not something new this session introduced). These 99 were explicitly restored to their pre-session values (`grade_level='3'`, `section_id=NULL`) afterward.
- **`subjects`: 40 rows** — unchanged (v5's seed).
- **`users`: 3 rows** — unchanged. **Two passwords were reset this session** because they were never recorded anywhere (a gap v5 already flagged) and admin-level testing needed them:
  - `admin.educheck` → new password: **`admin12345`**
  - `subject.grade6a` → new password: **`subject12345`**
  - `adviser.grade6a` still uses the documented `adviser123` — untouched.
  - **Write these down somewhere durable** — this is now the second session to have to work around this gap.

---

## 4. API Surface Added/Changed This Session

| Method | Path | Change |
|---|---|---|
| POST | `/api/auth/login` | Now rate-limited: 10 failed attempts per IP per 15 min, successful logins don't count |
| POST | `/api/users` | Now rejects passwords under 8 chars or missing a letter/number |
| GET | `/api/sections` | **NEW** — any authenticated role |
| POST/PUT/DELETE | `/api/sections`, `/api/sections/:id` | **NEW** — admin only |
| GET | `/api/assignments/mine` | **NEW** — any authenticated role, own assignments only |
| GET/POST/DELETE | `/api/assignments`, `/api/assignments/:id` | **NEW** — admin only |
| GET | `/api/subjects` | **NEW** — any authenticated role, full 40-subject list |
| GET | `/api/uploads/options` | **Changed response shape**: was `{subjects, school_years}` (every subject), now `{options, school_years}` where `options` is a flat list of the caller's actual valid (subject, section, school_year) combinations, each carrying a `school_year` label. Empty list ≠ error — means unassigned. |
| POST | `/api/uploads` | Now requires `section_id` in the form body in addition to `subject_id`/`school_year_id`; checks the combination against `teacher_assignments` before parsing, returns 403 if unauthorized. Role gate widened from `subject`-only to `subject`+`adviser`. |

---

## 5. Exact Code Just Finished

*(This section covers only what's new/changed since v5 — v5's own §5 still stands for the subject seed migration, the parser-test fix, and `session.js`.)*

### `backend/src/routes/authRoutes.js` (diff) — rate limiting
```js
const rateLimit = require("express-rate-limit");
// ...
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many login attempts. Please try again in a few minutes." }
});

router.post("/login", loginLimiter, login);
```

### `backend/src/controllers/userController.js` (diff) — password rule
```js
const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
// ...inside createUser, after the required-fields check:
if (!PASSWORD_RULE.test(password)) {
    return res.status(400).json({
        message: "Password must be at least 8 characters and include both a letter and a number."
    });
}
```

### `02-Product Design/06-Database/SQL/migrations/005_section_staffing_and_assignments.sql` (new, full file)
```sql
ALTER TABLE sections
    ADD COLUMN staffing_mode VARCHAR(20) NOT NULL DEFAULT 'Departmentalized'
    CONSTRAINT sections_staffing_mode_check
        CHECK (staffing_mode IN ('Self-Contained', 'Departmentalized'));

CREATE TABLE teacher_assignments (
    assignment_id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL,
    section_id INTEGER NOT NULL,
    subject_id INTEGER,                    -- NULL = Class Adviser for the whole section
    school_year_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_assignment_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id) ON DELETE CASCADE,
    CONSTRAINT fk_assignment_section FOREIGN KEY (section_id) REFERENCES sections(section_id) ON DELETE CASCADE,
    CONSTRAINT fk_assignment_subject FOREIGN KEY (subject_id) REFERENCES subjects(subject_id),
    CONSTRAINT fk_assignment_school_year FOREIGN KEY (school_year_id) REFERENCES school_years(school_year_id)
);

-- One Adviser per section per school year
CREATE UNIQUE INDEX uq_assignment_one_adviser_per_section
    ON teacher_assignments (section_id, school_year_id) WHERE subject_id IS NULL;

-- One Subject Teacher per (subject, section) per school year
CREATE UNIQUE INDEX uq_assignment_one_teacher_per_subject_section
    ON teacher_assignments (section_id, subject_id, school_year_id) WHERE subject_id IS NOT NULL;

ALTER TABLE class_records
    ADD COLUMN section_id INTEGER,
    ADD CONSTRAINT fk_class_record_section FOREIGN KEY (section_id) REFERENCES sections(section_id);
```
Schema only, no seed rows — sections/assignments are Administrator-configured operational data, not fixed reference data like migration 004's subject list. Applied live and verified.

### `backend/src/controllers/uploadController.js` (key additions)
- `getUploadOptions` rewritten: returns the caller's actual assignment-scoped list (Subject Teacher → explicit `(subject, section)` rows; Adviser → every subject for their section's grade level, only if that section is `Self-Contained`), each row now also carrying a `school_year` label.
- New `isUploadAuthorized({ teacherId, sectionId, subjectId, schoolYearId })` — same two-path logic, checked against one specific upload attempt. Returns false (→ 403) when nothing matches.
- `uploadClassRecord` now requires and validates `section_id`, calls `isUploadAuthorized` before parsing, and persists `section_id` on the created `class_records` row and (via `gradeRecordPersistence`) on every affected `students` row.

### `backend/src/controllers/gradeRecordPersistence.js` (diff)
`persistLearnerGradeRecords` now accepts `sectionId` and includes it in the `students` upsert (`section_id = EXCLUDED.section_id`).

### `backend/src/routes/uploadRoutes.js` (diff)
Role gate widened: `authorizeRoles("subject")` → `authorizeRoles("subject", "adviser")`. Fine-grained enforcement lives in the controller now, not this gate.

### New: `sectionController.js` / `sectionRoutes.js`, `assignmentController.js` / `assignmentRoutes.js`, `subjectController.js` / `subjectRoutes.js`
Standard CRUD (sections, assignments) and a plain list endpoint (subjects) — see §4 for the routes. Assignment creation returns a friendly 409 on the two partial-unique-index conflicts ("this section already has an Adviser" / "this subject already has a Subject Teacher for this section").

### `frontend/src/pages/SectionAssignments.jsx` + `.css` (new, ~650 + ~220 lines)
Admin-only page at `/section-assignments`, added to the admin sidebar nav (`components/Sidebar.jsx`). Two cards on the standard `dashboard-layout`/`Sidebar`/`content-card` shell (same pattern as `RecordsRepository.jsx`):
- **Sections**: table + inline add-form; staffing mode is an inline `<select>` that PUTs immediately on change; delete with confirmation.
- **Teacher Assignments**: table + inline add-form (teacher / section / subject-or-blank-for-Adviser / school year dropdowns, all populated from the four new/existing list endpoints); delete with confirmation.

### `frontend/src/pages/ClassRecordUpload.jsx` + `.css` (diff)
The old separate Subject + School Year dropdowns are replaced by one "Subject & Section" dropdown built from `/uploads/options`'s `options` array — each entry is one full valid `(subject, section, school_year)` combination, keyed by `` `${section_id}-${subject_id}-${school_year_id}` ``. An empty list shows an inline message telling the user to contact their Administrator, instead of a silently-empty subject picker. The upload result panel now also shows which section the record was filed under.

### `frontend/src/App.jsx` / `components/Sidebar.jsx` (diff)
- New route: `/section-assignments`, admin-only.
- `/class-record-upload` route's `allowedRoles` widened from `["subject"]` to `["subject", "adviser"]`.
- Admin nav gains "Section & Teacher Assignments".
- Adviser's "Upload Files" nav link, previously a dead placeholder (`path: null`), now points to `/class-record-upload`.

**Verification, every round:** `npm run build` clean, `npm run lint` clean (same pre-existing `UserManagement.jsx` warning every prior session has documented), `node --check` on every backend file touched, and live curl-driven behavioral tests for all four upload-authorization scenarios plus a real end-to-end upload confirming `section_id` lands correctly on `students`. Full detail on how the 403/403/403/201 test matrix was constructed is in this session's conversation if it's ever needed again — not reproduced here since the code + live confirmation above is the part that matters going forward.

---

## 6. SPMP Alignment

**This is now measured against SPMP v1.0, not the older document v4/v5 used.** Of the 7-row gap table in §1b:

- ✅ **Section staffing mode + teacher assignment + upload restriction** — built and verified this session.
- ❌ **Adviser return-to-subject-teacher correction** (US-006, Must, Sprint 7) — not started.
- ❌ **Section-level consolidation view** — not started; now unblocked (students carry `section_id`), but no view code written yet.
- ❌ **Principal role** (US-008, Should, Sprint 8) — not started; independent of the above.

Two of five gap-table rows closed in one session. The remaining three don't require more schema work — see §8.

---

## 7. Live Servers — status at this pause

**Both dev servers were left running:**
- Backend: `http://localhost:5000` (nodemon, auto-reloads on file changes)
- Frontend: `http://localhost:5173`

If picking this up fresh, `cd backend && npm run dev` / `cd frontend && npm run dev` as usual.

---

## 8. Literal Next Step

**Paused mid-feature by user request — not at a natural finishing point, at a deliberate stopping point.** The next session should pick directly back up on the three remaining SPMP v1.0 gap-table rows. Suggested order, since none of the three block each other:

1. **Adviser return-to-subject-teacher correction (US-006, Must, Sprint 7).** Needs: a new `class_records.status` value (e.g. `"Needs Revision"`), an Adviser-facing action (likely in `ConsolidatedRecords.jsx`, alongside the existing admin approve/reject) that sets it and records who/why, and a notification to the Subject Teacher who owns that `class_record`. The Subject Teacher's upload page/dashboard should surface "needs revision" records distinctly from a normal pending upload.
2. **Section-level consolidation view.** `consolidationController.js` currently groups everything by `grade_level`; add a section-scoped variant (or parameter) now that `students.section_id` is real data going forward. The "6 of 8 learning areas submitted for Grade 5 — Rizal" framing from the original design conversation is the target shape.
3. **Principal role.** New `role` value, read-only routes (progress/analytics/repository), and pages. Independent — can be built in any order relative to 1 and 2.

**Not yet done, mentioned for completeness, not urgent:** an audit log for assignment changes (SPMP's Risk Management §11 calls for one); the docx project-management folder has an uncommitted deletion (`01-EduCheck Software Development Plan.docx`) and a new untracked file (`01 - EduCheck_SPMP_v1.0_1.docx`) — not committed this session since only code changes were in scope, worth a `git add` pass whenever the docs side is being handled deliberately.

---

## 9. Operational Notes for Next Session

- **Start backend:** `cd backend && npm run dev` — confirm `EduCheck backend running on http://localhost:5000`.
- **Start frontend:** `cd frontend && npm run dev` — open the printed URL (was `5173` this session).
- **New migration to run if working from a different DB snapshot:** `005_section_staffing_and_assignments.sql` — schema-only, no seed rows, safe to run once (not idempotent like 004 — it's a plain `ALTER`/`CREATE`, so don't re-run it against a DB that already has it).
- **Credentials, current as of this pause:**
  - `admin.educheck` / `admin12345` (reset this session — **write this down**, it's the second time this password has had to be reset from unknown)
  - `subject.grade6a` / `subject12345` (reset this session)
  - `adviser.grade6a` / `adviser123` (unchanged, documented since v4/v5)
  - `test.subject`, `adviser.grade5a` — still no known password; not touched this session.
- **Demo config already in place**, safe to build on or extend: section `Rizal` (Grade 6, Departmentalized) with `subject.grade6a` assigned to Mathematics there and `adviser.grade6a` as its Adviser; section `Mabini` (Grade 3, Self-Contained) with `adviser.grade6a` as its Adviser (so that account can upload any subject there).
- **`frontend/src/utils/session.js` is still load-bearing** exactly as v5 described — any new page reading `educheck_token`/`educheck_user` directly instead of importing from here reintroduces a closed gap.
- **New file, now load-bearing:** any future admin feature touching subjects/sections/teachers should read from `/api/subjects`, `/api/sections`, `/api/assignments` rather than re-deriving these lists — they're the single source of truth the upload-restriction logic itself depends on.
- **Verify before trusting any visual claim:** `npm run build` + `npm run lint` inside `frontend/` — both clean as of this pause.
- **Live DB has real usage data across five sessions now** — don't wipe `record_submissions`, `notifications`, `students`, `grade_records`, `sections`, or `teacher_assignments` without checking with the user first.
- **Git status:** six commits made this session, all on `main`, already pushed nowhere (local only as of this pause) — `e65713d`, `e05dd02`, `f263d8f`, `72e50cd`, `f09d00d`, `6f1f84a`. The docx changes in `01-Project Managemet/` remain uncommitted, deliberately out of scope this session.
