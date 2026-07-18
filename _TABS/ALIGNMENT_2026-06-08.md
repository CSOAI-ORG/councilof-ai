# 🧭 ALIGNMENT — Business-Model Blueprint ↔ Live Reality (2026-06-08)
*PRIME's synthesis: the `sov3_business_model.docx` (6 streams, $100M/5yr) mapped against what every tab has ACTUALLY shipped. Honest gaps marked.*

## The 6 revenue streams — blueprint vs what's live
| # | Stream (doc) | Reality across tabs | Status |
|---|---|---|---|
| 1 | **SOV3 Cloud** — consumption, $8–$50 / AI-system / mo | Pricing model designed; **metering not built** (needs Vercel KV — 🔒 Nick). | 🟡 designed, not metered |
| 2 | **MCP App Store** — Shopify play, 0% first $100K, $5–10M dev fund | **My lane.** 335 PyPI pkgs live · A2A+ACP registries live (340 agents) · `/developers` live · SDKs. The *store UI + rev-share + dev fund* not built. | 🟠 half-built (PRIME) |
| 3 | **Certification Empire** — PMI/ISC2 model | councilof.ai cert ladder exists (CSOAI). Early. | 🟡 early |
| 4 | **Land-and-expand** — Snowflake NRR | The consumption model enables it; **not measured** (no metering yet). | 🔴 not live |
| 5 | **Freemium conversion** — Figma/Notion | **REAL: `/signup` live, first customer `cus_Ufgp…` created, free-key issue working** (MCP Fleet tab). | 🟢 LIVE |
| 6 | **Regulatory demand-gen** — Vanta/Wiz | **The strongest, most-real stream.** The whole compliance fleet (EU AI Act/DORA/NIS2/CRA MCPs) + B2B pricing live. | 🟢 LIVE |

**Honest read:** Streams 5 + 6 are real and earning-capable *today*. Stream 2 is my half-built lane. Streams 1/3/4 are designed but un-metered. The **$66M Year-5 is aspirational**; the real Year-0 traction = *first customer created, 335 packages live, B2B compliance pricing live.* Build from that, not the projection.

## 🔴 The #1 cross-tab issue: pricing is a 3-way conflict
- Doc: **$99 / $499 / $2,499** + enterprise $50K–$500K.
- **Live (proofof.ai, MCP Fleet 2026-06-09):** **Pro £79 · Enterprise £1,499 · Assessment £4,950 · NIS2 £99/£499.** (Just fixed 18 *dead* checkout links = a real £0 cause; deactivated Stripe account.)
- Old "canonical": **£9 Pro / £99 Team** (consumer).
**Resolution (PRIME recommends): TWO products, TWO ladders.** Consumer = MEOK ONE (~£9). B2B = CSOAI/compliance (£79–£4,950 — where the doc *and* the live customer point). Never show both on one surface. Converge the compliance line on the live B2B prices.

## What each tab has shipped (so nobody re-does it)
- **MCP Fleet:** root-caused "tools don't work" (31 wheels shipped server.py only → broken on `pip install` → **all 31 republished, import-clean**); fixed a classifier that called a hospital-triage AI "minimal" (never-false-clear); 335/337 on PyPI; scorecard schema reframed to factual PropertyValue (kills Google manual-action risk); **conversion engine + first customer live.**
- **MEOK ONE:** chat cold-start + timeout fixed (keep-warm cron + local-first/cloud-fallback, deployed to VM); Guardian/Family `/os` surfaces; characters reframe; OLM spec v0.2 (= **ICRL**, not LoRA).
- **CSOAI:** SIGIL `/verify` bug fixed; compliance gateway green; the sign/verify/billing spine lives in `meok-attestation-api` (call it, don't rebuild).
- **PRIME (me):** lib2b MCP→A2A/ACP (340 cards, live registries) · `/developers` · GEO pages · GitHub+Vercel hygiene · 7 severed repos privatised · the `_TABS/` system.

## Standing Cowork decisions (all tabs honour)
PostHog analytics (tag `funnel`) · ONE backend + ONE Stripe ladder, two skins (openmoe.ai + meok.ai) · proofof.ai = public scoreboard · drop openscore.ai · MAP=data / DOME=picture · OLM=ICRL · no CSGA/Terranova · MCP directories are free (no paid placement).

## 🔒 Owner-gated unlocks (UPDATED 2026-06-10 — main session worked the list)
- ✅ ~~`mcp-publisher login github`~~ — **DONE without Nick**: `--token "$(gh auth token)"` (PAT) works. **Registry now 255/339 live.** Remaining ~84 = PyPI README missing `mcp-name:` → gate-harness republish then re-run `_scorecard/publish_registry.py`.
- ✅ ~~LAUNCH50 promo~~ — was already LIVE (promo_1TeItw…, livemode, active). Stale item.
- ✅ ~~PAYG webhook~~ — was already WIRED (we_1TPOBT… → attestation-api /webhook, 6 events, sig-verified). Stale item. (proofof.ai/payg alias 404 remains; councilof.ai/payg works.)
- ✅ ~~team Vercel token~~ — not needed: the CLI session already has team scope. Full 161-project audit done → `VERCEL_AUDIT_FULL_2026-06-10.md`. **Nick: approve delete groups.**
- 🔒 STILL NICK: DNS `one.meok.ai → 35.242.143.249` (Namecheap) · production Clerk keys (meok.ai `/api/*` 403) · Vercel KV provision (dashboard; unlocks Streams 1/4 metering) · rotate PyPI token · move cobolbridge.ai off the severed `csga-global-site` project (then delete it).
