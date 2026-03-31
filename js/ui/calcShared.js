/**
 * BuildMetrics — Shared Calc Page Infrastructure
 * Used by all /calcs/*.html pages
 */
const CalcShared = (() => {

    function escHtml(s) {
        return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    // Toast system (same as app.js)
    function showToast(msg, type = 'default') {
        const icons = { default: 'ℹ', success: '✓', error: '⚠' };
        const t = document.createElement('div');
        t.className = `bm-toast bm-toast--${type}`;
        t.innerHTML = `<span class="bm-toast-icon">${icons[type] || icons.default}</span>${escHtml(msg)}`;
        document.body.appendChild(t);
        requestAnimationFrame(() => { requestAnimationFrame(() => { t.classList.add('show'); }); });
        setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 250); }, 3500);
    }

    // Save calculation to history
    function saveCalc(calcType, name, config, results, summary) {
        const user = Auth.currentUser();
        if (!user) { showToast('Please sign in to save.', 'error'); return false; }

        const proj = Projects.getActive();
        if (!proj) { showToast('Select a project first.', 'error'); return false; }

        const enrichedConfig = { ...config, calcType };
        try {
            History.save(proj.id, name || `${calcType} calc`, enrichedConfig, results, summary);
            showToast('Calculation saved!', 'success');
            return true;
        } catch (e) {
            showToast(e.message || 'Save failed.', 'error');
            return false;
        }
    }

    // Render project badge in navbar area
    function renderProjectBadge(containerId) {
        const container = document.getElementById(containerId || 'nav-project-badge');
        if (!container) return;
        const proj = Projects.getActive();
        if (proj) {
            container.innerHTML = `<span style="font-size:0.78rem;color:var(--text-muted);padding:0 4px 0 8px;border-left:1px solid var(--border);">📁 ${escHtml(proj.name)}</span>`;
        }
    }

    // Open save modal and handle submission
    function initSaveModal(modalId, calcType, getStateFn) {
        const overlay = document.getElementById(modalId || 'save-calc-modal');
        if (!overlay) return;

        const closeBtn = overlay.querySelector('.modal-close');
        const form = overlay.querySelector('form') || overlay.querySelector('[data-save-form]');
        const input = overlay.querySelector('#save-calc-name');
        const submitBtn = overlay.querySelector('[data-save-submit]');

        if (closeBtn) closeBtn.addEventListener('click', () => overlay.classList.remove('open'));
        overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('open'); });

        if (submitBtn) {
            submitBtn.addEventListener('click', () => {
                const name = input ? input.value.trim() : 'Untitled';
                if (!name) { input && input.focus(); return; }
                const state = getStateFn();
                if (state) {
                    saveCalc(calcType, name, state.config, state.results, state.summary);
                    overlay.classList.remove('open');
                    if (input) input.value = '';
                }
            });
        }
    }

    function openSaveModal(modalId) {
        const overlay = document.getElementById(modalId || 'save-calc-modal');
        if (overlay) overlay.classList.add('open');
    }

    // Load calc state from URL param ?load=calcId
    function loadFromUrl(restoreFn) {
        const params = new URLSearchParams(location.search);
        const calcId = params.get('load');
        if (!calcId) return false;

        const all = JSON.parse(localStorage.getItem('bcp_history') || '[]');
        const calc = all.find(c => c.id === calcId);
        if (!calc) return false;

        restoreFn(calc.config, calc.results);
        history.replaceState({}, '', location.pathname);
        return true;
    }

    // Load template from URL param ?template=tplId
    function loadTemplateFromUrl(restoreFn) {
        const params = new URLSearchParams(location.search);
        const tplId = params.get('template');
        if (!tplId || !window.CalcTemplates) return false;

        const tpl = window.CalcTemplates.find(t => t.id === tplId);
        if (!tpl) return false;

        restoreFn(tpl.config, null);
        history.replaceState({}, '', location.pathname);
        showToast(`Template "${tpl.name}" loaded`, 'success');
        return true;
    }

    // Render a pass/fail badge
    function passBadge(pass, detail) {
        const cls = pass ? 'bm-pass' : 'bm-fail';
        const icon = pass ? '✓' : '✗';
        return `<span class="${cls}">${icon} ${detail || (pass ? 'PASS' : 'FAIL')}</span>`;
    }

    // Format number for display
    function fmt(v, dp = 2) {
        if (v === null || v === undefined || isNaN(v)) return '—';
        return Number(v).toFixed(dp);
    }

    return { showToast, saveCalc, renderProjectBadge, initSaveModal, openSaveModal, loadFromUrl, loadTemplateFromUrl, passBadge, fmt, escHtml };
})();
window.CalcShared = CalcShared;
