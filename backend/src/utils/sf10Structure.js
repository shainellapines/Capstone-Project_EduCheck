// Cell-coordinate map for the official SF10-ES (School Form 10 - Elementary
// School Learner's Permanent Academic Record), "Revised 2025 based on
// DepEd Order No. 10, s. 2024" edition.
//
// Source template: "Grade 4-School-Form-10-ES-Learners-Academic Permanent-
// Record-Grade4-032725.xlsx" (repo root, next to this project's other
// planning docs). Despite the "Grade4" filename, this is the FULL
// elementary form covering Grades 1-6 on one document - "Grade4" just
// names which student's copy this particular file was exported from, not
// a grade restriction. Do not re-derive a "only Grade 4 is supported"
// assumption from the filename.
//
// Coordinates below were read directly from the template's merged-cell
// layout (XLSX.utils.decode_range / sheet['!merges']), not guessed from
// looking at the rendered form. A cell given as a single address (e.g.
// "K") is NOT part of a merge - write to it directly. A cell given as the
// left/top member of a merged range is the anchor - xlsx/exceljs (or any
// writer that respects merges) must write to the anchor cell; writing to
// a merge's other member cells is either ignored or corrupts the merge.
//
// CONFIDENCE LEVELS (read before using this file for real generation):
//   - personalInfo, gradeBlocks[].columns, gradeBlocks[].subjectRows,
//     gradeBlocks[].generalAverageRow: HIGH. Verified by reading every
//     grade block's merge list directly and cross-checking the pattern
//     repeats identically across all 6 blocks (it does, aside from the
//     expected subject-list differences below).
//   - gradeBlocks[].header (School/District/Division/Region/Classified
//     Grade/Section/School Year/Adviser/Signature): UNVERIFIED. Several
//     labels and blank fields share rows in a way that makes the exact
//     value cell ambiguous from merge data alone - do NOT trust these
//     null placeholders as real coordinates. Fastest way to fill them in:
//     open the template in Excel, click each blank field once, and read
//     its address from the Name Box, or write a small script that puts a
//     distinct marker string in each guessed cell and open the result to
//     see where each one landed.
//   - eligibility: partially verified (label-adjacent blank fields only,
//     see comments). Checkbox cells for "Credential Presented for Grade
//     1" not identified.
//
// SUBJECT NOTE: Grades 1-6 all have their Learning Areas pre-printed by
// DepEd on this form - none of it needs to be filled in dynamically. (An
// earlier read of this file mistakenly concluded Grade 6 was blank
// pending an unreleased MATATAG subject list - that was wrong, it was a
// mis-scan of the "Back" sheet's second, genuinely-blank SPARE block,
// which sits below Grades 5-6 and is unrelated to any specific grade -
// see grade: "spare" below.)
//
// BLOCKED: SF10 GENERATION CANNOT GO LIVE AGAINST THIS TEMPLATE YET.
// This form grades in "Quarter 1-4" - it is DepEd's OLDER, 4-quarter-per-
// year edition. EduCheck's grade_records table stores term_1/2/3
// (migration 002), matching the CURRENT E-Class Record's 3-term-per-year
// layout. These two are not the same grading calendar, and DepEd has not
// yet published an SF10 revision that uses 3 terms - so there is no
// official 3-term<->4-quarter conversion rule to apply. This is not a
// question to take to the adviser (there's no correct answer to give,
// only DepEd's eventual release) and not something to invent a rule for
// - doing so would produce a document that looks official but encodes a
// made-up grading conversion. Treat gradeBlocks[].columns.quarters as
// structurally accurate (this IS where a Quarter-graded SF10 wants its
// values) but do not wire real term_1/2/3 values into them until either
// (a) DepEd releases a 3-term SF10-ES and this file is updated to match
// it, or (b) the adviser/DepEd confirms an official conversion exists.
// The rest of this file (personal info, subject grid layout, block
// positions) is not affected by this and stays valid regardless of which
// edition's grading columns get used.

