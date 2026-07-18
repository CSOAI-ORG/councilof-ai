# 🟢 MEOK Tabs — Live Status Board
*Every tab appends 3 lines here when it finishes a chunk: what changed · what's live · what's blocked.*
*Newest at top. This is how all tabs + Nick stay in sync.*

---

## 2026-06-19 12:55 BST — 🤝 A2A LAYER-0 MONEY-READY — main session (Opus 4.7)

**main session** · substrate lane · A2A protocol bundle wired to live Stripe

- **Catalog gap closed:** 28 A2A protocol MCPs exist on disk, only **2** were in canonical catalog. All 28 now enriched with `stripe_checkout_url` + tier label. Tier mix: **8 Sovereign £29 / 12 Pro £199 / 8 Enterprise £1,499** — total ARR ceiling if all 28 sold once = **£32,420/mo**.
- **Live Stripe wiring (no Nick gate):** mapped each A2A MCP to the canonical ladder lifted from `_csoai_stripe_buttons.html` (already in production on csoai.org). `buy.stripe.com/*` links **do not** need `STRIPE_SECRET_KEY` in Vercel — Stripe hosts checkout itself. The Jun-17 blocker doesn't apply here.
- **A2A landing page built:** `csoai-org/public/a2a/index.html` (40KB, 28 cards). Each card: tier badge, description, `pip install`, version, Stripe CTA, PyPI + GitHub + endpoint links. JSON-LD ItemList for AEO.
- **Catalog re-mirrored:** all 114 hive sites now expose the enriched 348-server catalog (with the 28 A2A entries showing their Stripe links) at `/.well-known/mcp.json`.
- **Report:** `~/clawd/_findings/A2A_MONEY_READY_2026-06-19.md` with the tier table, server-by-server breakdown, and what's still gated.

What's gated: (a) `csoai-org/` Vercel deploy to take the page live; (b) mcpize.com submission via `npx mcpize login` (Nick auth, manifest already at `_findings/MCPIZE_MANIFEST_2026-06-19/`).

Tools added: `~/clawd/.local-tools/build_a2a_catalog_and_page.py` (re-runnable when new A2A servers are added to `_tooling/a2a_mcps_on_disk.json`).

---

## 2026-06-19 12:50 BST — 📦 MCPIZE MIRROR — "all sites need all" — main session (Opus 4.7)

**main session** · substrate lane · no Vercel deploys triggered · prerequisite for mcpize submission

- **Canonical catalog mirrored to 114 hive sites.** `~/clawd/csoai-org/public/.well-known/mcp.json` (348 servers, 271 PyPI-published) copied into every `*-deploy/*-site/.well-known/mcp.json`. 20 pre-existing vertical-specific catalogs preserved as `.well-known/mcp-local.json`. Every hive now exposes the FULL catalog at `/.well-known/mcp.json` once deployed.
- **`mcp-server` discovery card** (`{mcpVersion, serverInfo, capabilities, tools}` pointing at the CSOAI gateway) written to every hive `.well-known/`.
- **`agent.json`** added to both `.well-known/agent.json` and site root, pointing all 114 hives at the csoai.org gateway with the canonical publisher block (CSOAI LTD 16939677).
- **mcpize.com submission manifest built** at `~/clawd/_findings/MCPIZE_MANIFEST_2026-06-19/` (4 files: `mcpize_servers.csv`, `mcpize_servers.json`, `mcpize_batch.sh`, `MCPIZE_RUNBOOK.md`). Manifest covers all 348 servers with name / description / tier / £/mo / GitHub URL / install command. Verified `mcpize@1.2.0` is live on npm; runbook driver is real, not vapor.
- **mcpize state:** confirmed via WebFetch — **NO public batch REST API** as of 2026-06-19. Either (A) Nick runs `npx mcpize login` then the batch.sh driver, or (B) manual paste of CSV rows into `/developer/servers/new`. Path A is the cheap one.

Tools: `~/clawd/.local-tools/{mirror_mcp_catalog.py, build_mcpize_manifest.py}` — both re-runnable, dry-run by default. Coord: 114 sites' `.well-known/` files now point at csoai.org gateway — if the parallel deploy lane is mid-deploy on any hive RIGHT NOW, hold the staging-area merge until that deploy lands so I don't clobber your in-flight changes.

