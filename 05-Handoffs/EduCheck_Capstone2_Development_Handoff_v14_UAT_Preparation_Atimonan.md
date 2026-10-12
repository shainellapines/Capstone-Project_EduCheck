# EduCheck Handoff v14 - UAT preparation for Atimonan Central School Annex (2026-10-12)

## Where the project stands
**The software is complete and passes every automated check. The UAT session is not ready yet: the test data needs item 1 below, three decisions are with the capstone adviser, and the documents still need to be written.**

- **Automated checks (2026-10-12):**
  - Backend: 124 of 124 tests pass (`cd backend && npm test`). The tests use their own `educheck_test` database and never touch the UAT data.
  - Frontend: `npm run lint` is clean and `npm run build` succeeds.
  - Mobile: `flutter analyze` finds no issues and 7 of 7 tests pass.
  - `npm audit --omit=dev` finds 0 vulnerabilities in the backend and frontend. The only warning is in `nodemon`, a development tool that the running system does not use.
- **Repository:** the last commit is `cc203d1`. It is **not pushed**. Two files are uncommitted on purpose, waiting for the owner to decide (item 4).

## The UAT plan in short
- **One half-day session** at **Atimonan Central School Annex (ACSA)**, arranged through the team's school contact. One team member attends in person and the others join by video call. The printable plan is `03-Testing/EduCheck_UAT_Plan.pdf`.
- **Section under test:** Rizal, Grade 6, **Departmentalized**. Mabini (Grade 3) is used only for the 4 "must be refused" cases.
- **Testers:**
  - Administrator
  - Principal. If the Principal is unavailable, a Head Teacher or Master Teacher can stand in, as long as Remarks records it.
  - Class Adviser
  - Subject Teacher
  - IT evaluators for the ISO/IEC 25010 ratings
- **Test cases:** `03-Testing/EduCheck_UAT_Test_Cases.xlsx` (68 cases, TC-001 to TC-068). Give testers `03-Testing/EduCheck_Known_Limitations.md` first.

## Done since v13
| Commits | Change |
|---|---|
| `3942781`, `8183c97`, `035c818` | Tidier repository: handoffs moved to `05-Handoffs/`, frontend pages grouped by feature, class-record logic moved into `services/classRecord`. |
| `8da9228` | Removed the leftover `/api/test/adviser` route (v13 item 1). Added the `create-admin` script and a setup README. |
| `1913386`, `aed1289`, `de7a23b` | UAT input files in `03-Testing/UAT-files/`, one valid file per subject in `per-subject/`, and the printable UAT plan. |
| `68ae2b4` | An e-Class Record whose header names another subject is refused (D-08, TC-068). Short names such as Math, AP, EsP and TLE/EPP are accepted. |
| `cc4032c` | The official blank DepEd e-Class Record is filed in `02-Product Design/` as a reference. |
| `ae47639`, `599a6c6`, `ce22493` | Assignments: give one teacher several subjects in one save, show one row per teacher grouped by section, and warn before removing a Class Adviser. |
| `f1bab07`, `77d6f4e`, `61c9813`, `dbc05dd`, `718de4e`, `2720f42` | UI polish: a merged "Records & SF10" menu, the Inter font, an Audit Log grouped by day, an Analytics term trend line and subject range chart, and a two-step upload page. |
| `cc203d1` | A Next steps panel on the Adviser and Subject Teacher dashboards. Section progress now names the missing and flagged subjects. Consolidated Records has search and status tabs. |

### Data set up for UAT (in the database, not in git)
- **Rizal staffing (checked 2026-10-12):**
  - `adviser.grade6a` is the Class Adviser and teaches English, ESP, Filipino and Science.
  - `subject.grade6a` is the Subject Teacher and teaches Araling Panlipunan, MAPEH, Mathematics and TLE.
  - All 8 Grade 6 subjects have a teacher.
- **Submissions:** 12 records are Pending Approval and **none are Approved**. A baseline with any Approved record would block every Rizal upload (D-04).
- **School details** were saved in Settings: ACSA, School ID 108511, Atimonan II District, Schools Division of Quezon, Region IV-A (CALABARZON).
- **Baseline backup:** `UAT-BASELINE_2026-10-12.sql` in the backup folder (default `<home>\EduCheck-db-backups`). **Do not restore `UAT-BASELINE_2026-10-11.sql`.** It was taken before the Departmentalized setup and would undo it.

### Decisions made (do not reopen)
- Subject mismatch: refuse a file whose header names another subject; accept a blank or unrecognized label with a warning (D-08).
- Departmentalized Grade 6 has one Adviser and one Subject Teacher, with 4 subjects each.
- 3 terms are never converted into 4 quarters (see D-05 below for what is still open).

