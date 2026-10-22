// Integration: the report builder's OWN defaults → its OWN input mapping
// (BlockRegistry._mapInputs) → the real solver. Solver unit tests can't catch a
// block that hands its solver the wrong keys or units — this can. Each case
// asserts the headline result is finite and physically non-trivial.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { load } = require('./_load');

const ROOT = path.join(__dirname, '..', '..');
const src = fs.readFileSync(path.join(ROOT, 'js/canvas/BlockRegistry.js'), 'utf8');

// Lift a top-level `function name …` / `const NAME = {…}` block out of the IIFE.
function grab(start) {
  const i = src.indexOf(start);
  if (i < 0) throw new Error('not found: ' + start);
  let depth = 0;
  for (let k = src.indexOf('{', i); k < src.length; k++) {
    if (src[k] === '{') depth++;
    else if (src[k] === '}' && --depth === 0) return src.slice(i, k + 1);
  }
}

const reg = { window: {} };
vm.createContext(reg);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/data/steelSections.js'), 'utf8'), reg);
vm.runInContext([
  grab('function _lookupSteelSection'),
  grab('function _mapInputs'),
  'var CALC_FIELDS = ' + grab('const CALC_FIELDS =').replace(/^const CALC_FIELDS =/, ''),
  'var SOLVER_MAP = ' + grab('const SOLVER_MAP =').replace(/^const SOLVER_MAP =/, ''),
].join('\n'), reg);

// Headline output per calculator that must be finite and > 0.
const HEADLINE = {
  calc_beam: 'MEd', calc_column: 'Nb_Rd', calc_rc_beam: 'MRd', calc_rc_column: 'NRd',
  calc_slab: 'As_req', calc_footing: 'NEd', calc_retaining: 'Pa_total',
  calc_connection: 'maxBoltForce', calc_timber_col: 'NRd', calc_steel_member: 'Mc_Rd',
  calc_bbs: r => r.totals.total_weight_kg, calc_section: 'A_mm2',
  calc_wind: 'qp_kPa', calc_load_takedown: 'totalULS', calc_hoarding: 'FOS',
};

for (const type of Object.keys(reg.CALC_FIELDS)) {
  test(`app path: ${type} — builder defaults reach the solver intact`, () => {
    const cfg = {};
    reg.CALC_FIELDS[type].forEach(f => { cfg[f.key] = f.default; });
    const inputs = reg._mapInputs(type, cfg);
    const info = reg.SOLVER_MAP[type];
    const solver = load(info.src.replace(/^\//, ''))[info.global];
    assert.ok(solver && typeof solver.solve === 'function', 'solver loads');
    const r = solver.solve(inputs);
    assert.ok(r && !r.error, `solver returned an error: ${r && r.error}`);
    const h = HEADLINE[type];
    const v = typeof h === 'function' ? h(r) : r[h];
    assert.ok(Number.isFinite(v) && v > 0, `${typeof h === 'string' ? h : 'headline'} = ${v}`);
    const nans = Object.entries(r).filter(([, x]) => typeof x === 'number' && !Number.isFinite(x));
    assert.deepStrictEqual(nans.map(([k]) => k), [], 'no NaN/Infinity outputs');
  });
}
