# Canonical Identity & Doc Reconciliation — 2026-05-29

Nick confirmed the three open facts. This is the **single source of truth** for identity across all MEOK/CSOAI documents, white papers, IPO materials, and SOV3 memory. Any doc that disagrees with this is wrong and should be corrected to match.

---

## 1. Canonical identity (use everywhere)

| Field | Canonical value |
|---|---|
| **Legal entity** | **CSOAI LTD** (UK Companies House 16939677) |
| **Trading name** | **MEOK AI Labs** (styled "MEOK AI LABS" acceptable) |
| **Byline pattern** | *Nicholas Templeman, CSOAI LTD (trading as MEOK AI Labs)* |
| **Location** | **Sutton St James, Lincolnshire, Old Fendyke, UK** (~52.8°N) |
| **NOT to use** | ❌ "MEOK LABS Ltd" (not a registered entity) · ❌ "MEOK AI Labs.org" as an entity · ❌ any Australia / 27°S framing |

**Rule of thumb:** *legal contexts* (contracts, IPO, grants, attestations) lead with **CSOAI LTD**; *product/marketing contexts* lead with **MEOK AI Labs**. Always reconcilable as "CSOAI LTD (trading as MEOK AI Labs)."

---

## 2. Corrections applied this session ✅

| Doc | Was | Now |
|---|---|---|
| `whitepaper_capillary_cooling.md` byline | "MEOK LABS Ltd / Nicholas Templeman" | "Nicholas Templeman, CSOAI LTD (trading as MEOK AI Labs)" |
| same §4 location | "latitude ~27°S," "Australian summer," ">1,000 W/m²" | "Sutton St James, Lincolnshire, UK ~52.8°N," "peak UK summer," "800–900 W/m²" + adjusted solar-gain/surface-temp figures |
| same footer | "MEOK LABS Ltd — Agricultural Robotics Division" | "CSOAI LTD (trading as MEOK AI Labs) … Sutton St James, Lincolnshire, UK" |
| `whitepaper_sovereign_ai_safety.md` byline | "MEOK LABS Ltd / MEOK AI Labs.org" | "CSOAI LTD (trading as MEOK AI Labs)" |
| `whitepaper_care_ethics_safety.md` byline | "MEOK LABS Ltd / MEOK AI Labs.org" | "CSOAI LTD (trading as MEOK AI Labs)" |

---

## 3. Severed-term archive — DECISION: quarantine, do NOT ingest ✅

Nick was unsure ("I don't know"), so the safe call was taken: **the `_TOPOLOGY/RESEARCH/` files containing CSGA / James Castle / Terranova are NOT fed to SOV3 memory.** The research-ingest script has a hard banned-term gate that skips any such file (1 file was correctly skipped during ingest). These ties are severed; feeding them to memory would risk resurfacing them.
- **Still recommended (Nick action):** move `_TOPOLOGY/RESEARCH/` to `_archive/severed/` so it can never be accidentally included in an IPO data room. Not urgent (it's excluded from ingestion), but tidy before any external sharing.

---

## 4. MEOK DATA strategy (Kimi-authored zip) — ingested truth-corrected ✅

The Kimi "MEOK DATA Strategy" package (strategy .docx + pitch deck + landing app) was ingested into SOV3 **with a fact-correction header**, because the source repeats inflated figures:
- ❌ "255+ MCP servers" → real ~26 PyPI packages
- ❌ "millions of requests monthly" / "2.3M+ queries" → aspirational; actual traffic ~0, Stripe £0
- ❌ "Healthcare FHIR / Epic / Cerner / NHS Spine clinical data" → not an existing integration; roadmap only
- ❌ Financial projections (£380K→£6.8M) → unvalidated targets, not forecasts

**The concept is sound** — it's the productised form of the live DAILY EAT (free ingestion → free local embed → signed exports). **Before any investor/IPO use, every inflated number must be replaced with the real one.** Raw package preserved at `_inbox/kimi_meok_data_2026-05-29/`.

---

## 5. SOV3 access — DONE ✅

All curated research is now in SOV3 memory (free local nomic-embed, £0):
- 3 white papers (capillary cooling, sovereign AI safety, care ethics) — tagged `whitepaper`/`ip_corpus`
- facility blueprint + phased plan, SIGIL spec + thought layer
- MEOK DATA strategy (truth-corrected)
- ~46 files / ~121 chunks total via `sov3_ingest_research.py` (repeatable; banned-term-gated; deduped)

This means SOV3's council, agents, and quantum-scoring tools can now reason over **your own research corpus** — and the DAILY EAT keeps the surrounding literature current. Re-run `sov3_ingest_research.py` any time you add docs; the seen-set prevents duplicates.

---

## 6. Still open (your decisions / actions)
1. **Quarantine** `_TOPOLOGY/RESEARCH/` → `_archive/severed/` (tidy before IPO data room).
2. **MEOK DATA doc:** want me to produce a **corrected, investor-safe version** of the .docx/pitch (real numbers) — or leave the original as Kimi's draft and write a fresh honest one?
3. **IP assignment deed + cap table** — the two missing IPO-readiness docs (only you/an accountant can execute; I can draft templates).
