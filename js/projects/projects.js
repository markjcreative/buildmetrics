/**
 * projects.js — Project management backed by MySQL via /api/projects.php
 */

const Projects = (() => {
    const API = '/api/projects.php';

    function headers() { return Auth.authHeaders(); }

    /* ── Fetch all projects ──────────────────────────────────── */
    async function getAll() {
        const res = await fetch(API, { headers: headers() });
        if (!res.ok) return [];
        return res.json();
    }

    /* ── Get single project ──────────────────────────────────── */
    async function get(id) {
        const all = await getAll();
        return all.find(p => p.id === id) || null;
    }

    /* ── Create project ──────────────────────────────────────── */
    async function create(name, description = '', colour = '#2563EB') {
        const res  = await fetch(API, {
            method: 'POST', headers: headers(),
            body: JSON.stringify({ name, description, colour }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to create project');
        return json;
    }

    /* ── Update project ──────────────────────────────────────── */
    async function update(id, updates) {
        const res  = await fetch(`${API}?id=${id}`, {
            method: 'PUT', headers: headers(), body: JSON.stringify(updates),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to update project');
        return json;
    }

    /* ── Delete project ──────────────────────────────────────── */
    async function remove(id) {
        const res = await fetch(`${API}?id=${id}`, { method: 'DELETE', headers: headers() });
        if (!res.ok) { const j = await res.json(); throw new Error(j.error); }
        return true;
    }

    /* ── Active project helpers (still uses session for current selection) ── */
    function getActiveId() {
        try { return JSON.parse(localStorage.getItem('bm_user'))?.activeProjectId || null; }
        catch { return null; }
    }

    function setActiveId(id) {
        try {
            const u = JSON.parse(localStorage.getItem('bm_user')) || {};
            u.activeProjectId = id;
            localStorage.setItem('bm_user', JSON.stringify(u));
        } catch {}
    }

    async function setActive(id) {
        setActiveId(id);
    }

    async function getActive() {
        const id = getActiveId();
        return id ? await get(id) : null;
    }

    return { getAll, get, create, update, remove, setActive, getActive, getActiveId, setActiveId };
})();

window.Projects = Projects;
