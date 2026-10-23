# EduCheck - Automated Black-Box UI Tests

Playwright drives the real web app in Google Chrome, like a tester would, and checks
each screen against the Expected Result of the UAT test cases
(`03-Testing/EduCheck_UAT_Test_Cases.xlsx`). The test names use the same TC IDs.

```
cd e2e
npm install
npm test          # about 3 minutes, 63 test cases
npm run report    # writes 03-Testing/EduCheck_Automated_UI_Test_Results.docx
```

- Every run rebuilds its own database, `educheck_e2e`, from
  `02-Product Design/06-Database/SQL/educheck_schema.sql`. The development database is
  never touched. Database credentials come from `backend/.env` (`DB_USER`, `DB_PASSWORD`).
- The backend runs on port 5317 and the built web app on port 4317; both must be free.
- Uses the Chrome installed on this computer (no browser download).
- Emails are written to `.run/outbox.jsonl` instead of being sent.
- Screenshots, the HTML report (`npx playwright show-report .run/html-report`) and
  `results.json` go to `.run/` (not committed).
- `99-lockout.spec.js` (TC-005) runs last: it triggers the login rate limit of the test
  server.
- TC-052 to TC-060 (mobile), TC-063, TC-064 (compatibility) and TC-065, TC-066
  (usability) stay manual.
