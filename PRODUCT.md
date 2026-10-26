# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

PHP 8.5 + MySQL on Hostinger shared hosting; static HTML/CSS/vanilla JS with no build step; GitHub auto-deploys `main` to `app.buildmetrics.uk`. Node is used only to run the engine test suite (`npm test`), never in production. The user chose to stay on PHP/Hostinger over a Next.js/Supabase rebuild (Oct 2026).

## Users

UK structural and civil engineers — consulting practices, SME and sole practitioners, and contractors' temporary-works and design teams — producing calculation packs for checkers, building control and clients. Secondary: technicians, graduate engineers, and checkers reviewing calculations.

Primary usage: desktop/laptop in the office, on wide screens, for focused work sessions. Mobile must fully work but is secondary (e.g. reviewing a report on site).

## Product Purpose

A platform of Eurocode calculators whose output is a submission-ready, letterheaded calculation report. Success is a document an engineer can put their name to and hand over without reformatting.

## Positioning

The deliverable is the document, not a dashboard: every calculation row carries its clause reference, every check shows Ed / Rd / utilisation, and the report wears the engineer's own company letterhead. Free to use — no seat licences, no subscription, no trial clock.

## Operating Context

- Workflow: create a project → create a report → add blocks (project info, calculators, notes, diagrams, sign-off) on a canvas → calculate → preview → print to PDF or export Word.
- Reports are A4, submitted to checkers, building control and clients; BuildMetrics appears only as 6.5pt fine print on them.
- Engineers retain design responsibility; every report states that results must be independently verified by a qualified engineer.

## Capabilities and Constraints

- 15 calculators: steel beam, steel column, steel member, RC beam, RC column, RC slab, pad footing, retaining wall, bolted connection, timber column, wind (EN 1991-1-4 + UK NA), TWf2012 hoarding, section properties, BS 8666 bar bending schedule, load take-down. Agreed target catalogue (Phase 2) adds loading (snow, combinations), steel connections (weld, baseplate) and LTB, concrete (strip footing, pile cap, punching, crack width), timber beam/joist/connections, masonry (EC6), piles, lap/anchorage, temporary works (props, needles), reference tables.
- Engine verified by an automated hand-calculation suite (`tests/engine/`, 33 checks). Not yet implemented and must not be claimed: lateral-torsional buckling, bolt bearing, footing punching at a < 2d, certification of any kind.
- Supporting tools: interactive UK basic-wind-speed map, Blue Book steel section data, design register, standards library, quick tools.
- Help & Support widget and page (FAQs, help guide, how-to, documentation, contact form emailing support@buildmetrics.uk) replaced the AI chat. The AI section-drafting/suggestion helper inside the report builder stays.
- First-run dashboard tour (skippable, replayable). Password show/hide on all auth forms.
- Auth: email/password (bcrypt, hashed session tokens, rate limiting) and Google Sign-In. GDPR self-service export and deletion.
- No subscription, pricing tiers or paywalls anywhere.

## Brand Commitments

Binding: the approved BuildMetrics v2.1 brand in `~/Projects/buildmetrics-brand/` (`brand-guidelines.md`, `assets/` logo suite, visual system board, UI kit). Name stays BuildMetrics. Voice: a trusted senior engineer — precise, calm, generous, never salesy; no exclamation marks; avoid hype lexicon (powerful, seamless, unlock, next-generation). Tagline: "Structural calculations you can hand over." Signal orange is a brand accent only, never a pass/fail status.

## Evidence on Hand

- Validation register and due-diligence pack: `docs/`.
- Real calculator output (all 15) via `_local-preview.html`.
- No testimonials, customer logos, user counts or press exist — do not fabricate any.

## Product Principles

1. The report is the product: every screen exists to get a correct document out the door.
2. Show the working: clause, formula, value, unit — never a bare number.
3. Correctness over convenience: no silent defaults that change engineering results; failures are stated plainly.
4. Professional capability, openly accessible: free, no gates, no upsell.
5. Density with calm: an engineer's workspace, scannable at a glance, quiet until something needs attention.

## Accessibility & Inclusion

WCAG 2.2 AA across the app: contrast, keyboard operation, visible focus, reduced motion, and status never conveyed by colour alone (pass/fail always labelled).
