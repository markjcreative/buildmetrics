// Engine verification suite. Every expected value below is an independent hand
// calculation from the Eurocode clause cited — NOT a copy of what the solver
// currently prints. A failure here means the solver disagrees with the code.
//
// Run:  node --test tests/
const test = require('node:test');
const assert = require('node:assert');
const { load, near } = require('./_load');

// ── Section properties (geometry, exact) ────────────────────────────────────
test('section: 200x400 rectangle — exact geometric properties', () => {
  const r = load('js/engine/sectionSolver.js').SectionSolver.solve(
    { type: 'rectangle', b: 200, h: 400 });
  near(assert, r.A_mm2, 80000, 1e-6, 'A = bh');
  near(assert, r.Ixx_e6, 200 * 400 ** 3 / 12 / 1e6, 0.001, 'Ixx = bh³/12');
  near(assert, r.Zxx_e3, 200 * 400 ** 2 / 6 / 1e3, 0.001, 'Zxx = bh²/6');
  near(assert, r.Wpl_xx_e3, 200 * 400 ** 2 / 4 / 1e3, 0.001, 'Wpl = bh²/4');
  near(assert, r.rxx_mm, 400 / Math.sqrt(12), 0.001, 'r = h/√12');
});

// ── Bar bending schedule (BS 8666) ──────────────────────────────────────────
test('bbs: 4 no. H16 straight bars, 6.0 m — mass from 7850 kg/m³', () => {
  const r = load('js/engine/bbsSolver.js').BBSSolver.solve(
    [{ ref: 'B1', shape: '00', dia: 16, qty: 4, A: 6000 }]);
  const kgPerM = Math.PI * 16 ** 2 / 4 * 1e-6 * 7850;          // 1.578 kg/m
  near(assert, r.bars[0].weight_per_m, kgPerM, 0.002, 'kg/m');
  near(assert, r.totals.total_weight_kg, kgPerM * 24, 0.005, 'total mass');
  assert.equal(r.totals.total_bars, 4);
});

// ── Steel beam, EC3 (203x133x30 UB, S275, 5 m, w = 1.35·5 + 1.5·3) ────────────
test('steel beam: ULS moment, shear and section resistances (EC3 §6.2)', () => {
  const r = load('js/engine/beamDesignSolver.js').BeamDesignSolver.solve({
    material: 'steel', span: 5, spanLengths: [5], supportType: 'simply_supported',
    fy: 275, Sxx: 258, Ixx: 2340, h_mm: 203, tw_mm: 5.7, b_mm_sec: 133, tf_mm: 7.8,
    A_cm2: 32, r_mm: 7.6, Gk: 5, Qk: 3,
    loads: [{ type: 'udl', magnitude: 11.25, start: 0, end: 5 }] });
  near(assert, r.MEd, 11.25 * 25 / 8, 0.01, 'MEd = wL²/8');
  near(assert, r.VEd, 11.25 * 5 / 2, 0.01, 'VEd = wL/2');
  near(assert, r.capacities.Mc_Rd, 258e3 * 275 / 1e6, 0.001, 'Mc,Rd = Wpl·fy/γM0');
  // §6.2.6(3)(a) rolled I: Av = A − 2btf + (tw + 2r)tf, not less than η·hw·tw
  const Av = Math.max(3200 - 2 * 133 * 7.8 + (5.7 + 2 * 7.6) * 7.8, (203 - 2 * 7.8) * 5.7);
  near(assert, r.capacities.Vc_Rd, Av * 275 / Math.sqrt(3) / 1000, 0.005, 'Vc,Rd (§6.2.6)');
});

