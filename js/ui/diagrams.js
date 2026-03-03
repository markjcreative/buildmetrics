/**
 * diagrams.js — SVG diagram rendering for SFD, BMD, Deflection, and Beam Preview
 */

const DIAGRAM_PADDING = { top: 40, right: 30, bottom: 50, left: 70 };
const COLORS = {
    beam: '#1A56DB',
    positive: 'rgba(22,163,74,0.15)',
    negative: 'rgba(220,38,38,0.15)',
    positiveLine: '#16A34A',
    negativeLine: '#DC2626',
    deflection: 'rgba(124,58,237,0.12)',
    deflectionLine: '#7C3AED',
    neutral: '#9CA3AF',
    support: '#D97706',
    load: '#EA580C',
    moment: '#BE185D',
    reaction: '#0369A1',
    grid: 'rgba(0,0,0,0.045)',
    axis: 'rgba(0,0,0,0.18)',
    text: '#525252',
    beamBody: '#1A56DB'
};

// ─── Coordinate Helpers ─────────────────────────────────────────────────────

function getPlotArea(svgEl) {
    const w = svgEl.clientWidth || svgEl.getBoundingClientRect().width || 600;
    const h = svgEl.clientHeight || svgEl.getBoundingClientRect().height || 200;
    return {
        x0: DIAGRAM_PADDING.left,
        y0: DIAGRAM_PADDING.top,
        w: w - DIAGRAM_PADDING.left - DIAGRAM_PADDING.right,
        h: h - DIAGRAM_PADDING.top - DIAGRAM_PADDING.bottom,
        totalW: w,
        totalH: h
    };
}

function xToSvg(x, span, area) {
    return area.x0 + (x / span) * area.w;
}

function yToSvg(y, yMin, yMax, area) {
    const range = yMax - yMin || 1;
    const norm = (y - yMin) / range;
    return area.y0 + area.h * (1 - norm);
}

function makePolyline(xs, ys, span, yMin, yMax, area) {
    return xs.map((x, i) => `${xToSvg(x, span, area)},${yToSvg(ys[i], yMin, yMax, area)}`).join(' ');
}

function makePath(xs, ys, span, yMin, yMax, area) {
    const zeroY = yToSvg(0, yMin, yMax, area);
    let d = `M ${xToSvg(xs[0], span, area)},${zeroY} `;
    xs.forEach((x, i) => {
        d += `L ${xToSvg(x, span, area)},${yToSvg(ys[i], yMin, yMax, area)} `;
    });
    d += `L ${xToSvg(xs[xs.length - 1], span, area)},${zeroY} Z`;
    return d;
}

function makeSplit(xs, ys, span, yMin, yMax, area) {
    // Split into positive (above zero) and negative (below zero) paths
    const posYs = ys.map(v => Math.max(0, v));
    const negYs = ys.map(v => Math.min(0, v));
    return {
        posPath: makePath(xs, posYs, span, yMin, yMax, area),
        negPath: makePath(xs, negYs, span, yMin, yMax, area)
    };
}

// ─── SVG Construction Helpers ───────────────────────────────────────────────

function createSVGElement(tag, attrs) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    return el;
}

function clearSVG(svgEl) {
    while (svgEl.firstChild) svgEl.removeChild(svgEl.firstChild);
}

