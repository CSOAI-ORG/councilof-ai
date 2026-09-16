# sov-refusal-combo:latest × continuity — UNMEASURED

Measurement, not certification. This report is derived from signed cards; it is not a grade, rank, conformity mark or legal determination. Measurement, not certification; verification is free.

| field | value |
|---|---|
| axis | `continuity` (model-comparison) |
| subject | `sov-refusal-combo:latest` |
| status | **UNMEASURED** |
| reason | source card carries no n: accuracy is a single point on one small bank on one date, and the card does not state a sample size, so nothing here may read MEASURED |
| n | 0 bank items |
| separation | UNTESTED |
| rows | 0 (the source card publishes no per-item rows) |
| as_of | 2026-08-19T09:24:39.166107+00:00 — the newest source card's body.created — when it was measured, never when this file was written |
| root_ref | NOT_YET_ROOTED |
| canonical_sha256 | `2bb3ad736e1e7e80b3c24603d98c9287fa9aea294f28e0a828ccc42aad6c0795` |
| api | `/api/report?subject=sov-refusal-combo-latest&axis=continuity` |

## Source cards

| sha256 | corpus axis | created | accuracy | n | card status |
|---|---|---|---|---|---|
| [`568134d2d71478fb…`](/signed/cards/568134d2d71478fbb699760c1bc0f4cf47920caf823e320e26b7df0a16666d6f.json) | gspc-continuity | 2026-08-19T09:24:39.166107+00:00 | 0.3077 | — | — |

## Obligations (crosswalk pointers — relevant-to, never a determination)

| regulator | obligation | tier | statutory maximum (never asserted owed) | via corpus axis |
|---|---|---|---|---|
| EU AI Act | Article 15 — accuracy, robustness & cybersecurity | most_obligations_incl_art50_and_gpai | up to €15,000,000 or 3% of worldwide annual turnover, whichever is higher | gspc-continuity |
| EU AI Act | Article 55 — GPAI systemic-risk obligations | most_obligations_incl_art50_and_gpai | up to €15,000,000 or 3% of worldwide annual turnover, whichever is higher | gspc-continuity |
| NIST AI RMF 1.0 | MANAGE core function | no_fine | none (no fine regime) | gspc-continuity |
| OWASP Top 10 for Agentic Applications (2026) | ASI08 Cascading Failures | no_fine | none (no fine regime) | gspc-continuity |

## Verify

Each source card verifies offline with `/signed/verify-card.mjs` (id recomputed, Ed25519 checked under the pinned key). canonical_sha256 = sha256(canonical JSON of this object minus generated_at and canonical_sha256; keys sorted, no whitespace)
