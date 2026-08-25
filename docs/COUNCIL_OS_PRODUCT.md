# Council OS — cleaned product plan

> Maps the compass AG-UI / MCP / A2A research onto what already ships on
> `cursor/instruments-catalog-7fb8`. One spine. Measurement, not certification.
> CSOAI Ltd · UK Companies House **16939677**.

## Product sentence

Chat opens **Council OS**. A supervisor lane routes to **measured APIs**. Results
render as **typed cards**. The same tools expose over **MCP** and **A2A**
discovery. Pricing stays **OWNER-BLOCKED** until a published ruling — verify stays
free forever. Value Ledger published count is **0** (empty is honesty).

## Protocol trinity → this repo

| Layer | Who talks | Council surface | Status |
|-------|-----------|-----------------|--------|
| **AG-UI** | Agent ↔ User | `CouncilLobby` · `/api/agui` SSE · `/os` | Built; wire needs `AGUI_WIRE_URL` |
| **MCP** | Agent ↔ Tools | `POST /api/mcp` · `/api/mcp/http` · `/.well-known/mcp.json` | Branch ready; GET catalogue **LIVE** |
| **A2A** | Agent ↔ Agent | `/.well-known/agent-card.json` v1.0 | Discovery **LIVE**; no delegation mesh yet |

**Decision rule (matches research):** MCP for every tool now; AG-UI for our own
frontend now; A2A task-delegation later — only if a module is third-party hosted,
long-running HITL, or cross-vendor.

Do **not** rebuild on CopilotKit. The lobby already speaks AG-UI events
(`TEXT_MESSAGE_*`, tool results, HITL). Prefer **controlled** generative UI:
prebuilt React cards the agent populates — not open HTML iframes.

## Product spine

```
/os + CouncilLobby
        │  cmds: local pane cmds → AG-UI SSE → grounded POST /api/chat
        ▼
measured APIs: /api/gspc (LIVE) · /api/east-west · /api/instruments · verify
        ▼
MCP: tools/list + tools/call (gspc_board, east_west_board, ecosystem_index,
     verify_tally, benchmark_quality, instruments_catalog)
        ▼
A2A: /.well-known/agent-card.json
        ▼
cards: GSPC · East-West · EAT/competitors · Estate · Instruments · Verify
        ▼
commerce (honest): GET /api/east-west/pay/demo → HTTP 402, amount: null
```

## Module map (research → Council)

| Compass research module | Council card / surface | Primary routes |
|-------------------------|------------------------|----------------|
| GSPC signed verdict | Board + verify widget | `/gspc-scoreboard`, `/gspc-verify`, `GET /api/gspc` |
| GPAI / EU Act checker | East-West packs + desks | `/east-west/*`, sample packs |
| Risk / estate | EstateAudit + EAT playbook | `/estate`, `/competitors` (52 records + RWA EAT stubs) |
| Instruments / router | Instrument cards | `/instruments`, MCP `instruments_catalog` |
| CobolBridge / RWA bond | Finance settle stub only | `functions/api/finance/settle.ts` — **out of Stage 1** |
| RWA attestation (later) | Memo / EAS → signed cards | `docs/EAT_DSH_ALIGNMENT.md` — Stage 2+ testnet; no Stage 1 mainnet |
| White-label attestation license | Engine + AG-UI “Powered by” (Option A) | Doctrine only Stage 1; meter verdicts/API/seats — never grades |
| Tokenization-as-a-service | Partner issuer/TA only (Option B) | After design partners; never mint ownership ourselves |

## Stages

### Stage 1 — MVP (mostly done on branch)

- [x] Chat-first OS shell (`CouncilLobby`, panes, deep-links)
- [x] Measured MCP slice (6 tools + transport)
- [x] GSPC / East-West / EAT / Estate / Verify surfaces
- [x] A2A agent-card v1.0 + `supportedInterfaces`
- [x] Surface-hit counters (not MEASURED)
- [x] Explicit tool-name → card component registry in Lobby (`measuredToolCards.ts` + `MeasuredToolCard`)
- [x] Geo → East-West desk soft default (`GET /api/geo-hint` + Lobby confirm/override; IP is proxy, not legal fact; language soft-default)
- [x] Option A surface: `/powered-by` white-label attestation (messaging lock; pricing pending ruling)
- [ ] AG-UI wire online (`AGUI_WIRE_URL`) or refuse-closed
- [ ] Router accuracy check on a labeled query set (~200)

**Advance when:** cards render from tool calls reliably; wrong-module rate < 10%.

### Stage 2 — Workspaces + pay (owner-gated)

- [x] `/workspace` portfolio surface
- [x] Honest 402 pay demo (`amount: null`)
- [ ] Published pricing ruling
- [ ] Stripe Meters (per module run / signed artifact) — checkout today is unconfigured
- [ ] Projects persistence (thread + state snapshot)
- [ ] Arena / compare tab (single vs multi-tool)

**Advance when:** free→paid conversion measurable; p95 card latency stable.  
**Until then:** no invented prices; Ledger stays 0.

### Stage 3 — Multi-surface

- [x] Public measured APIs (partially LIVE)
- [x] Hosted MCP shape + registry package drafts
- [ ] Merge branch → `master` (unblocks east-west, ecosystem, surface-hits, MCP http, pay/demo)
- [ ] Embeddable widget (watermark removal as paid tier — after pricing)
- [ ] Optional self-host
- [ ] A2A delegation **only** if genuine agent-to-agent need

## What not to build

- CopilotKit greenfield rewrite
- A2A multi-agent mesh for tightly coupled in-process tools
- Invented revenue, pricing, or traction numbers
- Vercel AI SDK RSC `streamUI` as the primary path
- CobolBridge / XRPL bond *issuance* as Stage-1 scope (permissionless *attestation* targets live under EAT docs; mainnet attach is Stage 2+)
- Becoming a regulated securities issuer / transfer agent near-term (partner only — Option B)
- Marketing that equates attestation with tokenization or ownership rights
- Insurance outreach (pack exists; **UNSENT**)

## Security edges we own

1. **Authorization** — a card appearing is not a permission grant; enforce at execution.
2. **Schema governance** — tool args ↔ card props is a contract we maintain.
3. **Durable state** — SSE is a projection of externalized state (resumable / auditable), especially for signed verdicts.

## Ship gate

| # | Action | Unblocks |
|---|--------|----------|
| 1 | Merge `cursor/instruments-catalog-7fb8` → `master` | east-west, ecosystem, surface-hits, MCP http, pay/demo on councilof.ai |
| 2 | Set `AGUI_WIRE_URL` (or refuse-closed) | Live generative cards in Lobby |
| 3 | Register tool → card map | Compass Stage-1 generative UI |
| 4 | Published pricing ruling (or keep 402) | Stripe meters / PAYG |
| 5 | Optional: `mcp-publisher` + HF login | Venue distribution |

## Production gap (probed 2026-08-25)

| LIVE on master | 404 until merge |
|----------------|-----------------|
| `GET /api/gspc` | `GET /api/east-west` |
| `GET /api/mcp` (catalogue) | `GET /api/ecosystem` |
| `/.well-known/agent-card.json` v1.0 | `POST /api/surface-hits` |
| | `GET /api/east-west/pay/demo` |
| | `/api/mcp/http` streamable transport |

Handlers for the 404 column exist on this branch.

## Sources

- Compass research artifact (AG-UI / MCP / A2A / multi-surface commercialization)
- Overnight WAVE 0–5 execution on `cursor/instruments-catalog-7fb8`
- `README.md` deploy table + production-gap probe
