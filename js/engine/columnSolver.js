/**
 * BuildMetrics — Column Design Solver (Eurocode 3 EN 1993-1-1)
 */
const ColumnSolver = (() => {

    const GAMMA_M1 = 1.0; // Partial factor for instability

    // Buckling curve imperfection factors (Table 6.2)
    const IMPERFECTION_FACTORS = { a0: 0.13, a: 0.21, b: 0.34, c: 0.49, d: 0.76 };

    // Assign buckling curve based on section type (simplified)
    function _getBucklingCurve(sectionType, axis) {
        // axis: 'y' (major) or 'z' (minor)
        const curves = {
            'UB': axis === 'y' ? 'a' : 'b',
            'UC': axis === 'y' ? 'b' : 'c',
            'CHS': 'a0',
            'RHS': 'a',
            'SHS': 'a',
            'custom': 'b',
        };
        return curves[sectionType] || 'b';
    }

    function _chiReduction(lambdaBar, alpha) {
        // Perry-Robertson formula (EC3 Eq 6.49)
        const phi = 0.5 * (1 + alpha * (lambdaBar - 0.2) + lambdaBar * lambdaBar);
        const chi = 1 / (phi + Math.sqrt(phi * phi - lambdaBar * lambdaBar));
        return Math.min(chi, 1.0);
    }

    function solve(config) {
        const {
            NEd,          // Applied axial force (kN)
            length,       // Member length (m)
            keff,         // Effective length factor (0.5-2.0)
            sectionType,  // 'UB','UC','CHS','RHS','SHS','custom'
            A,            // Cross-section area (cm²)
            Iyy,          // Second moment of area minor axis (cm⁴)
            Ixx,          // Second moment of area major axis (cm⁴)
            fy,           // Yield strength (N/mm² = MPa)
            E,            // Young's modulus (N/mm² = MPa), default 210000
            axis,         // Design axis: 'minor' (z-z, Iyy) or 'major' (y-y, Ixx) or 'both'
        } = config;

        const E_use = E || 210000; // MPa

        // Convert to consistent units (N, mm)
        const Le = (keff || 1.0) * length * 1000; // mm effective length
        const A_mm2 = A * 100;    // cm² → mm²
        const Iyy_mm4 = Iyy * 1e4; // cm⁴ → mm⁴
        const Ixx_mm4 = Ixx * 1e4;

        // ── Minor axis (z-z) check ──
        const iz = Math.sqrt(Iyy_mm4 / A_mm2); // mm
        const lambda_z = Le / iz;
        const lambda_1 = Math.PI * Math.sqrt(E_use / fy);
        const lambdaBar_z = (lambda_z / lambda_1);
        const curve_z = _getBucklingCurve(sectionType, 'z');
        const alpha_z = IMPERFECTION_FACTORS[curve_z];
        const chi_z = _chiReduction(lambdaBar_z, alpha_z);
        const Ncr_z = (Math.PI * Math.PI * E_use * Iyy_mm4) / (Le * Le); // N
        const Nb_Rd_z = (chi_z * A_mm2 * fy) / (GAMMA_M1 * 1000); // kN

        // ── Major axis (y-y) check ──
        const iy = Math.sqrt(Ixx_mm4 / A_mm2);
        const lambda_y = Le / iy;
        const lambdaBar_y = (lambda_y / lambda_1);
        const curve_y = _getBucklingCurve(sectionType, 'y');
        const alpha_y = IMPERFECTION_FACTORS[curve_y];
        const chi_y = _chiReduction(lambdaBar_y, alpha_y);
        const Ncr_y = (Math.PI * Math.PI * E_use * Ixx_mm4) / (Le * Le);
        const Nb_Rd_y = (chi_y * A_mm2 * fy) / (GAMMA_M1 * 1000);

        // Governing (minimum capacity)
        const Nb_Rd = Math.min(Nb_Rd_y, Nb_Rd_z);
        const governingAxis = Nb_Rd_y <= Nb_Rd_z ? 'Major (y-y)' : 'Minor (z-z)';

        // Squash load (no buckling)
        const Npl_Rd = (A_mm2 * fy) / (1000); // kN (γM0=1.0)

        // Utilisation
        const utilisation = NEd / Nb_Rd;
        const utilisationSquash = NEd / Npl_Rd;
        const pass = utilisation <= 1.0;

        // Slenderness classification (simplified)
        let slendernessClass;
        const maxLambda = Math.max(lambdaBar_y, lambdaBar_z);
        if (maxLambda < 0.2) slendernessClass = 'Stocky (λ̄ < 0.2)';
        else if (maxLambda < 0.5) slendernessClass = 'Short (0.2 ≤ λ̄ < 0.5)';
        else if (maxLambda < 1.0) slendernessClass = 'Intermediate (0.5 ≤ λ̄ < 1.0)';
        else if (maxLambda < 2.0) slendernessClass = 'Slender (1.0 ≤ λ̄ < 2.0)';
        else slendernessClass = 'Very Slender (λ̄ ≥ 2.0)';

        return {
            // Input echo
            NEd, length, keff: keff || 1.0, Le_m: Le/1000,
            sectionType, A, Iyy, Ixx, fy, E: E_use,

            // Minor axis results
            iz_mm: iz, lambda_z, lambdaBar_z: +lambdaBar_z.toFixed(3),
            curve_z, alpha_z, chi_z: +chi_z.toFixed(3),
            Ncr_z_kN: +(Ncr_z/1000).toFixed(1), Nb_Rd_z: +Nb_Rd_z.toFixed(1),

            // Major axis results
            iy_mm: +iy.toFixed(1), lambda_y: +lambda_y.toFixed(1), lambdaBar_y: +lambdaBar_y.toFixed(3),
            curve_y, alpha_y, chi_y: +chi_y.toFixed(3),
            Ncr_y_kN: +(Ncr_y/1000).toFixed(1), Nb_Rd_y: +Nb_Rd_y.toFixed(1),

            // Summary
            Npl_Rd: +Npl_Rd.toFixed(1),
            Nb_Rd: +Nb_Rd.toFixed(1),
            governingAxis,
            utilisation: +utilisation.toFixed(3),
            utilisationSquash: +utilisationSquash.toFixed(3),
            utilisationPct: +(utilisation * 100).toFixed(1),
            pass,
            slendernessClass,
            lambda_1: +lambda_1.toFixed(1),
        };
    }

    return { solve };
})();
window.ColumnSolver = ColumnSolver;
