---
license: cc-by-4.0
language:
- en
pretty_name: Council OS — the pointer registry for the CSOAI measurement estate
tags:
- gspc
- council-of-ai
- measurement
- attestation
- signed-evidence
size_categories:
- n<1K
configs:
- config_name: pointers
  data_files:
  - split: train
    path: pointers.jsonl
  default: true
- config_name: manifest
  data_files:
  - split: train
    path: manifest.jsonl
- config_name: root-json
  data_files:
  - split: train
    path: axis-regulation-map-v0.1.json
- config_name: root-json-v2
  data_files:
  - split: train
    path: global-regulation-map-v0.1.json
- config_name: root-json-v3
  data_files:
  - split: train
    path: independence-labels-v0.1.json
- config_name: root-json-v4
  data_files:
  - split: train
    path: measurement-inception-schema-v0.1.json
- config_name: root-json-v5
  data_files:
  - split: train
    path: variation-matrix-v0.1.json
- config_name: root-json-v6
  data_files:
  - split: train
    path: x402-pricing-manifest-v0.1.json
---

<p align="center">
  <img src="https://huggingface.co/datasets/csoai/brand-assets/resolve/main/csoai-banner-1280x256.png" alt="Council of AI (CSOAI)" width="100%">
</p>

# Council OS — the index of the estate

**25 pointers** to every live surface of the CSOAI measurement estate, rebuilt 2026-11-02T05:30:00Z.

## Authority order (when surfaces disagree)
1. **`https://councilof.ai/root.json`** — the signed public evidence root (428 cards, merkle `4e57607854bea401…`, as_of 2026-11-01). **This is the master index.**
2. `https://councilof.ai/api/gspc` — the live board (34 slots · 24 measured · 10 declared-UNMEASURED).
3. `https://councilof.ai/signed/card_index.json` — **STALE** (335 rows, packaged 2026-08-28). Do not use for coverage checks until repackaged.
4. `https://councilof.ai/api/cards` — the store (336 signed incl. cross-border card).

## Known index gaps (tracked, published, not hidden)
- `card_index.json` is ~2 months behind `root.json` — repackaging is an owner-signed operation.
- `councilof-ai-evidence` mirrors cards + inclusion proofs but carries no top-level index file — verify coverage against root.json.
- Superseded living-stamp v0.1 is UNVERIFIABLE (58,184 attempts, 0 verified) — documented as correction C-2026-0826-08; the v0.2 stamp verifies under `did:web:csoai.org#board-attestation-1`.

Measurement, not certification. Free verification: https://councilof.ai/gspc-verify

<!-- csoai-card-fixes:start -->

## Subsets (configs)

The Dataset Viewer and `datasets` read this repository through the named subsets below. Each subset contains one homogeneous file group, so files with different schemas are not cast into a single table.

| subset | files | rows (as verified) |
|---|---|---|
| `pointers` (default) | `pointers.jsonl` | 34 |
| `manifest` | `manifest.jsonl` | 2 |
| `root-json` | `axis-regulation-map-v0.1.json` | 1 |
| `root-json-v2` | `global-regulation-map-v0.1.json` | 1 |
| `root-json-v3` | `independence-labels-v0.1.json` | 1 |
| `root-json-v4` | `measurement-inception-schema-v0.1.json` | 1 |
| `root-json-v5` | `variation-matrix-v0.1.json` | 1 |
| `root-json-v6` | `x402-pricing-manifest-v0.1.json` | 1 |

```python
from datasets import load_dataset

ds = load_dataset("csoai/council-os", "pointers", split="train")
```

## Citation

```bibtex
@misc{csoai_council_os_2026,
  title        = {Council OS — the pointer registry for the CSOAI measurement estate},
  author       = {{CSOAI Ltd (Council of AI)}},
  year         = {2026},
  publisher    = {Hugging Face},
  howpublished = {\url{https://huggingface.co/datasets/csoai/council-os}},
  url          = {https://huggingface.co/datasets/csoai/council-os}
}
```

<!-- csoai-card-fixes:end -->
