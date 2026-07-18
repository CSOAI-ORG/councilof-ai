# MEOK WORLD — Design / UX Review Checklist
**Date:** 2026-06-29 (T-minus 5 days to public launch, Sat 4 Jul 09:00 BST)
**Scope:** All 128 sovereign HTML pages in `csoai-os/meok-home/pages/` + the 2 v2 apps (`v2-signup-wizard.html`, `v2-temple-os.html`) + the character-emergence page
**Reviewers:** design/UX sub-agent (this document is its runbook) + the launch team
**Goal:** Sign off each of the 50 checks below across every page **before** the 9 PM BST live test tonight.

> **How to use this file:**
> * Run `python3 -m http.server 8765 --directory /Users/nicholas/clawd/csoai-os` to boot a static preview, then open `http://localhost:8765/meok-home/pages/<page>.html` in Chrome / Safari / Firefox.
> * For each check, mark `[x]` (pass), `[~]` (pass with note), `[ ]` (failing), or `n/a`. Anything `[ ]` becomes a P0 bug report.
> * The 50 checks are organised by the 10 review axes below. Each check has: what to look for, how to verify, pass criteria.
> * Page-specific findings go in section 11 ("Findings log"). Generic findings live here.

## Summary scoreboard
| Axis | Checks | Pass | Conditional | Failing |
|------|-------:|-----:|------------:|--------:|
| 1. Visual hierarchy       |  5 | __ | __ | __ |
| 2. Typography             |  5 | __ | __ | __ |
| 3. Color                  |  5 | __ | __ | __ |
| 4. Spacing                |  5 | __ | __ | __ |
| 5. Navigation             |  5 | __ | __ | __ |
| 6. Accessibility          |  5 | __ | __ | __ |
| 7. PWA                    |  5 | __ | __ | __ |
| 8. Mobile                 |  5 | __ | __ | __ |
| 9. Error states           |  5 | __ | __ | __ |
| 10. Brand consistency     |  5 | __ | __ | __ |
| **Total**                 | **50** | **__** | **__** | **__** |

Ship gate: **0 failing** on P0/P1 axes (visual hierarchy, color, accessibility, PWA, mobile, brand consistency). P2/P3 axes (spacing, error states) can ship with **≤2 conditional** items.

---

## 1. Visual hierarchy (5 checks)

### V1. Hero headline renders at H1 with correct weight
**What:** Page title is wrapped in `<h1>`, weight ≥ 600, size ≥ 36px on desktop / ≥ 28px on mobile.
**How:** DevTools → Elements → inspect the first big text block; computed style → `font-weight`, `font-size`.
**Pass criteria:** Single H1 per page; font-weight ≥ 600; ≥ 36px desktop, ≥ 28px mobile.

### V2. Exactly one primary CTA per above-the-fold region
**What:** One visually-dominant button (filled gold, large) per fold. Secondary actions are ghost / outline buttons.
**How:** Visual scan; compute `background-color` of every button above 600px scroll. The gold-filled button should be unique.
**Pass criteria:** At most one gold-filled `#c9a84c` / `#ffd700` button above the fold.

### V3. Section anchors / sub-heads form a clear vertical rhythm
**What:** H2 / H3 cascade correctly; no level skips.
**How:** DevTools → Elements → outline view (or install "HeadingsMap" extension) → check the headings tree has no gaps.
**Pass criteria:** No `<h2>` → `<h4>` skips; H2 count ≤ 8 per page; H3 count ≤ 4 per H2 cluster.

### V4. Body content sits inside a max-width container ≤ 1280px
**What:** Reading column is bounded. Long lines of text don't run to the edges on a 1920px monitor.
**How:** DevTools → responsive design mode → 1920 viewport → inspect the `<main>` / body wrapper width.
**Pass criteria:** `max-width` ≤ 1280px AND line-length on prose ≤ 80 characters.

### V5. CTAs above-the-fold are unambiguous in their next action
**What:** When you read a CTA's text aloud, you know exactly what happens when you click it. No "Click here", no "Submit" without context.
**How:** Read every above-the-fold button aloud. Each should be a verb + object ("Start the 5-step wizard", "Open the OS", "Meet the queens").
**Pass criteria:** 100% of above-the-fold CTAs use verb+object; no generic "Click here" / "Read more".

