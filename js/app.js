/**
 * app.js — Application bootstrap, auth, project context, save/restore logic
 */

document.addEventListener('DOMContentLoaded', async () => {
    // ── Auth Guard ──────────────────────────────────────────────────────
    if (!Auth.guard()) return;

    const user = Auth.currentUser();

    // ── Project Context ─────────────────────────────────────────────────
    // (nav-project-badge removed in topNav redesign — project shown in save modal)

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
            showToast('PDF generation failed: ' + e.message, 'error');
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
            // Re-open save modal now that we have a project
            openSaveCalcModal();
        } catch (e) {
            showToast(e.message || 'Could not create project.', 'error');
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
        if (wb) { wb.style.opacity = '1'; wb.style.transform = 'translateY(0)'; }
    }, 200);

    // ── Escape key closes any open modal ────────────────────────────────
    document.addEventListener('keydown', e => {
        if (e.key !== 'Escape') return;
        document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
    });

    // ── Freehand Sketchpad (Fabric.js) ───────────────────────────────────
    initSketchpad();
});

let sketchCanvas = null;

function initSketchpad() {
    if (typeof fabric === 'undefined') return;

    sketchCanvas = new fabric.Canvas('sketch-canvas', {
        isDrawingMode: true
    });

    // Default brush styling
    sketchCanvas.freeDrawingBrush.color = '#1E293B';
    sketchCanvas.freeDrawingBrush.width = 3;

    // Tools
    document.getElementById('btn-sketch-pen').addEventListener('click', () => {
        sketchCanvas.isDrawingMode = true;
        sketchCanvas.freeDrawingBrush.color = '#1E293B';
        sketchCanvas.freeDrawingBrush.width = 3;
    });

    document.getElementById('btn-sketch-erase').addEventListener('click', () => {
        // Eraser in fabric can be tricky without an extension, 
        // A simple approach is to use a white brush, or allow selecting and deleting path objects.
        // We will make the brush act as an eraser by making it white and thick.
        sketchCanvas.isDrawingMode = true;
        sketchCanvas.freeDrawingBrush.color = '#fafafa'; // background color
        sketchCanvas.freeDrawingBrush.width = 20;
    });

    document.getElementById('btn-sketch-clear').addEventListener('click', () => {
        if (confirm('Clear the entire sketchpad?')) {
            sketchCanvas.clear();
        }
    });
}

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
    document.getElementById('proj-picker-modal').classList.remove('open');
    openSaveCalcModal();
};

function doSaveCalc() {
    const name = document.getElementById('save-calc-name').value.trim() || 'Untitled Calculation';
    const proj = Projects.getActive();
    if (!proj) { showToast('Please select a project first.', 'error'); return; }
    if (!window._lastResults || !window._lastConfig) { showToast('No calculation to save yet.', 'error'); return; }

    try {
        History.save(proj.id, name, window._lastConfig, window._lastResults, window._lastResults.summary);
        document.getElementById('save-modal').classList.remove('open');
        // Store for confirmation modal downloads
        window._savedCalcName = name;
        window._savedProjName = proj.name;
        openSaveConfirmModal(name, proj.name);
    } catch (e) {
        showToast('Save failed: ' + e.message, 'error');
    }
}

/* ── Save Confirmation Modal ────────────────────────────────── */
function openSaveConfirmModal(calcName, projName) {
    const modal = document.getElementById('save-confirm-modal');
    if (!modal) return;
    document.getElementById('sc-calc-name').textContent = calcName;
    document.getElementById('sc-proj-name').textContent = projName;
    modal.classList.add('open');
}

function _trackDownload() {
    const n = parseInt(localStorage.getItem('bcp_dl_count') || '0') + 1;
    localStorage.setItem('bcp_dl_count', n);
}

window._downloadReportPDF = async function() {
    const projectInfo = await PDFReport.showProjectInfoModal();
    if (!projectInfo) return;
    const btn = document.getElementById('sc-btn-pdf');
    const orig = btn.innerHTML;
    btn.innerHTML = '⏳ Generating…';
    btn.disabled = true;
    try {
        await PDFReport.exportPDF(window._lastResults, window._lastConfig, projectInfo);
        _trackDownload();
    } catch (e) {
        showToast('PDF generation failed: ' + e.message, 'error');
    }
    btn.innerHTML = orig;
    btn.disabled = false;
};

window._downloadReportWord = async function() {
    if (typeof WordExport === 'undefined') {
        showToast('Word export is loading, please try again.', 'error');
        return;
    }
    const btn = document.getElementById('sc-btn-word');
    const orig = btn.innerHTML;
    btn.innerHTML = '⏳ Generating…';
    btn.disabled = true;
    try {
        const data = _buildWordData(window._savedCalcName, window._savedProjName);
        await WordExport.exportBeam(data, (window._savedCalcName || 'calculation').toLowerCase().replace(/\s+/g, '-') + '.docx');
        _trackDownload();
    } catch (e) {
        showToast('Word export failed: ' + e.message, 'error');
    }
    btn.innerHTML = orig;
    btn.disabled = false;
};

