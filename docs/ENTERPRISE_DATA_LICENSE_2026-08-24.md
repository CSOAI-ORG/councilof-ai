# Enterprise Data License — the signed GSPC measurement corpus

**One-pager · Council of AI (CSOAI Ltd, UK Companies House 16939677) · 2026-08-24**
**Pricing appears ONLY on the legal surface.** This document carries no price — it points to
`/legal/licensing` for the license tiers. Nobody-ranked-pays: the buyer licenses **data**, and
is never the ranked party.

---

## What you license

A **signed, reproducible, per-domain measurement corpus** — the raw material for AI governance,
model selection, and compliance evidence:

- **10,226 longitudinal records** across 16 governance-measurement axes (frozen probes re-run
  across model generations → the drift/consistency signal nobody else has).
- **Per-axis Elo leaderboard** (17 axes, every score carries n + 95% CI) — domain-resolved;
  a customer in finance sees finance-domain measurement, not a crowd average.
- **Content-addressed + Ed25519-signed** (content_id + did:web:csoai.org key) — the buyer can
  independently verify provenance: recompute the canonical body, check the signature, no trust
  in us required. **Verify path ships with every file.**

## Why this is different (the honest wedge)

| OpenRouter | LMArena | **CSOAI (this corpus)** |
|---|---|---|
| Routes inference | Ranks by crowd preference | **Attests measurement** |
| Rank = usage | Rank = human vote (style-biased) | **Per-domain, n + CI, signed** |
| No public verify | No public verify | **Public verify path** |

Your team can cite, audit, and publish from data that provably came from where it says it came.

## What is in scope (doctrine lines)

- **Measurement data only.** Never a certification; never a ranking of vendors.
- Every score carries **n + CI**; a thin-n axis is reported honest ("not sufficient to rank").
- **Corrections are appended, never edited** (the public ledger shows our own errors).
- Free access for researchers/journalists/fact-checkers is permanent and unconditional.

## Tiers (see `/legal/licensing` for the authoritative terms + pricing)

| Tier | Audience | What it covers |
|---|---|---|
| Open access | Public | Signed sample + verify tooling — the provenance demo |
| Research | Academics / independent researchers | Verified ranking access + longitudinal axis signal |
| Enterprise | AI teams / model providers | The signed corpus license (drift/consistency over generations) |
| Regulator / Auditor | Regulators & auditors | Signed attestation evidence package + verify path |

## The ask

**Book a measurement walkthrough** — we show the signed corpus, the verify path, and how a
per-domain pack fits your compliance/model-selection workflow. `https://councilof.ai/contact`.
The dataset manifest to inspect today: `https://councilof.ai/datasets/gspc-axis-v0.1.0/dataset.json`
(verify it yourself with `verify_dataset.py`, shipped alongside).
