# Council OS — end-to-end harmony register

**Measurement, not certification.** This doc tracks Council OS inner surfaces (sims, city, games, overlay, harness, MCP) toward honest 100/100 UX — not fake scores.

Canon: `docs/MASTER_CONNECT.md` · `docs/ESTATE_CROSSWALK.md` · `council-os/GAMES_SLATE.md`

---

## Terminology (UI vs API)

| Context | Rule |
|---------|------|
| **JSON / MCP / `GET /api/gspc`** | Keep field name `axes[]` — schema `csoai.gspc-axes/0.5` is frozen |
| **Public UI copy** | Prefer **measurement slot** or **per-axis** — avoid plural "axes" in marketing |
| **Board count** | **14-slot board, 13 measured of 14** (jail = slot 14, separation UNTESTED) |
| **Financial extension** | Slots 18–25 on Engine Axis — separate from GSPC board |

---

## Surface map (who uses what)

| Persona | Entry | Must work |
|---------|-------|-----------|
| Regulator | `/government`, `/regulators`, lobby verify | UNMEASURED indices honest, offline verify |
| Enterprise | `/enterprise`, `/workspace`, `/dashboard` | No invented compliance % |
| Insurer | `/insurers`, `/indices` | Wilson / board from `/api/gspc` |
| Developer | `/gspc-verify`, `/api/mcp`, agent-card | MCP `gspc_board` proxies live API |
| Player | `/sov-os` games, `/gspc-arena` | DESIGN labelled; Council Town gated honestly |
| Operator | `/os`, lobby overlay | Board pane = wire from `/api/gspc` |

---

## Status matrix (2026-08-27)

| Surface | Status | Next honest step |
|---------|--------|------------------|
| Lobby overlay + board | REAL | Keep wire-first; jail in client snapshot |
| `GET /api/gspc` + verify | REAL | — |
| Council City signed runs | REAL | `public/city/board.json` |
| GSPC Arena (`?view=arena`) | REAL (fixture) | Wire to live arena API when ready |
| Council Space console sim | REAL (honest) | Gateway banner live/offline; narrated sim labelled ≠ MEASURED |
| SovOS games arcade | 1 live + 5 DESIGN | Slots 2–6 registered with DESIGN panels |
| MCP fleet page | REAL (dev) | Live list via `/api/mcp` — registry in dev, gateway in prod |
| AG-UI control rail | REAL (branch) | Control chips seed Ask without site nav (dock stays open) · freeform Prefill Ask · consent lock |
| Training / flywheel | REAL (branch) | `public/flywheel/board.json` + `sim-board.json` on branch deploy |
| Dashboard framework % | FIXED | UNMEASURED until org assessment |
| 9 product SKUs (GPAI, INS, COBOL…) | LIVE catalog | `/products` lists all nine with honest registers |
| HF living datasets | 🔄 | `npm run hf:upload-staged` when write token |
| Real MCP in all AI platforms | PARTIAL | `POST /api/mcp` on branch + dev-honesty (indices/RWA tools); full fleet on Pages |
| DSH parity (indices / products / MCP) | REAL (branch) | `LAYER0_LINKS` on `/dashboard` → same OS paths |

---

## Nine products (HO.2 catalog)

See `/products` and `client/src/data/productsCatalog.ts`. Each must:

1. State MEASURED / UNMEASURED / DESIGN honestly  
2. Link verify path where signed  
3. Never sell grades (meter access/runs/seats only)

---

## Open-source GSPC tooling

| Artifact | Path |
|----------|------|
| Offline verify | `public/signed/verify-card.mjs` |
| Pack verify | `public/east-west/verify-pack.mjs` |
| Python gates | `council-os/gate_suite.py`, `quick_gate.py` |
| MCP sign bridge | `council-os/framework_sign_mcp.py` |
| Kaggle notebooks | `notebooks/kaggle/` |

**MCP for AI platforms:** `public/.well-known/agent-card.json` + `POST /api/mcp` (`tools/list`, `gspc_board`, `indices_catalog`, `rwa_attestation_catalog`). Streamable HTTP at `/api/mcp/http` on branch until master merge.

---

## E2E smoke (branch)

```bash
npm run dev   # :3001 honesty API + vite :43125
npm run smoke:dev-honesty   # :3001 indices / RWA / MCP registry
npm run smoke:personas      # persona entry routes + API honesty
npx vitest run client/src/data/labourIndices.test.ts
BASE_URL=http://127.0.0.1:43125 npm run crawl:honesty
npx playwright test e2e/tests/indices-products-axe.spec.ts --project=chromium
```

---

## Owner gates (do not fake)

- Council Town Convex backend login  
- Custody KMS/Turnkey for signed mainnet RWA  
- Securities counsel for product claims  
- `master` merge for production councilof.ai
