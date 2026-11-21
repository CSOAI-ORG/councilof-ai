---
license: cc0-1.0
pretty_name: GSPC axis signals — daily per-axis measurement states (CC0)
tags: [gspc, council-of-ai, signals, daily, measurement, ai-governance]
size_categories:
- n<1K
configs:
- config_name: root-json
  data_files:
  - split: train
    path:
    - 2026-11-04/art5-safeguard.json
    - 2026-11-04/interpretability-reproducibility.json
  default: true
- config_name: affect
  data_files:
  - split: train
    path: '*/affect.json'
- config_name: ai-adoption-components
  data_files:
  - split: train
    path: '*/ai-adoption-components.json'
- config_name: care
  data_files:
  - split: train
    path: '*/care.json'
- config_name: claim-maintenance
  data_files:
  - split: train
    path: '*/claim-maintenance.json'
- config_name: company-practice
  data_files:
  - split: train
    path: '*/company-practice.json'
- config_name: conformance
  data_files:
  - split: train
    path: '*/conformance.json'
- config_name: continuity
  data_files:
  - split: train
    path: '*/continuity.json'
- config_name: cross-reality
  data_files:
  - split: train
    path: '*/cross-reality.json'
- config_name: custody-disclosure
  data_files:
  - split: train
    path: '*/custody-disclosure.json'
- config_name: detector-interop
  data_files:
  - split: train
    path: '*/detector-interop.json'
- config_name: distribution-integrity
  data_files:
  - split: train
    path: '*/distribution-integrity.json'
- config_name: effect-binding
  data_files:
  - split: train
    path: '*/effect-binding.json'
- config_name: governance
  data_files:
  - split: train
    path: '*/governance.json'
- config_name: harness-fidelity
  data_files:
  - split: train
    path: '*/harness-fidelity.json'
- config_name: humanoid-deployment
  data_files:
  - split: train
    path: '*/humanoid-deployment.json'
- config_name: humanoid-labour-index
  data_files:
  - split: train
    path: '*/humanoid-labour-index.json'
- config_name: interop-conformance
  data_files:
  - split: train
    path: '*/interop-conformance.json'
- config_name: jail
  data_files:
  - split: train
    path: '*/jail.json'
- config_name: lab-practice
  data_files:
  - split: train
    path: '*/lab-practice.json'
- config_name: labour-components
  data_files:
  - split: train
    path: '*/labour-components.json'
- config_name: machinery-conformity
  data_files:
  - split: train
    path: '*/machinery-conformity.json'
- config_name: measurer-integrity
  data_files:
  - split: train
    path: '*/measurer-integrity.json'
- config_name: openness
  data_files:
  - split: train
    path: '*/openness.json'
- config_name: provenance-controls
  data_files:
  - split: train
    path: '*/provenance-controls.json'
language:
- en
---
# GSPC axis signals (CC0)

Daily per-axis signal files: `YYYY-MM-DD/<axis>.json` — state (MEASURED/TIE/UNTESTED/PENDING_GO), fleet ranking, Δ vs yesterday, watchdog verdicts, provenance pointers. The drill-down beneath the signed master index.
Board: https://councilof.ai/api/gspc · Verify: https://councilof.ai/gspc-verify

<!-- csoai-card-fixes:start -->

## Subsets (configs)

The Dataset Viewer and `datasets` read this repository through the named subsets below. Each subset contains one homogeneous file group, so files with different schemas are not cast into a single table.

| subset | files | rows (as verified) |
|---|---|---|
| `root-json` (default) | `2026-11-04/art5-safeguard.json`, `2026-11-04/interpretability-reproducibility.json` | 2 |
| `affect` | `*/affect.json` | 1 |
| `ai-adoption-components` | `*/ai-adoption-components.json` | 1 |
| `care` | `*/care.json` | 1 |
| `claim-maintenance` | `*/claim-maintenance.json` | 1 |
| `company-practice` | `*/company-practice.json` | 1 |
| `conformance` | `*/conformance.json` | 1 |
| `continuity` | `*/continuity.json` | 1 |
| `cross-reality` | `*/cross-reality.json` | 1 |
| `custody-disclosure` | `*/custody-disclosure.json` | 1 |
| `detector-interop` | `*/detector-interop.json` | 1 |
| `distribution-integrity` | `*/distribution-integrity.json` | 1 |
| `effect-binding` | `*/effect-binding.json` | 1 |
| `governance` | `*/governance.json` | 1 |
| `harness-fidelity` | `*/harness-fidelity.json` | 1 |
| `humanoid-deployment` | `*/humanoid-deployment.json` | 1 |
| `humanoid-labour-index` | `*/humanoid-labour-index.json` | 1 |
| `interop-conformance` | `*/interop-conformance.json` | 1 |
| `jail` | `*/jail.json` | 1 |
| `lab-practice` | `*/lab-practice.json` | 1 |
| `labour-components` | `*/labour-components.json` | 1 |
| `machinery-conformity` | `*/machinery-conformity.json` | 1 |
| `measurer-integrity` | `*/measurer-integrity.json` | 1 |
| `openness` | `*/openness.json` | 1 |
| `provenance-controls` | `*/provenance-controls.json` | 1 |

```python
from datasets import load_dataset

ds = load_dataset("csoai/gspc-axis-signals", "root-json", split="train")
```

## Limitations

**Measurement is not certification.** Values in this repository are measurements recorded by Council of AI (CSOAI Ltd) under the method, instrument version and observation date stated in each file. They are not a certification, audit opinion, conformity assessment or legal determination (including under the EU AI Act). Results depend on the instrument version, the sampled items and the date, and a re-measurement can change them. Repository updates and download counts are not new measurements.

## Citation

```bibtex
@misc{csoai_gspc_axis_signals_2026,
  title        = {GSPC axis signals — daily per-axis measurement states (CC0)},
  author       = {{CSOAI Ltd (Council of AI)}},
  year         = {2026},
  publisher    = {Hugging Face},
  howpublished = {\url{https://huggingface.co/datasets/csoai/gspc-axis-signals}},
  url          = {https://huggingface.co/datasets/csoai/gspc-axis-signals}
}
```

<!-- csoai-card-fixes:end -->
