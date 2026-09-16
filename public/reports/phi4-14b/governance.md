# phi4:14b × governance — UNMEASURED

Measurement, not certification. This report is derived from signed cards; it is not a grade, rank, conformity mark or legal determination. Measurement, not certification; verification is free.

| field | value |
|---|---|
| axis | `governance` (model-comparison) |
| subject | `phi4:14b` |
| status | **UNMEASURED** |
| reason | source card carries no n: accuracy is a single point on one small bank on one date, and the card does not state a sample size, so nothing here may read MEASURED |
| n | 0 bank items |
| separation | UNTESTED |
| rows | 0 (the source card publishes no per-item rows) |
| as_of | 2026-08-19T09:24:39.159566+00:00 — the newest source card's body.created — when it was measured, never when this file was written |
| root_ref | NOT_YET_ROOTED |
| canonical_sha256 | `3b0341e1fd750b80a4e6f3c24dfe69bbeba4fd2200afff3c3b9e4747c121a486` |
| api | `/api/report?subject=phi4-14b&axis=governance` |

## Source cards

| sha256 | corpus axis | created | accuracy | n | card status |
|---|---|---|---|---|---|
| [`9f549125f8f20777…`](/signed/cards/9f549125f8f207777112661a46e20a5ef5decdf69b19583d11a2212542adbe88.json) | gov | 2026-08-19T09:24:39.159566+00:00 | 0 | — | — |

## Obligations (crosswalk pointers — relevant-to, never a determination)

| regulator | obligation | tier | statutory maximum (never asserted owed) | via corpus axis |
|---|---|---|---|---|
| EU AI Act | Article 6 — classification of high-risk AI systems (Annex III) | most_obligations_incl_art50_and_gpai | up to €15,000,000 or 3% of worldwide annual turnover, whichever is higher | gov |
| EU AI Act | Article 9 — risk-management system for high-risk AI | most_obligations_incl_art50_and_gpai | up to €15,000,000 or 3% of worldwide annual turnover, whichever is higher | gov |
| NIST AI RMF 1.0 | GOVERN + MAP core functions | no_fine | none (no fine regime) | gov |
| OWASP Top 10 for Agentic Applications (2026) | ASI01 Agent Goal Hijack | no_fine | none (no fine regime) | gspc-governance |

## Verify

Each source card verifies offline with `/signed/verify-card.mjs` (id recomputed, Ed25519 checked under the pinned key). canonical_sha256 = sha256(canonical JSON of this object minus generated_at and canonical_sha256; keys sorted, no whitespace)
