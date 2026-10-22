import { useEffect, useState } from "react";
import { ChevronDown, Download, FileText, LifeBuoy, Search, UserCog } from "lucide-react";

import "../../styles/Dashboard.css";
import "./Help.css";
import Sidebar from "../../components/Sidebar";
import { getStoredUser } from "../../utils/session";

// Help & Support: answers to the questions each role asks most, plus the
// User's Manual when one has been published. Answers describe how EduCheck
// behaves today (see 03-Testing/EduCheck_Known_Limitations.md); keep them in
// step when that behaviour changes.

// Put the PDF at frontend/public/EduCheck-User-Manual.pdf to offer it here.
const MANUAL_URL = "/EduCheck-User-Manual.pdf";

const ROLE_LABEL = {
    subject: "Subject Teacher",
    adviser: "Class Adviser",
    admin: "School Administrator",
    principal: "Principal",
};

const UPLOADING = {
    title: "Uploading e-Class Records",
    items: [
        {
            q: "Which file do I upload?",
            a: "The official DepEd e-Class Record template for one subject, saved as .xlsx or .xls, up to 10 MB. Keep the template's sheets and layout as they are, and give every learner an LRN. Rows without an LRN are skipped.",
        },
        {
            q: "How do I know which subjects I've already uploaded?",
            a: "On the upload page every subject shows its status: Validated, Needs fixes, or Not uploaded yet, with the date of the last upload. The count above the list shows how many are done, and the next subject still to upload is selected for you.",
        },
        {
            q: "My upload says \"Needs fixes\". What do I do?",
            a: "Open the validation results to see each problem. Correct the cells in your Excel file, then upload it again for the same subject. Grades are always corrected in the Excel file, not inside EduCheck.",
        },
        {
            q: "Why was my file refused as the wrong subject?",
            a: "The subject written in the file's header (cell Y7 of the INPUT sheet) must match the subject you selected. Short names such as Math, AP, EsP, GMRC, TLE/EPP and MAPEH are accepted. If the header is blank, the file is accepted with a warning.",
        },
        {
            q: "Some learners were listed as \"not updated\" after my upload.",
            a: "Those learners' records are already Pending Approval or Approved, so they are locked. The rest of the class was saved. To change a locked learner, the Class Adviser must first request a revision.",
        },
        {
            q: "A subject I teach is missing from the list.",
            a: "You can only upload the subjects and sections you're assigned to. Ask your School Administrator to add the assignment.",
        },
    ],
};

