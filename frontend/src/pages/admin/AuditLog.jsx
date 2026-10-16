import { useEffect, useState } from "react";
import {
    AlertTriangle,
    ChevronDown,
    ClipboardList,
    Loader2,
    PencilLine,
    Plus,
    Trash2,
} from "lucide-react";

import "../../styles/Dashboard.css";
import "../../components/StatusBadge.css";
import "./AuditLog.css";
import Sidebar from "../../components/Sidebar";
import { getToken } from "../../utils/session";
import { API_URL } from "../../config";


const ENTITY_TYPE_LABEL = {
    section: "Section",
    teacher_assignment: "Teacher Assignment",
    historical_record: "SF10 Historical Record",
    user: "User Account",
};

// Shared badge tones from StatusBadge.css, each with its own icon so the
// action is never conveyed by color alone.
const ACTION_BADGE = {
    create: { label: "Created", tone: "success-outline", icon: Plus },
    update: { label: "Updated", tone: "revision", icon: PencilLine },
    delete: { label: "Deleted", tone: "danger", icon: Trash2 },
};

// Fields that are pure bookkeeping, not a meaningful change to call out in
// the diff — every row already shows its own time for created_at.
const IGNORED_DIFF_FIELDS = new Set(["created_at"]);

// For an update, only the fields that actually differ; for a create/delete
// there's nothing to diff against, so the whole row is shown as-is.
function diffFields(before, after) {
    const keys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);

    return Array.from(keys)
        .filter((key) => !IGNORED_DIFF_FIELDS.has(key))
        .filter((key) => JSON.stringify(before?.[key]) !== JSON.stringify(after?.[key]))
        .map((key) => ({ key, before: before?.[key], after: after?.[key] }));
}

function formatValue(value) {
    if (value === null || value === undefined) return "—";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
}

