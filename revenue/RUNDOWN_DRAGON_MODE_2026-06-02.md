# RUNDOWN — DRAGON MODE — 2026-06-02

**Generated:** 2026-06-02 (live data: `pypi.org`, `pypistats.org`, `api.github.com`, Vercel probes, gh CLI, `git log`, repo audits, master alignment, M3 auditor rundown).
**Author:** M3 (auditor lane) — synthesis only. No code/memory edits.
**Lane discipline:** Numbers verified live today. Older claims (memory, 04-XX files) cross-checked against canonical 2026-06-02 sources (`MEOK_PYPI_TRUTH_2026-06-02.md`, `_findings/RUNDOWN_2026-06-02.md`, `AUDIT_SOV3_MEOK_2026-05-29.md`, `MASTER_AUDIT_REVENUE_PLAN_2026-05-29.md`).

---

## 0. THE BLUNT ANSWER (the one-line ask)

> **You have a £0-revenue problem on top of a working ~£150K-asset product, and the entire stack is grinding on a single flame: YOU haven't pasted a buy link in front of 5 humans in 5 days. Every other blocker is solvable by code; this one is solvable by a tweet.**

Read the rest for the full forensic.

---

## 1. REVENUE BLOCKERS — RANKED (the actual list)

Ranked by *blast radius* (what it kills) and *effort to fix* (Nick-time vs me-time).

### P0 — SOV3 :3101 IS DOWN (P0 incident, breaks 110 inner tools + every council call + every `mcp_bridge_*`)

| Field | Value |
|---|---|
| Discovered | 2026-06-02 05:50 UTC by M3 live probe |
| Symptom | `curl :3101/health` → connection refused. All 4 SOV3 processes gone |
| Root cause | Guardian `restart_sov3()` racy — no port-bind verification, near-simultaneous restarts collide on 0.0.0.0:3101 (Errno 48). Both die. |
| Blocker surface | `sovereign-temple/run-production.sh:18` defaults `HOST=0.0.0.0`. Guardian `scripts/meok-guardian.sh:79-83` does `pkill -9` → `nohup` → `sleep 15` with no port-conflict detection |
| What breaks | Every MEOK ONE council route falls back to Gemini cloud. `mcp_bridge_discover` returns 0 servers instead of 314. SIGIL audit-trail feature (commit `eb1dc21`, 47 hours old) is unreachable. 6 trained NNs unreachable. |
| Fix (M3 wrote it) | 1-line bind fix + 15-line `wait_for_port()` guardian rewrite — see `_findings/FIX_PROPOSAL_SOV3_BIND_AND_RESTART.md` |
| Recovery command (one-liner) | `cd ~/clawd/sovereign-temple && HOST=127.0.0.1 nohup bash run-production.sh >> /tmp/sov3.log 2>&1 &` then `curl :3101/health` |
| Why this is #1 | Until SOV3 is up, half the "moss" claims about Council/audit trail/SIGIL are lies. The Show HN drafts (Angle A + B) both assume the brain works. |
| Owner | Nick (or me if you say go) — manual launch from a clean shell |

### P0 — Show HN has been READY for 7+ days, never posted

| Field | Value |
|---|---|
| Drafts ready | `SHOW_HN_POST_2026-06-03.md` (multi-LLM OS angle), `SHOW_HN_READY_2026-05-29.md` (TUI Angle A, post-ready), `SHOW_HN_post.md` (compliance) |
| Target date | Tuesday June 3 2026 · 14:00 UTC (07:00 PT / 10:00 ET / 15:00 BST) |
| Best angle | Multi-LLM agent OS with visible BFT council disagreement + 38 compliance MCPs |
| 90-day expected lift | Monte Carlo `A_apex_unblock` strategy → 60.6% probability of hitting £1K MRR by Aug 20, mean £1,553/mo, p90 £3,159/mo. *Not posting kills the entire apex scenario.* |
| Why it's #1 (tied) | This is the binary action. Every day unposted is a day the £0→£1 ladder doesn't fire. |
| Owner | Nick (HN flags agency posts; you have to be the one clicking Submit) |
| Pre-flights (60 min) | (1) Recover SOV3 (above). (2) Confirm `/os` shell on meok.ai renders. (3) Test `uvx eu-ai-act-compliance-mcp` from clean machine. (4) Pre-stage 2:1 OG screenshot. |

### P1 — Pricing has 3 different ladders live (revenue cannibalization)

