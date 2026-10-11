# EduCheck Capstone 2 — Development Handoff v10
## Design System, Dark Mode, Settings Page, Notification Filters, Git Reconciliation — 12 Commits, All Local (Not Pushed)

**Written:** 2026-09-30, pausing mid-session at the user's request.
**Supersedes context in:** `EduCheck_Capstone2_Development_Handoff_v9_Adviser_Audit_SectionScoping_ScrollFix.md`. v9 is still accurate for what it covers (through commit `576ceaa`); this file picks up from there, across what was actually **two sessions** (dated 2026-09-17 through 2026-09-30 in the conversation, git commit timestamps span 2026-09-29 to 2026-09-30).

---

## 1. Where We Left Off

This stretch covered a lot of ground, roughly in this order:

1. **Git reconciliation** — local `main` had diverged from `origin/main` (a teammate had pushed real mobile-app work via `feature/flutter-mobile-app`, PRs #9–#13). Merged cleanly (no conflicts — disjoint files), then pushed v9's 4 commits into `main` alongside the mobile work.
2. **Analytics "Intervention Flag List"** (SPMP EPIC-08) — was previously just a number (`at_risk_count`); built out into an actual per-student list.
3. **Live-verified the "blocked while Needs Revision" resubmission guard end-to-end** — previously only code-reviewed. Required completing a section's missing subjects live (real uploads) to get a student to "complete" status first. Confirmed working exactly as coded.
4. **Folded migrations 004–007 into `educheck_schema.sql`** — schema file is now current; a fresh DB only needs that one file.
5. **Fixed dead "Validation Results" / "Submission Workflow" sidebar links** — confirmed via SPMP text (subagent-extracted) that these are mobile-only named features, not missing web pages. Removed the dead stubs; added a real entry point on the Adviser's Dashboard (mirroring what Subject Teacher's Dashboard already had).
6. **Removed the dev-credentials box from the login screen.**
7. **Paginated Consolidated Records** (100-student list → 20/page).
8. **A full design system pass** — typography (Lexend/Public Sans), a real color token system, sidebar/login visual overhaul, palette swept across every page.
9. **Notification filter/categorization** — filter pills (All/Unread/Approved/Rejected/Revisions) with live counts; also fixed a stale code comment that only accounted for 2 of the 4 real notification types.
10. **Redesigned the Upload e-Class Record page** — was one narrow card in a lot of dead space; added a guide panel, restyled the dropzone/select.
11. **Fixed dashboard "Recent Uploads" clutter** — Adviser's list capped at 5→4 with a lightened button style; Subject Teacher's list (previously **unbounded**, rendering every upload ever made) capped to 5 with a "Show all" toggle.
12. **Redesigned Academic Analytics with meaningful color** — loaded the `dataviz` skill properly; grade bands are ordinal (green ramp), "Below 75" breaks into reserved red, severity-tiered intervention pills, at-risk row highlighting in the performance tables.
13. **Live-generated real failing-grade test data** — 4 students in Science given genuine failing grades via the actual upload API (not fabricated), so the Intervention Flag List could be demonstrated populated. **This is still live in the dev DB, unreverted — see §9.**
14. **Built out Settings + a real dark theme** — Settings was a dead sidebar link. Added Account Information (new `GET /api/auth/me`), Change Password (new self-service `POST /api/auth/change-password`), and a working Light/Dark toggle backed by a genuine dark-mode token system swept across every page's CSS.

All work this session is **committed locally to `main`, not pushed** — see §8.

---

## 2. Current File Structure (delta from v9)

