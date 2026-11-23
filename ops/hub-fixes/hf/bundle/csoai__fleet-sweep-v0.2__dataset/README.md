---
license: cc-by-4.0
language: [en]
pretty_name: Fleet sweep v0.2 — six sovereign models on six GSPC banks (lane run)
tags: [gspc, council-of-ai, sovereign, fleet, lane-run]
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

# Fleet sweep v0.2 — the local quorum, measured

Six models from the M2 Ollama mesh × six GSPC banks, zero-shot label-match grading,
temperature 0, frozen 2026-11-02. Runs nightly at 03:23 UTC
(`com.csoai.gspc-nightly-sweep`) — this is the board-unfreeze fabric on local hardware.

Models include the **sovereign fine-tune** `meok-gspc-qwen3-1.7b` (whose v0.1 vs-base null is
[sovereign-sweep-v0.1](https://huggingface.co/datasets/csoai/sovereign-sweep-v0.1)), its 16k-context
sibling, base qwen3 0.6b/1.7b, deepseek-r1:1.5b and qwen2.5-coder:1.5b.

## Results
| Bank | Model | Acc | n |
|---|---|---|---|
| `gspc-art5` | deepseek-r1:1.5b | 0.0556 | 36 |
| `gspc-art5` | gspc-qwen3-1.7b-16k:latest | 0.75 | 36 |
| `gspc-art5` | meok-gspc-qwen3-1.7b:latest | 0.75 | 36 |
| `gspc-art5` | qwen2.5-coder:1.5b | 0.4722 | 36 |
| `gspc-art5` | qwen3:0.6b | 0.5833 | 36 |
| `gspc-art5` | qwen3:1.7b | 0.75 | 36 |
| `gspc-asi` | deepseek-r1:1.5b | 0.3939 | 33 |
| `gspc-asi` | gspc-qwen3-1.7b-16k:latest | 0.303 | 33 |
| `gspc-asi` | meok-gspc-qwen3-1.7b:latest | 0.303 | 33 |
| `gspc-asi` | qwen2.5-coder:1.5b | 0.3333 | 33 |
| `gspc-asi` | qwen3:0.6b | 0.303 | 33 |
| `gspc-asi` | qwen3:1.7b | 0.303 | 33 |
| `gspc-det` | deepseek-r1:1.5b | 0.697 | 33 |
| `gspc-det` | gspc-qwen3-1.7b-16k:latest | 0.7879 | 33 |
| `gspc-det` | meok-gspc-qwen3-1.7b:latest | 0.7879 | 33 |
| `gspc-det` | qwen2.5-coder:1.5b | 0.7879 | 33 |
| `gspc-det` | qwen3:0.6b | 0.7879 | 33 |
| `gspc-det` | qwen3:1.7b | 0.7879 | 33 |
| `gspc-mcp` | deepseek-r1:1.5b | 0.2286 | 35 |
| `gspc-mcp` | gspc-qwen3-1.7b-16k:latest | 0.6286 | 35 |
| `gspc-mcp` | meok-gspc-qwen3-1.7b:latest | 0.6286 | 35 |
| `gspc-mcp` | qwen2.5-coder:1.5b | 0.6 | 35 |
| `gspc-mcp` | qwen3:0.6b | 0.5143 | 35 |
| `gspc-mcp` | qwen3:1.7b | 0.6286 | 35 |
| `gspc-oss` | deepseek-r1:1.5b | 0.25 | 32 |
| `gspc-oss` | gspc-qwen3-1.7b-16k:latest | 0.6875 | 32 |
| `gspc-oss` | meok-gspc-qwen3-1.7b:latest | 0.6875 | 32 |
| `gspc-oss` | qwen2.5-coder:1.5b | 0.5 | 32 |
| `gspc-oss` | qwen3:0.6b | 0.5312 | 32 |
| `gspc-oss` | qwen3:1.7b | 0.6875 | 32 |
| `gspc-prv` | deepseek-r1:1.5b | 0.2812 | 32 |
| `gspc-prv` | gspc-qwen3-1.7b-16k:latest | 0.625 | 32 |
| `gspc-prv` | meok-gspc-qwen3-1.7b:latest | 0.625 | 32 |
| `gspc-prv` | qwen2.5-coder:1.5b | 0.4688 | 32 |
| `gspc-prv` | qwen3:0.6b | 0.5938 | 32 |
| `gspc-prv` | qwen3:1.7b | 0.625 | 32 |

Full machine-readable: `SUMMARY.json` (per bank × model) · `sweep_rows.json` (every item graded).

## What this is NOT
Lane run — zero-shot label-match grading, **not** the canonical board_v2 grader; not board-comparable;
not signed yet (owner stamp PENDING). Measurement, not certification.

## Verify
Anything signed: [councilof.ai/gspc-verify](https://councilof.ai/gspc-verify) · MCP `verify_card`.

<!-- csoai-card-fixes:start -->

## Subsets (configs)

The Dataset Viewer and `datasets` read this repository through the named subsets below. Each subset contains one homogeneous file group, so files with different schemas are not cast into a single table.

| subset | files | rows (as verified) |
|---|---|---|
| `summary` (default) | `SUMMARY.json` | 1 |
| `sweep-rows` | `sweep_rows.json` | 1 |

```python
from datasets import load_dataset

ds = load_dataset("csoai/fleet-sweep-v0.2", "summary", split="train")
```

## Citation

```bibtex
@misc{csoai_fleet_sweep_v0_2_2026,
  title        = {Fleet sweep v0.2 — six sovereign models on six GSPC banks (lane run)},
  author       = {{CSOAI Ltd (Council of AI)}},
  year         = {2026},
  publisher    = {Hugging Face},
  howpublished = {\url{https://huggingface.co/datasets/csoai/fleet-sweep-v0.2}},
  url          = {https://huggingface.co/datasets/csoai/fleet-sweep-v0.2}
}
```

<!-- csoai-card-fixes:end -->
