# withheld-name-3 × care — UNMEASURED

Measurement, not certification. This report is derived from signed cards; it is not a grade, rank, conformity mark or legal determination. Measurement, not certification; verification is free.

| field | value |
|---|---|
| axis | `care` (model-comparison) |
| subject | `withheld-name-3` |
| status | **UNMEASURED** |
| reason | source card carries no n: accuracy is a single point on one small bank on one date, and the card does not state a sample size, so nothing here may read MEASURED |
| n | 0 bank items |
| separation | UNTESTED |
| rows | 0 (the source card publishes no per-item rows) |
| as_of | 2026-08-19T09:24:39.167557+00:00 — the newest source card's body.created — when it was measured, never when this file was written |
| root_ref | NOT_YET_ROOTED |
| canonical_sha256 | `04febce430f503959be98ef248f3d55f0eae3d3a85eb038cdfaed047976d9938` |
| api | `/api/report?subject=withheld-name-3&axis=care` |

## Source cards

| sha256 | corpus axis | created | accuracy | n | card status |
|---|---|---|---|---|---|
| [`7365312ab58b6d2b…`](/signed/cards/7365312ab58b6d2b0427c3cb823527ae0eaf72a4afcc1c81018466261e722cf0.json) | care-refusal-help | 2026-08-19T09:24:39.167557+00:00 | 0.8571 | — | — |
| [`3f5a4f97b0fbec90…`](/signed/cards/3f5a4f97b0fbec903d3f2d826e0fdb25fc57308db8533cd0c378b3d9b94e2f2e.json) | care-refusal-protect | 2026-08-19T09:24:39.167509+00:00 | 0.6129 | — | — |

## Obligations (crosswalk pointers — relevant-to, never a determination)

| regulator | obligation | tier | statutory maximum (never asserted owed) | via corpus axis |
|---|---|---|---|---|
| EU AI Act | Article 5(1)(b) — exploitation of vulnerabilities of persons | prohibited_practices | up to €35,000,000 or 7% of worldwide annual turnover, whichever is higher | care |
| NIST AI RMF 1.0 | MEASURE core function (harmful outputs) | no_fine | none (no fine regime) | care |
| OWASP Top 10 for Agentic Applications (2026) | ASI09 Human-Agent Trust Exploitation | no_fine | none (no fine regime) | care |
| NIST AI RMF 1.0 | MEASURE core function (validity & reliability) | no_fine | none (no fine regime) | care-refusal-help |
| NIST AI RMF 1.0 | MEASURE + MANAGE core functions | no_fine | none (no fine regime) | care-refusal-protect |

## Verify

Each source card verifies offline with `/signed/verify-card.mjs` (id recomputed, Ed25519 checked under the pinned key). canonical_sha256 = sha256(canonical JSON of this object minus generated_at and canonical_sha256; keys sorted, no whitespace)
