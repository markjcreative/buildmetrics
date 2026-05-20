/**
 * history.js — Calculation history backed by MySQL via /api/calculations.php
 */

const CalcHistory = (() => {
    const API = '/api/calculations.php';

    function headers() { return Auth.authHeaders(); }

    /* ── List calculations ───────────────────────────────────── */
    async function getAll({ project_id, type } = {}) {
        let url = API;
        const params = new URLSearchParams();
        if (project_id) params.set('project_id', project_id);
        if (type)       params.set('type', type);
        if ([...params].length) url += '?' + params.toString();
        const res = await fetch(url, { headers: headers() });
        if (!res.ok) return [];
        return res.json();
    }

    /* ── Save (create or update) ─────────────────────────────── */
    async function save({ id, calc_type, name, inputs, results, project_id } = {}) {
        const res  = await fetch(API, {
            method: 'POST', headers: headers(),
            body: JSON.stringify({ id, calc_type, name, inputs, results, project_id }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to save calculation');
        return json;
    }

    /* ── Update ──────────────────────────────────────────────── */
    async function update(id, updates) {
        const res = await fetch(`${API}?id=${id}`, {
            method: 'PUT', headers: headers(), body: JSON.stringify(updates),
        });
        return res.ok;
    }

    /* ── Delete one ──────────────────────────────────────────── */
    async function remove(id) {
        const res = await fetch(`${API}?id=${id}`, { method: 'DELETE', headers: headers() });
        return res.ok;
    }

    /* ── Clear all history ───────────────────────────────────── */
    async function clear() {
        const res = await fetch(`${API}?clear=1`, { method: 'DELETE', headers: headers() });
        return res.ok;
    }

    /* ── Count ───────────────────────────────────────────────── */
    async function count() {
        const all = await getAll();
        return all.length;
    }

    return { getAll, save, update, remove, clear, count };
})();

window.CalcHistory = CalcHistory;
