---
license: apache-2.0
task_categories:
  - question-answering
  - text-classification
language:
  - en
tags:
- ai-governance
- eu-ai-act
- gdpr
- benchmark
- evaluation
- council-of-ai
size_categories:
  - n<1K
short_description: Governance benchmark that publishes its own resolution limit
pretty_name: GovBench — items, tooling, and every experiment that refuted us
configs:
- config_name: govbench-items
  data_files:
  - split: train
    path: govbench_items.jsonl
  default: true
- config_name: results-defoneos-depth-items
  data_files:
  - split: train
    path: results/defoneos_depth_items.json
- config_name: results-robustness-depth-items
  data_files:
  - split: train
    path: results/robustness_depth_items.json
- config_name: results-citation-accuracy
  data_files:
  - split: train
    path: results/citation_accuracy.json
- config_name: item-fingerprints
  data_files:
  - split: train
    path: item_fingerprints.json
- config_name: results-arena-analysis
  data_files:
  - split: train
    path: results/arena_analysis.json
- config_name: results-arena-champion
  data_files:
  - split: train
    path: results/arena_champion.json
- config_name: results-arena-final
  data_files:
  - split: train
    path: results/arena_final.json
- config_name: results-arena-full-results
  data_files:
  - split: train
    path: results/arena_full_results.json
- config_name: results-arena-results
  data_files:
  - split: train
    path: results/arena_results.json
- config_name: results-board-fingerprints
  data_files:
  - split: train
    path: results/board_fingerprints.json
- config_name: results-cad-analysis
  data_files:
  - split: train
    path: results/cad_analysis.json
- config_name: results-capability-registry
  data_files:
  - split: train
    path: results/capability_registry.json
- config_name: results-care-gate-eval
  data_files:
  - split: train
    path: results/care_gate_eval.json
- config_name: results-care-gate-experiment
  data_files:
  - split: train
    path: results/care_gate_experiment.json
- config_name: results-clan-ledger
  data_files:
  - split: train
    path: results/clan_ledger.json
- config_name: results-eat-final-report
  data_files:
  - split: train
    path: results/eat_final_report.json
- config_name: results-evaluation-scores
  data_files:
  - split: train
    path: results/evaluation_scores.json
- config_name: results-expanded-items
  data_files:
  - split: train
    path: results/expanded_items.json
- config_name: results-full-arena-results
  data_files:
  - split: train
    path: results/full_arena_results.json
- config_name: results-govbench-results
  data_files:
  - split: train
    path: results/govbench_results.json
- config_name: results-kb-split
  data_files:
  - split: train
    path: results/kb_split.json
- config_name: results-length-controlled-eval
  data_files:
  - split: train
    path: results/length_controlled_eval.json
- config_name: results-mitosis
  data_files:
  - split: train
    path: results/mitosis.json
- config_name: results-sample
  data_files:
  - split: train
    path:
    - results/e2e_api_groq.json
    - results/e2e_groq_v2.json
---

# GovBench — items, tooling, and every experiment that refuted us