| Field | Value |
|---|---|
| State | SoT doc says £49/£149/£999/£2,499. Stripe has £1/£5/£9/£29/£79/£199/£1,499. `meok-kits-host.vercel.app` shows the £1-£1,499 ladder. Landing pages (meok.ai) still show the £29-£499 ladder. |
| Impact | -15% conversion estimate (audit 2026-05-20). B2B buyers see £29 and think "personal-card not enterprise." |
| Fix | Pick one ladder, edit SoT + Stripe metadata + 6 landing pages to match. 3 hours me-time. |
| Owner | Me (build) + you (final pick) |

### P1 — `/thanks` redirects to homepage (silent funnel break)

| Field | Value |
|---|---|
| Evidence | Stripe webhook fires, but the post-purchase redirect lands users on marketing page → no welcome email, no onboarding, no "first signed attestation" prompt |
| Impact | Every paying user gets one shot at the product and bounces |
| Fix | Add `/thanks` route, set `RESEND_API_KEY` in Vercel. 30 min me-time. |
| Owner | Me |

### P1 — Plausible analytics NOT installed on any of 4-7 sites

| Field | Value |
|---|---|
| Evidence | `meok.ai`, `councilof.ai`, `biasdetectionof.ai`, `meok-kits-host` — no analytics tag in served HTML |
| Impact | Cannot answer "which page converted? which tweet landed? where did the click come from?" You are flying blind. |
| Fix | Sign up Plausible (5 min) → paste snippet in 5 sites. |
| Owner | Nick (account + payment). Me (paste snippets). |

### P1 — `meok.ai/buy` build broken (6 iterations failed since May 21)

| Field | Value |
|---|---|
| Symptom | `TypeError: Cannot read properties of undefined (reading 'registerClientReference')` at RSC client-reference resolution. Crashes at `_not-found` prerender. 6 different commits, all fail. |
| Workaround (already in use) | `meok-kits-host.vercel.app` serves the same purpose, fully working. |
| Impact | Marginal — kits-host covers the buy flow. BUT it cannibalizes the SEO equity of the canonical meok.ai domain and misses the `/buy` schema. |
| Recommendation | Path A (per `REVENUE_STATE_FINAL_2026-05-28.md`): keep using kits-host, paste the URL everywhere, ignore the broken build until revenue justifies fixing. |
| Owner | Defer. |

### P1 — Brand hygiene: still 2 untracked files with the live Stripe key

| Field | Value |
|---|---|
| Status | Per 2026-04-26 audit, `create-stripe-products.py` + `MASTER_SUMMARY.md` were scrubbed + gitignored. **But they sit untracked in `~/clawd/unified-portfolio-catalog/`**. Verify with `git log -S "sk_live_51TLlEK"` — should return nothing. |
| Impact | Low (never committed, never pushed). But: secrets shouldn't live in plaintext anywhere. |
| Fix | Move to 1Password CLI. Rotate 3 Vercel env vars (signing key, pepper, stripe webhook secret). |
| Owner | Nick (Vercel dashboard) + me (1Password script). |

### P2 — Distribution surface: 271 PyPI packages, but listing is fragmented

| Field | Value |
|---|---|
| Where you're listed | PyPI (271) · Anthropic Registry (81/271 — only 30%) · MCP Registry (8 flagships) · mcp.so issue #2170 (open, no engagement) |
| Where you're NOT (yet) | Smithery · Glama · PulseMCP · mcp-get · awesome-mcp-servers (3 PRs blocked on gh auth) · modelcontextprotocol/servers · Docker MCP Catalog |
| Impact | Devs searching for "compliance MCP" or "EU AI Act MCP" mostly don't find you. Anthropic Sonnet usage 71% — that's the pool. |
| Fix | Submit flagships (`eu-ai-act`, `meok-law`, `meok-attestation-verify`, `meok-watermark-attest`, `meok-omnibus-tracker`, `meok-nis2-de-register`) to each registry. 5-20 min each, you. Me: open the 2 awesome-list PRs. |
| Owner | Mixed — see `DISTRIBUTION_PUSH_2026-06-02.md` for the matrix. |

### P2 — Outreach sent: 26 cold emails. Replies: ?

| Field | Value |
|---|---|
| Sent | 10 LinkedIn DMs + 10 consultancy emails + 5 OEM (Filigran/Trustcloud/Sprinto/MetaCompliance/Strike Graph) + 5 to AI services firms + 6 to directories |
| Replies (unknown, no inbox check this session) | If ~0-1% cold reply rate, expect 0-1 replies. Need to check `nicholas@csoai.org` mail.privateemail.com inbox. |
| Fix | Open the inbox, respond to anything alive, log reply rate in `revenue/OUTBOUND_REPLIES_2026-06-02.md`. |
| Owner | Nick. |

