---
license: cc0-1.0
tags: [gspc, council-of-ai, master-index, daily-signal, ed25519, measurement, ai-governance]
pretty_name: GSPC Master Index — the one-glance signed daily signal (CC0)
size_categories:
- n<1K
configs:
- config_name: root-json
  data_files:
  - split: train
    path:
    - 2026-11-04.json
    - 2026-11-05.json
    - 2026-11-06.json
    - 2026-11-07.json
    - 2026-11-08.json
    - 2026-11-09.json
    - 2026-11-10.json
    - 2026-11-11.json
    - 2026-11-12.json
    - 2026-11-13.json
    - 2026-11-14.json
    - 2026-11-15.json
    - 2026-11-16.json
  default: true
- config_name: master-index
  data_files:
  - split: train
    path: master-index.json
language:
- en
---
# GSPC Master Index — the one-glance signed daily signal (CC0)

ONE Ed25519-signed daily state across all 34 axes + ecosystem surfaces + the Global Regulation Atlas. Schema 0.2 separates the latest public observation from the canonical snapshot and reports both freshness states. States only — never summed, never a score. `human_lane` reads PRACTICE-only until the first identity-verified human attempt. Verify: the signature covers the canonical JSON (sort_keys, compact separators) under the published public key (`signature.public_key_hex`); every underlying number is re-fetchable from its source with its own as_of. Sources: https://councilof.ai/api/gspc · https://councilof.ai/gspc-verify · datasets csoai/gspc-pulse + csoai/gspc-grid (CC0).

<!-- csoai-card-fixes:start -->

## Subsets (configs)

The Dataset Viewer and `datasets` read this repository through the named subsets below. Each subset contains one homogeneous file group, so files with different schemas are not cast into a single table.

| subset | files | rows (as verified) |
|---|---|---|
| `root-json` (default) | `2026-11-04.json`, `2026-11-05.json`, `2026-11-06.json` … (+10) | 13 |
| `master-index` | `master-index.json` | 1 |

```python
from datasets import load_dataset

ds = load_dataset("csoai/gspc-master-index", "root-json", split="train")
```

## Limitations

**Measurement is not certification.** Values in this repository are measurements recorded by Council of AI (CSOAI Ltd) under the method, instrument version and observation date stated in each file. They are not a certification, audit opinion, conformity assessment or legal determination (including under the EU AI Act). Results depend on the instrument version, the sampled items and the date, and a re-measurement can change them. Repository updates and download counts are not new measurements.

## Citation

```bibtex
@misc{csoai_gspc_master_index_2026,
  title        = {GSPC Master Index — the one-glance signed daily signal (CC0)},
  author       = {{CSOAI Ltd (Council of AI)}},
  year         = {2026},
  publisher    = {Hugging Face},
  howpublished = {\url{https://huggingface.co/datasets/csoai/gspc-master-index}},
  url          = {https://huggingface.co/datasets/csoai/gspc-master-index}
}
```

<!-- csoai-card-fixes:end -->
