# EduCheck Capstone 2 — Development Handoff v2
## Consolidation, LRN Matching, Submission Workflow & Notifications

**Written:** 2026-09-05, at a deliberate pause point in an active session.
**Supersedes context in:** `EduCheck_Capstone2_Development_Handoff_LRN_Mapping.md` (the parser-only handoff). That document is still accurate for what it covers — this one picks up immediately after it and should be read as an addition, not a replacement.

---

## 1. Where We Left Off

The previous handoff ended with the E-Class Record **parser** verified against both a partially- and fully-encoded workbook, and the **rule-based validation layer** (`classRecordValidator.js`) already built. Since then, in one continuous session, we went from "parser reads a spreadsheet" all the way to a **working, tested, multi-role submission-and-approval pipeline with notifications**. Nothing below is aspirational — every piece described was implemented and verified against the real Express server and real PostgreSQL database (test data cleaned up afterward unless explicitly noted as real usage data).

### The chain of problems solved, in order

1. **LRN was never captured.** The parser tracked learners by row position (`learner_number` = 1, 2, 3…) and name only — never the DepEd 12-digit Learner Reference Number. This blocked any real cross-subject consolidation.
2. **Fix:** added an optional `LRN` sheet to the E-Class Record template (not a new column — a whole new sheet, so the official DepEd grading sheet stays untouched). Parser reads it, matches by name+position, flags missing/invalid/duplicate LRNs as warnings (not errors — doesn't block today's per-subject upload).
3. **Nothing was persisted per-student.** Even with LRN captured, no code wrote to `students` or `grade_records` — every upload's grades vanished after the HTTP response.
4. **Fix:** `gradeRecordPersistence.js` upserts a `students` row and inserts a `grade_records` row (keyed by LRN) on every validated upload.
5. **No cross-subject view existed.** Sprint 4 ("Academic Record Consolidation") had nothing built.
6. **Fix:** `consolidationController.js` — merges every subject's latest upload per student into one view, with "latest upload wins" conflict resolution for re-uploads, plus a completeness signal (`subjects_expected` vs `subjects_recorded`).
7. **Both dashboards (`Dashboard.jsx` adviser, `AdminDashboard.jsx` admin) were 100% static mockups** — hardcoded fake names, fake numbers, dead nav links with no `onClick`/`href`.
8. **Fix:** rewired both to fetch real data from the consolidation endpoints; removed fabricated data (e.g. "Welcome, Maria Santos", "Class: Grade 6 - Sampaguita") that had nothing backing it in the DB.
9. **No submission/approval workflow existed** (Sprint 7). A record could be "Validated" or "Needs Attention" but nothing tracked adviser review or admin approval.
10. **Fix:** new `record_submissions` table + `submissionController.js` — adviser submits a complete record for approval, admin approves/rejects (with a reason), built into the Consolidated Records page.
11. **Admin had no way to reach the approval page at all** — same dead-link bug as the adviser dashboard originally had. This is why testing looked like everything got stuck at "Pending Approval."
12. **Fix:** wired `AdminDashboard.jsx`'s "Submission Review" nav/quick-action to `/consolidated-records`.
13. **Adviser was never told when admin decided.** Approve/reject updated the DB but nothing surfaced it to the person who submitted.
14. **Fix:** `notificationController.js` + a polling `NotificationBell.jsx` component (30s interval) using the `notifications` table that already existed in the schema, unused, since the original ERD.

### What's confirmed working via the user's own manual testing (not just my automated tests)

The user tested the LRN upload flow, the consolidation page, submit/approve/reject, and confirmed the bell/notification gap themselves. The live database currently has **real usage data from that testing** (see §5) — it is not test residue and should not be wiped without asking.

---

## 2. Current File Structure

```text
EduCheck/
├── 01-Project Managemet/
│   └── 01-EduCheck Software Development Plan.docx        (SPMP — still a draft, missing several sections)
├── 02-Product Design/
│   ├── 01-Product Backlog.xlsx
│   ├── 02-User Stories.docx
│   ├── 04-KANBAN/
│   ├── 05-System Architecture/                             (empty)
│   ├── 06-Database/
│   │   ├── 01-Database Analysis.docx
│   │   ├── 02-ERD_ver1.0.drawio.png
│   │   ├── 03-Database Schema.docx
│   │   ├── 04-Data Dictionary.docx
│   │   └── SQL/
│   │       ├── database_tests.sql
│   │       ├── educheck_schema.sql                         ← kept in sync with live DB this session
│   │       └── migrations/
│   │           ├── README.md                               (migration convention, established this session)
│   │           ├── 001_add_class_record_validation.sql
│   │           ├── 002_grade_records_terms.sql
│   │           └── 003_record_submissions.sql
│   ├── 07-API/                                             (empty)
│   ├── 08-UI_UX/
│   └── Sprint Backlogs/
├── 04-Development Evidence/
│   └── Sprint 2/ (screenshots)
├── backend/
│   ├── package.json
│   └── src/
│       ├── server.js                                       ← mounts all routes, see §4
│       ├── db.js
│       ├── middleware/
│       │   └── authMiddleware.js                           (authenticateToken, authorizeRoles — unchanged)
│       ├── controllers/
│       │   ├── authController.js                            (unchanged)
│       │   ├── userController.js                            (unchanged)
│       │   ├── teacherController.js                         (unchanged)
│       │   ├── classRecordParser.js                         ← LRN capture added this session
│       │   ├── classRecordValidator.js                      (LRN warnings now carry real messages through)
│       │   ├── gradeRecordPersistence.js                    ← NEW this session
│       │   ├── consolidationController.js                   ← NEW this session
│       │   ├── submissionController.js                      ← NEW this session
│       │   ├── notificationController.js                    ← NEW this session
│       │   ├── uploadController.js                          (calls persistLearnerGradeRecords now)
│       │   ├── testClassRecordParser.js                     (dev test script)
│       │   └── testClassRecordValidator.js                  (dev test script)
│       ├── routes/
│       │   ├── authRoutes.js / userRoutes.js / teacherRoutes.js / uploadRoutes.js / parserTestRoutes.js  (pre-existing)
│       │   ├── consolidationRoutes.js                        ← NEW this session
│       │   ├── submissionRoutes.js                           ← NEW this session
│       │   └── notificationRoutes.js                         ← NEW this session
│       ├── utils/
│       │   ├── workbookStructure.js                          ← LRN sheet config added this session
│       │   ├── inspectWorkbook.js / inspectInputCells.js      (dev helper scripts)
│       └── uploads/                                          (real uploaded files + test fixtures — see note below)
└── frontend/
    ├── package.json
    └── src/
        ├── App.jsx                                           (added /consolidated-records route)
        ├── components/
        │   ├── ProtectedRoute.jsx                             (unchanged)
        │   └── NotificationBell.jsx                           ← NEW this session
        └── pages/
            ├── Login.jsx                                      (unchanged)
            ├── Dashboard.jsx                                   ← rewritten: real data, real nav (Adviser)
            ├── AdminDashboard.jsx                              ← rewritten: real data, real nav (Admin)
            ├── SubjectDashboard.jsx                            (untouched — see §6 open items)
            ├── UserManagement.jsx / TeacherManagement.jsx       (unchanged)
            ├── ClassRecordUpload.jsx / ValidationResults.jsx    (unchanged)
            └── ConsolidatedRecords.jsx                         ← NEW this session
```

