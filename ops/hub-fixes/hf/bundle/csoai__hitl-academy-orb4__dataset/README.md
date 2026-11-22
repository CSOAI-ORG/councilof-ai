---
license: cc-by-4.0
language:
- en
task_categories:
- question-answering
tags:
- ai-oversight
- human-in-the-loop
- eu-ai-act
- etsi-en-304-223
- gamification
- ai-literacy
- council-of-ai
pretty_name: HITL Academy Rank ORB-IV — ETSI & EU AI Act Oversight Lead
size_categories:
- n<1K
---

<p align="center">
  <img src="https://huggingface.co/datasets/csoai/brand-assets/resolve/main/csoai-banner-1280x256.png" alt="Council of AI (CSOAI)" width="100%">
</p>

# HITL Academy — Level 4 · ETSI & EU AI Act Oversight Lead (`ORB-IV`)

Train humans for AI oversight — the **GSPC Human-in-the-Loop Academy**, published by the
Council of AI (CSOAI). This dataset contains the frozen-rank Micro-MOOC module(s) a learner
studies while holding the `ORB-IV` rank, extracted verbatim from the
`meok-hitl-mooc.mjs` Frozen-to-Fluid competency engine (`source: "meok-hitl-mooc.frozen"`).

**Policy: Measurement and Human-in-the-Loop Oversight — Never Certification.** These modules teach judgement for oversight decisions; completing them
is measurement of readiness, never certification.

## The module in this dataset

| field | value |
|---|---|
| module | `MOOC-04` |
| axis | `effect-binding` |
| instructor | Soren (PAL-4 · Layer-0 Sandbox & MCP Integrity Lead) |
| statutory basis | MCP 2025-06-18 Effect-Binding + corrections.jsonl Supersession Audit Trail |
| XP reward | 150 |
| cumulative XP after this module | 630 |

The Frozen→Fluid shift this module briefs you on:

- **Frozen (t_0):** 2026-10-25T02-38-38-673Z-effect-binding.json
- **Fluid (t_N):** 2026-10-26T02-07-31-853Z-effect-binding.json (CID `74e0e42e0f4b3563`)

## Rank ladder (shared across all five datasets)

| rank | badge | XP threshold | gateway module | module XP | cumulative XP after module |
|---|---|---|---|---|---|
| Level 1 · Observer in the Loop | `ORB-I` | 0 | `MOOC-01` (governance) | 160 | 160 |
| Level 2 · Frozen-to-Fluid Steward | `ORB-II` | 150 | `MOOC-02` (meok-moa-etsi-304-223) | 160 | 320 |
| Level 3 · 3-Around-1 Temporal Sentinel | `ORB-III` | 350 | `MOOC-03` (meok-backward-3around1-temporal) | 160 | 480 |
| Level 4 · ETSI & EU AI Act Oversight Lead | `ORB-IV` | 550 | `MOOC-04` (effect-binding) | 150 | 630 |
| Level 5 · GSPC Human-in-the-Loop Arbiter | `ORB-V` | 750 | `MOOC-05` (care) | 170 | 800 |

Scoring rules from the same engine: a first-correct answer grants the module's `xp_reward`;
re-running a completed module grants a +25 XP refresher; a wrong answer resets the streak.
Passing a module **unlocks the oversight decision path for that axis** — you cannot sign a
human-oversight decision on an axis you have not been briefed on.

## How your verdict becomes real work

Every oversight decision you sign emits an Ed25519-signed receipt under schema
`csoai.hitl-oversight-receipt/0.1` (operator, axis, decision, note, competency flag, policy). Machine
signatures prove pipeline provenance — **only a named, trained human can move an artefact
from PENDING to APPROVED**. Real review queue: 676 artefacts, 664 PENDING.

## The full Academy

- `csoai/hitl-academy-orb1` … `csoai/hitl-academy-orb5` — one frozen dataset per rank
- `csoai/hitl-practice-review-queue` — 30 real PENDING artefacts for fluid practice;
  your verdicts join the actual human review queue (EAT), not a simulation.

## Licence & provenance

- Licence: **CC-BY-4.0**.
- Source: `meok-router/meok-hitl-mooc.mjs` (Council of AI GSPC measurement estate), councilof.ai.
- Splits: `train` only (single JSONL, one record per module item).
- **Measurement, not certification.**

<!-- csoai-card-fixes:start -->

## Citation

```bibtex
@misc{csoai_hitl_academy_orb4_2026,
  title        = {HITL Academy Rank ORB-IV — ETSI & EU AI Act Oversight Lead},
  author       = {{CSOAI Ltd (Council of AI)}},
  year         = {2026},
  publisher    = {Hugging Face},
  howpublished = {\url{https://huggingface.co/datasets/csoai/hitl-academy-orb4}},
  url          = {https://huggingface.co/datasets/csoai/hitl-academy-orb4}
}
```

<!-- csoai-card-fixes:end -->
