# BuildMetrics — Technical Overview

**Product:** Browser-based structural engineering calculation and reporting platform for UK engineers.
**Live at:** https://app.buildmetrics.uk (marketing site: https://buildmetrics.uk)
**Last updated:** 20 July 2026

---

## 1. What the product does

Engineers assemble a calculation report from blocks on a canvas: project
information, design basis, 15 Eurocode calculators, load tables, diagrams,
check summaries, sign-off registers. Each calculator runs client-side,
produces clause-referenced calculation steps, Ed/Rd design checks and
annotated SVG diagrams, and renders into an A4 print-ready report carrying
the *client's* letterhead (BuildMetrics appears only as 6.5pt fine print).
Reports export to PDF (via print) and Word.

### The 15 calculators

| Calculator | Standard(s) |
|---|---|
| Steel/Timber beam (BMD/SFD/deflection) | EN 1993-1-1, EN 1995-1-1, UK NA |
| Steel column (flexural buckling) | EN 1993-1-1 §6.3 |
| Steel member (classification, N+M+V interaction) | EN 1993-1-1 §5.5, §6.2–6.3 |
| RC beam (flexure, shear, deflection, min reinf.) | EN 1992-1-1 |
| RC column (slenderness, N-M) | EN 1992-1-1 §5.8 |
| RC slab (one-way, span/depth) | EN 1992-1-1 |
| Pad footing (bearing, punching, shear) | EN 1997-1, EN 1992-1-1 |
| Retaining wall (overturning, sliding, bearing) | EN 1997-1, Rankine |
| Bolted connection (elastic bolt-group) | EN 1993-1-8 |
| Timber column (instability factor) | EN 1995-1-1 §6.3.2 |
| Wind loading (full qp derivation) | EN 1991-1-4 + UK NA |
| Temporary works hoarding | TWf2012:01, EN 1991-1-4, EN 1995-1-1 |
| Section properties (I/T/rect/circ) | Geometry |
| Bar bending schedule | BS 8666 |
| Load take-down | EN 1990, EN 1991-1-1 |

Supporting data: UK Blue Book steel section tables (`js/data/steelSections.js`),
interactive UK basic-wind-speed map (Leaflet + postcodes.io + 35-point IDW
interpolation of the EN 1991-1-4 UK NA wind map).

## 2. Architecture

**Stack:** Static HTML/CSS/JS single-page-per-screen frontend; PHP 8.5 + MySQL
API on shared hosting (Hostinger); GitHub → auto-deploy on push to `main`.

```
Browser (all calculation happens here)
├── js/engine/        18 solver files — pure functions, no DOM, no network
├── js/canvas/        BlockRegistry (31 block types), Canvas (state/save),
│                     PreviewRenderer (A4 report HTML)
├── js/data/          Steel section tables
├── js/ui/            Top nav, wind map, diagrams, notifications
└── js/auth/          Bearer-token session (localStorage)

PHP API (persistence + auth only — no calculation server-side)
├── bm-auth.php       Register/login/Google Sign-In/reset/change/GDPR export+delete
├── projects.php      Project CRUD
├── reports.php       Report CRUD (block JSON persisted per report)
├── calculations.php  Design-register entries
├── report-templates.php  9 report templates
└── db.php            PDO, hashed tokens, CORS allowlist, rate limiting
```

**Key design property:** solvers are dependency-free pure functions taking a
flat input object and returning a flat result object with a `checks[]` array.
They run identically in the browser, in Node (tested that way), and could be
lifted into any other runtime unchanged. This is the core IP.

## 3. Security posture (as remediated July 2026)

- Passwords: bcrypt (`password_hash`), legacy hashes upgraded on login
- Sessions: 64-char random tokens, stored SHA-256-hashed, `hash_equals` compare
- Rate limiting on login (per-IP, MySQL-backed), password policy enforced
- Stored XSS remediated (escape-at-source in prose/design-basis renderers;
  shared-report iframe sandbox hardened)
- CSP + security headers in `.htaccess`; CORS allowlist
- Secrets in server-side gitignored `config.php` (not in repo)
- GDPR: self-service full data export (JSON) and account deletion endpoints
- **Known outstanding:** DB password rotation + git history purge recommended
  before transfer (secrets existed in history prior to July 2026 remediation)

## 4. Third-party dependencies (all permissive licences)

| Library | Version | Licence | Use |
|---|---|---|---|
| three.js | r128 | MIT | Landing-page hero animation only |
| Leaflet | 1.9.4 | BSD-2 | Wind map |
| SortableJS | 1.15.0 | MIT | Canvas drag-and-drop |
| marked | latest (CDN) | MIT | AI assistant markdown |
| DOMPurify | latest (CDN) | Apache-2.0 | Sanitising rendered markdown |
| Lenis | 1.1.16 | MIT | Landing smooth scroll |
| Inter font | — | OFL-1.1 | Typography |
| OpenStreetMap tiles | — | ODbL (attribution shown) | Wind map base |
| postcodes.io | — | MIT/OGL (free API) | Postcode → coordinates |

No GPL/AGPL exposure. No paid API dependencies except optional Anthropic API
(AI assistant) and Resend (transactional email) — both keyed server-side.

## 5. Codebase metrics (July 2026)

- 42 HTML screens, 54 JS files (~16,600 lines), 16 PHP endpoints (~2,300 lines)
- 18 solver modules; 31 report block types; 9 report templates
- 150 commits; single `main` branch; deploys on push
- No build step, no framework — plain JS. Zero npm production dependencies.

## 6. Verification approach

See `VALIDATION-REGISTER.md`. All 15 calculators pass an automated
browser-level regression: real block render → real Calculate click → real
report render, asserting finite results, populated calculation tables,
populated Ed/Rd design checks, and no NaN/undefined in output. Cold-start
(fresh session, first action) verified per calculator. Independent numerical
verification against published worked examples is the next step and is
tracked in the register.