**Note on `backend/src/uploads/`:** this folder mixes real production-style uploads with dev test fixtures accumulated over the whole project. Notable ones from this session:
- `E-Class-Record-Sample-Data-WITH-LRN.xlsx` — 100-learner demo file with a fully-filled synthetic LRN sheet (fake 12-digit numbers). Good for testing the full pipeline end to end.
- `E-Class-Record-Editable-AP-Eng-Fil-Math-Sci-GMRC-Val-Ed_Grade-4-10-WITH-LRN-TEMPLATE.xlsx` — the actual master template with a **blank** LRN sheet (names/numbers pre-copied from INPUT, LRN column empty) — **this is the file to actually hand to an adviser** to fill in real LRNs and redistribute to subject teachers.
- Several timestamped uploads (`178861...-*.xlsx`) are **real uploads made through the running app during testing**, not something to delete casually.

---

## 3. Current Database State

### Schema
`educheck_schema.sql` is kept as a true, current snapshot — every migration below is folded into it. Two important non-obvious things live in that file as comments:
- `class_records` (section 7) has 4 columns beyond the original ERD (`stored_file_name`, `validation_error_count`, `validation_warning_count`, `ready_for_submission`) plus a whole new table `class_record_validation_issues` — these existed live in the DB before this session's documentation work caught up to them.
- `grade_records` (section 8) uses `term_1/2/3`, not the original `quarter_1..4` — migration 002 fixed a genuine mismatch (the E-Class Record has 3 terms, not 4 quarters).
- **A dead ERD chain exists and is explicitly flagged in the schema file**: `academic_records` → `validation_reports` → `sf10` → `submissions` (sections 9, 10, 11, 12) are the *original* design, tied to a generated SF10 document. **Nothing in the codebase writes to any of these four tables.** The new `record_submissions` table (section 14) is the pragmatic, actually-used version for right now (pre-SF10). These need to be reconciled once SF10 generation is real — do not treat both as active.

### Migrations (`02-Product Design/06-Database/SQL/migrations/`)
| # | File | Applied to live DB? |
|---|---|---|
| 001 | `001_add_class_record_validation.sql` | Yes (applied before this history existed; documented retroactively) |
| 002 | `002_grade_records_terms.sql` | Yes |
| 003 | `003_record_submissions.sql` | Yes |

Convention (see `migrations/README.md`): numbered, forward-only, one change per file, applied by hand (`psql` or pgAdmin) — no migration runner in this project. Update `educheck_schema.sql` alongside every new migration.

### Live row counts (snapshot at time of writing — this is real usage data from the user's own testing, not leftover test residue)
```
users: 5              teachers: 1           sections: 0
school_years: 1       subjects: 1           students: 100
class_records: 9      grade_records: 100    class_record_validation_issues: 80
record_submissions: 100                     notifications: 7
```
`sections` is empty — nothing parses "Grade & Section" from the workbook yet, so `students.section_id` is always null. `subjects` has only 1 row (Mathematics, grade 6) seeded — this caps what "subjects_expected" can meaningfully compute right now.

### Seeded accounts (for testing)
| username | role |
|---|---|
| `adviser.grade6a` | adviser |
| `adviser.grade5a` | adviser |
| `admin.educheck` | admin |
| `subject.grade6a` | subject |
| `test.subject` | subject |

---

## 4. API Surface Added This Session

All mounted in `backend/src/server.js`:

```js
app.use("/api/uploads", uploadRoutes);                 // pre-existing, subject-only
app.use("/api/consolidation", consolidationRoutes);     // NEW
app.use("/api/submissions", submissionRoutes);          // NEW
app.use("/api/notifications", notificationRoutes);      // NEW
```

