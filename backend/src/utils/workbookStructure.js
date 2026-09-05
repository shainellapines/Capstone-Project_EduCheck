const workbookStructure = {
    sheets: {
        input: "INPUT",
        term1: "TERM1",
        term2: "TERM2",
        term3: "TERM3",
        summary: "SUMMARY OF GRADES",
        helper: "Helper (Do Not Delete)",
        doNotDelete: "DO NOT DELETE",
    },

    learner: {
        numberColumn: "A",
        nameColumn: "B",
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
