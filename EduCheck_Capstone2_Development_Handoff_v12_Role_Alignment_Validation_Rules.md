# EduCheck Handoff v12 - Role alignment audit, SPMP fixes, validation rules card (2026-10-07)

## Where the project stands
Feature development is essentially complete. Every SPMP module and role is built on web (React), mobile (Flutter) and backend (Node/Express/PostgreSQL), and all 92 backend tests pass (`cd backend && npm test`). What remains is finishing, verification and deployment work (Sprint 9).

**Nothing from this session or the v11 mobile work is committed.** About 70 files are changed on `main` (last commit `20eee31`).

## Done this session

### 1. Role audit (SPMP vs code)
- Checked the SPMP (`01-Project Managemet/01 - EduCheck_SPMP_v1.0_1.docx`) and `EduCheck_Role_Features.docx` against every web route, sidebar, page, mobile screen and backend route guard.
- Result: roles are correctly enforced everywhere. No screen lets a role do something its SPMP role forbids. Adviser data is section-scoped via `backend/src/utils/sectionScope.js`, and the Principal is view-only on web, mobile and backend.

### 2. Code changes (uncommitted)
| Change | Files |
|---|---|
| Analytics header says "Performance Analytics / Your section's…" for Advisers instead of "School-wide" | `frontend/src/pages/Analytics.jsx` |
| "Upload Files" hidden (sidebar and dashboard quick action) for Advisers with no upload options, i.e. Departmentalized sections | new `frontend/src/utils/uploadAccess.js` (`useCanUpload` hook), `frontend/src/components/Sidebar.jsx`, `frontend/src/pages/Dashboard.jsx` |
| Repository search: new optional `school_year_id` filter (grades or section enrollment in that year); a school year alone is a valid search; Adviser scoping kept; invalid id gives 400 | `backend/src/controllers/repositoryController.js`, `frontend/src/pages/RecordsRepository.jsx` + `.css` |
| New test "repository search filters by school year (EPIC-07)" | `backend/tests/scoping.test.js` |
| Read-only **Validation Rules** card in Settings (Administrator only): 11 rules, each tagged Upload rejected / Record flagged / Warning only | `frontend/src/pages/Settings.jsx` (`VALIDATION_RULES`), `frontend/src/pages/Settings.css` |

Verified: 92/92 backend tests pass, oxlint clean on changed files, `npm run build` succeeds. **Not viewed in a browser.**

### 3. Document changes (both .docx edited in place; originals were backed up only to a temp scratchpad)
**SPMP:**
- §2.4 / §6.2: teachers fix flagged entries by correcting the file and **re-uploading**.
- §2.4 / §6.2: Admin "configure[s] school and SF10 settings". Validation rules follow DepEd Order No. 8, s. 2015 and are **fixed by design**, viewable read-only.
- §4 item 8 renamed "Offline Status Caching (Mobile)" (M-10 only).
- §4 item 9 adds a note on hand-entered pre-EduCheck grades (US-014).
- §6.1 new module: Notifications.
- §6.5:
  - M-05 users are now "Adviser, Administrator, Principal (read-only)" (no Subject Teacher).
  - New **M-11 Adviser Review Actions**.
  - The intro and out-of-scope wording no longer mention rule configuration.
- §8.3: EPIC-04 gets the read-only rules list; EPIC-06 gets notifications.
- §8.4:
  - US-005 rewritten as "As a System…".
  - US-010 moved to the Submission Workflow epic.
  - New US-012 (Adviser section analytics), US-013 (Adviser repository search), US-014 (pre-EduCheck grade entry).
- §11: offline risk mitigation reworded.

**Role Features:**
- The Subject Teacher, Adviser, Principal and Admin lines are updated to match.
- "Inconsistencies to resolve" became "Inconsistencies (resolved 7 October 2026)", with 8 items, each stating its resolution.

Both files open without errors in python-docx. **They have not been opened in Word yet.**

### 4. Decisions made (do not reopen)
- Validation rules are **not configurable** (they come from DepEd, and §6.3 excludes changing the grading formula). The Admin only views them.
- Correction is by **re-upload**, not inline editing.
- The Principal is view-only everywhere. Mobile alerts use polling, not Firebase (from v11).

## Remaining work (in order)
1. **Commit and push everything** (about 70 files: the v11 mobile rewrite, SF10 work and this session).
2. **Clean dev test data:** the Rizal learners show "10/8 subjects" (a reused sample file left a Grade 1 GMRC upload and a Grade 3 Filipino upload). This is a data decision, not a code bug.
3. **Test the mobile app on a real Android phone** (`mobile/build/app/outputs/flutter-apk/app-debug.apk` exists). Press approve, return and submit against dev data.
4. **Open a generated SF10 in Excel** and check it by eye.
5. **Formal testing and UAT:** usability, performance, compatibility and security (ISO/IEC 25010), plus Chapter 4 screenshots.
6. **Open both .docx files in Word** and check the edits and formatting.
7. Only if hosting beyond localhost:
   - Replace the hard-coded `http://localhost:5000` in 20 frontend files with one config value (e.g. `import.meta.env.VITE_API_URL`).
   - Use https for the mobile app.
   - Set up database backups.
8. **Document as limitations** (or fix):
   - Mobile alerts arrive only while the app is running (`Timer.periodic` in `mobile/lib/core/notifications/notification_poller.dart`).
   - There is no forgot-password flow (Admin resets via User Management).
   - Notifications are capped at 50 with no paging.
9. **SPMP appendices A–E** (full backlog, ERD, API list, wireframes, sprint templates).

## Literal next step
Commit the current working tree. Branch first if the team wants a PR; otherwise commit to `main` as before. Then push:
```
git add -A
git commit -m "Role alignment: adviser analytics header, hide upload for departmentalized advisers, repository school-year filter, read-only validation rules; SPMP and Role Features updates"
git push
```
After that, start on item 2 (test-data cleanup).
