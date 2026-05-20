/**
 * auth.js — API-backed authentication for BuildMetrics
 * All user data stored in MySQL via /api/auth.php
 */

const Auth = (() => {
    const SESSION_KEY = 'bm_token';
    const USER_KEY    = 'bm_user';
    const API         = '/api/auth.php';

    const GOOGLE_CLIENT_ID = '440038191618-he1pm3lglml6r6trivqce2q6u8sjbon8.apps.googleusercontent.com';

    /* ── Token helpers ───────────────────────────────────────── */
    function getToken()       { return localStorage.getItem(SESSION_KEY) || ''; }
    function setToken(t)      { localStorage.setItem(SESSION_KEY, t); }
    function clearSession()   { localStorage.removeItem(SESSION_KEY); localStorage.removeItem(USER_KEY); }

    function setUser(u)       { localStorage.setItem(USER_KEY, JSON.stringify(u)); }
    function currentUser()    {
        try { return JSON.parse(localStorage.getItem(USER_KEY)); }
        catch { return null; }
    }

    function authHeaders() {
        return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getToken() };
    }

    async function apiPost(action, data) {
        const res  = await fetch(`${API}?action=${action}`, {
            method: 'POST', headers: authHeaders(), body: JSON.stringify(data),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Request failed');
        return json;
    }

    /* ── Register ────────────────────────────────────────────── */
    async function register(email, password, name) {
        const data = await apiPost('register', { email, password, name });
        setToken(data.token);
        setUser(data.user);
        // Welcome email (non-blocking)
        fetch('/api/send-email.php', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'welcome', to: data.user.email, name: data.user.name }),
        }).catch(() => {});
        return data.user;
    }

    /* ── Login ───────────────────────────────────────────────── */
    async function login(email, password) {
        const data = await apiPost('login', { email, password });
        setToken(data.token);
        setUser(data.user);
        return data.user;
    }

    /* ── Google Sign-In ──────────────────────────────────────── */
    async function loginWithGoogle(credential) {
        const data = await apiPost('google', { credential });
        setToken(data.token);
        setUser(data.user);
        if (data.is_new) {
            fetch('/api/send-email.php', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'welcome', to: data.user.email, name: data.user.name }),
            }).catch(() => {});
        }
        return { user: data.user, isNew: data.is_new };
    }

    /* ── Logout ──────────────────────────────────────────────── */
    async function logout() {
        try {
            await fetch(`${API}?action=logout`, { method: 'POST', headers: authHeaders() });
        } catch (_) {}
        clearSession();
        window.location.href = '/login';
    }

    /* ── Guard ───────────────────────────────────────────────── */
    function guard() {
        if (!getToken() || !currentUser()) {
            window.location.href = '/login';
            return false;
        }
        return true;
    }

    /* ── Profile update ──────────────────────────────────────── */
    async function updateProfile(updates) {
        const data = await apiPost('update', updates);
        setUser(data);
        return data;
    }

    /* ── Refresh user from server ────────────────────────────── */
    async function refreshUser() {
        const res  = await fetch(`${API}?action=me`, { headers: authHeaders() });
        const json = await res.json();
        if (!res.ok) { clearSession(); window.location.href = '/login'; return null; }
        setUser(json);
        return json;
    }

    /* ── Email helper ────────────────────────────────────────── */
    async function sendEmail(type, to, name, extras = {}) {
        return fetch('/api/send-email.php', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, to, name, ...extras }),
        }).then(r => r.json());
    }

    return {
        register, login, loginWithGoogle, logout, guard,
        currentUser, updateProfile, refreshUser, sendEmail,
        getToken, authHeaders,
    };
})();

window.Auth = Auth;
