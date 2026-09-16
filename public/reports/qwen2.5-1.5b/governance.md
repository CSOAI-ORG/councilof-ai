# qwen2.5:1.5b × governance — UNMEASURED

Measurement, not certification. This report is derived from signed cards; it is not a grade, rank, conformity mark or legal determination. Measurement, not certification; verification is free.

| field | value |
|---|---|
| axis | `governance` (model-comparison) |
| subject | `qwen2.5:1.5b` |
| status | **UNMEASURED** |
| reason | source card carries no n: accuracy is a single point on one small bank on one date, and the card does not state a sample size, so nothing here may read MEASURED |
| n | 0 bank items |
| separation | UNTESTED |
| rows | 0 (the source card publishes no per-item rows) |
| as_of | 2026-08-19T09:24:39.160774+00:00 — the newest source card's body.created — when it was measured, never when this file was written |
| root_ref | NOT_YET_ROOTED |
| canonical_sha256 | `a50572b7c1ebde392e9e9b5b7b00b82e8b674209bbf4509dbe698bdc9c5030f3` |
| api | `/api/report?subject=qwen2.5-1.5b&axis=governance` |

## Source cards

| sha256 | corpus axis | created | accuracy | n | card status |
|---|---|---|---|---|---|
| [`76a1d3e23494015d…`](/signed/cards/76a1d3e23494015d61f15e629696b2b75e4887778d289af8677687023a45d9bf.json) | gspc-governance | 2026-08-19T09:24:39.160774+00:00 | 0.2083 | — | — |
| [`4c452e7b745cbb6d…`](/signed/cards/4c452e7b745cbb6df4c4211dedf9dc2d3f7221004a4f6785c4cd223d9adb1107.json) | gov | 2026-08-19T09:24:39.160718+00:00 | 0 | — | — |

## Obligations (crosswalk pointers — relevant-to, never a determination)

| regulator | obligation | tier | statutory maximum (never asserted owed) | via corpus axis |
|---|---|---|---|---|
| EU AI Act | Article 6 — classification of high-risk AI systems (Annex III) | most_obligations_incl_art50_and_gpai | up to €15,000,000 or 3% of worldwide annual turnover, whichever is higher | gov |
| EU AI Act | Article 9 — risk-management system for high-risk AI | most_obligations_incl_art50_and_gpai | up to €15,000,000 or 3% of worldwide annual turnover, whichever is higher | gov |
| NIST AI RMF 1.0 | GOVERN + MAP core functions | no_fine | none (no fine regime) | gov |
| OWASP Top 10 for Agentic Applications (2026) | ASI01 Agent Goal Hijack | no_fine | none (no fine regime) | gspc-governance |

## Verify

Each source card verifies offline with `/signed/verify-card.mjs` (id recomputed, Ed25519 checked under the pinned key). canonical_sha256 = sha256(canonical JSON of this object minus generated_at and canonical_sha256; keys sorted, no whitespace)