| Method | Path | Role | Purpose |
|---|---|---|---|
| GET | `/api/consolidation/school-years` | adviser, admin | List school years (adviser/admin couldn't hit the subject-only `/api/uploads/options`) |
| GET | `/api/consolidation/school-years/:id` | adviser, admin | All students' consolidated grades + `upload_summary` + `submission` status per student |
| GET | `/api/consolidation/school-years/:id/students/:lrn` | adviser, admin | One student's consolidated record |
| POST | `/api/submissions/school-years/:id/students/:lrn/submit` | adviser | Submit one student for approval (blocked unless complete) |
| POST | `/api/submissions/school-years/:id/submit-all` | adviser | Bulk-submit every eligible (complete, not-yet-approved) student |
| POST | `/api/submissions/school-years/:id/students/:lrn/approve` | admin | Approve a Pending Approval record → notifies the submitting adviser |
| POST | `/api/submissions/school-years/:id/students/:lrn/reject` | admin | Reject with `{ remarks }` → notifies the submitting adviser with the reason |
| GET | `/api/notifications` | any authenticated | Current user's notifications + unread count |
| POST | `/api/notifications/:id/read` | any authenticated | Mark one read |
| POST | `/api/notifications/read-all` | any authenticated | Mark all read |

---

## 5. Exact Code Just Finished

These six files are the core of everything built this session. Supporting route files are thin wrappers (`authenticateToken` + `authorizeRoles` + handler mapping) — not reproduced here, but present at the paths listed in §2.

### `backend/src/utils/workbookStructure.js` (full file)
```js
const workbookStructure = {
    sheets: {
        input: "INPUT",
        term1: "TERM1",
        term2: "TERM2",
        term3: "TERM3",
        summary: "SUMMARY OF GRADES",
        helper: "Helper (Do Not Delete)",
        doNotDelete: "DO NOT DELETE",
        // Optional supplementary sheet, not part of the official DepEd template.
        // Added per adviser guidance so learners can be matched across each
        // subject's separate e-Class Record using their LRN. Same row layout
        // as INPUT (list number + name) so rows line up 1:1 by position,
        // with name matching as the authoritative cross-check.
        lrn: "LRN",
    },

    learner: {
        numberColumn: "A",
        nameColumn: "B",
    },

    // Columns on the LRN sheet. Mirrors the INPUT sheet's learner section
    // row ranges (see extractLearners / extractLrnRoster).
    lrnSheet: {
        numberColumn: "A",
        nameColumn: "B",
        lrnColumn: "C",
    },

    terms: {
        term1: { sheet: "TERM1" },
        term2: { sheet: "TERM2" },
        term3: { sheet: "TERM3" },
    },

    termColumns: {
        writtenOral: {
            scoreColumns: ["F", "G", "H", "I", "J"],
            total: "K",
            percentageScore: "L",
            weightedScore: "M",
        },
        performanceTasks: {
            scoreColumns: ["N", "O", "P"],
            total: "Q",
            percentageScore: "R",
            weightedScore: "S",
        },
        summative: {
            scoreColumns: ["T", "U", "V"],
            total: "W",
            percentageScore: "X",
            weightedScore: "Y",
        },
        grade: {
            initialGrade: "Z",
            termGrade: "AA",
            descriptor: "AB",
        },
    },

    summary: {
        learnerNumber: "A",
        learnerName: "B",
        term1Grade: "F",
        term2Grade: "J",
        term3Grade: "N",
        finalGrade: "R",
        descriptor: "V",
        remark: "Z",
    },
};

module.exports = workbookStructure;
```

### `backend/src/controllers/classRecordParser.js` (full file — LRN capture added)
```js
const XLSX = require("xlsx");
const workbookStructure = require("../utils/workbookStructure");

const REQUIRED_SHEETS = [workbookStructure.sheets.input, workbookStructure.sheets.term1, workbookStructure.sheets.term2, workbookStructure.sheets.term3, workbookStructure.sheets.summary];

const isMeaningfulValue = (value) => value !== undefined && value !== null && String(value).trim() !== "";
const cleanValue = (value) => (isMeaningfulValue(value) ? value : null);
const getCellValue = (sheet, column, rowNumber) => cleanValue(sheet[`${column}${rowNumber}`]?.v);
const getRowLimit = (sheet) => XLSX.utils.decode_range(sheet["!ref"] || "A1:A1").e.r + 1;
const isPositiveInteger = (value) => Number.isInteger(Number(value)) && Number(value) > 0;

// Unfilled INPUT slots are linked into term sheets as cached numeric 0 values.
const isLearnerName = (value) => typeof value === "string" && /[A-Za-zÀ-ÖØ-öø-ÿ]/.test(value.trim());
const getRecordKey = (record) => `${record.learner_number}|${record.learner_name.trim().toLowerCase()}`;

// DepEd Learner Reference Numbers are always 12 digits.
const LRN_PATTERN = /^\d{12}$/;
const isValidLrn = (value) => typeof value === "string" && LRN_PATTERN.test(value.trim());

// Same row ranges as INPUT's learner sections, so the LRN sheet lines up
// with the class list by position as well as by name.
const LEARNER_SECTIONS = [
    { gender: "Male", startRow: 12, endRow: 61 },
    { gender: "Female", startRow: 63, endRow: 112 },
];

const readAssessment = (sheet, rowNumber, structure) => ({
    scores: structure.scoreColumns.map((column) => getCellValue(sheet, column, rowNumber)),
    highest_possible_scores: structure.scoreColumns.map((column) => getCellValue(sheet, column, 10)),
    total: getCellValue(sheet, structure.total, rowNumber),
    percentage_score: getCellValue(sheet, structure.percentageScore, rowNumber),
    weighted_score: getCellValue(sheet, structure.weightedScore, rowNumber),
});

const isAssessmentReady = (sheet, rowNumber, structure) => {
    const configured = structure.scoreColumns.filter((column) => isMeaningfulValue(getCellValue(sheet, column, 10)));
    return configured.length > 0 && configured.every((column) => isMeaningfulValue(getCellValue(sheet, column, rowNumber)));
};

const validateWorkbookStructure = (workbook) => {
    if (!workbook || !Array.isArray(workbook.SheetNames)) {
        throw new Error("Invalid Excel workbook.");
    }
    const missingSheets = REQUIRED_SHEETS.filter((sheetName) => !workbook.SheetNames.includes(sheetName));
    if (missingSheets.length > 0) {
        throw new Error(`Required worksheet(s) missing: ${missingSheets.join(", ")}`);
    }
    return true;
};

// Reads the optional LRN sheet (see workbookStructure.sheets.lrn). Returns
// null when the sheet is absent so callers can distinguish "not filled in
// yet" from "filled in with blanks" and warn accordingly.
const extractLrnRoster = (workbook) => {
    const sheet = workbook.Sheets[workbookStructure.sheets.lrn];
    if (!sheet) return null;

    const roster = [];
    LEARNER_SECTIONS.forEach(({ startRow, endRow }) => {
        for (let rowNumber = startRow; rowNumber <= endRow; rowNumber++) {
            const learnerNumber = getCellValue(sheet, workbookStructure.lrnSheet.numberColumn, rowNumber);
            const learnerName = getCellValue(sheet, workbookStructure.lrnSheet.nameColumn, rowNumber);
            if (!isPositiveInteger(learnerNumber) || !isLearnerName(learnerName)) continue;

            const lrnRaw = getCellValue(sheet, workbookStructure.lrnSheet.lrnColumn, rowNumber);
            roster.push({
                learner_number: Number(learnerNumber),
                learner_name: learnerName.trim(),
                lrn: isMeaningfulValue(lrnRaw) ? String(lrnRaw).trim() : null,
            });
        }
    });
    return roster;
};

const extractLearners = (workbook) => {
    const sheet = workbook.Sheets[workbookStructure.sheets.input];
    const lrnRoster = extractLrnRoster(workbook);
    const lrnByKey = new Map((lrnRoster || []).map((entry) => [getRecordKey(entry), entry.lrn]));
    const learners = [];

    LEARNER_SECTIONS.forEach(({ gender, startRow, endRow }) => {
        for (let rowNumber = startRow; rowNumber <= endRow; rowNumber++) {
            const learnerNumber = getCellValue(sheet, workbookStructure.learner.numberColumn, rowNumber);
            const learnerName = getCellValue(sheet, workbookStructure.learner.nameColumn, rowNumber);
            if (!isPositiveInteger(learnerNumber) || !isLearnerName(learnerName)) continue;

            const trimmedName = learnerName.trim();
            const key = getRecordKey({ learner_number: Number(learnerNumber), learner_name: trimmedName });

            learners.push({
                learner_number: Number(learnerNumber),
                learner_name: trimmedName,
                gender,
                // null when the LRN sheet is missing, blank for this learner,
                // or matched but not a valid 12-digit LRN (see checkLrnIssues).
                lrn: lrnByKey.get(key) ?? null,
            });
        }
    });
    return learners;
};

// Flags LRN problems as warnings (not errors) — consolidation across
// subjects doesn't exist yet, so a missing/invalid LRN shouldn't block
// today's per-subject validation, only surface as something to fix before
// that feature needs it.
const checkLrnIssues = (learners, hasLrnSheet) => {
    if (!hasLrnSheet) {
        return [{
            type: "LRN_SHEET_MISSING",
            message: "This workbook has no LRN sheet, so learners cannot yet be matched across subjects for consolidation. Add an LRN sheet listing each learner's name and 12-digit LRN.",
        }];
    }

    const warnings = [];
    const seenLrns = new Map();

    learners.forEach((learner) => {
        if (!isMeaningfulValue(learner.lrn)) {
            warnings.push({
                type: "MISSING_LRN", learner: learner.learner_name, learner_number: learner.learner_number,
                message: `${learner.learner_name} has no LRN recorded in the LRN sheet.`,
            });
            return;
        }
        if (!isValidLrn(learner.lrn)) {
            warnings.push({
                type: "INVALID_LRN_FORMAT", learner: learner.learner_name, learner_number: learner.learner_number,
                message: `${learner.learner_name}'s LRN "${learner.lrn}" must be exactly 12 digits.`,
            });
            return;
        }
        if (seenLrns.has(learner.lrn)) {
            warnings.push({
                type: "DUPLICATE_LRN", learner: learner.learner_name, learner_number: learner.learner_number,
                message: `LRN "${learner.lrn}" is used by both ${seenLrns.get(learner.lrn)} and ${learner.learner_name}.`,
            });
        } else {
            seenLrns.set(learner.lrn, learner.learner_name);
        }
    });
    return warnings;
};

