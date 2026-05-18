/**
 * beamDesignSolver.js — Beam design checks for steel (EC3) and timber (EC5)
 * Uses solver.js for statics, then applies material design checks.
 */

const kmodTable = {
    SC1_permanent: 0.60, SC1_medium: 0.80, SC1_short: 0.90, SC1_instantaneous: 1.10,
    SC2_permanent: 0.60, SC2_medium: 0.75, SC2_short: 0.85, SC2_instantaneous: 1.00,
    SC3_permanent: 0.50, SC3_medium: 0.65, SC3_short: 0.75, SC3_instantaneous: 0.90,
};

window.BeamDesignSolver = {

    solve(config) {
        const { material, span, supportType, loads } = config;

        // Build solver loads (design ULS values)
        const solverLoads = loads.filter(l => l.magnitude !== 0).map(l => ({
            type: l.type,
            magnitude: l.magnitude,
            position: l.position,
            start: l.start != null ? l.start : 0,
            end: l.end != null ? l.end : span,
        }));

        // Build supports
        const supports = this._buildSupports(supportType, span);

        // Section properties
        const { E_kNm2, I_m4, sectionInfo } = this._getSectionProps(material, config, span);

        // Run statics
        const statics = solveBeam({ span, supports, loads: solverLoads, E: E_kNm2, I: I_m4 });

        const MEd = Math.max(...statics.M.map(Math.abs));
        const VEd = Math.max(...statics.V.map(Math.abs));
        const delta_max_m = Math.max(...statics.deflection.map(Math.abs));
        const delta_max_mm = delta_max_m * 1000;

        // Design checks
        let checks, capacities;
        if (material === 'steel') {
            ({ checks, capacities } = this._checkSteel(config, MEd, VEd, delta_max_mm, span));
        } else {
            ({ checks, capacities } = this._checkTimber(config, MEd, VEd, delta_max_mm, span));
        }

        const governingUtil = Math.max(...checks.map(c => c.util));
        const pass = checks.every(c => c.pass);

        return {
            ...statics,
            MEd, VEd, delta_max_mm,
            capacities,
            checks,
            governingUtil,
            utilisationPct: Math.round(governingUtil * 100),
            pass,
            supportType,
            sectionInfo,
            material,
            span,
        };
    },

    _buildSupports(supportType, span) {
        switch (supportType) {
            case 'fixed_fixed':
                return [{ type: 'fixed', position: 0 }, { type: 'fixed', position: span }];
            case 'cantilever':
                return [{ type: 'fixed', position: 0 }];
            case 'propped_cantilever':
                return [{ type: 'fixed', position: 0 }, { type: 'roller', position: span }];
            default: // simply_supported
                return [{ type: 'pin', position: 0 }, { type: 'roller', position: span }];
        }
    },

    _getSectionProps(material, config, span) {
        if (material === 'steel') {
            const E_MPa = 210000;
            const I_cm4 = config.Ixx || config.I_cm4 || 1000;
            return {
                E_kNm2: E_MPa * 1000,
                I_m4: I_cm4 * 1e-8,
                sectionInfo: config.sectionDesig || 'Custom',
            };
        }
        // Timber
        const grade = (window.EngineeringMaterials?.timber || {})[config.grade] || { E0mean: 11000 };
        const b_m = config.b_mm / 1000;
        const d_m = config.d_mm / 1000;
        return {
            E_kNm2: grade.E0mean * 1000,
            I_m4: (b_m * Math.pow(d_m, 3)) / 12,
            sectionInfo: `${config.b_mm}×${config.d_mm} ${config.grade}`,
        };
    },

    _checkSteel(config, MEd, VEd, delta_max_mm, span) {
        const gammaM0 = 1.0;
        const fy = config.fy;                        // N/mm²
        const Wply_mm3 = (config.Sxx || 0) * 1e3;   // cm³ → mm³
        const h_mm = config.h_mm || 200;
        const tw_mm = config.tw_mm || 5;
        const b_mm = config.b_mm_sec || config.b || 100;
        const tf_mm = config.tf_mm || 8;
        const r_mm = config.r_mm || 8;

        // Shear area (EC3 6.2.6): Av ≈ A - 2b·tf + (tw+r)·tf for I-sections
        const A_mm2 = (config.A_cm2 || 50) * 100;
        const Av_mm2 = Math.max(A_mm2 - 2 * b_mm * tf_mm + (tw_mm + r_mm) * tf_mm, 0.9 * h_mm * tw_mm);

        const Mc_Rd = (Wply_mm3 * fy / gammaM0) / 1e6;  // kNm
        const Vc_Rd = (Av_mm2 * (fy / Math.sqrt(3)) / gammaM0) / 1e3;  // kN
        const delta_lim_mm = (span * 1000) / 360;

        const util_M = MEd / Mc_Rd;
        const util_V = VEd / Vc_Rd;
        const util_D = delta_max_mm / delta_lim_mm;

        return {
            capacities: { Mc_Rd, Vc_Rd, delta_lim_mm, fy, Wply_mm3, Av_mm2 },
            checks: [
                { name: 'Bending', Ed: MEd.toFixed(2), Rd: Mc_Rd.toFixed(2), unit: 'kNm', util: util_M, pass: util_M <= 1.0, ref: 'EC3 §6.2.5', formula: 'MEd ≤ Mc,Rd = Wpl·fy/γM0' },
                { name: 'Shear',   Ed: VEd.toFixed(2), Rd: Vc_Rd.toFixed(2), unit: 'kN',  util: util_V, pass: util_V <= 1.0, ref: 'EC3 §6.2.6', formula: 'VEd ≤ Vc,Rd = Av·(fy/√3)/γM0' },
                { name: 'Deflection', Ed: delta_max_mm.toFixed(1), Rd: delta_lim_mm.toFixed(1), unit: 'mm', util: util_D, pass: util_D <= 1.0, ref: 'NA §2.23', formula: 'δ ≤ L/360' },
            ],
        };
    },

    _checkTimber(config, MEd, VEd, delta_max_mm, span) {
        const mats = window.EngineeringMaterials?.timber || {};
        const grade = mats[config.grade] || { fm_k: 24, fv_k: 2.5, E0mean: 11000 };
        const b = config.b_mm;  // mm
        const d = config.d_mm;  // mm
        const key = `${config.serviceClass}_${config.loadDuration}`;
        const kmod = kmodTable[key] || 0.80;
        const gammaM = 1.3;

        const fm_d = (kmod * grade.fm_k) / gammaM;   // N/mm²
        const fv_d = (kmod * (grade.fv_k || 2.5)) / gammaM; // N/mm²
        const W_mm3 = (b * d * d) / 6;               // mm³
        const A_mm2 = b * d;                          // mm²

        const Mc_Rd = (fm_d * W_mm3) / 1e6;          // kNm
        const Vc_Rd = (fv_d * (2 / 3) * A_mm2) / 1e3; // kN
        const delta_lim_mm = (span * 1000) / 250;

        const util_M = MEd / Mc_Rd;
        const util_V = VEd / Vc_Rd;
        const util_D = delta_max_mm / delta_lim_mm;

        return {
            capacities: { Mc_Rd, Vc_Rd, delta_lim_mm, fm_d, fv_d, kmod, gammaM },
            checks: [
                { name: 'Bending', Ed: MEd.toFixed(2), Rd: Mc_Rd.toFixed(2), unit: 'kNm', util: util_M, pass: util_M <= 1.0, ref: 'EC5 §6.1.6', formula: 'MEd ≤ fm,d · W' },
                { name: 'Shear',   Ed: VEd.toFixed(2), Rd: Vc_Rd.toFixed(2), unit: 'kN',  util: util_V, pass: util_V <= 1.0, ref: 'EC5 §6.1.7', formula: 'VEd ≤ fv,d · ⅔A' },
                { name: 'Deflection', Ed: delta_max_mm.toFixed(1), Rd: delta_lim_mm.toFixed(1), unit: 'mm', util: util_D, pass: util_D <= 1.0, ref: 'EC5 §7.2', formula: 'δ ≤ L/250' },
            ],
        };
    },
};
