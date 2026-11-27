---
license: apache-2.0
base_model: Qwen/Qwen2.5-0.5B-Instruct
base_model_relation: quantized
model_name: Qwen2.5-0.5B-Instruct-Q4_K_M (stock; repo name sov-compliance-art5)
library_name: gguf
pipeline_tag: text-generation
tags:
- qwen2.5
- gguf
- q4_k_m
- unmodified-weights
---

# Qwen2.5-0.5B-Instruct, Q4_K_M, stock weights (repo name: `sov-compliance-art5`)

> **Correction (29 Sep 2026):** these weights are byte-identical to stock Qwen2.5-0.5B-Instruct, Q4_K_M, as distributed by Ollama as `qwen2.5:0.5b` (sha256 `c5396e06af294bd101b30dce59131a76d2b773e76950acc870eda801d3ab0515`); no fine-tuning was applied. Behaviour differences, if any, come from a system prompt. Earlier text claiming fine-tuning was incorrect. The `f16` in the file name is also wrong: the file is the Q4_K_M quantisation (397,807,936 bytes).
> How this was found: a byte comparison on 28 Sep 2026 of this repo's LFS sha256 against the Ollama registry manifest digest for the stock model. Ledger entry: C-2026-0929-01.

> **Correction (7 Oct 2026):** the lower part of this card still called this file "a CSOAI
> council-specialist model … in the measured fleet", printed CSOAI board figures, and was tagged
> `gspc`, `measurement`, `csoai`, `eu-ai-act` and `art5`. It is stock Qwen weights with no
> Article 5 specialisation. The live CSOAI board (`GET https://councilof.ai/api/gspc`, read
> 7 Oct 2026) lists none of the `sov*` repos, and the figures printed here (22·22) were out of
> date. The sentence, the board blocks and those tags are removed.

## What it is
- A copy of the stock `qwen2.5:0.5b` GGUF weights (Qwen2.5-0.5B-Instruct, Q4_K_M,
  397,807,936 bytes). The same bytes are published in `csoai/sov-ethics-art5`; the two repos differ only
  in name and card.
- **No fine-tune, no merge, no training of any kind.** It is not trained or tuned for EU AI Act
  Article 5 compliance work; the repo name is a label, not a capability.
- **No prompt overlay ships here.** Any compliance-specific framing would come only from a system
  prompt supplied at run time.
- Earlier metadata named the base as Qwen2-0.5B / f16 / transformers; all three were wrong.

## Measured
**Nothing quotable.** UNMEASURED: no benchmark result for this file is published. Any result
obtained with these bytes is a result for stock Qwen2.5-0.5B-Instruct, and should be reported
under that name.

## Licence and attribution
The weights are Qwen2.5-0.5B-Instruct by the Qwen team, Alibaba Cloud, in the Q4_K_M GGUF
quantisation distributed by Ollama as `qwen2.5:0.5b`. They are licensed under the Apache
License, Version 2.0 (https://www.apache.org/licenses/LICENSE-2.0; upstream licence file
https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct/blob/main/LICENSE). Copyright belongs to the
original authors; no modification was made to the weights.

## Relationship to CSOAI
CSOAI's rule is that it measures other people's models and never hosts, scores or ranks a model
of its own. This repo holds unmodified third-party weights, is not a CSOAI measurement subject,
and carries no CSOAI score. It still sits under the `csoai` namespace; moving the `sov*` repos out
of it is an open item.

<!-- csoai-card-fixes:start -->

## Limitations

**Measurement is not certification.** Any scores referenced here are measurements recorded by Council of AI (CSOAI Ltd) under the stated method and date. They are not a certification, safety guarantee, conformity assessment or legal determination (including under the EU AI Act). Check the base model's own licence and use policy before deployment.

## Citation

```bibtex
@misc{csoai_csoai_compliance_art5_2026,
  title        = {Qwen2.5-0.5B-Instruct, Q4KM, stock weights},
  author       = {{CSOAI Ltd (Council of AI)}},
  year         = {2026},
  publisher    = {Hugging Face},
  howpublished = {\url{https://huggingface.co/csoai/csoai-compliance-art5}},
  url          = {https://huggingface.co/csoai/csoai-compliance-art5}
}
```

<!-- csoai-card-fixes:end -->
