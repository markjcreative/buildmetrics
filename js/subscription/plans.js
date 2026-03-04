/**
 * plans.js — Subscription plan management for BeamCalc Pro
 * Stores plan state in localStorage. Stripe will be wired in later.
 */

const FREE_LIMITS = { projects: 1, calculations: 5 };
const PRO_PRICE_USD = 59;

const Subscription = (() => {
    function _key(userId) { return 'bcp_sub_' + userId; }

    /**
     * Get the subscription record for a user.
     * @returns {{ plan: 'free'|'pro', subscribedAt: string|null, expiresAt: string|null }}
     */
    function get(userId) {
        if (!userId) return _defaultFree();
        try {
            const raw = localStorage.getItem(_key(userId));
            if (!raw) return _defaultFree();
            return JSON.parse(raw);
        } catch { return _defaultFree(); }
    }

    function _defaultFree() {
        return { plan: 'free', subscribedAt: null, expiresAt: null };
    }

    function _save(userId, record) {
        localStorage.setItem(_key(userId), JSON.stringify(record));
    }

    /**
     * Returns true if the user has an active Pro subscription.
     */
    function isPro(userId) {
        const sub = get(userId);
        if (sub.plan !== 'pro') return false;
        if (sub.expiresAt && new Date(sub.expiresAt) < new Date()) return false;
        return true;
    }

    /**
     * Activate Pro for a user (called after Stripe payment success).
     * @param {string} userId
     * @param {string|null} expiresAt - ISO date, or null for no expiry
     */
    function activate(userId, expiresAt = null) {
        _save(userId, {
            plan: 'pro',
            subscribedAt: new Date().toISOString(),
            expiresAt: expiresAt
        });
    }

    /**
     * Downgrade a user back to Free.
     */
    function downgrade(userId) {
        _save(userId, _defaultFree());
    }

    /**
     * Get current usage counts for a user.
     * Reads from bcp_projects and bcp_history in localStorage.
     * @returns {{ projects: number, calculations: number }}
     */
    function usage(userId) {
        if (!userId) return { projects: 0, calculations: 0 };
        try {
            const projects = JSON.parse(localStorage.getItem('bcp_projects') || '[]')
                .filter(p => p.ownerId === userId);
            const projectIds = new Set(projects.map(p => p.id));
            const calcs = JSON.parse(localStorage.getItem('bcp_history') || '[]')
                .filter(h => projectIds.has(h.projectId));
            return { projects: projects.length, calculations: calcs.length };
        } catch { return { projects: 0, calculations: 0 }; }
    }

    return { get, isPro, activate, downgrade, usage };
})();

window.Subscription = Subscription;
window.FREE_LIMITS = FREE_LIMITS;
window.PRO_PRICE_USD = PRO_PRICE_USD;
