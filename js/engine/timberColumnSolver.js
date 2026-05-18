/**
 * timberColumnSolver.js — Timber column design to Eurocode 5 (EN 1995-1-1)
 * Checks: axial compression with buckling (§6.3.2), combined compression + bending
 */

const KMOD_TABLE = {
    SC1_permanent: 0.60, SC1_medium: 0.80, SC1_short: 0.90, SC1_instantaneous: 1.10,
    SC2_permanent: 0.60, SC2_medium: 0.75, SC2_short: 0.85, SC2_instantaneous: 1.00,
    SC3_permanent: 0.50, SC3_medium: 0.65, SC3_short: 0.75, SC3_instantaneous: 0.90,
};

const END_CONDITIONS = {
    pinned_pinned:   { k: 1.0, label: 'Pinned–Pinned' },
    fixed_fixed:     { k: 0.5, label: 'Fixed–Fixed (theoretical)' },
    fixed_pinned:    { k: 0.7, label: 'Fixed–Pinned' },
    fixed_free:      { k: 2.0, label: 'Fixed–Free (cantilever)' },
    recommended_pp:  { k: 1.2, label: 'Pinned–Pinned (recommended)' },
};

window.TimberColumnSolver = {

    solve(config) {
        const {
            grade,          // timber grade key e.g. 'C24'
            shape,          // 'rectangular' | 'circular'
            b,              // mm — width (rectangular)
            h,              // mm — depth (rectangular)
            diameter,       // mm — diameter (circular)
            height,         // m — column height
            endCondition,   // key from END_CONDITIONS
            serviceClass,   // 'SC1' | 'SC2' | 'SC3'
            loadDuration,   // 'permanent' | 'medium' | 'short' | 'instantaneous'
            NEd,            // kN — design axial force
            MEd_y,          // kNm — design moment about y (optional)
            MEd_z,          // kNm — design moment about z (optional)
        } = config;

        const mats = window.EngineeringMaterials?.timber || {};
        const mat  = mats[grade] || { fm_k: 24, fc_0_k: 21, E0mean: 11000, E05: 7400 };

        const kmodKey = `${serviceClass}_${loadDuration}`;
        const kmod    = KMOD_TABLE[kmodKey] || 0.80;
        const gammaM  = 1.3;

        const fc_0_d = (kmod * mat.fc_0_k) / gammaM;  // N/mm² — design compression
        const fm_d   = (kmod * mat.fm_k)   / gammaM;  // N/mm² — design bending
        const E05    = mat.E05 || mat.E0mean * 0.67;   // 5th percentile MOE

        // Section properties
        let A, Iy, Iz, iy, iz, Wy, Wz;
        if (shape === 'circular') {
            const r = diameter / 2;
            A  = Math.PI * r * r;
            Iy = Iz = (Math.PI * Math.pow(diameter, 4)) / 64;
            iy = iz = diameter / 4;
            Wy = Wz = (Math.PI * Math.pow(diameter, 3)) / 32;
        } else {
            A  = b * h;
            Iy = (b * Math.pow(h, 3)) / 12;
            Iz = (h * Math.pow(b, 3)) / 12;
            iy = Math.sqrt(Iy / A);
            iz = Math.sqrt(Iz / A);
            Wy = Iy / (h / 2);
            Wz = Iz / (b / 2);
        }

        const ec = END_CONDITIONS[endCondition] || END_CONDITIONS.pinned_pinned;
        const Leff = ec.k * height * 1000; // mm — effective length

        // Slenderness ratios
        const lambda_y = Leff / iy;
        const lambda_z = Leff / iz;

        // Relative slenderness (EC5 §6.3.2)
        const lambda_rel_y = (lambda_y / Math.PI) * Math.sqrt(mat.fc_0_k / E05);
        const lambda_rel_z = (lambda_z / Math.PI) * Math.sqrt(mat.fc_0_k / E05);

        const beta_c = 0.2; // solid timber (0.1 for glulam)

        function kc_factor(lambda_rel) {
            if (lambda_rel <= 0.3) return 1.0;
            const k = 0.5 * (1 + beta_c * (lambda_rel - 0.3) + lambda_rel * lambda_rel);
            return 1 / (k + Math.sqrt(k * k - lambda_rel * lambda_rel));
        }

        const kc_y = kc_factor(lambda_rel_y);
        const kc_z = kc_factor(lambda_rel_z);

        // Axial capacity per axis
        const NRd_y = (kc_y * A * fc_0_d) / 1000;  // kN
        const NRd_z = (kc_z * A * fc_0_d) / 1000;  // kN
        const NRd   = Math.min(NRd_y, NRd_z);
        const governingAxis = NRd_y <= NRd_z ? 'y-y' : 'z-z';
        const kc_gov = Math.min(kc_y, kc_z);

        // Squash load
        const Npl_Rd = (A * fc_0_d) / 1000; // kN

        // Interaction checks (EC5 §6.3.2 Eq. 6.23 & 6.24)
        const km = 0.7; // for rectangular cross-sections

        const sigma_c = (NEd * 1000) / A;        // N/mm²
        const sigma_my = MEd_y ? (MEd_y * 1e6) / Wy : 0; // N/mm²
        const sigma_mz = MEd_z ? (MEd_z * 1e6) / Wz : 0; // N/mm²

        // EC5 Eq. 6.23 (check about y-axis)
        const eta_623 = (sigma_c / (kc_y * fc_0_d)) + (sigma_my / fm_d) + km * (sigma_mz / fm_d);
        // EC5 Eq. 6.24 (check about z-axis)
        const eta_624 = (sigma_c / (kc_z * fc_0_d)) + km * (sigma_my / fm_d) + (sigma_mz / fm_d);

        // Pure compression utilisation
        const util_axial = NEd / NRd;
        const util_int   = Math.max(eta_623, eta_624);

        const checks = [
            {
                name: 'Axial Compression (governing axis)',
                Ed: NEd.toFixed(2), Rd: NRd.toFixed(2), unit: 'kN',
                util: util_axial, pass: util_axial <= 1.0,
                ref: 'EC5 §6.3.2', formula: 'NEd ≤ kc · A · fc,0,d',
            },
            {
                name: 'Squash Load Check',
                Ed: NEd.toFixed(2), Rd: Npl_Rd.toFixed(2), unit: 'kN',
                util: NEd / Npl_Rd, pass: NEd / Npl_Rd <= 1.0,
                ref: 'EC5 §6.1.4', formula: 'NEd ≤ A · fc,0,d',
            },
        ];

        if (MEd_y || MEd_z) {
            checks.push({
                name: 'Combined Compression + Bending',
                Ed: Math.max(eta_623, eta_624).toFixed(4), Rd: '1.000', unit: '—',
                util: util_int, pass: util_int <= 1.0,
                ref: 'EC5 Eq.6.23/6.24', formula: 'σc/(kc·fc,0,d) + σm/fm,d ≤ 1',
            });
        }

        const pass = checks.every(c => c.pass);
        const governingUtil = Math.max(...checks.map(c => c.util));

        return {
            checks, pass, governingUtil,
            utilisationPct: Math.round(governingUtil * 100),
            NEd, NRd, NRd_y, NRd_z, Npl_Rd,
            kc_y, kc_z, kc_gov,
            lambda_y, lambda_z,
            lambda_rel_y, lambda_rel_z,
            A, Iy, Iz, iy, iz,
            fc_0_d, fm_d, kmod, gammaM,
            Leff_mm: Leff, Leff_m: Leff / 1000,
            governingAxis,
            endConditionLabel: ec.label,
            slendernessClass: lambda_rel_y > 1.4 || lambda_rel_z > 1.4
                ? 'High slenderness — buckling critical'
                : lambda_rel_y > 0.3 || lambda_rel_z > 0.3
                    ? 'Buckling reduction applies'
                    : 'Low slenderness — strength critical',
        };
    },
};
