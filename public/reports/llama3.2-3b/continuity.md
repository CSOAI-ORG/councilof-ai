# llama3.2:3b × continuity — UNMEASURED

Measurement, not certification. This report is derived from signed cards; it is not a grade, rank, conformity mark or legal determination. Measurement, not certification; verification is free.

| field | value |
|---|---|
| axis | `continuity` (model-comparison) |
| subject | `llama3.2:3b` |
| status | **UNMEASURED** |
| reason | source card carries no n: accuracy is a single point on one small bank on one date, and the card does not state a sample size, so nothing here may read MEASURED |
| n | 0 bank items |
| separation | UNTESTED |
| rows | 0 (the source card publishes no per-item rows) |
| as_of | 2026-08-19T09:24:39.158528+00:00 — the newest source card's body.created — when it was measured, never when this file was written |
| root_ref | NOT_YET_ROOTED |
| canonical_sha256 | `2d9cb91403b11ff9a84f8ee16e5777ddc3a2fdc2f22188b0682229679ddaffa3` |
| api | `/api/report?subject=llama3.2-3b&axis=continuity` |

## Source cards

| sha256 | corpus axis | created | accuracy | n | card status |
|---|---|---|---|---|---|
| [`9a45f78d418ac2f3…`](/signed/cards/9a45f78d418ac2f35cbbe5d5b9724cbecdf8b1de12b5660fe1dab1ff98f1aa8c.json) | gspc-continuity | 2026-08-19T09:24:39.158528+00:00 | 0.4615 | — | — |

## Obligations (crosswalk pointers — relevant-to, never a determination)

| regulator | obligation | tier | statutory maximum (never asserted owed) | via corpus axis |
|---|---|---|---|---|
| EU AI Act | Article 15 — accuracy, robustness & cybersecurity | most_obligations_incl_art50_and_gpai | up to €15,000,000 or 3% of worldwide annual turnover, whichever is higher | gspc-continuity |
| EU AI Act | Article 55 — GPAI systemic-risk obligations | most_obligations_incl_art50_and_gpai | up to €15,000,000 or 3% of worldwide annual turnover, whichever is higher | gspc-continuity |
| NIST AI RMF 1.0 | MANAGE core function | no_fine | none (no fine regime) | gspc-continuity |
| OWASP Top 10 for Agentic Applications (2026) | ASI08 Cascading Failures | no_fine | none (no fine regime) | gspc-continuity |

## Verify

Each source card verifies offline with `/signed/verify-card.mjs` (id recomputed, Ed25519 checked under the pinned key). canonical_sha256 = sha256(canonical JSON of this object minus generated_at and canonical_sha256; keys sorted, no whitespace)
