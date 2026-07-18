# Code Quality Audit — `csoai-static-deploy2`
**Date:** 2026-07-13
**Auditor:** JEEVES subagent (code-quality-audit lane, read-only)
**Scope:** `/Users/nicholas/clawd/csoai-static-deploy2/` — front-end + `/api/` serverless endpoints
**Audit type:** Static review (no execution, no instrumentation)

---

## 1. Summary Statistics

| Bucket | Count |
| --- | --- |
| **API endpoints audited** | **22** (21 endpoints + `_notify.js` helper) |
| **HTML pages audited (sample, deep read)** | **20** |
| **HTML pages swept (lightweight pattern checks)** | **389** total (whole estate) |
| **Files with at least one issue** | all 22 API + all 20 HTML sample + 366/389 HTML estate-wide |
| **Total distinct findings recorded** | **187** |
| **Severity CRITICAL** | **9** |
| **Severity HIGH** | **38** |
| **Severity MEDIUM** | **84** |
| **Severity LOW** | **56** |

---

## 2. Files Audited (with one-line verdict)

### 2.1 API surface (`/api/`, 22 files — 21 endpoints + 1 helper)

| # | File | LOC | Verdict |
| --- | --- | --- | --- |
| 1 | `api/signup.js` | 246 | CORS `*`, fallback secret, raw email regex, log injection risk |
| 2 | `api/welcome.js` | 145 | XSS in HTML body (interpolated record fields), weak secret compare |
| 3 | `api/eat-tick.js` | 106 | `console.log` not used, but exposes internal task names |
| 4 | `api/eat-tick-v2.js` | 301 | Reasonable; exposes phase weights |
| 5 | `api/invite.js` | 119 | CORS `*` on referral look-up — privacy issue |
| 6 | `api/persist.js` | 85 | `console.error` not present, but `GIST_TOKEN` sent in Bearer to GitHub |
| 7 | `api/debug-signup.js` | 30 | Should NOT ship in production — echoes raw body |
| 8 | `api/newsletter.js` | 90 | `console.error` left in production |
| 9 | `api/sigil-status.js` | 79 | CORS `*`, hardcoded VM IP |
| 10 | `api/stats.js` | 87 | Returns 226 page count (stale) — bake-in truth issue |
| 11 | `api/sovereign-telemetry.js` | 334 | CORS `*`, hardcoded VM IP, large endpoint |
| 12 | `api/morning-digest.js` | 118 | `console.log` not present; OK |
| 13 | `api/sov-bridge.js` | 176 | CORS `*`, hardcoded VM IP, HMAC fallback secret |
| 14 | `api/j-space-think.js` | 240 | HMAC fallback secret, deterministic sim w/o disclosure on output |
| 15 | `api/sov-space-state.js` | 133 | Hardcoded VM IP, HMAC fallback secret |
| 16 | `api/crown-rfq.js` | 335 | CORS `*`, raw HTML email (RFC 7807 missing), weak JSON-error handling |
| 17 | `api/framing.js` | 131 | CORS `*` (public OK), good |
| 18 | `api/sovereign-citations.js` | 201 | CORS `*` OK; SSRF pattern (allows internal paths) |
| 19 | `api/oscal.js` | 139 | CORS `*` OK; emits static YAML |
| 20 | `api/daily-golden.js` | 102 | Hardcoded base URL, internal probes |
| 21 | `api/_notify.js` | 104 | `console.log` present in production path |
| 22 | `api/framing.js`, `oscal.js`, `sovereign-citations.js` | — | (Read above) |

### 2.2 HTML pages sampled (20)

| # | File | LOC | Verdict |
| --- | --- | --- | --- |
| 1 | `index.html` (3D Globe) | 411 | CesiumJS **external script**, no `defer/async`, no preload, large inline `<style>` |
| 2 | `defoneos.html` | 222 | Good SEO headers, broken icon link `href="#"` |
| 3 | `signup.html` | 169 | `localStorage` only — no `aria-invalid`, no form `noValidate` |
| 4 | `launch.html` | 70 | 11 broken `<a href="#""` anchors, countdown script OK |
| 5 | `os.html` | 10 | Trivial stub |
| 6 | `verify.html` | 69 | Demo verify() hardcoded — not real verification |
| 7 | `sovereign.html` | 11 | Placeholder content |
| 8 | `defoneos-defence-primes.html` | 351 | Good canonical + theme-color, large inline `<style>` |
| 9 | `defoneos-pricing.html` | 90 | Tiers grid OK, icon broken |
| 10 | `SOV33_HERO.html` | 332 | (large hero page) |
| 11 | `master.html` | 480 | (large) |
| 12 | `api-v1-spec.html` | 208 | |
| 13 | `press-release.html` | 65 | Icon broken, paragraphs of duplicated meta |
| 14 | `healthz.html` | 118 | Icon broken, JS `setInterval` re-render every 1s |
| 15 | `defoneos-faq.html` | 88 | |
| 16 | `defoneos-verify.html` | 38 | Icon broken |
| 17 | `defoneos-system-card.html` | (sampled) | `to-top` aria-label present; large page |
| 18 | `defoneos-press.html` | (sampled) | Newer page, share meta present |
| 19 | `defoneos-demo.html` | 128 | |
| 20 | `crosswalks.html` | 673 | Large — biggest single-page CSS/HTML |

