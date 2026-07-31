# CONSOLIDATION REGISTER — one master, everything else is a donor

**Owner:** JEEVES (final authority on surface consolidation) · **Opened:** 2026-07-31
**Law (Nick, 2026-07-31):** ONE website — `www.csoai.org`, built from THIS repo
(councilof-ai, white/green master). No more parallel surfaces. Every other
site/app is donor material: its best pieces get merged here, then the donor
is retired or redirected. Agents do NOT start new websites.

## The surfaces (one by one)

| # | Surface | Host today | Verdict | Notes |
|---|---|---|---|---|
| 1 | **councilof-ai** (this repo) | www.csoai.org (CF Pages `csoai-site`) | **MASTER** | ~280 routes, white/green, Vite SPA |
| 2 | coai-dashboard/csoai-web | gspc.csoai.org (CF Pages `csoai-gspc`) | **DONOR — port & retire** | The GOOD GSPC build: interactive globe, arena link layer, live anchor nodes, honest data discipline. Port into master, then redirect gspc.csoai.org here |
| 3 | csoai-org-v2 | csoai-org (Workers/OpenNext) | **DONOR — harvest jewels** | ~125 dark routes. Jewels: Article 50 suite, evidence/provenance-finding pages, MCP catalogue, live-worker clients, real Ed25519 verify. Then retire |
| 4 | csoai-static-deploy2 | retired (quarantined) | **DONE** | Already retired; flywheel.py remains canonical backend-only |
| 5 | app.csoai.org (emerald OS) | separate repo | **REVIEW** | Owner decision needed — likely merges into master /os |
| 6 | hub-tour (coai-dashboard) | internal | **KEEP — internal ops tooling** | Not a public surface; exempt |
| 7 | csoai-v2-app.vercel.app | 402 dead | **RETIRED** | Vercel payment-blocked 2026-07-29; nothing to do |

## Phase plan

- **P0 — Register + recon (DONE 2026-07-31):** master mapped (~280 routes, 8
  shadow collisions, brand split-brain blue-token vs emerald, GSPC trio thin +
  broken). Donors inventoried.
- **P1 — GSPC wing (SHIPPED 2026-07-31, live on www.csoai.org/gspc-arena):**
  donor-2's globe + arena link layer + live anchor nodes ported into master
  (`components/gspc/`), rethemed dark-emerald; GSPC trio bugs fixed
  (gold token real, anchors live-dated, shared `data/anchors.ts`); committed
  `a51dc65`. EU-CELLAR shows degraded — honest, matches watcher data.
- **P2 — gspc.csoai.org cutover:** once Nick confirms, 308 gspc.csoai.org →
  master's GSPC wing; retire donor-2's Pages project. ALSO: naming collision
  cleanup — Pages project `csoai-org` (holds apex domains) vs OpenNext worker
  `csoai-org` (csoai-org-v2). One wrong deploy there already caused the
  2026-07-31 DEFONEOS apex regression (reversed same day).
- **P3 — MCP + Layer 0 bench (STARTED):** fleet counts reconciled on-page
  (216 deployed per 14 Jun manifest vs 293 catalogued in registry — both
  stated with meanings, commit `3f98e85`). MCPRegistry title bug fixed.
  Remaining: donor-3 MCP catalogue + Layer 0 bench merge into `/mcp-fleet`
  + new `/layer0`.
- **P4 — Copy polish sweep:** end-user wording pass over master routes
  (mystical headings, backend jargon in primary text, placeholder phone
  numbers, demo dates). Honesty register preserved: no "certified",
  no "C2PA is broken", labels never ahead of capability.
- **P5 — Backend reality:** three cert-verify pages run on an undeployed tRPC
  backend → either deploy the functions or mark surfaces honestly.
  RealWorldMap needs a maps key or retirement. Route shadow collisions fixed.

## Rules for every future agent

1. New page → route in THIS repo, master's theme, master's Header/Footer.
2. New data → `client/src/data/` single source; never a second anchors registry.
3. Numbers on a page must trace to a measurement or be labelled aspirational.
4. Before building anything, check this register. Update it when you merge.
