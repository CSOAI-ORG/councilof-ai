# Production checklist — councilof.ai

Binding register: **measurement, not certification**. See `docs/STACK_HONESTY.md`.

## Deploy (Cloudflare Pages)

| Step | Command / action |
|------|------------------|
| Build client | `cd client && npm run build` → output `dist/client` |
| Deploy | `npx wrangler pages deploy dist/client --project-name councilof-ai` |
| Verify SPA | `/engine-axis`, `/instruments`, `/venturi`, `/dashboard` return 200 + JS |

## Required environment (Cloudflare Pages)

| Variable | Purpose |
|----------|---------|
| `AGUI_WIRE_URL` | RunPod AG-UI wire (port 8785). **Without this, lobby Lane 2 returns 503 and falls back to `/api/chat`.** |
| `SOV_ARENA_STATE` | KV binding in `wrangler.jsonc` — live arena evidence |

Example:

```bash
AGUI_WIRE_URL=https://<tunnel-or-agui.councilof.ai>
```

## Surfaces — production parity (DSH into all)

| Surface | Council OS (Lobby) | DSH (`/dashboard`) | Public nav |
|---------|-------------------|-------------------|------------|
| Engine Axis | LobbyHome tile | Sidebar + dashboard card | Header Measure |
| Eunomia Router | LobbyHome tile | Sidebar + dashboard card | Header Measure |
| Bond Venturi | LobbyHome tile | Sidebar + dashboard card | Header Measure |
| Legacy Bridge | LobbyHome tile | — | — |
| Layer 0 / Trust / Hive | LobbyHome infra | DSH sidebar infra | — |
| GSPC board | Lobby card + `/gspc-scoreboard` | Hub tile | Measure |
| East-West | Lobby pane + `/east-west/*` | Same pack IDs | — |
| EAT / Competitors / RWA stubs | `/competitors` | Same records when MEASURED | — |
| Labour / AI-economy indices | Lobby `indices_catalog` + `/indices` | `/dashboard/measurement` UNMEASURED tile | Measure |
| Products catalog (HO.2) | `/products` | Measurement hub tile | Solutions |
| Verify | Lobby + `/gspc-verify` | Hub | Loginless verify |
| Powered-by (Option A) | `/powered-by` | Partner admin later | — |

Shared constants: `client/src/lib/layer0Links.ts`  
Full matrix + adapters/publishers plan: `docs/COUNCIL_OS_BUILD_PLAN.md`

## Lobby — three answer lanes

1. **Pane commands** — local, deterministic (`matchTab`)
2. **AG-UI SSE** — `/api/agui/*` proxy → `AGUI_WIRE_URL` (streaming + HITL consent)
3. **`POST /api/chat`** — published measurement or refuse

Instrument routes open Council OS with `aguiHandle=<slug>` via `openInstrumentInLobby()`.

## Smoke tests (manual)

```bash
# GSPC board (MEASURED)
curl -sS https://councilof.ai/api/gspc | jq '.axes | length'

# Eunomia index
curl -sS https://councilof.ai/api/instruments | jq '.stats'

# Finance anatomy (honest register)
curl -sS https://councilof.ai/api/finance/anatomy | jq '.financial_axes'

# Axis 18 — synthetic bond crossing (MEASURED pilot)
curl -sS https://councilof.ai/api/finance/bond-crossing | jq '.register, .attestation.content_hash'

# RECEIPT-SPEC schema
curl -sS https://councilof.ai/.well-known/schemas/agent-measurement-card.schema.json | jq '.title'

# Labour / AI-economy indices — UNMEASURED (branch until master merge; 404 on prod OK)
curl -sS https://councilof.ai/api/indices | jq '.indices[]? | {slug, status, measured_score}'

# Oracle fleet — infra status only (not a grade oracle) — see docs/ORACLE_FLEET.md
curl -sS -o /dev/null -w "%{http_code}\n" https://councilof.ai/api/oracle-fleet
```

## Unit tests

```bash
cd client && npx vitest run src/components/lobby/aguiStream.test.ts src/components/lobby/tabs.test.ts
```

## End-user persona tests (Playwright)

All 9 lobby audiences × primary surfaces + Layer 0 + DSH + mobile:

```bash
npm run test:personas          # local build on :4173 — 46 frontend tests
npm run test:personas:live     # councilof.ai API + persona walk
```

Pre-deploy smoke (no uncaught JS):

```bash
npm run test:pre-deploy
```

## Do not cite in copy

- ~~568 repos~~ → **291 MCP servers** (`mcpRegistry.json`)
- ~~30-framework crosswalk~~ → **15 hive frameworks**
- Revenue tables on `/engine-axis` → **DESIGN scenarios**

## First finance repo (SPEC)

`CSOAI-ORG/cobol-a2a-bridge-mcp` — one COPYBOOK → one JSON → one C2PA attestation.

Spec: `docs/cobol-a2a-bridge-mcp.md` · Package stub: `packages/eunomia-bond-router/README.md`