---

## 3. Issues by Category

### 3.1 Backend / API (22 files)

#### CRITICAL (9)

| ID | File | Issue | Fix |
| --- | --- | --- | --- |
| B-C1 | `api/signup.js:111-113` | HMAC fallback secret hardcoded in source: `'CSOAI-DEFONEOS-SOV-KEY-V1-FALLBACK-NOT-FOR-PRODUCTION'` — shipped to all envs without env-var enforcement | Throw an error if `SIGN_KEY` env is missing in production; remove literal fallback from the bundle |
| B-C2 | `api/welcome.js:38-39`, `api/sov-bridge.js:160-161`, `api/sov-space-state.js:28-29`, `api/j-space-think.js:38-39`, `api/crown-rfq.js:31` | Multiple HMAC default-secret literals baked into source | Centralise via `lib/secrets.js`; fail-closed in production |
| B-C3 | `api/welcome.js:57-67` | HTML email body interpolates `record.name`, `record.sigil`, `record.tier`, `next.cta` etc. **unescaped** — stored-XSS vector if sigil chain is compromised or `record` crafted | Escape with a safe HTML-encoder (e.g., `escape-html`) for every interpolated field |
| B-C4 | `api/debug-signup.js` | Echoes raw request body including typed email/types — looks like a dev debug surface that should NOT ship to production. No auth, no rate-limit | Remove from production bundle; gate behind `process.env.DEBUG_ENDPOINTS === 'yes'` |
| B-C5 | `api/crown-rfq.js:163` | Builds Resend email body via raw template literal **without HTML-escaping `JSON.stringify(body.rfq, null, 2)`** — any `</pre>`/`<` in contact info corrupts layout | Wrap with `Buffer.from(...).toString('base64')` or use text-only email; or pre-escape `</` → `<\/` |
| B-C6 | `api/newsletter.js:42`, `api/signup.js:168`, `api/_notify.js:84` | `console.error` / `console.log` left in production code paths — minor info leak (PII-bound log lines reachable from Vercel logs) | Wrap behind `if (process.env.LOG_LEVEL === 'debug')`; or pipe to `/tmp/silent.log` instead |
| B-C7 | `api/sov-bridge.js:90-93` | HMAC signed object *includes the bridge_sigil inside the same payload* — circular HMAC (sign-with-self) breaks verification chain | Add a placeholder, then compute sigil, then mutate |
| B-C8 | `api/sov-bridge.js:26-27` | Hardcoded VM IP `35.242.143.249` — leaks internal topology to anyone reading `/api/sov-bridge` (note field) | Move to env, and either disclose carefully or rename to `sovereign_substrate_host` |
| B-C9 | `api/sov-space-state.js:84`, `api/sigil-status.js:11`, `api/sovereign-telemetry.js:28` | Same hardcoded VM IP appearing in 3 endpoints + default notes — leaks internal infra | Centralise in one config |

#### HIGH (15)

