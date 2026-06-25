/**
 * PreviewRenderer.js — Converts canvas block state to a professional A4
 * engineering calculation report HTML string.
 *
 * Exposes:
 *   PreviewRenderer.render(reportMeta, blocks) — returns full HTML string
 */

const PreviewRenderer = (() => {

  // ── Helpers ─────────────────────────────────────────────────────────────

  function esc(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function fmt(val, dp = 3) {
    if (val == null || val === '') return '—';
    if (typeof val === 'number') return val.toFixed(dp);
    return esc(String(val));
  }

  function fmtDate(dateStr) {
    if (!dateStr) return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    try { return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); } catch (_) { return dateStr; }
  }

  // ── Title block ──────────────────────────────────────────────────────────

  function _renderTitleBlock(titleCfg, projCfg, reportMeta) {
    const reportTitle   = esc(titleCfg.title || reportMeta.title || 'Structural Calculation Report');
    const reportRef     = esc(titleCfg.ref || '—');
    const reportDate    = fmtDate(titleCfg.date);
    const revision      = esc(titleCfg.revision || 'Rev A');
    const projectName   = esc(projCfg.projectName || '—');
    const clientName    = esc(projCfg.clientName || '—');
    const location      = esc(projCfg.location || '—');
    const engineerName  = esc(projCfg.engineerName || '—');
    const companyName   = esc(projCfg.companyName || 'BuildMetrics');
    const designCode    = esc(projCfg.designCode || 'Eurocode (EC2/EC3/EC5)');
    const status        = esc((reportMeta.status || 'DRAFT').toUpperCase());

    return `
<div class="rp-title-block">
  <div class="rp-tb-header">
    <div class="rp-tb-logo">
      <div style="font-weight:bold;font-size:11pt;letter-spacing:1pt;">BUILDMETRICS</div>
      <div style="font-size:7pt;color:#666;margin-top:2pt;">Structural Analysis Platform</div>
    </div>
    <div class="rp-tb-company">
      <div class="rp-tb-company-name">${companyName}</div>
      <div style="font-size:8pt;color:#555;margin-top:3pt;">Structural Engineering Calculations</div>
    </div>
  </div>

  <div class="rp-tb-main">
    <div class="rp-tb-report-type">Structural Calculation Report</div>
    <div class="rp-tb-project-title">${reportTitle}</div>
    <div class="rp-tb-project-grid">
      <span class="key">Project:</span>    <span>${projectName}</span>
      <span class="key">Client:</span>     <span>${clientName}</span>
      <span class="key">Location:</span>   <span>${location}</span>
      <span class="key">Engineer:</span>   <span>${engineerName}</span>
      <span class="key">Design Code:</span><span>${designCode}</span>
    </div>
  </div>

  <div class="rp-tb-meta">
    <div class="rp-tb-meta-cell">
      <div class="mk">Report Reference</div>
      <div class="mv">${reportRef}</div>
    </div>
    <div class="rp-tb-meta-cell">
      <div class="mk">Date</div>
      <div class="mv">${reportDate}</div>
    </div>
    <div class="rp-tb-meta-cell">
      <div class="mk">Revision</div>
      <div class="mv">${revision}</div>
    </div>
  </div>

  <div class="rp-tb-meta" style="border-top:1pt solid #000;">
    <div class="rp-tb-meta-cell">
      <div class="mk">Prepared By</div>
      <div class="mv">${engineerName}</div>
    </div>
    <div class="rp-tb-meta-cell">
      <div class="mk">Checked By</div>
      <div class="mv" style="border-bottom:0.5pt solid #000;min-height:16pt;">&nbsp;</div>
    </div>
    <div class="rp-tb-meta-cell" style="border-right:none;">
      <div class="mk">Status</div>
      <div class="mv" style="color:${status === 'FINAL' ? '#006600' : '#cc6600'}">${status}</div>
    </div>
  </div>

  <div class="rp-tb-statusbar">
    <span><b>Project:</b> ${projectName}</span>
    <span><b>Client:</b> ${clientName}</span>
    <span><b>Ref:</b> ${reportRef}</span>
    <span><b>Rev:</b> ${revision}</span>
    <span><b>Code:</b> ${designCode}</span>
    <span class="rp-tb-statusbar-status"><b>${status}</b></span>
  </div>
</div>`;
  }

  // ── Table of Contents ────────────────────────────────────────────────────

  function _buildToc(blocks) {
    const sections = blocks.filter(b => b.type === 'section_header');
    if (sections.length === 0) return '';

    const rows = sections.map(b => {
      const num   = esc(b.config.number || '');
      const title = esc(b.config.title || '');
      return `<div class="rp-toc-item">
        <span class="rp-toc-num">${num}</span>
        <span class="rp-toc-title-text">${title}</span>
      </div>`;
    }).join('');

    return `<div class="rp-toc">
  <div class="rp-toc-title">Table of Contents</div>
  ${rows}
</div>`;
  }

  // ── Running footer ───────────────────────────────────────────────────────

  function _renderFooter(titleCfg, projCfg) {
    const ref  = esc(titleCfg.ref || '');
    const rev  = esc(titleCfg.revision || 'Rev A');
    const proj = esc(projCfg.projectName || 'BuildMetrics');
    return `
<div class="rp-running-footer">
  <span>${proj}</span>
  <span>${ref}${ref ? ' · ' : ''}${rev}</span>
  <span>BuildMetrics — buildmetrics.io</span>
</div>`;
  }

  // ── Block renderers ──────────────────────────────────────────────────────

  function _renderSectionHeader(block) {
    const num   = esc(block.config.number || '');
    const title = esc(block.config.title || '');
    return `<h2 class="rp-section-header"><span class="rp-section-num">${num}</span>${title}</h2>`;
  }

  function _renderPageBreak() {
    return `<div class="rp-page-break"></div>`;
  }

  function _renderProse(block) {
    const text = (block.config.text || '').replace(/\n/g, '<br>');
    const label = block.config.label ? `<div class="rp-prose-label">${esc(block.config.label)}</div>` : '';
    return `${label}<div class="rp-prose">${text}</div>`;
  }

  function _renderDesignBasis(block) {
    const text  = (block.config.text || '').replace(/\n/g, '<br>');
    const items = block.config.assumptions || [];
    const listHTML = items.length
      ? `<ul class="rp-assumption-list">${items.map(a => `<li>${esc(a)}</li>`).join('')}</ul>`
      : '';
    return `<div class="rp-calc-section">
  <div class="rp-calc-header">
    <span class="rp-calc-title">Design Basis &amp; Assumptions</span>
    <span class="rp-calc-headright"><span class="rp-calc-tag">BASIS</span></span>
  </div>
  <div style="padding:8pt 10pt;">
    <div class="rp-prose">${text}</div>
    ${listHTML}
  </div>
</div>`;
  }

  function _renderCodeRef(block) {
    const codes = block.config.codes || [];
    if (codes.length === 0) return '';
    const rows = codes.map(c => `<tr>
      <td style="font-weight:bold">${esc(c.name)}</td>
      <td>${esc(c.description)}</td>
      <td style="text-align:center">${esc(c.edition)}</td>
    </tr>`).join('');
    return `<div class="rp-calc-section">
  <div class="rp-calc-header">
    <span class="rp-calc-title">Codes &amp; Standards Referenced</span>
    <span class="rp-calc-headright"><span class="rp-calc-tag">STANDARDS</span></span>
  </div>
  <table class="rp-inputs-table" style="margin:8pt 0 0;">
    <thead><tr>
      <th style="width:120pt">Code / Standard</th>
      <th>Description</th>
      <th style="width:40pt;text-align:center">Edition</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>
</div>`;
  }

  function _renderLoadTable(block) {
    const Gk  = block.config.Gk  || 0;
    const Qk  = block.config.Qk  || 0;
    const uls = (1.35 * Gk + 1.5 * Qk).toFixed(2);
    const sls = (Gk + Qk).toFixed(2);
    return `<div class="rp-calc-section">
  <div class="rp-calc-header">
    <span class="rp-calc-title">Load Combinations</span>
    <span class="rp-calc-code">EN 1990</span>
  </div>
  <table class="rp-inputs-table" style="margin:8pt 0 0;">
    <thead><tr><th>Parameter</th><th>Value</th><th>Unit</th></tr></thead>
    <tbody>
      <tr><td class="rp-param">Permanent load G<sub>k</sub></td><td class="rp-val">${fmt(Gk,2)}</td><td class="rp-unit">kN/m</td></tr>
      <tr><td class="rp-param">Variable load Q<sub>k</sub></td><td class="rp-val">${fmt(Qk,2)}</td><td class="rp-unit">kN/m</td></tr>
    </tbody>
  </table>
  <table class="rp-checks-table" style="margin:6pt 0 0;">
    <thead><tr><th>Combination</th><th>Formula</th><th>Value</th><th>Unit</th></tr></thead>
    <tbody>
      <tr style="background:#fff8f0"><td><strong>ULS — Fundamental</strong></td><td class="rp-formula">1.35·G<sub>k</sub> + 1.5·Q<sub>k</sub></td><td class="rp-calc-val">${uls}</td><td class="rp-unit">kN/m</td></tr>
      <tr><td>SLS — Characteristic</td><td class="rp-formula">G<sub>k</sub> + Q<sub>k</sub></td><td class="rp-calc-val">${sls}</td><td class="rp-unit">kN/m</td></tr>
    </tbody>
  </table>
</div>`;
  }

  function _renderImage(block) {
    if (!block.config.src) return '<p class="rp-prose" style="color:#999;">[Image not provided]</p>';
    const caption = esc(block.config.caption || '');
    return `<figure class="rp-figure">
  <img src="${esc(block.config.src)}" alt="${caption}" style="max-width:100%;border:0.5pt solid #ddd;">
  ${caption ? `<figcaption>Figure: ${caption}</figcaption>` : ''}
</figure>`;
  }

  function _renderSignoff(block) {
    const cfg = block.config;
    const prepared = cfg.prepared || {};
    const checked  = cfg.checked  || {};
    const approved = cfg.approved || {};
    const cell = (role, data) => `
      <td>
        <div class="rp-signoff-label">${role}</div>
        <div style="margin-top:6pt;font-size:9pt;"><strong>${esc(data.name || '&nbsp;')}</strong></div>
        <div class="rp-signoff-line">${esc(data.signature || '&nbsp;')}</div>
        <div style="font-size:8pt;color:#555;margin-top:4pt;">${fmtDate(data.date)}</div>
      </td>`;
    return `<div class="rp-calc-section">
  <div class="rp-calc-header"><span class="rp-calc-title">Engineer Sign-off Register</span></div>
  <table class="rp-signoff-table">
    <tr>${cell('Prepared By', prepared)}${cell('Checked By', checked)}${cell('Approved By', approved)}</tr>
  </table>
</div>`;
  }

  function _renderRevisionHistory(block) {
    const revisions = block.config.revisions || [];
    if (revisions.length === 0) return '';
    const rows = revisions.map(r => `<tr>
      <td style="text-align:center;font-weight:bold">${esc(r.rev)}</td>
      <td>${fmtDate(r.date)}</td>
      <td>${esc(r.description)}</td>
      <td>${esc(r.preparedBy)}</td>
      <td>${esc(r.checkedBy)}</td>
    </tr>`).join('');
    return `<div class="rp-calc-section">
  <div class="rp-calc-header"><span class="rp-calc-title">Revision History</span></div>
  <table class="rp-checks-table" style="margin:0;">
    <thead><tr><th style="width:30pt">Rev</th><th style="width:60pt">Date</th><th>Description</th><th style="width:80pt">Prepared By</th><th style="width:80pt">Checked By</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</div>`;
  }

  function _renderChecksSummary(block, allBlocks) {
    // Build checks from all calc blocks
    const checks = [];
    allBlocks.forEach(b => {
      if (!b.type.startsWith('calc_')) return;
      if (!b.results || !b.results._ran) return;
      const extracted = (typeof BlockRegistry !== 'undefined' && BlockRegistry._extractChecks)
        ? BlockRegistry._extractChecks(b)
        : [];
      extracted.forEach(c => checks.push({ ...c, element: b.label }));
    });

    if (checks.length === 0) {
      return `<div class="rp-calc-section">
  <div class="rp-calc-header"><span class="rp-calc-title">Design Checks Summary</span></div>
  <p style="padding:8pt 10pt;font-size:9pt;color:#666;">No calculations have been run yet.</p>
</div>`;
    }

    const rows = checks.map(c => {
      const pass = c.pass !== false;
      const util = typeof c.util === 'number' ? c.util.toFixed(3) : '—';
      return `<tr>
        <td>${esc(c.element || c.label)}</td>
        <td>${esc(c.checkName)}</td>
        <td style="text-align:right;font-family:'Courier New',monospace">${util}</td>
        <td class="${pass ? 'rp-pass' : 'rp-fail'}">${pass ? '✓ PASS' : '✗ FAIL'}</td>
      </tr>`;
    }).join('');

    const allPass = checks.every(c => c.pass !== false);
    return `<div class="rp-calc-section">
  <div class="rp-calc-header">
    <span class="rp-calc-title">Design Checks Summary</span>
    <span class="rp-calc-headright"><span class="rp-calc-code" style="color:${allPass ? '#90ee90' : '#ffaaaa'}">${allPass ? '✓ ALL PASS' : '✗ FAILURES PRESENT'}</span><span class="rp-calc-tag">OUTPUT</span></span>
  </div>
  <table class="rp-checks-table" style="margin:0;">
    <thead><tr><th>Element</th><th>Check</th><th style="text-align:right">η</th><th>Status</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</div>`;
  }

  // ── Calc block renderer ──────────────────────────────────────────────────

  function _renderCalcBlock(block) {
    const cfg  = block.config || {};
    const res  = block.results || {};
    const code = (typeof BlockRegistry !== 'undefined' && BlockRegistry.CALC_CODES)
      ? BlockRegistry.CALC_CODES[block.type] || ''
      : '';
    const label = esc(block.label || block.type);

    // Build inputs table rows
    const inputRows = _buildInputRows(block.type, cfg);

    // Build calculation steps
    const calcRows  = _buildCalcRows(block.type, cfg, res);

    // Build checks rows
    const checkRows = _buildCheckRows(block.type, res);

    const hasResults = res._ran === true;
    const noCalcMsg  = hasResults ? '' : `<tr><td colspan="5" style="color:#999;font-style:italic;padding:6pt 10pt;">[Calculation not yet run — click Calculate in editor]</td></tr>`;

    // Engineering diagram (generated from config+results via BlockRegistry)
    const diagramHTML = (typeof BlockRegistry !== 'undefined' && typeof BlockRegistry.generateDiagramHTML === 'function')
      ? (BlockRegistry.generateDiagramHTML(block) || '')
      : '';

    return `<div class="rp-calc-section">
  <div class="rp-calc-header">
    <span class="rp-calc-title">${label}</span>
    <span class="rp-calc-headright">${code ? `<span class="rp-calc-code">${esc(code)}</span>` : ''}<span class="rp-calc-tag">CALCULATED</span></span>
  </div>

  <div class="rp-subsection-title">Design Inputs</div>
  <table class="rp-inputs-table">
    <tbody>${inputRows}</tbody>
  </table>

  ${hasResults ? `
  <div class="rp-subsection-title">Calculations</div>
  <table class="rp-calc-table">
    <thead><tr>
      <th style="width:13%">Ref / Clause</th>
      <th style="width:31%">Step</th>
      <th style="width:29%">Formula</th>
      <th style="text-align:right;width:15%">Value</th>
      <th style="width:12%">Unit</th>
    </tr></thead>
    <tbody>${calcRows || noCalcMsg}</tbody>
  </table>

  <div class="rp-subsection-title">Design Checks</div>
  <table class="rp-checks-table">
    <thead><tr>
      <th>Check</th>
      <th>E<sub>d</sub></th>
      <th>R<sub>d</sub></th>
      <th>η = E<sub>d</sub>/R<sub>d</sub></th>
      <th>Status</th>
    </tr></thead>
    <tbody>${checkRows || noCalcMsg}</tbody>
  </table>

  ${diagramHTML ? `
  <div class="rp-subsection-title">Engineering Diagram</div>
  ${diagramHTML}` : ''}` : `
  <div class="rp-calc-table"><table><tbody>${noCalcMsg}</tbody></table></div>`}

</div>`;
  }

  function _inputRow(label, value, unit, ref) {
    return `<tr>
      <td class="rp-param">${label}</td>
      <td class="rp-val">${fmt(value, 3)}</td>
      <td class="rp-unit">${esc(unit || '')}</td>
      <td class="rp-ref">${esc(ref || 'as given')}</td>
    </tr>`;
  }

  function _calcRow(ref, desc, formula, value, unit) {
    return `<tr>
      <td class="rp-clause">${esc(ref || '')}</td>
      <td class="rp-step-desc">${desc}</td>
      <td class="rp-formula">${formula}</td>
      <td class="rp-calc-val">${fmt(value, 3)}</td>
      <td class="rp-unit">${esc(unit || '')}</td>
    </tr>`;
  }

  function _checkRow(check, Ed, EdUnit, Rd, RdUnit, util, pass) {
    const passClass = pass ? 'rp-pass' : 'rp-fail';
    const passText  = pass ? '✓ PASS' : '✗ FAIL';
    const utilStr   = typeof util === 'number' ? util.toFixed(3) : '—';
    return `<tr>
      <td>${esc(check)}</td>
      <td style="font-family:'Courier New',monospace">${fmt(Ed, 2)} ${esc(EdUnit || '')}</td>
      <td style="font-family:'Courier New',monospace">${fmt(Rd, 2)} ${esc(RdUnit || '')}</td>
      <td style="font-family:'Courier New',monospace;text-align:right">${utilStr}</td>
      <td class="${passClass}">${passText}</td>
    </tr>`;
  }

  // ── Input rows per calc type ─────────────────────────────────────────────

  function _buildInputRows(type, cfg) {
    switch (type) {
      case 'calc_beam':
        return [
          _inputRow('Material', cfg.material, '', ''),
          _inputRow('Span', cfg.span, 'm', ''),
          _inputRow('Permanent load G<sub>k</sub>', cfg.Gk, 'kN/m', ''),
          _inputRow('Variable load Q<sub>k</sub>', cfg.Qk, 'kN/m', ''),
          _inputRow('Steel grade', cfg.grade, '', ''),
          _inputRow('Elastic modulus S<sub>xx</sub>', cfg.Sxx, 'cm³', ''),
          _inputRow('Second moment I<sub>xx</sub>', cfg.Ixx, 'cm⁴', ''),
        ].join('');
      case 'calc_column':
        return [
          _inputRow('Section', cfg.section, '', ''),
          _inputRow('Steel grade', cfg.grade, '', ''),
          _inputRow('Design axial force N<sub>Ed</sub>', cfg.NEd, 'kN', ''),
          _inputRow('Member length', cfg.length, 'm', ''),
          _inputRow('Effective length factor k', cfg.keff, '', ''),
          _inputRow('Cross-sectional area A', cfg.A, 'cm²', ''),
          _inputRow('Second moment I<sub>yy</sub>', cfg.Iyy, 'cm⁴', 'minor axis'),
        ].join('');
      case 'calc_rc_beam':
        return [
          _inputRow('Span', cfg.span, 'm', ''),
          _inputRow('Section width b', cfg.b, 'mm', ''),
          _inputRow('Overall depth h', cfg.h, 'mm', ''),
          _inputRow('Concrete strength f<sub>ck</sub>', cfg.fck, 'MPa', ''),
          _inputRow('Design moment M<sub>Ed</sub>', cfg.MEd, 'kNm', ''),
          _inputRow('Design shear V<sub>Ed</sub>', cfg.VEd, 'kN', ''),
        ].join('');
      case 'calc_rc_column':
        return [
          _inputRow('Section width b', cfg.b, 'mm', ''),
          _inputRow('Section depth h', cfg.h, 'mm', ''),
          _inputRow('Concrete strength f<sub>ck</sub>', cfg.fck, 'MPa', ''),
          _inputRow('Design axial N<sub>Ed</sub>', cfg.NEd, 'kN', ''),
          _inputRow('Design moment M<sub>Ed</sub>', cfg.MEd, 'kNm', ''),
          _inputRow('Effective length l<sub>o</sub>', cfg.lo, 'm', ''),
        ].join('');
      case 'calc_slab':
        return [
          _inputRow('Short span l<sub>x</sub>', cfg.lx, 'm', ''),
          _inputRow('Long span l<sub>y</sub>', cfg.ly, 'm', ''),
          _inputRow('Slab depth h', cfg.h, 'mm', ''),
          _inputRow('Concrete strength f<sub>ck</sub>', cfg.fck, 'MPa', ''),
          _inputRow('ULS load n', cfg.n_uls, 'kN/m²', ''),
        ].join('');
      case 'calc_footing':
        return [
          _inputRow('Permanent column load G<sub>k</sub>', cfg.Gk, 'kN', ''),
          _inputRow('Variable column load Q<sub>k</sub>', cfg.Qk, 'kN', ''),
          _inputRow('Allowable soil bearing', cfg.soilBearing, 'kPa', ''),
          _inputRow('Concrete strength f<sub>ck</sub>', cfg.fck, 'MPa', ''),
          _inputRow('Column width', cfg.columnW, 'mm', ''),
          _inputRow('Footing depth', cfg.footThick, 'mm', ''),
        ].join('');
      case 'calc_retaining':
        return [
          _inputRow('Wall height H', cfg.H, 'm', ''),
          _inputRow('Soil unit weight γ', cfg.gamma_soil, 'kN/m³', ''),
          _inputRow('Friction angle φ', cfg.phi, '°', ''),
          _inputRow('Surcharge q', cfg.surcharge, 'kPa', ''),
          _inputRow('Concrete strength f<sub>ck</sub>', cfg.fck, 'MPa', ''),
        ].join('');
      case 'calc_connection':
        return [
          _inputRow('Connection type', cfg.connectionType, '', ''),
          _inputRow('Design shear V<sub>Ed</sub>', cfg.VEd, 'kN', ''),
          _inputRow('Bolt grade', cfg.boltGrade, '', ''),
          _inputRow('Bolt diameter', cfg.boltDia, 'mm', ''),
          _inputRow('Number of bolts', cfg.nBolts, '', ''),
        ].join('');
      case 'calc_timber_col':
        return [
          _inputRow('Height', cfg.span, 'm', ''),
          _inputRow('Section width b', cfg.b, 'mm', ''),
          _inputRow('Section depth h', cfg.h, 'mm', ''),
          _inputRow('Design axial N<sub>Ed</sub>', cfg.NEd, 'kN', ''),
          _inputRow('Timber class', cfg.timberClass, '', ''),
        ].join('');
      case 'calc_steel_member':
        return [
          _inputRow('Section', cfg.section, '', ''),
          _inputRow('Steel grade', cfg.grade, '', ''),
          _inputRow('Buckling length L<sub>cr</sub>', cfg.Lcr, 'm', ''),
          _inputRow('Design axial N<sub>Ed</sub>', cfg.NEd, 'kN', ''),
          _inputRow('Design moment M<sub>Ed</sub>', cfg.MEd, 'kNm', ''),
          _inputRow('Design shear V<sub>Ed</sub>', cfg.VEd, 'kN', ''),
        ].join('');
      case 'calc_wind':
        return [
          _inputRow('Basic wind velocity v<sub>b0</sub>', cfg.vb0, 'm/s', 'UK wind map'),
          _inputRow('Building height h', cfg.h, 'm', ''),
          _inputRow('Crosswind width b', cfg.b, 'm', ''),
          _inputRow('Terrain category', cfg.terrainCat, '', 'EN 1991-1-4'),
          _inputRow('Site altitude', cfg.altitude, 'm', ''),
        ].join('');
      case 'calc_load_takedown':
        return [
          _inputRow('Number of floors', cfg.nFloors, '', ''),
          _inputRow('Tributary area', cfg.floorArea, 'm²', ''),
          _inputRow('Floor dead load DL', cfg.DL, 'kPa', ''),
          _inputRow('Floor live load LL', cfg.LL, 'kPa', ''),
          _inputRow('Roof dead load', cfg.roofDL, 'kPa', ''),
        ].join('');
      case 'calc_hoarding':
        return [
          _inputRow('Hoarding height H', cfg.H, 'm', 'Geometry'),
          _inputRow('Basic wind speed v<sub>b,0</sub>', cfg.vb0, 'm/s', 'NA Fig NA.1'),
          _inputRow('Altitude above sea level', cfg.altitude, 'm', 'NA §4.2'),
          _inputRow('Terrain category', cfg.terrainCat, '', 'Table NA.1'),
          _inputRow('Wind return period', cfg.returnPeriod, 'yr', '§4.2(1)'),
          _inputRow('Cladding solidity ratio φ', cfg.phi, '', ''),
          _inputRow('Normal bay L<sub>N</sub>', cfg.Ln, 'm', ''),
          _inputRow('Next-to-end bay L<sub>NE</sub>', cfg.Lne, 'm', ''),
          _inputRow('End bay L<sub>E</sub>', cfg.Le, 'm', ''),
          _inputRow('Post section', cfg.postSection, 'mm', ''),
          _inputRow('Post grade', cfg.postGrade, '', 'Table C.1'),
          _inputRow('Rail section', cfg.railSection, 'mm', ''),
          _inputRow('No. of rails', cfg.nRails, '', ''),
          _inputRow('Fixing type', cfg.fixType, '', '§8'),
          _inputRow('Plywood thickness', cfg.plyT, 'mm', ''),
          _inputRow('Foundation dia/side', cfg.foundationDia, 'm', 'TwF2012'),
          _inputRow('Trial embedment P', cfg.foundationDepth, 'm', 'TwF2012'),
          _inputRow('Soil factor G', cfg.soilG, '', 'TwF2012 Table 1'),
        ].join('');
      default:
        return Object.entries(cfg).slice(0, 8).map(([k, v]) => _inputRow(k, v, '', '')).join('');
    }
  }

  // ── Calculation step rows per type ──────────────────────────────────────

  function _buildCalcRows(type, cfg, res) {
    if (!res || !res._ran) return '';
    switch (type) {
      case 'calc_beam':
        return [
          _calcRow('EN1990 (6.10)', 'ULS design load', 'w = 1.35·G<sub>k</sub> + 1.5·Q<sub>k</sub>', (1.35*(cfg.Gk||0) + 1.5*(cfg.Qk||0)), 'kN/m'),
          _calcRow('EN1990', 'Design bending moment', 'M<sub>Ed</sub> = w·L²/8', res.MEd, 'kNm'),
          _calcRow('EC3 §6.2.5', 'Moment resistance', 'M<sub>Rd</sub> = f<sub>y</sub>·S<sub>xx</sub>/γ<sub>M0</sub>', res.MRd, 'kNm'),
          _calcRow('EN1990', 'Design shear force', 'V<sub>Ed</sub> = w·L/2', res.VEd, 'kN'),
          _calcRow('EC3 §6.2.6', 'Shear resistance', 'V<sub>Rd</sub> = A<sub>v</sub>·f<sub>y</sub>/(√3·γ<sub>M0</sub>)', res.VRd, 'kN'),
        ].join('');
      case 'calc_column':
        return [
          _calcRow('EC3 §6.3.1.3', 'Slenderness ratio', 'λ = L<sub>cr</sub>/i', res.lambdaZ || res.lambda_z, ''),
          _calcRow('EC3 §6.3.1.2', 'Non-dimensional slenderness', 'λ̄ = λ/λ<sub>1</sub>', res.lambdaBarZ || res.lambdaBar_z, ''),
          _calcRow('EC3 §6.3.1.2', 'Buckling reduction factor', 'χ (from buckling curve)', res.chiZ || res.chi_z, ''),
          _calcRow('EC3 §6.3.1.1', 'Buckling resistance', 'N<sub>b,Rd</sub> = χ·A·f<sub>y</sub>/γ<sub>M1</sub>', res.NbRd, 'kN'),
        ].join('');
      case 'calc_rc_beam':
        return [
          _calcRow('EC2 §3.1.6', 'Design compressive strength', 'f<sub>cd</sub> = 0.85·f<sub>ck</sub>/γ<sub>C</sub>', res.fcd, 'MPa'),
          _calcRow('EC2 §6.1', 'Normalised moment', 'K = M<sub>Ed</sub>/(b·d²·f<sub>cd</sub>)', res.K, ''),
          _calcRow('EC2 §6.1', 'Required reinforcement', 'A<sub>s,req</sub> = M<sub>Ed</sub>/(f<sub>yd</sub>·z)', res.As_req, 'mm²'),
          _calcRow('EC2 §6.2.2', 'Shear capacity (no links)', 'V<sub>Rd,c</sub>', res.VRdc, 'kN'),
        ].join('');
      case 'calc_footing':
        return [
          _calcRow('EN1990', 'Service load', 'N<sub>SLS</sub> = G<sub>k</sub> + Q<sub>k</sub>', (cfg.Gk||0)+(cfg.Qk||0), 'kN'),
          _calcRow('EC7 §6.5', 'Required footing size', 'B = √(N/q<sub>a</sub>)', res.B, 'm'),
          _calcRow('EC7 §6.5.2', 'Net bearing pressure', 'q<sub>net</sub> = N/A<sub>ftg</sub>', res.q_net, 'kPa'),
          _calcRow('EN1990 (6.10)', 'ULS load', 'N<sub>ULS</sub> = 1.35·G<sub>k</sub> + 1.5·Q<sub>k</sub>', res.N_ULS, 'kN'),
        ].join('');
      case 'calc_wind':
        return [
          _calcRow('EN1991-1-4 §4.2', 'Basic wind velocity', 'v<sub>b</sub> = c<sub>dir</sub>·c<sub>season</sub>·v<sub>b0</sub>', res.vb, 'm/s'),
          _calcRow('EN1991-1-4 §4.3', 'Mean wind velocity', 'v<sub>m</sub> = c<sub>r</sub>·c<sub>o</sub>·v<sub>b</sub>', res.vm, 'm/s'),
          _calcRow('EN1991-1-4 §4.5', 'Peak velocity pressure', 'q<sub>p</sub> = [1+7·I<sub>v</sub>]·½·ρ·v<sub>m</sub>²', res.qp, 'kN/m²'),
          _calcRow('EN1991-1-4 §5.3', 'Wind force per unit height', 'F<sub>w</sub> = c<sub>s</sub>c<sub>d</sub>·c<sub>f</sub>·q<sub>p</sub>·A<sub>ref</sub>', res.Fw_total, 'kN'),
        ].join('');
      case 'calc_rc_column':
        return [
          _calcRow('EC2 §5.8.3.2', 'Effective length', 'l₀ = β·l', res.lo_eff || (cfg.lo||0), 'm'),
          _calcRow('EC2 §5.8.3', 'Slenderness ratio', 'λ = l₀/i', res.lambda, ''),
          _calcRow('EC2 §6.1(4)', 'Min. eccentricity', 'e₀ = max(h/30, 20mm)', res.e0, 'mm'),
          _calcRow('EC2 §5.8.8', 'Total moment (incl. 2nd order)', 'M<sub>Ed,tot</sub>', res.MEd_tot || res.MEd, 'kNm'),
          _calcRow('EC2 §6.1', 'Required rebar area', 'A<sub>s,req</sub>', res.As_req, 'mm²'),
        ].filter(r => r).join('');
      case 'calc_slab':
        return [
          _calcRow('EN1990 (6.10)', 'ULS applied load', 'n = 1.35·G<sub>k</sub> + 1.5·Q<sub>k</sub>', res.n_uls || (1.35*(cfg.gk||0)+1.5*(cfg.qk||0)), 'kN/m²'),
          _calcRow('EC2 §5.4', 'Design moment', 'M<sub>Ed</sub> = n·l²/8', res.MEd, 'kNm/m'),
          _calcRow('EC2 §4.4.1', 'Effective depth', 'd = h – c<sub>nom</sub> – φ/2', res.d_eff || ((cfg.thickness||200)-35), 'mm'),
          _calcRow('EC2 §9.3', 'Required reinforcement', 'A<sub>s,req</sub> per metre', res.As_req, 'mm²/m'),
          _calcRow('EC2 §7.4.2', 'Deflection check (span/d)', 'l/d = ' + (res.span_d_ratio ? res.span_d_ratio.toFixed(1) : '—'), res.span_d_ratio, ''),
        ].filter(r => r).join('');
      case 'calc_retaining':
        return [
          _calcRow('Rankine', 'Active earth pressure coefficient', 'K<sub>a</sub> = tan²(45°–φ/2)', res.Ka, ''),
          _calcRow('EC7 §9.3', 'Active force', 'P<sub>a</sub> = ½·K<sub>a</sub>·γ·H²', res.Pa, 'kN/m'),
          _calcRow('EC7 §6.5.4', 'Overturning moment', 'M<sub>ov</sub>', res.Mov, 'kNm/m'),
          _calcRow('EC7 §6.5.4', 'Stabilising moment', 'M<sub>stab</sub>', res.Mstab, 'kNm/m'),
          _calcRow('EC7 §6.5.3', 'Sliding resistance', 'H<sub>Rd</sub> = N<sub>Ed</sub>·tan δ', res.Hrd, 'kN/m'),
        ].filter(r => r).join('');
      case 'calc_connection':
        return [
          _calcRow('EC3 §3.6.1', 'Bolt shear resistance', 'F<sub>v,Rd</sub>/bolt', res.Fv_Rd, 'kN'),
          _calcRow('EC3 §3.6.1', 'Bolt bearing resistance', 'F<sub>b,Rd</sub>/bolt', res.Fb_Rd, 'kN'),
          _calcRow('EC3 §3.7', 'Total connection resistance', 'V<sub>Rd</sub> = n·min(F<sub>v</sub>,F<sub>b</sub>)', res.VRd, 'kN'),
          _calcRow('EN1990', 'Applied force', 'V<sub>Ed</sub>', res.VEd || cfg.VEd, 'kN'),
        ].filter(r => r).join('');
      case 'calc_timber_col':
        return [
          _calcRow('EC5 §2.4.1', 'Design compressive strength', 'f<sub>c,0,d</sub> = k<sub>mod</sub>·f<sub>c,0,k</sub>/γ<sub>M</sub>', res.fc0d, 'MPa'),
          _calcRow('EC5 §6.3.2', 'Relative slenderness', 'λ<sub>rel,c</sub>', res.lambdaRel, ''),
          _calcRow('EC5 §6.3.2', 'Instability factor', 'k<sub>c</sub>', res.kc, ''),
          _calcRow('EC5 §6.3.2', 'Design resistance', 'N<sub>Rd</sub> = k<sub>c</sub>·A·f<sub>c,0,d</sub>', res.NRd, 'kN'),
        ].filter(r => r).join('');
      case 'calc_steel_member':
        return [
          _calcRow('EC3 §6.2.5', 'Plastic moment resistance', 'M<sub>c,Rd</sub> = W<sub>pl</sub>·f<sub>y</sub>/γ<sub>M0</sub>', res.McRd, 'kNm'),
          _calcRow('EC3 §6.2.6', 'Shear resistance', 'V<sub>c,Rd</sub> = A<sub>v</sub>·f<sub>y</sub>/(√3·γ<sub>M0</sub>)', res.VcRd, 'kN'),
          _calcRow('EC3 §6.3.1', 'Compression resistance', 'N<sub>b,Rd</sub>', res.NbRd, 'kN'),
          _calcRow('EC3 §6.3.3', 'Interaction check (y-y axis)', 'N<sub>Ed</sub>/(χ<sub>y</sub>·N<sub>Rk</sub>) + k<sub>yy</sub>·M<sub>y,Ed</sub>/(M<sub>y,Rk</sub>)', res.interactionY, ''),
        ].filter(r => r).join('');
      case 'calc_bbs':
        return [
          _calcRow('BS 8666', 'Total bar count', '', res.bar_count || cfg.bar_count, 'bars'),
          _calcRow('BS 8666', 'Total steel weight', '', res.total_weight || cfg.total_weight, 'kg'),
          _calcRow('BS 8666', 'Primary bar diameter', '', res.primary_dia || cfg.primary_dia, 'mm'),
        ].filter(r => r).join('');
      case 'calc_section':
        return [
          _calcRow('Geometry', 'Cross-sectional area', 'A', res.A, 'mm²'),
          _calcRow('Geometry', 'Second moment of area (xx)', 'I<sub>xx</sub>', res.Ixx, 'mm⁴'),
          _calcRow('Geometry', 'Elastic modulus (xx)', 'W<sub>el,xx</sub> = I<sub>xx</sub>/y<sub>max</sub>', res.Wel_xx, 'mm³'),
          _calcRow('Geometry', 'Radius of gyration', 'i<sub>xx</sub> = √(I<sub>xx</sub>/A)', res.i_xx, 'mm'),
        ].filter(r => r).join('');
      case 'calc_load_takedown':
        return [
          _calcRow('EN1991-1-1', 'Total unfactored (G<sub>k</sub>)', 'Σ dead load', res.total_Gk, 'kN'),
          _calcRow('EN1991-1-1', 'Total unfactored (Q<sub>k</sub>)', 'Σ imposed load', res.total_Qk, 'kN'),
          _calcRow('EN1990 (6.10)', 'ULS design load', 'N<sub>Ed</sub> = 1.35·G<sub>k</sub> + 1.5·Q<sub>k</sub>', res.NEd, 'kN'),
          _calcRow('EN1990 (6.14)', 'SLS service load', 'N<sub>SLS</sub> = G<sub>k</sub> + Q<sub>k</sub>', res.N_SLS, 'kN'),
        ].filter(r => r).join('');
      case 'calc_hoarding':
        return [
          _calcRow('NA §4.2', 'Altitude factor', 'c<sub>alt</sub> = 1 + 0.001·A', res.calt, ''),
          _calcRow('§4.2(1)', 'Probability factor', 'c<sub>prob</sub>', res.cprob, ''),
          _calcRow('§4.2', 'Basic wind velocity', 'v<sub>b</sub> = v<sub>b,0</sub>·c<sub>alt</sub>·c<sub>prob</sub>', res.vb, 'm/s'),
          _calcRow('§4.5(1)', 'Basic velocity pressure', 'q<sub>b</sub> = ½·ρ·v<sub>b</sub>²', res.qb, 'N/m²'),
          _calcRow('NA Fig NA.7', 'Exposure factor', 'c<sub>e</sub>(z)', res.cez, ''),
          _calcRow('§4.5', 'Peak velocity pressure', 'q<sub>p</sub> = c<sub>e</sub>(z)·q<sub>b</sub>', res.qp, 'kN/m²'),
          _calcRow('§7.4 NA', 'Force coeff. — Normal', 'c<sub>f,N</sub> (φ≥0.9 → 1.30)', res.cfN, ''),
          _calcRow('§5.2', 'Wind pressure — Normal', 'w<sub>e,N</sub> = c<sub>f,N</sub>·q<sub>p</sub>', res.weN, 'kN/m²'),
          _calcRow('EN1990', 'Governing ULS moment (' + (res.govName || '—') + ')', 'M<sub>Ed</sub> = 1.5·w<sub>k</sub>·H²/2', res.govMuls, 'kN·m'),
          _calcRow('EN1990', 'Governing ULS shear', 'V<sub>Ed</sub> = 1.5·w<sub>k</sub>·H', res.govVuls, 'kN'),
          _calcRow('EC5 §6.1.6', 'Post bending stress', 'σ<sub>m,d</sub> = M<sub>Ed</sub>/W<sub>el</sub>', res.postSig, 'N/mm²'),
          _calcRow('EC5 §2.4.3', 'Post bending strength', 'f<sub>m,d</sub> = k<sub>mod</sub>·f<sub>m,k</sub>/γ<sub>M</sub>', res.postFmd, 'N/mm²'),
          _calcRow('EC5 §2.2.3', 'Post tip deflection', 'δ = w<sub>k</sub>·L<sub>eff</sub>⁴/(8EI)', res.postDefl, 'mm'),
          _calcRow('EC5 §8', 'Rail bending utilisation', 'σ<sub>m,d</sub>/f<sub>m,d</sub>', res.railUC, ''),
          _calcRow('EC5 Eq.8.6/8.7', 'Fixing design capacity', 'F<sub>v,Rd</sub> = k<sub>mod</sub>·F<sub>v,Rk</sub>/γ<sub>M</sub>', res.FvRd, 'kN/fix'),
          _calcRow('EC5 §6.1.6', 'Facing bending utilisation', 'σ<sub>m,d</sub>/f<sub>m,d</sub>', res.facingUC, ''),
          _calcRow('TwF2012', 'Foundation restoring moment', 'M<sub>g</sub> = G·d·P³', res.Mg, 'kN·m'),
          _calcRow('TwF2012', 'Overturning resistance', 'M<sub>go</sub> = M<sub>g</sub>·(P+2t)/(fulc+t)', res.Mgo, 'kN·m'),
          _calcRow('TwF2012', 'Factor of safety', 'FOS = M<sub>go</sub>/M<sub>k</sub> (≥1.5)', res.FOS, ''),
          _calcRow('TwF2012', 'Min. embedment (FOS=1.5)', 'P<sub>min</sub>', res.minP, 'm'),
        ].filter(r => r).join('');
      default:
        // Generic: first 5 numeric results
        return Object.entries(res)
          .filter(([k, v]) => k !== '_ran' && typeof v === 'number')
          .slice(0, 5)
          .map(([k, v]) => _calcRow('', k, '—', v, ''))
          .join('');
    }
  }

  // ── Check rows per type ──────────────────────────────────────────────────

  function _buildCheckRows(type, res) {
    if (!res || !res._ran) return '';
    const rows = [];

    switch (type) {
      case 'calc_beam':
        if (res.MEd !== undefined && res.MRd !== undefined)
          rows.push(_checkRow('Bending (M<sub>Ed</sub>/M<sub>Rd</sub>)', res.MEd, 'kNm', res.MRd, 'kNm', res.bendingUtil || res.MEd/res.MRd, res.bendingPass !== false && (res.MEd/res.MRd) <= 1.0));
        if (res.VEd !== undefined && res.VRd !== undefined)
          rows.push(_checkRow('Shear (V<sub>Ed</sub>/V<sub>Rd</sub>)', res.VEd, 'kN', res.VRd, 'kN', res.shearUtil || res.VEd/res.VRd, res.shearPass !== false && (res.VEd/res.VRd) <= 1.0));
        if (res.delta_actual !== undefined && res.delta_limit !== undefined)
          rows.push(_checkRow('Deflection (δ/δ<sub>lim</sub>)', res.delta_actual, 'mm', res.delta_limit, 'mm', res.deflectionUtil || res.delta_actual/res.delta_limit, res.deflectionPass !== false));
        break;
      case 'calc_column':
        if (res.NbRd !== undefined)
          rows.push(_checkRow('Axial buckling (N<sub>Ed</sub>/N<sub>b,Rd</sub>)', res.NEd_check || res.NEd, 'kN', res.NbRd, 'kN', res.utilisation, res.bucklingPass !== false && res.utilisation <= 1.0));
        break;
      case 'calc_rc_beam':
        if (res.As_req !== undefined && res.As_prov !== undefined)
          rows.push(_checkRow('Flexure (A<sub>s,req</sub>/A<sub>s,prov</sub>)', res.As_req, 'mm²', res.As_prov, 'mm²', res.flexureUtil || res.As_req/res.As_prov, res.flexurePass !== false));
        if (res.VRdc !== undefined)
          rows.push(_checkRow('Shear capacity', res.VEd_check || 0, 'kN', res.VRdc, 'kN', res.shearUtil, res.shearPass !== false));
        break;
      case 'calc_footing':
        if (res.q_net !== undefined && res.soilBearing !== undefined)
          rows.push(_checkRow('Bearing pressure', res.q_net, 'kPa', res.soilBearing, 'kPa', res.bearingUtil || res.q_net/res.soilBearing, res.bearingPass !== false));
        if (res.Vc !== undefined)
          rows.push(_checkRow('Punching shear', res.vEd_punching, 'kPa', res.vRdc, 'kPa', res.punchingUtil, res.punchingPass !== false));
        break;
      case 'calc_rc_column':
        if (res.NRd !== undefined)
          rows.push(_checkRow('Axial capacity', res.NEd || 0, 'kN', res.NRd, 'kN', res.utilisation || (res.NEd||0)/res.NRd, res.pass !== false));
        if (res.As_req !== undefined && res.As_prov !== undefined)
          rows.push(_checkRow('Reinforcement', res.As_req, 'mm²', res.As_prov, 'mm²', res.As_req/res.As_prov, res.rebarPass !== false));
        break;
      case 'calc_slab':
        if (res.As_req !== undefined && res.As_prov !== undefined)
          rows.push(_checkRow('Flexure', res.As_req, 'mm²/m', res.As_prov, 'mm²/m', res.flexureUtil || res.As_req/res.As_prov, res.flexurePass !== false));
        if (res.span_d_ratio !== undefined)
          rows.push(_checkRow('Deflection (span/d)', res.span_d_ratio, '', res.span_d_limit || 30, '', (res.span_d_ratio)/(res.span_d_limit||30), res.deflPass !== false));
        break;
      case 'calc_retaining':
        if (res.FoS_overturning !== undefined)
          rows.push(_checkRow('Overturning', 1, '', res.FoS_overturning, '', 1/res.FoS_overturning, res.overturningPass !== false));
        if (res.FoS_sliding !== undefined)
          rows.push(_checkRow('Sliding', 1, '', res.FoS_sliding, '', 1/res.FoS_sliding, res.slidingPass !== false));
        if (res.q_max !== undefined)
          rows.push(_checkRow('Bearing pressure', res.q_max, 'kPa', res.qa || 150, 'kPa', res.bearingUtil, res.bearingPass !== false));
        break;
      case 'calc_connection':
        if (res.VRd !== undefined && (res.VEd || 0) > 0)
          rows.push(_checkRow('Bolt group shear', res.VEd, 'kN', res.VRd, 'kN', res.utilisation || (res.VEd||0)/res.VRd, res.pass !== false));
        break;
      case 'calc_timber_col':
        if (res.NRd !== undefined)
          rows.push(_checkRow('Compression (with instability)', res.NEd || 0, 'kN', res.NRd, 'kN', res.utilisation || (res.NEd||0)/res.NRd, res.pass !== false));
        break;
      case 'calc_steel_member':
        if (res.interactionY !== undefined)
          rows.push(_checkRow('Combined (N+M, y-y)', res.interactionY, '', 1, '', res.interactionY, (res.interactionY||0) <= 1.0));
        if (res.interactionZ !== undefined)
          rows.push(_checkRow('Combined (N+M, z-z)', res.interactionZ, '', 1, '', res.interactionZ, (res.interactionZ||0) <= 1.0));
        if (res.VEd !== undefined && res.VcRd !== undefined)
          rows.push(_checkRow('Shear', res.VEd, 'kN', res.VcRd, 'kN', (res.VEd||0)/res.VcRd, res.shearPass !== false));
        break;
      case 'calc_bbs':
        if (res.total_weight !== undefined)
          rows.push(_checkRow('BBS Quantity', res.total_weight, 'kg', res.total_weight, 'kg', 1.0, true));
        break;
      case 'calc_section':
        if (res.A !== undefined)
          rows.push(_checkRow('Section properties computed', res.A, 'mm²', res.A, 'mm²', 1.0, true));
        break;
      case 'calc_load_takedown':
        if (res.NEd !== undefined)
          rows.push(_checkRow('Column ULS design load', res.NEd, 'kN', res.NEd, 'kN', 1.0, true));
        break;
      default:
        // Generic pass/fail from results
        if (res.overallPass !== undefined)
          rows.push(_checkRow('Overall', '—', '', '—', '', res.overallUtil || 0, res.overallPass));
        else if (res.bendingPass !== undefined)
          rows.push(_checkRow('Bending', res.MEd, 'kNm', res.MRd, 'kNm', res.bendingUtil, res.bendingPass));
    }

    if (rows.length === 0 && res.checks && Array.isArray(res.checks)) {
      return res.checks.map(c => _checkRow(c.checkName || c.label, c.Ed || 0, c.EdUnit || '', c.Rd || 0, c.RdUnit || '', c.util, c.pass)).join('');
    }

    return rows.join('');
  }

  // ── Main block router ────────────────────────────────────────────────────

  function _renderBlock(block, ctx) {
    const { allBlocks } = ctx;

    switch (block.type) {
      case 'title':            return ''; // handled separately as page header
      case 'section_header':   return _renderSectionHeader(block);
      case 'page_break':       return _renderPageBreak();
      case 'toc':              return ''; // rendered separately before body
      case 'text':
      case 'scope':
      case 'engineer_notes':   return _renderProse(block);
      case 'design_basis':     return _renderDesignBasis(block);
      case 'code_ref':         return _renderCodeRef(block);
      case 'load_table':       return _renderLoadTable(block);
      case 'image':            return _renderImage(block);
      case 'signoff':          return _renderSignoff(block);
      case 'revision_history': return _renderRevisionHistory(block);
      case 'checks_summary':   return _renderChecksSummary(block, allBlocks);
      case 'utilisation_chart':
        return _renderUtilisationChart(block, allBlocks);
      case 'project_info':     return ''; // info folded into title block
      default:
        if (block.type.startsWith('calc_')) return _renderCalcBlock(block);
        return '';
    }
  }

  function _renderUtilisationChart(block, allBlocks) {
    const checks = [];
    allBlocks.forEach(b => {
      if (!b.type.startsWith('calc_') || !b.results || !b.results._ran) return;
      const ext = (typeof BlockRegistry !== 'undefined' && BlockRegistry._extractChecks)
        ? BlockRegistry._extractChecks(b) : [];
      ext.forEach(c => checks.push({ label: (b.label || b.type) + ' — ' + (c.checkName || ''), util: typeof c.util === 'number' ? c.util : 0, pass: c.pass }));
    });

    if (checks.length === 0) return `<div class="rp-calc-section"><div class="rp-calc-header"><span class="rp-calc-title">Utilisation Chart</span></div><p style="padding:8pt;font-size:9pt;color:#666;">Run calculations to populate.</p></div>`;

    const bars = checks.map(c => {
      const pct = Math.min(c.util * 100, 100).toFixed(1);
      const color = c.pass ? '#006600' : '#cc0000';
      return `<tr>
        <td style="width:160pt;font-size:8pt">${esc(c.label)}</td>
        <td style="width:160pt">
          <div style="height:10pt;background:#e0e0e0;position:relative;">
            <div style="height:100%;width:${pct}%;background:${color};"></div>
          </div>
        </td>
        <td style="width:40pt;font-family:'Courier New',monospace;font-size:8pt;text-align:right">${(c.util).toFixed(3)}</td>
      </tr>`;
    }).join('');

    return `<div class="rp-calc-section">
  <div class="rp-calc-header"><span class="rp-calc-title">Utilisation Chart</span></div>
  <table style="width:100%;border-collapse:collapse;padding:8pt;font-size:9pt;margin:4pt 0;">
    <tbody>${bars}</tbody>
  </table>
</div>`;
  }

  // ── CSS ──────────────────────────────────────────────────────────────────

  function _getPreviewCSS() {
    return `
* { box-sizing:border-box; margin:0; padding:0; }
body { font-family:'Times New Roman',Times,serif; font-size:10pt; color:#000; background:#d0d0d0; }

.rp-page {
  width:210mm; min-height:297mm; background:white;
  margin:16px auto; padding:18mm 18mm 24mm 22mm;
  box-shadow:0 0 24px rgba(0,0,0,.25);
  position:relative;
}

/* ── Title block ── */
.rp-title-block { border:1.5pt solid #000; margin-bottom:18pt; font-family:'Times New Roman',serif; }
.rp-tb-header { display:flex; border-bottom:1pt solid #000; background:#000; color:#fff; }
.rp-tb-logo { width:46mm; padding:8pt 10pt; border-right:1pt solid #666; }
.rp-tb-company { flex:1; padding:8pt 10pt; }
.rp-tb-company-name { font-size:13pt; font-weight:bold; letter-spacing:2pt; font-family:'Times New Roman',serif; }
.rp-tb-main { padding:12pt 14pt; border-bottom:1pt solid #000; }
.rp-tb-report-type { font-size:8pt; font-weight:bold; text-transform:uppercase; letter-spacing:2.5pt; color:#555; margin-bottom:4pt; }
.rp-tb-project-title { font-size:14pt; font-weight:bold; margin-bottom:10pt; }
.rp-tb-project-grid { display:grid; grid-template-columns:80pt 1fr; gap:3pt 0; font-size:10pt; }
.rp-tb-project-grid .key { font-weight:bold; }
.rp-tb-meta { display:grid; grid-template-columns:1fr 1fr 1fr; }
.rp-tb-meta-cell { padding:6pt 10pt; border-right:1pt solid #000; }
.rp-tb-meta-cell:last-child { border-right:none; }
.rp-tb-meta-cell .mk { font-size:7pt; text-transform:uppercase; letter-spacing:.5pt; color:#555; }
.rp-tb-meta-cell .mv { font-size:10pt; font-weight:bold; margin-top:2pt; }
.rp-tb-statusbar { display:flex; flex-wrap:wrap; gap:0 16pt; background:#1a1a1a; color:#ddd; padding:5pt 12pt; font-family:Arial,sans-serif; font-size:8pt; border-top:1pt solid #000; }
.rp-tb-statusbar span { white-space:nowrap; }
.rp-tb-statusbar b { color:#fff; font-weight:bold; }
.rp-tb-statusbar-status { margin-left:auto; letter-spacing:.5pt; }

/* ── TOC ── */
.rp-toc { margin-bottom:20pt; border:1pt solid #000; page-break-after:avoid; }
.rp-toc-title { background:#000; color:white; padding:4pt 8pt; font-weight:bold; font-size:9pt; text-transform:uppercase; letter-spacing:1pt; }
.rp-toc-item { display:flex; border-bottom:.5pt dotted #ccc; padding:3pt 8pt; font-size:9pt; }
.rp-toc-num { width:30pt; font-weight:bold; }
.rp-toc-title-text { flex:1; }

/* ── Section headers ── */
.rp-section-header { font-size:11pt; font-weight:bold; text-transform:uppercase; letter-spacing:1pt; border-bottom:2pt solid #000; margin:20pt 0 10pt; padding-bottom:4pt; }
.rp-section-num { margin-right:8pt; }
.rp-subsection-title { font-size:8.5pt; font-weight:bold; text-transform:uppercase; letter-spacing:.5pt; background:#f0f0f0; padding:3pt 6pt; border-left:3pt solid #000; margin:10pt 0 4pt; }

/* ── Calc section ── */
.rp-calc-section { margin-bottom:18pt; border:1pt solid #bbb; }
.rp-calc-header { display:flex; justify-content:space-between; align-items:center; background:#000; color:white; padding:5pt 10pt; }
.rp-calc-title { font-weight:bold; font-size:10pt; font-family:'Times New Roman',serif; }
.rp-calc-headright { display:flex; align-items:center; gap:8pt; }
.rp-calc-code { font-size:8pt; opacity:.8; }
.rp-calc-tag { font-size:7pt; font-weight:bold; letter-spacing:.6pt; background:#fff; color:#000; padding:1pt 6pt; border-radius:2pt; font-family:Arial,sans-serif; }

/* ── Tables ── */
.rp-inputs-table, .rp-calc-table, .rp-checks-table { width:100%; border-collapse:collapse; font-size:9pt; table-layout:fixed; }
.rp-inputs-table td, .rp-calc-table td, .rp-checks-table td, .rp-checks-table th { padding:2.5pt 6pt; border:.5pt solid #ddd; vertical-align:middle; overflow:hidden; text-overflow:ellipsis; }
.rp-calc-table th, .rp-checks-table th { background:#ececec; font-weight:bold; text-align:left; font-size:8pt; text-transform:uppercase; letter-spacing:.3pt; color:#333; }
.rp-param { width:130pt; font-weight:bold; background:#fafafa; }
.rp-val { width:60pt; font-family:'Courier New',monospace; text-align:right; }
.rp-unit { width:35pt; color:#555; font-size:8pt; }
.rp-ref { color:#777; font-size:8pt; font-style:italic; }
.rp-clause { width:13%; color:#555; font-size:8pt; font-style:italic; white-space:nowrap; background:#fafafa; }
.rp-step-desc { width:31%; }
.rp-formula { font-style:italic; font-family:'Courier New',monospace; font-size:8.5pt; color:#333; }
.rp-calc-val { font-family:'Courier New',monospace; text-align:right; font-weight:bold; }
.rp-pass { color:#006600; font-weight:bold; }
.rp-fail { color:#cc0000; font-weight:bold; }

/* ── Engineering Diagrams ── */
.rp-diagram-section {
  margin:8pt 0 6pt;
  /* Force entire diagram section to greyscale for professional B&W printing */
  filter: grayscale(100%) contrast(1.15);
}
.rp-diagram-label {
  font-size:7.5pt; font-weight:bold; text-transform:uppercase;
  letter-spacing:.5pt; color:#000; margin-bottom:4pt;
  padding:2pt 6pt; background:#eee; border-left:2.5pt solid #000;
}
.rp-diagram-body {
  padding:6pt 4pt; text-align:center; background:#fff;
}
/* Constrain SVG height — diagrams should be compact in a report */
.rp-diagram-body svg {
  max-width:60%; max-height:110pt; height:auto; display:inline-block;
}
/* For beam type: two panels side by side, tighter */
.rp-beam-elevation-grid {
  display:grid; grid-template-columns:1fr 1fr; gap:6pt; margin-bottom:6pt;
}
.rp-beam-elevation-grid svg { max-width:100%; max-height:100pt; height:auto; }
/* Tabbed beam diagrams: 2×2 grid, small */
.rp-beam-diagrams {
  display:grid; grid-template-columns:1fr 1fr; gap:5pt; margin-top:4pt;
}
.rp-beam-diagram-panel {
  border:0.5pt solid #bbb; padding:3pt; background:#fafafa;
}
.rp-beam-diagram-label {
  font-size:6.5pt; font-weight:bold; text-align:center;
  color:#000; margin-bottom:2pt; text-transform:uppercase; letter-spacing:.2pt;
}
.rp-beam-diagram-panel svg { max-width:100%; max-height:80pt; height:auto; display:block; margin:0 auto; }

/* ── Prose ── */
.rp-prose { font-size:10pt; line-height:1.6; margin-bottom:10pt; }
.rp-prose-label { font-weight:bold; font-size:10pt; margin-bottom:4pt; }
.rp-assumption-list { margin:8pt 0 8pt 20pt; font-size:9pt; line-height:1.7; }

/* ── Figure ── */
.rp-figure { margin:10pt 0; text-align:center; }
.rp-figure figcaption { font-size:8pt; font-style:italic; color:#555; margin-top:4pt; }

/* ── Sign-off ── */
.rp-signoff-table { width:100%; border-collapse:collapse; margin:8pt 0; }
.rp-signoff-table td { border:1pt solid #000; padding:8pt 10pt; width:33.3%; vertical-align:top; height:55pt; }
.rp-signoff-label { font-size:7pt; text-transform:uppercase; letter-spacing:.5pt; font-weight:bold; color:#555; margin-bottom:4pt; }
.rp-signoff-line { border-top:.5pt solid #000; margin-top:24pt; padding-top:3pt; font-size:8pt; color:#555; font-style:italic; }

/* ── Page break ── */
.rp-page-break { page-break-after:always; border-top:1pt dashed #ccc; margin:20pt 0; }

/* ── Running footer ── */
.rp-running-footer {
  border-top:.5pt solid #ccc; padding-top:4pt; margin-top:20pt;
  display:flex; justify-content:space-between; font-size:7pt; color:#777;
}

/* ── Print ── */
@media print {
  body { background:white; }
  .rp-page { box-shadow:none; margin:0; padding:15mm 15mm 20mm 20mm; width:100%; }
  .rp-page-break { page-break-after:always; }
  .rp-calc-section { page-break-inside:avoid; }
  .rp-title-block { page-break-after:always; }
  .rp-tb-header, .rp-calc-header, .rp-tb-statusbar, .rp-calc-tag,
  .rp-calc-table th, .rp-checks-table th, .rp-clause, .rp-param, .rp-subsection-title,
  .rp-pass, .rp-fail { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  .rp-calc-section { page-break-inside:avoid; }
  .rp-diagram-section { page-break-inside:avoid; filter:grayscale(100%) contrast(1.15); }
  .rp-diagram-body svg { max-width:55%; max-height:100pt; }
  .rp-beam-elevation-grid { grid-template-columns:1fr 1fr; gap:5pt; }
  .rp-beam-elevation-grid svg { max-height:90pt; }
  .rp-beam-diagrams { grid-template-columns:1fr 1fr; gap:4pt; }
  .rp-beam-diagram-panel svg { max-height:72pt; }
}`;
  }

  // ── Public API ────────────────────────────────────────────────────────────

  function render(reportMeta, blocks) {
    const projectBlock = (blocks.find(b => b.type === 'project_info') || {}).config || {};
    const titleBlock   = (blocks.find(b => b.type === 'title') || {}).config || {};

    const ctx = { allBlocks: blocks };

    const bodyParts = blocks
      .map(block => _renderBlock(block, ctx))
      .filter(Boolean)
      .join('\n');

    const toc = _buildToc(blocks);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${esc(titleBlock.title || reportMeta.title || 'Calculation Report')} — BuildMetrics</title>
  <style>${_getPreviewCSS()}</style>
</head>
<body>
<div class="rp-page">

  ${_renderTitleBlock(titleBlock, projectBlock, reportMeta)}

  ${toc}

  <div class="rp-body">
    ${bodyParts}
  </div>

  ${_renderFooter(titleBlock, projectBlock)}

</div>
</body>
</html>`;
  }

  return { render };

})();

window.PreviewRenderer = PreviewRenderer;
if (typeof module !== 'undefined') module.exports = PreviewRenderer;
