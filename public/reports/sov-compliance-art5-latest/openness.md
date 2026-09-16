# sov-compliance-art5:latest × openness — UNMEASURED

Measurement, not certification. This report is derived from signed cards; it is not a grade, rank, conformity mark or legal determination. Measurement, not certification; verification is free.

| field | value |
|---|---|
| axis | `openness` (model-comparison) |
| subject | `sov-compliance-art5:latest` |
| status | **UNMEASURED** |
| reason | source card carries no n: accuracy is a single point on one small bank on one date, and the card does not state a sample size, so nothing here may read MEASURED |
| n | 0 bank items |
| separation | UNTESTED |
| rows | 0 (the source card publishes no per-item rows) |
| as_of | 2026-08-19T09:24:39.163078+00:00 — the newest source card's body.created — when it was measured, never when this file was written |
| root_ref | NOT_YET_ROOTED |
| canonical_sha256 | `060c8e68d50faef3871608fec6c724f48abfe159dfe3b14fe6804494f858bc08` |
| api | `/api/report?subject=sov-compliance-art5-latest&axis=openness` |

## Source cards

| sha256 | corpus axis | created | accuracy | n | card status |
|---|---|---|---|---|---|
| [`8fbf552908b905f6…`](/signed/cards/8fbf552908b905f6ec6fcc1c04e1b30cbcdd8ae5d9434acdd7cfff00b5337509.json) | gspc-openness | 2026-08-19T09:24:39.163078+00:00 | 0.4615 | — | — |

## Obligations (crosswalk pointers — relevant-to, never a determination)

| regulator | obligation | tier | statutory maximum (never asserted owed) | via corpus axis |
|---|---|---|---|---|
| EU AI Act | Article 53 — GPAI provider transparency & documentation | most_obligations_incl_art50_and_gpai | up to €15,000,000 or 3% of worldwide annual turnover, whichever is higher | gspc-openness |
| NIST AI RMF 1.0 | GOVERN core function | no_fine | none (no fine regime) | gspc-openness |
| OWASP Top 10 for Agentic Applications (2026) | ASI04 Agentic Supply Chain Vulnerabilities | no_fine | none (no fine regime) | gspc-openness |

## Verify

Each source card verifies offline with `/signed/verify-card.mjs` (id recomputed, Ed25519 checked under the pinned key). canonical_sha256 = sha256(canonical JSON of this object minus generated_at and canonical_sha256; keys sorted, no whitespace)