function _buildWordData(calcName, projectName) {
    const res = window._lastResults;
    const cfg = window._lastConfig;
    const user = Auth.currentUser();
    const s = res.summary || {};
    const span = cfg.span || 0;
    const maxDeflMm = Math.abs((s.maxDeflection || 0) * 1000);
    const L300 = (span / 300) * 1000;
    const L360 = (span / 360) * 1000;
    const spanRatio = s.maxDeflection && Math.abs(s.maxDeflection) > 1e-9
        ? Math.round(span / Math.abs(s.maxDeflection)) : '∞';

    const inputs = [
        { label: 'Span', value: span, unit: 'm' },
        { label: "Young's Modulus (E)", value: cfg.E, unit: 'kN/m²' },
        { label: 'Moment of Inertia (I)', value: cfg.I, unit: 'm⁴' },
        { label: 'Cross-Section Area (A)', value: cfg.A, unit: 'm²' },
        { label: 'Material', value: cfg.material || '', unit: '' },
        { label: 'Section', value: cfg.sectionName || '', unit: '' },
        { label: 'Design Standard', value: (cfg.standard || '').replace(/_/g, ' '), unit: '' },
        ...(cfg.loads || []).map((l, i) => ({
            label: `Load ${i + 1} (${l.type})`,
            value: l.type === 'point' ? `${l.P} kN @ x=${l.a}m` :
                   l.type === 'udl'   ? `${l.w} kN/m from ${l.a}m to ${l.b}m` :
                   l.type === 'moment'? `${l.M} kNm @ x=${l.a}m` : JSON.stringify(l),
            unit: ''
        })),
    ];

    const results = [
        { label: 'Max Bending Moment (+)', value: (s.maxPositiveMoment || 0).toFixed(3), unit: 'kNm' },
        { label: 'Max Bending Moment (−)', value: (s.maxNegativeMoment || 0).toFixed(3), unit: 'kNm' },
        { label: 'Max Absolute Moment', value: (s.maxAbsMoment || 0).toFixed(3), unit: 'kNm' },
        { label: 'Max Shear Force (+)', value: (s.maxShear || 0).toFixed(3), unit: 'kN' },
        { label: 'Max Shear Force (−)', value: (s.minShear || 0).toFixed(3), unit: 'kN' },
        { label: 'Max Absolute Shear', value: (s.maxAbsShear || 0).toFixed(3), unit: 'kN' },
        { label: 'Max Deflection', value: maxDeflMm.toFixed(3), unit: 'mm' },
        { label: 'Span/Deflection Ratio', value: `L / ${spanRatio}`, unit: '' },
        { label: 'L/300 Deflection Limit', value: L300.toFixed(2), unit: 'mm', pass: maxDeflMm <= L300 },
        { label: 'L/360 Deflection Limit', value: L360.toFixed(2), unit: 'mm', pass: maxDeflMm <= L360 },
    ];
    if (res.reactions) {
        res.reactions.forEach((r, i) => {
            results.push({ label: `Reaction R${i + 1}`, value: (r.Fy || 0).toFixed(3), unit: 'kN' });
        });
    }

    return {
        projectName: projectName || '',
        calcName: calcName || 'Beam Analysis',
        date: new Date().toLocaleDateString('en-GB'),
        standard: (cfg.standard || '').replace(/_/g, ' '),
        engineer: user ? (user.name || user.email || '') : '',
        company: user ? (user.company || '') : '',
        inputs,
        results,
        summary: `Max Moment: ${(s.maxAbsMoment||0).toFixed(3)} kNm  |  Max Shear: ${(s.maxAbsShear||0).toFixed(3)} kN  |  Max Deflection: ${maxDeflMm.toFixed(3)} mm (L/${spanRatio})`,
    };
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
            const tabs = document.getElementById('results-tabs');
            if (tabs) tabs.classList.add('visible');
        } catch { }
    }, 300);
}

/* ── Helpers ─────────────────────────────────────────────────── */
function showToast(msg, type = 'default') {
    const icons = { default: 'ℹ', success: '✓', error: '⚠' };
    const t = document.createElement('div');
    t.className = `bm-toast bm-toast--${type}`;
    t.innerHTML = `<span class="bm-toast-icon">${icons[type] || icons.default}</span>${escHtml(msg)}`;
    document.body.appendChild(t);
    requestAnimationFrame(() => { requestAnimationFrame(() => { t.classList.add('show'); }); });
    setTimeout(() => {
        t.classList.remove('show');
        setTimeout(() => t.remove(), 250);
    }, 3000);
}

function escHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