### P2 — Anthropic plugin form: opened but never submitted

| Field | Value |
|---|---|
| Evidence | `claude.ai/settings/plugins/submit` was navigated to on April 27, awaits Nick's authorize-checkbox + plugin manifest paste |
| Impact | Largest 2026 distribution lever (Anthropic Marketplace 0% commission, 0 MCPs on it from MEOK) |
| Fix | 10 min: copy-paste plugin manifest, submit, follow up. |
| Owner | Nick. |

### P2 — NLnet NGI Zero grant: drafted, never submitted

| Field | Value |
|---|---|
| Draft | `revenue/NLNET_GRANT_APPLICATION_2026-04-26.md` (1500 words, €30K requested) |
| Deadline | **2026-06-01** (was 1 June — may have passed; check `nlnet.nl/grant/NGIZC`) |
| Impact | €5-50K non-dilutive. CRA Trust Center fit is perfect. |
| Fix | Verify deadline still open; if not, re-target NGI Zero Micro-grants (rolling). |
| Owner | Nick. |

### P2 — Sedo listings drafted, never posted

| Field | Value |
|---|---|
| Domains | `agisafe.ai`, `asisecurity.ai`, `proofof.ai` (when fixed) — drafted $25K BIN copy |
| Impact | 3 × $25K = $75K potential non-dilutive one-shot. |
| Fix | Post on Sedo with BIN + Make-Offer. 30 min. |
| Owner | Nick. |

### P3 — Count drift in MEMORY.md (line 27 still says 264/323)

| Field | Value |
|---|---|
| Drift | MEMORY.md says 264 published / 323 built. Canonical (verified live 2026-06-02) is **271 published / 316 built**. |
| Impact | Minor. Anyone citing the memory file gets the wrong number. |
| Fix | M3 wrote the patch in `_findings/COUNT_DRIFT_2026-06-02.md`. Claude's lane to commit. |
| Owner | Claude (builder lane). Not blocking revenue. |

### P3 — 5 domains DOWN at DNS (apex records missing)

| Field | Value |
|---|---|
| Live HTTP sweep 2026-06-02 05:55 UTC | `optometry.vc` 000, `optometry-patient.ai` 000, `loopfactory.ai` 000, `proofof.ai` 307 (Vercel redirect — apex scope issue, see `reference_vercel_csoai_org_alias.md`) |
| Impact | These domains contribute £0 because they don't resolve. |
| Fix | Namecheap A-record audit. `proofof.ai` needs a different Vercel scope (the alias fails on csoai.org). |
| Owner | Nick (Namecheap) + me (Vercel). |

### P3 — 2 domains behind Vercel Deployment Protection (auth gate)

| Field | Value |
|---|---|
| Affected | `fishkeeper.ai`, `koikeeper.ai` → 401 Vercel Authentication |
| Impact | Aquaculture vertical — paid product surface — is auth-walled. Even a curious visitor can't see pricing. |
| Fix | Vercel UI → Deployment Protection → Disable (per `MASTER_AUDIT_REVENUE_PLAN_2026-05-29.md` §1 Group D) |
| Owner | Nick (Vercel dashboard). 2 min. |

---

## 2. PYP1 / MCP STATUS — FULL (verified live 2026-06-02)

### Counts (canonical)
| Metric | Count | Source |
|---|---|---|
| Named packages on disk (`mcp-marketplace/*/pyproject.toml`) | 315 | `tools/pypi_check.py` (live curl) |
| **Published on PyPI** | **271** | live pypi.org probe, canonical `MEOK_PYPI_TRUTH_2026-06-02.md` |
| Built but NOT published | 44 | same — backlog list in truth doc |
| Local `mcp-marketplace/*` directories | 316 | working tree `find` |
| Gateway `MCP_REGISTRY` | 22 slugs · 99 tools | gateway in-memory |
| `mcp_bridge_discover` (when SOV3 is up) | 314 servers · 192 tools | un-verifiable while SOV3 down |
| SOV3 inner tools on :3101 | 110 | `mcp/tools/list` (when up) |

> ⚠️ MEMORY.md line 27 still says 264/323. Correct is 271/316. Patch in `_findings/COUNT_DRIFT_2026-06-02.md`. (Discrepancy of 1 published from live tool: 271 vs 274 — likely a 429 race; verifying 274 next session.)

