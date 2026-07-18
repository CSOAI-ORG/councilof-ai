# 👑 KING ALIGNMENT — MCP Fleet task complete (2026-06-11)
*Copy-paste this whole file to the King / any queen / any tab. It is the single source of truth
for what the MCP-Fleet task shipped (2026-06-09 → 06-11) + the canonical facts every agent must hold.
Live-verified figures only — zero estimates. Supersedes any older counts (271/316, 410+, 335, £79 Pro).*

---

## 1. CANONICAL FACTS (paste into any L6 facts-scope · ratified + live-verified)

```
MEOK CANONICAL FACTS (verified 2026-06-10/11, MCP Fleet audit):
FLEET: 341 package dirs in mcp-marketplace (340 real + 1 template junk) · 295 LIVE on PyPI ·
46 unpublished (PyPI new-project-cap backlog, drip publisher grinding ~days) · 2,482 releases all-time.
DOWNLOADS: 186,208/last-30-days · 98,230/last-7-days (230 pkgs have stats; 111 too new; mirrors
inflate "day" counts — organic ≈ 14K/day; downloads ≠ buyers, flat distribution = mostly mirrors/CI).
SCORECARD: fleet avg 84.6/100 · 82 pkgs ≥90 · 201 at 80-89 · 54 at 65-79 · 2 below 65 · 339 pages live.
REGISTRY (registry.modelcontextprotocol.io): 294 UNIQUE CSOAI-ORG servers (814 version-entries —
registry stores one entry PER VERSION; paginate metadata.nextCursor; name nests at server.name).
292 ours + 2 dirless strays (meok-dora-tlpt-planner-mcp, meok-fria-generator-mcp) · 49 local unregistered.
PUBLIC CLAIM: "294 servers in the official MCP Registry" (all surfaces aligned on this number).
GITHUB: 499 repos in CSOAI-ORG. LOCAL STASH: ~/mcp-servers = 218 dirs (separate from marketplace).
QUALITY: README 341/341 · tests 339 · LICENSE 340 · smithery.yaml 340 · .well-known 339 ·
auth_middleware 219 · server.json==pyproject 337/341 (sync now automatic in republish_mcp.py).
PRICING (ratified 2026-06-10, GBP, livemode acct MEOK AI LTD acct_1TLlEKQvIueK5Xpb):
Free key 200 calls/day (POST proofof.ai/signup) · Starter £29/mo · Pro £199/mo
→ https://buy.stripe.com/aFa7sNcgAdQS0ZT1Uc8k91t · Enterprise £1,499/mo
→ https://buy.stripe.com/fZu5kF0xS8wy9wpeGY8k91s · 48h Assessment £4,950 one-time
→ https://buy.stripe.com/eVq6oJ3K49AC0ZTaqI8k91m · Article 50 kit £999 · PAYG £0.05/call ·
NIS2-DE £99 self-serve (…8x200l…8k91p) / £499 DFY (…00waEZ…8k91k) · NIS2-NL £499 (…91E) ·
DORA-BE £999 (…cNi9AV…8k91l). NEVER quote £79 (retired 2026-06-10) or any …8k90x/…8k83x link (dead accounts).
DEADLINES: EU AI Act Article 50 — new systems 2 Aug 2026 · legacy generative 2 Dec 2026. Everywhere.
REVENUE REALITY: £0 balance · 0 subscriptions · 0 payments ever (as of 2026-06-11). The 3 Stripe
customers (signup-selftest@ / scorecard-cta-test@ / audit-check@meok.ai) are Claude self-tests — deletable.
ATTESTATION: HMAC + Ed25519 co-signed certs, offline-verifiable at proofof.ai/pubkey, v1.2.0 live.
BRANDS: never reference CSGA / James Castle / Terranova (severed).
```

## 2. WHAT THIS TASK SHIPPED (all live + committed — MCP Fleet tab, 06-09 → 06-11)

**Conversion engine (was: zero capture path on 186K downloads/mo):**
- `POST proofof.ai/signup` LIVE — email → deterministic free key + Stripe Customer (lead in CRM).
  Folded into `api/index.py` (single-function project — standalone signup.py/verify.py never deployed).
  Verified end-to-end 3×: customers created with meok_tier=free metadata. GET /signup 404 = by design (POST-only).
- **CTA capture surface on all 702 scorecard HTML pages** (339 pkg + 11 best/ + leaderboard, deployed dir
  + proofof-site src): email→/signup form + "Pro £199/mo" button (canonical link …91t); compliance pages
  also carry the £4,950 48h-assessment CTA (…91m). Non-compliance pages correctly omit the audit CTA.
- get-key.html funnel already posts to /signup → whole path PyPI README → scorecard → key → upgrade WORKS.

**£0 root-causes killed (3 separate dead-link families found + fixed this task):**
- 18 dead-account links **inside the live API** (…8k836/837/833 → deactivated account) remapped to live
  (£79→£199 era: Pro, Enterprise £1,499 product CREATED + linked …91s, Assessment £4,950 …91m).
- 207 fleet auth_middleware.py + 218 FUNDING.yml repointed (earlier in task) + 351 scorecard pages
  re-aligned £79→£199 ratified canon (…91t) after the canon change — 0 off-canon pages remain.
- nis2-de-kit page: DFY button silently charged £99 — SELF_SERVE/DFY split fixed (£99 …91p / £499 …91k).

**Fleet integrity (PyPI):**
- Full-fleet republish: every published wheel now gate-checked (imports in clean venv) + carries live links.
- 3 broken builds fixed+published: firmware-attestation-mcp ([tool.hatchling…]→[tool.hatch…] typo),
  meok-governance-smithery (+wheel cfg), optometry-patient-mcp (+hatchling, def main, scripts entry).
