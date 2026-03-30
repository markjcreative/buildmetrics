/**
 * BuildMetrics — Weight Calculators
 * IIFE module exposing window.WeightCalcs
 */
const WeightCalcs = (() => {

    /**
     * Steel weight from cross-sectional area and length.
     * @param {number} A_cm2 - Cross-sectional area in cm²
     * @param {number} length_m - Length in metres
     * @param {number} [density_kg_m3=7850] - Density in kg/m³
     * @returns {{ mass_kg: number, mass_t: number }}
     */
    function steelWeight(A_cm2, length_m, density_kg_m3 = 7850) {
        // A in cm² → convert to m²: divide by 10000
        const A_m2 = A_cm2 / 10000;
        const mass_kg = A_m2 * length_m * density_kg_m3;
        return { mass_kg, mass_t: mass_kg / 1000 };
    }

    /**
     * Steel section weight by designation lookup.
     * Requires window.SteelSections to be loaded.
     * @param {string} sectionDesignation - e.g. "254x146x37"
     * @param {number} length_m
     * @returns {{ mass_kg: number, mass_t: number, section: object }}
     */
    function steelSectionWeight(sectionDesignation, length_m) {
        if (typeof window.SteelSections === 'undefined') {
            throw new Error('SteelSections data not loaded');
        }
        let found = null;
        let foundType = null;
        const types = Object.keys(window.SteelSections);
        for (const type of types) {
            const arr = window.SteelSections[type];
            if (!Array.isArray(arr)) continue;
            const sec = arr.find(s => s.designation === sectionDesignation);
            if (sec) { found = sec; foundType = type; break; }
        }
        if (!found) throw new Error(`Section '${sectionDesignation}' not found in SteelSections`);
        // area A is in cm²
        const result = steelWeight(found.A, length_m);
        return { ...result, section: found, sectionType: foundType };
    }

    /**
     * Concrete volume and mass.
     * @param {number} length_m
     * @param {number} width_m
     * @param {number} depth_m
     * @returns {{ volume_m3: number, mass_kg: number, mass_t: number }}
     */
    function concreteVolume(length_m, width_m, depth_m) {
        const density = 2400; // kg/m³
        const volume_m3 = length_m * width_m * depth_m;
        const mass_kg = volume_m3 * density;
        return { volume_m3, mass_kg, mass_t: mass_kg / 1000 };
    }

    /**
     * Rebar weight.
     * mass = count × (π × d² / 4 × length × 7850 / 1e6)  [d in mm, length in m, result in kg]
     * @param {number} dia_mm - Bar diameter in mm
     * @param {number} length_m - Bar length in metres
     * @param {number} count - Number of bars
     * @returns {{ mass_kg: number, mass_t: number }}
     */
    function rebarWeight(dia_mm, length_m, count) {
        // Area in mm², length in m: volume in mm²·m = mm²·1000mm = mm³ / 1000 → need kg
        // mass = count × (π × d²/4) [mm²] × length [m] × 1000 [mm/m] × 7850 [kg/m³] / 1e9 [mm³/m³]
        // Simplify: mass = count × (π × d²/4) × length × 7850 / 1e6
        const mass_kg = count * (Math.PI * dia_mm * dia_mm / 4) * length_m * 7850 / 1e6;
        return { mass_kg, mass_t: mass_kg / 1000 };
    }

    /**
     * Steel plate weight.
     * @param {number} length_m
     * @param {number} width_m
     * @param {number} thickness_mm
     * @returns {{ mass_kg: number, mass_t: number }}
     */
    function steelPlateWeight(length_m, width_m, thickness_mm) {
        const thickness_m = thickness_mm / 1000;
        const volume_m3 = length_m * width_m * thickness_m;
        const mass_kg = volume_m3 * 7850;
        return { mass_kg, mass_t: mass_kg / 1000 };
    }

    return { steelWeight, steelSectionWeight, concreteVolume, rebarWeight, steelPlateWeight };
})();

window.WeightCalcs = WeightCalcs;