const sf10Structure = {
    sheets: {
        front: "Front",
        back: "Back",
        helper: "Sir Wedz Helper Table",
    },

    // One-time fields - filled once per learner, not once per grade-year.
    // Each address is the blank fillable field next to its label, not the
    // label itself.
    personalInfo: {
        lastName: "E9", // label "LAST NAME:" at B9
        firstName: "R9", // label "FIRST NAME:" at N9
        nameExtension: "AD9", // label "NAME EXTN. (Jr,I,II)" at Y9
        middleName: "AQ9", // label "MIDDLE NAME:" at AJ9
        lrn: "J10", // label "Learner Reference Number (LRN): " at B10
        birthdate: "V10", // label "Birthdate (mm/dd/yyyy):" at U10
        sex: "AT10", // label "Sex: " at AS10
    },

    // "ELIGIBILITY FOR ELEMENTARY SCHOOL ENROLLMENT" - also one-time,
    // describes how the learner entered Grade 1.
    eligibility: {
        nameOfSchool: "F15", // label "Name of School:" at B15
        schoolId: "T15", // label "School ID:" at R15
        addressOfSchool: "Z15", // label "Address of School:" at V15
        peptRating: "J18", // label "PEPT Passer  Rating:" at C18
        dateOfExamination: "W18", // label "Date of Examination/Assessment (mm/dd/yyyy):" at L18
        others: "AQ18", // label "Others (Pls. Specify):" at AE18
        testingCenterNameAddress: "L19", // label "Name and Address of Testing Center:" at C19
        remark: "AJ19", // label "Remark:" at AD19
        // Credential Presented for Grade 1 checkboxes (Kinder Progress
        // Report / ECCD Checklist / Kindergarten Certificate of
        // Completion) sit at labels L14/V14/AI14 - the actual checkbox
        // mark cell for each was not identified from merge data. Verify
        // visually before using.
        credentialCheckboxes: null,
    },

    // Six fixed grade-year blocks in curriculum-progression order, plus
    // one spare block that is NOT tied to a specific grade (see grade:
    // "spare"). Front holds Grades 1-4 as 2 stacked block-rows x 2
    // columns; Back's first block-row holds Grades 5-6; Back's second
    // block-row is the spare block.
    gradeBlocks: [
        {
            grade: 1,
            sheet: "front",
            header: null, // see UNVERIFIED note above; approx rows 23-27
            columns: { label: "B", quarters: ["K", "L", "N", "O"], final: "P", remarks: "S" },
            subjectRows: {
                language: 30,
                readingAndLiteracy: 31,
                mathematics: 32,
                gmrc: 33,
                makabansa: 34,
                arabicLanguage: 43, // "*Arabic Language" - only relevant for ALIVE/Madrasah program schools
                islamicValuesEducation: 44, // "*Islamic Values Education" - same
            },
            generalAverageRow: 45,
            remedialClasses: { headerRow: 47, tableHeaderRow: 48 }, // "Learning Areas / Final Rating / Remedial Class Mark / Recomputed Final Grade / Remarks"
        },
        {
            grade: 2,
            sheet: "front",
            header: null, // approx rows 23-27, columns V onward
            columns: { label: "V", quarters: ["AJ", "AM", "AO", "AR"], final: "AT", remarks: "AW" },
            subjectRows: {
                filipino: 30,
                english: 31,
                mathematics: 32,
                gmrc: 33,
                makabansa: 34,
                arabicLanguage: 43,
                islamicValuesEducation: 44,
            },
            generalAverageRow: 45,
            remedialClasses: { headerRow: 47, tableHeaderRow: 48 },
        },
        {
            grade: 3,
            sheet: "front",
            header: null, // approx rows 52-56
            columns: { label: "B", quarters: ["K", "L", "N", "O"], final: "P", remarks: "S" },
            subjectRows: {
                filipino: 60,
                english: 61,
                mathematics: 62,
                science: 63, // Science first appears at Grade 3
                gmrc: 64,
                makabansa: 65,
                arabicLanguage: 73,
                islamicValuesEducation: 74,
            },
            generalAverageRow: 75,
            remedialClasses: { headerRow: 77, tableHeaderRow: 78 },
        },
        {
            grade: 4,
            sheet: "front",
            header: null, // approx rows 52-56, columns V onward
            columns: { label: "V", quarters: ["AJ", "AM", "AO", "AR"], final: "AT", remarks: "AW" },
            subjectRows: {
                filipino: 60,
                english: 61,
                mathematics: 62,
                science: 63,
                gmrc: 64,
                araingPanlipunan: 65,
                epp: 66,
                mapeh: 67, // group header row only - not itself scored, see musicAndArts / physicalEducationAndHealth
                musicAndArts: 68,
                physicalEducationAndHealth: 69,
                arabicLanguage: 73,
                islamicValuesEducation: 74,
            },
            generalAverageRow: 75,
            remedialClasses: { headerRow: 77, tableHeaderRow: 78 },
        },
        {
            grade: 5,
            sheet: "back",
            header: null, // approx rows 3-6
            columns: { label: "B", quarters: ["H", "I", "J", "K"], final: "L", remarks: "O" },
            subjectRows: {
                filipino: 10,
                english: 11,
                mathematics: 12,
                science: 13,
                gmrc: 14,
                araingPanlipunan: 15,
                epp: 16,
                mapeh: 17, // group header row only
                musicAndArts: 18,
                physicalEducationAndHealth: 19,
                arabicLanguage: 23,
                islamicValuesEducation: 24,
            },
            generalAverageRow: 25,
            remedialClasses: { headerRow: 27, tableHeaderRow: 28 },
        },
        {
            grade: 6,
            sheet: "back",
            header: null, // approx rows 3-6, columns S onward
            columns: { label: "S", quarters: ["AB", "AD", "AE", "AF"], final: "AG", remarks: "AH" },
            subjectRows: {
                filipino: 10,
                english: 11,
                mathematics: 12,
                science: 13,
                gmrc: 14,
                araingPanlipunan: 15,
                tle: 16, // "TLE", not "EPP" - the only subject-list difference vs Grade 5
                mapeh: 17, // group header row only
                musicAndArts: 18,
                physicalEducationAndHealth: 19,
                arabicLanguage: 23,
                islamicValuesEducation: 24,
            },
            generalAverageRow: 25,
            remedialClasses: { headerRow: 27, tableHeaderRow: 28 },
        },
        {
            // Genuinely blank block on the Back sheet, rows 32-59 (both
            // the "B" and "S" sub-blocks). Not labeled with any subject
            // list or grade number in the template itself - likely meant
            // for a retained/repeated year or similar edge case, filled
            // in by hand by the school. Column layout mirrors Grade 5/6
            // by position, but subjectRows must be supplied by the
            // caller (or left as a hand-fill case EduCheck doesn't try to
            // automate) rather than assumed from this file.
            grade: "spare",
            sheet: "back",
            header: null,
            columns: { label: "B", quarters: ["H", "I", "J", "K"], final: "L", remarks: "O" },
            subjectRows: {}, // intentionally empty - see comment above
            generalAverageRow: 54,
            remedialClasses: { headerRow: 56, tableHeaderRow: 57 },
        },
    ],

    // Back sheet, "For Transfer Out / Elementary School Completer Only" -
    // 3 stacked CERTIFICATION boxes (rows 61-66, 68-73, 75-80), each with
    // an identical layout. Only the first box's addresses are mapped;
    // the other two repeat the same column offsets 7 rows later.
    certificationBoxes: [
        {
            sheet: "back",
            studentNameFillIn: "H62", // "...that this is a true record of ______" (label at C62)
            lrnFillIn: "S62", // label "with LRN" at Q62
            eligibleGradeFillIn: "AG62", // label "...eligible for admission to Grade " at V62, period at AI62
            schoolName: "E63",
            schoolId: "L63",
            division: "Q63",
            lastSchoolYearAttended: "Z63",
            date: "E65",
            principalSignatureOverPrintedName: "M65",
        },
    ],
};

module.exports = sf10Structure;
