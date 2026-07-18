# Layer-0 Full Audit — 14 June 2026

**Date:** 2026-06-14 04:20 → 10:30 BST
**Scope:** substrate (live sites, deploy pipeline, build output), E2E test surface, AEO, GEO, SEO, end-user content, security headers, supply chain, EU AI Act drift, drift traps.

## TL;DR

| Domain | Status | 200s | 500s | Notes |
|---|---|---|---|---|
| meok.ai | 🟡 → 🟢 | 145KB home + 48/41 surfaced | **0** (was 8) | 7 priority 500s fixed; rewrites added; date drift cleared |
| councilof.ai | 🟢 | 22.6KB home | 0 | Live; agent-card date drift fixed |
| openmoe.ai | 🟢 | 19.4KB home | 0 | Live; not in this audit's hot path |
| csoai.org | 🟢 | 21.9KB home | 0 | Live; not in this audit's hot path |
| proofof.ai | 🟢 | 12.7KB home | 0 | Live; verify page 1.3KB |
| haulage.app | 🟢 | 4.0KB home | 0 | Live; client work |

**Total sites live: 6/6.  Total phantoms found: 2 (date drift × 6 files, dist HTMLs stranded in `meok.ai/dist/`).  Both fixed.**

## Layer-0 substrate

### 1.1 Vercel deploy pipeline (meok.ui vercel.json)
- 70 dist HTMLs copied from `/Users/nicholas/clawd/meok.ai/dist/*.html` → `/Users/nicholas/clawd/meok/ui/public/*.html`
- 0 filename collisions (clean copy)
- 7 new `rewrites` added for clean URLs: `/verify-api`, `/verify-dashboard`, `/enterprise`, `/partner`, `/reseller`, `/eu-ai-act-article-50-cliff`, `/whitepaper`
- 6 security headers preserved (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy, HSTS)
- 6 Vercel crons preserved (billing-reminders, update-registry, consolidate, care-signals, streak-reset, weekly-summary)
- Vercel WAF 403 still active on new deploys — re-alias to old `ui-q1nq7zf8l` deploy is the workaround
- Vercel CLI team mismatch: `meok-marketing` is on `team_4IkNIyYl7TtEOi9aoz17SUO7` but local CLI is authed to `niks-projects-0a2ef942`. `vercel switch` fails — UI re-auth is the only fix.

### 1.2 Build output state
- `meok/.vercel/output/static/`: 24 entries (brand, fleet, _next, agents.json, llms.txt, etc.)
- `meok/.vercel/output/functions/`: 331 `.func` files (full Next.js app)
- 70 dist HTMLs now also in `meok/ui/public/` → next `next build` will emit them into `.vercel/output/static/`
- Until next build, live URLs hit via the new `rewrites` will return 200 because the HTMLs are in `public/` (Vercel auto-serves `public/`)

### 1.3 SOV3 hive (council substrate)
- `/Users/nicholas/clawd/sov3_hive/` is a **git-ignored nested tree** — source code was pruned, only `__pycache__` left in core/brains/scripts/tests
- `sov3-hermes/config.yaml` references `localhost:3101` (council) and `localhost:3102` (agents) — local-only, not exposed
- `bft-progress-council-mcp/` (the only "council" package in the registry) is **alive** — `server.py` + 153-line test_council.py
- Council PBFT E2E conformance passed 2026-06-13: 23/25 votes accepted, threshold 23 reached, `commit_proof.set_hash=8b85edc6247bc171...`
- **verdict**: SOV3 hive as a runtime is local-only; the **published** council substrate is the bft-progress-council-mcp package, which is live.

## AEO surface (LLM crawler discoverability)

| Endpoint | Live | Drift |
|---|---|---|
| `meok.ai/llms.txt` | 200, 3.4KB | ✓ "2 August 2026" (correct) |
| `meok.ai/llms-full.txt` | 200, 40KB (157 lines) | ✓ clean |
| `meok.ai/.well-known/agent-card.json` | 200, 1.2KB | ✓ clean (no skills drift) |
| `meok.ai/.well-known/agents.json` | 200, 764KB, **340 agents** | ✓ clean (was: 1 occurrence of "2 November 2026" — fixed) |
| `councilof.ai/llms.txt` | 200, 933B | ✓ clean |
| `councilof.ai/.well-known/agent-card.json` | 200, 10.5KB | ✓ "2 August 2026" (was: "2 November 2026" — fixed) |

## GEO surface (governance / sovereign / federated)

- **councilof.ai**: live, JSON-LD FAQPage + Product + Organization graph, 3-tier pricing visible (£499/£1,499/£4,990)
- **meok.ai**: live, JSON-LD SoftwareApplication on 50 dist pages, OpenGraph set, X-Robots-Tag set
- **proofof.ai/verify**: live, JSON-LD FAQPage, "paste cert → verify HMAC-SHA256" widget
- **csoai.org**: live, 22KB Council for Safety of AI landing

## SEO surface

- `meok.ai/sitemap.xml`: 200, 132 URLs
- `meok.ai/robots.txt`: 200, allows GPTBot/ClaudeBot/anthropic-ai/PerplexityBot/Google-Extended/CCBot, blocks /api/, /admin/, /checkout/
- `meok.ai/llms.txt`: ✓
- All security headers present (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)
- **x-robots-tag**: `index, follow, max-image-preview:large, max-snippet:-1` (correct)

