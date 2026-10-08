// Where the EduCheck backend lives. Set VITE_API_URL in frontend/.env
// (e.g. VITE_API_URL=http://192.168.1.20:5000) when the backend is not on
// this same computer. Defaults to the local backend for development.
const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:5000")
    .trim()
    .replace(/\/+$/, "");

export const API_URL = `${API_ORIGIN}/api`;
