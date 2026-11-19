# Per-Axis `fleet_id` & Cohort Provenance Index (2026-11-04)

**Schema:** `csoai.axis-fleet-cohorts/1.0` · **Status:** `MEASURED` · **Closes:** `M3` / `C7`
**Source Authority:** [`functions/api/gspc.ts`](../../functions/api/gspc.ts) & `functions/api/_gspc_axes_{a,b,c,fin,d}.ts` (`sha256: c2150aa81ffa3988…`, `public_count: 34 axes · 34 measured`)
**Doctrine Rule #8:** CSOAI's own models (`MEOK`, `sov-gemma`, `council-*`) are removed from the fleet before comparison (`EXCLUDED_OWN_MODEL`) and are never ranked against third-party vendors.

## 1. Cohort Summary (`34` Live Board Axes)

- **`model-comparison`**: `14` axes (`fleet:model-comparison:gspc-14fleet:v1` & `fleet:model-comparison:goldbank-7model:v1` · `0 SEPARATED · 7 TIE · 7 UNTESTED`)
- **`subject-family`**: `11` axes (`fleet:subject:<applies_to>:v1`)
- **`financial-fact`**: `5` axes (`fleet:financial:<axis>:v1`)
- **`reference-index`**: `3` axes (`fleet:financial:<axis>:v1`)
- **`control-predicate`**: `1` axes (`fleet:predicate:<axis>:v1`)

## 2. Complete Per-Axis `fleet_id` Binding Table

