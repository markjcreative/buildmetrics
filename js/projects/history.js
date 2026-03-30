/**
 * history.js — Calculation history management using localStorage
 * BuildMetrics | Client-side only
 */

const History = (() => {
    const STORE_KEY = 'bcp_history';

    function _all() {
        try { return JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); }
        catch { return []; }
    }

    function _save(items) {
        localStorage.setItem(STORE_KEY, JSON.stringify(items));
    }

    function list(projectId) {
        return _all()
            .filter(h => h.projectId === projectId)
            .sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
    }

    function get(calcId) {
        return _all().find(h => h.id === calcId) || null;
    }

    function save(projectId, name, config, results, summary) {
        const all = _all();
        const calc = {
            id: 'calc_' + Date.now() + '_' + Math.random().toString(36).slice(2),
            projectId,
            name: name.trim() || 'Untitled Calculation',
            savedAt: new Date().toISOString(),
            config: JSON.parse(JSON.stringify(config)),   // deep clone
            results: JSON.parse(JSON.stringify(results)), // deep clone
            summary: summary || {}
        };
        all.push(calc);
        _save(all);
        // Touch the parent project's updatedAt
        if (window.Projects) Projects.touch(projectId);
        return calc;
    }

    function remove(calcId) {
        const calc = _all().find(h => h.id === calcId);
        if (calc && window.Projects) {
            const project = Projects.get(calc.projectId);
            const uid = window.Auth ? Auth.currentUser()?.id : null;
            if (project && uid && project.ownerId !== uid) throw new Error('Not authorized.');
        }
        _save(_all().filter(h => h.id !== calcId));
    }

    function deleteByProject(projectId) {
        _save(_all().filter(h => h.projectId !== projectId));
    }

    function count(projectId) {
        return _all().filter(h => h.projectId === projectId).length;
    }

    return { list, get, save, remove, deleteByProject, count };
})();

window.History = History;
