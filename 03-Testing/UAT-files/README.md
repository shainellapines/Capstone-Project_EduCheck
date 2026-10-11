# UAT input files

Each file name starts with the test case that uses it.

| File | Test case | What it is | Expected result |
|---|---|---|---|
| `TC-022_valid-ecr-rizal.xlsx` | TC-022, TC-028, TC-030, TC-061 | Valid e-Class Record for Rizal (Grade 6). Includes the LRN sheet for all 100 learners. | Validated, 0 errors, 0 warnings |
| `TC-024_not-excel.txt` | TC-024 | Plain text file | Refused: only Excel files are accepted |
| `TC-025_oversized-11MB.xlsx` | TC-025 | 11 MB file (not a real workbook) | Refused: file is larger than 10 MB |
| `TC-026_ecr-other-section.xlsx` | TC-026 | Learners with Mabini LRNs (300000000001-005) | Refused when uploaded to Rizal: the learners belong to another section |
| `TC-027_ecr-with-errors.xlsx` | TC-027 | The TC-022 file with 3 Written/Oral scores (Term 1) above the highest possible score: Aguilar, Alcantara, Andrada | Needs Attention, 3 errors |

Use the files as they are. Do not open and re-save them in Excel before
uploading, because that can change them.

Upload the Rizal files **before** any record is approved (TC-039). Once one Rizal
learner is Approved, every upload for Rizal is refused until the Adviser
requests a revision (Known Limitations D-04).