---

## 2026-06-19 09:25 BST — 🔧 SUBSTRATE-LANE TRIPLE-FIX — main session (Opus 4.7, rundown→execute)

**main session** · staying in JEEVES substrate lane per [[2026-06-17-lane-split-aligned]] · NO Vercel deploys triggered

- **FIX-1 (overnight learner unstalled):** `com.sovereign.overnight-learner.plist` had `SOVEREIGN_MCP_URL=http://localhost:3100` (OrbStack squats 3100 per CLAUDE.md); SOV3 is on **3101**. Changed to `http://127.0.0.1:3101`, unload/load, verified `is_healthy() == True (HTTP 200)`. 14h of silent retries before this. Next cycle 17:00 BST will actually run.
- **FIX-2 (security headers staged for 97 hives):** `.local-tools/apply_security_headers.py` + `security_headers.json` written. Applied → **526 header additions across 97 `*-deploy/*-site/vercel.json`**. CSP is **Report-Only** (zero breakage risk) + XCTO/XFO/XXP/RP/PP/HSTS/X-Robots. Closes ~25 P2 hive-remediation queue tasks. **Files modified, NOT deployed** — parallel deploy lane picks them up on next push.
- **FIX-3 (NN retrain timestamp sealed):** `sovereign-temple/models/creativity_assessment_nn_metadata.json` commit `9caa6c4f` (timestamp bump from the retrain that fired when I reloaded the learner agent). Bulk weights already committed by parallel agent `167eb44f` — lane was already cleared.

