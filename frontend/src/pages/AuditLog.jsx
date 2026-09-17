import { useEffect, useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, ClipboardList, Loader2 } from "lucide-react";

import "./Dashboard.css";
import "./AuditLog.css";
import Sidebar from "../components/Sidebar";
import { getToken } from "../utils/session";

const API_URL = "http://localhost:5000/api";

const ENTITY_TYPE_LABEL = {
    section: "Section",
    teacher_assignment: "Teacher Assignment",
};

const ACTION_LABEL = {
    create: "Created",
    update: "Updated",
    delete: "Deleted",
};

// Fields that are pure bookkeeping, not a meaningful change to call out in
// the diff — every row already has its own "When" column for created_at.
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

function formatTimestamp(isoString) {
    return new Date(isoString).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    });
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
                        <div className="content-card">

                            {truncated && (
                                <p className="al-truncated-note">
                                    Showing the most recent 200 entries. Narrow by entity to see more of one kind.
                                </p>
                            )}

                            {logs.map((log) => {
                                const isExpanded = expandedIds.has(log.audit_log_id);
                                const changedFields = diffFields(log.before_data, log.after_data);

                                return (
                                    <div className="al-row" key={log.audit_log_id}>
                                        <button
                                            type="button"
                                            className="al-row-summary"
                                            onClick={() => toggleExpanded(log.audit_log_id)}
                                        >
                                            {isExpanded ? (
                                                <ChevronUp size={18} color="#64748b" />
                                            ) : (
                                                <ChevronDown size={18} color="#64748b" />
                                            )}

                                            <span className={`al-action-badge al-action-${log.action}`}>
                                                {ACTION_LABEL[log.action] || log.action}
                                            </span>

                                            <span className="al-entity">
                                                {ENTITY_TYPE_LABEL[log.entity_type] || log.entity_type} #
                                                {log.entity_id}
                                            </span>

                                            <span className="al-actor">by {log.actor_username}</span>

                                            <span className="al-timestamp">
                                                {formatTimestamp(log.created_at)}
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
                    )}

                </section>

            </main>

        </div>
    );
}

export default AuditLog;
