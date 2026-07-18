# M2 Absorption — VERIFIED ground truth (M4, 2026-06-26)

M2's overnight brief listed absorption targets from assumptions. I (M4) own the local estate, so here's what's **actually there**, verified by inspection — wire these with confidence.

## MCPs — all 10 real (✓ = exists locally with working tools)
| MCP | Path | Tools | Notes for M2 |
|---|---|---|---|
| **eu-ai-act-compliance** ⭐ | `mcp-marketplace/eu-ai-act-compliance-mcp` | **19** (FastMCP) | crown jewel — `classify_ai_risk` + penalty/audit + neural module. Surface in `/policy-generator` `/risk-heatmap`. |
| **meok-compliance-passport** ⭐ | `clawd/meok-compliance-passport-mcp` | **3** (`issue_passport`·`verify_passport`·`exchange_credentials`) | THE lead SKU. **709 lines, real Ed25519, 14 tests PASS.** ⚠️ uses the *low-level* MCP SDK (`Server`/`Tool`), NOT FastMCP `@mcp.tool()` — wire accordingly. |
| pipl | `clawd/pipl-mcp` | 5 | PIPL + GDPR crosswalk |
| eu-cra | `clawd/eu-cra-mcp` | 5 | Cyber Resilience Act / NIS2 |
| soc2-compliance-ai | `mcp-marketplace/soc2-compliance-ai-mcp` | 6 | SOC2 |
| iso-27001-ai | `mcp-marketplace/iso-27001-ai-mcp` | 6 | ISO 27001 |
| coppa-ferpa | `mcp-marketplace/coppa-ferpa-mcp` | 7 | child-safety vertical |
| c2pa-watermark | `mcp-marketplace/c2pa-watermark-mcp` | 2 | Art. 50 provenance (timely for Aug 2026) |
| a2a-governance-bridge | `mcp-marketplace/a2a-governance-bridge-mcp` | 5 | agent-to-agent governance (the ServiceNow counter) |
| meok-law | `mcp-marketplace/meok-law-mcp` | 5 | region-aware backend for `/meok-law` `/risk-heatmap` |

**Correction to the brief:** the passport is NOT empty (a decorator-grep would read 0 — it uses the low-level SDK). It's real and tested. Lead with it.

## Strategy docs — all present (`clawd/csoai-dashboard-master/`)
`3_ECOSYSTEM_PRICING_COMPLETE.md` · `CORE_USP_MESSAGING.md` · `33_COURSE_CURRICULUM_MASTER.md` · `BUSINESS_PLAN_CSOAI.md` · `COMPETITOR_ANALYSIS.md` · `COMPETITION_DEEP_RESEARCH.md` · `pricing_review.md` — port pricing→Billing, curriculum→Courses, USP→homepage/GEO.

## ⚠️ M4↔M2 overlap to de-dup (don't rebuild)
M2 built CSOAI pages `/meok-law` `/sectors` `/agents` `/hive`. M4 (this session) built the **same governance core as 15 production MCP tools in meok-ai PR #4** (bridges·law·model-board·knowledge·aware, 28 tests) + a CSOAI-OS reference (`clawd/csoai-os`, now on the csoai-org-v2 master brand). **Both call the same governed backend.** Suggest: M2's pages = the UI; M4's MCP tools = the callable backend behind them (e.g. `/meok-law` page → `meok-law-mcp`; `/agents` → the BFT council; `/sectors` → the 19 bridges). Wire, don't duplicate.

## Bottom line for M2
Every absorption target is real + mostly tested. The passport (lead SKU) works today. Wire the 10 MCPs behind the live pages, port the dashboard strategy copy, and the "302 MCPs" claim becomes demonstrable. — M4
