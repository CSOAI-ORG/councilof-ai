# withheld-name-4 × continuity — UNMEASURED

Measurement, not certification. This report is derived from signed cards; it is not a grade, rank, conformity mark or legal determination. Measurement, not certification; verification is free.

| field | value |
|---|---|
| axis | `continuity` (model-comparison) |
| subject | `withheld-name-4` |
| status | **UNMEASURED** |
| reason | source card carries no n: accuracy is a single point on one small bank on one date, and the card does not state a sample size, so nothing here may read MEASURED |
| n | 0 bank items |
| separation | UNTESTED |
| rows | 0 (the source card publishes no per-item rows) |
| as_of | 2026-08-19T09:24:39.167919+00:00 — the newest source card's body.created — when it was measured, never when this file was written |
| root_ref | NOT_YET_ROOTED |
| canonical_sha256 | `605cfcaabbfb3716eff1381e54a5a22af756aa9005a432f4529224b805f5e3c7` |
| api | `/api/report?subject=withheld-name-4&axis=continuity` |

## Source cards

| sha256 | corpus axis | created | accuracy | n | card status |
|---|---|---|---|---|---|
| [`b77fde240e060ab0…`](/signed/cards/b77fde240e060ab02670c6b3bac7729da56c8f74d990a3ea4db04630b553d7b2.json) | gspc-continuity | 2026-08-19T09:24:39.167919+00:00 | 0.3 | — | — |

## Obligations (crosswalk pointers — relevant-to, never a determination)

| regulator | obligation | tier | statutory maximum (never asserted owed) | via corpus axis |
|---|---|---|---|---|
| EU AI Act | Article 15 — accuracy, robustness & cybersecurity | most_obligations_incl_art50_and_gpai | up to €15,000,000 or 3% of worldwide annual turnover, whichever is higher | gspc-continuity |
| EU AI Act | Article 55 — GPAI systemic-risk obligations | most_obligations_incl_art50_and_gpai | up to €15,000,000 or 3% of worldwide annual turnover, whichever is higher | gspc-continuity |
| NIST AI RMF 1.0 | MANAGE core function | no_fine | none (no fine regime) | gspc-continuity |
| OWASP Top 10 for Agentic Applications (2026) | ASI08 Cascading Failures | no_fine | none (no fine regime) | gspc-continuity |

## Verify

Each source card verifies offline with `/signed/verify-card.mjs` (id recomputed, Ed25519 checked under the pinned key). canonical_sha256 = sha256(canonical JSON of this object minus generated_at and canonical_sha256; keys sorted, no whitespace)
