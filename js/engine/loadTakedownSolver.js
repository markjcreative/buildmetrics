/**
 * BuildMetrics — Load Takedown Solver
 * Accumulates floor loads (dead + imposed) down to foundation
 * and computes ULS / SLS totals.
 */
window.LoadTakedownSolver = (() => {

    /**
     * solve(config)
     *
     * config: {
     *   floors: [
     *     {
     *       label:       string  — floor name, e.g. "Roof"
     *       gk_slab:     number  — slab dead load (kN/m²)
     *       qk_slab:     number  — slab imposed load (kN/m²)
     *       area:        number  — tributary area (m²)
     *       gk_wall:     number  — wall / beam self-weight Gk (kN)
     *       qk_wall:     number  — additional Qk (kN)
     *       self_weight: number  — structural self-weight Gk (kN)  [optional, 0 if omitted]
     *     }, ...
     *   ],
     *   safetyGk: number  — ULS dead load factor (default 1.35)
     *   safetyQk: number  — ULS imposed load factor (default 1.50)
     * }
     *
     * Returns: {
     *   floors:    array of per-floor objects (with cumulative totals)
     *   totalGk:   number (kN)
     *   totalQk:   number (kN)
     *   totalULS:  number (kN)
     *   totalSLS:  number (kN)  = totalGk + totalQk
     * }
     */
    function solve(config) {
        const floors    = config.floors   || [];
        const safetyGk  = config.safetyGk || 1.35;
        const safetyQk  = config.safetyQk || 1.50;

        let cumGk  = 0;
        let cumQk  = 0;
        let cumULS = 0;

        const floorResults = floors.map((f, idx) => {
            const self = f.self_weight || 0;

            // Per-floor characteristic loads
            const Gk_floor = (f.gk_slab * f.area) + (f.gk_wall || 0) + self;
            const Qk_floor = (f.qk_slab * f.area) + (f.qk_wall || 0);

            // ULS for this floor
            const ULS_floor = safetyGk * Gk_floor + safetyQk * Qk_floor;

            // Accumulate
            cumGk  += Gk_floor;
            cumQk  += Qk_floor;
            cumULS += ULS_floor;

            return {
                index:      idx,
                label:      f.label || ('Floor ' + (idx + 1)),
                Gk_floor:   +Gk_floor.toFixed(2),
                Qk_floor:   +Qk_floor.toFixed(2),
                ULS_floor:  +ULS_floor.toFixed(2),
                cumGk:      +cumGk.toFixed(2),
                cumQk:      +cumQk.toFixed(2),
                cumULS:     +cumULS.toFixed(2),
                // breakdown for tooltip / detail
                gk_slab_contrib: +(f.gk_slab * f.area).toFixed(2),
                qk_slab_contrib: +(f.qk_slab * f.area).toFixed(2),
            };
        });

        const totalGk  = cumGk;
        const totalQk  = cumQk;
        const totalULS = cumULS;
        const totalSLS = totalGk + totalQk;

        return {
            floors:   floorResults,
            totalGk:  +totalGk.toFixed(2),
            totalQk:  +totalQk.toFixed(2),
            totalULS: +totalULS.toFixed(2),
            totalSLS: +totalSLS.toFixed(2),
        };
    }

    return { solve };

})();
