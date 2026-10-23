# EduCheck - Pending Fixes Handoff

As of 2026-10-23. The system is complete and the automated UI tests pass (63 of 63,
see `EduCheck_Automated_UI_Test_Results.docx`). The items below are open polish and
follow-up work. None blocks the system from being used.

## 1. Small fixes in the app

| # | Ref | What to fix | Where | Suggested fix | Size |
|---|---|---|---|---|---|
| 1 | TC-051 | After **Mark all read**, the sidebar notification badge keeps the old count for up to 30 s. | `frontend/src/components/Sidebar.jsx` (`POLL_INTERVAL_MS = 30000`, `fetchUnreadCount`); `frontend/src/pages/account/Notifications.jsx` (Mark all read, opening a notification) | After a notification is marked read, fire a browser event (e.g. `window.dispatchEvent(new Event("educheck:notifications-changed"))`) and have the Sidebar listen for it and call `fetchUnreadCount()` right away. | Small |
| 2 | TC-035 | A record waiting for approval shows the badge **Submitted**, but its tab is **Pending approval**. | `frontend/src/components/StatusBadge.jsx` line 28 (`submitted: { label: "Submitted" ... }`) | Pick one word for both. Renaming the badge to "Pending approval" is the smallest change. Update the User's Manual screenshots/text if it is changed. | Small |
| 3 | Audit Log | The **Entity** filter dropdown has no proper label (screen readers read only "list box"). | `frontend/src/pages/admin/AuditLog.jsx` around line 174 | Wrap the text and `<select>` in a `<label>`, or add `aria-label="Entity"` to the select. Then the E2E test can use `getByLabel("Entity")`. | Small |
| 4 | TC-042 | When a revision is requested, the section's other records waiting for approval are sent back (by design) but show **Amendment Requested**, as if they had been approved before. | `backend/src/controllers/consolidationController.js` around line 774 (`withdrawnResult`) | Optional. Either keep it and explain it in the manual, or send these back as `Ready` (not submitted) instead of `Amendment Requested`. Check `workflow.test.js` (WF tests) after any change. | Medium |

## 2. Documents to update

| # | Ref | What | Where |
|---|---|---|---|
| 5 | TC-002 | Expected Result says "Invalid username or password." The app shows "Username or password is incorrect. Check both and try again." (still does not say which field was wrong). Update the test case wording. | `EduCheck_UAT_Test_Cases.xlsx`, Test Cases sheet, TC-002 |
| 6 | DEF-001 to DEF-005 | Fixed (DEF-003 In Progress) but **Retest Result** is still blank. Retest each one and fill in Retest Result. | `EduCheck_UAT_Test_Cases.xlsx`, Defect Log sheet |
| 7 | Manuscript | Cite the black-box results in the testing chapter: 76 of 76 test cases passed (63 automated, 13 run by hand on 2026-10-15: mobile, compatibility, usability). Draft text and tables: `00 - Manuscript/EduCheck_Results_and_Discussion_Draft.docx`; replace each `[ref: ...]` with its IEEE number. | `EduCheck_Automated_UI_Test_Results.docx` |

## 3. Hosting

| # | Ref | What | How |
|---|---|---|---|
| 8 | DEF-003 | The Render free plan sleeps after 15 minutes, so the first visit can take up to a minute. The login page already shows a "waking up" notice. | Set up UptimeRobot (free): add an HTTP(s) monitor on `https://<backend>.onrender.com/api/health/db`, every 5 minutes. Then retest TC-062 on the hosted link and set DEF-003 to Fixed. Note: keeping the service awake uses the free plan's monthly hours. |

## 4. Manual test cases and evaluation

TC-052 to TC-060 (Android app), TC-063 and TC-064 (other browsers and screen sizes),
TC-065 and TC-066 (usability) passed on 2026-10-15 and are recorded in the UAT workbook.

Online testing: Atimonan Central School Annex on 2026-10-15 and East 8 Elementary School
on 2026-10-22 (with a short on-site demo). Questionnaires (ISO 25010, SUS, heuristic) were
answered on Google Forms from 2026-10-20 to 2026-10-22; responses and the computed
tabulation are in `03-Testing/results/`. A school personnel respondent's answers to the
IT-only part (G to J) are excluded, and the first heuristic response (a test entry) is not
counted.

## How to check a fix

```
cd backend && npm test          # backend API tests (about 150)
cd e2e && npm test              # 63 UI tests, about 3 minutes
cd e2e && npm run report        # rebuilds EduCheck_Automated_UI_Test_Results.docx
```

If a fix changes text on screen (items 2 and 3), update the matching E2E test in
`e2e/tests/`. Pushing to `main` deploys to Render.
