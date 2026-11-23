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
pretty_name: HITL Academy Rank ORB-III — 3-Around-1 Temporal Sentinel
size_categories:
- n<1K
---

<p align="center">
  <img src="https://huggingface.co/datasets/csoai/brand-assets/resolve/main/csoai-banner-1280x256.png" alt="Council of AI (CSOAI)" width="100%">
</p>

# HITL Academy — Level 3 · 3-Around-1 Temporal Sentinel (`ORB-III`)

Train humans for AI oversight — the **GSPC Human-in-the-Loop Academy**, published by the
Council of AI (CSOAI). This dataset contains the frozen-rank Micro-MOOC module(s) a learner
studies while holding the `ORB-III` rank, extracted verbatim from the
`meok-hitl-mooc.mjs` Frozen-to-Fluid competency engine (`source: "meok-hitl-mooc.frozen"`).

**Policy: Measurement and Human-in-the-Loop Oversight — Never Certification.** These modules teach judgement for oversight decisions. Completion records training progress; they do not establish professional competence, authenticated reviewer identity or approval authority.

> **Evidence-status correction proposed 23 November 2026 (owner review pending).** The original 26 October 2026 result and CID are retained, not deleted or silently overwritten. Subsequent source-review and adversarial replay found that the 3-Around-1 referee was shown answer-bearing metadata on the 12 model tasks. With all three model-seat answers deliberately wrong, that referee still returned the correct label on 12/12 tasks when metadata contained answer choices, versus 0/12 with those fields stripped. The historical pooled 32/32 is therefore **a source-specific deterministic rule-path demonstration**, not a blinded independent evaluation of a council, human quorum or generalisable 100%-accurate model performance. The originally reported McNemar p-value does not repair the label-leakage limitation. See [validity finding and original evidence hashes](https://github.com/CSOAI-ORG/councilof-ai/issues/4737) and [research review PR](https://github.com/CSOAI-ORG/councilof-ai/pull/4730). This correction does not alter the original signed data.

## The module in this dataset

| field | value |
|---|---|
| module | `MOOC-03` |
| axis | `meok-backward-3around1-temporal` |
| instructor | Lyra (PAL-3 · Provenance & Temporal Continuity Lead) |
| statutory basis | GSPC 3-Around-1 Bidirectional Provenance (Genesis t_0 + Newest-First t_N + Referee) |
| XP reward | 160 |
| cumulative XP after this module | 480 |

The Frozen→Fluid shift this module briefs you on:

- **Frozen (t_0):** Normal Forward (Oldest-First) traversal = 34.4% (11/32), trapped by superseded t_0 records
- **Historical Fluid (t_N) record:** 3-Around-1 Bidirectional rule-path replay reported 32/32 (originally reported McNemar p=9.54e-7; CID `dc8cee6781b6d02f`). **Not a blinded accuracy result:** the referee-visible metadata contained answer-bearing labels. Preserve the historical figure only with that qualification and its [correction record](https://github.com/CSOAI-ORG/councilof-ai/issues/4737).

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
Passing a module records curriculum progression. A module completion alone **does not authorize a human-oversight decision**. The live [HITL companion status](https://councilof.ai/api/hitl) currently declares operator identity NOT_VERIFIED, human presence NOT_ESTABLISHED, professional competence NOT_ASSESSED and execution authority false. Verified identity, delegated authority and signed decision-bound approval are separate prerequisites.

## How your verdict becomes real work

The HITL service can record machine-signed decision receipts under schema
`csoai.hitl-oversight-receipt/0.1` (operator label, axis, decision, note, competency flag and policy). **A software signature is not proof that a distinct, trained human approved the request.** On the 23 November 2026 independent readback, the live [HITL companion endpoint](https://councilof.ai/api/hitl) stated `decision_recording_credential=SHARED_OPERATOR_TOKEN`, `operator_identity=NOT_VERIFIED`, `human_presence=NOT_ESTABLISHED` and `execution_authority=false`. It displayed 3 PENDING and 2 APPROVED decision records, **not independently authenticated human votes**. Historical queue numbers such as 676 artefacts / 664 PENDING must not be used as current counts; inspect the dated live source and its verification limits.

## The full Academy

- `csoai/hitl-academy-orb1` … `csoai/hitl-academy-orb5` — one frozen dataset per rank
- `csoai/hitl-practice-review-queue` — a published practice-data source with historical sample rows. Its original description of 30 PENDING artefacts is not a current live-queue assertion. Practice responses do not establish authenticated human approval or an authorized production effect; verify any current operational state independently via [the HITL endpoint](https://councilof.ai/api/hitl).

## Licence & provenance

- Licence: **CC-BY-4.0**.
- Source: `meok-router/meok-hitl-mooc.mjs` (Council of AI GSPC measurement estate), councilof.ai.
- Splits: `train` only (single JSONL, one record per module item).
- **Measurement, not certification.**

<!-- csoai-card-fixes:start -->

## Citation

```bibtex
@misc{csoai_hitl_academy_orb3_2026,
  title        = {HITL Academy Rank ORB-III — 3-Around-1 Temporal Sentinel},
  author       = {{CSOAI Ltd (Council of AI)}},
  year         = {2026},
  publisher    = {Hugging Face},
  howpublished = {\url{https://huggingface.co/datasets/csoai/hitl-academy-orb3}},
  url          = {https://huggingface.co/datasets/csoai/hitl-academy-orb3}
}
```

<!-- csoai-card-fixes:end -->
