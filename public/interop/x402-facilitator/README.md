# x402 facilitator SR scorecard

Free forever: **counts + methodology**. Attestation never certification. `writes_board=false`. Never invent MEASURED.

**Instrument:** `x402.facilitator.sr` · path `/interop/x402-facilitator/`
**Role:** referee, never the payment layer. Never clone a facilitator.

## Separate instruments

| Leaf | What it is |
|---|---|
| this page | facilitator host SR scorecard (hosts may be named) |
| `/interop/x402-trust/` 74/100 | catalog endpoint trust — DRY 402 challenge shape; **no** seller dump |
| `/interop/x402-challenge/` | own-door HTTP 402 probe |

Do not fuse cards, roots, or counts across these.

## Board cite

Re-GET only: <https://councilof.ai/api/gspc> — live **22 · 22 · 0**. Do not freeze Hub.

## Paper cite (stamp, not our measure)

Wang et al. arXiv:[2607.19545](https://arxiv.org/abs/2607.19545) SR1–SR8 — paper stamp, not a CSOAI measure.

## UNSIGNED PayAI dry

First subject: PayAI `https://facilitator.payai.network`.

Capability discovery endpoints recorded (`/supported` · `/verify` · `/settle` · `/health`). SR outcomes only as on the unsigned card:

- SR1 **PASS** · `tamper-requirements-binding`
- SR2 **PASS** · `tamper-signature`
- SR5 **FAIL** · `zero-amount-reject`
- SR3 / SR4 / SR6 / SR7 / SR8 **UNCHECKABLE**

`sig_ed25519: null`. Settle not called. No new SR results invented here.

## Files

- `index.html` — Pages 200 for the bare folder URL
- `index.json` — machine index
- `card-v0-payai-facilitator-sr.unsigned.json` — UNSIGNED card-v0
- `payai-capability-probe.json` — capability GET probe
