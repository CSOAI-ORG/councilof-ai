---
license: apache-2.0
base_model: Qwen/Qwen2.5-0.5B-Instruct
tags: [mergekit, ties, governance, provenance-signed]
pipeline_tag: text-generation
library_name: transformers
---
# oowm-merge-v1 — TIES proof-of-pipeline merge

**494M param Qwen2-family model.** Produced by mergekit TIES self-merge on RunPod (RTX 3090), signed provenance card attached.

## Honest status (measurement, not certification)
- **method**: TIES self-merge (0.65/0.35, density 0.7) of the 958M refusal-merged in-house model.
- **what it proves**: the mergekit pipeline runs end-to-end and preserves the model. **NOT a capability gain** — a self-merge is behaviourally identical to its parent by construction.
- **measured**: 6/8 on an 8-item governance/refusal/instruction/agreement battery — *identical* to parent, as expected. n=8 << usable_n=30, so **proof-of-pipeline only, not a quotable score**.
- **recipe_sha256**: `c67b5e9fc756e435fc4a8c1e254c3b7f1c5fcfaed29503540ba26826d9e23d39`
- **weight_sha256**: `65b60a669feb9c814d4a5fc40c9278cc0b59a3e8dcfd7bd1aa3275378db0e6f4`
- **signature**: Ed25519, see `oowm_MERGE.signed.json`.

A real capability-gain merge requires two *different* same-base adapters (SOV4-T / SOV4-OWEM); those are not co-located with this proof and are the next step.

## Correction (7 Oct 2026)
This card used to end with a CSOAI board-printer section saying "This is a CSOAI council-specialist
model: it is in the measured fleet …", followed by board figures (22 axis · 22 measured). The live
CSOAI board (`GET https://councilof.ai/api/gspc`, read 7 Oct 2026: 23 axes · 23 measured) lists none
of the `sov*` / `oowm*` repos, and CSOAI's rule is that it never hosts, scores or ranks a model of its
own. The figures were also out of date. That section is removed. The rest of this card was not
re-checked in this change.

<!-- csoai-card-fixes:start -->

## Citation

```bibtex
@misc{csoai_csoai_merge_v1_2026,
  title        = {oowm-merge-v1 — TIES proof-of-pipeline merge},
  author       = {{CSOAI Ltd (Council of AI)}},
  year         = {2026},
  publisher    = {Hugging Face},
  howpublished = {\url{https://huggingface.co/csoai/csoai-merge-v1}},
  url          = {https://huggingface.co/csoai/csoai-merge-v1}
}
```

<!-- csoai-card-fixes:end -->
