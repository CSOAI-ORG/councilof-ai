# sov-draw-cybersecurity:latest × care — UNMEASURED

Measurement, not certification. This report is derived from signed cards; it is not a grade, rank, conformity mark or legal determination. Measurement, not certification; verification is free.

| field | value |
|---|---|
| axis | `care` (model-comparison) |
| subject | `sov-draw-cybersecurity:latest` |
| status | **UNMEASURED** |
| reason | source card carries no n: accuracy is a single point on one small bank on one date, and the card does not state a sample size, so nothing here may read MEASURED |
| n | 0 bank items |
| separation | UNTESTED |
| rows | 0 (the source card publishes no per-item rows) |
| as_of | 2026-08-19T09:24:39.164126+00:00 — the newest source card's body.created — when it was measured, never when this file was written |
| root_ref | NOT_YET_ROOTED |
| canonical_sha256 | `c951c83380fbe95008cc4f868f6f54fef20dfdf29cf64ad8684bfa7feaa9f151` |
| api | `/api/report?subject=sov-draw-cybersecurity-latest&axis=care` |

## Source cards

| sha256 | corpus axis | created | accuracy | n | card status |
|---|---|---|---|---|---|
| [`2b8c2d18a0862d11…`](/signed/cards/2b8c2d18a0862d11861054954166d1ff6f164cbd9e1b5b3bb8162a3b7baa3590.json) | care-refusal-help | 2026-08-19T09:24:39.164126+00:00 | 1 | — | — |
| [`4a7e0b4a83f6dd2a…`](/signed/cards/4a7e0b4a83f6dd2a7b3946bacc34be2d4a1639fa17d0fe452b2edf44d7eb4cef.json) | care-refusal-protect | 2026-08-19T09:24:39.164081+00:00 | 0.1935 | — | — |

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
