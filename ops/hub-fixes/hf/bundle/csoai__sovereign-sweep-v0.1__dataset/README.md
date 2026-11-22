---
license: cc-by-4.0
language: [en]
pretty_name: Sovereign Sweep v0.1 — meok-gspc-qwen3-1.7b vs base (lane run)
tags: [gspc, council-of-ai, sovereign, measurement, lane-run]
size_categories: [n<1K]
configs:
- config_name: summary
  data_files:
  - split: train
    path: SUMMARY.json
  default: true
- config_name: sweep-rows
  data_files:
  - split: train
    path: sweep_rows.json
---

<p align="center">
  <img src="https://huggingface.co/datasets/csoai/brand-assets/resolve/main/csoai-banner-1280x256.png" alt="Council of AI (CSOAI)" width="100%">
</p>

# Sovereign Sweep v0.1 — **lane run**

First measurement of the sovereign fine-tune **`meok-gspc-qwen3-1.7b:latest`** against its base **`qwen3:1.7b`**
across 6 GSPC banks, run on the M2 via Ollama (temperature 0, deterministic
label-match grading), frozen 2026-11-02.

| Bank | Sovereign | Base | Δ |
|---|---|---|---|
| `gspc-art5` | 0.75 | 0.75 | 0.0 |
| `gspc-asi` | 0.303 | 0.303 | 0.0 |
| `gspc-det` | 0.7879 | 0.7879 | 0.0 |
| `gspc-mcp` | 0.6286 | 0.6286 | 0.0 |
| `gspc-oss` | 0.6875 | 0.6875 | 0.0 |
| `gspc-prv` | 0.625 | 0.625 | 0.0 |

## What this is NOT
- **Not canonical board data** — grading here is zero-shot label match, not the board_v2 grader;
  numbers are not comparable with the published board.
- **Not signed yet** — owner Ed25519 stamp PENDING.
- Not a certification.

## What it IS
The first entry in the Sovereign Loop: measure → delta → adapt → re-measure. The fine-tune exists;
now it has numbers. Next iterations change the model or the data and produce new sweeps — the delta
column is the improvement signal.

Files: `SUMMARY.json` (per-bank accuracy + Δ) · `sweep_rows.json` (every item: prompt, expected, answer, latency).

Measurement, not certification. Free verify: https://councilof.ai/gspc-verify

<!-- csoai-card-fixes:start -->

## Subsets (configs)

The Dataset Viewer and `datasets` read this repository through the named subsets below. Each subset contains one homogeneous file group, so files with different schemas are not cast into a single table.

| subset | files | rows (as verified) |
|---|---|---|
| `summary` (default) | `SUMMARY.json` | 1 |
| `sweep-rows` | `sweep_rows.json` | 1 |

```python
from datasets import load_dataset

ds = load_dataset("csoai/sovereign-sweep-v0.1", "summary", split="train")
```

## Citation

```bibtex
@misc{csoai_sovereign_sweep_v0_1_2026,
  title        = {Sovereign Sweep v0.1 — meok-gspc-qwen3-1.7b vs base (lane run)},
  author       = {{CSOAI Ltd (Council of AI)}},
  year         = {2026},
  publisher    = {Hugging Face},
  howpublished = {\url{https://huggingface.co/datasets/csoai/sovereign-sweep-v0.1}},
  url          = {https://huggingface.co/datasets/csoai/sovereign-sweep-v0.1}
}
```

<!-- csoai-card-fixes:end -->
