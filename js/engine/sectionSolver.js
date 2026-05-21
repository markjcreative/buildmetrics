/**
 * BuildMetrics — Section Properties Solver
 * Computes geometric section properties for common structural cross-sections.
 * All input dimensions in mm. Outputs in standard engineering units.
 */

const SectionSolver = (() => {

    function sq(x) { return x * x; }
    function sqrt(x) { return Math.sqrt(Math.max(0, x)); }
    const PI = Math.PI;

    /**
     * Format to 4 significant figures.
     */
    function sig4(v) {
        if (!isFinite(v) || isNaN(v)) return null;
        return parseFloat(v.toPrecision(4));
    }

    // ── Section solvers ───────────────────────────────────────────────────

    function solveRectangle(d) {
        const { b, h } = d;
        const A   = b * h;
        const Ixx = b * sq(h) * h / 12;    // b*h³/12
        const Iyy = h * sq(b) * b / 12;    // h*b³/12
        const Zxx = Ixx / (h / 2);
        const Zyy = Iyy / (b / 2);
        const rxx = sqrt(Ixx / A);
        const ryy = sqrt(Iyy / A);
        const Wpl = b * sq(h) / 4;         // plastic modulus about x-x

        return { A, Ixx, Iyy, Zxx, Zyy, Zxx_top: Zxx, Zxx_bot: Zxx, rxx, ryy, Wpl_xx: Wpl, Wpl_yy: null };
    }

    function solveCircle(d) {
        const { dia } = d;
        const r   = dia / 2;
        const A   = PI * sq(r);
        const Ixx = PI * sq(sq(dia)) / 64;  // π*d⁴/64
        const Iyy = Ixx;
        const Zxx = PI * sq(dia) * dia / 32; // π*d³/32
        const Zyy = Zxx;
        const rxx = dia / 4;
        const ryy = rxx;
        const Wpl = sq(dia) * dia / 6;       // d³/6

        return { A, Ixx, Iyy, Zxx, Zyy, Zxx_top: Zxx, Zxx_bot: Zxx, rxx, ryy, Wpl_xx: Wpl, Wpl_yy: Wpl };
    }

    function solveBox(d) {
        const { B, H, b, h } = d; // outer B×H, inner b×h
        const A   = B * H - b * h;
        const Ixx = (B * sq(H) * H - b * sq(h) * h) / 12;
        const Iyy = (H * sq(B) * B - h * sq(b) * b) / 12;
        const Zxx = Ixx / (H / 2);
        const Zyy = Iyy / (B / 2);
        const rxx = sqrt(Ixx / A);
        const ryy = sqrt(Iyy / A);

        return { A, Ixx, Iyy, Zxx, Zyy, Zxx_top: Zxx, Zxx_bot: Zxx, rxx, ryy, Wpl_xx: null, Wpl_yy: null };
    }

    function solveISection(d) {
        const { B, tf, hw, tw } = d;
        const H  = hw + 2 * tf;
        const A  = 2 * B * tf + hw * tw;

        // Ixx: full block minus two flange voids
        const Ixx = (B * sq(H) * H / 12) - ((B - tw) * sq(hw) * hw / 12);
        // Iyy: two flanges + web
        const Iyy = 2 * (tf * sq(B) * B / 12) + hw * sq(tw) * tw / 12;

        const Zxx = Ixx / (H / 2);
        const Zyy = Iyy / (B / 2);
        const rxx = sqrt(Ixx / A);
        const ryy = sqrt(Iyy / A);

        // Plastic modulus about x-x (symmetric I-section)
        const Wpl_xx = B * tf * (hw + tf) / 2 + tw * sq(hw) / 4;
        const Wpl_yy = null;

        return { A, Ixx, Iyy, Zxx, Zyy, Zxx_top: Zxx, Zxx_bot: Zxx, rxx, ryy, Wpl_xx, Wpl_yy, H };
    }

    function solveTSection(d) {
        const { B, tf, hw, tw } = d;
        const H  = hw + tf;
        const A  = B * tf + hw * tw;

        // Centroid from bottom
        const ybar = (B * tf * (H - tf / 2) + hw * tw * (hw / 2)) / A;

        // Ixx about centroid (parallel axis theorem)
        const Ixx = (B * sq(tf) * tf / 12) + B * tf * sq(H - tf / 2 - ybar)
                  + (tw * sq(hw) * hw / 12) + tw * hw * sq(hw / 2 - ybar);

        // Iyy about centroid
        const Iyy = tf * sq(B) * B / 12 + hw * sq(tw) * tw / 12;

        const Zxx_top = Ixx / (H - ybar);
        const Zxx_bot = Ixx / ybar;
        const Zyy     = Iyy / (B / 2);
        const rxx     = sqrt(Ixx / A);
        const ryy     = sqrt(Iyy / A);

        return { A, Ixx, Iyy, Zxx: Zxx_bot, Zxx_top, Zxx_bot, Zyy, rxx, ryy, ybar, H, Wpl_xx: null, Wpl_yy: null };
    }

    function solveAngle(d) {
        const { bA, tA, bB, tB } = d; // Leg A: width=bA, thickness=tA; Leg B: height=bB, thickness=tB
        // Area (two rectangles meeting at corner)
        const A = bA * tA + (bB - tA) * tB;

        // Centroid from bottom (y_c)
        const y_c = (bA * tA * (tA / 2) + (bB - tA) * tB * ((bB - tA) / 2 + tA)) / A;

        // Centroid from left (x_c)
        const x_c = (tB * bB * (tB / 2) + (bA - tB) * tA * ((bA - tB) / 2 + tB)) / A;

        // Ixx about centroid
        const Ixx = (bA * sq(tA) * tA / 12) + bA * tA * sq(tA / 2 - y_c)
                  + (tB * sq(bB - tA) * (bB - tA) / 12) + tB * (bB - tA) * sq((bB - tA) / 2 + tA - y_c);

        // Iyy about centroid
        const Iyy = (bB * sq(tB) * tB / 12) + bB * tB * sq(tB / 2 - x_c)
                  + (tA * sq(bA - tB) * (bA - tB) / 12) + tA * (bA - tB) * sq((bA - tB) / 2 + tB - x_c);

        const Imin = Math.min(Ixx, Iyy);
        const rmin = sqrt(Imin / A);
        const rxx  = sqrt(Ixx / A);
        const ryy  = sqrt(Iyy / A);

        // Section moduli
        const Zxx = Ixx / Math.max(y_c, bB - y_c);
        const Zyy = Iyy / Math.max(x_c, bA - x_c);

        return { A, Ixx, Iyy, Zxx, Zyy, Zxx_top: Zxx, Zxx_bot: Zxx, rxx, ryy, rmin, y_c, x_c, Wpl_xx: null, Wpl_yy: null };
    }

    // ── Main solve entry point ────────────────────────────────────────────

    function solve(config) {
        let raw;
        switch (config.type) {
            case 'rectangle': raw = solveRectangle(config); break;
            case 'circle':    raw = solveCircle(config);    break;
            case 'box':       raw = solveBox(config);       break;
            case 'isection':  raw = solveISection(config);  break;
            case 'tsection':  raw = solveTSection(config);  break;
            case 'angle':     raw = solveAngle(config);     break;
            default: throw new Error('Unknown section type: ' + config.type);
        }

        // Format outputs
        return {
            type:     config.type,
            // Area (mm²)
            A_mm2:    sig4(raw.A),
            // Second moments (mm⁴ displayed as ×10⁶ mm⁴)
            Ixx_e6:   sig4(raw.Ixx / 1e6),
            Iyy_e6:   sig4(raw.Iyy / 1e6),
            // Elastic section moduli (mm³ displayed as ×10³ mm³)
            Zxx_e3:   sig4(raw.Zxx / 1e3),
            Zyy_e3:   sig4(raw.Zyy / 1e3),
            Zxx_top_e3: raw.Zxx_top ? sig4(raw.Zxx_top / 1e3) : null,
            Zxx_bot_e3: raw.Zxx_bot ? sig4(raw.Zxx_bot / 1e3) : null,
            // Radii of gyration (mm)
            rxx_mm:   sig4(raw.rxx),
            ryy_mm:   sig4(raw.ryy),
            rmin_mm:  raw.rmin ? sig4(raw.rmin) : null,
            // Plastic section moduli (mm³ ×10³)
            Wpl_xx_e3: raw.Wpl_xx ? sig4(raw.Wpl_xx / 1e3) : null,
            Wpl_yy_e3: raw.Wpl_yy ? sig4(raw.Wpl_yy / 1e3) : null,
            // Additional geometry
            ybar_mm:  raw.ybar ? sig4(raw.ybar) : null,
            y_c_mm:   raw.y_c  ? sig4(raw.y_c)  : null,
            x_c_mm:   raw.x_c  ? sig4(raw.x_c)  : null,
            H_mm:     raw.H    ? sig4(raw.H)     : null,
            // Raw values for diagram scaling
            _raw: raw,
        };
    }

    return { solve };
})();

window.SectionSolver = SectionSolver;
