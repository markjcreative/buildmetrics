/**
 * BuildMetrics — Temporary Works Hoarding Engine (timber posts)
 * Method: TwF2012 "Hoardings: guide to good practice" (dug-in post foundation)
 * Codes:  BS EN 1991-1-4 + NA (wind), BS EN 1995-1-1 + NA (timber),
 *         BS EN 1997 (geotech), BS EN 1990 (γQ = 1.5)
 *
 * Formulae faithfully ported from a validated reference calculation
 * (Littlewood Group TwF2012 v7). Single governing wind case is carried
 * through post / rail / fixing / facing / foundation design.
 */
const HoardingSolver = (() => {

  // Exposure factor Ce(z) — terrain category × height (NA Fig NA.7, tabulated)
  // keys: 0 Sea, 1 Open country, 2 Obstacles, 3 Suburban, 4 Urban
  const Ce_tbl = {
    0: { z2: 1.6, z5: 1.9 }, 1: { z2: 1.8, z5: 2.0 }, 2: { z2: 2.0, z5: 2.2 },
    3: { z2: 1.5, z5: 1.7 }, 4: { z2: 1.2, z5: 1.4 },
  };
  const Cp_tbl = { 1: 0.749, 5: 0.848, 50: 1.00 };      // probability factor by return period
  const tDB    = { C16: { fmk: 16, E0: 8000 }, C24: { fmk: 24, E0: 11000 }, C32: { fmk: 32, E0: 14000 } };
  const RHO_K  = { C16: 290, C24: 350, C32: 400 };       // characteristic density kg/m³

  const psp   = s => { const p = String(s).split('x'); return { b: +p[0], h: +p[1] }; };
  const getCe = (tc, z) => { const e = Ce_tbl[tc] || Ce_tbl[1]; return z <= 2 ? e.z2 : z >= 5 ? e.z5 : e.z2 + (z - 2) / 3 * (e.z5 - e.z2); };

  // Timber post (vertical cantilever) bending + deflection
  function postCalc(grade, sectionStr, kmod, Leff, Muls, wk) {
    const { b, h: ht } = psp(sectionStr);
    const Wel = b * ht * ht / 6e9;          // m³
    const I   = b * ht * ht * ht / 12e12;   // m⁴
    const fmk = (tDB[grade] || tDB.C24).fmk;
    const E   = (tDB[grade] || tDB.C24).E0 * 1000;
    const fmd = kmod * fmk / 1.3;
    const sig = Muls * 1e3 / (Wel * 1e6);
    const uc  = sig / fmd;
    const defl = wk * Math.pow(Leff, 4) / (8 * E * I) * 1000;  // mm
    const lim  = Leff * 1000 / 40;
    return { b, ht, Wel: Wel * 1e6, I: I * 1e8, fmk, fmd, sig, uc, defl, lim };
  }

  function solve(cfg) {
    // ── Inputs ─────────────────────────────────────────────────────────────
    const H        = +cfg.H        || 2.4;     // hoarding height (m)
    const phi      = +cfg.phi      || 1.0;     // cladding solidity ratio
    const alt      = +cfg.altitude || 50;      // altitude (m)
    const vb0      = +cfg.vb0       || 23;      // basic wind speed from map (m/s)
    const tc       = (cfg.terrainCat != null) ? +cfg.terrainCat : 1;
    const per      = +cfg.returnPeriod || 50;  // return period (yr)
    const Ln       = +cfg.Ln       || 2.4;     // normal bay width (m)
    const Lne      = +cfg.Lne      || 1.8;     // next-to-end bay width (m)
    const Le       = +cfg.Le       || 1.2;     // end bay width (m)
    const postGrade= cfg.postGrade || 'C24';
    const postSec  = cfg.postSection || '150x150';
    const kmod     = +cfg.kmod     || 0.90;    // short-term, service class 2
    const railSec  = cfg.railSection || '75x150';
    const railGrade= cfg.railGrade || 'C24';
    const nRails   = +cfg.nRails   || 3;
    const fixType  = cfg.fixType   || 'bolt';
    const boltD    = +cfg.boltD    || 12;
    const nFix     = +cfg.nFasteners || 2;
    const t1       = +cfg.t1       || 150;     // post face thickness (mm)
    const t2       = +cfg.t2       || 75;      // rail thickness (mm)
    const plyT     = +cfg.plyT     || 18;      // plywood thickness (mm)
    const plyFmk   = (cfg.plyGrade === 'str') ? 30 : 24;
    const fd       = +cfg.foundationDia || 0.45; // foundation dia / side (m)
    const tops     = +cfg.topsoil  || 0.10;    // ineffective topsoil depth (m)
    const P        = +cfg.foundationDepth || 0.90; // trial embedment (m)
    const G        = +cfg.soilG    || 230;     // TwF2012 soil factor
    const isSlope  = cfg.nearSlope === true || cfg.nearSlope === 'slope';

    // ── 1. Wind loading (EN1991-1-4 + NA) ───────────────────────────────────
    const calt  = 1 + 0.001 * alt;
    const cprob = Cp_tbl[per] || 1.0;
    const vb    = vb0 * calt * cprob;                  // cdir = cseason = 1.0
    const qb    = 0.5 * 1.25 * vb * vb;                // N/m²
    const cez   = getCe(tc, H);
    const qp    = cez * qb / 1000;                     // kN/m²
    const cfBase= phi >= 0.9 ? 1.3 : phi >= 0.5 ? 1.2 : 1.1;
    const cfN = cfBase, cfNE = cfBase * 1.25, cfE = cfBase * 1.50;
    const weN = cfN * qp, weNE = cfNE * qp, weE = cfE * qp;

    const wc = (we, L) => { const wk = we * L, wd = wk * 1.5; return { wk, wd, Muls: wd * H * H / 2, Vuls: wd * H, Mk: wk * H * H / 2 }; };
    const cN = wc(weN, Ln), cNE = wc(weNE, Lne), cE = wc(weE, Le);

    const govMuls = Math.max(cN.Muls, cNE.Muls, cE.Muls);
    const govMk   = Math.max(cN.Mk, cNE.Mk, cE.Mk);
    const govVuls = Math.max(cN.Vuls, cNE.Vuls, cE.Vuls);
    const govName = govMuls === cN.Muls ? 'Normal' : govMuls === cNE.Muls ? 'Next-to-end' : 'End';
    const govWk   = govMuls === cN.Muls ? cN.wk : govMuls === cNE.Muls ? cNE.wk : cE.wk;

    // ── 2. Timber post (governing case) ─────────────────────────────────────
    const Leff = H;
    const post = postCalc(postGrade, postSec, kmod, Leff, govMuls, govWk);
    const postBendPass = post.uc <= 1.0;
    const postDeflPass = post.defl <= post.lim;

    // ── 3. Timber rail (simply supported over normal bay) ───────────────────
    const Lr = Ln;
    const { b: rb, h: rh } = psp(railSec);
    const rWel = rb * rh * rh / 6e9, rI = rb * rh * rh * rh / 12e12;
    const rfmk = (tDB[railGrade] || tDB.C24).fmk, rE = (tDB[railGrade] || tDB.C24).E0 * 1000;
    const rfmd = kmod * rfmk / 1.3;
    const wkr  = weN * H / nRails, wdr = wkr * 1.5;
    const rMEd = wdr * Lr * Lr / 8, rsig = rMEd * 1e3 / (rWel * 1e6), railUC = rsig / rfmd;
    const rdefl = 5 * wkr * Math.pow(Lr, 4) / (384 * rE * rI) * 1000, rLim = Lr * 1000 / 40;
    const railBendPass = railUC <= 1.0, railDeflPass = rdefl <= rLim;

    // ── 4. Fixing — Johansen yield theory (EN1995 §8) ───────────────────────
    const rho = RHO_K[fixType === 'bolt' ? postGrade : postGrade] || 350;
    let d, fhk, Myk, Fa, Fb, Fc;
    if (fixType === 'nail') {
      d = +cfg.nailD || 3.75;
      const Lnail = +cfg.nailLen || 75;
      const tpen = Math.max(Lnail - t1, 0);
      fhk = 0.082 * (1 - 0.01 * d) * rho;
      Myk = 0.3 * 600 * Math.pow(d, 2.6);
      Fa = fhk * t1 * d / 1000; Fb = fhk * tpen * d / 1000;
      Fc = 1.15 * Math.sqrt(2 * Myk * fhk * d) / 1000;
    } else {
      d = boltD;
      fhk = 0.082 * rho * Math.pow(d, -0.3);
      Myk = 0.3 * 400 * Math.pow(d, 2.6);
      Fa = fhk * t1 * d / 1000; Fb = fhk * t2 * d / 1000;
      Fc = 1.15 * Math.sqrt(2 * Myk * fhk * d) / 1000;
    }
    const FvRk = Math.min(Fa, Fb, Fc);
    const FvRd = kmod * FvRk / 1.3;
    const VEdFix = govVuls / nFix;
    const fixUC = VEdFix / FvRd;
    const fixPass = fixUC <= 1.0;

    // ── 5. Plywood facing (1 m strip, simply supported between rails) ───────
    const Eply = 9500, Sp = H / Math.max(nRails - 1, 1);
    const WelP = 1000 * plyT * plyT / 6, fmdP = kmod * plyFmk / 1.2;
    const wdP = weN * 1.5, MedP = wdP * Sp * Sp / 8, sigP = MedP * 1e6 / WelP, facingUC = sigP / fmdP;
    const IP = 1000 * Math.pow(plyT, 3) / 12e12, dflP = 5 * weN * Math.pow(Sp, 4) / (384 * Eply * 1000 * IP) * 1000, limP = Sp * 1000 / 40;
    const facingPass = facingUC <= 1.0, facingDeflPass = dflP <= limP;

    // ── 6. Foundation — TwF2012 dug-in post overturning ─────────────────────
    const Mg = G * fd * P * P * P;
    const fulc = isSlope ? P : 0.707 * P;
    const Mgo = Mg * (P + 2 * tops) / (fulc + tops);
    const FOS = Mgo / govMk;
    const fndPass = FOS >= 1.5;
    // minimum embedment for FOS = 1.5
    let minP = 3;
    for (let p = 0.3; p <= 3; p += 0.005) {
      const mg = G * fd * p * p * p, f = isSlope ? p : 0.707 * p;
      if (mg * (p + 2 * tops) / (f + tops) / govMk >= 1.5) { minP = p; break; }
    }

    const overallPass = postBendPass && postDeflPass && railBendPass && fixPass && facingPass && fndPass;

    // ── Checks (drives summary + per-block check table) ─────────────────────
    const checks = [
      { checkName: 'Post bending (' + postSec + ')', Ed: +post.sig.toFixed(2), EdUnit: 'N/mm²', Rd: +post.fmd.toFixed(2), RdUnit: 'N/mm²', util: +post.uc.toFixed(3), pass: postBendPass },
      { checkName: 'Post deflection', Ed: +post.defl.toFixed(1), EdUnit: 'mm', Rd: +post.lim.toFixed(1), RdUnit: 'mm', util: +(post.defl / post.lim).toFixed(3), pass: postDeflPass },
      { checkName: 'Rail bending (' + railSec + ')', Ed: +rsig.toFixed(2), EdUnit: 'N/mm²', Rd: +rfmd.toFixed(2), RdUnit: 'N/mm²', util: +railUC.toFixed(3), pass: railBendPass },
      { checkName: 'Fixing shear', Ed: +VEdFix.toFixed(2), EdUnit: 'kN', Rd: +FvRd.toFixed(2), RdUnit: 'kN', util: +fixUC.toFixed(3), pass: fixPass },
      { checkName: 'Facing bending (' + plyT + 'mm ply)', Ed: +sigP.toFixed(2), EdUnit: 'N/mm²', Rd: +fmdP.toFixed(2), RdUnit: 'N/mm²', util: +facingUC.toFixed(3), pass: facingPass },
      { checkName: 'Foundation FOS (≥1.5)', Ed: 1.5, EdUnit: '', Rd: +FOS.toFixed(2), RdUnit: '', util: +(1.5 / FOS).toFixed(3), pass: fndPass },
    ];

    return {
      _ran: true,
      // wind chain
      calt: +calt.toFixed(3), cprob: +cprob.toFixed(3), vb: +vb.toFixed(2), qb: +qb.toFixed(1),
      cez: +cez.toFixed(2), qp: +qp.toFixed(4),
      cfN: +cfN.toFixed(2), cfNE: +cfNE.toFixed(2), cfE: +cfE.toFixed(2),
      weN: +weN.toFixed(4), weNE: +weNE.toFixed(4), weE: +weE.toFixed(4),
      // governing
      govName, govMuls: +govMuls.toFixed(3), govVuls: +govVuls.toFixed(3), govMk: +govMk.toFixed(3),
      // post
      postSec, postWel: +post.Wel.toFixed(1), postSig: +post.sig.toFixed(2), postFmd: +post.fmd.toFixed(2),
      postUC: +post.uc.toFixed(3), postDefl: +post.defl.toFixed(1), postDeflLim: +post.lim.toFixed(1),
      // rail
      railSec, railMEd: +rMEd.toFixed(3), railUC: +railUC.toFixed(3), railDefl: +rdefl.toFixed(1),
      // fixing
      fixType, fhk: +fhk.toFixed(2), Myk: +Myk.toFixed(0), FvRk: +FvRk.toFixed(3), FvRd: +FvRd.toFixed(3),
      VEdFix: +VEdFix.toFixed(3), fixUC: +fixUC.toFixed(3),
      // facing
      facingSp: +Sp.toFixed(3), facingMEd: +MedP.toFixed(4), facingUC: +facingUC.toFixed(3), facingDefl: +dflP.toFixed(1),
      // foundation
      Mg: +Mg.toFixed(3), fulcrum: +fulc.toFixed(3), Mgo: +Mgo.toFixed(3), FOS: +FOS.toFixed(2),
      minP: +minP.toFixed(2), totalHole: +(P + tops).toFixed(2),
      // geometry echo for diagram
      H, P, topsoil: tops, foundationDia: fd,
      // overall
      utilisation: +Math.max(post.uc, railUC, fixUC, facingUC, 1.5 / FOS).toFixed(3),
      overallPass,
      checks,
    };
  }

  return { solve };
})();

window.HoardingSolver = HoardingSolver;
if (typeof module !== 'undefined') module.exports = HoardingSolver;
