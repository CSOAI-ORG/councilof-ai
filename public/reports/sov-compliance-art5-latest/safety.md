# sov-compliance-art5:latest × safety — UNMEASURED

Measurement, not certification. This report is derived from signed cards; it is not a grade, rank, conformity mark or legal determination. Measurement, not certification; verification is free.

| field | value |
|---|---|
| axis | `safety` (model-comparison) |
| subject | `sov-compliance-art5:latest` |
| status | **UNMEASURED** |
| reason | source card carries no n: accuracy is a single point on one small bank on one date, and the card does not state a sample size, so nothing here may read MEASURED |
| n | 0 bank items |
| separation | UNTESTED |
| rows | 0 (the source card publishes no per-item rows) |
| as_of | 2026-08-19T09:24:39.162873+00:00 — the newest source card's body.created — when it was measured, never when this file was written |
| root_ref | NOT_YET_ROOTED |
| canonical_sha256 | `72877180c7b31857953b3f75d60c14d63596fdb85d8e3ee3590dcb83bb549420` |
| api | `/api/report?subject=sov-compliance-art5-latest&axis=safety` |

## Source cards

| sha256 | corpus axis | created | accuracy | n | card status |
|---|---|---|---|---|---|
| [`abb7150f242321eb…`](/signed/cards/abb7150f242321eb9a31b87ecf34d76af4e7227ac620d3673527325709ae1351.json) | gspc-safety | 2026-08-19T09:24:39.162873+00:00 | 0.5 | — | — |

## Obligations (crosswalk pointers — relevant-to, never a determination)

| regulator | obligation | tier | statutory maximum (never asserted owed) | via corpus axis |
|---|---|---|---|---|
| EU AI Act | Article 5 — prohibited manipulative / harmful AI practices | prohibited_practices | up to €35,000,000 or 7% of worldwide annual turnover, whichever is higher | gspc-safety |
| EU AI Act | Annex III high-risk safety obligations (Arts 8–15) | most_obligations_incl_art50_and_gpai | up to €15,000,000 or 3% of worldwide annual turnover, whichever is higher | gspc-safety |
| NIST AI RMF 1.0 | MEASURE + MANAGE core functions | no_fine | none (no fine regime) | gspc-safety |
| OWASP Top 10 for Agentic Applications (2026) | ASI05 Unexpected Code Execution | no_fine | none (no fine regime) | gspc-safety |

## Verify

Each source card verifies offline with `/signed/verify-card.mjs` (id recomputed, Ed25519 checked under the pinned key). canonical_sha256 = sha256(canonical JSON of this object minus generated_at and canonical_sha256; keys sorted, no whitespace)
