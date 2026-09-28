---
license: cc-by-4.0
pretty_name: CSOAI fleet status (public summary)
---
# csoai/fleet-status

One file, `fleet_status.public.json`, rewritten after each fleet supervisor pass by
`scripts/pubbus/publish-fleet-status.py` (councilof-ai repository). It is read live, in the
browser, by https://councilof.ai/status.

Per scheduled job: `id`, `state`, `last_ok`. Funding: `GREEN` / `AMBER` / `RED` or `UNMEASURED`.
Withheld by design: hostnames, commands, log lines, error text, balances, spend rates, runway hours.
Times are the supervisor's, not the publisher's. A job never read OK has `last_ok: null`.
Operational state of our own jobs; not a measurement of anyone else, not a service-level promise.

<!-- csoai-cite-v1:start -->
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
