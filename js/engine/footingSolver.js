/**
 * BuildMetrics — Pad Footing Design Solver (EC2 + EC7 principles)
 */
const FootingSolver = (() => {
    const GAMMA_C = 1.5;
    const GAMMA_S = 1.15;
    const GAMMA_G = 1.35;
    const GAMMA_Q = 1.5;
    const CONCRETE_DENSITY = 24; // kN/m³

    function solve(config) {
        const {
            Gk,          // Permanent column load (kN)
            Qk,          // Variable column load (kN)
            columnW,     // Column width (mm) - square assumed
            colH,        // Column depth (mm) - if rectangular
            soilBearing, // Allowable soil bearing pressure (kN/m²)
            footThick,   // Footing thickness (mm)
            fck,         // Concrete strength N/mm²
            fyk,         // Rebar yield N/mm²
            cover,       // Nominal cover mm
            barDia,      // Rebar diameter mm
            footingType, // 'square' | 'rectangular'
            aspectRatio, // L/B ratio for rectangular (default 1.0)
        } = config;

        const cw = columnW || 300; // mm
        const ch = colH || cw;     // mm
        const h = footThick || 500; // mm
        const d = h - cover - (barDia || 16) / 2; // mm

        const fcd = fck / GAMMA_C;
        const fyd = fyk / GAMMA_S;

        // SLS: size footing for service load + footing self-weight (iterative once)
        const N_SLS = Gk + Qk; // kN (unfactored)

        // First estimate of area
        let B = Math.sqrt(N_SLS / soilBearing);
        // Add 10% for self-weight
        B = Math.sqrt((N_SLS + B * B * (h / 1000) * CONCRETE_DENSITY) / soilBearing);
        // Round up to nearest 50mm
        B = Math.ceil(B / 0.05) * 0.05; // m

        const L = footingType === 'rectangular' ? +(B * (aspectRatio || 1.5)).toFixed(2) : B;
        const area = B * L; // m²

        // Actual footing self-weight
        const footingSW = area * (h / 1000) * CONCRETE_DENSITY; // kN
        const netBearingPressure = N_SLS / area; // kN/m² (at SLS excl. SW)
        const grossBearingPressure = (N_SLS + footingSW) / area;
        const bearingPass = grossBearingPressure <= soilBearing;

        // ULS: factored load
        const NEd = GAMMA_G * Gk + GAMMA_Q * Qk; // kN
        const q_Ed = NEd / area; // kN/m²

        // ── Bending at column face ──
        // Overhang from column face
        const a_x = (B * 1000 - cw) / 2 / 1000; // m (per side, x-direction = B)
        const a_y = (L * 1000 - ch) / 2 / 1000; // m (per side, y-direction = L)

        const MEd_x = q_Ed * L * a_x * a_x / 2; // kNm (for full L width strip)
        const MEd_y = q_Ed * B * a_y * a_y / 2; // kNm (for full B width strip)

        // Design per unit width
        const MEd_x_per_m = MEd_x / L; // kNm/m
        const MEd_y_per_m = MEd_y / B; // kNm/m

        // Main reinforcement (both ways)
        function designRebar(Med_per_m) {
            const K = Med_per_m * 1e6 / (1000 * d * d * fcd);
            const z = Math.min(0.95 * d, d * (0.5 + Math.sqrt(Math.max(0, 0.25 - K / 1.134))));
            const As = Med_per_m * 1e6 / (fyd * z); // mm²/m
            const As_min = Math.max(0.26 * 0.30 * Math.pow(fck, 2/3) / fyk * 1000 * d, 0.0013 * 1000 * d);
            return { K: +K.toFixed(4), z: +z.toFixed(1), As_req: +Math.max(As, As_min).toFixed(0), As_min: +As_min.toFixed(0) };
        }

        const rebar_x = designRebar(MEd_x_per_m);
        const rebar_y = designRebar(MEd_y_per_m);

        // Bar spacing
        const bar_area = Math.PI * (barDia || 16) * (barDia || 16) / 4;
        const spacing_x = Math.min(300, Math.floor(bar_area / rebar_x.As_req * 1000));
        const spacing_y = Math.min(300, Math.floor(bar_area / rebar_y.As_req * 1000));
        const As_prov_x = bar_area * (1000 / spacing_x);
        const As_prov_y = bar_area * (1000 / spacing_y);

        // ── Punching shear (EC2 6.4) ──
        const u1 = 2 * (cw + ch) + 4 * Math.PI * 2 * d; // mm basic control perimeter at 2d
        const rho_avg = Math.sqrt((As_prov_x / (1000 * d)) * (As_prov_y / (1000 * d)));
        const k_punch = Math.min(2.0, 1 + Math.sqrt(200 / d));
        const vRd_c = Math.max(
            0.18 / GAMMA_C * k_punch * Math.pow(100 * rho_avg * fck, 1/3),
            0.035 * Math.pow(k_punch, 1.5) * Math.sqrt(fck)
        );
        const VEd_punch = NEd - q_Ed * (cw / 1000 + 4 * d / 1000) * (ch / 1000 + 4 * d / 1000);
        const VRd_punch = vRd_c * u1 * d / 1000; // kN
        const punchPass = VEd_punch <= VRd_punch;

        // ── Wide beam shear (at d from column face) ──
        const a_shear_x = a_x - d / 1000;
        const VEd_shear = q_Ed * L * Math.max(0, a_shear_x);
        const VRd_shear = vRd_c * L * 1000 * d / 1000; // kN
        const shearPass = VEd_shear <= VRd_shear;

        const pass = bearingPass && punchPass && shearPass && rebar_x.K < 0.167 && rebar_y.K < 0.167;

        return {
            // Geometry
            B: +B.toFixed(2), L: +L.toFixed(2), area: +area.toFixed(2), h, d,

            // Bearing
            grossBearingPressure: +grossBearingPressure.toFixed(1),
            netBearingPressure: +netBearingPressure.toFixed(1),
            bearingPass, soilBearing,

            // ULS
            NEd: +NEd.toFixed(1), q_Ed: +q_Ed.toFixed(2),
            MEd_x: +MEd_x_per_m.toFixed(2), MEd_y: +MEd_y_per_m.toFixed(2),

            // Reinforcement
            rebar_x, rebar_y,
            barDia: barDia || 16,
            spacing_x, spacing_y,
            As_prov_x: +As_prov_x.toFixed(0), As_prov_y: +As_prov_y.toFixed(0),

            // Shear
            VEd_punch: +VEd_punch.toFixed(1), VRd_punch: +VRd_punch.toFixed(1), punchPass,
            VEd_shear: +VEd_shear.toFixed(1), VRd_shear: +VRd_shear.toFixed(1), shearPass,

            pass,
            fcd: +fcd.toFixed(1), fyd: +fyd.toFixed(1),
        };
    }

    return { solve };
})();
window.FootingSolver = FootingSolver;
