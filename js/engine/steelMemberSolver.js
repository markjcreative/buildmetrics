/**
 * BuildMetrics — EC3 Steel Member Solver
 * EN 1993-1-1 steel member verification (combined axial + bending + shear)
 */
window.SteelMemberSolver = (() => {

    const E = 210000; // N/mm² — Young's modulus for steel

    /**
     * solve(cfg) — Main solver entry point
     *
     * cfg: {
     *   A         — cross-section area (cm²)
     *   Iy        — second moment of area major axis (cm⁴)
     *   iz        — radius of gyration minor axis (cm)
     *   Wpl_y     — plastic section modulus major axis (cm³)
     *   Wel_y     — elastic section modulus major axis (cm³)
     *   tf        — flange thickness (mm)
     *   tw        — web thickness (mm)
     *   b         — flange width (mm)
     *   h         — overall depth (mm)
     *   fy        — yield strength (N/mm²)
     *   fu        — ultimate strength (N/mm²)
     *   gammaM0   — partial factor cross-section (default 1.0)
     *   gammaM1   — partial factor member buckling (default 1.0)
     *   L         — member length (m)
     *   Lcr_y     — effective buckling length major axis (m)
     *   Lcr_z     — effective buckling length minor axis (m)
     *   NEd       — design axial compression (kN, positive = compression)
     *   My_Ed     — design moment major axis (kNm)
     *   Vz_Ed     — design shear force (kN)
     * }
     */
    function solve(cfg) {
        const {
            fy, fu,
            tf, tw, b, h,
            L, Lcr_y: Lcr_y_m, Lcr_z: Lcr_z_m,
            NEd: NEd_kN, My_Ed: My_Ed_kNm, Vz_Ed: Vz_Ed_kN,
        } = cfg;

        const gammaM0 = cfg.gammaM0 || 1.0;
        const gammaM1 = cfg.gammaM1 || 1.0;

        // Unit conversions
        const A_mm2      = cfg.A * 100;              // cm² → mm²
        const Iy_mm4     = cfg.Iy * 1e4;             // cm⁴ → mm⁴
        const iz_mm      = cfg.iz * 10;              // cm → mm
        const Wpl_y_mm3  = cfg.Wpl_y * 1e3;          // cm³ → mm³
        const Wel_y_mm3  = cfg.Wel_y * 1e3;          // cm³ → mm³
        const Lcr_y_mm   = Lcr_y_m * 1000;
        const Lcr_z_mm   = Lcr_z_m * 1000;

        // Compute iy from Iy and A
        const iy_mm = Math.sqrt(Iy_mm4 / A_mm2);

        // Design forces in N / N·mm
        const NEd  = NEd_kN  * 1000;           // N
        const My_Ed = My_Ed_kNm * 1e6;          // N·mm
        const Vz_Ed = Vz_Ed_kN * 1000;          // N

        // ── 1. SECTION CLASSIFICATION (EC3 Table 5.2) ─────────────────────
        const eps = Math.sqrt(235 / fy);   // ε

        // Flange: outstand of compression flange (both sides — use one side)
        // Assuming 12 mm root fillet radius
        const r_fillet = 12;
        const c_f = (b - tw - 2 * r_fillet) / 2;
        const ct_flange = c_f / tf;

        // Web: internal compressed part (pure bending assumed)
        const c_w = h - 2 * tf - 2 * r_fillet;
        const ct_web = c_w / tw;

        function classifyFlange(ct) {
            if (ct <= 9  * eps) return 1;
            if (ct <= 10 * eps) return 2;
            if (ct <= 14 * eps) return 3;
            return 4;
        }

        function classifyWeb(ct) {
            if (ct <= 72  * eps) return 1;
            if (ct <= 83  * eps) return 2;
            if (ct <= 124 * eps) return 3;
            return 4;
        }

        const flange_class  = classifyFlange(ct_flange);
        const web_class     = classifyWeb(ct_web);
        const sectionClass  = Math.max(flange_class, web_class);

        // Use plastic or elastic modulus depending on class
        const W_eff = sectionClass <= 2 ? Wpl_y_mm3 : Wel_y_mm3;

        // ── 2. CROSS-SECTION RESISTANCE ────────────────────────────────────
        // Compression
        const Nc_Rd_N = (A_mm2 * fy) / gammaM0;
        const Nc_Rd   = Nc_Rd_N / 1000;         // kN

        // Bending
        const Mc_Rd_Nmm = (W_eff * fy) / gammaM0;
        const Mc_Rd     = Mc_Rd_Nmm / 1e6;      // kNm

        // Shear area (EC3 Cl.6.2.6 — rolled I-section, load parallel to web)
        const A_v = A_mm2 - 2 * b * tf + (tw + 2 * r_fillet) * tf;
        const Vc_Rd_N = (A_v * fy) / (Math.sqrt(3) * gammaM0);
        const Vc_Rd   = Vc_Rd_N / 1000;         // kN

        // ── 3. FLEXURAL BUCKLING RESISTANCE (EC3 Cl.6.3.1) ────────────────
        const lambda_1 = Math.PI * Math.sqrt(E / fy);   // reference slenderness

        // Determine buckling curve:
        // For UB sections with h/b > 1.2 and tf ≤ 40 mm:
        //   y-y axis → curve b (α = 0.34)
        //   z-z axis → curve c (α = 0.49)
        const hb_ratio = h / b;
        let alpha_y, alpha_z;
        if (hb_ratio > 1.2 && tf <= 40) {
            alpha_y = 0.34;  // curve b
            alpha_z = 0.49;  // curve c
        } else if (hb_ratio > 1.2 && tf > 40) {
            alpha_y = 0.49;  // curve c
            alpha_z = 0.76;  // curve d
        } else {
            // h/b ≤ 1.2 — HEB-type
            alpha_y = 0.34;
            alpha_z = 0.49;
        }

        function bucklingFactor(Lcr, i, alpha) {
            const lambda_bar = (Lcr / i) / lambda_1;
            const phi = 0.5 * (1 + alpha * (lambda_bar - 0.2) + lambda_bar * lambda_bar);
            let chi = 1 / (phi + Math.sqrt(Math.max(0, phi * phi - lambda_bar * lambda_bar)));
            chi = Math.min(chi, 1.0);
            return { lambda_bar, phi, chi };
        }

        const bk_z = bucklingFactor(Lcr_z_mm, iz_mm, alpha_z);
        const bk_y = bucklingFactor(Lcr_y_mm, iy_mm, alpha_y);

        const chi_z = bk_z.chi;
        const chi_y = bk_y.chi;

        const Nb_Rd_z_N = (chi_z * A_mm2 * fy) / gammaM1;
        const Nb_Rd_z   = Nb_Rd_z_N / 1000;  // kN

        const Nb_Rd_y_N = (chi_y * A_mm2 * fy) / gammaM1;
        const Nb_Rd_y   = Nb_Rd_y_N / 1000;  // kN

        // Governing buckling resistance (minimum)
        const Nb_Rd = Math.min(Nb_Rd_y, Nb_Rd_z);

        // ── 4. COMBINED CHECK (Cl.6.3.3 simplified linear interaction) ─────
        const eta_N = NEd_kN / Math.min(Nb_Rd_y, Nb_Rd_z);
        const eta_M = My_Ed_kNm / Mc_Rd;
        const eta_combined = eta_N + eta_M;

        // ── 5. INDIVIDUAL PASS/FAIL ────────────────────────────────────────
        const pass_section  = (NEd_kN <= Nc_Rd) && (My_Ed_kNm <= Mc_Rd);
        const pass_buckling = (NEd_kN <= Nb_Rd_y) && (NEd_kN <= Nb_Rd_z);
        const pass_shear    = Vz_Ed_kN <= Vc_Rd;
        const pass_combined = eta_combined <= 1.0;

        const pass = pass_section && pass_buckling && pass_shear && pass_combined;

        return {
            // Classification
            sectionClass,
            eps:        +eps.toFixed(4),
            ct_flange:  +ct_flange.toFixed(2),
            ct_web:     +ct_web.toFixed(2),
            flange_class,
            web_class,

            // Section properties used
            A_mm2:      +A_mm2.toFixed(1),
            iy_mm:      +iy_mm.toFixed(2),
            iz_mm:      +iz_mm.toFixed(2),
            W_eff_cm3:  +(W_eff / 1e3).toFixed(1),

            // Cross-section resistance
            Nc_Rd:      +Nc_Rd.toFixed(1),
            Mc_Rd:      +Mc_Rd.toFixed(1),
            Vc_Rd:      +Vc_Rd.toFixed(1),
            A_v:        +A_v.toFixed(1),

            // Buckling — z-z
            lambda_bar_z:   +bk_z.lambda_bar.toFixed(3),
            phi_z:          +bk_z.phi.toFixed(3),
            chi_z:          +chi_z.toFixed(3),
            Nb_Rd_z:        +Nb_Rd_z.toFixed(1),
            alpha_z,

            // Buckling — y-y
            lambda_bar_y:   +bk_y.lambda_bar.toFixed(3),
            phi_y:          +bk_y.phi.toFixed(3),
            chi_y:          +chi_y.toFixed(3),
            Nb_Rd_y:        +Nb_Rd_y.toFixed(1),
            alpha_y,

            // Combined
            eta_N:          +eta_N.toFixed(3),
            eta_M:          +eta_M.toFixed(3),
            eta_combined:   +eta_combined.toFixed(3),

            // Utilisation %
            util_section_N: +(NEd_kN / Nc_Rd   * 100).toFixed(1),
            util_section_M: +(My_Ed_kNm / Mc_Rd * 100).toFixed(1),
            util_buckle_y:  +(NEd_kN / Nb_Rd_y  * 100).toFixed(1),
            util_buckle_z:  +(NEd_kN / Nb_Rd_z  * 100).toFixed(1),
            util_shear:     +(Vz_Ed_kN / Vc_Rd  * 100).toFixed(1),
            util_combined:  +(eta_combined * 100).toFixed(1),

            // Pass / fail
            pass_section,
            pass_buckling,
            pass_shear,
            pass_combined,
            pass,

            // Echo inputs for report
            NEd: NEd_kN,
            My_Ed: My_Ed_kNm,
            Vz_Ed: Vz_Ed_kN,
        };
    }

    return { solve };

})();
