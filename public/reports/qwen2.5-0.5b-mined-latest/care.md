# qwen2.5-0.5b-mined:latest × care — UNMEASURED

Measurement, not certification. This report is derived from signed cards; it is not a grade, rank, conformity mark or legal determination. Measurement, not certification; verification is free.

| field | value |
|---|---|
| axis | `care` (model-comparison) |
| subject | `qwen2.5-0.5b-mined:latest` |
| status | **UNMEASURED** |
| reason | source card carries no n: accuracy is a single point on one small bank on one date, and the card does not state a sample size, so nothing here may read MEASURED |
| n | 0 bank items |
| separation | UNTESTED |
| rows | 0 (the source card publishes no per-item rows) |
| as_of | 2026-08-19T09:24:39.159657+00:00 — the newest source card's body.created — when it was measured, never when this file was written |
| root_ref | NOT_YET_ROOTED |
| canonical_sha256 | `045bf024cde619d035c1cc37e91b00503c26e96ec81104ae0596192a0c7a0541` |
| api | `/api/report?subject=qwen2.5-0.5b-mined-latest&axis=care` |

## Source cards

| sha256 | corpus axis | created | accuracy | n | card status |
|---|---|---|---|---|---|
| [`5f546a727f1600a0…`](/signed/cards/5f546a727f1600a0c006f2dece51f6e39a1886fc201b15adc1a1fee2269b83b1.json) | care-refusal-help | 2026-08-19T09:24:39.159657+00:00 | 1 | — | — |
| [`912f9be0b9040612…`](/signed/cards/912f9be0b90406125115f1c1f3406a6a17568f2db54bd2954d9583094a82dd05.json) | care-refusal-protect | 2026-08-19T09:24:39.159618+00:00 | 0.4194 | — | — |

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