function drawGrid(svgEl, area, yMin, yMax, span) {
    const g = createSVGElement('g', { class: 'grid' });
    // Horizontal grid lines
    const nHLines = 5;
    for (let i = 0; i <= nHLines; i++) {
        const yVal = yMin + (i / nHLines) * (yMax - yMin);
        const svgY = yToSvg(yVal, yMin, yMax, area);
        const isZero = Math.abs(yVal) < (yMax - yMin) * 0.05;
        g.appendChild(createSVGElement('line', {
            x1: area.x0, y1: svgY, x2: area.x0 + area.w, y2: svgY,
            stroke: isZero ? COLORS.axis : COLORS.grid,
            'stroke-width': isZero ? '1.5' : '0.5',
            'stroke-dasharray': isZero ? '0' : '4,4'
        }));
        // Y-axis label
        const label = createSVGElement('text', {
            x: area.x0 - 8, y: svgY + 4,
            'text-anchor': 'end', fill: COLORS.text,
            'font-size': '10', 'font-family': 'Inter, sans-serif'
        });
        label.textContent = BeamUtils.formatValue(yVal, 2);
        g.appendChild(label);
    }
    // Vertical grid lines (at every 1m or at 5 points)
    const nVLines = Math.min(10, Math.ceil(span));
    for (let i = 0; i <= nVLines; i++) {
        const xVal = (i / nVLines) * span;
        const svgX = xToSvg(xVal, span, area);
        g.appendChild(createSVGElement('line', {
            x1: svgX, y1: area.y0, x2: svgX, y2: area.y0 + area.h,
            stroke: COLORS.grid, 'stroke-width': '0.5', 'stroke-dasharray': '4,4'
        }));
        const label = createSVGElement('text', {
            x: svgX, y: area.y0 + area.h + 18,
            'text-anchor': 'middle', fill: COLORS.text,
            'font-size': '10', 'font-family': 'Inter, sans-serif'
        });
        label.textContent = BeamUtils.formatValue(xVal, 1);
        g.appendChild(label);
    }
    // Axes
    g.appendChild(createSVGElement('line', {
        x1: area.x0, y1: area.y0, x2: area.x0, y2: area.y0 + area.h,
        stroke: COLORS.axis, 'stroke-width': '1'
    }));
    g.appendChild(createSVGElement('line', {
        x1: area.x0, y1: area.y0 + area.h, x2: area.x0 + area.w, y2: area.y0 + area.h,
        stroke: COLORS.axis, 'stroke-width': '1'
    }));
    return g;
}

function drawZeroLine(area, yMin, yMax) {
    const zeroY = yToSvg(0, yMin, yMax, area);
    return createSVGElement('line', {
        x1: area.x0, y1: zeroY, x2: area.x0 + area.w, y2: zeroY,
        stroke: COLORS.axis, 'stroke-width': '1.5'
    });
}

function drawTitle(svgEl, area, title, unit) {
    const g = createSVGElement('g', {});
    const t = createSVGElement('text', {
        x: area.x0 + area.w / 2, y: 18,
        'text-anchor': 'middle', fill: '#E2E8F0',
        'font-size': '13', 'font-weight': '600', 'font-family': 'Inter, sans-serif'
    });
    t.textContent = title;
    g.appendChild(t);
    if (unit) {
        const u = createSVGElement('text', {
            x: area.x0 + area.w / 2, y: 30,
            'text-anchor': 'middle', fill: '#94A3B8',
            'font-size': '10', 'font-family': 'Inter, sans-serif'
        });
        u.textContent = unit;
        g.appendChild(u);
    }
    return g;
}

function annotateExtreme(svgEl, area, xs, ys, span, yMin, yMax, color, decimals = 3) {
    const absMax = BeamUtils.arrayAbsMax(ys);
    if (absMax < 1e-10) return;
    const idx = ys.reduce((best, v, i) => Math.abs(v) > Math.abs(ys[best]) ? i : best, 0);
    const svgX = xToSvg(xs[idx], span, area);
    const svgY = yToSvg(ys[idx], yMin, yMax, area);
    // Dot
    svgEl.appendChild(createSVGElement('circle', { cx: svgX, cy: svgY, r: '5', fill: color, opacity: '0.9' }));
    // Label
    const label = createSVGElement('text', {
        x: svgX, y: svgY - 10,
        'text-anchor': 'middle', fill: color,
        'font-size': '11', 'font-weight': '600', 'font-family': 'Inter, sans-serif'
    });
    label.textContent = `${BeamUtils.formatValue(ys[idx], decimals)}`;
    svgEl.appendChild(label);
}

// ─── Tooltip Overlay ────────────────────────────────────────────────────────

