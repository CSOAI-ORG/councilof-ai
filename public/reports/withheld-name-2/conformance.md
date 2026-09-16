# withheld-name-2 × conformance — UNMEASURED

Measurement, not certification. This report is derived from signed cards; it is not a grade, rank, conformity mark or legal determination. Measurement, not certification; verification is free.

| field | value |
|---|---|
| axis | `conformance` (model-comparison) |
| subject | `withheld-name-2` |
| status | **UNMEASURED** |
| reason | source card carries no n: accuracy is a single point on one small bank on one date, and the card does not state a sample size, so nothing here may read MEASURED |
| n | 0 bank items |
| separation | UNTESTED |
| rows | 0 (the source card publishes no per-item rows) |
| as_of | 2026-08-19T09:24:39.167080+00:00 — the newest source card's body.created — when it was measured, never when this file was written |
| root_ref | NOT_YET_ROOTED |
| canonical_sha256 | `c5ba823c6dcdb5e02f912abe0b7c9a75a1474e977d58926ed244fe20877d6df9` |
| api | `/api/report?subject=withheld-name-2&axis=conformance` |

## Source cards

| sha256 | corpus axis | created | accuracy | n | card status |
|---|---|---|---|---|---|
| [`a984cfb7eb14b6d8…`](/signed/cards/a984cfb7eb14b6d8851bd9e69be6b86fccbcf9900877e1304dedff8f5a54579c.json) | gspc-conformance | 2026-08-19T09:24:39.167080+00:00 | 0.4545 | — | — |

## Obligations (crosswalk pointers — relevant-to, never a determination)

| regulator | obligation | tier | statutory maximum (never asserted owed) | via corpus axis |
|---|---|---|---|---|
| EU AI Act | Article 11 + Annex IV — technical documentation | most_obligations_incl_art50_and_gpai | up to €15,000,000 or 3% of worldwide annual turnover, whichever is higher | gspc-conformance |
| EU AI Act | Article 13 — transparency & provision of information to deployers | most_obligations_incl_art50_and_gpai | up to €15,000,000 or 3% of worldwide annual turnover, whichever is higher | gspc-conformance |
| NIST AI RMF 1.0 | MAP core function | no_fine | none (no fine regime) | gspc-conformance |
| OWASP Top 10 for Agentic Applications (2026) | ASI02 Tool Misuse & Exploitation | no_fine | none (no fine regime) | gspc-conformance |

## Verify

Each source card verifies offline with `/signed/verify-card.mjs` (id recomputed, Ed25519 checked under the pinned key). canonical_sha256 = sha256(canonical JSON of this object minus generated_at and canonical_sha256; keys sorted, no whitespace)
