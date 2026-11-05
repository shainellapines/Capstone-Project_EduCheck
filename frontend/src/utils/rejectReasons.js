// Why the Administrator returns a consolidated record during approval.
// Upload errors (blank or out-of-range scores, wrong totals) never reach
// approval, since the validator stops them first, so a rejection is for
// what the system cannot check. The same list is in the mobile app
// (mobile/lib/core/reject_reasons.dart).

export const REJECT_REASONS = [
    "Wrong learner details (name, LRN, sex or birthdate)",
    "Learner does not belong to this section",
    "Grades do not match the teacher's class record",
    "Learner transferred out or dropped",
    "Other",
];

export const REJECT_GUIDANCE =
    "Reject only for problems EduCheck cannot check, such as wrong learner details or grades that do not match the class record. The Adviser sees your reason.";

// "Reason: details", or just the reason. "Other" needs details.
export const buildRejectRemarks = (reason, details) => {
    const text = (details || "").trim();
    if (!reason || (reason === "Other" && !text)) return "";
    if (reason === "Other") return text;
    return text ? `${reason}: ${text}` : reason;
};
