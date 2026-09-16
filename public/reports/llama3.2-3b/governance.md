# llama3.2:3b × governance — UNMEASURED

Measurement, not certification. This report is derived from signed cards; it is not a grade, rank, conformity mark or legal determination. Measurement, not certification; verification is free.

| field | value |
|---|---|
| axis | `governance` (model-comparison) |
| subject | `llama3.2:3b` |
| status | **UNMEASURED** |
| reason | source card carries no n: accuracy is a single point on one small bank on one date, and the card does not state a sample size, so nothing here may read MEASURED |
| n | 0 bank items |
| separation | UNTESTED |
| rows | 0 (the source card publishes no per-item rows) |
| as_of | 2026-08-19T09:24:39.158203+00:00 — the newest source card's body.created — when it was measured, never when this file was written |
| root_ref | NOT_YET_ROOTED |
| canonical_sha256 | `81c1225dc8f35ee3355875f1527c20fff7e4fd1e089bdb407cbd56a7dd81dff7` |
| api | `/api/report?subject=llama3.2-3b&axis=governance` |

## Source cards

| sha256 | corpus axis | created | accuracy | n | card status |
|---|---|---|---|---|---|
| [`94b8831311c24df5…`](/signed/cards/94b8831311c24df5e7d93e1f1dc989d24639bbe64abc4034a51d78a0306508e1.json) | gspc-governance | 2026-08-19T09:24:39.158203+00:00 | 0.3684 | — | — |
| [`da966a91cb7e1e17…`](/signed/cards/da966a91cb7e1e17eb0ce004801eab7f70d68f9b789c45b2acc528c9ee5654e6.json) | gov | 2026-08-19T09:24:39.158144+00:00 | 0 | — | — |

## Obligations (crosswalk pointers — relevant-to, never a determination)

| regulator | obligation | tier | statutory maximum (never asserted owed) | via corpus axis |
|---|---|---|---|---|
| EU AI Act | Article 6 — classification of high-risk AI systems (Annex III) | most_obligations_incl_art50_and_gpai | up to €15,000,000 or 3% of worldwide annual turnover, whichever is higher | gov |
| EU AI Act | Article 9 — risk-management system for high-risk AI | most_obligations_incl_art50_and_gpai | up to €15,000,000 or 3% of worldwide annual turnover, whichever is higher | gov |
| NIST AI RMF 1.0 | GOVERN + MAP core functions | no_fine | none (no fine regime) | gov |
| OWASP Top 10 for Agentic Applications (2026) | ASI01 Agent Goal Hijack | no_fine | none (no fine regime) | gspc-governance |

## Verify

Each source card verifies offline with `/signed/verify-card.mjs` (id recomputed, Ed25519 checked under the pinned key). canonical_sha256 = sha256(canonical JSON of this object minus generated_at and canonical_sha256; keys sorted, no whitespace)
