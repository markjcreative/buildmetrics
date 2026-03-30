/**
 * inputPanel.js — Input form logic
 * Manages beam properties, support configuration, and load inputs.
 */

const MATERIAL_PRESETS = {
    steel: { name: 'Steel', E: 210000000, color: '#4A90E2' },         // kN/m²
    timber: { name: 'Timber', E: 12000000, color: '#8B6914' },
    concrete: { name: 'Concrete', E: 30000000, color: '#9E9E9E' },
    custom: { name: 'Custom', E: 200000000, color: '#A855F7' }
};

const LOAD_TYPES = {
    point: { label: 'Point Load', icon: '⬇', fields: ['position', 'magnitude'] },
    udl: { label: 'Uniform Load (UDL)', icon: '▬', fields: ['start', 'end', 'magnitude'] },
    partial_udl: { label: 'Partial UDL', icon: '▭', fields: ['start', 'end', 'magnitude'] },
    triangular: { label: 'Triangular Load', icon: '◤', fields: ['start', 'end', 'magnitude'] },
    trapezoidal: { label: 'Trapezoidal Load', icon: '⬡', fields: ['start', 'end', 'magnitudeStart', 'magnitudeEnd'] },
    moment: { label: 'Applied Moment', icon: '↻', fields: ['position', 'magnitude'] }
};

const SUPPORT_TYPES = {
    pin: { label: 'Pin', symbol: '△' },
    roller: { label: 'Roller', symbol: '○' },
    fixed: { label: 'Fixed', symbol: '▬' }
};

let loadCounter = 0;
let supportCounter = 0;

function initInputPanel() {
    // Material selector
    document.querySelectorAll('.material-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.material-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const mat = btn.dataset.material;

            // Show/hide specific inputs
            document.getElementById('custom-dims-group').style.display = (mat === 'timber' || mat === 'concrete') ? 'block' : 'none';
            document.getElementById('steel-section-group').style.display = (mat === 'steel') ? 'block' : 'none';

            if (mat !== 'custom') {
                document.getElementById('inp-E').value = MATERIAL_PRESETS[mat].E;
            }
            document.getElementById('inp-E').readOnly = (mat !== 'custom');

            // Trigger recalculation of dimensions if timber/concrete
            if (mat === 'timber' || mat === 'concrete') {
                updateCustomDimensions();
            } else if (mat === 'steel') {
                updateSteelSection();
            }
        });
    });

    // Custom dimensions listener
    document.getElementById('inp-b').addEventListener('input', updateCustomDimensions);
    document.getElementById('inp-d').addEventListener('input', updateCustomDimensions);

    // Steel section listener
    document.getElementById('inp-steel-sec').addEventListener('change', updateSteelSection);

    // Add support button
    document.getElementById('btn-add-support').addEventListener('click', addSupportRow);

    // Add load button
    document.getElementById('btn-add-load').addEventListener('click', () => addLoadRow());

    // Calculate button
    document.getElementById('btn-calculate').addEventListener('click', runCalculation);

    // Reset button
    document.getElementById('btn-reset').addEventListener('click', resetAll);

    // Unit toggle
    document.getElementById('unit-toggle').addEventListener('change', onUnitToggle);

    // Span input live update
    document.getElementById('inp-span').addEventListener('input', updateBeamPreview);

    // Initialize with default setup (simply supported beam)
    addSupportRow('pin', 0);
    addSupportRow('roller', null); // null = will use span
    addLoadRow('point', { position: null, magnitude: 10 }); // default 10kN centre load

    // Init material display
    updateSteelSection(); // We start with Steel active
    updateBeamPreview();
}

function updateCustomDimensions() {
    const b_mm = parseFloat(document.getElementById('inp-b').value) || 200;
    const d_mm = parseFloat(document.getElementById('inp-d').value) || 400;

    // Convert to meters
    const b = b_mm / 1000;
    const d = d_mm / 1000;

    // Calculate A and I
    const A = b * d;
    const I = (b * Math.pow(d, 3)) / 12;

    document.getElementById('inp-A').value = BeamUtils.round(A, 6);
    document.getElementById('inp-I').value = BeamUtils.round(I, 8);
    updateBeamPreview();
}

