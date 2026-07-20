# BuildMetrics — Due-Diligence Pack (Seller's Disclosure)

Prepared for prospective acquirers. Honest disclosure of what exists, what
is proven, and what a buyer would need to complete. Companion documents:
`TECHNICAL-OVERVIEW.md` (architecture), `VALIDATION-REGISTER.md` (calc
verification).

**Owner/author:** Mark James (sole developer). **Date:** 20 July 2026.

---

## 1. Intellectual property

- All application code written by the owner; single-author git history
  (150 commits) evidences provenance.
- Third-party code limited to permissively-licensed libraries (MIT/BSD/
  Apache-2.0/OFL) loaded from CDN — full table in TECHNICAL-OVERVIEW §4.
  No GPL/AGPL. No copied proprietary code.
- Steel section data compiled from published SCI "Blue Book" dimensional
  data (facts, not creative expression; industry-standard practice).
- Wind map interpolates the published EN 1991-1-4 UK NA map values.
- Name/brand: "BuildMetrics" — buyer should complete a trademark search;
  no registration currently held. Domains: buildmetrics.uk, app.buildmetrics.uk.
- No patents, no third-party IP claims, no prior assignments or licences
  granted. Clean assignment possible.

## 2. Legal & compliance state

| Item | Status |
|---|---|
| Terms of Service | 16 sections incl. calculation-accuracy disclaimer, professional-use clause, liability cap, UK governing law |
| Privacy policy | 13 sections, UK GDPR aligned |
| GDPR data rights | Self-service export (JSON) + hard deletion, live endpoints |
| Engineer-responsibility notice | Printed on every generated report |
| Cookie posture | localStorage session token only; no ad/tracking cookies |
| Registered data controller | **Buyer to establish** (ICO registration ~£40–60/yr — not currently registered) |
| Professional indemnity | Not held — software is positioned as a tool; the engineer of record retains design responsibility (disclosed in Terms §4–5) |

## 3. Security state (post-remediation, July 2026)

Full audit and remediation completed July 2026: bcrypt, hashed session
tokens, rate limiting, XSS remediation, CSP/security headers, CORS
allowlist, secrets moved out of repo. Documented in commit history.

**Disclosed items a buyer should complete on transfer:**
1. Rotate the database password and all API keys (Resend, Anthropic,
   Google OAuth client) — standard on any ownership change, and secrets
   existed in git history prior to the July 2026 remediation.
2. Purge or squash git history pre-transfer, or treat history as disclosed.
3. Shared hosting (Hostinger) is adequate for current scale; a buyer at
   company scale would likely migrate to a VPS/managed host (trivial —
   static files + PHP + MySQL dump).

## 4. Operations

- **Hosting:** Hostinger shared, auto-deploy from GitHub `main`.
- **Running cost:** hosting ~£3–10/mo; Resend free tier; optional Anthropic
  API usage-based; postcodes.io free; OSM tiles free (attribution shown).
  Total burn ≈ £5–15/month.
- **Backups:** MySQL via host tooling; code in GitHub.
- **Monitoring/analytics:** none installed (buyer decision; privacy-positive).
- **Key-person risk:** single developer. Mitigation: no framework, no build
  step, plain-JS codebase with high comment density; any web developer can
  maintain it. Solvers are pure functions readable by an engineer.

## 5. Commercial state (honest)

- **Users/revenue:** pre-launch (public launch planned ~August 2026).
  No revenue, no registered user base yet, no waitlist of material size.
- **Positioning:** currently free-for-everyone. This is an asset for
  user-base growth, not a constraint on an acquirer: the Terms (§9)
  explicitly reserve the right to change terms with 30 days' notice, so a
  buyer can introduce team/enterprise tiers over a free individual tier.
- **What is being sold:** codebase, brand, domains, deployment, and (by
  transfer time) whatever user base exists — not a revenue stream.

## 6. Known limitations (disclosed)

- Single-user accounts; no teams/roles/SSO (top enterprise ask — roadmap).
- No offline/desktop packaging; requires hosting.
- Calculators are UK-practice (Eurocode + UK NA); no other national annexes.
- First-generation Eurocodes (see VALIDATION-REGISTER standards note).
- L2/L3 independent numerical validation incomplete (register defines the
  method and references; L1 automated verification passing 15/15).
- AI assistant depends on an Anthropic API key (works without it; feature
  degrades gracefully).

## 7. Suggested transfer checklist

1. Share this pack + validation register under NDA.
2. Buyer technical review (codebase is small enough to read in a day).
3. Complete L2 validation for the calculators the buyer cares about.
4. Asset purchase agreement: code, domains, brand, GitHub repo transfer.
5. On completion: rotate all credentials, re-point deployment, ICO
   registration, buyer branding pass (white-label is a config-level change —
   logo, name and colours are centralised in CSS variables and topNav).
