/**
 * pdfReport.js — Professional Engineering Firm PDF Report
 * Clean, formal, structured — inspired by real structural engineering calculation sheets
 */

/**
 * Converts a live SVG DOM element to a PNG data URL via Blob + Image.
 * Works with inline gradients, fills, and CSS-styled SVG content.
 */
/**
 * Converts a live SVG DOM element to a PNG data URL via base64 data URI.
 * Using base64 data URI (not Blob URL) avoids canvas cross-origin taint issues
 * that prevent diagrams from rendering in jsPDF.
 */
function svgToDataURL(svgEl) {
    return new Promise((resolve, reject) => {
        try {
            const clone = svgEl.cloneNode(true);
            const bbox = svgEl.getBoundingClientRect();
            const w = Math.max(bbox.width || 600, 100);
            const h = Math.max(bbox.height || 210, 60);

            clone.setAttribute('width', w);
            clone.setAttribute('height', h);
            clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

            // Ensure viewBox is set for proper scaling
            if (!clone.getAttribute('viewBox')) {
                clone.setAttribute('viewBox', `0 0 ${w} ${h}`);
            }

            // Inline white background
            const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            bgRect.setAttribute('x', '0'); bgRect.setAttribute('y', '0');
            bgRect.setAttribute('width', w); bgRect.setAttribute('height', h);
            bgRect.setAttribute('fill', '#ffffff');
            clone.insertBefore(bgRect, clone.firstChild);

            // Inline computed font-family on all text elements (avoids missing font issue)
            clone.querySelectorAll('text').forEach(t => {
                if (!t.getAttribute('font-family')) {
                    t.setAttribute('font-family', 'Arial, Helvetica, sans-serif');
                }
            });

            const serialized = new XMLSerializer().serializeToString(clone);
            // Use base64 data URI — avoids canvas taint restriction vs Blob URLs
            const b64 = btoa(unescape(encodeURIComponent(serialized)));
            const dataUri = `data:image/svg+xml;base64,${b64}`;

            const img = new Image();
            img.onload = () => {
                const scale = 2; // retina quality
                const cvs = document.createElement('canvas');
                cvs.width = w * scale;
                cvs.height = h * scale;
                const ctx = cvs.getContext('2d');
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, cvs.width, cvs.height);
                ctx.drawImage(img, 0, 0, cvs.width, cvs.height);
                resolve(cvs.toDataURL('image/png'));
            };
            img.onerror = (e) => reject(new Error('SVG image load failed'));
            img.src = dataUri;
        } catch (e) {
            reject(e);
        }
    });
}