// Simple lookup for UB properties (Area in m2, I in m4)
const UB_PROPS = {
    '203x133x25': { A: 0.00323, I: 0.0000234 },
    '203x133x30': { A: 0.00382, I: 0.0000289 },
    '254x102x22': { A: 0.00280, I: 0.0000284 },
    '254x102x28': { A: 0.00362, I: 0.0000400 },
    '254x146x31': { A: 0.00397, I: 0.0000441 },
    '254x146x37': { A: 0.00474, I: 0.0000553 },
    '305x102x25': { A: 0.00316, I: 0.0000445 },
    '305x102x33': { A: 0.00416, I: 0.0000650 },
    '305x165x40': { A: 0.00513, I: 0.0000850 },
    '305x165x46': { A: 0.00588, I: 0.0000990 },
    '356x127x33': { A: 0.00418, I: 0.0000823 },
    '356x127x39': { A: 0.00497, I: 0.0001017 },
    '356x171x45': { A: 0.00573, I: 0.0001210 },
    '356x171x51': { A: 0.00646, I: 0.0001410 }
};

function updateSteelSection() {
    const sec = document.getElementById('inp-steel-sec').value;
    if (sec === 'custom') return;

    const props = UB_PROPS[sec];
    if (props) {
        document.getElementById('inp-A').value = props.A;
        document.getElementById('inp-I').value = props.I;
        updateBeamPreview();
    }
}

function applyStructuralSystem() {
    const sys = document.getElementById('inp-system').value;
    const span = parseFloat(document.getElementById('inp-span').value) || 5;

    // Clear existing supports
    document.getElementById('support-list').innerHTML = '';
    supportCounter = 0;

    // Hide custom add button unless custom is selected
    document.getElementById('btn-add-support').style.display = (sys === 'custom') ? 'block' : 'none';

    switch (sys) {
        case 'single_pin':
            addSupportRow('pin', 0);
            addSupportRow('roller', span);
            break;
        case 'single_fix':
            addSupportRow('fixed', 0);
            addSupportRow('fixed', span);
            break;
        case 'cantilever':
            addSupportRow('fixed', 0);
            break;
        case 'two_span':
            addSupportRow('pin', 0);
            addSupportRow('roller', span / 2);
            addSupportRow('roller', span);
            break;
        case 'three_span':
            addSupportRow('pin', 0);
            addSupportRow('roller', span / 3);
            addSupportRow('roller', (span / 3) * 2);
            addSupportRow('roller', span);
            break;
        case 'multi_span':
            // Simple default of 4 spans
            addSupportRow('pin', 0);
            addSupportRow('roller', span * 0.25);
            addSupportRow('roller', span * 0.5);
            addSupportRow('roller', span * 0.75);
            addSupportRow('roller', span);
            break;
        case 'overhang_one':
            addSupportRow('pin', 0);
            addSupportRow('roller', span * 0.75);
            break;
        case 'overhang_two':
            addSupportRow('pin', span * 0.25);
            addSupportRow('roller', span * 0.75);
            break;
        case 'custom':
            addSupportRow('pin', 0);
            addSupportRow('roller', span);
            break;
    }
    updateBeamPreview();
}

function addSupportRow(type = 'pin', position = 0) {
    const id = `support-${++supportCounter}`;
    const list = document.getElementById('support-list');
    const span = parseFloat(document.getElementById('inp-span').value) || 5;
    const defaultPos = (position === null) ? span : position;

    const row = document.createElement('div');
    row.className = 'input-row support-row';
    row.id = id;

    // Disable inputs if not 'custom'
    const sys = document.getElementById('inp-system') ? document.getElementById('inp-system').value : 'custom';
    const isLocked = (sys !== 'custom');
    const disabledAttr = isLocked ? 'disabled' : '';

    row.innerHTML = `
    <select class="inp-support-type" onchange="updateBeamPreview()" ${disabledAttr}>
      ${Object.keys(SUPPORT_TYPES).map(k =>
        `<option value="${k}" ${type === k ? 'selected' : ''}>${SUPPORT_TYPES[k].label}</option>`
    ).join('')}
    </select>
    <label class="field-label">Position</label>
    <input type="number" class="inp-support-pos inp-num" value="${defaultPos}" min="0" step="0.1" onchange="updateBeamPreview()" ${isLocked ? 'readonly tabindex="-1"' : ''} />
    <span class="unit-label length-unit">m</span>
    ${isLocked ? '<div style="width:24px;"></div>' : `<button class="btn-remove" onclick="removeRow('${id}')">✕</button>`}
  `;
    list.appendChild(row);
    updateBeamPreview();
}