const extractTermData = (workbook, sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const termRecords = [];

    for (let rowNumber = 1; rowNumber <= getRowLimit(sheet); rowNumber++) {
        const learnerNumber = getCellValue(sheet, workbookStructure.learner.numberColumn, rowNumber);
        const learnerName = getCellValue(sheet, workbookStructure.learner.nameColumn, rowNumber);
        if (!isPositiveInteger(learnerNumber) || !isLearnerName(learnerName)) continue;

        const writtenOral = readAssessment(sheet, rowNumber, workbookStructure.termColumns.writtenOral);
        const performanceTasks = readAssessment(sheet, rowNumber, workbookStructure.termColumns.performanceTasks);
        const summativeAssessment = readAssessment(sheet, rowNumber, workbookStructure.termColumns.summative);
        const summative = {
            scores: summativeAssessment.scores,
            highest_possible_scores: summativeAssessment.highest_possible_scores,
            st1: summativeAssessment.scores[0], st2: summativeAssessment.scores[1], te: summativeAssessment.scores[2],
            total: summativeAssessment.total, percentage_score: summativeAssessment.percentage_score,
            weighted_score: summativeAssessment.weighted_score,
        };

        const inputsComplete = [
            workbookStructure.termColumns.writtenOral,
            workbookStructure.termColumns.performanceTasks,
            workbookStructure.termColumns.summative,
        ].every((structure) => isAssessmentReady(sheet, rowNumber, structure));
        const formulaCache = {
            initial_grade: getCellValue(sheet, workbookStructure.termColumns.grade.initialGrade, rowNumber),
            term_grade: getCellValue(sheet, workbookStructure.termColumns.grade.termGrade, rowNumber),
            descriptor: getCellValue(sheet, workbookStructure.termColumns.grade.descriptor, rowNumber),
        };

        termRecords.push({
            learner_number: Number(learnerNumber), learner_name: learnerName.trim(),
            written_oral: writtenOral, performance_tasks: performanceTasks, summative,
            initial_grade: inputsComplete ? formulaCache.initial_grade : null,
            term_grade: inputsComplete ? formulaCache.term_grade : null,
            descriptor: inputsComplete ? formulaCache.descriptor : null,
            calculation: { ready: inputsComplete, source: "assessment-inputs" },
            formula_cache: formulaCache,
        });
    }
    return termRecords;
};

const extractSummary = (workbook) => {
    const sheet = workbook.Sheets[workbookStructure.sheets.summary];
    if (!sheet) return [];

    const summaryRecords = [];
    for (let rowNumber = 1; rowNumber <= getRowLimit(sheet); rowNumber++) {
        const learnerNumber = getCellValue(sheet, workbookStructure.summary.learnerNumber, rowNumber);
        const learnerName = getCellValue(sheet, workbookStructure.summary.learnerName, rowNumber);
        if (!isPositiveInteger(learnerNumber) || !isLearnerName(learnerName)) continue;

        summaryRecords.push({
            learner_number: Number(learnerNumber), learner_name: learnerName.trim(),
            term1_grade: getCellValue(sheet, workbookStructure.summary.term1Grade, rowNumber),
            term2_grade: getCellValue(sheet, workbookStructure.summary.term2Grade, rowNumber),
            term3_grade: getCellValue(sheet, workbookStructure.summary.term3Grade, rowNumber),
            final_grade: getCellValue(sheet, workbookStructure.summary.finalGrade, rowNumber),
            descriptor: getCellValue(sheet, workbookStructure.summary.descriptor, rowNumber),
            remark: getCellValue(sheet, workbookStructure.summary.remark, rowNumber),
            reference_only: true,
        });
    }
    return summaryRecords;
};

const crossCheckLearners = (learners, term1, term2, term3, summary) => {
    const learnerKeys = new Set(learners.map(getRecordKey));
    const warnings = [];
    const checkRecords = (records, source) => records.forEach((record) => {
        if (!learnerKeys.has(getRecordKey(record))) {
            warnings.push({ type: "LEARNER_MISMATCH", source, learner: record.learner_name });
        }
    });
    checkRecords(term1, workbookStructure.sheets.term1);
    checkRecords(term2, workbookStructure.sheets.term2);
    checkRecords(term3, workbookStructure.sheets.term3);
    checkRecords(summary, workbookStructure.sheets.summary);
    return warnings;
};

