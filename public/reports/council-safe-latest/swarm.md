# council-safe:latest × swarm — UNMEASURED

Measurement, not certification. This report is derived from signed cards; it is not a grade, rank, conformity mark or legal determination. Measurement, not certification; verification is free.

| field | value |
|---|---|
| axis | `swarm` (model-comparison) |
| subject | `council-safe:latest` |
| status | **UNMEASURED** |
| reason | source card carries no n: accuracy is a single point on one small bank on one date, and the card does not state a sample size, so nothing here may read MEASURED |
| n | 0 bank items |
| separation | UNTESTED |
| rows | 0 (the source card publishes no per-item rows) |
| as_of | 2026-08-19T09:24:39.156345+00:00 — the newest source card's body.created — when it was measured, never when this file was written |
| root_ref | NOT_YET_ROOTED |
| canonical_sha256 | `fbf99efd234bac1603fa79ce611b02b2d7d9cdf0a870f7aaf166e04ab59b1fbf` |
| api | `/api/report?subject=council-safe-latest&axis=swarm` |

## Source cards

| sha256 | corpus axis | created | accuracy | n | card status |
|---|---|---|---|---|---|
| [`4eb8ffdb407800ec…`](/signed/cards/4eb8ffdb407800ec5ff64bfdd8c5e3359ae06c2381190edb52bd543ab8c540c9.json) | swarm-candidates | 2026-08-19T09:24:39.156345+00:00 | 0 | — | — |

## Obligations (crosswalk pointers — relevant-to, never a determination)

| regulator | obligation | tier | statutory maximum (never asserted owed) | via corpus axis |
|---|---|---|---|---|
| EU AI Act | Article 14 — human oversight | most_obligations_incl_art50_and_gpai | up to €15,000,000 or 3% of worldwide annual turnover, whichever is higher | swarm-candidates |
| NIST AI RMF 1.0 | GOVERN + MAP core functions | no_fine | none (no fine regime) | swarm-candidates |
| OWASP Top 10 for Agentic Applications (2026) | ASI07 Insecure Inter-Agent Communication + ASI08 Cascading Failures | no_fine | none (no fine regime) | swarm-candidates |

## Verify

Each source card verifies offline with `/signed/verify-card.mjs` (id recomputed, Ed25519 checked under the pinned key). canonical_sha256 = sha256(canonical JSON of this object minus generated_at and canonical_sha256; keys sorted, no whitespace)