test('steel beam: deflection is checked at SLS, not ULS (UK NA to EC3 §2.23)', () => {
  const r = load('js/engine/beamDesignSolver.js').BeamDesignSolver.solve({
    material: 'steel', span: 5, spanLengths: [5], supportType: 'simply_supported',
    fy: 275, Sxx: 258, Ixx: 2340, h_mm: 203, tw_mm: 5.7, b_mm_sec: 133, tf_mm: 7.8,
    A_cm2: 32, r_mm: 7.6, Gk: 5, Qk: 3,
    loads: [{ type: 'udl', magnitude: 11.25, start: 0, end: 5 }] });
  // UK NA: span/360 limit applies to deflection under VARIABLE load (Qk = 3 kN/m)
  const dQ = 5 * 3 * 5000 ** 4 / (384 * 210000 * 2340e4);       // 4.97 mm
  near(assert, r.delta_max_mm, dQ, 0.02, 'δ under Qk');
  const defl = r.checks.find(c => /defl/i.test(c.name));
  assert.ok(defl && defl.pass, 'deflection check should pass (4.97 mm < L/360 = 13.9 mm)');
});

// ── Steel column, EC3 §6.3.1 (203x203x46 UC, S275, 3.5 m, NEd 500 kN) ─────────
test('steel column: flexural buckling resistance, curve c about z-z', () => {
  const r = load('js/engine/columnSolver.js').ColumnSolver.solve({
    NEd: 500, length: 3.5, keff: 1, sectionType: 'UC', A: 58.8, Iyy: 1540, Ixx: 4570,
    fy: 275, E: 210000, axis: 'both', My_Ed: 0, Mz_Ed: 0 });
  const iz = Math.sqrt(1540e4 / 5880);                          // 51.18 mm
  const l1 = 93.9 * Math.sqrt(235 / 275);                       // 86.8
  const lb = 3500 / iz / l1;                                    // 0.788
  const phi = 0.5 * (1 + 0.49 * (lb - 0.2) + lb * lb);
  const chi = 1 / (phi + Math.sqrt(phi * phi - lb * lb));       // 0.670
  near(assert, r.chi_z, chi, 0.003, 'χz');
  near(assert, r.Nb_Rd, chi * 5880 * 275 / 1000, 0.003, 'Nb,Rd');
  near(assert, r.utilisation, 500 / (chi * 5880 * 275 / 1000), 0.005, 'NEd/Nb,Rd');
});

// ── Steel member, EC3 (254x102x22 UB) ───────────────────────────────────────
test('steel member: Mc,Rd and Vc,Rd to EC3 §6.2.5 / §6.2.6', () => {
  const r = load('js/engine/steelMemberSolver.js').SteelMemberSolver.solve({
    h: 254, b: 101.6, tw: 5.7, tf: 6.8, r: 7.6, A: 28, Iy: 2840, Wel_y: 224, Wpl_y: 256,
    iz: 2.06, gammaM: 1, fy: 275, fu: 430, L: 4, Lcr_y: 4, Lcr_z: 4,
    NEd: 0, My_Ed: 80, Vz_Ed: 40 });
  near(assert, r.Mc_Rd, 256e3 * 275 / 1e6, 0.002, 'Mc,Rd');
  const Av = Math.max(2800 - 2 * 101.6 * 6.8 + (5.7 + 2 * 7.6) * 6.8, (254 - 2 * 6.8) * 5.7);
  near(assert, r.Vc_Rd, Av * 275 / Math.sqrt(3) / 1000, 0.005, 'Vc,Rd (§6.2.6)');
});

// ── RC beam, EC2 + UK NA (300x500, d = 450, C30/37, MEd 150 kNm) ──────────────
test('rc beam: K, lever arm and As,req per EC2 §6.1 (Concrete Centre method)', () => {
  const r = load('js/engine/rcBeamSolver.js').RCBeamSolver.solve({
    span: 6, b: 300, h: 500, d: 450, fck: 30, fyk: 500, MEd: 150, VEd: 80, cnom: 35,
    As_prov: 1608, Asw_prov: 402, stirrup_s: 200, stirrup_d: 10, cover: 35 });
  const K = 150e6 / (300 * 450 ** 2 * 30);                      // 0.0823 (uses fck)
  const z = Math.min(450 * (0.5 + Math.sqrt(0.25 - K / 1.134)), 0.95 * 450);
  near(assert, r.K, K, 0.005, 'K = M/(b·d²·fck)');
  near(assert, r.z, z, 0.005, 'z');
  near(assert, r.As_req, 150e6 / (500 / 1.15 * z), 0.005, 'As,req = M/(fyd·z)');
  near(assert, r.fcd, 0.85 * 30 / 1.5, 0.001, 'fcd (αcc = 0.85, UK NA)');
});