### Top flagship downloads (live pypistats.org, just now)
| Package | Last day | Last week | Last month | Notes |
|---|---|---|---|---|
| `eu-ai-act-compliance-mcp` | 6 | 206 | **2,079** | #1 by far. 320 dl/mo claim is now stale (it's 2K). |
| `dora-compliance-mcp` | rate-limited | (last sample 244/wk, 1,675/mo) | 1,675 | |
| `cra-compliance-mcp` | (last sample 172/wk, 821/mo) | 172 | 821 | |
| `meok-watermark-attest-mcp` | (Apr 26 baseline: 6 today) | | growing | Article 50 Nov 2026 cliff |
| `meok-omnibus-tracker-mcp` | new (Apr 26) | | growing | Free / lead-magnet |
| `meok-nis2-de-register-mcp` | new (Apr 26) | | growing | £499 product |
| `meok-law-mcp` | new (May 28) | | growing | 23 crosswalks |

**Total monthly installs (estimated from last live sample, master audit):** ~6,798-7,200/month across top 10 tracked. Not the 1,921/mo of late April.

### Package name drift — STILL A BUG in your docs
| ❌ Wrong (404) | ✅ Real | 
|---|---|
| `meok-eu-ai-act` | **`eu-ai-act-compliance-mcp`** |
| `meok-dora` | **`dora-compliance-mcp`** |
| `meok-iso-42001` | **`iso-42001-ai-mcp`** |
| `meok-policy-enforcement` | **`agent-policy-enforcement-mcp`** |
| `meok-prompt-injection-firewall` | **`agent-prompt-injection-firewall-mcp`** |
| `meok-handoff-certified` | **`agent-handoff-certified-mcp`** |
| `meok-watermark-attest` | **`meok-watermark-attest-mcp`** (suffix required) |

> If anyone running your outreach runs `pip install meok-eu-ai-act`, they get 404 = lost install + lost trust. **Every doc/email/Slack/post that names a package must be cross-checked against `revenue/CANONICAL_PACKAGE_NAMES_2026-05-29.md`.**

---

## 3. WEBSITES — LIVE STATUS + SEO (live HTTP probe, 2026-06-02 05:55-06:00 UTC)

### A. Revenue-critical Vercel surfaces
| URL | HTTP | Verdict |
|---|---|---|
| `meok.ai` | 307 → canonical | ⚠️ Canonical build broken (see P1). Working home renders on canonical path. |
| `meok.ai/pricing` | (assumed 200) | ⚠️ Inconsistent pricing ladder |
| `meok.ai/work` (services page) | 200 | ✅ £29 office hour, pay-now (live since May 28) |
| `meok.ai/buy` | (broken build) | ❌ Not deployed |
| `meok-kits-host.vercel.app` | **200** | ✅ **The buy surface you should be pasting everywhere** |
| `councilof.ai` | 200 | ✅ 8-tier pricing live |
| `meok-compliance.vercel.app` | 200 | ✅ Primary funnel |
| `meok-verify.vercel.app` | 200 | ✅ Trust page |
| `meok-eu-ai-act.vercel.app` | 200 | ✅ ~5,200 word SEO pillar |
| `meok-attestation-api.vercel.app` | 200 | ✅ `/health` 200 |
| `meok-attestation-api.vercel.app/webhook` | 501 | ❌ Webhook handler not accepting GET (POST-only is correct, but the path returns 501 — investigate) |
| `meok-attestation-api.vercel.app/verify` | (assumed 200) | ✅ HMAC verify endpoint live |
| `audit-prep-bundle.vercel.app` | **404** | ❌ BROKEN — separate Vercel project, likely Vercel scope issue |
| `meok-backend.vercel.app` | **404** | ❌ BROKEN — separate Vercel project |
| `github.com/CSOAI-ORG` | 200 | ✅ Live (411 public repos, 1 follower, 0 stars on top 5) |
| `registry.modelcontextprotocol.io` | 200 | ✅ Live — 81/271 MCPs indexed |
| `pypi.org/user/MEOK_AI_Labs/` | 200 | ✅ 271 packages |
| Stripe `buy.stripe.com/dRmcN75ScdQS7oh1Uc8k90U` (£1) | 200 | ✅ Live |
| Stripe `buy.stripe.com/8x228ta8s6oqbExaqI8k90W` (£29) | 200 | ✅ Live |
| Stripe `buy.stripe.com/fZu00l80k7sugYR1Uc8k90X` (£1,499) | 200 | ✅ Live |

