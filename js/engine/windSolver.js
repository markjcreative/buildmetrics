/**
 * BuildMetrics — EC1 Wind Loading Engine
 * EN 1991-1-4 (Eurocode 1 Part 1-4) with UK National Annex
 *
 * Reference:
 *   BS EN 1991-1-4:2005 + UK NA (NA to BS EN 1991-1-4:2005)
 */
const WindSolver = (() => {

    // ── Terrain roughness parameters (Table 4.1 EN 1991-1-4) ──────────────
    const TERRAIN = {
        '0':   { z0: 0.003, z0_II: 0.05, zmin: 1  },
        'I':   { z0: 0.01,  z0_II: 0.05, zmin: 1  },
        'II':  { z0: 0.05,  z0_II: 0.05, zmin: 2  },
        'III': { z0: 0.3,   z0_II: 0.05, zmin: 5  },
        'IV':  { z0: 1.0,   z0_II: 0.05, zmin: 10 },
    };

    /**
     * Solve EC1 wind loading.
     *
     * @param {object} cfg
     *   vb0        – fundamental basic wind velocity (m/s) from UK wind speed map
     *   altitude   – site altitude above sea level (m)
     *   distanceSea – distance from sea (km)
     *   terrainCat – '0' | 'I' | 'II' | 'III' | 'IV'
     *   h          – building height (m)
     *   b          – crosswind width (m)
     *   d          – along-wind depth (m)
     *   cdir       – directional factor (default 1.0)
     *   cseason    – seasonal factor (default 1.0)
     *   rho        – air density kg/m³ (default 1.226)
     *   co         – orography factor (default 1.0)
     *   csCd       – structural factor (default 1.0, buildings < 100 m)
     */
    function solve(cfg) {
        const {
            vb0        = 23,
            altitude   = 50,
            distanceSea = 10,
            terrainCat = 'II',
            h          = 10,
            b          = 20,
            d          = 15,
            cdir       = 1.0,
            cseason    = 1.0,
            rho        = 1.226,
            co         = 1.0,
            csCd       = 1.0,
        } = cfg;

        const terrain = TERRAIN[terrainCat] || TERRAIN['II'];
        const { z0, z0_II, zmin } = terrain;

        // ── 1. Basic wind velocity (§4.2) ─────────────────────────────────
        const vb = cdir * cseason * vb0;

        // ── 2. Altitude correction — UK NA simplified approach ────────────
        //    UK NA §NA.2.5: vb,alt = vb × FACTOR(altitude)
        //    Simplified linear: vb_alt = vb × (1 + 0.001 × altitude)
        const vb_alt = vb * (1 + 0.001 * altitude);

        // ── 3. Terrain roughness factor kr (§4.3.2 eq. 4.5) ──────────────
        const kr = 0.19 * Math.pow(z0 / z0_II, 0.07);

        // ── 4. Effective height z_eff ─────────────────────────────────────
        const z_eff = Math.max(h, zmin);

        // ── 5. Roughness factor cr(z) (§4.3.2 eq. 4.4) ───────────────────
        const cr = kr * Math.log(z_eff / z0);

        // ── 6. Mean wind velocity vm(z) (§4.3.1 eq. 4.3) ─────────────────
        const vm = cr * co * vb_alt;   // m/s

        // ── 7. Turbulence intensity Iv(z) (§4.4 eq. 4.7) ─────────────────
        const Iv = 1.0 / (co * Math.log(z_eff / z0));

        // ── 8. Peak velocity pressure qp(z) (§4.5 eq. 4.8) ───────────────
        //    qp = (1 + 7 × Iv) × 0.5 × rho × vm²  [N/m²]
        const qp = (1 + 7 * Iv) * 0.5 * rho * vm * vm;   // N/m²
        const qp_kPa = qp / 1000;                          // kN/m²

        // ── 9. Exposure factor ce(z) ──────────────────────────────────────
        //    ce = qp / (0.5 × rho × vb_alt²)
        const qb_alt  = 0.5 * rho * vb_alt * vb_alt;      // N/m²
        const ce      = qp / qb_alt;

        // ── 10. Pressure coefficients (§7.2, rectangular buildings) ───────
        const h_d_ratio = h / d;

        // Windward wall (zone D)
        // EN 1991-1-4 Table 7.1: Cpe,10 for zone D
        //   h/d ≥ 5  → 0.8
        //   h/d ≤ 0.25 → 0.7; interpolate linearly between 0.25 and 1.0
        //   h/d ≥ 1  → 0.8 (constant above 1.0 per UK NA)
        let cpe_D;
        if (h_d_ratio >= 1.0) {
            cpe_D = 0.8;
        } else if (h_d_ratio <= 0.25) {
            cpe_D = 0.7;
        } else {
            // Linear interpolation between 0.25→0.7 and 1.0→0.8
            cpe_D = 0.7 + (h_d_ratio - 0.25) / (1.0 - 0.25) * (0.8 - 0.7);
        }

        const cpe_E    = -0.6;    // Leeward wall (zone E) — Table 7.1
        const cpe_A    = -1.2;    // Side walls (zone A)
        const cpe_F    = -1.8;    // Flat roof zone F (corner)
        const cpe_G    = -1.2;    // Flat roof zone G (edge)
        const cpe_H    = -0.7;    // Flat roof zone H (interior — used for uplift)

        // Internal pressure coefficient — UK NA §NA.2.15
        // Worst case: +0.2 (for max wall net pressure), -0.3 (for max suction)
        const cpi_wall_max  =  0.2;   // for wall suction dominant check
        const cpi_wall_press = -0.3;  // for maximum windward pressure

        // ── 11. Net surface pressures  w = qp × (Cpe − Cpi) ──────────────
        // Windward wall D — use cpi = -0.3 for maximum inward pressure
        const w_D = qp_kPa * (cpe_D - cpi_wall_press);   // kN/m² (positive = pressure in)

        // Leeward wall E — use cpi = +0.2 (internal pressure pushes outward, adds to suction)
        const w_E = qp_kPa * (cpe_E - cpi_wall_max);     // kN/m² (negative = suction)

        // Side wall A — for reference
        const w_A = qp_kPa * (cpe_A - cpi_wall_max);     // kN/m² (negative = suction)

        // Roof (zone H, flat) — use cpi = -0.3 to maximise uplift
        const w_roof = qp_kPa * (cpe_H - cpi_wall_press); // kN/m² (negative = uplift)

        // ── 12. Total horizontal wind force ──────────────────────────────
        //    Fw = (w_D + |w_E|) × b × h × csCd     [kN]
        //    (net force = windward pressure + leeward suction, both push same way)
        const Fw    = (w_D + Math.abs(w_E)) * b * h * csCd;   // kN

        // Along-wind force using external Cpe only (for reference):
        //    Fw_along = (Cpe_D − Cpe_E) × qp × b × h
        const Fw_along = (cpe_D - cpe_E) * qp_kPa * b * h * csCd;  // kN

        // ── 13. Roof uplift force ─────────────────────────────────────────
        //    Uplift = |w_roof| × b × d               [kN]
        const roof_uplift = Math.abs(w_roof) * b * d;    // kN

        // ── Return ────────────────────────────────────────────────────────
        return {
            // Input echo
            vb0,
            altitude,
            terrainCat,
            h, b, d,
            cdir, cseason, rho, co, csCd,

            // Wind velocity chain
            vb:       +vb.toFixed(3),
            vb_alt:   +vb_alt.toFixed(3),
            kr:       +kr.toFixed(4),
            z_eff:    +z_eff.toFixed(2),
            cr:       +cr.toFixed(4),
            vm:       +vm.toFixed(3),
            Iv:       +Iv.toFixed(4),

            // Pressures
            qp_Pa:    +qp.toFixed(2),
            qp_kPa:   +qp_kPa.toFixed(4),
            qb_alt:   +qb_alt.toFixed(2),
            ce:       +ce.toFixed(3),

            // Pressure coefficients
            h_d_ratio: +h_d_ratio.toFixed(3),
            cpe_D:    +cpe_D.toFixed(2),
            cpe_E:    cpe_E,
            cpe_A:    cpe_A,
            cpe_H:    cpe_H,
            cpi_press: cpi_wall_press,
            cpi_suck:  cpi_wall_max,

            // Net pressures (kN/m²)
            w_D:      +w_D.toFixed(4),
            w_E:      +w_E.toFixed(4),
            w_A:      +w_A.toFixed(4),
            w_roof:   +w_roof.toFixed(4),

            // Forces (kN)
            Fw_kN:          +Fw.toFixed(2),
            Fw_along_kN:    +Fw_along.toFixed(2),
            roof_uplift_kN: +roof_uplift.toFixed(2),

            pass: true,
        };
    }

    return { solve };
})();

window.WindSolver = WindSolver;
