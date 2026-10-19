# EduCheck - Known Limitations and Expected Behaviour

Read this before formal testing and UAT. Each item below is a known, accepted
limitation or a design decision, so testers should not log it as a defect.
If something behaves differently from what is described here, that **is** a
defect and should be reported.

## Known limitations

| # | Area | Limitation | Workaround / reason |
|---|---|---|---|
| L-01 | Mobile notifications | Alerts arrive only while the mobile app is open. The app checks the server every 30 seconds. There are no push notifications when the app is closed. | Open the app to see new alerts. Polling was chosen over Firebase so the system runs on a local network with no third-party service. Tapping an alert opens the related list (for example, the Administrator's Approvals). |
| L-02 | Passwords | There is no "forgot password" link. Users cannot reset their own password. | The School Administrator resets it in Accounts (Edit, Reset Password). The new password is emailed to the user's DepEd address when there is internet, and must be replaced at the next sign-in. The login page says resets go through the Administrator. |
| L-03 | Notifications list | Only the 50 most recent notifications are shown, with no paging. | Older notifications are kept in the database but not listed. |
| L-04 | Hosting | The system is set up for a local network (localhost or a LAN address) over plain http, with no https. Database backups are a command (`cd backend`, `npm run backup`) and are not scheduled automatically until someone adds it to Windows Task Scheduler. | https is out of scope for the capstone deployment and is required before any internet-facing use. Run the backup before each test round and on a schedule. |
| L-05 | Profile details | Users cannot edit their own name, email or contact number. Settings shows them read-only. Admin and Principal accounts have no name, because names belong to teacher profiles, so EduCheck shows their username. | The Administrator updates details in Accounts. Accounts are managed centrally on purpose. |
| L-06 | Account emails | The email with the username and temporary password needs internet on the server laptop. It is sent from educheckg10@gmail.com and may land in the spam folder. | If the email cannot be sent, the account is still activated and the Administrator sees the temporary password on screen to hand over in person. |

## Design decisions (expected behaviour, not defects)

| # | Behaviour | Reason |
|---|---|---|
| D-01 | Validation rules cannot be edited. Admin sees them read-only in Settings. | The rules come from DepEd grading policy. Changing the grading formula is out of scope (SPMP §6.3). |
| D-02 | Grades are corrected by re-uploading the e-class record, not by editing cells in EduCheck. | The teacher's Excel file stays the single source of truth. |
| D-03 | The Principal can view every record but cannot approve, upload or edit records. Their one action is approving or rejecting accounts in Account Approvals (D-10). | Records stay view-only for the Principal. Account approval was added on the capstone adviser's request (2026-10-17). |
| D-04 | A learner whose record is Approved or Pending Approval is locked until the Adviser requests a revision. Because an e-Class Record covers the whole class, an upload still saves every other learner and lists the locked ones as not updated; only a file in which **every** learner is locked is refused. | Approval freezes a snapshot, and the Administrator must approve exactly what the Adviser submitted. A silent change in between would make either inaccurate. The lock after approval was confirmed by the capstone adviser (2026-10-14); on 2026-10-14 it was extended to Pending Approval records, and the upload now skips locked learners instead of refusing the whole file (the improvement listed at that time). |
| D-05 | A school year graded in 3 terms is printed on the official SF10-ES form using only three of that year's four rating columns, relabelled T1, T2 and T3; the fourth column is left blank. 4-quarter years on the same form are printed as before. A year is printed only after it is Approved, so a learner whose only year is still pending gets the "nothing to put on the SF10 yet" message. | DepEd has not released a 3-term SF10. On the capstone adviser's direction the current form is kept and the term grades are printed as recorded; EduCheck never converts terms into quarters, because that would invent grades. |
| D-06 | Uploads must be Excel e-class record workbooks of 10 MB or less. | A real e-class record is about 2 MB. The limit stops oversized files. |
| D-07 | After 10 failed login attempts within 15 minutes, further attempts from that device are blocked until the 15 minutes pass. | Protects accounts against password guessing. Successful logins are not counted. |
| D-08 | An e-Class Record whose header names a different subject from the one selected is refused (for example an English file uploaded as Mathematics). A blank subject cell, or a label EduCheck does not recognise, is accepted with a warning. Common short names are accepted: Math, AP, EsP, GMRC, TLE/EPP, and MAPEH or its parts. | Uploading the wrong subject's file would save its grades under the selected subject. Each subject has its own e-Class Record, so the header (cell Y7 of the INPUT sheet) must name the subject being uploaded. |
| D-09 | Earlier years can be typed in or imported from the learner's existing SF10-ES Excel file (same official edition). The import shows a preview and saves only the years the user ticks. A file with another learner's LRN is refused. Years written in older SF10 editions, or with hand-edited labels, may not be read and must be typed in. Importing a scanned or photographed SF10 is not supported (future work). | The import reads the official form's cell layout. Saving through the normal entry keeps the same validation and audit log as typed years. |
| D-10 | A new account cannot sign in until the Principal approves it and the Administrator finishes its setup (employee number and a temporary password, which must be replaced at first sign-in). A role change that gives more access also waits for the Principal; removing access applies at once. Account emails must end in @deped.gov.ph. When there is no active Principal account (first setup), new accounts skip approval. | Separation of duties: the person who creates accounts is not the only one who grants access to learner records. Requested by the capstone adviser (2026-10-17). Accounts that existed before were kept Active. |

## Test data notes

- **Starting state:** Rizal (Grade 6) has 100 learners and Mabini (Grade 3) has 5 learners (LRN 300000000001-005) with no Class Adviser. LRN 100000000004-015 are Pending Approval; LRN 100000000099 and 100000000100 are incomplete (no TLE grade); nothing is Approved. Restore the UAT baseline backup to start a test round from this state.
- **Restoring a backup:** `UAT-BASELINE_2026-10-14.sql` and every backup taken before 2026-10-17 lack the account approval columns. After `npm run restore`, re-run migrations 010 and 011 (`02-Product Design/06-Database/SQL/migrations/`), or the Accounts page fails. Both are safe to run twice.
- **Accounts:** the test accounts in the baseline are already Active. An account created during testing goes through Principal approval and setup (TC-012, TC-073 to TC-076).
- **Upload files:** `03-Testing/UAT-files/`, one file per test case.

- **SF10 download:** use learner LRN `100000000001` (Adrian Aguilar, Grade 6 Rizal). It has sample Grade 4 and Grade 5 history, so it prints before anything is approved. Its readiness is PARTIAL because Grades 1-3 have no records and its Grade 6 year is not yet approved. Once a Rizal learner is approved (TC-039), that learner's Grade 6 prints as Terms 1-3 (D-05, TC-069). Unapproved learners show the "nothing to put on the SF10 yet" message, which is expected.
- The sample historical school is named "Sample Elementary School (test data)" so it is never mistaken for a real record.