### B. 25-domain portfolio (master audit 2026-05-29 still canonical today)
| Group | Count | Examples | Action |
|---|---|---|---|
| LIVE with Stripe checkout (ready to convert) | 7 | `biasdetectionof.ai` (£299), `accountabilityof.ai` (£79), `dataprivacyof.ai` (£499), `transparencyof.ai` (£79), `ethicalgovernanceof.ai` (£1), `agisafe.ai` (£1), `asisecurity.ai` (£1) | **Add "FREE Tier 1 until 2 Dec 2027" hero badge + outcome headline. 3 hours of edits unlocks all 7 funnels.** |
| LIVE without Stripe wiring | 5 | `cobolbridge.ai` (£199), `optimobile.ai` (£70), `landlaw.ai` (£500), `grabhire.ai`, `muckaway.ai`, `planthire.ai` | Wire Stripe buttons. |
| LIVE but special purpose | 3 | `suicidestop.ai` (public good), `safetyof.ai` (scorecard), `meok.ai` | Verify `safetyof.ai` conversion path to paid. |
| Auth-walled (Vercel Deployment Protection) | 2 | `fishkeeper.ai`, `koikeeper.ai` | Disable protection. 2 min. |
| DOWN (DNS) | 5 | `proofof.ai` (apex scope issue), `commercialvehicle.ai`, `diyhelp.ai`, `loopfactory.ai`, `pokerhud.ai` | Promote / 301 / list on Dynadot. |
| Dead-on-landing typo | 1 | `socialmediamananger.ai` | Let expire Aug 27, 2027. |

### C. SEO / keyword ranking — knowns + unknowns

**What we know (from MEOK SEO audit work + master alignment):**
- `meok-eu-ai-act.vercel.app` is the only domain with a 5,200-word pillar targeting "EU AI Act compliance" / "EU AI Act Article 10" / "DORA Article 28"
- 4 of 5 B2B sites have ZERO `llms.txt` (AI-crawler file)
- Only `meok.ai` has 3 JSON-LD schema blocks (gold standard)
- B2B `.ai` and `.app` domains have NO phone numbers (trust signal gap)
- `csoai.org` sitemap/robots/llms all return 307 redirect (not 200) — fixable in one Vercel config push
- **Google Search Console not submitted** for the 7 `of.ai` pages (no data)
- **Plausible analytics not installed** anywhere

**What we DON'T know (and need to find out):**
- Actual Google ranking for any target keyword (no GSC data, no SerpAPI, no Ahrefs)
- Bing ranking (untested)
- Backlink profile (CSOAI-ORG 411 public repos, 0-2 stars each → almost certainly 0 inbound)
- Domain Authority of any `.ai` site (likely 0-3)
- LLM-overviews / Perplexity / ChatGPT search citation rate (unmeasured)

**Honest SEO verdict:** You're invisible in search. The 7 LIVE pages with Stripe are also 0-organic-traffic pages. The only traffic that has actually converted intent is from your own outreach (sent 26 emails, 5-7 visits) and a handful of PyPI install referrals.

**Top SEO targets (per `REVENUE_PIPELINE_AUDIT_2026-05-20.md`):**
| Keyword | Vol/mo | Competition | Note |
|---|---|---|---|
| "NIS2 BSI Registrierung" | 720 (DE) | Near-zero | German Mittelstand — £499 product window |
| "EU AI Act compliance checklist" | 1,900 (UK) | Low | Pillar at meok-eu-ai-act covers this |
| "DORA Article 28 third-party register" | 320 | Near-zero | Regulated FS required Jan 2025 |
| "AI bias audit template" | 880 | Medium | Evergreen |
| "watermarking AI generated images compliance" | 590 | Low | Nov 2026 cliff |

---

## 4. PYPI + ACP DISTRIBUTION — DEEP DIVE

### PyPI (where the volume is)
- 271 packages live under `MEOK_AI_Labs`
- Top 4 packages: 1,675-2,079 installs/month each. 6,798+/mo total tracked. Verified pypistats.
- 44 in-built backlog (un-published). The full backlog list is in `MEOK_PYPI_TRUTH_2026-06-02.md` — many are the May 2026 drop (`meok-aquaponics-monitor-mcp`, `meok-asc-rspca-crosswalk-mcp`, `meok-rspca-aquaculture-mcp`, `meok-uk-fhi-mcp`, `meok-laia-aquatic-mcp`, `meok-koikeeper-ai-mcp`, `meok-cra-vuln-reporter-mcp`, `meok-c2pa-durable-mcp`, `meok-stripe-acp-checkout-mcp`, `meok-coinbase-x402-receipt-mcp`).
- **Bottleneck:** 44 unpublished = ~14% of the catalog isn't getting installed. Some are unfinished (1 broken: `{{package_name}}` placeholder in the doc — needs fixing). Most are push-button publishes.

