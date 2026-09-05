import { useEffect, useState } from "react";
import {
    Users,
    Search,
    Plus,
    Pencil,
    Trash2,
    X,
    ShieldCheck,
    UserCheck,
    UserX,
    Loader2,
    AlertCircle,
    CheckCircle,
} from "lucide-react";

import "./UserManagement.css";

const API_URL = "http://localhost:5000/api";

function UserManagement() {
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    const [formData, setFormData] = useState({
        username: "",
        password: "",
        email: "",
        role: "subject",
        status: "Active",
    });

    const [message, setMessage] = useState("");

    const token = localStorage.getItem("educheck_token");

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(`${API_URL}/users`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to retrieve users."
                );
            }

            setUsers(data);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const openAddModal = () => {
        setEditingUser(null);

        setFormData({
            username: "",
            password: "",
            email: "",
            role: "subject",
            status: "Active",
        });

        setShowModal(true);
        setMessage("");
    };

    const openEditModal = (user) => {
        setEditingUser(user);

        setFormData({
            username: user.username || "",
            password: "",
            email: user.email || "",
            role: user.role || "subject",
            status: user.status || "Active",
        });

        setShowModal(true);
        setMessage("");
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingUser(null);
        setMessage("");
    };

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            setMessage("");

            const url = editingUser
                ? `${API_URL}/users/${editingUser.user_id}`
                : `${API_URL}/users`;

            const method = editingUser ? "PUT" : "POST";

            const body = editingUser
                ? {
                      username: formData.username,
                      email: formData.email,
                      role: formData.role,
                      status: formData.status,
                  }
                : formData;

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to save user."
                );
            }

            closeModal();

            setMessage(
                editingUser
                    ? "User updated successfully."
                    : "User created successfully."
            );

            await fetchUsers();
        } catch (error) {
            setMessage(error.message);
        }
    };

    const handleDelete = async (user) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete "${user.username}"?`
        );

        if (!confirmed) {
            return;
        }

        try {
            setError("");

            const response = await fetch(
                `${API_URL}/users/${user.user_id}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to delete user."
                );
            }

            setMessage("User deleted successfully.");

            await fetchUsers();
        } catch (error) {
            setError(error.message);
        }
    };

    const filteredUsers = users.filter((user) => {
        const query = search.toLowerCase();

        return (
            user.username?.toLowerCase().includes(query) ||
            user.email?.toLowerCase().includes(query) ||
            user.role?.toLowerCase().includes(query)
        );
    });

    const activeCount = users.filter(
        (user) => user.status === "Active"
    ).length;

    const inactiveCount = users.filter(
        (user) => user.status !== "Active"
    ).length;

    const adminCount = users.filter(
        (user) => user.role === "admin"
    ).length;

    return (
        <div className="user-management-page">

            {/* HEADER */}

            <div className="page-header">

                <div>
                    <div className="page-title-row">
                        <div className="page-title-icon">
                            <Users size={23} />
                        </div>

                        <div>
                            <h1>User Management</h1>
                            <p>
                                Manage EduCheck user accounts and access roles.
                            </p>
                        </div>
                    </div>
                </div>

                <button
                    className="add-user-button"
                    onClick={openAddModal}
                >
                    <Plus size={18} />
                    Add User
                </button>

            </div>

            {/* FEEDBACK */}

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

            {/* SUMMARY */}

            <div className="user-summary-grid">

                <div className="user-summary-card">
                    <div className="summary-icon blue">
                        <Users size={21} />
                    </div>

                    <div>
                        <span>Total Users</span>
                        <strong>{users.length}</strong>
                    </div>
                </div>

                <div className="user-summary-card">
                    <div className="summary-icon green">
                        <UserCheck size={21} />
                    </div>

                    <div>
                        <span>Active Accounts</span>
                        <strong>{activeCount}</strong>
                    </div>
                </div>

                <div className="user-summary-card">
                    <div className="summary-icon gray">
                        <UserX size={21} />
                    </div>

                    <div>
                        <span>Inactive Accounts</span>
                        <strong>{inactiveCount}</strong>
                    </div>
                </div>

                <div className="user-summary-card">
                    <div className="summary-icon purple">
                        <ShieldCheck size={21} />
                    </div>

                    <div>
                        <span>Administrators</span>
                        <strong>{adminCount}</strong>
                    </div>
                </div>

            </div>

            {/* USER TABLE */}

            <div className="users-card">

                <div className="users-card-header">

                    <div>
                        <h2>User Accounts</h2>
                        <p>
                            View and manage registered EduCheck accounts.
                        </p>
                    </div>

                    <div className="search-box">
                        <Search size={18} />

                        <input
                            type="text"
                            placeholder="Search users..."
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                        />

                        {search && (
                            <button
                                type="button"
                                className="clear-search"
                                onClick={() => setSearch("")}
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                </div>

                {loading ? (
                    <div className="table-state">
                        <Loader2 className="loading-icon" size={28} />
                        <p>Loading user accounts...</p>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="table-state">
                        <Users size={34} />
                        <h3>No users found</h3>
                        <p>
                            {search
                                ? "Try a different search term."
                                : "No user accounts are currently available."}
                        </p>
                    </div>
                ) : (
                    <div className="table-wrapper">

                        <table className="users-table">

                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>

                                {filteredUsers.map((user) => (
                                    <tr key={user.user_id}>

                                        <td>
                                            <div className="user-cell">
                                                <div className="user-avatar">
                                                    {user.username
                                                        ?.charAt(0)
                                                        .toUpperCase()}
                                                </div>

                                                <div>
                                                    <strong>
                                                        {user.username}
                                                    </strong>

                                                    <span>
                                                        ID #{user.user_id}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        <td>
                                            {user.email}
                                        </td>

                                        <td>
                                            <span
                                                className={`role-pill role-${user.role}`}
                                            >
                                                {user.role}
                                            </span>
                                        </td>

                                        <td>
                                            <span
                                                className={`status-pill ${
                                                    user.status === "Active"
                                                        ? "active"
                                                        : "inactive"
                                                }`}
                                            >
                                                {user.status}
                                            </span>
                                        </td>

                                        <td>
                                            {user.created_at
                                                ? new Date(
                                                      user.created_at
                                                  ).toLocaleDateString()
                                                : "—"}
                                        </td>

                                        <td>
                                            <div className="action-buttons">

                                                <button
                                                    className="icon-button edit"
                                                    title="Edit user"
                                                    onClick={() =>
                                                        openEditModal(user)
                                                    }
                                                >
                                                    <Pencil size={17} />
                                                </button>

                                                <button
                                                    className="icon-button delete"
                                                    title="Delete user"
                                                    onClick={() =>
                                                        handleDelete(user)
                                                    }
                                                >
                                                    <Trash2 size={17} />
                                                </button>

                                            </div>
                                        </td>

                                    </tr>
                                ))}

                            </tbody>

                        </table>

                    </div>
                )}

            </div>

            {/* ADD / EDIT MODAL */}

            {showModal && (
                <div
                    className="modal-overlay"
                    onClick={closeModal}
                >
                    <div
                        className="user-modal"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >

                        <div className="modal-header">

                            <div>
                                <h2>
                                    {editingUser
                                        ? "Edit User"
                                        : "Add User"}
                                </h2>

                                <p>
                                    {editingUser
                                        ? "Update account information and access role."
                                        : "Create a new EduCheck user account."}
                                </p>
                            </div>

                            <button
                                className="close-modal"
                                onClick={closeModal}
                            >
                                <X size={20} />
                            </button>

                        </div>

                        <form
                            className="user-form"
                            onSubmit={handleSubmit}
                        >

                            <div className="form-group">
                                <label>
                                    Username
                                </label>

                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            {!editingUser && (
                                <div className="form-group">
                                    <label>
                                        Password
                                    </label>

                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        minLength={8}
                                    />
                                </div>
                            )}

                            <div className="form-group">
                                <label>
                                    Email
                                </label>

                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-row">

                                <div className="form-group">
                                    <label>
                                        Role
                                    </label>

                                    <select
                                        name="role"
                                        value={formData.role}
                                        onChange={handleChange}
                                    >
                                        <option value="teacher">
                                            Subject Teacher
                                        </option>

                                        <option value="adviser">
                                            Class Adviser
                                        </option>

                                        <option value="admin">
                                            School Administrator
                                        </option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>
                                        Status
                                    </label>

                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                    >
                                        <option value="Active">
                                            Active
                                        </option>

                                        <option value="Inactive">
                                            Inactive
                                        </option>
                                    </select>
                                </div>

                            </div>

                            {message && (
                                <div className="modal-error">
                                    <AlertCircle size={17} />
                                    {message}
                                </div>
                            )}

                            <div className="modal-actions">

                                <button
                                    type="button"
                                    className="cancel-button"
                                    onClick={closeModal}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="save-user-button"
                                >
                                    {editingUser
                                        ? "Save Changes"
                                        : "Create User"}
                                </button>

                            </div>

                        </form>

                    </div>
                </div>
            )}

        </div>
    );
}

export default UserManagement;