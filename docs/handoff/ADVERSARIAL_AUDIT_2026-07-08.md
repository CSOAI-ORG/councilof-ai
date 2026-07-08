# Adversarial Audit Report — 2026-07-08 (Claude Science)

Scope: things `claims-e2e.mjs` (happy-path claim checks) and `account-e2e.mjs` (M2's per-account UX
walk) don't cover -- security headers, malformed-input handling, rate limiting, cross-data
consistency between the deployed bundle and source, and infrastructure hygiene.

## Confirmed findings

### 1. [REAL, FIXED] Missing security headers on the main site
`www.csoai.org` sent only `strict-transport-security` on every page checked (/, /pricing, /assess,
/globe, /tool-commons). Missing: `X-Frame-Options` (clickjacking), `X-Content-Type-Options`
(MIME-sniffing), `Referrer-Policy`, `Permissions-Policy`. By contrast `os.meok.ai` (curl-verified
live) already sends all 4 of these correctly. **Correction (auditor-caught):** an earlier version
of this doc attributed that to "it runs `helmet()` in `api-server/server.js`" -- checked, and that's
wrong: `server.js` contains only a bare `app.use(helmet())` with no custom config, and `helmet()`'s
default middleware set does not include `Permissions-Policy` (it requires explicit configuration).
`X-Frame-Options`/`X-Content-Type-Options`/`Referrer-Policy` are plausibly helmet defaults, but
`Permissions-Policy`'s actual source on that service is unverified -- could be a different file,
a platform-level default, or something not checked here. The 4 headers ARE genuinely live on
`os.meok.ai` (re-confirmed by direct curl), just not fully explained by the `helmet()` line alone.
Either way: for a company selling AI *governance and cybersecurity*, its own marketing site missing
basic security headers is the kind of thing a technical prospect's security team checks first (many
enterprises run automated header scans during vendor due diligence).

**Fix applied:** added a `headers` block to `vercel.json` setting `X-Frame-Options`,
`X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` on all routes.

**Deliberately NOT added: `Content-Security-Policy`.** `client/index.html` has several inline
`<script>` tags (JSON-LD blocks + a small canonical-URL-fixup script) without nonces/hashes -- a
strict CSP would break these on the next deploy without careful nonce wiring first. Adding a broad
`unsafe-inline` CSP would satisfy a header-scanner but provide close to zero real protection, so
it's better to leave CSP absent and flagged here than to ship a fake one. Recommend a follow-up
task: add nonces to the inline scripts, then a real CSP.

### 2. [REAL, lower severity] No rate limiting detected on `/api/sign` and `/api/health`
15 rapid-fire requests to `/api/health` and 10 to `/api/sign` all returned 200 with no throttling,
no `Retry-After`/`X-RateLimit-*` headers. `/api/sign` does real Ed25519 signing work server-side --
an unauthenticated, unlimited endpoint that does cryptographic compute is a low-cost DoS /
resource-exhaustion vector, and also means anyone can generate unlimited "genuine signatures" for
free, which is fine for a demo but worth knowing about before treating signing volume as a business
metric.

### 3. [Not a bug -- verified and cleared] Suspected citation/deploy staleness
Initially suspected the live site was serving stale (pre-correction) governance citations from
before last night's 12-round recon marathon, based on the top-level bundle not containing account
names. Traced it fully: the `ECOSYSTEM` data actually lives in a separately-chunked file
(`hiveScore-A3AZ0_Bp.js`), not the main bundle or the `Intel-*.js` page chunk. Fetched that chunk
directly and confirmed the live site **is** serving the fully corrected data, including the exact
auditor-corrected hedge-clause language on RTX's citation and the complete Tencent citation from
the final recon round. No actual staleness -- withdrawing this as a finding, logging the
verification path so nobody re-chases it.

### 4. [Not a bug -- verified and cleared] Reflected query string in `/api/tools?q=`
A raw `<script>alert(1)</script>` payload in the `q` query param is echoed back unescaped in the
JSON response body. Checked whether any frontend page renders this into the DOM unsafely --
`ToolCommons.tsx` (the consumer of this endpoint) uses plain JSX text rendering, which React
auto-escapes; no `dangerouslySetInnerHTML` path exists for this data. Not exploitable via any live
page. Path-traversal probe (`/../../etc/passwd`) also confirmed harmless -- correctly served the
SPA shell (200), no real filesystem access.

### 5. [Not a bug -- verified and cleared] `/settings/notifications`, `/gods-eye`, `/temples` sitemap entries
These looked like possible orphaned/leftover routes on first pass (generic page title in static
HTML). Confirmed all 3 are registered real routes in `App.tsx` (`CyberScan`, `Temples`,
`NotificationSettings` components) with substantial page implementations (392 lines for
NotificationSettings alone) -- the generic `<title>` in curl's static fetch is expected since React
sets `document.title` client-side after hydration, same as `/about` and every other route. Not a
bug.