## Why the school details do not appear on the SF10 yet
This is not a bug. The details saved in Settings apply only to years recorded in EduCheck, and those years do not print yet:

1. **Hand-entered years keep their own school.** The demo learner (LRN `100000000001`) has Grade 4 and Grade 5 years entered by hand with "Sample Elementary School (test data)".
2. **Only Approved years print.** The learner's 2025-2026 Grade 6 year is still Not Submitted.
3. **3-term years are left blank (D-05).** Even after approval, Grade 6 is `TERM_3`, and the official SF10-ES (Revised 2025, DO 10 s. 2024) has 4 quarter columns.

## D-05: options for the capstone adviser
| Option | What prints for a 3-term year | Assessment |
|---|---|---|
| A. Keep as is | Nothing; the year is marked "Unsupported" | Honest. No work needed. It stays a documented limitation. |
| B. Convert 3 terms into 4 quarters | Invented quarter grades | **Rejected.** It invents grades on a permanent record. |
| **C. Final rating only (recommended)** | School header, Final Rating, Remarks and General Average. Quarter columns stay blank, with a note. | Honest, and uses the official form. TC-046 becomes testable. Small change to the SF10 adapter. |
| D. A separate 3-term layout | Term 1 to 3 and the Final grade | Honest, but not an official DepEd form, so it must be labeled that way. Medium amount of work. |

**Question for the adviser:** "DepEd has no 3-term SF10 yet. For 2025-2026, may we print the Final Rating, Remarks and General Average on the official form, leave the quarter columns blank, and add a note? Or should the year stay blank until DepEd releases a 3-term edition?"

- **If the answer is C:** update `backend/src/services/sf10/generator.js` (the adapter) and the readiness messages in `cumulativeRecord.js`. Add tests in `backend/tests/sf10.test.js`. Update D-05 in Known Limitations and TC-046.
- **If the answer is A:** only reword D-05 and TC-046 so testers expect the year to be blank.

## Remaining work (in order)

### Team (in the system)
1. **Item 4 from the readiness check:** rename the "Adviser Test" profile to the real Adviser's name in User Management, and set the passwords for `adviser.grade6a`, `subject.grade6a` and `principal.educheck`.
2. **Take the final baseline** after item 1: run `cd backend && npm run backup`, then copy the new file to `UAT-BASELINE_<date>.sql`. Check first that there are 12 Pending Approval records and 0 Approved.
3. **Demo learner:** decide whether the Grade 4 and 5 records of `100000000001` stay "Sample Elementary School" or change to ACSA. If they change, it is a data edit only.
4. **Uncommitted files:** decide whether to commit `01-Project Management/01 - EduCheck_SPMP_v1.0_1.docx` (it has the owner's edits) and `02-Product Design/SF10-ES_100000000001_Aguilar_Adrian.xlsx` (a sample SF10 export). Then `git push`.
5. **Legacy tables (still open from v13):** `academic_records`, `validation_reports`, `sf10` and `submissions` are unused. Either drop them with a migration, or mark them deprecated in the ERD.

### Capstone adviser
6. **D-05:** Option A or C (see above).
7. **D-04:** once any learner is Approved, uploads for the whole section are refused. Is that acceptable?
8. **A signed request letter** to the school.

### School contact
9. **The date and the list of testers** (see "The UAT plan in short").
10. **The missing LRN sheet.** The official e-Class Record has no LRN sheet. Without one, an upload only gets a warning and its learners cannot be consolidated. Choose one:
    - Testers upload the prepared files in `03-Testing/UAT-files/`, which already work.
    - The team makes an LRN sheet template with instructions, and the teachers add it to their own files.

### Documents to write
11. The request letter
12. The consent form
13. The ISO/IEC 25010 questionnaire
14. Login slips, one per tester with their username and password
15. Also from v13: paste the SPMP wording fixes into the .docx and check its formatting in Word.

### Logistics for the day
16. **Network:** use a laptop plus a pocket Wi-Fi or phone hotspot. Don't rely on the school's Wi-Fi. The system is http on a LAN only (L-04).
17. **Mobile:** install the APK. Build it from a `C:\dev` copy, because OneDrive locks `mobile/build`. On the login screen, open "Server address" and enter `http://<laptop-IP>:5000`, using the IP from `ipconfig` on the day.
18. **Web:** make sure testers' browsers can open the frontend at the laptop's IP, not just `localhost`.
19. **Dry run at home** on the same setup (laptop, hotspot and phone): upload, validate, submit, approve, then open the SF10. Restore the baseline afterward.
20. **Print:** the UAT workbook pages, Known Limitations, the questionnaires and the login slips.

## Literal next step
Do item 1 in User Management, then take the final baseline (item 2):
```
cd backend
npm run backup
```
Send the D-05 question to the adviser at the same time, because TC-046 depends on the answer.
