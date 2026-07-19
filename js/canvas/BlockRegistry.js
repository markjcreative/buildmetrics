/**
 * BlockRegistry.js — Block type definitions and render functions for the
 * Engineering Canvas Report Builder.
 *
 * Exposes:
 *   BlockRegistry.ALL_BLOCKS   — array of block definitions
 *   BlockRegistry.render(block) — returns DOM element (edit mode)
 *   BlockRegistry.renderPreview(block) — returns HTML string (preview mode)
 *   BlockRegistry.getDefinition(type) — returns block def by type
 */

const BlockRegistry = (() => {

  // ── Block type definitions ─────────────────────────────────────────────
  const ALL_BLOCKS = [
    // Document
    { type: 'title',             label: 'Report Title',           icon: '📄', category: 'Document' },
    { type: 'section_header',    label: 'Section Header',         icon: '📑', category: 'Document' },
    { type: 'toc',               label: 'Table of Contents',      icon: '📋', category: 'Document' },
    { type: 'page_break',        label: 'Page Break',             icon: '⬛', category: 'Document' },
    // Project
    { type: 'project_info',      label: 'Project Information',    icon: '🏢', category: 'Project' },
    { type: 'design_basis',      label: 'Design Basis',           icon: '📐', category: 'Project' },
    { type: 'scope',             label: 'Scope of Works',         icon: '📝', category: 'Project' },
    // Content
    { type: 'text',              label: 'Text / Notes',           icon: '✏️',  category: 'Content' },
    { type: 'image',             label: 'Image / Drawing',        icon: '🖼',  category: 'Content' },
    { type: 'code_ref',          label: 'Code Reference',         icon: '📚', category: 'Content' },
    { type: 'load_table',        label: 'Load Combination Table', icon: '⚡', category: 'Content' },
    // Calculations
    { type: 'calc_beam',         label: 'Steel/Timber Beam',      icon: '🏗', category: 'Calculations', calcType: 'beam' },
    { type: 'calc_column',       label: 'Steel Column',           icon: '⚙',  category: 'Calculations', calcType: 'column' },
    { type: 'calc_rc_beam',      label: 'RC Beam Design',         icon: '🧱', category: 'Calculations', calcType: 'rc-beam' },
    { type: 'calc_rc_column',    label: 'RC Column Design',       icon: '🏛', category: 'Calculations', calcType: 'concrete-column' },
    { type: 'calc_slab',         label: 'RC Slab Design',         icon: '📐', category: 'Calculations', calcType: 'slab' },
    { type: 'calc_footing',      label: 'Pad Footing Design',     icon: '🏗', category: 'Calculations', calcType: 'footing' },
    { type: 'calc_retaining',    label: 'Retaining Wall',         icon: '🧱', category: 'Calculations', calcType: 'retaining-wall' },
    { type: 'calc_connection',   label: 'Connection Design',      icon: '🔩', category: 'Calculations', calcType: 'connection' },
    { type: 'calc_timber_col',   label: 'Timber Column',          icon: '🌲', category: 'Calculations', calcType: 'timber-column' },
    { type: 'calc_steel_member', label: 'Steel Member (EC3)',      icon: '🔧', category: 'Calculations', calcType: 'steel-member' },
    { type: 'calc_bbs',          label: 'Bar Bending Schedule',   icon: '📋', category: 'Calculations', calcType: 'bbs' },
    { type: 'calc_section',      label: 'Section Properties',     icon: '📐', category: 'Calculations', calcType: 'section-properties' },
    { type: 'calc_wind',         label: 'Wind Loading (EC1)',      icon: '🌬', category: 'Calculations', calcType: 'wind-loading' },
    { type: 'calc_load_takedown',label: 'Load Takedown',           icon: '⬇️',  category: 'Calculations', calcType: 'load-takedown' },
    { type: 'calc_hoarding',     label: 'Temp. Works Hoarding (TwF2012)', icon: '🚧', category: 'Calculations', calcType: 'hoarding' },
    // Results
    { type: 'checks_summary',    label: 'Design Checks Summary',  icon: '✅', category: 'Results' },
    { type: 'utilisation_chart', label: 'Utilisation Chart',      icon: '📊', category: 'Results' },
    // Workflow
    { type: 'signoff',           label: 'Engineer Sign-off',      icon: '🖊', category: 'Workflow' },
    { type: 'revision_history',  label: 'Revision History',       icon: '📅', category: 'Workflow' },
    { type: 'engineer_notes',    label: 'Engineer Notes',         icon: '💬', category: 'Workflow' },
  ];

  // ── Solver map ─────────────────────────────────────────────────────────
  const SOLVER_MAP = {
    // beamDesignSolver calls the bare global solveBeam() from solver.js, which
    // in turn calls BeamUtils from utils.js. Both must load, in this order,
    // before the beam solver runs — otherwise the very first beam calculation
    // on a fresh page throws.
    'calc_beam':         { src: '/js/engine/beamDesignSolver.js',   global: 'BeamDesignSolver',
                           deps: [{ src: '/js/engine/utils.js',  global: 'BeamUtils' },
                                  { src: '/js/engine/solver.js', global: 'BeamSolver' }] },
    'calc_column':       { src: '/js/engine/columnSolver.js',       global: 'ColumnSolver' },
    'calc_rc_beam':      { src: '/js/engine/rcBeamSolver.js',       global: 'RCBeamSolver' },
    'calc_rc_column':    { src: '/js/engine/concreteColumnSolver.js',global: 'ConcreteColumnSolver' },
    'calc_slab':         { src: '/js/engine/slabSolver.js',         global: 'SlabSolver' },
    'calc_footing':      { src: '/js/engine/footingSolver.js',      global: 'FootingSolver' },
    'calc_retaining':    { src: '/js/engine/retainingWallSolver.js',global: 'RetainingWallSolver' },
    'calc_connection':   { src: '/js/engine/connectionSolver.js',   global: 'ConnectionSolver' },
    'calc_timber_col':   { src: '/js/engine/timberColumnSolver.js', global: 'TimberColumnSolver' },
    'calc_steel_member': { src: '/js/engine/steelMemberSolver.js',  global: 'SteelMemberSolver' },
    'calc_bbs':          { src: '/js/engine/bbsSolver.js',          global: 'BBSSolver' },
    'calc_section':      { src: '/js/engine/sectionSolver.js',      global: 'SectionSolver' },
    'calc_wind':         { src: '/js/engine/windSolver.js',         global: 'WindSolver' },
    'calc_load_takedown':{ src: '/js/engine/loadTakedownSolver.js', global: 'LoadTakedownSolver' },
    'calc_hoarding':     { src: '/js/engine/hoardingSolver.js',     global: 'HoardingSolver' },
  };

  // ── Calc field definitions (inputs shown in edit mode) ─────────────────
  const CALC_FIELDS = {
    'calc_beam': [
      { key: 'material',  label: 'Material',        type: 'select', options: ['steel','timber'], default: 'steel' },
      { key: 'span',      label: 'Span (m)',         type: 'number', default: 5 },
      { key: 'Gk',        label: 'Gk — Perm. load (kN/m)', type: 'number', default: 5 },
      { key: 'Qk',        label: 'Qk — Var. load (kN/m)',  type: 'number', default: 3 },
      { key: 'grade',     label: 'Steel grade',     type: 'select', options: ['S235','S275','S355'], default: 'S275' },
      { key: 'Sxx',       label: 'Sxx (cm³)',       type: 'number', default: 258 },
      { key: 'Ixx',       label: 'Ixx (cm⁴)',       type: 'number', default: 2340 },
    ],
    'calc_column': [
      { key: 'section',   label: 'Section',         type: 'text',   default: '203x203x46 UC' },
      { key: 'grade',     label: 'Steel grade',     type: 'select', options: ['S275','S355'], default: 'S275' },
      { key: 'NEd',       label: 'NEd — Axial (kN)',type: 'number', default: 500 },
      { key: 'length',    label: 'Length (m)',       type: 'number', default: 3.5 },
      { key: 'keff',      label: 'Eff. length factor k', type: 'number', default: 1.0 },
      { key: 'A',         label: 'A (cm²)',          type: 'number', default: 58.8 },
      { key: 'Iyy',       label: 'Iyy (cm⁴)',       type: 'number', default: 1540 },
      { key: 'Ixx',       label: 'Ixx (cm⁴)',       type: 'number', default: 4570 },
    ],
    'calc_rc_beam': [
      { key: 'span',      label: 'Span (m)',         type: 'number', default: 6 },
      { key: 'b',         label: 'Width b (mm)',     type: 'number', default: 300 },
      { key: 'h',         label: 'Depth h (mm)',     type: 'number', default: 500 },
      { key: 'fck',       label: 'fck (MPa)',        type: 'number', default: 30 },
      { key: 'MEd',       label: 'MEd (kNm)',        type: 'number', default: 150 },
      { key: 'VEd',       label: 'VEd (kN)',         type: 'number', default: 80 },
    ],
    'calc_rc_column': [
      { key: 'b',         label: 'Width b (mm)',     type: 'number', default: 300 },
      { key: 'h',         label: 'Depth h (mm)',     type: 'number', default: 300 },
      { key: 'fck',       label: 'fck (MPa)',        type: 'number', default: 30 },
      { key: 'NEd',       label: 'NEd (kN)',         type: 'number', default: 800 },
      { key: 'MEd',       label: 'MEd (kNm)',        type: 'number', default: 60 },
      { key: 'lo',        label: 'Eff. length lo (m)', type: 'number', default: 3.0 },
    ],
    'calc_slab': [
      { key: 'lx',        label: 'Short span lx (m)',  type: 'number', default: 4 },
      { key: 'ly',        label: 'Long span ly (m)',   type: 'number', default: 5 },
      { key: 'h',         label: 'Slab depth h (mm)',  type: 'number', default: 175 },
      { key: 'fck',       label: 'fck (MPa)',          type: 'number', default: 30 },
      { key: 'n_uls',     label: 'ULS load n (kN/m²)', type: 'number', default: 14 },
    ],
    'calc_footing': [
      { key: 'Gk',        label: 'Gk (kN)',          type: 'number', default: 350 },
      { key: 'Qk',        label: 'Qk (kN)',          type: 'number', default: 150 },
      { key: 'soilBearing', label: 'Soil bearing (kPa)', type: 'number', default: 150 },
      { key: 'fck',       label: 'fck (MPa)',        type: 'number', default: 30 },
      { key: 'columnW',   label: 'Column width (mm)',type: 'number', default: 300 },
      { key: 'footThick', label: 'Footing depth (mm)',type: 'number', default: 500 },
    ],
    'calc_retaining': [
      { key: 'H',         label: 'Wall height H (m)',  type: 'number', default: 3 },
      { key: 'gamma_soil',label: 'Soil density (kN/m³)', type: 'number', default: 18 },
      { key: 'phi',       label: 'Friction angle φ (°)', type: 'number', default: 30 },
      { key: 'surcharge', label: 'Surcharge q (kPa)',   type: 'number', default: 5 },
      { key: 'fck',       label: 'fck (MPa)',           type: 'number', default: 30 },
    ],
    'calc_connection': [
      { key: 'connectionType', label: 'Connection type', type: 'select', options: ['bolted','welded'], default: 'bolted' },
      { key: 'VEd',       label: 'VEd (kN)',         type: 'number', default: 150 },
      { key: 'boltGrade', label: 'Bolt grade',       type: 'select', options: ['4.6','8.8','10.9'], default: '8.8' },
      { key: 'boltDia',   label: 'Bolt dia (mm)',    type: 'number', default: 20 },
      { key: 'nBolts',    label: 'No. of bolts',     type: 'number', default: 4 },
    ],
    'calc_timber_col': [
      { key: 'span',      label: 'Height (m)',        type: 'number', default: 3.0 },
      { key: 'b',         label: 'Width b (mm)',      type: 'number', default: 90 },
      { key: 'h',         label: 'Depth h (mm)',      type: 'number', default: 90 },
      { key: 'NEd',       label: 'NEd (kN)',          type: 'number', default: 50 },
      { key: 'timberClass',label: 'Timber class',    type: 'select', options: ['C16','C24','C27','GL24h'], default: 'C24' },
      { key: 'kDef',      label: 'kdef factor',      type: 'number', default: 0.8 },
    ],
    'calc_steel_member': [
      { key: 'section',   label: 'Section',           type: 'text',   default: '254x102x22 UB' },
      { key: 'grade',     label: 'Steel grade',       type: 'select', options: ['S275','S355'], default: 'S275' },
      { key: 'Lcr',       label: 'Buckling length (m)',type: 'number', default: 4.0 },
      { key: 'NEd',       label: 'NEd (kN)',           type: 'number', default: 0 },
      { key: 'MEd',       label: 'MEd (kNm)',          type: 'number', default: 80 },
      { key: 'VEd',       label: 'VEd (kN)',           type: 'number', default: 40 },
    ],
    'calc_bbs': [
      { key: 'element',   label: 'Element ref',       type: 'text',   default: 'Beam B1' },
      { key: 'length',    label: 'Element length (m)',type: 'number', default: 6 },
      { key: 'barDia',    label: 'Bar dia (mm)',       type: 'number', default: 16 },
      { key: 'nBars',     label: 'No. of bars',       type: 'number', default: 4 },
      { key: 'fyk',       label: 'fyk (MPa)',          type: 'number', default: 500 },
    ],
    'calc_section': [
      { key: 'sectionType', label: 'Section type',   type: 'select', options: ['rectangle','circle','I-section','T-section'], default: 'rectangle' },
      { key: 'b',         label: 'Width b (mm)',      type: 'number', default: 200 },
      { key: 'h',         label: 'Depth h (mm)',      type: 'number', default: 400 },
      { key: 'tf',        label: 'Flange thk tf (mm)',type: 'number', default: 12 },
      { key: 'tw',        label: 'Web thk tw (mm)',   type: 'number', default: 7 },
    ],
    'calc_wind': [
      { key: 'vb0',       label: 'Basic wind vel vb0 (m/s)', type: 'number', default: 23 },
      { key: 'h',         label: 'Building height h (m)', type: 'number', default: 10 },
      { key: 'b',         label: 'Width b (m)',       type: 'number', default: 15 },
      { key: 'terrainCat',label: 'Terrain category',  type: 'select', options: ['0','I','II','III','IV'], default: 'II' },
      { key: 'altitude',  label: 'Altitude (m)',      type: 'number', default: 50 },
    ],
    'calc_load_takedown': [
      { key: 'nFloors',   label: 'No. of floors',    type: 'number', default: 3 },
      { key: 'floorArea', label: 'Trib. area (m²)',  type: 'number', default: 20 },
      { key: 'DL',        label: 'Dead load DL (kPa)',type: 'number', default: 4 },
      { key: 'LL',        label: 'Live load LL (kPa)',type: 'number', default: 2.5 },
      { key: 'roofDL',    label: 'Roof DL (kPa)',    type: 'number', default: 3 },
      { key: 'roofLL',    label: 'Roof LL (kPa)',    type: 'number', default: 0.6 },
    ],
    'calc_hoarding': [
      { key: 'H',           label: 'Hoarding height H (m)',   type: 'number', default: 2.4 },
      { key: 'vb0',         label: 'Basic wind speed vb0 (m/s)', type: 'number', default: 23 },
      { key: 'altitude',    label: 'Altitude (m)',            type: 'number', default: 50 },
      { key: 'terrainCat',  label: 'Terrain (0 Sea–4 Urban)', type: 'select', options: ['0','1','2','3','4'], default: '1' },
      { key: 'returnPeriod',label: 'Return period (yr)',      type: 'select', options: ['1','5','50'], default: '50' },
      { key: 'phi',         label: 'Cladding solidity φ',     type: 'number', default: 1.0 },
      { key: 'Ln',          label: 'Normal bay Ln (m)',       type: 'number', default: 2.4 },
      { key: 'Lne',         label: 'Next-to-end bay Lne (m)', type: 'number', default: 1.8 },
      { key: 'Le',          label: 'End bay Le (m)',          type: 'number', default: 1.2 },
      { key: 'postSection', label: 'Post section b×h',        type: 'select', options: ['75x225','100x150','150x150','200x200'], default: '150x150' },
      { key: 'postGrade',   label: 'Post timber grade',       type: 'select', options: ['C16','C24','C32'], default: 'C24' },
      { key: 'railSection', label: 'Rail section b×h',        type: 'select', options: ['50x150','75x100','75x150','100x150','75x225'], default: '75x150' },
      { key: 'railGrade',   label: 'Rail timber grade',       type: 'select', options: ['C16','C24','C32'], default: 'C24' },
      { key: 'nRails',      label: 'No. of rails',            type: 'number', default: 3 },
      { key: 'fixType',     label: 'Fixing type',             type: 'select', options: ['bolt','nail'], default: 'bolt' },
      { key: 'boltD',       label: 'Bolt dia (mm)',           type: 'select', options: ['10','12','16','20'], default: '12' },
      { key: 'nFasteners',  label: 'Fasteners per connection',type: 'number', default: 2 },
      { key: 'plyT',        label: 'Plywood thickness (mm)',  type: 'select', options: ['12','18','22'], default: '18' },
      { key: 'plyGrade',    label: 'Plywood grade',           type: 'select', options: ['ext','str'], default: 'ext' },
      { key: 'foundationDia',  label: 'Foundation dia/side (m)', type: 'number', default: 0.45 },
      { key: 'topsoil',     label: 'Topsoil depth (m)',       type: 'number', default: 0.10 },
      { key: 'foundationDepth',label: 'Trial embedment P (m)', type: 'number', default: 0.90 },
      { key: 'soilG',       label: 'Soil factor G (TwF2012)', type: 'select', options: ['130','230','450','700','1000'], default: '230' },
      { key: 'nearSlope',   label: 'Near slope?',             type: 'select', options: ['flat','slope'], default: 'flat' },
    ],
  };

  // Code references per calc type
  const CALC_CODES = {
    'calc_beam':         'EN 1993-1-1 / EN 1995-1-1',
    'calc_column':       'EN 1993-1-1',
    'calc_rc_beam':      'EN 1992-1-1',
    'calc_rc_column':    'EN 1992-1-1',
    'calc_slab':         'EN 1992-1-1',
    'calc_footing':      'EN 1992-1-1 / EN 1997-1',
    'calc_retaining':    'EN 1992-1-1 / EN 1997-1',
    'calc_connection':   'EN 1993-1-8',
    'calc_timber_col':   'EN 1995-1-1',
    'calc_steel_member': 'EN 1993-1-1',
    'calc_bbs':          'EN 1992-1-1',
    'calc_section':      'Engineering Mathematics',
    'calc_wind':         'EN 1991-1-4',
    'calc_load_takedown':'EN 1991-1-1',
    'calc_hoarding':     'TwF2012 / EN 1991-1-4 / EN 1995-1-1 / EN 1997',
  };

  // ── Helpers ─────────────────────────────────────────────────────────────

  function getDefinition(type) {
    return ALL_BLOCKS.find(b => b.type === type) || null;
  }

  function _esc(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function _el(tag, attrs = {}, ...children) {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'className') el.className = v;
      // style accepts either a CSS string or a property object — Object.assign
      // on a string would walk its character indices and throw.
      else if (k === 'style') {
        if (typeof v === 'string') el.style.cssText = v;
        else Object.assign(el.style, v);
      }
      else if (k === 'dataset') Object.entries(v).forEach(([dk, dv]) => el.dataset[dk] = dv);
      else if (k === 'innerHTML') el.innerHTML = v;
      else el.setAttribute(k, v);
    });
    children.forEach(c => {
      if (c == null) return;
      el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return el;
  }

  function _dispatch(el, blockId) {
    el.dispatchEvent(new CustomEvent('block-change', { bubbles: true, detail: { id: blockId } }));
  }

  // ── Premium form helpers ─────────────────────────────────────────────────

  /**
   * Create a cb-field container: label on top, input below.
   * @param {string} label
   * @param {HTMLElement} inputEl
   * @returns {HTMLElement}
   */
  function _cbField(label, inputEl) {
    const wrap = _el('div', { className: 'cb-field' });
    wrap.appendChild(_el('label', { className: 'cb-label' }, label));
    wrap.appendChild(inputEl);
    return wrap;
  }

  function _cbInput(type, value, placeholder, onChange) {
    const inp = _el('input', { type, className: 'cb-input', value: value != null ? String(value) : '', placeholder: placeholder || '' });
    if (type === 'number') inp.setAttribute('step', 'any');
    inp.addEventListener('input', () => {
      const v = type === 'number' ? (parseFloat(inp.value) || 0) : inp.value;
      onChange(v);
    });
    inp.addEventListener('change', () => {
      const v = type === 'number' ? (parseFloat(inp.value) || 0) : inp.value;
      onChange(v);
    });
    return inp;
  }

  function _cbSelect(value, options, onChange) {
    const sel = _el('select', { className: 'cb-input' });
    options.forEach(opt => {
      const o = _el('option', { value: opt }, opt);
      if (String(opt) === String(value)) o.selected = true;
      sel.appendChild(o);
    });
    sel.addEventListener('change', () => onChange(sel.value));
    return sel;
  }

  function _cbTextarea(value, placeholder, onChange) {
    const ta = _el('textarea', { className: 'cb-input', placeholder: placeholder || '' });
    ta.value = value || '';
    ta.style.minHeight = '80px';
    ta.style.resize = 'vertical';
    ta.addEventListener('input', () => {
      onChange(ta.value);
    });
    return ta;
  }

  // Legacy helpers (kept for any external callers) —
  function _inputRow(label, inputEl) {
    return _cbField(label, inputEl);
  }

  function _textInput(value, placeholder, onChange) {
    return _cbInput('text', value, placeholder, onChange);
  }

  function _numberInput(value, onChange) {
    return _cbInput('number', value, '', onChange);
  }

  function _selectInput(value, options, onChange) {
    return _cbSelect(value, options, onChange);
  }

  function _textarea(value, placeholder, onChange) {
    return _cbTextarea(value, placeholder, onChange);
  }

  // ── Solver loading & running ─────────────────────────────────────────────

  // Note: distinct from the plain _loadScript(src) further down — this one
  // resolves to the global the script defines, and no-ops if already present.
  function _loadScriptFor(src, global) {
    return new Promise((resolve, reject) => {
      if (window[global]) { resolve(window[global]); return; }
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => {
        if (window[global]) resolve(window[global]);
        else reject(new Error('Loaded but global not found: ' + global));
      };
      s.onerror = () => reject(new Error('Failed to load: ' + src));
      document.head.appendChild(s);
    });
  }

  async function _loadSolver(type) {
    const info = SOLVER_MAP[type];
    if (!info) throw new Error('No solver for ' + type);
    // Prerequisites first — a solver that calls another file's globals will
    // throw a bare ReferenceError if we skip these.
    for (const dep of info.deps || []) await _loadScriptFor(dep.src, dep.global);
    return _loadScriptFor(info.src, info.global);
  }

  /**
   * Find a steel section's real dimensions by designation, e.g.
   * "254x102x22 UB" → { h, b, tw, tf }. Returns null if unavailable so
   * callers can fall back to sensible defaults.
   */
  function _lookupSteelSection(name) {
    const db = (typeof window !== 'undefined') && window.SteelSections;
    if (!db || !name) return null;
    const key = String(name).replace(/\s*(UB|UC|CHS|RHS|SHS)\s*$/i, '').trim().toLowerCase();
    for (const family of Object.keys(db)) {
      const list = db[family];
      if (!Array.isArray(list)) continue;
      const hit = list.find(s => String(s.designation || '').trim().toLowerCase() === key);
      if (hit) return hit;
    }
    return null;
  }

  function _mapInputs(type, config) {
    switch (type) {
      case 'calc_beam':
        return {
          material: config.material || 'steel',
          span: config.span || 5,
          spanLengths: [config.span || 5],
          supportType: 'simply_supported',
          fy: config.grade === 'S355' ? 355 : config.grade === 'S235' ? 235 : 275,
          Sxx: config.Sxx || 258,
          Ixx: config.Ixx || 2340,
          h_mm: config.h_mm || 203,
          tw_mm: config.tw_mm || 5.7,
          b_mm_sec: config.b_mm || 133,
          tf_mm: config.tf_mm || 7.8,
          A_cm2: config.A_cm2 || 32.0,
          r_mm: config.r_mm || 7.6,
          loads: [{ type: 'udl', magnitude: (1.35 * (config.Gk || 5) + 1.5 * (config.Qk || 3)), start: 0, end: config.span || 5 }],
        };
      case 'calc_column':
        return {
          NEd: config.NEd || 500,
          length: config.length || 3.5,
          keff: config.keff || 1.0,
          sectionType: 'UC',
          A: config.A || 58.8,
          Iyy: config.Iyy || 1540,
          Ixx: config.Ixx || 4570,
          fy: config.grade === 'S355' ? 355 : 275,
          E: 210000,
          axis: 'both',
          My_Ed: config.My || 0,
          Mz_Ed: 0,
        };
      case 'calc_rc_beam':
        return {
          span: config.span || 6,
          b: config.b || 300,
          h: config.h || 500,
          d: (config.h || 500) - 50,
          fck: config.fck || 30,
          fyk: 500,
          MEd: config.MEd || 150,
          VEd: config.VEd || 80,
          cnom: 35,
          As_prov: config.As_prov || 1608,
          Asw_prov: config.Asw_prov || 402,
          stirrup_s: 200,
          stirrup_d: 10,
          cover: 35,
        };
      case 'calc_rc_column':
        // ConcreteColumnSolver expects: shape, b, h, diameter, height,
        // endCondition, fck, fyk, NEd, MEd, n_bars, bar_dia, cover, link_dia
        return {
          shape: 'rectangular',
          b: +config.b || 300,
          h: +config.h || 300,
          diameter: 0,
          height: +config.lo || 3.0,
          endCondition: 'pinned_pinned',
          fck: +config.fck || 30,
          fyk: 500,
          NEd: +config.NEd || 800,
          MEd: +config.MEd || 60,
          n_bars: 8,
          bar_dia: 20,
          cover: 35,
          link_dia: 8,
        };
      case 'calc_slab':
        // SlabSolver expects: span, thickness, width, fck, fyk, cover,
        // barDia, gk, qk, supportType, selfWeight
        return {
          span: +config.span || +config.lx || 4,
          thickness: +config.thickness || +config.h || 175,
          width: 1000,                       // design a 1 m strip
          fck: +config.fck || 30,
          fyk: 500,
          cover: 25,
          barDia: 12,
          gk: +config.gk || 1.5,             // superimposed dead (kN/m²)
          qk: +config.qk || 2.5,             // imposed (kN/m²)
          supportType: config.supportType || 'simply_supported',
          selfWeight: true,
        };
      case 'calc_footing':
        return {
          Gk: config.Gk || 350,
          Qk: config.Qk || 150,
          columnW: config.columnW || 300,
          soilBearing: config.soilBearing || 150,
          footThick: config.footThick || 500,
          fck: config.fck || 30,
          fyk: 500,
          cover: 50,
          barDia: 16,
          footingType: 'square',
          aspectRatio: 1.0,
        };
      case 'calc_retaining': {
        // RetainingWallSolver expects: H, surcharge, soilDensity, phi,
        // wallDensity, baseWidth, stemThick, toeLength, heelLength,
        // baseThick, soilBearing, mu
        const H = +config.H || 3;
        const baseWidth = +config.baseWidth || +(H * 0.6).toFixed(2);
        const stemThick = +config.stemThick || 0.3;
        const toeLength = +config.toeLength || +(H * 0.2).toFixed(2);
        return {
          H,
          surcharge: +config.surcharge || 5,
          soilDensity: +config.gamma_soil || 18,
          phi: +config.phi || 30,
          wallDensity: 25,
          baseWidth,
          stemThick,
          toeLength,
          heelLength: Math.max(0.2, +(baseWidth - toeLength - stemThick).toFixed(2)),
          baseThick: +config.baseThick || 0.4,
          soilBearing: +config.soilBearing || 150,
          mu: 0.5,
        };
      }
      case 'calc_connection': {
        // ConnectionSolver expects a bolt group: Vx, Vy, M_in_plane,
        // boltLayout [{x,y} mm], boltSize ('M20'), boltGrade, shearPlanes
        const n = Math.max(1, +config.nBolts || 4);
        const pitch = 70;                                   // mm vertical pitch
        const y0 = -((n - 1) * pitch) / 2;
        const boltLayout = Array.from({ length: n }, (_, i) => ({ x: 0, y: y0 + i * pitch }));
        return {
          mode: config.connectionType === 'welded' ? 'weld' : 'bolt',
          Vx: 0,
          Vy: +config.VEd || 150,
          M_in_plane: 0,
          boltLayout,
          boltSize: 'M' + (+config.boltDia || 20),
          boltGrade: config.boltGrade || '8.8',
          shearPlanes: 1,
          plateThk: 10,
          fy: 275,
          fu: 430,
        };
      }
      case 'calc_timber_col':
        // TimberColumnSolver expects: grade, shape, b, h, diameter, height,
        // endCondition, serviceClass, loadDuration, NEd, MEd_y, MEd_z
        return {
          grade: config.timberClass || 'C24',
          shape: 'rectangular',
          b: +config.b || 90,
          h: +config.h || 90,
          diameter: 0,
          height: +config.span || 3.0,
          endCondition: 'pinned_pinned',
          serviceClass: 1,
          loadDuration: 'medium_term',
          NEd: +config.NEd || 50,
          MEd_y: 0,
          MEd_z: 0,
        };
      case 'calc_steel_member': {
        // SteelMemberSolver needs the full section record (dimensions AND
        // properties: A cm², Iy cm⁴, Wel_y/Wpl_y cm³, iz cm, r fillet) —
        // not just a designation string.
        const sec = _lookupSteelSection(config.section) || {
          h: 254, b: 101.6, tw: 5.7, tf: 6.8, r: 7.6,
          A: 28, Ixx: 2840, Iyy: 119, Zxx: 224, Sxx: 256, ryy: 2.06,
        };
        const L = +config.Lcr || 4.0;
        return {
          h: sec.h, b: sec.b, tw: sec.tw, tf: sec.tf, r: sec.r,
          A: sec.A,                 // cm²
          Iy: sec.Ixx,              // cm⁴
          Wel_y: sec.Zxx,           // cm³ (elastic)
          Wpl_y: sec.Sxx,           // cm³ (plastic)
          iz: sec.ryy,              // cm
          gammaM: 1.0,
          fy: config.grade === 'S355' ? 355 : 275,
          fu: config.grade === 'S355' ? 470 : 430,
          L, Lcr_y: L, Lcr_z: L,
          NEd: +config.NEd || 0,
          My_Ed: +config.MEd || 80,
          Vz_Ed: +config.VEd || 40,
        };
      }
      case 'calc_bbs':
        // BBSSolver takes an ARRAY of bar rows: {dia, qty, shape, A…E}
        return [
          {
            ref: config.element || 'Beam B1',
            shape: '00',                                  // straight bar
            dia: +config.barDia || 16,
            qty: +config.nBars || 4,
            A: Math.round((+config.length || 6) * 1000),  // cut length (mm)
          },
        ];
      case 'calc_section': {
        // SectionSolver dispatches on config.type with shape-specific dims
        const t = ({
          'rectangle': 'rectangle', 'circle': 'circle', 'box': 'box',
          'I-section': 'isection', 'isection': 'isection',
          'T-section': 'tsection', 'tsection': 'tsection', 'angle': 'angle',
        })[config.sectionType] || 'rectangle';
        const b = +config.b || 200, h = +config.h || 400;
        const tf = +config.tf || 12, tw = +config.tw || 7;
        const base = { type: t, b, h, tf, tw };
        if (t === 'circle')  return { ...base, dia: b };
        if (t === 'box')     return { ...base, B: b, H: h, b: Math.max(1, b - 2 * tw), h: Math.max(1, h - 2 * tf) };
        if (t === 'isection' || t === 'tsection') return { ...base, B: b, tf, hw: Math.max(1, h - 2 * tf), tw };
        if (t === 'angle')   return { ...base, bA: b, tA: tw, bB: h, tB: tf };
        return base;
      }
      case 'calc_wind':
        return {
          vb0: config.vb0 || 23,
          altitude: config.altitude || 50,
          distanceSea: 20,
          terrainCat: config.terrainCat || 'II',
          h: config.h || 10,
          b: config.b || 15,
          d: 10,
          cdir: 1.0,
          cseason: 1.0,
          calt: 1 + 0.001 * (config.altitude || 50),
          orography: false,
        };
      case 'calc_load_takedown':
        return {
          nFloors: config.nFloors || 3,
          floorArea: config.floorArea || 20,
          DL: config.DL || 4,
          LL: config.LL || 2.5,
          roofDL: config.roofDL || 3,
          roofLL: config.roofLL || 0.6,
        };
      default:
        return config;
    }
  }

  async function _runCalc(block) {
    const solver = await _loadSolver(block.type);
    const inputs = _mapInputs(block.type, block.config);
    let result;
    if (typeof solver === 'function') result = solver(inputs);
    else if (solver && typeof solver.solve === 'function') result = solver.solve(inputs);
    else throw new Error('Solver has no solve() method');
    return result;
  }

  // ── Calc block unified render ────────────────────────────────────────────

  function _renderCalcBlock(block, def) {
    const wrap = _el('div', { className: 'calc-block-wrap' });
    const fields = CALC_FIELDS[block.type] || [];
    const cfg = block.config;

    // ── Input grid (2-col, label-above-input) ─────────────────────────────
    const formGrid = _el('div', { className: 'cb-form-grid' });
    let vb0Input = null;

    fields.forEach(f => {
      let inputEl;
      const curVal = cfg[f.key] != null ? cfg[f.key] : f.default;
      if (cfg[f.key] == null) block.config[f.key] = f.default;

      if (f.type === 'select') {
        inputEl = _cbSelect(curVal, f.options, val => {
          block.config[f.key] = val;
          _dispatch(formGrid, block.id);
        });
      } else if (f.type === 'number') {
        inputEl = _cbInput('number', curVal, '', val => {
          block.config[f.key] = val;
          _dispatch(formGrid, block.id);
        });
      } else {
        inputEl = _cbInput('text', curVal, '', val => {
          block.config[f.key] = val;
          _dispatch(formGrid, block.id);
        });
      }

      if (f.key === 'vb0') vb0Input = inputEl;
      formGrid.appendChild(_cbField(f.label, inputEl));
    });

    wrap.appendChild(formGrid);

    // ── UK wind-speed map picker (hoarding / wind blocks) ─────────────────
    if (vb0Input && (block.type === 'calc_hoarding' || block.type === 'calc_wind')) {
      const mapBtn = _el('button', { className: 'cb-ai-pick-btn', type: 'button' });
      mapBtn.innerHTML = '📍 Pick wind speed from UK map';
      mapBtn.addEventListener('click', () => {
        if (!window.WindMap) { console.warn('WindMap not loaded'); return; }
        window.WindMap.open((vb0, region) => {
          block.config.vb0 = vb0;
          if (vb0Input) vb0Input.value = vb0;
          mapBtn.innerHTML = '📍 ' + vb0 + ' m/s — ' + region;
          _dispatch(formGrid, block.id);
        });
      });
      wrap.appendChild(mapBtn);
    }

    // ── AI Section Picker (calc_beam only) ───────────────────────────────
    if (block.type === 'calc_beam') {
      const aiPickBtn = _el('button', { className: 'cb-ai-pick-btn', type: 'button' });
      aiPickBtn.innerHTML = '🤖 AI Suggest Section';
      aiPickBtn.addEventListener('click', async () => {
        const span  = block.config.span  || 5;
        const Gk    = block.config.Gk    || 5;
        const Qk    = block.config.Qk    || 3;
        const grade = block.config.grade || 'S275';

        aiPickBtn.disabled = true;
        aiPickBtn.textContent = '⏳ Analysing…';

        const wEd = (1.35 * parseFloat(Gk) + 1.5 * parseFloat(Qk)).toFixed(2);

        const prompt = `You are a structural engineer. For a simply supported steel beam:
- Span: ${span}m
- Permanent load Gk: ${Gk} kN/m
- Variable load Qk: ${Qk} kN/m
- Design ULS load wEd = ${wEd} kN/m
- Steel grade: ${grade}
- Design to EN 1993-1-1 (Eurocode 3)

Deflection limit: span/360 for imposed loads.

Recommend the MOST SUITABLE UB section (Universal Beam). Give your answer in this exact format:
SECTION: [designation e.g. 254×146×31 UB]
REASON: [one sentence explaining why]
UTILISATION: [approximate bending utilisation as percentage]

Only give one recommendation. Be concise.`;

        const result = await _callAI(prompt);

        if (result) {
          let tipEl = wrap.querySelector('.cb-ai-tip');
          if (!tipEl) {
            tipEl = _el('div', { className: 'cb-ai-tip' });
            aiPickBtn.parentNode.insertBefore(tipEl, aiPickBtn.nextSibling);
          }
          tipEl.innerHTML = '<span style="color:#7C3AED;font-weight:700">🤖 AI Suggestion:</span> ' + result.replace(/\n/g, '<br>');
        } else {
          aiPickBtn.innerHTML = '⚠ AI unavailable';
          setTimeout(() => { aiPickBtn.innerHTML = '🤖 AI Suggest Section'; }, 2500);
          aiPickBtn.disabled = false;
          return;
        }

        aiPickBtn.disabled = false;
        aiPickBtn.innerHTML = '🤖 AI Suggest Section';
      });
      wrap.appendChild(aiPickBtn);
    }

    // ── Calculate button ─────────────────────────────────────────────────
    const calcBtn = _el('button', { className: 'cb-calc-btn' });
    calcBtn.innerHTML = '<span style="font-size:11px;opacity:0.85">▶</span> Calculate';
    const statusSpan = _el('span', { className: 'calc-status-msg' });
    wrap.appendChild(calcBtn);
    wrap.appendChild(statusSpan);

    // ── Results area ─────────────────────────────────────────────────────
    const resultsDiv = _el('div', { className: 'calc-block-results' });
    wrap.appendChild(resultsDiv);

    if (block.results && block.results._ran) {
      _renderCalcResults(block, resultsDiv);
    }

    // ── Click handler ─────────────────────────────────────────────────────
    calcBtn.addEventListener('click', async () => {
      calcBtn.disabled = true;
      calcBtn.innerHTML = '<span style="font-size:13px">⏳</span> Calculating…';
      statusSpan.textContent = '';
      try {
        const res = await _runCalc(block);
        block.results = { ...res, _ran: true };
        block.validated = true;
        _renderCalcResults(block, resultsDiv);
        _dispatch(wrap, block.id);
      } catch (err) {
        statusSpan.textContent = '⚠ Error: ' + err.message;
        console.error('Calc error', block.type, err);
      } finally {
        calcBtn.disabled = false;
        calcBtn.innerHTML = '<span style="font-size:11px;opacity:0.85">▶</span> Calculate';
      }
    });

    return wrap;
  }

  function _renderCalcResults(block, container) {
    container.innerHTML = '';
    const r = block.results;
    if (!r || !r._ran) return;

    const checks = _extractChecks(block);
    const allPass = checks.length === 0 || checks.every(c => c.pass);
    const keyVals = _getKeyResults(block);

    // ── Result card ───────────────────────────────────────────────────────
    const card = _el('div', { className: 'cb-result-card ' + (allPass ? 'pass' : 'fail') });

    // Status bar
    const statusBar = _el('div', { className: 'cb-result-status-bar' });
    statusBar.innerHTML = allPass
      ? '<span style="font-size:15px">✓</span> PASS — All design checks satisfied'
      : '<span style="font-size:15px">✗</span> FAIL — One or more checks not satisfied';
    card.appendChild(statusBar);

    // Metric tiles
    if (keyVals.length) {
      const metrics = _el('div', { className: 'cb-result-metrics' });
      keyVals.forEach(kv => {
        const m = _el('div');
        m.appendChild(_el('div', { className: 'cb-metric-val' }, String(kv.value) + (kv.unit ? ' ' + kv.unit : '')));
        m.appendChild(_el('div', { className: 'cb-metric-lbl' }, kv.label));
        metrics.appendChild(m);
      });
      card.appendChild(metrics);
    }

    // Collapsible full detail table
    const toggleBtn = _el('button', { className: 'cb-result-detail-toggle' }, '▶ View all results');
    const detailContent = _el('div', { className: 'cb-result-detail-content' });
    detailContent.style.display = 'none';

    toggleBtn.addEventListener('click', () => {
      const open = detailContent.style.display !== 'none';
      detailContent.style.display = open ? 'none' : 'block';
      toggleBtn.textContent = (open ? '▶' : '▼') + ' View all results';
    });

    const tbl = _el('table', { className: 'cb-result-table' });
    Object.entries(r).forEach(([k, v]) => {
      if (k === '_ran') return;
      if (typeof v === 'object' && v !== null) return;
      const displayVal = typeof v === 'number' ? v.toFixed(4) : typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v);
      const tr = _el('tr');
      tr.appendChild(_el('td', {}, k));
      tr.appendChild(_el('td', {}, displayVal));
      tbl.appendChild(tr);
    });

    detailContent.appendChild(tbl);
    card.appendChild(toggleBtn);
    card.appendChild(detailContent);

    // ── AI Explain Results button ─────────────────────────────────────────
    const explainBtn = _el('button', { className: 'cb-ai-explain-btn', type: 'button' });
    explainBtn.innerHTML = '🤖 AI Explain These Results';
    explainBtn.addEventListener('click', async () => {
      explainBtn.disabled = true;
      explainBtn.textContent = '⏳ Explaining…';

      const metricVals = card.querySelectorAll('.cb-metric-val');
      const metricLbls = card.querySelectorAll('.cb-metric-lbl');
      let metricsText = '';
      metricVals.forEach((m, idx) => {
        const lbl = metricLbls[idx]?.textContent;
        if (m.textContent && lbl) metricsText += `${lbl}: ${m.textContent}\n`;
      });

      const status = statusBar ? statusBar.textContent.trim() : 'completed';
      const calcName = (block.label || block.type.replace('calc_', '').replace(/_/g, ' '));

      const prompt = `You are explaining ${calcName} calculation results to an engineer. Results:
${metricsText}
Overall: ${status}

Explain in 2-3 sentences:
1. What these results mean structurally
2. Whether there's any concern or the design is efficient
3. One practical recommendation if the utilisation is high (>80%) or low (<40%)

Be direct and professional. Use engineering terminology but keep it concise.`;

      const result = await _callAI(prompt);
      if (result) {
        let explainEl = card.querySelector('.cb-ai-explanation');
        if (!explainEl) {
          explainEl = _el('div', { className: 'cb-ai-explanation' });
          card.appendChild(explainEl);
        }
        explainEl.innerHTML = '<div class="cb-ai-exp-label">🤖 AI Analysis</div><div class="cb-ai-exp-text">' + result.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</div>';
      } else {
        explainBtn.innerHTML = '⚠ AI unavailable';
        setTimeout(() => { explainBtn.innerHTML = '🤖 AI Explain These Results'; }, 2500);
        explainBtn.disabled = false;
        return;
      }

      explainBtn.disabled = false;
      explainBtn.innerHTML = '🤖 AI Explain These Results';
    });
    card.appendChild(explainBtn);

    container.appendChild(card);

    // ── Engineering diagram section ───────────────────────────────────────
    _drawBlockDiagram(block, container);
  }

  // ── SVG Engineering Diagrams ─────────────────────────────────────────────

  /**
   * Draw inline SVG engineering diagram after calculation results.
   * Dispatches to per-type renderers.
   *
   * calc_beam     → beam elevation (with UDL, supports, reactions, dim) + BMD panel
   * calc_rc_beam  → tabbed BeamDiagrams engine + RC cross-section panel
   * all others    → professional static SVG drawing
   */
  function _drawBlockDiagram(block, container) {
    const type = block.type;
    const r    = block.results;
    const cfg  = block.config;
    if (!r || !r._ran) return;

    const section = _el('div', { className: 'cb-diagram-section' });
    section.appendChild(_el('div', { className: 'cb-diagram-label' }, _diagramLabelFor(type)));

    if (type === 'calc_beam') {
      // Two-panel: elevation + BMD
      const grid = _el('div');
      grid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:8px;';
      const elevDiv = _el('div');
      elevDiv.innerHTML = _svgBeamElevation(cfg, r);
      const bmdDiv = _el('div');
      bmdDiv.innerHTML = _svgBeamBMD(cfg, r);
      grid.appendChild(elevDiv);
      grid.appendChild(bmdDiv);
      section.appendChild(grid);
      container.appendChild(section);
      // Also render full tabbed diagrams below
      _renderBeamDiagramTabs(block, container);
      return;
    }

    if (type === 'calc_rc_beam') {
      // Cross-section panel
      const xsDiv = _el('div');
      xsDiv.innerHTML = _svgRCBeamSection(cfg, r);
      section.appendChild(xsDiv);
      container.appendChild(section);
      // Also render full tabbed diagrams below
      _renderBeamDiagramTabs(block, container);
      return;
    }

    // All other calc types → professional static SVG
    const wrap = _el('div');
    wrap.innerHTML = _staticDiagramHTML(type, cfg, r);
    section.appendChild(wrap);
    container.appendChild(section);
  }

  function _diagramLabelFor(type) {
    const labels = {
      calc_beam:        'Structural Diagram',
      calc_rc_beam:     'Cross-Section',
      calc_column:      'Column Elevation',
      calc_rc_column:   'RC Column Cross-Section',
      calc_slab:        'Slab Plan Diagram',
      calc_footing:     'Pad Footing Diagram',
      calc_retaining:   'Retaining Wall Profile',
      calc_connection:  'Connection Diagram',
      calc_timber_col:  'Timber Column Diagram',
      calc_steel_member:'Steel Member Diagram',
      calc_wind:        'Wind Pressure Diagram',
      calc_load_takedown:'Load Takedown Diagram',
      calc_hoarding:    'Post Cantilever & Foundation',
    };
    return labels[type] || 'Engineering Diagram';
  }

  // ── Tabbed BMD/SFD/deflection diagrams using BeamDiagrams engine ────────

  function _renderBeamDiagramTabs(block, container) {
    const section = _el('div', { className: 'cb-diagram-section' });
    section.appendChild(_el('div', { className: 'cb-diagram-label' }, 'Structural Diagrams'));

    const blockId = block.id || ('blk-' + Math.random().toString(36).slice(2, 7));

    // Tab strip
    const tabs = _el('div', { className: 'cb-diagram-tabs' });
    const tabDefs = [
      { key: 'reactions', label: 'Configuration', h: '170px' },
      { key: 'bmd',       label: 'BMD',           h: '160px' },
      { key: 'sfd',       label: 'SFD',           h: '160px' },
      { key: 'deflection',label: 'Deflection',    h: '160px' },
    ];

    const svgEls = {};

    // SVG container
    const diagView = _el('div', { className: 'cb-diagram-view' });

    tabDefs.forEach((td, idx) => {
      // Tab button
      const btn = _el('button', { className: 'cb-dtab' + (idx === 0 ? ' active' : '') });
      btn.textContent = td.label;
      btn.dataset.tab = td.key;
      tabs.addEventListener('click', null); // handled below
      btn.addEventListener('click', () => {
        tabs.querySelectorAll('.cb-dtab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        Object.entries(svgEls).forEach(([k, el]) => {
          el.style.display = k === td.key ? 'block' : 'none';
        });
      });
      tabs.appendChild(btn);

      // SVG element
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.id = 'cbd-' + td.key + '-' + blockId;
      svg.setAttribute('class', 'cb-diag-svg');
      svg.style.height = td.h;
      svg.style.display = idx === 0 ? 'block' : 'none';
      svgEls[td.key] = svg;
      diagView.appendChild(svg);
    });

    section.appendChild(tabs);
    section.appendChild(diagView);
    container.appendChild(section);

    // Lazy-load BeamDiagrams and BeamUtils, then render
    _ensureBeamDiagramDeps().then(() => {
      try {
        const span = block.config.span || 6;
        const supports = _buildBeamSupports(block.config, span);
        const loads = _buildBeamLoads(block.config, span);
        const config = { span, supports, loads };
        const results = _buildBeamResults(block);

        // renderReactions, renderBMD, renderSFD, renderDeflection from diagrams.js
        // These functions use SVG element references directly — we pass our SVGs
        if (window.BeamDiagrams._renderReactions) {
          // Extended API (if we add it later)
        } else {
          // Use the individual functions directly from diagrams.js scope
          // They are module-level functions, but diagrams.js exposes only renderAll/renderPreview.
          // So we temporarily swap IDs, call renderAll, then restore.
          _renderUsingBeamDiagrams(svgEls, results, config, blockId);
        }

        // Capture rendered SVGs for report preview / print
        // Store as plain HTML strings in results so PreviewRenderer can embed them
        if (!block.results) block.results = {};
        block.results._beamTabSVGs = {};
        Object.keys(svgEls).forEach(k => {
          try {
            const el = svgEls[k];
            // diagrams.js draws into a fixed user-unit space (it falls back to
            // 600x200 when the element is laid out at zero size, which is the
            // case for the inactive tabs). Without a viewBox those coordinates
            // don't scale, so the panel prints blank — stamp one on before
            // capturing, and let it fill the panel width.
            if (!el.getAttribute('viewBox')) {
              const w = el.clientWidth  || 600;
              const h = el.clientHeight || 200;
              el.setAttribute('viewBox', `0 0 ${w} ${h}`);
              el.setAttribute('preserveAspectRatio', 'xMidYMid meet');
            }
            el.setAttribute('width', '100%');
            el.removeAttribute('height');
            // Capture a clone so we can strip the canvas's tab styling — the
            // inactive tabs carry display:none, which would otherwise be baked
            // into the report and print the panel blank.
            const clone = el.cloneNode(true);
            clone.style.removeProperty('display');
            clone.style.removeProperty('height');
            block.results._beamTabSVGs[k] = clone.outerHTML;
          } catch (_) {}
        });

      } catch (err) {
        console.warn('[BlockRegistry] Beam diagram render error:', err);
      }
    }).catch(err => {
      console.warn('[BlockRegistry] Failed to load diagram deps:', err);
    });
  }

  function _renderUsingBeamDiagrams(svgEls, results, config, blockId) {
    // BeamDiagrams.renderAll() uses document.getElementById('svg-reactions') etc.
    // Temporarily assign our SVG elements those IDs, call renderAll, then restore.
    const ID_MAP = {
      reactions:  'svg-reactions',
      bmd:        'svg-bmd',
      sfd:        'svg-sfd',
      deflection: 'svg-deflection',
    };

    // Save whatever currently has those IDs
    const saved = {};
    Object.entries(ID_MAP).forEach(([tab, stdId]) => {
      const existing = document.getElementById(stdId);
      if (existing) { saved[stdId] = existing; existing.id = stdId + '-saved-' + blockId; }
    });

    // Assign our SVGs the standard IDs
    Object.entries(ID_MAP).forEach(([tab, stdId]) => {
      if (svgEls[tab]) svgEls[tab].id = stdId;
    });

    try {
      window.BeamDiagrams.renderAll(results, config);
    } finally {
      // Restore original IDs
      Object.entries(ID_MAP).forEach(([tab, stdId]) => {
        if (svgEls[tab]) svgEls[tab].id = 'cbd-' + tab + '-' + blockId;
      });
      Object.entries(saved).forEach(([stdId, el]) => {
        el.id = stdId;
      });
    }
  }

  function _ensureBeamDiagramDeps() {
    // Load BeamUtils first (diagrams.js depends on it), then diagrams.js
    const ensureUtils = window.BeamUtils
      ? Promise.resolve()
      : _loadScript('/js/engine/utils.js');

    return ensureUtils.then(() => {
      if (window.BeamDiagrams) return;
      return _loadScript('/js/ui/diagrams.js');
    });
  }

  function _loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector('script[src="' + src + '"]')) {
        // Script tag already in DOM — wait a tick for it to execute if in-flight
        setTimeout(resolve, 50);
        return;
      }
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = () => reject(new Error('Failed to load: ' + src));
      document.head.appendChild(s);
    });
  }

  // ── AI helper ────────────────────────────────────────────────────────────

  async function _callAI(prompt) {
    try {
      // ai-chat.php requires authentication — send the Bearer token
      const headers = (typeof window !== 'undefined' && window.Auth)
        ? window.Auth.authHeaders()
        : { 'Content-Type': 'application/json' };
      const resp = await fetch('/api/ai-chat.php', {
        method: 'POST',
        headers,
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
      });
      if (!resp.ok) { console.warn('AI call HTTP', resp.status); return null; }
      const data = await resp.json();
      return data.reply || null;
    } catch (e) {
      console.error('AI call failed:', e);
      return null;
    }
  }

  function _buildBeamSupports(cfg, span) {
    const support = cfg.support || cfg.supportType || 'simply_supported';
    const supMap = {
      'simply_supported':   [{ type: 'pin', position: 0 }, { type: 'roller', position: span }],
      'fixed_fixed':        [{ type: 'fixed', position: 0 }, { type: 'fixed', position: span }],
      'propped_cantilever': [{ type: 'fixed', position: 0 }, { type: 'roller', position: span }],
      'cantilever':         [{ type: 'fixed', position: 0 }],
    };
    return supMap[support] || supMap['simply_supported'];
  }

  function _buildBeamLoads(cfg, span) {
    // If solver already returned loads in results, prefer that shape.
    // Otherwise reconstruct from config.
    const wEd = cfg.wEd || (1.35 * (cfg.Gk || 5) + 1.5 * (cfg.Qk || 3));
    return [{ type: 'udl', magnitude: +(wEd).toFixed(2), start: 0, end: span }];
  }

  function _buildBeamResults(block) {
    const r = block.results;
    const span = block.config.span || 6;
    // Build xs/M/V/deflection arrays from solver output if present,
    // otherwise synthesise a parabolic UDL distribution for display.
    const n = 51;
    let xs = Array.from({ length: n }, (_, i) => (i / (n - 1)) * span);

    let M, V, deflection;

    if (r.xs && r.M && r.xs.length > 0) {
      // Solver returned diagram data — use it, including its own station list.
      // These arrays must stay index-aligned: the diagram code locates the peak
      // by index in M/V and then reads xs at that index.
      xs         = r.xs;
      M          = r.M;
      V          = r.V || r.shears || xs.map(() => 0);
      deflection = r.deflection || xs.map(() => 0);
    } else {
      // Synthesise from peak values — parabolic BMD, linear SFD for simple UDL beam
      const MEd = r.MEd || r.M_Ed || 0;
      const VEd = r.VEd || r.V_Ed || 0;
      // Parabolic moment: M(x) = 4*MEd*(x/L)*(1 - x/L)
      M = xs.map(x => 4 * MEd * (x / span) * (1 - x / span));
      // Linear shear: V(x) = VEd*(1 - 2x/L)
      V = xs.map(x => VEd * (1 - 2 * x / span));
      // Parabolic deflection (mm → m for diagrams.js)
      const deflMax = r.deflectionMax || r.delta_max || r.maxDefl || 0;
      const deflMaxM = Math.abs(deflMax) > 1 ? deflMax / 1000 : deflMax; // convert mm→m if large
      deflection = xs.map(x => -4 * deflMaxM * (x / span) * (1 - x / span));
    }

    // reactions array required by renderReactions
    const reactions = r.reactions || _synthesiseReactions(block.config, r, span);

    return { xs, M, V, deflection, reactions };
  }

  function _synthesiseReactions(cfg, r, span) {
    const wEd   = cfg.wEd || (1.35 * (cfg.Gk || 5) + 1.5 * (cfg.Qk || 3));
    const total = wEd * span;
    const RA    = r.RA || r.R_A || total / 2;
    const RB    = r.RB || r.R_B || total / 2;
    return [
      { type: 'pin',    position: 0,    Fy: RA, M: 0 },
      { type: 'roller', position: span, Fy: RB, M: 0 },
    ];
  }

  // ── Professional Engineering Diagram HTML generators ─────────────────────

  // Common SVG defs block (arrowheads, patterns) — embed in each SVG
  function _svgDefs(id) {
    // id suffix prevents marker ID collisions when multiple blocks on canvas
    return `<defs>
      <marker id="aRed${id}" markerWidth="7" markerHeight="7" refX="3.5" refY="3.5" orient="auto">
        <path d="M0,0 L7,3.5 L0,7 Z" fill="#DC2626"/>
      </marker>
      <marker id="aRedUp${id}" markerWidth="7" markerHeight="7" refX="3.5" refY="3.5" orient="auto-start-reverse">
        <path d="M0,0 L7,3.5 L0,7 Z" fill="#DC2626"/>
      </marker>
      <marker id="aBlue${id}" markerWidth="7" markerHeight="7" refX="3.5" refY="3.5" orient="auto">
        <path d="M0,0 L7,3.5 L0,7 Z" fill="#2563EB"/>
      </marker>
      <marker id="aBlueUp${id}" markerWidth="7" markerHeight="7" refX="3.5" refY="3.5" orient="auto-start-reverse">
        <path d="M0,0 L7,3.5 L0,7 Z" fill="#2563EB"/>
      </marker>
      <marker id="aGray${id}" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
        <path d="M0,0 L6,3 L0,6 Z" fill="#6B7280"/>
      </marker>
      <marker id="aGrayL${id}" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto-start-reverse">
        <path d="M0,0 L6,3 L0,6 Z" fill="#6B7280"/>
      </marker>
      <pattern id="concreteHatch${id}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="6" stroke="#D1D5DB" stroke-width="0.8"/>
      </pattern>
      <pattern id="soilHatch${id}" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="8" stroke="#92400E" stroke-width="0.9" opacity="0.45"/>
      </pattern>
      <pattern id="rebarGrid${id}" width="16" height="16" patternUnits="userSpaceOnUse">
        <line x1="0" y1="8" x2="16" y2="8" stroke="#059669" stroke-width="1.2" opacity="0.7"/>
        <line x1="8" y1="0" x2="8" y2="16" stroke="#059669" stroke-width="1.2" opacity="0.5"/>
      </pattern>
    </defs>`;
  }

  // Generate a unique short ID for marker namespacing
  let _diagIdCounter = 0;
  function _nextDiagId() { return 'd' + (++_diagIdCounter); }

  // ── dispatch to per-type HTML (returns an HTML string containing <svg>) ───

  function _staticDiagramHTML(type, cfg, r) {
    switch (type) {
      case 'calc_column':
      case 'calc_timber_col':
        return _svgColumn(cfg, r);
      case 'calc_rc_column':
        return _svgRCColumn(cfg, r);
      case 'calc_slab':
        return _svgSlab(cfg, r);
      case 'calc_footing':
        return _svgFooting(cfg, r);
      case 'calc_retaining':
        return _svgRetaining(cfg, r);
      case 'calc_connection':
        return _svgConnection(cfg, r);
      case 'calc_steel_member':
        return _svgSteelMember(cfg, r);
      case 'calc_wind':
        return _svgWind(cfg, r);
      case 'calc_load_takedown':
        return _svgLoadTakedown(cfg, r);
      case 'calc_hoarding':
        return _svgHoarding(cfg, r);
      default:
        return _svgGeneric(cfg, r);
    }
  }

  // Keep legacy alias (used by older code paths)
  const _SVG_DEFS = '';

  // ── 1. calc_beam: Beam elevation (left panel) ─────────────────────────────

  function _svgBeamElevation(cfg, r) {
    const id   = _nextDiagId();
    const span = cfg.span || 5;
    const wEd  = cfg.wEd || +(1.35 * (cfg.Gk || 5) + 1.5 * (cfg.Qk || 3)).toFixed(2);
    const MEd  = r && r.MEd  != null ? (+r.MEd).toFixed(1)  : '—';
    // The solver returns reactions as support objects ({ type, position, Fy … }),
    // but older callers passed plain numbers — accept either.
    const reactionAt = (i) => {
      const v = r && r.reactions && r.reactions[i];
      if (v == null) return null;
      const n = typeof v === 'object' ? +v.Fy : +v;
      return isFinite(n) ? n : null;
    };
    const RA   = r && isFinite(+r.RA) ? (+r.RA).toFixed(1)
               : reactionAt(0) != null ? reactionAt(0).toFixed(1)
               : (wEd * span / 2).toFixed(1);
    const RB   = r && isFinite(+r.RB) ? (+r.RB).toFixed(1)
               : reactionAt(1) != null ? reactionAt(1).toFixed(1)
               : (wEd * span / 2).toFixed(1);

    const numArrows = 9;
    const udlArrows = Array.from({ length: numArrows }, (_, i) => {
      const x = 40 + i * (180 / (numArrows - 1));
      return `<line x1="${x.toFixed(1)}" y1="24" x2="${x.toFixed(1)}" y2="50" stroke="#DC2626" stroke-width="1.3" marker-end="url(#aRed${id})"/>`;
    }).join('');

    return `<svg viewBox="0 0 260 155" xmlns="http://www.w3.org/2000/svg" style="width:100%;display:block;background:#FAFAFA;border:1px solid #F3F4F6;border-radius:8px;font-family:Inter,sans-serif">
  ${_svgDefs(id)}
  <!-- UDL top line -->
  <line x1="40" y1="24" x2="220" y2="24" stroke="#DC2626" stroke-width="1.5"/>
  <!-- UDL arrows -->
  ${udlArrows}
  <!-- UDL label -->
  <text x="130" y="15" text-anchor="middle" font-size="8.5" fill="#DC2626" font-weight="700">w = ${(+wEd).toFixed(2)} kN/m</text>
  <!-- Beam body -->
  <rect x="40" y="50" width="180" height="10" fill="#374151" rx="1"/>
  <!-- Pin support left: triangle + hatch -->
  <polygon points="40,60 30,77 50,77" fill="none" stroke="#1F2937" stroke-width="1.5"/>
  <line x1="25" y1="79" x2="55" y2="79" stroke="#1F2937" stroke-width="1.5"/>
  <line x1="23" y1="82" x2="29" y2="79" stroke="#6B7280" stroke-width="1"/>
  <line x1="29" y1="82" x2="35" y2="79" stroke="#6B7280" stroke-width="1"/>
  <line x1="35" y1="82" x2="41" y2="79" stroke="#6B7280" stroke-width="1"/>
  <line x1="41" y1="82" x2="47" y2="79" stroke="#6B7280" stroke-width="1"/>
  <line x1="47" y1="82" x2="53" y2="79" stroke="#6B7280" stroke-width="1"/>
  <!-- Roller support right: triangle + circles -->
  <polygon points="220,60 210,76 230,76" fill="none" stroke="#1F2937" stroke-width="1.5"/>
  <circle cx="215" cy="79" r="2.5" fill="none" stroke="#1F2937" stroke-width="1.2"/>
  <circle cx="225" cy="79" r="2.5" fill="none" stroke="#1F2937" stroke-width="1.2"/>
  <line x1="205" y1="83" x2="235" y2="83" stroke="#1F2937" stroke-width="1.5"/>
  <!-- Reaction arrows (upward, blue) -->
  <line x1="40" y1="105" x2="40" y2="63" stroke="#2563EB" stroke-width="1.8" marker-end="url(#aBlueUp${id})"/>
  <text x="40" y="115" text-anchor="middle" font-size="7.5" fill="#2563EB" font-weight="700">R&#8336;=${RA}kN</text>
  <line x1="220" y1="105" x2="220" y2="63" stroke="#2563EB" stroke-width="1.8" marker-end="url(#aBlueUp${id})"/>
  <text x="220" y="115" text-anchor="middle" font-size="7.5" fill="#2563EB" font-weight="700">R&#8347;=${RB}kN</text>
  <!-- Dimension line -->
  <line x1="40" y1="130" x2="220" y2="130" stroke="#6B7280" stroke-width="0.9" marker-start="url(#aGrayL${id})" marker-end="url(#aGray${id})"/>
  <text x="130" y="142" text-anchor="middle" font-size="8.5" fill="#6B7280">L = ${span}m</text>
  <!-- MEd label at midspan -->
  <text x="130" y="46" text-anchor="middle" font-size="7.5" fill="#4B5563">M&#8336;&#8337; = ${MEd} kNm</text>
</svg>`;
  }

  // ── calc_beam: BMD panel (right panel) ────────────────────────────────────

  function _svgBeamBMD(cfg, r) {
    const id  = _nextDiagId();
    const MEd = r && r.MEd != null ? (+r.MEd).toFixed(1) : '?';
    const span = cfg.span || 5;
    return `<svg viewBox="0 0 240 155" xmlns="http://www.w3.org/2000/svg" style="width:100%;display:block;background:#FAFAFA;border:1px solid #F3F4F6;border-radius:8px;font-family:Inter,sans-serif">
  ${_svgDefs(id)}
  <text x="8" y="14" font-size="8" fill="#6B7280" font-weight="700" letter-spacing=".05em">BENDING MOMENT DIAGRAM</text>
  <!-- Baseline -->
  <line x1="20" y1="95" x2="220" y2="95" stroke="#1F2937" stroke-width="1.5"/>
  <!-- BMD parabolic curve -->
  <path d="M 20 95 Q 120 30 220 95" fill="rgba(37,99,235,0.10)" stroke="#2563EB" stroke-width="2"/>
  <!-- Peak dashed line -->
  <line x1="120" y1="30" x2="120" y2="95" stroke="#2563EB" stroke-width="1" stroke-dasharray="3,3"/>
  <!-- Peak label -->
  <text x="126" y="56" font-size="8.5" fill="#2563EB" font-weight="700">M&#8336;&#8337; = ${MEd} kNm</text>
  <!-- Zero dot markers -->
  <circle cx="20" cy="95" r="3" fill="#2563EB"/>
  <circle cx="220" cy="95" r="3" fill="#2563EB"/>
  <!-- Span label -->
  <text x="120" y="115" text-anchor="middle" font-size="8" fill="#6B7280">Simply Supported — L = ${span}m</text>
  <!-- Tension zone label -->
  <text x="120" y="80" text-anchor="middle" font-size="7" fill="#93C5FD">+ (sagging)</text>
</svg>`;
  }

  // ── 2. calc_rc_beam: RC cross-section ─────────────────────────────────────

  function _svgRCBeamSection(cfg, r) {
    const id    = _nextDiagId();
    const b     = +(cfg.b || 300);
    const h     = +(cfg.h || 500);
    const cnom  = 35;
    const barD  = 16;
    const nBars = (r && r.n_bars) ? +r.n_bars : 3;
    const AsProv = (r && r.As_prov) ? Math.round(+r.As_prov) : '?';

    // Scale section to fit 200×130 drawing area within 280×165 viewBox
    const maxW = 180, maxH = 120;
    const scale = Math.min(maxW / b, maxH / h);
    const W = +(b * scale).toFixed(1);
    const H = +(h * scale).toFixed(1);
    const ox = +((280 - W) / 2).toFixed(1);
    const oy = +((165 - H) / 2).toFixed(1);

    const stirrupInset = +(cnom * scale).toFixed(1);
    const barR = +(barD * scale / 2).toFixed(1);
    const barsX1 = ox + stirrupInset + barR;
    const barsX2 = ox + W - stirrupInset - barR;
    const barSpacing = nBars > 1 ? (barsX2 - barsX1) / (nBars - 1) : 0;
    const barY = +(oy + H - stirrupInset - barR).toFixed(1);

    const bars = Array.from({ length: nBars }, (_, i) => {
      const bx = +(barsX1 + i * barSpacing).toFixed(1);
      return `<circle cx="${bx}" cy="${barY}" r="${barR}" fill="#059669" stroke="#065F46" stroke-width="0.8"/>`;
    }).join('');

    // Top compression bars (2)
    const topBarY = +(oy + stirrupInset + barR).toFixed(1);
    const topBars = [barsX1, barsX2].map(bx =>
      `<circle cx="${bx.toFixed(1)}" cy="${topBarY}" r="${barR}" fill="#059669" stroke="#065F46" stroke-width="0.8"/>`
    ).join('');

    return `<svg viewBox="0 0 280 165" xmlns="http://www.w3.org/2000/svg" style="width:100%;display:block;background:#FAFAFA;border:1px solid #F3F4F6;border-radius:8px;font-family:Inter,sans-serif">
  ${_svgDefs(id)}
  <text x="140" y="12" text-anchor="middle" font-size="8" fill="#6B7280" font-weight="700" letter-spacing=".05em">CROSS-SECTION — b=${b}×h=${h} mm</text>
  <!-- Concrete body with hatch -->
  <rect x="${ox}" y="${oy}" width="${W}" height="${H}" fill="url(#concreteHatch${id})" stroke="#374151" stroke-width="2"/>
  <!-- Cover line (stirrup outline, dashed gray) -->
  <rect x="${ox + stirrupInset}" y="${oy + stirrupInset}" width="${W - 2*stirrupInset}" height="${H - 2*stirrupInset}" fill="none" stroke="#6B7280" stroke-width="0.8" stroke-dasharray="3,2"/>
  <!-- Stirrup (green rectangle) -->
  <rect x="${ox + stirrupInset}" y="${oy + stirrupInset}" width="${W - 2*stirrupInset}" height="${H - 2*stirrupInset}" fill="none" stroke="#059669" stroke-width="1.4"/>
  <!-- Main bottom bars -->
  ${bars}
  <!-- Top compression bars -->
  ${topBars}
  <!-- Dimension: b -->
  <line x1="${ox}" y1="${oy + H + 14}" x2="${ox + W}" y2="${oy + H + 14}" stroke="#6B7280" stroke-width="0.9" marker-start="url(#aGrayL${id})" marker-end="url(#aGray${id})"/>
  <text x="${ox + W/2}" y="${oy + H + 25}" text-anchor="middle" font-size="8" fill="#6B7280">b = ${b}mm</text>
  <!-- Dimension: h -->
  <line x1="${ox - 14}" y1="${oy}" x2="${ox - 14}" y2="${oy + H}" stroke="#6B7280" stroke-width="0.9" marker-start="url(#aGrayL${id})" marker-end="url(#aGray${id})"/>
  <text x="${ox - 22}" y="${oy + H/2 + 3}" text-anchor="middle" font-size="8" fill="#6B7280" transform="rotate(-90,${ox - 22},${oy + H/2 + 3})">h = ${h}mm</text>
  <!-- Cover annotation -->
  <text x="${ox + W + 5}" y="${oy + H - stirrupInset + 4}" font-size="7" fill="#6B7280">c=${cnom}mm</text>
  <!-- Rebar label -->
  <text x="${ox + W/2}" y="${oy + H - 4}" text-anchor="middle" font-size="7" fill="#065F46" font-weight="600">${nBars}T${barD} — A&#8346; = ${AsProv} mm²</text>
</svg>`;
  }

  // ── 3. calc_column (steel/timber): professional column elevation ───────────

  function _svgColumn(cfg, r) {
    const id      = _nextDiagId();
    const NEd     = r.NEd || cfg.NEd || r.N_Ed || cfg.N_Ed || 500;
    const length  = cfg.length || cfg.Ley || cfg.span || 3.5;
    const util    = r.utilisation || r.bucklingUtil || r.overallUtil || 0;
    const pass    = r.bucklingPass !== false && util <= 1;
    const utilPct = (util * 100).toFixed(0);
    const pCol    = pass ? '#16A34A' : '#DC2626';
    const pBg     = pass ? '#F0FDF4' : '#FEF2F2';
    const pBdr    = pass ? '#86EFAC' : '#FCA5A5';

    // Hatch lines for fixed base
    const hatchLines = Array.from({ length: 10 }, (_, i) => {
      const x1 = 83 + i * 8;
      const x2 = x1 - 8;
      return `<line x1="${x1}" y1="165" x2="${x2}" y2="158" stroke="#6B7280" stroke-width="1"/>`;
    }).join('');

    return `<svg viewBox="0 0 280 185" xmlns="http://www.w3.org/2000/svg" style="width:100%;display:block;background:#FAFAFA;border:1px solid #F3F4F6;border-radius:8px;font-family:Inter,sans-serif">
  ${_svgDefs(id)}
  <text x="140" y="13" text-anchor="middle" font-size="8" fill="#6B7280" font-weight="700" letter-spacing=".05em">COLUMN ELEVATION — L = ${(+length).toFixed(1)}m</text>
  <!-- Fixed base double line -->
  <line x1="90" y1="158" x2="170" y2="158" stroke="#1F2937" stroke-width="2"/>
  <line x1="83" y1="163" x2="177" y2="163" stroke="#1F2937" stroke-width="2"/>
  <!-- Base hatch -->
  ${hatchLines}
  <!-- Column web (I-section simplified) -->
  <rect x="126" y="30" width="8" height="128" fill="#9CA3AF" stroke="#374151" stroke-width="1"/>
  <!-- Top flange -->
  <rect x="112" y="30" width="36" height="8" fill="#6B7280" stroke="#374151" stroke-width="1.5"/>
  <!-- Bottom flange -->
  <rect x="112" y="150" width="36" height="8" fill="#6B7280" stroke="#374151" stroke-width="1.5"/>
  <!-- Axial load arrow (red, downward) -->
  <line x1="130" y1="8" x2="130" y2="30" stroke="#DC2626" stroke-width="2" marker-end="url(#aRed${id})"/>
  <text x="145" y="20" font-size="8.5" fill="#DC2626" font-weight="700">N&#8336;&#8337; = ${(+NEd).toFixed(0)} kN</text>
  <!-- Length dimension -->
  <line x1="172" y1="30" x2="172" y2="158" stroke="#6B7280" stroke-width="0.9" marker-start="url(#aGrayL${id})" marker-end="url(#aGray${id})"/>
  <text x="178" y="97" font-size="8" fill="#6B7280" transform="rotate(90,178,97)">L = ${(+length).toFixed(1)}m</text>
  <!-- Utilisation badge -->
  <rect x="8" y="70" width="72" height="44" rx="7" fill="${pBg}" stroke="${pBdr}" stroke-width="1.5"/>
  <text x="44" y="90" text-anchor="middle" font-size="17" fill="${pCol}" font-weight="900" font-family="'JetBrains Mono',monospace">${utilPct}%</text>
  <text x="44" y="105" text-anchor="middle" font-size="9" fill="${pCol}" font-weight="700">${pass ? '✓ PASS' : '✗ FAIL'}</text>
</svg>`;
  }

  // ── 4. RC Column cross-section ────────────────────────────────────────────

  function _svgRCColumn(cfg, r) {
    const id    = _nextDiagId();
    const b     = +(cfg.b || 300);
    const h     = +(cfg.h || 300);
    const util  = r.utilisation || r.overallUtil || 0;
    const pass  = r.overallPass !== false && util <= 1;
    const pCol  = pass ? '#16A34A' : '#DC2626';
    const pBg   = pass ? '#F0FDF4' : '#FEF2F2';
    const pBdr  = pass ? '#86EFAC' : '#FCA5A5';

    // Scale to fit 160×120 area in 280×165 viewBox
    const maxW = 160, maxH = 120;
    const scale = Math.min(maxW / b, maxH / h);
    const W = +(b * scale).toFixed(1);
    const H = +(h * scale).toFixed(1);
    const ox = +((280 - W) / 2 - 20).toFixed(1); // shift left to leave room for badge
    const oy = +((165 - H) / 2).toFixed(1);
    const cover = +(35 * scale).toFixed(1);

    // Corner + mid bars (green)
    const barR = Math.max(3, +(8 * scale).toFixed(1));
    const corners = [
      [ox + cover, oy + cover],
      [ox + W - cover, oy + cover],
      [ox + cover, oy + H - cover],
      [ox + W - cover, oy + H - cover],
    ];
    if (W > 60) {
      corners.push([ox + W/2, oy + cover], [ox + W/2, oy + H - cover]);
    }
    const bars = corners.map(([cx, cy]) =>
      `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${barR}" fill="#059669" stroke="#065F46" stroke-width="0.8"/>`
    ).join('');

    return `<svg viewBox="0 0 280 165" xmlns="http://www.w3.org/2000/svg" style="width:100%;display:block;background:#FAFAFA;border:1px solid #F3F4F6;border-radius:8px;font-family:Inter,sans-serif">
  ${_svgDefs(id)}
  <text x="110" y="12" text-anchor="middle" font-size="8" fill="#6B7280" font-weight="700" letter-spacing=".05em">COLUMN CROSS-SECTION — ${b}×${h} mm</text>
  <!-- Concrete with hatch -->
  <rect x="${ox}" y="${oy}" width="${W}" height="${H}" fill="url(#concreteHatch${id})" stroke="#374151" stroke-width="2"/>
  <!-- Cover dashed line -->
  <rect x="${ox+cover}" y="${oy+cover}" width="${W-2*cover}" height="${H-2*cover}" fill="none" stroke="#6B7280" stroke-width="0.8" stroke-dasharray="3,2"/>
  <!-- Stirrup green -->
  <rect x="${ox+cover}" y="${oy+cover}" width="${W-2*cover}" height="${H-2*cover}" fill="none" stroke="#059669" stroke-width="1.4"/>
  <!-- Bars -->
  ${bars}
  <!-- b dimension -->
  <line x1="${ox}" y1="${oy+H+14}" x2="${ox+W}" y2="${oy+H+14}" stroke="#6B7280" stroke-width="0.9" marker-start="url(#aGrayL${id})" marker-end="url(#aGray${id})"/>
  <text x="${ox+W/2}" y="${oy+H+25}" text-anchor="middle" font-size="8" fill="#6B7280">b = ${b}mm</text>
  <!-- h dimension -->
  <line x1="${ox-14}" y1="${oy}" x2="${ox-14}" y2="${oy+H}" stroke="#6B7280" stroke-width="0.9" marker-start="url(#aGrayL${id})" marker-end="url(#aGray${id})"/>
  <text x="${ox-22}" y="${oy+H/2+3}" text-anchor="middle" font-size="8" fill="#6B7280" transform="rotate(-90,${ox-22},${oy+H/2+3})">h = ${h}mm</text>
  <!-- Utilisation badge -->
  <rect x="206" y="62" width="66" height="44" rx="7" fill="${pBg}" stroke="${pBdr}" stroke-width="1.5"/>
  <text x="239" y="82" text-anchor="middle" font-size="16" fill="${pCol}" font-weight="900" font-family="'JetBrains Mono',monospace">${(util*100).toFixed(0)}%</text>
  <text x="239" y="97" text-anchor="middle" font-size="9" fill="${pCol}" font-weight="700">${pass ? '✓ PASS' : '✗ FAIL'}</text>
</svg>`;
  }

  // ── 5. RC Slab plan view ───────────────────────────────────────────────────

  function _svgSlab(cfg, r) {
    const id    = _nextDiagId();
    const lx    = +(cfg.lx || cfg.span || 4);
    const ly    = +(cfg.ly || cfg.span || 5);
    const thick = +(cfg.thickness || cfg.h || 200);
    const Gk    = +(cfg.Gk || 5);
    const Qk    = +(cfg.Qk || 3);
    const AsReq = r.As_req != null ? Math.round(+r.As_req) : '?';
    const util  = r.utilisation || r.bendingUtil || 0;
    const pass  = r.overallPass !== false && util <= 1;
    const pCol  = pass ? '#16A34A' : '#DC2626';
    const pBg   = pass ? '#F0FDF4' : '#FEF2F2';
    const pBdr  = pass ? '#86EFAC' : '#FCA5A5';

    // Scale to fit ~180×110 area in 280×175 viewBox
    const ratio = lx / ly;
    const diagW = Math.min(180, 180 * ratio + 20);
    const diagH = Math.min(110, 110 / ratio + 20);
    const sx = +((280 - diagW) / 2).toFixed(0);
    const sy = +((175 - diagH) / 2).toFixed(0);

    return `<svg viewBox="0 0 280 175" xmlns="http://www.w3.org/2000/svg" style="width:100%;display:block;background:#FAFAFA;border:1px solid #F3F4F6;border-radius:8px;font-family:Inter,sans-serif">
  ${_svgDefs(id)}
  <text x="140" y="13" text-anchor="middle" font-size="8" fill="#6B7280" font-weight="700" letter-spacing=".05em">RC SLAB PLAN — ${lx}×${ly}m, h=${thick}mm</text>
  <!-- Slab outline -->
  <rect x="${sx}" y="${sy}" width="${diagW}" height="${diagH}" fill="#F3F4F6" stroke="#374151" stroke-width="2.5"/>
  <!-- Rebar grid overlay -->
  <rect x="${sx}" y="${sy}" width="${diagW}" height="${diagH}" fill="url(#rebarGrid${id})" opacity="0.9"/>
  <!-- Support walls (thick edges) -->
  <line x1="${sx}" y1="${sy}" x2="${sx}" y2="${sy+diagH}" stroke="#1F2937" stroke-width="4"/>
  <line x1="${sx+diagW}" y1="${sy}" x2="${sx+diagW}" y2="${sy+diagH}" stroke="#1F2937" stroke-width="4"/>
  <line x1="${sx}" y1="${sy}" x2="${sx+diagW}" y2="${sy}" stroke="#1F2937" stroke-width="4"/>
  <line x1="${sx}" y1="${sy+diagH}" x2="${sx+diagW}" y2="${sy+diagH}" stroke="#1F2937" stroke-width="4"/>
  <!-- Load arrow at centre -->
  <line x1="${sx+diagW/2}" y1="${sy+diagH/2-20}" x2="${sx+diagW/2}" y2="${sy+diagH/2}" stroke="#DC2626" stroke-width="1.8" marker-end="url(#aRed${id})"/>
  <text x="${sx+diagW/2+6}" y="${sy+diagH/2-8}" font-size="8" fill="#DC2626" font-weight="600">q = ${(Gk+Qk).toFixed(1)} kN/m²</text>
  <!-- As label -->
  <text x="${sx+diagW/2}" y="${sy+diagH/2+16}" text-anchor="middle" font-size="8" fill="#059669" font-weight="700">A&#8346; = ${AsReq} mm²/m</text>
  <!-- Lx dimension -->
  <line x1="${sx}" y1="${sy+diagH+14}" x2="${sx+diagW}" y2="${sy+diagH+14}" stroke="#6B7280" stroke-width="0.9" marker-start="url(#aGrayL${id})" marker-end="url(#aGray${id})"/>
  <text x="${sx+diagW/2}" y="${sy+diagH+26}" text-anchor="middle" font-size="8" fill="#6B7280">L&#8339; = ${lx}m (short)</text>
  <!-- Ly dimension -->
  <line x1="${sx-14}" y1="${sy}" x2="${sx-14}" y2="${sy+diagH}" stroke="#6B7280" stroke-width="0.9" marker-start="url(#aGrayL${id})" marker-end="url(#aGray${id})"/>
  <text x="${sx-22}" y="${sy+diagH/2+3}" text-anchor="middle" font-size="8" fill="#6B7280" transform="rotate(-90,${sx-22},${sy+diagH/2+3})">L&#432; = ${ly}m</text>
  <!-- Utilisation badge -->
  <rect x="214" y="14" width="58" height="38" rx="6" fill="${pBg}" stroke="${pBdr}" stroke-width="1.5"/>
  <text x="243" y="29" text-anchor="middle" font-size="13" fill="${pCol}" font-weight="900" font-family="'JetBrains Mono',monospace">${(util*100).toFixed(0)}%</text>
  <text x="243" y="43" text-anchor="middle" font-size="8.5" fill="${pCol}" font-weight="700">${pass ? '✓ PASS' : '✗ FAIL'}</text>
</svg>`;
  }

  // ── 6. Pad Footing: elevation with bearing pressure arrows ─────────────────

  function _svgFooting(cfg, r) {
    const id     = _nextDiagId();
    const B      = +(r.B || cfg.L || cfg.footing_l || 1.5);
    const D      = +(cfg.D || cfg.footing_d || 0.5);
    const qa     = +(cfg.qa || cfg.q_allowable || 150);
    const N      = +(cfg.N_uls || cfg.N || 500);
    const sigma  = r.sigma_ed != null ? (+r.sigma_ed).toFixed(1) : (r.q_net != null ? (+r.q_net).toFixed(1) : '?');
    const pass   = r.bearingPass !== false && (r.overallPass !== false);
    const util   = r.bearingUtil || r.utilisation || 0;
    const pCol   = pass ? '#16A34A' : '#DC2626';
    const pBg    = pass ? '#F0FDF4' : '#FEF2F2';
    const pBdr   = pass ? '#86EFAC' : '#FCA5A5';

    // Layout: footing elevation 140px wide, centred
    const fx = 60, fy = 80;
    const footW = 160, footH = 26;
    const colW  = 32, colH = 30;
    const cx    = fx + footW/2 - colW/2;

    // Bearing pressure upward arrows (blue)
    const pressArrows = Array.from({ length: 8 }, (_, i) => {
      const ax = fx + (i / 7) * footW;
      return `<line x1="${ax.toFixed(1)}" y1="${fy+footH+22}" x2="${ax.toFixed(1)}" y2="${fy+footH+4}" stroke="#2563EB" stroke-width="1.3" marker-end="url(#aBlueUp${id})"/>`;
    }).join('');

    return `<svg viewBox="0 0 280 180" xmlns="http://www.w3.org/2000/svg" style="width:100%;display:block;background:#FAFAFA;border:1px solid #F3F4F6;border-radius:8px;font-family:Inter,sans-serif">
  ${_svgDefs(id)}
  <text x="140" y="13" text-anchor="middle" font-size="8" fill="#6B7280" font-weight="700" letter-spacing=".05em">PAD FOOTING — ${B.toFixed(2)}×${B.toFixed(2)}×${D}m</text>
  <!-- Column load arrow (red, down) -->
  <line x1="${cx+colW/2}" y1="18" x2="${cx+colW/2}" y2="${fy-colH}" stroke="#DC2626" stroke-width="2" marker-end="url(#aRed${id})"/>
  <text x="${cx+colW/2+6}" y="30" font-size="8" fill="#DC2626" font-weight="600">N = ${N}kN</text>
  <!-- Column stub -->
  <rect x="${cx}" y="${fy-colH}" width="${colW}" height="${colH}" fill="#D1D5DB" stroke="#374151" stroke-width="1.5"/>
  <!-- Footing body with concrete hatch -->
  <rect x="${fx}" y="${fy}" width="${footW}" height="${footH}" fill="url(#concreteHatch${id})" stroke="#374151" stroke-width="2"/>
  <!-- Soil below footing -->
  <rect x="${fx}" y="${fy+footH}" width="${footW}" height="26" fill="url(#soilHatch${id})"/>
  <line x1="${fx-8}" y1="${fy+footH}" x2="${fx+footW+8}" y2="${fy+footH}" stroke="#92400E" stroke-width="1.2"/>
  <!-- Bearing pressure arrows (upward, blue) -->
  ${pressArrows}
  <!-- Ground baseline -->
  <line x1="${fx}" y1="${fy+footH+26}" x2="${fx+footW}" y2="${fy+footH+26}" stroke="#2563EB" stroke-width="1"/>
  <!-- Pressure label -->
  <text x="${fx+footW/2}" y="${fy+footH+46}" text-anchor="middle" font-size="8" fill="#2563EB" font-weight="600">&#963; = ${sigma} kN/m² (allow. ${qa} kN/m²)</text>
  <!-- B dimension -->
  <line x1="${fx}" y1="${fy+footH+56}" x2="${fx+footW}" y2="${fy+footH+56}" stroke="#6B7280" stroke-width="0.9" marker-start="url(#aGrayL${id})" marker-end="url(#aGray${id})"/>
  <text x="${fx+footW/2}" y="${fy+footH+68}" text-anchor="middle" font-size="8" fill="#6B7280">B = ${B.toFixed(2)}m</text>
  <!-- Utilisation badge -->
  <rect x="8" y="70" width="48" height="38" rx="6" fill="${pBg}" stroke="${pBdr}" stroke-width="1.5"/>
  <text x="32" y="85" text-anchor="middle" font-size="12" fill="${pCol}" font-weight="900" font-family="'JetBrains Mono',monospace">${(util*100).toFixed(0)}%</text>
  <text x="32" y="99" text-anchor="middle" font-size="8.5" fill="${pCol}" font-weight="700">${pass ? '✓ PASS' : '✗ FAIL'}</text>
</svg>`;
  }

  // ── 7. Retaining wall: L-shape + triangular earth pressure ────────────────

  function _svgRetaining(cfg, r) {
    const id     = _nextDiagId();
    const H      = +(cfg.H || cfg.retained_height || 3);
    const Ka     = r.Ka != null ? (+r.Ka).toFixed(3) : '0.333';
    const pass   = r.overallPass !== false && (r.overturningPass !== false) && (r.slidingPass !== false);
    const util   = r.overallUtil || r.slidingUtil || 0;
    const pCol   = pass ? '#16A34A' : '#DC2626';
    const pBg    = pass ? '#F0FDF4' : '#FEF2F2';
    const pBdr   = pass ? '#86EFAC' : '#FCA5A5';

    // Wall geometry in SVG coords
    const stemX = 100, stemW = 22, stemY = 22, stemH = 130;
    const baseY = stemY + stemH, baseX = 60, baseW = 120, baseH = 20;

    // Retained earth zone (right of stem)
    const earthX = stemX + stemW, earthW = 130, earthY = stemY;

    // Earth pressure arrows: triangular (larger at bottom)
    const nEP = 6;
    const epArrows = Array.from({ length: nEP }, (_, i) => {
      const ay = stemY + (i / (nEP-1)) * stemH;
      const arrowLen = 8 + i * 12; // triangular distribution
      const x1 = earthX + arrowLen;
      return `<line x1="${x1}" y1="${ay.toFixed(1)}" x2="${earthX+2}" y2="${ay.toFixed(1)}" stroke="#DC2626" stroke-width="1.3" marker-end="url(#aRed${id})"/>`;
    }).join('');

    // Triangle fill outline
    const triPts = `${earthX},${stemY} ${earthX+8+5*(nEP-1)*2},${baseY} ${earthX},${baseY}`;

    return `<svg viewBox="0 0 280 185" xmlns="http://www.w3.org/2000/svg" style="width:100%;display:block;background:#FAFAFA;border:1px solid #F3F4F6;border-radius:8px;font-family:Inter,sans-serif">
  ${_svgDefs(id)}
  <text x="140" y="13" text-anchor="middle" font-size="8" fill="#6B7280" font-weight="700" letter-spacing=".05em">RETAINING WALL — H = ${H}m</text>
  <!-- Retained earth fill -->
  <rect x="${earthX}" y="${earthY}" width="${earthW}" height="${stemH}" fill="url(#soilHatch${id})"/>
  <line x1="${earthX}" y1="${earthY}" x2="${earthX+earthW}" y2="${earthY}" stroke="#92400E" stroke-width="1"/>
  <!-- Earth pressure triangle (red, semi-transparent) -->
  <polygon points="${triPts}" fill="rgba(220,38,38,0.07)" stroke="none"/>
  <!-- Earth pressure arrows (horizontal, left-pointing) -->
  ${epArrows}
  <!-- Ka label -->
  <text x="${earthX+50}" y="${baseY-8}" font-size="8" fill="#DC2626" font-weight="600">K&#8336; = ${Ka}</text>
  <!-- Wall stem (concrete hatch) -->
  <rect x="${stemX}" y="${stemY}" width="${stemW}" height="${stemH}" fill="url(#concreteHatch${id})" stroke="#374151" stroke-width="2"/>
  <!-- Base slab (concrete hatch) -->
  <rect x="${baseX}" y="${baseY}" width="${baseW}" height="${baseH}" fill="url(#concreteHatch${id})" stroke="#374151" stroke-width="2"/>
  <!-- Ground line -->
  <line x1="${baseX-15}" y1="${baseY}" x2="${earthX+earthW+10}" y2="${baseY}" stroke="#92400E" stroke-width="1.5" stroke-dasharray="4,3"/>
  <!-- Height dimension -->
  <line x1="${stemX-14}" y1="${stemY}" x2="${stemX-14}" y2="${baseY}" stroke="#6B7280" stroke-width="0.9" marker-start="url(#aGrayL${id})" marker-end="url(#aGray${id})"/>
  <text x="${stemX-22}" y="${stemY+stemH/2+3}" text-anchor="middle" font-size="8" fill="#6B7280" transform="rotate(-90,${stemX-22},${stemY+stemH/2+3})">H = ${H}m</text>
  <!-- Utilisation badge -->
  <rect x="8" y="68" width="48" height="38" rx="6" fill="${pBg}" stroke="${pBdr}" stroke-width="1.5"/>
  <text x="32" y="83" text-anchor="middle" font-size="12" fill="${pCol}" font-weight="900" font-family="'JetBrains Mono',monospace">${(util*100).toFixed(0)}%</text>
  <text x="32" y="97" text-anchor="middle" font-size="8.5" fill="${pCol}" font-weight="700">${pass ? '✓ PASS' : '✗ FAIL'}</text>
</svg>`;
  }

  // ── 8. Bolted connection ───────────────────────────────────────────────────

  function _svgConnection(cfg, r) {
    const id     = _nextDiagId();
    const VEd    = +(cfg.VEd || 150);
    const nBolts = +(cfg.nBolts || 4);
    const pass   = r.shearPass !== false && r.overallPass !== false;
    const util   = r.shearUtil || r.utilisation || 0;
    const pCol   = pass ? '#16A34A' : '#DC2626';
    const pBg    = pass ? '#F0FDF4' : '#FEF2F2';
    const pBdr   = pass ? '#86EFAC' : '#FCA5A5';

    const px = 70, py = 18, plateW = 52, plateH = Math.min(100, 16 * (nBolts+1));
    const gap = 38;
    const boltSpacing = plateH / (nBolts + 1);

    let bolts = '';
    for (let i = 0; i < Math.min(nBolts, 6); i++) {
      const by = py + boltSpacing * (i + 1);
      bolts += `<circle cx="${px+plateW/2}" cy="${by.toFixed(1)}" r="5.5" fill="none" stroke="#374151" stroke-width="1.5"/>`;
      bolts += `<circle cx="${px+plateW/2}" cy="${by.toFixed(1)}" r="2" fill="#374151"/>`;
      bolts += `<circle cx="${px+plateW+gap+plateW/2}" cy="${by.toFixed(1)}" r="5.5" fill="none" stroke="#374151" stroke-width="1.5"/>`;
      bolts += `<circle cx="${px+plateW+gap+plateW/2}" cy="${by.toFixed(1)}" r="2" fill="#374151"/>`;
    }

    const midY = py + plateH/2;
    return `<svg viewBox="0 0 280 ${py+plateH+50}" xmlns="http://www.w3.org/2000/svg" style="width:100%;display:block;background:#FAFAFA;border:1px solid #F3F4F6;border-radius:8px;font-family:Inter,sans-serif">
  ${_svgDefs(id)}
  <text x="140" y="13" text-anchor="middle" font-size="8" fill="#6B7280" font-weight="700" letter-spacing=".05em">BOLTED CONNECTION — ${nBolts} BOLTS</text>
  <!-- Left plate -->
  <rect x="${px}" y="${py}" width="${plateW}" height="${plateH}" fill="#E5E7EB" stroke="#374151" stroke-width="2" rx="1"/>
  <!-- Right plate -->
  <rect x="${px+plateW+gap}" y="${py}" width="${plateW}" height="${plateH}" fill="#E5E7EB" stroke="#374151" stroke-width="2" rx="1"/>
  <!-- Gap dashed line -->
  <line x1="${px+plateW+2}" y1="${midY.toFixed(1)}" x2="${px+plateW+gap-2}" y2="${midY.toFixed(1)}" stroke="#374151" stroke-width="1" stroke-dasharray="4,3"/>
  <!-- Bolts -->
  ${bolts}
  <!-- Shear arrow (red) -->
  <line x1="${px-18}" y1="${midY.toFixed(1)}" x2="${px-2}" y2="${midY.toFixed(1)}" stroke="#DC2626" stroke-width="2" marker-end="url(#aRed${id})"/>
  <text x="${px+plateW+gap/2}" y="${py+plateH+18}" text-anchor="middle" font-size="8.5" fill="#374151">V&#8336;&#8337; = ${VEd} kN / ${nBolts} bolts</text>
  <!-- Utilisation badge -->
  <rect x="${px+2*plateW+gap+18}" y="${py+plateH/2-20}" width="52" height="38" rx="6" fill="${pBg}" stroke="${pBdr}" stroke-width="1.5"/>
  <text x="${px+2*plateW+gap+44}" y="${py+plateH/2-4}" text-anchor="middle" font-size="12" fill="${pCol}" font-weight="900" font-family="'JetBrains Mono',monospace">${(util*100).toFixed(0)}%</text>
  <text x="${px+2*plateW+gap+44}" y="${py+plateH/2+10}" text-anchor="middle" font-size="8.5" fill="${pCol}" font-weight="700">${pass ? '✓ PASS' : '✗ FAIL'}</text>
</svg>`;
  }

  // ── 9. Steel member: elevation + BMD ──────────────────────────────────────

  function _svgSteelMember(cfg, r) {
    const id    = _nextDiagId();
    const span  = +(cfg.Lcr || cfg.span || 4);
    const MEd   = r.MEd || cfg.MEd || 80;
    const util  = r.utilisation || r.combinedUtil || 0;
    const pass  = r.overallPass !== false && util <= 1;
    const pCol  = pass ? '#16A34A' : '#DC2626';
    const pBg   = pass ? '#F0FDF4' : '#FEF2F2';
    const pBdr  = pass ? '#86EFAC' : '#FCA5A5';

    const mx = 30, my = 28, mw = 200, mh = 12;
    const baseY = my + mh;
    const bmdH = 42;

    // Parabolic BMD points
    const n = 24;
    const bmdPts = Array.from({ length: n+1 }, (_, i) => {
      const xr = i / n;
      return `${(mx + xr*mw).toFixed(1)},${(baseY + bmdH*4*xr*(1-xr)).toFixed(1)}`;
    });
    const bmdPath = `M${mx},${baseY} L${bmdPts.join(' L')} L${mx+mw},${baseY} Z`;

    return `<svg viewBox="0 0 280 145" xmlns="http://www.w3.org/2000/svg" style="width:100%;display:block;background:#FAFAFA;border:1px solid #F3F4F6;border-radius:8px;font-family:Inter,sans-serif">
  ${_svgDefs(id)}
  <text x="140" y="13" text-anchor="middle" font-size="8" fill="#6B7280" font-weight="700" letter-spacing=".05em">STEEL MEMBER — L = ${span}m</text>
  <!-- Member (dark gray I-section representation) -->
  <rect x="${mx}" y="${my}" width="${mw}" height="${mh}" fill="#374151" rx="2"/>
  <rect x="${mx}" y="${my}" width="${mw}" height="3" fill="#6B7280"/>
  <rect x="${mx}" y="${my+mh-3}" width="${mw}" height="3" fill="#6B7280"/>
  <!-- Pin support left -->
  <polygon points="${mx},${baseY} ${mx-10},${baseY+16} ${mx+10},${baseY+16}" fill="none" stroke="#1F2937" stroke-width="1.5"/>
  <line x1="${mx-13}" y1="${baseY+17}" x2="${mx+13}" y2="${baseY+17}" stroke="#1F2937" stroke-width="1.5"/>
  <!-- Roller support right -->
  <polygon points="${mx+mw},${baseY} ${mx+mw-10},${baseY+16} ${mx+mw+10},${baseY+16}" fill="none" stroke="#1F2937" stroke-width="1.5"/>
  <circle cx="${mx+mw-7}" cy="${baseY+20}" r="3" fill="none" stroke="#1F2937" stroke-width="1.2"/>
  <circle cx="${mx+mw+7}" cy="${baseY+20}" r="3" fill="none" stroke="#1F2937" stroke-width="1.2"/>
  <!-- BMD (blue fill) -->
  <path d="${bmdPath}" fill="rgba(37,99,235,0.10)" stroke="#2563EB" stroke-width="1.8"/>
  <!-- Peak annotation -->
  <line x1="${mx+mw/2}" y1="${baseY+bmdH}" x2="${mx+mw/2}" y2="${baseY}" stroke="#2563EB" stroke-width="0.9" stroke-dasharray="3,3"/>
  <text x="${mx+mw/2+6}" y="${baseY+bmdH/2+14}" font-size="8.5" fill="#2563EB" font-weight="700">M&#8336;&#8337; = ${(+MEd).toFixed(1)} kNm</text>
  <!-- Span label -->
  <line x1="${mx}" y1="${baseY+bmdH+22}" x2="${mx+mw}" y2="${baseY+bmdH+22}" stroke="#6B7280" stroke-width="0.9" marker-start="url(#aGrayL${id})" marker-end="url(#aGray${id})"/>
  <text x="${mx+mw/2}" y="${baseY+bmdH+34}" text-anchor="middle" font-size="8" fill="#6B7280">L = ${span}m</text>
  <!-- Utilisation badge -->
  <rect x="8" y="24" width="56" height="38" rx="6" fill="${pBg}" stroke="${pBdr}" stroke-width="1.5"/>
  <text x="36" y="39" text-anchor="middle" font-size="13" fill="${pCol}" font-weight="900" font-family="'JetBrains Mono',monospace">${(util*100).toFixed(0)}%</text>
  <text x="36" y="53" text-anchor="middle" font-size="8.5" fill="${pCol}" font-weight="700">${pass ? '✓ PASS' : '✗ FAIL'}</text>
</svg>`;
  }

  // ── 10. Wind pressure: building elevation ─────────────────────────────────

  function _svgWind(cfg, r) {
    const id  = _nextDiagId();
    const h   = +(cfg.h || cfg.H || 10);
    const qp  = r.qp || r.q_peak || 0;
    const we  = r.we || r.windPressure || +(qp * 0.8).toFixed(2);
    const pass = r.overallPass !== false;
    const pCol = pass ? '#16A34A' : '#DC2626';

    const bx = 120, by = 18, bw = 70, bh = 100;
    const nArrows = 7;
    // Wind pressure increases with height (qp(z) exposure profile, EN1991-1-4 Fig NA.7).
    // Arrow length grows toward the top; minimum 40% at the base.
    const maxLen = 34;
    const arrows = Array.from({ length: nArrows }, (_, i) => {
      const frac = i / (nArrows - 1);             // 0 at top, 1 at base
      const ay   = by + frac * bh;
      const len  = maxLen * (1 - 0.55 * frac);    // longer near top
      const x1   = (bx - len).toFixed(1);
      return `<line x1="${x1}" y1="${ay.toFixed(1)}" x2="${bx-2}" y2="${ay.toFixed(1)}" stroke="#DC2626" stroke-width="1.5" marker-end="url(#aRed${id})"/>`;
    }).join('');
    // Profile envelope (parabola-ish curve linking arrow tips) — the qp(z) shape
    const tips = Array.from({ length: nArrows }, (_, i) => {
      const frac = i / (nArrows - 1);
      const ay   = by + frac * bh;
      const len  = maxLen * (1 - 0.55 * frac);
      return `${(bx - len).toFixed(1)},${ay.toFixed(1)}`;
    }).join(' ');
    const weDisp = (typeof we === 'number') ? we.toFixed(2) : we;
    const qpDisp = (typeof qp === 'number') ? qp.toFixed(2) : qp;

    return `<svg viewBox="0 0 280 160" xmlns="http://www.w3.org/2000/svg" style="width:100%;display:block;background:#FAFAFA;border:1px solid #F3F4F6;border-radius:8px;font-family:Inter,sans-serif">
  ${_svgDefs(id)}
  <text x="140" y="13" text-anchor="middle" font-size="8" fill="#6B7280" font-weight="700" letter-spacing=".05em">WIND LOADING — q<tspan baseline-shift="sub" font-size="6">p</tspan>(z) PROFILE, h = ${h}m</text>
  <!-- Building body -->
  <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="#DBEAFE" stroke="#2563EB" stroke-width="2" rx="1"/>
  <!-- Roof triangle -->
  <polygon points="${bx-3},${by} ${bx+bw/2},${by-18} ${bx+bw+3},${by}" fill="#BFDBFE" stroke="#2563EB" stroke-width="1.5"/>
  <!-- Ground line + hatch -->
  <line x1="${bx-55}" y1="${by+bh+1}" x2="${bx+bw+25}" y2="${by+bh+1}" stroke="#374151" stroke-width="2" opacity="0.5"/>
  ${Array.from({length:6},(_,i)=>`<line x1="${bx-55+i*20}" y1="${by+bh+1}" x2="${bx-65+i*20}" y2="${by+bh+12}" stroke="#374151" stroke-width="1.2" opacity="0.3"/>`).join('')}
  <!-- qp(z) exposure-profile envelope -->
  <polyline points="${tips}" fill="none" stroke="#DC2626" stroke-width="0.8" stroke-dasharray="3,2" opacity="0.7"/>
  <!-- Wind pressure arrows (horizontal, profile-scaled) -->
  ${arrows}
  <!-- Wind direction label -->
  <text x="${bx-48}" y="${by+bh/2+20}" text-anchor="middle" font-size="9" fill="#DC2626" font-weight="600" transform="rotate(-90,${bx-48},${by+bh/2+20})">Wind &#8594;</text>
  <!-- z (height) axis with z=h annotation -->
  <text x="${bx+bw+16}" y="${by+10}" font-size="7.5" fill="#374151">z=${h}m</text>
  <text x="${bx+bw+16}" y="${by+bh}" font-size="7.5" fill="#374151">z=0</text>
  <!-- Peak pressure badge -->
  <rect x="${bx+bw+24}" y="${by+24}" width="74" height="68" rx="6" fill="#FFF7ED" stroke="#FED7AA" stroke-width="1.5"/>
  <text x="${bx+bw+61}" y="${by+40}" font-size="8" fill="#92400E" text-anchor="middle">q<tspan baseline-shift="sub" font-size="6">p</tspan>(z) peak</text>
  <text x="${bx+bw+61}" y="${by+57}" font-size="15" font-weight="800" fill="#B45309" text-anchor="middle" font-family="'JetBrains Mono',monospace">${qpDisp}</text>
  <text x="${bx+bw+61}" y="${by+69}" font-size="7.5" fill="#92400E" text-anchor="middle">kN/m²</text>
  <text x="${bx+bw+61}" y="${by+84}" font-size="8" fill="#92400E" text-anchor="middle">w<tspan baseline-shift="sub" font-size="6">e</tspan> = ${weDisp}</text>
</svg>`;
  }

  // ── 11. Load takedown: floor stack ────────────────────────────────────────

  function _svgLoadTakedown(cfg, r) {
    const id      = _nextDiagId();
    const nFloors = Math.min(+(cfg.nFloors || 3), 6);
    const totalN  = r.totalN || r.N_foundation || 0;
    const pass    = r.overallPass !== false;
    const pCol    = pass ? '#16A34A' : '#DC2626';

    const slabH = 12, gap = 20;
    const startY = 18, cvx = 140, slabW = 120;

    let floors = '';
    for (let i = 0; i < nFloors; i++) {
      const sy = startY + i * (slabH + gap);
      const isRoof = i === 0;
      floors += `<rect x="${cvx-slabW/2}" y="${sy}" width="${slabW}" height="${slabH}" fill="${isRoof?'#A7F3D0':'#BFDBFE'}" stroke="${isRoof?'#059669':'#2563EB'}" stroke-width="1.5" rx="2"/>`;
      floors += `<text x="${cvx}" y="${sy+slabH/2+4}" text-anchor="middle" font-size="8" fill="#374151">${isRoof?'Roof':'Floor '+(nFloors-i)}</text>`;
      if (i < nFloors - 1) {
        floors += `<line x1="${cvx}" y1="${sy+slabH}" x2="${cvx}" y2="${sy+slabH+gap}" stroke="#374151" stroke-width="3"/>`;
      }
    }

    const foundY = startY + nFloors * (slabH + gap) - gap + slabH + 4;
    const totalLabel = totalN && totalN.toFixed ? totalN.toFixed(0) : String(totalN);

    return `<svg viewBox="0 0 280 ${foundY+60}" xmlns="http://www.w3.org/2000/svg" style="width:100%;display:block;background:#FAFAFA;border:1px solid #F3F4F6;border-radius:8px;font-family:Inter,sans-serif">
  ${_svgDefs(id)}
  <text x="140" y="13" text-anchor="middle" font-size="8" fill="#6B7280" font-weight="700" letter-spacing=".05em">LOAD TAKEDOWN — ${nFloors} FLOORS</text>
  ${floors}
  <!-- Foundation slab -->
  <rect x="${cvx-72}" y="${foundY}" width="144" height="18" fill="url(#concreteHatch${id})" stroke="#374151" stroke-width="2" rx="2"/>
  <!-- Resultant load arrow -->
  <line x1="${cvx}" y1="${foundY+18}" x2="${cvx}" y2="${foundY+38}" stroke="#DC2626" stroke-width="2.5" marker-end="url(#aRed${id})"/>
  <text x="${cvx+8}" y="${foundY+32}" font-size="9" fill="#DC2626" font-weight="700" font-family="'JetBrains Mono',monospace">N = ${totalLabel} kN</text>
</svg>`;
  }

  // ── Temporary Works Hoarding: post cantilever + foundation overturning ────

  function _svgHoarding(cfg, r) {
    const id   = _nextDiagId();
    const H    = +(r.H || cfg.H || 2.4);
    const P    = +(r.P || cfg.foundationDepth || 0.9);
    const tops = +(r.topsoil || cfg.topsoil || 0.1);
    const minP = +(r.minP || P);
    const fulc = +(r.fulcrum || 0.707 * P);
    const MEd  = r.govMuls != null ? (+r.govMuls).toFixed(1) : '—';
    const VEd  = r.govVuls != null ? (+r.govVuls).toFixed(1) : '—';
    const FOS  = r.FOS != null ? (+r.FOS).toFixed(2) : '—';
    const fndPass = (r.FOS == null) || r.FOS >= 1.5;
    const postUC  = r.postUC != null ? r.postUC : 0;
    const postPass = postUC <= 1.0;
    const pCol = postPass ? '#16A34A' : '#DC2626';

    // ── Left panel: post cantilever (above ground) ──────────────────────────
    const px = 70, py = 16, ph = 120, pw = 12, gly = py + ph;
    const windArrows = Array.from({ length: 5 }, (_, i) => {
      const ay = py + 8 + i * (ph - 16) / 4;
      // longer arrows toward the top (wind profile)
      const len = 24 - i * 3;
      return `<line x1="${px - len}" y1="${ay}" x2="${px - 2}" y2="${ay}" stroke="#DC2626" stroke-width="1.4" marker-end="url(#aRed${id})"/>`;
    }).join('');
    // deflected shape (parabolic, exaggerated)
    const defl = Array.from({ length: 8 }, (_, i) => {
      const t = i / 7;
      const x = px + pw / 2 + 12 * t * t;
      const y = py + t * ph;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');

    const leftPanel = `
  <text x="80" y="11" text-anchor="middle" font-size="7.5" fill="#6B7280" font-weight="700" letter-spacing=".04em">POST CANTILEVER</text>
  <rect x="${px}" y="${py}" width="${pw}" height="${ph}" fill="#2d6a42" rx="2"/>
  <line x1="${px - 30}" y1="${gly}" x2="${px + pw + 26}" y2="${gly}" stroke="#1F2937" stroke-width="1" opacity="0.35"/>
  ${Array.from({length:5},(_,i)=>`<line x1="${px-22-i*9}" y1="${gly+6+i*4}" x2="${px-14-i*9}" y2="${gly+i*4}" stroke="#1F2937" stroke-width="0.6" opacity="0.25"/>`).join('')}
  ${windArrows}
  <text x="${px - 30}" y="${py + ph/2}" text-anchor="middle" font-size="8" fill="#DC2626" font-weight="600" transform="rotate(-90,${px-30},${py+ph/2})">Wind &#8594;</text>
  <polyline points="${defl}" fill="none" stroke="#5a9ed4" stroke-width="1" stroke-dasharray="3,2" opacity="0.8"/>
  <line x1="${px}" y1="${gly}" x2="${px - 22}" y2="${gly - 10}" stroke="#c8a94a" stroke-width="1"/>
  <text x="${px - 24}" y="${gly - 12}" text-anchor="end" font-size="7" fill="#b45309" font-weight="600">M&#8337;&#8332;=${MEd}</text>
  <line x1="${px + pw/2}" y1="${gly}" x2="${px + pw/2 + 26}" y2="${gly + 16}" stroke="#c8a94a" stroke-width="1"/>
  <text x="${px + pw/2 + 28}" y="${gly + 18}" font-size="7" fill="#b45309" font-weight="600">V&#8337;&#8332;=${VEd}</text>
  <text x="${px + pw + 16}" y="${py + ph/2}" font-size="7.5" fill="#374151" transform="rotate(90,${px+pw+16},${py+ph/2})">H = ${H.toFixed(1)} m</text>`;

    // ── Right panel: foundation overturning ─────────────────────────────────
    const glx = 210, fgly = 60, fpw = 12;
    const sc = 70 / (Math.max(P, minP) + 0.2);
    const pH = 44, fH = Math.round(P * sc), fY = fgly;
    const minFH = Math.round(minP * sc);
    const topH = Math.round(tops * sc);
    const fulcY = fY + Math.round(fulc * sc);
    const fndCol = fndPass ? '#16A34A' : '#DC2626';

    const rightPanel = `
  <text x="${glx + 4}" y="11" text-anchor="middle" font-size="7.5" fill="#6B7280" font-weight="700" letter-spacing=".04em">FOUNDATION (TwF2012)</text>
  <rect x="${glx}" y="${fgly - pH}" width="${fpw}" height="${pH}" fill="#2d6a42" rx="2"/>
  <rect x="${glx - 7}" y="${fY}" width="${fpw + 14}" height="${fH}" fill="#2d6a42" opacity="0.55" rx="2"/>
  <line x1="${glx - 16}" y1="${fY}" x2="${glx + fpw + 18}" y2="${fY}" stroke="#1F2937" stroke-width="0.7" opacity="0.3" stroke-dasharray="3,2"/>
  <rect x="${glx - 8}" y="${fY}" width="${fpw + 16}" height="${topH}" fill="#1F2937" opacity="0.07"/>
  <line x1="${glx - 12}" y1="${fulcY}" x2="${glx + fpw + 12}" y2="${fulcY}" stroke="#c8a94a" stroke-width="1" stroke-dasharray="3,2"/>
  <circle cx="${glx - 12}" cy="${fulcY}" r="2.5" fill="#c8a94a"/>
  <text x="${glx + fpw + 14}" y="${fulcY + 3}" font-size="6.5" fill="#b45309">fulcrum</text>
  <line x1="${glx - 7}" y1="${fY + minFH}" x2="${glx + fpw + 7}" y2="${fY + minFH}" stroke="#e07030" stroke-width="1.3" stroke-dasharray="4,2"/>
  <text x="${glx + fpw + 9}" y="${fY + minFH + 3}" font-size="6.5" fill="#e07030" font-weight="600">P&#8344;&#8336;&#8345;=${minP.toFixed(2)}m</text>
  ${Array.from({length:4},(_,i)=>{const ay=fgly-pH+6+i*(pH-10)/3;return `<line x1="${glx-3}" y1="${ay}" x2="${glx-15}" y2="${ay}" stroke="#4a9e65" stroke-width="1" marker-end="url(#aRed${id})"/>`;}).join('')}
  <rect x="${glx - 7}" y="${fY + fH + 8}" width="96" height="24" fill="${fndCol}" opacity="0.1" rx="3"/>
  <text x="${glx + 40}" y="${fY + fH + 19}" text-anchor="middle" font-size="8" fill="${fndCol}" font-weight="700">FOS = ${FOS} ${fndPass ? '✓' : '✗'}</text>
  <text x="${glx + 40}" y="${fY + fH + 28}" text-anchor="middle" font-size="6.5" fill="${fndCol}">P = ${P.toFixed(2)}m, t = ${tops.toFixed(2)}m</text>`;

    return `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="width:100%;display:block;background:#FAFAFA;border:1px solid #F3F4F6;border-radius:8px;font-family:Inter,sans-serif">
  ${_svgDefs(id)}
  ${leftPanel}
  <line x1="160" y1="20" x2="160" y2="180" stroke="#E5E7EB" stroke-width="1"/>
  ${rightPanel}
  <rect x="6" y="170" width="150" height="24" rx="4" fill="${postPass?'#F0FDF4':'#FEF2F2'}" stroke="${postPass?'#86EFAC':'#FCA5A5'}" stroke-width="1"/>
  <text x="81" y="185" text-anchor="middle" font-size="8" fill="${pCol}" font-weight="700">Post UC = ${(postUC*100).toFixed(0)}% ${postPass?'✓ PASS':'✗ FAIL'}</text>
</svg>`;
  }

  // ── 12. Generic fallback ──────────────────────────────────────────────────

  function _svgGeneric(cfg, r) {
    const id   = _nextDiagId();
    const util = r.utilisation || r.overallUtil || 0;
    const pass = r.overallPass !== false && util <= 1;
    const pCol = pass ? '#16A34A' : '#DC2626';
    const pBg  = pass ? '#F0FDF4' : '#FEF2F2';
    const pBdr = pass ? '#86EFAC' : '#FCA5A5';
    return `<svg viewBox="0 0 280 100" xmlns="http://www.w3.org/2000/svg" style="width:100%;display:block;background:#FAFAFA;border:1px solid #F3F4F6;border-radius:8px;font-family:Inter,sans-serif">
  ${_svgDefs(id)}
  <rect x="90" y="25" width="100" height="52" rx="8" fill="${pBg}" stroke="${pBdr}" stroke-width="1.5"/>
  <text x="140" y="47" text-anchor="middle" font-size="15" font-weight="900" fill="${pCol}" font-family="'JetBrains Mono',monospace">${pass?'✓ PASS':'✗ FAIL'}</text>
  <text x="140" y="65" text-anchor="middle" font-size="11" fill="#6B7280">&#951; = ${(util*100).toFixed(1)}%</text>
</svg>`;
  }

  function _extractChecks(block) {
    const r = block.results;
    if (!r) return [];
    const checks = [];

    // Common check patterns from solvers
    if (r.bendingPass !== undefined) checks.push({ label: block.label, checkName: 'Bending', util: r.bendingUtil, pass: r.bendingPass });
    if (r.shearPass !== undefined) checks.push({ label: block.label, checkName: 'Shear', util: r.shearUtil, pass: r.shearPass });
    if (r.deflectionPass !== undefined) checks.push({ label: block.label, checkName: 'Deflection', util: r.deflectionUtil, pass: r.deflectionPass });
    if (r.bucklingPass !== undefined) checks.push({ label: block.label, checkName: 'Buckling', util: r.bucklingUtil, pass: r.bucklingPass });
    if (r.bearingPass !== undefined) checks.push({ label: block.label, checkName: 'Bearing', util: r.bearingUtil, pass: r.bearingPass });
    if (r.overallPass !== undefined && checks.length === 0) checks.push({ label: block.label, checkName: 'Overall', util: r.overallUtil || 0, pass: r.overallPass });
    if (r.checks && Array.isArray(r.checks)) return r.checks;
    return checks;
  }

  function _getKeyResults(block) {
    const r = block.results;
    if (!r) return [];
    const type = block.type;
    const kv = [];
    if (type === 'calc_beam') {
      if (r.MEd !== undefined) kv.push({ label: 'MEd', value: r.MEd?.toFixed(1), unit: 'kNm' });
      if (r.MRd !== undefined) kv.push({ label: 'MRd', value: r.MRd?.toFixed(1), unit: 'kNm' });
      if (r.bendingUtil !== undefined) kv.push({ label: 'η bend', value: r.bendingUtil?.toFixed(3) });
    } else if (type === 'calc_column') {
      if (r.NbRd !== undefined) kv.push({ label: 'Nb,Rd', value: r.NbRd?.toFixed(1), unit: 'kN' });
      if (r.utilisation !== undefined) kv.push({ label: 'η', value: r.utilisation?.toFixed(3) });
    } else if (type === 'calc_rc_beam') {
      if (r.As_req !== undefined) kv.push({ label: 'As,req', value: r.As_req?.toFixed(0), unit: 'mm²' });
      if (r.K !== undefined) kv.push({ label: 'K', value: r.K?.toFixed(4) });
    } else if (type === 'calc_footing') {
      if (r.B !== undefined) kv.push({ label: 'Size', value: r.B?.toFixed(2) + '×' + r.B?.toFixed(2), unit: 'm' });
      if (r.q_net !== undefined) kv.push({ label: 'q net', value: r.q_net?.toFixed(1), unit: 'kPa' });
    } else {
      // Generic: first 3 numeric values
      let n = 0;
      Object.entries(r).forEach(([k, v]) => {
        if (n >= 3 || k === '_ran') return;
        if (typeof v === 'number') { kv.push({ label: k, value: v.toFixed(3) }); n++; }
      });
    }
    return kv;
  }

  // ── Individual block renderers ──────────────────────────────────────────

  function _renderTitle(block) {
    const wrap = _el('div', {});
    const cfg = block.config;

    // Large title input
    const titleField = _el('div', { className: 'cb-field' });
    titleField.appendChild(_el('label', { className: 'cb-label' }, 'Report Title'));
    const titleInp = _cbInput('text', cfg.title, 'e.g. Structural Calculation Report', v => { cfg.title = v; _dispatch(wrap, block.id); });
    titleInp.classList.add('cb-input-lg');
    titleField.appendChild(titleInp);
    wrap.appendChild(titleField);

    // 3-col row: ref, revision, date
    const grid = _el('div', { className: 'cb-form-grid-3' });
    grid.style.marginTop = '10px';

    const refInp = _cbInput('text', cfg.ref, 'e.g. MJC-2026-001', v => { cfg.ref = v; _dispatch(wrap, block.id); });
    grid.appendChild(_cbField('Report Reference', refInp));

    const revInp = _cbInput('text', cfg.revision || 'Rev A', 'e.g. Rev A', v => { cfg.revision = v; _dispatch(wrap, block.id); });
    grid.appendChild(_cbField('Revision', revInp));

    const dateInp = _el('input', { type: 'date', className: 'cb-input', value: cfg.date || new Date().toISOString().split('T')[0] });
    dateInp.addEventListener('input', () => { cfg.date = dateInp.value; _dispatch(wrap, block.id); });
    grid.appendChild(_cbField('Date', dateInp));

    wrap.appendChild(grid);
    return wrap;
  }

  function _renderProjectInfo(block) {
    const wrap = _el('div', {});
    const cfg = block.config;

    const projectTypes = ['Residential','Commercial','Industrial','Infrastructure','Retrofit / Refurbishment','Healthcare','Education','Mixed-Use','Leisure','Hospitality','Data Centre','Utilities','Transport','Cultural','Public Realm','Agricultural','Marine','Energy / Power','Defence','Other'];
    const designCodes = ['Eurocode (EC2/EC3/EC5)','BS 5950 (Steel)','BS 8110 (Concrete)','ACI 318 (Concrete)','AISC 360 (Steel)','AS 4100 (Steel)','AS 3600 (Concrete)','NZS 3404 (Steel)','IS 800 (Steel)','Other'];

    // Main 2-col grid
    const grid1 = _el('div', { className: 'cb-form-grid' });

    const textFields = [
      { key: 'projectName',  label: 'Project Name',  ph: 'e.g. Office Building Structural' },
      { key: 'clientName',   label: 'Client Name',   ph: 'e.g. ABC Architects' },
      { key: 'location',     label: 'Location',      ph: 'e.g. London, UK' },
      { key: 'projectRef',   label: 'Project Reference', ph: 'e.g. BM-2026-001' },
      { key: 'engineerName', label: 'Engineer Name', ph: 'Full name' },
      { key: 'companyName',  label: 'Company',       ph: 'Engineering firm' },
      // Optional letterhead details — printed on the report cover if filled in
      { key: 'companyAddress', label: 'Company Address', ph: 'e.g. 12 High St, London EC1A 1BB' },
      { key: 'companyPhone',   label: 'Company Phone',   ph: 'e.g. 020 7123 4567' },
      { key: 'companyEmail',   label: 'Company Email',   ph: 'e.g. info@yourfirm.co.uk' },
    ];

    textFields.forEach(f => {
      const inp = _cbInput('text', cfg[f.key], f.ph, v => { cfg[f.key] = v; _dispatch(wrap, block.id); });
      grid1.appendChild(_cbField(f.label, inp));
    });
    wrap.appendChild(grid1);

    // 2-col for code + date
    const grid2 = _el('div', { className: 'cb-form-grid' });
    grid2.style.marginTop = '10px';

    if (!cfg.designCode) cfg.designCode = designCodes[0];
    const codeInp = _cbSelect(cfg.designCode, designCodes, v => { cfg.designCode = v; _dispatch(wrap, block.id); });
    grid2.appendChild(_cbField('Design Code', codeInp));

    const dateInp = _el('input', { type: 'date', className: 'cb-input', value: cfg.date || new Date().toISOString().split('T')[0] });
    dateInp.addEventListener('input', () => { cfg.date = dateInp.value; _dispatch(wrap, block.id); });
    grid2.appendChild(_cbField('Date', dateInp));

    wrap.appendChild(grid2);
    return wrap;
  }

  function _renderDesignBasis(block) {
    const wrap = _el('div', {});
    const cfg = block.config;

    if (!cfg.text) cfg.text = 'This calculation has been prepared in accordance with the relevant design code. All loads are in accordance with EN 1991. Material properties are in accordance with the relevant material standard. All dimensions are in mm and forces in kN unless stated otherwise.';

    const ta = _cbTextarea(cfg.text, 'Enter design basis statement…', v => { cfg.text = v; _dispatch(wrap, block.id); });
    wrap.appendChild(_cbField('Design Basis Statement', ta));

    const assumLabel = _el('label', { className: 'cb-label' }, 'Standard Assumptions');
    assumLabel.style.marginTop = '14px';
    assumLabel.style.display = 'block';
    wrap.appendChild(assumLabel);

    const assumptions = [
      'All dimensions are in mm and forces in kN unless stated',
      'Self-weight of structural elements is included',
      'Loads are in accordance with EN 1991-1-1',
      'Materials conform to relevant European Standards',
      'Connections designed to transmit full member capacity',
      'Serviceability limit states checked (deflection, vibration)',
      'Ultimate limit states checked (strength, stability)',
      'Wind loading to EN 1991-1-4 with UK NA',
    ];

    if (!cfg.assumptions) cfg.assumptions = [];

    const checkGroup = _el('div', { className: 'cb-checkbox-group' });
    assumptions.forEach(a => {
      const item = _el('div', { className: 'cb-checkbox-item' });
      const cb = _el('input', { type: 'checkbox' });
      cb.checked = cfg.assumptions.includes(a);
      cb.addEventListener('change', () => {
        if (cb.checked) { if (!cfg.assumptions.includes(a)) cfg.assumptions.push(a); }
        else cfg.assumptions = cfg.assumptions.filter(x => x !== a);
        _dispatch(wrap, block.id);
      });
      item.appendChild(cb);
      item.appendChild(document.createTextNode(a));
      checkGroup.appendChild(item);
    });
    wrap.appendChild(checkGroup);

    // ── AI Draft button ────────────────────────────────────────────────────
    const aiBtn = _el('button', { className: 'cb-ai-btn', type: 'button' });
    aiBtn.textContent = '✨ AI Draft';
    aiBtn.style.marginTop = '12px';
    aiBtn.addEventListener('click', async () => {
      const designCode = cfg.design_code || 'Eurocode';
      const projectType = cfg.project_type || 'structural';
      const textarea = wrap.querySelector('textarea');

      aiBtn.disabled = true;
      aiBtn.textContent = '⏳ Drafting…';

      const prompt = `Write a professional structural engineering design basis statement for a ${projectType} project using ${designCode}. Include:
1. Code of practice and edition
2. Loading standard
3. Material standards
4. Key assumptions (e.g. serviceability limits, exposure class, load combinations)
5. Brief scope statement

Format it as formal engineering text, 3-4 short paragraphs. No bullet points. Professional tone suitable for a calculation report submission.`;

      const result = await _callAI(prompt);
      if (result && textarea) {
        textarea.value = result;
        cfg.text = result;
        textarea.dispatchEvent(new Event('input'));
        _dispatch(wrap, block.id);
      } else if (!result) {
        aiBtn.textContent = '⚠ AI unavailable';
        setTimeout(() => { aiBtn.textContent = '✨ AI Draft'; }, 2500);
        aiBtn.disabled = false;
        return;
      }

      aiBtn.disabled = false;
      aiBtn.textContent = '✨ AI Draft';
    });
    wrap.appendChild(aiBtn);

    return wrap;
  }

  function _renderSectionHeader(block) {
    const wrap = _el('div', {});
    const cfg = block.config;

    // num + title grid
    const grid = _el('div', { className: 'cb-form-grid' });
    grid.style.gridTemplateColumns = '80px 1fr';

    const numInp = _cbInput('text', cfg.number || '1.0', '1.0', v => { cfg.number = v; updatePreview(); _dispatch(wrap, block.id); });
    grid.appendChild(_cbField('Number', numInp));

    const titleInp = _cbInput('text', cfg.title || '', 'e.g. Design Inputs', v => { cfg.title = v; updatePreview(); _dispatch(wrap, block.id); });
    grid.appendChild(_cbField('Section Title', titleInp));

    wrap.appendChild(grid);

    // Live preview
    const preview = _el('div', { className: 'cb-section-preview' });
    const numSpan = _el('span', { className: 'cb-section-num' }, cfg.number || '1.0');
    const titleSpan = _el('span', { className: 'cb-section-title' }, cfg.title || 'Section Title');
    preview.appendChild(numSpan);
    preview.appendChild(titleSpan);
    wrap.appendChild(preview);

    function updatePreview() {
      numSpan.textContent = cfg.number || '1.0';
      titleSpan.textContent = cfg.title || 'Section Title';
    }

    return wrap;
  }

  function _renderCodeRef(block) {
    const wrap = _el('div', {});
    const cfg = block.config;
    if (!cfg.codes) cfg.codes = [{ name: 'EN 1993-1-1', description: 'Design of steel structures — General rules', edition: '2005' }];

    const tableWrap = _el('div', { className: 'code-ref-table-wrap' });

    const rebuild = () => {
      tableWrap.innerHTML = '';
      const tbl = _el('table', { className: 'code-ref-table' });
      const thead = _el('thead');
      const headRow = _el('tr');
      ['Code / Standard', 'Description', 'Year', ''].forEach(h => headRow.appendChild(_el('th', {}, h)));
      thead.appendChild(headRow);
      tbl.appendChild(thead);
      const tbody = _el('tbody');
      cfg.codes.forEach((code, i) => {
        const tr = _el('tr');
        const nameInp = _el('input', { type: 'text', value: code.name || '', placeholder: 'e.g. EN 1992-1-1' });
        nameInp.addEventListener('input', () => { cfg.codes[i].name = nameInp.value; _dispatch(wrap, block.id); });
        const descInp = _el('input', { type: 'text', value: code.description || '', placeholder: 'Description' });
        descInp.addEventListener('input', () => { cfg.codes[i].description = descInp.value; _dispatch(wrap, block.id); });
        const edInp = _el('input', { type: 'text', value: code.edition || '', placeholder: '2005' });
        edInp.style.width = '60px';
        edInp.addEventListener('input', () => { cfg.codes[i].edition = edInp.value; _dispatch(wrap, block.id); });
        const delBtn = _el('button', { className: 'btn-icon-del' }, '✕');
        delBtn.addEventListener('click', () => { cfg.codes.splice(i, 1); rebuild(); _dispatch(wrap, block.id); });
        tr.appendChild(_el('td', {}, nameInp));
        tr.appendChild(_el('td', {}, descInp));
        tr.appendChild(_el('td', {}, edInp));
        tr.appendChild(_el('td', {}, delBtn));
        tbody.appendChild(tr);
      });
      tbl.appendChild(tbody);
      tableWrap.appendChild(tbl);
    };
    rebuild();
    wrap.appendChild(tableWrap);

    const addBtn = _el('button', { className: 'btn-add-row' }, '+ Add Reference');
    addBtn.style.marginTop = '8px';
    addBtn.addEventListener('click', () => {
      cfg.codes.push({ name: '', description: '', edition: '' });
      rebuild();
      _dispatch(wrap, block.id);
    });
    wrap.appendChild(addBtn);

    // ── AI Suggest Codes button ────────────────────────────────────────────
    const aiCodeBtn = _el('button', { className: 'cb-ai-btn', type: 'button' });
    aiCodeBtn.innerHTML = '🤖 AI Suggest Codes';
    aiCodeBtn.style.marginTop = '8px';
    aiCodeBtn.addEventListener('click', async () => {
      aiCodeBtn.disabled = true;
      aiCodeBtn.textContent = '⏳ Finding codes…';

      // Detect calc block types on the canvas
      const calcTypes = new Set();
      document.querySelectorAll('.canvas-block[data-type]').forEach(el => {
        const t = el.dataset.type;
        if (t && t.startsWith('calc_')) calcTypes.add(t);
      });

      const typeNames = [...calcTypes].map(t => t.replace('calc_', '').replace(/_/g, ' ')).join(', ');

      const prompt = `For a structural engineering calculation report containing: ${typeNames || 'general structural calculations'}, list the relevant Eurocodes and British Standards that should be referenced. Format as a simple list, one code per line:
CODE: [code number and title]

Include only codes directly relevant to the calculations. Maximum 6 codes. Example format:
CODE: EN 1993-1-1:2005 — Design of Steel Structures
CODE: UK National Annex to EN 1993-1-1`;

      const result = await _callAI(prompt);

      if (result) {
        const lines = result.split('\n').filter(l => l.trim().startsWith('CODE:'));
        const codes = lines.map(l => l.replace('CODE:', '').trim()).filter(Boolean);
        if (codes.length > 0) {
          cfg.codes = codes.map(c => {
            const dashIdx = c.indexOf('—');
            if (dashIdx > -1) {
              return { name: c.slice(0, dashIdx).trim(), description: c.slice(dashIdx + 1).trim(), edition: '' };
            }
            return { name: c, description: '', edition: '' };
          });
          rebuild();
          _dispatch(wrap, block.id);
        }
      } else {
        aiCodeBtn.innerHTML = '⚠ AI unavailable';
        setTimeout(() => { aiCodeBtn.innerHTML = '🤖 AI Suggest Codes'; }, 2500);
        aiCodeBtn.disabled = false;
        return;
      }

      aiCodeBtn.disabled = false;
      aiCodeBtn.innerHTML = '🤖 AI Suggest Codes';
    });
    wrap.appendChild(aiCodeBtn);

    return wrap;
  }

  function _renderLoadTable(block) {
    const wrap = _el('div', {});
    const cfg = block.config;
    if (cfg.Gk == null) cfg.Gk = 5;
    if (cfg.Qk == null) cfg.Qk = 3;

    // Inputs
    const inputGrid = _el('div', { className: 'cb-form-grid' });

    const gkInp = _cbInput('number', cfg.Gk, '', v => { cfg.Gk = v; updateTable(); _dispatch(wrap, block.id); });
    inputGrid.appendChild(_cbField('Gk — Permanent (kN or kN/m)', gkInp));

    const qkInp = _cbInput('number', cfg.Qk, '', v => { cfg.Qk = v; updateTable(); _dispatch(wrap, block.id); });
    inputGrid.appendChild(_cbField('Qk — Variable (kN or kN/m)', qkInp));

    wrap.appendChild(inputGrid);

    // Results table
    const tbl = _el('table', { className: 'load-combo-table' });
    const thead = _el('thead');
    const headRow = _el('tr');
    ['Combination', 'Formula', 'Value (kN/m)'].forEach(h => headRow.appendChild(_el('th', {}, h)));
    thead.appendChild(headRow);
    tbl.appendChild(thead);

    const ulsVal = _el('td', { className: 'load-val' }, '—');
    const slsVal = _el('td', { className: 'load-val' }, '—');

    const tbody = _el('tbody');
    const ulsRow = _el('tr', { className: 'load-uls-row' });
    ulsRow.appendChild(_el('td', {}, 'ULS — Fundamental'));
    ulsRow.appendChild(_el('td', { className: 'load-formula' }, '1.35·Gk + 1.5·Qk'));
    ulsRow.appendChild(ulsVal);

    const slsRow = _el('tr');
    slsRow.appendChild(_el('td', {}, 'SLS — Characteristic'));
    slsRow.appendChild(_el('td', { className: 'load-formula' }, 'Gk + Qk'));
    slsRow.appendChild(slsVal);

    tbody.appendChild(ulsRow);
    tbody.appendChild(slsRow);
    tbl.appendChild(tbody);
    wrap.appendChild(tbl);

    function updateTable() {
      const Gk = cfg.Gk || 0;
      const Qk = cfg.Qk || 0;
      ulsVal.textContent = (1.35 * Gk + 1.5 * Qk).toFixed(2);
      slsVal.textContent = (Gk + Qk).toFixed(2);
    }
    updateTable();

    // ── AI Recommend Loads button ──────────────────────────────────────────
    const aiLoadBtn = _el('button', { className: 'cb-ai-btn', type: 'button' });
    aiLoadBtn.innerHTML = '🤖 AI Recommend Loads';
    aiLoadBtn.style.marginTop = '10px';
    aiLoadBtn.addEventListener('click', async () => {
      aiLoadBtn.disabled = true;
      aiLoadBtn.textContent = '⏳ Calculating…';

      // Get project type from project_info block if available
      const projBlock = document.querySelector('.canvas-block[data-type="project_info"]');
      const projType = projBlock?.querySelector('input[placeholder*="Office"], select')?.value || 'office';

      const prompt = `For a ${projType} building, recommend typical characteristic loads per EN 1991-1-1 (Eurocode 1). Give values only:
FLOOR_GK: [value] kN/m² (self-weight of floor slab and finishes)
FLOOR_QK: [value] kN/m² (imposed floor load)
ROOF_GK: [value] kN/m² (roof dead load)
ROOF_QK: [value] kN/m² (imposed roof load)
NOTE: [one brief note about load category]

Give realistic typical values, not ranges.`;

      const result = await _callAI(prompt);

      if (result) {
        let tipEl = wrap.querySelector('.cb-ai-load-tip');
        if (!tipEl) {
          tipEl = _el('div', { className: 'cb-ai-tip' });
          tipEl.classList.add('cb-ai-load-tip');
          wrap.appendChild(tipEl);
        }
        tipEl.innerHTML = '<span style="color:#7C3AED;font-weight:700">🤖 EC1 Recommendation:</span><br>' + result.replace(/\n/g, '<br>');
      } else {
        aiLoadBtn.innerHTML = '⚠ AI unavailable';
        setTimeout(() => { aiLoadBtn.innerHTML = '🤖 AI Recommend Loads'; }, 2500);
        aiLoadBtn.disabled = false;
        return;
      }

      aiLoadBtn.disabled = false;
      aiLoadBtn.innerHTML = '🤖 AI Recommend Loads';
    });
    wrap.appendChild(aiLoadBtn);

    return wrap;
  }

  function _renderText(block) {
    const wrap = _el('div', {});
    const cfg = block.config;
    const ta = _cbTextarea(cfg.text, 'Enter text, notes or commentary…', v => { cfg.text = v; _dispatch(wrap, block.id); });
    wrap.appendChild(_cbField('Content', ta));
    return wrap;
  }

  function _renderImage(block) {
    const wrap = _el('div', {});
    const cfg = block.config;

    const preview = _el('div', { className: 'image-preview-wrap' });
    if (cfg.src) {
      const img = _el('img', { src: cfg.src, className: 'block-image-preview' });
      preview.appendChild(img);
    }

    const uploadArea = _el('div', { className: 'image-upload-area' });
    uploadArea.innerHTML = '<div class="upload-icon">🖼</div>';
    uploadArea.appendChild(_el('p', {}, 'Click to upload or drag and drop an image'));
    uploadArea.appendChild(_el('p', { style: 'font-size:11px' }, 'PNG, JPG, SVG — max 10 MB'));

    const fileInp = _el('input', { type: 'file', accept: 'image/*' });
    fileInp.style.display = 'none';
    fileInp.addEventListener('change', () => {
      const file = fileInp.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = e => {
        cfg.src = e.target.result;
        cfg.filename = file.name;
        preview.innerHTML = '';
        preview.appendChild(_el('img', { src: cfg.src, className: 'block-image-preview' }));
        uploadArea.style.display = 'none';
        _dispatch(wrap, block.id);
      };
      reader.readAsDataURL(file);
    });

    uploadArea.addEventListener('click', () => fileInp.click());

    if (cfg.src) {
      uploadArea.style.display = 'none';
    }

    wrap.appendChild(preview);
    wrap.appendChild(uploadArea);
    wrap.appendChild(fileInp);

    const captionField = _cbField('Caption', _cbInput('text', cfg.caption, 'Figure caption…', v => { cfg.caption = v; _dispatch(wrap, block.id); }));
    captionField.style.marginTop = '10px';
    wrap.appendChild(captionField);

    return wrap;
  }

  function _renderToc(block) {
    const wrap = _el('div', { className: 'toc-placeholder' });
    wrap.innerHTML = '<strong>Table of Contents</strong>Generated automatically from Section Header blocks in preview mode.';
    return wrap;
  }

  function _renderPageBreak(block) {
    const wrap = _el('div', { className: 'page-break-display' });
    const line = _el('hr', { className: 'page-break-line' });
    const label = _el('span', { className: 'page-break-label' }, 'Page Break');
    const line2 = _el('hr', { className: 'page-break-line' });
    wrap.appendChild(line);
    wrap.appendChild(label);
    wrap.appendChild(line2);
    return wrap;
  }

  function _renderEngineerNotes(block) {
    const wrap = _el('div', {});
    const cfg = block.config;
    const labelInp = _cbInput('text', cfg.label, 'e.g. Engineer Notes', v => { cfg.label = v; _dispatch(wrap, block.id); });
    wrap.appendChild(_cbField('Heading', labelInp));

    const ta = _cbTextarea(cfg.text, 'Enter engineering notes, assumptions, or commentary…', v => { cfg.text = v; _dispatch(wrap, block.id); });
    const textField = _cbField('Notes', ta);
    textField.style.marginTop = '10px';
    wrap.appendChild(textField);

    // ── AI Generate Conclusions button ─────────────────────────────────────
    const aiBtn = _el('button', { className: 'cb-ai-btn', type: 'button' });
    aiBtn.textContent = '✨ AI Generate Conclusions';
    aiBtn.style.marginTop = '10px';
    aiBtn.addEventListener('click', async () => {
      aiBtn.disabled = true;
      aiBtn.textContent = '⏳ Generating…';

      // Collect calc results from all blocks on the canvas
      const allBlocks = document.querySelectorAll('.canvas-block[data-type]');
      const calcSummaries = [];
      allBlocks.forEach(blockEl => {
        const type = blockEl.dataset.type;
        if (!type || !type.startsWith('calc_')) return;
        const resultBar = blockEl.querySelector('.cb-result-status-bar');
        const metrics = blockEl.querySelectorAll('.cb-metric-val');
        const labels  = blockEl.querySelectorAll('.cb-metric-lbl');
        if (resultBar) {
          let summary = type.replace('calc_', '').replace(/_/g, ' ') + ': ' + resultBar.textContent.trim();
          metrics.forEach((m, idx) => {
            const lbl = labels[idx]?.textContent;
            if (m.textContent && lbl) summary += `, ${lbl}=${m.textContent}`;
          });
          calcSummaries.push(summary);
        }
      });

      const summaryText = calcSummaries.length > 0
        ? calcSummaries.join('\n')
        : 'Calculations have been performed per the relevant Eurocodes.';

      const prompt = `You are a structural engineer writing engineering conclusions for a calculation report. Based on these calculation results:

${summaryText}

Write professional engineering conclusions/notes (3-5 sentences) suitable for a formal calculation report. Include:
- Overall structural adequacy statement
- Key governing checks and utilisation ratios
- Any recommendations or notes for the design
- Confirmation that all checks satisfy the relevant code requirements

Write in first person plural ("The calculations demonstrate...", "All members satisfy..."). Professional, formal engineering language.`;

      const result = await _callAI(prompt);
      const textarea = wrap.querySelector('textarea');
      if (result && textarea) {
        textarea.value = result;
        cfg.text = result;
        _dispatch(wrap, block.id);
      } else if (!result) {
        aiBtn.textContent = '⚠ AI unavailable';
        setTimeout(() => { aiBtn.textContent = '✨ AI Generate Conclusions'; }, 2500);
        aiBtn.disabled = false;
        return;
      }

      aiBtn.disabled = false;
      aiBtn.textContent = '✨ AI Generate Conclusions';
    });
    wrap.appendChild(aiBtn);
    return wrap;
  }

  function _renderSignoff(block) {
    const wrap = _el('div', {});
    const cfg = block.config;
    if (!cfg.prepared) cfg.prepared = {};
    if (!cfg.checked)  cfg.checked  = {};
    if (!cfg.approved) cfg.approved = {};

    const roles = [
      { key: 'prepared', label: 'Prepared By' },
      { key: 'checked',  label: 'Checked By' },
      { key: 'approved', label: 'Approved By' },
    ];

    const grid = _el('div', { className: 'cb-signoff-grid' });
    roles.forEach(role => {
      const card = _el('div', { className: 'cb-signoff-card' });
      card.appendChild(_el('div', { className: 'cb-signoff-role' }, role.label));

      const nameInp = _cbInput('text', cfg[role.key].name, 'Full name', v => { cfg[role.key].name = v; _dispatch(wrap, block.id); });
      card.appendChild(_cbField('Name', nameInp));

      const dateInp = _el('input', { type: 'date', className: 'cb-input', value: cfg[role.key].date || '' });
      dateInp.style.marginTop = '8px';
      dateInp.addEventListener('input', () => { cfg[role.key].date = dateInp.value; _dispatch(wrap, block.id); });
      card.appendChild(_cbField('Date', dateInp));

      const sigInp = _cbInput('text', cfg[role.key].signature, 'Type name to sign', v => { cfg[role.key].signature = v; _dispatch(wrap, block.id); });
      sigInp.style.marginTop = '8px';
      card.appendChild(_cbField('Signature', sigInp));

      grid.appendChild(card);
    });
    wrap.appendChild(grid);
    return wrap;
  }

  function _renderRevisionHistory(block) {
    const wrap = _el('div', {});
    const cfg = block.config;
    if (!cfg.revisions) cfg.revisions = [{
      rev: 'A', date: new Date().toISOString().split('T')[0],
      description: 'First issue', preparedBy: '', checkedBy: '',
    }];

    const tableWrap = _el('div', { className: 'rev-table-wrap' });

    const rebuild = () => {
      tableWrap.innerHTML = '';
      const tbl = _el('table', { className: 'rev-history-table' });
      const thead = _el('thead');
      const headRow = _el('tr');
      ['Rev', 'Date', 'Description', 'Prepared By', 'Checked By', ''].forEach(h => headRow.appendChild(_el('th', {}, h)));
      thead.appendChild(headRow);
      tbl.appendChild(thead);
      const tbody = _el('tbody');
      cfg.revisions.forEach((rev, i) => {
        const tr = _el('tr');
        const mkInp = (val, ph, key) => {
          const inp = _el('input', { type: 'text', value: val || '', placeholder: ph });
          inp.addEventListener('input', () => { cfg.revisions[i][key] = inp.value; _dispatch(wrap, block.id); });
          return inp;
        };
        const mkDate = (val) => {
          const inp = _el('input', { type: 'date', value: val || '' });
          inp.addEventListener('input', () => { cfg.revisions[i].date = inp.value; _dispatch(wrap, block.id); });
          return inp;
        };
        const delBtn = _el('button', { className: 'btn-icon-del' }, '✕');
        delBtn.addEventListener('click', () => { cfg.revisions.splice(i, 1); rebuild(); _dispatch(wrap, block.id); });
        tr.appendChild(_el('td', {}, mkInp(rev.rev, 'A', 'rev')));
        tr.appendChild(_el('td', {}, mkDate(rev.date)));
        tr.appendChild(_el('td', {}, mkInp(rev.description, 'Description', 'description')));
        tr.appendChild(_el('td', {}, mkInp(rev.preparedBy, 'Name', 'preparedBy')));
        tr.appendChild(_el('td', {}, mkInp(rev.checkedBy, 'Name', 'checkedBy')));
        tr.appendChild(_el('td', {}, delBtn));
        tbody.appendChild(tr);
      });
      tbl.appendChild(tbody);
      tableWrap.appendChild(tbl);
    };
    rebuild();
    wrap.appendChild(tableWrap);

    const addBtn = _el('button', { className: 'btn-add-row' }, '+ Add Revision');
    addBtn.style.marginTop = '8px';
    addBtn.addEventListener('click', () => {
      const lastRev = cfg.revisions[cfg.revisions.length - 1];
      const nextRev = lastRev ? String.fromCharCode(lastRev.rev.charCodeAt(0) + 1) : 'A';
      cfg.revisions.push({ rev: nextRev, date: new Date().toISOString().split('T')[0], description: '', preparedBy: '', checkedBy: '' });
      rebuild();
      _dispatch(wrap, block.id);
    });
    wrap.appendChild(addBtn);
    return wrap;
  }

  function _renderChecksSummary(block) {
    const checks = block.results && block.results.checks;
    if (!checks || checks.length === 0) {
      const wrap = _el('div', { className: 'toc-placeholder' });
      wrap.innerHTML = '<strong>Design Checks Summary</strong>Aggregates PASS/FAIL results from all calculated blocks. Run calculations to populate.';
      return wrap;
    }
    const wrap = _el('div', {});
    const tableWrap = _el('div', { style: 'border:1.5px solid var(--border);border-radius:8px;overflow:hidden' });
    const tbl = _el('table', { className: 'checks-summary-table' });
    const thead = _el('thead');
    const headRow = _el('tr');
    ['Element', 'Check', 'η', 'Status'].forEach(h => headRow.appendChild(_el('th', {}, h)));
    thead.appendChild(headRow);
    tbl.appendChild(thead);
    const tbody = _el('tbody');
    checks.forEach(c => {
      const tr = _el('tr');
      tr.appendChild(_el('td', {}, c.label || ''));
      tr.appendChild(_el('td', {}, c.checkName || ''));
      tr.appendChild(_el('td', { className: 'util-val' }, typeof c.util === 'number' ? c.util.toFixed(3) : '—'));
      tr.appendChild(_el('td', { className: c.pass ? 'check-pass' : 'check-fail' }, c.pass ? '✓ PASS' : '✗ FAIL'));
      tbody.appendChild(tr);
    });
    tbl.appendChild(tbody);
    tableWrap.appendChild(tbl);
    wrap.appendChild(tableWrap);
    return wrap;
  }

  function _renderUtilisationChart(block) {
    const wrap = _el('div', { className: 'util-chart-placeholder' });
    const bars = _el('div', { className: 'util-chart-bars' });
    for (let i = 0; i < 5; i++) bars.appendChild(_el('div', { className: 'util-bar-mock' }));
    wrap.appendChild(bars);
    wrap.appendChild(_el('div', { className: 'util-chart-label' }, 'Utilisation chart renders in preview mode after calculations are run'));
    return wrap;
  }

  // ── Public API ───────────────────────────────────────────────────────────

  function render(block) {
    const def = getDefinition(block.type);
    switch (block.type) {
      case 'title':            return _renderTitle(block);
      case 'project_info':     return _renderProjectInfo(block);
      case 'design_basis':     return _renderDesignBasis(block);
      case 'section_header':   return _renderSectionHeader(block);
      case 'code_ref':         return _renderCodeRef(block);
      case 'load_table':       return _renderLoadTable(block);
      case 'text':
      case 'scope':            return _renderText(block);
      case 'image':            return _renderImage(block);
      case 'toc':              return _renderToc(block);
      case 'page_break':       return _renderPageBreak(block);
      case 'engineer_notes':   return _renderEngineerNotes(block);
      case 'signoff':          return _renderSignoff(block);
      case 'revision_history': return _renderRevisionHistory(block);
      case 'checks_summary':   return _renderChecksSummary(block);
      case 'utilisation_chart':return _renderUtilisationChart(block);
      default:
        if (block.type.startsWith('calc_')) return _renderCalcBlock(block, def);
        return _el('div', { className: 'block-display-note' }, 'Block type: ' + block.type);
    }
  }

  function renderPreview(block) {
    // delegated to PreviewRenderer — but basic fallback here
    return '<div style="color:#999;font-size:9pt;">[' + _esc(block.label) + ']</div>';
  }

  /**
   * generateDiagramHTML(block)
   * ─────────────────────────
   * Returns an HTML string containing the engineering diagram for a calc block.
   * This is used by PreviewRenderer to embed diagrams into the printable report.
   *
   * For static types (column, slab, footing, etc.) the SVG is generated directly
   * from block.config + block.results without touching the DOM.
   *
   * For beam types, the static elevation+BMD panels are generated immediately.
   * Tabbed BMD/SFD/Deflection diagrams are included only if the canvas has already
   * rendered them (block.results._beamTabSVGs populated during calc run).
   */
  function generateDiagramHTML(block) {
    const type = block.type;
    const r    = block.results || {};
    const cfg  = block.config  || {};
    if (!r._ran) return '';

    const label = _diagramLabelFor(type);
    let inner = '';

    if (type === 'calc_beam') {
      // Static elevation + BMD side by side
      inner += '<div class="rp-beam-elevation-grid">';
      inner += '<div>' + _svgBeamElevation(cfg, r) + '</div>';
      inner += '<div>' + _svgBeamBMD(cfg, r) + '</div>';
      inner += '</div>';
      // Tabbed diagrams captured after async render
      if (r._beamTabSVGs) {
        const tabLabels = { reactions: 'Configuration', bmd: 'Bending Moment', sfd: 'Shear Force', deflection: 'Deflection' };
        inner += '<div class="rp-beam-diagrams">';
        ['reactions', 'bmd', 'sfd', 'deflection'].forEach(k => {
          if (r._beamTabSVGs[k]) {
            inner += '<div class="rp-beam-diagram-panel">';
            inner += '<div class="rp-beam-diagram-label">' + (tabLabels[k] || k) + '</div>';
            inner += r._beamTabSVGs[k];
            inner += '</div>';
          }
        });
        inner += '</div>';
      }
    } else if (type === 'calc_rc_beam') {
      inner += _svgRCBeamSection(cfg, r);
      if (r._beamTabSVGs) {
        const tabLabels = { reactions: 'Configuration', bmd: 'Bending Moment', sfd: 'Shear Force', deflection: 'Deflection' };
        inner += '<div class="rp-beam-diagrams">';
        ['reactions', 'bmd', 'sfd', 'deflection'].forEach(k => {
          if (r._beamTabSVGs[k]) {
            inner += '<div class="rp-beam-diagram-panel">';
            inner += '<div class="rp-beam-diagram-label">' + (tabLabels[k] || k) + '</div>';
            inner += r._beamTabSVGs[k];
            inner += '</div>';
          }
        });
        inner += '</div>';
      }
    } else {
      inner = _staticDiagramHTML(type, cfg, r);
    }

    if (!inner) return '';
    return `<div class="rp-diagram-section">
  <div class="rp-diagram-label">${label}</div>
  <div class="rp-diagram-body">${inner}</div>
</div>`;
  }

  return { ALL_BLOCKS, render, renderPreview, generateDiagramHTML, getDefinition, _extractChecks, _esc, CALC_CODES };

})();

window.BlockRegistry = BlockRegistry;
if (typeof module !== 'undefined') module.exports = BlockRegistry;