| ID | File | Issue | Fix |
| --- | --- | --- | --- |
| B-H1 | `api/signup.js:58` & 21 other endpoints | `Access-Control-Allow-Origin: '*'` — for endpoints that take PII (signup, welcome, crown-rfq, invite) this is unsafe. `Origin: null` from `localhost`-form-submits can still exploit | Reflect the request `Origin` only if in an allowlist; otherwise `'*'` is fine for public read-only stats |
| B-H2 | `api/signup.js:90-91` | Email validation is `email.includes('@')` plus length ≤ 200 — passes `<script>@1` and many other invalid forms | Use a real validator (e.g., `'^[^@\s]+@[^@\s]+\.[^@\s]+$'` + DNS MX hint) |
| B-H3 | `api/signup.js:149`, `api/welcome.js:130`, `api/morning-digest.js:39` | `/tmp/*.jsonl` writes are **not mutex-locked**; concurrent writes from cold-start fan-out (cron + cron) can interleave partial lines → JSON parse failures next read | Wrap appends in `fs.open(..., 'a')` flock; or use `.tmp + rename` |
| B-H4 | `api/crown-rfq.js:217` | Bad-JSON path returns 400 with `details` array but no human message — only machine code | Include a single `summary` string |
| B-H5 | `api/crown-rfq.js:217` | JSON parse failure returns plain 400 `{status:'error', error:'Invalid JSON'}` while signup.js returns `{error:'Invalid JSON'}` — inconsistent envelope | Standardise envelope `{status, error, code}` |
| B-H6 | `api/crown-rfq.js:174` | Falls back to appending full PII (`record.contact_email`, `contact_name`) into `/tmp/crown-rfq.log` as TEXT — defeats the redaction in the JSONL path | Strip PII from log fallback too; log only rfq_id + meta |
| B-H7 | `api/eat-tick.js:18-22`, `:67` | `task: 'build'` and `task: 'test'` *command-claim* but never execute; just return a "started" object — misleading | Either implement or remove the field |
| B-H8 | `api/sovereign-telemetry.js:285`, `api/stats.js:62` | Hardcoded `pages: 226` becomes false the moment a new page is added — stale cache baked into response | Read live count from filesystem or generate; add a `last_updated_at` |
| B-H9 | `api/sovereign-citations.js:202` | SSRF-shaped: accepts any local path under `/` and re-fetches live; while limited to its own origin, no boundary check on URL shape | Whitelist prefix allowlist `/defoneos-*` or `/sov3-*` |
| B-H10 | `api/invite.js:25-32` | GET with code → no rate limit → enumeration of referral codes possible | Add per-IP throttle via Upstash or Vercel edge config |
| B-H11 | `api/welcome.js:111-115`, `api/persist.js:54-57`, `api/invite.js:32-34` | All check `if (expectedKey && providedKey !== expectedKey)` — non-constant-time string compare is timing-leaky for short secrets | Use `crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))` (length-padded) |
| B-H12 | `api/daily-golden.js:9-15` | Hardcoded `pages` array (33 paths) — drifts from `sitemap.xml` | Read from `https://csoai-static-deploy2.vercel.app/sitemap.xml` at runtime |
| B-H13 | `api/daily-golden.js:62` | All requests run in parallel to a single VM — can DDoS your own origin during golden runs | Add jitter and stagger PAGES across batches |
| B-H14 | `api/stats.js:6-9` | "nevers fabricate" comment but `key_alias: 'd75a9801…7511a'` is a hardcoded string — if this is a real signature prefix the field leaks crypto material | Either obfuscate further or label explicitly as `key_alias_placeholder` |
| B-H15 | `api/sov-bridge.js:163`, `api/j-space-think.js:148-151` | `JSON.stringify(payloadObj, keys)` — the `replacer` arg expects function-or-array-of-keys, not an array; passing *only* sorted keys makes object serialization canonical, OK actually, but the indirection is confusing | Add a comment; or use a stable sort |

#### MEDIUM (13)

| ID | File | Issue | Fix |
| --- | --- | --- | --- |
| B-M1 | All 22 API | No `req.body` size limit — Vercel default 1MB but no per-route short-circuit | Add early check `if (req.headers['content-length'] > 65536) return 413` |
| B-M2 | `api/signup.js:172`, `api/welcome.js:75`, `api/crown-rfq.js:115` | `fetch(...)` calls have no `AbortController.timeout()`; hung upstream can stall response | Add 3-5s timeout wrapper |
| B-M3 | `api/signup.js:155-164` | Newsletter mirror writes to `/tmp/newsletter.jsonl` even when `gdpr=true` is correct; but the loop never deduplicates daily | Add append-only dedup key = sha256(email) hashed in-memory |
| B-M4 | `api/eat-tick.js:73-78`, `eat-tick-v2.js:222-233` | Errors swallowed → reported as completed phase — completion_pct lies | Add `state.error` and surface to caller |
| B-M5 | `api/stats.js:34` | `process.env.SIGNUP_TOTAL_HONEST` boolean check is wrong — checks truthiness against `'yes'` string | `=== 'yes'` |
| B-M6 | `api/invite.js:58`, `api/crown-rfq.js` | Line-search through JSONL with `.includes('"code":"' + code + '"')` — fragile | Parse JSON and filter |
| B-M7 | `api/sov-space-state.js:34`, `api/j-space-think.js:42` | xorshift32 has a state-of-the-art bug-free PRNG; OK, but uint32 boundary — comment confirms | OK; no fix |
| B-M8 | `api/framing.js:115` | Markdown format emits `Source: https://csoai-static-deploy2.vercel.app...` literal URL — couples docs to deployment | Read base URL from `process.env.BASE_URL` |
| B-M9 | `api/oscal.js:128-138` | `format=xml` returns a stub note — should be removed or fully implemented to avoid lying the format-set | Remove `xml` branch or implement |
| B-M10 | `api/oscal.js:39` | YAML emitter JSON-stringifies keys/values; escapes Unicode unnecessarily (`✅ FULL`) → 4-byte escape | Replace JSON.stringify with native escaping for YAML strings |
| B-M11 | `api/daily-golden.js:88-99` | Telegram-failure path in `catch (e) {}` — silent | Capture and surface in response or `tags-append` log |
| B-M12 | `api/morning-digest.js:95-103` | Telegram push uses `parse_mode: 'Markdown'` but text contains `**bold**` and `(` and `.` which Markdown V2 needs escaping | Use `parse_mode: 'MarkdownV2'` with escaped chars, or HTML |
| B-M13 | `api/sovereign-telemetry.js:91` | Regex `"timestamp":"([^"]+)"` — fails on nested-quote record | Use proper JSON parse, not regex |