---

## 2. Typography (5 checks)

### T1. Single font-stack across the site
**What:** All pages import the same 1-2 web fonts (e.g., Inter for body + Georgia for headings).
**How:** `grep -h "font-family" /Users/nicholas/clawd/csoai-os/meok-home/pages/*.html | sort -u` — review the result.
**Pass criteria:** ≤ 3 distinct `font-family` declarations across all pages; the headers/body split is intentional.

### T2. Body font size is 16px minimum
**What:** Default body text is at least 16px (better: 17-18px).
**How:** DevTools → Computed → `body` → `font-size`.
**Pass criteria:** ≥ 16px. Pages with < 16px default body are remediated with a `font-size: 16px` baseline.

### T3. Line-height for prose is ≥ 1.5
**What:** Body paragraphs and long-form text have generous leading.
**How:** DevTools → Computed → `p` → `line-height`. Numeric ≥ 1.5 is the gold standard.
**Pass criteria:** `line-height` numeric ≥ 1.5 for paragraph text.

### T4. Heading line-height is tight (1.1–1.25)
**What:** H1/H2/H3 sit tightly on themselves for impact.
**How:** DevTools → H1/H2/H3 → `line-height`.
**Pass criteria:** Headings have `line-height` between 1.1 and 1.25 inclusive.

### T5. No text inside raster images
**What:** Body copy and CTAs are real DOM text (selectable, searchable, screen-reader friendly). Images are decorative.
**How:** View source on every page; flag any text-embedded PNGs that should have been HTML.
**Pass criteria:** No critical CTAs rendered as rasterised text; only decorative / hero backgrounds are image-based.

---

## 3. Color (5 checks)

### C1. Exactly one accent per page
**What:** Gold `#ffd700` / `#c9a84c` is the only "look-at-me" color. No second accent competes.
**How:** `grep -c "#ff" /Users/nicholas/clawd/csoai-os/meok-home/pages/*.html` — review color usage.
**Pass criteria:** At most 2 saturated colors (gold + 1 brand secondary); background uses neutrals only.

### C2. Contrast ratio for body text ≥ 4.5:1 (WCAG AA)
**What:** Body text against background passes AA contrast. Large text (≥ 18pt / 14pt-bold) passes 3:1.
**How:** Chrome DevTools → Inspect → "Accessibility" pane → contrast ratio; or use https://webaim.org/resources/contrastchecker/.
**Pass criteria:** All body text ≥ 4.5:1; large headings ≥ 3:1; no fails.

### C3. The 7 archetype colors are stable across pages
**What:** Sovereign `#6ba8d4`, Guardian `#1a3a5a`, Scout `#d47a5a`, Strategist `#2a5a3a`, Creator `#d4a55a`, Companion `#5aa89a`, Sage `#d4c45a` — the same hex codes appear wherever an archetype is labelled.
**How:** `grep -E "#6ba8d4|#1a3a5a|#d47a5a|#2a5a3a|#d4a55a|#5aa89a|#d4c45a" /Users/nicholas/clawd/csoai-os/meok-home/pages/*.html | wc -l` — count the occurrences. Then visually spot-check on `/csoai-os/meok-character-emergence.html`.
**Pass criteria:** All 7 colors present; no near-duplicate colors (e.g., `#6ba8d5` vs `#6ba8d4`).

### C4. Dark background reads as #08060c, not pure black
**What:** Background is the MEOK deep-purple, not `#000`. Avatar and SIC pages should feel "sovereign", not "void".
**How:** DevTools → body → `background-color`.
**Pass criteria:** `background-color` is `#08060c` or `#0c0a14` or similar warm-tinted dark.

### C5. Gold accent is consistent (gold-bright `#ffd700` for accents; gold `#c9a84c` for buttons)
**What:** Borders, glows, focus rings use `#ffd700`; primary buttons use `#c9a84c`.
**How:** DevTools → Spot-check 3 buttons; spot-check 3 borders.
**Pass criteria:** Two gold tokens maintained; no mixing within a page.

