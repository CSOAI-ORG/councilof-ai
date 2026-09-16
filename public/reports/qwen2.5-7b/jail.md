# qwen2.5:7b × jail — UNMEASURED

Measurement, not certification. This report is derived from signed cards; it is not a grade, rank, conformity mark or legal determination. Measurement, not certification; verification is free.

| field | value |
|---|---|
| axis | `jail` (model-comparison) |
| subject | `qwen2.5:7b` |
| status | **UNMEASURED** |
| reason | source card carries no n: accuracy is a single point on one small bank on one date, and the card does not state a sample size, so nothing here may read MEASURED |
| n | 0 bank items |
| separation | UNTESTED |
| rows | 0 (the source card publishes no per-item rows) |
| as_of | 2026-08-19T09:24:39.162120+00:00 — the newest source card's body.created — when it was measured, never when this file was written |
| root_ref | NOT_YET_ROOTED |
| canonical_sha256 | `a0cd92c574666fa3eebdd1a6afae049e718e19097d1e0cede8047edaf1a2e6b7` |
| api | `/api/report?subject=qwen2.5-7b&axis=jail` |

## Source cards

| sha256 | corpus axis | created | accuracy | n | card status |
|---|---|---|---|---|---|
| [`3cc7a3caa1a9cb2f…`](/signed/cards/3cc7a3caa1a9cb2f04efe93d8ab966ed8ab648309743d0466dbf60ceb709aa23.json) | jail-escape-detection | 2026-08-19T09:24:39.162120+00:00 | 0.5493 | — | — |

## Obligations (crosswalk pointers — relevant-to, never a determination)

| regulator | obligation | tier | statutory maximum (never asserted owed) | via corpus axis |
|---|---|---|---|---|
| EU AI Act | Article 15 — robustness & cybersecurity against manipulation | most_obligations_incl_art50_and_gpai | up to €15,000,000 or 3% of worldwide annual turnover, whichever is higher | jail-escape-detection |
| EU AI Act | Article 5 — circumvention of prohibited-practice safeguards | prohibited_practices | up to €35,000,000 or 7% of worldwide annual turnover, whichever is higher | jail-escape-detection |
| NIST AI RMF 1.0 | MANAGE core function (incident & abuse) | no_fine | none (no fine regime) | jail-escape-detection |
| OWASP Top 10 for Agentic Applications (2026) | ASI05 Unexpected Code Execution + ASI10 Rogue Agents | no_fine | none (no fine regime) | jail-escape-detection |

## Verify

Each source card verifies offline with `/signed/verify-card.mjs` (id recomputed, Ed25519 checked under the pinned key). canonical_sha256 = sha256(canonical JSON of this object minus generated_at and canonical_sha256; keys sorted, no whitespace)
