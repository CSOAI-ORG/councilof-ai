# Agent runbook — councilof.ai

**Measurement, not certification.** Prefer live JSON over this markdown — numbers change on the API.

## Quick probe (30 seconds)

```bash
# GSPC board — 13 measured core axes (keyless)
curl -sS https://councilof.ai/api/gspc | jq '.totals'

# Eunomia routing index — 291 MCP rules
curl -sS https://councilof.ai/api/instruments | jq '.stats'

# Finance anatomy — honest register map
curl -sS https://councilof.ai/api/finance/anatomy | jq '.financial_axes'

# Axis 18 — synthetic bond crossing (MEASURED pilot fixture)
curl -sS https://councilof.ai/api/finance/bond-crossing | jq '.register, .content_hash // .attestation.content_hash'

# AG-UI wire (503 until AGUI_WIRE_URL set on Pages)
curl -sS -o /dev/null -w "%{http_code}\n" -X POST 'https://councilof.ai/api/agui/session?handle=probe'
```

## Three lobby lanes (human + agent)

| Lane | Surface | When |
|------|---------|------|
| 1 | Pane commands | Local, no model |
| 2 | `POST /api/agui/session` → SSE run | Wire configured |
| 3 | `POST /api/chat` | Published measurement or refuse |

Open Council OS on any page: `?task=eunomia-router` or instrument `aguiHandle=<slug>`.

## Honesty register

| Label | Meaning |
|-------|---------|
| MEASURED | Our signed deterministic runs |
| UNMEASURED | Empty — reason stated |
| REPORTED | Third-party context, cited |
| DESIGN | Thesis / scenario only |

Do **not** cite: ~~568 repos~~ (use **291 MCP servers**), ~~30-framework~~ (use **15 hive frameworks**).

## Machine surfaces

| Endpoint | Role |
|----------|------|
| `GET /api/gspc` | Live GSPC board |
| `GET /api/instruments` | Eunomia router index |
| `GET /api/finance/anatomy` | Engine axis map |
| `GET /api/finance/bond-crossing` | Axis 18 synthetic crossing |
| `POST /api/finance/settle` | Settlement envelope (stub until wired) |
| `GET /api/indices` | Labour / AI-economy catalog (UNMEASURED) |
| `GET /api/indices/:slug` | Single index (`ai-economy` · `human-labour` · `humanoid-labour`) |
| `GET /.well-known/did.json` | Trust root |
| `GET /api/corrections` | Corrections ledger |

## SovOS

- **CSOAI** (body): measurement, insurers, government — councilof.ai
- **MEOK** (head): arenas, NPC wallets — eval volume
- **SovOS** (engine): one `eunomia://` URI per crossing

## Council software (DSH)

Signed-in teams: `https://councilof.ai/dashboard` — same Layer 0 destinations as Council OS.

**DSH into all (OWNERSHIP #80):** every measurement card that appears in Council OS must be reachable from DSH without a second scoreboard — GSPC, East-West, EAT, Estate, Instruments, Verify, indices, products, Option A, and (later) RWA. Matrix: `docs/COUNCIL_OS_BUILD_PLAN.md`. Alignment: `docs/EAT_DSH_ALIGNMENT.md`. Checklist: `docs/DSH_PARITY_NEW_SURFACES.md`.

## Verify

https://councilof.ai/gspc-verify — recompute hash, check Ed25519 offline.

## Labour & AI-economy indices (UNMEASURED)

```bash
curl -sS https://councilof.ai/api/indices
curl -sS https://councilof.ai/api/indices/ai-economy
```

All three slugs ship **UNMEASURED** with `measured_score: null` until INDEX-METHOD promotion. Absence is not zero — do not invent scores. Never fuse into GSPC. Hub: `/indices`. Method: `docs/SOVOS/INDEX-METHOD-0.1.md`. GPU policy: `docs/RUNPOD_POLICY.md`. HF plan: `docs/HF_DATASET_PLAN.md`. DSH parity: `docs/DSH_PARITY_NEW_SURFACES.md`.
