# CONSOLIDATION REGISTER — one master, everything else is a donor

**Owner:** JEEVES (final authority on surface consolidation) · **Opened:** 2026-07-31
**Law (Nick, 2026-07-31):** ONE website — `www.csoai.org`, built from THIS repo
(councilof-ai, white/green master). No more parallel surfaces. Every other
site/app is donor material: its best pieces get merged here, then the donor
is retired or redirected. Agents do NOT start new websites.

## The surfaces (one by one)

| # | Surface | Host today | Verdict | Notes |
|---|---|---|---|---|
| 1 | **councilof-ai** (this repo) | www.csoai.org (CF Pages **`csoai-org`** — domains attached there since ~2026-07-31; `csoai-site` = staging/preview only) | **MASTER** | ~280 routes, white/green, Vite SPA. 2026-08-01: deploy-prod.sh retargeted to `csoai-org` after stale-bundle incident |
| 2 | coai-dashboard/csoai-web | gspc.csoai.org (CF Pages `csoai-gspc`) | **DONOR — port & retire** | The GOOD GSPC build: interactive globe, arena link layer, live anchor nodes, honest data discipline. Port into master, then redirect gspc.csoai.org here |
| 3 | csoai-org-v2 | csoai-org (Workers/OpenNext) | **DONOR — harvest jewels** | ~125 dark routes. Jewels: Article 50 suite, evidence/provenance-finding pages, MCP catalogue, live-worker clients, real Ed25519 verify. Then retire. ⚠️ 2026-08-01: its Worker still holds DASHBOARD-level routes on www.csoai.org (`/refutation-ledger`, `/gspc-arena`, likely more) shadowing the master — split-brain. Fix: remove zone Worker Routes (dashboard/API token = Nick gate), then retire |
| 4 | csoai-static-deploy2 | retired (quarantined) | **DONE** | Already retired; flywheel.py remains canonical backend-only |
| 5 | app.csoai.org (emerald OS) | separate repo | **REVIEW** | Owner decision needed — likely merges into master /os |
| 5b | csoai-platform (~/clawd) | local only | **ARCHIVE** | Duplicate build of the same app; has its own dist/client + asset-mangling scripts (csoai-icon.svg.png etc.). One of its runs corrupted the master's dist asset (6-byte garbage, 2026-07-31 — restored). Do NOT run its build scripts |
| 5c | csoai-dashboard-master (~/clawd) | local only | **ARCHIVE** | Another duplicate build (dist/public). Not the master despite the name — the master is THIS repo |
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
  coai-dashboard/csoai-web is ARCHIVE. DEPLOY TUG-OF-WAR: a sibling lane
  redeployed the full donor site over the redirects ~15:30 2026-07-31
  (re-cut at 17:45). Until deploy credentials are consolidated (P2b),
  the redirect may need re-cutting. The durable fix is P2b, not repetition.
  REMAINING: naming collision — Pages project `csoai-org` (holds apex
  domains) vs OpenNext worker `csoai-org` (csoai-org-v2). One wrong deploy
  there already caused the 2026-07-31 DEFONEOS apex regression (reversed
  same day). Dashboard surgery, Nick-gated.
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
- **P4 tail — stats theatre purge (SHIPPED 2026-07-31, commit `4db7c47`):**
  fabrications replaced by honest empty states across Compliance, Reports,
  PDCACycles, EnterpriseDashboard, KnowledgeBase, GovernmentDashboard
  (headline figures withheld + Preview strip), Dashboard (earlier `0df2529`).
  /courses toned. Cert-verify pages honestly offline-marked, linked to
  /gspc-verify. RealWorldMap error CTA → /globe. Duplicate repos
  csoai-platform + csoai-dashboard-master registered ARCHIVE (asset-mangling
  hazard). Remaining: RealWorldMap maps key (Nick), P2b rename (Nick).

## Rules for every future agent

1. New page → route in THIS repo, master's theme, master's Header/Footer.
2. New data → `client/src/data/` single source; never a second anchors registry.
3. Numbers on a page must trace to a measurement or be labelled aspirational.
4. Before building anything, check this register. Update it when you merge.

## DEEP RESEARCH — improvement backlog (2026-07-31, two-agent audit)

### Shipped in the same sweep (commit `f31c189`)
Legacy HTML shadows quarantined · dead status/trust links · footer socials ·
soft-404 nav links · ISO/SOC2/uptime claims made honest · input aria-labels ·
Art 50 notice wired into the home console.

### OPEN — ranked by impact (evidence in session logs)
1. **Art 50 self-conformance — SHIPPED 2026-08-01 (commit `964134f`).**
   Registry v2.0.0: 138 routes classified (38 AI-system), published
   CORRECTION ("0 surfaces reach a model" was false — 14 live-chat
   components), notices mounted incl. global SovereignDock, /article-50
   full-depth, /ai-transparency = public self-conformance record.
   REMAINING: 31 route-level notice wirings — DONE 2026-08-02 (13 pages wired);
   R4 closure — DONE 2026-08-02 (30 rule_based + 3 NEW ai_system finds:
   /why-csoai, /old-home, /hive list). **GUARD: COMPLIANT — 170 registered,
   42 ai_system, all rules pass** — closed ON the Art 50 enforcement day.
   STILL OPEN: article50_guard.py gateway-fetch rule; C2PA marking on our
   own outputs (Dec 2 deadline); ROUTES_SCANNED/AI_SYSTEM_COMPONENTS static
   literals in ai-surfaces.ts lag the computed counts (170/42).
2. **Trust pack — SHIPPED** (`964134f`): subprocessors, security pack,
   honest /status with first incident entry, demo path. REMAINING: pen-test
   letter + uptime history (need real artifacts).
3. **Citable evidence:** ProvBench arXiv + Hugging Face + DOI — ZERO public
   findability today. T-14 C2PA notice owed first. Nick/WebBridge-gated.
4. **SEO — SHIPPED** (`964134f`): sitemap generator (343 URLs), robots.txt,
   39 route titles, aggregateRating out, _headers, preload strip. PRERENDER
   DONE 2026-08-02: `scripts/prerender.mjs` (48 GEO/AEO routes, playwright)
   run 48/48 OK and wired into `deploy:prod` (build:client → prerender →
   deploy-prod.sh) — it existed but was never run or wired. Needs chromium
   on the deploy machine (`npx playwright install chromium`, done here).
   REMAINING: lazy-import sectors-content (955KB).
5. **Conversion:** demo path SHIPPED (mailto). REMAINING: ONE named customer
   proof point; Stripe checkout end-to-end verification (keys Nick-gated).
6. **Category validation:** Gartner AI Governance Market Guide + G2 — none yet.
7. **Real 404 status** for unknown routes (SPA returns 200 everywhere) —
   ANALYSED 2026-08-02: cause = `wrangler.jsonc` assets `not_found_handling:
   single-page-application`. Viable fix = small Worker with a route manifest
   (414 static routes + 10 dynamic families; slugs enumerable from data files
   EXCEPT `/verify/:certificateNumber`, which needs a pass-through pattern
   rule). Build-time shell prerender of all routes is the alternative but
   breaks on /verify/*. Either way this is a serving-architecture change —
   deploy-gated (Nick), implement behind `deploy:prod:dry` first.
