# sov-refusal-v2:latest × conformance — UNMEASURED

Measurement, not certification. This report is derived from signed cards; it is not a grade, rank, conformity mark or legal determination. Measurement, not certification; verification is free.

| field | value |
|---|---|
| axis | `conformance` (model-comparison) |
| subject | `sov-refusal-v2:latest` |
| status | **UNMEASURED** |
| reason | source card carries no n: accuracy is a single point on one small bank on one date, and the card does not state a sample size, so nothing here may read MEASURED |
| n | 0 bank items |
| separation | UNTESTED |
| rows | 0 (the source card publishes no per-item rows) |
| as_of | 2026-08-19T09:24:39.166507+00:00 — the newest source card's body.created — when it was measured, never when this file was written |
| root_ref | NOT_YET_ROOTED |
| canonical_sha256 | `7369cc8c99f410efa40fe19f991576a7a6cd9d86e97a5162285abe9452427ded` |
| api | `/api/report?subject=sov-refusal-v2-latest&axis=conformance` |

## Source cards

| sha256 | corpus axis | created | accuracy | n | card status |
|---|---|---|---|---|---|
| [`2e60794c5664b950…`](/signed/cards/2e60794c5664b950e3b7193883e6079dbed8e80c9da29ceec28cfe25633e2170.json) | gspc-conformance | 2026-08-19T09:24:39.166507+00:00 | 0.2727 | — | — |

## Obligations (crosswalk pointers — relevant-to, never a determination)

| regulator | obligation | tier | statutory maximum (never asserted owed) | via corpus axis |
|---|---|---|---|---|
| EU AI Act | Article 11 + Annex IV — technical documentation | most_obligations_incl_art50_and_gpai | up to €15,000,000 or 3% of worldwide annual turnover, whichever is higher | gspc-conformance |
| EU AI Act | Article 13 — transparency & provision of information to deployers | most_obligations_incl_art50_and_gpai | up to €15,000,000 or 3% of worldwide annual turnover, whichever is higher | gspc-conformance |
| NIST AI RMF 1.0 | MAP core function | no_fine | none (no fine regime) | gspc-conformance |
| OWASP Top 10 for Agentic Applications (2026) | ASI02 Tool Misuse & Exploitation | no_fine | none (no fine regime) | gspc-conformance |

## Verify

Each source card verifies offline with `/signed/verify-card.mjs` (id recomputed, Ed25519 checked under the pinned key). canonical_sha256 = sha256(canonical JSON of this object minus generated_at and canonical_sha256; keys sorted, no whitespace)
