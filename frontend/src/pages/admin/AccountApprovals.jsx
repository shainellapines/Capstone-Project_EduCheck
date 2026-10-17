import { useEffect, useState } from "react";
import {
    UserCheck,
    CheckCircle,
    XCircle,
    Loader2,
    AlertCircle,
} from "lucide-react";

import "./Accounts.css";
import Sidebar from "../../components/Sidebar";
import { API_URL } from "../../config";
import { getToken } from "../../utils/session";


// The Principal approves new accounts and role changes that give more
// access before they take effect (migration 010). The Administrator
// creates and edits accounts; only the Principal decides here.
const ROLE_LABELS = {
    subject: "Subject Teacher",
    adviser: "Class Adviser",
    admin: "School Administrator",
    principal: "Principal",
};

const nameOf = (request) =>
    request.first_name ? `${request.first_name} ${request.last_name}` : request.username;

function AccountApprovals() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [busyId, setBusyId] = useState(null);
    const [rejectingId, setRejectingId] = useState(null);
    const [rejectReason, setRejectReason] = useState("");

    const authHeaders = (extra = {}) => ({ Authorization: `Bearer ${getToken()}`, ...extra });

    const fetchRequests = async () => {
        try {
            setLoading(true);

            const response = await fetch(`${API_URL}/account-approvals`, { headers: authHeaders() });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to load account approvals.");
            }

            setRequests(data.requests || []);
        } catch (fetchError) {
            setError(fetchError.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const decide = async (request, action) => {
        if (action === "reject" && !rejectReason.trim()) {
            setError("Give a reason so the Administrator knows what to correct.");
            return;
        }

        setError("");
        setMessage("");
        setBusyId(request.user_id);

        try {
            const response = await fetch(`${API_URL}/account-approvals/${request.user_id}/${action}`, {
                method: "POST",
                headers: authHeaders({ "Content-Type": "application/json" }),
                body: JSON.stringify(action === "reject" ? { remarks: rejectReason } : {}),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "The action failed.");
            }

            setMessage(data.message);
            setRejectingId(null);
            setRejectReason("");
            await fetchRequests();
        } catch (actionError) {
            setError(actionError.message);
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="dashboard-layout">

            <Sidebar activeKey="account-approvals" />

            <main className="dashboard-main">
        <div className="user-management-page">

            <div className="page-header">
                <div className="page-title-row">
                    <div className="page-title-icon">
                        <UserCheck size={23} />
                    </div>

                    <div>
                        <h1>Account Approvals</h1>
                        <p>
                            Accounts the School Administrator created, or roles they want to raise. Nothing
                            here can be used until you approve it.
                        </p>
                    </div>
                </div>
            </div>

            {message && (
                <div className="success-message">
                    <CheckCircle size={18} />
                    {message}
                </div>
            )}

            {error && (
                <div className="error-message">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            <div className="users-card">

                <div className="users-card-header">
                    <div>
                        <h2>Waiting for Your Approval</h2>
                        <p>Check the name, role and DepEd email before approving.</p>
                    </div>
                </div>

                {loading ? (
                    <div className="table-state">
                        <Loader2 className="loading-icon" size={28} />
                        <p>Loading requests...</p>
                    </div>
                ) : requests.length === 0 ? (
                    <div className="table-state">
                        <CheckCircle size={34} />
                        <h3>All caught up</h3>
                        <p>No accounts are waiting for your approval.</p>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table className="users-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Request</th>
                                    <th>Email</th>
                                    <th>Employee No.</th>
                                    <th>Requested</th>
                                    <th>Decision</th>
                                </tr>
                            </thead>

                            <tbody>
                                {requests.map((request) => {
                                    const busy = busyId === request.user_id;
                                    const isNew = request.request_type === "new_account";

                                    return [
                                        <tr key={request.user_id}>
                                            <td>
                                                <div className="user-cell">
                                                    <div className="user-avatar">
                                                        {nameOf(request).charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <strong>{nameOf(request)}</strong>
                                                        <span>@{request.username}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            <td>
                                                {isNew ? (
                                                    <>
                                                        New account as{" "}
                                                        <span className={`role-pill role-${request.role}`}>
                                                            {ROLE_LABELS[request.role]}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <>
                                                        Role change: {ROLE_LABELS[request.role]} →{" "}
                                                        <span className={`role-pill role-${request.pending_role}`}>
                                                            {ROLE_LABELS[request.pending_role]}
                                                        </span>
                                                    </>
                                                )}
                                            </td>

                                            <td>{request.email}</td>
                                            <td>{request.employee_number || "—"}</td>
                                            <td>{new Date(request.created_at).toLocaleDateString()}</td>

                                            <td>
                                                <div className="action-buttons">
                                                    <button
                                                        type="button"
                                                        className="approval-button approve"
                                                        onClick={() => decide(request, "approve")}
                                                        disabled={busy}
                                                    >
                                                        <CheckCircle size={15} />
                                                        Approve
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="approval-button reject"
                                                        onClick={() => {
                                                            setRejectingId(rejectingId === request.user_id ? null : request.user_id);
                                                            setRejectReason("");
                                                        }}
                                                        disabled={busy}
                                                    >
                                                        <XCircle size={15} />
                                                        Reject
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>,

                                        rejectingId === request.user_id && (
                                            <tr key={`${request.user_id}-reject`} className="approval-reject-row">
                                                <td colSpan={6}>
                                                    <label htmlFor={`reject-${request.user_id}`}>
                                                        Reason (shown to the School Administrator)
                                                    </label>
                                                    <textarea
                                                        id={`reject-${request.user_id}`}
                                                        rows={2}
                                                        value={rejectReason}
                                                        onChange={(e) => setRejectReason(e.target.value)}
                                                        placeholder="e.g. The employee number does not match the school's records."
                                                    />
                                                    <div className="action-buttons">
                                                        <button
                                                            type="button"
                                                            className="approval-button reject"
                                                            onClick={() => decide(request, "reject")}
                                                            disabled={busy}
                                                        >
                                                            Confirm Reject
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="cancel-button"
                                                            onClick={() => setRejectingId(null)}
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ),
                                    ];
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

            </div>

        </div>
            </main>

        </div>
    );
}

export default AccountApprovals;