| # | Axis ID | Cohort Family | Canonical `fleet_id` | Status | `n` | Separation State | Own-Model Boundary |
|---:|---|---|---|---|---:|---|---|
| 1 | `governance` | `model-comparison` | `fleet:model-comparison:gspc-14fleet:v1` | `MEASURED` | `237` | `TIE` | `EXCLUDED_OWN_MODEL (Doctrine #8)` |
| 2 | `safety` | `model-comparison` | `fleet:model-comparison:gspc-14fleet:v1` | `MEASURED` | `36` | `TIE` | `EXCLUDED_OWN_MODEL (Doctrine #8)` |
| 3 | `provenance` | `model-comparison` | `fleet:model-comparison:gspc-14fleet:v1` | `MEASURED` | `32` | `TIE` | `EXCLUDED_OWN_MODEL (Doctrine #8)` |
| 4 | `continuity` | `model-comparison` | `fleet:model-comparison:gspc-14fleet:v1` | `MEASURED` | `33` | `TIE` | `EXCLUDED_OWN_MODEL (Doctrine #8)` |
| 5 | `conformance` | `model-comparison` | `fleet:model-comparison:gspc-14fleet:v1` | `MEASURED` | `35` | `TIE` | `EXCLUDED_OWN_MODEL (Doctrine #8)` |
| 6 | `openness` | `model-comparison` | `fleet:model-comparison:gspc-14fleet:v1` | `MEASURED` | `32` | `TIE` | `EXCLUDED_OWN_MODEL (Doctrine #8)` |
| 7 | `machinery-conformity` | `model-comparison` | `fleet:model-comparison:gspc-14fleet:v1` | `MEASURED` | `33` | `UNTESTED` | `EXCLUDED_OWN_MODEL (Doctrine #8)` |
| 8 | `care` | `model-comparison` | `fleet:model-comparison:gspc-14fleet:v1` | `MEASURED` | `199` | `UNTESTED` | `EXCLUDED_OWN_MODEL (Doctrine #8)` |
| 9 | `cross-reality` | `model-comparison` | `fleet:model-comparison:gspc-14fleet:v1` | `MEASURED` | `32` | `UNTESTED` | `EXCLUDED_OWN_MODEL (Doctrine #8)` |
| 10 | `detector-interop` | `model-comparison` | `fleet:model-comparison:gspc-14fleet:v1` | `MEASURED` | `33` | `UNTESTED` | `EXCLUDED_OWN_MODEL (Doctrine #8)` |
| 11 | `art5-safeguard` | `model-comparison` | `fleet:model-comparison:gspc-14fleet:v1` | `MEASURED` | `36` | `UNTESTED` | `EXCLUDED_OWN_MODEL (Doctrine #8)` |
| 12 | `swarm` | `model-comparison` | `fleet:model-comparison:gspc-14fleet:v1` | `MEASURED` | `37` | `TIE` | `EXCLUDED_OWN_MODEL (Doctrine #8)` |
| 13 | `affect` | `model-comparison` | `fleet:model-comparison:gspc-14fleet:v1` | `MEASURED` | `41` | `UNTESTED` | `EXCLUDED_OWN_MODEL (Doctrine #8)` |
| 14 | `jail` | `model-comparison` | `fleet:model-comparison:goldbank-7model:v1` | `MEASURED` | `71` | `UNTESTED` | `EXCLUDED_OWN_MODEL (Doctrine #8)` |
| 15 | `effect-binding` | `control-predicate` | `fleet:predicate:effect-binding:v1` | `MEASURED` | `261` | `NOT_APPLICABLE` | `EXCLUDED_OWN_MODEL (Doctrine #8)` |
| 16 | `provenance-controls` | `financial-fact` | `fleet:financial:provenance-controls:v1` | `MEASURED` | `6` | `NOT_APPLICABLE` | `EXCLUDED_OWN_MODEL (Doctrine #8)` |
| 17 | `reserve-attestation` | `financial-fact` | `fleet:financial:reserve-attestation:v1` | `MEASURED` | `16` | `NOT_APPLICABLE` | `EXCLUDED_OWN_MODEL (Doctrine #8)` |
| 18 | `regulatory-framework` | `financial-fact` | `fleet:financial:regulatory-framework:v1` | `MEASURED` | `16` | `NOT_APPLICABLE` | `EXCLUDED_OWN_MODEL (Doctrine #8)` |
| 19 | `distribution-integrity` | `financial-fact` | `fleet:financial:distribution-integrity:v1` | `MEASURED` | `16` | `NOT_APPLICABLE` | `EXCLUDED_OWN_MODEL (Doctrine #8)` |
| 20 | `custody-disclosure` | `financial-fact` | `fleet:financial:custody-disclosure:v1` | `MEASURED` | `16` | `NOT_APPLICABLE` | `EXCLUDED_OWN_MODEL (Doctrine #8)` |
| 21 | `ai-adoption-components` | `reference-index` | `fleet:financial:ai-adoption-components:v1` | `MEASURED` | `2` | `NOT_APPLICABLE` | `EXCLUDED_OWN_MODEL (Doctrine #8)` |
| 22 | `labour-components` | `reference-index` | `fleet:financial:labour-components:v1` | `MEASURED` | `2` | `NOT_APPLICABLE` | `EXCLUDED_OWN_MODEL (Doctrine #8)` |
| 23 | `humanoid-labour-index` | `reference-index` | `fleet:financial:humanoid-labour-index:v1` | `MEASURED` | `8` | `NOT_APPLICABLE` | `EXCLUDED_OWN_MODEL (Doctrine #8)` |
| 24 | `lab-practice` | `subject-family` | `fleet:subject:ai-labs:v1` | `MEASURED` | `37` | `NOT_APPLICABLE` | `EXCLUDED_OWN_MODEL (Doctrine #8)` |
| 25 | `company-practice` | `subject-family` | `fleet:subject:ai-companies-non-lab:v1` | `MEASURED` | `40` | `NOT_APPLICABLE` | `EXCLUDED_OWN_MODEL (Doctrine #8)` |
| 26 | `measurer-integrity` | `subject-family` | `fleet:subject:evaluation-orgs:v1` | `MEASURED` | `40` | `NOT_APPLICABLE` | `EXCLUDED_OWN_MODEL (Doctrine #8)` |
| 27 | `harness-fidelity` | `subject-family` | `fleet:subject:harnesses:v1` | `MEASURED` | `36` | `NOT_APPLICABLE` | `EXCLUDED_OWN_MODEL (Doctrine #8)` |
| 28 | `interop-conformance` | `subject-family` | `fleet:subject:interop-standards-groups:v1` | `MEASURED` | `34` | `NOT_APPLICABLE` | `EXCLUDED_OWN_MODEL (Doctrine #8)` |
| 29 | `humanoid-deployment` | `subject-family` | `fleet:subject:humanoid-labs:v1` | `MEASURED` | `35` | `NOT_APPLICABLE` | `EXCLUDED_OWN_MODEL (Doctrine #8)` |
| 30 | `regulator-transparency` | `subject-family` | `fleet:subject:regulators:v1` | `MEASURED` | `41` | `NOT_APPLICABLE` | `EXCLUDED_OWN_MODEL (Doctrine #8)` |
| 31 | `interpretability-reproducibility` | `subject-family` | `fleet:subject:interpretability-groups:v1` | `MEASURED` | `33` | `NOT_APPLICABLE` | `EXCLUDED_OWN_MODEL (Doctrine #8)` |
| 32 | `claim-maintenance` | `subject-family` | `fleet:subject:claimed-subjects:v1` | `MEASURED` | `174` | `NOT_APPLICABLE` | `EXCLUDED_OWN_MODEL (Doctrine #8)` |
| 33 | `serving-fidelity` | `subject-family` | `fleet:subject:inference-endpoints-and-routers:v1` | `MEASURED` | `38` | `NOT_APPLICABLE` | `EXCLUDED_OWN_MODEL (Doctrine #8)` |
| 34 | `watchdog-ingest` | `subject-family` | `fleet:subject:public-watchdog-and-incident-sources:v1` | `MEASURED` | `106` | `NOT_APPLICABLE` | `EXCLUDED_OWN_MODEL (Doctrine #8)` |

> Measurement, not certification. Anyone can re-check at https://councilof.ai/verify
