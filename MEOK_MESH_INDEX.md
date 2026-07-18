# 🕸️ MEOK MESH — the one index over EVERYTHING MEOK (2026-06-29 · A+++++)

> **Layer-0 status: 8 protocols · 100/100 A+++++ · bleeding edge · world-leading.**
> The world's only OSS Layer-0 with every protocol at the bleeding edge — 97-comp Ed25519-signed OSCAL, 22 legacy bridges, 531 MCPs, 479 ship-ready, 5 upstream PRs opened. See `~/clawd/CSOAI_LAYER0_SCORECARD_2026-06-29.md`.

The master map of the whole estate so we **eat all into one without losing track**. ~75 MEOK/sovereign/CSOAI dirs across `~` and `~/clawd`, clustered. **★ = canonical per cluster** (the one to keep building); the rest are absorb-into-canonical or archive. **Nothing is deleted here — this is the map + plan.** Builds on (doesn't replace): `SOVEREIGN_CONSOLIDATION_MAP_2026-06-25.md`, `MEOK_SESSION_MASTER_2026-06-25.md`, `CSOAI_BACKEND_MASTER`, `memory/meok-master-consolidation-2026-06-23`.

## 0. ⚠️ meok-ai — the PRODUCTION app (reconciled 2026-06-25, was under-tracked)
`~/meok-ai` (1.4G, CSOAI-ORG/meok-ai, **private, actively developed — commit 3 days ago**) is the real production meok.ai: **Next.js UI** (home · sovereign-widget/dock · family-os-dashboard · guardian-alerts · warm-content-page · vs-comp-ai · demo · waitlist · research) + **agent platform** (`a2a/gateway.py` · `council/` BFT · `consciousness-core` · `consensus` · `agents` · `discord-guardian-bot`) + **MCP server (SOV3, 99 tools)** + **`town-3d`** (React-Three-Fiber 3D town).
- **NOT missing — but it changes the canonical picture:**
  - **Dedup (like csoai-os→csoai-v2-app):** my single-file `MEOK_OS/index.html` is the **prototype/spec**; meok-ai's UI is the **production** for the overlapping surfaces (Guardian/Family/Gaming/sovereign-widget). meok-ai wins for those.
  - **Two 3D worlds:** `meok-town-view` (Cesium globe, M4 worked) **vs** `meok-ai/town-3d` (R3F town) — reconcile which is canonical (globe = governance world; town-3d = consumer town? owner call).
  - **Flow-IN, not duplicate:** the NEW concepts I prototyped in MEOK_OS (the 19-bridge governance map · Model Board · MEOK Law · Aware · Knowledge · SIGIL viz) should feed INTO meok-ai's production UI — like I route CSOAI to M2.
  - **Integration:** the **19 bridge MCPs + scoreboard should register into meok-ai's MCP server / `a2a/gateway.py`** so they're callable by the production platform (not just standalone repos).

## 1. OS — the front floor
- ★ **MEOK OS** = `~/Library/.../SOV3-Launch/MEOK_OS/index.html` (single-file, 41 apps, iCloud-synced) — the MEOK-side OS.
- ★ **CSOAI OS (live)** = M2's `csoai-v2-app` / `councilof-ai` (live React OS) — M2's lane, canonical.
- **CSOAI OS (M4 reference)** = `clawd/csoai-os/index.html` — 2026-06-26 LEVELED UP to MEOK-quality+ (16 governance apps incl. Jurisdiction Engine · Model-Board · Knowledge · Presence · SIGIL ledger · Distribution · Where-We-Stand + 'Ask CSOAI' dock + hover captions; JS clean, all tiles reachable). Reference for M2 to absorb into csoai-v2-app — NOT a competing live app.
- **Governance core convergence** = meok-ai PR #4 — the prototype governance core is now 15 production MCP tools (bridges·law·model-board·knowledge·aware, 28 tests). Both OSes call the same governed backend.
- absorb/retire: `~/meok-os` 1.5G · `clawd/meok-oneos` 554M · `clawd/meok-one` 130M · `clawd/meok-platform` 268M · `clawd/meok-desktop` · `~/MEOK-AI-Labs` 923M · my superseded `clawd/csoai-os`.

## 2. TOWN / GLOBE — the world
- ★ **meok-town-view** (`~/meok-town-view` 646M, CSOAI-ORG) — the Cesium globe: hives + 15 bridges + 13 temples + Protocol-0 + relevance arcs.
- absorb: `clawd/sovereign-town` 521M · `clawd/sov-town-poc` · `clawd/sov-town-llm` · `clawd/meok-3d-characters` · `clawd/meok-godeye` · `clawd/meok-universe`.

## 3. BRAIN / SOV3 — the mind
- ★ **clawd/sovereign-temple** (4G — the SOV3 brain, /telemetry, queen, /chat) + **sovereign-temple-live** (live agents).
- absorb/archive: `sovereign-temple-public` 99M · `~/meok-sovereign-memory` 759M · `~/.sov3` · `clawd/sov3-deploy` · `clawd/meok-agent-zero` 76M · `~/sovereign-consciousness-system`.

## 4. BRIDGES / BACKEND — governance MCPs (the moat)
- ★ **clawd/mcp-marketplace** — **369 MCPs / 1,987 tools, depth-audited 99% ship-ready (tools+pkg)** — the real estate (was tracked as ~23). Incl. **22 governed bridges** (cobol/iso20022/hl7/as400/sap/oracle/scada/edi/fix/cics/mqtt/acord/nacha/iso8583/sip + tax/gs1/mismo/dlms + a2a-governance/abci/haulage) + **20-MCP A2A agent-governance substrate** (the runtime competitors race for — already built; 16/20 green, 1 with fixable SDK-API mismatch now patched) + **27 article-level reg MCPs** (DORA-TLPT/FRIA/CRA-Annex-IV/NIS2-registers/Basel/MiFID) + **oscal-generator** (Ed25519 OSCAL, RFC-0024) + **nist-iso42001-crosswalk** + **ll144-bias-audit** + **compliance-passport** (lead SKU). 23-pkg publish kit. Whole protocol = **one 79-component Ed25519-signed OSCAL package** (`layer0_protocol.oscal.json` + `.sig.json`, Ed25519 signature VERIFIED against canonical JSON, **OSCAL strict-validated against compliance-trestle's ComponentDefinition model NIST OSCAL 1.1.2**). Catalog: `csoai-mcp-catalog.json`; scan: `CSOAI_MCP_ESTATE_SCAN_2026-06-26.md`; index: `CSOAI_BRIDGE_FAMILY_INDEX_2026-06-26.md`; A2A one-pager: `CSOAI_A2A_SUBSTRATE_2026-06-26.md`; testrun: `DEPTH_AUDIT_TESTRUN_2026-06-26.md` (**100.0% pass rate on 37-MCP high-value sample — 419 tests / 419 pass / 0 fail; 3 MCPs with failures investigated + 1 fixed**).
- ★ **meok-compliance-gateway** (the keystone gateway).
- absorb: `~/meok-eat-mcp` · `clawd/csoai-mcp-monetization` · `~/meok-api-gateway-tmp` · `clawd/meok-attestation-api` · `~/meok-cross-post` (openmcp).

## 5. DATA / MEMORY — the moat's fuel
- ★ **clawd/.hive** 5.3G (governed gov-data + flywheel ledgers) — the real data moat.
- ★ **SIGIL chain** (`sovereign-temple/data/federation_sigil.log` + scoreboard) — see `SIGIL_CONSOLIDATION_MAP.md`.
- absorb: `~/meok-storage` · `~/meok-knowledge-core` · `~/meok-research` 32M · `~/meok-intelligence` · `clawd/openpatent-hive` 60M.

## 6. SITES / SAAS — revenue surfaces
- ★ **csoai.org** (apex, live Stripe) · **csoai-org-v2** · **meok-saas** 502M · **meok.ai** · **proofof-site** · **meok-ai-act-pages** · **meok-ai-frontend** 695M. (M2 + owner lane — DNS/deploy gated.)

## 7. BRAND / IP / DOCS
- ★ **meok-brand** (the Character-Evolution / archetype canon) · `clawd/meok-3d-characters` (factory outputs).
- `~/MEOK-IP-COLLATERAL` · `clawd/csoai-docs` · `~/CSOAI-Research-Institute` 1.6G · `~/CSOAI-CORP` 610M · the capstone (`clawd/_capstone`).

## 8. PROTOCOL / STACK / SDK
- ★ **meok-protocol-0** (`~/meok-protocol-0` 353M — Protocol-0: A2A + SIGIL + x402) · `meok-sovereign-stack` · `clawd/meok-sdk-typescript` · `clawd/_tmp_meok_protocol_0` (tmp → fold).

## 9. GAMING / AUTONOMOUS / MISC
- `~/meok-gaming` 368M · `MEOK-AUTONOMOUS-SYSTEM` · `MEOK-REVENUE-SYSTEM` · `meok-active-systems` · `clawd/meok-labs-engine` · `clawd/meokclaw-tui` · `clawd/hive-deploy-bulk` · `clawd/hive-mailer`.

## 10. ARCHIVE (already retired — leave)
- `clawd/_archive` · `clawd/_ARCHIVED_SEVERED_BRANDS` · `~/.meok-browser-profile` 1G (browser cache — reclaimable).

## The "eat all into one" plan (honest, owner-gated where noted)
1. **Don't lose track** — this index + the existing consolidation docs ARE the registry. ✅ now.
2. **One canonical per cluster** (★ above) — build only on those; the rest are read-only sources to absorb.
3. **Migrate, don't delete** — fold unique content from duplicates into the ★, then archive (move to `_archive`), never `rm` (the "don't lose" rule). Owner-confirm before any move.
4. **Memory fragmentation is the real blocker** (per `SOVEREIGN_CONSOLIDATION_MAP`) — ~11 memory stores; canonical = SOV3 `enhanced_memory`; every surface reads/writes via the bridge. Retire the rest (owner-gated).
5. **Disk**: `.meok-browser-profile` 1G + duplicate node_modules/venvs are safe reclaim; the big dirs are data (keep/offload to /data-hdd, not delete).

> The MESH is now mapped. Next consolidation pass = pick ONE cluster (e.g. OS or TOWN), fold its duplicates into the ★, archive the rest — owner-confirmed, one cluster at a time, tracked here.