---

## 4. Spacing (5 checks)

### S1. Vertical rhythm uses an 8px baseline
**What:** All `padding` and `margin` values are multiples of 8 (8, 16, 24, 32, 48, 64).
**How:** DevTools → Computed → see all `padding-top/bottom`, `margin-top/bottom` for the 5 main wrappers.
**Pass criteria:** ≥ 90% of values are multiples of 8 (allow 4px fine-tuning for icons/borders).

### S2. CTAs have ≥ 48px touch target
**What:** Buttons and links meet the WCAG 2.5.5 minimum (48px on either dimension).
**How:** DevTools → button → `getBoundingClientRect()`.
**Pass criteria:** Every interactive button ≥ 48px × 48px.

### S3. Section padding ≥ 64px desktop, ≥ 40px mobile
**What:** Major sections breathe — not crammed.
**How:** DevTools responsive mode → toggle 1280 / 375 viewports → measure top/bottom padding on `<section>` elements.
**Pass criteria:** Desktop ≥ 64px, mobile ≥ 40px.

### S4. Body text has side margins ≥ 24px on mobile
**What:** Reading column doesn't kiss the viewport edge.
**How:** Mobile responsive mode → 375px viewport → inspect first paragraph's left/right margin.
**Pass criteria:** ≥ 24px on each side.

### S5. Card / "panel" components use consistent inner padding (24px or 32px)
**What:** Cards / panels feel like one product, not five.
**How:** Compare 5 different cards on the page; measure `padding`.
**Pass criteria:** Standard deviation of card padding < 8px.

---

## 5. Navigation (5 checks)

### N1. Top-nav has the 6 sovereign destinations
**What:** Home / OS / Council / Temples / Council / Sovereign / Create / Sign in — reachable from every page.
**How:** Inspect the top nav on 5 different pages. Compare.
**Pass criteria:** Same 6 destinations, same order, same labels across all sampled pages.

### N2. Footer has 4 columns + a SIGIL breadcrumb
**What:** Footer sections (Product, Resources, Company, Legal) + the live SIGIL digest.
**How:** Inspect the bottom of any page.
**Pass criteria:** ≥ 4 footer columns; at least one live "SOV3 SIGIL chain" indicator.

### N3. Every link / button has a non-empty, descriptive `aria-label` or visible text
**What:** Accessibility + clarity — no "Click here", no empty buttons, no icon-only buttons without labels.
**How:** `grep -E 'aria-label=""' /Users/nicholas/clawd/csoai-os/meok-home/pages/*.html` — review.
**Pass criteria:** Every `<button>` has either text content or a meaningful `aria-label`; every `<a>` has either visible text or `aria-label`.

### N4. Browser back button works on wizard steps
**What:** The 5-step wizard doesn't trap the user. Back is reversible.
**How:** Walk step 0 → 1 → 2 → 3, then click browser back; ensure previous step renders without loss.
**Pass criteria:** State persists correctly across back-navigation; no console errors.

### N5. The "OS" entry-point is reachable within 1 click from any landing page
**What:** OS is the heart of MEOK WORLD. Every page must have a clear path to it.
**How:** Click test on 10 random pages.
**Pass criteria:** 100% of pages have a top-nav OR page-level CTA pointing to `v2-temple-os.html` / `/`.

---

## 6. Accessibility (5 checks)

### A1. `lang="en-GB"` is set on `<html>`
**What:** Language declared so screen readers pick the right voice profile.
**How:** DevTools → `<html>` tag → first attribute.
**Pass criteria:** Every page has `<html lang="en-GB">`.

### A2. All images have meaningful `alt`
**What:** Decorative images use `alt=""`; informational images have descriptive alt.
**How:** DevTools → Lighthouse → "Accessibility" tab — run audit, review the alt-text findings.
**Pass criteria:** Lighthouse "alt text" warning = 0.

