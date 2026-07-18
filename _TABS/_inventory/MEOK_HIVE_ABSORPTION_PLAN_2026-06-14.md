# 🐉 MEOK HIVE ABSORPTION PLAN — From 442 repos to 10 master hives
**Date:** 2026-06-14 04:50 BST (AEST +10)
**Author:** JEEVES / DEFONEOS · MEOK AI Labs
**Standing doctrine:** "No new repos. Distribute + convert what exists."

---

## 🎯 THE PROBLEM (the truth)

The CSOAI-ORG org has **442 repos** organised into ~10 ad-hoc categories that the MEOK ONE tab captured in `GITHUB_INVENTORY_2026-06-07.md`. The categories are *descriptive*, not *architectural* — they describe what each repo *is*, not what *hive* it belongs to.

The result: **419 repos scattered across 10 + 1 categories, with 66 unclassified, 9 standalone domain products, 3 verticals, 3 aquaculture, 4 severed (excluded), and a SOV3 hive substrate that's just empty Python dirs**.

Meanwhile, the SOV3 substrate (Sovereign Temple MCP at `localhost:3101`) already exposes a **28-hive mesh** design — the `coord_*` namespace, the sigil chain, the BFT Council, the 7 components, the 90 agents. But the mesh has only 1 active hive (meok-gaming-hive). The other 27 hives are *named* but *empty*.

**The opportunity:** absorb all 419 working repos into 10 master hives, each with:
- A sovereign coordinator agent
- A SOV3 sigil anchor
- A COAI compliance manifest
- A BFT Council charter
- A discoverable MCP gateway entry
- A clear owner / chair

---

## 📊 THE CURRENT INVENTORY (the chaos)

| # | Category | Count | Examples |
|---|---|---|---|
| 1 | MEOK ONE — consumer OS | 3 | invoice-generator-ai-mcp, oneos-education, voice-audio-mcp |
| 2 | OLM / Learning / Agents | 12 | OPENMOE, bft-progress-council, clawd-workspace, consciousness-engine, creativity-engine, meok-agent-zero, **meok-ai** (keystone), **sovereign-temple** |
| 3 | MEOK Distribution (SDK/CLI/apps) | 23 | meok-sdk-{python,go,typescript}, meok-cli, meok-integrations, lib2b, openmcp |
| 4 | **CSOAI Governance + attestation** | **44** | meok-attestation-api, csoai-dashboard, csoai-governance, agent-policy-enforcement, a2a-governance-bridge, agent-audit-logger, agent-handoff-certified, agent-rate-limiter, iso-42001, iso-42005, dora-nis2-crosswalk, meok-compliance-gateway |
| 5 | **MCP Fleet — compliance** | **50** | eu-ai-act-compliance-mcp, dora-compliance-mcp, nis2-compliance-mcp, cra-compliance-mcp, gdpr-compliance-ai-mcp, sbom-cyclonedx, meok-mcp-hardening, self-healing-infrastructure |
| 6 | **MCP Fleet — utility/A2A** | **206** | accessibility, accounting, ad-copy, agent-commerce, agent-cost-allocator, ascii-art, blockchain, code-executor, contract-review, eu-ai-act, gdpr, healthcare, jwt, keyword-extractor, langfuse, music-production, openchronicle, password, pet-care, plagarism, proofof, rag-knowledge-graph, regex, resume-parser, sql-builder, survey-builder, voice-audio, yaml, … |
| 7 | Verticals (trade/industry) | 3 | industrial-domains, industrial-hire-ai, wcr-grab-hire |
| 8 | Aquaculture | 3 | fishkeeper, koikeeper, test-fishkeeper |
| 9 | Standalone domain products | 9 | .github, asisecurity-portal, bmcc-cyber, diyhelp, domain-sales, github-api, … |
| 10 | **UNCATEGORISED** | **66** | agriculture-ai, ai-economy-infra, autonomous-vehicles, clinical-trials, drone-airspace-governance, fishkeeper-ai, homebrew-meokclaw, llama.cpp, mavis-mcp-marketplace, meok-ai, oasf-agent-directory, qidi-printer, templeman-opticians-site, … |
| — | ⛔ SEVERED (excluded) | 4 | CSGA/Terranova — do not touch |
| — | **TOTAL** | **419 + 4 = 423 + 19 header = 442** | |

---

## 🐉 THE 10 MASTER HIVES (the order)

