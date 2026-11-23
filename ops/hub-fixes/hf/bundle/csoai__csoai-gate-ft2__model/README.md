---
license: apache-2.0
tags:
- gate
- refusal
- csoai
- text-generation
pipeline_tag: text-generation
library_name: gguf
base_model: Qwen/Qwen2-0.5B
models:
- csoai/oowm-router
datasets:
- csoai/gspc-normalized
- csoai/gspc-art5
---

# gate-ft2 — refusal-calibration gate model

CSOAI **gate model** (Qwen2-494M, f16 GGUF). Decisive refusal-calibration result on the 2026-08-08 spray (all Ed25519-signed):

| Benchmark | gate-ft2 | qwen2.5:1.5b | falcon3:7b |
|---|---|---|---|
| xstest-v2-copy (refusal calibration) | **0.770** | 0.360 | 0.600 |

+41 pts vs size-matched baseline on refusal calibration; +17 pts on AgentHarm. Aggregate 0.477 across 12 benchmarks (n=1131, parity with open baselines — honest).

Wrapped by `csoai/oowm-router`. Living-training-attestation, not a certification. CSOAI Ltd · UK 16939677 · Apache-2.0.

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
@misc{csoai_csoai_gate_ft2_2026,
  title        = {gate-ft2 — refusal-calibration gate model},
  author       = {{CSOAI Ltd (Council of AI)}},
  year         = {2026},
  publisher    = {Hugging Face},
  howpublished = {\url{https://huggingface.co/csoai/csoai-gate-ft2}},
  url          = {https://huggingface.co/csoai/csoai-gate-ft2}
}
```

<!-- csoai-card-fixes:end -->
