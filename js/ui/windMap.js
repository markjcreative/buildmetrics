/**
 * BuildMetrics — Interactive UK Basic Wind Speed Map
 * BS EN 1991-1-4 NA Fig NA.1 — click a zone to read off Vb,0 (m/s).
 *
 * Usage:
 *   WindMap.open(function(vb0, regionName) { ... });
 *
 * Self-contained: injects its own modal overlay + SVG, no dependencies.
 */
const WindMap = (() => {

  // Simplified UK landmass + regional wind-speed zones (NA Fig NA.1).
  const UK_PATH = 'M260,15 L268,22 L272,35 L265,48 L270,58 L278,72 L280,88 L275,102 L282,116 L280,132 L288,148 L285,162 L292,178 L295,196 L288,212 L278,226 L268,238 L255,248 L244,256 L232,260 L220,264 L208,268 L196,264 L184,258 L172,250 L162,240 L154,228 L148,216 L144,204 L140,216 L132,226 L122,234 L110,238 L98,234 L88,226 L80,214 L76,200 L80,186 L76,172 L82,160 L78,148 L85,136 L80,122 L88,108 L84,94 L92,80 L96,66 L104,52 L112,38 L122,26 L134,16 L148,10 L162,8 L176,10 L188,18 L198,28 L210,20 L224,14 L238,10 L250,10 Z';
  const SCOT  = 'M148,10 L134,16 L122,26 L112,38 L104,52 L96,66 L92,80 L84,94 L88,108 L80,122 L85,136 L78,148 L82,160 L76,172 L68,162 L58,150 L50,136 L48,120 L52,106 L58,92 L52,78 L56,64 L62,50 L70,38 L80,28 L92,20 L106,14 L120,10 L134,8 L148,10 Z';
  const WALES = 'M144,204 L148,216 L140,216 L130,220 L118,218 L108,210 L100,200 L98,188 L104,178 L114,174 L126,176 L136,184 L142,196 Z';
  const NI    = 'M72,130 L68,118 L72,106 L80,100 L90,102 L96,110 L94,122 L86,130 L76,134 Z';
  const IRE   = 'M60,160 L55,148 L54,134 L58,120 L65,110 L54,106 L44,112 L38,126 L38,142 L44,156 L54,166 L65,168 Z';

  const ZONES = [
    { name: 'W. Scotland & Hebrides',  vb: 28, cx: 82,  cy: 52,  r: 18, fill: '#c84a4a' },
    { name: 'N. Scotland Highlands',   vb: 26, cx: 140, cy: 35,  r: 14, fill: '#e07030' },
    { name: 'NE Scotland coast',       vb: 26, cx: 222, cy: 60,  r: 12, fill: '#e07030' },
    { name: 'Northern Ireland',        vb: 26, cx: 76,  cy: 120, r: 10, fill: '#e07030' },
    { name: 'N. England & Pennines',   vb: 24, cx: 210, cy: 128, r: 14, fill: '#d4a020' },
    { name: 'NW England & N. Wales',   vb: 24, cx: 130, cy: 170, r: 14, fill: '#d4a020' },
    { name: 'Midlands & Central',      vb: 23, cx: 196, cy: 188, r: 18, fill: '#5aaa80' },
    { name: 'East Anglia & SE coast',  vb: 22, cx: 238, cy: 210, r: 16, fill: '#4a9e65' },
    { name: 'London & SE England',     vb: 22, cx: 210, cy: 232, r: 14, fill: '#4a9e65' },
    { name: 'SW England & Devon',      vb: 24, cx: 148, cy: 240, r: 14, fill: '#d4a020' },
    { name: 'Cornwall & W. Wales',     vb: 26, cx: 108, cy: 238, r: 12, fill: '#e07030' },
    { name: 'E. Midlands',             vb: 23, cx: 196, cy: 168, r: 12, fill: '#5aaa80' },
  ];

  let _overlay = null;

  function _buildSvg(onPick) {
    const NS = 'http://www.w3.org/2000/svg';
    let inner = `<rect width="520" height="680" fill="#c8dde8"/>`;
    inner += `<path d="${IRE}" fill="#c8d8c0" stroke="#8aaa8a" stroke-width="1"/>`;
    inner += `<path d="${NI}" fill="#d0e0c8" stroke="#7a9a7a" stroke-width="1"/>`;
    inner += `<path d="${UK_PATH}" fill="#e0ead8" stroke="#6a9a6a" stroke-width="1.5"/>`;
    inner += `<path d="${SCOT}" fill="#d8e6cc" stroke="#6a9a6a" stroke-width="1"/>`;
    inner += `<path d="${WALES}" fill="#d8e6cc" stroke="#6a9a6a" stroke-width="1"/>`;
    ZONES.forEach(z => {
      inner += `<circle cx="${z.cx*2}" cy="${z.cy*2}" r="${z.r*2}" fill="${z.fill}" opacity="0.55"/>`;
      inner += `<text x="${z.cx*2}" y="${z.cy*2+5}" text-anchor="middle" fill="#fff" font-size="15" font-weight="600" style="pointer-events:none">${z.vb}</text>`;
    });
    inner += `<circle id="wm-pin" cx="-40" cy="-40" r="11" fill="#c8a94a" stroke="#1a3a24" stroke-width="2" opacity="0"/>`;
    inner += `<circle id="wm-pin-in" cx="-40" cy="-40" r="4" fill="#1a3a24" opacity="0"/>`;
    inner += `<text x="260" y="672" text-anchor="middle" fill="#2d6a42" font-size="13" opacity="0.7" style="pointer-events:none">Vb,0 (m/s) — BS EN 1991-1-4 NA Fig NA.1</text>`;

    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 520 680');
    svg.setAttribute('width', '100%');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.style.cssText = 'display:block;max-height:62vh;cursor:crosshair;user-select:none';
    svg.innerHTML = inner;

    svg.addEventListener('click', e => {
      const rect = svg.getBoundingClientRect();
      const cx = (e.clientX - rect.left) * (520 / rect.width);
      const cy = (e.clientY - rect.top)  * (680 / rect.height);
      let best = ZONES[0], bestD = Infinity;
      ZONES.forEach(z => { const d = Math.hypot(cx - z.cx*2, cy - z.cy*2); if (d < bestD) { bestD = d; best = z; } });
      const pin = svg.querySelector('#wm-pin'), pinIn = svg.querySelector('#wm-pin-in');
      [pin, pinIn].forEach(p => { p.setAttribute('cx', cx); p.setAttribute('cy', cy); p.setAttribute('opacity', '0.9'); });
      const readout = _overlay && _overlay.querySelector('#wm-readout');
      if (readout) readout.textContent = `Vb,0 = ${best.vb} m/s — ${best.name}`;
      onPick(best.vb, best.name);
    });
    return svg;
  }

  function open(callback) {
    close();
    const ov = document.createElement('div');
    ov.className = 'wm-overlay';
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;font-family:Inter,system-ui,sans-serif';
    ov.addEventListener('click', e => { if (e.target === ov) close(); });

    const panel = document.createElement('div');
    panel.style.cssText = 'background:#fff;border-radius:12px;max-width:460px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.3);overflow:hidden;display:flex;flex-direction:column';

    const head = document.createElement('div');
    head.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid #E5E7EB';
    head.innerHTML = `<div><div style="font-weight:700;font-size:14px;color:#1F2937">UK Basic Wind Speed</div><div style="font-size:11px;color:#6B7280">Click the map to set V<sub>b,0</sub></div></div>`;
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = 'border:none;background:#F3F4F6;border-radius:6px;width:28px;height:28px;cursor:pointer;font-size:14px;color:#6B7280';
    closeBtn.addEventListener('click', close);
    head.appendChild(closeBtn);

    const body = document.createElement('div');
    body.style.cssText = 'padding:12px 16px';
    const readout = document.createElement('div');
    readout.id = 'wm-readout';
    readout.style.cssText = 'text-align:center;font-size:12px;color:#374151;margin-bottom:8px;min-height:16px';
    readout.textContent = 'Click your project location on the map…';

    const svg = _buildSvg((vb, name) => {
      if (typeof callback === 'function') callback(vb, name);
    });

    const legend = document.createElement('div');
    legend.style.cssText = 'display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:8px;font-size:10px;color:#6B7280';
    legend.innerHTML = [
      ['#c84a4a','28+'],['#e07030','26'],['#d4a020','24'],['#5aaa80','23'],['#4a9e65','22'],
    ].map(([c,v]) => `<span style="display:flex;align-items:center;gap:3px"><span style="width:10px;height:10px;border-radius:50%;background:${c};display:inline-block"></span>${v} m/s</span>`).join('');

    const foot = document.createElement('div');
    foot.style.cssText = 'padding:10px 16px;border-top:1px solid #E5E7EB;text-align:right';
    const done = document.createElement('button');
    done.textContent = 'Done';
    done.style.cssText = 'background:#2563EB;color:#fff;border:none;border-radius:6px;padding:7px 18px;font-size:12px;font-weight:600;cursor:pointer';
    done.addEventListener('click', close);
    foot.appendChild(done);

    body.appendChild(readout); body.appendChild(svg); body.appendChild(legend);
    panel.appendChild(head); panel.appendChild(body); panel.appendChild(foot);
    ov.appendChild(panel);
    document.body.appendChild(ov);
    _overlay = ov;
    document.addEventListener('keydown', _onKey);
  }

  function _onKey(e) { if (e.key === 'Escape') close(); }

  function close() {
    if (_overlay && _overlay.parentNode) _overlay.parentNode.removeChild(_overlay);
    _overlay = null;
    document.removeEventListener('keydown', _onKey);
  }

  return { open, close };
})();

window.WindMap = WindMap;