```text
EduCheck/
├── EduCheck_Capstone2_Development_Handoff_v10_...md          ← this file
├── 02-Product Design/06-Database/SQL/
│   ├── educheck_schema.sql                                    ← CHANGED — folded migrations 004-007 in
│   └── migrations/
│       ├── 004_seed_subjects.sql                               ← CHANGED — "folded, historical record only" note
│       ├── 005_section_staffing_and_assignments.sql            ← CHANGED — same
│       ├── 006_class_record_revision_requests.sql              ← CHANGED — same
│       └── 007_audit_logs.sql                                  ← CHANGED — same
├── backend/
│   └── src/
│       ├── controllers/
│       │   ├── analyticsController.js                          ← CHANGED — intervention_flags in response
│       │   └── authController.js                                ← CHANGED — getMe, changePassword added
│       └── routes/
│           └── authRoutes.js                                    ← CHANGED — GET /me, POST /change-password
└── frontend/
    ├── index.html                                               ← CHANGED — Google Fonts (Lexend/Public Sans), title
    └── src/
        ├── main.jsx                                              ← CHANGED — installTheme() before first paint
        ├── App.css                                               ← CHANGED — full design-token system + dark mode
        ├── App.jsx                                               ← CHANGED — /settings route added
        ├── components/
        │   └── Sidebar.jsx                                       ← CHANGED — dark gradient, role-colored badge,
        │                                                            removed 4 dead nav stubs, Settings link wired
        ├── utils/
        │   └── theme.js                                          ← NEW — get/set/apply theme, localStorage-backed
        └── pages/
            ├── Settings.jsx / Settings.css                       ← NEW — Account Info, Change Password, Appearance
            ├── Analytics.jsx / Analytics.css                     ← CHANGED — intervention list UI, ordinal color,
            │                                                        severity tiers, at-risk row highlighting
            ├── ClassRecordUpload.jsx / .css                      ← CHANGED — guide panel, restyled dropzone/select
            ├── ConsolidatedRecords.jsx / .css                    ← CHANGED — pagination (20/page)
            ├── Dashboard.jsx / Dashboard.css                     ← CHANGED — shared shell tokens, recent-uploads
            │                                                        clutter fix, sidebar/page-bg fix
            ├── Notifications.jsx / .css                          ← CHANGED — filter pills, 4-type visual mapping
            ├── Login.jsx                                          ← CHANGED — removed demo-credentials box,
            │                                                        per-role active tab classes
            └── (every other page .css)                            ← CHANGED — literal hex swept to design tokens
                                                                       (mechanical, no layout changes)
```

Everything from v9's file structure not listed above is unchanged.

---

## 3. Current Database State

- **No schema changes this session beyond the migration fold-up** (§2) — that's a documentation change, not a live schema change (the dev DB already had all those columns/tables from prior sessions).
- **`class_records` / `grade_records`: real new rows from live testing**, all via the actual upload API, never raw SQL:
  - 6 uploads completing Rizal section's missing Grade 6 subjects (to live-test the resubmission guard) — `class_record_id` 37–42, then a 7th re-upload (`43`) to clear a deliberately-triggered "Needs Revision" flag.
  - 3 uploads of a modified Science file with 4 students given genuine failing grades (to populate the Intervention Flag List for a screenshot) — `class_record_id` 44, 45 (both superseded, had validation errors from an initial row-offset mistake), then **46, the live one** — `Validated`, 0 errors, currently the ranked-latest Science upload for Rizal.
- **`record_submissions`: all 100 Rizal students currently sit at `Pending Approval`** (swept there via a real `submit-all` call after the resubmission-guard test cleared a revision flag that had cascaded and reopened 99 previously-`Approved` records — see v9-style reasoning, same session convention of leaving real workflow history in place rather than reverting).
- **⚠️ Known live/uncommitted-to-nothing state**: **4 students in Rizal's Science subject currently have real failing grades** (Fernandez Alyssa=48, Aguilar Adrian=58, Alcantara Angelo=70, Garcia Angela=74) — genuine data from the real upload flow, not fabricated, but **the user has not yet said whether to revert this** (asked twice this session, conversation moved on both times without an answer). **Do not assume either way — ask again next session before touching it.** Reverting means re-uploading Science with the original passing-grade version of the sample file (already exists at `backend/src/uploads/E-Class-Record-Sample-Data-WITH-LRN.xlsx`) via the real upload API as `adviser.grade6a`.
- **`GMRC` stale-subject artifact** (flagged in v9-era testing, confirmed again this session): one old class_record references `subject_id=7` (GMRC, official grade_level='1') attached to a Grade-6 section, from before the real DepEd subject list was seeded. **Explicitly left as-is per user decision this session** — no delete endpoint exists for `class_records` anywhere in the app, and building one wasn't asked for. Cosmetically visible as one row in Analytics' Subject Performance table. Harmless, not worth raw-SQL cleanup.

