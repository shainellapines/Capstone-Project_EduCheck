import {
    BadgeCheck,
    CircleCheck,
    Clock,
    Layers,
    OctagonX,
    PencilLine,
    RotateCcw,
    ScanSearch,
    Send,
    TriangleAlert,
    Undo2,
    Upload,
} from "lucide-react";
import "./StatusBadge.css";

// The ten statuses from the EduCheck design system. Every badge carries its
// icon and label, so status is never conveyed by color alone.
const STATUSES = {
    pending: { label: "Pending", tone: "neutral", icon: Clock },
    uploaded: { label: "Uploaded", tone: "info", icon: Upload },
    consolidating: { label: "Consolidating", tone: "info", icon: Layers },
    validating: { label: "Validating", tone: "info", icon: ScanSearch },
    "needs-revision": { label: "Needs Revision", tone: "revision", icon: PencilLine },
    "amendment-requested": { label: "Amendment Requested", tone: "revision", icon: RotateCcw },
    returned: { label: "Returned by Administrator", tone: "danger", icon: Undo2 },
    ready: { label: "Ready", tone: "success-outline", icon: CircleCheck },
    submitted: { label: "Submitted", tone: "info-solid", icon: Send },
    approved: { label: "Approved", tone: "success-solid", icon: BadgeCheck },
};

// Raw status strings stored by the backend, mapped to the status they are
// shown as. Display only: the stored values are unchanged.
const RAW_TO_STATUS = {
    // record_submissions (per learner)
    "not submitted": "pending",
    "pending approval": "submitted",
    approved: "approved",
    rejected: "returned",
    "amendment requested": "amendment-requested",
    // class_records (per subject upload)
    uploaded: "uploaded",
    validated: "uploaded",
    "pending validation": "validating",
    "needs attention": "needs-revision",
    "needs revision": "needs-revision",
};

function toStatusKey(status) {
    if (!status) return "pending";
    const value = String(status).trim().toLowerCase();
    if (STATUSES[value]) return value;
    return RAW_TO_STATUS[value] || null;
}

function StatusBadge({ status, className = "" }) {
    const key = toStatusKey(status);
    const info = key ? STATUSES[key] : null;

    // An unknown value still renders, as a neutral badge with its own text.
    if (!info) {
        return <span className={`ec-badge ec-badge-neutral ${className}`.trim()}>{status}</span>;
    }

    const Icon = info.icon;
    return (
        <span className={`ec-badge ec-badge-${info.tone} ${className}`.trim()}>
            <Icon size={14} strokeWidth={1.75} aria-hidden="true" />
            {info.label}
        </span>
    );
}

// Severity of one validation flag. Not a status.
function SeverityBadge({ severity }) {
    const isWarning = String(severity).toLowerCase() === "warning";
    const Icon = isWarning ? TriangleAlert : OctagonX;
    return (
        <span className={`ec-badge ${isWarning ? "ec-badge-warning" : "ec-badge-critical"}`}>
            <Icon size={14} strokeWidth={1.75} aria-hidden="true" />
            {isWarning ? "Warning" : "Critical"}
        </span>
    );
}

// A read-only grade, in mono with tabular numerals so columns align.
function GradeCell({ value, empty = "—" }) {
    const isEmpty = value === null || value === undefined || value === "";
    return <span className={isEmpty ? "ec-grade ec-grade-empty" : "ec-grade"}>{isEmpty ? empty : value}</span>;
}

export { StatusBadge, SeverityBadge, GradeCell };
export default StatusBadge;
