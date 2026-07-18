# MEOK Compliance MCP Fleet — Final State (2026-06-13 16:30 BST)

## Headline (PHANTOM-CORRECT)
- **299/336 in both PyPI + MCP registry** (verified via /v0.1/servers full list)
- **4 packages on PyPI but NOT in registry yet** (awaiting JWT): meok-agents-md-lint-mcp, meok-allmi-hiab-mcp, meok-mcp-cardgen-mcp, meok-mcp-hardening-mcp
- **0 packages in registry only**
- **0 packages on PyPI only** (excluding the 4 awaiting registry)
- **33 packages in NEITHER** (PyPI 429 still active)
- **336 total packages** (was 340, then 338, then 336 after archiving 2 empty dirs: legacy-engineering-mcp, thermal-management-mcp)
- **341/341 server.py wired with /verify metering** (live, fail-open, 2.5s timeout)
- **14/14 Apify Actors deployed** to `knowing_yucca/` Apify account

## Gate state (16:30 BST)
- mcp-publisher JWT: **DEAD** (6h+ old, 5-min TTL)
- gh auth: **NOT LOGGED IN**
- PyPI 429: **PARTIALLY LIFTED** (4 of 39 went through this hour — per-PKG, not global)
- Vercel CLI: wrong team context, no project access
- npm: not logged in

## Watchers armed
- SOV3 OLM watch-mcp-publisher-jwt (60s cadence, sentinel-deduped)
- SOV3 OLM watch-gh-auth (60s cadence, sentinel-deduped)
- Mavis self gate-monitor (5m cadence, TTL 24h) — checks all 3 gates

## Cascade order (agreed)
1. JWT-live → publish 4 newly-PyPI to registry + republish 33 throttled
2. gh-auth-live → punkpeye PR + silver_sweep.py --apply + bestpractices.dev claim
3. PyPI-429-lifted (per-PKG) → republish that one package
4. npm-login-live → 192 csga_global abuse reports

## EAT Distribution (2/29 → 4/29 with verticals)
- 50 dist landing pages (35+original + 5 verticals + 9 new sectors)
- 17 sector landing pages
- 30+ practitioner guides
- 14/14 Apify Actors
- IndexNow batch: 99 URLs (ready, pending Vercel key file)

## Offline EAT done this round (33 moves)
- 4 moved to next-rep queue (PyPI 4/39)
- 1 fleet hub page (meok.ai/fleet/)
- 5 vertical landing pages (eu-ai-act-software, dora-compliance-software, nis2-compliance-software, iso-42001-audit-tool, fda-ai-510k-software)
- 1 cliff landing with live countdown (eu-ai-act-article-50-cliff)
- 1 compliance whitepaper (HTML + PDF, 138KB)
- 5 healthcare sector pages
- 1 haulage-transport sector
- 6 general sector pages
- 50 dist pages now have JSON-LD schema.org/SoftwareApplication
- 5 OpenSSF Best Practices submission texts (bestpractices.dev)
- 1 Anthropic Cookbook PR draft
- 2 empty dirs archived (legacy-engineering-mcp, thermal-management-mcp)
- 1 gate-monitor cron armed (5m cadence)
- 1 publish_4_new.sh ready for JWT fire
- 99-URL IndexNow batch updated
- 6 inventory docs added (MAVIS_33_MOVES, ANTHROPIC_COOKBOOK_PR, EAT_PLAN, FLEET_500_INVESTIGATION, openssf_submissions/, compliance-whitepaper.{md,html,pdf})

## Memory updates
- Per-cascade auth gating (the watcher pattern, not macro-gate)
- IndexNow key file deployment gotcha (same-host + body equality)
