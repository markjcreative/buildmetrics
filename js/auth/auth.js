/**
 * auth.js — Client-side authentication using SubtleCrypto + localStorage
 * Kinecalc | No backend required
 */

const Auth = (() => {
    const USERS_KEY = 'bcp_users';
    const SESSION_KEY = 'bcp_session';

    /* ── Crypto ──────────────────────────────────────────────── */
    function generateSalt() {
        return Array.from(crypto.getRandomValues(new Uint8Array(16)))
            .map(b => b.toString(16).padStart(2, '0')).join('');
    }

    async function hashPassword(password, salt) {
        // Fallback to legacy salt for existing accounts that predate per-user salts
        const effectiveSalt = salt || 'bcp_salt_v1';
        const encoder = new TextEncoder();
        const data = encoder.encode(password + effectiveSalt);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    /* ── User Store ──────────────────────────────────────────── */
    function getUsers() {
        try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); }
        catch { return []; }
    }

    function saveUsers(users) {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    /* ── Auth Actions ────────────────────────────────────────── */
    async function register(email, password, name) {
        const users = getUsers();
        const exists = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (exists) throw new Error('An account with this email already exists.');
        if (password.length < 6) throw new Error('Password must be at least 6 characters.');

        const salt = generateSalt();
        const hash = await hashPassword(password, salt);
        const user = {
            id: 'u_' + Date.now() + '_' + Math.random().toString(36).slice(2),
            email: email.toLowerCase().trim(),
            name: name.trim(),
            hash,
            salt,
            designation: '',
            company: '',
            createdAt: new Date().toISOString()
        };
        users.push(user);
        saveUsers(users);
        _setSession(user);
        return user;
    }

    async function login(email, password) {
        const users = getUsers();
        const idx = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase().trim());
        if (idx === -1) throw new Error('No account found with this email address.');
        const user = users[idx];
        const hash = await hashPassword(password, user.salt);
        if (hash !== user.hash) throw new Error('Incorrect password. Please try again.');

        // Transparently migrate legacy accounts (no per-user salt) on successful login
        if (!user.salt) {
            const newSalt = generateSalt();
            users[idx].salt = newSalt;
            users[idx].hash = await hashPassword(password, newSalt);
            saveUsers(users);
        }

        _setSession(users[idx]);
        return users[idx];
    }

    function logout() {
        localStorage.removeItem(SESSION_KEY);
        window.location.href = '/login.html';
    }

    function currentUser() {
        try { return JSON.parse(localStorage.getItem(SESSION_KEY)); }
        catch { return null; }
    }

    function guard() {
        if (!currentUser()) {
            window.location.href = '/login.html';
            return false;
        }
        return true;
    }

    function _setSession(user) {
        // Store a safe copy (no hash) as the session
        const { hash, ...safeUser } = user;
        localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
    }

    /* ── Profile Update ──────────────────────────────────────── */
    async function updateProfile(updates) {
        const session = currentUser();
        if (!session) throw new Error('Not logged in.');
        const users = getUsers();
        const idx = users.findIndex(u => u.id === session.id);
        if (idx === -1) throw new Error('User not found.');

        const allowed = ['name', 'designation', 'company'];
        allowed.forEach(k => { if (updates[k] !== undefined) users[idx][k] = updates[k]; });
        saveUsers(users);
        _setSession(users[idx]);
        return users[idx];
    }

    async function resetPassword(oldPassword, newPassword) {
        const session = currentUser();
        if (!session) throw new Error('Not logged in.');
        const users = getUsers();
        const idx = users.findIndex(u => u.id === session.id);
        if (idx === -1) throw new Error('User not found.');

        const oldHash = await hashPassword(oldPassword, users[idx].salt);
        if (oldHash !== users[idx].hash) throw new Error('Current password is incorrect.');
        if (newPassword.length < 6) throw new Error('New password must be at least 6 characters.');

        const newSalt = generateSalt();
        users[idx].salt = newSalt;
        users[idx].hash = await hashPassword(newPassword, newSalt);
        saveUsers(users);
        return true;
    }

    return { register, login, logout, currentUser, guard, updateProfile, resetPassword };
})();

window.Auth = Auth;