> **Canon note (2026-08-18).** This public snapshot carries **193 items**. The frozen,
> signed governance bank in the estate corpus holds **237** (the extra items are the
> held-out grading splits). When you see both numbers, this is why. Canonical anchor:
> [10.5281/zenodo.21991104](https://doi.org/10.5281/zenodo.21991104).


**193 items · 26 dimensions · 10 models · every item carries grading criteria.**

## ⚠️ Read this before ranking anything

**0 of 15 scored dimensions have a resolved winner.** Every model is statistically tied on
every dimension by Wilson intervals. **Do not rank models on these numbers.**

We now know what it would cost to fix that, because we tried:

| dimension | items held | items needed per model |
|---|---|---|
| **robustness** | **24** | **~230** *(measured on 24 real items)* |
| defence | 5 | ~85 · *lower bound* |
| governance | 5 | ~165 · *lower bound* |
| accountability | 11 | ~167 |
| compliance | 10 | ~3,837 |
| cybersecurity | 10 | ~27,136 |
| ethics · privacy · safety | 11 · 5 · 10 | **exactly tied — no n fixes this** |

**Prices computed from n<20 are lower bounds, not targets.** We priced robustness at ~24 from
a gap observed at n=5, expanded it to 24, and re-measured: the gap narrowed from 14.3 to 8.4
points and the true price turned out to be **~230 — a 10× miss.** At n=5 a single item is
worth 20 points, so small-n gaps are inflated by the coarseness of the score space. Expanding
does not merely add precision; it reveals the gap was smaller than it looked, and a smaller
gap needs quadratically more items.

## What IS measured

The composed pipeline (`gate → retrieve → answer → verify → attest → mark`) against the same
items answered by a raw base model. n=193, paired, judged by an analysis written **before** the
run existed.

Intervals are **cluster-robust**. Items inside a dimension share a rubric and a grader, so
treating 193 items as 193 independent draws overstates precision: measured **design effect
1.92**, honest **effective n ≈ 100 of 193**. Every row is computed from the same run and they
**partition** it — 6 + 14 + 173 = 193.

| layer | n | Δ | 95% CI (clustered) |
|---|---|---|---|
| deterministic gate | 6 | **−20.00** | [−65.26, +25.26] — **no effect shown** |
| knowledge base | 14 | **+19.64** | [+9.24, +30.04] |
| tuned model | 173 | **+6.50** | [+1.06, +11.95] |
| **whole system** | **193** | **+6.63** | **[+1.05, +12.21]** |

Wins 55 · losses 25 · ties 113 · sign test p=0.0011 · leave-one-out +6.15.

### ⚠️ Retraction, 2026-07-29 — the gate, and how the old table was built

This table previously read **gate +34.84 [+17.50, +52.18] n=31**, **whole system +12.21 n=195**.
Both are withdrawn. Three defects, all now fixed and all documented in
[`SCIENCE_AUDIT_2026-07-29.md`](SCIENCE_AUDIT_2026-07-29.md):

1. **The claims were less reproducible than the refutations.** Every refutation kept its raw
   per-item rows; every *claim* wrote them to `/tmp` and lost them. `system_bench.py` now
   persists rows and `system_analysis.py` **cannot report CLAIMABLE without them**.
2. **The layer rows did not decompose the headline.** They summed to **186** beneath a
   **195**-item total — layers from one run, total from another. The figures had *no generating
   code*: `+34.84` existed only as a hardcoded string. `tools/layer_attribution.py` now computes
   them and asserts the partition.
3. **Clustering was never checked.** Design effect 1.92, so the old interval was ~40% too narrow.

**The gate result itself.** Re-measured, it fires **6 times, not 31**, and contributes nothing:
the base model already refuses all four plain-harm items it catches (Δ 0.0 each), and its only
measurable effects are **two false blocks** — an *analysis* question about gambling-relapse
targeting, and a prompt-injection item where resisting *and still answering* was correct, so
blocking scored 0 against the base's 100. Commit `6b740884f` fixed a care gate that had
**overfitted to its own battery**; the benefit went with it, which is the strongest available
evidence that the benefit *was* the overfitting.

**The KB is the result that survived** — `+19.64` on n=14 reproduced *exactly*, from fresh rows,
and its interval tightened under clustering. It was the least-emphasised number and is now the
most robust.

## The six experiments that refuted our own architecture

Published because a benchmark that only reports its wins is worth less than one reporting the
controls that kill its own thesis. **Five of these six were our own architectural bets, and the sixth was our single largest published number.**

| # | claim | result | verdict |
|---|---|---|---|
| 1 | Per-dimension expert routing beats one good model | Δ **+0.90** `[-1.99, +3.79]` | no effect — **ships off** |
| 2 | Statute retrieval helps (ungated) | Δ **−9.16** `[-17.64, -0.69]` | significant **harm** |
| 3 | …with a relevance gate | Δ **−5.26** `[-12.66, +2.13]` | no benefit — **ships off** |
| 4 | …plus all 13 AI Act annexes + cross-references | Δ **−5.70** `[-12.91, +1.51]` | corpus was **not** the cause |
| 5 | The 3-leg quorum is Byzantine fault tolerant | **n_eff 1.21** of 3 | **retracted** |
| 6 | **The deterministic gate is our strongest component** | Δ **−20.00** `[−65.26, +25.26]` n=6 (was **+34.84** at n=31) | **retracted** |

### On #5 — the quorum retraction
Measured pairwise error correlation across three legs on 174 items: φ = +0.730, +0.697, +0.803,
mean **+0.743**. Kish effective votes: **1.21 of a nominal 3.** The three legs are system
prompts over one shared 397MB blob, so they are wrong in the same places. More legs, prompts
or adapters cannot fix this — only a different *architecture* can. "Byzantine fault tolerant"
has been removed from every document in the estate.

## Corrections on the record

- **`fairness` and `robustness` were regraded.** Both had been scored by the *absence* of bad
  tokens alone. A model emitting `1\n1\n1` from a corrupt blob **topped both columns at 100%**,
  while one answering *"gender is not inherently better or worse"* scored **0%** — `better` was
  on the penalty list. The dimension was anti-correlated with correctness.
- **`sov33-evolved-c2` is withdrawn**, not rescored — its blob is corrupt, so its published
  numbers cannot be reproduced.

## Known limitation

**This governs provenance, not correctness.** The pipeline has shipped a wrong legal answer
carrying a valid EU AI Act Article 50 marking and a clean signed receipt. An attested answer is
*attested*, never *verified*.

## Contents

```
govbench_items.jsonl      193 items, 26 dimensions, criteria + source citations
item_fingerprints.json    sha256 per dimension — a score is only valid for the set it was measured on
tools/                    17 tools: intervals, margins, n_eff, pre-registered analyses,
                          the division rule, the withdrawal registry, and every control above
results/                  58 files — raw JSON for every number on this card
docs/                     master alignment · quorum retraction · pricing model
```

## Run it

```bash
pip install inspect-ai
inspect eval govbench_inspect.py --model ollama/qwen2.5:0.5b
```

Failed runs are recorded as **absent**, never as zero.

## Honesty register

UNCERTIFIED is the default: no competent authority exists to confer EU AI Act conformity, so
neither can we. All sovereign models tested are system-prompt variants over one shared base —
which is exactly why experiments 1 and 5 came back null. Apache-2.0.

<!-- csoai-card-fixes:start -->

## Subsets (configs)

The Dataset Viewer and `datasets` read this repository through the named subsets below. Each subset contains one homogeneous file group, so files with different schemas are not cast into a single table.

| subset | files | rows (as verified) |
|---|---|---|
| `govbench-items` (default) | `govbench_items.jsonl` | 193 |
| `results-defoneos-depth-items` | `results/defoneos_depth_items.json` | 23 |
| `results-robustness-depth-items` | `results/robustness_depth_items.json` | 8 |
| `results-citation-accuracy` | `results/citation_accuracy.json` | 1 |
| `item-fingerprints` | `item_fingerprints.json` | 1 |
| `results-arena-analysis` | `results/arena_analysis.json` | 1 |
| `results-arena-champion` | `results/arena_champion.json` | 1 |
| `results-arena-final` | `results/arena_final.json` | 1 |
| `results-arena-full-results` | `results/arena_full_results.json` | 1 |
| `results-arena-results` | `results/arena_results.json` | 1 |
| `results-board-fingerprints` | `results/board_fingerprints.json` | 1 |
| `results-cad-analysis` | `results/cad_analysis.json` | 1 |
| `results-capability-registry` | `results/capability_registry.json` | 1 |
| `results-care-gate-eval` | `results/care_gate_eval.json` | 1 |
| `results-care-gate-experiment` | `results/care_gate_experiment.json` | 1 |
| `results-clan-ledger` | `results/clan_ledger.json` | 1 |
| `results-eat-final-report` | `results/eat_final_report.json` | 1 |
| `results-evaluation-scores` | `results/evaluation_scores.json` | 1 |
| `results-expanded-items` | `results/expanded_items.json` | 1 |
| `results-full-arena-results` | `results/full_arena_results.json` | 1 |
| `results-govbench-results` | `results/govbench_results.json` | 1 |
| `results-kb-split` | `results/kb_split.json` | 1 |
| `results-length-controlled-eval` | `results/length_controlled_eval.json` | 1 |
| `results-mitosis` | `results/mitosis.json` | 1 |
| `results-sample` | `results/e2e_api_groq.json`, `results/e2e_groq_v2.json` | 2 |

```python
from datasets import load_dataset

ds = load_dataset("Nicholastempleman/govbench-items", "govbench-items", split="train")
```

## Front door

Council of AI publishes its live measurement board and methods at [https://councilof.ai](https://councilof.ai).

## Citation

```bibtex
@misc{nicholastempleman_govbench_items_2026,
  title        = {GovBench — items, tooling, and every experiment that refuted us},
  author       = {{CSOAI Ltd (Council of AI)}},
  year         = {2026},
  publisher    = {Hugging Face},
  howpublished = {\url{https://huggingface.co/datasets/Nicholastempleman/govbench-items}},
  url          = {https://huggingface.co/datasets/Nicholastempleman/govbench-items}
}
```

<!-- csoai-card-fixes:end -->