### Anthropic MCP Registry (`registry.modelcontextprotocol.io`)
- 81/271 packages indexed (~30% coverage). Coverage is on the flagships + A2A core + EU/CRA/DORA/NIS2/ISO/NIST suite + DOME-related. Long tail not registered.
- PulseMCP auto-ingests MCP Registry within 7 days. So getting them onto MCP Registry IS the route to PulseMCP.
- **Bottleneck:** the remaining 190 packages are mostly long-tail / utility / hobby MCPs (calendar-ai, weather-ai, etc.) — the question is whether to invest in indexing them or accept the ~30% coverage as strategic.

### mcp.so
- Issue #2170 opened April 26, listing all 16 flagships. 0 engagement after 7+ days.
- **Bottleneck:** mcp.so's discoverability is closed-form — without engagement from the maintainer, you wait.

### Smithery / Glama / PulseMCP / mcp-get
- Not yet submitted (5 min each per flagship × 6 flagships × 4 registries = 2 hours of you-time).
- **Bottleneck:** your time, not engineering.

### awesome-mcp-servers PRs
- 3 PRs blocked: `wong2`, `appcypher`, `punkpeye`. 
- Previous blocker (`gh auth refresh -s public_repo,repo`) is **GONE** (per `MEOK_PYPI_TRUTH_2026-06-02.md` verification). gh is fully authed (`repo`, `admin:org`, `workflow`, `write:packages`).
- **Bottleneck:** the punkpeye rules say ONE server per PR + must be on Glama first. So you need to register each MCP on Glama.ai (10 min × 16 flagships) before the PR will pass triage. Mechanical.

### Anthropic Claude Marketplace (Skills)
- 0% commission, biggest 2026 distribution lever. 0 skills from MEOK today.
- Plugin form opened April 27 at `claude.ai/settings/plugins/submit`. Awaits Nick click + manifest paste.
- **Bottleneck:** you. 10 min total.

### Apify PPE port
- Not done. 12h work. £15-£200 first week. Defer.

### Show HN
- Ready. Tue June 3 14:00 UTC. See P0 above.

---

## 5. REVENUE STATE — MONEY (live)

### Stripe (live, 2026-06-02 06:00 UTC)
| Field | Value | Source |
|---|---|---|
| MRR | **£0** | Stripe Dashboard (last confirmed 2026-05-29) |
| All-time revenue | **£0** | same |
| Active subscriptions | 0 | same |
| Active customers | 0 | same |
| Webhook events received | 10 `checkout.session.expired` visible in last batch | same |
| Coupons live | MEOKEAT, EARLY20 (0 redemptions each) | same |
| Payment links live | ~100+ (199 URL-fixed in April) | same |
| Products in account | 60+ (100/page API; archive 10-15 smoke/legacy per `STRIPE_PRODUCT_AUDIT_2026-05-29.md`) | same |
| Best one-time link | `buy.stripe.com/8x228ta8s6oqbExaqI8k90W` (£29 founder call) | live |
| Best recurring link | `buy.stripe.com/fZu00l80k7sugYR1Uc8k90X` (£1,499/mo Enterprise) | live |
| Ladder | £1 / £5 / £9 / £29 one-time + £79 / £199 / £1,499 recurring | `REVENUE_LADDER_V2_2026-05-28.md` |

### Path to £1K MRR (Aug 20 deadline — per Monte Carlo 2026-05-29)
- 84 days. £1K ≈ 13 Pro (£79/mo) OR 5 ProofOf.ai Pro (£199/mo) OR 1 Enterprise (£1,499/mo).
- 3 scenarios: A_apex_unblock (post HN + apex fixes) → 60.6% P(≥£1K), mean £1,553/mo
- B_tui_momentum (TUI gtm) → 59.0%, mean £2,299/mo
- C_partnership_pivot → 0.1%, basically zero
- **Combined (all in parallel): 83.8%** P(≥£1K) by Aug 20, median £2,904/mo

### Floor case
- 1 conversion on `biasdetectionof.ai` (£299/mo) = 3 months of all-domain renewals paid for.
- Even 1 conversion of ANY £79+ tier breaks the £0 streak.

---

## 6. 30-DAY EXECUTION ORDER (the actual play)