const parseClassRecord = (filePath) => {
    const workbook = XLSX.readFile(filePath);
    validateWorkbookStructure(workbook);

    const learners = extractLearners(workbook);
    const term1 = extractTermData(workbook, workbookStructure.sheets.term1);
    const term2 = extractTermData(workbook, workbookStructure.sheets.term2);
    const term3 = extractTermData(workbook, workbookStructure.sheets.term3);
    const summary = extractSummary(workbook);
    const warnings = crossCheckLearners(learners, term1, term2, term3, summary);
    const hasLrnSheet = workbook.SheetNames.includes(workbookStructure.sheets.lrn);
    const lrnWarnings = checkLrnIssues(learners, hasLrnSheet);

    return {
        workbook: { sheet_count: workbook.SheetNames.length, sheet_names: workbook.SheetNames, has_lrn_sheet: hasLrnSheet },
        learners,
        terms: { term1, term2, term3 },
        summary,
        validation: {
            learner_count: learners.length, term1_count: term1.length, term2_count: term2.length,
            term3_count: term3.length, summary_count: summary.length, warnings: [...warnings, ...lrnWarnings],
        },
    };
};

module.exports = {
    parseClassRecord, validateWorkbookStructure, extractLearners, extractLrnRoster,
    extractTermData, extractSummary, crossCheckLearners, checkLrnIssues, isValidLrn, getRecordKey,
};
```

### `backend/src/controllers/gradeRecordPersistence.js` (full file — NEW)
```js
const { isValidLrn, getRecordKey } = require("./classRecordParser");

// The e-Class Record spells names as "Last, First" (e.g. "Dela Cruz, Daniel").
// Splitting on the first comma is enough for this template; there is no
// separate middle-name field to recover.
const splitLearnerName = (learnerName) => {
    const [lastPart, firstPart] = learnerName.split(",").map((part) => part?.trim());
    return { last_name: lastPart || learnerName, first_name: firstPart || "" };
};

// Mirrors classRecordValidator's expectedFinalGrade: only meaningful once
// every term is ready with a numeric grade, otherwise the student's record
// for this subject is still incomplete.
const computeFinalGrade = (term1, term2, term3) => {
    const terms = [term1, term2, term3];
    const allReady = terms.every((term) => term?.calculation?.ready && typeof term.term_grade === "number");
    if (!allReady) return null;
    return Math.round(terms.reduce((total, term) => total + term.term_grade, 0) / terms.length);
};

