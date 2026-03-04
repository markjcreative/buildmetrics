/**
 * app.js — Application bootstrap, auth, project context, save/restore logic
 */

document.addEventListener('DOMContentLoaded', async () => {
    // ── Auth Guard ──────────────────────────────────────────────────────
    if (!Auth.guard()) return;

    const user = Auth.currentUser();

    // ── Project Context ─────────────────────────────────────────────────
    const activeProject = Projects.getActive();
    if (activeProject) {
        document.getElementById('nav-project-badge').style.display = 'flex';
        document.getElementById('nav-project-name').textContent = activeProject.name;
    }

    // ── Initialize Input Panel ───────────────────────────────────────────
    InputPanel.initInputPanel();

    // ── Restore Calculation from History (?load=calcId) ─────────────────
    const params = new URLSearchParams(location.search);
    const loadId = params.get('load');
    if (loadId) {
        const calc = History.get(loadId);
        if (calc) {
            restoreCalcState(calc);
            // Clean URL
            history.replaceState({}, '', '/index.html');
        }
    }

    // ── Export: PDF ──────────────────────────────────────────────────────
    document.getElementById('btn-export-pdf').addEventListener('click', async () => {
        const projectInfo = await PDFReport.showProjectInfoModal();
        if (!projectInfo) return;
        const btn = document.getElementById('btn-export-pdf');
        btn.textContent = '⏳ Generating PDF…';
        btn.disabled = true;
        try {
            await PDFReport.exportPDF(window._lastResults, window._lastConfig, projectInfo);
        } catch (e) {
            alert('PDF generation failed: ' + e.message);
        }
        btn.textContent = '📄 Download PDF';
        btn.disabled = false;
    });

    // ── Export: CSV ──────────────────────────────────────────────────────
    document.getElementById('btn-export-csv').addEventListener('click', () => {
        if (window._lastResults && window._lastConfig) {
            CSVExport.exportCSV(window._lastResults, window._lastConfig);
        }
    });

    // ── Save Calculation ─────────────────────────────────────────────────
    document.getElementById('btn-save-calc').addEventListener('click', () => {
        openSaveCalcModal();
    });

    document.getElementById('btn-save-confirm').addEventListener('click', () => {
        doSaveCalc();
    });

    document.getElementById('save-calc-name').addEventListener('keydown', e => {
        if (e.key === 'Enter') doSaveCalc();
    });

    // Project picker (when no active project)
    document.getElementById('btn-create-proj-pick').addEventListener('click', () => {
        const name = document.getElementById('new-proj-name').value.trim();
        if (!name) { document.getElementById('new-proj-name').focus(); return; }
        try {
            const proj = Projects.create(name);
            Projects.setActive(proj.id);
            document.getElementById('proj-picker-modal').classList.remove('open');
            document.getElementById('nav-project-badge').style.display = 'flex';
            document.getElementById('nav-project-name').textContent = proj.name;
            // Re-open save modal now that we have a project
            openSaveCalcModal();
        } catch (e) {
            if (e.message === 'FREE_LIMIT_PROJECTS') {
                document.getElementById('proj-picker-modal').classList.remove('open');
                UpgradeModal.show('projects');
            } else { alert(e.message); }
        }
    });

    // ── Auto-fill PDF modal from profile ────────────────────────────────
    // Override showProjectInfoModal to pre-fill from user profile + project
    const _origShow = PDFReport.showProjectInfoModal.bind(PDFReport);
    window._origShowModal = _origShow;

    PDFReport.showProjectInfoModal = () => {
        return new Promise(resolve => {
            const modal = document.getElementById('pdf-modal');
            // Pre-fill from active project + user profile
            const proj = Projects.getActive();
            const u = Auth.currentUser();
            if (proj) document.getElementById('modal-project').value = proj.name;
            if (u) {
                document.getElementById('modal-engineer').value = u.name || '';
                document.getElementById('modal-firm').value = u.company || '';
            }
            modal.classList.add('open');
            document.getElementById('btn-modal-confirm').onclick = () => {
                const info = {
                    projectName: document.getElementById('modal-project').value,
                    engineer: document.getElementById('modal-engineer').value,
                    firm: document.getElementById('modal-firm').value,
                };
                modal.classList.remove('open');
                resolve(info);
            };
            document.getElementById('btn-modal-cancel').onclick = () => {
                modal.classList.remove('open');
                resolve(null);
            };
        });
    };

    // ── Welcome animation ────────────────────────────────────────────────
    setTimeout(() => {
        const wb = document.getElementById('welcome-banner');
        wb.style.opacity = '1';
        wb.style.transform = 'translateY(0)';
    }, 200);
});