function addTooltip(svgEl, xs, ys, span, yMin, yMax, area, unit) {
    const tooltip = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    tooltip.style.display = 'none';
    tooltip.id = 'tooltip-' + svgEl.id;

    const cursor = createSVGElement('line', {
        x1: 0, y1: area.y0, x2: 0, y2: area.y0 + area.h,
        stroke: 'rgba(255,255,255,0.5)', 'stroke-width': '1', 'stroke-dasharray': '4,2'
    });
    const dot = createSVGElement('circle', { cx: 0, cy: 0, r: '4', fill: '#fff' });
    const bg = createSVGElement('rect', { rx: '4', ry: '4', fill: '#1E293B', opacity: '0.9' });
    const txt = createSVGElement('text', { fill: '#F1F5F9', 'font-size': '11', 'font-family': 'Inter, sans-serif' });

    tooltip.appendChild(cursor);
    tooltip.appendChild(dot);
    tooltip.appendChild(bg);
    tooltip.appendChild(txt);
    svgEl.appendChild(tooltip);

    svgEl.addEventListener('mousemove', (e) => {
        const rect = svgEl.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const xRatio = (mouseX - area.x0) / area.w;
        if (xRatio < 0 || xRatio > 1) { tooltip.style.display = 'none'; return; }
        const xVal = xRatio * span;
        const idx = Math.round(xRatio * (xs.length - 1));
        const yVal = ys[idx];
        const svgX = xToSvg(xVal, span, area);
        const svgY = yToSvg(yVal, yMin, yMax, area);

        cursor.setAttribute('x1', svgX); cursor.setAttribute('x2', svgX);
        dot.setAttribute('cx', svgX); dot.setAttribute('cy', svgY);
        txt.textContent = `x=${BeamUtils.formatValue(xVal, 2)}m  val=${BeamUtils.formatValue(yVal, 3)} ${unit}`;
        const tw = txt.textContent.length * 6.5 + 12;
        const txLeft = Math.min(svgX + 8, area.x0 + area.w - tw - 4);
        txt.setAttribute('x', txLeft + 6);
        txt.setAttribute('y', area.y0 + 16);
        bg.setAttribute('x', txLeft); bg.setAttribute('y', area.y0 + 4);
        bg.setAttribute('width', tw); bg.setAttribute('height', '18');
        tooltip.style.display = '';
    });
    svgEl.addEventListener('mouseleave', () => { tooltip.style.display = 'none'; });
}

// ─── Individual Diagram Renderers ───────────────────────────────────────────

function renderSFD(svgEl, results, config) {
    clearSVG(svgEl);
    const area = getPlotArea(svgEl);
    const { xs, V } = results;
    const span = config.span;
    const vMax = Math.max(BeamUtils.arrayAbsMax(V) * 1.25, 1);
    const yMin = -vMax, yMax = vMax;

    svgEl.appendChild(drawGrid(svgEl, area, yMin, yMax, span));
    svgEl.appendChild(drawZeroLine(area, yMin, yMax));

    const { posPath, negPath } = makeSplit(xs, V, span, yMin, yMax, area);
    const posEl = createSVGElement('path', { d: posPath, fill: COLORS.positive, stroke: 'none', opacity: '0.8' });
    const negEl = createSVGElement('path', { d: negPath, fill: COLORS.negative, stroke: 'none', opacity: '0.8' });
    svgEl.appendChild(posEl);
    svgEl.appendChild(negEl);

    // Outline
    const outline = createSVGElement('polyline', {
        points: makePolyline(xs, V, span, yMin, yMax, area),
        fill: 'none', stroke: '#F1F5F9', 'stroke-width': '1.5'
    });
    svgEl.appendChild(outline);

    annotateExtreme(svgEl, area, xs, V, span, yMin, yMax, '#F1F5F9', 3);
    svgEl.appendChild(drawTitle(svgEl, area, 'Shear Force Diagram', 'V (kN)'));
    addTooltip(svgEl, xs, V, span, yMin, yMax, area, 'kN');
}

