# qwen2.5:0.5b × openness — UNMEASURED

Measurement, not certification. This report is derived from signed cards; it is not a grade, rank, conformity mark or legal determination. Measurement, not certification; verification is free.

| field | value |
|---|---|
| axis | `openness` (model-comparison) |
| subject | `qwen2.5:0.5b` |
| status | **UNMEASURED** |
| reason | source card carries no n: accuracy is a single point on one small bank on one date, and the card does not state a sample size, so nothing here may read MEASURED |
| n | 0 bank items |
| separation | UNTESTED |
| rows | 0 (the source card publishes no per-item rows) |
| as_of | 2026-08-19T09:24:39.159893+00:00 — the newest source card's body.created — when it was measured, never when this file was written |
| root_ref | NOT_YET_ROOTED |
| canonical_sha256 | `d96ab0eb7f7826824125e342ddd3c0e7fde38da743b14aa2cc4b2c0e2c4a57f5` |
| api | `/api/report?subject=qwen2.5-0.5b&axis=openness` |

## Source cards

| sha256 | corpus axis | created | accuracy | n | card status |
|---|---|---|---|---|---|
| [`2aba0727a9b6c79a…`](/signed/cards/2aba0727a9b6c79a4c0bbd19c8edd2a01230e8d7083f6bd389cebe84c6fd2a17.json) | gspc-openness | 2026-08-19T09:24:39.159893+00:00 | 0.5385 | — | — |

## Obligations (crosswalk pointers — relevant-to, never a determination)

| regulator | obligation | tier | statutory maximum (never asserted owed) | via corpus axis |
|---|---|---|---|---|
| EU AI Act | Article 53 — GPAI provider transparency & documentation | most_obligations_incl_art50_and_gpai | up to €15,000,000 or 3% of worldwide annual turnover, whichever is higher | gspc-openness |
| NIST AI RMF 1.0 | GOVERN core function | no_fine | none (no fine regime) | gspc-openness |
| OWASP Top 10 for Agentic Applications (2026) | ASI04 Agentic Supply Chain Vulnerabilities | no_fine | none (no fine regime) | gspc-openness |

## Verify

Each source card verifies offline with `/signed/verify-card.mjs` (id recomputed, Ed25519 checked under the pinned key). canonical_sha256 = sha256(canonical JSON of this object minus generated_at and canonical_sha256; keys sorted, no whitespace)
