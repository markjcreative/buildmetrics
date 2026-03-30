/**
 * plans.js — Subscription plan management for Kinecalc
 * Stores plan state in localStorage. Stripe will be wired in later.
 */

const FREE_LIMITS = { projects: 1, calculations: 5 };
const PRO_PRICE_USD = 59;

const Subscription = (() => {
    function _key(userId) { return 'bcp_sub_' + userId; }

    /**
     * Get the subscription record for a user.
     * @returns {{ plan, subscribedAt, expiresAt, cancelledAt, cancelAtPeriodEnd, billingHistory }}
     */
    function get(userId) {
        if (!userId) return _defaultFree();
        try {
            const raw = localStorage.getItem(_key(userId));
            if (!raw) return _defaultFree();
            const record = JSON.parse(raw);
            // Ensure billingHistory always exists (backwards compat)
            if (!record.billingHistory) record.billingHistory = [];
            return record;
        } catch { return _defaultFree(); }
    }

    function _defaultFree() {
        return {
            plan: 'free',
            subscribedAt: null,
            expiresAt: null,
            cancelledAt: null,
            cancelAtPeriodEnd: false,
            billingHistory: []
        };
    }

    function _save(userId, record) {
        localStorage.setItem(_key(userId), JSON.stringify(record));
    }

    /**
     * Returns true if the user has an active Pro subscription.
     * Respects cancelAtPeriodEnd — stays Pro until expiresAt.
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
     * @param {string|null} expiresAt - ISO date string, or null for no expiry
     */
    function activate(userId, expiresAt = null) {
        const existing = get(userId);
        const isRenewal = existing.plan === 'pro';
        const eventType = isRenewal ? 'renewed' : 'subscribed';

        // Build next billing date as 1 month from now if no expiresAt given
        const nextBilling = expiresAt || (() => {
            const d = new Date();
            d.setMonth(d.getMonth() + 1);
            return d.toISOString();
        })();

        const historyEntry = {
            id: 'evt_' + Date.now(),
            type: eventType,
            date: new Date().toISOString(),
            amount: PRO_PRICE_USD,
            currency: 'USD',
            status: 'paid',
            note: isRenewal ? 'Subscription renewed' : 'Pro subscription started',
            periodEnd: nextBilling
        };

        _save(userId, {
            plan: 'pro',
            subscribedAt: existing.subscribedAt || new Date().toISOString(),
            expiresAt: nextBilling,
            cancelledAt: null,
            cancelAtPeriodEnd: false,
            billingHistory: [historyEntry, ...(existing.billingHistory || [])]
        });
    }

    /**
     * Cancel a Pro subscription (cancel-at-period-end model).
     * The user keeps Pro access until expiresAt, then reverts to Free.
     */
    function cancel(userId) {
        const sub = get(userId);
        if (sub.plan !== 'pro') return;

        const now = new Date().toISOString();
        const historyEntry = {
            id: 'evt_' + Date.now(),
            type: 'cancelled',
            date: now,
            amount: null,
            currency: 'USD',
            status: 'cancelled',
            note: 'Subscription cancelled by user',
            periodEnd: sub.expiresAt
        };

        _save(userId, {
            ...sub,
            cancelledAt: now,
            cancelAtPeriodEnd: true,
            billingHistory: [historyEntry, ...(sub.billingHistory || [])]
        });
    }

    /**
     * Immediately downgrade a user to Free (admin use / after period ends).
     */
    function downgrade(userId) {
        const sub = get(userId);
        _save(userId, {
            ..._defaultFree(),
            billingHistory: sub.billingHistory || []
        });
    }

    /**
     * Get billing history for a user, sorted newest first.
     * @returns {Array}
     */
    function getBillingHistory(userId) {
        const sub = get(userId);
        return (sub.billingHistory || []).sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    /**
     * Get current usage counts for a user.
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

    return { get, isPro, activate, cancel, downgrade, getBillingHistory, usage };
})();

window.Subscription = Subscription;
window.FREE_LIMITS = FREE_LIMITS;
window.PRO_PRICE_USD = PRO_PRICE_USD;
