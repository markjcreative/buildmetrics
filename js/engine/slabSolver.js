/**
 * BuildMetrics — RC Slab Design Solver (Eurocode 2 EN 1992-1-1)
 */
const SlabSolver = (() => {
    const GAMMA_C = 1.5;  // Concrete partial factor
    const GAMMA_S = 1.15; // Steel partial factor
    const GAMMA_G = 1.35; // Permanent load factor
    const GAMMA_Q = 1.5;  // Variable load factor

    function solve(config) {
        const {
            span,           // m
            thickness,      // mm (slab depth h)
            width,          // m (design strip width, usually 1.0m)
            fck,            // N/mm² concrete characteristic strength
            fyk,            // N/mm² rebar yield strength
            cover,          // mm nominal cover
            barDia,         // mm main bar diameter (assumed)
            gk,             // kN/m² permanent load (excl. self-weight)
            qk,             // kN/m² variable load
            supportType,    // 'simply_supported' | 'continuous_end' | 'continuous_int'
            selfWeight,     // bool: include self-weight
        } = config;

        const L = span;          // m
        const h = thickness;     // mm
        const b = (width || 1.0) * 1000; // mm (per metre)
        const d = h - cover - (barDia || 12) / 2; // mm effective depth

        // Self-weight
        const sw_kPa = selfWeight !== false ? (h / 1000) * 24 : 0; // kN/m²

        // Total loads
        const Gk_total = gk + sw_kPa; // kN/m²
        const Qk_total = qk;

        // ULS factored load per metre width
        const wEd = (GAMMA_G * Gk_total + GAMMA_Q * Qk_total) * 1.0; // kN/m²
        const wEd_per_m = wEd; // kN/m per m strip

        // Bending moment at ULS
        let coeff_M, coeff_M_support;
        if (supportType === 'simply_supported') {
            coeff_M = 1/8; coeff_M_support = 0;
        } else if (supportType === 'continuous_end') {
            coeff_M = 1/11; coeff_M_support = -1/9; // Approx from EC2 Annex I
        } else { // continuous interior
            coeff_M = 1/16; coeff_M_support = -1/12;
        }

        const MEd = wEd_per_m * L * L * Math.abs(coeff_M); // kNm/m

        // Convert to N·mm (per mm width)
        const MEd_Nmm = MEd * 1e6 / b; // N·mm per mm

        // Design moment capacity
        const fcd = fck / GAMMA_C; // N/mm²
        const fyd = fyk / GAMMA_S; // N/mm²

        // K factor (EC2 Eq 6.4)
        const K = MEd * 1e6 / (b * d * d * fcd); // dimensionless (all mm)
        // Actually per unit width b=1000mm:
        const K_check = MEd * 1e6 / (1000 * d * d * fcd);
        const K_limit = 0.167; // Singly reinforced limit (no redistribution)

        let doublyReinforced = K_check > K_limit;

        // Lever arm z
        const z = Math.min(0.95 * d, d * (0.5 + Math.sqrt(0.25 - K_check / 1.134)));

        // Required tension steel (mm²/m)
        const As_req_ten = MEd * 1e6 / (fyd * z); // mm²/m

        // Minimum steel per EC2 9.2.1.1
        const As_min_a = (0.26 * (0.30 * Math.pow(fck, 2/3)) / fyk) * 1000 * d;
        const As_min_b = 0.0013 * 1000 * d;
        const As_min = Math.max(As_min_a, As_min_b);

        // Maximum steel
        const As_max = 0.04 * 1000 * h;

        const As_req = Math.max(As_req_ten, As_min);

        // Bar spacing (for selected bar dia)
        const bar_area = Math.PI * (barDia || 12) * (barDia || 12) / 4; // mm²
        const spacing = Math.min(300, Math.floor((bar_area / As_req) * 1000)); // mm c/c
        const As_prov = bar_area * (1000 / spacing); // mm²/m

        // SLS deflection check — span/effective depth ratio (EC2 Table 7.4N)
        const rho = As_prov / (1000 * d); // reinforcement ratio
        const rho_0 = Math.sqrt(fck) / 1000; // reference reinforcement ratio
        let limitRatio;
        if (supportType === 'simply_supported') limitRatio = 20;
        else if (supportType === 'continuous_end') limitRatio = 26;
        else limitRatio = 30;

        // EC2 modified span/depth limit
        const factor = rho <= rho_0
            ? 1 + Math.sqrt((rho_0 - rho) / rho_0)  // simplified
            : 1 - 0.5 * (rho - rho_0) / rho_0;
        const allowedRatio = limitRatio * Math.min(factor, 2.0);
        const actualRatio = (L * 1000) / d;
        const deflPass = actualRatio <= allowedRatio;

        // Shear check (simplified, EC2 6.2.2)
        const VEd = wEd_per_m * L / 2; // kN/m at support
        const k = Math.min(2.0, 1 + Math.sqrt(200 / d));
        const vRd_c = Math.max(
            0.18 / GAMMA_C * k * Math.pow(100 * rho * fck, 1/3),
            0.035 * Math.pow(k, 1.5) * Math.sqrt(fck)
        ); // N/mm² (per EC2 6.2.2)
        const VRd_c = vRd_c * 1000 * d / 1000; // kN/m
        const shearPass = VEd <= VRd_c;

        const pass = !doublyReinforced && deflPass && shearPass && As_req <= As_max;

        return {
            // Inputs echo
            span, thickness: h, fck, fyk, cover, gk, qk, supportType,
            sw_kPa: +sw_kPa.toFixed(2), Gk_total: +Gk_total.toFixed(2),

            // Analysis
            wEd: +wEd.toFixed(2),
            MEd: +MEd.toFixed(2),  // kNm/m
            VEd: +VEd.toFixed(2),  // kN/m

            // Section geometry
            d: +d.toFixed(0),
            K: +K_check.toFixed(4), K_limit,
            doublyReinforced,
            z: +z.toFixed(1),

            // Reinforcement
            As_req: +As_req.toFixed(0),     // mm²/m
            As_min: +As_min.toFixed(0),
            As_max: +As_max.toFixed(0),
            barDia: barDia || 12,
            spacing,
            As_prov: +As_prov.toFixed(0),  // mm²/m

            // Checks
            actualRatio: +actualRatio.toFixed(1),
            allowedRatio: +allowedRatio.toFixed(1),
            deflPass,
            VRd_c: +VRd_c.toFixed(2), shearPass,
            rho: +(rho * 100).toFixed(3), // %
            fcd: +fcd.toFixed(1), fyd: +fyd.toFixed(1),

            pass,
            warnings: doublyReinforced ? ['Doubly reinforced section required — increase slab thickness'] : [],
        };
    }

    return { solve };
})();
window.SlabSolver = SlabSolver;
