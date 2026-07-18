# CSOAI Master Absorption Plan — one authoritative site, everything folded in
**2026-06-16.** Goal: collapse the cross-fire (6+ scattered CSOAI builds + Manus export + brand archive + MCP/protocol catalog) into ONE authoritative csoai.org, live on Vercel **and** the GCP VM hive, with every MCP/protocol/package wired to the on-site SaaS funnel.

## Canonical decision
- **BUILD BASE = `csoai-platform`** — the only source with a working backbone (server/index.ts, server/vite.ts, client/vite.config.ts, drizzle, e2e) and that actually builds. 107 pages / 62 components.
- **DESIGN + CONTENT MASTER = the Manus build** (`_m2_import/CSOAI_MANUS_MASTER`, 169 comp / 213 svc) — Nick's white+green v2. It is **incomplete/flat (no backbone)** so it cannot be the base; its unique content/design is *folded onto* csoai-platform's bones.
- Output assembled at **`clawd/csoai-master/`** → deploys to the `csoai`/`csoai-v2-app` Vercel project + GCP VM, domain `csoai.org`.

## Source → contribution map
| Source | Contributes | Action |
|---|---|---|
| `csoai-platform` | working fullstack backbone + 107 pages + 62 comps | **base** |
| `CSOAI_MANUS_MASTER` | 119 unique components/pages + white+green design | port unique, reconcile 50 shared (pick best) |
| `csoai-org-v2` | **Layer 0** (`layer0_tunnels/`, `LAYER0_MASTER_EAT.md`) + MCP registries (`mcp_registry.json`, `mcp_packs_registry.json`) | absorb Layer0 + registries |
| `_m2_import/_brand_clean` (177 docs) | 52-Article Charter, **49 crosswalks**, 65 research, 25 playbooks, 26 memory | site content + knowledge layer |
| `csoai_ecosystem_build_v2.zip` | dome-dashboard comps: CrossWalkVisualizer, MCPStatus, RegulatoryClocks, ComplianceHeatMap, PDCAMetrics | fold into dashboard |
| `csoai-org` (179 static pages) | legacy content/copy | harvest unique copy |
| MCP fleet (271+ published) + protocols + packages | the catalog | surface + wire to SaaS |

## Severed-brand policy (NON-NEGOTIABLE)
Scrub **CSGA / Terranova / James Castle / CEASAI** everywhere — delete name-matched files, clean in-place references. Re-run the grep filter (`csga|terranova|james.?castle|ceasai`) after every absorb. Status: 14 files removed, App.tsx cleaned, **~36 files still need in-place ref cleaning**.

## Phases
**Phase 0 — Foundation (TODAY):** finish `csoai-platform` deps install → `npm run build` green → deploy as the authoritative csoai.org (live base). Scrub its 4 severed files first.
**Phase 1 — Brand layer:** wire the 52-Article Charter (Charter page), the 49 crosswalks (EU AI Act↔NIST↔ISO42001↔TC260 compliance-maps page), research → /library, playbooks → resources. The brand becomes *authoritative*, not decorative.
**Phase 2 — Manus design/content fold-in:** port the 119 Manus-unique components/pages; reconcile the 50 shared (keep the better of platform vs Manus); land the white+green design as the canonical skin.
**Phase 3 — Layer 0 + MCP catalog + SaaS wiring:** absorb csoai-org-v2 Layer 0 + MCP registries; build ONE catalog surfacing all 271+ MCPs + protocols + packages; wire each to the on-site funnel (pricing → checkout → signup → API key → MCP call). This is the "all connected to the SaaS" Nick wants.
**Phase 4 — SaaS goes live (CRED-GATED, = 100/100):** MEOK_MASTER_API_KEY + Stripe live keys + `/api` 403 lift → checkout charges, signup creates accounts, MCPs execute. Site is buildable today; *this* is what turns looks-100 into is-100.
**Phase 5 — Hive/GCP VM + cleanup:** stand the master on the GCP VM hive (brand lives on the hive, not only Vercel); point csoai.org via the hive-bridge (apex is in a Vercel scope the CLI can't write); **retire the cross-fire dupes** (`fishkeeper-app/koikeeper-app/grabhire-app/planthire-app/care-app` shell copies, csoai-org-v2, csoai-org) so cross-fire can't recur. ONE master, one source of truth.

## Done-definition
- One repo (`csoai-master`) builds green, deploys to Vercel + GCP VM, serves csoai.org.
- 0 severed-brand leakage.
- Charter + crosswalks + research live as authoritative content.
- Every MCP/protocol/package listed and linked to a working SaaS funnel.
- Dupes archived. Live SaaS once creds land.
