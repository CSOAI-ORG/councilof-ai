# withheld-name-3 × provenance — UNMEASURED

Measurement, not certification. This report is derived from signed cards; it is not a grade, rank, conformity mark or legal determination. Measurement, not certification; verification is free.

| field | value |
|---|---|
| axis | `provenance` (model-comparison) |
| subject | `withheld-name-3` |
| status | **UNMEASURED** |
| reason | source card carries no n: accuracy is a single point on one small bank on one date, and the card does not state a sample size, so nothing here may read MEASURED |
| n | 0 bank items |
| separation | UNTESTED |
| rows | 0 (the source card publishes no per-item rows) |
| as_of | 2026-08-19T09:24:39.167363+00:00 — the newest source card's body.created — when it was measured, never when this file was written |
| root_ref | NOT_YET_ROOTED |
| canonical_sha256 | `b154c98a6637de6ac4ae7c709612d4ea1dd256a3a3074a1a70260fcab17211c3` |
| api | `/api/report?subject=withheld-name-3&axis=provenance` |

## Source cards

| sha256 | corpus axis | created | accuracy | n | card status |
|---|---|---|---|---|---|
| [`6171fc15c50ad03a…`](/signed/cards/6171fc15c50ad03aef84309ffe505ba38d43f7f56232af48796d184bbfc5566c.json) | gspc-provenance | 2026-08-19T09:24:39.167363+00:00 | 0.5333 | — | — |

## Obligations (crosswalk pointers — relevant-to, never a determination)

| regulator | obligation | tier | statutory maximum (never asserted owed) | via corpus axis |
|---|---|---|---|---|
| EU AI Act | Article 50 — transparency & marking of AI-generated content | most_obligations_incl_art50_and_gpai | up to €15,000,000 or 3% of worldwide annual turnover, whichever is higher | gspc-provenance |
| NIST AI RMF 1.0 | MAP core function (context & provenance) | no_fine | none (no fine regime) | gspc-provenance |
| OWASP Top 10 for Agentic Applications (2026) | ASI04 Agentic Supply Chain Vulnerabilities | no_fine | none (no fine regime) | gspc-provenance |

## Verify

Each source card verifies offline with `/signed/verify-card.mjs` (id recomputed, Ed25519 checked under the pinned key). canonical_sha256 = sha256(canonical JSON of this object minus generated_at and canonical_sha256; keys sorted, no whitespace)
