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

| # | Calculator | L1 | L2 | L3 | Suggested L2 reference |
|---|---|---|---|---|---|
| 1 | Steel/timber beam | ✅ 2026-07-20 | ☐ | ☐ | SCI P365 worked examples; Blue Book bending tables |
| 2 | Steel column | ✅ 2026-07-20 | ☐ | ☐ | SCI P362 Ex. 6; Blue Book compression tables |
| 3 | Steel member | ✅ 2026-07-20 | ☐ | ☐ | SCI P362 combined N+M examples |
| 4 | RC beam | ✅ 2026-07-20 | ☐ | ☐ | Mosley, Bungey & Hulse (7th ed) Ch.4 examples |
| 5 | RC column | ✅ 2026-07-20 | ☐ | ☐ | Mosley Ch.9; The Concrete Centre "How to" guides |
| 6 | RC slab | ✅ 2026-07-20 | ☐ | ☐ | The Concrete Centre worked examples (one-way slab) |
| 7 | Pad footing | ✅ 2026-07-20 | ☐ | ☐ | The Concrete Centre foundations guide |
| 8 | Retaining wall | ✅ 2026-07-20 | ☐ | ☐ | Craig's Soil Mechanics gravity-wall example |
| 9 | Bolted connection | ✅ 2026-07-20 | ☐ | ☐ | SCI P398 (Green Book) bolt-group examples |
| 10 | Timber column | ✅ 2026-07-20 | ☐ | ☐ | TRADA Eurocode 5 span/design examples |
| 11 | Wind loading | ✅ 2026-07-20 | ☐ | ☐ | EN 1991-1-4 UK NA worked example (e.g. SCI P394) |
| 12 | Hoarding (TWf2012) | ✅ 2026-07-20 | ☐ | ☐ | TWf2012:01 Appendix worked example |
| 13 | Section properties | ✅ 2026-07-20 | ☐ | ☐ | Blue Book values for standard sections (exact) |
| 14 | Bar bending schedule | ✅ 2026-07-20 | ☐ | ☐ | BS 8666 shape-code length formulae (exact) |
| 15 | Load take-down | ✅ 2026-07-20 | ☐ | ☐ | Hand calculation (arithmetic aggregation) |

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