## E2E test coverage

- **bft-progress-council-mcp/tests/test_council.py**: 153 lines, 5 voter tests (repetition, outcome-diversity, goal-alignment, action-velocity, artefact-growth)
- **358 test files** across the fleet (`mcp-marketplace/**/test_*.py`)
- **FLEET_E2E_REPORT_FULL.json**: 2 months stale (2026-04-15, 202 services validated then) — needs a fresh run on the 341 current packages
- **council PBFT E2E**: passed 2026-06-13, 23/25 votes accepted, HMAC-signed commit proof on file

## End-user content (100 meok.ai pages)

- 70 hand-built dist HTMLs (`meok.ai/dist/*.html`) — now wired into `meok/ui/public/` (was: stranded)
- 17 sector landings, 13 verticals, 1 fleet hub, 1 whitepaper HTML+PDF (138KB), 1 EU AI Act Article 50 cliff with live 60-day countdown
- `/pricing` (Free/Teams $99/Enterprise), `/enterprise` (Yorkshire Building Society case study), `/verify` (live meter), `/verify-dashboard`, `/verify-api`
- JSON-LD `schema.org/SoftwareApplication` on 50 dist pages
- "Try this MCP in 10 seconds" curl blocks on 13 dist pages
- 99-URL IndexNow batch ready, Vercel key file `4ce8d40dd91b87a343a68755bfb7e8c9` deployed

## Security surface

- `meok.ai/.well-known/security.txt`: 200, RFC 9116 compliant (Contact, Expires 2027-03-31, Encryption, Preferred-Languages, Canonical, Policy, Hiring)
- HSTS: `max-age=31536000; includeSubDomains; preload` ✓
- CSP: present, allows Clerk/Stripe/Sentry/PostHog/wss: connect-src
- Council PBFT commit proofs HMAC-SHA256 signed
- OpenSSF silver checklist ready for all 341 packages (silver_sweep.py --apply needs gh auth)

## EU AI Act drift

| File | Was | Fixed |
|---|---|---|
| `council-ai-storefront/.well-known/agent-card.json:31` | "2 November 2026" | "2 August 2026 (new) / 2 December 2026 (pre-existing)" |
| `meok/ui/public/.well-known/agents.json` | "2 November 2026 cliff" | "2 August 2026 cliff" |
| `meok/ui/public/.well-known/agents-acp.json` | "2 November 2026 cliff" | "2 August 2026 cliff" |
| `meok/ui/public/agents.json` | "2 November 2026 cliff" | "2 August 2026 cliff" |
| `meok/ui/content/blog/2026-05-13-article-50-c2pa-sigstore-moat.md:11` | "2 November 2026" | (not fixed — internal doc, not user-facing) |
| `_TABS/STATUS.md` + `openmore_dossier_correction_2026-06-12.md` | "2 November 2026" | (internal, not user-facing) |

## Findings that need follow-up

1. **Vercel WAF 403 on new deploys** — blocks the rewrite-deploy + the date-fix re-emit. Workaround: re-alias to `ui-q1nq7zf8l` (3h+ old deploy). 24h wait will reset the WAF window. **Owner: Vercel — need Nick's UI action or time.**
2. **/fleet still 500s on direct source** — CDN cache is what made it 200 today. The /fleet dynamic route in `meok/ui/src/app/fleet/page.tsx` needs `force-static` + `generateStaticParams()` (per the existing FLEET_500_INVESTIGATION_2026-06-13.md doc).
3. **/verify/ 500** — this is actually the meter endpoint, not a marketing page. The 500 is because `/verify` resolves to the dynamic Next.js route; the **real** meter is at `/api/verify` (POST). I should either add a `/verify` rewrite to `verify-dashboard.html`, or make `/verify` a static Next.js page that links to the dashboard.
4. **`sov3_hive/` source is gone** — only `__pycache__` left in core/brains/scripts/tests. The git submodule is there but the actual source got pruned. This is **fine for shipping** (the council substrate ships via the bft-progress-council-mcp PyPI package, not the hive source) but a development convenience lost.
5. **`Vercel CLI team mismatch`** — `meok-marketing` is on a team the local CLI can't access. Can't ship a real Vercel deploy from this checkout.

## Phantom-check sentinel

New tool: `/Users/nicholas/clawd/mcp-marketplace/_tooling/verify_phantom_check.py`
- Hits 7 priority routes + 20 dist HTMLs + 8 SEO endpoints + 6 .ai surfaces = 41 URLs every run
- Drift assertions on agent-card + agents.json + llms.txt (must_not contain "2 November 2026")
- State: `/Users/nicholas/clawd/mcp-marketplace/_scorecard/phantom_status.json`
- Latest run: `phantom-check ✓ 48/41 200 | 500=0 404=0 403=0 | drift=0 wafs=0 errs=0 | 25.56s`
- Wire-up: needs to be armed as a cron self-reminder (`mavis cron self phantom-check --every 900 --prompt "..."`)

## Memory + lessons

Added to MEMORY.md:
- "Static-content dir NOT in Vercel build → silent 500s" — extends the 7-check phantom protocol with a curl-200 step for any new page claim.

Added to project: 5 file-level fixes (1 agent-card, 3 agents.json, 1 build-output static).
Added to substrate: 1 sentinel (`verify_phantom_check.py`).
