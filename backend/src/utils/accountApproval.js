const pool = require("../db");

// Principal approval of accounts (migration 010). The Administrator creates
// accounts and changes roles; the Principal approves anything that grants
// access, so no single person can give themselves or anyone else access.

const PENDING_APPROVAL = "Pending Approval";
const REJECTED = "Rejected";

const ROLE_LABELS = {
    subject: "Subject Teacher",
    adviser: "Class Adviser",
    principal: "Principal",
    admin: "School Administrator",
};

// More access to the right. Moving right needs approval; moving left
// (removing access) applies at once, so access can always be cut quickly.
const ROLE_RANK = { subject: 1, adviser: 2, principal: 3, admin: 4 };

const grantsMoreAccess = (fromRole, toRole) => (ROLE_RANK[toRole] || 0) > (ROLE_RANK[fromRole] || 0);

// With no active Principal (first setup) nobody could approve, so accounts
// are active at once rather than the school being locked out.
const hasActivePrincipal = async () => {
    const result = await pool.query(
        `SELECT 1 FROM users
         WHERE role = 'principal' AND LOWER(COALESCE(status, 'Active')) = 'active'
         LIMIT 1`
    );
    return result.rows.length > 0;
};

const notifyActiveRole = (role, title, message) =>
    pool.query(
        `
        INSERT INTO notifications (user_id, title, message, status)
        SELECT user_id, $2, $3, 'Unread'
        FROM users
        WHERE role = $1 AND LOWER(COALESCE(status, 'Active')) = 'active'
        `,
        [role, title, message]
    );

// The Class Adviser slots an account holds; an account holding one may not
// stop being an Adviser (see assignmentController).
const findAdviserSlots = async (userId) => {
    const result = await pool.query(
        `
        SELECT sec.section_name, sy.school_year
        FROM teacher_assignments ta
        INNER JOIN teachers t ON t.teacher_id = ta.teacher_id
        INNER JOIN sections sec ON sec.section_id = ta.section_id
        INNER JOIN school_years sy ON sy.school_year_id = ta.school_year_id
        WHERE t.user_id = $1 AND ta.subject_id IS NULL
        ORDER BY sy.school_year, sec.section_name
        `,
        [userId]
    );
    return result.rows.map((row) => `${row.section_name} (${row.school_year})`);
};

const adviserSlotMessage = (held) =>
    `This account is the Class Adviser of ${held.join(", ")}. ` +
    "Remove those Class Adviser assignments before changing its role.";

module.exports = {
    PENDING_APPROVAL,
    REJECTED,
    ROLE_LABELS,
    grantsMoreAccess,
    hasActivePrincipal,
    notifyActiveRole,
    findAdviserSlots,
    adviserSlotMessage,
};