function renderBMD(svgEl, results, config) {
    clearSVG(svgEl);
    const area = getPlotArea(svgEl);
    const { xs, M } = results;
    const span = config.span;
    const mMax = Math.max(BeamUtils.arrayAbsMax(M) * 1.25, 1);
    const yMin = -mMax, yMax = mMax;

    svgEl.appendChild(drawGrid(svgEl, area, yMin, yMax, span));
    svgEl.appendChild(drawZeroLine(area, yMin, yMax));

    const { posPath, negPath } = makeSplit(xs, M, span, yMin, yMax, area);
    svgEl.appendChild(createSVGElement('path', { d: posPath, fill: COLORS.positive, stroke: 'none', opacity: '0.85' }));
    svgEl.appendChild(createSVGElement('path', { d: negPath, fill: COLORS.negative, stroke: 'none', opacity: '0.85' }));

    svgEl.appendChild(createSVGElement('polyline', {
        points: makePolyline(xs, M, span, yMin, yMax, area),
        fill: 'none', stroke: '#F1F5F9', 'stroke-width': '1.5'
    }));

    annotateExtreme(svgEl, area, xs, M, span, yMin, yMax, '#F1F5F9', 3);
    svgEl.appendChild(drawTitle(svgEl, area, 'Bending Moment Diagram', 'M (kNm)'));
    addTooltip(svgEl, xs, M, span, yMin, yMax, area, 'kNm');
}

function renderDeflection(svgEl, results, config) {
    clearSVG(svgEl);
    const area = getPlotArea(svgEl);
    const { xs, deflection } = results;
    const span = config.span;
    const dMax = Math.max(BeamUtils.arrayAbsMax(deflection) * 1.5, 1e-9);
    const yMin = -dMax * 1.5, yMax = dMax * 0.5;

    svgEl.appendChild(drawGrid(svgEl, area, yMin, yMax, span));
    svgEl.appendChild(drawZeroLine(area, yMin, yMax));

    const path = makePath(xs, deflection, span, yMin, yMax, area);
    svgEl.appendChild(createSVGElement('path', { d: path, fill: COLORS.deflection, stroke: 'none', opacity: '0.8' }));
    svgEl.appendChild(createSVGElement('polyline', {
        points: makePolyline(xs, deflection, span, yMin, yMax, area),
        fill: 'none', stroke: COLORS.deflectionLine, 'stroke-width': '2'
    }));

    // Convert to mm for annotation
    const deflMM = deflection.map(d => d * 1000);
    annotateExtreme(svgEl, area, xs, deflection, span, yMin, yMax, COLORS.deflectionLine, 4);
    svgEl.appendChild(drawTitle(svgEl, area, 'Deflection Diagram', 'δ (m)'));
    addTooltip(svgEl, xs, deflection, span, yMin, yMax, area, 'm');
}

function renderReactions(svgEl, results, config) {
    clearSVG(svgEl);
    const area = getPlotArea(svgEl);
    const span = config.span;
    const totalW = area.totalW;
    const beamY = area.y0 + area.h / 2;

    // Beam line
    svgEl.appendChild(createSVGElement('rect', {
        x: area.x0, y: beamY - 6,
        width: area.w, height: 12,
        fill: COLORS.beamBody, rx: '3'
    }));

    // Supports and reactions
    results.reactions.forEach(r => {
        const svgX = xToSvg(r.position, span, area);
        drawSupportSymbol(svgEl, svgX, beamY + 6, r.type);
        if (Math.abs(r.Fy) > 1e-6) {
            drawReactionArrow(svgEl, svgX, beamY - 10, r.Fy);
        }
        if (Math.abs(r.M) > 1e-6) {
            drawMomentSymbol(svgEl, svgX, beamY - 30, r.M);
        }
    });

    // Loads
    config.loads.forEach(load => {
        if (load.type === 'point' && !isNaN(load.position)) {
            const svgX = xToSvg(load.position, span, area);
            drawLoadArrow(svgEl, svgX, beamY - 8, load.magnitude, '#FB923C');
        } else if ((load.type === 'udl' || load.type === 'partial_udl') && !isNaN(load.start) && !isNaN(load.end)) {
            drawUDLArrows(svgEl, area, load.start, load.end, span, beamY, load.magnitude);
        }
    });

    // X-axis labels
    const n = Math.min(6, Math.ceil(span));
    for (let i = 0; i <= n; i++) {
        const xVal = (i / n) * span;
        const svgX = xToSvg(xVal, span, area);
        const lbl = createSVGElement('text', {
            x: svgX, y: beamY + 50,
            'text-anchor': 'middle', fill: COLORS.text,
            'font-size': '10', 'font-family': 'Inter, sans-serif'
        });
        lbl.textContent = `${BeamUtils.formatValue(xVal, 1)}m`;
        svgEl.appendChild(lbl);
    }

    svgEl.appendChild(drawTitle(svgEl, area, 'Beam Configuration & Reactions', ''));
}

