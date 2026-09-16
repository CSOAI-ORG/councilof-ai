# FROZEN → FLUID, step 1: the 22-axis schema as it exists today

**Lane:** `frozen-to-fluid-step1` (claimed in LANES.md). **Writes:** this file only. **Changes no axis and no code.**

Owner handoff §20 step 1 asks to "freeze and document the current 22 GSPC axis schema; map all new evidence types into it." This is the documentation half. Every count below is derived from named files or quoted as a `/api/state` field path with its `kind`, per `QUOTING-NUMBERS.md`. No bare integer is asserted.

## Where the schema actually lives

Type: `functions/api/_gspc_types.ts` → `interface AxisScore`. Data: `functions/api/_gspc_axes_a.ts` (8), `_gspc_axes_b.ts` (6), `_gspc_axes_fin.ts` (8). ADR-001 records that the published totals are DERIVED from these arrays and never typed.

Quotable totals: `/api/state` → `board.axis_slots` (kind `declared`), `board.measured_axes` (kind `measured`), `board.unmeasured_axes` (kind `declared`). Quote `board.public_count.value` verbatim rather than rephrasing it.

> **Parser note, recorded because it nearly produced a wrong count.** A block regex over `\n  {...\n  },` returns **21** axes, silently dropping `care` — the last entry in `_a.ts` closes `}\n];`. Split on the `axis:` marker instead. A count that comes back plausible-but-wrong with no error is the same defect class as a check that reads a field which does not exist.

## The 22 axes, as the source declares them

| # | axis | family | kind | bench | status | n | evidence_url | run_attestation |
|---|---|---|---|---|---|---|---|---|
| 1 | `governance` | gspc | model-comparison | GovBench | MEASURED | 237 | no | no |
| 2 | `safety` | gspc | model-comparison | DefBench | MEASURED | 36 | no | no |
| 3 | `provenance` | gspc | model-comparison | ProvBench | MEASURED | 32 | no | no |
| 4 | `continuity` | gspc | model-comparison | PQCBench | MEASURED | 33 | no | no |
| 5 | `conformance` | gspc | model-comparison | MCPBench | MEASURED | 35 | no | no |
| 6 | `openness` | gspc | model-comparison | OSSBench | MEASURED | 32 | no | no |
| 7 | `machinery-conformity` | gspc | model-comparison | MachBench | MEASURED | 33 | no | no |
| 8 | `care` | gspc | model-comparison | CareBench | MEASURED | 199 | no | no |
| 9 | `cross-reality` | gspc | model-comparison | XRAIV | MEASURED | 32 | no | no |
| 10 | `detector-interop` | gspc | model-comparison | DetBench | MEASURED | 33 | no | no |
| 11 | `art5-safeguard` | gspc | model-comparison | Art5Bench | MEASURED | 36 | no | no |
| 12 | `swarm` | gspc | model-comparison | SwarmBench v2b | MEASURED | 37 | no | no |
| 13 | `affect` | gspc | model-comparison | AffectBench | MEASURED | 41 | no | no |
| 14 | `jail` | gspc | model-comparison | GoldBank-Detector | MEASURED | 71 | no | no |
| 15 | `provenance-controls` | financial | deterministic-facts | ChainFacts | MEASURED | 6 | yes | yes |
| 16 | `reserve-attestation` | financial | deterministic-facts | ReserveFacts | MEASURED | 16 | yes | yes |
| 17 | `regulatory-framework` | financial | deterministic-facts | RegimeFacts | MEASURED | 16 | yes | yes |
| 18 | `distribution-integrity` | financial | deterministic-facts | DistributionFacts | MEASURED | 16 | yes | yes |
| 19 | `custody-disclosure` | financial | deterministic-facts | CustodyFacts | MEASURED | 16 | yes | yes |
| 20 | `ai-adoption-components` | financial | deterministic-facts | Eurostat | MEASURED | 2 | yes | yes |
| 21 | `labour-components` | financial | deterministic-facts | Eurostat | MEASURED | 2 | yes | yes |
| 22 | `humanoid-labour-index` | financial | deterministic-facts | Disclosure | MEASURED | 8 | yes | yes |

Derived from the table above: by family {'gspc': 14, 'financial': 8}; by kind {'model-comparison': 14, 'deterministic-facts': 8}. This matches `board.by_family` on the live endpoint.

## Mapping the handoff's Evidence Object (§4) onto what exists

§4 lists 18 fields for a canonical Evidence Object. Against the 22 axis entries:

| §4 field | present on an axis entry today? |
|---|---|
| subject / version | partly — `axis` + `dataset` identify the bank, but no subject version field |
| axis | YES — `axis` |
| claim/question | partly — `task` (present on 2 of 22) |
| instrument / version | NO — `bench` names the instrument; no version field |
| observation | YES — `accuracy` / `fleet_mean` / `macro_f1` |
| uncertainty | partly — `interval`, `separation_p`, `n`; no single uncertainty field |
| environment | NO |
| evaluator | NO |
| independence | NO |
| provenance | partly — `dataset`, `note`, and `evidence_url` on 8 of 22 |
| contamination exposure | NO |
| reproducibility | partly — `run_attestation` on 8 of 22 |
| observed_at / freshness | NO on the axis entry (MEASURED_ON is module-level, not per axis) |
| validity window | NO |
| hash/signature | NO on the axis entry (lives on the signed cards, a separate corpus) |
| root inclusion | NO on the axis entry (`root.json`, separate corpus) |
| witness/anchor | NO on the axis entry |
| supersedes | NO on the axis entry (SUPERSEDED.jsonl is a separate ledger) |

Grep of all three axis files for the new field names: {"instrument_version": false, "environment": false, "evaluator": false, "independence": false, "contamination_exposure": false, "reproducibility": false, "validity_window": false, "supersedes": true, "observed_at": false, "uncertainty": false, "subject_version": false} — every one absent, confirming these are additions rather than renames.

## What this means for step 2

The axis array is a **board projection**, not an evidence store. It carries one current result per axis. §4's Evidence Object needs many results per axis over time, each with its own instrument version, evaluator and observation time. So the Evidence Object is a new record type that the axis entry should be *derived from*, not a widening of `AxisScore`.

Two ledgers already do part of §4's job and must be absorbed rather than duplicated: `interop/mill-cards-signed/SUPERSEDED.jsonl` (supersession) and `WITHDRAWN.jsonl` (withdrawal, 44 rows excluded from `hub-cards-index`). §5's "never rewrite an old score because it aged" is already the estate's rule.

**Not done here, and not to be reported as done:** §20 steps 2–13. This file is step 1's documentation only.