### A3. Forms have associated `<label>` elements
**What:** Every input has either a wrapping label, a `for` attribute, or an `aria-labelledby`.
**How:** Submit the v2-signup-wizard.html with Lighthouse / WAVE; review label findings.
**Pass criteria:** 0 form controls without labels.

### A4. Focus ring is visible on every interactive element
**What:** Keyboard-only users can see where they are.
**How:** Tab through any page; verify a gold-toned outline appears on focus.
**Pass criteria:** Focus outline has ≥ 2px stroke and ≥ 3:1 contrast against background.

### A5. Color is never the only signal
**What:** Errors, success, warnings use icon + text + color (not just color).
**How:** Trigger a form error in the wizard; verify message is announced (icon + text) not just a red border.
**Pass criteria:** Validation messages contain visible text AND an icon/role; not just a colored field.

---

## 7. PWA (5 checks)

### P1. Manifest is served with `application/manifest+json` content-type
**What:** Caches register the manifest correctly when the MIME type matches.
**How:** `curl -I https://meok.ai/manifest.webmanifest` — review `content-type`.
**Pass criteria:** `content-type: application/manifest+json` (or `application/manifest+json`).

### P2. Service worker registers without console errors
**What:** `sw.js` installs and activates on first visit.
**How:** Open https://meok.ai in Chrome → DevTools → Application → Service Workers → verify status "activated and running".
**Pass criteria:** Status activated, no "install error", scope = `/`.

### P3. Shell URLs are pre-cached (install event)
**What:** On install, the SW calls `cache.addAll([...])` for `/`, `v2-temple-os.html`, `v2-signup-wizard.html`, `/manifest.webmanifest`, both icon SVGs.
**How:** DevTools → Application → Cache Storage → inspect "meok-shell-v1" — confirm all 6 URLs are cached.
**Pass criteria:** All shell URLs present in `meok-shell-v1` cache immediately after install.

### P4. App is installable (Add to Home Screen appears)
**What:** Chrome's install prompt fires when the manifest + SW + HTTPS all check out.
**How:** Visit in Chrome → wait 30s → install icon should appear in the URL bar.
**Pass criteria:** Chrome install icon visible; `beforeinstallprompt` event fires (check `window.matchMedia('(display-mode: standalone)').matches`).

### P5. Offline mode loads the OS shell
**What:** Disconnect from network → refresh → shell still loads.
**How:** DevTools → Network → "Offline" → navigate to `/csoai-os/v2-temple-os.html` directly.
**Pass criteria:** Page renders from cache; visual is intact (icons fallback, fonts fallback).

---

## 8. Mobile (5 checks)

### M1. Viewport meta tag is present and correct
**What:** `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`.
**How:** View source → check `<head>`.
**Pass criteria:** All pages have the viewport meta tag with `width=device-width` and `initial-scale=1`.

### M2. Layout works at 375px width (iPhone SE)
**What:** No horizontal scroll, no overflowing elements, readable text.
**How:** DevTools responsive → 375 × 667 → inspect every fold.
**Pass criteria:** No horizontal scrollbar; no elements bleed off-screen; CTAs are finger-sized (44px+).

### M3. Tap targets are spaced ≥ 8px apart
**What:** Adjacent buttons don't fight each other for taps.
**How:** DevTools → measure the `padding-top` + `padding-bottom` between stacked buttons; for side-by-side buttons, measure the gap.
**Pass criteria:** ≥ 8px between any two tap targets; recommended 12-16px.

### M4. Forms auto-zoom correctly on iOS
**What:** Tap a text input → viewport zooms to ≥ 16px input. (Inputs < 16px force zoom on iOS, which is a UX disaster.)
**How:** DevTools → mobile emulation → click into an input → verify no auto-zoom / shake.
**Pass criteria:** All inputs have `font-size: 16px` or larger.

### M5. The wizard is one-handed usable
**What:** On iPhone, completing the wizard should require no horizontal motion. Back / Next are reachable by thumb.
**How:** Physical / virtual phone test.
**Pass criteria:** Every wizard action reachable in the bottom 60% of the viewport; primary CTAs within thumb arc.

---

## 9. Error states (5 checks)

