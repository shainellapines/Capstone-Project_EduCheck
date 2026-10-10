# EduCheck - Known Limitations and Expected Behaviour

Read this before formal testing and UAT. Each item below is a known, accepted
limitation or a design decision, so testers should not log it as a defect.
If something behaves differently from what is described here, that **is** a
defect and should be reported.

## Known limitations

| # | Area | Limitation | Workaround / reason |
|---|---|---|---|
| L-01 | Mobile notifications | Alerts arrive only while the mobile app is open. The app checks the server every 30 seconds. There are no push notifications when the app is closed. | Open the app to see new alerts. Polling was chosen over Firebase so the system runs on a local network with no third-party service. Tapping an alert opens the related list (for example, the Administrator's Approvals). |
| L-02 | Passwords | There is no "forgot password" link or email reset. | The School Administrator resets passwords in User Management. The login page says so. |
| L-03 | Notifications list | Only the 50 most recent notifications are shown, with no paging. | Older notifications are kept in the database but not listed. |
| L-04 | Hosting | The system is set up for a local network (localhost or a LAN address) over plain http, with no https. Database backups are a command (`cd backend`, `npm run backup`) and are not scheduled automatically until someone adds it to Windows Task Scheduler. | https is out of scope for the capstone deployment and is required before any internet-facing use. Run the backup before each test round and on a schedule. |
| L-05 | Profile details | Users cannot edit their own name, email or contact number. Settings shows them read-only. Admin and Principal accounts have no name, because names belong to teacher profiles, so EduCheck shows their username. | The Administrator updates details in User Management and Teacher Management. Accounts are managed centrally on purpose. |

## Design decisions (expected behaviour, not defects)

| # | Behaviour | Reason |
|---|---|---|
| D-01 | Validation rules cannot be edited. Admin sees them read-only in Settings. | The rules come from DepEd grading policy. Changing the grading formula is out of scope (SPMP §6.3). |
| D-02 | Grades are corrected by re-uploading the e-class record, not by editing cells in EduCheck. | The teacher's Excel file stays the single source of truth. |
| D-03 | The Principal can view everything but cannot approve, upload or edit. | The Principal role is view-only. |
| D-04 | Once a record is Approved it cannot be re-uploaded until the Adviser requests a revision. | Approval freezes a snapshot. A silent change after approval would make it inaccurate. |
| D-05 | A school year recorded in 3 terms is not printed on the SF10. It shows as "Unsupported" in the readiness report. If no year can be printed, the download returns an error. | The official SF10-ES form has 4 quarter columns. EduCheck does not convert 3 terms into 4 quarters, because that would invent grades. |
| D-06 | Uploads must be Excel e-class record workbooks of 10 MB or less. | A real e-class record is about 2 MB. The limit stops oversized files. |
| D-07 | After 10 failed login attempts within 15 minutes, further attempts from that device are blocked until the 15 minutes pass. | Protects accounts against password guessing. Successful logins are not counted. |

## Test data notes

- **SF10 download:** use learner LRN `100000000001` (Adrian Aguilar, Grade 6 Rizal). It is the only learner with printable years: sample Grade 4 and Grade 5 history. Its readiness is PARTIAL because Grades 1-3 have no records and Grade 6 is 3-term (see D-05). Other learners show the "nothing to put on the SF10 yet" message, which is expected.
- The sample historical school is named "Sample Elementary School (test data)" so it is never mistaken for a real record.
