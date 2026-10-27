# Demo files: Grade 4 - Mayon (final defense)

Nine e-Class Records built from the official DepEd template (every formula kept, recalculated
in Excel). New learners, so they do not clash with the Rizal learners used in UAT.

| File | Upload as | Expected result |
|---|---|---|
| `ecr-mayon-Filipino.xlsx` | Grade 4 - Mayon, Filipino | Validated, 0 errors, 0 warnings |
| `ecr-mayon-English.xlsx` | English | same |
| `ecr-mayon-Mathematics.xlsx` | Mathematics | same |
| `ecr-mayon-Science.xlsx` | Science | same |
| `ecr-mayon-Araling-Panlipunan.xlsx` | Araling Panlipunan | same |
| `ecr-mayon-EPP.xlsx` | EPP | same |
| `ecr-mayon-MAPEH.xlsx` | MAPEH | same |
| `ecr-mayon-GMRC.xlsx` | GMRC | same |
| `ecr-mayon-Mathematics-WITH-ERRORS.xlsx` | Mathematics | Needs Attention, 3 errors: Term 1 Written/Oral score of 35 where the highest possible score is 20 (Bautista, Carlo; Dela Cruz, Elijah; Cabrera, Camille) |

- 40 learners (20 male, 20 female), LRNs `400000000001` to `400000000040`, school year 2025-2026.
- Realistic grades: a few learners are below 75 in some subjects, so the intervention list has entries.
- The teacher cell (Q7) is blank; the system does not check it.

## Before the demo (on the system you will present)

1. The section **Grade 4 - Mayon** exists in school year **2025-2026**, with its teacher assignments
   (Self-Contained: the Class Adviser uploads all 8; Departmentalized: each subject's teacher).
2. Rehearsing is safe: a file can be uploaded again and again **until its learners are submitted**.
   After Submit or Approve, the learners are locked (Known Limitations D-04) and a revision request
   is needed to change them. So do not submit during rehearsal, or request a revision afterwards.
3. Suggested order: upload the WITH-ERRORS file first (show the errors), then the clean Mathematics
   file (the errors are gone), then the other subjects, then Consolidated Records, Submit, Approve, SF10.

Checked on 2026-10-27 against the real server and a test database: all 9 uploads gave the expected
result, all 40 learners could be submitted, and an approval went through.

Use the files as they are: opening and re-saving them in Excel can change them.
