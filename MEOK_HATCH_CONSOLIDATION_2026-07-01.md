# Consolidation — one Hatch, two stacks reconciled (before we build P3)

_2026-07-01. Nick: "check both repos + Downloads, consolidate & absorb before we move forward." This is the reconciled, honest picture. Key discovery: **`meok-ai` already uses "hatch" heavily** — we must unify, not duplicate._

## What each stack actually is (no duplication going forward)
| Stack | What it is | Role |
|---|---|---|
| **os.meok.ai** (`meok-os-deploy`, Vercel serverless) | The public OS UI + edge surface + the NEW signed primitives I built this session (`/api/hatch` package, agentcard, mcp, verify, systemcard, registry, runner, tour, ambient) | **Public edge + experience + signed-artifact layer.** LIVE, ~free, reaches everyone. |
| **meok-ai** (GitHub, FastAPI + Docker, "90% complete") | The **stateful backend**: `hatch.py` bootstrap, **`api/hatch.py` tenant API** (create a sovereign AI instance, council 33 / vote 22), **`api/trust_layer.py` (ArkForge: Ed25519 audit-receipt trust scores → marketplace tiers)**, `a2a/gateway.py`, `acp/gateway.py`, `council_api`, `marketplace`, `gods_eye`, `killswitch`, `neural_inference`, SOV3 MCP (99 tools) | **Deep tenanted backend + trust + council + marketplace.** |
| **clawd-workspace** | the monorepo/workspace (docs + `meok-os-deploy/` subdir) | source of truth for docs + the serverless surface. |

## The "Hatch" reconciliation (the important one)
Two meanings collided — they're actually **complementary**, so unify them:
- **hatch = the VERB** (meok-ai `hatch.py` + `POST /api/hatch`): *provision* a sovereign AI instance/tenant (name, council 22-of-33, care-veto).
- **Hatch = the NOUN** (os.meok.ai `/api/hatch`): the **signed, portable package** that *is* that sovereign AI — identity + dual-brain + governance + bootable OS body, Ed25519-signed, verifiable, runnable on-device.
- **Unified:** *you **hatch** (verb) a sovereign AI → you get a **Hatch** (noun) — its portable, signed form.* One concept, verb + noun. No rename needed; they fit.

## Overlap I created (must converge, not fork)
- **Signing/trust:** my `/api/sign`+`/api/verify`+systemcard ≈ meok-ai's **ArkForge trust_layer** (both Ed25519 audit receipts). → **Same sovereign key (SIGIL_SEED), same verify.** A Hatch's identity should carry an ArkForge **trust score**; the trust layer should verify against the same key.
- **Registry/marketplace:** my `/api/registry` (signed card index) ≈ meok-ai `api/marketplace.py` + trust tiers. → **the registry IS the marketplace's public, signed front.**
- **Agent protocols:** my `/api/agentcard` (A2A) + `/api/mcp` ≈ meok-ai `a2a/gateway.py` + `acp/gateway.py`. → os.meok.ai = the lean public MCP/A2A face; meok-ai = the full gateway. Keep the serverless one as the edge mirror.
- **Council/governance:** my `careFloor`/hardStops ≈ meok-ai council 33 / vote 22 / care-veto 0.4. → **align the numbers**: careFloor 0.95 + BFT 22-of-33 are the canonical governance constants everywhere.

## Absorb backlog (Downloads — prioritised, not yet integrated)
- `DEFONEOS_Hive_Master_Brief.md` (36KB) — DEFONEOS doctrine; reconcile with the assurance suite.
- `NICK_FINAL_DELIVERABLES_COMPLETE/`, `THE_CAPSTONE_PACKAGE/`, `VISUAL_MAPS_COMPLETE/` — prior deliverables; check for anything not in the repo.
- `Kimi_Agent_Defoneos*` zips (×9), `OS Package Quest.zip`, `Smart City Forking Guide.zip`, `meok-os.pdf` — research/agent outputs; skim for absorbable assets (⚠️ memory warns Kimi zips sprawled into offensive content — keep to assurance/defensive only).
- `全景信息搜集.docx` (panoramic info-gathering) — review.

## The clear vision (locked)
**One Hatch.** You hatch a sovereign AI (meok-ai tenant API, council-governed) → it's expressed as a signed, portable **MEOK Hatch** (os.meok.ai) → verifiable offline, runnable on-device (runner), discoverable via MCP/A2A, and **droppable into any website/SaaS/OS as an AI-OS layer** (P3, next). meok-ai = depth (tenants/trust/council/marketplace); os.meok.ai = reach (edge/UI/signed artifacts). **Same sovereign key, same governance constants, same verify. No third stack, no fork.**

## Dedup rules (so we stop diverging)
1. **One sovereign key** (SIGIL_SEED) signs everything across both stacks.
2. **Governance constants are canonical:** careFloor 0.95, BFT 22-of-33.
3. os.meok.ai serverless endpoints are the **public edge mirror** of meok-ai gateways — they may proxy/echo, never fork the logic.
4. The **registry** is the marketplace's signed public index.
5. Before adding an endpoint on one stack, check the other for it (this session shipped duplicates because that wasn't done).

## Then build (P3) — aligned
`sovereign-embed.js` loads a **Hatch** (from `/api/hatch`), verifies it client-side (Ed25519), mounts the AI-OS layer + a trust/verify badge → any site becomes a sovereign AI OS. Now consistent with the meok-ai tenant/trust model, not a fork.