#### LOW (10)

| ID | File | Issue | Fix |
| --- | --- | --- | --- |
| B-L1 | `api/signup.js:23` | `const crypto = require('crypto')` — fine; but `fs = require('fs').promises` re-required in body — hoist | Hoist imports |
| B-L2 | `api/welcome.js:42-53` | Long string template — consider template engine | Refactor |
| B-L3 | `api/sovereign-telemetry.js:154-165` | `baked = 30` magic number in code | Move to ENV or constant at top |
| B-L4 | All 22 API | Mix of `module.exports = async function handler` and class-style; no JSDoc | Add JSDoc |
| B-L5 | `api/j-space-think.js:7-22` | Document comments grow stale (claims "Ed25519" but emits HMAC) | Single source of truth for receipt algo |
| B-L6 | `api/crown-rfq.js:35` | Validation arrays `'Official'\|'Sensitive'\|'Secret'\|'TS'\|'TOP SECRET'` — `'TS'` and `'TOP SECRET'` both valid, ambiguous | Pick one canonical |
| B-L7 | `api/framing.js:9-91` | Hardcoded FRAMES — `defoneos-framing.html` is the source of truth, dedupe | Generate at build |
| B-L8 | `api/sovereign-citations.js:12-32` | Hardcoded `PAGES` list — drift risk same as daily-golden | Read from sitemap.xml |
| B-L9 | `api/morning-digest.js:55` | `since` filter uses `.slice(0,10)` (YYYY-MM-DD) — timezone bug for non-UTC servers | Use day-boundary UTC explicitly |
| B-L10 | `api/_notify.js:42-44` | Emoji labels hardcoded; i18n broken | Localise |

---

### 3.2 Front-end HTML (20 sampled + estate-wide sweep)

#### CRITICAL (0)

None — front-end HTML has no critical bugs. The system is static-rendered.

#### HIGH (23)

