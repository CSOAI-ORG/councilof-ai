---
license: cc-by-4.0
language:
- en
pretty_name: GSPC frozen releases — versioned, canary-stamped axis snapshots
tags:
- gspc
- council-of-ai
- ai-governance
- measurement
- benchmark
- frozen-release
size_categories:
- n<1K
configs:
- config_name: axes
  data_files:
  - split: train
    path:
    - gspc-v1.0/axes/art5-safeguard.json
    - gspc-v1.0/axes/interpretability-reproducibility.json
  default: true
- config_name: axis-registry
  data_files:
  - split: train
    path: '*/AXIS_REGISTRY.json'
- config_name: release
  data_files:
  - split: train
    path: '*/RELEASE.json'
- config_name: axes-affect
  data_files:
  - split: train
    path: '*/axes/affect.json'
- config_name: axes-ai-adoption-components
  data_files:
  - split: train
    path: '*/axes/ai-adoption-components.json'
- config_name: axes-care
  data_files:
  - split: train
    path: '*/axes/care.json'
- config_name: axes-claim-maintenance
  data_files:
  - split: train
    path: '*/axes/claim-maintenance.json'
- config_name: axes-company-practice
  data_files:
  - split: train
    path: '*/axes/company-practice.json'
- config_name: axes-conformance
  data_files:
  - split: train
    path: '*/axes/conformance.json'
- config_name: axes-continuity
  data_files:
  - split: train
    path: '*/axes/continuity.json'
- config_name: axes-cross-reality
  data_files:
  - split: train
    path: '*/axes/cross-reality.json'
- config_name: axes-custody-disclosure
  data_files:
  - split: train
    path: '*/axes/custody-disclosure.json'
- config_name: axes-detector-interop
  data_files:
  - split: train
    path: '*/axes/detector-interop.json'
- config_name: axes-distribution-integrity
  data_files:
  - split: train
    path: '*/axes/distribution-integrity.json'
- config_name: axes-effect-binding
  data_files:
  - split: train
    path: '*/axes/effect-binding.json'
- config_name: axes-governance
  data_files:
  - split: train
    path: '*/axes/governance.json'
- config_name: axes-harness-fidelity
  data_files:
  - split: train
    path: '*/axes/harness-fidelity.json'
- config_name: axes-humanoid-deployment
  data_files:
  - split: train
    path: '*/axes/humanoid-deployment.json'
- config_name: axes-humanoid-labour-index
  data_files:
  - split: train
    path: '*/axes/humanoid-labour-index.json'
- config_name: axes-interop-conformance
  data_files:
  - split: train
    path: '*/axes/interop-conformance.json'
- config_name: axes-jail
  data_files:
  - split: train
    path: '*/axes/jail.json'
- config_name: axes-lab-practice
  data_files:
  - split: train
    path: '*/axes/lab-practice.json'
- config_name: axes-labour-components
  data_files:
  - split: train
    path: '*/axes/labour-components.json'
- config_name: axes-machinery-conformity
  data_files:
  - split: train
    path: '*/axes/machinery-conformity.json'
- config_name: axes-measurer-integrity
  data_files:
  - split: train
    path: '*/axes/measurer-integrity.json'
---

<p align="center">
  <img src="https://huggingface.co/datasets/csoai/brand-assets/resolve/main/csoai-banner-1280x256.png" alt="Council of AI (CSOAI)" width="100%">
</p>

# GSPC frozen releases

**`gspc-v1.0` — the first immutable release** of the GSPC axis estate: 34 axis slots
(24 MEASURED · 10 declared-UNMEASURED, published so the gap is visible), frozen from the
live board on 2026-11-02. Roster provenance is the **signed living stamp**
`csoai.gspc-living/0.2` (gold run 2026-08-18, SIGNED, `did:web:csoai.org#board-attestation-1`).

