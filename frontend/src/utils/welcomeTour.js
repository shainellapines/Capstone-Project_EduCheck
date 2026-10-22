// Whether an account has seen the welcome guide (components/WelcomeTour.jsx)
// on this browser, and which roles have one.

export const TOUR_ROLES = ["subject", "adviser", "admin", "principal"];

export const hasTourFor = (role) => TOUR_ROLES.includes(role);

const storageKey = (user) => `educheck_tour_seen_${user?.user_id ?? user?.username ?? "anon"}`;

// Browser storage can be blocked (private windows, cleared site data); the
// guide then simply opens again next time.
export const hasSeenTour = (user) => {
    try {
        return localStorage.getItem(storageKey(user)) === "1";
    } catch {
        return false;
    }
};

export const markTourSeen = (user) => {
    try {
        localStorage.setItem(storageKey(user), "1");
    } catch {
        // see hasSeenTour
    }
};
