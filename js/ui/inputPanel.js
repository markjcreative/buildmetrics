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
let _isImperial = false;

function initInputPanel() {
    // Material selector
    document.querySelectorAll('.material-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.material-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const mat = btn.dataset.material;
            if (mat !== 'custom') {
                document.getElementById('inp-E').value = MATERIAL_PRESETS[mat].E;
            }
            document.getElementById('inp-E').readOnly = (mat !== 'custom');
        });
    });

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
    row.innerHTML = `
    <select class="inp-support-type" onchange="updateBeamPreview()">
      ${Object.keys(SUPPORT_TYPES).map(k =>
        `<option value="${k}" ${type === k ? 'selected' : ''}>${SUPPORT_TYPES[k].label}</option>`
    ).join('')}
    </select>
    <label class="field-label">Position</label>
    <input type="number" class="inp-support-pos inp-num" value="${defaultPos}" min="0" step="0.1" onchange="updateBeamPreview()" />
    <span class="unit-label length-unit">m</span>
    <button class="btn-remove" onclick="removeRow('${id}')">✕</button>
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
      <select class="inp-load-category">
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
        const unit = (type === 'udl' || type === 'partial_udl' || type === 'triangular') ? dUnit : (type === 'moment' ? 'kNm' : fUnit);
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
    container.innerHTML = html;
}

function onLoadTypeChange(id) {
    const row = document.getElementById(id);
    const type = row.querySelector('.inp-load-type').value;
    const span = parseFloat(document.getElementById('inp-span').value) || 5;
    renderLoadFields(id, type, { position: span / 2, magnitude: 10, start: 0, end: span, magnitudeStart: 5, magnitudeEnd: 10 });
}

function removeRow(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
    updateBeamPreview();
}

function getBeamConfig() {
    const span = parseFloat(document.getElementById('inp-span').value);
    const matBtn = document.querySelector('.material-btn.active');
    const material = matBtn ? matBtn.dataset.material : 'steel';
    const E = parseFloat(document.getElementById('inp-E').value);
    const I = parseFloat(document.getElementById('inp-I').value);
    const A = parseFloat(document.getElementById('inp-A').value);

    // Supports
    const supports = [];
    document.querySelectorAll('.support-row').forEach(row => {
        const type = row.querySelector('.inp-support-type').value;
        const position = parseFloat(row.querySelector('.inp-support-pos').value);
        if (!isNaN(position)) supports.push({ type, position });
    });

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

        loads.push(load);
    });

    // Solver always works in SI — convert back if Imperial mode is active
    if (_isImperial) {
        const U = BeamUtils.TO_IMPERIAL;
        const toSI = v => v; // identity — we divide by factor
        const si = (v, factor) => v / factor;
        const siSpan = si(span, U.length);
        return {
            span: siSpan,
            material,
            E: si(E, U.modulus),
            I: si(I, U.inertia),
            A: si(A, U.area),
            supports: supports.map(s => ({ ...s, position: si(s.position, U.length) })),
            loads: loads.map(l => {
                const out = { ...l };
                if (out.position !== undefined) out.position = si(out.position, U.length);
                if (out.start !== undefined) out.start = si(out.start, U.length);
                if (out.end !== undefined) out.end = si(out.end, U.length);
                if (out.magnitude !== undefined) {
                    const isDistributed = ['udl', 'partial_udl', 'triangular'].includes(out.type);
                    out.magnitude = isDistributed ? si(out.magnitude, U.distLoad) : si(out.magnitude, U.force);
                }
                if (out.magnitudeStart !== undefined) out.magnitudeStart = si(out.magnitudeStart, U.distLoad);
                if (out.magnitudeEnd !== undefined) out.magnitudeEnd = si(out.magnitudeEnd, U.distLoad);
                return out;
            })
        };
    }

    return { span, material, E, I, A, supports, loads };
}

function validateConfig(config) {
    if (!config.span || config.span <= 0 || isNaN(config.span)) {
        throw new Error('Span must be a positive number.');
    }
    if (!config.E || config.E <= 0 || isNaN(config.E)) {
        throw new Error("Young's modulus must be a positive number.");
    }
    if (!config.I || config.I <= 0 || isNaN(config.I)) {
        throw new Error('Second moment of area must be a positive number.');
    }
    const positions = config.supports.map(s => s.position);
    for (const s of config.supports) {
        if (s.position < 0 || s.position > config.span) {
            throw new Error(`Support at ${s.position} m is outside the beam span (0 – ${config.span} m).`);
        }
    }
    if (new Set(positions).size !== positions.length) {
        throw new Error('Two supports cannot share the same position.');
    }
    for (const l of config.loads) {
        if (l.start !== undefined && l.end !== undefined && l.start >= l.end) {
            throw new Error('Load end position must be greater than start position.');
        }
        if (l.position !== undefined && (l.position < 0 || l.position > config.span)) {
            throw new Error(`Load at ${l.position} m is outside the beam span.`);
        }
        if (l.start !== undefined && (l.start < 0 || l.start > config.span)) {
            throw new Error(`Load start at ${l.start} m is outside the beam span.`);
        }
        if (l.end !== undefined && (l.end < 0 || l.end > config.span)) {
            throw new Error(`Load end at ${l.end} m is outside the beam span.`);
        }
    }
}

function runCalculation() {
    const config = getBeamConfig();
    // Clear any previous error highlight
    document.querySelectorAll('.inp-error').forEach(el => el.classList.remove('inp-error'));
    try {
        validateConfig(config);
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
    addSupportRow('pin', 0);
    addSupportRow('roller', null);
    addLoadRow('point', { position: 2.5, magnitude: 10 });
    updateBeamPreview();
}

function onUnitToggle() {
    const nowImperial = document.getElementById('unit-toggle').checked;
    const toImperial = nowImperial && !_isImperial;
    const toSI = !nowImperial && _isImperial;
    _isImperial = nowImperial;

    const U = BeamUtils.TO_IMPERIAL;

    function convertField(selector, factor) {
        document.querySelectorAll(selector).forEach(el => {
            const v = parseFloat(el.value);
            if (!isNaN(v)) el.value = BeamUtils.round(toImperial ? v * factor : v / factor, 4);
        });
    }

    if (toImperial || toSI) {
        // Length fields: span, support positions, load positions/extents
        convertField('#inp-span', U.length);
        convertField('.inp-support-pos', U.length);
        convertField('.inp-load-pos', U.length);
        convertField('.inp-load-start', U.length);
        convertField('.inp-load-end', U.length);
        // Force/magnitude fields
        convertField('.inp-load-mag', U.force);
        convertField('.inp-load-mag-start', U.distLoad);
        convertField('.inp-load-mag-end', U.distLoad);
        // Material properties (E: modulus, I and A we leave as-is — advanced users)
        convertField('#inp-E', U.modulus);
        convertField('#inp-I', U.inertia);
        convertField('#inp-A', U.area);
    }

    // Update all unit labels
    const sys = _isImperial ? BeamUtils.UNITS.IMPERIAL : BeamUtils.UNITS.SI;
    document.querySelectorAll('.unit-label.length-unit').forEach(el => el.textContent = sys.length);
    document.querySelectorAll('.unit-label.force-unit').forEach(el => el.textContent = sys.force);
    document.querySelectorAll('.unit-label.moment-unit').forEach(el => el.textContent = sys.moment);
    document.querySelectorAll('.unit-label.dist-load-unit').forEach(el => el.textContent = sys.distLoad);

    updateBeamPreview();
}

function updateBeamPreview() {
    if (typeof BeamDiagrams !== 'undefined') {
        BeamDiagrams.renderPreview(getBeamConfig());
    }
}

window.InputPanel = { initInputPanel, getBeamConfig, runCalculation, updateBeamPreview, isImperial: () => _isImperial };
window.onLoadTypeChange = onLoadTypeChange;
window.removeRow = removeRow;
window.addSupportRow = addSupportRow;
window.addLoadRow = addLoadRow;
