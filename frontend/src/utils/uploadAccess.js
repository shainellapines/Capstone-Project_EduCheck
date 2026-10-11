import { useEffect, useState } from "react";

import { getStoredUser, getToken } from "./session";
import { API_URL } from "../config";


// Whether the signed-in user has any (subject, section) they may upload to.
// Subject Teachers always see the upload page. An Adviser uploads every
// subject of a Self-Contained section (SPMP v1.0 §6.2, US-011), or only the
// subjects assigned to them in a Departmentalized section. /uploads/options
// returns nothing for an Adviser with neither, so the upload entry points
// are hidden for them instead of opening an empty page.
// If the check itself fails, the entry stays visible: the backend still
// enforces the assignment on every upload.
export function useCanUpload() {
    const role = getStoredUser()?.role;
    const [canUpload, setCanUpload] = useState(role === "subject");

    useEffect(() => {
        if (role !== "adviser") return;

        const token = getToken();
        if (!token) return;

        let cancelled = false;

        fetch(`${API_URL}/uploads/options`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((response) => (response.ok ? response.json() : Promise.reject()))
            .then((data) => {
                if (!cancelled) setCanUpload((data.options || []).length > 0);
            })
            .catch(() => {
                if (!cancelled) setCanUpload(true);
            });

        return () => {
            cancelled = true;
        };
    }, [role]);

    return canUpload;
}