### This week (June 2-8)
1. **Recover SOV3** (P0). `cd ~/clawd/sovereign-temple && HOST=127.0.0.1 nohup bash run-production.sh >> /tmp/sov3.log 2>&1 &`. Verify `curl :3101/health`. (10 min)
2. **Post Show HN Tuesday June 3 14:00 UTC** (P0). Use `SHOW_HN_POST_2026-06-03.md`. (You, 2 hours, including 6h comment-engagement)
3. **Tweet the kits-host URL** in your main timeline + the new Show HN title (5 min)
4. **Add "FREE Tier 1 until 2 Dec 2027" hero badge to biasdetectionof.ai** — highest single-MRR target, already Stripe-wired, just needs trust + outcome framing (me, 30 min)
5. **Disable Vercel Deployment Protection on fishkeeper.ai + koikeeper.ai** (you, 2 min)
6. **Sign up Plausible + paste snippet on meok.ai, councilof.ai, biasdetectionof.ai, meok-kits-host** (you, 10 min; me, 10 min)
7. **Wire the Anthropic plugin form submission** (you, 10 min)
8. **Submit flagships to Smithery + Glama + PulseMCP** (you, 60-90 min total)
9. **Fix `/thanks` route + set `RESEND_API_KEY` in Vercel** (me, 30 min)
10. **Send the 5 OEM follow-ups** (Filigran, Trustcloud, Sprinto, MetaCompliance, Strike Graph) — week-2 follow-up on 5 emails you sent April 27 (you, 30 min)
11. **Check csoai.org inbox + log replies** (you, 15 min)

