---
license: cc-by-4.0
task_categories:
- text-classification
language:
- en
tags:
- gspc
- council-of-ai
- measurement
- safety
- cross-reality
pretty_name: "GSPC Academy — Cross-Reality"
size_categories:
- n<1K
configs:
- config_name: items
  data_files:
  - split: train
    path: items.jsonl
  default: true
- config_name: board-card
  data_files:
  - split: train
    path: board-card.json
- config_name: mooc-map
  data_files:
  - split: train
    path: mooc-map.json
---

<p align="center">
  <img src="https://huggingface.co/datasets/csoai/brand-assets/resolve/main/csoai-banner-1280x256.png" alt="Council of AI (CSOAI)" width="100%">
</p>

# GSPC Academy — Cross-Reality (`xr` axis)

Training + MOOC data for the **cross-reality** axis specialist — feeds the Council of AI agentic
specialist hive and the GSPC Human-in-the-Loop academy.

Every item carries **per-model outcomes from real measured runs**: a 19-model fleet (6 base
models — deepseek-r1:8b, gemma3:12b, llama3.2:3b, mistral:7b, qwen2.5:0.5b-instruct,
qwen2.5:3b — and 13 CSOAI `sov6-*` prompt-overlay specialists), deterministic grading,
2026-08-12 measurement date, zero transport errors.

## Stats

| metric | value |
|---|---|
| items | 32 |
| arms | 19 |
| hard cases (`majority_wrong`) | **21** |
| split | 0 |
| majority-correct | 11 |
| measurement rows behind it | 608 |

**The 21 `majority_wrong` items are the hard cases — the training gold for the
cross-reality specialist.**

### Per-arm accuracy (measured)

| arm | runs | correct | accuracy |
|---|---|---|---|
| `deepseek-r1:8b` | 32 | 13 | 0.406 |
| `gemma3:12b` | 32 | 13 | 0.406 |
| `llama3.2:3b` | 32 | 19 | 0.594 |
| `mistral:7b` | 32 | 26 | 0.812 |
| `qwen2.5:0.5b-instruct` | 32 | 14 | 0.438 |
| `qwen2.5:3b` | 32 | 11 | 0.344 |
| `sov6-abstraction-v3-light` | 32 | 11 | 0.344 |
| `sov6-aesthetics-v3-light` | 32 | 16 | 0.500 |
| `sov6-agency-v3-light` | 32 | 14 | 0.438 |
| `sov6-creation-v3-light` | 32 | 16 | 0.500 |
| `sov6-destruction-v3-light` | 32 | 14 | 0.438 |
| `sov6-embodiment-v3-light` | 32 | 16 | 0.500 |
| `sov6-ethics-v3-light` | 32 | 11 | 0.344 |
| `sov6-identity-v3-light` | 32 | 11 | 0.344 |
| `sov6-logic-v3-light` | 32 | 14 | 0.438 |
| `sov6-preservation-v3-light` | 32 | 14 | 0.438 |
| `sov6-relationality-v3-light` | 32 | 12 | 0.375 |
| `sov6-synthesis-v3-light` | 32 | 12 | 0.375 |
| `sov6-temporality-v3-light` | 32 | 11 | 0.344 |

Fleet total: 268/608 correct (0.441).

### Files

- `items.jsonl` — one record per unique item: `{item_id, scenario, gold_label, arms, discrimination, item_sha256}`. Each `arms` entry is `{prediction, correct}` (plus `runs`/`correct_runs` where an arm was measured more than once on the item).
- `specialist-prompt.md` — the lane's specialist prompt. **Not yet statutory-pinned** — honest placeholder, no rubric invented.
- `mooc-map.json` — curriculum map: **Observer** (up to 30 easiest items), **Steward** (medium discrimination), **Sentinel** (the majority_wrong hard cases).
- `board-card.json` — this axis's entry from the live GSPC board API, verbatim.

- 15 arm outcomes were unparseable; they are recorded with prediction `"UNPARSED"` and `correct: false` — excluded nothing, hidden nothing.


## Board row

| bench | task | n | separation | fleet_mean | dataset | colour |
|---|---|---|---|---|---|---|
| XRAIV | autonomous agent action authority (PROCEED / CONFIRM / REFUSE) | 32 | UNTESTED | 0.441 | `csoai/gspc-xr` | `#a78bfa` |

Live board: [councilof.ai/board](https://councilof.ai/board) · live API serves the same axis
entries (the board card here is a verbatim snapshot, `measured_on` behavioural axes
2026-08-12).

## MOOC ranks

`mooc-map.json` assigns every item to exactly one tier: **Observer** (up to 30 easiest,
largest correct-arm margin), **Steward** (medium discrimination: narrow majorities and split
items), **Sentinel** (every `majority_wrong` hard case). Signing/review flows through the EAT
review queue.

## Upstream attribution & licence

Items are CSOAI's own GSPC bank for this axis (no external upstream). The raw per-item measurement rows are published at [csoai/gspc-peritem-rows-2026-08-12](https://huggingface.co/datasets/csoai/gspc-peritem-rows-2026-08-12).

Licence: **CC-BY-4.0**.

## The rule

> **Measurement, not certification.** Items are public; board changes require human-reviewed
> measurement runs.

Part of the [GSPC Academy](https://huggingface.co/csoai) series — one dataset per measurement
axis, patterned after the topic-partitioned JSONL + high-quality card format, with per-model
measured outcomes on every item.

<!-- csoai-card-fixes:start -->

## Subsets (configs)

The Dataset Viewer and `datasets` read this repository through the named subsets below. Each subset contains one homogeneous file group, so files with different schemas are not cast into a single table.

| subset | files | rows (as verified) |
|---|---|---|
| `items` (default) | `items.jsonl` | 32 |
| `board-card` | `board-card.json` | 1 |
| `mooc-map` | `mooc-map.json` | 1 |

```python
from datasets import load_dataset

ds = load_dataset("csoai/gspc-academy-xr", "items", split="train")
```

## Citation

```bibtex
@misc{csoai_gspc_academy_xr_2026,
  title        = {GSPC Academy — Cross-Reality},
  author       = {{CSOAI Ltd (Council of AI)}},
  year         = {2026},
  publisher    = {Hugging Face},
  howpublished = {\url{https://huggingface.co/datasets/csoai/gspc-academy-xr}},
  url          = {https://huggingface.co/datasets/csoai/gspc-academy-xr}
}
```

<!-- csoai-card-fixes:end -->
