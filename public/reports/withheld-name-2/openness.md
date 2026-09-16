# withheld-name-2 × openness — UNMEASURED

Measurement, not certification. This report is derived from signed cards; it is not a grade, rank, conformity mark or legal determination. Measurement, not certification; verification is free.

| field | value |
|---|---|
| axis | `openness` (model-comparison) |
| subject | `withheld-name-2` |
| status | **UNMEASURED** |
| reason | source card carries no n: accuracy is a single point on one small bank on one date, and the card does not state a sample size, so nothing here may read MEASURED |
| n | 0 bank items |
| separation | UNTESTED |
| rows | 0 (the source card publishes no per-item rows) |
| as_of | 2026-08-19T09:24:39.167118+00:00 — the newest source card's body.created — when it was measured, never when this file was written |
| root_ref | NOT_YET_ROOTED |
| canonical_sha256 | `79a02a7651a36c8410910dafad1e9781a09c9aed690157167e0dcd7d0461e09e` |
| api | `/api/report?subject=withheld-name-2&axis=openness` |

## Source cards

| sha256 | corpus axis | created | accuracy | n | card status |
|---|---|---|---|---|---|
| [`ecab28b1d2d1d3d8…`](/signed/cards/ecab28b1d2d1d3d82192270906b9d8f45afc753612cddcf7757ed7b25414234b.json) | gspc-openness | 2026-08-19T09:24:39.167118+00:00 | 0.6154 | — | — |

## Obligations (crosswalk pointers — relevant-to, never a determination)

| regulator | obligation | tier | statutory maximum (never asserted owed) | via corpus axis |
|---|---|---|---|---|
| EU AI Act | Article 53 — GPAI provider transparency & documentation | most_obligations_incl_art50_and_gpai | up to €15,000,000 or 3% of worldwide annual turnover, whichever is higher | gspc-openness |
| NIST AI RMF 1.0 | GOVERN core function | no_fine | none (no fine regime) | gspc-openness |
| OWASP Top 10 for Agentic Applications (2026) | ASI04 Agentic Supply Chain Vulnerabilities | no_fine | none (no fine regime) | gspc-openness |

## Verify

Each source card verifies offline with `/signed/verify-card.mjs` (id recomputed, Ed25519 checked under the pinned key). canonical_sha256 = sha256(canonical JSON of this object minus generated_at and canonical_sha256; keys sorted, no whitespace)
