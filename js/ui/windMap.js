/**
 * BuildMetrics — Interactive UK Basic Wind Speed Map
 * BS EN 1991-1-4 NA Fig NA.1 — fundamental basic wind velocity Vb,map.
 *
 * Real slippy map (Leaflet + OpenStreetMap, no API key). The engineer can:
 *   • type a UK postcode (postcodes.io) → jumps + reads off Vb,map, or
 *   • click anywhere on the map → reads off Vb,map at that point.
 *
 * Vb,map is estimated by inverse-distance interpolation of calibration
 * points taken from NA Fig NA.1 — a guide value the engineer confirms.
 *
 * Usage:  WindMap.open(function(vb0, locationLabel) { ... });
 */
const WindMap = (() => {

  const LEAFLET_CSS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
  const LEAFLET_JS  = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';

  // Calibration points [lat, lng, Vb,map m/s] — approximate NA Fig NA.1 values.
  const PTS = [
    [51.51,-0.13,21.8],[51.28,0.52,22.0],[50.90,-1.40,21.8],[50.82,-0.14,22.2],
    [51.45,-2.59,22.5],[52.20,0.12,22.2],[52.63,1.30,22.8],[52.49,-1.89,22.5],
    [52.95,-1.15,22.8],[53.48,-2.24,23.8],[53.41,-2.98,24.2],[53.80,-1.55,23.2],
    [53.38,-1.47,23.2],[53.74,-0.34,23.5],[54.97,-1.61,24.5],[54.89,-2.93,24.8],
    [51.48,-3.18,23.8],[51.62,-3.94,24.2],[52.41,-4.08,25.2],[53.31,-4.63,25.8],
    [50.37,-4.14,24.0],[50.12,-5.54,24.8],[54.15,-4.48,26.0],[54.60,-5.93,25.2],
    [55.00,-7.32,25.8],[55.86,-4.25,25.8],[55.95,-3.19,24.8],[56.46,-2.97,25.2],
    [57.15,-2.10,26.5],[57.48,-4.22,26.8],[56.82,-5.11,27.5],[58.44,-3.09,28.5],
    [58.21,-6.39,29.5],[58.98,-2.96,29.5],[60.15,-1.15,31.0]
  ];

  // Inverse-distance-weighted estimate (longitude compressed for UK latitude)
  function vbAt(lat, lng) {
    const kx = Math.cos(54.5 * Math.PI / 180);
    let num = 0, den = 0;
    for (let i = 0; i < PTS.length; i++) {
      const dx = (lng - PTS[i][1]) * kx, dy = lat - PTS[i][0];
      const d2 = dx * dx + dy * dy;
      if (d2 < 1e-6) return PTS[i][2];
      const w = 1 / (d2 * d2);            // power-4 → local
      num += w * PTS[i][2]; den += w;
    }
    return num / den;
  }
  const round05 = v => Math.round(v * 2) / 2;   // nearest 0.5 m/s

  let _overlay = null, _map = null, _marker = null, _leaflet = null, _onPick = null;

  function _loadLeaflet() {
    if (window.L) return Promise.resolve(window.L);
    if (_leaflet) return _leaflet;
    _leaflet = new Promise((resolve, reject) => {
      if (!document.querySelector('link[data-leaflet]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet'; link.href = LEAFLET_CSS; link.setAttribute('data-leaflet', '1');
        document.head.appendChild(link);
      }
      const s = document.createElement('script');
      s.src = LEAFLET_JS;
      s.onload = () => resolve(window.L);
      s.onerror = () => reject(new Error('Failed to load Leaflet'));
      document.head.appendChild(s);
    });
    return _leaflet;
  }

  function _setReadout(text, ok) {
    const r = _overlay && _overlay.querySelector('#wm-readout');
    if (r) { r.innerHTML = text; r.style.color = ok ? '#15803D' : '#374151'; }
  }

  function _pick(lat, lng, label) {
    const vb = round05(vbAt(lat, lng));
    if (_marker) _marker.setLatLng([lat, lng]);
    else _marker = _leafletMarker(lat, lng);
    _selected = { vb, label: label || (lat.toFixed(3) + ', ' + lng.toFixed(3)) };
    _setReadout('<b>V<sub>b,map</sub> = ' + vb.toFixed(1) + ' m/s</b> &nbsp;·&nbsp; ' + _selected.label, true);
    const applyBtn = _overlay.querySelector('#wm-apply');
    if (applyBtn) { applyBtn.disabled = false; applyBtn.style.opacity = '1'; applyBtn.textContent = 'Use ' + vb.toFixed(1) + ' m/s'; }
  }
  let _selected = null;

  function _leafletMarker(lat, lng) {
    const icon = window.L.divIcon({
      className: '', iconSize: [26, 26], iconAnchor: [13, 26],
      html: '<div style="width:22px;height:22px;border-radius:50% 50% 50% 0;background:#2563EB;border:2px solid #fff;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>'
    });
    return window.L.marker([lat, lng], { icon }).addTo(_map);
  }

  async function _searchPostcode() {
    const input = _overlay.querySelector('#wm-postcode');
    const pc = (input.value || '').trim();
    if (!pc) return;
    _setReadout('Looking up ' + pc + '…', false);
    try {
      const clean = pc.replace(/\s+/g, '');
      // Try full postcode, then outcode (partial)
      let res = await fetch('https://api.postcodes.io/postcodes/' + encodeURIComponent(pc));
      let data = await res.json();
      let lat, lng, label;
      if (res.ok && data.result) {
        lat = data.result.latitude; lng = data.result.longitude;
        label = (data.result.postcode || pc) + (data.result.admin_district ? ', ' + data.result.admin_district : '');
      } else {
        const oc = await fetch('https://api.postcodes.io/outcodes/' + encodeURIComponent(clean));
        const od = await oc.json();
        if (oc.ok && od.result) { lat = od.result.latitude; lng = od.result.longitude; label = od.result.outcode + ' (area)'; }
      }
      if (lat == null) { _setReadout('Postcode not found — try clicking the map instead.', false); return; }
      _map.setView([lat, lng], 11);
      _pick(lat, lng, label);
    } catch (e) {
      _setReadout('Lookup failed — click the map to pick a location.', false);
    }
  }

  function open(callback) {
    close();
    _onPick = callback;
    const ov = document.createElement('div');
    ov.className = 'wm-overlay';
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,.6);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;font-family:Inter,system-ui,sans-serif';
    ov.addEventListener('click', e => { if (e.target === ov) close(); });

    ov.innerHTML =
      '<div style="background:#fff;border-radius:14px;max-width:640px;width:100%;box-shadow:0 24px 70px rgba(0,0,0,.35);overflow:hidden;display:flex;flex-direction:column;max-height:92vh">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;padding:14px 16px;border-bottom:1px solid #E5E7EB">' +
          '<div><div style="font-weight:800;font-size:15px;color:#0F172A">UK Basic Wind Speed</div>' +
          '<div style="font-size:11px;color:#6B7280">BS EN 1991-1-4 NA Fig NA.1 — enter a postcode or click the map</div></div>' +
          '<button id="wm-close" style="border:none;background:#F3F4F6;border-radius:7px;width:30px;height:30px;cursor:pointer;font-size:15px;color:#6B7280">✕</button>' +
        '</div>' +
        '<div style="padding:12px 16px 0;display:flex;gap:8px">' +
          '<input id="wm-postcode" type="text" autocomplete="postal-code" placeholder="e.g. SW1A 1AA or M1" ' +
            'style="flex:1;padding:9px 12px;border:1.5px solid #E5E7EB;border-radius:8px;font-size:14px;text-transform:uppercase" />' +
          '<button id="wm-search" style="background:#2563EB;color:#fff;border:none;border-radius:8px;padding:9px 16px;font-size:13px;font-weight:600;cursor:pointer">Search</button>' +
        '</div>' +
        '<div id="wm-map" style="height:52vh;min-height:340px;margin:12px 16px;border-radius:10px;overflow:hidden;background:#E2E8F0;border:1px solid #E5E7EB"></div>' +
        '<div id="wm-readout" style="padding:0 16px 8px;font-size:13px;color:#374151;text-align:center;min-height:18px">Loading map…</div>' +
        '<div style="padding:10px 16px;border-top:1px solid #E5E7EB;display:flex;justify-content:space-between;align-items:center;gap:10px">' +
          '<span style="font-size:10.5px;color:#9CA3AF;line-height:1.4">Estimated from NA Fig NA.1 — verify against the published map for design.</span>' +
          '<button id="wm-apply" disabled style="background:#2563EB;color:#fff;border:none;border-radius:8px;padding:9px 18px;font-size:13px;font-weight:700;cursor:pointer;opacity:.45">Use value</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(ov);
    _overlay = ov;
    ov.querySelector('#wm-close').addEventListener('click', close);
    ov.querySelector('#wm-search').addEventListener('click', _searchPostcode);
    ov.querySelector('#wm-postcode').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); _searchPostcode(); } });
    ov.querySelector('#wm-apply').addEventListener('click', () => {
      if (_selected && typeof _onPick === 'function') _onPick(_selected.vb, _selected.label);
      close();
    });
    document.addEventListener('keydown', _onKey);

    _loadLeaflet().then(L => {
      _map = L.map(ov.querySelector('#wm-map'), { center: [54.6, -3.5], zoom: 5, minZoom: 4, maxZoom: 16 });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap', maxZoom: 19
      }).addTo(_map);
      _map.setMaxBounds([[48.5, -12], [61.5, 4]]);
      _map.on('click', e => _pick(e.latlng.lat, e.latlng.lng));
      _setReadout('Enter a postcode or click your project location on the map.', false);
      setTimeout(() => _map.invalidateSize(), 60);
    }).catch(() => {
      _setReadout('Map failed to load. Please check your connection and try again.', false);
    });
  }

  function _onKey(e) { if (e.key === 'Escape') close(); }

  function close() {
    if (_map) { try { _map.remove(); } catch (_) {} _map = null; }
    _marker = null; _selected = null;
    if (_overlay && _overlay.parentNode) _overlay.parentNode.removeChild(_overlay);
    _overlay = null;
    document.removeEventListener('keydown', _onKey);
  }

  return { open, close };
})();

window.WindMap = WindMap;
