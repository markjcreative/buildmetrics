/**
 * BuildMetrics — Retaining Wall Stability Solver
 * Checks overturning, sliding, bearing pressure
 */
const RetainingWallSolver = (() => {

    function solve(config) {
        const {
            H,              // Retained height (m)
            surcharge,      // Surcharge on retained soil (kN/m²)
            soilDensity,    // Retained soil density (kg/m³), typically 1800
            phi,            // Soil internal friction angle (degrees)
            wallDensity,    // Wall concrete density (kN/m³), typically 24
            baseWidth,      // Base width B (m)
            stemThick,      // Stem thickness at base (m)
            toeLength,      // Toe length in front of stem (m)
            heelLength,     // Heel length behind stem (m)
            baseThick,      // Base slab thickness (m)
            soilBearing,    // Allowable soil bearing capacity (kN/m²)
            mu,             // Base friction coefficient (default 0.5)
        } = config;

        const gamma_s = soilDensity * 9.81 / 1000; // kN/m³
        const mu_use = mu || 0.5;
        const phi_rad = phi * Math.PI / 180;

        // Rankine active earth pressure coefficient
        const Ka = Math.tan(Math.PI / 4 - phi_rad / 2) ** 2;
        // Passive
        const Kp = Math.tan(Math.PI / 4 + phi_rad / 2) ** 2;

        const B = baseWidth;
        const stemT = stemThick;
        const toe = toeLength;
        const heel = heelLength;
        const baseT = baseThick;

        // Check geometry
        if (Math.abs(toe + stemT + heel - B) > 0.01) {
            return { error: 'toe + stem + heel must equal base width' };
        }

        // ── Earth pressure forces ──
        // Horizontal force from soil (active)
        const Pa_soil = 0.5 * Ka * gamma_s * H * H; // kN/m (triangular)
        const Pa_surcharge = Ka * surcharge * H;      // kN/m (rectangular)
        const Pa_total = Pa_soil + Pa_surcharge;

        // Height of resultant from base
        const ya_soil = H / 3;
        const ya_surcharge = H / 2;
        const ya_resultant = (Pa_soil * ya_soil + Pa_surcharge * ya_surcharge) / Pa_total;

        // ── Overturning moment about toe ──
        const Mo = Pa_total * ya_resultant;

        // ── Stabilising forces and moments ──
        const weights = [];

        // Stem weight
        const stemH = H - baseT;
        const W_stem = stemT * stemH * wallDensity;
        const x_stem = toe + stemT / 2;
        weights.push({ W: W_stem, x: x_stem, label: 'Stem' });

        // Base slab weight
        const W_base = B * baseT * wallDensity;
        const x_base = B / 2;
        weights.push({ W: W_base, x: x_base, label: 'Base' });

        // Soil on heel
        const W_heel_soil = heel * stemH * gamma_s;
        const x_heel_soil = toe + stemT + heel / 2;
        weights.push({ W: W_heel_soil, x: x_heel_soil, label: 'Soil on heel' });

        // Surcharge on heel
        const W_surcharge = surcharge * heel;
        const x_surcharge = toe + stemT + heel / 2;
        weights.push({ W: W_surcharge, x: x_surcharge, label: 'Surcharge on heel' });

        const W_total = weights.reduce((s, w) => s + w.W, 0);
        const Ms = weights.reduce((s, w) => s + w.W * w.x, 0);

        // ── Overturning check ──
        const FOS_overturning = Ms / Mo;
        const overturningPass = FOS_overturning >= 1.5;

        // ── Sliding check ──
        const Fr = mu_use * W_total; // Friction resistance
        const FOS_sliding = Fr / Pa_total;
        const slidingPass = FOS_sliding >= 1.5;

        // ── Bearing pressure check ──
        const x_resultant = (Ms - Mo) / W_total; // From toe
        const eccentricity = B / 2 - x_resultant;
        const e_limit = B / 6; // No tension condition

        let q_max, q_min;
        if (Math.abs(eccentricity) <= e_limit) {
            q_max = W_total / B * (1 + 6 * eccentricity / B);
            q_min = W_total / B * (1 - 6 * eccentricity / B);
        } else {
            // Triangular pressure distribution
            const x3 = 3 * x_resultant;
            q_max = 2 * W_total / x3;
            q_min = 0;
        }

        const bearingPass = q_max <= soilBearing;
        const tensionPass = q_min >= 0;

        // ── Base design moments (ULS) ──
        // Toe: upward pressure - base self-weight
        const q_toe_avg = (q_max + (q_max - (q_max - q_min) * toe / B)) / 2;
        const M_toe = (q_toe_avg - baseT * wallDensity) * toe * toe / 2;

        // Heel: soil + surcharge downward - upward pressure
        const q_heel_avg = ((q_max - (q_max - q_min) * (toe + stemT) / B) + q_min) / 2;
        const M_heel = (W_heel_soil / heel + surcharge - q_heel_avg) * heel * heel / 2;

        const pass = overturningPass && slidingPass && bearingPass && tensionPass;

        return {
            // Inputs
            H, Ka: +Ka.toFixed(3), Kp: +Kp.toFixed(3), B, phi,

            // Earth pressures
            Pa_soil: +Pa_soil.toFixed(2), Pa_surcharge: +Pa_surcharge.toFixed(2),
            Pa_total: +Pa_total.toFixed(2), ya_resultant: +ya_resultant.toFixed(2),

            // Weights
            weights: weights.map(w => ({ ...w, W: +w.W.toFixed(2), x: +w.x.toFixed(3) })),
            W_total: +W_total.toFixed(2),

            // Moments
            Mo: +Mo.toFixed(2), Ms: +Ms.toFixed(2),

            // Checks
            FOS_overturning: +FOS_overturning.toFixed(2), overturningPass,
            Fr: +Fr.toFixed(2), FOS_sliding: +FOS_sliding.toFixed(2), slidingPass,

            eccentricity: +eccentricity.toFixed(3), e_limit: +e_limit.toFixed(3),
            q_max: +q_max.toFixed(2), q_min: +q_min.toFixed(2),
            bearingPass, tensionPass,

            M_toe: +M_toe.toFixed(2), M_heel: +M_heel.toFixed(2),

            pass,
            overallFOS: +Math.min(FOS_overturning, FOS_sliding).toFixed(2),
        };
    }

    return { solve };
})();
window.RetainingWallSolver = RetainingWallSolver;
