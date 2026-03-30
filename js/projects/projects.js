/**
 * projects.js — Project management using localStorage
 * Kinecalc | Client-side only
 */

const Projects = (() => {
    const STORE_KEY = 'bcp_projects';

    function _all() {
        try { return JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); }
        catch { return []; }
    }

    function _save(projects) {
        localStorage.setItem(STORE_KEY, JSON.stringify(projects));
    }

    function _userId() {
        const u = Auth.currentUser();
        return u ? u.id : null;
    }

    function list() {
        const uid = _userId();
        return _all().filter(p => p.ownerId === uid).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    }

    function get(id) {
        return _all().find(p => p.id === id) || null;
    }

    function create(name, description = '') {
        const uid = _userId();
        if (!uid) throw new Error('Not logged in.');
        if (!name.trim()) throw new Error('Project name is required.');

        const project = {
            id: 'proj_' + Date.now() + '_' + Math.random().toString(36).slice(2),
            ownerId: uid,
            name: name.trim(),
            description: description.trim(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        const all = _all();
        all.push(project);
        _save(all);
        return project;
    }

    function update(id, updates) {
        const all = _all();
        const idx = all.findIndex(p => p.id === id);
        if (idx === -1) throw new Error('Project not found.');
        if (all[idx].ownerId !== _userId()) throw new Error('Not authorized.');
        if (updates.name !== undefined) all[idx].name = updates.name.trim();
        if (updates.description !== undefined) all[idx].description = updates.description.trim();
        all[idx].updatedAt = new Date().toISOString();
        _save(all);
        return all[idx];
    }

    function remove(id) {
        const all = _all();
        const project = all.find(p => p.id === id);
        if (project && project.ownerId !== _userId()) throw new Error('Not authorized.');
        // Also remove all calculations for this project
        History.deleteByProject(id);
        _save(all.filter(p => p.id !== id));
    }

    function setActive(id) {
        try {
            const session = JSON.parse(localStorage.getItem('bcp_session'));
            if (session) { session.activeProjectId = id; localStorage.setItem('bcp_session', JSON.stringify(session)); }
        } catch { }
    }

    function getActiveId() {
        try {
            const session = JSON.parse(localStorage.getItem('bcp_session'));
            return session ? session.activeProjectId : null;
        } catch { return null; }
    }

    function getActive() {
        const id = getActiveId();
        return id ? get(id) : null;
    }

    function touch(id) {
        // Update the project's updatedAt timestamp
        const all = _all();
        const idx = all.findIndex(p => p.id === id);
        if (idx !== -1) { all[idx].updatedAt = new Date().toISOString(); _save(all); }
    }

    return { list, get, create, update, remove, setActive, getActiveId, getActive, touch };
})();

window.Projects = Projects;