function drawSupportSymbol(svgEl, x, y, type) {
    if (type === 'pin') {
        // Triangle
        const pts = `${x},${y} ${x - 14},${y + 20} ${x + 14},${y + 20}`;
        svgEl.appendChild(createSVGElement('polygon', { points: pts, fill: COLORS.support, opacity: '0.9' }));
        svgEl.appendChild(createSVGElement('line', { x1: x - 16, y1: y + 22, x2: x + 16, y2: y + 22, stroke: COLORS.support, 'stroke-width': '2' }));
    } else if (type === 'roller') {
        svgEl.appendChild(createSVGElement('polygon', { points: `${x},${y} ${x - 12},${y + 18} ${x + 12},${y + 18}`, fill: COLORS.support, opacity: '0.85' }));
        svgEl.appendChild(createSVGElement('circle', { cx: x - 8, cy: y + 23, r: '3', fill: COLORS.support }));
        svgEl.appendChild(createSVGElement('circle', { cx: x + 8, cy: y + 23, r: '3', fill: COLORS.support }));
    } else if (type === 'fixed') {
        svgEl.appendChild(createSVGElement('rect', { x: x - 3, y: y, width: 6, height: 25, fill: COLORS.support }));
        svgEl.appendChild(createSVGElement('rect', { x: x - 12, y: y + 22, width: 24, height: 6, fill: COLORS.support, opacity: '0.7' }));
        // Hash marks
        for (let k = 0; k < 5; k++) {
            svgEl.appendChild(createSVGElement('line', {
                x1: x - 12 + k * 6, y1: y + 28, x2: x - 18 + k * 6, y2: y + 35,
                stroke: COLORS.support, 'stroke-width': '1.5', opacity: '0.5'
            }));
        }
    }
}

function drawReactionArrow(svgEl, x, y, Fy) {
    const dir = Fy > 0 ? -1 : 1; // upward reaction => draw arrow going up
    const len = 35;
    const arrowY2 = y + dir * len;
    svgEl.appendChild(createSVGElement('line', {
        x1: x, y1: y, x2: x, y2: arrowY2,
        stroke: COLORS.reaction, 'stroke-width': '2.5'
    }));
    const tipY = y;
    const arrow = createSVGElement('polygon', {
        points: `${x},${tipY} ${x - 7},${tipY + 12 * (-dir)} ${x + 7},${tipY + 12 * (-dir)}`,
        fill: COLORS.reaction
    });
    svgEl.appendChild(arrow);
    const lbl = createSVGElement('text', {
        x: x + 10, y: y + dir * len / 2,
        fill: COLORS.reaction, 'font-size': '11', 'font-weight': '600', 'font-family': 'Inter, sans-serif'
    });
    lbl.textContent = `${BeamUtils.formatValue(Math.abs(Fy), 2)} kN`;
    svgEl.appendChild(lbl);
}

function drawMomentSymbol(svgEl, x, y, M) {
    const lbl = createSVGElement('text', {
        x: x + 10, y: y,
        fill: COLORS.moment, 'font-size': '11', 'font-weight': '600', 'font-family': 'Inter, sans-serif'
    });
    lbl.textContent = `M=${BeamUtils.formatValue(M, 2)} kNm`;
    svgEl.appendChild(lbl);
}

function drawLoadArrow(svgEl, x, baseY, magnitude, color) {
    const len = 30;
    svgEl.appendChild(createSVGElement('line', {
        x1: x, y1: baseY - len, x2: x, y2: baseY,
        stroke: color, 'stroke-width': '2'
    }));
    svgEl.appendChild(createSVGElement('polygon', {
        points: `${x},${baseY} ${x - 5},${baseY - 10} ${x + 5},${baseY - 10}`,
        fill: color
    }));
    const lbl = createSVGElement('text', {
        x: x + 7, y: baseY - len / 2,
        fill: color, 'font-size': '10', 'font-family': 'Inter, sans-serif'
    });
    lbl.textContent = `${magnitude}kN`;
    svgEl.appendChild(lbl);
}

