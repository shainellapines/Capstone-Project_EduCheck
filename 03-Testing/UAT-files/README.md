# UAT input files

Each file name starts with the test case that uses it.

| File | Test case | What it is | Expected result |
|---|---|---|---|
| `TC-022_valid-ecr-rizal.xlsx` | TC-022, TC-028, TC-030, TC-061 | Valid e-Class Record, header "Grade 6 - Rizal", **Mathematics**, 2025-2026. Includes the LRN sheet for all 100 learners. | Validated, 0 errors, 0 warnings when uploaded as Rizal / Mathematics. Uploaded as another subject, it is accepted with a "header says subject Mathematics" warning. |
| `TC-024_not-excel.txt` | TC-024 | Plain text file | Refused: only Excel files are accepted |
| `TC-025_oversized-11MB.xlsx` | TC-025 | 11 MB file (not a real workbook) | Refused: file is larger than 10 MB |
| `TC-026_ecr-other-section.xlsx` | TC-026 | Learners with Mabini LRNs (300000000001-005) | Refused when uploaded to Rizal: the learners belong to another section |
| `TC-027_ecr-with-errors.xlsx` | TC-027 | The TC-022 file (Mathematics) with 3 Written/Oral scores (Term 1) of 35 where the highest possible score is 20: Aguilar, Alcantara, Andrada | Needs Attention, 3 errors |

## One file per subject: `per-subject/`

`ecr-rizal-<Subject>.xlsx` for the 8 Grade 6 subjects (Filipino, English,
Mathematics, Science, Araling Panlipunan, TLE, MAPEH, ESP). Each is the valid
Rizal record with that subject in its header (cell Y7 of the INPUT sheet).

The grades are simulated but realistic: the same 100 learners and LRNs in
every file, but each subject has its own scores. Mathematics and Science are
the hardest (about 12-17 learners below 75), ESP and MAPEH the easiest
(about 7). Seven struggling learners fail every subject, and 18 learners
fail at least one, so FAILED remarks and low grades show up in Consolidated
Records and Analytics.

- Uploaded as its own subject: Validated, 0 errors, no header warning.
- Uploaded as a different subject: refused, because the file is for another
  subject (TC-068, Known Limitations D-08).

Use these whenever a tester uploads a subject other than Mathematics, for
example the Adviser's own subjects in TC-030.

## Notes

Use the files as they are. Do not open and re-save them in Excel before
uploading, because that can change them.

Upload the Rizal files **before** any record is approved (TC-039). Once one Rizal
learner is Approved, every upload for Rizal is refused until the Adviser
requests a revision (Known Limitations D-04).