---

## 4. API Surface Added/Changed This Session

| Method | Path | What |
|---|---|---|
| GET | `/api/auth/me` | **NEW.** Self-service — returns the logged-in user's own `user_id, username, email, role, status, created_at`. Acts on `req.user.user_id` from the JWT only. |
| POST | `/api/auth/change-password` | **NEW.** Self-service — `{ current_password, new_password }`, verifies current via bcrypt, same complexity rule (`/^(?=.*[A-Za-z])(?=.*\d).{8,}$/`) as admin-created accounts. Acts on `req.user.user_id` only — cannot be used to change another account's password (that remains Admin-only via the pre-existing `PUT /api/users/:id`, which still doesn't handle passwords itself). |
| GET | `/api/analytics/school-years/:id` | **CHANGED** (from a prior session, confirmed still correct) — response now includes `intervention_flags: []`, one entry per student below the 75 passing mark, with their failing subjects and lowest grade, sorted worst-first. |

No routes removed. No breaking changes to existing response shapes (only additive fields).

---

## 5. Exact Code Just Finished (most recent work, in order)

### 5a. Design token system (`frontend/src/App.css`)

Previously: three inconsistent brand blues (`#2447b8`/`#2468ed`/`#1769ed`) scattered across files, no shared neutral scale, default system font, a sidebar role-badge that was hardcoded green regardless of actual role.

Now, a real token system in `:root`:
- **Typography**: `--ec-font-heading` (Lexend), `--ec-font-body` (Public Sans), loaded via Google Fonts in `index.html`.
- **Primary blue scale**: `--ec-primary-50/100/400/500/600/700`.
- **Role accents**: `--ec-role-admin/subject/adviser/principal` (+ `-bg` pastel variants) — reused consistently across badges, login role tabs, nav active-states, quick-action cards.
- **Semantic status**: `--ec-success/warning/danger/revision` (+ `-bg`).
- **Severity scale** (distinct from the above — reserved for grade urgency specifically): `--ec-severity-warning/serious/critical`.
- **Ordinal grade-tier ramp**: `--ec-tier-1..4` (green, light→dark = low→high achievement).
- **Neutral scale**: `--ec-slate-50..900`.
- **Surface tokens** (the actual dark-mode switch): `--ec-page-bg`, `--ec-surface`, `--ec-surface-2`.
- **Fixed brand tokens** (deliberately *not* redefined in dark mode): `--ec-sidebar-start/end` — see §5c for why this needed to be separate from `--ec-primary-600/700`.

A parallel sweep (`sed`-based, mechanical) converted ~150 previously-hardcoded literal hex values across every page's `.css` file to reference these tokens instead — this is *why* dark mode reaches almost the entire app instead of just the handful of components that happened to already use `var()`.

### 5b. Dark mode (`App.css`, `utils/theme.js`, `main.jsx`)

`:root[data-theme="dark"]` redefines every token above with a genuinely-designed dark palette (not a mechanical lightness-inversion formula — each step chosen for its actual usage role). `utils/theme.js` (new) owns `localStorage` persistence and applies the `data-theme` attribute; `installTheme()` runs in `main.jsx` **before** `createRoot(...).render(...)` specifically to avoid a flash-of-wrong-theme on load (same pattern as the existing `installSessionGuard()`).

**Bug found and fixed during live verification**: the sidebar's gradient originally reused `--ec-primary-600/700`, which flip *lighter* in dark mode (correct for text/links on a dark page) — this turned the sidebar into pale periwinkle instead of staying dark navy. Fixed by giving the sidebar its own `--ec-sidebar-start/end` tokens that are **not** redefined under `[data-theme="dark"]`, same treatment the login page's gradient already had. Re-verified via screenshot after the fix — confirmed correct.