function addLoadRow(type = 'point', defaults = {}) {
    const id = `load-${++loadCounter}`;
    const list = document.getElementById('load-list');
    const span = parseFloat(document.getElementById('inp-span').value) || 5;
    const midSpan = BeamUtils.round(span / 2, 2);

    const row = document.createElement('div');
    row.className = 'input-row load-row';
    row.id = id;
    row.innerHTML = `
    <div class="load-row-header">
      <select class="inp-load-type" onchange="onLoadTypeChange('${id}')">
        ${Object.keys(LOAD_TYPES).map(k =>
        `<option value="${k}" ${type === k ? 'selected' : ''}>${LOAD_TYPES[k].icon} ${LOAD_TYPES[k].label}</option>`
    ).join('')}
      </select>
      <select class="inp-load-category" onchange="checkWindEnvironment()">
        <option value="dead">Dead</option>
        <option value="live">Live</option>
        <option value="wind">Wind</option>
        <option value="snow">Snow</option>
      </select>
      <button class="btn-remove" onclick="removeRow('${id}')">✕</button>
    </div>
    <div class="load-fields" id="fields-${id}"></div>
  `;
    list.appendChild(row);
    renderLoadFields(id, type, { position: defaults.position ?? midSpan, magnitude: defaults.magnitude ?? 10, start: 0, end: span, magnitudeStart: 5, magnitudeEnd: 10 });
    checkWindEnvironment();
}

function checkWindEnvironment() {
    let hasWind = false;
    document.querySelectorAll('.inp-load-category').forEach(el => {
        if (el.value === 'wind') hasWind = true;
    });

    const windGroup = document.getElementById('wind-env-group');
    if (windGroup) {
        windGroup.style.display = hasWind ? 'block' : 'none';

        // Update unit labels for wind loads to kN/m²?
        // Actually, typically the load applied to the 1D beam directly is kN/m,
        // but the plan says "Change Wind Load magnitude to kN/m² (pressure)"
        // For a 1D beam calculator, pressure needs a tributary width. We'll add this feature now.
    }
}

function renderLoadFields(id, type, defaults) {
    const container = document.getElementById(`fields-${id}`);
    const fields = LOAD_TYPES[type].fields;
    const isImperial = document.getElementById('unit-toggle')?.checked;
    const lUnit = isImperial ? 'ft' : 'm';
    const fUnit = isImperial ? 'kips' : 'kN';
    const dUnit = isImperial ? 'kips/ft' : 'kN/m';

    let html = '<div class="load-fields-grid">';
    if (fields.includes('position')) {
        html += `<label>Position <span class="unit-label">(${lUnit})</span></label>
             <input type="number" class="inp-num inp-load-pos" value="${defaults.position}" min="0" step="0.1" />`;
    }
    if (fields.includes('start')) {
        html += `<label>Start <span class="unit-label">(${lUnit})</span></label>
             <input type="number" class="inp-num inp-load-start" value="${defaults.start}" min="0" step="0.1" />`;
    }
    if (fields.includes('end')) {
        html += `<label>End <span class="unit-label">(${lUnit})</span></label>
             <input type="number" class="inp-num inp-load-end" value="${defaults.end}" min="0" step="0.1" />`;
    }
    if (fields.includes('magnitude')) {
        const isWind = document.querySelector(`#${id} .inp-load-category`)?.value === 'wind';
        let unit = (type === 'udl' || type === 'partial_udl' || type === 'triangular') ? dUnit : (type === 'moment' ? 'kNm' : fUnit);
        if (isWind) unit = isImperial ? 'psf' : 'kN/m²';

        html += `<label>Magnitude <span class="unit-label">(${unit})</span></label>
             <input type="number" class="inp-num inp-load-mag" value="${defaults.magnitude}" step="0.1" />`;
    }
    if (fields.includes('magnitudeStart')) {
        html += `<label>Start Intensity <span class="unit-label">(${dUnit})</span></label>
             <input type="number" class="inp-num inp-load-mag-start" value="${defaults.magnitudeStart}" step="0.1" />`;
    }
    if (fields.includes('magnitudeEnd')) {
        html += `<label>End Intensity <span class="unit-label">(${dUnit})</span></label>
             <input type="number" class="inp-num inp-load-mag-end" value="${defaults.magnitudeEnd}" step="0.1" />`;
    }
    html += '</div>';

    // If wind pressure, add Trib Width
    const isWind = document.querySelector(`#${id} .inp-load-category`)?.value === 'wind';
    if (isWind && (type === 'udl' || type === 'partial_udl' || type === 'triangular')) {
        html += `<div style="margin-top:8px; display:flex; gap:8px; align-items:center;">
             <label style="font-size:0.75rem;">Trib Width (${lUnit})</label>
             <input type="number" class="inp-num inp-load-trib" value="1.0" step="0.1" style="width:60px;" />
         </div>`;
    }

    container.innerHTML = html;
}