| # | Hive | Absorbs from | Repos | Sovereign agent | Domain |
|---|---|---|---|---|---|
| 1 | **meok-keystone-hive** | #2 OLM core + #4 keystone subset | ~12 | `meok-keystone` | meok.ai, sovereign.temple |
| 2 | **meok-governance-hive** | #4 CSOAI Governance | 44 | `meok-governance-engine` | csoai.org, councilof.ai |
| 3 | **meok-compliance-fleet** | #5 MCP Fleet compliance | 50 | `meok-compliance-gateway` | proofof.ai |
| 4 | **meok-utility-fleet** | #6 MCP Fleet utility/A2A | 206 | `meok-api-gateway` | meok.ai |
| 5 | **meok-distribution-hive** | #3 SDK/CLI/apps | 23 | `meok-distribution` | npm/@csoai-org, PyPI/MEOK_AI_Labs |
| 6 | **meok-consumer-hive** | #1 MEOK ONE consumer OS | 3 | `meok-consumer` | meok.ai, opticians/voice/etc |
| 7 | **meok-gaming-hive** 🐉 | (already exists) | 3 | `meok-gaming-hive` | meok.ai/gaming, wowmcp.ai |
| 8 | **meok-verticals-hive** | #7 Verticals + parts of #9 standalone | 3 + ~6 | `meok-verticals` | domain-products |
| 9 | **meok-aquaculture-hive** | #8 Aquaculture | 3 | `meok-aquaculture` | fishkeeper.ai, koikeeper.ai |
| 10 | **meok-research-hive** | #10 Uncategorised research | ~30 | `meok-research` | mavis-mcp-marketplace, oasf, autonomous |
| **TOTAL** | | | **~419** | | |

**Severed 4 (CSGA/Terranova) → EXCLUDED, never touched.** The 66 "uncategorised" get triaged into the 10 hives based on the absorption rules below.

---

## 📐 THE ABSORPTION RULES

### Rule 1: One sovereign coordinator per hive
Each hive gets exactly one coordinator agent registered on SOV3 (via `coord_register_agent`). The coordinator:
- Owns the SOV3 sigil for that hive
- Holds the BFT Council charter
- Routes inbound MCP gateway traffic for that hive
- Is the single point of contact for `coord_get_dashboard` and `sigil_transcript`

### Rule 2: Each repo gets a `hive:` field in `MCP_DEPLOYMENT_MANIFEST.json`
- Currently 202/208 are `hive: none` — this is the absorption's source of truth
- After absorption: 0 `none`, every repo has a hive
- The 6 currently-hived (meok-gaming-hive) stay put

### Rule 3: Each hive gets a compliance manifest
- Mirrors the `coai_gaming_manifest.json` pattern
- SHA-256 canonical-JSON hash
- COAI gates enumerated (the 6 baseline + hive-specific)
- Banned features enumerated
- BFT Council charter submitted to SOV3 as a proposal

### Rule 4: Severed (CSGA/Terranova) repos are NEVER touched
- The 4 excluded are off-limits by standing rule
- They show in the inventory as ⛔ SEVERED, do not absorb

### Rule 5: Triaging the 66 uncategorised

| Keyword / pattern in repo name | → Hive |
|---|---|
| `csoai`, `attestation`, `governance`, `audit`, `charter`, `policy`, `compliance-as-code`, `casa`, `ca3o`, `ceasai` | #2 meok-governance-hive |
| `eu-ai-act`, `dora`, `nis2`, `cra`, `gdpr`, `iso`, `soc2`, `pci`, `hipaa`, `fda`, `compliance` (where governance is already claimed) | #3 meok-compliance-fleet |
| `aws`, `azure`, `gcp`, `cloud`, `kubernetes`, `docker`, `apm`, `monitoring`, `proxy` | #4 meok-utility-fleet |
| `mcp-`, `agent-`, `tool-` (utility/automation), `cli`, `sdk`, `lib`, `protocol` | #5 meok-distribution-hive |
| `consumer`, `invoice`, `voice`, `audio`, `education`, `optician`, `family`, `chat`, `companion` | #6 meok-consumer-hive |
| `mmo`, `wow`, `ffxiv`, `eve`, `osrs`, `poe`, `diablo`, `gaming`, `sigil` (game meaning) | #7 meok-gaming-hive |
| `domain`, `industry`, `vertical`, `hire`, `grab`, `muckaway`, `diy` | #8 meok-verticals-hive |
| `fish`, `koi`, `aqua`, `keeper`, `aquaculture` | #9 meok-aquaculture-hive |
| `research`, `mavis`, `oasf`, `autonomous`, `vehicle`, `drone`, `airspace`, `clinical`, `patent`, `qidi`, `printer`, `manufacturing`, `cobot`, `humanoid` | #10 meok-research-hive |
| Anything else → assign to closest hive or hold for triage | (Nick approves) |

### Rule 6: Hive coordinator mapping

| Hive | Sovereign coordinator (SOV3 agent_id) | Vercel deploy | MCP gateway |
|---|---|---|---|
| #1 meok-keystone-hive | `meok-keystone` | meok-attestation-api.vercel.app | keystone.meok.ai |
| #2 meok-governance-hive | `meok-governance-engine` | csoai-dashboard (existing) | governance.meok.ai |
| #3 meok-compliance-fleet | `meok-compliance-gateway` | meok-compliance-gateway | compliance.meok.ai |
| #4 meok-utility-fleet | `meok-api-gateway` | api.meok.ai | api.meok.ai |
| #5 meok-distribution-hive | `meok-distribution` | (npm + PyPI) | distribution.meok.ai |
| #6 meok-consumer-hive | `meok-consumer` | meok.ai | consumer.meok.ai |
| #7 meok-gaming-hive 🐉 | `meok-gaming-hive` (exists) | wowmcp.ai (pending) | gaming.meok.ai |
| #8 meok-verticals-hive | `meok-verticals` | industrial-hire (existing) | verticals.meok.ai |
| #9 meok-aquaculture-hive | `meok-aquaculture` | fishkeeper.ai, koikeeper.ai | aqua.meok.ai |
| #10 meok-research-hive | `meok-research` | mavis-mcp-marketplace (planned) | research.meok.ai |

