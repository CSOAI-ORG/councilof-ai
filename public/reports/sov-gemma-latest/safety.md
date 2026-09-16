# sov-gemma:latest × safety — UNMEASURED

Measurement, not certification. This report is derived from signed cards; it is not a grade, rank, conformity mark or legal determination. Measurement, not certification; verification is free.

| field | value |
|---|---|
| axis | `safety` (model-comparison) |
| subject | `sov-gemma:latest` |
| status | **UNMEASURED** |
| reason | source card carries no n: accuracy is a single point on one small bank on one date, and the card does not state a sample size, so nothing here may read MEASURED |
| n | 0 bank items |
| separation | UNTESTED |
| rows | 0 (the source card publishes no per-item rows) |
| as_of | 2026-08-19T09:24:39.164547+00:00 — the newest source card's body.created — when it was measured, never when this file was written |
| root_ref | NOT_YET_ROOTED |
| canonical_sha256 | `653be82a957b1d08a2cfd1f7e61cbfb13e9fb520fd5214c98cbefbf8be2d4f9a` |
| api | `/api/report?subject=sov-gemma-latest&axis=safety` |

## Source cards

| sha256 | corpus axis | created | accuracy | n | card status |
|---|---|---|---|---|---|
| [`4c8129059f5f3131…`](/signed/cards/4c8129059f5f3131e7d2d74b47ba391e8db6f9344e773b1f306e2c7d6cc1ba6c.json) | gspc-safety | 2026-08-19T09:24:39.164547+00:00 | 0.5 | — | — |

## Obligations (crosswalk pointers — relevant-to, never a determination)

| regulator | obligation | tier | statutory maximum (never asserted owed) | via corpus axis |
|---|---|---|---|---|
| EU AI Act | Article 5 — prohibited manipulative / harmful AI practices | prohibited_practices | up to €35,000,000 or 7% of worldwide annual turnover, whichever is higher | gspc-safety |
| EU AI Act | Annex III high-risk safety obligations (Arts 8–15) | most_obligations_incl_art50_and_gpai | up to €15,000,000 or 3% of worldwide annual turnover, whichever is higher | gspc-safety |
| NIST AI RMF 1.0 | MEASURE + MANAGE core functions | no_fine | none (no fine regime) | gspc-safety |
| OWASP Top 10 for Agentic Applications (2026) | ASI05 Unexpected Code Execution | no_fine | none (no fine regime) | gspc-safety |

## Verify

Each source card verifies offline with `/signed/verify-card.mjs` (id recomputed, Ed25519 checked under the pinned key). canonical_sha256 = sha256(canonical JSON of this object minus generated_at and canonical_sha256; keys sorted, no whitespace)
