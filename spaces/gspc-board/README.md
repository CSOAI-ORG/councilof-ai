---
title: CSOAI-GSPC
emoji: 📐
colorFrom: green
colorTo: gray
sdk: static
pinned: true
license: cc-by-4.0
short_description: "Council of AI (CSOAI Ltd) — 23-axis GSPC measurement board, signed 3KB cards, and third-party Hub & Kaggle model cohorts."
tags:
  - council-of-ai
  - gspc
  - ai-governance
  - ai-safety
  - evaluation
  - ed25519
  - provenance
  - arc-agi
---

# CS**O**AI-GSPC — Global Safety, Provenance & Continuity Board

[![GSPC](https://councilof.ai/api/badge)](https://councilof.ai/gspc-verify)
[![Verify Free](https://img.shields.io/badge/Verify%203KB%20Card-Free%20%C2%B7%20Ed25519-16a34a)](https://councilof.ai/gspc-verify)
[![Merkle Root](https://img.shields.io/badge/Transparency%20Root-root.json-04624a)](https://councilof.ai/root.json)

Search a model. Open an axis. Verify the cryptographic evidence. **CSOAI-GSPC** (published by **Council of AI — CSOAI Ltd**, UK Companies House `#16939677`) prints distinct, non-pooled measurement populations from live canonical endpoints:

| Population / Instrument | Authority Endpoint | Scope & Separation Rule |
|---|---|---|
| **1. Canonical 23-Axis GSPC Board** | [`GET https://councilof.ai/api/gspc`](https://councilof.ai/api/gspc) | 14 model-comparison axes + 9 deterministic-facts axes across Governance, Safety, Provenance, Continuity, and Markets. Own models (`sov-*`, `clan-*`) are excluded from the public leader column. |
| **2. Hugging Face Hub Signed Cells** | [`GET https://councilof.ai/api/hub-cards`](https://councilof.ai/api/hub-cards) | Third-party Hub models with Ed25519-signed measurement cards (`csoai/gspc-hub-cards`). It is not the Council fleet and never alters the board leader column. |
| **3. Third-Party Measured Registry** | [`GET https://councilof.ai/interop/models-measured.json`](https://councilof.ai/interop/models-measured.json) | Complete union of third-party models with $\ge 1$ Ed25519-signed card in `signed/card_index.json` or `interop/mill-cards-signed`. |
| **4. Rating the Raters & ARC-AGI Paired Arm** | [`https://councilof.ai/rating-the-raters/001-arc-agi-2.json`](https://councilof.ai/rating-the-raters/001-arc-agi-2.json) | Rule-matched human vs. machine `pass@2` audit (`RTR-001`) and offline-reproducible ARC-AGI-2 / ARC-AGI-3 evaluation harness. |

---

## Architectural & Evidentiary Rules

1. **Live Authority, Never Frozen Markdown**: Printer of live [`GET https://councilof.ai/api/gspc`](https://councilof.ai/api/gspc) and [`GET https://councilof.ai/api/hub-cards`](https://councilof.ai/api/hub-cards). The first is the canonical Council board; read its current axis count from that live response. The second is the published third-party Hub population; it never changes the board. Do not freeze their counts in this README. Fetch failure → **UNCHECKABLE**. Not a mill. Measurement, not certification.
2. **Census vs. Measured Boundary (`3,032,028` Discovered Listings)**: A repository listing is a census, not a grade. Hub listings `3,032,028` are **DISCOVERED**, not **MEASURED** (`https://councilof.ai/signed/hub-census-baseline.json`, `sha256_jsonl: 0a510a890fa336f099a516a503df86340a529c90b935f026d291e5dcd8e8f1e9`). Remainder UNMEASURED. Queue: <https://huggingface.co/datasets/csoai/hub-queue> (MEASURED/UNMEASURED counts live only in its `SUMMARY.json` and are never typed here). Fleet lock: <https://councilof.ai/fleet/FLEET-B.lock.json> (`n_locked=40` UNMEASURED).
3. **Unsigned Staging vs. Signed Cards**: Cards staged under `csoai/gspc-hub-cards/staged-unsigned/<date>/<axis>/` carry `"signature": null` and remain **UNSIGNED** until an Ed25519 signature under `did:web:csoai.org` verifies **VALID**. An item count $n < 30$ is unquotable; a statistical **TIE** is never reported as a win.

---

## Independent Verification (Free, No Account Required)

```bash
pip install "csoai-gspc[verify]"
csoai-gspc check
csoai-gspc verify <card_id>
```

- **Live Board Authority**: <https://councilof.ai/api/gspc>
- **Published Hugging Face Measured Cells**: <https://councilof.ai/api/hub-cards>
- **Third-Party Models Measured Registry**: <https://councilof.ai/models-measured/>
- **Per-Model Lookup Space (Every Axis Verbatim)**: <https://huggingface.co/spaces/csoai/gspc-lookup>
- **Verify Any Card (Free)**: <https://councilof.ai/gspc-verify>
- **How to Verify by Hand**: <https://councilof.ai/signed/HOW-TO-VERIFY.md>
- **Signed Merkle Root**: <https://councilof.ai/root.json>
- **DID Key Registry (`did:web:csoai.org`)**: <https://csoai.org/.well-known/did.json>
- **x402 Trust & Settlement Index**: <https://councilof.ai/interop/x402-trust/latest.json>
- **Hub Census Summary**: <https://councilof.ai/interop/hf-census/SUMMARY.json>
- **Census Digest Record**: <https://councilof.ai/census-digest-leftover.json>

Source lives in `councilof-ai` under `spaces/gspc-board/`.

Verify is free. A rank is never sold. Measurement, not certification.
