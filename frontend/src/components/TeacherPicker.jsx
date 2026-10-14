import { useState } from "react";
import { Search } from "lucide-react";
import "./TeacherPicker.css";

const ROLE_FILTERS = [
    { key: "all", label: "All" },
    { key: "adviser", label: "Advisers" },
    { key: "subject", label: "Subject Teachers" },
];

const roleLabel = (role) => (role === "adviser" ? "Adviser" : "Subject Teacher");

// Picks one teacher from a list that can run into the hundreds: a role
// filter plus a search over name and employee number, instead of one long
// dropdown. `lockedRole` pins the role filter (e.g. Advisers only for a
// Self-Contained section) and `lockedReason` says why.
function TeacherPicker({ id, teachers, value, onChange, lockedRole = null, lockedReason = "" }) {
    const [query, setQuery] = useState("");
    const [role, setRole] = useState("all");

    const activeRole = lockedRole || role;
    const needle = query.trim().toLowerCase();

    const matches = teachers
        .filter((teacher) => activeRole === "all" || teacher.role === activeRole)
        .filter((teacher) => {
            if (!needle) return true;
            return [
                `${teacher.first_name} ${teacher.last_name}`,
                `${teacher.last_name} ${teacher.first_name}`,
                teacher.employee_number || "",
            ].some((text) => text.toLowerCase().includes(needle));
        })
        .sort((a, b) => a.last_name.localeCompare(b.last_name) || a.first_name.localeCompare(b.first_name));

    const selected = teachers.find((teacher) => String(teacher.teacher_id) === String(value));

    return (
        <div className="tp">
            <div className="tp-roles" role="group" aria-label="Filter by role">
                {ROLE_FILTERS.map((filter) => (
                    <button
                        key={filter.key}
                        type="button"
                        className={`tp-role${activeRole === filter.key ? " is-active" : ""}`}
                        aria-pressed={activeRole === filter.key}
                        disabled={Boolean(lockedRole) && filter.key !== lockedRole}
                        onClick={() => setRole(filter.key)}
                    >
                        {filter.label}
                    </button>
                ))}
                {lockedRole && lockedReason && <span className="tp-lock-note">{lockedReason}</span>}
            </div>

            <div className="tp-search">
                <Search size={16} aria-hidden="true" />
                <input
                    id={id}
                    type="search"
                    placeholder="Search by name or employee number"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    autoComplete="off"
                />
            </div>

            <ul className="tp-list" role="listbox" aria-label="Teachers">
                {matches.length === 0 && (
                    <li className="tp-empty">
                        {needle ? `No teacher matches "${query.trim()}".` : "No teachers with this role."}
                    </li>
                )}
                {matches.map((teacher) => {
                    const isSelected = selected && selected.teacher_id === teacher.teacher_id;
                    return (
                        <li key={teacher.teacher_id} role="option" aria-selected={Boolean(isSelected)}>
                            <button
                                type="button"
                                className={`tp-option${isSelected ? " is-selected" : ""}`}
                                onClick={() => onChange(String(teacher.teacher_id))}
                            >
                                <span className="tp-name">
                                    {teacher.last_name}, {teacher.first_name}
                                </span>
                                {teacher.employee_number && <span className="tp-meta">{teacher.employee_number}</span>}
                                <span className={`tp-tag tp-tag-${teacher.role === "adviser" ? "adviser" : "subject"}`}>
                                    {roleLabel(teacher.role)}
                                </span>
                            </button>
                        </li>
                    );
                })}
            </ul>

            <p className="tp-count">
                {selected
                    ? `Selected: ${selected.first_name} ${selected.last_name} (${roleLabel(selected.role)})`
                    : `${matches.length} of ${teachers.length} teachers shown`}
            </p>
        </div>
    );
}

export default TeacherPicker;
