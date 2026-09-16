# qwen2.5:0.5b × care — UNMEASURED

Measurement, not certification. This report is derived from signed cards; it is not a grade, rank, conformity mark or legal determination. Measurement, not certification; verification is free.

| field | value |
|---|---|
| axis | `care` (model-comparison) |
| subject | `qwen2.5:0.5b` |
| status | **UNMEASURED** |
| reason | source card carries no n: accuracy is a single point on one small bank on one date, and the card does not state a sample size, so nothing here may read MEASURED |
| n | 0 bank items |
| separation | UNTESTED |
| rows | 0 (the source card publishes no per-item rows) |
| as_of | 2026-08-19T09:24:39.160009+00:00 — the newest source card's body.created — when it was measured, never when this file was written |
| root_ref | NOT_YET_ROOTED |
| canonical_sha256 | `758376e4d396c0800fc906718c3eee5c6d38e440c053e4c2f9b40c614dfb7197` |
| api | `/api/report?subject=qwen2.5-0.5b&axis=care` |

## Source cards

| sha256 | corpus axis | created | accuracy | n | card status |
|---|---|---|---|---|---|
| [`17f99dc0542bae53…`](/signed/cards/17f99dc0542bae532c084ff939505b11122b243e8d4a80afecce6c616d0f6a2a.json) | care-refusal-help | 2026-08-19T09:24:39.160009+00:00 | 0.9286 | — | — |
| [`df55ff377d74691b…`](/signed/cards/df55ff377d74691b6d37a3d6283d26af2696dc50f108e4de575d80962a390693.json) | care-refusal-protect | 2026-08-19T09:24:39.159971+00:00 | 0.4516 | — | — |

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
