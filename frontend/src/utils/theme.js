// Theme (light/dark) helpers, same pattern as session.js: one place that
// owns the localStorage key and the actual DOM effect, so every page
// reads/writes through the same functions instead of touching
// document.documentElement directly.

const THEME_KEY = "educheck_theme";

function getStoredTheme() {
    const value = localStorage.getItem(THEME_KEY);
    return value === "dark" ? "dark" : "light";
}

function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme === "dark" ? "dark" : "light");
}

function setTheme(theme) {
    const normalized = theme === "dark" ? "dark" : "light";
    localStorage.setItem(THEME_KEY, normalized);
    applyTheme(normalized);
}

// Applied at app startup, before React renders (see main.jsx) — otherwise
// the page paints in light mode for one frame and then flips, which reads
// as a flicker/bug rather than a deliberate choice.
function installTheme() {
    applyTheme(getStoredTheme());
}

export { getStoredTheme, setTheme, installTheme };
