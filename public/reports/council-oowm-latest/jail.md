# council-oowm:latest × jail — UNMEASURED

Measurement, not certification. This report is derived from signed cards; it is not a grade, rank, conformity mark or legal determination. Measurement, not certification; verification is free.

| field | value |
|---|---|
| axis | `jail` (model-comparison) |
| subject | `council-oowm:latest` |
| status | **UNMEASURED** |
| reason | source card carries no n: accuracy is a single point on one small bank on one date, and the card does not state a sample size, so nothing here may read MEASURED |
| n | 0 bank items |
| separation | UNTESTED |
| rows | 0 (the source card publishes no per-item rows) |
| as_of | 2026-08-19T09:24:39.156203+00:00 — the newest source card's body.created — when it was measured, never when this file was written |
| root_ref | NOT_YET_ROOTED |
| canonical_sha256 | `d14c5653a36554f11f15a9434e4386ee3005dbb2d206b639ec46e5fc36f6d89c` |
| api | `/api/report?subject=council-oowm-latest&axis=jail` |

## Source cards

| sha256 | corpus axis | created | accuracy | n | card status |
|---|---|---|---|---|---|
| [`acec0ee7b86c1385…`](/signed/cards/acec0ee7b86c1385e0455660ea1f2f23bfccc904a1b68308263a5e2eb982fa57.json) | jail-escape-detection | 2026-08-19T09:24:39.156203+00:00 | 0.4648 | — | — |

## Obligations (crosswalk pointers — relevant-to, never a determination)

| regulator | obligation | tier | statutory maximum (never asserted owed) | via corpus axis |
|---|---|---|---|---|
| EU AI Act | Article 15 — robustness & cybersecurity against manipulation | most_obligations_incl_art50_and_gpai | up to €15,000,000 or 3% of worldwide annual turnover, whichever is higher | jail-escape-detection |
| EU AI Act | Article 5 — circumvention of prohibited-practice safeguards | prohibited_practices | up to €35,000,000 or 7% of worldwide annual turnover, whichever is higher | jail-escape-detection |
| NIST AI RMF 1.0 | MANAGE core function (incident & abuse) | no_fine | none (no fine regime) | jail-escape-detection |
| OWASP Top 10 for Agentic Applications (2026) | ASI05 Unexpected Code Execution + ASI10 Rogue Agents | no_fine | none (no fine regime) | jail-escape-detection |

## Verify

Each source card verifies offline with `/signed/verify-card.mjs` (id recomputed, Ed25519 checked under the pinned key). canonical_sha256 = sha256(canonical JSON of this object minus generated_at and canonical_sha256; keys sorted, no whitespace)