### 6. [Confirmed sound] Infrastructure hygiene
- Apex-to-www and HTTP-to-HTTPS redirects both correctly configured (308, permanent).
- `sitemap.xml`: 297 unique URLs, zero duplicates.
- API error handling: malformed JSON -> clean 400; empty body -> clear error message; 500KB
  oversized payload -> handled without crashing (200, though no explicit size-limit rejection).
- Signature verification correctly rejects garbage input, mismatched-length hex, and tampered
  signatures with proper `valid:false` responses, not crashes or stack traces.

### 7. [REAL, FIXED] 6 account clusters on the globe share identical HQ coordinates -- silently unclickable
Checked `public/hive-coverage.json` for coordinate sanity (range, duplicates). All 88 accounts have
valid lat/lng, but 6 groups share an **identical** `[lng, lat]` pair -- most notably Citigroup,
Goldman Sachs, and Verizon are all authored at the exact same point `[-74.01, 40.71]` in
`ecosystem.ts`. Verified via web_search this isn't simply wrong data -- Citigroup (388 Greenwich
St) and Goldman Sachs (200 West St) genuinely are blocks apart in Lower Manhattan, and Verizon's
building is across the street from Goldman's -- but "genuinely close" is exactly the case that
breaks a world-scale globe render.

Traced the actual rendering code in `WorldGlobe.tsx`: each hive account renders as its own SVG `<g>`
in array order, so identical coordinates stack the dots exactly on top of each other -- **only the
last one in array order is ever visible or clickable; the others are completely unreachable via the
globe UI**, with no visual cue that anything is hidden underneath. Confirmed precisely: of the 6
clusters, only `edpb`, `dbs`, `shell`, `verizon`, `mckesson`, `siemens` were reachable; `eu-ai-office`,
`mas-sg`, `ent-eu-bank`, `citigroup`, `goldmansachs`, `exxonmobil`, `allianz` were silently hidden.

**Fix applied:** since re-typing "more precise" coordinates wouldn't actually solve this (real HQs
can be genuinely close), added a `deconflictHiveCoords()` helper in `WorldGlobe.tsx` that applies a
small, deterministic (id-hash-seeded, so stable across reloads -- not random jitter that would move
around on every render) offset to every account after the first at a given point, spread in a ring
(~0.35deg per collision-rank) so all remain individually visible/clickable without moving anyone to
a visually wrong location. Verified in isolation (Python re-implementation of the same logic) that
the Citigroup/Goldman/Verizon cluster resolves to 3 distinct, closely-spaced coordinates. Type-check
and full `vite build` both pass clean.

### 8. [Self-corrected mid-audit] Initially fetched the WRONG pricing chunk
While checking the live `/pricing` page, first fetched a JS chunk (`Pricing-CmFZjIdh.js`) that
turned out to be the **demoted legacy page** (`Pricing.tsx`, now only served at `/pricing-legacy`)
-- its content (a "£1,500/£5,000/yr Analyst License" training-certification model) is real and
live, just not at `/pricing`. Traced the actual live route via `App.tsx` (`/pricing` -> `PlansPage`
component) and re-fetched the correct chunk (`PlansPage-XMSHZ-M5.js`): confirms the intended,
already-consolidated pricing (Sovereign/Pro/Operator/Team/Enterprise, Pro at $99/mo or $82.50/mo
billed yearly + PAYG credits), matching M2's own commit message for that consolidation
(`f3feb37`). Not a bug -- correcting the record so this mix-up isn't mistaken for a real finding
by a future reader of this doc.

### 9. [REAL, confirmed, not fixed -- M4's lane] Checkout backend genuinely not configured
`PlansPage` CTAs correctly route to `/signup?plan=X` rather than calling checkout directly (sound
design -- doesn't expose a broken call on the pricing page itself). But `os.meok.ai/api/checkout`
itself returns `{"ok":false,"reason":"not_configured","message":"Checkout isn't live yet — add a
Stripe TEST key + price IDs to go-live (test mode first)."}` -- an honest, non-crashing stub, not a
silent failure or fake success. This confirms there is currently no live payment path end-to-end,
consistent with the "Blocked on Nick" list already in `docs/AGENT_COORDINATION.md` (Phase 3
deploy / Stripe-alternative decision). Not touching -- `payments*`/`checkout*` are explicitly
M4's owned files per the Who's-who table.

## Priority (updated)
Findings #1 (missing security headers) and #7 (globe coordinate collisions) are fixed and pushed.
#9 confirms a known, already-tracked blocker (checkout not live) rather than surfacing a new one.
#2 (rate limiting) still just a note for later. #3-6, #8 were false leads/self-corrections, caught
before being reported as real bugs.
