/**
 * solver.js — Core statics engine
 * Computes reaction forces, shear force distribution, and bending moment distribution.
 *
 * Supports:
 *   - Support types: 'pin', 'roller', 'fixed'
 *   - Load types: 'point', 'udl', 'partial_udl', 'triangular', 'trapezoidal', 'moment'
 *
 * Single-span beam analysis using equilibrium equations.
 * For fixed-fixed or propped-cantilever: uses force method (compatibility equations).
 */

const N_POINTS = 500; // resolution of the beam discretisation

/**
 * Main solver entry point.
 *
 * @param {Object} config - Beam configuration
 * @param {number} config.span - Total beam span (m)
 * @param {Array}  config.supports - Array of { type: 'pin'|'roller'|'fixed', position: number }
 * @param {Array}  config.loads - Array of load objects (see load types above)
 * @param {number} config.E - Young's modulus (kN/m²)
 * @param {number} config.I - Second moment of area (m⁴)
 * @returns {Object} results including reactions, arrays for SFD, BMD, deflection
 */
function solveBeam(config) {
    const { span, supports, loads, E, I } = config;

    if (!span || span <= 0) throw new Error('Beam span must be positive.');
    if (!supports || supports.length < 2) throw new Error('At least 2 supports are required.');

    const xs = BeamUtils.linspace(0, span, N_POINTS);
    const dx = span / (N_POINTS - 1);

    // Classify the structure
    const sortedSupports = [...supports].sort((a, b) => a.position - b.position);
    const structure = classifyStructure(sortedSupports);

    let reactions;
    if (structure.type === 'simply_supported') {
        reactions = solveSimplySupported(sortedSupports, loads, span);
    } else if (structure.type === 'cantilever') {
        reactions = solveCantilever(sortedSupports, loads, span);
    } else if (structure.type === 'propped_cantilever') {
        reactions = solveProppedCantilever(sortedSupports, loads, span, E, I);
    } else if (structure.type === 'fixed_fixed') {
        reactions = solveFixedFixed(sortedSupports, loads, span, E, I);
    } else {
        // Fallback: treat as simply supported
        reactions = solveSimplySupported(sortedSupports, loads, span);
    }

    // Build distributed load array q(x) (positive = downward)
    const q = buildLoadArray(xs, loads);

    // Build shear force array V(x) — integrate from left, applying reactions
    const V = buildShearArray(xs, q, dx, reactions, sortedSupports);

    // Build bending moment array M(x) — integrate V(x)
    const M = buildMomentArray(xs, V, dx, reactions, sortedSupports, loads);

    // Compute deflection y(x) via double integration of M/EI
    const EI = E * I;
    const deflection = computeDeflection(xs, M, dx, EI, sortedSupports);

    // Compute key results
    const maxMomentPos = M.indexOf(BeamUtils.arrayMax(M));
    const minMomentPos = M.indexOf(BeamUtils.arrayMin(M));
    const maxShearPos = V.indexOf(BeamUtils.arrayMax(V.map(Math.abs)));

    const results = {
        xs,
        V,
        M,
        deflection,
        reactions,
        structure,
        summary: {
            maxPositiveMoment: BeamUtils.arrayMax(M),
            maxPositiveMomentPos: xs[maxMomentPos],
            maxNegativeMoment: BeamUtils.arrayMin(M),
            maxNegativeMomentPos: xs[minMomentPos],
            maxAbsMoment: BeamUtils.arrayAbsMax(M),
            maxShear: BeamUtils.arrayMax(V),
            minShear: BeamUtils.arrayMin(V),
            maxAbsShear: BeamUtils.arrayAbsMax(V),
            maxShearPos: xs[maxShearPos],
            maxDeflection: BeamUtils.arrayMin(deflection),  // most negative = max sag
            maxDeflectionPos: xs[deflection.indexOf(BeamUtils.arrayMin(deflection))],
            minDeflection: BeamUtils.arrayMax(deflection),  // max hogging
        }
    };

    return results;
}

function classifyStructure(supports) {
    const types = supports.map(s => s.type);
    if (types.includes('fixed') && types.includes('fixed')) {
        if (types.filter(t => t === 'fixed').length === 2) return { type: 'fixed_fixed' };
    }
    if (types.includes('fixed') && (types.includes('pin') || types.includes('roller'))) {
        return { type: 'propped_cantilever' };
    }
    if (types.includes('fixed') && types.length === 1) {
        return { type: 'cantilever' };
    }
    return { type: 'simply_supported' };
}

// ─── Reaction Solvers ────────────────────────────────────────────────────────

