---
license: cc-by-4.0
pretty_name: CSOAI fleet status (public summary)
tags:
- ai-governance
- measurement
- council-of-ai
configs:
- config_name: default
  data_files:
  - split: train
    path: "fleet_status.public.json"
  field: "jobs"
size_categories:
- n<1K
language:
- en
---

<p align="center">
  <img src="https://huggingface.co/datasets/csoai/brand-assets/resolve/main/csoai-banner-1280x256.png" alt="Council of AI (CSOAI)" width="100%">
</p>

# csoai/fleet-status

> **Start here — free verify:** <https://councilof.ai/gspc-verify/> (or the free MCP tool `verify_card` at `https://councilof.ai/mcp`) · **Full catalog:** <https://councilof.ai/catalog.json> · Methodology: <https://councilof.ai/methodology/> · Measurement, not certification.

One file, `fleet_status.public.json`, rewritten after each fleet supervisor pass by
`scripts/pubbus/publish-fleet-status.py` (councilof-ai repository). It is read live, in the
browser, by https://councilof.ai/status.

Per scheduled job: `id`, `state`, `last_ok`. Funding: `GREEN` / `AMBER` / `RED` or `UNMEASURED`.
Withheld by design: hostnames, commands, log lines, error text, balances, spend rates, runway hours.
Times are the supervisor's, not the publisher's. A job never read OK has `last_ok: null`.
Operational state of our own jobs; not a measurement of anyone else, not a service-level promise.

<!-- csoai-cite-v1:start -->
## Objections, contact and corrections

To object to a row, ask for a re-check, request a correction or ask for a record to be withdrawn, email **nicholas@csoai.org** or use the appeals and dispute route at https://councilof.ai/dispute/. Corrections are listed in the corrections ledger at https://councilof.ai/api/corrections, with what changed and when. CSOAI Ltd (company no. 16939677, England and Wales) is the accountable publisher.

## How to cite

CSOAI Ltd (Council of AI). *CSOAI fleet status (public summary)*. 2026. Hugging Face dataset `csoai/fleet-status`. https://huggingface.co/datasets/csoai/fleet-status

```bibtex
@misc{csoai_fleet_status,
  title        = {CSOAI fleet status (public summary)},
  author       = {{CSOAI Ltd}},
  year         = {2026},
  howpublished = {Hugging Face dataset, https://huggingface.co/datasets/csoai/fleet-status},
  note         = {Corrections: https://councilof.ai/api/corrections}
}
```

Licence: CC-BY-4.0. Attribute Council of AI, CSOAI Ltd (16939677), https://councilof.ai.

## Corrections and verification

- Corrections ledger (signed): https://councilof.ai/api/corrections. Corrections to CSOAI's published records are logged there with what changed and when.
- Verify a signed record yourself, free and without an account: https://councilof.ai/gspc-verify/ (step by step: https://councilof.ai/signed/HOW-TO-VERIFY.md).
- Conformance kit for signed-receipts/v1, with test vectors for implementers: https://councilof.ai/spec/signed-receipts/v1/conformance/
<!-- csoai-cite-v1:end -->


## Provenance

TODO: name the producing script/commit and source run ids. Not inferred here.

<!-- DATA-ACCESS:START -->
## Read this product

The default table contains the public job records. Read the original JSON for its publication time and aggregate funding state. Job state is operational reporting, not a model score or availability guarantee.

```python
from datasets import load_dataset
rows = load_dataset("csoai/fleet-status", name="default", split="train")
```

For reproducible reuse, pass the repository commit SHA as `revision` and retain the downloaded bytes. Loading a file does not verify its signature; follow this card's verification instructions before relying on a claim. Dated snapshots remain historical measurements.
<!-- DATA-ACCESS:END -->

<!-- ACCESS-MODEL:START -->
## Access model

**Humans: free.** Browse, verify, and download everything here in your browser — no login, no paywall: [free verify](https://councilof.ai/gspc-verify/) · [full catalogue](https://councilof.ai/catalogue).
**Agents/machines:** every call in this catalogue is priced over [x402](https://www.x402.org) — USDC, pay-per-call, no keys, no subscription. Machine entry: [councilof.ai/mcp](https://councilof.ai/mcp).
Measurement, not certification.
<!-- ACCESS-MODEL:END -->