/* ── Save Calculation Modal ─────────────────────────────────── */
function openSaveCalcModal() {
    // Ensure there's a project to save to
    const proj = Projects.getActive();
    if (!proj) {
        // Show project picker
        renderProjectPicker();
        document.getElementById('proj-picker-modal').classList.add('open');
        return;
    }
    document.getElementById('save-modal-project-name').textContent = `📁 Project: ${proj.name}`;
    document.getElementById('save-calc-name').value = '';
    document.getElementById('save-modal').classList.add('open');
    setTimeout(() => document.getElementById('save-calc-name').focus(), 100);
}

function renderProjectPicker() {
    const projects = Projects.list();
    const list = document.getElementById('proj-picker-list');
    if (projects.length === 0) {
        list.innerHTML = '<div style="text-align:center;color:var(--text-muted);font-size:0.82rem;padding:16px;">No existing projects — create one below.</div>';
        return;
    }
    list.innerHTML = projects.map(p => `
        <div onclick="pickProject('${p.id}')" style="padding:10px 14px;border:1px solid var(--border);border-radius:8px;margin-bottom:8px;cursor:pointer;transition:all 0.15s;font-size:0.85rem;font-weight:500;"
             onmouseover="this.style.borderColor='var(--accent)';this.style.background='var(--accent-light)'"
             onmouseout="this.style.borderColor='var(--border)';this.style.background='white'">
          📁 ${escHtml(p.name)}
        </div>`).join('');
}

window.pickProject = function (id) {
    Projects.setActive(id);
    const proj = Projects.get(id);
    document.getElementById('nav-project-badge').style.display = 'flex';
    document.getElementById('nav-project-name').textContent = proj.name;
    document.getElementById('proj-picker-modal').classList.remove('open');
    openSaveCalcModal();
};

function doSaveCalc() {
    const name = document.getElementById('save-calc-name').value.trim() || 'Untitled Calculation';
    const proj = Projects.getActive();
    if (!proj) { alert('Please select a project first.'); return; }
    if (!window._lastResults || !window._lastConfig) { alert('No calculation to save yet.'); return; }

    try {
        History.save(proj.id, name, window._lastConfig, window._lastResults, window._lastResults.summary);
        document.getElementById('save-modal').classList.remove('open');
        showToast(`✓ Saved to "${proj.name}"`);
    } catch (e) {
        if (e.message === 'FREE_LIMIT_CALCS') {
            document.getElementById('save-modal').classList.remove('open');
            UpgradeModal.show('calcs');
        } else {
            alert('Save failed: ' + e.message);
        }
    }
}

/* ── Restore from History ────────────────────────────────────── */
function restoreCalcState(calc) {
    const config = calc.config;

    // Reset form
    document.getElementById('support-list').innerHTML = '';
    document.getElementById('load-list').innerHTML = '';
    window.__supportCounter = 0;
    window.__loadCounter = 0;

    // Restore values
    document.getElementById('inp-span').value = config.span;
    document.getElementById('inp-E').value = config.E;
    document.getElementById('inp-I').value = config.I;
    document.getElementById('inp-A').value = config.A;

    // Material button
    document.querySelectorAll('.material-btn').forEach(b => b.classList.remove('active'));
    const matBtn = document.querySelector(`[data-material="${config.material}"]`);
    if (matBtn) matBtn.classList.add('active');

    config.supports.forEach(s => addSupportRow(s.type, s.position));
    config.loads.forEach(l => addLoadRow(l.type, l));

    InputPanel.updateBeamPreview();

    // Auto-run the calculation
    setTimeout(() => {
        try {
            window._beamSolverPointLoads = config.loads.filter(l => l.type === 'point');
            const results = BeamSolver.solveBeam(config);
            window._lastResults = results;
            window._lastConfig = config;
            BeamResults.renderResults(results, config);
            BeamDiagrams.renderAll(results, config);
            document.getElementById('results-section').classList.add('visible');
            document.getElementById('btn-export-pdf').disabled = false;
            document.getElementById('btn-export-csv').disabled = false;
            document.getElementById('btn-save-calc').disabled = false;
        } catch { }
    }, 300);
}

/* ── Helpers ─────────────────────────────────────────────────── */
function showToast(msg) {
    let t = document.getElementById('app-toast');
    if (!t) {
        t = document.createElement('div');
        t.id = 'app-toast';
        t.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#1E293B;color:white;padding:12px 20px;border-radius:8px;font-size:0.82rem;font-weight:500;box-shadow:0 4px 20px rgba(0,0,0,0.25);opacity:0;transform:translateY(10px);transition:all 0.25s;pointer-events:none;z-index:9999;font-family:Inter,sans-serif;';
        document.body.appendChild(t);
    }
    t.textContent = msg;
    requestAnimationFrame(() => { t.style.opacity = '1'; t.style.transform = 'translateY(0)'; });
    setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateY(10px)'; }, 2800);
}

function escHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
