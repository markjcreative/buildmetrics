/**
 * calcReport.js — Universal Engineering Report Generator
 * Generates professional PDF and Word reports for ALL BuildMetrics calc types.
 *
 * Exposes: window.CalcReport
 * Requires: jsPDF (CDN), WordExport (wordExport.js), CalcShared (calcShared.js)
 *
 * Usage:
 *   const data = CalcReport.buildData('column', config, results, calcName, projectName);
 *   await CalcReport.exportPDF(data);
 *   await CalcReport.exportWord(data);
 */
const CalcReport = (() => {

    /* ── Helpers ─────────────────────────────────────────── */
    function _fmt(v, dp = 2) {
        if (v === null || v === undefined || isNaN(v)) return '—';
        return Number(v).toFixed(dp);
    }

    function _base(calcType, calcName, projectName, standard) {
        const labels = {
            column:           'Column Design',
            slab:             'RC Slab Design',
            footing:          'Pad Footing Design',
            'retaining-wall': 'Retaining Wall',
            connection:       'Bolt / Weld Connection',
        };
        return {
            calcType,
            calcName: calcName || labels[calcType] || calcType,
            projectName: projectName || 'Untitled Project',
            standard,
            date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            inputs:  [],
            results: [],
            summary: '',
            pass: null,
        };
    }

    /* ── Data Builders ───────────────────────────────────── */

    function _column(config, results, calcName, projectName) {
        const d = _base('column', calcName, projectName, 'EN 1993-1-1 (EC3)');
        const Le = (config.keff * config.length).toFixed(3);

        d.inputs = [
            config.sectionDesig ? { label: 'Section Designation', value: config.sectionDesig + ' (' + (config.sectionType || '') + ')', unit: '—' } : null,
            { label: 'Applied Axial Force (NEd)', value: config.NEd, unit: 'kN' },
            { label: 'Column Length (L)', value: config.length, unit: 'm' },
            { label: 'Effective Length Factor (k)', value: config.keff, unit: '—' },
            { label: 'Effective Length (Le = kL)', value: Le, unit: 'm' },
            { label: 'Cross-Section Area (A)', value: config.A, unit: 'cm²' },
            { label: 'Second Moment of Area — y-y (Iyy)', value: config.Iyy, unit: 'cm⁴' },
            { label: 'Second Moment of Area — z-z (Ixx)', value: config.Ixx, unit: 'cm⁴' },
            { label: 'Yield Strength (fy)', value: config.fy, unit: 'N/mm²' },
            { label: "Young's Modulus (E)", value: 210000, unit: 'N/mm²' },
            { label: 'Governing Axis', value: config.axis === 'auto' ? 'Auto-selected' : config.axis, unit: '—' },
        ].filter(Boolean);

        d.results = [
            { label: 'Plastic Resistance (Npl,Rd)', value: _fmt(results.Npl_Rd, 1) + ' kN', status: null },
            { label: 'Euler Buckling Load — y-y (Ncr,y)', value: _fmt(results.Ncr_y_kN, 1) + ' kN', status: null },
            { label: 'Euler Buckling Load — z-z (Ncr,z)', value: _fmt(results.Ncr_z_kN, 1) + ' kN', status: null },
            { label: 'Non-dim. Slenderness — y-y (λ̄y)', value: _fmt(results.lambdaBar_y, 3), status: null },
            { label: 'Non-dim. Slenderness — z-z (λ̄z)', value: _fmt(results.lambdaBar_z, 3), status: null },
            { label: 'Buckling Curve — y-y', value: results.curve_y || '—', status: null },
            { label: 'Buckling Curve — z-z', value: results.curve_z || '—', status: null },
            { label: 'Reduction Factor — y-y (χy)', value: _fmt(results.chi_y, 3), status: null },
            { label: 'Reduction Factor — z-z (χz)', value: _fmt(results.chi_z, 3), status: null },
            { label: 'Buckling Resistance y-y (Nb,Rd,y)', value: _fmt(results.Nb_Rd_y, 1) + ' kN', status: null },
            { label: 'Buckling Resistance z-z (Nb,Rd,z)', value: _fmt(results.Nb_Rd_z, 1) + ' kN', status: null },
            { label: 'Governing Buckling Resistance (Nb,Rd)', value: _fmt(results.Nb_Rd, 1) + ' kN', status: results.pass },
            { label: 'Applied Axial Force (NEd)', value: (results.NEd || config.NEd) + ' kN', status: null },
            { label: 'Utilisation (NEd / Nb,Rd)', value: _fmt(results.utilisationPct, 1) + '%', status: results.pass },
        ];

        d.pass = results.pass;
        d.summary = `Steel column designed to EN 1993-1-1 (Eurocode 3). ` +
            `Governing axis: ${results.governingAxis || 'See above'}. ` +
            `Effective length Le = ${Le} m. ` +
            `Buckling resistance Nb,Rd = ${results.Nb_Rd} kN, applied NEd = ${results.NEd} kN. ` +
            `Utilisation = ${results.utilisationPct}%. ` +
            (results.pass ? 'Section is ADEQUATE — all checks pass.' : 'Section is INADEQUATE — increase section or reduce load.');
        return d;
    }

    function _slab(config, results, calcName, projectName) {
        const d = _base('slab', calcName, projectName, 'EN 1992-1-1 (EC2)');
        // Config field normalisation (slab page uses lowercase gk/qk, thickness)
        const h   = config.h || config.thickness;
        const Gk  = config.Gk || config.gk;
        const Qk  = config.Qk || config.qk;
        const sup = config.support || config.supportType || '—';

        d.inputs = [
            { label: 'Slab Thickness (h)', value: h, unit: 'mm' },
            { label: 'Concrete Cover (c)', value: config.cover, unit: 'mm' },
            { label: 'Bar Diameter (φ)', value: config.barDia, unit: 'mm' },
            { label: 'Concrete Strength (fck)', value: config.fck, unit: 'N/mm²' },
            { label: 'Steel Strength (fyk)', value: config.fyk, unit: 'N/mm²' },
            { label: 'Characteristic Dead Load (Gk)', value: Gk, unit: 'kN/m²' },
            { label: 'Characteristic Live Load (Qk)', value: Qk, unit: 'kN/m²' },
            { label: 'Span (L)', value: config.span, unit: 'm' },
            { label: 'Support Conditions', value: sup, unit: '—' },
        ];

        d.results = [
            { label: 'Design Load (wEd = 1.35Gk + 1.5Qk)', value: _fmt(results.wEd || results.w, 2) + ' kN/m²', status: null },
            { label: 'Design Moment (MEd)', value: _fmt(results.MEd, 2) + ' kNm/m', status: null },
            { label: 'Effective Depth (d)', value: _fmt(results.d, 0) + ' mm', status: null },
            { label: 'K = MEd / (fck·b·d²)', value: _fmt(results.K, 4) + ' (limit ' + (results.K_limit || 0.167) + ')', status: results.K != null ? !results.doublyReinforced : null },
            { label: 'Lever Arm (z)', value: _fmt(results.z, 1) + ' mm', status: null },
            { label: 'Required Steel Area (As,req)', value: _fmt(results.As_req, 0) + ' mm²/m', status: null },
            { label: 'Minimum Steel Area (As,min)', value: _fmt(results.As_min, 0) + ' mm²/m', status: null },
            { label: 'Provided Steel Area (As,prov)', value: _fmt(results.As_prov, 0) + ' mm²/m', status: results.As_prov != null ? results.As_prov >= results.As_req : null },
            { label: 'Bar Spacing', value: (results.spacing || '—') + ' mm c/c', status: null },
            { label: 'Deflection — Span/Depth (actual)', value: _fmt(results.actualRatio, 1), status: null },
            { label: 'Deflection — Span/Depth (allowed)', value: _fmt(results.allowedRatio, 1), status: results.deflPass },
            { label: 'Shear Resistance (VRd,c)', value: _fmt(results.VRd_c, 2) + ' kN/m', status: results.shearPass },
        ];

        d.pass = results.pass;
        d.summary = `RC one-way slab designed to EN 1992-1-1 (Eurocode 2). ` +
            `Span = ${config.span} m, h = ${h} mm, fck = ${config.fck} N/mm². ` +
            `Design moment MEd = ${_fmt(results.MEd, 2)} kNm/m. ` +
            `Provide T${config.barDia} @ ${results.spacing} mm c/c (As,prov = ${_fmt(results.As_prov, 0)} mm²/m). ` +
            (results.pass ? 'All checks PASS.' : 'One or more checks FAIL — review design.');
        return d;
    }

    function _footing(config, results, calcName, projectName) {
        const d = _base('footing', calcName, projectName, 'EN 1992-1-1 (EC2) / EN 1997-1 (EC7)');

        d.inputs = [
            { label: 'Char. Dead Load (Gk)', value: config.Gk, unit: 'kN' },
            { label: 'Char. Live Load (Qk)', value: config.Qk, unit: 'kN' },
            { label: 'Column Width / Depth', value: config.columnW, unit: 'mm' },
            { label: 'Allowable Soil Bearing Capacity', value: config.soilBearing, unit: 'kN/m²' },
            { label: 'Footing Type', value: config.footingType || '—', unit: '—' },
            { label: 'Footing Thickness', value: config.footThick, unit: 'mm' },
            { label: 'Concrete Strength (fck)', value: config.fck, unit: 'N/mm²' },
            { label: 'Steel Strength (fyk)', value: config.fyk, unit: 'N/mm²' },
            { label: 'Concrete Cover', value: config.cover, unit: 'mm' },
            { label: 'Bar Diameter', value: config.barDia, unit: 'mm' },
        ];

        d.results = [
            { label: 'Footing Plan Size (B × L)', value: (results.B || '—') + ' × ' + (results.L || '—') + ' m', status: null },
            { label: 'Gross Bearing Pressure', value: _fmt(results.grossBearingPressure, 1) + ' kN/m²', status: results.bearingPass },
            { label: 'Net Bearing Pressure', value: _fmt(results.netBearingPressure, 1) + ' kN/m²', status: null },
            { label: 'Punching Shear — Applied (VEd)', value: _fmt(results.VEd_punch, 1) + ' kN', status: null },
            { label: 'Punching Shear — Resistance (VRd)', value: _fmt(results.VRd_punch, 1) + ' kN', status: results.punchPass },
            { label: 'Wide Beam Shear — Applied (VEd)', value: _fmt(results.VEd_shear, 1) + ' kN', status: null },
            { label: 'Wide Beam Shear — Resistance (VRd)', value: _fmt(results.VRd_shear, 1) + ' kN', status: results.shearPass },
            { label: 'Required Steel x-dir (As,req)', value: _fmt(results.rebar_x && results.rebar_x.As_req, 0) + ' mm²/m', status: null },
            { label: 'Required Steel y-dir (As,req)', value: _fmt(results.rebar_y && results.rebar_y.As_req, 0) + ' mm²/m', status: null },
            { label: 'K-value x-dir', value: _fmt(results.rebar_x && results.rebar_x.K, 4) + ' (limit 0.167)', status: results.rebar_x ? results.rebar_x.K < 0.167 : null },
            { label: 'K-value y-dir', value: _fmt(results.rebar_y && results.rebar_y.K, 4) + ' (limit 0.167)', status: results.rebar_y ? results.rebar_y.K < 0.167 : null },
        ];

        d.pass = results.pass;
        d.summary = `Pad footing designed to EN 1992-1-1 / EN 1997-1. ` +
            `Size: ${results.B} m × ${results.L} m, thickness ${config.footThick} mm. ` +
            `Gross bearing pressure = ${_fmt(results.grossBearingPressure, 1)} kN/m² ` +
            `(allowable: ${config.soilBearing} kN/m²). ` +
            (results.pass ? 'All checks PASS — footing is adequate.' : 'One or more checks FAIL — increase footing size or depth.');
        return d;
    }

    function _retainingWall(config, results, calcName, projectName) {
        const d = _base('retaining-wall', calcName, projectName, 'EN 1997-1 (EC7) / EN 1992-1-1 (EC2)');
        const H = config.H || config.Hw || '—';
        const B = config.baseWidth || results.B || '—';

        d.inputs = [
            { label: 'Retained Height (H)', value: H, unit: 'm' },
            { label: 'Base Width (B)', value: B, unit: 'm' },
            { label: 'Base Thickness', value: config.baseThick || config.basThick, unit: 'm' },
            { label: 'Stem Thickness', value: config.stemThick, unit: 'm' },
            { label: 'Toe Length', value: config.toeLength || config.toe, unit: 'm' },
            { label: 'Soil Unit Weight (γ)', value: config.gamma, unit: 'kN/m³' },
            { label: 'Soil Friction Angle (φ)', value: config.phi, unit: '°' },
            { label: 'Surcharge Load (q)', value: config.surcharge, unit: 'kN/m²' },
            { label: 'Allowable Bearing Capacity', value: config.soilBearing, unit: 'kN/m²' },
        ].filter(i => i.value !== undefined && i.value !== null);

        d.results = [
            { label: 'Active Pressure Coefficient (Ka)', value: _fmt(results.Ka, 3), status: null },
            { label: 'Total Horizontal Force (Pa)', value: _fmt(results.Ph || results.Pa_total, 1) + ' kN/m', status: null },
            { label: 'Total Vertical Load (W)', value: _fmt(results.W_total, 1) + ' kN/m', status: null },
            { label: 'Overturning Moment (Mo)', value: _fmt(results.Mo, 1) + ' kNm/m', status: null },
            { label: 'Stabilising Moment (Ms)', value: _fmt(results.Ms, 1) + ' kNm/m', status: null },
            { label: 'Overturning FOS (Ms/Mo ≥ 1.5)', value: _fmt(results.FOS_overturning, 2), status: results.overturningPass },
            { label: 'Sliding Resistance (Fr)', value: _fmt(results.Fr, 1) + ' kN/m', status: null },
            { label: 'Sliding FOS (Fr/Ph ≥ 1.5)', value: _fmt(results.FOS_sliding, 2), status: results.slidingPass },
            { label: 'Max. Bearing Pressure (q_max)', value: _fmt(results.q_max, 1) + ' kN/m²', status: results.bearingPass },
            { label: 'Eccentricity (e)', value: _fmt(results.eccentricity, 3) + ' m (limit B/6 = ' + _fmt(Number(B) / 6, 3) + ' m)', status: results.tensionPass },
        ];

        d.pass = results.pass;
        d.summary = `Retaining wall stability checked to EN 1997-1 (Eurocode 7). ` +
            `Retained height H = ${H} m, base width B = ${B} m. ` +
            `Overturning FOS = ${_fmt(results.FOS_overturning, 2)}, ` +
            `Sliding FOS = ${_fmt(results.FOS_sliding, 2)}, ` +
            `Max bearing pressure = ${_fmt(results.q_max, 1)} kN/m². ` +
            (results.pass ? 'All stability checks PASS.' : 'One or more stability checks FAIL — redesign required.');
        return d;
    }

    function _connection(config, results, calcName, projectName) {
        const isBolt = config.mode !== 'weld';
        const d = _base('connection', calcName, projectName, 'EN 1993-1-8 (EC3)');

        if (isBolt) {
            d.inputs = [
                { label: 'Connection Mode', value: 'Bolt Group', unit: '—' },
                { label: 'Bolt Size', value: config.boltSize || '—', unit: '—' },
                { label: 'Bolt Grade', value: config.boltGrade || '—', unit: '—' },
                { label: 'Number of Shear Planes', value: config.shearPlanes || 1, unit: '—' },
                { label: 'Applied Shear Vx', value: config.Vx || 0, unit: 'kN' },
                { label: 'Applied Shear Vy', value: config.Vy || 0, unit: 'kN' },
                { label: 'In-plane Moment (M)', value: config.M_in_plane || 0, unit: 'kNm' },
                { label: 'Number of Bolts', value: (config.boltLayout || []).length, unit: '—' },
            ];
            d.results = [
                { label: 'Max. Bolt Force (resultant)', value: _fmt(results.maxBoltForce, 2) + ' kN', status: null },
                { label: 'Bolt Shear Capacity', value: _fmt(results.boltCapacity, 2) + ' kN', status: null },
                { label: 'Bolt Group Centroid (cx)', value: _fmt(results.cx, 1) + ' mm', status: null },
                { label: 'Bolt Group Centroid (cy)', value: _fmt(results.cy, 1) + ' mm', status: null },
                { label: 'Polar Moment of Inertia (Ip)', value: _fmt(results.Ip, 0) + ' mm²', status: null },
                { label: 'Utilisation (maxForce / capacity)', value: _fmt(results.utilisationPct, 1) + '%', status: results.pass },
                { label: 'Overall Check', value: results.pass ? 'PASS' : 'FAIL', status: results.pass },
            ];
            d.summary = `Bolt group analysis to EN 1993-1-8 (Eurocode 3). ` +
                `${(config.boltLayout || []).length} × ${config.boltSize || ''} grade ${config.boltGrade || ''} bolts. ` +
                `Maximum bolt force = ${_fmt(results.maxBoltForce, 2)} kN (capacity = ${_fmt(results.boltCapacity, 2)} kN). ` +
                `Utilisation = ${_fmt(results.utilisationPct, 1)}%. ` +
                (results.pass ? 'Bolt group is ADEQUATE.' : 'Bolt group is OVERSTRESSED — increase bolt count/size or grade.');
        } else {
            d.inputs = [
                { label: 'Connection Mode', value: 'Weld Group', unit: '—' },
                { label: 'Weld Throat Size (a)', value: config.throatSize || '—', unit: 'mm' },
                { label: 'Material Ultimate Strength (fu)', value: config.fu || '—', unit: 'N/mm²' },
                { label: 'Applied Shear Vx', value: config.Vx || 0, unit: 'kN' },
                { label: 'Applied Shear Vy', value: config.Vy || 0, unit: 'kN' },
                { label: 'Applied Axial (N)', value: config.N || 0, unit: 'kN' },
                { label: 'Applied Moment (M)', value: config.M || 0, unit: 'kNm' },
                { label: 'Total Weld Length', value: _fmt(results.totalLength, 1), unit: 'mm' },
            ];
            d.results = [
                { label: 'Effective Throat Area (Aw)', value: _fmt(results.A_w, 0) + ' mm²', status: null },
                { label: 'Design Stress Check', value: _fmt(results.stress_check, 2) + ' N/mm²', status: null },
                { label: 'Weld Capacity', value: _fmt(results.capacity, 2) + ' N/mm²', status: null },
                { label: 'Utilisation', value: _fmt(results.utilisationPct, 1) + '%', status: results.pass },
                { label: 'Overall Check', value: results.pass ? 'PASS' : 'FAIL', status: results.pass },
            ];
            d.summary = `Weld group analysis to EN 1993-1-8 (Eurocode 3). ` +
                `Throat size a = ${config.throatSize || '—'} mm, total weld length = ${_fmt(results.totalLength, 1)} mm. ` +
                `Stress check = ${_fmt(results.stress_check, 2)} N/mm² vs capacity ${_fmt(results.capacity, 2)} N/mm². ` +
                `Utilisation = ${_fmt(results.utilisationPct, 1)}%. ` +
                (results.pass ? 'Weld group is ADEQUATE.' : 'Weld group is OVERSTRESSED — increase weld size or length.');
        }

        d.pass = results.pass;
        return d;
    }

    /* ── Public: buildData ───────────────────────────────── */
    function buildData(calcType, config, results, calcName, projectName) {
        const map = {
            column:           _column,
            slab:             _slab,
            footing:          _footing,
            'retaining-wall': _retainingWall,
            connection:       _connection,
        };
        const fn = map[calcType];
        if (!fn) {
            const d = _base(calcType, calcName, projectName, '—');
            d.summary = 'No detailed report template for calc type: ' + calcType;
            return d;
        }
        return fn(config, results, calcName, projectName);
    }

    /* ══════════════════════════════════════════════════════
       PDF Export — Professional Engineering Layout
       Same typographic style as pdfReport.js
    ══════════════════════════════════════════════════════ */
    async function exportPDF(data, filename) {
        if (!window.jspdf) {
            throw new Error('jsPDF not loaded. Add the CDN script to the page.');
        }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');

        const pageW = 210, pageH = 297;
        const ML = 20, MR = 20;
        const COL = pageW - ML - MR;
        let y = 0;

        /* Palette */
        const BLACK  = [17, 17, 17];
        const DARK   = [40, 40, 40];
        const MID    = [100, 100, 100];
        const LIGHT  = [200, 200, 200];
        const XLIGHT = [245, 245, 245];
        const WHITE  = [255, 255, 255];
        const ACCENT = [37, 99, 235];      // BuildMetrics blue
        const GREEN  = [21, 128, 61];      // PASS green
        const RED    = [185, 28, 28];      // FAIL red
        const GREEN_BG = [220, 252, 231];
        const RED_BG   = [254, 226, 226];

        /* ── Font helpers ── */
        const f = (size, style = 'normal', color = BLACK) => {
            doc.setFont('helvetica', style);
            doc.setFontSize(size);
            doc.setTextColor(...color);
        };
        const ln = (x1, y1, x2, y2, color = LIGHT, w = 0.25) => {
            doc.setDrawColor(...color);
            doc.setLineWidth(w);
            doc.line(x1, y1, x2, y2);
        };
        const fillRect = (x, yp, w, h, color) => {
            doc.setFillColor(...color);
            doc.rect(x, yp, w, h, 'F');
        };

        /* ── Page break helper ── */
        const ROW_H = 7;
        const needBreak = (need) => {
            if (y + need > pageH - 22) {
                doc.addPage();
                drawPageHeader();
                drawPageFooter();
                y = 36;
                return true;
            }
            return false;
        };

        /* ── Every-page header ── */
        function drawPageHeader() {
            // White bg + bottom rule
            fillRect(0, 0, pageW, 22, WHITE);
            ln(0, 22, pageW, 22, LIGHT, 0.5);

            // Left accent strip
            fillRect(0, 0, 4, 22, ACCENT);

            f(9, 'bold', ACCENT);
            doc.text('BUILDMETRICS', 9, 9);

            f(7, 'normal', MID);
            doc.text('Structural Calculation Report', 9, 15.5);

            // Right: calc name + page
            f(7.5, 'normal', MID);
            const proj = data.projectName || '';
            doc.text(`${proj}`, pageW - MR, 9, { align: 'right' });
            f(7, 'normal', LIGHT);
            doc.text(`${data.calcName || ''}`, pageW - MR, 15.5, { align: 'right' });
        }

        /* ── Every-page footer ── */
        function drawPageFooter() {
            const fy = pageH - 12;
            ln(ML, fy, pageW - MR, fy, LIGHT, 0.25);
            f(6.5, 'normal', LIGHT);
            doc.text(
                'Generated by BuildMetrics. Results require verification by a licensed structural engineer before use in design or construction.',
                ML, fy + 5, { maxWidth: COL * 0.78 }
            );
            const pn = doc.getCurrentPageInfo().pageNumber;
            f(7, 'bold', MID);
            doc.text(`Page ${pn}`, pageW - MR, fy + 5, { align: 'right' });
        }

        /* ── Section heading ── */
        function sectionHead(title, num) {
            needBreak(16);
            y += 5;
            fillRect(ML, y, 7, 7, ACCENT);
            f(7, 'bold', WHITE);
            doc.text(String(num), ML + 3.5, y + 5.2, { align: 'center' });

            f(9.5, 'bold', BLACK);
            doc.text(title.toUpperCase(), ML + 11, y + 5.2);
            ln(ML + 11, y + 8, pageW - MR, y + 8, [220, 220, 220], 0.4);
            y += 13;
        }

        /* ── Input row (2 col: label | value unit) ── */
        function inputRow(label, value, unit, shade) {
            needBreak(ROW_H);
            const bg = shade ? XLIGHT : WHITE;
            fillRect(ML, y, COL, ROW_H, bg);
            ln(ML, y, ML, y + ROW_H, LIGHT, 0.15);
            ln(pageW - MR, y, pageW - MR, y + ROW_H, LIGHT, 0.15);
            ln(ML + COL * 0.55, y, ML + COL * 0.55, y + ROW_H, LIGHT, 0.1);
            ln(ML, y + ROW_H, pageW - MR, y + ROW_H, LIGHT, 0.15);

            f(7.5, 'normal', MID);
            doc.text(String(label ?? ''), ML + 2, y + 5);

            f(7.5, 'bold', DARK);
            const valStr = (value !== null && value !== undefined) ? String(value) : '—';
            const unitStr = unit ? '  ' + unit : '';
            doc.text(valStr + unitStr, ML + COL * 0.55 + 2, y + 5, { maxWidth: COL * 0.44 });
            y += ROW_H;
        }

        /* ── Result row (3 col: label | value | status badge) ── */
        function resultRow(label, value, status, shade) {
            needBreak(ROW_H);
            const bg = shade ? XLIGHT : WHITE;
            fillRect(ML, y, COL, ROW_H, bg);
            ln(ML, y, ML, y + ROW_H, LIGHT, 0.15);
            ln(pageW - MR, y, pageW - MR, y + ROW_H, LIGHT, 0.15);
            ln(ML + COL * 0.5, y, ML + COL * 0.5, y + ROW_H, LIGHT, 0.1);
            ln(ML + COL * 0.82, y, ML + COL * 0.82, y + ROW_H, LIGHT, 0.1);
            ln(ML, y + ROW_H, pageW - MR, y + ROW_H, LIGHT, 0.15);

            f(7.5, 'normal', MID);
            doc.text(String(label ?? ''), ML + 2, y + 5, { maxWidth: COL * 0.48 });

            f(7.5, 'bold', DARK);
            doc.text(String(value ?? '—'), ML + COL * 0.5 + 2, y + 5, { maxWidth: COL * 0.30 });

            // Status badge
            if (status === true || status === false) {
                const bx = ML + COL * 0.82 + 2;
                const bw = COL * 0.16;
                const bh = ROW_H - 2;
                const bcol = status ? GREEN_BG : RED_BG;
                const tcol = status ? GREEN : RED;
                fillRect(bx, y + 1, bw, bh, bcol);
                f(7, 'bold', tcol);
                const label2 = status ? '✓ PASS' : '✗ FAIL';
                doc.text(label2, bx + bw / 2, y + 5.2, { align: 'center' });
            }

            y += ROW_H;
        }

        /* ── Table header row ── */
        function tableHead(cols, widths) {
            needBreak(ROW_H);
            fillRect(ML, y, COL, ROW_H, [230, 237, 255]);
            ln(ML, y, ML, y + ROW_H, LIGHT, 0.15);
            ln(pageW - MR, y, pageW - MR, y + ROW_H, LIGHT, 0.15);
            ln(ML, y + ROW_H, pageW - MR, y + ROW_H, [180, 180, 200], 0.3);

            let cx = ML;
            cols.forEach((col, i) => {
                f(7.5, 'bold', ACCENT);
                doc.text(col, cx + 2, y + 5);
                cx += COL * widths[i];
                if (i < cols.length - 1) ln(cx, y, cx, y + ROW_H, LIGHT, 0.1);
            });
            y += ROW_H;
        }

        /* ═══════════════════════════
           START RENDERING
        ═══════════════════════════ */
        drawPageHeader();
        drawPageFooter();
        y = 28;

        /* ── TITLE BLOCK ── */
        const overallPass = data.pass;
        const passColor = overallPass === null ? MID : (overallPass ? GREEN : RED);
        const passLabel = overallPass === null ? 'RESULTS PENDING' : (overallPass ? '✓  PASS' : '✗  FAIL');

        // Outer border
        doc.setDrawColor(...[200, 210, 240]);
        doc.setLineWidth(0.5);
        doc.rect(ML, y, COL, 54);

        // Title bar
        fillRect(ML, y, COL, 14, ACCENT);
        f(11, 'bold', WHITE);
        doc.text(data.calcName || 'Structural Calculation', ML + 6, y + 9.5);

        // Sub-title right
        f(8, 'normal', [180, 200, 255]);
        doc.text(data.standard || '', pageW - MR - 2, y + 9.5, { align: 'right' });
        y += 14;

        // Info grid (2×3 layout)
        const fields = [
            ['Project', data.projectName || '—'],
            ['Calculation', data.calcName || '—'],
            ['Date', data.date || '—'],
            ['Standard', data.standard || '—'],
            ['Reference', 'BM-' + Date.now().toString(36).toUpperCase().slice(-6)],
            ['Status', passLabel],
        ];

        const fW = COL / 2;
        const fH = 10;
        for (let i = 0; i < fields.length; i += 2) {
            const [lbl1, val1] = fields[i];
            const [lbl2, val2] = fields[i + 1] || ['', ''];
            const rowY = y;

            // Left cell
            fillRect(ML, rowY, fW, fH, i % 4 === 0 ? XLIGHT : WHITE);
            f(6.5, 'normal', MID);
            doc.text(lbl1, ML + 3, rowY + 4);
            const isStatus = lbl1 === 'Status';
            f(8, 'bold', isStatus ? passColor : DARK);
            doc.text(val1, ML + 3, rowY + 8.5);

            // Right cell
            fillRect(ML + fW, rowY, fW, fH, i % 4 === 0 ? XLIGHT : WHITE);
            f(6.5, 'normal', MID);
            doc.text(lbl2, ML + fW + 3, rowY + 4);
            f(8, 'bold', DARK);
            doc.text(val2 || '—', ML + fW + 3, rowY + 8.5);

            // Dividers
            ln(ML + fW, rowY, ML + fW, rowY + fH, LIGHT, 0.2);
            ln(ML, rowY + fH, pageW - MR, rowY + fH, LIGHT, 0.2);

            y += fH;
        }

        y += 8;

        /* ── SECTION 1: INPUT PARAMETERS ── */
        sectionHead('Input Parameters', 1);
        tableHead(['Parameter', 'Value'], [0.55, 0.45]);
        (data.inputs || []).forEach((inp, i) => {
            inputRow(inp.label, inp.value, inp.unit, i % 2 !== 0);
        });

        y += 6;

        /* ── SECTION 2: DESIGN CHECKS & RESULTS ── */
        sectionHead('Design Checks & Results', 2);
        tableHead(['Check / Result', 'Value', 'Status'], [0.50, 0.32, 0.18]);
        (data.results || []).forEach((res, i) => {
            resultRow(res.label, res.value, res.status, i % 2 !== 0);
        });

        y += 6;

        /* ── SECTION 3: SUMMARY ── */
        sectionHead('Summary & Notes', 3);
        needBreak(28);

        // Summary box
        const sumLines = doc.splitTextToSize(data.summary || '', COL - 8);
        const sumH = Math.max(24, sumLines.length * 5 + 8);
        needBreak(sumH);
        fillRect(ML, y, COL, sumH, [248, 250, 255]);
        doc.setDrawColor(...[210, 220, 250]);
        doc.setLineWidth(0.3);
        doc.rect(ML, y, COL, sumH);
        // Left accent strip
        fillRect(ML, y, 3, sumH, ACCENT);

        f(8, 'normal', DARK);
        doc.text(sumLines, ML + 7, y + 7, { lineHeightFactor: 1.5 });
        y += sumH + 6;

        /* ── SECTION 4: DISCLAIMER / CERTIFICATION ── */
        needBreak(28);
        y += 4;
        fillRect(ML, y, COL, 26, XLIGHT);
        doc.setDrawColor(...LIGHT);
        doc.setLineWidth(0.3);
        doc.rect(ML, y, COL, 26);

        f(7, 'bold', MID);
        doc.text('Engineer Sign-off', ML + 4, y + 6);
        ln(ML + 4, y + 8, ML + 80, y + 8, LIGHT, 0.25);
        f(7, 'normal', LIGHT);
        doc.text('Name:', ML + 4, y + 14);
        doc.text('Date:', ML + 4, y + 20);
        ln(ML + 14, y + 15, ML + 80, y + 15, LIGHT, 0.25);
        ln(ML + 14, y + 21, ML + 80, y + 21, LIGHT, 0.25);

        f(7, 'bold', MID);
        doc.text('Checker Sign-off', ML + 100, y + 6);
        ln(ML + 100, y + 8, pageW - MR - 4, y + 8, LIGHT, 0.25);
        f(7, 'normal', LIGHT);
        doc.text('Name:', ML + 100, y + 14);
        doc.text('Date:', ML + 100, y + 20);
        ln(ML + 110, y + 15, pageW - MR - 4, y + 15, LIGHT, 0.25);
        ln(ML + 110, y + 21, pageW - MR - 4, y + 21, LIGHT, 0.25);

        /* ── Save ── */
        const fn2 = filename || (data.calcType + '-report.pdf');
        doc.save(fn2);
    }

    /* ══════════════════════════════════════════════════════
       Word Export — delegates to WordExport module
    ══════════════════════════════════════════════════════ */
    async function exportWord(data, filename) {
        if (!window.WordExport) {
            throw new Error('WordExport module not loaded.');
        }

        // Map our data shape to WordExport.exportBeam() expected shape
        const wordData = {
            projectName: data.projectName,
            calcName:    data.calcName,
            date:        data.date,
            standard:    data.standard,
            inputs:  (data.inputs  || []).map(i => ({ label: i.label, value: String(i.value ?? '—'), unit: i.unit || '' })),
            results: (data.results || []).map(r => ({
                label: r.label,
                value: String(r.value ?? '—'),
                unit:  '',
                pass:  r.status,
            })),
            summary: data.summary,
        };

        const fn2 = filename || (data.calcType + '-report.docx');
        await window.WordExport.exportBeam(wordData, fn2);
    }

    return { buildData, exportPDF, exportWord };
})();
window.CalcReport = CalcReport;
