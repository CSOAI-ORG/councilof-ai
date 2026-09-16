# qwen2.5:0.5b × provenance — UNMEASURED

Measurement, not certification. This report is derived from signed cards; it is not a grade, rank, conformity mark or legal determination. Measurement, not certification; verification is free.

| field | value |
|---|---|
| axis | `provenance` (model-comparison) |
| subject | `qwen2.5:0.5b` |
| status | **UNMEASURED** |
| reason | source card carries no n: accuracy is a single point on one small bank on one date, and the card does not state a sample size, so nothing here may read MEASURED |
| n | 0 bank items |
| separation | UNTESTED |
| rows | 0 (the source card publishes no per-item rows) |
| as_of | 2026-08-19T09:24:39.159812+00:00 — the newest source card's body.created — when it was measured, never when this file was written |
| root_ref | NOT_YET_ROOTED |
| canonical_sha256 | `838517c2101314bf873a4bff504a914cd4361a2c47bc380c50495efd8882ec50` |
| api | `/api/report?subject=qwen2.5-0.5b&axis=provenance` |

## Source cards

| sha256 | corpus axis | created | accuracy | n | card status |
|---|---|---|---|---|---|
| [`612d1f5ba92962e4…`](/signed/cards/612d1f5ba92962e414c76271c0a271e9d2eb5d69204360ae62cee7f4792d1404.json) | gspc-provenance | 2026-08-19T09:24:39.159812+00:00 | 0.5333 | — | — |

## Obligations (crosswalk pointers — relevant-to, never a determination)

| regulator | obligation | tier | statutory maximum (never asserted owed) | via corpus axis |
|---|---|---|---|---|
| EU AI Act | Article 50 — transparency & marking of AI-generated content | most_obligations_incl_art50_and_gpai | up to €15,000,000 or 3% of worldwide annual turnover, whichever is higher | gspc-provenance |
| NIST AI RMF 1.0 | MAP core function (context & provenance) | no_fine | none (no fine regime) | gspc-provenance |
| OWASP Top 10 for Agentic Applications (2026) | ASI04 Agentic Supply Chain Vulnerabilities | no_fine | none (no fine regime) | gspc-provenance |

## Verify

Each source card verifies offline with `/signed/verify-card.mjs` (id recomputed, Ed25519 checked under the pinned key). canonical_sha256 = sha256(canonical JSON of this object minus generated_at and canonical_sha256; keys sorted, no whitespace)
