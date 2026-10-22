# BuildMetrics — Calculation Validation Register

**Purpose.** This register records the verification status of every solver.
It is the document an acquiring engineering company's technical reviewer will
ask for first. UK law does not require certification of calculation software;
what buyers and insurers expect is (a) a documented verification method,
(b) traceable results against independent references, and (c) a clear
statement of the engineer's retained responsibility — which every generated
report carries ("All calculations must be independently checked and verified
by a qualified engineer before use for construction").

**Verification levels**

- **L1 — Mechanical:** solver runs through the real UI path, returns finite,
  dimensionally-sane values; report renders complete (automated).
- **L2 — Worked example:** results match a published worked example or
  textbook calculation within rounding (manual, referenced).
- **L3 — Independent check:** L2 reproduced by an engineer not involved in
  development, signed and dated.

**Status: all 15 at L1 (automated, July 2026). L2 references selected below —
completing L2/L3 is the single highest-value task before approaching buyers.**

| # | Calculator | L1 | L2a | L2b | L3 | Suggested L2b reference |
|---|---|---|---|---|---|---|
| 1 | Steel/timber beam | ✅ 2026-07-20 | ✅ 2026-10-22 | ☐ | ☐ | SCI P365 worked examples; Blue Book bending tables |
| 2 | Steel column | ✅ 2026-07-20 | ✅ 2026-10-22 | ☐ | ☐ | SCI P362 Ex. 6; Blue Book compression tables |
| 3 | Steel member | ✅ 2026-07-20 | ✅ 2026-10-22 | ☐ | ☐ | SCI P362 combined N+M examples |
| 4 | RC beam | ✅ 2026-07-20 | ✅ 2026-10-22 | ☐ | ☐ | Mosley, Bungey & Hulse (7th ed) Ch.4 examples |
| 5 | RC column | ✅ 2026-07-20 | ◐ app path only | ☐ | ☐ | Mosley Ch.9; The Concrete Centre "How to" guides |
| 6 | RC slab | ✅ 2026-07-20 | ✅ 2026-10-22 | ☐ | ☐ | The Concrete Centre worked examples (one-way slab) |
| 7 | Pad footing | ✅ 2026-07-20 | ✅ 2026-10-22 | ☐ | ☐ | The Concrete Centre foundations guide |
| 8 | Retaining wall | ✅ 2026-07-20 | ✅ 2026-10-22 | ☐ | ☐ | Craig's Soil Mechanics gravity-wall example |
| 9 | Bolted connection | ✅ 2026-07-20 | ✅ 2026-10-22 | ☐ | ☐ | SCI P398 (Green Book) bolt-group examples |
| 10 | Timber column | ✅ 2026-07-20 | ✅ 2026-10-22 | ☐ | ☐ | TRADA Eurocode 5 span/design examples |
| 11 | Wind loading | ✅ 2026-07-20 | ✅ 2026-10-22 | ☐ | ☐ | EN 1991-1-4 UK NA worked example (e.g. SCI P394) |
| 12 | Hoarding (TWf2012) | ✅ 2026-07-20 | ◐ app path only | ☐ | ☐ | TWf2012:01 Appendix worked example |
| 13 | Section properties | ✅ 2026-07-20 | ✅ 2026-10-22 | ☐ | ☐ | Blue Book values for standard sections (exact) |
| 14 | Bar bending schedule | ✅ 2026-07-20 | ✅ 2026-10-22 | ☐ | ☐ | BS 8666 shape-code length formulae (exact) |
| 15 | Load take-down | ✅ 2026-07-20 | ✅ 2026-10-22 | ☐ | ☐ | Hand calculation (arithmetic aggregation) |

**L2a — automated hand-calculation suite (`npm test`, Phase 0, 22 Oct 2026).**
`tests/engine/solvers.test.js` checks each solver against an *independent* hand
calculation from the cited clause (not against the solver's own output), and
`tests/engine/app-path.test.js` runs the report builder's real defaults through
its real input mapping into each solver. 33/33 pass. This is short of L2b
(agreement with a *published* worked example) and L3 (independent engineer),
which remain open below.

Building the suite exposed nine defects, all fixed and now under test:

| Calculator | Defect | Direction |
|---|---|---|
| Retaining wall | Soil density read as kg/m³ when the builder sent kN/m³ → every soil force ~100× too small; failing walls reported as safe (default wall: FOS sliding 4.03 shown, true 1.31) | **Unsafe** |
| RC beam | MRd used the lever arm of As,req, not of the steel provided — over-states capacity whenever As,prov > As,req | **Unsafe** (exposed once K was fixed) |
| Footing | Punching deduction used a square (c+4d)² instead of the rounded §6.4.2 perimeter → VEd under-stated | **Unsafe** |
| Load take-down | Builder sent flat fields; solver expects `floors[]` → every take-down 0 kN | Wrong (silent) |
| RC beam / slab / footing | K computed on fcd but used with the fck-based z expression and K′ = 0.167 → As over-stated, compression steel flagged early | Conservative |
| Steel beam | Deflection checked under ULS load; UK NA NA.2.23 uses imposed load → beams falsely failing | Conservative |
| Steel beam | §6.2.6 Av used (tw + r) and 0.9·h·tw instead of (tw + 2r) and η·hw·tw | Conservative |
| Steel member | Root radius hard-coded at 12 mm for every section (affects Av and c/t class) | Mixed |
| Footing | Auto-size lagged its own self-weight → sized footing failed its own bearing check | Wrong |

Also aligned: αcc = 0.85 (UK NA) in slab and footing as in beams; reinforced
concrete 25 kN/m³ (EN 1991-1-1 Table A.1).

**Known gaps (not defects in what is computed, but checks not yet performed):**
lateral-torsional buckling is not checked in the steel beam/member solvers
(results assume full lateral restraint); bolt bearing (Fb,Rd) is not checked in
the connection solver; footing punching is checked at 2d only (§6.4.4 a < 2d
iteration not yet implemented). These are Phase 2 items and must be stated as
assumptions on reports until then.

**L1 evidence.** Automated regression run 2026-07-20: 15/15 solvers produce
finite results through the real render→calculate→report path; 31/31 block
types render; combined report contains 0 NaN, 0 undefined, 0 blank value
cells; per-calculator cold-start (first action in a fresh session) passes.
Spot dimensional checks: 200×400 rectangle A = 80,000 mm² (exact);
254×102×22 UB A = 28.0 cm² (Blue Book: 28.0); wind qp = 0.84 kN/m² at 10 m,
terrain II, vb,0 = 23 m/s (plausible vs UK NA); hoarding overturning
FOS = 18.8 for default geometry (stable by inspection).

**Standards versions referenced by the solvers**

| Standard | Edition assumed | Where used |
|---|---|---|
| EN 1990 + UK NA | 2002 (+A1) | Load combinations (6.10) |
| EN 1991-1-1 + UK NA | 2002 | Imposed/dead loads |
| EN 1991-1-4 + UK NA | 2005 (+A1) | Wind map, qp derivation |
| EN 1992-1-1 + UK NA | 2004 | RC beam/column/slab/footing |
| EN 1993-1-1 + UK NA | 2005 | Steel beam/column/member |
| EN 1993-1-8 | 2005 | Connections |
| EN 1995-1-1 + UK NA | 2004 (+A2) | Timber |
| EN 1997-1 | 2004 | Footing, retaining wall |
| TWf2012:01 | 2012 | Hoarding |
| BS 8666 | 2020 | Bar schedules |

> **Second-generation Eurocodes note.** BSI began publishing the second
> generation (e.g. BS EN 1990:2023, BS EN 1993-1-1:2022) with a coexistence
> period expected to run to ~2028+. The solvers implement first-generation
> clauses, which remain the ones in dominant UK practice use. An acquirer
> should treat second-generation alignment as a roadmap item, not a defect;
> the clause references printed on every calculation row make the migration
> tractable.

**How to complete L2 (method).** For each calculator: reproduce the reference
example's inputs in the app, export the report, attach it and the reference
to this register with a pass/fail per output quantity (tolerance: rounding in
the reference). Any discrepancy is a defect until dispositioned. Estimated
effort: 1–2 days per calculator including write-up; section properties, BBS
and load take-down are hours, not days.
