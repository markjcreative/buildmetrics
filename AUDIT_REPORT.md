# BuildMetrics Full Site Audit Report

**Date:** 2026-05-22  
**Auditor:** Claude Code (Sonnet 4.6)  
**Scope:** Full codebase — HTML, JS engines, CSS, PHP API, auth, nav, save/load flow

---

## Executive Summary

The site is structurally sound. All 14 calc pages exist with correct script includes, the 5 new calculators (BBS, Section Properties, Steel Member, Wind Loading, Load Takedown) are properly wired, the design register contains all calc types, and the PHP API layer is correctly structured. 

**7 bugs were found and fixed.** The most critical was a JavaScript Temporal Dead Zone (TDZ) error in `steel-member.html` that would crash the Results table render on every calculation. All other bugs were the same class of error: async `saveAndConfirm()` called without `await`, meaning the modal would always close before confirming whether the save succeeded.

**Overall health score: 8.5 / 10** (good architecture, 7 fixable bugs found and patched)

---

## Issues Found and Fixed

### CRITICAL

#### 1. `calcs/steel-member.html` — TDZ: `sectionClass` used before `const` declaration
- **Line (before fix):** 516 used `sectionClass` in a ternary; `const sectionClass = r.sectionClass` was not declared until line 538
- **Effect:** `ReferenceError: Cannot access 'sectionClass' before initialization` thrown every time the user clicks Calculate — the results table never renders
- **Fix:** Moved `const sectionClass = r.sectionClass;` to the top of `renderTable()`, before the `rows` array is built. Removed the duplicate declaration at line 538.

---

### HIGH — Save flow broken on 6 older calc pages

All 6 affected pages call `CalcShared.saveAndConfirm()` (which is `async` and returns a `Promise`) without `await`. The `if (ok) { close modal }` block always evaluated to `true` immediately (a Promise is truthy), so the modal closed instantly — before the API call completed. If the save failed (e.g. no project selected, network error), the modal would still close with no error visible and the user assumed their work was saved.

| File | Severity | Fix Applied |
|---|---|---|
| `calcs/beam.html` — `doSave()` | HIGH | Added `async`, replaced `if (CalcShared.saveAndConfirm(...))` with `const ok = await CalcShared.saveAndConfirm(...)` |
| `calcs/column.html` — `doSave()` | HIGH | Same fix |
| `calcs/rc-beam.html` — `doSave()` | HIGH | Same fix |
| `calcs/slab.html` — `doSave()` | HIGH | Same fix |
| `calcs/timber-column.html` — `doSave()` | HIGH | Same fix |
| `calcs/concrete-column.html` — `doSave()` | HIGH | Same fix |

**Note:** The 5 new calc pages (bbs, section-properties, steel-member, wind-loading, load-takedown) correctly used `CalcShared.initSaveModal()` which internally awaits — they are not affected.

---

## Items Verified as Correct

### Script includes
Every calc page includes, in order:
1. `/js/auth/auth.js`
2. `/js/projects/projects.js`
3. `/js/projects/history.js`
4. `/js/subscription/plans.js`
5. `/js/ui/topNav.js`
6. Engine-specific solver (e.g. `/js/engine/bbsSolver.js`)
7. `/js/ui/calcShared.js`
8. jsPDF CDN
9. `/js/report/wordExport.js`
10. `/js/report/calcReport.js`

No missing or incorrect paths found.

### Solver exports
All 5 new solvers export correctly to `window`:
- `window.BBSSolver` — BBS solver (bs 8666:2020) — CORRECT
- `window.SectionSolver` — Section properties — CORRECT
- `window.SteelMemberSolver` — EC3 steel member — CORRECT (note: uses `window.SteelMemberSolver = (() => { ... })()` pattern)
- `window.WindSolver` — EC1 wind loading — CORRECT
- `window.LoadTakedownSolver` — Load takedown — CORRECT

All solvers return at minimum `{ pass, summary }` compatible data. BBS, Section Properties, and Load Takedown correctly return no `pass` field (the design register shows `—` for these calc types, which is correct behaviour).

### Solver `solve()` return values — design register compatibility
- `BBSSolver.solve()` → `{ bars, totals }` → design register shows `—` status (correct)
- `SectionSolver.solve()` → no `pass` field → design register shows `—` (correct)
- `SteelMemberSolver.solve()` → `{ pass: bool, ... }` → design register shows PASS/FAIL (correct)
- `WindSolver.solve()` → `{ pass: true, ... }` → design register shows PASS (correct — wind calc is informational, always outputs a valid result)
- `LoadTakedownSolver.solve()` → no `pass` field → design register shows `—` (correct)

### CalcShared utility
All functions used across calc pages are present and exported:
`showToast`, `saveCalc`, `saveAndConfirm`, `renderProjectBadge`, `initSaveModal`, `openSaveModal`, `loadFromUrl`, `loadTemplateFromUrl`, `passBadge`, `fmt`, `escHtml`

