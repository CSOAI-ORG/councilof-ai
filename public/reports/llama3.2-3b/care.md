# llama3.2:3b × care — UNMEASURED

Measurement, not certification. This report is derived from signed cards; it is not a grade, rank, conformity mark or legal determination. Measurement, not certification; verification is free.

| field | value |
|---|---|
| axis | `care` (model-comparison) |
| subject | `llama3.2:3b` |
| status | **UNMEASURED** |
| reason | source card carries no n: accuracy is a single point on one small bank on one date, and the card does not state a sample size, so nothing here may read MEASURED |
| n | 0 bank items |
| separation | UNTESTED |
| rows | 0 (the source card publishes no per-item rows) |
| as_of | 2026-08-19T09:24:39.158664+00:00 — the newest source card's body.created — when it was measured, never when this file was written |
| root_ref | NOT_YET_ROOTED |
| canonical_sha256 | `04dce25711f30822155ed3a469e478bece6558d29c3813cc014ca7f8281a3734` |
| api | `/api/report?subject=llama3.2-3b&axis=care` |

## Source cards

| sha256 | corpus axis | created | accuracy | n | card status |
|---|---|---|---|---|---|
| [`b754300b65bdf3b1…`](/signed/cards/b754300b65bdf3b17a208bf05a0c3c66a3692f5e9a23f3f80febfcb2535a7ebc.json) | care-refusal-help | 2026-08-19T09:24:39.158664+00:00 | 0.9286 | — | — |
| [`24c34bec128e434b…`](/signed/cards/24c34bec128e434bdd45ad5dea033da5d656cbf956c6a6b54caf3e8b774794b8.json) | care-refusal-protect | 2026-08-19T09:24:39.158598+00:00 | 0.3226 | — | — |
| [`a0dc1db7ba9c75e5…`](/signed/cards/a0dc1db7ba9c75e52253f4c9c62f7adf1fa71d6fcc5aa511ae17a6eff799faf8.json) | care | 2026-08-19T09:24:39.158085+00:00 | 0 | — | — |

## Obligations (crosswalk pointers — relevant-to, never a determination)

| regulator | obligation | tier | statutory maximum (never asserted owed) | via corpus axis |
|---|---|---|---|---|
| EU AI Act | Article 5(1)(b) — exploitation of vulnerabilities of persons | prohibited_practices | up to €35,000,000 or 7% of worldwide annual turnover, whichever is higher | care |
| NIST AI RMF 1.0 | MEASURE core function (harmful outputs) | no_fine | none (no fine regime) | care |
| OWASP Top 10 for Agentic Applications (2026) | ASI09 Human-Agent Trust Exploitation | no_fine | none (no fine regime) | care |
| NIST AI RMF 1.0 | MEASURE core function (validity & reliability) | no_fine | none (no fine regime) | care-refusal-help |
| NIST AI RMF 1.0 | MEASURE + MANAGE core functions | no_fine | none (no fine regime) | care-refusal-protect |

## Verify

Each source card verifies offline with `/signed/verify-card.mjs` (id recomputed, Ed25519 checked under the pinned key). canonical_sha256 = sha256(canonical JSON of this object minus generated_at and canonical_sha256; keys sorted, no whitespace)
