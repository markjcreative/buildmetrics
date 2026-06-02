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
    'calc_bbs':          { src: '/js/engine/bbsSolver.js',          global: 'BbsSolver' },
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

  function _inputRow(label, inputEl) {
    const row = _el('div', { className: 'block-form-row' });
    row.appendChild(_el('label', { className: 'block-form-label' }, label));
    row.appendChild(inputEl);
    return row;
  }

  function _textInput(value, placeholder, onChange) {
    const inp = _el('input', { type: 'text', className: 'block-input', value: value || '', placeholder: placeholder || '' });
    inp.addEventListener('input', () => onChange(inp.value));
    return inp;
  }

  function _numberInput(value, onChange) {
    const inp = _el('input', { type: 'number', className: 'block-input', value: value != null ? value : '', step: 'any' });
    inp.addEventListener('input', () => onChange(parseFloat(inp.value) || 0));
    return inp;
  }

  function _selectInput(value, options, onChange) {
    const sel = _el('select', { className: 'block-select' });
    options.forEach(opt => {
      const o = _el('option', { value: opt }, opt);
      if (String(opt) === String(value)) o.selected = true;
      sel.appendChild(o);
    });
    sel.addEventListener('change', () => onChange(sel.value));
    return sel;
  }

  function _textarea(value, placeholder, onChange) {
    const ta = _el('textarea', { className: 'block-textarea', placeholder: placeholder || '', rows: 4 });
    ta.value = value || '';
    ta.addEventListener('input', () => {
      ta.style.height = 'auto';
      ta.style.height = ta.scrollHeight + 'px';
      onChange(ta.value);
    });
    return ta;
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

    // Inputs form
    const formGrid = _el('div', { className: 'calc-block-fields' });
    fields.forEach(f => {
      const cfg = block.config;
      let inputEl;
      if (f.type === 'select') {
        inputEl = _selectInput(cfg[f.key] != null ? cfg[f.key] : f.default, f.options, val => {
          block.config[f.key] = val;
          _dispatch(formGrid, block.id);
        });
      } else if (f.type === 'number') {
        inputEl = _numberInput(cfg[f.key] != null ? cfg[f.key] : f.default, val => {
          block.config[f.key] = val;
          _dispatch(formGrid, block.id);
        });
      } else {
        inputEl = _textInput(cfg[f.key] != null ? cfg[f.key] : f.default, '', val => {
          block.config[f.key] = val;
          _dispatch(formGrid, block.id);
        });
      }
      // Ensure default is set in config
      if (cfg[f.key] == null) block.config[f.key] = f.default;
      formGrid.appendChild(_inputRow(f.label, inputEl));
    });
    wrap.appendChild(formGrid);

    // Action row
    const actionRow = _el('div', { className: 'calc-block-actions' });
    const calcBtn = _el('button', { className: 'btn-calc-run' }, '▶ Calculate');
    const statusSpan = _el('span', { className: 'calc-status-msg' });
    actionRow.appendChild(calcBtn);
    actionRow.appendChild(statusSpan);
    wrap.appendChild(actionRow);

    // Results area
    const resultsDiv = _el('div', { className: 'calc-block-results' });
    wrap.appendChild(resultsDiv);

    // Render existing results if present
    if (block.results && block.results._ran) {
      _renderCalcResults(block, resultsDiv);
    }

    // Calculate button handler
    calcBtn.addEventListener('click', async () => {
      calcBtn.disabled = true;
      calcBtn.textContent = '⏳ Calculating…';
      statusSpan.textContent = '';
      try {
        const res = await _runCalc(block);
        block.results = { ...res, _ran: true };
        block.validated = true;
        _renderCalcResults(block, resultsDiv);
        _dispatch(wrap, block.id);
        statusSpan.textContent = '';
      } catch (err) {
        statusSpan.textContent = '⚠ Error: ' + err.message;
        console.error('Calc error', block.type, err);
      } finally {
        calcBtn.disabled = false;
        calcBtn.textContent = '▶ Calculate';
      }
    });

    return wrap;
  }

  function _renderCalcResults(block, container) {
    container.innerHTML = '';
    const r = block.results;
    if (!r || !r._ran) return;

    // Determine overall pass/fail
    const checks = _extractChecks(block);
    const allPass = checks.length === 0 || checks.every(c => c.pass);

    // Status chip
    const chip = _el('div', {
      className: 'calc-result-chip ' + (allPass ? 'chip-pass' : 'chip-fail'),
      innerHTML: allPass ? '✓ PASS' : '✗ FAIL',
    });
    container.appendChild(chip);

    // Key results row
    const keyVals = _getKeyResults(block);
    if (keyVals.length) {
      const kRow = _el('div', { className: 'calc-key-results' });
      keyVals.forEach(kv => {
        const item = _el('div', { className: 'calc-kv-item' });
        item.appendChild(_el('span', { className: 'calc-kv-label' }, kv.label));
        item.appendChild(_el('span', { className: 'calc-kv-value' }, String(kv.value) + (kv.unit ? ' ' + kv.unit : '')));
        kRow.appendChild(item);
      });
      container.appendChild(kRow);
    }

    // Collapsible details
    const detailsWrap = _el('details', { className: 'calc-details-wrap' });
    const detailsSummary = _el('summary', {}, 'View all results');
    detailsWrap.appendChild(detailsSummary);
    const detailsBody = _el('div', { className: 'calc-details-body' });

    // Render all result keys as a table
    const table = _el('table', { className: 'calc-detail-table' });
    Object.entries(r).forEach(([k, v]) => {
      if (k === '_ran') return;
      if (typeof v === 'object') return; // skip nested objects in detail table
      const row = _el('tr');
      row.appendChild(_el('td', { className: 'calc-dt-key' }, k));
      row.appendChild(_el('td', { className: 'calc-dt-val' }, String(typeof v === 'number' ? v.toFixed(3) : v)));
      table.appendChild(row);
    });
    detailsBody.appendChild(table);
    detailsWrap.appendChild(detailsBody);
    container.appendChild(detailsWrap);
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
    const wrap = _el('div', { className: 'block-form-wrap' });
    const cfg = block.config;

    wrap.appendChild(_inputRow('Report Title',
      _textInput(cfg.title, 'e.g. Structural Calculations — New Residential Block', v => { cfg.title = v; _dispatch(wrap, block.id); })
    ));
    wrap.appendChild(_inputRow('Report Reference',
      _textInput(cfg.ref, 'e.g. MJC-2024-001', v => { cfg.ref = v; _dispatch(wrap, block.id); })
    ));
    wrap.appendChild(_inputRow('Date',
      (() => {
        const inp = _el('input', { type: 'date', className: 'block-input', value: cfg.date || new Date().toISOString().split('T')[0] });
        inp.addEventListener('input', () => { cfg.date = inp.value; _dispatch(wrap, block.id); });
        return inp;
      })()
    ));
    wrap.appendChild(_inputRow('Revision',
      _textInput(cfg.revision || 'Rev A', 'e.g. Rev A', v => { cfg.revision = v; _dispatch(wrap, block.id); })
    ));
    return wrap;
  }

  function _renderProjectInfo(block) {
    const wrap = _el('div', { className: 'block-form-wrap block-form-two-col' });
    const cfg = block.config;

    const projectTypes = ['Residential','Commercial','Industrial','Infrastructure','Retrofit / Refurbishment','Healthcare','Education','Mixed-Use','Leisure','Hospitality','Data Centre','Utilities','Transport','Cultural','Public Realm','Agricultural','Marine','Energy / Power','Defence','Other'];
    const designCodes = ['Eurocode (EC2/EC3/EC5)','BS 5950 (Steel)','BS 8110 (Concrete)','ACI 318 (Concrete)','AISC 360 (Steel)','AS 4100 (Steel)','AS 3600 (Concrete)','NZS 3404 (Steel)','IS 800 (Steel)','Other'];

    const fields = [
      { key: 'projectName',   label: 'Project Name',    type: 'text',   ph: 'e.g. 32 High Street' },
      { key: 'clientName',    label: 'Client Name',     type: 'text',   ph: 'e.g. Smith Developments' },
      { key: 'location',      label: 'Location',        type: 'text',   ph: 'e.g. London, UK' },
      { key: 'projectType',   label: 'Project Type',    type: 'select', options: projectTypes },
      { key: 'engineerName',  label: 'Engineer Name',   type: 'text',   ph: 'Full name' },
      { key: 'designCode',    label: 'Design Code',     type: 'select', options: designCodes },
      { key: 'companyName',   label: 'Company Name',    type: 'text',   ph: 'Engineering firm' },
      { key: 'date',          label: 'Date',            type: 'date' },
    ];

    fields.forEach(f => {
      let inputEl;
      if (f.type === 'select') {
        inputEl = _selectInput(cfg[f.key], f.options, v => { cfg[f.key] = v; _dispatch(wrap, block.id); });
        if (!cfg[f.key]) cfg[f.key] = f.options[0];
      } else if (f.type === 'date') {
        inputEl = _el('input', { type: 'date', className: 'block-input', value: cfg[f.key] || new Date().toISOString().split('T')[0] });
        inputEl.addEventListener('input', () => { cfg[f.key] = inputEl.value; _dispatch(wrap, block.id); });
      } else {
        inputEl = _textInput(cfg[f.key], f.ph, v => { cfg[f.key] = v; _dispatch(wrap, block.id); });
      }
      wrap.appendChild(_inputRow(f.label, inputEl));
    });
    return wrap;
  }

  function _renderDesignBasis(block) {
    const wrap = _el('div', { className: 'block-form-wrap' });
    const cfg = block.config;

    if (!cfg.text) cfg.text = 'This calculation has been prepared in accordance with the relevant design code. All loads are in accordance with EN 1991. Material properties are in accordance with the relevant material standard. All dimensions are in mm and forces in kN unless stated otherwise.';

    wrap.appendChild(_inputRow('Design Basis Text', _textarea(cfg.text, 'Enter design basis...', v => { cfg.text = v; _dispatch(wrap, block.id); })));

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

    const assumLabel = _el('div', { className: 'block-form-label', style: { marginTop: '12px' } }, 'Standard Assumptions (tick to include):');
    wrap.appendChild(assumLabel);

    if (!cfg.assumptions) cfg.assumptions = [];
    assumptions.forEach(a => {
      const row = _el('div', { className: 'block-check-row' });
      const cb = _el('input', { type: 'checkbox' });
      cb.checked = cfg.assumptions.includes(a);
      cb.addEventListener('change', () => {
        if (cb.checked) { if (!cfg.assumptions.includes(a)) cfg.assumptions.push(a); }
        else cfg.assumptions = cfg.assumptions.filter(x => x !== a);
        _dispatch(wrap, block.id);
      });
      row.appendChild(cb);
      row.appendChild(document.createTextNode(' ' + a));
      wrap.appendChild(row);
    });
    return wrap;
  }

  function _renderSectionHeader(block) {
    const wrap = _el('div', { className: 'block-form-wrap' });
    const cfg = block.config;
    const preview = _el('div', { className: 'section-header-preview' });

    const updatePreview = () => {
      preview.textContent = (cfg.number || '1.0') + '  ' + (cfg.title || 'Section Title');
    };

    const numInp = _el('input', { type: 'text', className: 'block-input block-input-sm', value: cfg.number || '1.0', placeholder: '1.0' });
    const titleInp = _el('input', { type: 'text', className: 'block-input', value: cfg.title || '', placeholder: 'Section title' });
    numInp.addEventListener('input', () => { cfg.number = numInp.value; updatePreview(); _dispatch(wrap, block.id); });
    titleInp.addEventListener('input', () => { cfg.title = titleInp.value; updatePreview(); _dispatch(wrap, block.id); });

    const row = _el('div', { className: 'section-header-row' });
    row.appendChild(numInp);
    row.appendChild(titleInp);
    wrap.appendChild(row);
    updatePreview();
    wrap.appendChild(preview);
    return wrap;
  }

  function _renderCodeRef(block) {
    const wrap = _el('div', { className: 'block-form-wrap' });
    const cfg = block.config;
    if (!cfg.codes) cfg.codes = [{ name: 'EN 1993-1-1', description: 'Design of steel structures — General rules', edition: '2005' }];

    const tableWrap = _el('div', { className: 'code-ref-table-wrap' });

    const rebuild = () => {
      tableWrap.innerHTML = '';
      const tbl = _el('table', { className: 'code-ref-table' });
      const thead = _el('tr');
      ['Code / Standard', 'Description', 'Edition', ''].forEach(h => thead.appendChild(_el('th', {}, h)));
      tbl.appendChild(_el('thead', {}, thead));
      const tbody = _el('tbody');
      cfg.codes.forEach((code, i) => {
        const tr = _el('tr');
        const nameInp = _el('input', { type: 'text', value: code.name || '', placeholder: 'e.g. EN 1992-1-1' });
        nameInp.addEventListener('input', () => { cfg.codes[i].name = nameInp.value; _dispatch(wrap, block.id); });
        const descInp = _el('input', { type: 'text', value: code.description || '', placeholder: 'Description' });
        descInp.addEventListener('input', () => { cfg.codes[i].description = descInp.value; _dispatch(wrap, block.id); });
        const edInp = _el('input', { type: 'text', value: code.edition || '', placeholder: 'Year' });
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
    addBtn.addEventListener('click', () => {
      cfg.codes.push({ name: '', description: '', edition: '' });
      rebuild();
      _dispatch(wrap, block.id);
    });
    wrap.appendChild(addBtn);
    return wrap;
  }

  function _renderLoadTable(block) {
    const wrap = _el('div', { className: 'block-form-wrap' });
    const cfg = block.config;
    if (cfg.Gk == null) cfg.Gk = 5;
    if (cfg.Qk == null) cfg.Qk = 3;

    const updateTable = () => {
      const Gk = cfg.Gk || 0;
      const Qk = cfg.Qk || 0;
      ulsVal.textContent = (1.35 * Gk + 1.5 * Qk).toFixed(2);
      slsVal.textContent = (Gk + Qk).toFixed(2);
    };

    const gkInp = _numberInput(cfg.Gk, v => { cfg.Gk = v; updateTable(); _dispatch(wrap, block.id); });
    const qkInp = _numberInput(cfg.Qk, v => { cfg.Qk = v; updateTable(); _dispatch(wrap, block.id); });

    const inputRow1 = _el('div', { className: 'load-input-row' });
    inputRow1.appendChild(_el('label', {}, 'Gk — Permanent (kN or kN/m)'));
    inputRow1.appendChild(gkInp);
    const inputRow2 = _el('div', { className: 'load-input-row' });
    inputRow2.appendChild(_el('label', {}, 'Qk — Variable (kN or kN/m)'));
    inputRow2.appendChild(qkInp);
    wrap.appendChild(inputRow1);
    wrap.appendChild(inputRow2);

    const tbl = _el('table', { className: 'load-combo-table' });
    const thead = _el('tr');
    ['Combination', 'Formula', 'Value'].forEach(h => thead.appendChild(_el('th', {}, h)));
    tbl.appendChild(_el('thead', {}, thead));
    const tbody = _el('tbody');

    const ulsVal = _el('td', { className: 'load-val' }, '0.00');
    const slsVal = _el('td', { className: 'load-val' }, '0.00');

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
    updateTable();
    return wrap;
  }

  function _renderText(block) {
    const wrap = _el('div', { className: 'block-form-wrap' });
    const cfg = block.config;
    wrap.appendChild(_textarea(cfg.text, 'Enter text, notes or commentary…', v => { cfg.text = v; _dispatch(wrap, block.id); }));
    return wrap;
  }

  function _renderImage(block) {
    const wrap = _el('div', { className: 'block-form-wrap' });
    const cfg = block.config;

    const preview = _el('div', { className: 'image-preview-wrap' });
    if (cfg.src) { const img = _el('img', { src: cfg.src, className: 'block-image-preview' }); preview.appendChild(img); }

    const fileInp = _el('input', { type: 'file', accept: 'image/*', className: 'block-file-input' });
    fileInp.addEventListener('change', () => {
      const file = fileInp.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = e => {
        cfg.src = e.target.result;
        cfg.filename = file.name;
        preview.innerHTML = '';
        const img = _el('img', { src: cfg.src, className: 'block-image-preview' });
        preview.appendChild(img);
        _dispatch(wrap, block.id);
      };
      reader.readAsDataURL(file);
    });

    wrap.appendChild(preview);
    wrap.appendChild(_inputRow('Select Image', fileInp));
    wrap.appendChild(_inputRow('Caption', _textInput(cfg.caption, 'Figure caption', v => { cfg.caption = v; _dispatch(wrap, block.id); })));
    return wrap;
  }

  function _renderToc(block) {
    const wrap = _el('div', { className: 'block-display-only' });
    wrap.appendChild(_el('p', { className: 'block-display-note' }, '📋 Table of Contents will be generated automatically in preview based on section headers.'));
    return wrap;
  }

  function _renderPageBreak(block) {
    const wrap = _el('div', { className: 'block-page-break-indicator' });
    wrap.appendChild(_el('div', { className: 'page-break-line' }));
    wrap.appendChild(_el('span', { className: 'page-break-label' }, '— Page Break —'));
    return wrap;
  }

  function _renderEngineerNotes(block) {
    const wrap = _el('div', { className: 'block-form-wrap' });
    const cfg = block.config;
    wrap.appendChild(_inputRow('Label / Heading', _textInput(cfg.label, 'e.g. Engineer Notes', v => { cfg.label = v; _dispatch(wrap, block.id); })));
    wrap.appendChild(_textarea(cfg.text, 'Enter engineering notes, assumptions, or commentary…', v => { cfg.text = v; _dispatch(wrap, block.id); }));

    const aiBtn = _el('button', { className: 'btn-ai-draft', disabled: true }, '✨ AI Draft — Coming soon');
    wrap.appendChild(aiBtn);
    return wrap;
  }

  function _renderSignoff(block) {
    const wrap = _el('div', { className: 'block-form-wrap' });
    const cfg = block.config;
    if (!cfg.prepared) cfg.prepared = {};
    if (!cfg.checked) cfg.checked = {};
    if (!cfg.approved) cfg.approved = {};

    const roles = [
      { key: 'prepared', label: 'Prepared By' },
      { key: 'checked',  label: 'Checked By' },
      { key: 'approved', label: 'Approved By' },
    ];

    const grid = _el('div', { className: 'signoff-grid' });
    roles.forEach(role => {
      const cell = _el('div', { className: 'signoff-cell' });
      cell.appendChild(_el('div', { className: 'signoff-cell-label' }, role.label));
      const nameInp = _el('input', { type: 'text', className: 'block-input', value: cfg[role.key].name || '', placeholder: 'Full name' });
      const dateInp = _el('input', { type: 'date', className: 'block-input', value: cfg[role.key].date || '' });
      const sigInp  = _el('input', { type: 'text', className: 'block-input', value: cfg[role.key].signature || '', placeholder: 'Type name to sign' });
      nameInp.addEventListener('input', () => { cfg[role.key].name = nameInp.value; _dispatch(wrap, block.id); });
      dateInp.addEventListener('input', () => { cfg[role.key].date = dateInp.value; _dispatch(wrap, block.id); });
      sigInp.addEventListener('input',  () => { cfg[role.key].signature = sigInp.value; _dispatch(wrap, block.id); });
      cell.appendChild(_inputRow('Name', nameInp));
      cell.appendChild(_inputRow('Date', dateInp));
      cell.appendChild(_inputRow('Signature', sigInp));
      grid.appendChild(cell);
    });
    wrap.appendChild(grid);
    return wrap;
  }

  function _renderRevisionHistory(block) {
    const wrap = _el('div', { className: 'block-form-wrap' });
    const cfg = block.config;
    if (!cfg.revisions) cfg.revisions = [{ rev: 'A', date: new Date().toISOString().split('T')[0], description: 'First issue', preparedBy: '', checkedBy: '' }];

    const tableWrap = _el('div', { className: 'rev-table-wrap' });

    const rebuild = () => {
      tableWrap.innerHTML = '';
      const tbl = _el('table', { className: 'rev-history-table' });
      const thead = _el('tr');
      ['Rev', 'Date', 'Description', 'Prepared By', 'Checked By', ''].forEach(h => thead.appendChild(_el('th', {}, h)));
      tbl.appendChild(_el('thead', {}, thead));
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
    const wrap = _el('div', { className: 'block-display-only' });
    const checks = block.results && block.results.checks;
    if (!checks || checks.length === 0) {
      wrap.appendChild(_el('p', { className: 'block-display-note' }, '✅ Design Checks Summary will aggregate results from all calculated blocks. Run calculations to populate.'));
      return wrap;
    }
    const tbl = _el('table', { className: 'checks-summary-table' });
    const thead = _el('tr');
    ['Element', 'Check', 'η (utilisation)', 'Status'].forEach(h => thead.appendChild(_el('th', {}, h)));
    tbl.appendChild(_el('thead', {}, thead));
    const tbody = _el('tbody');
    checks.forEach(c => {
      const tr = _el('tr');
      tr.appendChild(_el('td', {}, c.label || ''));
      tr.appendChild(_el('td', {}, c.checkName || ''));
      tr.appendChild(_el('td', { className: 'util-val' }, typeof c.util === 'number' ? c.util.toFixed(3) : '—'));
      const statusTd = _el('td', { className: c.pass ? 'check-pass' : 'check-fail' }, c.pass ? '✓ PASS' : '✗ FAIL');
      tr.appendChild(statusTd);
      tbody.appendChild(tr);
    });
    tbl.appendChild(tbody);
    wrap.appendChild(tbl);
    return wrap;
  }

  function _renderUtilisationChart(block) {
    const wrap = _el('div', { className: 'block-display-only' });
    wrap.appendChild(_el('p', { className: 'block-display-note' }, '📊 Utilisation chart will render in preview mode after calculations are run.'));
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
