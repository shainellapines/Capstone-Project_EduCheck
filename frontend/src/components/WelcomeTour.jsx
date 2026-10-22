import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    ArrowRight,
    BarChart3,
    BellRing,
    ClipboardCheck,
    Compass,
    Database,
    Eye,
    FileText,
    History,
    Lightbulb,
    PartyPopper,
    PieChart,
    ShieldCheck,
    Upload,
    UserCheck,
    Users,
    X,
} from "lucide-react";

import "./WelcomeTour.css";
import { markTourSeen } from "../utils/welcomeTour";

// First-login guide: what this role does in EduCheck, the pages it works
// in, in order, and where to start. It opens once per account on this
// browser and can be reopened from "Guide" in the sidebar.

const ROLE_TOURS = {
    subject: {
        roleLabel: "Subject Teacher",
        summary:
            "You upload the e-Class Records (ECR) for the subjects you teach. EduCheck checks every grade against DepEd rules before your Class Adviser uses it.",
        steps: [
            {
                icon: Upload,
                title: "Upload your e-Class Record",
                body: "Choose the section and subject, then upload the DepEd ECR Excel file you already use. No retyping of grades.",
                where: { icon: Upload, label: "Upload e-Class Record" },
            },
            {
                icon: ShieldCheck,
                title: "EduCheck checks it for you",
                body: "Missing scores, wrong computations, and grades outside the allowed range are flagged right away, learner by learner.",
                tip: "Each flag explains what is wrong, so you know exactly what to correct.",
            },
            {
                icon: ClipboardCheck,
                title: "Fix and re-upload",
                body: "Correct the flagged cells in your Excel file and upload it again. Once it passes, your Class Adviser can use your grades.",
                tip: "If your Adviser sends a record back, their note appears on your Dashboard.",
                where: { icon: BellRing, label: "Notifications" },
            },
        ],
        start: { label: "Upload an e-Class Record", path: "/class-record-upload" },
    },
    adviser: {
        roleLabel: "Class Adviser",
        summary:
            "You bring together the grades of your section from every subject teacher, review each learner's record, and submit it for approval.",
        steps: [
            {
                icon: PieChart,
                title: "Track your section's uploads",
                body: "See which subjects are uploaded, which passed the checks, and which teachers you are still waiting on.",
                where: { icon: PieChart, label: "Section Progress" },
            },
            {
                icon: FileText,
                title: "Review the consolidated records",
                body: "Every learner's grades from all subjects in one view. If a subject looks wrong, request a revision and the teacher is notified.",
                where: { icon: FileText, label: "Consolidated Records" },
            },
            {
                icon: ClipboardCheck,
                title: "Submit for approval",
                body: "When a learner's record is complete, submit it. The School Administrator reviews and approves it.",
                tip: "If you also teach subjects in your section, \"Upload Files\" appears in your sidebar.",
            },
            {
                icon: Database,
                title: "Keep the permanent record (SF10)",
                body: "Open any learner's SF10, add earlier school years, and download it once the record is approved.",
                where: { icon: Database, label: "Records & SF10" },
            },
        ],
        start: { label: "Open Section Progress", path: "/section-progress" },
    },
    admin: {
        roleLabel: "School Administrator",
        summary:
            "You set EduCheck up for the school: the accounts, the sections, and who teaches where. You also approve the records Class Advisers submit.",
        steps: [
            {
                icon: Users,
                title: "Create the accounts",
                body: "Add Subject Teachers and Class Advisers using their DepEd email. The Principal approves new accounts before they can sign in.",
                where: { icon: Users, label: "Accounts" },
            },
            {
                icon: UserCheck,
                title: "Set up sections and assignments",
                body: "Create each section, then assign its Class Adviser and the teacher for every subject.",
                where: { icon: UserCheck, label: "Section & Teacher Assignments" },
            },
            {
                icon: ClipboardCheck,
                title: "Approve submitted records",
                body: "Review each learner's record submitted by the Adviser. Approve it, or send it back with a reason.",
                where: { icon: ClipboardCheck, label: "Submission Review" },
            },
            {
                icon: History,
                title: "Keep an eye on activity",
                body: "Every change to accounts, sections, and records is logged with who made it and when.",
                where: { icon: History, label: "Audit Log" },
            },
        ],
        start: { label: "Go to Accounts", path: "/accounts" },
    },
    principal: {
        roleLabel: "Principal",
        summary:
            "You oversee the school's academic records. You can view everything, and you approve the new accounts the Administrator creates.",
        steps: [
            {
                icon: UserCheck,
                title: "Approve new accounts",
                body: "New teacher accounts and role changes wait for your approval before they take effect.",
                where: { icon: UserCheck, label: "Account Approvals" },
            },
            {
                icon: Eye,
                title: "See where every section stands",
                body: "Follow uploads and submissions per section, and open any submitted record to view it.",
                where: { icon: PieChart, label: "Section Progress" },
            },
            {
                icon: BarChart3,
                title: "Read the analytics",
                body: "Grade distributions, subject performance, and the learners who may need intervention.",
                where: { icon: BarChart3, label: "Academic Analytics" },
            },
        ],
        start: { label: "Open Account Approvals", path: "/account-approvals" },
    },
};

