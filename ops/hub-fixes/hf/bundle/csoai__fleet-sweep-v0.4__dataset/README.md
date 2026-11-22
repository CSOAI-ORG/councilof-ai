---
license: cc-by-4.0
language: [en]
pretty_name: Fleet Sweep v0.4 — logprob ranking grading (method upgrade, lane run)
tags: [gspc, council-of-ai, fleet-sweep, logprob, measurement, lane-run]
size_categories: [1K<n<10K]
configs:
- config_name: separation-input
  data_files:
  - split: train
    path: separation-input.jsonl
  default: true
- config_name: subject-rows
  data_files:
  - split: train
    path: subject_rows.jsonl
- config_name: sweep-rows
  data_files:
  - split: train
    path: sweep_rows.jsonl
---

<p align="center">
  <img src="https://huggingface.co/datasets/csoai/brand-assets/resolve/main/csoai-banner-1280x256.png" alt="Council of AI (CSOAI)" width="100%">
</p>

# Fleet Sweep v0.4 — **logprob ranking** (method upgrade, lane run)

Same 6 models × 6 banks, same frozen items as v0.3 (1206/1206 rows, temp 0) — but the
grading method changed from **generate-then-extract** to **first-token logprob ranking**
(the lm-eval-harness approach): one call per item, `top_logprobs=10`, thinking disabled
(`reasoning_effort: none`). The model's true preference order over label-initial tokens
is read directly from the logit distribution.

## Why the method matters — deepseek-r1's signal was buried, not missing

Under extraction grading (v0.3), refusal-style answers sank deepseek-r1 to near-zero on
most banks. Under ranking, its genuine classification ability shows:

| Bank | r1 extraction (v0.3) | r1 **ranking (v0.4)** |
|---|---|---|
| det | 0.636 | **0.788** (top of fleet) |
| oss | 0.281 | **0.531** |
| asi | 0.303 | **0.364** |
| prv | 0.188 | **0.375** |
| art5 | 0.056 | **0.389** |
| mcp | 0.229 | 0.265 |

Same effect for qwen3-0.6b (rank recovers what verbose answers hid, e.g. oss 0.125 → 0.500).

## Full v0.4 ranking board (rank accuracy)

| Model | mcp | oss | prv | asi | det | art5 |
|---|---|---|---|---|---|---|
| meok-gspc-qwen3-1.7b (sovereign) | .600 | **.688** | **.688** | .394 | .758 | **.833** |
| gspc-qwen3-1.7b-16k | .600 | **.688** | **.688** | .394 | .758 | **.833** |
| qwen3-1.7b (base) | .629 | **.688** | **.688** | .394 | .758 | **.833** |
| qwen3-0.6b | .514 | .500 | .625 | .394 | **.788** | .417 |
| deepseek-r1-1.5b | .265 | .531 | .375 | .364 | **.788** | .389 |
| qwen2.5-coder-1.5b | .600 | .500 | .469 | .303 | **.788** | .472 |

## What this confirms
- **Sovereign Δ=0.0 — now triple-confirmed** (v0.1 answers, v0.3 extraction, v0.4 ranking):
  the fine-tune is a packaging no-op; the next delta needs real training
  (code ready: [csoai/gspc-lora-train-v1](https://huggingface.co/datasets/csoai/gspc-lora-train-v1)).
- **asi is the hardest bank under every method** (fleet max .394) — genuine headroom.
- det has a three-way top (r1, 0.6b, coder at .788) — different architectures converge,
  which strengthens the bank's validity as a signal.

## Method notes
- `ranked`: gold label's initial token carries the highest logprob among label tokens
  in the model's top-10 first-token distribution.
- `greedy` also recorded per row (comparable to v0.3) — both metrics in every line.
- Unrankable items (no label token in top-10) count as miss and are visible per row.
- Lane-run label-match; NOT the board_v2 grader; not comparable with the published board.

Files: `sweep_rows.jsonl` (1206 lines; per-item ranked + greedy verdicts).

Measurement, not certification. Free verify: https://councilof.ai/gspc-verify

<!-- csoai-card-fixes:start -->

## Subsets (configs)

The Dataset Viewer and `datasets` read this repository through the named subsets below. Each subset contains one homogeneous file group, so files with different schemas are not cast into a single table.

| subset | files | rows (as verified) |
|---|---|---|
| `separation-input` (default) | `separation-input.jsonl` | 3179 |
| `subject-rows` | `subject_rows.jsonl` | 1974 |
| `sweep-rows` | `sweep_rows.jsonl` | 1206 |

```python
from datasets import load_dataset

ds = load_dataset("csoai/fleet-sweep-v0.4", "separation-input", split="train")
```

## Citation

```bibtex
@misc{csoai_fleet_sweep_v0_4_2026,
  title        = {Fleet Sweep v0.4 — logprob ranking grading (method upgrade, lane run)},
  author       = {{CSOAI Ltd (Council of AI)}},
  year         = {2026},
  publisher    = {Hugging Face},
  howpublished = {\url{https://huggingface.co/datasets/csoai/fleet-sweep-v0.4}},
  url          = {https://huggingface.co/datasets/csoai/fleet-sweep-v0.4}
}
```

<!-- csoai-card-fixes:end -->