async function exportPDF(results, config, projectInfo) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageW = 210;
    const pageH = 297;
    const ML = 20;   // margin left
    const MR = 20;   // margin right
    const MT = 20;   // margin top (below header)
    const COL = pageW - ML - MR; // content width
    let y = 0;

    /* ── Palette (clean, minimal) ───────────────────────────── */
    const BLACK = [17, 17, 17];
    const DARK = [40, 40, 40];
    const MID = [100, 100, 100];
    const LIGHT = [180, 180, 180];
    const XLIGHT = [240, 240, 240];
    const WHITE = [255, 255, 255];
    const ACCENT = [79, 70, 229];   // indigo brand colour

    /* ── Font helpers ───────────────────────────────────────── */
    const f = (size, style = 'normal', color = BLACK) => {
        doc.setFont('helvetica', style);
        doc.setFontSize(size);
        doc.setTextColor(...color);
    };
    const line = (x1, y1, x2, y2, color = LIGHT, w = 0.25) => {
        doc.setDrawColor(...color);
        doc.setLineWidth(w);
        doc.line(x1, y1, x2, y2);
    };
    const rect = (x, yp, w, h, fill, stroke = null) => {
        if (fill) { doc.setFillColor(...fill); doc.rect(x, yp, w, h, stroke ? 'FD' : 'F'); }
        if (stroke && !fill) { doc.setDrawColor(...stroke); doc.rect(x, yp, w, h, 'S'); }
    };

    /* ── Page break check ───────────────────────────────────── */
    const check = (need) => {
        if (y + need > pageH - 22) {
            doc.addPage();
            drawHeader();
            drawFooter();
            y = 35;
            return true;
        }
        return false;
    };

    /* ── Row heights & styles ───────────────────────────────── */
    const ROW_H = 7;

    /* ─────────────────────────────────────────────────────────
       HEADER — every page
    ───────────────────────────────────────────────────────── */
    function drawHeader() {
        // Left: firm / project
        rect(0, 0, pageW, 22, WHITE);
        line(0, 22, pageW, 22, LIGHT, 0.5);

        // Left accent strip
        rect(0, 0, 4, 22, ACCENT);

        f(9, 'bold', ACCENT);
        doc.text('BEAMCALC PRO', 9, 8.5);

        f(7.5, 'normal', MID);
        doc.text(`Project: ${projectInfo.projectName || 'Untitled'}`, 9, 14.5);

        // Right block
        f(7.5, 'normal', MID);
        doc.text(`Engineer: ${projectInfo.engineer || '—'}`, pageW - MR, 8.5, { align: 'right' });
        doc.text(`Firm: ${projectInfo.firm || '—'}`, pageW - MR, 14.5, { align: 'right' });
    }

    /* ─────────────────────────────────────────────────────────
       FOOTER — every page
    ───────────────────────────────────────────────────────── */
    function drawFooter() {
        const fy = pageH - 12;
        line(ML, fy, pageW - MR, fy, LIGHT, 0.25);
        f(7, 'normal', LIGHT);
        doc.text(
            'This document is generated for informational purposes only. Results must be verified by a licensed structural engineer before use in any design or construction.',
            ML, fy + 5, { maxWidth: COL * 0.75, align: 'left' }
        );
        const pageNum = doc.getCurrentPageInfo().pageNumber;
        f(7, 'bold', MID);
        doc.text(`${pageNum}`, pageW - MR, fy + 5, { align: 'right' });
    }

    /* ─────────────────────────────────────────────────────────
       SECTION HEADING
    ───────────────────────────────────────────────────────── */
    function sectionHead(title, num) {
        check(14);
        y += 4;
        // Number badge
        rect(ML, y, 6, 6, ACCENT);
        f(7, 'bold', WHITE);
        doc.text(String(num), ML + 3, y + 4.5, { align: 'center' });

        f(9, 'bold', BLACK);
        doc.text(title.toUpperCase(), ML + 10, y + 4.5);
        line(ML + 10, y + 7, pageW - MR, y + 7, XLIGHT, 0.4);
        y += 12;
    }

    /* ─────────────────────────────────────────────────────────
       TABLE ROW
    ───────────────────────────────────────────────────────── */
    function tableRow(cells, widths, isHead = false, shade = false) {
        check(ROW_H + 1);
        const bg = isHead ? XLIGHT : (shade ? [249, 249, 249] : WHITE);
        rect(ML, y, COL, ROW_H, bg);
        line(ML, y, pageW - MR, y, LIGHT, 0.15);

        let cx = ML;
        cells.forEach((cell, i) => {
            const cw = COL * widths[i];
            if (isHead) f(7.5, 'bold', DARK);
            else f(7.5, 'normal', DARK);
            const txt = String(cell ?? '—');
            doc.text(txt, cx + 2, y + 5, { maxWidth: cw - 4 });
            cx += cw;
        });

        line(ML, y + ROW_H, pageW - MR, y + ROW_H, LIGHT, 0.15);
        // Left and right borders of table
        line(ML, y, ML, y + ROW_H, LIGHT, 0.15);
        line(pageW - MR, y, pageW - MR, y + ROW_H, LIGHT, 0.15);
        // Column dividers
        let dx = ML;
        widths.slice(0, -1).forEach(w => {
            dx += COL * w;
            line(dx, y, dx, y + ROW_H, LIGHT, 0.1);
        });
        y += ROW_H;
    }

    /* ─────────────────────────────────────────────────────────
       KEY-VALUE ROW (two-column compact)
    ───────────────────────────────────────────────────────── */
    function kvRow(label, value, unit = '', shade = false) {
        check(ROW_H);
        const bg = shade ? [249, 249, 249] : WHITE;
        rect(ML, y, COL, ROW_H, bg);
        line(ML, y, ML, y + ROW_H, LIGHT, 0.15);
        line(pageW - MR, y, pageW - MR, y + ROW_H, LIGHT, 0.15);
        line(ML + COL * 0.5, y, ML + COL * 0.5, y + ROW_H, LIGHT, 0.1);
        line(ML, y + ROW_H, pageW - MR, y + ROW_H, LIGHT, 0.15);

        f(7.5, 'normal', MID);
        doc.text(label, ML + 2, y + 5);

        f(7.5, 'bold', BLACK);
        doc.text(`${value}${unit ? '  ' + unit : ''}`, ML + COL * 0.5 + 2, y + 5);
        y += ROW_H;
    }

    /* ─────────────────────────────────────────────────────────
       RESULT HIGHLIGHT ROW (value with accent)
    ───────────────────────────────────────────────────────── */
    function resultRow(label, value, location, color = BLACK, shade = false) {
        check(ROW_H);
        const bg = shade ? [249, 249, 249] : WHITE;
        rect(ML, y, COL, ROW_H, bg);
        line(ML, y, ML, y + ROW_H, LIGHT, 0.15);
        line(pageW - MR, y, pageW - MR, y + ROW_H, LIGHT, 0.15);

        f(7.5, 'normal', MID);
        doc.text(label, ML + 2, y + 5, { maxWidth: COL * 0.42 });

        f(8, 'bold', color);
        doc.text(String(value), ML + COL * 0.44, y + 5, { maxWidth: COL * 0.3 });

        f(7.5, 'normal', LIGHT);
        doc.text(String(location), ML + COL * 0.72, y + 5, { maxWidth: COL * 0.27 });

        const cols = [0, 0.44, 0.72, 1];
        cols.slice(0, -1).forEach((c, i) => {
            line(ML + COL * c, y, ML + COL * c, y + ROW_H, LIGHT, 0.1);
        });
        line(ML, y + ROW_H, pageW - MR, y + ROW_H, LIGHT, 0.15);
        y += ROW_H;
    }

    /* ═════════════════════════════════════════════════════════
       PAGE 1 — COVER (Title Block)
    ═════════════════════════════════════════════════════════ */

    // Full white page
    rect(0, 0, pageW, pageH, WHITE);

    // Left accent bar
    rect(0, 0, 5, pageH, ACCENT);

    // Top header strip
    rect(5, 0, pageW - 5, 60, BLACK);

    // App wordmark
    f(22, 'bold', WHITE);
    doc.text('BEAMCALC', 20, 28);
    f(22, 'normal', [180, 200, 255]);
    doc.text('PRO', 20 + doc.getTextWidth('BEAMCALC') + 4, 28);

    f(9, 'normal', [150, 170, 210]);
    doc.text('Structural Analysis Report', 20, 40);

    // Accent line
    rect(5, 60, pageW - 5, 1.5, ACCENT);

    // Title block — engineering-style box
    y = 80;
    rect(ML, y, COL, 70, null, LIGHT);

    // Inner grid lines
    line(ML, y + 25, ML + COL, y + 25, LIGHT, 0.3);
    line(ML, y + 45, ML + COL, y + 45, LIGHT, 0.3);
    line(ML + COL * 0.5, y, ML + COL * 0.5, y + 45, LIGHT, 0.3);

    // Labels
    f(7, 'normal', LIGHT);
    doc.text('PROJECT NAME', ML + 3, y + 5);
    doc.text('DOCUMENT TYPE', ML + COL * 0.5 + 3, y + 5);
    doc.text('ENGINEER', ML + 3, y + 29);
    doc.text('FIRM / ORGANISATION', ML + COL * 0.5 + 3, y + 29);
    doc.text('DATE ISSUED', ML + 3, y + 49);
    doc.text('DOCUMENT REF.', ML + COL * 0.5 + 3, y + 49);

    // Values
    f(10, 'bold', BLACK);
    doc.text(projectInfo.projectName || 'Untitled Project', ML + 3, y + 20, { maxWidth: COL * 0.48 });

    f(9, 'normal', DARK);
    doc.text('Structural Beam Analysis', ML + COL * 0.5 + 3, y + 20, { maxWidth: COL * 0.48 });

    f(9, 'normal', DARK);
    doc.text(projectInfo.engineer || '—', ML + 3, y + 40, { maxWidth: COL * 0.48 });
    doc.text(projectInfo.firm || '—', ML + COL * 0.5 + 3, y + 40, { maxWidth: COL * 0.48 });

    const dateStr = new Date().toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.text(dateStr, ML + 3, y + 60);
    f(9, 'normal', MID);
    doc.text(`BC-${Date.now().toString().slice(-6)}`, ML + COL * 0.5 + 3, y + 60);

    // Revision block
    y += 85;
    rect(ML, y, COL, 7, XLIGHT);
    f(7, 'bold', MID);
    doc.text('REV', ML + 2, y + 5);
    doc.text('DESCRIPTION', ML + 18, y + 5);
    doc.text('PREPARED BY', ML + COL * 0.65, y + 5);
    doc.text('DATE', ML + COL * 0.85, y + 5);
    line(ML, y, pageW - MR, y, LIGHT, 0.3);
    line(ML, y + 7, pageW - MR, y + 7, LIGHT, 0.3);
    y += 7;
    rect(ML, y, COL, 8, WHITE);
    f(8, 'normal', BLACK);
    doc.text('01', ML + 2, y + 5.5);
    doc.text('Initial issue', ML + 18, y + 5.5);
    doc.text(projectInfo.engineer || '—', ML + COL * 0.65, y + 5.5, { maxWidth: COL * 0.19 });
    doc.text(new Date().toLocaleDateString('en-AU'), ML + COL * 0.85, y + 5.5);
    line(ML, y + 8, pageW - MR, y + 8, LIGHT, 0.3);
    line(ML, y, ML, y + 8, LIGHT, 0.3);
    line(pageW - MR, y, pageW - MR, y + 8, LIGHT, 0.3);

    // Disclaimer box
    y += 22;
    rect(ML, y, COL, 20, [250, 250, 250], LIGHT);
    f(7.5, 'bold', MID);
    doc.text('DISCLAIMER', ML + 4, y + 6);
    f(7, 'normal', MID);
    doc.text(
        'This calculation report is prepared for preliminary structural analysis purposes only. All results must be independently verified and checked by a suitably qualified professional engineer registered in the relevant jurisdiction before use in any structural design, assessment, or construction works.',
        ML + 4, y + 11, { maxWidth: COL - 8 }
    );

    // Bottom of cover
    y = pageH - 28;
    line(ML, y, pageW - MR, y, XLIGHT, 0.4);
    f(7.5, 'bold', ACCENT);
    doc.text('BeamCalc Pro  •  Structural Analysis Software', ML, y + 7);
    f(7, 'normal', LIGHT);
    doc.text('Generated: ' + new Date().toISOString().slice(0, 19).replace('T', '  '), pageW - MR, y + 7, { align: 'right' });

    /* ═════════════════════════════════════════════════════════
       PAGE 2 — BEAM PROPERTIES & LOADING
    ═════════════════════════════════════════════════════════ */
    doc.addPage();
    drawHeader();
    drawFooter();
    y = 35;

    // Summary strip (4 key values across top)
    const panels = [
        { label: 'MAX. MOMENT', value: `${BeamUtils.formatValue(results.summary.maxAbsMoment, 3)} kNm` },
        { label: 'MAX. SHEAR', value: `${BeamUtils.formatValue(results.summary.maxAbsShear, 3)} kN` },
        { label: 'MAX. DEFLECTION', value: `${(results.summary.maxDeflection * 1000).toFixed(3)} mm` },
        { label: 'SPAN / DEFL.', value: `L / ${Math.abs(results.summary.maxDeflection) > 1e-9 ? Math.round(config.span / Math.abs(results.summary.maxDeflection)) : '∞'}` },
    ];
    const pw = COL / 4;
    panels.forEach((p, i) => {
        const bx = ML + i * pw;
        rect(bx, y, pw - 1, 18, i === 0 ? ACCENT : XLIGHT);
        f(6.5, 'bold', i === 0 ? WHITE : MID);
        doc.text(p.label, bx + 3, y + 5.5);
        f(9.5, 'bold', i === 0 ? WHITE : BLACK);
        doc.text(p.value, bx + 3, y + 14);
    });
    y += 24;

    /* — Section 1: Beam Properties — */
    sectionHead('Beam Properties', 1);
    kvRow('Beam Span', config.span, 'm', false);
    kvRow('Material', cap(config.material), '', true);
    kvRow("Young's Modulus ( E )", config.E.toLocaleString(), 'kN/m²', false);
    kvRow('Moment of Inertia ( I )', config.I, 'm⁴', true);
    kvRow('Cross-Section Area ( A )', config.A, 'm²', false);
    kvRow('Flexural Rigidity ( EI )', (config.E * config.I).toLocaleString(), 'kNm²', true);
    y += 4;

    /* — Section 2: Support Conditions — */
    sectionHead('Support Conditions', 2);
    tableRow(['Support Type', 'Position (m)', 'Vertical Reaction (kN)', 'Fixed Moment (kNm)'], [0.25, 0.25, 0.25, 0.25], true);
    results.reactions.forEach((r, i) => {
        tableRow([cap(r.type), BeamUtils.formatValue(r.position, 2), BeamUtils.formatValue(r.Fy, 3), Math.abs(r.M) > 1e-6 ? BeamUtils.formatValue(r.M, 3) : '—'], [0.25, 0.25, 0.25, 0.25], false, i % 2 === 0);
    });
    y += 4;

    /* — Section 3: Applied Loading — */
    sectionHead('Applied Loading', 3);
    tableRow(['Load Type', 'Category', 'Position / Range (m)', 'Magnitude'], [0.22, 0.18, 0.32, 0.28], true);
    config.loads.forEach((l, i) => {
        const range = l.position != null ? `x = ${l.position} m` : `${l.start} m → ${l.end} m`;
        const suffix = ['udl', 'partial_udl', 'triangular'].includes(l.type) ? ' kN/m' : l.type === 'moment' ? ' kNm' : ' kN';
        const mag = l.magnitude != null ? `${l.magnitude}${suffix}` : `${l.magnitudeStart}–${l.magnitudeEnd} kN/m`;
        tableRow([cap(l.type.replace('_', ' ')), cap(l.category || 'Dead'), range, mag], [0.22, 0.18, 0.32, 0.28], false, i % 2 === 0);
    });
    y += 4;

    /* ═════════════════════════════════════════════════════════
       PAGE 3 — DIAGRAMS
    ═════════════════════════════════════════════════════════ */
    doc.addPage();
    drawHeader();
    drawFooter();
    y = 35;

    sectionHead('Structural Diagrams', 4);

    const diagrams = [
        { id: 'svg-reactions', label: 'Beam Configuration & Reaction Diagram' },
        { id: 'svg-sfd', label: 'Shear Force Diagram (V)' },
        { id: 'svg-bmd', label: 'Bending Moment Diagram (M)' },
        { id: 'svg-deflection', label: 'Deflection Diagram (δ)' },
    ];

    for (const d of diagrams) {
        const el = document.getElementById(d.id);
        if (!el) continue;
        check(58);

        // Diagram label bar
        rect(ML, y, COL, 7, XLIGHT);
        f(7.5, 'bold', DARK);
        doc.text(d.label.toUpperCase(), ML + 3, y + 5);
        line(ML, y, pageW - MR, y, LIGHT, 0.3);
        line(ML, y + 7, pageW - MR, y + 7, LIGHT, 0.3);
        line(ML, y, ML, y + 7, LIGHT, 0.3);
        line(pageW - MR, y, pageW - MR, y + 7, LIGHT, 0.3);
        y += 7;

        try {
            // svgToDataURL now returns a PNG data URL directly from canvas
            const pngDataUrl = await svgToDataURL(el);
            const bbox = el.getBoundingClientRect();
            const aspectRatio = bbox.height / Math.max(bbox.width, 1);
            const imgH = Math.min(aspectRatio * COL, 52);
            rect(ML, y, COL, imgH, WHITE, LIGHT);
            doc.addImage(pngDataUrl, 'PNG', ML, y, COL, imgH);
            y += imgH + 6;
        } catch (e) {
            console.warn('Diagram render failed:', d.id, e);
            rect(ML, y, COL, 20, [252, 252, 252], LIGHT);
            f(7.5, 'normal', LIGHT);
            doc.text('Diagram could not be rendered.', ML + 4, y + 12);
            y += 24;
        }
    }

    /* ═════════════════════════════════════════════════════════
       PAGE 4 — RESULTS & CALCULATIONS
    ═════════════════════════════════════════════════════════ */
    check(60);
    if (y > 35) {  // only add page if we're not already at top
        doc.addPage();
        drawHeader();
        drawFooter();
        y = 35;
    }

    sectionHead('Analysis Results Summary', 5);

    // Column headers — 4 columns with Pass/Fail check
    tableRow(['Result Quantity', 'Value', 'Location', 'Check'], [0.40, 0.26, 0.22, 0.12], true);

    /* ── Serviceability checks ─────────────────────────────── */
    const spanRatio = Math.abs(results.summary.maxDeflection) > 1e-9
        ? Math.round(config.span / Math.abs(results.summary.maxDeflection))
        : Infinity;
    const defl300 = spanRatio >= 300;
    const defl360 = spanRatio >= 360;

    function passFail(ok) { return ok ? '✓ OK' : '✗ FAIL'; }

    const resultRows4 = [
        ['Max Positive Bending Moment', `${BeamUtils.formatValue(results.summary.maxPositiveMoment, 3)} kNm`, `x = ${BeamUtils.formatValue(results.summary.maxPositiveMomentPos, 2)} m`, '—'],
        ['Max Negative Bending Moment', `${BeamUtils.formatValue(results.summary.maxNegativeMoment, 3)} kNm`, `x = ${BeamUtils.formatValue(results.summary.maxNegativeMomentPos, 2)} m`, '—'],
        ['Maximum Absolute Moment', `${BeamUtils.formatValue(results.summary.maxAbsMoment, 3)} kNm`, 'Governing', '—'],
        ['Maximum Shear Force (+)', `${BeamUtils.formatValue(results.summary.maxShear, 3)} kN`, `x = ${BeamUtils.formatValue(results.summary.maxShearPos, 2)} m`, '—'],
        ['Maximum Shear Force (−)', `${BeamUtils.formatValue(results.summary.minShear, 3)} kN`, '—', '—'],
        ['Maximum Absolute Shear', `${BeamUtils.formatValue(results.summary.maxAbsShear, 3)} kN`, 'Governing', '—'],
        ['Maximum Deflection (sag)', `${(results.summary.maxDeflection * 1000).toFixed(4)} mm`, `x = ${BeamUtils.formatValue(results.summary.maxDeflectionPos, 2)} m`, '—'],
        ['Span / Defl Ratio (L/300)', `L / ${spanRatio === Infinity ? '∞' : spanRatio}`, 'L/300 serviceability limit', passFail(defl300)],
        ['Span / Defl Ratio (L/360)', `L / ${spanRatio === Infinity ? '∞' : spanRatio}`, 'L/360 reduced limit', passFail(defl360)],
    ];

    resultRows4.forEach(([r, v, n, chk], i) => {
        check(ROW_H + 1);
        const bg = i % 2 === 0 ? WHITE : [249, 249, 249];
        rect(ML, y, COL, ROW_H, bg);
        line(ML, y, ML, y + ROW_H, LIGHT, 0.15);
        line(pageW - MR, y, pageW - MR, y + ROW_H, LIGHT, 0.15);
        const cols4 = [0, 0.40, 0.66, 0.88, 1];
        cols4.slice(1, -1).forEach(c => line(ML + COL * c, y, ML + COL * c, y + ROW_H, LIGHT, 0.1));
        line(ML, y + ROW_H, pageW - MR, y + ROW_H, LIGHT, 0.15);
        f(7.5, 'normal', MID); doc.text(r, ML + 2, y + 5, { maxWidth: COL * 0.38 });
        f(7.5, 'bold', DARK); doc.text(v, ML + COL * 0.40 + 2, y + 5, { maxWidth: COL * 0.24 });
        f(7.5, 'normal', LIGHT); doc.text(n, ML + COL * 0.66 + 2, y + 5, { maxWidth: COL * 0.21 });
        // Pass/Fail with colour
        if (chk === '✓ OK') { f(7.5, 'bold', [5, 150, 105]); }
        else if (chk === '✗ FAIL') { f(7.5, 'bold', [220, 38, 38]); }
        else { f(7.5, 'normal', LIGHT); }
        doc.text(chk, ML + COL * 0.88 + 2, y + 5, { maxWidth: COL * 0.11 });
        y += ROW_H;
    });

    y += 6;
    sectionHead('Support Reactions', 6);
    tableRow(['Support', 'Position (m)', 'Vertical Fy (kN)', 'Fixed-End Moment (kNm)'], [0.25, 0.25, 0.25, 0.25], true);
    results.reactions.forEach((r, i) => {
        tableRow([cap(r.type), BeamUtils.formatValue(r.position, 2), BeamUtils.formatValue(r.Fy, 3), Math.abs(r.M) > 1e-6 ? BeamUtils.formatValue(r.M, 3) : '—'], [0.25, 0.25, 0.25, 0.25], false, i % 2 === 0);
    });

    y += 6;
    sectionHead('Equilibrium Check', 7);
    const totalLoad = config.loads.reduce((s, l) => {
        if (l.type === 'point') return s + (l.magnitude || 0);
        if (['udl', 'partial_udl'].includes(l.type)) return s + (l.magnitude || 0) * ((l.end || 0) - (l.start || 0));
        return s;
    }, 0);
    const totalReaction = results.reactions.reduce((s, r) => s + r.Fy, 0);
    const equilError = Math.abs(totalLoad - totalReaction);
    kvRow('Total Applied Load', BeamUtils.formatValue(totalLoad, 3), 'kN', false);
    kvRow('Total Vertical Reaction', BeamUtils.formatValue(totalReaction, 3), 'kN', true);
    kvRow('Equilibrium Error', BeamUtils.formatValue(equilError, 6), `kN  ${equilError < 0.01 ? '✓ OK' : '✗ Check inputs'}`, false);

    /* ═════════════════════════════════════════════════════════
       PAGE 5 — CALCULATION WORKINGS
    ═════════════════════════════════════════════════════════ */
    doc.addPage();
    drawHeader();
    drawFooter();
    y = 35;

    sectionHead('Calculation Workings', 8);

    /* ── Helper: print a formula line ─────────────────────── */
    function formulaLine(label, formula, result, shade = false) {
        check(9);
        const bg = shade ? [249, 249, 249] : WHITE;
        rect(ML, y, COL, 9, bg);
        line(ML, y, ML, y + 9, LIGHT, 0.15);
        line(pageW - MR, y, pageW - MR, y + 9, LIGHT, 0.15);
        line(ML, y + 9, pageW - MR, y + 9, LIGHT, 0.15);
        f(7.5, 'normal', MID); doc.text(label, ML + 3, y + 6, { maxWidth: COL * 0.32 });
        f(8, 'normal', [79, 70, 229]); doc.text(formula, ML + COL * 0.34 + 3, y + 6, { maxWidth: COL * 0.38 });
        f(8, 'bold', DARK); doc.text(result, ML + COL * 0.74 + 3, y + 6, { maxWidth: COL * 0.24 });
        y += 9;
    }

    /* ── Flexural Rigidity ────────────────────────────────── */
    check(20);
    f(8, 'bold', BLACK); doc.text('Flexural Rigidity', ML, y); y += 7;
    const EI = config.E * config.I;
    formulaLine('EI =', `E × I  =  ${config.E.toLocaleString()} × ${config.I}`, `${BeamUtils.formatValue(EI, 2)} kNm²`, false);
    y += 3;

    /* ── Deflection Calculations ──────────────────────────── */
    check(24);
    f(8, 'bold', BLACK); doc.text('Deflection', ML, y); y += 7;
    const maxDeflMm = results.summary.maxDeflection * 1000;
    const L300 = (config.span / 300) * 1000;
    const L360 = (config.span / 360) * 1000;
    formulaLine('δ_max =', 'Numerical integration (500 stations)', `${maxDeflMm.toFixed(4)} mm`, false);
    formulaLine('L/300 limit =', `${config.span} / 300`, `${L300.toFixed(2)} mm  →  ${Math.abs(maxDeflMm) <= L300 ? '✓ PASS' : '✗ FAIL'}`, true);
    formulaLine('L/360 limit =', `${config.span} / 360`, `${L360.toFixed(2)} mm  →  ${Math.abs(maxDeflMm) <= L360 ? '✓ PASS' : '✗ FAIL'}`, false);
    y += 3;

    /* ── Bending Moment Workings ──────────────────────────── */
    check(24);
    f(8, 'bold', BLACK); doc.text('Bending Moment', ML, y); y += 7;
    formulaLine('M_max+ =', 'Numerical integration of shear diagram', `${BeamUtils.formatValue(results.summary.maxPositiveMoment, 3)} kNm`, false);
    formulaLine('M_max− =', 'Numerical integration of shear diagram', `${BeamUtils.formatValue(results.summary.maxNegativeMoment, 3)} kNm`, true);
    formulaLine('M_abs =', 'max(|M+|, |M−|)', `${BeamUtils.formatValue(results.summary.maxAbsMoment, 3)} kNm`, false);
    y += 3;

    /* ── Shear Force Workings ─────────────────────────────── */
    check(20);
    f(8, 'bold', BLACK); doc.text('Shear Force', ML, y); y += 7;
    formulaLine('V_max+ =', 'Stiffness matrix + influence lines', `${BeamUtils.formatValue(results.summary.maxShear, 3)} kN`, false);
    formulaLine('V_max− =', 'Stiffness matrix + influence lines', `${BeamUtils.formatValue(results.summary.minShear, 3)} kN`, true);
    formulaLine('V_abs =', 'max(|V+|, |V−|)', `${BeamUtils.formatValue(results.summary.maxAbsShear, 3)} kN`, false);
    y += 3;

    /* ── Reaction Summary ─────────────────────────────────── */
    check(16 + results.reactions.length * 9);
    f(8, 'bold', BLACK); doc.text('Support Reactions (Stiffness Method)', ML, y); y += 7;
    results.reactions.forEach((r, i) => {
        const posStr = `x = ${BeamUtils.formatValue(r.position, 2)} m`;
        const fyStr = `Fy = ${BeamUtils.formatValue(r.Fy, 3)} kN`;
        const mStr = Math.abs(r.M) > 1e-6 ? `  M = ${BeamUtils.formatValue(r.M, 3)} kNm` : '';
        formulaLine(`${cap(r.type)} at ${posStr}`, 'Direct stiffness assembly', fyStr + mStr, i % 2 === 1);
    });
    y += 3;

    /* ── Note on method ───────────────────────────────────── */
    check(18);
    y += 4;
    rect(ML, y, COL, 14, [248, 247, 255], LIGHT);
    f(7, 'bold', [79, 70, 229]); doc.text('Analysis Method Note', ML + 4, y + 5);
    f(7, 'normal', MID);
    doc.text(
        'Results are computed using a direct stiffness matrix approach with 500-point numerical integration over the beam span. ' +
        'Point loads, UDLs, partial UDLs, triangular loads and applied moments are all supported. ' +
        'This is a linear-elastic analysis. Geometric non-linearity and plastic redistribution are not considered.',
        ML + 4, y + 10, { maxWidth: COL - 8 }
    );
    y += 18;

    /* ── Final page numbers ──────────────────────────────────── */
    const total = doc.getNumberOfPages();
    for (let p = 1; p <= total; p++) {
        doc.setPage(p);
        if (p > 1) {
            f(7, 'bold', MID);
            doc.text(`Page ${p} of ${total}`, pageW - MR, pageH - 7, { align: 'right' });
        }
    }

    doc.save(`BeamCalcPro_Report_${Date.now()}.pdf`);
}

/* ── Helpers ────────────────────────────────────────────── */
function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : '—'; }

function showProjectInfoModal() {
    return new Promise(resolve => {
        const modal = document.getElementById('pdf-modal');
        modal.classList.add('open');
        document.getElementById('btn-modal-confirm').onclick = () => {
            const info = {
                projectName: document.getElementById('modal-project').value,
                engineer: document.getElementById('modal-engineer').value,
                firm: document.getElementById('modal-firm').value,
            };
            modal.classList.remove('open');
            resolve(info);
        };
        document.getElementById('btn-modal-cancel').onclick = () => {
            modal.classList.remove('open');
            resolve(null);
        };
    });
}

window.PDFReport = { exportPDF, showProjectInfoModal };