| File | What |
|---|---|
| `gspc-v1.0/RELEASE.json` | Release envelope: freeze + deprecation policy, board counts, roster provenance |
| `gspc-v1.0/AXIS_REGISTRY.json` | Canonical alias table — axis / short / bench name / HF repo hint, per-axis status + canary |
| `gspc-v1.0/axes/*.json` | One frozen definition per axis |
| `gspc-v1.0/SHA256SUMS.txt` | Hash manifest for the whole release |
| `gspc-v1.0/CHANGELOG.md` | What changed and what is carried honestly (swarm, jail, care items; UNVERIFIABLE v0.1 stamp) |

**Policy:** a release is immutable; the live API ([councilof.ai/api/gspc](https://councilof.ai/api/gspc)) is
"latest/unstable" and may move between releases. Bank re-freezes bump the minor version.
Axes are never silently removed — superseded definitions stay published with
`[SUPERSEDED]` markers and a corrections-register entry.

**Verify anything free:** [councilof.ai/gspc-verify](https://councilof.ai/gspc-verify) ·
MCP `verify_card` · board stamp verifies under `did:web:csoai.org#board-attestation-1`.
Every axis file embeds a benchmark canary GUID — keep training corpora clean.

Owner Ed25519 stamp on the release manifest: **PENDING** (tracked owner operation).

Measurement, not certification.

<!-- csoai-card-fixes:start -->

## Subsets (configs)

The Dataset Viewer and `datasets` read this repository through the named subsets below. Each subset contains one homogeneous file group, so files with different schemas are not cast into a single table.

| subset | files | rows (as verified) |
|---|---|---|
| `axes` (default) | `gspc-v1.0/axes/art5-safeguard.json`, `gspc-v1.0/axes/interpretability-reproducibility.json` | 2 |
| `axis-registry` | `*/AXIS_REGISTRY.json` | 1 |
| `release` | `*/RELEASE.json` | 1 |
| `axes-affect` | `*/axes/affect.json` | 1 |
| `axes-ai-adoption-components` | `*/axes/ai-adoption-components.json` | 1 |
| `axes-care` | `*/axes/care.json` | 1 |
| `axes-claim-maintenance` | `*/axes/claim-maintenance.json` | 1 |
| `axes-company-practice` | `*/axes/company-practice.json` | 1 |
| `axes-conformance` | `*/axes/conformance.json` | 1 |
| `axes-continuity` | `*/axes/continuity.json` | 1 |
| `axes-cross-reality` | `*/axes/cross-reality.json` | 1 |
| `axes-custody-disclosure` | `*/axes/custody-disclosure.json` | 1 |
| `axes-detector-interop` | `*/axes/detector-interop.json` | 1 |
| `axes-distribution-integrity` | `*/axes/distribution-integrity.json` | 1 |
| `axes-effect-binding` | `*/axes/effect-binding.json` | 1 |
| `axes-governance` | `*/axes/governance.json` | 1 |
| `axes-harness-fidelity` | `*/axes/harness-fidelity.json` | 1 |
| `axes-humanoid-deployment` | `*/axes/humanoid-deployment.json` | 1 |
| `axes-humanoid-labour-index` | `*/axes/humanoid-labour-index.json` | 1 |
| `axes-interop-conformance` | `*/axes/interop-conformance.json` | 1 |
| `axes-jail` | `*/axes/jail.json` | 1 |
| `axes-lab-practice` | `*/axes/lab-practice.json` | 1 |
| `axes-labour-components` | `*/axes/labour-components.json` | 1 |
| `axes-machinery-conformity` | `*/axes/machinery-conformity.json` | 1 |
| `axes-measurer-integrity` | `*/axes/measurer-integrity.json` | 1 |

```python
from datasets import load_dataset

ds = load_dataset("csoai/gspc-releases", "axes", split="train")
```

## Citation

```bibtex
@misc{csoai_gspc_releases_2026,
  title        = {GSPC frozen releases — versioned, canary-stamped axis snapshots},
  author       = {{CSOAI Ltd (Council of AI)}},
  year         = {2026},
  publisher    = {Hugging Face},
  howpublished = {\url{https://huggingface.co/datasets/csoai/gspc-releases}},
  url          = {https://huggingface.co/datasets/csoai/gspc-releases}
}
```

<!-- csoai-card-fixes:end -->
