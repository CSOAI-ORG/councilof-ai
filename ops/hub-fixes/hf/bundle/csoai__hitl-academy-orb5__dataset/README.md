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
pretty_name: HITL Academy Rank ORB-V — GSPC Human-in-the-Loop Arbiter
size_categories:
- n<1K
---

<p align="center">
  <img src="https://huggingface.co/datasets/csoai/brand-assets/resolve/main/csoai-banner-1280x256.png" alt="Council of AI (CSOAI)" width="100%">
</p>

# HITL Academy — Level 5 · GSPC Human-in-the-Loop Arbiter (`ORB-V`)

Train humans for AI oversight — the **GSPC Human-in-the-Loop Academy**, published by the
Council of AI (CSOAI). This dataset contains the frozen-rank Micro-MOOC module(s) a learner
studies while holding the `ORB-V` rank, extracted verbatim from the
`meok-hitl-mooc.mjs` Frozen-to-Fluid competency engine (`source: "meok-hitl-mooc.frozen"`).

**Policy: Measurement and Human-in-the-Loop Oversight — Never Certification.** These modules teach judgement for oversight decisions; completing them
is measurement of readiness, never certification.

## The module in this dataset

| field | value |
|---|---|
| module | `MOOC-05` |
| axis | `care` |
| instructor | Noor (PAL-5 · Care, Affect & Human Review Gatekeeper) |
| statutory basis | CSOAI Fail-Closed EAT Playbook (`review.mjs` + `publish-manifest.mjs`) |
| XP reward | 170 |
| cumulative XP after this module | 800 |

The Frozen→Fluid shift this module briefs you on:

- **Frozen (t_0):** 186 machine-signed artefacts; 0 artefacts published without named human review
- **Fluid (t_N):** Competency-gated Human-in-the-Loop sign-off active (`PENDING -> APPROVED | REJECTED | HOLD`) (CID `f62f676436379082`)

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
@misc{csoai_hitl_academy_orb5_2026,
  title        = {HITL Academy Rank ORB-V — GSPC Human-in-the-Loop Arbiter},
  author       = {{CSOAI Ltd (Council of AI)}},
  year         = {2026},
  publisher    = {Hugging Face},
  howpublished = {\url{https://huggingface.co/datasets/csoai/hitl-academy-orb5}},
  url          = {https://huggingface.co/datasets/csoai/hitl-academy-orb5}
}
```

<!-- csoai-card-fixes:end -->
