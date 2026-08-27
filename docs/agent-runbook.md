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

# Labour / AI-economy indices — UNMEASURED catalog (contextual firewall)
curl -sS https://councilof.ai/api/indices | jq '.indices[] | {slug, status, measured_score}'
curl -sS https://councilof.ai/api/indices/ai-economy | jq '{slug, status, measured_score, fused_into_gspc}'

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
| `GET /api/indices` | Labour / AI-economy indices (UNMEASURED) |
| `GET /api/indices/:slug` | Per-index honesty shape (`measured_score: null`) |
| `GET /api/mcp` | MCP fleet catalogue (291 registry entries; 6 measured tools on POST JSON-RPC) |
| `POST /api/mcp` | JSON-RPC `tools/list` / `tools/call` — dev: indices + RWA UNMEASURED only |
| `GET /api/finance/anatomy` | Engine axis map |
| `GET /api/finance/bond-crossing` | Axis 18 synthetic crossing |
| `POST /api/finance/settle` | Settlement envelope (stub until wired) |
| `GET /.well-known/did.json` | Trust root |
| `GET /api/corrections` | Corrections ledger |

## SovOS

- **CSOAI** (body): measurement, insurers, government — councilof.ai
- **MEOK** (head): arenas, NPC wallets — eval volume
- **SovOS** (engine): one `eunomia://` URI per crossing

## Council software (DSH)

Signed-in teams: `https://councilof.ai/dashboard` — same Layer 0 destinations as Council OS.

**DSH into all (OWNERSHIP #80):** every measurement card that appears in Council OS must be reachable from DSH without a second scoreboard — GSPC, East-West, EAT, Estate, Instruments, Indices, Products, Verify, and (later) RWA. Matrix: `docs/COUNCIL_OS_BUILD_PLAN.md`. Alignment: `docs/EAT_DSH_ALIGNMENT.md`. Parity checklist: `docs/DSH_PARITY_NEW_SURFACES.md`.

**EAT parity:** competitor and RWA measurement cards use the same rule. Indices stay **UNMEASURED** on both OS and DSH — never invent labour/economy scores.

**Fleet + harmony:** `docs/MASTER_CONNECT.md` · `docs/COUNCIL_OS_HARMONY.md` · lane claims `council-os/LANES.md`

**Local dev (`npm run dev`):** vite `:43125` proxies `/api/*` → `scripts/dev-honesty-api.mjs` `:3001` — indices, RWA, and MCP registry (`GET /api/mcp` from `mcpRegistry.json`, register REPORTED).

## Verify

https://councilof.ai/gspc-verify — recompute hash, check Ed25519 offline.