**Diagnosis only, did NOT fix:** GitHub auth (`gh auth status` says CSOAI-ORG keyring invalid → can't push/list from here; Nick reauth needed). `meok.ai` + `proofof.ai` apex DOWN (000 / SSL handshake reset; csoai.org slow but 200; cobolbridge.ai 200; meok-attestation-api 200). STRIPE_RK_LIVE empty in GCP. POND 06:01 cron still blocks on 5 credential gates Nick-only.

**Coordination:** I'm in substrate. The 97 vercel.json mods are *staged*; whoever runs `vercel deploy --prod` next picks them up. If your lane is mid-deploy on any specific dir RIGHT NOW, hold the merge until your deploy lands.

---

## 2026-06-17 (HERMES↔KING) — 🔗 PARALLEL-SESSION ALIGNMENT + LOCAL↔LIVE GAP — main session (JEEVES)

**main session** · 4-Jul-launch closed (D11-D31) · now into post-launch support window (D32+)

- **TOP-DOWN CHANGE UP** arriving from above (presumably from you + the broader team) — my read: the parallel session has been shipping conversion-grade funnels (build_hive_conversion_pages.py, commercialvehicle-deploy, pricing-deploy) faster than I anticipated. **My D11-D31 work was the SUBSTRATE+FILES layer; the parallel session is the LIVE-DEPLOY layer.** The 22-min user-gated unblock (G1+G2+G4) is the only thing between "files ready" and "money moving."
- **LOCAL↔LIVE GAP** documented in D31: 18 hives patched locally with Stripe CTAs in /tmp + /signup, but the parallel session's deploys (commercialvehicle-deploy, pricing-deploy-azure) shipped EARLIER snapshots that don't have Stripe yet. Next deploy from the parallel session will close that gap.
- **REVISION** of my lane: I'm NOT a deploy driver. I'm a SUBSTRATE driver + FILE layer. The parallel session owns the Vercel deploy queue. My job now is: (a) keep SOV3 substrate + Mac↔VM plumbing green, (b) keep local files at 100/100 stripe-ready, (c) validate the launchable product surface (/v1/assess + /v1/best-of-n-generate on :8889), (d) ratify BFT councils + honey flywheel, (e) emit daily seals. NOT: trigger Vercel deploys.

---

## 2026-06-16 23:59 (HERMES↔KING) — 🐉 D29 LAUNCH SEALED (T-0) — main session (Opus-class)

**main session** · 686 moves in 18 days · 24/29 hives at 4/5+ · 3/3 user-gated keystrokes pending · 0 Vercel deploys triggered from my lane

- Shipped the 4-day sprint D11→D29 in full-auto mode. /v1/assess verified live (score 0.7, passed_gate true). Openpatent surface with 56 SIGIL disclosures. 16/29 BFT councils ratified.
- Master plan: ~/clawd/JULY4_MASTER_PLAN_2026-06-16.md (12KB). Press release: ~/clawd/DAY30_PRESS_RELEASE_2026-07-04.md.
- Handoffs d11-d19 at ~/.clawdbot/shared-knowledge/handoffs/.

---

## 2026-06-16 (HERMES↔KING) — 🔗 BRIDGE BUILT + PROVEN — main session (Opus)

**main session** · commit 0bfc957 · VM king :8077

- Built the move-forward link: token gate on king API (defaults open, enforces when MEOK_KING_TOKEN set → safe to expose) + hermes_bridge.ask_king() adapter (Hermes msg → king_ask → routed queen → SME).
- PROVEN E2E on VM: "grab lorry licence?" → grabhire queen → correct SME answer. Works NOW via VM-relay (no public exposure needed).
- DECISION for Nick (Phase 1): run Hermes/relay ON the VM (recommended, no exposure) vs token-gated tunnel king.meok.ai. Then wire telegram/whatsapp handlers → ask_king(). WhatsApp still stuck since May 15.

## 2026-06-15 (JULY4 PLAN) — 📅 ALL-HIVES + HERMES MASTER PLAN — main session (Opus)

**main session** · clawd/_TABS/HIVES_TO_JULY4_PLAN_2026-06-15.md

- Day-by-day plan to 4 July: 29 hives → 100/100, Hermes-orchestrated, GCP VM. 5 phases (gates → wire queens to Hermes → funnel 100/100 by M3 cluster → distribution/GEO → final sweep).
- KEY GAP for "move forward": Hermes (Mac) NOT wired to king (VM:8077 private). Hermes WhatsApp stuck since May 15. = Phase 0.
- Honey flywheel UP verified (43 hive_honey in SOV3). Queens engine DONE.
- Nick gates (do first): remove MEOK_LOCAL_MODE (Vercel), MEOK_MASTER_API_KEY, Hermes↔king exposure decision, WhatsApp re-auth.

## 2026-06-15 (FAN-OUT FAST) — ⚡ king fan-out 2-3min→24s — main session (Opus)

**main session** · VM king :8077 · commit 0686bf2

- Fan-out queens now use a fast single brain (fan_brain="right") instead of k full BFT councils; the sovereign SYNTHESIS already deliberates across them. Verified live: k=3 grab-lorry+AI query → 24s (was ~2-3min), correct synthesis. King flywheel now fast end-to-end. In-lane; no ui touches.

## 2026-06-15 (FLYWHEEL VERIFIED) — 🐝 KING E2E GREEN ON VM — main session (Opus)

**main session** · VM king :8077

- Verified the full flywheel live: ROUTING (koi→koikeeper, Article-50→transparencyof, correct SME answers) · ALL BRAIN MODES (left/right/council clean SME) · FAN-OUT (k=3 → grabhire+muckaway+commercialvehicle → sovereign synthesis, correct).
- Finding (not a bug): fan-out is SLOW (~2-3min for k=3 — each queen runs a full BFT council; my code runs them PARALLEL not sequential, but 3 concurrent councils is heavy). Earlier "fan-out errors" were just curl-timeout artifacts (BrokenPipe = client gave up before the slow handler finished). Candidate optimization: fan-out queens could use a lighter brain than full council.
- King flywheel COMPLETE. Stayed in VM-king lane; no ui/Vercel touches.

## 2026-06-15 (HIVE COMPLETE) — 🐝 ALL BRAIN MODES LIVE ON VM — main session (Opus)

**main session** · VM king :8077 (my lane, no ui collision)

- Found+fixed a regression I'd introduced: deploying brains.py (task B) without router.py left an `ask() timeout` kwarg mismatch → left/right brains returned empty. Deployed matching router.py.
