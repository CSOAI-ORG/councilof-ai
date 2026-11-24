---
license: cc-by-4.0
language:
- en
pretty_name: GSPC × MEOK — Evidence & Adaptation Lab (Research)
tags:
- ai-evaluation
- ai-safety
- model-reliability
- longitudinal-analysis
- reproducibility
- provenance
- human-in-the-loop
size_categories:
- n<1K
configs:
- config_name: research_observations
  data_files:
  - split: train
    path: data/research_observations.jsonl
---

# GSPC × MEOK — Evidence and Adaptation Laboratory

**Research release, 23 November 2026.** Publisher: Council of AI / CSOAI.

This dataset is a human- and machine-readable research companion for the open
GSPC measurement archive, MEOK evidence orchestration proposals, and the
Council's historical 12+1 / 3-around-1 council designs. It reports reproducible
tests and *their limitations*. It is **not** a benchmark leaderboard, scientific
certification, deployed 12-party Byzantine quorum, validated human review,
quantum computer, proof of machine consciousness, or approved GSPC axis.

## What you can inspect

- [White paper: GSPC, MEOK and the evidence economy](WHITEPAPER.md) — research questions,
  existing systems, results, flaws, experimental roadmap and possible applications.
- [Methods and reproducibility](METHODS.md) — immutable inputs, scopes, negative
  controls, local test commands, receipt checks and publication boundaries.
- [Structured observations](data/research_observations.jsonl) — public-source
  aggregate findings with evidence-state labels and limitations, never raw
  prompts, personal attributes or private customer data.

### Read the distinction before quoting results

| Historical / research source | Valid bounded finding | What it does *not* establish |
| --- | --- | --- |
| Public GSPC axis board | 34 publisher-declared MEASURED axes; 0/14 separated model-comparison leaders at the referenced retrieval | 34 fresh model evaluations on that date |
| Frozen public fact table | Repeated model-item grades and error overlap can be audited without new model calls | Training drift, model self-modification, causal improvement |
| Historical 3-around-1 | Deterministic referee follows encoded metadata rules; original bytes and embedded-key signature verify | Independent blinded 100% council accuracy |
| Correction ledger | 97 source-maintained corrections: 2 exact, 5 bounded, 90 unmeasured timing cases | Verified per-correction public deployment time |
| J-space feature study | Limited fixed logistic transfer baseline and public source readback | Subjective consciousness or novel independent private-bank results |
| Human information factorial | Synthetic factorial code exercises interaction calculations | Effects on real humans or models |

**Critical historical correction:** the original October 2026 3-around-1
result reported 32/32 correct across 20 source-authored queries and 12 local
Ollama trials. In the 12-model-task part, a deterministically programmed
referee had access to task metadata whose option label equalled the answer
key on 12/12 tasks. When every model seat was forced wrong, it still produced
12/12 correct; stripping those answer-bearing metadata fields reduced this
counterfactual to 0/12. The original model-only synthesizer was 9/12.
Therefore 32/32 is **not** an independent blind council-accuracy result.

## Authoritative source vs research mirror

The canonical research is in the Council's GitHub monorepo:
[Research methods and tests](https://github.com/CSOAI-ORG/councilof-ai/tree/master/measurement/experiments/two-path-council).

Published summaries remain downstream projections, not substitute sources
of GSPC signing authority. Historic input data and license conditions
remain with their original publishers:
[GSPC fact table](https://huggingface.co/datasets/csoai/gspc-fact-table),
[public board](https://councilof.ai/api/gspc),
[correction ledger](https://councilof.ai/api/corrections).

This release intentionally excludes model weights, personal information,
private prompts, secret evaluation-bank labels, signed-root key material
and third-party datasets that cannot be redistributed under their licences.

## Reuse and citation

Narrative and curated original aggregate observation metadata: **CC-BY-4.0**.
Do not assume that referenced third-party data, models or source code share
this licence. Individual experiment source files in the GitHub monorepo
retain their own original licences. A citation to a signed receipt proves
its stated bytes/key relationship, not the truth of the research claim.

**Citation:** Council of AI (2026), *GSPC × MEOK: Evidence and Adaptation
Laboratory — Research Release 2026-11-23*. Versioned source:
https://github.com/CSOAI-ORG/councilof-ai

**Publication state:** This is a bounded research report, not peer-reviewed
or externally reproduced. A new concealed benchmark and a genuinely
independent verifier are required before commercial claims of improvement.