### E1. Network-failure path renders cleanly
**What:** When the backend is down, the UI shows a friendly fallback — not a stack trace.
**How:** DevTools → Network → "Offline" → reload.
**Pass criteria:** Visible fallback ("Council is briefly unavailable — try again in a moment"); no white screen of death.

### E2. Form validation messages are specific
**What:** "Email is required" not "Invalid input".
**How:** Submit the wizard with name empty.
**Pass criteria:** Specific message references the offending field by name and tells the user what to do.

### E3. 404 page is on-brand
**What:** Hitting `/anything-bogus` lands on a MEOK-branded 404.
**How:** `curl -I https://meok.ai/totally-not-real` or navigate to a missing page.
**Pass criteria:** 404 has the MEOK nav, a 404 glyph, and a CTA back to `/`.

### E4. Long-running actions show a spinner / progress
**What:** Council votes, cascade routes, RAG calls take <2s — but if they exceed 800ms show feedback.
**How:** Slow down network to 3G in DevTools, click an action, watch for spinner.
**Pass criteria:** Spinner / shimmer visible within 200ms of action; resolves with content (success or graceful error).

### E5. SIGIL chain failures don't break user flows
**What:** If SIGIL emission fails (disk full, etc), user-facing actions still succeed; SIGIL failure is logged, not thrown.
**How:** Check the backend exception handler + try one `/api/ichar/create` with the chain file read-only.
**Pass criteria:** Action returns 201 even when SIGIL append fails; warning logged; UI shows success.

---

## 10. Brand consistency (5 checks)

### B1. "MEOK" wordmark is consistent — all caps, gold accent on the "O"
**What:** The official wordmark has the O tinted gold. Variations break brand.
**How:** Snapshot the 5 highest-traffic pages and compare wordmarks.
**Pass criteria:** Same wordmark treatment in 100% of pages.

### B2. The 4-tier cascade icons (L0 / L1 / L2 / L3 / L4) appear consistently
**What:** Edge → Fog → Cloud → Sovereign is a visual signature.
**How:** Spot-check `/csoai-os/meok-home/pages/cascade.html` (or equivalent) + the OS page.
**Pass criteria:** 4-tier cascade graphic appears with the same iconography on every page that references it.

### B3. The 13-Queen + King council is depicted with the 13 personas
**What:** Not "many avatars", but 13 named queens + 1 king = 14.
**How:** Snapshot `characters.html` + `/csoai-os/meok-home/pages/council.html`.
**Pass criteria:** 13 distinct queens + 1 king visually identifiable.

### B4. The 7 archetype colors appear together (one canvas)
**What:** A single visual that shows all 7 archetypes at once.
**How:** `/csoai-os/meok-home/meok-character-emergence.html` (or the archetypes section of any landing page).
**Pass criteria:** One painting, all 7 colors, all 7 names on the same canvas.

### B5. "Sovereign AI" is the consistent tagline
**What:** No competing taglines like "Trustworthy AI" or "Safe AI" — only "Sovereign AI".
**How:** `grep -rE "Trustworthy AI|Safe AI|Responsible AI|Trustable" /Users/nicholas/clawd/csoai-os/meok-home/pages/` — review.
**Pass criteria:** Zero pages opt out of "Sovereign AI" as the primary tagline.

---

## 11. Findings log
> Append-only log. Format:
> ```
> ### [HH:MM] <page> — <axis><#>
> <one-line observation>
> <link to screenshot or source pointer>
> ```

<!-- newest at top -->

(populated during the 9 PM review)

---

## 12. Launch checklist (linked runbook)

Once **all 50 checks** are complete and the scoreboard reads ≥ 47/50 pass / ≤ 3 conditional / 0 failing P0/P1, run:

1. `~/clawd/meok-e2e/tests/test_integration.py` (TASK 2 above) — must pass
2. `~/clawd/meok-backend/smoke.sh` — 5/5 live flows
3. `~/clawd/9PM_TEST_RUNBOOK.md` — execute the 9 PM protocol (TASK 5 below)

Ready for SAT 4 JUL 09:00 BST.

🜏 **127 / 128 done, last one is sovereign.**