function drawUDLArrows(svgEl, area, start, end, span, baseY, magnitude) {
    const x1 = xToSvg(start, span, area);
    const x2 = xToSvg(end, span, area);
    const topY = baseY - 30;
    // Top line
    svgEl.appendChild(createSVGElement('line', { x1, y1: topY, x2, y2: topY, stroke: COLORS.load, 'stroke-width': '2' }));
    // Arrows
    const nArrows = Math.max(2, Math.round((x2 - x1) / 25));
    for (let i = 0; i <= nArrows; i++) {
        const ax = x1 + (i / nArrows) * (x2 - x1);
        svgEl.appendChild(createSVGElement('line', { x1: ax, y1: topY, x2: ax, y2: baseY - 8, stroke: COLORS.load, 'stroke-width': '1.5' }));
        svgEl.appendChild(createSVGElement('polygon', {
            points: `${ax},${baseY - 6} ${ax - 4},${baseY - 16} ${ax + 4},${baseY - 16}`,
            fill: COLORS.load
        }));
    }
    const lbl = createSVGElement('text', {
        x: (x1 + x2) / 2, y: topY - 5,
        'text-anchor': 'middle', fill: COLORS.load, 'font-size': '10', 'font-family': 'Inter, sans-serif'
    });
    lbl.textContent = `${magnitude}kN/m`;
    svgEl.appendChild(lbl);
}

// ─── Beam Preview (before calculation) ──────────────────────────────────────

function renderPreview(config) {
    const svgEl = document.getElementById('svg-preview');
    if (!svgEl) return;
    clearSVG(svgEl);
    const area = getPlotArea(svgEl);
    const span = config.span || 5;
    const beamY = area.y0 + area.h / 2;

    // Beam rectangle
    svgEl.appendChild(createSVGElement('rect', {
        x: area.x0, y: beamY - 8, width: area.w, height: 16,
        fill: COLORS.beamBody, rx: '3', opacity: '0.9'
    }));

    // Supports
    (config.supports || []).forEach(s => {
        if (!isNaN(s.position)) {
            drawSupportSymbol(svgEl, xToSvg(s.position, span, area), beamY + 8, s.type);
        }
    });

    // Loads
    (config.loads || []).forEach(load => {
        if (load.type === 'point' && !isNaN(load.position)) {
            drawLoadArrow(svgEl, xToSvg(load.position, span, area), beamY - 8, load.magnitude || '', COLORS.load);
        } else if ((load.type === 'udl' || load.type === 'partial_udl') && !isNaN(load.start) && !isNaN(load.end)) {
            drawUDLArrows(svgEl, area, load.start || 0, load.end || span, span, beamY, load.magnitude || '');
        }
    });

    // Span label
    const lbl = createSVGElement('text', {
        x: area.x0 + area.w / 2, y: beamY + 55,
        'text-anchor': 'middle', fill: COLORS.text, 'font-size': '12', 'font-family': 'Inter, sans-serif'
    });
    lbl.textContent = `Span: ${span} m`;
    svgEl.appendChild(lbl);

    // Dim lines
    svgEl.appendChild(createSVGElement('line', { x1: area.x0, y1: beamY - 20, x2: area.x0 + area.w, y2: beamY - 20, stroke: COLORS.neutral, 'stroke-width': '1', 'stroke-dasharray': '4,3' }));
}

// ─── Render All Diagrams ────────────────────────────────────────────────────

function renderAll(results, config) {
    renderReactions(document.getElementById('svg-reactions'), results, config);
    renderSFD(document.getElementById('svg-sfd'), results, config);
    renderBMD(document.getElementById('svg-bmd'), results, config);
    renderDeflection(document.getElementById('svg-deflection'), results, config);
}

window.BeamDiagrams = { renderAll, renderPreview };