function WelcomeTour({ user, onClose }) {
    const navigate = useNavigate();
    const tour = ROLE_TOURS[user?.role];
    const [index, setIndex] = useState(0);
    const dialogRef = useRef(null);

    // intro, one slide per step, then "you're set"
    const slideCount = tour ? tour.steps.length + 2 : 0;
    const isIntro = index === 0;
    const isLast = index === slideCount - 1;
    const step = !isIntro && !isLast ? tour.steps[index - 1] : null;

    const close = () => {
        markTourSeen(user);
        onClose();
    };

    const start = () => {
        markTourSeen(user);
        onClose();
        navigate(tour.start.path);
    };

    const next = () => setIndex((current) => Math.min(current + 1, slideCount - 1));
    const back = () => setIndex((current) => Math.max(current - 1, 0));

    useEffect(() => {
        dialogRef.current?.focus();
    }, []);

    useEffect(() => {
        const onKey = (event) => {
            if (event.key === "Escape") close();
            if (event.key === "ArrowRight") next();
            if (event.key === "ArrowLeft") back();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    });

    if (!tour) return null;

    const firstName = (user.full_name || "").trim().split(/\s+/)[0] || user.username;
    const HeroIcon = isIntro ? Compass : isLast ? PartyPopper : step.icon;

    // Rendered on <body> so no sidebar or page layout can clip the overlay.
    return createPortal(
        <div className="wt-overlay" onMouseDown={(event) => event.target === event.currentTarget && close()}>
            <div
                className="wt-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="wt-title"
                tabIndex={-1}
                ref={dialogRef}
            >
                <div className="wt-hero" aria-hidden="true">
                    <svg className="wt-hero-grid" width="100%" height="100%">
                        <defs>
                            <pattern id="wt-dots" width="18" height="18" patternUnits="userSpaceOnUse">
                                <circle cx="2" cy="2" r="1.2" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#wt-dots)" />
                    </svg>

                    <span className="wt-hero-ring wt-hero-ring-outer" />
                    <span className="wt-hero-ring" />
                    <span className="wt-hero-icon" key={index}>
                        <HeroIcon size={40} strokeWidth={1.75} />
                    </span>

                    <span className="wt-hero-role">{tour.roleLabel}</span>
                </div>

                <button type="button" className="wt-close" onClick={close} aria-label="Close guide">
                    <X size={18} />
                </button>

                <div className="wt-body" key={index}>
                    {isIntro && (
                        <>
                            <p className="wt-eyebrow">Welcome to EduCheck</p>
                            <h2 id="wt-title">Hi, {firstName}! Here's how EduCheck works for you.</h2>
                            <p className="wt-text">{tour.summary}</p>

                            <ol className="wt-overview">
                                {tour.steps.map((item, itemIndex) => {
                                    const Icon = item.icon;
                                    return (
                                        <li key={item.title}>
                                            <button type="button" onClick={() => setIndex(itemIndex + 1)}>
                                                <span className="wt-overview-num">{itemIndex + 1}</span>
                                                <Icon size={16} aria-hidden="true" />
                                                <span>{item.title}</span>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ol>
                        </>
                    )}

                    {step && (
                        <>
                            <p className="wt-eyebrow">
                                Step {index} of {tour.steps.length}
                            </p>
                            <h2 id="wt-title">{step.title}</h2>
                            <p className="wt-text">{step.body}</p>

                            {step.where && (
                                <p className="wt-where">
                                    <span>Find it in the sidebar</span>
                                    <span className="wt-where-chip">
                                        <step.where.icon size={15} aria-hidden="true" />
                                        {step.where.label}
                                    </span>
                                </p>
                            )}

                            {step.tip && (
                                <p className="wt-tip">
                                    <Lightbulb size={15} aria-hidden="true" />
                                    <span>{step.tip}</span>
                                </p>
                            )}
                        </>
                    )}

                    {isLast && (
                        <>
                            <p className="wt-eyebrow">You're all set</p>
                            <h2 id="wt-title">Ready when you are.</h2>
                            <p className="wt-text">
                                Your Dashboard shows where your work stands. You can reopen this guide anytime
                                from <strong>Guide</strong> in the sidebar.
                            </p>

                            <button type="button" className="wt-start" onClick={start}>
                                {tour.start.label}
                                <ArrowRight size={16} aria-hidden="true" />
                            </button>
                        </>
                    )}
                </div>

                <footer className="wt-footer">
                    <div className="wt-dots" role="tablist" aria-label="Guide pages">
                        {Array.from({ length: slideCount }, (_, dotIndex) => (
                            <button
                                key={dotIndex}
                                type="button"
                                role="tab"
                                className={dotIndex === index ? "wt-dot is-active" : "wt-dot"}
                                aria-selected={dotIndex === index}
                                aria-label={`Page ${dotIndex + 1} of ${slideCount}`}
                                onClick={() => setIndex(dotIndex)}
                            />
                        ))}
                    </div>

                    <div className="wt-nav">
                        {isIntro ? (
                            <button type="button" className="wt-ghost" onClick={close}>
                                Skip
                            </button>
                        ) : (
                            <button type="button" className="wt-ghost" onClick={back}>
                                <ArrowLeft size={16} aria-hidden="true" />
                                Back
                            </button>
                        )}

                        {isLast ? (
                            <button type="button" className="wt-secondary" onClick={close}>
                                Done
                            </button>
                        ) : (
                            <button type="button" className="wt-primary" onClick={next}>
                                {isIntro ? "Show me" : "Next"}
                                <ArrowRight size={16} aria-hidden="true" />
                            </button>
                        )}
                    </div>
                </footer>
            </div>
        </div>,
        document.body
    );
}

export default WelcomeTour;