// Persists one grade_records row per learner (keyed by LRN) for this class
// record, and upserts a matching students row so the learner exists as a
// durable identity the system can later consolidate across subjects.
// Learners without a valid 12-digit LRN are skipped — see the
// MISSING_LRN / INVALID_LRN_FORMAT warnings from classRecordParser, which
// already flag exactly these learners for the uploader to fix.
const persistLearnerGradeRecords = async (dbClient, { classRecordId, parsedRecord, subject, schoolYear }) => {
    const termMaps = {
        term1: new Map(parsedRecord.terms.term1.map((record) => [getRecordKey(record), record])),
        term2: new Map(parsedRecord.terms.term2.map((record) => [getRecordKey(record), record])),
        term3: new Map(parsedRecord.terms.term3.map((record) => [getRecordKey(record), record])),
    };

    let persistedCount = 0;
    let skippedCount = 0;

    for (const learner of parsedRecord.learners) {
        if (!isValidLrn(learner.lrn)) {
            skippedCount += 1;
            continue;
        }

        const key = getRecordKey(learner);
        const term1 = termMaps.term1.get(key);
        const term2 = termMaps.term2.get(key);
        const term3 = termMaps.term3.get(key);
        const { first_name, last_name } = splitLearnerName(learner.learner_name);

        await dbClient.query(
            `INSERT INTO students (lrn, first_name, last_name, sex, grade_level, school_year_id)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (lrn) DO UPDATE SET
                first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name,
                sex = EXCLUDED.sex, grade_level = EXCLUDED.grade_level, school_year_id = EXCLUDED.school_year_id`,
            [learner.lrn, first_name, last_name, learner.gender, subject.grade_level, schoolYear.school_year_id]
        );

        const finalGrade = computeFinalGrade(term1, term2, term3);

        await dbClient.query(
            `INSERT INTO grade_records (class_record_id, lrn, term_1, term_2, term_3, final_grade)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [classRecordId, learner.lrn, term1?.term_grade ?? null, term2?.term_grade ?? null, term3?.term_grade ?? null, finalGrade]
        );

        persistedCount += 1;
    }

    return { persisted_count: persistedCount, skipped_no_lrn_count: skippedCount };
};

module.exports = { persistLearnerGradeRecords };
```

### `backend/src/controllers/consolidationController.js` (full file — NEW)
```js
const pool = require("../db");

// ==========================================
// SHARED QUERY: latest grade_records row per
// (student, subject) for a school year
// ==========================================
// A learner may have more than one class_records upload for the same
// subject (a corrected re-upload). Until re-uploads are formally linked
// (superseded_by or similar), "latest wins" is resolved here by
// upload_date, tie-broken by class_record_id.

const buildRankedGradesQuery = (extraWhere) => `
    WITH ranked_grades AS (
        SELECT
            gr.lrn, gr.term_1, gr.term_2, gr.term_3, gr.final_grade, gr.remarks,
            cr.class_record_id, cr.subject_id, cr.teacher_id, cr.upload_date, cr.ready_for_submission, cr.status,
            ROW_NUMBER() OVER (
                PARTITION BY gr.lrn, cr.subject_id
                ORDER BY cr.upload_date DESC, cr.class_record_id DESC
            ) AS rn
        FROM grade_records gr
        INNER JOIN class_records cr ON cr.class_record_id = gr.class_record_id
        WHERE cr.school_year_id = $1
        ${extraWhere}
    )
    SELECT
        rg.lrn, s.first_name, s.last_name, s.grade_level,
        subj.subject_id, subj.subject_name,
        rg.term_1, rg.term_2, rg.term_3, rg.final_grade, rg.remarks,
        rg.class_record_id, rg.upload_date, rg.ready_for_submission, rg.status,
        t.first_name AS teacher_first_name, t.last_name AS teacher_last_name
    FROM ranked_grades rg
    INNER JOIN students s ON s.lrn = rg.lrn
    INNER JOIN subjects subj ON subj.subject_id = rg.subject_id
    INNER JOIN teachers t ON t.teacher_id = rg.teacher_id
    WHERE rg.rn = 1
    ORDER BY s.last_name, s.first_name, subj.subject_name
`;

// Groups the flat per-(student, subject) rows above into one entry per
// student, each carrying its list of per-subject grades.
const groupRowsByStudent = (rows) => {
    const studentsByLrn = new Map();
    rows.forEach((row) => {
        if (!studentsByLrn.has(row.lrn)) {
            studentsByLrn.set(row.lrn, {
                lrn: row.lrn, first_name: row.first_name, last_name: row.last_name,
                grade_level: row.grade_level, subjects: [],
            });
        }
        studentsByLrn.get(row.lrn).subjects.push({
            subject_id: row.subject_id, subject_name: row.subject_name,
            teacher_name: `${row.teacher_first_name} ${row.teacher_last_name}`,
            term_1: row.term_1 !== null ? Number(row.term_1) : null,
            term_2: row.term_2 !== null ? Number(row.term_2) : null,
            term_3: row.term_3 !== null ? Number(row.term_3) : null,
            final_grade: row.final_grade !== null ? Number(row.final_grade) : null,
            remarks: row.remarks, class_record_id: row.class_record_id, upload_date: row.upload_date,
            ready_for_submission: row.ready_for_submission, status: row.status,
        });
    });
    return Array.from(studentsByLrn.values());
};

// Attaches subjects_expected (how many subjects exist for this grade level)
// and subjects_recorded (how many the student actually has a grade for) so
// a reviewer can see at a glance whether a student's record is complete —
// this is a proxy only; it does not yet know about elective/optional
// subjects or subjects not tracked in this school's `subjects` table.
const attachCompleteness = async (students, gradeLevels) => {
    if (students.length === 0) return students;
    const expectedCounts = await pool.query(
        `SELECT grade_level, COUNT(*) AS subject_count FROM subjects WHERE grade_level = ANY($1) GROUP BY grade_level`,
        [gradeLevels]
    );
    const expectedByGradeLevel = new Map(expectedCounts.rows.map((row) => [row.grade_level, Number(row.subject_count)]));
    return students.map((student) => {
        const subjectsExpected = expectedByGradeLevel.get(student.grade_level) ?? null;
        const subjectsRecorded = student.subjects.length;
        const allSubjectsGraded = student.subjects.every((subject) => subject.final_grade !== null);
        return {
            ...student, subjects_expected: subjectsExpected, subjects_recorded: subjectsRecorded,
            all_subjects_submitted: subjectsExpected !== null ? subjectsRecorded >= subjectsExpected : null,
            all_subjects_graded: allSubjectsGraded,
        };
    });
};

// Attaches each student's submission workflow state (Sprint 7). Absence of
// a record_submissions row means "Not Submitted" — that state is computed
// here, never stored.
const attachSubmissionStatus = async (students, schoolYearId) => {
    if (students.length === 0) return students;
    const lrns = students.map((student) => student.lrn);
    const result = await pool.query(
        `SELECT lrn, status, reviewed_at, approved_at, remarks FROM record_submissions WHERE school_year_id = $1 AND lrn = ANY($2)`,
        [schoolYearId, lrns]
    );
    const submissionByLrn = new Map(result.rows.map((row) => [row.lrn, row]));
    return students.map((student) => {
        const submission = submissionByLrn.get(student.lrn);
        return {
            ...student,
            submission: submission
                ? { status: submission.status, reviewed_at: submission.reviewed_at, approved_at: submission.approved_at, remarks: submission.remarks }
                : { status: "Not Submitted", reviewed_at: null, approved_at: null, remarks: null },
        };
    });
};

// ==========================================
// SHARED: fetch consolidated students, with
// completeness + submission status attached
// ==========================================
// Used by the HTTP handlers below and reused by submissionController so
// submit/approve/reject can check completeness without a second round
// trip through HTTP.

const fetchConsolidatedStudents = async (schoolYearId) => {
    const rows = (await pool.query(buildRankedGradesQuery(""), [schoolYearId])).rows;
    const students = groupRowsByStudent(rows);
    const gradeLevels = [...new Set(students.map((student) => student.grade_level))];
    const withCompleteness = await attachCompleteness(students, gradeLevels);
    return attachSubmissionStatus(withCompleteness, schoolYearId);
};

const fetchConsolidatedStudent = async (schoolYearId, lrn) => {
    const rows = (await pool.query(buildRankedGradesQuery("AND gr.lrn = $2"), [schoolYearId, lrn])).rows;
    if (rows.length === 0) return null;
    const [student] = groupRowsByStudent(rows);
    const [withCompleteness] = await attachCompleteness([student], [student.grade_level]);
    const [withSubmission] = await attachSubmissionStatus([withCompleteness], schoolYearId);
    return withSubmission;
};

// GET SCHOOL YEARS — adviser/admin need this; /api/uploads/options is subject-only.
const getSchoolYears = async (req, res) => {
    try {
        const result = await pool.query("SELECT school_year_id, school_year, status FROM school_years ORDER BY school_year_id DESC");
        return res.json({ school_years: result.rows });
    } catch (error) {
        console.error("Get school years error:", error);
        return res.status(500).json({ message: "Failed to retrieve school years." });
    }
};

// Raw upload counts by status for this school year — every class_records
// row, not deduped to "latest per subject" like the grades above.
const getUploadSummary = async (schoolYearId) => {
    const result = await pool.query(
        `SELECT status, COUNT(*) AS upload_count FROM class_records WHERE school_year_id = $1 GROUP BY status`,
        [schoolYearId]
    );
    const countsByStatus = Object.fromEntries(result.rows.map((row) => [row.status, Number(row.upload_count)]));
    const totalUploads = Object.values(countsByStatus).reduce((sum, count) => sum + count, 0);
    return {
        total_uploads: totalUploads,
        validated: countsByStatus["Validated"] ?? 0,
        needs_attention: countsByStatus["Needs Attention"] ?? 0,
    };
};

const getConsolidatedRecordsForSchoolYear = async (req, res) => {
    try {
        const schoolYearId = Number(req.params.schoolYearId);
        if (!Number.isInteger(schoolYearId) || schoolYearId <= 0) {
            return res.status(400).json({ message: "A valid school year ID is required." });
        }
        const schoolYearResult = await pool.query("SELECT school_year_id, school_year FROM school_years WHERE school_year_id = $1", [schoolYearId]);
        if (schoolYearResult.rows.length === 0) {
            return res.status(404).json({ message: "School year not found." });
        }
        const students = await fetchConsolidatedStudents(schoolYearId);
        const uploadSummary = await getUploadSummary(schoolYearId);
        return res.json({
            school_year: schoolYearResult.rows[0], student_count: students.length,
            upload_summary: uploadSummary, students,
        });
    } catch (error) {
        console.error("Get consolidated records error:", error);
        return res.status(500).json({ message: "Failed to retrieve consolidated records." });
    }
};

const getConsolidatedRecordForStudent = async (req, res) => {
    try {
        const schoolYearId = Number(req.params.schoolYearId);
        const { lrn } = req.params;
        if (!Number.isInteger(schoolYearId) || schoolYearId <= 0) {
            return res.status(400).json({ message: "A valid school year ID is required." });
        }
        if (!lrn || !/^\d{12}$/.test(lrn)) {
            return res.status(400).json({ message: "A valid 12-digit LRN is required." });
        }
        const student = await fetchConsolidatedStudent(schoolYearId, lrn);
        if (!student) {
            return res.status(404).json({ message: "No consolidated record found for this LRN in this school year." });
        }
        return res.json({ student });
    } catch (error) {
        console.error("Get consolidated record error:", error);
        return res.status(500).json({ message: "Failed to retrieve the consolidated record." });
    }
};

module.exports = {
    getSchoolYears, getConsolidatedRecordsForSchoolYear, getConsolidatedRecordForStudent,
    fetchConsolidatedStudents, fetchConsolidatedStudent,
};
```

### `backend/src/controllers/submissionController.js` (full file — NEW)
```js
const pool = require("../db");
const { fetchConsolidatedStudents, fetchConsolidatedStudent } = require("./consolidationController");

const isValidSchoolYearId = (value) => Number.isInteger(value) && value > 0;
const isValidLrn = (value) => typeof value === "string" && /^\d{12}$/.test(value);

// SUBMIT ONE STUDENT'S RECORD FOR APPROVAL (Class Adviser)
// Only allowed once every expected subject has a recorded grade. Re-submitting
// a Rejected record is allowed (back to Pending Approval); re-submitting an
// Approved one is not — that record is final until a separate amend workflow exists.
const submitForApproval = async (req, res) => {
    try {
        const schoolYearId = Number(req.params.schoolYearId);
        const { lrn } = req.params;
        if (!isValidSchoolYearId(schoolYearId)) return res.status(400).json({ message: "A valid school year ID is required." });
        if (!isValidLrn(lrn)) return res.status(400).json({ message: "A valid 12-digit LRN is required." });

        const student = await fetchConsolidatedStudent(schoolYearId, lrn);
        if (!student) return res.status(404).json({ message: "No consolidated record found for this LRN in this school year." });

        if (!student.all_subjects_submitted) {
            return res.status(409).json({
                message: "This student's record is incomplete — every expected subject must have a recorded grade before it can be submitted for approval.",
                subjects_expected: student.subjects_expected, subjects_recorded: student.subjects_recorded,
            });
        }
        if (student.submission.status === "Approved") {
            return res.status(409).json({ message: "This record has already been approved and cannot be resubmitted." });
        }

        const result = await pool.query(
            `INSERT INTO record_submissions (lrn, school_year_id, status, reviewed_by, reviewed_at, updated_at)
             VALUES ($1, $2, 'Pending Approval', $3, NOW(), NOW())
             ON CONFLICT (lrn, school_year_id) DO UPDATE SET
                status = 'Pending Approval', reviewed_by = EXCLUDED.reviewed_by, reviewed_at = NOW(),
                approved_by = NULL, approved_at = NULL, remarks = NULL, updated_at = NOW()
             RETURNING *`,
            [lrn, schoolYearId, req.user.user_id]
        );
        return res.json({ message: "Submitted for approval.", submission: result.rows[0] });
    } catch (error) {
        console.error("Submit for approval error:", error);
        return res.status(500).json({ message: "Failed to submit this record for approval." });
    }
};

// SUBMIT EVERY ELIGIBLE STUDENT AT ONCE (Class Adviser)
// "Eligible" = complete and not already Approved. Skips everyone else,
// reports counts rather than erroring.
const submitAllEligible = async (req, res) => {
    try {
        const schoolYearId = Number(req.params.schoolYearId);
        if (!isValidSchoolYearId(schoolYearId)) return res.status(400).json({ message: "A valid school year ID is required." });

        const students = await fetchConsolidatedStudents(schoolYearId);
        const eligible = students.filter((s) => s.all_subjects_submitted && s.submission.status !== "Approved");

        let submittedCount = 0;
        for (const student of eligible) {
            await pool.query(
                `INSERT INTO record_submissions (lrn, school_year_id, status, reviewed_by, reviewed_at, updated_at)
                 VALUES ($1, $2, 'Pending Approval', $3, NOW(), NOW())
                 ON CONFLICT (lrn, school_year_id) DO UPDATE SET
                    status = 'Pending Approval', reviewed_by = EXCLUDED.reviewed_by, reviewed_at = NOW(),
                    approved_by = NULL, approved_at = NULL, remarks = NULL, updated_at = NOW()`,
                [student.lrn, schoolYearId, req.user.user_id]
            );
            submittedCount += 1;
        }

        return res.json({
            message: `Submitted ${submittedCount} record(s) for approval.`,
            submitted_count: submittedCount,
            already_approved_count: students.filter((s) => s.submission.status === "Approved").length,
            incomplete_count: students.filter((s) => !s.all_subjects_submitted).length,
        });
    } catch (error) {
        console.error("Submit all eligible error:", error);
        return res.status(500).json({ message: "Failed to submit records for approval." });
    }
};

// APPROVE / REJECT A PENDING SUBMISSION (School Administrator)
// Both only act on a record currently "Pending Approval". On decision,
// notifies the adviser who submitted it (see notifications table).
const decideSubmission = (targetStatus) => async (req, res) => {
    try {
        const schoolYearId = Number(req.params.schoolYearId);
        const { lrn } = req.params;
        const { remarks } = req.body || {};
        if (!isValidSchoolYearId(schoolYearId)) return res.status(400).json({ message: "A valid school year ID is required." });
        if (!isValidLrn(lrn)) return res.status(400).json({ message: "A valid 12-digit LRN is required." });

        const existing = await pool.query(
            `SELECT rs.status, rs.reviewed_by, s.first_name, s.last_name
             FROM record_submissions rs INNER JOIN students s ON s.lrn = rs.lrn
             WHERE rs.lrn = $1 AND rs.school_year_id = $2`,
            [lrn, schoolYearId]
        );
        if (existing.rows.length === 0 || existing.rows[0].status !== "Pending Approval") {
            return res.status(409).json({ message: "This record is not currently pending approval." });
        }

        const { reviewed_by: reviewedBy, first_name: firstName, last_name: lastName } = existing.rows[0];

        const result = await pool.query(
            `UPDATE record_submissions SET status = $1, approved_by = $2, approved_at = NOW(), remarks = $3, updated_at = NOW()
             WHERE lrn = $4 AND school_year_id = $5 RETURNING *`,
            [targetStatus, req.user.user_id, remarks || null, lrn, schoolYearId]
        );

        if (reviewedBy) {
            const studentName = `${lastName}, ${firstName}`;
            const message = targetStatus === "Approved"
                ? `${studentName}'s consolidated record was approved.`
                : `${studentName}'s consolidated record was rejected.${remarks ? ` Reason: ${remarks}` : ""}`;
            await pool.query(
                `INSERT INTO notifications (user_id, title, message, status) VALUES ($1, $2, $3, 'Unread')`,
                [reviewedBy, `Submission ${targetStatus}`, message]
            );
        }

        return res.json({ message: `Record ${targetStatus.toLowerCase()}.`, submission: result.rows[0] });
    } catch (error) {
        console.error(`${targetStatus} submission error:`, error);
        return res.status(500).json({ message: `Failed to ${targetStatus.toLowerCase()} this record.` });
    }
};

