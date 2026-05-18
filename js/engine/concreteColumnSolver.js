/**
 * concreteColumnSolver.js — RC Column design to Eurocode 2 (EN 1992-1-1)
 * Checks: axial capacity, slenderness, combined axial + bending, min/max reinforcement
 */

window.ConcreteColumnSolver = {

    solve(config) {
        const {
            shape,       // 'rectangular' | 'circular'
            b,           // mm — width (rectangular)
            h,           // mm — depth (rectangular)
            diameter,    // mm — diameter (circular)
            height,      // m  — storey height
            endCondition,// 'pinned_pinned' | 'fixed_fixed' | 'fixed_pinned' | 'fixed_free'
            fck,         // N/mm² — concrete characteristic strength
            fyk,         // N/mm² — rebar yield strength
            NEd,         // kN  — design axial force
            MEd,         // kNm — design bending moment (uniaxial)
            n_bars,      // number of longitudinal bars
            bar_dia,     // mm — bar diameter
            cover,       // mm — nominal cover to links
            link_dia,    // mm — link diameter
        } = config;

        const gammaC = 1.5;
        const gammaS = 1.15;
        const fcd = (0.85 * fck) / gammaC;   // N/mm²
        const fyd = fyk / gammaS;             // N/mm²
        const Es  = 200000;                    // N/mm² — steel modulus

        // Section geometry
        let Ac, Ag, d_eff;
        if (shape === 'circular') {
            Ag = Math.PI * (diameter / 2) ** 2;
            Ac = Ag;
            d_eff = diameter - cover - link_dia - bar_dia / 2;
        } else {
            Ag = b * h;
            Ac = Ag;
            d_eff = h - cover - link_dia - bar_dia / 2;
        }

        // Reinforcement
        const As_bar = Math.PI * (bar_dia / 2) ** 2;
        const As_tot = n_bars * As_bar;        // mm²
        const As_min = Math.max(0.10 * NEd * 1000 / fyd, 0.002 * Ac);
        const As_max = 0.04 * Ac;

        // Effective length
        const kMap = { pinned_pinned: 1.0, fixed_pinned: 0.7, fixed_fixed: 0.5, fixed_free: 2.0 };
        const k    = kMap[endCondition] || 1.0;
        const Leff = k * height * 1000;       // mm

        // Slenderness (EC2 §5.8.3)
        const i_y  = shape === 'circular' ? diameter / 4 : h / Math.sqrt(12);
        const i_z  = shape === 'circular' ? diameter / 4 : b / Math.sqrt(12);
        const lambda_y = Leff / i_y;
        const lambda_z = Leff / i_z;
        const lambda   = Math.max(lambda_y, lambda_z);

        // Slenderness limit (EC2 §5.8.3.1 simplified: λlim = 20·A·B·C/√n)
        const n = (NEd * 1000) / (Ac * fcd);
        const A_coeff = 0.7;   // simplified (creep not detailed)
        const B_coeff = 1.1;   // simplified
        const C_coeff = 0.7;   // moment ratio (conservative)
        const lambda_lim = (20 * A_coeff * B_coeff * C_coeff) / Math.sqrt(Math.max(n, 0.01));
        const isSlender  = lambda > lambda_lim;

        // Axial capacity (pure compression, no buckling reduction applied here — use NRd)
        const NRd = (Ac * fcd + As_tot * (fyd - fcd)) / 1000; // kN

        // Moment capacity (simplified rectangular stress block, EC2 §6.1)
        // Lever arm from centroid to tension steel
        const z_arm = d_eff - (0.4 * (As_tot * fyd) / (0.8 * b * fcd)) ; // approx
        const MRd_Nmm = As_tot * fyd * Math.max(d_eff - (As_tot * fyd) / (2 * 0.8 * (shape==='circular'?Math.sqrt(Ag/Math.PI)*2:b) * fcd), d_eff * 0.1);
        const MRd = MRd_Nmm / 1e6; // kNm

        // Interaction ratio (simplified linear interaction)
        const util_N = NEd / NRd;
        const util_M = MEd > 0 ? MEd / MRd : 0;
        const util_interaction = util_N + util_M; // linear; replace with N-M diagram for precision

        const reinf_ratio = (As_tot / Ac) * 100; // %

        const checks = [
            {
                name: 'Axial Resistance',
                Ed: NEd.toFixed(2), Rd: NRd.toFixed(2), unit: 'kN',
                util: util_N, pass: util_N <= 1.0,
                ref: 'EC2 §6.1', formula: 'NEd ≤ NRd = Ac·fcd + As·fyd',
            },
            {
                name: 'Combined N + M (linear)',
                Ed: (util_N + util_M).toFixed(4), Rd: '1.000', unit: '—',
                util: util_interaction, pass: util_interaction <= 1.0,
                ref: 'EC2 §6.1', formula: 'NEd/NRd + MEd/MRd ≤ 1',
                note: 'Use N-M interaction diagram for precise check',
            },
            {
                name: 'Min. Reinforcement',
                Ed: As_tot.toFixed(0), Rd: As_min.toFixed(0), unit: 'mm²',
                util: As_tot >= As_min ? As_tot / As_max : 0,
                pass: As_tot >= As_min,
                ref: 'EC2 §9.5.2', formula: 'As ≥ max(0.10·NEd/fyd, 0.002·Ac)',
                note: !( As_tot >= As_min) ? `Need ${As_min.toFixed(0)} mm²` : '',
            },
            {
                name: 'Max. Reinforcement',
                Ed: As_tot.toFixed(0), Rd: As_max.toFixed(0), unit: 'mm²',
                util: As_tot / As_max,
                pass: As_tot <= As_max,
                ref: 'EC2 §9.5.2', formula: 'As ≤ 0.04·Ac',
                note: As_tot > As_max ? 'Reduce bars or increase section' : '',
            },
        ];

        const pass = checks.every(c => c.pass);
        const governingUtil = Math.max(...checks.map(c => c.util));

        return {
            checks, pass, governingUtil,
            utilisationPct: Math.round(governingUtil * 100),
            NEd, NRd, MEd, MRd,
            As_tot, As_min, As_max, As_bar,
            Ac, Ag, fcd, fyd,
            lambda, lambda_y, lambda_z, lambda_lim,
            isSlender, Leff_m: Leff / 1000,
            reinf_ratio, n, endConditionK: k,
            slendernessNote: isSlender
                ? `Slender column (λ=${lambda.toFixed(1)} > λlim=${lambda_lim.toFixed(1)}) — second-order effects apply`
                : `Non-slender (λ=${lambda.toFixed(1)} ≤ λlim=${lambda_lim.toFixed(1)}) — first-order analysis sufficient`,
        };
    },
};