**Live-verified** (headless Chromium, not just code review): Settings, Dashboard, Consolidated Records, and Analytics pages in both themes, zero console errors, theme persists across navigation and a hard reload.

### 5c. Settings page (`frontend/src/pages/Settings.jsx` + `.css`, new)

Three cards: **Account Information** (read-only, from the new `GET /api/auth/me`), **Appearance** (Light/Dark selector calling `utils/theme.js`), **Change Password** (calls the new `POST /api/auth/change-password`, client-side confirms new/confirm match before submitting). Wired into `App.jsx` (`/settings`, all 4 roles) and `Sidebar.jsx` (was a dead `<a>` with no `onClick`, now navigates and gets an active-state highlight like every other nav item).

### 5d. Notification filters (`Notifications.jsx` + `.css`)

Filter pills — All / Unread / Approved / Rejected / Revisions — with live counts, computed client-side from the already-fetched list (no new endpoint). Along the way, found the code's own comment claiming only 2 notification titles exist was stale — grepped the backend and found 4 real ones (`Submission Approved`, `Submission Rejected`, `Revision Requested`, `Approved Record Needs Amendment`); the latter two were silently falling through to a generic blue bell with no category. All 4 now have distinct icon/tone and group correctly under "Revisions".

### 5e. Academic Analytics color redesign (`Analytics.jsx` + `.css`)

Loaded the `dataviz` skill properly before touching any color (per its own procedure: form → color-by-job → mark specs). Grade distribution bands are **ordinal** (position in a performance sequence), not generic — now a single-hue green ramp light→dark = low→high tier, with "Below 75" breaking the ramp entirely into the reserved danger red (a different *state*, not one more rung down). Fixed real readability bugs this surfaced: zero-count bands were an invisible flat line (indistinguishable from a rendering bug, now a visible marker); the one meaningful bar (4 failing vs. 896 passing) was an invisible sliver (now has a 2% width floor); Section/Subject Performance tables buried the one at-risk row among seven identical zero-rows (now tinted); the Intervention Flag List's severity was flat — a 48 and a 74 looked equally urgent (now a 3-step reserved severity scale, both as a row accent and the grade pill's color).

### 5f. Everything from the earlier half of this session (§1, items 1–7)

Already individually committed with full detail in their own commit messages (see `git log`) — not re-detailed here to avoid duplication. Read the commit messages directly (`git log --oneline` then `git show <hash>` for any of them) if you need the reasoning for a specific one; they're written thoroughly.

---

## 6. SPMP Alignment

