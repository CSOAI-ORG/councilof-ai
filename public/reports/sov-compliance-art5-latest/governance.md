# sov-compliance-art5:latest × governance — UNMEASURED

Measurement, not certification. This report is derived from signed cards; it is not a grade, rank, conformity mark or legal determination. Measurement, not certification; verification is free.

| field | value |
|---|---|
| axis | `governance` (model-comparison) |
| subject | `sov-compliance-art5:latest` |
| status | **UNMEASURED** |
| reason | source card carries no n: accuracy is a single point on one small bank on one date, and the card does not state a sample size, so nothing here may read MEASURED |
| n | 0 bank items |
| separation | UNTESTED |
| rows | 0 (the source card publishes no per-item rows) |
| as_of | 2026-08-19T09:24:39.162796+00:00 — the newest source card's body.created — when it was measured, never when this file was written |
| root_ref | NOT_YET_ROOTED |
| canonical_sha256 | `e17957cf0543feb09362311547838fce958252d3350fc85f0e2a2fff6e06ce99` |
| api | `/api/report?subject=sov-compliance-art5-latest&axis=governance` |

## Source cards

| sha256 | corpus axis | created | accuracy | n | card status |
|---|---|---|---|---|---|
| [`8412ad023f82a9bb…`](/signed/cards/8412ad023f82a9bb9fb429cddfe68513a124f7d0632887594819fc987e195e35.json) | gspc-governance | 2026-08-19T09:24:39.162796+00:00 | 0.0417 | — | — |

## Obligations (crosswalk pointers — relevant-to, never a determination)

| regulator | obligation | tier | statutory maximum (never asserted owed) | via corpus axis |
|---|---|---|---|---|
| EU AI Act | Article 6 — classification of high-risk AI systems (Annex III) | most_obligations_incl_art50_and_gpai | up to €15,000,000 or 3% of worldwide annual turnover, whichever is higher | gov |
| EU AI Act | Article 9 — risk-management system for high-risk AI | most_obligations_incl_art50_and_gpai | up to €15,000,000 or 3% of worldwide annual turnover, whichever is higher | gov |
| NIST AI RMF 1.0 | GOVERN + MAP core functions | no_fine | none (no fine regime) | gov |
| OWASP Top 10 for Agentic Applications (2026) | ASI01 Agent Goal Hijack | no_fine | none (no fine regime) | gspc-governance |

## Verify

Each source card verifies offline with `/signed/verify-card.mjs` (id recomputed, Ed25519 checked under the pinned key). canonical_sha256 = sha256(canonical JSON of this object minus generated_at and canonical_sha256; keys sorted, no whitespace)
