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

    /* ─────────────────────────────────────────────────────
       Save + Confirmation Modal (with PDF / Word download)
    ───────────────────────────────────────────────────── */

    // Stored for when download buttons are clicked
    let _pendingReport = null;

    // Inject the confirmation modal once into the page
    function _injectConfirmModal() {
        if (document.getElementById('bm-confirm-modal')) return;

        // Styles
        const style = document.createElement('style');
        style.textContent = `
            #bm-confirm-modal {
                position: fixed; inset: 0;
                background: rgba(0,0,0,0.45);
                z-index: 9999;
                display: flex; align-items: center; justify-content: center;
                opacity: 0; pointer-events: none;
                transition: opacity 0.2s;
            }
            #bm-confirm-modal.open { opacity: 1; pointer-events: all; }
            #bm-confirm-modal .bm-cm-box {
                background: #fff;
                border-radius: 16px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.18);
                padding: 32px 28px 24px;
                width: 380px; max-width: 92vw;
                display: flex; flex-direction: column;
                align-items: center; gap: 4px;
                animation: bm-pop 0.2s ease;
            }
            @keyframes bm-pop {
                from { transform: scale(0.93) translateY(8px); opacity:0; }
                to   { transform: scale(1)    translateY(0);   opacity:1; }
            }
            #bm-confirm-modal .bm-cm-icon { font-size: 3rem; line-height: 1; margin-bottom: 8px; }
            #bm-confirm-modal h3 {
                margin: 0 0 2px;
                font-size: 1.1rem; font-weight: 700;
                color: #111; font-family: 'Inter', sans-serif;
            }
            #bm-confirm-modal .bm-cm-desc {
                font-size: 0.82rem; color: #6B7280;
                margin: 0 0 18px; text-align: center;
                font-family: 'Inter', sans-serif;
            }
            .bm-cm-btns { display: flex; gap: 10px; width: 100%; margin-bottom: 10px; }
            .bm-cm-btn {
                flex: 1; display: inline-flex; align-items: center; justify-content: center;
                gap: 6px; padding: 11px 10px;
                font-size: 0.86rem; font-weight: 600;
                font-family: 'Inter', sans-serif;
                border-radius: 10px; cursor: pointer;
                border: none; transition: all 0.15s;
            }
            .bm-cm-btn:hover { transform: translateY(-1px); filter: brightness(0.95); }
            .bm-cm-btn:active { transform: none; }
            .bm-cm-btn--pdf  { background: #DC2626; color: #fff; }
            .bm-cm-btn--word { background: #2563EB; color: #fff; }
            .bm-cm-btn--done {
                width: 100%; background: transparent;
                color: #6B7280; border: 1.5px solid #E5E7EB;
                padding: 9px 16px;
            }
            .bm-cm-btn--done:hover { background: #F9FAFB; color: #374151; border-color: #D1D5DB; }
            .bm-cm-spinner {
                display: inline-block; width: 14px; height: 14px;
                border: 2px solid rgba(255,255,255,0.4);
                border-top-color: #fff;
                border-radius: 50%;
                animation: spin 0.7s linear infinite;
            }
            @keyframes spin { to { transform: rotate(360deg); } }
        `;
        document.head.appendChild(style);

        // Modal HTML
        const modal = document.createElement('div');
        modal.id = 'bm-confirm-modal';
        modal.innerHTML = `
            <div class="bm-cm-box">
                <div class="bm-cm-icon">✅</div>
                <h3>Calculation Saved!</h3>
                <p class="bm-cm-desc" id="bm-cm-desc">—</p>
                <div class="bm-cm-btns">
                    <button class="bm-cm-btn bm-cm-btn--pdf"  id="bm-cm-pdf-btn">
                        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h4a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
                        PDF Report
                    </button>
                    <button class="bm-cm-btn bm-cm-btn--word" id="bm-cm-word-btn">
                        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h4a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
                        Word Report
                    </button>
                </div>
                <button class="bm-cm-btn bm-cm-btn--done" id="bm-cm-done-btn">Done</button>
            </div>
        `;
        document.body.appendChild(modal);

        // Close on backdrop click
        modal.addEventListener('click', e => {
            if (e.target === modal) modal.classList.remove('open');
        });

        // Done button
        document.getElementById('bm-cm-done-btn').addEventListener('click', () => {
            modal.classList.remove('open');
        });

        // PDF button
        document.getElementById('bm-cm-pdf-btn').addEventListener('click', async () => {
            if (!_pendingReport) return;
            const btn = document.getElementById('bm-cm-pdf-btn');
            const orig = btn.innerHTML;
            btn.innerHTML = '<span class="bm-cm-spinner"></span> Generating…';
            btn.disabled = true;
            try {
                await CalcReport.exportPDF(_pendingReport);
                _trackDownload();
                showToast('PDF downloaded!', 'success');
            } catch (err) {
                showToast('PDF failed: ' + (err.message || err), 'error');
                console.error(err);
            } finally {
                btn.innerHTML = orig;
                btn.disabled = false;
            }
        });

        // Word button
        document.getElementById('bm-cm-word-btn').addEventListener('click', async () => {
            if (!_pendingReport) return;
            const btn = document.getElementById('bm-cm-word-btn');
            const orig = btn.innerHTML;
            btn.innerHTML = '<span class="bm-cm-spinner"></span> Generating…';
            btn.disabled = true;
            try {
                await CalcReport.exportWord(_pendingReport);
                _trackDownload();
                showToast('Word doc downloaded!', 'success');
            } catch (err) {
                showToast('Word export failed: ' + (err.message || err), 'error');
                console.error(err);
            } finally {
                btn.innerHTML = orig;
                btn.disabled = false;
            }
        });
    }

    function _trackDownload() {
        const n = parseInt(localStorage.getItem('bcp_dl_count') || '0') + 1;
        localStorage.setItem('bcp_dl_count', String(n));
    }

    function _openConfirmModal(calcName, projectName, calcType, config, results) {
        _injectConfirmModal();
        const proj = Projects.getActive();
        const projName = (proj && proj.name) || projectName || '—';

        // Build report data for downloads
        if (window.CalcReport) {
            _pendingReport = CalcReport.buildData(calcType, config, results, calcName, projName);
        }

        // Update description text
        const desc = document.getElementById('bm-cm-desc');
        if (desc) {
            desc.innerHTML = `<strong>${escHtml(calcName || calcType)}</strong> saved to project <strong>${escHtml(projName)}</strong>`;
        }

        const modal = document.getElementById('bm-confirm-modal');
        if (modal) modal.classList.add('open');
    }

    /**
     * saveAndConfirm — Save a calculation, then open the confirm/download modal.
     * Replaces direct calls to saveCalc() on all calc pages.
     */
    function saveAndConfirm(calcType, name, config, results, summary) {
        const ok = saveCalc(calcType, name, config, results, summary);
        if (ok) {
            _openConfirmModal(name, null, calcType, config, results);
        }
        return ok;
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

    // Open save modal and handle submission — updated to use saveAndConfirm
    function initSaveModal(modalId, calcType, getStateFn) {
        const overlay = document.getElementById(modalId || 'save-calc-modal');
        if (!overlay) return;

        const closeBtn = overlay.querySelector('.modal-close');
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
                    const ok = saveAndConfirm(calcType, name, state.config, state.results, state.summary);
                    if (ok) {
                        overlay.classList.remove('open');
                        if (input) input.value = '';
                    }
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

    return {
        showToast, saveCalc, saveAndConfirm,
        renderProjectBadge, initSaveModal, openSaveModal,
        loadFromUrl, loadTemplateFromUrl,
        passBadge, fmt, escHtml,
    };
})();
window.CalcShared = CalcShared;
