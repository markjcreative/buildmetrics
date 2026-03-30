/**
 * BuildMetrics — Unit Converter
 * IIFE module exposing window.UnitConverter
 * All conversions stored as multipliers to SI base unit
 */
const UnitConverter = (() => {

    // Each entry: factor to convert FROM that unit TO the SI base unit
    const CATEGORIES = {
        'Length': {
            base: 'm',
            units: {
                'mm':  0.001,
                'cm':  0.01,
                'm':   1,
                'km':  1000,
                'in':  0.0254,
                'ft':  0.3048,
                'yd':  0.9144,
                'mi':  1609.344
            }
        },
        'Force': {
            base: 'N',
            units: {
                'N':   1,
                'kN':  1000,
                'MN':  1e6,
                'kgf': 9.80665,
                'tf':  9806.65,
                'lbf': 4.44822,
                'kip': 4448.22
            }
        },
        'Moment': {
            base: 'N·m',
            units: {
                'N·m':     1,
                'kN·m':    1000,
                'MN·m':    1e6,
                'kgf·m':   9.80665,
                'tf·m':    9806.65,
                'lbf·ft':  1.35582,
                'kip·ft':  1355.82,
                'kip·in':  112.985
            }
        },
        'Pressure/Stress': {
            base: 'Pa',
            units: {
                'Pa':       1,
                'kPa':      1000,
                'MPa':      1e6,
                'GPa':      1e9,
                'kgf/cm²':  98066.5,
                'tf/m²':    9806.65,
                'psi':      6894.76,
                'ksi':      6894760
            }
        },
        'Mass': {
            base: 'kg',
            units: {
                'kg':         1,
                't':          1000,
                'g':          0.001,
                'lb':         0.453592,
                'kip (mass)': 453.592,
                'short ton':  907.185,
                'long ton':   1016.05
            }
        },
        'Area': {
            base: 'm²',
            units: {
                'mm²': 1e-6,
                'cm²': 1e-4,
                'm²':  1,
                'in²': 6.4516e-4,
                'ft²': 0.092903
            }
        },
        'Volume': {
            base: 'm³',
            units: {
                'mm³': 1e-9,
                'cm³': 1e-6,
                'm³':  1,
                'L':   0.001,
                'in³': 1.63871e-5,
                'ft³': 0.0283168
            }
        },
        'Section Modulus': {
            base: 'm³',
            units: {
                'mm³': 1e-9,
                'cm³': 1e-6,
                'm³':  1,
                'in³': 1.63871e-5
            }
        },
        'Second Moment': {
            base: 'm⁴',
            units: {
                'mm⁴': 1e-12,
                'cm⁴': 1e-8,
                'm⁴':  1,
                'in⁴': 4.16231e-7
            }
        }
    };

    /**
     * Convert a value from one unit to another within a category.
     * @param {number} value
     * @param {string} fromUnit
     * @param {string} toUnit
     * @param {string} category
     * @returns {{ result: number, fromUnit: string, toUnit: string, category: string }}
     */
    function convert(value, fromUnit, toUnit, category) {
        const cat = CATEGORIES[category];
        if (!cat) throw new Error(`Unknown category: ${category}`);
        const from = cat.units[fromUnit];
        const to = cat.units[toUnit];
        if (from === undefined) throw new Error(`Unknown unit '${fromUnit}' in category '${category}'`);
        if (to === undefined) throw new Error(`Unknown unit '${toUnit}' in category '${category}'`);
        const result = (value * from) / to;
        return { result, fromUnit, toUnit, category };
    }

    /**
     * Returns all category names and their unit lists.
     * @returns {{ name: string, units: string[] }[]}
     */
    function getCategories() {
        return Object.entries(CATEGORIES).map(([name, data]) => ({
            name,
            units: Object.keys(data.units)
        }));
    }

    return { convert, getCategories };
})();

window.UnitConverter = UnitConverter;
