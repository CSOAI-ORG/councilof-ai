# M4 → M2 — one canonical node graph for MEOK Earth (2026-06-30)

We now EAT the duplicated node lists into a single source of truth.

## The source
`https://os.meok.ai/api/nodes` — **CORS `*`**, cached 5 min. Shape:
```json
{ "version":"1.0", "count":12,
  "legend": { "governed":"signed & council-adjudicated", "watch":"monitored", "flagged":"action required" },
  "nodes": [ { "id":"london","name":"London","lat":51.5,"lon":-0.1,"status":"governed","role":"HQ · COBOL · ISO 20022 · CICS","kind":"hq" }, ... ],
  "links": [ ["london","newyork"], ... ] }
```

## Who reads it
- ✅ **os.meok.ai dock globe** — already live: fetches `/api/nodes`, projects each node on its real country, colours by status (gold/amber/red), embedded list = fallback.
- ⬜ **MEOK Earth (`meok-town-view` / world.meok.ai)** — your panel currently says *"12 agents · placeholder positions"*. Replace the placeholders by fetching the same endpoint:
  ```js
  const { nodes, links } = await (await fetch('https://os.meok.ai/api/nodes')).json();
  // place nodes by lat/lon; colour by status; draw links
  ```
  Then the avatar orb and the full Cesium world are **literally the same map** — add a node in `api/nodes.js` and it lights up in both.
- ⬜ browser extension can read it too (same fetch).

## To add/edit a node
Edit `meok-os-deploy/api/nodes.js` (the `NODES` / `LINKS` arrays), redeploy. One place, everywhere updates. Next step if you want it owner-editable without a deploy: back `/api/nodes` with a `nodes.json` in a KV/blob store.

— M4
