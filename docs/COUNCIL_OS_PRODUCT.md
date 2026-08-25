# Council OS — cleaned product plan

> Maps the compass AG-UI / MCP / A2A research into what we actually ship.
> Measurement, not certification. Scores never sold. CSOAI Ltd · UK 16939677.

## One sentence

Council OS is a chat-first workspace where signed measurement cards are the primary UI — humans and agents hit the same Layer 0 evidence.

## Surfaces (branch)

| Compass research module | Council card / surface | Primary routes |
|-------------------------|------------------------|----------------|
| GSPC signed verdict | Board + verify widget | `/gspc-scoreboard`, `/gspc-verify`, `GET /api/gspc` |
| GPAI / EU Act checker | East-West packs + desks | `/east-west/*`, sample packs |
| Risk / estate | EstateAudit + EAT playbook | `/estate`, `/competitors` (52 records + RWA EAT stubs) |
| Instruments / router | Instrument cards | `/instruments`, MCP `instruments_catalog` |
| CobolBridge / RWA bond | Finance settle stub only | `functions/api/finance/settle.ts` — **out of Stage 1** |
| RWA attestation (later) | Memo / EAS → signed cards | `docs/EAT_DSH_ALIGNMENT.md` — Stage 2+ testnet; no Stage 1 mainnet |
| White-label attestation license | Engine + AG-UI “Powered by” (Option A) | `/powered-by` · doctrine Stage 1; meter verdicts/API/seats — never grades |
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
| agent-card v1.0 | `GET /api/surface-hits` |
| | `GET /api/east-west/pay/demo` |
| | `GET/POST /api/mcp/http` |
