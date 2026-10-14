// Where the EduCheck backend lives. Set VITE_API_URL in frontend/.env
// (e.g. VITE_API_URL=http://192.168.1.20:5000) when the backend is not on
// the same computer that serves this page. Otherwise the backend is assumed
// to be on port 5000 of whatever address the page was opened from: localhost
// on the laptop itself, or the laptop's IP for another device on the same
// network (npm run dev:lan).
const sameHostBackend = `${window.location.protocol}//${window.location.hostname || "localhost"}:5000`;

const API_ORIGIN = (import.meta.env.VITE_API_URL || sameHostBackend)
    .trim()
    .replace(/\/+$/, "");

export const API_URL = `${API_ORIGIN}/api`;
