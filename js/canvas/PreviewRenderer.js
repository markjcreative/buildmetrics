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
    // Two blocks collect a reference — "Report Reference" on the title block and
    // "Project Reference" on project info. Engineers fill in one or the other,
    // so accept either rather than printing a dash next to a filled-in field.
    const reportRef     = esc(titleCfg.ref || projCfg.projectRef || '—');
    const reportDate    = fmtDate(titleCfg.date);
    const revision      = esc(titleCfg.revision || 'Rev A');
    const projectName   = esc(projCfg.projectName || '—');
    const clientName    = esc(projCfg.clientName || '—');
    const location      = esc(projCfg.location || '—');
    const engineerName  = esc(projCfg.engineerName || '—');
    // This is the letterhead on a document the engineer submits to a client —
    // never fall back to our own brand here. A visible placeholder prompts them
    // to fill it in; silently printing "BuildMetrics" would ship out the door.
    const companyName   = esc(projCfg.companyName || '[ Company Name ]');
    const designCode    = esc(projCfg.designCode || 'Eurocode (EC2/EC3/EC5)');
    const status        = esc((reportMeta.status || 'DRAFT').toUpperCase());

    const statusClass = /FINAL|APPROVED|ISSUED/.test(status) ? 'ok'
                      : /DRAFT|REVIEW/.test(status) ? 'draft' : 'blue';

    // Optional letterhead contact details — only rendered when provided
    const cAddress = esc(projCfg.companyAddress || '');
    const cPhone   = esc(projCfg.companyPhone   || '');
    const cEmail   = esc(projCfg.companyEmail   || '');
    const contactBits = [cAddress, cPhone, cEmail].filter(Boolean).join('&nbsp;&nbsp;·&nbsp;&nbsp;');

    return `
<div class="rp-cover">
  <div class="rp-cover-band">
    <div>
      <div class="rp-cover-company">${companyName}</div>
      ${contactBits
        ? `<div class="rp-cover-company-contact">${contactBits}</div>`
        : `<div class="rp-cover-company-sub">Structural Engineering Calculations</div>`}
    </div>
    <div class="rp-cover-band-badge">Calculation Report</div>
  </div>

  <div class="rp-cover-body">
    <div class="rp-cover-eyebrow">Structural Calculation Report</div>
    <div class="rp-cover-title">${reportTitle}</div>
    <div class="rp-cover-rule"></div>

    <div class="rp-cover-grid">
      <div class="rp-cg-cell"><div class="rp-cg-k">Project</div><div class="rp-cg-v">${projectName}</div></div>
      <div class="rp-cg-cell"><div class="rp-cg-k">Client</div><div class="rp-cg-v">${clientName}</div></div>
      <div class="rp-cg-cell"><div class="rp-cg-k">Location</div><div class="rp-cg-v">${location}</div></div>
      <div class="rp-cg-cell"><div class="rp-cg-k">Design Code</div><div class="rp-cg-v">${designCode}</div></div>
    </div>

    <div class="rp-cover-meta">
      <div class="rp-cm-cell"><div class="rp-cm-k">Reference</div><div class="rp-cm-v">${reportRef}</div></div>
      <div class="rp-cm-cell"><div class="rp-cm-k">Date</div><div class="rp-cm-v">${reportDate}</div></div>
      <div class="rp-cm-cell"><div class="rp-cm-k">Revision</div><div class="rp-cm-v">${revision}</div></div>
      <div class="rp-cm-cell"><div class="rp-cm-k">Status</div><div class="rp-cm-v"><span class="rp-status ${statusClass}">${status}</span></div></div>
    </div>

    <div class="rp-cover-signoff">
      <div class="rp-cs-cell"><div class="rp-cs-k">Prepared By</div><div class="rp-cs-name">${engineerName}</div><div class="rp-cs-line">Signature &amp; date</div></div>
      <div class="rp-cs-cell"><div class="rp-cs-k">Checked By</div><div class="rp-cs-name">&nbsp;</div><div class="rp-cs-line">Signature &amp; date</div></div>
      <div class="rp-cs-cell"><div class="rp-cs-k">Approved By</div><div class="rp-cs-name">&nbsp;</div><div class="rp-cs-line">Signature &amp; date</div></div>
    </div>
  </div>

  <div class="rp-cover-foot">
    <div class="rp-cover-foot-note">This document contains structural design calculations prepared for the project named above. All calculations must be independently checked and verified by a qualified engineer before use for construction.</div>
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
        <span class="rp-toc-dots"></span>
      </div>`;
    }).join('');

    return `<div class="rp-toc">
  <div class="rp-toc-head">Contents</div>
  <div class="rp-toc-list">${rows}</div>
</div>`;
  }

  // ── Running footer ───────────────────────────────────────────────────────

  function _renderFooter(titleCfg, projCfg) {
    const ref  = esc(titleCfg.ref || '');
    const rev  = esc(titleCfg.revision || 'Rev A');
    // Never fall back to the BuildMetrics name here — this line is the client's
    // project identifier on a submitted document.
    const proj = esc(projCfg.projectName || projCfg.companyName || '');
    const bits = [proj, ref, rev].filter(Boolean).join(' · ');
    return `
<div class="rp-running-footer">
  <span>${bits}</span>
  <span class="rp-rf-note">All calculations to be checked and verified by a qualified engineer prior to construction.</span>
</div>
<div class="rp-finalprint">Prepared using BuildMetrics · buildmetrics.uk</div>`;
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
    // Escape first (prevents stored XSS), then convert newlines to <br> we control
    const text = esc(block.config.text || '').replace(/\n/g, '<br>');
    const label = block.config.label ? `<div class="rp-prose-label">${esc(block.config.label)}</div>` : '';
    return `${label}<div class="rp-prose">${text}</div>`;
  }

  function _renderDesignBasis(block) {
    const text  = esc(block.config.text || '').replace(/\n/g, '<br>');
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
    // Codes may be plain strings ("TwF2012 — guide…") or {name, description,
    // edition} objects — normalise strings the same way the canvas does.
    const norm = codes.map(c => {
      if (typeof c !== 'string') return c || {};
      const dash = c.indexOf('—');
      return dash > -1
        ? { name: c.slice(0, dash).trim(), description: c.slice(dash + 1).trim(), edition: '' }
        : { name: c, description: '', edition: '' };
    });
    const rows = norm.map(c => `<tr>
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
    // Fall back to the registry's human label before ever printing the raw
    // block type ("calc_column") into a client-facing document.
    const def = (window.BlockRegistry && window.BlockRegistry.getDefinition)
      ? window.BlockRegistry.getDefinition(block.type) : null;
    const label = esc(block.label || (def && def.label) || block.type);

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

  ${checkRows ? `<div class="rp-subsection-title">Design Checks</div>
  <table class="rp-checks-table">
    <thead><tr>
      <th>Check</th>
      <th>E<sub>d</sub></th>
      <th>R<sub>d</sub></th>
      <th>η = E<sub>d</sub>/R<sub>d</sub></th>
      <th>Status</th>
    </tr></thead>
    <tbody>${checkRows}</tbody>
  </table>` : ''}

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
    // Solvers group some outputs in sub-objects; alias them so the rows below
    // can read either a top-level key or its nested equivalent.
    const cap = res.capacities || {};
    const tot = res.totals || {};
    switch (type) {
      case 'calc_beam':
        return [
          _calcRow('EN1990 (6.10)', 'ULS design load', 'w = 1.35·G<sub>k</sub> + 1.5·Q<sub>k</sub>', (1.35*(cfg.Gk||0) + 1.5*(cfg.Qk||0)), 'kN/m'),
          _calcRow('EN1990', 'Design bending moment', 'M<sub>Ed</sub> = w·L²/8', res.MEd, 'kNm'),
          _calcRow('EC3 §6.2.5', 'Moment resistance', 'M<sub>Rd</sub> = f<sub>y</sub>·S<sub>xx</sub>/γ<sub>M0</sub>', res.MRd ?? cap.Mc_Rd, 'kNm'),
          _calcRow('EN1990', 'Design shear force', 'V<sub>Ed</sub> = w·L/2', res.VEd, 'kN'),
          _calcRow('EC3 §6.2.6', 'Shear resistance', 'V<sub>Rd</sub> = A<sub>v</sub>·f<sub>y</sub>/(√3·γ<sub>M0</sub>)', res.VRd ?? cap.Vc_Rd, 'kN'),
        ].join('');
      case 'calc_column':
        return [
          _calcRow('EC3 §6.3.1.3', 'Slenderness ratio', 'λ = L<sub>cr</sub>/i', res.lambdaZ || res.lambda_z, ''),
          _calcRow('EC3 §6.3.1.2', 'Non-dimensional slenderness', 'λ̄ = λ/λ<sub>1</sub>', res.lambdaBarZ || res.lambdaBar_z, ''),
          _calcRow('EC3 §6.3.1.2', 'Buckling reduction factor', 'χ (from buckling curve)', res.chiZ || res.chi_z, ''),
          _calcRow('EC3 §6.3.1.1', 'Buckling resistance', 'N<sub>b,Rd</sub> = χ·A·f<sub>y</sub>/γ<sub>M1</sub>', res.NbRd ?? res.Nb_Rd, 'kN'),
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
          _calcRow('EC7 §6.5.2', 'Net bearing pressure', 'q<sub>net</sub> = N/A<sub>ftg</sub>', res.q_net ?? res.netBearingPressure, 'kPa'),
          _calcRow('EN1990 (6.10)', 'ULS load', 'N<sub>ULS</sub> = 1.35·G<sub>k</sub> + 1.5·Q<sub>k</sub>', res.N_ULS ?? res.NEd, 'kN'),
        ].join('');
      case 'calc_wind':
        return [
          _calcRow('EN1991-1-4 §4.2', 'Basic wind velocity', 'v<sub>b</sub> = c<sub>dir</sub>·c<sub>season</sub>·v<sub>b0</sub>', res.vb, 'm/s'),
          _calcRow('EN1991-1-4 §4.3', 'Mean wind velocity', 'v<sub>m</sub> = c<sub>r</sub>·c<sub>o</sub>·v<sub>b</sub>', res.vm, 'm/s'),
          _calcRow('EN1991-1-4 §4.5', 'Peak velocity pressure', 'q<sub>p</sub> = [1+7·I<sub>v</sub>]·½·ρ·v<sub>m</sub>²', res.qp ?? res.qp_kPa, 'kN/m²'),
          _calcRow('EN1991-1-4 §5.3', 'Overall wind force', 'F<sub>w</sub> = c<sub>s</sub>c<sub>d</sub>·c<sub>f</sub>·q<sub>p</sub>·A<sub>ref</sub>', res.Fw_total ?? res.Fw_kN, 'kN'),
        ].join('');
      case 'calc_rc_column':
        return [
          _calcRow('EC2 §5.8.3.2', 'Effective length', 'l₀ = β·l', res.lo_eff ?? res.Leff_m ?? (cfg.lo||0), 'm'),
          _calcRow('EC2 §5.8.3', 'Slenderness ratio', 'λ = l₀/i', res.lambda, ''),
          _calcRow('EC2 §5.8.3.1', 'Limiting slenderness', 'λ<sub>lim</sub>', res.lambda_lim, ''),
          _calcRow('EC2 §5.8.8', 'Total moment (incl. 2nd order)', 'M<sub>Ed,tot</sub>', res.MEd_tot || res.MEd, 'kNm'),
          _calcRow('EC2 §6.1', 'Provided rebar area', 'A<sub>s</sub>', res.As_req ?? res.As_tot, 'mm²'),
        ].filter(r => r).join('');
      case 'calc_slab':
        return [
          _calcRow('EN1990 (6.10)', 'ULS applied load', 'n = 1.35·G<sub>k</sub> + 1.5·Q<sub>k</sub>', res.n_uls ?? res.wEd ?? (1.35*(cfg.gk||0)+1.5*(cfg.qk||0)), 'kN/m²'),
          _calcRow('EC2 §5.4', 'Design moment', 'M<sub>Ed</sub> = n·l²/8', res.MEd, 'kNm/m'),
          _calcRow('EC2 §4.4.1', 'Effective depth', 'd = h – c<sub>nom</sub> – φ/2', res.d_eff ?? res.d ?? ((cfg.thickness||200)-35), 'mm'),
          _calcRow('EC2 §9.3', 'Required reinforcement', 'A<sub>s,req</sub> per metre', res.As_req, 'mm²/m'),
          _calcRow('EC2 §7.4.2', 'Actual span/depth ratio', 'l/d', res.span_d_ratio ?? res.actualRatio, ''),
          _calcRow('EC2 §7.4.2', 'Permissible span/depth ratio', '(l/d)<sub>perm</sub>', res.allowedRatio, ''),
        ].filter(r => r).join('');
      case 'calc_retaining':
        return [
          _calcRow('Rankine', 'Active earth pressure coefficient', 'K<sub>a</sub> = tan²(45°–φ/2)', res.Ka, ''),
          _calcRow('EC7 §9.3', 'Active force', 'P<sub>a</sub> = ½·K<sub>a</sub>·γ·H²', res.Pa ?? res.Pa_total, 'kN/m'),
          _calcRow('EC7 §6.5.4', 'Overturning moment', 'M<sub>ov</sub>', res.Mov ?? res.Mo, 'kNm/m'),
          _calcRow('EC7 §6.5.4', 'Stabilising moment', 'M<sub>stab</sub>', res.Mstab ?? res.Ms, 'kNm/m'),
          _calcRow('EC7 §6.5.3', 'Sliding resistance', 'H<sub>Rd</sub> = N<sub>Ed</sub>·tan δ', res.Hrd ?? res.Fr, 'kN/m'),
        ].filter(r => r).join('');
      case 'calc_connection':
        return [
          // The solver runs an elastic bolt-group analysis, so report the group
          // properties and the worst-loaded bolt rather than a simple n·Fv,Rd.
          _calcRow('EC3 §3.6.1', 'Number of bolts in group', 'n', res.n, ''),
          _calcRow('EC3 §3.12', 'Polar moment of bolt group', 'I<sub>p</sub> = Σ(x²+y²)', res.Ip, 'mm²'),
          _calcRow('EC3 §3.12', 'Force on worst-loaded bolt', 'F<sub>Ed,max</sub>', res.maxBoltForce, 'kN'),
          _calcRow('EC3 §3.6.1', 'Bolt shear resistance', 'F<sub>v,Rd</sub> = α<sub>v</sub>·f<sub>ub</sub>·A<sub>s</sub>/γ<sub>M2</sub>', res.Fv_Rd ?? res.boltCapacity, 'kN'),
        ].filter(r => r).join('');
      case 'calc_timber_col':
        return [
          _calcRow('EC5 §2.4.1', 'Design compressive strength', 'f<sub>c,0,d</sub> = k<sub>mod</sub>·f<sub>c,0,k</sub>/γ<sub>M</sub>', res.fc0d ?? res.fc_0_d, 'MPa'),
          _calcRow('EC5 §6.3.2', 'Relative slenderness', 'λ<sub>rel,c</sub>', res.lambdaRel ?? res.lambda_rel_y, ''),
          _calcRow('EC5 §6.3.2', 'Instability factor', 'k<sub>c</sub>', res.kc ?? res.kc_gov, ''),
          _calcRow('EC5 §6.3.2', 'Design resistance', 'N<sub>Rd</sub> = k<sub>c</sub>·A·f<sub>c,0,d</sub>', res.NRd, 'kN'),
        ].filter(r => r).join('');
      case 'calc_steel_member':
        return [
          _calcRow('EC3 §5.5', 'Section classification', 'Class', res.sectionClass, ''),
          _calcRow('EC3 §6.2.5', 'Plastic moment resistance', 'M<sub>c,Rd</sub> = W<sub>pl</sub>·f<sub>y</sub>/γ<sub>M0</sub>', res.McRd ?? res.Mc_Rd, 'kNm'),
          _calcRow('EC3 §6.2.6', 'Shear resistance', 'V<sub>c,Rd</sub> = A<sub>v</sub>·f<sub>y</sub>/(√3·γ<sub>M0</sub>)', res.VcRd ?? res.Vc_Rd, 'kN'),
          _calcRow('EC3 §6.3.1', 'Compression resistance (minor axis)', 'N<sub>b,Rd,z</sub>', res.NbRd ?? res.Nb_Rd_z, 'kN'),
          _calcRow('EC3 §6.3.3', 'Combined interaction', 'η = N<sub>Ed</sub>/N<sub>b,Rd</sub> + M<sub>y,Ed</sub>/M<sub>c,Rd</sub>', res.interactionY ?? res.eta_combined, ''),
        ].filter(r => r).join('');
      case 'calc_bbs':
        return [
          _calcRow('BS 8666', 'Total bar count', '', res.bar_count ?? tot.total_bars ?? cfg.bar_count, 'bars'),
          _calcRow('BS 8666', 'Total steel weight', '', res.total_weight ?? tot.total_weight_kg ?? cfg.total_weight, 'kg'),
          _calcRow('BS 8666', 'Primary bar diameter', '', res.primary_dia ?? (res.bars && res.bars[0] && res.bars[0].dia) ?? cfg.primary_dia, 'mm'),
        ].filter(r => r).join('');
      case 'calc_section':
        return [
          // The solver returns pre-scaled properties (Ixx in 10⁶mm⁴, Z in 10³mm³);
          // label the units to match rather than silently mis-stating magnitude.
          _calcRow('Geometry', 'Cross-sectional area', 'A', res.A ?? res.A_mm2, 'mm²'),
          _calcRow('Geometry', 'Second moment of area (xx)', 'I<sub>xx</sub>', res.Ixx ?? res.Ixx_e6, '×10⁶ mm⁴'),
          _calcRow('Geometry', 'Second moment of area (yy)', 'I<sub>yy</sub>', res.Iyy ?? res.Iyy_e6, '×10⁶ mm⁴'),
          _calcRow('Geometry', 'Elastic modulus (xx)', 'W<sub>el,xx</sub> = I<sub>xx</sub>/y<sub>max</sub>', res.Wel_xx ?? res.Zxx_e3, '×10³ mm³'),
          _calcRow('Geometry', 'Plastic modulus (xx)', 'W<sub>pl,xx</sub>', res.Wpl_xx_e3, '×10³ mm³'),
          _calcRow('Geometry', 'Radius of gyration (xx)', 'i<sub>xx</sub> = √(I<sub>xx</sub>/A)', res.i_xx ?? res.rxx_mm, 'mm'),
        ].filter(r => r).join('');
      case 'calc_load_takedown':
        return [
          _calcRow('EN1991-1-1', 'Total unfactored (G<sub>k</sub>)', 'Σ dead load', res.total_Gk ?? res.totalGk, 'kN'),
          _calcRow('EN1991-1-1', 'Total unfactored (Q<sub>k</sub>)', 'Σ imposed load', res.total_Qk ?? res.totalQk, 'kN'),
          _calcRow('EN1990 (6.10)', 'ULS design load', 'N<sub>Ed</sub> = 1.35·G<sub>k</sub> + 1.5·Q<sub>k</sub>', res.NEd ?? res.totalULS, 'kN'),
          _calcRow('EN1990 (6.14)', 'SLS service load', 'N<sub>SLS</sub> = G<sub>k</sub> + Q<sub>k</sub>', res.N_SLS ?? res.totalSLS, 'kN'),
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

    // A solver-supplied checks[] is authoritative: it already carries Ed, Rd,
    // the utilisation, the clause reference and the formula. Use it in
    // preference to the per-type rows below, which exist for solvers that
    // don't publish one.
    if (Array.isArray(res.checks) && res.checks.length) {
      return res.checks.map(c => _checkRow(
        c.name || c.checkName || c.label || 'Check',
        c.Ed != null ? c.Ed : '—', c.EdUnit || c.unit || '',
        c.Rd != null ? c.Rd : '—', c.RdUnit || c.unit || '',
        c.util, c.pass
      )).join('');
    }

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
      case 'calc_column': {
        const NbRd = res.NbRd ?? res.Nb_Rd;
        if (NbRd !== undefined)
          rows.push(_checkRow('Axial buckling (N<sub>Ed</sub>/N<sub>b,Rd</sub>)', res.NEd_check || res.NEd, 'kN', NbRd, 'kN', res.utilisation, res.bucklingPass !== false && res.utilisation <= 1.0));
        if (res.Npl_Rd !== undefined)
          rows.push(_checkRow('Cross-section squash (N<sub>Ed</sub>/N<sub>pl,Rd</sub>)', res.NEd, 'kN', res.Npl_Rd, 'kN', res.utilisationSquash, (res.utilisationSquash ?? 0) <= 1.0));
        break;
      }
      case 'calc_rc_beam':
        if (res.As_req !== undefined && res.As_prov !== undefined)
          rows.push(_checkRow('Flexure (A<sub>s,req</sub>/A<sub>s,prov</sub>)', res.As_req, 'mm²', res.As_prov, 'mm²', res.flexureUtil || res.As_req/res.As_prov, res.flexurePass !== false));
        if (res.VRdc !== undefined)
          rows.push(_checkRow('Shear capacity', res.VEd_check || 0, 'kN', res.VRdc, 'kN', res.shearUtil, res.shearPass !== false));
        break;
      case 'calc_footing': {
        const qNet = res.q_net ?? res.netBearingPressure;
        if (qNet !== undefined && res.soilBearing !== undefined)
          rows.push(_checkRow('Bearing pressure', qNet, 'kPa', res.soilBearing, 'kPa', res.bearingUtil || qNet/res.soilBearing, res.bearingPass !== false));
        if (res.VRd_punch !== undefined)
          rows.push(_checkRow('Punching shear', Math.abs(res.VEd_punch ?? 0), 'kN', res.VRd_punch, 'kN', Math.abs(res.VEd_punch ?? 0)/res.VRd_punch, res.punchPass !== false));
        if (res.VRd_shear !== undefined)
          rows.push(_checkRow('Transverse shear', res.VEd_shear, 'kN', res.VRd_shear, 'kN', (res.VEd_shear ?? 0)/res.VRd_shear, res.shearPass !== false));
        break;
      }
      case 'calc_rc_column':
        if (res.NRd !== undefined)
          rows.push(_checkRow('Axial capacity', res.NEd || 0, 'kN', res.NRd, 'kN', res.utilisation || (res.NEd||0)/res.NRd, res.pass !== false));
        if (res.As_req !== undefined && res.As_prov !== undefined)
          rows.push(_checkRow('Reinforcement', res.As_req, 'mm²', res.As_prov, 'mm²', res.As_req/res.As_prov, res.rebarPass !== false));
        break;
      case 'calc_slab':
        if (res.As_req !== undefined && res.As_prov !== undefined)
          rows.push(_checkRow('Flexure', res.As_req, 'mm²/m', res.As_prov, 'mm²/m', res.flexureUtil || res.As_req/res.As_prov, res.flexurePass !== false));
        if (res.actualRatio !== undefined && res.allowedRatio !== undefined)
          rows.push(_checkRow('Deflection (span/d)', res.actualRatio, '', res.allowedRatio, '', res.actualRatio/res.allowedRatio, res.deflPass !== false));
        else if (res.span_d_ratio !== undefined)
          rows.push(_checkRow('Deflection (span/d)', res.span_d_ratio, '', res.span_d_limit || 30, '', (res.span_d_ratio)/(res.span_d_limit||30), res.deflPass !== false));
        if (res.VRd_c !== undefined)
          rows.push(_checkRow('Shear (V<sub>Ed</sub>/V<sub>Rd,c</sub>)', res.VEd, 'kN/m', res.VRd_c, 'kN/m', (res.VEd ?? 0)/res.VRd_c, res.shearPass !== false));
        break;
      case 'calc_retaining': {
        // FOS checks are inverted: utilisation is required/achieved.
        const fosOt = res.FoS_overturning ?? res.FOS_overturning;
        const fosSl = res.FoS_sliding ?? res.FOS_sliding;
        if (fosOt !== undefined)
          rows.push(_checkRow('Overturning (FOS ≥ 1.5)', 1.5, '', fosOt, '', 1.5/fosOt, res.overturningPass !== false));
        if (fosSl !== undefined)
          rows.push(_checkRow('Sliding (FOS ≥ 1.5)', 1.5, '', fosSl, '', 1.5/fosSl, res.slidingPass !== false));
        if (res.q_max !== undefined)
          rows.push(_checkRow('Bearing pressure', res.q_max, 'kPa', res.qa || res.soilBearing || 150, 'kPa', res.q_max/(res.qa || res.soilBearing || 150), res.bearingPass !== false));
        if (res.eccentricity !== undefined && res.e_limit !== undefined)
          rows.push(_checkRow('Eccentricity (middle third)', res.eccentricity, 'm', res.e_limit, 'm', res.eccentricity/res.e_limit, res.tensionPass !== false));
        break;
      }
      case 'calc_connection': {
        const cap = res.VRd ?? res.boltCapacity;
        const dem = res.VEd ?? res.maxBoltForce;
        if (cap !== undefined && (dem || 0) > 0)
          rows.push(_checkRow('Bolt group shear (worst bolt)', dem, 'kN', cap, 'kN', res.utilisation || dem/cap, res.pass !== false));
        break;
      }
      case 'calc_timber_col':
        if (res.NRd !== undefined)
          rows.push(_checkRow('Compression (with instability)', res.NEd || 0, 'kN', res.NRd, 'kN', res.utilisation || (res.NEd||0)/res.NRd, res.pass !== false));
        break;
      case 'calc_steel_member': {
        const McRd = res.McRd ?? res.Mc_Rd, VcRd = res.VcRd ?? res.Vc_Rd;
        if (res.My_Ed !== undefined && McRd !== undefined)
          rows.push(_checkRow('Bending (M<sub>y,Ed</sub>/M<sub>c,Rd</sub>)', res.My_Ed, 'kNm', McRd, 'kNm', res.eta_M ?? res.My_Ed/McRd, (res.eta_M ?? res.My_Ed/McRd) <= 1.0));
        if (res.Vz_Ed !== undefined && VcRd !== undefined)
          rows.push(_checkRow('Shear (V<sub>Ed</sub>/V<sub>c,Rd</sub>)', res.Vz_Ed, 'kN', VcRd, 'kN', res.Vz_Ed/VcRd, res.pass_shear !== false));
        if (res.Nb_Rd_z !== undefined)
          rows.push(_checkRow('Flexural buckling (z-z)', res.NEd ?? 0, 'kN', res.Nb_Rd_z, 'kN', (res.NEd ?? 0)/res.Nb_Rd_z, res.pass_buckling !== false));
        const eta = res.interactionY ?? res.eta_combined;
        if (eta !== undefined)
          rows.push(_checkRow('Combined (N+M)', eta, '', 1, '', eta, (eta||0) <= 1.0));
        break;
      }
      // BBS, section properties and load take-downs are schedules/derivations,
      // not capacity checks — they have no pass/fail to report.
      case 'calc_bbs':
      case 'calc_section':
      case 'calc_load_takedown':
        return '';
      default:
        // Generic pass/fail from results
        if (res.overallPass !== undefined)
          rows.push(_checkRow('Overall', '—', '', '—', '', res.overallUtil || 0, res.overallPass));
        else if (res.bendingPass !== undefined)
          rows.push(_checkRow('Bending', res.MEd, 'kNm', res.MRd, 'kNm', res.bendingUtil, res.bendingPass));
    }

    // Last resort: derive rows from the solver's own pass flags so the Design
    // Checks table is never printed empty.
    if (rows.length === 0) return _deriveCheckRows(res);

    return rows.join('');
  }

  // Pass flags appear as `somethingPass` or `pass_something` depending on the
  // solver. Turn whichever are present into check rows, pairing each with its
  // utilisation if the solver exposes one under a matching name.
  const _CHECK_LABELS = {
    punch: 'Punching shear', defl: 'Deflection', overturning: 'Overturning',
    sliding: 'Sliding', tension: 'Bearing (no tension)', bearing: 'Bearing',
    section: 'Cross-section capacity', buckling: 'Buckling',
    combined: 'Combined (N+M)', shear: 'Shear', bending: 'Bending',
  };

  function _deriveCheckRows(res) {
    const rows = [];
    const seen = new Set();

    Object.keys(res).forEach(key => {
      let stem = null;
      const m1 = key.match(/^(.+)Pass$/);          // e.g. punchPass
      const m2 = key.match(/^pass_(.+)$/);         // e.g. pass_combined
      if (m1) stem = m1[1];
      else if (m2) stem = m2[1];
      if (!stem || typeof res[key] !== 'boolean') return;

      const norm = stem.toLowerCase();
      if (seen.has(norm)) return;
      seen.add(norm);

      const util = res[stem + 'Util'] ?? res[stem + 'Utilisation'] ??
                   res['util_' + stem] ?? res[norm + 'UC'];
      const label = _CHECK_LABELS[norm] ||
                    stem.replace(/[_-]/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2')
                        .replace(/^./, s => s.toUpperCase());
      // util_* values in some solvers are percentages, not ratios
      const ratio = typeof util === 'number' && util > 3 ? util / 100 : util;
      rows.push(_checkRow(label, '—', '', '—', '', ratio, res[key]));
    });

    if (rows.length === 0 && res.pass !== undefined) {
      const u = res.utilisation ?? res.governingUtil ??
                (res.utilisationPct != null ? res.utilisationPct / 100 : undefined);
      rows.push(_checkRow('Overall', '—', '', '—', '', u, res.pass));
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
:root {
  --bm-navy:#0F172A; --bm-blue:#2563EB; --bm-blue-dark:#1D4ED8;
  --bm-blue-light:#EFF6FF; --bm-blue-mid:#DBEAFE;
  --bm-text:#1F2937; --bm-muted:#64748B; --bm-border:#E2E8F0; --bm-line:#EEF2F7;
  --bm-green:#15803D; --bm-green-bg:#DCFCE7; --bm-green-bd:#BBF7D0;
  --bm-red:#B91C1C; --bm-red-bg:#FEE2E2; --bm-red-bd:#FECACA;
  --bm-amber:#B45309; --bm-amber-bg:#FEF3C7;
}
* { box-sizing:border-box; margin:0; padding:0; }
body { font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif; font-size:10pt; color:var(--bm-text); background:#E2E8F0; }

.rp-page {
  width:210mm; min-height:297mm; background:#fff;
  margin:16px auto; padding:16mm 16mm 22mm 16mm;
  box-shadow:0 6px 30px rgba(15,23,42,.18);
  position:relative;
}

/* ── Cover page ── */
.rp-cover { display:flex; flex-direction:column; min-height:262mm; page-break-after:always; }
.rp-cover-band {
  background:linear-gradient(135deg,var(--bm-navy) 0%,var(--bm-blue-dark) 100%);
  color:#fff; padding:20pt 22pt; border-radius:8pt; display:flex;
  justify-content:space-between; align-items:center;
}
.rp-cover-company { font-size:20pt; font-weight:800; letter-spacing:-.3pt; }
.rp-cover-company-sub { font-size:8.5pt; color:rgba(255,255,255,.7); margin-top:3pt; letter-spacing:.4pt; }
.rp-cover-company-contact { font-size:8pt; color:rgba(255,255,255,.75); margin-top:5pt; line-height:1.5; }
.rp-cover-band-badge { font-size:8pt; font-weight:700; text-transform:uppercase; letter-spacing:1pt; background:rgba(255,255,255,.15); border:1pt solid rgba(255,255,255,.3); padding:5pt 12pt; border-radius:99pt; }
.rp-cover-body { flex:1; padding:34pt 4pt 0; }
.rp-cover-eyebrow { font-size:9pt; font-weight:700; text-transform:uppercase; letter-spacing:2.5pt; color:var(--bm-blue); margin-bottom:8pt; }
.rp-cover-title { font-size:26pt; font-weight:800; color:var(--bm-navy); line-height:1.15; letter-spacing:-.5pt; }
.rp-cover-rule { height:3pt; width:70pt; background:var(--bm-blue); border-radius:2pt; margin:14pt 0 26pt; }
.rp-cover-grid { display:grid; grid-template-columns:1fr 1fr; gap:0; border:1pt solid var(--bm-border); border-radius:8pt; overflow:hidden; }
.rp-cg-cell { padding:12pt 16pt; border-right:1pt solid var(--bm-border); border-bottom:1pt solid var(--bm-border); }
.rp-cg-cell:nth-child(2n) { border-right:none; }
.rp-cg-cell:nth-last-child(-n+2) { border-bottom:none; }
.rp-cg-k { font-size:7.5pt; font-weight:700; text-transform:uppercase; letter-spacing:.6pt; color:var(--bm-muted); margin-bottom:3pt; }
.rp-cg-v { font-size:11.5pt; font-weight:600; color:var(--bm-navy); }
.rp-cover-meta { display:grid; grid-template-columns:repeat(4,1fr); gap:8pt; margin-top:14pt; }
.rp-cm-cell { background:var(--bm-blue-light); border:1pt solid var(--bm-blue-mid); border-radius:7pt; padding:9pt 12pt; }
.rp-cm-k { font-size:7pt; font-weight:700; text-transform:uppercase; letter-spacing:.5pt; color:var(--bm-blue-dark); margin-bottom:3pt; }
.rp-cm-v { font-size:11pt; font-weight:700; color:var(--bm-navy); }
.rp-status { display:inline-block; font-size:8.5pt; font-weight:800; letter-spacing:.5pt; padding:2pt 9pt; border-radius:99pt; }
.rp-status.ok { color:var(--bm-green); background:var(--bm-green-bg); border:1pt solid var(--bm-green-bd); }
.rp-status.draft { color:var(--bm-amber); background:var(--bm-amber-bg); border:1pt solid #FDE68A; }
.rp-status.blue { color:var(--bm-blue-dark); background:var(--bm-blue-mid); border:1pt solid #BFDBFE; }
.rp-cover-signoff { display:grid; grid-template-columns:repeat(3,1fr); gap:12pt; margin-top:34pt; }
.rp-cs-cell { border:1pt solid var(--bm-border); border-top:3pt solid var(--bm-blue); border-radius:6pt; padding:11pt 13pt; }
.rp-cs-k { font-size:7.5pt; font-weight:700; text-transform:uppercase; letter-spacing:.5pt; color:var(--bm-muted); }
.rp-cs-name { font-size:11pt; font-weight:600; color:var(--bm-navy); min-height:15pt; margin-top:4pt; }
.rp-cs-line { border-top:.7pt solid var(--bm-border); margin-top:24pt; padding-top:4pt; font-size:7.5pt; color:var(--bm-muted); }
.rp-cover-foot { margin-top:auto; padding-top:16pt; border-top:1pt solid var(--bm-border); }
.rp-cover-foot-note { font-size:7.5pt; color:var(--bm-muted); line-height:1.5; }

/* ── TOC ── */
.rp-toc { margin-bottom:22pt; page-break-after:always; }
.rp-toc-head { font-size:16pt; font-weight:800; color:var(--bm-navy); border-bottom:2.5pt solid var(--bm-blue); padding-bottom:6pt; margin-bottom:12pt; letter-spacing:-.3pt; }
.rp-toc-list { }
.rp-toc-item { display:flex; align-items:baseline; padding:6pt 4pt; font-size:10.5pt; border-bottom:.6pt solid var(--bm-line); }
.rp-toc-num { width:34pt; font-weight:700; color:var(--bm-blue); }
.rp-toc-title-text { color:var(--bm-navy); font-weight:600; }
.rp-toc-dots { flex:1; }

/* ── Section headers ── */
.rp-section-header { font-size:13pt; font-weight:800; color:var(--bm-navy); border-bottom:2pt solid var(--bm-blue); margin:20pt 0 12pt; padding-bottom:5pt; letter-spacing:-.2pt; }
.rp-section-num { margin-right:8pt; color:var(--bm-blue); }
.rp-subsection-title { font-size:8.5pt; font-weight:700; text-transform:uppercase; letter-spacing:.6pt; color:var(--bm-blue-dark); background:var(--bm-blue-light); padding:4pt 8pt; border-left:3pt solid var(--bm-blue); margin:12pt 0 5pt; border-radius:0 4pt 4pt 0; }

/* ── Calc section ── */
.rp-calc-section { margin-bottom:18pt; border:1pt solid var(--bm-border); border-radius:8pt; overflow:hidden; }
.rp-calc-header { display:flex; justify-content:space-between; align-items:center; background:linear-gradient(135deg,var(--bm-navy) 0%,var(--bm-blue-dark) 100%); color:#fff; padding:7pt 12pt; }
.rp-calc-title { font-weight:700; font-size:10.5pt; }
.rp-calc-headright { display:flex; align-items:center; gap:8pt; }
.rp-calc-code { font-size:8pt; opacity:.75; }
.rp-calc-tag { font-size:7pt; font-weight:800; letter-spacing:.6pt; background:#fff; color:var(--bm-blue-dark); padding:2pt 7pt; border-radius:99pt; }

/* ── Tables ── */
.rp-inputs-table, .rp-calc-table, .rp-checks-table { width:100%; border-collapse:collapse; font-size:9pt; table-layout:fixed; }
/* Every header and cell gets the same padding — without it the right-aligned
   Value header butts straight into the Unit header. Values wrap rather than
   truncate: a clipped number in a calculation sheet is a defect, not a style. */
.rp-inputs-table td, .rp-calc-table td, .rp-checks-table td,
.rp-inputs-table th, .rp-calc-table th, .rp-checks-table th { padding:3pt 8pt; border:.6pt solid var(--bm-border); vertical-align:middle; overflow-wrap:anywhere; }
.rp-calc-table th, .rp-checks-table th { background:var(--bm-blue-light); font-weight:700; text-align:left; font-size:8pt; text-transform:uppercase; letter-spacing:.3pt; color:var(--bm-blue-dark); }
.rp-inputs-table tr:nth-child(even) td { background:#FBFCFE; }
.rp-param { width:130pt; font-weight:600; background:var(--bm-blue-light); color:var(--bm-navy); }
.rp-val { width:60pt; font-family:'SF Mono','Courier New',monospace; text-align:right; }
.rp-unit { width:35pt; color:var(--bm-muted); font-size:8pt; }
.rp-ref { color:var(--bm-muted); font-size:8pt; font-style:italic; }
.rp-clause { width:13%; color:var(--bm-blue-dark); font-size:8pt; font-style:italic; white-space:nowrap; background:var(--bm-blue-light); font-weight:600; }
.rp-step-desc { width:31%; }
.rp-formula { font-style:italic; font-family:'SF Mono','Courier New',monospace; font-size:8.5pt; color:#334155; }
.rp-calc-val { font-family:'SF Mono','Courier New',monospace; text-align:right; font-weight:700; color:var(--bm-navy); }
.rp-pass { color:var(--bm-green); font-weight:800; }
.rp-fail { color:var(--bm-red); font-weight:800; }

/* ── Engineering Diagrams (full colour) ── */
.rp-diagram-section { margin:10pt 0 6pt; page-break-inside:avoid; }
.rp-diagram-label { font-size:7.5pt; font-weight:700; text-transform:uppercase; letter-spacing:.5pt; color:var(--bm-blue-dark); margin-bottom:5pt; padding:3pt 8pt; background:var(--bm-blue-light); border-left:2.5pt solid var(--bm-blue); border-radius:0 4pt 4pt 0; }
.rp-diagram-body { padding:6pt 4pt; text-align:center; background:#fff; }
.rp-diagram-body svg { max-width:62%; max-height:120pt; height:auto; display:inline-block; }
.rp-beam-elevation-grid { display:grid; grid-template-columns:1fr 1fr; gap:6pt; margin-bottom:6pt; }
.rp-beam-elevation-grid svg { max-width:100%; max-height:105pt; height:auto; }
.rp-beam-diagrams { display:grid; grid-template-columns:1fr 1fr; gap:5pt; margin-top:4pt; }
.rp-beam-diagram-panel { border:.6pt solid var(--bm-border); border-radius:5pt; padding:4pt; background:#FBFCFE; }
.rp-beam-diagram-label { font-size:6.5pt; font-weight:700; text-align:center; color:var(--bm-muted); margin-bottom:2pt; text-transform:uppercase; letter-spacing:.2pt; }
.rp-beam-diagram-panel svg { max-width:100%; max-height:85pt; height:auto; display:block; margin:0 auto; }

/* ── Prose ── */
.rp-prose { font-size:10pt; line-height:1.6; margin-bottom:10pt; }
.rp-prose-label { font-weight:700; font-size:10pt; margin-bottom:4pt; color:var(--bm-navy); }
.rp-assumption-list { margin:8pt 0 8pt 20pt; font-size:9pt; line-height:1.7; }

/* ── Figure ── */
.rp-figure { margin:10pt 0; text-align:center; }
.rp-figure figcaption { font-size:8pt; font-style:italic; color:var(--bm-muted); margin-top:4pt; }

/* ── Sign-off ── */
.rp-signoff-table { width:100%; border-collapse:collapse; margin:8pt 0; }
.rp-signoff-table td { border:1pt solid var(--bm-border); padding:8pt 10pt; width:33.3%; vertical-align:top; height:55pt; }
.rp-signoff-label { font-size:7pt; text-transform:uppercase; letter-spacing:.5pt; font-weight:700; color:var(--bm-muted); margin-bottom:4pt; }
.rp-signoff-line { border-top:.6pt solid var(--bm-border); margin-top:24pt; padding-top:3pt; font-size:8pt; color:var(--bm-muted); font-style:italic; }

/* ── Page break ── */
.rp-page-break { page-break-after:always; }

/* ── Running footer ── */
.rp-running-footer { border-top:1pt solid var(--bm-border); padding-top:6pt; margin-top:22pt; display:flex; justify-content:space-between; align-items:center; gap:10pt; font-size:7.5pt; color:var(--bm-muted); }
.rp-running-footer b { color:var(--bm-blue-dark); }
.rp-rf-note { font-style:italic; }
.rp-finalprint { text-align:center; font-size:6.5pt; color:#B0B8C4; margin-top:8pt; letter-spacing:.2pt; }

/* ── Print ── */
@media print {
  body { background:#fff; }
  .rp-page { box-shadow:none; margin:0; padding:14mm 14mm 18mm 14mm; width:100%; }
  .rp-page-break { page-break-after:always; }
  .rp-cover, .rp-toc { page-break-after:always; }
  .rp-calc-section, .rp-diagram-section { page-break-inside:avoid; }
  * { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
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
  <title>${esc(titleBlock.title || reportMeta.title || 'Calculation Report')}${projectBlock.companyName ? ' — ' + esc(projectBlock.companyName) : ''}</title>
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