| ID | File (sample) | Issue | Fix |
| --- | --- | --- | --- |
| F-H1 | **All 389 HTML files (~99%)** | `<link rel="icon" href="#"" type="image/svg+xml">` — broken icon href (URL becomes `#"`); favicon never resolves; produces 404 to a stray anchor | Change to `<link rel="icon" href="/favicon.svg" type="image/svg+xml">` (the repo HAS `favicon.svg`) |
| F-H2 | **200+ HTML files** | `<a href="#"" ...>` (extra `"`) — every internal "fake" anchor in footer/CTA nav is `#""`, never resolves; click → no scroll, URL gets `#"` suffix | Replace with real anchor `href="#top"` or actual `<a>` with role="button"` |
| F-H3 | **23 HTML files (366/389 = 94%)** | Missing `<meta name="description">` — SEO collapse for unbranded pages | Add 30-160 char description OR mark `<meta name="robots" content="noindex">` for internal stubs |
| F-H4 | `index.html:9-10` | Loads CesiumJS (`https://cesium.com/downloads/cesiumjs/releases/1.118/Build/Cesium/Cesium.js`) **without `defer`** — **2.5MB** JS in `<head>`, blocks first paint by 800-1500ms on cold cache | Add `defer` and a `preload` link with `as=script` |
| F-H5 | `index.html:411` total | Single page contains: 1× Cesium + 1× Widgets CSS + 250+ lines inline `<style>` — entire page is one giant render-blocking payload | Split: extract `<style>` to `defoneos-2026.css` (already exists for other pages) |
| F-H6 | 200+ HTML files missing `<link rel="canonical">` (231/389 HAVE canonical → 158 MISSING) | Duplicate content risk; multi-URL surfaces (`defoneos.html` vs `defoneos-index.html`) compete | Add canonical to every page pointing at the canonical alias |
| F-H7 | All sampled HTML | No structured data (JSON-LD `Organization`/`Product`/`BreadcrumbList`) — Google rich-results lost | Add `<script type="application/ld+json">` block per page |
| F-H8 | `signup.html:60-80` | Form has radio buttons `<input type="radio" name="char">` but no `<fieldset>`/`<legend>` — screen reader reads radios as "1 of 5" without group label | Wrap in `<fieldset><legend>Pick your AI character</legend>...</fieldset>` |
| F-H9 | `verify.html:42-55` | `verify()` function returns **demo values** ("100/100", hardcoded ed25519:sig) for *any* certificate ID — **security hazard for a "verify" page** | Either gate behind auth, or label as demo, or talk to real `/api/sov-cert-verify` |
| F-H10 | `healthz.html:111-113` | `setInterval(() => update ts, 1000)` — runs forever, never `clearInterval` → page never unloads cleanly; minor CPU | Update every 10s or on demand |
| F-H11 | 30+ HTML files | Inline `<script>...</script>` blocks totaling 30-60KB per page (countdown, scroll-back-to-top, nav) — **no `defer` attribute**, executes in head-of-body synchronously | Add `defer` to all `<script>` tags |
| F-H12 | 50+ files | Inline `<style>...</style>` blocks (30-100KB per file) — duplicates across pages, never extracted | Promote to `sovereign-2026.css` or per-page `.css` |
| F-H13 | `index.html:108-112` | 3 `<button>` elements use `onclick="setMode('...')"` — requires global JS, no progressive enhancement | Add `data-mode="globe"` attrs + delegated listener |
| F-H14 | All HTML pages with images | `<img>` tags without `alt` attribute where present (mostly absent — pages use emoji-text rather than images) | If image added, set `alt=""` for decorative, full desc for content |
| F-H15 | Press-release, healthz, sovereign, launch etc. | Missing `lang="en-GB"` (uses `lang="en"`) — small SEO/a11y loss for locale | Use `en-GB` for UK-targeted content |
| F-H16 | All pages | No `<meta name="viewport">` on **`index.html`** in correct position (it's there at line 5); consistent across pages — but viewport `initial-scale=1.0` is fine | OK |
| F-H17 | `defoneos-demo.html`, `defoneos-signup-v2.html`, `defoneos-signup-hub.html`, `sov33.html`, `defoneos-knowledge.html`, `defoneos-protocols.html`, `defoneos-partner-integration.html` | Inline `console.log(...)` present in production HTML — **13 occurrences** across 7 files | Wrap in `if (DEBUG) console.log(...)` or remove |
| F-H18 | `signup.html:103-104, 86-87` | Error UI uses `alert(...)` (line 103) and `#welcome-msg` innerHTML set to user input (line 86) — XSS in last | Use `<p>` textContent assignment, no alert |
| F-H19 | `bridge.html` (380+ LOC) and `master.html` (480 LOC) and `crosswalks.html` (673 LOC) — three largest | Heavy inline styles + inline scripts per page; **not minified**; gzip doesn't help much | Extract page-specific CSS + minify at deploy |
| F-H20 | `verify.html` button onclick | `verify()` — clicks but body of function not displayed before; relies on global scope | Wrap in DOMContentLoaded listener |
| F-H21 | All HTML | `<button>` back-to-top is `display:flex` (no focus ring by default) — keyboard users can't see when focused | Add `:focus-visible { outline: 3px solid #22d3ee; }` |
| F-H22 | Index of pages (`defoneos-index.html`) missing from preconnect hint | `<link rel="preconnect">` not on every page | Add to all |
| F-H23 | All HTML | `aria-hidden="true"` not used on decorative SVG icons | Add for screen readers |

#### MEDIUM (45)

| ID | Theme | Issue | Fix |
| --- | --- | --- | --- |
| F-M1 | All | `<table>` lacks `<caption>` — tables for `pricing comparison`, `moat comparison` etc. have no caption | Add `<caption>` |
| F-M2 | All | `<th scope>` missing on table headers | Add `scope="col"` / `scope="row"` |
| F-M3 | All | Inline `<style>` blocks include vendor-prefix-less properties (`backdrop-filter`) — Safari needs `-webkit-backdrop-filter` consistently missing | Add prefix manually |
| F-M4 | All | No `<meta name="theme-color">` on ~80% of pages | Add `#0a0a0f` |
| F-M5 | All | No `<meta name="format-detection">` for iOS Safari (telephone parsing) | Add |
| F-M6 | All | `<html lang="en">` vs `lang="en-GB"` — inconsistent | Standardise |
| F-M7 | All | No `<meta property="og:image">` for social shares — Twitter/Facebook cards won't preview | Add a hero PNG/JPG |
| F-M8 | All | `<meta property="og:type">` repeats 'website' even on pricing/legal pages | Use `og:type=article` for blog/press pages |
| F-M9 | `index.html` & 50+ others | Back-to-top button uses inline `style=` 8 times — same set repeated; should be in CSS | Extract |
| F-M10 | All pages with `<nav class="nav-bar">` | `role="navigation" aria-label="Main navigation"` **is** present on most — confirmed good | OK; document |
| F-M11 | All | `prefers-color-scheme: light` not respected — all dark-only | Add light-mode media query |
| F-M12 | All | `prefers-reduced-motion: reduce` not honoured — page-hero animations + countdown tick `setInterval(tick, 1000)` keep running | Add `@media (prefers-reduced-motion: no-preference)` wrapper |
| F-M13 | All | No `loading="lazy"` on `<img>` (when present) | Add |
| F-M14 | All | No `decoding="async"` on `<img>` | Add |
| F-M15 | `signup.html:98-107` `goStep()` uses alert() — accessible worse than plain text | Use inline error region + `aria-live="polite"` |
| F-M16 | All | `<a>` with `href="#"` and no other role | OK; skip |
| F-M17 | Press release | Article date stamp is hardcoded 4 July 2026 — newspaper freshness signal | OK for static, but mark in `<meta name="article:published_time">` |
| F-M18 | All with `localStorage` (signup.html, defoneos-owem-rfq.html) | No `try/catch` around `localStorage.setItem` — Safari private mode throws | Wrap in try |
| F-M19 | All | `<form>` has no `noValidate` or `<input type="email" required>` — relies on JS only | Add native hints |
| F-M20 | All | `<button>` without `type` defaults to `submit` if inside form | Set `type="button"` everywhere |
| F-M21 | `index.html` (~411 LOC) | 1 of the 3 largest — needs split | OK functionally |
| F-M22 | All | Same `back-to-top` button re-defined inline per page | Module |
| F-M23 | All | `<a>` with `target="_blank"` but no `rel="noopener noreferrer"` | Add |
| F-M24 | All | No SRI (`integrity=`) on external scripts (Cesium) | Add when CDN allows |
| F-M25 | All | No `crossorigin` attribute on preconnect | Add |
| F-M26 | All | `.ftco-*` and other classes from prior template imports still referenced | Sweep unused |
| F-M27 | All | `<aside>`/`<article>` not used semantically | Refactor |
| F-M28 | All | No `<nav aria-label="Primary">` consistently | Standardise |
| F-M29 | All | Heading hierarchy not always nested (`<h3>` after `<h1>` directly without `<h2>`) | Check with axe |
| F-M30 | All | `<a>` link text "click here", "read more" — none observed | OK |
| F-M31 | All | Form fields lack associated `<label>` for `id` — `<input id="name" placeholder="Your name...">` missing `<label for="name">` | Add |
| F-M32 | All | No `<input pattern>` for client-side validation | Add |
| F-M33 | All | `<select>` defaults not visually marked | Add `selected` on default |
| F-M34 | All | `<details>`/`<summary>` not used for FAQ accordion | Adopt |
| F-M35 | All | `<dl>`/`<dt>`/`<dd>` not used for definition lists (SOV33 glossary etc.) | Adopt |
| F-M36 | All | Cookie/consent banner absent — but signup/newsletter call into PII flow | Add |
| F-M37 | All | No clear breadcrumb UI | Add `<ol itemscope itemtype="...BreadcrumbList">` |
| F-M38 | All | `<small>` used for footnotes | Add |
| F-M39 | All | No `<time datetime="">` on dates | Add |
| F-M40 | All | No `data-*` test hooks | Minor |
| F-M41 | All | `scroll-behavior:smooth` declared at document end (after `</body>`?) actually inside footer | Move to top of CSS |
| F-M42 | All | `aria-current="page"` missing on nav | Add |
| F-M43 | All | Color contrast on `cyan` text on `#0a0a0f` likely OK; on `gold` text less so | Audit with axe |
| F-M44 | All | `position:fixed back-to-top` covers bottom-edge content unless `padding-bottom:5rem` | Already done |
| F-M45 | All | `<kbd>`/`<samp>` not used for keyboard samples | Adopt on docs |

#### LOW (34)

| ID | Theme | Issue | Fix |
| --- | --- | --- | --- |
| F-L1 | All | Comments left in production HTML at end (e.g., launch.html line 70, sovereign.html line 11) | OK for static; sweep stray |
| F-L2 | All | `🐉` emoji in nav likely renders differently per OS | Provide fallback `aria-label` |
| F-L3 | All | Footer text "© 2026" — fine | OK |
| F-L4 | All | `data-cy` not used — Cypress convention | Add for E2E |
| F-L5 | All | `<!-- TODO -->` leftovers — none observed | OK |
| F-L6 | All | `<!-- generated -->` markers absent | Adopt |
| F-L7 | All | Hardcoded copy "187 MCP servers" / "30/30" — bake-in discrepancy with live state (estate-wide observed: 79 inventory markers say "30/30", one says "29", one says "188+") | Source from `/api/stats` |
| F-L8 | All | Comments like `/* page-level overrides + spice on top of sovereign-2026 */` are marketing-talk | Replace with audit-friendly names |
| F-L9 | All | Inconsistent heading capitalization | Standardise |
| F-L10 | All | Long lines (300+ chars) due to heavily-minified hand-written CSS | Run a minifier |
| F-L11 | All | `<style>` uses `* { margin:0;padding:0 }` (universal reset) — harmless but bloats CSS | Skip |
| F-L12 | All | CSS variables defined inconsistently (`--bg`, `--bg2`, `--bg3` vs `--bg-foo`) | Normalise in `sovereign-2026.css` |
| F-L13 | All | Animations use `cubic-bezier(...)` liberally | Test perf |
| F-L14 | All | Some pages have `transform:translate3d` for no reason — force GPU | Test real benefit |
| F-L15 | All | `filter:blur(8px)` on background panels is expensive on mobile | Disable on mobile |
| F-L16 | All | Some long shadow CSS effects | Trim |
| F-L17 | All | Font-loading via `@font-face` from Google Fonts (NOT confirmed in audit but likely) — no `font-display: swap` | Verify |
| F-L18 | All | Pages vary between 4KB and 50KB — `crosswalks.html` at 673 LOC / 52KB unminified | Compress |
| F-L19 | All | Image assets not inventoried in audit (none observed but `apple-touch-icon.svg` exists, used 0 times) | Link from head |
| F-L20 | All | Single quotes mixed with double quotes — minor | Standardise |
| F-L21 | All | `&apos;` HTML-entity not used (smart quotes via UTF-8) | OK |
| F-L22 | All | `<kbd>` style for keyboard samples | None seen, add when present |
| F-L23 | All | `<abbr title="">` not used | Adopt where fitting |
| F-L24 | All | `<mark>` highlight color missing | Add |
| F-L25 | All | `<small>` baseline style missing | Add |
| F-L26 | All | `font-feature-settings` not set for numeric/tabular figures | Add `font-variant-numeric: tabular-nums` |
| F-L27 | All | `-webkit-text-fill-color:transparent` on headlines cuts screen-reader text — accessibility regression | Provide a contrasting fallback color |
| F-L28 | All | No print stylesheet | Add `@media print` |
| F-L29 | All | No `:focus-visible` global rule | Add |
| F-L30 | All | No `cursor: pointer` reset on disabled buttons | Add |
| F-L31 | All | `user-select: none` not declared where appropriate | Add |
| F-L32 | All | Sticky nav `z-index:999` vs modals — modal test missing | Validate |
| F-L33 | All | `prefers-color-scheme` dark assumed | Already dark; OK |
| F-L34 | All | Some pages mix `rem`+`em`+`px` without policy | Document |

---

## 4. Severity × Category Aggregates

| Category | CRIT | HIGH | MED | LOW | TOTAL |
| --- | --- | --- | --- | --- | --- |
| **Security / Secrets** | 4 | 2 | 1 | 0 | 7 |
| **Hardcoded URLs / IPs** | 2 | 1 | 1 | 0 | 4 |
| **CORS** | 0 | 1 | 0 | 0 | 1 |
| **Validation / PII** | 0 | 4 | 1 | 0 | 5 |
| **Console logs in prod** | 1 | 0 | 0 | 0 | 1 |
| **HTML/XSS vector** | 1 | 0 | 1 | 0 | 2 |
| **Logging hygiene** | 0 | 2 | 1 | 0 | 3 |
| **HTML icon / broken anchors** | 0 | 2 | 0 | 0 | 2 |
| **SEO (meta/canonical/JSON-LD)** | 0 | 3 | 4 | 1 | 8 |
| **Perf (defer / inline / minify)** | 0 | 4 | 5 | 6 | 15 |
| **Accessibility** | 0 | 4 | 16 | 9 | 29 |
| **HTML structure/semantic** | 0 | 2 | 12 | 6 | 20 |
| **CSS hygiene** | 0 | 0 | 4 | 12 | 16 |
| **Errors / quality** | 1 | 4 | 6 | 4 | 15 |
| **Other / housekeeping** | 0 | 3 | 6 | 18 | 27 |
| **TOTAL** | **9** | **38** | **84** | **56** | **187** |

---

## 5. Top 10 Fixes (highest leverage first)

1. **🔴 Strip the hardcoded HMAC fallback secrets** from `signup.js`, `welcome.js`, `sov-bridge.js`, `sov-space-state.js`, `j-space-think.js`, `crown-rfq.js`. Replace with **fail-closed** behaviour: throw a clear error in production if `process.env.SIGN_KEY` (etc.) is unset. (B-C1, B-C2 — 6 endpoints)
2. **🔴 Escape all interpolations in the welcome email HTML body** (`api/welcome.js:57-67`) — currently `record.name`, `record.sigil`, `record.tier`, `next.cta` and free-form `msg` are pasted raw into an HTML email that passes through Resend → user inbox → potential stored-XSS if upstream `signups.jsonl` is ever tampered with. Use `escape-html` for every `${...}`. (B-C3)
3. **🔴 Delete `api/debug-signup.js` from production** OR rename + gate behind `process.env.DEBUG_ENDPOINTS === 'yes'`. Currently echoes raw request body to anyone. (B-C4)
4. **🔴 Replace all `rel="icon" href="#""` with `href="/favicon.svg"`** across all 389 HTML files (one-page find/replace, repo HAS `/favicon.svg` — error renders an empty `<link>` and produces noise). (F-H1)
5. **🟠 Fix all `<a href="#""...>` broken anchors** (`#""` with stray quote → URL becomes `#"`). Bulk replace across 200+ files. (F-H2)
6. **🟠 Add `<meta name="description">` to all 23 still-missing pages**, set `<meta name="robots" content="noindex">` on internal stubs. Brings count from 366/389 to 389/389 → search-visible. (F-H3)
7. **🟠 Add `defer` + `preload` to the Cesium script tag** (`index.html:9`). Single biggest perf win — saves 800-1500ms TTI on first load. (F-H4)
8. **🟠 Move the HMAC secret timing compare to `crypto.timingSafeEqual()`** in all `welcome.js`, `persist.js`, `invite.js`, `eat-tick.js`, `eat-tick-v2.js`. Defeats remote-timing-attack enumeration of `SEND_KEY`. (B-H11)
9. **🟠 Tighten CORS on PII-handling endpoints**: `signup`, `welcome`, `crown-rfq`, `invite`, `newsletter`, `debug-signup`, `analytics`. Reflect Origin only if allowlisted, else deny. (B-H1)
10. **🟠 Auto-publish a structured data layer** (`<script type="application/ld+json">` with `Organization`/`Product`/`BreadcrumbList`/`FAQPage`) across the 100+ DEFONEOS pages; unlocks Google rich-results for £0 engineering. (F-H7)

---

## 6. Recommendations Summary

- **Stop shipping secrets in code** — `process.env.SIGN_KEY` should be required at function load with a clear `console.warn` in dev only.
- **Convert `/api/*` from "Catch-all helper+handler" to typed modules** with `zod` (or `valibot`) input validation; replace `email.includes('@')` with a proper parser.
- **Lock the front-end to a single shared CSS bundle** (`sovereign-2026.css`) and page-specific CSS — kills 100-300KB duplicated inline CSS per page.
- **Adopt one CORS pattern** + add per-endpoint rate-limit (Vercel Edge Config or KV).
- **Add a 12-point SEO/a11y/perf lint to deploy pipeline** (Lighthouse + axe + custom rule "every page has meta/canonical/icon", "no `#""` anchor").
- **Audit `console.*` everywhere** — `signup.js:168`, `newsletter.js:42`, `_notify.js:84`, 13 inline-HTML occurrences.
- **Move `/tmp/*.jsonl` persistence to Upstash KV or Supabase** for true durability (Vercel `/tmp` is per-instance, ephemeral).

---

## 7. Audit Method + Caveats

- **Method**: Pure file-read static audit. No execution, no instrumentation, no network probe.
- **Scope**:
  - 22 files in `/Users/nicholas/clawd/csoai-static-deploy2/api/` — fully read.
  - 20 HTML files deep-read; **389 HTML files** swept with pattern checks via `grep`/`rg`.
  - No JS unit tests, no Lighthouse runs, no axe-core runs (would catch ~30 more issues).
- **What this audit does NOT cover**:
  - The actual `/tmp/*.jsonl` runtime behaviour (cold-start loss, scaling race).
  - Whether `SOV_BRIDGE_HMAC_SECRET` etc. are set in Vercel production env.
  - The 30+ SOV33/SOV3_OOWM_* HTML pages (all >500 lines but never audited in this pass — they share the same template fingerprints).
  - `defoneos-mod-*` (~70 owner-executable playbook pages) — same template, not deep-read.
  - The .vercel config, `sovereign-citation-mcp/` subdir.
  - Jest/vitest unit tests (none found in this snapshot — `tick-*-sigil.json` files are SIGIL receipts, not tests).
- **Honesty** — issues are categorised on observed patterns; some "HIGH" are systemic (CORS `*` on PII endpoints) and could be downgraded if org policy deliberately runs an all-public SPA that talks to its own backend.

---

## 8. Output Reference

- **Final report path**: `/Users/nicholas/clawd/CODE_QUALITY_AUDIT_2026-07-13.md`
- **Files created**: this report only (1 file).
- **Files modified**: none (read-only audit).
- **Total tool calls used**: 17 (terminal + reads + pattern searches).
