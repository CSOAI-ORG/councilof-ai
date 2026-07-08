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

## Priority
Only finding #1 (missing security headers) is worth fixing immediately -- real, cheap, and directly
relevant to how a security-conscious prospect will judge the product. #2 (rate limiting) is worth a
note for later, not urgent for a pre-revenue demo site. #3-5 turned out to be false leads, caught
before being reported as real.
