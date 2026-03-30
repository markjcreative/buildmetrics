/**
 * BuildMetrics — Wind Load Calculator (EC1 approach)
 * IIFE module exposing window.WindLoad
 */
const WindLoad = (() => {

    // EC1 Table 4.1 terrain categories
    const TERRAIN = {
        '0':   { z0: 0.003, zmin: 1 },
        'I':   { z0: 0.01,  zmin: 2 },
        'II':  { z0: 0.05,  zmin: 4 },
        'III': { z0: 0.3,   zmin: 8 },
        'IV':  { z0: 1.0,   zmin: 16 }
    };

    /**
     * Calculate wind loads using EC1 approach.
     * @param {object} config
     * @param {number}  config.vb              - Basic wind speed (m/s)
     * @param {string}  config.terrainCategory - '0'|'I'|'II'|'III'|'IV'
     * @param {number}  config.z               - Reference height (m)
     * @param {number}  [config.ce_override]   - Override exposure factor if provided
     * @param {string}  [config.structureType] - 'wall'|'roof_flat'|'roof_pitch'
     * @param {number}  [config.cp_e=0.8]      - External pressure coefficient
     * @param {number}  [config.cp_i=-0.3]     - Internal pressure coefficient
     * @param {number}  [config.rho=1.25]      - Air density (kg/m³)
     * @returns {{ qb_Pa, cr, Iv, ce, we_Pa, we_kPa, wp_Pa, wp_kPa }}
     */
    function calculate(config) {
        const {
            vb,
            terrainCategory = 'II',
            z,
            ce_override,
            cp_e = 0.8,
            cp_i = -0.3,
            rho  = 1.25
        } = config;

        const terrain = TERRAIN[terrainCategory];
        if (!terrain) throw new Error(`Unknown terrain category: ${terrainCategory}`);

        const { z0, zmin } = terrain;
        const z_eff = Math.max(z, zmin);

        // EC1: kr = 0.19 × (z0 / 0.05)^0.07
        const kr = 0.19 * Math.pow(z0 / 0.05, 0.07);

        // Roughness factor: cr = kr × ln(z_eff / z0)
        const cr = kr * Math.log(z_eff / z0);

        // Turbulence intensity: Iv = 1 / (c0 × ln(z_eff / z0))  [c0 = 1.0]
        const Iv = 1 / Math.log(z_eff / z0);

        // Basic wind pressure: qb = 0.5 × ρ × vb²
        const qb_Pa = 0.5 * rho * vb * vb;

        // Exposure factor: ce = cr² × (1 + 7·Iv)
        const ce = ce_override !== undefined ? ce_override : cr * cr * (1 + 7 * Iv);

        // Net wind pressure (external + internal): we = qb × ce × (cp_e + cp_i)
        const we_Pa = qb_Pa * ce * (cp_e + cp_i);

        // External wind pressure only: wp = qb × ce × cp_e
        const wp_Pa = qb_Pa * ce * cp_e;

        return {
            qb_Pa:  +qb_Pa.toFixed(3),
            cr:     +cr.toFixed(4),
            Iv:     +Iv.toFixed(4),
            ce:     +ce.toFixed(4),
            we_Pa:  +we_Pa.toFixed(3),
            we_kPa: +(we_Pa / 1000).toFixed(4),
            wp_Pa:  +wp_Pa.toFixed(3),
            wp_kPa: +(wp_Pa / 1000).toFixed(4)
        };
    }

    return { calculate };
})();

window.WindLoad = WindLoad;
