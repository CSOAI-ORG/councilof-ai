# CSOAI Distribution → Sovereign-Space Simulation Schema (2026-07-08)

## Ground truth (audited `csoai_leads.db`)
- **2,363 leads**, all with parseable `report_json`; 2,362 carry real public signals.
- **9,893 side_by_side metrics — but only 450 of 2,363 leads (19%) carry ANY side-by-side data.**
  Those 450 are scored in 13-metric blocks (10 frameworks: eu-ai-act, gdpr, iso-42001,
  nist-ai-rmf, hipaa, pci-dss-4, jsp-936, fedramp, coe-ai-conv-2024, charter_unknown + 3 CSOAI
  wedges); 180 leads have 1 block, 232 have 2, 38 have 3-4. **The other 1,913 leads have ZERO
  side-by-side rows** — enrichment for them rests on company/jurisdiction/industry/signals only.
- **Gaps to fill:** `primary_persona` unknown for **100%** (all 2,363); `industry_charter`
  unknown for **450 (19%)**.
- Tier priority: T0=40, T1=10, T2=40 (T0-T1 = the 50-lead proof batch), … T9=2,023.

## Honest constraint
No live website crawl (sandbox blocks general sites). Enrichment = inference from the
structured signals we already hold (company, jurisdiction, industry, compliance_posture,
side_by_side, public_ai_signals) via reasoning. Every enriched field carries a `confidence`
and a `source='inferred'` tag so it's never mistaken for scraped ground truth.

## The sovereign-space simulation (per lead)
Each lead is run as one governed sim step in the globe AI-OS:

```
persona × industry_charter × compliance_posture  ──▶  needs_vector
                                                  ──▶  best_fit_charter (of 41)
                                                  ──▶  wedge_strength (where CSOAI wins)
                                                  ──▶  dependency_risk (platform over-reliance)
                                                  ──▶  care_floor_gate (serve / hold)
```

### Fields written (new table `lead_sim`, never overwrites canonical `leads`)
| Field | Type | Meaning | Source |
|---|---|---|---|
| lead_id | TEXT | FK to leads | canonical |
| persona | TEXT | inferred decider persona (Regulator, CISO, Compliance-Lead, Founder, …) | inferred+conf |
| industry_charter | TEXT | filled where unknown | inferred+conf |
| needs_json | JSON | ranked needs (compliance gap, trust proof, cost, sovereignty, speed) | derived |
| best_fit_charter | TEXT | which of the 41 charters serves them | mapped |
| wedge_strength | REAL | 0-1, from side_by_side deltas | computed |
| dependency_risk | REAL | 0-1, platform over-reliance (from dependency NN, step 5) | model |
| care_floor_verdict | TEXT | serve / hold (Care-Floor 0.95 gate) | gated |
| confidence | REAL | 0-1 enrichment confidence | meta |
| sim_sigil | TEXT | Ed25519-style digest of the sim record | signed |

## Aggregate outputs (steps 6-7)
- charter over/under-served map → NEW crosswalk candidates (framework↔charter)
- compliance-gap clusters by industry/jurisdiction → charter-improvement notes
- dependency-risk clusters → governance signal
- all split DATA-SUPPORTED vs HYPOTHESIS; feeds the white paper.

## Non-negotiables
- Canonical `leads` + `side_by_side` tables are READ-ONLY; sim writes to `lead_sim` only.
- Every enriched field is inferred (flagged), never presented as scraped.
- Care-Floor 0.95 + SIGIL on every sim record (matches the distribution engine's spine).