function formatDate(isoString) {
    return new Date(isoString).toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function formatTime(isoString) {
    return new Date(isoString).toLocaleTimeString(undefined, {
        timeStyle: "short",
    });
}

// Logs arrive newest first; consecutive entries from the same day share
// one date heading.
function groupByDay(logs) {
    const groups = [];

    logs.forEach((log) => {
        const day = formatDate(log.created_at);
        const last = groups[groups.length - 1];

        if (last && last.day === day) {
            last.logs.push(log);
        } else {
            groups.push({ day, logs: [log] });
        }
    });

    return groups;
}

// SPMP v1.0 Risk Management §11 — a read-only trail of every section and
// teacher-assignment change (sectionController/assignmentController write
// to it via utils/auditLog.js), so a mistaken or disputed change can
// actually be traced to who made it and when. Admin-only, same audience as
// the section/assignment management pages themselves.
function AuditLog() {
    const [entityTypeFilter, setEntityTypeFilter] = useState("");
    const [logs, setLogs] = useState(null);
    const [truncated, setTruncated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [expandedIds, setExpandedIds] = useState(new Set());

    const authHeaders = () => {
        const token = getToken();

        if (!token) {
            throw new Error("Authentication token not found. Please log in again.");
        }

        return { Authorization: `Bearer ${token}` };
    };

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                setLoading(true);
                setError("");

                const query = entityTypeFilter ? `?entity_type=${entityTypeFilter}` : "";
                const response = await fetch(`${API_URL}/audit-logs${query}`, {
                    headers: authHeaders(),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Failed to load the audit log.");
                }

                setLogs(data.logs || []);
                setTruncated(Boolean(data.truncated));
            } catch (fetchError) {
                setError(fetchError.message || "Failed to load the audit log.");
                setLogs(null);
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, [entityTypeFilter]);

    const toggleExpanded = (id) => {
        setExpandedIds((previous) => {
            const next = new Set(previous);

            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }

            return next;
        });
    };

    return (
        <div className="dashboard-layout">

            <Sidebar activeKey="audit-log" />

            <main className="dashboard-main">

                <header className="dashboard-header">
                    <div>
                        <h1>Audit Log</h1>
                        <p>
                            Every section and teacher-assignment change — who made it, and when.
                        </p>
                    </div>

                    <div className="school-year">
                        Entity:{" "}
                        <select
                            className="school-year-select"
                            value={entityTypeFilter}
                            onChange={(e) => setEntityTypeFilter(e.target.value)}
                        >
                            <option value="">All</option>
                            <option value="section">Sections</option>
                            <option value="teacher_assignment">Teacher Assignments</option>
                            <option value="user">User Accounts</option>
                        </select>
                    </div>
                </header>

                <section className="dashboard-content">

                    {error && (
                        <div className="error-banner">
                            <AlertTriangle size={20} />
                            <span>{error}</span>
                        </div>
                    )}

                    {loading && (
                        <div className="loading-state">
                            <Loader2 size={20} className="spin-icon" />
                            Loading...
                        </div>
                    )}

                    {!loading && logs && logs.length === 0 && (
                        <div className="content-card empty-state-card">
                            <ClipboardList size={20} />
                            No section or teacher-assignment changes recorded yet.
                        </div>
                    )}

                    {!loading && logs && logs.length > 0 && (
                        <div className="content-card al-list">

                            {truncated && (
                                <p className="al-truncated-note">
                                    Showing the most recent 200 entries. Narrow by entity to see more of one kind.
                                </p>
                            )}

                            {groupByDay(logs).map((group) => (
                                <div className="al-day" key={group.day}>
                                    <h3 className="al-day-heading">{group.day}</h3>

                                    {group.logs.map((log) => {
                                        const isExpanded = expandedIds.has(log.audit_log_id);
                                        const changedFields = diffFields(log.before_data, log.after_data);
                                        const badge = ACTION_BADGE[log.action];
                                        const BadgeIcon = badge?.icon;

                                        return (
                                            <div
                                                className={`al-row${isExpanded ? " al-row-open" : ""}`}
                                                key={log.audit_log_id}
                                            >
                                                <button
                                                    type="button"
                                                    className="al-row-summary"
                                                    onClick={() => toggleExpanded(log.audit_log_id)}
                                                    aria-expanded={isExpanded}
                                                >
                                                    <ChevronDown size={18} className="al-chevron" aria-hidden="true" />

                                                    <span className={`ec-badge ec-badge-${badge?.tone || "neutral"} al-action-badge`}>
                                                        {BadgeIcon && (
                                                            <BadgeIcon size={14} strokeWidth={1.75} aria-hidden="true" />
                                                        )}
                                                        {badge?.label || log.action}
                                                    </span>

                                                    <span className="al-what">
                                                        <span className="al-entity">
                                                            {ENTITY_TYPE_LABEL[log.entity_type] || log.entity_type} #
                                                            {log.entity_id}
                                                        </span>
                                                        <span className="al-actor">by {log.actor_username}</span>
                                                    </span>

                                                    <span className="al-timestamp">
                                                        {formatTime(log.created_at)}
                                                    </span>
                                                </button>

                                                {isExpanded && (
                                                    <div className="al-details">
                                                        {log.action === "update" ? (
                                                            changedFields.length > 0 ? (
                                                                <table className="al-table">
                                                                    <thead>
                                                                        <tr>
                                                                            <th>Field</th>
                                                                            <th>Before</th>
                                                                            <th>After</th>
                                                                        </tr>
                                                                    </thead>

                                                                    <tbody>
                                                                        {changedFields.map((field) => (
                                                                            <tr key={field.key}>
                                                                                <td>{field.key}</td>
                                                                                <td>{formatValue(field.before)}</td>
                                                                                <td>{formatValue(field.after)}</td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            ) : (
                                                                <p className="al-empty-note">
                                                                    No field values changed.
                                                                </p>
                                                            )
                                                        ) : (
                                                            <table className="al-table">
                                                                <tbody>
                                                                    {Object.entries(
                                                                        log.action === "create"
                                                                            ? log.after_data || {}
                                                                            : log.before_data || {}
                                                                    )
                                                                        .filter(([key]) => !IGNORED_DIFF_FIELDS.has(key))
                                                                        .map(([key, value]) => (
                                                                            <tr key={key}>
                                                                                <td>{key}</td>
                                                                                <td>{formatValue(value)}</td>
                                                                            </tr>
                                                                        ))}
                                                                </tbody>
                                                            </table>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    )}

                </section>

            </main>

        </div>
    );
}

export default AuditLog;
