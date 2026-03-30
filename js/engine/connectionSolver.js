/**
 * BuildMetrics — Connection Design Solver (Eurocode 3)
 */
const ConnectionSolver = (() => {

    // Bolt capacities (kN) for M16–M24 Grade 8.8 and 10.9
    const BOLT_SHEAR_CAP = {
        'M12': { '8.8': 36.0, '10.9': 45.0 },
        'M16': { '8.8': 60.4, '10.9': 75.5 },
        'M20': { '8.8': 94.1, '10.9': 117.7 },
        'M24': { '8.8': 136.0, '10.9': 170.0 },
        'M30': { '8.8': 212.0, '10.9': 265.0 },
    };

    const BOLT_TENSION_CAP = {
        'M12': { '8.8': 44.7, '10.9': 55.9 },
        'M16': { '8.8': 79.5, '10.9': 99.4 },
        'M20': { '8.8': 124.0, '10.9': 155.0 },
        'M24': { '8.8': 178.0, '10.9': 222.0 },
        'M30': { '8.8': 277.0, '10.9': 346.0 },
    };

    // Bolt group: polar moment method for eccentric shear
    function solveBoltGroup(config) {
        const {
            Vx, Vy,         // Applied shear forces (kN)
            M_in_plane,     // Applied in-plane moment (kNm)
            boltLayout,     // Array of {x, y} in mm (relative to centroid)
            boltSize,       // 'M16', 'M20' etc.
            boltGrade,      // '8.8' or '10.9'
            shearPlanes,    // Number of shear planes (1 or 2)
        } = config;

        const n = boltLayout.length;
        const M_Nmm = (M_in_plane || 0) * 1e6; // kNm → N·mm

        // Centroid
        const cx = boltLayout.reduce((s, b) => s + b.x, 0) / n;
        const cy = boltLayout.reduce((s, b) => s + b.y, 0) / n;

        // Relative coords
        const bolts = boltLayout.map(b => ({ x: b.x - cx, y: b.y - cy }));

        // Polar moment of area
        const Ip = bolts.reduce((s, b) => s + b.x * b.x + b.y * b.y, 0); // mm²

        // Direct shear per bolt
        const Vx_bolt = (Vx * 1000) / n; // N
        const Vy_bolt = (Vy * 1000) / n;

        // Torsional shear
        const maxForce = bolts.reduce((max, b) => {
            const r = Math.sqrt(b.x * b.x + b.y * b.y);
            const Vt_x = M_Nmm * b.y / Ip; // N (torsional component)
            const Vt_y = -M_Nmm * b.x / Ip;
            const Vtotal = Math.sqrt((Vx_bolt + Vt_x)**2 + (Vy_bolt + Vt_y)**2);
            return Math.max(max, Vtotal);
        }, 0) / 1000; // → kN

        const cap = BOLT_SHEAR_CAP[boltSize]?.[boltGrade] || 60.4;
        const capTotal = cap * (shearPlanes || 1);
        const pass = maxForce <= capTotal;
        const utilisation = maxForce / capTotal;

        return {
            n, cx: +cx.toFixed(1), cy: +cy.toFixed(1), Ip: +Ip.toFixed(0),
            maxBoltForce: +maxForce.toFixed(2),
            boltCapacity: +capTotal.toFixed(2),
            utilisation: +utilisation.toFixed(3),
            utilisationPct: +(utilisation * 100).toFixed(1),
            pass,
        };
    }

    // Weld group: unit throat method
    function solveWeldGroup(config) {
        const {
            Vx, Vy,       // Shear forces (kN)
            N,            // Axial force (kN) +ve tension
            M,            // Bending moment (kNm)
            weldLayout,   // Array of {x1, y1, x2, y2} line segments (mm)
            throatSize,   // Throat thickness a (mm)
            fu,           // Ultimate tensile strength (N/mm²) typically 410 for S275
        } = config;

        const GAMMA_W = 1.25; // Correlation factor (EC3)
        const fw = fu / (Math.sqrt(3) * GAMMA_W); // Design shear resistance per mm² of throat

        // Total weld length
        const totalLength = weldLayout.reduce((s, w) => {
            const dx = w.x2 - w.x1, dy = w.y2 - w.y1;
            return s + Math.sqrt(dx * dx + dy * dy);
        }, 0); // mm

        // Effective throat area
        const A_w = throatSize * totalLength; // mm²

        // Direct stresses (N/mm² on throat area)
        const sigma_direct = (N * 1000) / A_w; // axial
        const tau_shear_x = (Vx * 1000) / A_w;
        const tau_shear_y = (Vy * 1000) / A_w;

        // Section modulus of weld group (simplified — per unit throat)
        // Centroid
        let Sx = 0, Sy = 0;
        weldLayout.forEach(w => {
            const L = Math.sqrt((w.x2-w.x1)**2 + (w.y2-w.y1)**2);
            Sx += L * (w.y1 + w.y2) / 2;
            Sy += L * (w.x1 + w.x2) / 2;
        });
        const cx = Sy / totalLength;
        const cy = Sx / totalLength;

        // Moment stress (approx using extreme fibre distance)
        const maxY = Math.max(...weldLayout.flatMap(w => [Math.abs(w.y1 - cy), Math.abs(w.y2 - cy)]));
        const Iw = weldLayout.reduce((s, w) => {
            const dy1 = (w.y1 - cy), dy2 = (w.y2 - cy);
            const L = Math.sqrt((w.x2-w.x1)**2 + (w.y2-w.y1)**2);
            return s + L * (dy1 * dy1 + dy1 * dy2 + dy2 * dy2) / 3;
        }, 0); // mm³ per unit throat

        const sigma_M = (M * 1e6) / (throatSize > 0 ? Iw * throatSize / maxY : 1);

        // Resultant stress
        const sigma_total = sigma_direct + sigma_M;
        const tau_total = Math.sqrt(tau_shear_x**2 + tau_shear_y**2);

        // EC3 check: √(σ² + 3τ²) ≤ fw
        const stress_check = Math.sqrt(sigma_total**2 + 3 * tau_total**2);
        const capacity = fu / (Math.sqrt(3) * GAMMA_W);
        const pass = stress_check <= capacity;
        const utilisation = stress_check / capacity;

        return {
            totalLength: +totalLength.toFixed(1),
            A_w: +A_w.toFixed(0),
            sigma_direct: +sigma_direct.toFixed(2),
            sigma_M: +sigma_M.toFixed(2),
            tau_total: +tau_total.toFixed(2),
            stress_check: +stress_check.toFixed(2),
            capacity: +capacity.toFixed(2),
            utilisation: +utilisation.toFixed(3),
            utilisationPct: +(utilisation * 100).toFixed(1),
            pass,
        };
    }

    function solve(config) {
        if (config.mode === 'weld') return solveWeldGroup(config);
        return solveBoltGroup(config);
    }

    return { solve, solveBoltGroup, solveWeldGroup };
})();
window.ConnectionSolver = ConnectionSolver;
