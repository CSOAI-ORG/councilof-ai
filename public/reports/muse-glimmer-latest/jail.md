# muse-glimmer:latest × jail — UNMEASURED

Measurement, not certification. This report is derived from signed cards; it is not a grade, rank, conformity mark or legal determination. Measurement, not certification; verification is free.

| field | value |
|---|---|
| axis | `jail` (model-comparison) |
| subject | `muse-glimmer:latest` |
| status | **UNMEASURED** |
| reason | source card carries no n: accuracy is a single point on one small bank on one date, and the card does not state a sample size, so nothing here may read MEASURED |
| n | 0 bank items |
| separation | UNTESTED |
| rows | 0 (the source card publishes no per-item rows) |
| as_of | 2026-08-19T09:24:39.159220+00:00 — the newest source card's body.created — when it was measured, never when this file was written |
| root_ref | NOT_YET_ROOTED |
| canonical_sha256 | `d520c478e89e23ab2384c62ee29d87f05b4e71fe56f53159b7b5d93572a8613c` |
| api | `/api/report?subject=muse-glimmer-latest&axis=jail` |

## Source cards

| sha256 | corpus axis | created | accuracy | n | card status |
|---|---|---|---|---|---|
| [`4297a8b47e3c4a9b…`](/signed/cards/4297a8b47e3c4a9b4644a2d90dadc7bc36ed92d3380e9c0c68eb95bd7af4890c.json) | jail-escape-detection | 2026-08-19T09:24:39.159220+00:00 | 0.4648 | — | — |

## Obligations (crosswalk pointers — relevant-to, never a determination)

| regulator | obligation | tier | statutory maximum (never asserted owed) | via corpus axis |
|---|---|---|---|---|
| EU AI Act | Article 15 — robustness & cybersecurity against manipulation | most_obligations_incl_art50_and_gpai | up to €15,000,000 or 3% of worldwide annual turnover, whichever is higher | jail-escape-detection |
| EU AI Act | Article 5 — circumvention of prohibited-practice safeguards | prohibited_practices | up to €35,000,000 or 7% of worldwide annual turnover, whichever is higher | jail-escape-detection |
| NIST AI RMF 1.0 | MANAGE core function (incident & abuse) | no_fine | none (no fine regime) | jail-escape-detection |
| OWASP Top 10 for Agentic Applications (2026) | ASI05 Unexpected Code Execution + ASI10 Rogue Agents | no_fine | none (no fine regime) | jail-escape-detection |

## Verify

Each source card verifies offline with `/signed/verify-card.mjs` (id recomputed, Ed25519 checked under the pinned key). canonical_sha256 = sha256(canonical JSON of this object minus generated_at and canonical_sha256; keys sorted, no whitespace)
