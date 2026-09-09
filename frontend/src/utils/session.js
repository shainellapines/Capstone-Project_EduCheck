// Centralized session/token helpers.
//
// Previously every page read "educheck_token"/"educheck_user" out of
// localStorage directly, and ProtectedRoute (and App.jsx's
// RoleBasedDashboard) only checked whether educheck_user *existed* —
// never whether the token itself was still valid. A token past its 8h
// expiry (see authController.js's jwt.sign) left the page rendered as
// if logged in, with every API call underneath it silently failing
// with 401 and nothing routing the user back to Login.
//
// This module is the one place that decides "is this session actually
// still good," and installs a global fetch interceptor so any 401 —
// not just a page mount — triggers the same cleanup.

const TOKEN_KEY = "educheck_token";
const USER_KEY = "educheck_user";

function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

function getStoredUser() {
    const raw = localStorage.getItem(USER_KEY);

    if (!raw) return null;

    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

// Decodes the JWT's payload segment client-side to read its expiry.
// This is NOT a signature check — the client has no way to verify a
// JWT's signature, nor should it need to; that's the backend's job on
// every request via authMiddleware.js. It only tells the UI "would the
// backend already consider this token expired," so a stale session
// doesn't sit on screen looking valid.
function decodeTokenPayload(token) {
    try {
        const payload = token.split(".")[1];
        const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));

        return JSON.parse(json);
    } catch {
        return null;
    }
}

function isSessionValid() {
    const token = getToken();
    const user = getStoredUser();

    if (!token || !user) return false;

    const payload = decodeTokenPayload(token);

    if (!payload || !payload.exp) return false;

    return payload.exp * 1000 > Date.now();
}

function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

// Installed once, at app startup (see main.jsx). Wraps the global
// fetch so a session the backend has stopped honoring — expired or
// otherwise invalidated — clears itself and returns to Login instead
// of leaving every page on screen silently broken.
//
// Login's own "invalid username or password" 401 is unaffected: that
// request fires before any token has ever been stored, so the guard
// below (which only acts when a token already exists) never applies
// to it — Login.jsx's own catch block still shows that message as before.
function installSessionGuard() {
    const originalFetch = window.fetch.bind(window);

    window.fetch = async (...args) => {
        const response = await originalFetch(...args);

        if (response.status === 401 && getToken()) {
            clearSession();

            if (window.location.pathname !== "/") {
                window.location.href = "/";
            }
        }

        return response;
    };
}

export {
    getToken,
    getStoredUser,
    isSessionValid,
    clearSession,
    installSessionGuard,
};
