# EduCheck - Automated Backend Test Coverage

Run: `cd backend && npm test` (98 tests, about 45 s).

The suite uses its own PostgreSQL database `educheck_test`, dropped and rebuilt from
`02-Product Design/06-Database/SQL/educheck_schema.sql` on every file, and spawns the
real, unmodified server on a private port. It never touches the development database.
Credentials come from `backend/.env` (`DB_USER`, `DB_PASSWORD`); the database user needs
permission to create a database.

## Traceability to the SPMP v1.0

| SPMP reference | Requirement | Test file | Test IDs |
|---|---|---|---|
| EPIC-01, US-001 | Secure JWT login, generic failure message, inactive accounts blocked | `auth.test.js` | AUTH-01 to AUTH-06 |
| EPIC-01 | Self-service account and password change with complexity rule | `auth.test.js` | AUTH-07, AUTH-08 |
| §6.2, US-009, US-011 | Role-based access control per endpoint and role (22 endpoints x 4 roles + anonymous) | `rolematrix.test.js` | one test per endpoint |
| §6.2 "own section only", US-008 | Adviser reads are limited to the section they advise; Admin/Principal school-wide | `scoping.test.js` | CON-06, ANA-02 (consolidation, section progress, student detail, upload summary, analytics, repository) |
| EPIC-02, US-002 | Upload accepts only assigned (subject, section); file-type and workbook checks | `upload-integrity.test.js` | INT-08, INT-09, INT-10 (10 MB size limit) |
| EPIC-02/03 | Class roster per school year; first upload establishes it; wrong-section upload rejected; partial overlap warns; header mismatch warns | `upload-integrity.test.js` | INT-01 to INT-07 |
| §6.2, US-009 | Subject grade level must match section grade level (assignment and upload) | `upload-integrity.test.js` | GRD-01 to GRD-04 |
| §6.2 | Only an Adviser account can hold a section's Class Adviser slot | `upload-integrity.test.js` | ASG-01 |
| EPIC-03/06 | A record is complete only when every subject of the learner's own grade level has a grade; another grade's subject is ignored by completeness, Section Progress and the approval snapshot | `completeness.test.js` | COMP-01 to COMP-04 |
| EPIC-02, EPIC-04, US-004 | Parser reads learners, LRNs and header; validator marks a clean record ready | `parser.test.js` | PRS-01 to PRS-03, VAL-01, VAL-02, INT-H1, INT-H2 |
| EPIC-06, US-006, US-007 | Adviser submit, Admin approve/reject, state rules, ownership, revision requests, notifications | `workflow.test.js` | WF-01 to WF-13 |
| EPIC-06 / §11 risk table | Approval freezes a snapshot; approved records cannot be silently re-uploaded until the Adviser reopens them | `workflow.test.js` | WF-04, WF-06, WF-09, WF-10 |
| EPIC-05, US-005 | SF10: historical entry (own learners, validation, audit log), cumulative record, readiness report, generation onto the official SF10-ES template, 3-term years never converted | `sf10.test.js` | SF-01 to SF-13 |
| Security (ISO 25010) | `/api/parser-test` is Admin-only and deletes its temp upload (SEC-07) | `rolematrix.test.js` | POST /api/parser-test |

## Not yet covered (manual / future)

- Frontend behaviour and usability (needs UAT with real users and screenshots for Chapter 4).
- Performance (large workbooks, many concurrent uploads) and browser/device compatibility.
- Opening the generated SF10 in Excel and checking print layout by eye (tests read the file back, but cannot judge appearance).
- Mobile app, offline sync.
