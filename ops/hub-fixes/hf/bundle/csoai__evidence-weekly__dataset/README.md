---
license: cc-by-4.0
language:
- en
pretty_name: Council of AI - Weekly Evidence Digests
task_categories:
- other
tags:
- ai-governance
- measurement
- ed25519
- signed-evidence
- gspc
- council-of-ai
size_categories:
- n<1K
---

# Council of AI - Weekly Evidence Digests

Signed, machine-generated weekly digests of the estate's public adoption and board state.
Produced by a local signed pipeline; every number is machine-collected from public endpoints.

## What each file contains

- `evidence-week-YYYY-WNN.md` - the human-readable digest: adoption (Hugging Face org `csoai`, npm),
  live board state (axes measured, separated), corrections-ledger size, and aggregate operations.
- `evidence-week-YYYY-WNN.json` - the same data machine-readable, with the producing pipeline's
  Ed25519 public-key fingerprint and ledger tail hash for verification.

## Sources (all public, read-only)

- Hugging Face org API (`huggingface.co/api/datasets?author=csoai`)
- npm downloads API, PyPI JSON API, GitHub API (`CSOAI-ORG`)
- The live board: `GET https://councilof.ai/api/gspc` and `GET https://councilof.ai/api/corrections`

Free verification forever: every board score is an Ed25519-signed measurement card;
verify offline under the published key. Measurement, not certification.

## Related

- Live board: https://councilof.ai/api/gspc
- Methodology: https://councilof.ai/methodology/
- Per-item rows: `csoai/gspc-peritem-rows-2026-08-12`

<!-- csoai-card-fixes:start -->

## Citation

```bibtex
@misc{csoai_evidence_weekly_2026,
  title        = {Council of AI - Weekly Evidence Digests},
  author       = {{CSOAI Ltd (Council of AI)}},
  year         = {2026},
  publisher    = {Hugging Face},
  howpublished = {\url{https://huggingface.co/datasets/csoai/evidence-weekly}},
  url          = {https://huggingface.co/datasets/csoai/evidence-weekly}
}
```

<!-- csoai-card-fixes:end -->