const FAQ_BY_ROLE = {
    subject: [
        UPLOADING,
        {
            title: "Working with your Class Adviser",
            items: [
                {
                    q: "My Class Adviser sent a record back.",
                    a: "Their note appears on your Dashboard and in Notifications. Fix what they pointed out in your Excel file and upload it again.",
                },
                {
                    q: "When can my Adviser use my grades?",
                    a: "As soon as the upload is Validated. An upload that still needs fixes can't be consolidated.",
                },
            ],
        },
    ],
    adviser: [
        {
            title: "Your section",
            items: [
                {
                    q: "How do I see which teachers have uploaded?",
                    a: "Open Section Progress. It shows every subject in your section, whether it's uploaded, and whether it passed the checks.",
                },
                {
                    q: "A subject's grades look wrong.",
                    a: "In Consolidated Records, request a revision for that subject and explain what to fix. The subject teacher is notified and uploads a corrected file.",
                },
                {
                    q: "When can I submit a learner's record?",
                    a: "When every subject is Validated, every term has a final grade, and no subject is waiting for a revision. EduCheck tells you what is still missing.",
                },
                {
                    q: "I need to change a record that is already submitted or approved.",
                    a: "Request a revision on the record. It reopens so the subject teacher can upload a correction, and you can submit it again.",
                },
                {
                    q: "Why don't I see \"Upload Files\" in my sidebar?",
                    a: "It appears when your section is Self-Contained or when you're assigned subjects of your own. Otherwise your subject teachers upload, and you review.",
                },
            ],
        },
        {
            title: "Permanent records (SF10)",
            items: [
                {
                    q: "How do I download a learner's SF10?",
                    a: "Open Records & SF10, search for the learner, and open their record. A school year appears on the SF10 once its record is Approved.",
                },
                {
                    q: "How do I add the learner's earlier school years?",
                    a: "On the learner's SF10 page, type the earlier years in, or import them from the learner's existing SF10-ES Excel file. The import shows a preview and saves only the years you tick.",
                },
                {
                    q: "Why does a 3-term year look different on the SF10?",
                    a: "DepEd has no 3-term SF10 yet, so the term grades are printed in three of the four rating columns, labelled T1 to T3. EduCheck never converts terms into quarters.",
                },
            ],
        },
        UPLOADING,
    ],
    admin: [
        {
            title: "Accounts",
            items: [
                {
                    q: "How do I add a teacher?",
                    a: "In Accounts, add the account with the teacher's DepEd email (@deped.gov.ph). The Principal approves it, then you finish its setup with the employee number and a temporary password.",
                },
                {
                    q: "Why is a new account still Pending Approval?",
                    a: "It's waiting for the Principal in Account Approvals. A role change that gives more access waits for the Principal too.",
                },
                {
                    q: "How do I reset someone's password?",
                    a: "In Accounts, edit the account and use Reset Password. The new temporary password is emailed to the user's DepEd address, and they must replace it at their next sign-in. If the email can't be sent, the password is shown to you to hand over.",
                },
                {
                    q: "Why can't I delete a section or an account?",
                    a: "It already has records, such as uploads, learners or activity in the audit log, and EduCheck keeps them. Set an account to Inactive to stop it from signing in.",
                },
            ],
        },
        {
            title: "Records",
            items: [
                {
                    q: "How do I approve a submitted record?",
                    a: "Open Submission Review. Approve the record, or return it to the Class Adviser with the reason.",
                },
                {
                    q: "Can I change the validation rules?",
                    a: "No. They follow DepEd grading policy, so they are fixed. You can read them in Settings.",
                },
                {
                    q: "How do I find out who changed something?",
                    a: "The Audit Log lists every change to accounts, sections and records, with who made it and when.",
                },
            ],
        },
    ],
    principal: [
        {
            title: "Your role",
            items: [
                {
                    q: "How do I approve new accounts?",
                    a: "Open Account Approvals. Approve the account, or reject it with a reason. Role changes that give more access appear there too.",
                },
                {
                    q: "Can I approve or edit grades?",
                    a: "No. Records are view-only for the Principal. The School Administrator approves records submitted by Class Advisers.",
                },
                {
                    q: "Where do I see how the school is doing?",
                    a: "Academic Analytics shows grade distributions, subject performance and learners who may need intervention. Section Progress shows where each section's uploads and submissions stand.",
                },
                {
                    q: "How do I view a learner's SF10?",
                    a: "Open Records & SF10 and search for the learner.",
                },
            ],
        },
    ],
};

const EVERYONE = {
    title: "Signing in and your account",
    items: [
        {
            q: "I forgot my password.",
            a: "Ask your School Administrator to reset it. A temporary password is sent to your DepEd email (check the spam folder too), and you'll set a new one when you sign in.",
        },
        {
            q: "I can't sign in even with the right password.",
            a: "After 10 wrong attempts in 15 minutes, sign-in is paused on that device. Wait 15 minutes and try again. A new account also can't sign in until the Principal approves it and the Administrator finishes its setup.",
        },
        {
            q: "How do I change my name or email?",
            a: "Your details are managed centrally. Ask your School Administrator to update them in Accounts.",
        },
        {
            q: "I don't get notifications on my phone.",
            a: "The mobile app checks for new alerts only while it is open. Open the app to see them.",
        },
        {
            q: "Can I see the welcome walkthrough again?",
            a: "Yes. Click Guide in the sidebar.",
        },
    ],
};

