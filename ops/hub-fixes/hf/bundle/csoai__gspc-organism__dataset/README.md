---
license: cc-by-4.0
pretty_name: GSPC Evidence Organism
language:
- en
tags:
- gspc
- ai-governance
- agent-security
- mcp
- evidence
- claim-maintenance
- provenance
- opentimestamps
- rekor
- council-of-ai
configs:
- config_name: default
  data_files:
  - split: train
    path: "organism/index.json"
  field: "integration_targets"
size_categories:
- n<1K
---

<p align="center">
  <img src="https://huggingface.co/datasets/csoai/brand-assets/resolve/main/csoai-banner-1280x256.png" alt="Council of AI (CSOAI)" width="100%">
</p>

# GSPC Evidence Organism

> **Start here — free verify:** <https://councilof.ai/gspc-verify/> (or the free MCP tool `verify_card` at `https://councilof.ai/mcp`) · **Full catalog:** <https://councilof.ai/catalog.json> · Methodology: <https://councilof.ai/methodology/> · Measurement, not certification.

Public proof bundle joining the Council of AI GSPC measurement board, signed evidence, corrections, claim maintenance, integrity anchors and interoperability renderings.

## What is here
- `organism/index.json` — machine-readable map of the GSPC organism and five compatibility/integration targets.
- `safe-evidence-pack/` — frozen SAFE evidence re-verification pack: 10 evidence records, 10 evidence events, OCSF / OpenTelemetry / SARIF / in-toto / ECS-HEC renderings, SHA-256 manifest, Ed25519 signature, Rekor receipt and OpenTimestamps state.

## Verify
`python3 safe-evidence-pack/verify.py --offline`

The frozen pack currently records its OpenTimestamps state exactly as observed; a pending calendar commitment is not described as Bitcoin confirmation. Rekor state is recorded separately.

## Boundary
Measurement, not certification. Compatibility bridges are not endorsements and do not assert that Cisco, NVIDIA, CrowdStrike, Palantir, Red Hat, the Linux Foundation, or any external platform has deployed or accepted this work. External acceptance is an external event and remains unmeasured until observed.

Text/data are CC BY 4.0. Code files retain their Apache-2.0 notices and licence terms.


## Citation

```bibtex
@misc{csoai_gspc_organism,
  title  = {csoai/gspc-organism},
  author = {{CSOAI Ltd}},
  year   = {2026},
  howpublished = {\url{https://huggingface.co/datasets/csoai/gspc-organism}},
  note   = {Measurement, not certification. Licence: cc-by-4.0}
}
```


## Provenance

TODO: name the producing script/commit and source run ids. Not inferred here.

<!-- DATA-ACCESS:START -->
## Read this product

The default table lists integration targets. Targets and local proofs do not establish completed external deployment or human acceptance.

```python
from datasets import load_dataset
rows = load_dataset("csoai/gspc-organism", name="default", split="train")
```

For reproducible reuse, pass the repository commit SHA as `revision` and retain the downloaded bytes. Loading a file does not verify its signature; follow this card's verification instructions before relying on a claim. Dated snapshots remain historical measurements.
<!-- DATA-ACCESS:END -->
