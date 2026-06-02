# MEOK / CSOAI — Master Research Index
**CSOAI LTD (trading as MEOK AI Labs) · Sutton St James, Lincolnshire, UK · 2026-05-29**

The single navigator for the research corpus — for an IPO/grant data room, and for SOV3. Every entry is a **real file on disk** with provenance. Inflated/severed material is explicitly excluded (see end).

---

## 1. White papers (peer-shareable technical/policy)
| Title | File | Status | Audience |
|---|---|---|---|
| Capillary Cooling for Humanoid Robotics: Thermal as Safety-Critical | `csoai-docs/whitepaper_capillary_cooling.md` | ✅ geography+entity corrected 2026-05-29 | manufacturers, Innovate UK |
| Sovereign AI Safety Infrastructure: Physical Evaluation Facilities | `csoai-docs/whitepaper_sovereign_ai_safety.md` | ✅ entity corrected; strong as-is | MoD / Dstl / DSIT |
| Care Ethics as AI Safety Substrate | `csoai-docs/whitepaper_care_ethics_safety.md` | ✅ entity corrected | AISI, academic, policy |

**Open claim to resolve (P1):** capillary paper cites "field validation data" / "preliminary instrumented testing." Either back with real logs or soften to "proposed methodology" before IPO use.

## 2. Strategy & business
| Title | File | Status |
|---|---|---|
| MEOK DATA Strategy (investor-safe) | `csoai-docs/MEOK_DATA_STRATEGY_INVESTOR_SAFE_2026-05-29.md` | ✅ **use this one** |
| MEOK DATA Strategy (Kimi original draft) | `_inbox/kimi_meok_data_2026-05-29/` | ⚠️ inflated figures — do NOT circulate |
| IPO Valuation Path | `revenue/IPO_VALUATION_PATH_2026-05-28.md` | ✅ honest, MRR-gated |
| Digital Real Estate IPO Portfolio | `revenue/DIGITAL_REAL_ESTATE_IPO_PORTFOLIO_2026-05-28.md` | (review for inflated figures before use) |
| Master Plan (full steam) | `MEOK_MASTER_PLAN_FULL_STEAM_2026-05-29.md` | ✅ current |

## 3. Facility (24,000 sqft IOK Farm × MEOK Labs)
| Title | File |
|---|---|
| Facility Blueprint (9-zone) | `facility/MEOK_IOK_FARM_24000SQFT_BLUEPRINT_2026-05-29.md` |
| Phased Execution Plan + Gantt | `facility/PHASED_EXECUTION_PLAN_2026-05-29.md` |
| Floor plan / Gantt (visual) | `facility/floorplan.svg`, `facility/phases_gantt.svg` |

## 4. SIGIL / MEOK ONE (the IP — agent language + nervous system)
| Title | File |
|---|---|
| SIGIL Specification v0.1 | `meok-sigil/SPEC.md` |
| MEOK ONE Thought Layer | `meok-sigil/MEOK_ONE_THOUGHT_LAYER.md` |
| Reference implementation + tests | `meok-sigil/sigil/` (15/15 tests) |

## 5. Charter & governance
| Title | File |
|---|---|
| 52-Article Partnership Charter | `csoai-platform/CSOAI_Complete_Partnership_Charter_52_Articles.md` |
| (+ per-article expansions) | `csoai-platform/files (2)/CSOAI_Charter_Article_*.md` |

## 6. Security & ops references
| Title | File |
|---|---|
| Security punchlist (verified) | `revenue/SECURITY_PUNCHLIST_VERIFIED_2026-05-29.md` |
| Future-proofing research | `revenue/FUTURE_PROOFING_RESEARCH_2026-05-29.md` |
| Data-eat + SOV3 connectivity | `MEOK_DATA_EAT_AND_SOV3_CONNECTIVITY_2026-05-29.md` |
| Canonical identity (source of truth) | `csoai-docs/CANONICAL_IDENTITY_AND_RECONCILIATION_2026-05-29.md` |

---

## SOV3 access
All of §1–4 + the data-eat/identity docs are ingested into SOV3 memory (tags `ip_corpus`/`research`/`whitepaper`/`meok_research`) via `sovereign-temple/sov3_ingest_research.py` — banned-term-gated, deduped, £0 local embedding. Re-run that script after adding docs. SOV3's council, agents, and quantum-scoring can reason over this corpus; the DAILY EAT keeps surrounding literature current.

## Excluded (deliberately, do NOT include in any data room)
- `_archive/severed/` — quarantined files referencing severed ties (CSGA/Castle/Terranova). 63 files, 13 with banned terms. Never ingest, never share.
- The Kimi MEOK DATA *original* draft — inflated figures; superseded by the investor-safe edition above.

---
*Maintained by Claude (Opus 4.8). Every entry verified to exist on disk 2026-05-29. Numbers reflect real state: ~26 PyPI MCPs, Stripe £0, SOV3 0.788/~76 agents/~9,276 episodes/6 NNs.*