function totalVerticalLoad(loads) {
    return loads.reduce((sum, load) => {
        if (load.type === 'point') return sum + load.magnitude;
        if (load.type === 'udl' || load.type === 'partial_udl') {
            return sum + load.magnitude * (load.end - load.start);
        }
        if (load.type === 'triangular') {
            return sum + 0.5 * load.magnitude * (load.end - load.start);
        }
        if (load.type === 'trapezoidal') {
            return sum + 0.5 * (load.magnitudeStart + load.magnitudeEnd) * (load.end - load.start);
        }
        return sum;
    }, 0);
}

function momentAboutPoint(loads, point) {
    let M = 0;
    loads.forEach(load => {
        if (load.type === 'point') {
            M += load.magnitude * (load.position - point);
        } else if (load.type === 'udl' || load.type === 'partial_udl') {
            const resultant = load.magnitude * (load.end - load.start);
            const centroid = (load.start + load.end) / 2;
            M += resultant * (centroid - point);
        } else if (load.type === 'triangular') {
            // Resultant at 2/3 from zero end
            const L = load.end - load.start;
            const resultant = 0.5 * load.magnitude * L;
            const centroid = load.start + (2 / 3) * L;
            M += resultant * (centroid - point);
        } else if (load.type === 'trapezoidal') {
            const L = load.end - load.start;
            // Split into rectangle + triangle
            const rectResultant = load.magnitudeStart * L;
            const rectCentroid = load.start + L / 2;
            const triResultant = 0.5 * (load.magnitudeEnd - load.magnitudeStart) * L;
            const triCentroid = load.start + (2 / 3) * L;
            M += rectResultant * (rectCentroid - point) + triResultant * (triCentroid - point);
        } else if (load.type === 'moment') {
            M += load.magnitude; // Applied moment (positive = clockwise)
        }
    });
    return M;
}

function solveSimplySupported(supports, loads, span) {
    const A = supports[0];
    const B = supports[supports.length - 1];
    const L = B.position - A.position;

    const totalLoad = totalVerticalLoad(loads);
    const momentAboutA = momentAboutPoint(loads, A.position);

    const RB = momentAboutA / L;
    const RA = totalLoad - RB;

    const reactions = [];
    supports.forEach(s => {
        if (s === A) reactions.push({ ...s, Fy: RA, Fx: 0, M: 0 });
        else if (s === B) reactions.push({ ...s, Fy: RB, Fx: 0, M: 0 });
        else reactions.push({ ...s, Fy: 0, Fx: 0, M: 0 });
    });
    return reactions;
}

function solveCantilever(supports, loads, span) {
    const fixed = supports.find(s => s.type === 'fixed');
    const totalLoad = totalVerticalLoad(loads);
    const momentAboutFixed = momentAboutPoint(loads, fixed.position);

    const reactions = supports.map(s => {
        if (s === fixed) return { ...s, Fy: totalLoad, Fx: 0, M: -momentAboutFixed };
        return { ...s, Fy: 0, Fx: 0, M: 0 };
    });
    return reactions;
}

function solveProppedCantilever(supports, loads, span, E, I) {
    // Force method: treat roller/pin as redundant reaction RB
    // compatibility: deflection at B due to loads + deflection due to RB = 0
    const fixedS = supports.find(s => s.type === 'fixed');
    const rollerS = supports.find(s => s.type !== 'fixed');

    const EI = E * I;
    const a = rollerS.position - fixedS.position; // distance fixed->roller

    // Deflection at roller position due to applied loads (cantilever from fixed end)
    const deltaQ = deflectionAtPointCantilever(a, loads, fixedS.position, EI);

    // Deflection at roller due to unit upward point load at roller (cantilever)
    const deltaUnit = (a * a * a) / (3 * EI);

    const RB = deltaQ / deltaUnit; // upward reaction at roller

    // Now solve fixed end reactions
    const loadsWithRoller = [...loads, { type: 'point', magnitude: -RB, position: rollerS.position }];
    const totalLoad = totalVerticalLoad(loadsWithRoller);
    const momentFixed = momentAboutPoint(loadsWithRoller, fixedS.position);

    const reactions = supports.map(s => {
        if (s === fixedS) return { ...s, Fy: totalLoad, Fx: 0, M: -momentFixed };
        if (s === rollerS) return { ...s, Fy: RB, Fx: 0, M: 0 };
        return { ...s, Fy: 0, Fx: 0, M: 0 };
    });
    return reactions;
}

