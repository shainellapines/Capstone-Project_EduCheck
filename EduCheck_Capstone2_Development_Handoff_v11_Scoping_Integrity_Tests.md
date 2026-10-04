# EduCheck Handoff v11 - Adviser scoping, upload integrity, test suite (2026-10-04)

## Done this session
- **Login fix:** `backend/.env` was missing (gitignored), so every login returned 500. Added `backend/.env.example`; the real `.env` exists locally only (`DB_NAME=educheck_db`, `DB_USER=postgres`).
- **Migration 008** (applied to dev DB, folded into `educheck_schema.sql`): `section_enrollments(lrn, school_year_id, section_id)` as the per-year class roster, backfilled with 100 rows, and `record_submissions.snapshot JSONB`.
- **Adviser read scoping** (`utils/sectionScope.js`): consolidation list, student detail, upload summary, section progress, analytics and repository now return only the Adviser's own section; `?section_id` outside it is 403; Admin/Principal unchanged; an unassigned Adviser gets an empty list. Section progress counts now come from `section_enrollments` (correct per school year).
- **Upload integrity** (`controllers/rosterCheck.js`): 409 if a learner is enrolled in another section this year; 409 if the file has zero overlap with an existing roster; warning for learners not on the roster; warning (never block) if the INPUT sheet header (J7/Q7/Y7/Y5) disagrees with the selection; first upload into an empty section establishes the roster. Warnings come back as `integrity_warnings` and are shown on the upload page.
- **Grade-level check:** `createAssignment` and upload reject a subject whose grade level differs from the section's. No bad rows exist in the dev DB.
- **Approval snapshot:** approving stores grades, teachers and the Adviser name in `record_submissions.snapshot`; reject/resubmit clears it.
- **Re-upload guard:** an upload that touches an Approved learner is 409 until the Adviser requests a revision (which already reopens the record to `Amendment Requested`).
- **SEC-07 fixed:** `/api/parser-test` is Admin-only and deletes its temp file.
- **Tests:** `cd backend && npm test`, 73 tests, isolated `educheck_test` DB. Coverage map: `03-Testing/EduCheck_Automated_Test_Coverage.md`.

## Not done / next (in order)
1. Formal testing and UAT with real users (usability, performance, compatibility; Chapter 4 screenshots).
2. SF10 foundation (Part 2 of the earlier plan): `historical_academic_records`, cumulative-record builder, preview page, adapter for the current 4-quarter form. Three-term data must not be converted.
3. Mobile app backend integration (no HTTP client, push or offline cache yet).
4. Housekeeping: deployment and backups, SPMP appendices, notifications pagination, forgot-password flow, Science failing-grade test data (keep or revert, still undecided).

## Notes
- The earlier pasted handoff mentioned commits `d0f9393` / `87d0fa7` and `03-Testing/`; they are not in any branch of this clone. This suite was written fresh. If that work turns up on another machine, reconcile before merging.
- Nothing is pushed. The 73 tests need a Postgres user that can create databases.

---

## Addendum (2026-10-05): SF10 foundation

- **Migration 009** (applied to dev DB, folded into the schema): `historical_academic_records`, `historical_subject_grades`, `school_settings`, `students.name_extension`.
- **Template:** the official SF10-ES (Revised 2025) copy now lives at `backend/src/services/sf10/templates/sf10-es-revised-2025.xlsx`. All grade-block header cells were verified (Front: underlined value cells; Back: inline "School: ____" labels whose underscore runs are replaced). `sf10Structure.js` updated; key `araingPanlipunan` renamed `aralingPanlipunan`.
- **Writer:** `services/sf10/xlsxTemplate.js` edits the sheet XML in place (via `jszip`), so images, the 5 checkbox controls and all 870 merges survive. Calc chain is dropped and `fullCalcOnLoad` set so Excel recalculates cleanly.
- **Builder/readiness:** `services/sf10/cumulativeRecord.js` merges approved EduCheck years (from the approval snapshot) with hand-entered years and reports per-grade status (Complete / Partial / Missing / Unsupported / Unavailable) plus issues. Final rating and general average are computed as whole numbers (DO 8 s. 2015) when not entered.
- **Generator:** `services/sf10/generator.js` has a template registry with one adapter that declares `QUARTER_4` only. EduCheck's own years are `TERM_3`, so they show in the preview but stay blank on the form until DepEd releases a 3-term SF10 (then add an adapter; nothing else changes).
- **API** `/api/sf10`: `GET/PUT /settings` (PUT admin), `GET /students/:lrn` (preview), `GET /students/:lrn/download` (admin, own-learner adviser; 409 when nothing is fillable), `PUT /students/:lrn/profile`, `PUT /students/:lrn/history`, `DELETE /students/:lrn/history/:id`. Principal is read-only; subject teachers are blocked.
- **Frontend:** new page `/permanent-record/:lrn` (readiness, learner details, school details for admin, Grade 1-6 cards, earlier-year entry grid, Generate button), linked from each Records Repository result.
- **Tests:** 91 total, `sf10.test.js` adds SF-01 to SF-13.
- **Not verified by eye:** I could not open the generated workbook in Excel here (no Excel/LibreOffice on this machine). Values were checked by reading the file back. Open one generated SF10 in Excel before demoing.
