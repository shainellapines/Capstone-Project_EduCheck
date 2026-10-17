// Sidebar collapsed/expanded helpers, same pattern as theme.js: the
// collapsed state lives on <html data-sidebar="collapsed"> so the CSS can
// narrow both the sidebar and every page's .dashboard-main margin without
// each page knowing about it.

const SIDEBAR_KEY = "educheck_sidebar";

function readCollapsed() {
    try {
        return localStorage.getItem(SIDEBAR_KEY) === "collapsed";
    } catch {
        return false;
    }
}

function applySidebar(collapsed) {
    if (collapsed) {
        document.documentElement.setAttribute("data-sidebar", "collapsed");
    } else {
        document.documentElement.removeAttribute("data-sidebar");
    }
}

function setSidebarCollapsed(collapsed) {
    try {
        localStorage.setItem(SIDEBAR_KEY, collapsed ? "collapsed" : "expanded");
    } catch {
        // Not critical — the choice just won't survive a reload.
    }
    applySidebar(collapsed);
}

// Applied at app startup, before React renders (see main.jsx), so a
// collapsed sidebar doesn't paint wide for one frame and then snap shut.
function installSidebar() {
    applySidebar(readCollapsed());
}

export { readCollapsed as isSidebarCollapsed, setSidebarCollapsed, installSidebar };
