# EduCheck Handoff v15 - Self-Contained rule, teacher picker, pre-UAT integrity review (2026-10-13 to 2026-10-14), plus UAT fixes and account approval (2026-10-16 to 2026-10-17)

> **Update 2026-10-17:** issues found during the Atimonan UAT, and the account redesign the capstone adviser asked for, are fixed and committed. See **Issues 6 to 8** below. Issue 4 is now decided and built.

## Where the project stands
**Two defects from the owner's manual review, plus three serious and two smaller defects from a pre-UAT code review, are fixed, tested and committed. Some UAT test cases need their wording checked, and three design questions are open.**

- **Automated checks (2026-10-14):**
  - Backend: 147 of 147 tests pass (`cd backend && npm test`). New this session: `tests/self-contained.test.js` (SC-01 to SC-07) and `tests/integrity-hardening.test.js` (INT-01 to INT-12). WF-06 was rewritten for the per-learner lock and WF-06b added.
  - Frontend: `npm run lint` (oxlint) is clean and `npm run build` succeeds.
  - Mobile: `flutter analyze` finds no issues and 7 of 7 tests pass.
  - Not yet checked in a browser: the teacher picker, and the new "not ready" state on Consolidated Records.
- **Repository:** branch `ui-polish-dashboards`, **not pushed**. Other commits landed in parallel during this session (`379aa82`, `0023794`, `d7ff3c4`, `7ebe160`: LAN access, 3-term SF10 printing, SF10 import, the D-04 record and the UAT Day Kit). They touch none of the files changed here.
- **Database:** a backup was taken before the data cleanup: `educheck_db_2026-10-13_2223.sql` in `<home>\EduCheck-db-backups`.

## Done in this session
| Commit | Change |
|---|---|
| `f42d8e2` | Self-Contained sections take the Class Adviser slot only (issue 1) |
| `6ed592e` | Searchable teacher picker with a role filter on Add Assignment (issue 2) |
| next commit | Pre-UAT integrity fixes (issue 5) |
| `74317c8` | UAT fixes: password reset, login autofill, bulk approve, notifications, lock message, mobile paging (issue 6) |
| `db26f6f` | One Accounts page replaces User and Teacher Management (issue 7) |
| `e56a2c5` | Principal approval of accounts, migration 010 (issue 8) |
| `f883966` | Account setup after approval and the emailed temporary password, migration 011 (issue 8) |
| `927613c` | Temporary password must be replaced at first sign-in (issue 8) |

---

## Issue 1 - Subjects listed twice on the upload page

**Reported:** on the Adviser's Upload Files page, the Grade 3 Mabini subjects (Filipino, English, Mathematics, Makabansa, GMRC) each appeared twice. Science appeared once.

**Method (how the cause was found):**
1. **Traced the data source.** The upload page (`frontend/src/pages/records/ClassRecordUpload.jsx`) gets its cards from `GET /api/uploads/options`. That endpoint (`uploadController.getUploadOptions`) builds the list from two queries and joins them with no de-duplication:
   - **Path A:** the teacher's explicit subject assignments (`teacher_assignments.subject_id IS NOT NULL`).
   - **Path B:** for a Class Adviser of a **Self-Contained** section, *every* subject of that grade level.
