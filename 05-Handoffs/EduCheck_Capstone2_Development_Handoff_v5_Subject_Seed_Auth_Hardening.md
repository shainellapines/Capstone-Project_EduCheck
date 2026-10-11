# EduCheck Capstone 2 — Development Handoff v5
## Subject Data Seed, Live API-Level Testing, Authentication Hardening — Pre-Demo Pause

**Written:** 2026-09-07, pausing the night before the team's live demonstration (2026-09-08) of the ~75% web app.
**Supersedes context in:** `EduCheck_Capstone2_Development_Handoff_v4_UIUX_Shell_Consistency_Pass.md` (the UI/UX shell-consistency pass, redundancy cleanup, and SPMP alignment review — including its Corrected §0 about the mobile app and git/PR history). v4 is still fully accurate; this file picks up immediately after it.

**A separate document, `EduCheck_Demo_Presentation_Guide.md` (or its published Artifact link, if the user chose to keep one), is the screen-by-screen / code-explanation script for tomorrow's demo.** This handoff file is about what changed in the code and what to do next — read the presentation guide separately for how to actually present the app.

---

## 1. Where We Left Off

v4 ended right after the UI/UX consistency pass, with the user not yet having clicked through the app live. This session picked up with three separate asks, done in order:

1. **"Does the upload subject really only contain Math?"** — user pasted a screenshot of the real DepEd Grade 1–6 subject list and asked us to confirm it against the app.
2. **"Check/test the web app and evaluate SPMP alignment — is authentication final?"** — asked for the app to actually be run and driven, not just read.
3. **"Do that"** — approval to fix the two concrete authentication gaps the testing surfaced.

### 1a. Subject data was seeded (real bug, now fixed)

Queried the live `subjects` table directly and found it had exactly **one row**: `Mathematics, Grade 6`. That was never a code bug — `ClassRecordUpload.jsx`'s subject dropdown correctly renders whatever `subjects` contains; the table itself was just never seeded beyond an early manual test insert. This blocked uploading anything except Math/Grade 6.

Checked the SPMP for who "owns" the subject list (Admin? a config screen?) — it's silent; subjects are treated the same way the SPMP treats the DepEd e-Class Record format itself: fixed, official, government-defined data, not something any role edits through the app. That argued for a seed migration over building admin CRUD.

**Fix:** [`004_seed_subjects.sql`](02-Product%20Design/06-Database/SQL/migrations/004_seed_subjects.sql) — adds a `(subject_name, grade_level)` uniqueness constraint, then inserts all 40 subjects across Grades 1–6 from the user's reference table, with `ON CONFLICT DO NOTHING` so the pre-existing Math/6 row (and any `class_records` already pointing at its `subject_id = 1`) is left untouched, not duplicated. **Applied to the live dev DB** — re-queried afterward: 40 rows, matching the reference table's 5/5/6/8/8/8-per-grade counts exactly.

### 1b. Live API-level testing (not just build/lint) — the app was actually driven

No browser-automation tool exists in this Windows environment (same limitation v4 hit trying to fetch the Figma prototype), so the UI itself wasn't clicked through by the assistant. What *was* done: both dev servers were started for real, and the actual HTTP API was driven end-to-end using a throwaway test account (created, used, then fully deleted — verified clean afterward: back to 5 users, 1 teacher, no orphan records).

Verified live:
- Login issues a real JWT; wrong password → 401; no/garbage token → 401 on protected routes; wrong role → 403 on role-restricted routes (`authenticateToken` / `authorizeRoles` in `authMiddleware.js` hold up under adversarial input).
- **A real file upload tagged Filipino/Grade 3** (using the newly-seeded subject list and an existing sample e-Class Record file already in the repo) → 100 learners persisted, 0 validation errors. This proves `classRecordParser.js`/`classRecordValidator.js` are genuinely subject-agnostic, not secretly Math-6-specific from having only ever been tested against one subject.
- Passwords are bcrypt-hashed at creation (cost 10); `JWT_SECRET` is 40 chars, not a placeholder.

### 1c. Two real authentication gaps found — both fixed and verified live