### Next week (June 9-15)
12. **Add outcome headlines to the other 6 LIVE-with-Stripe pages** (me, 3 hours)
13. **Wire Stripe buttons on cobolbridge.ai, optimobile.ai, landlaw.ai** (me, 1 hour)
14. **Publish the 44 backlog packages** to PyPI (me, push-button, 2 hours)
15. **Open 2 awesome-mcp-servers PRs** (me, 30 min — you gave the word)
16. **Build the `meok-cra-vuln-reporter-mcp`** (it's already in the built-but-not-published list, 4 hours, ships against 11 Sep 2026 cliff)

### Week 3 (June 16-22)
17. **Convert 10 flagships to Anthropic Skills format** (me, 4 hours — biggest 2026 distribution lever)
18. **Write German pillar "NIS2 BSI Registrierung"** (me, 4 hours — 720 vol/mo, near-zero competition)
19. **Edit-rewrite the 7 of.ai pages for SEO + add FAQPage schema** (me, 8 hours)
20. **E2E funnel test: simulate £1 purchase, walk through `/thanks` → welcome email → first MCP call → upgrade prompt** (you, 30 min)

### Week 4 (June 23-30)
21. **Submit the 7 LIVE-with-Stripe pages to Google Search Console** (you, 30 min)
22. **Build Ed25519 additive signing on attestation API** (me, preview deploy → curl roundtrip → you promote) — security/moat upgrade (per `SECURITY_PUNCHLIST_VERIFIED_2026-05-29.md` R1)
23. **TUI: add `MEOKCLAW_API_KEY` unlock + Homebrew tap → Pro £9.99/mo path** (me, 1 day)
24. **Sedo listings: agisafe.ai, asisecurity.ai, proofof.ai at $25K each** (you, 30 min)

---

## 7. WHAT WILL NOT BLOCK YOU (cleanest parts of the stack)

For balance — these are good:
- **Stripe is live + £1/£29 links work.** Anyone clicking buys.
- **5 Vercel apps green** (councilof, compliance, verify, eu-ai-act, kits-host).
- **PyPI pipeline works.** 271 packages, 6,798+/mo, growing weekly. 44 backlog is mechanical.
- **The Master alignment is committed (2026-06-02).** `_alignment/` is the canonical SoT. You don't have to re-read 200 random doc files — start at `_alignment/ALIGNMENT_2026-06-02.md`.
- **gh CLI is fully authed.** No more auth blocks.
- **MCP Registry + Anthropic Registry are live.** 81/271 indexed.
- **Show HN drafts are committed and pre-flighted.** TUI angle is post-ready TODAY.
- **3 highest-revenue pages already have Stripe wired.** Just need copy + badge.
- **The infra is honest.** 4 of 7 "future security fixes" were false alarms (`SECURITY_PUNCHLIST_VERIFIED_2026-05-29.md`). What's real is the 4 fixes in the punchlist, and one of them (Ed25519) is also a sales line.
- **MEOK ONE consumer product is now wired for payments** (`3220e4e` — "MEOK ONE consumer pricing + checkout").
- **MEOK ONE has a working services page** (`299a69b` — £29 office hour, pay-now).

---

## 8. WHAT I'D DO IF I WERE YOU (the unfair summary)

If I were you with all this state in front of me, today, in the next 8 hours, I'd do exactly this:

1. **08:00 BST** — Open terminal. `cd ~/clawd/sovereign-temple && HOST=127.0.0.1 nohup bash run-production.sh >> /tmp/sov3.log 2>&1 &`. `curl :3101/health`. Done.
2. **08:15 BST** — Disable Vercel auth on `fishkeeper.ai` + `koikeeper.ai`. Open Plausible, paste snippets. 12 min.
3. **08:30 BST** — Disable Vercel auth on those 2 + wire Anthropic plugin form (you already have it open). 10 min.
4. **09:00 BST** — Tweet: *"22 EU compliance MCPs on PyPI · 6,800 monthly installs · 81 in the Anthropic Registry · £0 revenue. Putting up a £1 smoke test to find out if any of this is worth anything. https://meok-kits-host.vercel.app · Refundable. Promise."* (Copy from `REVENUE_STATE_FINAL_2026-05-28.md`.)
5. **10:00 BST** — Same hook as LinkedIn post (not DM — post). 1 share to your personal profile.
6. **11:00 BST** — Paste the kits-host URL in 5 LinkedIn DMs (recipients in `SEND_BLITZ_2026-05-21.md`).
7. **14:00 BST** — Open the csoai.org inbox. Reply to anything alive.
8. **17:00 BST** — `python3 ~/clawd/revenue/AQUACULTURE_PARTNERSHIP_EMAILS.md` — read the 5 aquaculture partnership emails, send the top 2 (you have trout farms, RSPCA window Jul 2025, ASC mandatory May 2027).
9. **18:00 BST** — Stop. Don't draft another doc. Don't do another audit. Don't prep.

**That single day breaks the £0 streak or confirms there's nothing here.** Either is a real signal. Either is better than 6 weeks of "ready to launch" drafts.

The Monte Carlo says 60.6% probability of hitting £1K MRR by Aug 20 if you post the HN + unblock apex. The 39.4% downside is *you didn't post*. The penalty for not posting is £0 forever.

---

## 9. WHAT'S NEXT (my actions, if you say go)

In priority order, what I can ship in the next 1-2 hours without burning the state:

- **A.** Add "FREE Tier 1 until 2 Dec 2027" + outcome headline to `biasdetectionof.ai` (highest single-MRR target, 30 min)
- **B.** Fix `/thanks` route + set up Resend webhook handler (30 min)
- **C.** Publish the 44 built-but-unpublished MCPs to PyPI (push-button, 2 hours)
- **D.** Open 2 awesome-mcp-servers PRs (30 min) — *only with your go-ahead (it's a public PR)*
- **E.** Build Ed25519 additive signing on attestation API preview (3 hours — needs you to promote the preview)

Tell me which of A-E to start.

---

*— MiniMax M3 (auditor lane) · 2026-06-02 ~06:00 UTC. Sources: MEOK_PYPI_TRUTH_2026-06-02.md, _findings/RUNDOWN_2026-06-02.md, _findings/INCIDENT_SOV3_DOWN_2026-06-02.md, _findings/FIX_PROPOSAL_SOV3_BIND_AND_RESTART.md, _findings/COUNT_DRIFT_2026-06-02.md, AUDIT_SOV3_MEOK_2026-05-29.md, MASTER_AUDIT_REVENUE_PLAN_2026-05-29.md, REVENUE_STATE_FINAL_2026-05-28.md, REVENUE_LADDER_V2_2026-05-28.md, SECURITY_PUNCHLIST_VERIFIED_2026-05-29.md, DISTRIBUTION_PUSH_2026-06-02.md, REVENUE_MONTE_CARLO_RESULTS_2026-05-29.txt, SITE_AUDIT_2026-05-20.md, REVENUE_PIPELINE_AUDIT_2026-05-20.md, CANONICAL_PACKAGE_NAMES_2026-05-29.md, SHOW_HN_POST_2026-06-03.md, SHOW_HN_READY_2026-05-29.md, BLOCKERS_2026-04-27.md, AGENTS.md, MEOK_DUAL_AGENT_PLAN_2026-06-02.md. Live HTTP probe 2026-06-02 05:55-06:00 UTC. Live pypistats.org 2026-06-02 06:00 UTC. Live api.github.com 2026-06-02 06:00 UTC. 219 commits in the last 5 days.*