test('rc beam: MRd uses the lever arm of the steel PROVIDED (not As,req)', () => {
  const r = load('js/engine/rcBeamSolver.js').RCBeamSolver.solve({
    span: 6, b: 300, h: 500, d: 450, fck: 30, fyk: 500, MEd: 150, VEd: 80, cnom: 35,
    As_prov: 1608, Asw_prov: 402, stirrup_s: 200, stirrup_d: 10, cover: 35 });
  const fyd = 500 / 1.15, fcd = 0.85 * 30 / 1.5;
  const x = 1608 * fyd / (0.8 * 300 * fcd);                     // 171.4 mm
  const z = Math.min(450 - 0.4 * x, 0.95 * 450);                // 381.5 mm
  near(assert, r.MRd, 1608 * fyd * z / 1e6, 0.005, 'MRd = As,prov·fyd·z(As,prov)');
});

test('rc beam: concrete shear resistance VRd,c per EC2 §6.2.2', () => {
  const r = load('js/engine/rcBeamSolver.js').RCBeamSolver.solve({
    span: 6, b: 300, h: 500, d: 450, fck: 30, fyk: 500, MEd: 150, VEd: 80, cnom: 35,
    As_prov: 1608, Asw_prov: 402, stirrup_s: 200, stirrup_d: 10, cover: 35 });
  const k = Math.min(1 + Math.sqrt(200 / 450), 2);
  const rho = Math.min(1608 / (300 * 450), 0.02);
  const v = Math.max(0.12 * k * Math.cbrt(100 * rho * 30), 0.035 * k ** 1.5 * Math.sqrt(30));
  near(assert, r.VRdc, v * 300 * 450 / 1000, 0.005, 'VRd,c');
});

// ── RC slab, EC2 (4 m one-way, 175 thick, gk 1.5 + sw, qk 2.5) ────────────────
test('rc slab: loading, moment and reinforcement', () => {
  const r = load('js/engine/slabSolver.js').SlabSolver.solve({
    span: 4, thickness: 175, width: 1000, fck: 30, fyk: 500, cover: 25, barDia: 12,
    gk: 1.5, qk: 2.5, supportType: 'simply_supported', selfWeight: true });
  const w = 1.35 * (1.5 + 0.175 * 25) + 1.5 * 2.5;              // concrete 25 kN/m³ (EN 1991-1-1)
  near(assert, r.wEd, w, 0.01, 'wEd');
  near(assert, r.MEd, w * 16 / 8, 0.01, 'MEd = wL²/8');
  near(assert, r.d, 175 - 25 - 6, 0.001, 'd = h − c − φ/2');
  near(assert, r.fcd, 0.85 * 30 / 1.5, 0.001, 'fcd (αcc = 0.85, UK NA) — same as beams');
  near(assert, r.K, (w * 16 / 8) * 1e6 / (1000 * 144 ** 2 * 30), 0.01, 'K = M/(b·d²·fck)');
});

// ── Pad footing, EC7 (Gk 350, Qk 150, qa 150 kPa, 500 thick) ──────────────────
test('footing: auto-size includes self-weight so its own bearing check passes', () => {
  const r = load('js/engine/footingSolver.js').FootingSolver.solve({
    Gk: 350, Qk: 150, columnW: 300, soilBearing: 150, footThick: 500, fck: 30, fyk: 500,
    cover: 50, barDia: 16, footingType: 'square', aspectRatio: 1 });
  near(assert, r.NEd, 1.35 * 350 + 1.5 * 150, 0.001, 'NEd');
  const gross = (500 + r.B * r.L * 0.5 * 25) / (r.B * r.L);
  assert.ok(gross <= 150 + 1e-6, `gross bearing ${gross.toFixed(1)} kPa must not exceed 150`);
  assert.ok(r.bearingPass, 'a footing the solver sized itself must pass its own bearing check');
});

