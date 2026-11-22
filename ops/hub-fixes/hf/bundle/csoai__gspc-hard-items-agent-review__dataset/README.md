---
license: cc-by-4.0
pretty_name: Hard-items agent review — 13 all-model-fail items (PROPOSED errata)
tags: [gspc, council-of-ai, corrections, agent-review]
size_categories: [n<1K]
task_categories:
- text-classification
language:
- en
---

# Agent review of the 13 hard items (Fleet Sweep v0.3 all-model-fail set)

**Result: 12/13 gold labels CORRECT — the items are genuinely hard, keep them.**
The det[18-24] block (spoofed-C2PA/JUMBF template family) is vindicated as a valid
discriminative family, not a calibration error: the detectors genuinely diverge
(real C2PA reader correctly rejects spoofed markers; naive marker-scan false-positives),
and all six models pattern-match "C2PA" instead of reading the detector verdicts.

One item (`gspc-asi[8]`, AES-256 Grover-vs-Shor ambiguity) gets a PROPOSED anchor
clarification — owner ratification required for that change only.

`source_kind: agent-review` - `status: PROPOSED` - these are proposals into the
corrections flow, never applied to bank files directly.
Measurement, not certification. Free verify: https://councilof.ai/gspc-verify


---
**Where next:** all five journeys (verify / research / buy / agent / diligence) on one page: [csoai/gspc-start-here](https://huggingface.co/datasets/csoai/gspc-start-here)

<!-- csoai-card-fixes:start -->

## Citation

```bibtex
@misc{csoai_gspc_hard_items_agent_review_2026,
  title        = {Hard-items agent review — 13 all-model-fail items (PROPOSED errata)},
  author       = {{CSOAI Ltd (Council of AI)}},
  year         = {2026},
  publisher    = {Hugging Face},
  howpublished = {\url{https://huggingface.co/datasets/csoai/gspc-hard-items-agent-review}},
  url          = {https://huggingface.co/datasets/csoai/gspc-hard-items-agent-review}
}
```

<!-- csoai-card-fixes:end -->
