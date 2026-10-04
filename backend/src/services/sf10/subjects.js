const sf10Structure = require("../../utils/sf10Structure");

// Canonical learning-area keys used by SF10 (one key = one printed row on
// the form). Historical entry stores these keys, never free text, so every
// grade lands on a known row.
const SUBJECT_LABELS = {
    language: "Language",
    readingAndLiteracy: "Reading and Literacy",
    filipino: "Filipino",
    english: "English",
    mathematics: "Mathematics",
    science: "Science",
    gmrc: "GMRC (Good Manners and Right Conduct)",
    makabansa: "Makabansa",
    aralingPanlipunan: "Araling Panlipunan",
    epp: "EPP",
    tle: "TLE",
    mapeh: "MAPEH",
    musicAndArts: "Music & Arts",
    physicalEducationAndHealth: "Physical Education & Health",
    arabicLanguage: "Arabic Language (ALIVE schools only)",
    islamicValuesEducation: "Islamic Values Education (ALIVE schools only)",
};

// MAPEH's components are sub-rows of the MAPEH learning area, not learning
// areas of their own - they never count separately toward the general
// average. Arabic/IVE only apply to ALIVE/Madrasah schools.
const COMPONENT_KEYS = new Set(["musicAndArts", "physicalEducationAndHealth"]);
const OPTIONAL_KEYS = new Set(["arabicLanguage", "islamicValuesEducation", ...COMPONENT_KEYS]);

// EduCheck's `subjects` table names -> SF10 keys. Grade 6 is seeded as
// "ESP", which the 2025 form prints as GMRC (ESP's MATATAG-era name).
const EDUCHECK_NAME_TO_KEY = {
    "reading and literacy": "readingAndLiteracy",
    language: "language",
    filipino: "filipino",
    english: "english",
    mathematics: "mathematics",
    science: "science",
    gmrc: "gmrc",
    esp: "gmrc",
    makabansa: "makabansa",
    "araling panlipunan": "aralingPanlipunan",
    epp: "epp",
    tle: "tle",
    mapeh: "mapeh",
};

const subjectKeyForName = (name) => EDUCHECK_NAME_TO_KEY[String(name || "").trim().toLowerCase()] ?? null;

const gradeBlockFor = (gradeLevel) =>
    sf10Structure.gradeBlocks.find((block) => String(block.grade) === String(gradeLevel)) ?? null;

// Every key printed for that grade on the form (including optional ones).
const subjectKeysForGrade = (gradeLevel) => Object.keys(gradeBlockFor(gradeLevel)?.subjectRows ?? {});

// Keys a complete record for that grade is expected to have.
const requiredSubjectKeysForGrade = (gradeLevel) =>
    subjectKeysForGrade(gradeLevel).filter((key) => !OPTIONAL_KEYS.has(key));

module.exports = {
    SUBJECT_LABELS,
    COMPONENT_KEYS,
    subjectKeyForName,
    gradeBlockFor,
    subjectKeysForGrade,
    requiredSubjectKeysForGrade,
};
