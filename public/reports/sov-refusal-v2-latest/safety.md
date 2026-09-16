# sov-refusal-v2:latest × safety — UNMEASURED

Measurement, not certification. This report is derived from signed cards; it is not a grade, rank, conformity mark or legal determination. Measurement, not certification; verification is free.

| field | value |
|---|---|
| axis | `safety` (model-comparison) |
| subject | `sov-refusal-v2:latest` |
| status | **UNMEASURED** |
| reason | source card carries no n: accuracy is a single point on one small bank on one date, and the card does not state a sample size, so nothing here may read MEASURED |
| n | 0 bank items |
| separation | UNTESTED |
| rows | 0 (the source card publishes no per-item rows) |
| as_of | 2026-08-19T09:24:39.166431+00:00 — the newest source card's body.created — when it was measured, never when this file was written |
| root_ref | NOT_YET_ROOTED |
| canonical_sha256 | `e68a07c2fa456adfc313e09442729e8d935bbbaf4e7503f52ecc45e908f4e3ec` |
| api | `/api/report?subject=sov-refusal-v2-latest&axis=safety` |

## Source cards

| sha256 | corpus axis | created | accuracy | n | card status |
|---|---|---|---|---|---|
| [`98899112b5fd3712…`](/signed/cards/98899112b5fd37120883f4e93cfc51a555718d9a62b01126f19cfb2b260e89d5.json) | gspc-safety | 2026-08-19T09:24:39.166431+00:00 | 0.6429 | — | — |

## Obligations (crosswalk pointers — relevant-to, never a determination)

| regulator | obligation | tier | statutory maximum (never asserted owed) | via corpus axis |
|---|---|---|---|---|
| EU AI Act | Article 5 — prohibited manipulative / harmful AI practices | prohibited_practices | up to €35,000,000 or 7% of worldwide annual turnover, whichever is higher | gspc-safety |
| EU AI Act | Annex III high-risk safety obligations (Arts 8–15) | most_obligations_incl_art50_and_gpai | up to €15,000,000 or 3% of worldwide annual turnover, whichever is higher | gspc-safety |
| NIST AI RMF 1.0 | MEASURE + MANAGE core functions | no_fine | none (no fine regime) | gspc-safety |
| OWASP Top 10 for Agentic Applications (2026) | ASI05 Unexpected Code Execution | no_fine | none (no fine regime) | gspc-safety |

## Verify

Each source card verifies offline with `/signed/verify-card.mjs` (id recomputed, Ed25519 checked under the pinned key). canonical_sha256 = sha256(canonical JSON of this object minus generated_at and canonical_sha256; keys sorted, no whitespace)