2. **Queried the live data.** `teacher_assignments` showed that Maria Teresa Santos held the Class Adviser slot of Mabini (Self-Contained, #40) **and** five subject rows in the same section (#41-45). Each of those five subjects came out of both paths. Science came only from Path B, which is why it showed once.
3. **Checked the database constraints.** The schema has two partial unique indexes: one Class Adviser per section and year, and one teacher per subject, section and year. Neither looks at staffing mode, so a subject row in a Self-Contained section was never refused.

**Root cause:** no rule tied subject assignments to staffing mode. Besides the duplicates, there was a worse hole with the same cause: **a second teacher could be assigned a subject in a Self-Contained section, and then both that teacher and the Adviser could upload the same subject.**

**Decision (team owner):** a Self-Contained section is never assigned to a Subject Teacher, and its Adviser covers every subject of the grade level automatically.

**Fix (defense in depth):**
| Layer | File | What it does now |
|---|---|---|
| Business rule (API) | `backend/src/controllers/assignmentController.js` | `POST /assignments` and `POST /assignments/batch` refuse any subject in a Self-Contained section, from any teacher, the Adviser included (409, with a message saying to assign the Class Adviser only). |
| State change guard | `backend/src/controllers/sectionController.js` | Switching a section to Self-Contained is refused while it still has subject assignments. The 409 message names each one (subject, teacher, school year). |
| Output safety net | `backend/src/controllers/uploadController.js` | Upload options are de-duplicated by section, subject and school year, so leftover data can never list a subject twice. |
| UI prevention | `frontend/src/pages/sections/SectionAssignments.jsx` | For a Self-Contained section, Class Adviser is ticked and locked, and the grade's subjects show ticked, locked and "covered" by the Adviser. The form sends `class_adviser: true, subject_ids: []`. |

**Design choice:** the Adviser's subjects are *derived* (worked out at upload time), not stored as separate rows. Storing them would put the same fact in two places, which is what caused the duplicates, and they would go stale if the grade's subject list changed.

**Verification:**
- **New tests SC-01 to SC-07** (`backend/tests/self-contained.test.js`):
  - Subject refused for a Subject Teacher (SC-01), for the Adviser (SC-02) and through the single-assignment endpoint (SC-03). Nothing is saved in any of them.
  - The Class Adviser slot alone gives every subject exactly once (SC-04).
  - A leftover row is not listed twice (SC-05).
  - The staffing switch is refused when subject rows exist (SC-06) and allowed when they don't (SC-07).
- Full suite: 131/131.

**Data cleanup:** the redundant rows #41-45 are removed. The only row left in a Self-Contained section is Mabini's Class Adviser slot (#46).

## Issue 2 - Teacher dropdown does not scale

**Reported:** the Teacher field on Add Assignment was a plain `<select>`, which becomes unusable at around 100 teachers.

**Options weighed:**
- **Pagination:** rejected. The admin already knows the name, so paging is slower than typing it.
- **Separate mandatory "pick a role first" step:** the owner's idea, kept but folded into the search box so it isn't a forced extra step.

**Fix:**
- **New reusable component:** `frontend/src/components/TeacherPicker.jsx` and `.css`.
  - Role filter: `All / Advisers / Subject Teachers`.
  - Search over first name, last name (in either order) and employee number.
  - Scrolling list sorted by last name, showing each teacher's employee number and a role tag.
  - A footer line shows the selection or "N of M teachers shown".
- **Filtering happens in the browser.** The page already loads every teacher, so no extra API calls are needed. This holds up to several hundred teachers.
- **Form order is now Section, School Year, Teacher.** The section decides who is eligible, so for a Self-Contained section the role filter **locks to Advisers** with a note.
  - If a Subject Teacher was already picked and the section is changed to a Self-Contained one, the pick is cleared.
  - Submitting without a teacher shows "Choose a teacher."
- **CSS:** the picker's search input uses `.tp .tp-search input` so the page's `.sa-field input` styles do not leak into it. Only existing `--ec-*` tokens are used, so dark mode is covered.

## Issue 3 - Is "Self-Contained" the right term? (research, no code change)
The Adviser asked whether "Self-Contained" is the term schools really use.

**Finding:** yes, it is DepEd's own wording.
- **DepEd Memorandum No. 291, s. 2008**, restated in DepEd NCR Memorandum No. 105, s. 2015: *"Classes in Grades 1, 2 and 3 MUST be self-contained (one teacher assigned in each section). Only Grades 4-6 will be allowed to utilize departmentalized/team teaching."*
- **Caveat:** the memo was found only in secondary copies (Scribd, Slideshare, a division memo), not on deped.gov.ph. DO 5, s. 2024 (teacher workload) was not found to change it. Ask the school contact to confirm it is still followed.

**Not done, offered:**
- Add a plain-language explanation next to the staffing mode, e.g. "Self-Contained - the Class Adviser teaches every subject".
- Default new Grade 1-3 sections to Self-Contained, with a warning rather than a hard block.

## Issue 4 - Should the Principal approve new accounts? (decided 2026-10-17, built: see Issue 8)
**Raised by the professor.** Today an account is **Active as soon as the admin creates it**. The Principal's role is read-only oversight.

**Recommended design (not approved yet):**
1. New accounts start as **Pending Approval** and cannot log in.
2. The Principal is notified and sees a Pending Accounts list with Approve and Reject (Reject needs a reason).
3. Both actions are written to the audit log.
4. **Role changes that grant access** (for example Subject Teacher to Adviser, or anything to Admin) also need approval. Otherwise the gate can be bypassed by promoting an account later.
5. Deactivation and removing assignments stay immediate, so access can always be removed fast.

**Exempt:**
- The first admin, created by `npm run create-admin`.
- Teacher-to-section assignments, which change too often to approve one by one. The audit log already covers them.

**Why:** separation of duties (the one who creates accounts is not the only one who grants access), and it matches DepEd practice, where the principal issues teacher designations.

**Impact if built:**
- UAT needs a principal account ready, and test accounts pre-approved before the session.
- The SPMP needs a new user story.

**Question to settle first:** include role changes (point 4), or new accounts only?

## Issue 5 - Pre-UAT integrity review (fixed)
**Method:** a read-only review of four areas: upload and validation, approval and locking, SF10 output, and role permissions.
1. Each suspected hole was traced in the code.
2. It was then reproduced with throwaway probe tests against the **test** database (`educheck_test`, rebuilt by the test helper), never the UAT data.
3. Each confirmed hole became a regression test.

**Found sound:**
- Upload authorization and an all-or-nothing transaction per upload.
- The SF10 prints from the frozen approval snapshot, and Adviser SF10 access is limited to their own learners.
- Teachers see only their own uploads and validation results; users see only their own notifications.
- SheetJS 0.20.3 is a patched version, and `npm audit` finds 0 vulnerabilities.

| # | Defect (confirmed by probe) | Fix | Files |
|---|---|---|---|
| 1 | A record could be **submitted and approved with a subject that failed validation or had no final grade**. Completeness only counted subject rows, and the approved snapshot held 2 of 8 blank final grades. The UI showed it as "Ready". | One server rule, `ready_for_submission`: every subject is in, its latest upload is "Validated", and it has a final grade. `subjects_not_ready` lists each failing subject with the reason. Submit, Submit all and **Approve** all enforce it (approval re-checks at decision time). Web and mobile show Ready and the Submit button only when it holds. | `consolidationController.js`, `submissionController.js`, `ConsolidatedRecords.jsx`, `Dashboard.jsx`, mobile `student_record_screen.dart`, `overview_home.dart` |
| 2 | A record **waiting for approval could still be re-uploaded**, so the Administrator approved grades the Adviser never saw. A revision request left a pending record pending. | **Per-learner lock:** Approved **and Pending Approval** learners are skipped by an upload. The rest of the class is saved, and a `LOCKED_LEARNERS_SKIPPED` warning names the locked learners. A file in which every learner is locked is refused (409). A revision request now also sends pending records back to "Amendment Requested" and notifies the Administrators. Approving an already-decided record is refused (guarded `UPDATE`). | `rosterCheck.js` (`findLockedLearners`), `gradeRecordPersistence.js`, `uploadController.js`, `consolidationController.js`, `submissionController.js` |
| 3 | **Two learners sharing an LRN** in one file: the file was "Validated", both rows were saved under one LRN, and the learner's name was overwritten. | The upload is refused (422), naming the learners. Nothing is saved. | `uploadController.js` |
| 4 | **Deactivating an account or changing its role took up to 8 hours** to apply (only checked at login). | `authenticateToken` re-reads the account on every request: an inactive or deleted account gets 401, and the current role is used. | `middleware/authMiddleware.js` |
| 6 | **User management accepted any role text**, the only admin could deactivate themselves (locking everyone out), and an Adviser holding a Class Adviser slot could be given another role. | Roles are limited to admin, principal, adviser and subject, and status to Active and Inactive. An admin cannot deactivate, demote or delete themselves, and the last active admin is protected. A role change is refused while the account holds a Class Adviser slot. A duplicate username or email on update returns 409. | `userController.js` |

**Not fixed (owner's choice, recorded):**
- **#5:** the audit log covers only sections, assignments and SF10 edits, not users, uploads, submissions, approvals or revision requests. Its filter knows only 2 of its 5 entry types. Fix it if the paper claims a complete audit trail.
- **#7:** login reports "inactive" before checking the password.

**Known edge case:** validation errors in a *locked* learner's row still count toward the new upload's status. If they are the only errors, the unlocked learners' subject shows "Needs Attention" although their own rows are fine. Re-uploading after the revision clears it.

**D-04 changed:** the adviser approved the lock after approval on 2026-10-14. That lock now also covers Pending Approval, and it skips learners instead of refusing the whole file, which was the improvement listed then. Tell the capstone adviser. `EduCheck_Known_Limitations.md` (D-04), `UAT-files/README.md` and **TC-041** in the workbook are updated. TC-042 still holds.

---

## UAT workbook needs updates (`03-Testing/EduCheck_UAT_Test_Cases.xlsx`)
Today's rules change what some test cases expect.

| Item | What to change |
|---|---|
| **Instructions sheet** | Commit `7ebe160` updated it for the Departmentalized setup; re-check it against this note. Before that it said *Rizal (Grade 6, Self-Contained)* and *Mabini (Grade 3, Departmentalized, no Class Adviser)*. The live data and v14 say **Rizal is Departmentalized** and **Mabini is Self-Contained** (now with Maria Teresa Santos as Class Adviser, #46). Make the sheet match the baseline that will be restored on the day. |
| **TC-017** | Step 2 order is now "Choose the section and school year, then search for the teacher". |
| **TC-019** | Use a **Departmentalized** section without a Class Adviser. In a Self-Contained section a Subject Teacher cannot be picked at all, so the "needs an Adviser account" note never appears there. |
| **TC-020** | **Rizal can no longer be switched to Self-Contained**, because it has subject teachers and is now refused with a message listing them. Use Mabini, or add that refusal as the expected result. |
| **New cases (suggested)** | (a) Assigning a subject in a Self-Contained section is refused. (b) A Subject Teacher is not selectable for a Self-Contained section. (c) Teacher search finds a teacher by part of a surname. |

**Baseline warning:** the dev database was edited during this session (Mabini rows #40-46). Before UAT, restore the official baseline and confirm it already follows the Self-Contained rule. If it still holds subject rows in a Self-Contained section, a staffing switch or a re-assignment on the day will be refused.

## Issue 6 - Problems found during UAT (fixed 2026-10-16)
**Source:** the Atimonan UAT (one section). The session was guided and rushed, with no orientation, so some problems came from unfamiliarity rather than defects. Commit `74317c8`.

| # | Problem reported | Cause | Fix |
|---|---|---|---|
| 1 | The adviser's username and password were already filled in on the login page (web) | The browser's saved password on a shared laptop. On mobile, the grey sample text `e.g. adviser.grade6a` also looked like a default. | **Web:** the login fields stay read-only until clicked, so the browser cannot fill them as the page opens. **Mobile:** the hint now says "Enter your username", and the login is not offered to the phone's password manager. **On the laptops:** delete the saved EduCheck passwords in Chrome. |
| 2 | "Reset password does not work; the password the admin set still logs in" | Changing one's own password worked (AUTH-08). The real gap: **the admin could not reset another user's password at all**, although the login page says resets go through the admin. The autofill in #1 also kept filling the old password. | The admin can reset a password from Edit (now in Accounts). The old password stops working at once, and the Audit Log records that a reset happened, never the password. |
| 3 | Teachers could not re-upload because records were locked | Working as designed (D-04): Pending and Approved learners are locked. Teachers did not know who unlocks them or how. | The lock stays. The message now **names the Class Adviser and the steps** (Consolidated Records, expand the learner, Request Revision on the subject), and **the Adviser is notified automatically** ("Upload Blocked by Locked Records"). |
| 4 | Long student and approval lists on mobile | Mobile showed the whole list at once. | The learner list and My Uploads show **20 per page** with Previous/Next; a new page starts at the top. |
| 5 | Approving learners one by one is slow | The admin could only approve one record at a time. | **Checkboxes, "Select all pending" and "Approve selected"** on Submission Review. Each record gets the same checks and snapshot as a single approval; any that fail are skipped and listed. Rejection stays one at a time (each needs a reason). Bulk approval sends one summary notification per person. |
| 6 | Old notifications pile up | Notifications could only be marked read. | **Web:** delete per notification and **Clear read**. **Mobile:** swipe left to delete, and Clear read. Unread ones are never cleared. |
| 7 | How to bring in old handwritten SF10s; can a photo be attached? | SF10 import reads the Excel SF10 only. | **Not built.** Earlier years can already be typed in by hand on the Permanent Record page (US-014). Reading grades from a photo is unreliable, so attaching a scan is future work for Recommendations / Known Limitations. |

**Also fixed:** a wrong *current* password returned 401, which both apps treat as an expired session, so one typo signed the user out. It now returns 400.

## Issue 7 - User Management and Teacher Management confused the adviser (fixed 2026-10-17)
**Reported by:** the capstone adviser. Adding a teacher took two pages and a hidden step: create the account, note its **User ID**, then type that ID into Teacher Management. Both pages listed mostly the same people.

**Fix (commit `db26f6f`):** one page, **Accounts**.
- One **Add Account** form. Choosing Subject Teacher or Class Adviser shows the teacher fields (name, contact) in the same form; the server saves the account and the teacher profile **together or not at all**.
- The username is suggested from the email (`juan.delacruz@deped.gov.ph` gives `juan.delacruz`).
- **New and changed emails must end in `@deped.gov.ph`.** Existing accounts keep their old address until it is edited.
- The table shows the real name first, then role, employee no., email and status, all searchable.
- The old `/users` and `/teachers` links redirect to `/accounts`. The admin dashboard's "Teacher Management" quick action became "Section Assignments".

## Issue 8 - Principal approval and DepEd email onboarding (built 2026-10-17)
**Requested by:** the capstone adviser. This decides Issue 4.

**The flow:**
```
Admin adds account  ->  Principal approves  ->  Admin finishes setup      ->  Teacher gets email
(no password yet)       (Awaiting Setup)        employee no. + temporary      signs in, must set
                                                password -> Active            their own password
```

| Stage | Commit | What it does |
|---|---|---|
| Principal approval | `e56a2c5` (migration **010**) | New accounts start as **Pending Approval**. The Principal is notified, sees an alert on the dashboard, and decides on a new **Account Approvals** page (Reject needs a reason). A **role change that gives more access** also waits; removing access applies at once. The Principal cannot approve their own account. Correcting a rejected account sends it back. Decisions go to the Audit Log, and the admin is notified. With no active Principal (first setup), approval is skipped. |
| Setup and email | `f883966` (migration **011**) | After approval the admin clicks **Finish setup**: employee no. (teachers) and a temporary password (typed or **Generate**). The account becomes Active and the username and temporary password are **emailed to the DepEd address** from `educheckg10@gmail.com` (nodemailer 10.0.14). If the email cannot be sent, the admin sees the password on screen to hand over. Password resets are emailed the same way. |
| First sign-in | `927613c` | A temporary password must be replaced first: a **"Set your own password"** screen on web and mobile. Until then the server refuses every other request (403 `PASSWORD_CHANGE_REQUIRED`), and the new password must differ from the temporary one. |

**Decisions made by the owner:** role changes that give more access need approval; email must end in `@deped.gov.ph`; the Principal approves all new accounts (including Admin and Principal), skipped only when no active Principal exists; the sender is `educheckg10@gmail.com`.

**Note for the paper:** the Principal is no longer purely view-only. Approving accounts is their one action, so the SPMP needs **US-015** (account approval and setup) and an updated **US-008**.

## Automated checks (2026-10-17)
- Backend: **178 of 178** tests pass. New: `notifications.test.js`, `bulk-approve.test.js`, `accounts.test.js`, `account-approval.test.js`, `account-setup.test.js`, plus AUTH-11 and new role-matrix rows. Emails in tests go to an outbox file, never to a real address.
- Frontend: `npm run build` succeeds. Mobile: `flutter analyze` is clean and 7 of 7 tests pass.
- **Not yet checked in a browser or on a phone**, and **no real email has been sent yet.**

## Before the next session (from Issues 6 to 8)
1. **Apply migrations 010 and 011** to `educheck_db`, in order. Without them the Accounts page fails.
2. **Set `SMTP_PASS`** (Gmail app password) and `APP_URL` in `backend/.env`; see `.env.example`.
3. **Run the whole account flow once in a browser**, with a DepEd email you can open (check spam).
4. **Rebuild the APK** from the `C:\dev` copy (mobile login, paging, notifications and the change-password screen changed).
5. **Clear saved passwords** in Chrome on the UAT laptops.
6. **Update the UAT Day Kit and workbook:** "Accounts" and "Account Approvals" replace User Management and Teacher Management (for example TC-017 and TC-019), and **UAT test accounts must be approved and set up beforehand**.
7. **Update the SPMP** (US-015, US-008) and **Known Limitations** (email needs internet; photo SF10 import is future work; mobile alerts only while the app is open, L-01).
8. **Follow-up session:** a short orientation first, then the **ISO 25010 questionnaire**, which was missed.

## Decisions made (do not reopen)
- **Self-Contained:** Class Adviser slot only. No subject rows for anyone, and Subject Teacher accounts cannot be assigned. The rule is enforced in the API, not only in the UI.
- **The Adviser's subjects in a Self-Contained section are derived, not stored.**
- **Teacher selection:** search plus a role filter, no pagination.
- **"Self-Contained" and "Departmentalized"** stay as labels, because they are DepEd terms.
- **Inactive accounts** still appear in the teacher picker. The owner chose to leave this for now.
- **Accounts (2026-10-17):** one Accounts page; DepEd emails only; the Principal approves new accounts and role raises; the admin gives the employee number and a temporary password after approval; the temporary password must be replaced at first sign-in.
- **D-04 lock stays.** The fix for UAT issue 3 was a clearer message and an Adviser notification, not loosening the lock.

## Open items (in order)
1. **Check the teacher picker in a browser:** light and dark mode, the Self-Contained lock with Mabini, and search by surname.
2. **Update the UAT workbook** as in the table above, and re-check the baseline.
3. ~~Decide on Principal account approval~~ Done: built as Issue 8. Follow the list "Before the next session" above.
4. **Decide on the Self-Contained explanation text and the Grade 1-3 default** (Issue 3).
5. **Tell the capstone adviser about the D-04 change** (issue 5, fix 2).
6. **Decide on audit log coverage** (issue 5, #5) if the paper claims a full audit trail.
7. **Re-take the UAT baseline** after these fixes and dry-run it. The Day Kit's order still works: uploads now skip pending learners instead of failing.
8. **`git push`** once the team is happy.

## Literal next step
Open Section & Teacher Assignments, then click Add Assignment:
```
cd backend && npm run dev
cd frontend && npm run dev
```
Pick Mabini and confirm that only Advisers can be chosen and that every Grade 3 subject shows as covered. Then update TC-017, TC-019 and TC-020.