function onLoadTypeChange(id) {
    const row = document.getElementById(id);
    const type = row.querySelector('.inp-load-type').value;
    const span = parseFloat(document.getElementById('inp-span').value) || 5;
    renderLoadFields(id, type, { position: span / 2, magnitude: 10, start: 0, end: span, magnitudeStart: 5, magnitudeEnd: 10 });
    checkWindEnvironment();
}

function removeRow(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
    checkWindEnvironment();
    updateBeamPreview();
}

function getBeamConfig() {
    const span = parseFloat(document.getElementById('inp-span').value);
    const standard = document.getElementById('inp-standard') ? document.getElementById('inp-standard').value : 'eurocode_bs';

    const matBtn = document.querySelector('.material-btn.active');
    const material = matBtn ? matBtn.dataset.material : 'steel';
    const E = parseFloat(document.getElementById('inp-E').value);
    const I = parseFloat(document.getElementById('inp-I').value);
    const A = parseFloat(document.getElementById('inp-A').value);

    let sectionName = 'Custom';
    let isLatRestrained = true;

    if (material === 'steel') {
        const sel = document.getElementById('inp-steel-sec');
        if (sel) sectionName = sel.options[sel.selectedIndex].text;

        const ltbSel = document.getElementById('inp-ltb');
        if (ltbSel) isLatRestrained = ltbSel.value === 'restrained';

    } else if (material === 'timber' || material === 'concrete') {
        const b = document.getElementById('inp-b') ? document.getElementById('inp-b').value : 200;
        const d = document.getElementById('inp-d') ? document.getElementById('inp-d').value : 400;
        sectionName = `${b}x${d}mm`;
    }

    // Supports
    const supports = [];
    document.querySelectorAll('.support-row').forEach(row => {
        const type = row.querySelector('.inp-support-type').value;
        const position = parseFloat(row.querySelector('.inp-support-pos').value);
        if (!isNaN(position)) supports.push({ type, position });
    });

    // Wind Environment Data
    const windEnv = {
        location: document.getElementById('inp-wind-location') ? document.getElementById('inp-wind-location').value : '',
        elevation: document.getElementById('inp-wind-elev') ? parseFloat(document.getElementById('inp-wind-elev').value) : null,
        distToSea: document.getElementById('inp-wind-dist') ? parseFloat(document.getElementById('inp-wind-dist').value) : null
    };

    // Loads
    const loads = [];
    document.querySelectorAll('.load-row').forEach(row => {
        const type = row.querySelector('.inp-load-type').value;
        const category = row.querySelector('.inp-load-category').value;
        const load = { type, category };

        const posEl = row.querySelector('.inp-load-pos');
        const magEl = row.querySelector('.inp-load-mag');
        const startEl = row.querySelector('.inp-load-start');
        const endEl = row.querySelector('.inp-load-end');
        const magStartEl = row.querySelector('.inp-load-mag-start');
        const magEndEl = row.querySelector('.inp-load-mag-end');

        if (posEl) load.position = parseFloat(posEl.value);
        if (magEl) load.magnitude = parseFloat(magEl.value);
        if (startEl) load.start = parseFloat(startEl.value);
        if (endEl) load.end = parseFloat(endEl.value);
        if (magStartEl) load.magnitudeStart = parseFloat(magStartEl.value);
        if (magEndEl) load.magnitudeEnd = parseFloat(magEndEl.value);

        // Adjust distributed loads if Wind category with Trib Width
        const tribEl = row.querySelector('.inp-load-trib');
        if (category === 'wind' && tribEl) {
            const tribWidth = parseFloat(tribEl.value) || 1.0;
            if (load.magnitude != null) load.magnitude *= tribWidth;
            if (load.magnitudeStart != null) load.magnitudeStart *= tribWidth;
            if (load.magnitudeEnd != null) load.magnitudeEnd *= tribWidth;
        }

        loads.push(load);
    });

    return { span, standard, material, sectionName, isLatRestrained, E, I, A, supports, loads, windEnv };
}

