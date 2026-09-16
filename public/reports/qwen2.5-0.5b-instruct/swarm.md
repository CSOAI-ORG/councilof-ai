# qwen2.5:0.5b-instruct × swarm — UNMEASURED

Measurement, not certification. This report is derived from signed cards; it is not a grade, rank, conformity mark or legal determination. Measurement, not certification; verification is free.

| field | value |
|---|---|
| axis | `swarm` (model-comparison) |
| subject | `qwen2.5:0.5b-instruct` |
| status | **UNMEASURED** |
| reason | source card carries no n: accuracy is a single point on one small bank on one date, and the card does not state a sample size, so nothing here may read MEASURED |
| n | 0 bank items |
| separation | UNTESTED |
| rows | 0 (the source card publishes no per-item rows) |
| as_of | 2026-08-19T09:24:39.160276+00:00 — the newest source card's body.created — when it was measured, never when this file was written |
| root_ref | NOT_YET_ROOTED |
| canonical_sha256 | `f390ee5f95d677418e869a20904ec1b335909b4a198779ec80dd9e314997bb8d` |
| api | `/api/report?subject=qwen2.5-0.5b-instruct&axis=swarm` |

## Source cards

| sha256 | corpus axis | created | accuracy | n | card status |
|---|---|---|---|---|---|
| [`eb9c45816edd670b…`](/signed/cards/eb9c45816edd670bc3aafeff001f983b1d503ccd0cec432ba19b3bbe936ace36.json) | swarm-candidates | 2026-08-19T09:24:39.160276+00:00 | 0.148 | — | — |

## Obligations (crosswalk pointers — relevant-to, never a determination)

| regulator | obligation | tier | statutory maximum (never asserted owed) | via corpus axis |
|---|---|---|---|---|
| EU AI Act | Article 14 — human oversight | most_obligations_incl_art50_and_gpai | up to €15,000,000 or 3% of worldwide annual turnover, whichever is higher | swarm-candidates |
| NIST AI RMF 1.0 | GOVERN + MAP core functions | no_fine | none (no fine regime) | swarm-candidates |
| OWASP Top 10 for Agentic Applications (2026) | ASI07 Insecure Inter-Agent Communication + ASI08 Cascading Failures | no_fine | none (no fine regime) | swarm-candidates |

## Verify

Each source card verifies offline with `/signed/verify-card.mjs` (id recomputed, Ed25519 checked under the pinned key). canonical_sha256 = sha256(canonical JSON of this object minus generated_at and canonical_sha256; keys sorted, no whitespace)