- C1/C2 class fixed across fleet: 3 pkgs missing [build-system], 40 pkgs had server:main with no def main().
- republish_mcp.py: 4× faster (cut redundant post-upload reinstall) + now auto-syncs server.json versions.
- M1: 301 stale server.json versions synced to pyproject (337/341 now in lockstep).
- M2: 7 empty package dirs removed; 1 README-only stub flagged (meok-soil-assoc-organic-aqua-mcp).

**GEO / AEO / trust:**
- 🔴→✅ Google manual-action risk RETIRED: self-issued schema.org AggregateRating + Review stripped from
  all 339 scorecard pages → factual PropertyValue (score still machine-readable for AI citation).
- 352 scorecard URLs submitted to IndexNow (Bing/Copilot/ChatGPT-search index) — HTTP 200 accepted.
  Key file live: www.proofof.ai/89ed18bdd7624390184835d18b72ef4c.txt (M4's separate key also valid).
- meok.ai homepage: SSR "0" counters fixed (crawlers now see 337+/2,400+/4.9★) · 202→337 MCP count.

**Infra/deploy root-causes:**
- proofof.ai attestation API was 404-ing ALL functions: root pyproject.toml flipped Vercel into
  package-build mode → `.vercelignore` (pyproject.toml) + `.python-version` fix → /health /sign /verify
  /openapi.json all 200 (v1.2.0). THE deploy lesson: deploy --prod --force; promote/alias fails cross-team.
- Singleton-guarded fleet republish runner (mkdir-lock — flock doesn't exist on macOS) after a double-run race.

**Audit artifacts (full figures, per-package):**
- `_TABS/_inventory/MCP_FULL_AUDIT_2026-06-10.md` + `.csv` — all 341 rows: local/PyPI version, releases,
  downloads d/w/m, rubric score, server.json ver, registry surfaces.
- `_TABS/_inventory/DATA_SNAPSHOT_2026-06-09.md` — downloads/DR/Vercel/Stripe snapshot.
- `_TABS/MCP_FLEET_TAB_PROFILE.md` — this tab's Cowork agent card (scope, capabilities, how to assign work).
- Memory: `project_mcp_canonical_counts.md` (supersedes 271/316 figures).

**Top-10 downloads /mo (compliance dominates = the buyer category):**
eu-ai-act 2,810 · dora 2,690 · cra 1,898 · ai-bom 1,846 · nis2 1,818 · gdpr 1,794 · bias-detection 1,722 ·
iso-42001 1,714 · cra-annex-iv 1,540 · llm-compliance-comparison 1,516.

## 3. LIVE SURFACE MAP (verified 2026-06-10/11)

| Surface | State |
|---|---|
| proofof.ai /health /sign /verify /openapi.json /pubkey | 200 · v1.2.0 · HMAC+Ed25519 |
| proofof.ai/signup (POST) | 200 → key + Stripe lead ✓ |
| proofof.ai/payg | 302 → councilof (M4) |
| proofof.ai/scorecard/* (339+11+index) | 200 · CTA live · £199 canon · PropertyValue schema |
| proofof.ai /catalogue /llms.txt /sitemap.xml /get-key.html | 200 · 294-server claim · £199 |
| meok.ai | 200 · nis2-de-kit £99/£499 ✓ · real SSR counters · nis2-nl £499 live (M4) |
| Domains 16/18 up | grabhire.app DOWN · openscore.ai dropped (intentional) |
| Ahrefs DR | councilof 33 · csoai 26 · meok 21 · proofof 7 · optimobile 4.9 · new domains 0 |
| King hub | https://35.242.143.249.sslip.io/king/mcp (X-MEOK-Key) · 28 hives · 4 fact-grounded queens (M4) |
| SOV3 | 13,277 episodes · consciousness 0.788 · 91 agents · 6 NNs · ⚠️ VM disk 90% / mem 83% |

## 4. GATES — Nick-only (the funnel is built; these switch it ON)
1. 🔴 **ROLL the exposed rk_live Stripe key** (tested ACTIVE by M4 — most urgent security item).
2. **Vercel KV** (Storage→create) → activates the 200/day metering cap = the reason to pay.
3. **DNS batch in Namecheap** (8 rows, M4 has them) → hive-mailer fires 19 queued GRC emails + sovereign.meok.ai cert.
4. **LAUNCH50 promo code** in Stripe dashboard (coupon MIoZIRM1 exists; FREE14 already live).
5. **Rotate the PyPI token** (was exposed in a script earlier; scrubbed but unrotated).
6. **PAT / git push** — meok-attestation-api ahead 8 (+1 behind) · fleet READMEs/.mcp.json staged across repos.
7. Reconnect Resend/Gmail → nurture emails to captured leads. · Delete the 3 self-test Stripe customers.

## 5. STANDING RULES (all agents)
- Republish-only on PyPI (new names re-trip the cap; "UPLOADED, propagation-lag" ≠ live — verify pypi.org/pypi/NAME/json).
- Honesty over hype: quote ONLY §1 numbers; verify before stating; downloads ≠ users.
- No self-issued Review/AggregateRating schema anywhere (manual-action risk) — PropertyValue only.
- One canon ladder; never mint parallel Stripe links when a canonical exists; price shown MUST equal price charged.
- Commit after every change · own dirs only · cross-tab via _TABS/INBOX.md · 3-line STATUS.md append per chunk.
- Deploys: say so + health-gate + verify on the live domain. Vercel: --prod --force; never trust promote cross-team.
```
*End of alignment. Newer STATUS.md entries (PM11+) override this file where they conflict.*