test('footing: punching force deducts the rounded EC2 control-perimeter area', () => {
  // Thin, wide footing so the 2d perimeter sits inside it and punching matters.
  const r = load('js/engine/footingSolver.js').FootingSolver.solve({
    Gk: 1200, Qk: 600, columnW: 300, soilBearing: 200, footThick: 400, fck: 30, fyk: 500,
    cover: 50, barDia: 16, footingType: 'square', aspectRatio: 1 });
  const d = r.d, c = 300, A = r.B * r.L;
  const Acp = (c * c + 4 * c * 2 * d + Math.PI * (2 * d) ** 2) / 1e6;
  near(assert, r.VEd_punch, r.NEd - (r.NEd / A) * Acp, 0.01, 'VEd = NEd − q·A(2d)');
  assert.ok(r.VEd_punch >= 0, 'punching force is never negative');
});

// ── Retaining wall, Rankine (H 3 m, γ 18, φ 30°, q 5 kPa) ─────────────────────
test('retaining wall: active earth thrust is ½·Ka·γ·H² (safety-critical)', () => {
  const r = load('js/engine/retainingWallSolver.js').RetainingWallSolver.solve({
    H: 3, surcharge: 5, soilDensity: 18, phi: 30, wallDensity: 25, baseWidth: 1.8,
    stemThick: 0.3, toeLength: 0.6, heelLength: 0.9, baseThick: 0.4, soilBearing: 150, mu: 0.5 });
  const Ka = (1 - Math.sin(Math.PI / 6)) / (1 + Math.sin(Math.PI / 6));   // 1/3
  near(assert, r.Ka, Ka, 0.002, 'Ka');
  // Solver convention: H is the TOTAL height (stem = H − base), so Rankine acts
  // on the full 3.0 m at the virtual back of the heel.
  const Ht = 3;
  near(assert, r.Pa_soil, 0.5 * Ka * 18 * Ht ** 2, 0.02, 'Pa,soil = ½·Ka·γ·H²');
  near(assert, r.Pa_surcharge, Ka * 5 * Ht, 0.02, 'Pa,q = Ka·q·H');
  // Default geometry genuinely fails overturning once the thrust is right —
  // the solver must say so rather than report a large safety margin.
  assert.ok(r.FOS_overturning < 4, `FOS ${r.FOS_overturning} — thrust still under-estimated`);
});

test('retaining wall: kg/m³ input (standalone page) gives the same result', () => {
  const RW = load('js/engine/retainingWallSolver.js').RetainingWallSolver;
  const base = { H: 3, surcharge: 5, phi: 30, wallDensity: 25, baseWidth: 1.8,
    stemThick: 0.3, toeLength: 0.6, heelLength: 0.9, baseThick: 0.4, soilBearing: 150, mu: 0.5 };
  const a = RW.solve({ ...base, soilDensity: 18 });
  const b = RW.solve({ ...base, soilDensity: 18 / 9.81 * 1000 });
  near(assert, b.Pa_soil, a.Pa_soil, 0.005, 'same thrust either unit');
});