### Design register (`calcs/design-register.html`)
`CALC_TYPE_LABELS` and `CALC_URLS` both contain all 14 calc types:
`beam`, `rc-beam`, `column`, `timber-column`, `concrete-column`, `slab`, `footing`, `retaining-wall`, `connection`, `bbs`, `section-properties`, `steel-member`, `wind-loading`, `load-takedown`

### Authentication
- `Auth.guard()` is called on all protected pages
- `TopNav.init()` also redirects to `/login` if no user — double-guard is harmless
- Auth API endpoint is `/api/bm-auth.php` — file exists and handles all required actions (`register`, `login`, `google`, `logout`, `me`, `update`)
- Login page (`/login/index.html`) correctly calls `Auth.login()` and redirects to `/dashboard`

### `.htaccess` clean URL routing
Clean URL rewrites are configured: `/dashboard` → `dashboard.html`, `/login` → `login/index.html` (via DirectoryIndex). Auth redirects that use clean URLs (`/login`, `/dashboard`) work correctly.

### CSS
All CSS classes referenced in calc pages exist:
- Layout: `calc-layout`, `calc-panels`, `calc-breadcrumb-bar`, `calc-action-bar` — in `css/app.css`
- Results: `calc-badges`, `calc-badge`, `calc-results-card`, `calc-results-table`, `calc-diagram-card`, `calc-welcome` — in `css/calcs.css`
- UI: `bm-toast`, `bm-pass`, `bm-fail`, `calc-modal-overlay`, `calc-modal-box` — in `css/app.css` / `css/calcs.css`
- TopNav: `header-inner`, `header-nav`, `header-right`, `hn-active`, `mobile-drawer`, `mnd-*` — in `css/app.css`

### TopNav
- Included on all app pages
- `TopNav.init()` called on every protected page (DOMContentLoaded)
- Dynamically loads `notifications.js` and `aiChat.js` if not already present
- Mobile drawer built correctly with all 19 nav links including all 5 new calc pages

### API layer
- `/api/bm-auth.php` — auth (register, login, google, logout, me, update)
- `/api/calculations.php` — save, list, update, delete calculations
- `/api/projects.php` — CRUD projects
- `/api/ai-chat.php` — AI assistant (key loaded from `config.php`)
- `/api/send-email.php` — transactional emails

All files exist and are referenced correctly from JavaScript.

### Projects page modals
`projects.html` has the rename modal (`modal-rename-project`) and delete confirmation modal (`modal-delete-project`) correctly wired to `Projects.update()` and `Projects.remove()`.

### Save / load flow
`loadFromUrl()` in `CalcShared` correctly reads `?load=<uuid>` from the URL, fetches from `CalcHistory.getAll()`, and calls the restore function with `(inputs, results)`. The `?load` param is then stripped from the URL with `history.replaceState`.

---

## Items Needing Manual Attention (Server-Side)

1. **`api/config.php` must be uploaded to Hostinger manually** — this file is in `.gitignore` and contains the OpenAI API key. The AI assistant will not work until this file is present at `/public_html/buildmetrics_app/api/config.php`. See the most recent commit message for details.

2. **MySQL schema** — verify the `calculations` table has all required columns (`id`, `user_id`, `project_id`, `calc_type`, `name`, `inputs`, `results`, `created_at`, `updated_at`). The schema is defined in `api/schema.sql`.

3. **Google OAuth** — the Google Client ID `440038191618-...` must have `https://app.buildmetrics.uk` added as an authorised JavaScript origin and redirect URI in Google Cloud Console.

4. **`vercel.json`** — this file exists in the repo root but the app is deployed to Hostinger, not Vercel. The `cleanUrls: true` setting has no effect on Hostinger (clean URLs are handled by `.htaccess`). This file can be left or removed — it causes no harm.

---

## Summary Table

| Category | Status | Notes |
|---|---|---|
| Script includes on all 14 calc pages | PASS | All correct, no missing files |
| Solver exports (5 new calcs) | PASS | All export to `window.*` correctly |
| TopNav wiring | PASS | All pages call `TopNav.init()` |
| Auth guard | PASS | All protected pages guarded |
| Design register calc types | PASS | All 14 types in LABELS + URLS maps |
| Save flow (async await) | FIXED | 6 pages had missing `await` on `doSave()` |
| steel-member.html TDZ crash | FIXED | `sectionClass` moved before first use |
| CSS completeness | PASS | All referenced classes exist |
| API files exist | PASS | All PHP endpoints present |
| loadFromUrl / ?load= flow | PASS | Correctly wired on all 14 pages |
| Login / register pages | PASS | Both correct |
| Projects rename/delete modals | PASS | Correctly wired |

---

*Report generated by Claude Code — BuildMetrics Full Audit 2026-05-22*
