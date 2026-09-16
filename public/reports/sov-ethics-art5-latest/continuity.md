# sov-ethics-art5:latest × continuity — UNMEASURED

Measurement, not certification. This report is derived from signed cards; it is not a grade, rank, conformity mark or legal determination. Measurement, not certification; verification is free.

| field | value |
|---|---|
| axis | `continuity` (model-comparison) |
| subject | `sov-ethics-art5:latest` |
| status | **UNMEASURED** |
| reason | source card carries no n: accuracy is a single point on one small bank on one date, and the card does not state a sample size, so nothing here may read MEASURED |
| n | 0 bank items |
| separation | UNTESTED |
| rows | 0 (the source card publishes no per-item rows) |
| as_of | 2026-08-19T09:24:39.164472+00:00 — the newest source card's body.created — when it was measured, never when this file was written |
| root_ref | NOT_YET_ROOTED |
| canonical_sha256 | `2a031a591511a3130f24955bb5080c86408664a4f8d9b472e6908785e4e76c4e` |
| api | `/api/report?subject=sov-ethics-art5-latest&axis=continuity` |

## Source cards

| sha256 | corpus axis | created | accuracy | n | card status |
|---|---|---|---|---|---|
| [`9b5ffb530f5e1cab…`](/signed/cards/9b5ffb530f5e1cabbcde1041fc69e3d2e699fcb79ef848957d1a3f1d12e19636.json) | gspc-continuity | 2026-08-19T09:24:39.164472+00:00 | 0.3846 | — | — |

## Obligations (crosswalk pointers — relevant-to, never a determination)

| regulator | obligation | tier | statutory maximum (never asserted owed) | via corpus axis |
|---|---|---|---|---|
| EU AI Act | Article 15 — accuracy, robustness & cybersecurity | most_obligations_incl_art50_and_gpai | up to €15,000,000 or 3% of worldwide annual turnover, whichever is higher | gspc-continuity |
| EU AI Act | Article 55 — GPAI systemic-risk obligations | most_obligations_incl_art50_and_gpai | up to €15,000,000 or 3% of worldwide annual turnover, whichever is higher | gspc-continuity |
| NIST AI RMF 1.0 | MANAGE core function | no_fine | none (no fine regime) | gspc-continuity |
| OWASP Top 10 for Agentic Applications (2026) | ASI08 Cascading Failures | no_fine | none (no fine regime) | gspc-continuity |

## Verify

Each source card verifies offline with `/signed/verify-card.mjs` (id recomputed, Ed25519 checked under the pinned key). canonical_sha256 = sha256(canonical JSON of this object minus generated_at and canonical_sha256; keys sorted, no whitespace)