// ── Bolt group, EC3-1-8 (4 no. M20 8.8, single shear, Vy 150 kN) ──────────────
test('connection: bolt group shear per EC3-1-8 Table 3.4', () => {
  const r = load('js/engine/connectionSolver.js').ConnectionSolver.solve({
    mode: 'bolt', Vx: 0, Vy: 150, M_in_plane: 0,
    boltLayout: [{ x: 0, y: -105 }, { x: 0, y: -35 }, { x: 0, y: 35 }, { x: 0, y: 105 }],
    boltSize: 'M20', boltGrade: '8.8', shearPlanes: 1, plateThk: 10, fy: 275, fu: 430 });
  near(assert, r.Ip, 2 * (105 ** 2 + 35 ** 2), 0.001, 'Ip = Σ(x²+y²)');
  near(assert, r.maxBoltForce, 150 / 4, 0.001, 'force per bolt');
  near(assert, r.boltCapacity, 0.6 * 800 * 245 / 1.25 / 1000, 0.002, 'Fv,Rd = αv·fub·As/γM2');
});

// ── Timber column, EC5 §6.3.2 (C24 90x90, 3 m pinned, medium-term, SC1) ───────
test('timber column: instability factor kc and NRd', () => {
  const r = load('js/engine/timberColumnSolver.js').TimberColumnSolver.solve({
    grade: 'C24', shape: 'rectangular', b: 90, h: 90, height: 3,
    endCondition: 'pinned_pinned', serviceClass: 1, loadDuration: 'medium_term',
    NEd: 50, MEd_y: 0, MEd_z: 0 });
  const fc0d = 0.8 * 21 / 1.3;
  const lrel = 3000 / (90 / Math.sqrt(12)) / Math.PI * Math.sqrt(21 / 7400);
  const k = 0.5 * (1 + 0.2 * (lrel - 0.3) + lrel ** 2);
  const kc = 1 / (k + Math.sqrt(k * k - lrel * lrel));
  near(assert, r.fc_0_d, fc0d, 0.002, 'fc,0,d = kmod·fc,0,k/γM');
  near(assert, r.kc_gov, kc, 0.005, 'kc');
  near(assert, r.NRd, kc * 8100 * fc0d / 1000, 0.005, 'NRd = kc·A·fc,0,d');
});

// ── Wind, EN 1991-1-4 + UK NA ───────────────────────────────────────────────
test('wind: basic velocity, basic pressure and qp = ce·qb', () => {
  const r = load('js/engine/windSolver.js').WindSolver.solve({
    vb0: 23, altitude: 50, distanceSea: 20, terrainCat: 'II', h: 10, b: 15, d: 10,
    cdir: 1, cseason: 1, calt: 1.05, orography: false });
  near(assert, r.vb_alt, 23 * (1 + 0.001 * 50), 0.002, 'vb = vb,0·calt (calt = 1 + 0.001A)');
  near(assert, r.qb_alt, 0.5 * 1.226 * r.vb_alt ** 2, 0.002, 'qb = ½ρvb²');
  near(assert, r.qp_Pa, r.ce * r.qb_alt, 0.005, 'qp = ce·qb');
});

// ── Load take-down, EN 1990 (3 floors × 20 m², DL 4, LL 2.5; roof 3 / 0.6) ────
test('load take-down: accumulates every floor and the roof', () => {
  const r = load('js/engine/loadTakedownSolver.js').LoadTakedownSolver.solve({ floors: [
    { label: 'Roof', area: 20, gk_slab: 3, qk_slab: 0.6 },
    { label: 'L3', area: 20, gk_slab: 4, qk_slab: 2.5 },
    { label: 'L2', area: 20, gk_slab: 4, qk_slab: 2.5 },
    { label: 'L1', area: 20, gk_slab: 4, qk_slab: 2.5 },
  ] });
  const Gk = 3 * 20 * 4 + 20 * 3;                                // 300 kN
  const Qk = 3 * 20 * 2.5 + 20 * 0.6;                            // 162 kN
  near(assert, r.totalGk, Gk, 0.001, 'ΣGk');
  near(assert, r.totalQk, Qk, 0.001, 'ΣQk');
  near(assert, r.totalULS, 1.35 * Gk + 1.5 * Qk, 0.001, 'ULS (6.10)');
  near(assert, r.totalSLS, Gk + Qk, 0.001, 'SLS');
});
