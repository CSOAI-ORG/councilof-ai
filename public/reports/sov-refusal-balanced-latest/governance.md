# sov-refusal-balanced:latest × governance — UNMEASURED

Measurement, not certification. This report is derived from signed cards; it is not a grade, rank, conformity mark or legal determination. Measurement, not certification; verification is free.

| field | value |
|---|---|
| axis | `governance` (model-comparison) |
| subject | `sov-refusal-balanced:latest` |
| status | **UNMEASURED** |
| reason | source card carries no n: accuracy is a single point on one small bank on one date, and the card does not state a sample size, so nothing here may read MEASURED |
| n | 0 bank items |
| separation | UNTESTED |
| rows | 0 (the source card publishes no per-item rows) |
| as_of | 2026-08-19T09:24:39.165496+00:00 — the newest source card's body.created — when it was measured, never when this file was written |
| root_ref | NOT_YET_ROOTED |
| canonical_sha256 | `88f13136bf6e13c2f60e995a83bfa0fad9e67441c8cc51ddf748e74c2dc7ced6` |
| api | `/api/report?subject=sov-refusal-balanced-latest&axis=governance` |

## Source cards

| sha256 | corpus axis | created | accuracy | n | card status |
|---|---|---|---|---|---|
| [`a270b32c79c67ebe…`](/signed/cards/a270b32c79c67ebe778ca2eb83726bdd51d8e3aa0bf5ac42b56cc3b3bd36f794.json) | gspc-governance | 2026-08-19T09:24:39.165496+00:00 | 0.1667 | — | — |

## Obligations (crosswalk pointers — relevant-to, never a determination)

| regulator | obligation | tier | statutory maximum (never asserted owed) | via corpus axis |
|---|---|---|---|---|
| EU AI Act | Article 6 — classification of high-risk AI systems (Annex III) | most_obligations_incl_art50_and_gpai | up to €15,000,000 or 3% of worldwide annual turnover, whichever is higher | gov |
| EU AI Act | Article 9 — risk-management system for high-risk AI | most_obligations_incl_art50_and_gpai | up to €15,000,000 or 3% of worldwide annual turnover, whichever is higher | gov |
| NIST AI RMF 1.0 | GOVERN + MAP core functions | no_fine | none (no fine regime) | gov |
| OWASP Top 10 for Agentic Applications (2026) | ASI01 Agent Goal Hijack | no_fine | none (no fine regime) | gspc-governance |

## Verify

Each source card verifies offline with `/signed/verify-card.mjs` (id recomputed, Ed25519 checked under the pinned key). canonical_sha256 = sha256(canonical JSON of this object minus generated_at and canonical_sha256; keys sorted, no whitespace)