function Help() {
    const user = getStoredUser() || {};
    const sections = [...(FAQ_BY_ROLE[user.role] || []), EVERYONE];

    const [query, setQuery] = useState("");
    const [manualAvailable, setManualAvailable] = useState(false);

    // Offer the manual only once the PDF is really there (a missing file
    // would come back as the app's own page, not a PDF).
    useEffect(() => {
        let active = true;
        fetch(MANUAL_URL, { method: "HEAD" })
            .then((response) => {
                const type = response.headers.get("content-type") || "";
                if (active) setManualAvailable(response.ok && type.includes("pdf"));
            })
            .catch(() => {});
        return () => {
            active = false;
        };
    }, []);

    const needle = query.trim().toLowerCase();
    const filtered = sections
        .map((section) => ({
            ...section,
            items: needle
                ? section.items.filter((item) => `${item.q} ${item.a}`.toLowerCase().includes(needle))
                : section.items,
        }))
        .filter((section) => section.items.length > 0);

    const isAdmin = user.role === "admin";

    return (
        <div className="dashboard-layout">
            <Sidebar activeKey="help" />

            <main className="dashboard-main">
                <header className="dashboard-header">
                    <div>
                        <h1>Help &amp; Support</h1>
                        <p>
                            Answers to common questions{ROLE_LABEL[user.role] ? ` for the ${ROLE_LABEL[user.role]}` : ""}.
                        </p>
                    </div>
                </header>

                <section className="dashboard-content">
                    <div className="help-layout">
                        <div className="help-main">
                            <label className="help-search">
                                <Search size={18} aria-hidden="true" />
                                <input
                                    type="search"
                                    placeholder="Search questions, e.g. password, upload, SF10"
                                    value={query}
                                    onChange={(event) => setQuery(event.target.value)}
                                    aria-label="Search help"
                                />
                            </label>

                            {filtered.length === 0 && (
                                <div className="help-empty">
                                    No answers match "{query}". Try another word, or ask your School Administrator.
                                </div>
                            )}

                            {filtered.map((section) => (
                                <section className="help-section" key={section.title}>
                                    <h2>{section.title}</h2>

                                    <div className="help-list">
                                        {section.items.map((item) => (
                                            <details className="help-item" key={item.q} open={Boolean(needle)}>
                                                <summary>
                                                    <span>{item.q}</span>
                                                    <ChevronDown size={18} aria-hidden="true" />
                                                </summary>
                                                <p>{item.a}</p>
                                            </details>
                                        ))}
                                    </div>
                                </section>
                            ))}
                        </div>

                        <aside className="help-aside">
                            <div className="help-card">
                                <span className="help-card-icon">
                                    <UserCog size={20} aria-hidden="true" />
                                </span>
                                <h3>Still need help?</h3>
                                {isAdmin ? (
                                    <p>
                                        For a problem with the system itself, write down what you did and what you
                                        saw, then report it to whoever maintains EduCheck for your school. The Audit
                                        Log shows what changed and when.
                                    </p>
                                ) : (
                                    <p>
                                        Contact your <strong>School Administrator</strong>. They manage accounts,
                                        passwords and assignments, and can look into a record for you.
                                    </p>
                                )}
                                <p className="help-card-tip">
                                    When you ask, mention the page you were on, the subject and section, and any
                                    message you saw.
                                </p>
                            </div>

                            {manualAvailable && (
                                <div className="help-card">
                                    <span className="help-card-icon">
                                        <FileText size={20} aria-hidden="true" />
                                    </span>
                                    <h3>User's Manual</h3>
                                    <p>Step-by-step instructions for every role, with screenshots.</p>
                                    <a className="help-download" href={MANUAL_URL} download>
                                        <Download size={16} aria-hidden="true" />
                                        Download PDF
                                    </a>
                                </div>
                            )}

                            <div className="help-card is-quiet">
                                <span className="help-card-icon">
                                    <LifeBuoy size={20} aria-hidden="true" />
                                </span>
                                <h3>New to EduCheck?</h3>
                                <p>
                                    Click <strong>Guide</strong> in the sidebar for a short walkthrough of what your
                                    role does.
                                </p>
                            </div>
                        </aside>
                    </div>
                </section>
            </main>
        </div>
    );
}

export default Help;