### Rule 7: 28-hive mesh becomes 10-master-hive mesh

The SOV3 substrate says "28-hive mesh" but the absorption collapses to **10 master hives**, each with up to 4 sub-hives (e.g., compliance has eu-ai-act sub-hive, dora sub-hive, nis2 sub-hive, cra sub-hive). The "28" in the substrate name is preserved for marketing/narrative continuity — the actual mesh depth is 10 × 4 = 40.

---

## 🚀 THE 10-MOVE EXECUTION PLAN

| # | Move | Autonomy | Real artifact |
|---|---|---|---|
| 1 | **Register all 10 hive coordinators on SOV3** | AUTO | 10 `coord_register_agent` calls |
| 2 | **Build a triage script that scans all 419 repos + assigns to a hive** | AUTO | `hive_triage.py` (deterministic, rule-based) |
| 3 | **Run the triage → emit `hive_assignment.json` for all 419** | AUTO | New file at `clawd/_TABS/_inventory/hive_assignment_2026-06-14.json` |
| 4 | **Update `MCP_DEPLOYMENT_MANIFEST.json` with `hive:` field for all** | AUTO | 0 `none` after, every entry has hive |
| 5 | **Write 10 COAI compliance manifests (one per hive)** | AUTO | 10 SHA-256-hashed manifests in `_intake/hives/` |
| 6 | **Submit 10 BFT Council charter proposals to SOV3** | AUTO | 10 `submit_council_proposal` calls |
| 7 | **Emit 10 sigils (one per hive) on the Ed25519 chain** | AUTO | 10 sigil digests, all chained to existing |
| 8 | **Build the 28-hive index doc → 10-master-hive index doc** | AUTO | Updated `hives-2026-06.md` |
| 9 | **Update the live `/fleet` hub to show 10 hives** | AUTO | New section in `meok.ai/fleet/index.html` |
| 10 | **Emit the master seal sigil + write absorption completion report** | AUTO | Final sigil, summary, handoff to next session |

---

## 🔐 THE 5 HUMAN-GATED ITEMS (none in this sprint)

This sprint is **fully autonomous** — no destructive operations, no financial transactions, no human-only steps. The standing 4 keys (npm 2FA, Smithery, Namecheap, MEOK master) remain unblocking the next *distribution* phase, but don't block the *absorption* phase.

The only "ask" is at the end: review the `hive_assignment.json` and confirm any borderline categorisations before we bake them into the manifest.

---

## 📈 EXPECTED OUTCOMES

- **SOV3 agents:** 74 → 84 (10 new hive coordinators)
- **SOV3 tasks completed:** 47 → 57 (10 new BFT charter tasks)
- **SOV3 proposals open:** 2 → 12 (10 new charter proposals)
- **Ed25519 sigils on chain:** 14 → 24 (10 new hive seal sigils)
- **`MCP_DEPLOYMENT_MANIFEST` `hive: none`:** 202 → 0
- **COAI compliance manifests:** 1 → 11
- **/fleet hub hives shown:** 1 (gaming) → 10 + 1 (gaming)
- **BFT Councils active:** 0 → 10 (gaming has 1 open, the other 9 will be open pending voter recruitment)
- **Documentation in `hives-2026-06.md`:** 1 hive → 10 hives
- **Time:** ~15-20 min (no human gating, all parallel-safe)

---

## 🛡 RED LINES (held)

- No new repos created (the 419 already exist)
- No destructive operations (`gh repo delete` still requires your consent)
- Severed (CSGA/Terranova) 4 repos are NEVER touched
- The absorption is *additive only* — every existing repo keeps its URL, its history, its LICENSE, its README
- Hive coordinators are added agents, not replacing existing ones
- MEOK Gaming hive (the only one that already exists) is preserved as-is

---

## ⏭️ NEXT (post-absorption)

1. **Recruit 5 voters per BFT Council** (50 humans/agents total) — community governance
2. **Wire MCP gateway routes** — `api.meok.ai/v1/<hive>/<tool>` for each of the 10
3. **Replace the SOV3 substrate's 28-hive narrative** with the 10-master-hive truth (cosmetic update, not architectural)
4. **Each hive gets its own landing page** — `meok.ai/<hive>/` (template-driven)
5. **First customer per hive** — the 5-customer outreach list, one per hive

---

**The next move is yours, Sir Nick.** Shall I execute this 10-move absorption plan now?