function deflectionAtPointCantilever(x, loads, fixedPos, EI) {
    // Deflection at position x from fixed end due to each load
    let delta = 0;
    loads.forEach(load => {
        if (load.type === 'point') {
            const a = load.position - fixedPos;
            if (x <= a) {
                delta += (load.magnitude * x * x) / (6 * EI) * (3 * a - x);
            } else {
                delta += (load.magnitude * a * a) / (6 * EI) * (3 * x - a);
            }
        } else if (load.type === 'udl' || load.type === 'partial_udl') {
            const w = load.magnitude;
            const a = Math.max(0, load.start - fixedPos);
            const b = Math.min(x, load.end - fixedPos);
            if (b > a) {
                // Approximation via discrete integration
                const n = 50;
                const ds = (b - a) / n;
                for (let i = 0; i < n; i++) {
                    const xi = a + (i + 0.5) * ds;
                    const dP = w * ds;
                    if (x <= xi) {
                        delta += (dP * x * x) / (6 * EI) * (3 * xi - x);
                    } else {
                        delta += (dP * xi * xi) / (6 * EI) * (3 * x - xi);
                    }
                }
            }
        }
    });
    return delta;
}

function solveFixedFixed(supports, loads, span, E, I) {
    // Use slope-deflection method (simplified for uniform I)
    const A = supports.find(s => s.position === Math.min(...supports.map(s => s.position)));
    const B = supports.find(s => s.position === Math.max(...supports.map(s => s.position)));
    const L = B.position - A.position;
    const EI = E * I;

    // Fixed-end moments using standard formulas
    let MAB = 0, MBA = 0;
    loads.forEach(load => {
        if (load.type === 'point') {
            const a = load.position - A.position;
            const b = L - a;
            const P = load.magnitude;
            MAB += (P * a * b * b) / (L * L);
            MBA -= (P * a * a * b) / (L * L);
        } else if (load.type === 'udl' || load.type === 'partial_udl') {
            // Full span UDL approximation
            const w = load.magnitude;
            const la = Math.max(0, load.start - A.position);
            const lb = Math.min(L, load.end - A.position);
            if (lb > la) {
                const wL = lb - la;
                const centroid = (la + lb) / 2;
                const a = centroid;
                const b = L - a;
                const P = w * wL;
                MAB += (P * a * b * b) / (L * L);
                MBA -= (P * a * a * b) / (L * L);
            }
        } else if (load.type === 'triangular') {
            const wMax = load.magnitude;
            const Lload = load.end - load.start;
            // Treat as equivalent point load at 2/3 from zero
            const P = 0.5 * wMax * Lload;
            const a = (load.start - A.position) + (2 / 3) * Lload;
            const b = L - a;
            MAB += (P * a * b * b) / (L * L);
            MBA -= (P * a * a * b) / (L * L);
        }
    });

    // Solve reactions from equilibrium
    const totalLoad = totalVerticalLoad(loads);
    const momentLoads = momentAboutPoint(loads, A.position);

    const RB = (momentLoads - MAB + MBA) / L;
    const RA = totalLoad - RB;

    const reactions = supports.map(s => {
        if (s === A) return { ...s, Fy: RA, Fx: 0, M: MAB };
        if (s === B) return { ...s, Fy: RB, Fx: 0, M: MBA };
        return { ...s, Fy: 0, Fx: 0, M: 0 };
    });
    return reactions;
}

// ─── SFD / BMD Construction ──────────────────────────────────────────────────

function buildLoadArray(xs, loads) {
    return xs.map(x => {
        let q = 0;
        loads.forEach(load => {
            if (load.type === 'point') return; // handled separately
            if ((load.type === 'udl' || load.type === 'partial_udl') && x >= load.start && x <= load.end) {
                q += load.magnitude;
            }
            if (load.type === 'triangular' && x >= load.start && x <= load.end) {
                const t = (x - load.start) / (load.end - load.start);
                q += load.magnitude * t;
            }
            if (load.type === 'trapezoidal' && x >= load.start && x <= load.end) {
                const t = (x - load.start) / (load.end - load.start);
                q += load.magnitudeStart + t * (load.magnitudeEnd - load.magnitudeStart);
            }
        });
        return q;
    });
}

function buildShearArray(xs, q, dx, reactions, supports) {
    const V = new Array(xs.length).fill(0);
    // Start from left: V(x) = ΣR_left - integral of q from 0 to x
    let shear = 0;

    // Include reactions at left boundary
    const leftReactions = reactions.filter(r => Math.abs(r.position - xs[0]) < 1e-9);
    leftReactions.forEach(r => { shear -= r.Fy; }); // upward reactions reduce downward shear

    V[0] = shear;

    for (let i = 1; i < xs.length; i++) {
        const x = xs[i];
        // Add reactions at this point
        reactions.forEach(r => {
            if (x > xs[i - 1] && x <= r.position + 1e-9 && x >= r.position - 1e-9) {
                shear -= r.Fy;
            }
        });
        // Add point loads from left
        // (loads are accounted for in the integration)
        shear += q[i - 1] * dx;
        V[i] = shear;
    }

    // Better approach: build from scratch left to right
    return buildShearFromScratch(xs, q, dx, reactions, supports);
}