const approveSubmission = decideSubmission("Approved");
const rejectSubmission = decideSubmission("Rejected");

module.exports = { submitForApproval, submitAllEligible, approveSubmission, rejectSubmission };
```

### `backend/src/controllers/notificationController.js` (full file — NEW)
```js
const pool = require("../db");

const getMyNotifications = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT notification_id, title, message, status, created_at
             FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
            [req.user.user_id]
        );
        const unreadCount = result.rows.filter((row) => row.status === "Unread").length;
        return res.json({ notifications: result.rows, unread_count: unreadCount });
    } catch (error) {
        console.error("Get notifications error:", error);
        return res.status(500).json({ message: "Failed to retrieve notifications." });
    }
};

const markNotificationRead = async (req, res) => {
    try {
        const notificationId = Number(req.params.notificationId);
        if (!Number.isInteger(notificationId) || notificationId <= 0) {
            return res.status(400).json({ message: "A valid notification ID is required." });
        }
        const result = await pool.query(
            `UPDATE notifications SET status = 'Read' WHERE notification_id = $1 AND user_id = $2 RETURNING notification_id`,
            [notificationId, req.user.user_id]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: "Notification not found." });
        return res.json({ message: "Notification marked as read." });
    } catch (error) {
        console.error("Mark notification read error:", error);
        return res.status(500).json({ message: "Failed to update the notification." });
    }
};