| # | Gap found | Fix |
|---|---|---|
| 1 | **`/api/parser-test` had zero authentication** — a live, mounted, unauthenticated file-upload+parse endpoint (confirmed live: POST with no token got the *controller's* 400 "no file," not a 401 — meaning it never checked for a token at all). Likely a leftover dev/debug route; the dozens of oddly-timestamped files in `backend/src/uploads/` suggest it saw repeated manual use. | Added `authenticateToken` to `parserTestRoutes.js`. Re-tested live: no token → `401` (was `400`); valid token → passes through to the real "no file" `400`. |
| 2 | **The frontend's session/route guards trusted `localStorage` content, not the JWT itself** — `ProtectedRoute.jsx` and `App.jsx`'s `RoleBasedDashboard` only checked whether *something* was stored under `educheck_user`, never whether the token was still valid or even present. A token past its 8h expiry (or hand-edited localStorage) would still render the page shell, with every API call underneath silently failing 401 and nothing routing the user back to Login. | New `frontend/src/utils/session.js` — decodes the JWT payload client-side to check `exp` (`isSessionValid()`), and installs a global `fetch` interceptor (`installSessionGuard()`, wired in `main.jsx`) so **any** 401 response anywhere in the app — not just at page mount — clears the session and redirects to `/`. `ProtectedRoute.jsx`, `App.jsx`'s `RoleBasedDashboard`, and `Sidebar.jsx` were all updated to use these shared helpers instead of their own separate `localStorage` reads. |

**What's still open (raised, not fixed — lower priority, didn't block anything):** no login rate-limiting/brute-force protection, no password complexity rule beyond "non-empty." Both are on the "Next" list, not urgent for tomorrow's demo.

**Net effect on the "is authentication final?" question:** No — but it's materially closer than it was this morning. Core mechanics (JWT issuance/verification, bcrypt, RBAC middleware) were already solid and are now proven solid under live testing, not just assumed. The two gaps that existed have been closed and re-verified live. What remains (rate limiting, password rules) is real but minor, and reasonable to defer past a capstone demo.

