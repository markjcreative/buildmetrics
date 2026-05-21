/**
 * BuildMetrics — Bar Bending Schedule (BBS) Solver
 * Standard: BS 8666:2020
 */

const BBSSolver = (() => {

    // Unit weights (kg/m) per BS 4449
    const BAR_WEIGHTS = {
        6:  0.222,
        8:  0.395,
        10: 0.616,
        12: 0.888,
        16: 1.579,
        20: 2.466,
        25: 3.854,
        32: 6.313,
        40: 9.865,
    };

    // Shape code descriptions
    const SHAPES = {
        '00': 'Straight',
        '11': 'L-bar (hook one end)',
        '21': 'U-bar',
        '25': 'Crank / Spacer',
        '33': 'Link / Closed Stirrup',
        '38': 'Spiral',
        '41': 'Four-leg link',
        '51': 'Bent bar (3 legs)',
        '60': 'Five-leg bar',
    };

    /**
     * Compute bend allowance (mm).
     * Standard: 2.5 × diameter for bends ≥ 90°
     */
    function bendAllow(dia) {
        return 2.5 * dia;
    }

    /**
     * Compute cut length (mm) for a given bar entry.
     * @param {Object} bar - { dia, shape, A, B, C, D, E }
     * @returns {number} cut length in mm
     */
    function cutLength(bar) {
        const d   = Number(bar.dia)  || 0;
        const A   = Number(bar.A)    || 0;
        const B   = Number(bar.B)    || 0;
        const C   = Number(bar.C)    || 0;
        const D   = Number(bar.D)    || 0;
        const E   = Number(bar.E)    || 0;
        const ba  = bendAllow(d);

        switch (String(bar.shape)) {
            case '00': // Straight
                return A;

            case '11': // L-bar — one bend
                return A + B - ba;

            case '21': // U-bar — two bends at base
                return 2 * A + B - 2 * ba;

            case '25': // Crank / spacer — two 45° bends
                // 45° bend allowance ≈ 0.5d per bend
                return A + B + C + 2 * (0.5 * d);

            case '33': // Closed link / stirrup — 4 bends + hook allowance 20d
                return 2 * (A + B) + 20 * d;

            case '38': // Spiral — π × mean circumference × turns
                // A = outer dim (e.g. outer dia or width), B = inner dim, C = number of turns
                return Math.PI * ((A + B) / 2) * C;

            case '41': // Four-leg link (U with cranked legs) — 3 bends
                return A + B + C + D - 3 * ba;

            case '51': // Bent bar, 3 legs — 2 bends
                return A + B + C - 2 * ba;

            case '60': // Five-leg bar — 4 bends
                return A + B + C + D + E - 4 * ba;

            default:
                return A;
        }
    }

    /**
     * Dimensions used by each shape code.
     * Used by the UI to show/hide input fields.
     */
    const SHAPE_DIMS = {
        '00': ['A'],
        '11': ['A', 'B'],
        '21': ['A', 'B'],
        '25': ['A', 'B', 'C'],
        '33': ['A', 'B'],
        '38': ['A', 'B', 'C'],   // A=outer, B=inner, C=turns
        '41': ['A', 'B', 'C', 'D'],
        '51': ['A', 'B', 'C'],
        '60': ['A', 'B', 'C', 'D', 'E'],
    };

    /**
     * Solve the full BBS.
     * @param {Array} bars - array of bar entries
     * @returns {Object} { bars: enriched[], totals: { total_bars, total_weight_kg } }
     */
    function solve(bars) {
        let total_bars = 0;
        let total_weight_kg = 0;

        const enriched = bars.map((bar, idx) => {
            const dia          = Number(bar.dia) || 16;
            const qty          = Number(bar.qty) || 1;
            const weight_per_m = BAR_WEIGHTS[dia] || 0;

            const cut_len_mm   = Math.max(0, cutLength({ ...bar, dia }));
            const cut_len_m    = cut_len_mm / 1000;
            const total_len_m  = cut_len_m * qty;
            const total_kg     = total_len_m * weight_per_m;

            total_bars       += qty;
            total_weight_kg  += total_kg;

            return {
                ...bar,
                idx:          idx + 1,
                dia:          dia,
                qty:          qty,
                cut_length_mm: Math.round(cut_len_mm),
                total_length_m: +total_len_m.toFixed(3),
                weight_per_m:  weight_per_m,
                total_kg:      +total_kg.toFixed(2),
            };
        });

        return {
            bars: enriched,
            totals: {
                total_bars,
                total_weight_kg: +total_weight_kg.toFixed(2),
            },
        };
    }

    return { solve, SHAPES, SHAPE_DIMS, BAR_WEIGHTS, cutLength };
})();

window.BBSSolver = BBSSolver;