const markAllNotificationsRead = async (req, res) => {
    try {
        await pool.query(`UPDATE notifications SET status = 'Read' WHERE user_id = $1 AND status = 'Unread'`, [req.user.user_id]);
        return res.json({ message: "All notifications marked as read." });
    } catch (error) {
        console.error("Mark all notifications read error:", error);
        return res.status(500).json({ message: "Failed to update notifications." });
    }
};

module.exports = { getMyNotifications, markNotificationRead, markAllNotificationsRead };
```

**Frontend files not reproduced in full here** (they're long, mostly inline-styled JSX consistent with the rest of the codebase) — locate at:
- `frontend/src/pages/ConsolidatedRecords.jsx` — school-year picker, per-student expandable rows with subject grade table, submission status badge, adviser Submit/Submit-All buttons, admin Approve/Reject buttons with inline reject-reason textarea.
- `frontend/src/components/NotificationBell.jsx` — polling (30s) bell with unread badge, dropdown panel, mark-read/mark-all-read.
- `frontend/src/pages/Dashboard.jsx` (adviser) and `frontend/src/pages/AdminDashboard.jsx` (admin) — both rewritten to fetch real data from the consolidation endpoints instead of hardcoded mock numbers; both now render `<NotificationBell />` in place of a dead bell icon, and both now have working nav to `/consolidated-records`.

---

## 6. Honest Gap Assessment (against the "EduCheck v2.0" enhancement notes)

The user's adviser produced a broader v2.0 vision document mid-session. Cross-checked against actual code, here's what's real vs not, as of this pause:

| Feature | Status |
|---|---|
| Direct DepEd e-Class Record Import | ✅ Built |
| Multi-Subject Consolidation | ✅ Built |
| Automatic SF10 Generation | ❌ **Blocked — no SF10 template exists anywhere in the repo.** Cannot start until the user obtains the actual official form. |
| Rule-Based Validation Engine | ✅ Mostly built (missing grades, invalid ranges, incorrect averages, LRN issues all checked). Gap: no explicit duplicate-learner-number-within-one-file check. |
| Submission Readiness Assessment | ⚠️ Partial — blocks submission until complete, but no % score or field-level detail (e.g. "Missing: Teacher Signature") like the vision doc's example — those fields don't exist in the data model at all. |
| Academic Analytics Dashboard | ⚠️ Minimal — only On Track / At Risk / Needs Intervention counts (DepEd grade-band based). No class/subject performance, honor roll, grade distribution, promotion stats. |
| Searchable Digital Repository | ❌ Not started — no search by LRN/Name/Grade/Year. |
| Offline-First | ❌ Not started — no offline storage, no sync, no mobile app at all. |
| Principal role | ❌ **Confirmed: does not exist anywhere** — no role value, no route, no dashboard. |
| Admin "generates reports" | ❌ Not built. |
| Subject Teacher visibility into submission outcome | ❌ **Real gap identified, not yet fixed**: only the adviser gets notified when a record is approved/rejected. The subject teacher who uploaded the underlying subject grades has no visibility into what happened to the consolidated record. |

---

## 7. Literal Next Step

Two candidates were on the table when we paused; **neither has been started**:

1. **Fix subject-teacher visibility** — smallest, most concrete: extend the notification (or `getMyClassRecords`) so a subject teacher can see whether their uploaded subject's data ended up in an approved/rejected consolidated record. Natural continuation of the notification work just finished.
2. **Prioritized build order for the rest of the v2.0 gaps** — SF10 (blocked on template), analytics dashboard, repository search, Principal role, offline/mobile.

**Recommendation for the next session:** start with #1 (small, closes a real known gap, reuses the exact `notifications` infrastructure just built) before moving to the larger #2 items. Do **not** start SF10 work until the actual official SF10 template has been obtained — repeated attempts to guess its structure were explicitly avoided this session for good reason.

## 8. Operational Notes for Next Session

- **Start backend:** `cd backend && npm run dev` → confirm the exact line `EduCheck backend running on http://localhost:5000` prints before assuming anything else works.
- **Start frontend:** `cd frontend && npm run dev` → open the printed URL (typically `http://localhost:5173`), not port 5000.
- **Seeded test accounts:** see §3. Password unknown to this assistant (hashed) — use `admin.educheck` to reset via User Management if needed.
- **The live DB currently has real usage data** (§3) — don't wipe `record_submissions`, `notifications`, `students`, or `grade_records` without checking with the user first; this is no longer throwaway test residue.
- **Git status at pause:** all work described here is uncommitted in the working tree (new + modified files, not yet `git add`/`git commit`/pushed). The user has not asked for a commit yet — confirm before committing or pushing.
- **A stray earlier commit** on `main` titled "ddgjsj" exists (likely accidental) and local `main` was reported behind `origin/main` earlier in the session — worth reconciling before any push.
