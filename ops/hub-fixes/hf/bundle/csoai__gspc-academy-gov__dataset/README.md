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
- governance
pretty_name: "GSPC Academy — Governance"
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

# GSPC Academy — Governance (`gov` axis)

Training + MOOC data for the **governance** axis specialist — feeds the Council of AI agentic
specialist hive and the GSPC Human-in-the-Loop academy.

Every item carries **per-model outcomes from real measured runs**: a 19-model fleet (6 base
models — deepseek-r1:8b, gemma3:12b, llama3.2:3b, mistral:7b, qwen2.5:0.5b-instruct,
qwen2.5:3b — and 13 CSOAI `sov6-*` prompt-overlay specialists), deterministic grading,
2026-08-12 measurement date, zero transport errors.

## Stats

| metric | value |
|---|---|
| items | 237 |
| arms | 19 |
| hard cases (`majority_wrong`) | **134** |
| split | 0 |
| majority-correct | 103 |
| measurement rows behind it | 4503 |

**The 134 `majority_wrong` items are the hard cases — the training gold for the
governance specialist.**

### Per-arm accuracy (measured)

| arm | runs | correct | accuracy |
|---|---|---|---|
| `deepseek-r1:8b` | 237 | 128 | 0.540 |
| `gemma3:12b` | 237 | 112 | 0.473 |
| `llama3.2:3b` | 237 | 110 | 0.464 |
| `mistral:7b` | 237 | 139 | 0.586 |
| `qwen2.5:0.5b-instruct` | 237 | 66 | 0.278 |
| `qwen2.5:3b` | 237 | 102 | 0.430 |
| `sov6-abstraction-v3-light` | 237 | 103 | 0.435 |
| `sov6-aesthetics-v3-light` | 237 | 166 | 0.700 |
| `sov6-agency-v3-light` | 237 | 118 | 0.498 |
| `sov6-creation-v3-light` | 237 | 159 | 0.671 |
| `sov6-destruction-v3-light` | 237 | 103 | 0.435 |
| `sov6-embodiment-v3-light` | 237 | 166 | 0.700 |
| `sov6-ethics-v3-light` | 237 | 88 | 0.371 |
| `sov6-identity-v3-light` | 237 | 99 | 0.418 |
| `sov6-logic-v3-light` | 237 | 109 | 0.460 |
| `sov6-preservation-v3-light` | 237 | 158 | 0.667 |
| `sov6-relationality-v3-light` | 237 | 93 | 0.392 |
| `sov6-synthesis-v3-light` | 237 | 94 | 0.397 |
| `sov6-temporality-v3-light` | 237 | 95 | 0.401 |

Fleet total: 2208/4503 correct (0.490).

### Files

- `items.jsonl` — one record per unique item: `{item_id, scenario, gold_label, arms, discrimination, item_sha256}`. Each `arms` entry is `{prediction, correct}` (plus `runs`/`correct_runs` where an arm was measured more than once on the item).
- `specialist-prompt.md` — the lane's specialist prompt. The statutory rubric, verbatim from `GOVERNANCE_STATUTORY_RUBRIC` (meok-router/meok-ensemble.mjs).
- `mooc-map.json` — curriculum map: **Observer** (up to 30 easiest items), **Steward** (medium discrimination), **Sentinel** (the majority_wrong hard cases).
- `board-card.json` — this axis's entry from the live GSPC board API, verbatim.

- 174 arm outcomes were unparseable; they are recorded with prediction `"UNPARSED"` and `correct: false` — excluded nothing, hidden nothing.


## Board row

| bench | task | n | separation | fleet_mean | dataset | colour |
|---|---|---|---|---|---|---|
| GovBench | EU AI Act risk-tier classification | 237 | TIE | 0.49 | `csoai/gspc-gov` | `#34d399` |

Live board: [councilof.ai/board](https://councilof.ai/board) · live API serves the same axis
entries (the board card here is a verbatim snapshot, `measured_on` behavioural axes
2026-08-12).

## MOOC ranks

`mooc-map.json` assigns every item to exactly one tier: **Observer** (up to 30 easiest,
largest correct-arm margin), **Steward** (medium discrimination: narrow majorities and split
items), **Sentinel** (every `majority_wrong` hard case). Signing/review flows through the EAT
review queue.

## Upstream attribution & licence

**Upstream attribution (verbatim):** AI Act Evaluation Benchmark, NCSR Demokritos, arXiv:2603.09435, CC-BY-4.0. This governance bank derives from it; the per-arm outcome measurements are CSOAI's own.

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
| `items` (default) | `items.jsonl` | 237 |
| `board-card` | `board-card.json` | 1 |
| `mooc-map` | `mooc-map.json` | 1 |

```python
from datasets import load_dataset

ds = load_dataset("csoai/gspc-academy-gov", "items", split="train")
```

## Citation

```bibtex
@misc{csoai_gspc_academy_gov_2026,
  title        = {GSPC Academy — Governance},
  author       = {{CSOAI Ltd (Council of AI)}},
  year         = {2026},
  publisher    = {Hugging Face},
  howpublished = {\url{https://huggingface.co/datasets/csoai/gspc-academy-gov}},
  url          = {https://huggingface.co/datasets/csoai/gspc-academy-gov}
}
```

<!-- csoai-card-fixes:end -->
