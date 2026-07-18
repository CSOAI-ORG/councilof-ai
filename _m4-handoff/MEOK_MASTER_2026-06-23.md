# MEOK MASTER — Consolidated Source of Truth
**Date:** 2026-06-23 · **T-11 to July 4 2026 (23:59 BST)** · **Machine:** this one = MEOK build host (CSOAI work lives on the M2)

> **SINGLE SOURCE OF TRUTH for the MEOK build host.** There were 7 competing "master" docs (6 in Cowork's iCloud `SOV3-Launch/` + this one) — that sprawl is collapsed (see §0.7). Canon = TWO halves: **this file** (engineering/topology, live-verified from the host) + Cowork's `MEOK_MASTER_CONSOLIDATION_2026-06-23.md` (product/GTM/live-state). Everything else is superseded. Point all agents/tabs here first.

---

## 0. The machine split (decided)
- **This machine (here)** = **MEOK** build/run host. Flywheel, hives, gaming, Hermes, sovereign-town all run here.
- **M2 MacBook** = **CSOAI** (site, compliance, GTM). Hand-off doc: `CSOAI_M2_HANDOFF_2026-06-23.md` (pushed to `CSOAI-ORG/clawd-workspace`).
- Coordination across machines is via the **`CSOAI-ORG/clawd-workspace` git repo** + the **swarm ledger** (`/api/swarm/emit` → sovereign-town).

## 0.5 LIVE-VERIFIED STATE — measured from THIS host (2026-06-24 04:36 UTC)
Cross-confirmed Cowork's bridge reads by hitting the substrate directly from the build host:
| Surface | Endpoint | Result |
|---|---|---|
| **MEOK API** | `127.0.0.1:3200` | 🟢 `200 operational v3.0.0` — **235 nodes** (36 council / 144 expertise / 55 bridge), 12 domains |
| **MEOK MCP** | `127.0.0.1:3102` | 🟢 healthy — **7 neural models trained** (care_validation, threat_detection, relationship_evolution, care_pattern, dependency, partnership, creativity r²=0.91), memory connected, consciousness 0.575 |
| **SOV3** | `127.0.0.1:3101` | 🟢 healthy — **127 tools** |
| **Sovereign-town flywheel** | `meok-backend` VM | 🟢 `flywheel_ledger_vm.jsonl` growing live; dashboard + anchor/sov-export deployed (this session) |

⚠️ **All three bind `localhost`** (local/tunnelled), not public. So **MEOK OS renders LIVE only when opened on this machine**; deployed to a public URL it shows the static 23-Jun snapshot until these get a public endpoint + OAuth. The brain is real and trained — it is *not* yet publicly reachable.

## 0.6 PRODUCT REGISTER — every MEOK product + MEOK OS coverage (the audit)
| Product | On disk | Status | MEOK OS app |
|---|---|---|---|
| Sovereign Town (flywheel/ledger — THE MOAT) | `clawd/sovereign-town` | 🟢 live on VM, ledger growing | Hive Mesh / King Console |
| SOV3 King + neural brain | VM `:3101/:3200/:3102` | 🟢 **VERIFIED** (235 nodes, 7 NN, 127 tools) | King Console / Aethelgard / Consciousness |
| meok-compliance-gateway (keystone, ~294 MCP fleet) | `~/meok-compliance-gateway` (136 entries) | 🟢 real FastMCP gateway + x402 | Compliance Fleet |
| Gaming BIG 3 (blizzard/fortnite/gta) | `~/meok-gaming/mcp-gaming-empress` | 🟢 3/3 verified, emit attested | Characters / Gaming |
| MEOK ONE (Guardian / Family OS / OLM) | `~/meok-os` | 🟢 VM-live; `one.meok.ai` DNS pending | MEOK ONE |
| meok-saas (dashboard / billing / swarm emit) | `~/meok-saas` | 🟡 built, Vercel-targeted | Revenue |
| meok-ai (marketing flagship) | `~/meok-ai` | 🟢 meok.ai live | *(website, not an OS app)* |
| Watchdog cert / Article 50 / watermark-attest | various | 🟡 built | Watchdog / Article 50 kit |
| **meok-protocol-0** (zero-barrier seam) | `~/meok-protocol-0` | 🟡 reference seam | 🔴 **NOT in OS (gap)** |
| **MEOK-AI-Labs** (robotics/humanoid: Berkeley/Asimov) | `~/MEOK-AI-Labs` | 🟡 hardware program | 🔴 **NOT in OS (gap)** |
| proofof.ai (public verify mirror) | Vercel `team_4Ik` | 🔴 stuck on wrong Vercel account | Drift/Truth (flags it) |

**MEOK OS coverage = 11 / 11** — verified against the live file 2026-06-24 (`MEOK_OS/index.html` now has **18 apps** — added `🌍 MEOK Earth` (embeds the live globe) + `🐉 Character Archetypes` (decks: evolution stages + 4 archetype families + learning paths + EI3 trust-SBT) — incl. `protocol0` + `labs`; JS syntax-clean). The "9/11 gap" in an earlier draft was stale. Live data binds localhost → renders live only on the build host (see §0.5). Per-product detail: Cowork's `_inbox/wave4-claude-actionables/08_MEOK_PRODUCT_MASTER_ALIGNMENT` + `09_GITHUB_LIVE_SCAN`.

**MEOK Earth (3D-globe UI) — 🟢 Week-1 WOW BUILT + verified 2026-06-24.** In `~/meok-town-view` (`src/MeokEarth.tsx`, behind a `🌍 Earth | 🏙️ Town` toggle): zero-token CesiumJS globe (no ion/Google tiles — `baseLayer:false` + dark globe + atmosphere + EllipsoidTerrainProvider), 12 hive-civilization regions + labels, governed/flagged agent markers, King→hive governance arcs, layer-toggle panel, animated `proofof` compliance ring. **Proof:** `npm run build` green (tsc+vite), `dist/cesium` assets copied, renders live (screenshot), **0 console errors / 0 ion 401s**. Spec: `MEOK_OS_UI_BUILD_SPEC_2026-06-24.md`.
- 🟢 **Real ledger feed wired** (`src/ledgerFeed.ts` + `scripts/export-ledger.mjs` → `public/ledger-snapshot.json`): reads the REAL signed flywheel ledger — **0 governed vs 48.8M ungoverned crimes over 583M episodes, Ed25519-signed, chain 458/458 verified**. Surfaced as a "Sovereign Flywheel" card + governed-integrity ring (=100). Live `VITE_LEDGER_URL` override supported.
- 🟢 **Labels decluttered** (Cesium CustomDataSource clustering) — EU pile-up fixed.
- 🟢 **Embedded in MEOK OS** as the 17th app (`🌍 MEOK Earth`, iframe → `MEOK_EARTH_URL` default :5173); verified rendering live inside the OS window.
- 🟢 **PUSHED + hardened** → `github.com/CSOAI-ORG/meok-town-view` (private, `main`, HEAD `b6474cf`). M2 can pull. Includes: real OSM map toggle, left side-menu, click-to-fly hives, Policies layer, gold theme, clean build (no chunk warning), `vercel.json` (Vite SPA), `.github/workflows/ci.yml` (build + ledger-integrity assert), full README.
- Owner-gated finals: `vercel` deploy (then set MEOK OS `MEOK_EARTH_URL` to the URL); run the Colab notebook to replace SAMPLE policies; deck.gl-over-Cesium heatmap (deferred — not a clean integration).

## 0.7 The 7-master sprawl — collapsed to 2
| Doc | Verdict |
|---|---|
| `clawd/MEOK_MASTER_2026-06-23.md` (this) | ✅ CANON — engineering/topology, host-verified |
| `SOV3-Launch/MEOK_MASTER_CONSOLIDATION_2026-06-23.md` (Cowork) | ✅ CANON — product/GTM/live-state |
| `MEOK_MASTER_REGISTER` · `MASTER_33_WEEK_PLAN` · `MEOK_33WEEK_MASTER_PLAN` · `LAUNCH_RUNWAY_T-11` · `EXECUTE_NOW_T-11` | 🟡 superseded — historical/reference only |
A pointer (`_READ_FIRST_SINGLE_SOURCE.md`) is dropped in the iCloud `SOV3-Launch/` folder so M2/Cowork converge here.

## 1. Architecture (layered — the one true stack)
```
sovereign-town  → Ed25519 episode ledger (THE MOAT: governed-vs-ungoverned, attested)
      ↑ reads/anchors
meok-saas       → product dashboard + billing (Clerk+Stripe, attestation-gated)  ← canonical product surface
meok-ai (/ui)   → marketing flagship (meok.ai live)                               ← canonical marketing surface
meok-town-view  → 3D town viz (Vite+R3F, embedded in meok-ai)                     ← presentation only, reads ledger
```
Rule (binding): **the society sim stays headless; renderers/engines read the ledger, never run the sim.** See `sovereign-town/ARCHITECTURE_GUARDRAIL.md`.

## 2. Canonical sub-docs (don't duplicate these — update them)
| Doc | Owns |
|---|---|
| `SOVEREIGN_TOWN_MASTER_PLAN_2026-06-19.md` | The flywheel moat: 24/7 towns, ledger, openpatent, MEOK Labs publishing |
| `JULY4_MASTER_PLAN_2026-06-16.md` | The 29-hives → 100/100 launch rollout |
| `MASTER_EXECUTION_PLAN_D31.md` | Daily gates + cluster schedule to July 4 |
| `CSOAI_LAYER0_UP_MASTER_STACK_2026-06-19.md` | The layered architecture (above) |
| `CSOAI_CANONICAL_MAP_2026-06-23.md` | MEOK↔CSOAI boundary / surface reconciliation |
| `CSOAI_ALIGNMENT_AND_BRIDGE_2026-06-23.md` | Swarm wiring (G6: claude/hermes/kimi) |
| `sovereign-town/ARCHITECTURE_GUARDRAIL.md` | Sim-vs-renderer decoupling + reusable-OSS license table |

## 3. July 4 plan (T-11) — what "ready" means
**Launch gate:** 29 hives at 100/100 by 4 Jul 23:59 BST. **Proof points (the demo):** (1) one verified compliance report, (2) one openpatent disclosure, (3) one real revenue transaction — each Ed25519-signed into the ledger.
**Gates still on Nick (deploys/creds):** Vercel deploy, API key, Hermes bridge live, WhatsApp/Telegram channel, `/signup` flow. (Per `MASTER_EXECUTION_PLAN_D31`.)

## 4. The BIG 3 (gaming) — VERIFIED 3/3
`meok-gaming/mcp-gaming-empress`, verified via `scripts/big3.mjs`:
- **blizzard-wow-mcp** (10 tools) — private AzerothCore/TrinityCore, intelligence-only.
- **fortnite-uefn-mcp** (7 tools) — authoring only, runs outside island (UEFN §2).
- **gta-fivem-mcp** (6 tools) — private FiveM RP only.
All compile, pass handshake, emit Ed25519 attestations to the ledger. ⚠️ Marketing copy ("$200B / 6 MMOs / zero competitors") is **unverified** — superseded by this honest status.

## 5. Hermes + swarm
- **Hermes** = multi-platform agent gateway, **running now** (daemon PID 1197). Model: OpenAI `gpt-4o-mini` → local Ollama `gemma3:4b` fallback. Code: `~/.hermes/hermes-agent/`.
- Wired two ways: **(a) MCP tools** `hermes_ask`/`hermes_research`; **(b) swarm emitter** via `/api/swarm/emit` (server-held per-agent Ed25519 key).
- Swarm = **claude + hermes + kimi** → all produce `verified_done` with anchor ids.
- ⚠️ **Honest gap:** Hermes' emit is contract-built but **not E2E-tested** (no emit script in the gateway repo; manual cross-check only). WhatsApp channel timing out (non-blocking).

## 6. Recently shipped (by parallel agents, today)
- **Protocol 0** router hardened on csoai-platform (identity/comms/trust/txn/governance + snapshot), Stripe payments real, JSON state store, server `@shared/const` startup bug fixed → pushed `clawd-workspace` (b4fdd566).
- **MEOK design system** (`meok-tokens.css`, warm sovereign palette + orb) → new `meok.ai/index.html`, `csoai-org/meok-ai.html`, platform `meok-theme` → pushed (5c8034d7 / f9a8387).

## 7. Honesty register — hard truths to carry (do NOT bury these)
- **Council** still ~37% default-A ties in some paths; moat claims must filter `attestable=True`.
- **csoai.org `/verify`** currently validates nothing; public export ships nothing signed (self-attestation gap).
- **🔴 SECURITY:** `.town_priv.key` (canonical King key) sits **unencrypted on a mac** — contradicts "King key never on machine"; reconcile before any local King signature.
- **proofof.ai** stuck on wrong Vercel account (team_4Ik vs niks-projects).
- **M4 can't host the 80GB backbone** — don't promise local hosting of it.
- **EU AI Act** high-risk obligations moved to **2027**; lead with in-force DORA/NIS2/GDPR. Kill the recurring "Aug 2 countdown" hype.
- **LiteLLM CVE-2026-42271 (CVSS10)** in meok-agent-zero — PATCHED ≥1.83.7 (keep pinned).
- **meok-os has no git remote** — M2 cannot pull it; set a remote before relying on it.

## 8. Open blockers / next (in priority order)
1. Set `meok-os` git remote + commit its 11 dirty files (unblocks M2).
2. E2E-test the Hermes `/api/swarm/emit` path (close the "untested" gap).
3. Commit/push the dirty MEOK repos (meok-ai, meok-saas, meok-ai-frontend, meok-compliance-gateway) so M2 sees current state.
4. Reconcile the King-key security finding before any local King signature.
5. Drive the 5 July-4 gates (all need Nick).