function buildShearFromScratch(xs, q, dx, reactions, supports) {
    const V = new Array(xs.length).fill(0);
    // Build shear by integrating load and apply point reactions/loads
    // V(x) starts at 0 from far left, increases with loads

    // Collect all events (reactions and point loads) sorted by position
    const events = [];
    reactions.forEach(r => {
        if (Math.abs(r.Fy) > 1e-10) events.push({ x: r.position, dV: r.Fy }); // upward = positive
    });

    // Get point loads from config (stored in q doesn't include them)
    // They're handled via the config.loads; reconstruct
    // (We'll get them from the closure workaround— pass them as a global or parameter)
    const pointLoads = window._beamSolverPointLoads || [];
    pointLoads.forEach(pl => {
        events.push({ x: pl.position, dV: -pl.magnitude }); // downward load = negative
    });

    events.sort((a, b) => a.x - b.x);

    let currentV = 0;
    let eventIdx = 0;

    for (let i = 0; i < xs.length; i++) {
        const x = xs[i];

        // Apply events at this x
        while (eventIdx < events.length && events[eventIdx].x <= x + 1e-9) {
            currentV += events[eventIdx].dV;
            eventIdx++;
        }

        // Integrate distributed load from previous point
        if (i > 0) {
            currentV -= q[i - 1] * dx; // distributed loads act downward
        }

        V[i] = currentV;
    }

    return V;
}

function buildMomentArray(xs, V, dx, reactions, supports, loads) {
    const M = new Array(xs.length).fill(0);

    // Check for fixed support at left
    const leftFixed = reactions.find(r => r.type === 'fixed' && Math.abs(r.position - xs[0]) < 1e-9);
    let currentM = leftFixed ? leftFixed.M : 0;

    M[0] = currentM;

    for (let i = 1; i < xs.length; i++) {
        const x = xs[i];
        // Apply moment loads at this point
        if (loads) {
            loads.forEach(load => {
                if (load.type === 'moment' && x > xs[i - 1] && x <= load.position + 1e-9 && x >= load.position - 1e-9) {
                    currentM += load.magnitude;
                }
            });
        }
        currentM += V[i - 1] * dx;
        M[i] = currentM;
    }

    return M;
}

// ─── Deflection Computation ──────────────────────────────────────────────────

function computeDeflection(xs, M, dx, EI, supports) {
    // Double integration of curvature: d²y/dx² = M/EI
    // First integration → slope θ(x)
    // Second integration → deflection y(x)

    const curvature = M.map(m => m / EI);

    // Integrate to get slope (with unknown constant C1)
    const slopeRaw = BeamUtils.cumulativeTrapz(curvature, dx);

    // Integrate to get deflection (with unknown constant C2)
    const deflRaw = BeamUtils.cumulativeTrapz(slopeRaw, dx);

    // Apply boundary conditions to find constants
    // Find support positions as indices
    const pinOrRollerSupports = supports.filter(s => s.type !== 'fixed');
    const fixedSupports = supports.filter(s => s.type === 'fixed');

    // For simply supported: y=0 at both supports
    // For cantilever: y=0, θ=0 at fixed end

    if (fixedSupports.length > 0) {
        // Fixed at left (position 0): y=0, θ=0
        const fixedLeft = fixedSupports.find(s => Math.abs(s.position - xs[0]) < xs[xs.length - 1] * 0.1);
        if (fixedLeft) {
            // Find index of right pin/roller
            if (pinOrRollerSupports.length > 0) {
                const rightSupport = pinOrRollerSupports[pinOrRollerSupports.length - 1];
                const rightIdx = closestIndex(xs, rightSupport.position);
                // slope constant C1: y(right) = 0 → deflRaw[right] + C1*rightX = 0
                const rightX = xs[rightIdx];
                const C1 = -deflRaw[rightIdx] / rightX;
                // Apply constants
                return deflRaw.map((d, i) => d + C1 * xs[i]);
            }
            // Pure cantilever: y[0]=0, slope[0]=0 → already satisfied from cumulative integration starting at 0
            return deflRaw;
        }
    }

    // Simply supported default: y=0 at both ends
    const leftIdx = 0;
    const rightIdx = xs.length - 1;
    const rightX = xs[rightIdx] - xs[leftIdx];
    const C1 = -deflRaw[rightIdx] / rightX;
    const C2 = -deflRaw[leftIdx];

    return deflRaw.map((d, i) => d + C1 * xs[i] + C2);
}

function closestIndex(arr, value) {
    let idx = 0;
    let minDist = Infinity;
    arr.forEach((v, i) => {
        const d = Math.abs(v - value);
        if (d < minDist) { minDist = d; idx = i; }
    });
    return idx;
}

// ─── Public API ─────────────────────────────────────────────────────────────

window.BeamSolver = { solveBeam };
