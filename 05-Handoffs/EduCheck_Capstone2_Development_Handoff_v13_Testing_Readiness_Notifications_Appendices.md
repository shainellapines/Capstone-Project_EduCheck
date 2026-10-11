# EduCheck Handoff v13 - Testing readiness, completeness fix, profiles, mobile re-skin, notifications, SPMP appendices (2026-10-10)

## Where the project stands
**Development is complete. EduCheck is ready for formal testing and UAT.**
- **Built and tested:** every SPMP module and role on web (React), mobile (Flutter) and backend (Node/Express/PostgreSQL).
- **Tests:**
  - 105 backend tests pass (`cd backend && npm test`).
  - 7 mobile tests pass (`cd mobile && flutter test`).
  - `npm audit` reports no vulnerabilities.
- **Repository:** everything is committed and pushed to `main`. The last commit is `d9dcf29` and the working tree is clean.
- **Hand-off v12 items:** all closed except work that people have to do, such as running UAT and checking the documents in Word. See "Remaining work".

## Done this session (8 commits)

| Commit | What changed |
|---|---|
| `d8ee019` | **Dependency vulnerabilities patched.** `xlsx` now comes from the SheetJS CDN (0.20.3), because the npm copy is unmaintained. `npm audit` is clean. |
| `057c91d` | **Pre-testing hardening:**<ul><li>Uploads are limited to 10 MB and one file. Larger files get a clear 413 error.</li><li>The server refuses to start if `JWT_SECRET` is missing or still `change-me`.</li><li>One lint warning fixed.</li><li>New `03-Testing/EduCheck_Known_Limitations.md` (L-01..L-05, D-01..D-07).</li></ul> |
| `763957f` | **UAT workbook:** `03-Testing/EduCheck_UAT_Test_Cases.xlsx`. It has 67 cases and sheets for Instructions, Test Cases, Summary and Defect Log. |
| `7e5a80b` | **Completeness bug fixed.** A learner's completeness now counts only the subjects of the learner's own grade level for that school year. The "10/8 subjects" problem cannot happen again. **Class Adviser rule:** the Class Adviser slot now accepts only accounts with the Adviser role, checked on both the backend and the frontend. |
| `105a9c4` | **Teacher profiles:**<ul><li>Login and `/auth/me` return the teacher's full name and profile.</li><li>Settings shows Full Name, Employee No., Contact and a My Assignments card. These are read-only; the Administrator edits them.</li><li>Dashboards greet users by their real name.</li><li>The mobile Profile screen shows the same details.</li></ul> |
| `3a1d8c6` | **Mobile re-skin:**<ul><li>The mobile app now uses the web design-system palette (teal `#14545E`, paper background).</li><li>Status colours and wording match the web StatusBadge.</li><li>The official EduCheck logo is used on the login screen, the app header, the launcher icon and the web favicon and sidebar.</li><li>Tapping a notification opens the related tab.</li></ul> |
| `8842c12` | **Submission alerts:** Administrators are notified when an Adviser submits a record for approval. One submission sends one alert. "Submit all" sends one summary alert. |
| `d9dcf29` | **Upload alerts:** the uploader is notified when validation finds errors or warnings. **Backup command:** `cd backend && npm run backup` runs pg_dump to `~/EduCheck-db-backups` and keeps the newest 14 backups. Its settings are in `.env.example`. |

### Data and setup (not in git)
- **Dev data cleanup:**
  - Deleted the two bad uploads that caused "10/8 subjects": class_records 21 and 29.
  - The backup taken first is at `OneDrive\Documents\EduCheck-db-backups\educheck_db_before_cleanup_2026-10-10.sql`.
- **SF10 demo learner:**
  - LRN `100000000001` (Adrian Aguilar) now has sample Grade 4 and Grade 5 history, so the SF10 is downloadable.
  - Readiness is PARTIAL. This is expected; see D-05.
- **Mobile APK:**
  - Rebuilt with the new skin and installed on a real phone.
  - Location: `mobile/build/app/outputs/flutter-apk/app-debug.apk`.
  - Build it from a copy outside OneDrive, because OneDrive locks `mobile/build`.
  - In the app, set the server address to `http://192.168.1.6:5000` (this PC on the LAN).
- **SPMP Appendices A–E:**
  - Written as a Claude Doc: https://claude.ai/code/artifact/3190464d-ff74-48ac-8956-5ee5bb36b5c3
  - A: backlog with status and test IDs.
  - B: ERD and table list.
  - C: 51 API endpoints.
  - D: Figma link and 22 screenshots.
  - E: sprint templates.
  - Export it to Word to attach to the SPMP.
- **SPMP audit:**
  - Checked the code against the SPMP.
  - The gaps found were closed by `8842c12` and `d9dcf29`.
  - The suggested wording fixes for the .docx were given in the chat and have **not been pasted into the .docx yet**.

### Decisions made (do not reopen)
- Subjects are counted per grade level for each school year, following MATATAG. Subject lists are configurable by the Administrator.
- Profile details are read-only for users, because accounts are managed centrally.
- A school year recorded in 3 terms is shown as "Unsupported" on the 4-quarter SF10. EduCheck never converts 3 terms into 4 quarters (D-05). This is pending the adviser's agreement.
- Mobile alerts use 30-second polling while the app is open. There are no push notifications (L-01).

## Remaining work (in order)

### Small code fixes (logical next fixes, about 30 minutes in total)
1. **Remove the leftover dev route** `GET /api/test/adviser` in `backend/src/server.js` (around line 96). It is harmless because it requires the Adviser role, but it is test code.
2. **The 4 unused legacy tables:** `academic_records`, `validation_reports`, `sf10` and `submissions` are in the schema but nothing in the code uses them.
   - Decide whether to drop them or to mark them deprecated in the ERD. The question is a comment in the appendices Doc.
   - If they are dropped, add a migration and run the tests again.

### Before UAT
3. **Prepare the test accounts:** rename the "Adviser Test" profile to a realistic name and set the testers' passwords.
4. **Take a backup:** run `npm run backup` before each test round. Optionally, schedule it in Windows Task Scheduler:
   `schtasks /Create /SC DAILY /ST 18:00 /TN "EduCheck DB Backup" /TR "cmd /c cd /d <repo>\backend && npm run backup"`
5. **Check an SF10 by eye:** open the SF10 for LRN `100000000001` in Excel.

### Testing (Sprint 9)
6. **Run the UAT:** use `03-Testing/EduCheck_UAT_Test_Cases.xlsx`. Give testers `EduCheck_Known_Limitations.md` first. Record defects in the Defect Log sheet.
7. **ISO/IEC 25010 evaluation:** usability, performance, compatibility and security. Take screenshots for Chapter 4.

### Documents
8. **Update the SPMP .docx:**
   - Paste in this session's wording fixes.
   - Export the Appendices Doc to Word and attach it.
   - Open the SPMP and the Role Features .docx files in Word and check the formatting. This is still pending from v12.
9. **Get the adviser's decision** on 3-term years in the SF10 (D-05). Update the Known Limitations doc if it changes.

### Only if deploying beyond the LAN
10. **Hosting:**
    - Serve the app over https.
    - Build a release APK, not the debug APK.
    - Set `VITE_API_URL` (`frontend/src/config.js`) and `CORS_ORIGIN` to the real addresses.

## Literal next step
Remove the dev route (item 1), run `cd backend && npm test`, and commit:
```
git commit -am "Remove leftover adviser test route"
git push
```
Then take a backup and start UAT (items 3-6).
