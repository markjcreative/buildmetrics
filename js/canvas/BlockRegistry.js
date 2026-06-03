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
    'calc_beam':         { src: '/js/engine/beamDesignSolver.js',   global: 'BeamDesignSolver' },
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
      else if (k === 'style') Object.assign(el.style, v);
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

  function _loadSolver(type) {
    return new Promise((resolve, reject) => {
      const info = SOLVER_MAP[type];
      if (!info) { reject(new Error('No solver for ' + type)); return; }
      if (window[info.global]) { resolve(window[info.global]); return; }
      const s = document.createElement('script');
      s.src = info.src;
      s.onload = () => {
        if (window[info.global]) resolve(window[info.global]);
        else reject(new Error('Solver loaded but global not found: ' + info.global));
      };
      s.onerror = () => reject(new Error('Failed to load solver: ' + info.src));
      document.head.appendChild(s);
    });
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
        return {
          b: config.b || 300,
          h: config.h || 300,
          fck: config.fck || 30,
          fyk: 500,
          NEd: config.NEd || 800,
          MEd_top: config.MEd || 60,
          MEd_bot: config.MEd || 60,
          lo: config.lo || 3.0,
          cover: 35,
          barDia: 20,
          linkDia: 8,
          nBarsTotal: 8,
        };
      case 'calc_slab':
        return {
          lx: config.lx || 4,
          ly: config.ly || 5,
          h: config.h || 175,
          fck: config.fck || 30,
          fyk: 500,
          n_uls: config.n_uls || 14,
          supportCondition: 'four_edges',
          cover: 25,
          barDia: 12,
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
      case 'calc_retaining':
        return {
          H: config.H || 3,
          gamma_soil: config.gamma_soil || 18,
          phi: config.phi || 30,
          surcharge: config.surcharge || 5,
          fck: config.fck || 30,
          fyk: 500,
          cover: 50,
          wallThick: 300,
          baseThick: 400,
          baseWidth: config.H ? config.H * 0.6 : 1.8,
          toeSlab: config.H ? config.H * 0.2 : 0.6,
        };
      case 'calc_connection':
        return {
          connectionType: config.connectionType || 'bolted',
          VEd: config.VEd || 150,
          boltGrade: config.boltGrade || '8.8',
          boltDia: config.boltDia || 20,
          nBolts: config.nBolts || 4,
          plateThk: 10,
          fy: 275,
          fu: 430,
        };
      case 'calc_timber_col':
        return {
          height: config.span || 3.0,
          b: config.b || 90,
          h_sec: config.h || 90,
          NEd: config.NEd || 50,
          timberClass: config.timberClass || 'C24',
          kDef: config.kDef || 0.8,
          serviceClass: 1,
          loadDurationClass: 'medium_term',
          kmod: 0.8,
        };
      case 'calc_steel_member':
        return {
          section: config.section || '254x102x22 UB',
          fy: config.grade === 'S355' ? 355 : 275,
          Lcr: config.Lcr || 4.0,
          NEd: config.NEd || 0,
          MEd: config.MEd || 80,
          VEd: config.VEd || 40,
        };
      case 'calc_bbs':
        return {
          element: config.element || 'Beam B1',
          length: config.length || 6,
          barDia: config.barDia || 16,
          nBars: config.nBars || 4,
          fyk: config.fyk || 500,
          shape: '00',
          cover: 35,
          nLinks: Math.ceil(config.length / 0.2) || 30,
          linkDia: 8,
          linkSpacing: 200,
        };
      case 'calc_section':
        return {
          sectionType: config.sectionType || 'rectangle',
          b: config.b || 200,
          h: config.h || 400,
          tf: config.tf || 12,
          tw: config.tw || 7,
        };
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

      formGrid.appendChild(_cbField(f.label, inputEl));
    });

    wrap.appendChild(formGrid);

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
    container.appendChild(card);

    // ── Engineering diagram section ───────────────────────────────────────
    _drawBlockDiagram(block, container);
  }

  // ── SVG Engineering Diagrams ─────────────────────────────────────────────

  /**
   * Draw inline SVG engineering diagram after calculation results.
   * Dispatches to per-type renderers. For calc_beam and calc_rc_beam,
   * renders tabbed BMD/SFD/deflection using the existing BeamDiagrams engine
   * (lazy-loaded). All others use lightweight static SVG drawings.
   */
  function _drawBlockDiagram(block, container) {
    const type = block.type;
    const r    = block.results;
    const cfg  = block.config;
    if (!r || !r._ran) return;

    // Types that get the full tabbed BeamDiagrams engine
    const BEAM_TYPES = ['calc_beam', 'calc_rc_beam'];

    if (BEAM_TYPES.includes(type)) {
      _renderBeamDiagramTabs(block, container);
      return;
    }

    // All other calc types get a clean static SVG
    const section = _el('div', { className: 'cb-diagram-section' });
    section.appendChild(_el('div', { className: 'cb-diagram-label' }, _diagramLabelFor(type)));
    const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgEl.setAttribute('viewBox', '0 0 400 130');
    svgEl.setAttribute('class', 'cb-static-diagram');
    svgEl.innerHTML = _staticDiagramSVG(type, cfg, r);
    section.appendChild(svgEl);
    container.appendChild(section);
  }

  function _diagramLabelFor(type) {
    const labels = {
      calc_column:      'Column Diagram',
      calc_rc_column:   'RC Column Cross-Section',
      calc_slab:        'Slab Plan Diagram',
      calc_footing:     'Pad Footing Diagram',
      calc_retaining:   'Retaining Wall Profile',
      calc_connection:  'Connection Diagram',
      calc_timber_col:  'Timber Column Diagram',
      calc_steel_member:'Steel Member Diagram',
      calc_wind:        'Wind Pressure Diagram',
      calc_load_takedown:'Load Takedown Diagram',
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
    const xs = Array.from({ length: n }, (_, i) => (i / (n - 1)) * span);

    let M, V, deflection;

    if (r.xs && r.M && r.xs.length > 0) {
      // Solver returned diagram data — use directly
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

  // ── Static SVG diagrams for non-beam block types ─────────────────────────

  function _staticDiagramSVG(type, cfg, r) {
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
      default:
        return _svgGeneric(cfg, r);
    }
  }

  // Arrow marker def (reused by all static SVGs)
  const _SVG_DEFS = `
    <defs>
      <marker id="arr-down" markerWidth="6" markerHeight="6" refX="3" refY="0" orient="auto">
        <path d="M0,0 L3,5 L6,0 Z" fill="#EF4444"/>
      </marker>
      <marker id="arr-up" markerWidth="6" markerHeight="6" refX="3" refY="5" orient="auto">
        <path d="M0,5 L3,0 L6,5 Z" fill="#2563EB"/>
      </marker>
      <marker id="arr-right" markerWidth="6" markerHeight="6" refX="0" refY="3" orient="auto">
        <path d="M0,0 L5,3 L0,6 Z" fill="#EF4444"/>
      </marker>
    </defs>`;

  function _svgColumn(cfg, r) {
    const NEd    = r.NEd || cfg.NEd || 500;
    const length = cfg.length || cfg.span || 3.5;
    const util   = r.utilisation || r.bucklingUtil || 0;
    const pass   = r.bucklingPass !== false && util <= 1;
    const utilPct = (util * 100).toFixed(0);
    const utilColor = pass ? '#10B981' : '#EF4444';
    return `${_SVG_DEFS}
      <!-- Ground -->
      <rect x="170" y="115" width="60" height="8" fill="#374151" rx="2" opacity="0.6"/>
      <line x1="155" y1="123" x2="245" y2="123" stroke="#374151" stroke-width="1.5" opacity="0.4"/>
      <!-- Column -->
      <rect x="188" y="18" width="24" height="97" fill="#4F46E5" rx="3"/>
      <!-- Fixed base hatch -->
      ${[0,1,2,3,4].map(i=>`<line x1="${155+i*16}" y1="123" x2="${147+i*16}" y2="132" stroke="#374151" stroke-width="1.5" opacity="0.4"/>`).join('')}
      <!-- Axial load arrow + label -->
      <line x1="200" y1="5" x2="200" y2="18" stroke="#EF4444" stroke-width="2.5" marker-end="url(#arr-down)"/>
      <text x="210" y="14" font-size="11" fill="#EF4444" font-family="Inter,sans-serif" font-weight="600">${+NEd.toFixed(0)} kN</text>
      <!-- Height label -->
      <line x1="160" y1="18" x2="160" y2="115" stroke="#6B7280" stroke-width="1" stroke-dasharray="3,3"/>
      <text x="155" y="70" font-size="10" fill="#6B7280" font-family="Inter,sans-serif" text-anchor="middle" transform="rotate(-90,155,70)">L = ${+length.toFixed(1)}m</text>
      <!-- Utilisation -->
      <rect x="320" y="45" width="70" height="42" rx="6" fill="${pass?'#ECFDF5':'#FEF2F2'}" stroke="${pass?'#BBF7D0':'#FECACA'}" stroke-width="1.5"/>
      <text x="355" y="63" font-size="16" font-weight="800" fill="${utilColor}" text-anchor="middle" font-family="'JetBrains Mono',monospace">${utilPct}%</text>
      <text x="355" y="79" font-size="10" fill="#6B7280" text-anchor="middle" font-family="Inter,sans-serif">${pass?'PASS':'FAIL'}</text>`;
  }

  function _svgRCColumn(cfg, r) {
    const b    = cfg.b || 300;
    const h    = cfg.h || 300;
    const aspect = Math.min(h / b, 2);
    const bw = 70, bh = Math.round(70 * aspect);
    const bx = 200 - bw / 2, by = 65 - bh / 2;
    const cover = 8;
    const util  = r.utilisation || r.overallUtil || 0;
    const pass  = r.overallPass !== false && util <= 1;
    const utilColor = pass ? '#10B981' : '#EF4444';

    // Corner rebar dots
    const rebarR = 4;
    const corners = [
      [bx + cover, by + cover], [bx + bw - cover, by + cover],
      [bx + cover, by + bh - cover], [bx + bw - cover, by + bh - cover],
    ];
    if (bw > 50) {
      corners.push([bx + bw / 2, by + cover], [bx + bw / 2, by + bh - cover]);
    }
    const dots = corners.map(([cx, cy]) =>
      `<circle cx="${cx}" cy="${cy}" r="${rebarR}" fill="#DC2626" opacity="0.9"/>`
    ).join('');

    return `${_SVG_DEFS}
      <!-- Section box -->
      <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="#E0E7FF" stroke="#4F46E5" stroke-width="2" rx="2"/>
      <!-- Cover line -->
      <rect x="${bx+cover/2}" y="${by+cover/2}" width="${bw-cover}" height="${bh-cover}" fill="none" stroke="#818CF8" stroke-width="1" stroke-dasharray="3,3"/>
      <!-- Rebar -->
      ${dots}
      <!-- Dimension labels -->
      <text x="${bx + bw/2}" y="${by + bh + 18}" text-anchor="middle" font-size="10" fill="#374151" font-family="Inter,sans-serif">b = ${b}mm</text>
      <text x="${bx - 14}" y="${by + bh/2 + 4}" text-anchor="middle" font-size="10" fill="#374151" font-family="Inter,sans-serif" transform="rotate(-90,${bx-14},${by+bh/2+4})">h = ${h}mm</text>
      <!-- Utilisation badge -->
      <rect x="318" y="45" width="72" height="42" rx="6" fill="${pass?'#ECFDF5':'#FEF2F2'}" stroke="${pass?'#BBF7D0':'#FECACA'}" stroke-width="1.5"/>
      <text x="354" y="63" font-size="16" font-weight="800" fill="${utilColor}" text-anchor="middle" font-family="'JetBrains Mono',monospace">${(util*100).toFixed(0)}%</text>
      <text x="354" y="79" font-size="10" fill="#6B7280" text-anchor="middle" font-family="Inter,sans-serif">${pass?'PASS':'FAIL'}</text>`;
  }

  function _svgSlab(cfg, r) {
    const lx   = cfg.lx || 4;
    const ly   = cfg.ly || 5;
    const util = r.utilisation || r.bendingUtil || 0;
    const pass = r.overallPass !== false && util <= 1;
    const utilColor = pass ? '#10B981' : '#EF4444';
    const ratio = Math.min(lx / ly, ly / lx);
    const slabW = 160, slabH = Math.round(160 * ratio);
    const sx = 110, sy = 65 - slabH / 2;

    // Rebar grid lines
    const nBarsX = 5, nBarsY = 4;
    let bars = '';
    for (let i = 1; i < nBarsX; i++) {
      const x = sx + (i / nBarsX) * slabW;
      bars += `<line x1="${x}" y1="${sy}" x2="${x}" y2="${sy + slabH}" stroke="#EF4444" stroke-width="1" opacity="0.6"/>`;
    }
    for (let i = 1; i < nBarsY; i++) {
      const y = sy + (i / nBarsY) * slabH;
      bars += `<line x1="${sx}" y1="${y}" x2="${sx + slabW}" y2="${y}" stroke="#DC2626" stroke-width="1" opacity="0.45"/>`;
    }

    return `${_SVG_DEFS}
      <!-- Slab rectangle (plan view) -->
      <rect x="${sx}" y="${sy}" width="${slabW}" height="${slabH}" fill="#DBEAFE" stroke="#2563EB" stroke-width="2" rx="2"/>
      ${bars}
      <!-- Dimension arrows -->
      <line x1="${sx}" y1="${sy + slabH + 14}" x2="${sx + slabW}" y2="${sy + slabH + 14}" stroke="#374151" stroke-width="1.5" marker-start="url(#arr-right)" marker-end="url(#arr-right)"/>
      <text x="${sx + slabW/2}" y="${sy + slabH + 28}" text-anchor="middle" font-size="10" fill="#374151" font-family="Inter,sans-serif">lx = ${lx}m</text>
      <text x="${sx - 18}" y="${sy + slabH/2 + 4}" text-anchor="middle" font-size="10" fill="#374151" font-family="Inter,sans-serif" transform="rotate(-90,${sx-18},${sy+slabH/2+4})">ly = ${ly}m</text>
      <!-- Utilisation -->
      <rect x="7" y="44" width="72" height="42" rx="6" fill="${pass?'#ECFDF5':'#FEF2F2'}" stroke="${pass?'#BBF7D0':'#FECACA'}" stroke-width="1.5"/>
      <text x="43" y="62" font-size="16" font-weight="800" fill="${utilColor}" text-anchor="middle" font-family="'JetBrains Mono',monospace">${(util*100).toFixed(0)}%</text>
      <text x="43" y="78" font-size="10" fill="#6B7280" text-anchor="middle" font-family="Inter,sans-serif">${pass?'PASS':'FAIL'}</text>`;
  }

  function _svgFooting(cfg, r) {
    const B      = r.B || 1.5;
    const col    = cfg.columnW || 300;
    const fThick = cfg.footThick || 500;
    const pass   = r.bearingPass !== false && (r.overallPass !== false);
    const utilColor = pass ? '#10B981' : '#EF4444';
    const util   = r.bearingUtil || r.utilisation || 0;

    // Scale: footing width → ~160px
    const scale = 160 / (B * 1000);   // pixels per mm
    const footW = 160;
    const footH = Math.max(20, Math.round(fThick * scale * 0.7));
    const colW  = Math.max(12, Math.round(col * scale));
    const fx = 120, fy = 85;
    const cx = fx + footW / 2 - colW / 2;

    // Soil pressure arrows below footing
    const nArr = 7;
    let soilArrows = '';
    for (let i = 0; i <= nArr; i++) {
      const ax = fx + (i / nArr) * footW;
      soilArrows += `<line x1="${ax}" y1="${fy + footH}" x2="${ax}" y2="${fy + footH + 20}" stroke="#D97706" stroke-width="1.5" marker-end="url(#arr-down)"/>`;
    }

    return `${_SVG_DEFS}
      <!-- Column -->
      <rect x="${cx}" y="${fy - 40}" width="${colW}" height="40" fill="#4F46E5" rx="2"/>
      <!-- Footing -->
      <rect x="${fx}" y="${fy}" width="${footW}" height="${footH}" fill="#93C5FD" stroke="#2563EB" stroke-width="2" rx="2"/>
      <!-- Soil pressure arrows -->
      ${soilArrows}
      <!-- Ground line -->
      <line x1="${fx - 10}" y1="${fy + footH + 22}" x2="${fx + footW + 10}" y2="${fy + footH + 22}" stroke="#92400E" stroke-width="1.5" opacity="0.5"/>
      <!-- Load arrow at top -->
      <line x1="${fx + footW/2}" y1="8" x2="${fx + footW/2}" y2="${fy - 40}" stroke="#EF4444" stroke-width="2.5" marker-end="url(#arr-down)"/>
      <!-- Dimension label -->
      <text x="${fx + footW/2}" y="${fy + footH + 38}" text-anchor="middle" font-size="10" fill="#374151" font-family="Inter,sans-serif">B = ${B.toFixed(2)}m × ${B.toFixed(2)}m</text>
      <!-- Utilisation -->
      <rect x="7" y="44" width="78" height="42" rx="6" fill="${pass?'#ECFDF5':'#FEF2F2'}" stroke="${pass?'#BBF7D0':'#FECACA'}" stroke-width="1.5"/>
      <text x="46" y="62" font-size="16" font-weight="800" fill="${utilColor}" text-anchor="middle" font-family="'JetBrains Mono',monospace">${(util*100).toFixed(0)}%</text>
      <text x="46" y="78" font-size="10" fill="#6B7280" text-anchor="middle" font-family="Inter,sans-serif">${pass?'PASS':'FAIL'}</text>`;
  }

  function _svgRetaining(cfg, r) {
    const H     = cfg.H || 3;
    const pass  = r.overallPass !== false && (r.overturningPass !== false) && (r.slidingPass !== false);
    const utilColor = pass ? '#10B981' : '#EF4444';
    const util  = r.overallUtil || r.slidingUtil || 0;

    // Geometry in SVG coords
    const baseX = 100, baseY = 110;
    const wallH = 80, wallThick = 16;
    const baseW = 110, baseH = 14;
    const toeSlab = Math.round(baseW * 0.25);

    // Earth pressure arrows (horizontal, on retained side = right of wall)
    const nEarth = 5;
    let earthArrows = '';
    for (let i = 0; i < nEarth; i++) {
      const ay = baseY - wallH + (i / (nEarth - 1)) * wallH;
      const len = 18 + i * 4; // larger at bottom
      earthArrows += `<line x1="${baseX + baseW - toeSlab + len}" y1="${ay}" x2="${baseX + baseW - toeSlab}" y2="${ay}" stroke="#D97706" stroke-width="1.5" marker-end="url(#arr-right)"/>`;
    }

    return `${_SVG_DEFS}
      <!-- Base slab -->
      <rect x="${baseX - toeSlab}" y="${baseY}" width="${baseW}" height="${baseH}" fill="#93C5FD" stroke="#2563EB" stroke-width="1.5" rx="1"/>
      <!-- Wall stem -->
      <rect x="${baseX - toeSlab}" y="${baseY - wallH}" width="${wallThick}" height="${wallH}" fill="#60A5FA" stroke="#2563EB" stroke-width="1.5" rx="1"/>
      <!-- Ground line (retained side) -->
      <line x1="${baseX - toeSlab + wallThick}" y1="${baseY}" x2="${baseX + baseW - toeSlab + 30}" y2="${baseY}" stroke="#92400E" stroke-width="1.5" opacity="0.55"/>
      <!-- Fill hatch (retained side) -->
      ${[0,1,2,3,4,5].map(i => {
        const hx = baseX - toeSlab + wallThick + i * 14;
        return `<line x1="${hx}" y1="${baseY - 2}" x2="${hx - 10}" y2="${baseY - wallH + 2}" stroke="#D97706" stroke-width="1" opacity="0.25"/>`;
      }).join('')}
      <!-- Earth pressure arrows -->
      ${earthArrows}
      <!-- Ground line (toe side) -->
      <line x1="${baseX - toeSlab - 20}" y1="${baseY + baseH}" x2="${baseX - toeSlab + wallThick + 5}" y2="${baseY + baseH}" stroke="#374151" stroke-width="1.5" opacity="0.4"/>
      <!-- Height label -->
      <text x="${baseX - toeSlab - 14}" y="${baseY - wallH/2 + 4}" text-anchor="middle" font-size="10" fill="#374151" font-family="Inter,sans-serif" transform="rotate(-90,${baseX - toeSlab - 14},${baseY - wallH/2 + 4})">H = ${H}m</text>
      <!-- Utilisation badge -->
      <rect x="305" y="44" width="80" height="42" rx="6" fill="${pass?'#ECFDF5':'#FEF2F2'}" stroke="${pass?'#BBF7D0':'#FECACA'}" stroke-width="1.5"/>
      <text x="345" y="62" font-size="16" font-weight="800" fill="${utilColor}" text-anchor="middle" font-family="'JetBrains Mono',monospace">${(util*100).toFixed(0)}%</text>
      <text x="345" y="78" font-size="10" fill="#6B7280" text-anchor="middle" font-family="Inter,sans-serif">${pass?'PASS':'FAIL'}</text>`;
  }

  function _svgConnection(cfg, r) {
    const VEd   = cfg.VEd || 150;
    const nBolts = cfg.nBolts || 4;
    const pass  = r.shearPass !== false && r.overallPass !== false;
    const utilColor = pass ? '#10B981' : '#EF4444';
    const util  = r.shearUtil || r.utilisation || 0;

    // Two plates with bolt holes
    const px = 120, py = 25;
    const plateW = 50, plateH = 80;

    // Bolt positions in a column
    const boltSpacing = plateH / (nBolts + 1);
    let bolts = '';
    for (let i = 0; i < Math.min(nBolts, 6); i++) {
      const by = py + boltSpacing * (i + 1);
      bolts += `<circle cx="${px + plateW/2}" cy="${by}" r="5" fill="none" stroke="#374151" stroke-width="1.5"/>`;
      bolts += `<circle cx="${px + plateW/2}" cy="${by}" r="2" fill="#374151"/>`;
      bolts += `<circle cx="${px + plateW + 40 + plateW/2}" cy="${by}" r="5" fill="none" stroke="#374151" stroke-width="1.5"/>`;
      bolts += `<circle cx="${px + plateW + 40 + plateW/2}" cy="${by}" r="2" fill="#374151"/>`;
    }

    return `${_SVG_DEFS}
      <!-- Left plate (web/flange) -->
      <rect x="${px}" y="${py}" width="${plateW}" height="${plateH}" fill="#C7D2FE" stroke="#4F46E5" stroke-width="2" rx="2"/>
      <!-- Right plate (end plate) -->
      <rect x="${px + plateW + 40}" y="${py}" width="${plateW}" height="${plateH}" fill="#C7D2FE" stroke="#4F46E5" stroke-width="2" rx="2"/>
      <!-- Gap -->
      <line x1="${px + plateW + 2}" y1="${py + plateH/2}" x2="${px + plateW + 38}" y2="${py + plateH/2}" stroke="#374151" stroke-width="1" stroke-dasharray="4,3"/>
      <!-- Bolts -->
      ${bolts}
      <!-- Shear arrow -->
      <line x1="${px - 5}" y1="${py + plateH/2}" x2="${px + plateW + 45 + plateW + 5}" y2="${py + plateH/2}" stroke="#EF4444" stroke-width="2" stroke-dasharray="6,3" opacity="0.6"/>
      <text x="${px + plateW + 20}" y="${py + plateH + 20}" text-anchor="middle" font-size="10" fill="#374151" font-family="Inter,sans-serif">VEd = ${VEd} kN  /  ${nBolts} bolts</text>
      <!-- Utilisation -->
      <rect x="318" y="44" width="72" height="42" rx="6" fill="${pass?'#ECFDF5':'#FEF2F2'}" stroke="${pass?'#BBF7D0':'#FECACA'}" stroke-width="1.5"/>
      <text x="354" y="62" font-size="16" font-weight="800" fill="${utilColor}" text-anchor="middle" font-family="'JetBrains Mono',monospace">${(util*100).toFixed(0)}%</text>
      <text x="354" y="78" font-size="10" fill="#6B7280" text-anchor="middle" font-family="Inter,sans-serif">${pass?'PASS':'FAIL'}</text>`;
  }

  function _svgSteelMember(cfg, r) {
    const span  = cfg.Lcr || 4;
    const MEd   = r.MEd || cfg.MEd || 80;
    const util  = r.utilisation || r.combinedUtil || 0;
    const pass  = r.overallPass !== false && util <= 1;
    const utilColor = pass ? '#10B981' : '#EF4444';

    // I-section cross-section (small) + member with parabolic BMD
    const mx = 30, my = 30, mw = 200, mh = 14;
    const baseY = my + mh;

    // Parabolic BMD below
    const n = 20;
    const bmdH = 40;
    const bmdPts = Array.from({ length: n + 1 }, (_, i) => {
      const xr = i / n;
      const bx = mx + xr * mw;
      const by = baseY + bmdH * 4 * xr * (1 - xr);
      return `${bx},${by}`;
    });
    const bmdPath = `M${mx},${baseY} L${bmdPts.join(' L')} L${mx+mw},${baseY} Z`;

    return `${_SVG_DEFS}
      <!-- Member -->
      <rect x="${mx}" y="${my}" width="${mw}" height="${mh}" fill="#4F46E5" rx="3"/>
      <!-- Pin support left -->
      <polygon points="${mx},${baseY} ${mx-10},${baseY+16} ${mx+10},${baseY+16}" fill="none" stroke="#D97706" stroke-width="1.5"/>
      <line x1="${mx-12}" y1="${baseY+17}" x2="${mx+12}" y2="${baseY+17}" stroke="#D97706" stroke-width="1.5"/>
      <!-- Roller support right -->
      <polygon points="${mx+mw},${baseY} ${mx+mw-10},${baseY+16} ${mx+mw+10},${baseY+16}" fill="none" stroke="#D97706" stroke-width="1.5"/>
      <circle cx="${mx+mw-8}" cy="${baseY+20}" r="3" fill="none" stroke="#D97706" stroke-width="1.5"/>
      <circle cx="${mx+mw+8}" cy="${baseY+20}" r="3" fill="none" stroke="#D97706" stroke-width="1.5"/>
      <!-- BMD -->
      <path d="${bmdPath}" fill="rgba(79,70,229,0.25)" stroke="#4F46E5" stroke-width="1.5"/>
      <!-- Labels -->
      <text x="${mx + mw/2}" y="${baseY + bmdH/2 + 15}" text-anchor="middle" font-size="10" fill="#4338CA" font-family="'JetBrains Mono',monospace">MEd = ${MEd.toFixed?MEd.toFixed(1):MEd} kNm</text>
      <text x="${mx + mw/2}" y="${baseY + bmdH + 28}" text-anchor="middle" font-size="10" fill="#6B7280" font-family="Inter,sans-serif">L = ${span}m</text>
      <!-- Utilisation -->
      <rect x="316" y="44" width="74" height="42" rx="6" fill="${pass?'#ECFDF5':'#FEF2F2'}" stroke="${pass?'#BBF7D0':'#FECACA'}" stroke-width="1.5"/>
      <text x="353" y="62" font-size="16" font-weight="800" fill="${utilColor}" text-anchor="middle" font-family="'JetBrains Mono',monospace">${(util*100).toFixed(0)}%</text>
      <text x="353" y="78" font-size="10" fill="#6B7280" text-anchor="middle" font-family="Inter,sans-serif">${pass?'PASS':'FAIL'}</text>`;
  }

  function _svgWind(cfg, r) {
    const h    = cfg.h || 10;
    const qp   = r.qp || r.q_peak || 0;
    const we   = r.we || r.windPressure || qp * 0.8;
    const pass = r.overallPass !== false;

    // Building elevation rectangle with pressure arrows on windward face
    const bx = 120, by = 20, bw = 80, bh = 90;
    const nArrows = 6;
    let arrows = '';
    for (let i = 0; i < nArrows; i++) {
      const ay = by + (i / (nArrows - 1)) * bh;
      const len = 28;
      arrows += `<line x1="${bx - len}" y1="${ay}" x2="${bx - 2}" y2="${ay}" stroke="#EF4444" stroke-width="1.5" marker-end="url(#arr-right)"/>`;
    }

    return `${_SVG_DEFS}
      <!-- Building -->
      <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="#DBEAFE" stroke="#2563EB" stroke-width="2" rx="2"/>
      <!-- Roof -->
      <polygon points="${bx-4},${by} ${bx+bw/2},${by-20} ${bx+bw+4},${by}" fill="#BFDBFE" stroke="#2563EB" stroke-width="1.5"/>
      <!-- Ground line -->
      <line x1="${bx-50}" y1="${by+bh+2}" x2="${bx+bw+30}" y2="${by+bh+2}" stroke="#374151" stroke-width="2" opacity="0.5"/>
      ${[0,1,2,3,4].map(i=>`<line x1="${bx-50+i*25}" y1="${by+bh+2}" x2="${bx-60+i*25}" y2="${by+bh+12}" stroke="#374151" stroke-width="1.5" opacity="0.3"/>`).join('')}
      <!-- Wind arrows -->
      ${arrows}
      <!-- Wind label -->
      <text x="${bx - 40}" y="${by + bh/2 + 16}" text-anchor="middle" font-size="10" fill="#EF4444" font-family="Inter,sans-serif" transform="rotate(-90,${bx-40},${by+bh/2+16})">Wind →</text>
      <!-- Height label -->
      <text x="${bx + bw + 18}" y="${by + bh/2 + 4}" font-size="10" fill="#374151" font-family="Inter,sans-serif">h=${h}m</text>
      <!-- Peak pressure badge -->
      <rect x="285" y="38" width="105" height="54" rx="6" fill="#FFF7ED" stroke="#FED7AA" stroke-width="1.5"/>
      <text x="337" y="56" font-size="10" fill="#92400E" text-anchor="middle" font-family="Inter,sans-serif">qp(z)</text>
      <text x="337" y="74" font-size="15" font-weight="800" fill="#B45309" text-anchor="middle" font-family="'JetBrains Mono',monospace">${(qp).toFixed?qp.toFixed(2):qp}</text>
      <text x="337" y="87" font-size="10" fill="#92400E" text-anchor="middle" font-family="Inter,sans-serif">kN/m²</text>`;
  }

  function _svgLoadTakedown(cfg, r) {
    const nFloors = Math.min(cfg.nFloors || 3, 6);
    const totalN  = r.totalN || r.N_foundation || 0;
    const pass    = r.overallPass !== false;
    const utilColor = pass ? '#10B981' : '#EF4444';

    // Stack of floor slabs
    const slabH = 12, gap = 22;
    const startY = 20, cx = 200;
    const slabW = 120;

    let floors = '';
    for (let i = 0; i < nFloors; i++) {
      const sy = startY + i * (slabH + gap);
      const isRoof = i === 0;
      floors += `<rect x="${cx - slabW/2}" y="${sy}" width="${slabW}" height="${slabH}" fill="${isRoof?'#A7F3D0':'#BFDBFE'}" stroke="${isRoof?'#10B981':'#2563EB'}" stroke-width="1.5" rx="2"/>`;
      floors += `<text x="${cx}" y="${sy + slabH/2 + 4}" text-anchor="middle" font-size="9" fill="#374151" font-family="Inter,sans-serif">${isRoof?'Roof':'Floor ' + i}</text>`;
      // Column stub below
      if (i < nFloors - 1) {
        floors += `<line x1="${cx}" y1="${sy+slabH}" x2="${cx}" y2="${sy+slabH+gap}" stroke="#4F46E5" stroke-width="3"/>`;
      }
    }

    // Foundation
    const foundY = startY + nFloors * (slabH + gap) - gap + slabH + 4;
    floors += `<rect x="${cx - 70}" y="${foundY}" width="140" height="16" fill="#93C5FD" stroke="#2563EB" stroke-width="2" rx="2"/>`;
    // Accumulating load arrow
    floors += `<line x1="${cx}" y1="${foundY+16}" x2="${cx}" y2="${foundY+34}" stroke="#EF4444" stroke-width="2.5" marker-end="url(#arr-down)"/>`;
    floors += `<text x="${cx+8}" y="${foundY+30}" font-size="10" fill="#EF4444" font-family="'JetBrains Mono',monospace">N=${totalN.toFixed?totalN.toFixed(0):totalN} kN</text>`;

    return `${_SVG_DEFS}${floors}`;
  }

  function _svgGeneric(cfg, r) {
    const util  = r.utilisation || r.overallUtil || 0;
    const pass  = r.overallPass !== false && util <= 1;
    const utilColor = pass ? '#10B981' : '#EF4444';
    return `${_SVG_DEFS}
      <rect x="140" y="35" width="120" height="60" rx="8" fill="#F1F5F9" stroke="#CBD5E1" stroke-width="1.5"/>
      <text x="200" y="62" text-anchor="middle" font-size="13" font-weight="700" fill="${utilColor}" font-family="'JetBrains Mono',monospace">${pass?'✓ PASS':'✗ FAIL'}</text>
      <text x="200" y="82" text-anchor="middle" font-size="11" fill="#6B7280" font-family="Inter,sans-serif">η = ${(util*100).toFixed(1)}%</text>`;
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

    const aiBtn = _el('button', { className: 'btn-ai-draft' }, '✨ AI Draft — Coming soon');
    aiBtn.disabled = true;
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

  return { ALL_BLOCKS, render, renderPreview, getDefinition, _extractChecks, _esc, CALC_CODES };

})();

window.BlockRegistry = BlockRegistry;
if (typeof module !== 'undefined') module.exports = BlockRegistry;
