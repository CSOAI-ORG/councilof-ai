# OWEM/OOWM Specialist Harness (councilof-ai/harness/owem)

Every GSPC axis has its own **OOWM** (measurement) + **OWEM** (serving/routing/model) specialist
cluster. Each measures against its real estate regulatory baseline, routes to the best
sovereign model, signs + chains every measurement, and improves over time. One gateway is the
single "AI in chat to all" surface. Metered on the live `/api/specialists` feed.

**Doctrine: Measurement, never certification. UNMEASURED stays honest. No certification, no ranking, no endorsement.**

## Components
| File | What it is | Where it runs |
|------|-----------|---------------|
| `axis_clusters.json` | The living register — one OOWM+OWEM cluster per axis, seeded from the real `/api/axis-register` + the real per-axis sovereign measurement (`free_sov_router.json`). | hub (served by gateway) + GPU pod (measurement source) |
| `axis_cluster.py` | Per-axis OWEM/OOWM specialist worker. `remeasure <axis>` runs the axis GSPC bank against the sovereign champion on the bench server (behavior-class judge, UNMEASURED never 0); `signal` recomputes the estate index. | GPU pod (banks + inference) |
| `oowm_gateway.py` | The one AI in chat to all. HTTP + MCP + A2A: `/oowm/chat`, `/oowm/clusters`, `/oowm/index`, `/oowm/signal` (living history + forecast), `POST /mcp` (MCP server), `GET /a2a` (agent card). | hub |
| `agent-card.json` | A2A agent card so the gateway loads on other AI platforms (MCP/A2A). | served from `/.well-known/agent-cards/` |

## API (gateway, port 8899)
```
GET  /oowm/clusters   -> per-axis cluster register (oowm + owem + sov score + gap vs baseline)
GET  /oowm/index      -> aggregate sovereign index signal (13 axis specialists)
GET  /oowm/signal     -> living 24/7 signal history + naive forecast (grow the index)
POST /oowm/chat       -> {question} -> classify axis(es), aggregate, return answer (one AI to all)
POST /mcp             -> MCP protocol: oowm_query / oowm_clusters / oowm_index / oowm_signal
GET  /a2a             -> A2A agent card
GET  /health          -> 200
```

## EAT wiring
measure -> route -> mine -> product -> sign -> chain. The per-axis specialist measures its axis
(measure/route), the coordinator signs + chains the aggregated sovereign signal. The gateway
serves the live signal; the `/oowm/signal` history is a 24/7 living database.

## How it scales
Add an axis/regulator/industry/product: add one entry to `axis_clusters.json` (+ its GSPC bank),
run `axis_cluster.py all` on the GPU pod, and the gateway + `/api/specialists` serve it. Each
specialist re-measures on the loop — the improve-loop keeps a measurement only if it genuinely
improves (ouroboros gate; never reward-hack).

## Live truth
- `/api/specialists` (councilof.ai) publishes the specialist-team catalog.
- The gateway current index signal: see `/oowm/index` (sov_index_signal).
