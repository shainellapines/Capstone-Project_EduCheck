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

    // Descriptive cells on the INPUT sheet (grade & section, teacher,
    // subject, school year). Informational only - the teacher's form
    // selection stays authoritative - but a mismatch is worth a warning.
    header: {
        gradeSection: "J7",
        teacher: "Q7",
        subject: "Y7",
        schoolYear: "Y5",
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
        term1: {
            sheet: "TERM1",
        },

        term2: {
            sheet: "TERM2",
        },

        term3: {
            sheet: "TERM3",
        },
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
