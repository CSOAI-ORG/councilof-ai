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
- **P1.2 — donor fully drained (SHIPPED 2026-07-31):** `/gspc-verify` (client-
  side WebCrypto chain recompute + tamper demo) and `/methodology` live in
  master. Donor's shallow-canonicalJSON signing bug fixed in the port.
- **P2 — gspc.csoai.org cutover (DONE 2026-07-31):** Pages project `csoai-gspc`
  now serves a redirects-only site — every donor route 308s to its master
  equivalent (coai-dashboard `csoai-gspc-redirect/_redirects`, commit a9f3ad9c).
  coai-dashboard/csoai-web is ARCHIVE. REMAINING: naming collision — Pages
  project `csoai-org` (holds apex domains) vs OpenNext worker `csoai-org`
  (csoai-org-v2). One wrong deploy there already caused the 2026-07-31
  DEFONEOS apex regression (reversed same day). Dashboard surgery, Nick-gated.
- **P3 — MCP + Layer 0 bench (SHIPPED 2026-07-31, commit `fefb1d0`):**
  `/layer0` live — the bench (GovComp-Bench 1.000/32, frontier 0.489, 3 real
  primaries, refusal 0.0% FP, SOVBENCH 15/15, do-NOT-claim) + the audited
  node registry (26 nodes, counts computed from the file at render — its
  stale "audited 15" header corrected) + MCP L0-1/2/3 conformance strip.
  Fleet counts reconciled on-page (216 deployed vs 293 catalogued, `3f98e85`).
  MCPRegistry title bug fixed. Donor-3 MCP catalogue verdict: NO MERGE —
  ARCHIVE. Its numbers are internally inconsistent ("271 published" vs "202
  nodes" vs tier counts 279+35+… exceeding its own total) — fails the
  honesty bar. Master's registry (293 servers, 9 categories, 8 frameworks,
  consistent) is strictly superior; bench content already harvested into
  /layer0; Article 50 suite + assess/checkout already exist in master.
  csoai-org-v2 = ARCHIVE; its OpenNext worker serves only
  csoai-org.workers.dev — harmless until P2b rename.
- **P4 — Copy polish sweep (SHIPPED 2026-07-31, commit `24ed370`):**
  "God's Eye" → cyber self-scan (10 surfaces + 2 data files); "living egg" →
  Your Sovereign twin; "living globe" → real-world 3D map; SOV3-led titles
  humanised; placeholder phone/demo-date/Vercel-jargon errors fixed earlier
  (`3f98e85`). 7 route shadow collisions deduplicated; /tour double-shadow
  removed → SovereignTour live. Remaining: double-chrome on 25
  DashboardLayout pages; salesy copy on /courses; data/mcpRegistry.json's
  "Gods Eye Geospatial" (a package's proper name — leave).
- **P5 — Backend reality:** three cert-verify pages run on an undeployed tRPC
  backend → either deploy the functions or mark surfaces honestly.
  RealWorldMap needs a maps key or retirement. Route shadow collisions fixed.

## Rules for every future agent

1. New page → route in THIS repo, master's theme, master's Header/Footer.
2. New data → `client/src/data/` single source; never a second anchors registry.
3. Numbers on a page must trace to a measurement or be labelled aspirational.
4. Before building anything, check this register. Update it when you merge.