- ✅ **EPIC-08 "Intervention flag list"** — closed this session (was a bare count, now a real per-student list, further refined with proper severity color this session).
- No other SPMP line items directly touched this session — the design system / dark mode / Settings work is UI-quality and completeness work the user explicitly asked for, not itself an SPMP checklist item, though it materially improves how demo-ready the whole system looks.
- Everything else carried forward from v9 §6a is **unchanged and still open**: mobile app backend integration (teammate is actively pushing real progress independently — confirmed via `git log -- mobile/` showing PRs #9–#13, not this session's concern), SF10 generation (still externally blocked on DepEd), EPIC-09 formal testing/UAT (still not started — this remains the single largest gap between "demo-ready" and "done").

---

## 7. Live Servers — status at this pause

Both confirmed running at time of writing:
- Backend: `http://localhost:5000` (nodemon, auto-reloads)
- Frontend: `http://localhost:5173`

If picking this up fresh: `cd backend && npm run dev` / `cd frontend && npm run dev` as usual. No new migrations to run.

---

## 8. Literal Next Step

**12 commits this session, all local on `main`, not pushed:**
```
112b490 frontend: Settings page and a real dark theme
a05ab2e backend: self-service account endpoints (GET /me, change password)
c73fb02 frontend: redesign Academic Analytics with meaningful color
069444e frontend: reduce dashboard recent-uploads clutter
8aaf181 frontend: redesign Upload e-Class Record page
cd2dc15 frontend: filter/categorize notifications
aab67fc frontend: cohesive design system pass - typography, palette, nav
b9a17e3 frontend: paginate Consolidated Records list (20 per page)
8f95bc0 frontend: remove dev-account credentials box from login screen
67c0efd frontend: fix dead Validation Results / Submission Workflow nav links
7ee4d4a docs: fold migrations 004-007 into educheck_schema.sql
2804a53 backend+frontend: Analytics intervention flag list (SPMP EPIC-08)
```
`git status` confirms `main...origin/main [ahead 12]`. The user has not said whether to push yet — **ask, don't assume.**

**Immediate open questions for the user, in order of how soon they matter:**
1. **Push these 12 commits, or keep iterating locally first?**
2. **Revert the Science test data (4 real failing grades) or leave it as a working example?** — asked twice this session, still unanswered. Doesn't block anything, but shouldn't be forgotten.

**Smaller open items, no urgency:**
- The `GMRC` stale-subject artifact (§3) — left as-is per explicit user decision, no action needed unless they change their mind.
- Notifications page itself is now filterable but still has no pagination — the same "very long list" pattern that was fixed on Consolidated Records and the dashboards exists here too (50 real notifications in dev from this session's live testing). Not raised as a problem by the user yet; worth a mention if it comes up.
- A handful of small accent-color backgrounds (hover/pill states in `Analytics.css`, `Dashboard.css`, `RecordsRepository.css`, `SectionAssignments.css`) were left as literal hex rather than tokens during the dark-mode sweep — minor, not part of the core neutral/surface system, unlikely to look broken in dark mode but not verified pixel-by-pixel.

**Bigger picture, unchanged from v9**: the two genuinely large remaining pieces are still the mobile app's backend integration (teammate's independent track) and EPIC-09 formal testing/UAT (not started, and now — with the UI/UX pass this session — arguably the *only* major remaining gap on the web side, since SF10 is externally blocked and everything else demoed cleanly this session).

None of the above was requested to be prioritized — listed as informed options, same framing every prior handoff has used.

---

## 9. Operational Notes for Next Session

- **Start backend:** `cd backend && npm run dev` — confirm `EduCheck backend running on http://localhost:5000`.
- **Start frontend:** `cd frontend && npm run dev` — open the printed URL (`5173` this session).
- **No new migration this session** — the schema fold-up (§1 item 4) is a documentation change; dev DB schema is unchanged from v9's end state.
- **Credentials, unchanged from v7–v9:**
  - `admin.educheck` / `admin12345`
  - `subject.grade6a` / `subject12345`
  - `adviser.grade6a` / `adviser123`
  - `principal.educheck` / `principal12345`
  - `test.subject`, `adviser.grade5a` — still no known password; not touched.
- **New self-service capability**: any of the above accounts can now change their own password via Settings → Change Password. If you do this during testing, **write down the new password** — there's no "forgot password" flow, and only an Admin resetting via `PUT /api/users/:id` (which itself still doesn't handle a password field — only an Admin creating a brand-new account sets an initial password) can recover it otherwise. Recommend leaving the seeded credentials alone unless specifically testing that feature.
- **Dark mode**: toggle lives in Settings → Appearance, persists via `localStorage` key `educheck_theme`, per-browser (not per-account, not synced server-side — same caveat as any `localStorage`-backed preference).
- **Live dev-data caveats this session left behind** (all from real API usage, no raw SQL): Rizal section (100 students) is fully complete across all 8 subjects and sitting at `Pending Approval`; 4 of those students have genuine failing Science grades (§3, §8 — revert decision still pending); `audit_logs`/`notifications` tables have accumulated real rows from all this session's live testing (accurate history, not a bug, same convention as every prior session).
- **Git state:** 12 commits made this session, all on `main`, **local only, not pushed**. Working tree is clean except this handoff file itself and the user's own `EduCheck_Chapter4_Results_and_Discussion_Sprints1-3.docx` (both deliberately left uncommitted, same convention as every prior handoff) — confirm with `git status` before starting new work, since the exact untracked-file list may have grown if the user added more personal documents between sessions.