### What's confirmed working via real testing this session
Everything in §1b/§1c above was driven against the actual running servers, not just `npm run build`/`npm run lint` (though both were also run clean after every change — see v4's established convention). This is a step up from v4, which was build/lint-verified only and never actually run.

---

## 1a. Second Finding This Same Evening — a Bigger Gap Against the "Final Workflow" Design Doc

After this file's original pause point, the user pasted a separate, more detailed design document — **"EduCheck — Final Workflow & Role Modules"** — and asked whether the app actually follows it. It does not, and the user confirmed this *is* the document the panel will hold the team to, not just an aspirational sketch. This is a materially bigger and differently-shaped gap than v4's SPMP-epic estimate (73%) surfaces, because it's checking a more granular thing: not "is the epic built" but "does the app enforce the specific role/section model the design describes."

**What that design assumes, that the app does not implement at all:**

| Design calls for | Reality, verified against the code this session |
|---|---|
| Grade 1–3 self-contained (one Adviser teaches everything) vs. Grade 4–6 departmentalized (one Subject Teacher per learning area) | **No branching exists anywhere.** Any Subject Teacher account can upload any subject at any grade level. |
| Admin assigns Adviser↔section, Subject Teacher↔(subject, section) | **Not built.** `teachers` table has only employee number/name/contact — no subject or section assignment. The upload page's subject dropdown shows all 40 subjects to any subject-role account, unfiltered. |
| Adviser uploads directly for Grades 1–3 | **Not possible.** `uploadRoutes.js` is `authorizeRoles("subject")` only — Advisers get a 403 regardless of grade. |
| Section Consolidation Dashboard ("6 of 8 learning areas for Grade 5 – Rizal") | **Not built.** `students.section_id` has a live FK to a `sections` table, but grepping every controller found **zero** reads/writes/joins on it anywhere — it's a dead column from the original ERD. All consolidation views are whole-school-year, not per-section. |
| Adviser returns one subject's file to its teacher for correction, cannot edit it directly | **Not built.** The only reject path that exists is the Administrator rejecting a student's *entire* consolidated record (`submissionController.js`) — there is no per-subject return-to-teacher mechanism at all. |
| SF10 auto-generated on Adviser approval | **Still fully blocked** — same 3-term-vs-4-quarter DepEd mismatch as v3/v4; zero generation code exists. |
| Principal role (5 modules: progress view, analytics, repository read access, approval oversight, mobile snapshot) | **Entirely unbuilt** — no role value, no routes, no pages. Consistent with every prior handoff (v2–v4). |
| Audit log (who submitted/returned/approved, when) | **Not built** beyond the bare `reviewed_by`/`approved_by`/timestamp columns already on `record_submissions`. |
| System Configuration (grading scale, required learning areas per grade) | **Not admin-configurable.** Grading scale is hardcoded in `Dashboard.jsx`'s `classifyStudent`. "Required learning areas per grade" is just the `subjects` table seeded this session — no admin UI manages it. |
| Repository export / reporting tools | **Not built.** |

**What genuinely does match** (the core pipeline, not the role/section scaffolding around it): template-presence validation before parsing, the rule-based validator's range/completeness/final-grade-recomputation checks, LRN as the cross-subject join key, a missing learner in one subject being flagged incomplete rather than dropped, and the approve/reject → repository → notification chain.

**Action taken:** the Demo Presentation Guide (published artifact, "EduCheck Demo Runsheet") was updated in place with a new §2.5 ("Build vs. the Final Workflow Design") placed right after the architecture overview — a comparison table plus a suggested opening line that names this gap before the panel finds it, rather than waiting to be asked. Inline caveats were also added inside the Subject Teacher upload step, the Adviser's Consolidated Records step, and the Admin approve/reject step, plus three new problem cards, two new Q&A entries, and an updated closing paragraph. **No code was changed for this finding** — it's a scope/framing question, not a same-night fix.

## 2. Current File Structure (delta from v4 only)

```text
EduCheck/
├── 02-Product Design/06-Database/SQL/migrations/
│   └── 004_seed_subjects.sql                    ← NEW — seeds all 40 Grade 1-6 subjects
├── EduCheck_Capstone2_Development_Handoff_v5_...md   ← this file
├── EduCheck_Demo_Presentation_Guide.md (or Artifact)  ← NEW — tomorrow's demo script, see §9
├── backend/
│   └── src/
│       └── routes/
│           └── parserTestRoutes.js               ← CHANGED — now requires authenticateToken
└── frontend/
    └── src/
        ├── main.jsx                              ← CHANGED — calls installSessionGuard() at startup
        ├── App.jsx                                ← CHANGED — RoleBasedDashboard uses isSessionValid()
        ├── components/
        │   ├── ProtectedRoute.jsx                 ← CHANGED — uses isSessionValid(), not raw localStorage
        │   └── Sidebar.jsx                        ← CHANGED — uses shared session.js helpers
        └── utils/
            └── session.js                         ← NEW — getToken/getStoredUser/isSessionValid/
                                                       clearSession/installSessionGuard
```

Everything else in v4's file structure is unchanged.

---

## 3. Current Database State

- **`subjects`: 40 rows** (was 1). See §1a. This is the one real schema-adjacent change this session (a new uniqueness constraint via migration 004, plus data) — no other table structure changed.
- No other live data was permanently added or removed. All test-only rows created during §1b's live API testing (1 temp user, 1 temp teacher profile, 1 class_record, 100 grade_records, 1 uploaded file) were deleted afterward and the cleanup was verified by re-querying row counts.
- Row counts for everything else were **not re-verified this session** — treat v3's snapshot (already stale per v4) as more stale still.

---

## 4. API Surface Added/Changed This Session

No new routes, no response shape changes. One route's *access control* changed:

| Method | Path | Change |
|---|---|---|
| POST | `/api/parser-test` | Now requires `authenticateToken` (was open to anyone, no login required) |

---

## 5. Exact Code Just Finished

### `02-Product Design/06-Database/SQL/migrations/004_seed_subjects.sql` (new, full file)
```sql
ALTER TABLE subjects
    ADD CONSTRAINT subjects_name_grade_level_key
    UNIQUE (subject_name, grade_level);

INSERT INTO subjects (subject_name, grade_level) VALUES
    ('Reading and Literacy', '1'), ('Language', '1'), ('Mathematics', '1'),
    ('Makabansa', '1'), ('GMRC', '1'),
    ('Filipino', '2'), ('English', '2'), ('Mathematics', '2'),
    ('Makabansa', '2'), ('GMRC', '2'),
    ('Filipino', '3'), ('English', '3'), ('Mathematics', '3'), ('Science', '3'),
    ('Makabansa', '3'), ('GMRC', '3'),
    ('Filipino', '4'), ('English', '4'), ('Mathematics', '4'), ('Science', '4'),
    ('Araling Panlipunan', '4'), ('EPP', '4'), ('MAPEH', '4'), ('GMRC', '4'),
    ('Filipino', '5'), ('English', '5'), ('Mathematics', '5'), ('Science', '5'),
    ('Araling Panlipunan', '5'), ('EPP', '5'), ('MAPEH', '5'), ('GMRC', '5'),
    ('Filipino', '6'), ('English', '6'), ('Mathematics', '6'), ('Science', '6'),
    ('Araling Panlipunan', '6'), ('TLE', '6'), ('MAPEH', '6'), ('ESP', '6')
ON CONFLICT (subject_name, grade_level) DO NOTHING;
```
Already applied to the live dev DB — re-running it is safe (idempotent via the `ON CONFLICT`) if the demo machine's DB is different from the one this session touched.

### `backend/src/routes/parserTestRoutes.js` (diff)
Added `authenticateToken` (imported from `../middleware/authMiddleware`) as the first middleware on the `POST /` handler, ahead of `upload.single("file")`.

### `frontend/src/utils/session.js` (new, full file)
```js
const TOKEN_KEY = "educheck_token";
const USER_KEY = "educheck_user";

function getToken() { return localStorage.getItem(TOKEN_KEY); }

function getStoredUser() {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
}

// Client-side JWT payload decode — NOT a signature check (the client can't
// verify a signature; the backend already does that on every request). Only
// tells the UI "would the backend already consider this expired."
function decodeTokenPayload(token) {
    try {
        const payload = token.split(".")[1];
        const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
        return JSON.parse(json);
    } catch { return null; }
}

function isSessionValid() {
    const token = getToken();
    const user = getStoredUser();
    if (!token || !user) return false;
    const payload = decodeTokenPayload(token);
    if (!payload || !payload.exp) return false;
    return payload.exp * 1000 > Date.now();
}

function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

// Installed once at startup (main.jsx). Any 401 anywhere — not just at page
// mount — clears the session and returns to Login. Login's own "wrong
// password" 401 is unaffected: it fires before any token is ever stored, so
// this guard (which only acts when a token already exists) never applies.
function installSessionGuard() {
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (...args) => {
        const response = await originalFetch(...args);
        if (response.status === 401 && getToken()) {
            clearSession();
            if (window.location.pathname !== "/") window.location.href = "/";
        }
        return response;
    };
}

export { getToken, getStoredUser, isSessionValid, clearSession, installSessionGuard };
```

### `frontend/src/main.jsx` (diff)
Calls `installSessionGuard()` once, before `createRoot(...).render(...)`.

### `frontend/src/components/ProtectedRoute.jsx` (full file, after change)
```jsx
import { Navigate } from "react-router-dom";
import { isSessionValid, getStoredUser, clearSession } from "../utils/session";

function ProtectedRoute({ children, allowedRoles }) {
    if (!isSessionValid()) {
        clearSession();
        return <Navigate to="/" replace />;
    }

    const user = getStoredUser();

    if (!allowedRoles.includes(user.role)) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}

export default ProtectedRoute;
```

### `frontend/src/App.jsx` (diff) and `frontend/src/components/Sidebar.jsx` (diff)
Both swapped their own raw `localStorage.getItem("educheck_user"/"educheck_token")` reads for the shared `getStoredUser()`/`getToken()`/`clearSession()` helpers from `utils/session.js`. `RoleBasedDashboard` (in `App.jsx`) also gained the same `isSessionValid()` guard `ProtectedRoute` has — it previously bypassed `ProtectedRoute` entirely on `/dashboard` and had its own weaker copy of the same check.

**Verification, every round:** `npm run build` clean, `npm run lint` clean (only the same pre-existing `UserManagement.jsx` warning v4 already documented), `node --check` on the backend route file, and live curl-driven behavioral tests for both fixes (see §1c table).

---

## 6. SPMP Alignment — unchanged from v4, one footnote

v4's 73% estimate and epic-by-epic table stand as-is; nothing this session changed scope or moved an epic's percentage. The one addition: **EPIC-01 (Auth & User Management)** now has live-tested evidence behind its ~95% figure instead of code-review-only confidence — see §1c. Still not 100%: rate limiting and password-complexity rules remain unbuilt, same as noted in the demo guide's limitations section.

---

## 7. Live Servers — status at this pause

**Both dev servers were left running** at the end of this session (started for the live API testing in §1b):
- Backend: `http://localhost:5000` (nodemon, auto-reloads on file changes)
- Frontend: `http://localhost:5175` (Vite picked 5175 because 5173/5174 were already occupied — likely your own separately-running dev instance; check before assuming which one is "the" running copy)

If picking this up fresh (e.g. on a different machine for the demo), the usual `cd backend && npm run dev` / `cd frontend && npm run dev` still applies — nothing about the startup process changed.

---

## 8. Literal Next Step

**Tonight: no more code.** Everything that needed fixing before the demo (subject seed, both auth gaps) is done and verified. The §1a gap is a scope/framing question, not something fixable in the hours before a demo — touching more code now is pure risk for no benefit. The one real remaining task tonight is rehearsal: open the Demo Runsheet artifact and practice saying its §2.5 opening line out loud — that's a speaking skill, not a code fact, and it's the one part of tomorrow that has to sound natural rather than read off a screen.

**Right after the demo — one conversation, not code.** Sit down with the team/adviser and decide explicitly: is the §1a gap (grade-band branching, section/teacher assignment, per-subject return-to-teacher) real remaining scope before final defense, or does the panel accept it as a documented Phase 2? This is a scope call about how much time is actually left, not something to resolve unilaterally in a coding session. Closing it for real is a multi-session feature body — reviving `sections` (currently a dead column nothing reads), building teacher-to-(subject, section) assignment (new schema + an admin UI that doesn't exist yet), grade-band branching in upload permissions, and a genuinely new return-to-teacher workflow — not a quick patch like this session's fixes.

**Next coding session, branching on that decision:**

- **If §1a is in scope:** start with reviving `sections` + teacher-to-(subject, section) assignment first. Grade-band branching and the return-to-teacher loop both depend on the system knowing who's assigned to what, so that's the one piece everything else in §1a sits on top of.
- **If §1a is deferred to Phase 2:** fall back to the smaller queue below, carried forward from v4 and adjusted for what's now resolved:
  1. ~~User hasn't run the app locally~~ — **partially resolved**: the API layer has now been driven live (§1b); the UI itself still hasn't been clicked through by a human this round. Worth doing once, calmly.
  2. **Login rate-limiting** (`express-rate-limit`, ~10 lines) and a minimal password-complexity rule — small, cheap, closes out the auth-hardening thread started this session.
  3. `UserManagement.jsx` / `TeacherManagement.jsx` shell migration — still never touched, same pre-shell inline-style pattern every other page had before v4's pass.
  4. Mobile-integration conversation with Marjorie (per v4 §0/§7) — her 8 Flutter screens are UI-only, no backend wiring yet. Still a coordination task, not a coding one.
  5. Longer-standing, unchanged: SF10 generation (externally blocked, see §1a), the SPMP's review/sign-off gap.

**No standing recommendation between the two branches above** — that's exactly the decision the post-demo conversation needs to make.

## 9. Operational Notes for Next Session

- **Start backend:** `cd backend && npm run dev` → confirm `EduCheck backend running on http://localhost:5000`.
- **Start frontend:** `cd frontend && npm run dev` → open the printed URL.
- **New migration to run if working from a different DB snapshot:** `004_seed_subjects.sql` — safe to re-run (idempotent).
- **New file, now load-bearing:** `frontend/src/utils/session.js` — any future page that reads `educheck_token`/`educheck_user` from `localStorage` directly instead of importing from here is reintroducing the exact gap this session just closed. Route it through here.
- **Demo credentials** (visible in `Login.jsx`'s own "Development Account" hint box, and confirmed live this session): `adviser.grade6a` / `adviser123`. Other seeded accounts (`admin.educheck`, `subject.grade6a`, `test.subject`, `adviser.grade5a`) exist but their passwords are not recorded anywhere in this repo or its docs — if needed, reset via direct DB update or `admin.educheck`'s User Management screen once logged in.
- **Verify before trusting any visual claim in either handoff doc:** run `npm run build` + `npm run lint` inside `frontend/` — both clean as of this pause.
- **Live DB has real usage data across four sessions now** (v2 + v3 + v4 + whatever's been clicked through since, plus this session's `subjects` seed) — don't wipe `record_submissions`, `notifications`, `students`, or `grade_records` without checking with the user first.
- **Git status:** all of this session's changes are in the working tree, **not yet committed**. Confirm with the user before committing/pushing, same standing norm as always.