function runCalculation() {
    const config = getBeamConfig();
    try {
        // Store point loads for the solver's shear builder
        window._beamSolverPointLoads = config.loads.filter(l => l.type === 'point');

        const results = BeamSolver.solveBeam(config);
        window._lastResults = results;
        window._lastConfig = config;

        BeamResults.renderResults(results, config);
        BeamDiagrams.renderAll(results, config);

        document.getElementById('results-section').classList.add('visible');
        document.getElementById('results-section').scrollIntoView({ behavior: 'smooth' });
        document.getElementById('btn-export-pdf').disabled = false;
        document.getElementById('btn-export-csv').disabled = false;
        const saveBtn = document.getElementById('btn-save-calc');
        if (saveBtn) saveBtn.disabled = false;
    } catch (err) {
        showError(err.message);
    }
}

function showError(msg) {
    const el = document.getElementById('calc-error');
    el.textContent = '⚠ ' + msg;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 5000);
}

function resetAll() {
    document.getElementById('support-list').innerHTML = '';
    document.getElementById('load-list').innerHTML = '';
    supportCounter = 0;
    loadCounter = 0;
    document.getElementById('inp-span').value = 5;
    document.getElementById('inp-E').value = 210000000;
    document.getElementById('inp-I').value = 0.0001;
    document.getElementById('inp-A').value = 0.01;
    document.getElementById('results-section').classList.remove('visible');

    document.getElementById('inp-system').value = 'single_pin';
    applyStructuralSystem();
    addLoadRow('point', { position: 2.5, magnitude: 10 });
    updateBeamPreview();
}

function onUnitToggle() {
    const isImperial = document.getElementById('unit-toggle').checked;
    document.querySelectorAll('.unit-label').forEach(el => {
        if (el.classList.contains('length-unit')) el.textContent = isImperial ? 'ft' : 'm';
        if (el.classList.contains('force-unit')) el.textContent = isImperial ? 'kips' : 'kN';
        if (el.classList.contains('moment-unit')) el.textContent = isImperial ? 'kip·ft' : 'kNm';
    });
}

function updateBeamPreview() {
    if (typeof BeamDiagrams !== 'undefined') {
        BeamDiagrams.renderPreview(getBeamConfig());
    }
}

function saveSession() {
    const config = getBeamConfig();
    // Migrate legacy key on write
    localStorage.removeItem('beamCalc_session');
    localStorage.setItem('bm_session', JSON.stringify(config));
    const btn = document.getElementById('btn-save');
    btn.textContent = '✓ Saved';
    setTimeout(() => { btn.textContent = '💾 Save'; }, 2000);
}

function loadSession() {
    // Migrate legacy key on first read
    const legacy = localStorage.getItem('beamCalc_session');
    if (legacy && !localStorage.getItem('bm_session')) {
        localStorage.setItem('bm_session', legacy);
        localStorage.removeItem('beamCalc_session');
    }
    const saved = localStorage.getItem('bm_session');
    if (!saved) { showToast('No saved session found.', 'error'); return; }
    const config = JSON.parse(saved);
    resetAll();
    document.getElementById('inp-span').value = config.span;
    document.getElementById('inp-E').value = config.E;
    document.getElementById('inp-I').value = config.I;
    document.getElementById('inp-A').value = config.A;
    document.getElementById('support-list').innerHTML = '';
    document.getElementById('load-list').innerHTML = '';
    supportCounter = 0;
    loadCounter = 0;
    config.supports.forEach(s => addSupportRow(s.type, s.position));
    config.loads.forEach(l => addLoadRow(l.type, l));
    updateBeamPreview();
}

window.InputPanel = { initInputPanel, getBeamConfig, runCalculation, updateBeamPreview };
window.onLoadTypeChange = onLoadTypeChange;
window.removeRow = removeRow;
window.addSupportRow = addSupportRow;
window.addLoadRow = addLoadRow;
window.applyStructuralSystem = applyStructuralSystem;
