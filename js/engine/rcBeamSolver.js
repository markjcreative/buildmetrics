/**
 * rcBeamSolver.js — RC Beam design to Eurocode 2 (EN 1992-1-1)
 * Checks: flexure, shear, deflection (span/depth), minimum reinforcement
 */

window.RCBeamSolver = {

    solve(config) {
        const {
            span,           // m
            b,              // mm — width
            h,              // mm — overall depth
            d,              // mm — effective depth (= h - cover - bar_dia/2)
            fck,            // N/mm² — concrete char. strength
            fyk,            // N/mm² — rebar char. yield strength
            MEd,            // kNm — design bending moment
            VEd,            // kN  — design shear force
            As_prov,        // mm² — provided tension reinforcement
            Asw_prov,       // mm²/m — provided shear reinforcement (stirrups)
            stirrup_s,      // mm — stirrup spacing
            stirrup_d,      // mm — stirrup bar diameter
            cover,          // mm — nominal cover
        } = config;

        const gammaC = 1.5;
        const gammaS = 1.15;

        // Design strengths
        const fcd  = (0.85 * fck) / gammaC;    // N/mm² — design compressive strength
        const fyd  = fyk / gammaS;              // N/mm² — design yield strength
        const fctm = 0.30 * Math.pow(fck, 2/3); // N/mm² — mean tensile strength (EC2 Table 3.1)

        // ── Flexural check ────────────────────────────────────────────────────
        // Lever arm: z = d[0.5 + √(0.25 - K/1.134)] where K = MEd/(b·d²·fcd)
        const MEd_Nmm = MEd * 1e6;
        const K = MEd_Nmm / (b * d * d * fcd);
        const Kbal = 0.167; // balanced K for Class C concrete (EC2)
        const z    = Math.min(d * (0.5 + Math.sqrt(Math.max(0.25 - K / 1.134, 0))), 0.95 * d);
        const As_req = MEd_Nmm / (fyd * z);    // mm²

        // Capacity of provided steel
        const MRd = (As_prov * fyd * z) / 1e6; // kNm

        // ── Minimum reinforcement ─────────────────────────────────────────────
        const As_min = Math.max(0.26 * (fctm / fyk) * b * d, 0.0013 * b * d);
        const As_max = 0.04 * b * h;
        const As_min_ok = As_prov >= As_min;
        const As_max_ok = As_prov <= As_max;

        // ── Shear check ───────────────────────────────────────────────────────
        const rho_l  = Math.min(As_prov / (b * d), 0.02);
        const k_shear = Math.min(1 + Math.sqrt(200 / d), 2.0);
        const VRdc_N = Math.max(
            (0.18 / gammaC) * k_shear * Math.pow(100 * rho_l * fck, 1/3) * b * d,
            (0.035 * Math.pow(k_shear, 1.5) * Math.sqrt(fck)) * b * d
        );
        const VRdc = VRdc_N / 1000; // kN

        // Shear reinforcement capacity (if provided)
        let VRds = 0;
        let VRd  = VRdc;
        if (stirrup_d > 0 && stirrup_s > 0) {
            const Asw_mm2 = Math.PI * (stirrup_d / 2) ** 2 * 2; // 2-leg stirrup
            const theta   = 22; // strut angle (degrees), EC2 allows 21.8°–45°
            const cotTheta = 1 / Math.tan(theta * Math.PI / 180);
            VRds = (Asw_mm2 / stirrup_s) * z * fyd * cotTheta / 1000; // kN
            VRd  = VRdc + VRds;
        }

        // ── Deflection check (span/depth ratio method — EC2 7.4.2) ──────────
        // Basic l/d ratio (simply supported)
        const rho0  = Math.sqrt(fck) / 1000;
        const rho   = As_req / (b * d);
        let l_d_basic;
        if (rho <= rho0) {
            l_d_basic = 11 + 1.5 * Math.sqrt(fck) * (rho0 / rho) + 3.2 * Math.sqrt(fck) * Math.pow(rho0 / rho - 1, 1.5);
        } else {
            l_d_basic = 11 + 1.5 * Math.sqrt(fck) * (rho0 / (rho - rho0)) + Math.sqrt(fck) / 12;
        }
        // Modification for steel stress (EC2 7.4.2 Note 5)
        const sigma_s = fyk * As_req / (1.15 * As_prov);
        const K_stress = Math.min(310 / sigma_s, 1.5);
        const l_d_perm = l_d_basic * K_stress;
        const l_d_actual = (span * 1000) / d;
        const defl_pass = l_d_actual <= l_d_perm;

        // ── Utilisation ratios ────────────────────────────────────────────────
        const util_M = MEd / MRd;
        const util_V = VEd / VRd;
        const util_D = l_d_actual / l_d_perm;

        const checks = [
            {
                name: 'Flexure',
                Ed: MEd.toFixed(2), Rd: MRd.toFixed(2), unit: 'kNm',
                util: util_M, pass: util_M <= 1.0 && K <= Kbal,
                ref: 'EC2 §6.1', formula: 'MEd ≤ MRd = As·fyd·z',
                note: K > Kbal ? 'Doubly reinforced or increase depth' : '',
            },
            {
                name: 'Shear',
                Ed: VEd.toFixed(2), Rd: VRd.toFixed(2), unit: 'kN',
                util: util_V, pass: util_V <= 1.0,
                ref: 'EC2 §6.2', formula: 'VEd ≤ VRd,c + VRd,s',
                note: VEd > VRdc ? `Links required (VRd,c=${VRdc.toFixed(1)}kN)` : 'Links not required by calc',
            },
            {
                name: 'Deflection',
                Ed: l_d_actual.toFixed(1), Rd: l_d_perm.toFixed(1), unit: 'l/d',
                util: util_D, pass: defl_pass,
                ref: 'EC2 §7.4.2', formula: 'Actual l/d ≤ Permissible l/d',
                note: '',
            },
            {
                name: 'Min. Reinf.',
                Ed: As_prov.toFixed(0), Rd: As_min.toFixed(0), unit: 'mm²',
                util: As_min_ok ? As_prov / As_max : 0,
                pass: As_min_ok,
                ref: 'EC2 §9.2.1', formula: 'As ≥ As,min = 0.26·(fctm/fyk)·b·d',
                note: !As_min_ok ? `As,min = ${As_min.toFixed(0)} mm²` : '',
            },
        ];

        const pass = checks.every(c => c.pass);
        const governingUtil = Math.max(...checks.map(c => c.util));

        return {
            checks, pass, governingUtil,
            utilisationPct: Math.round(governingUtil * 100),
            MEd, MRd, VEd, VRdc, VRds, VRd,
            As_req, As_prov, As_min, As_max,
            K, Kbal, z, fcd, fyd, fctm,
            l_d_actual, l_d_perm, sigma_s,
            neutral_axis_depth: (As_prov * fyd) / (0.8 * b * fcd), // x in mm
        };
    },
};
