---
license: llama3.2
license_name: llama3.2
license_link: LICENSE
base_model: meta-llama/Llama-3.2-3B-Instruct
base_model_relation: quantized
model_name: Llama-3.2-3B-Instruct-Q4_K_M (stock; repo name sov33-unified)
library_name: ollama
tags:
- llama
- llama-3.2
- gguf
- q4_k_m
- unmodified-weights
pipeline_tag: text-generation
---

# Llama 3.2 3B Instruct, Q4_K_M, stock weights (repo name: `sov33-unified`)

**Built with Llama.**

> **Correction (29 Sep 2026):** these weights are byte-identical to stock Llama 3.2 3B Instruct, Q4_K_M, as distributed by Ollama as `llama3.2:3b` (sha256 `dde5aa3fc5ffc17176b5e8bdc82f587b24b2678c6c66101bf7da77af9f7ccdff`); no fine-tuning was applied. Behaviour differences, if any, come from a system prompt. Earlier text claiming fine-tuning was incorrect.
> How this was found: a byte comparison on 28 Sep 2026 of this repo's LFS sha256 against the Ollama registry manifest digest for the stock model. Ledger entry: C-2026-0929-01.

> **Correction (7 Oct 2026):** the lower part of this card still called this file "a CSOAI
> council-specialist model … in the measured fleet" and printed CSOAI board figures. It is stock
> Meta weights, not a specialist model of anyone's. The live CSOAI board
> (`GET https://councilof.ai/api/gspc`, read 7 Oct 2026) lists none of the `sov*` repos, and the
> figures printed here (22·22) were out of date. The sentence and the board blocks are removed.
> The title now begins with "Llama", a `NOTICE` file carries the attribution text from §1.b.iii of
> the licence, and `LICENSE` / `USE_POLICY.md` are now byte-identical to Meta's published files
> (below).

## What it is
- A copy of the stock `llama3.2:3b` GGUF weights (Meta Llama 3.2 3B Instruct, Q4_K_M,
  2,019,377,376 bytes, sha256 `dde5aa3fc5ffc17176b5e8bdc82f587b24b2678c6c66101bf7da77af9f7ccdff`).
- **No fine-tune, no merge, no training of any kind.** The repo name `sov33-unified` is a label,
  not a different model.
- **No prompt overlay ships here.** Any estate-specific behaviour would come only from a system
  prompt supplied at run time. No Modelfile is included.

## Measured
**Nothing quotable.** UNMEASURED: no benchmark result for this file is published. The accuracy,
token-efficiency and "won 7 contexts" figures once shown here were never tied to a published run
and were removed on 29 Sep 2026. Any result obtained with these bytes is a result for stock
Llama 3.2 3B Instruct, and should be reported under that name.

## Usage (ollama)
```
ollama create sov33-unified -f Modelfile   # Modelfile: FROM ./sov33-unified.gguf
ollama run sov33-unified
```
This is equivalent to `ollama pull llama3.2:3b`.

## Licence and attribution
- **Built with Llama.** Llama 3.2 is licensed under the Llama 3.2 Community License, Copyright ©
  Meta Platforms, Inc. All Rights Reserved. (This attribution notice is also in `NOTICE`.)
- `LICENSE` is the Llama 3.2 Community License Agreement, a byte-identical copy of
  https://github.com/meta-llama/llama-models/blob/main/models/llama3_2/LICENSE
  (sha256 `8cc15535a8a34b41888f644b339a1a9eb428af793a4f5e24df58a3e5b1487d74`), provided as
  §1.b.i(A) requires.
- Use is subject to the Llama 3.2 Acceptable Use Policy: `USE_POLICY.md`, a byte-identical copy
  of https://github.com/meta-llama/llama-models/blob/main/models/llama3_2/USE_POLICY.md
  (sha256 `40e2777d7faa6beaf98400654170f414d8ab29b921b5163ad4ea0a1d39894201`), also at
  https://www.llama.com/llama3_2/use-policy.
- Upstream: https://huggingface.co/meta-llama/Llama-3.2-3B-Instruct.

## Relationship to CSOAI
CSOAI's rule is that it measures other people's models and never hosts, scores or ranks a model
of its own. This repo holds unmodified third-party weights, is not a CSOAI measurement subject,
and carries no CSOAI score. It still sits under the `csoai` namespace; moving the `sov*` repos out
of it is an open item.

## Measured (2 Nov 2026) — first published measurement
Governance axis (EU AI Act 4-tier classification), `csoai/gspc-gov` (public, CC-BY-4.0), n=100, temperature 0, serialized local Ollama:

- **Free-text prompting: 0/100 parsable labels.** The stock weights do not follow a label-only instruction — this is why no result was previously quotable, and this card stays true to that.
- **With decoder-level constrained output** (JSON schema restricted to the four labels): **13.0% correct, 4 labels used, 0 unparsed.** Majority-class baseline on the same items: 29.0%.
- **Verdict: below baseline. These stock weights carry no governance skill.** Any stronger number seen elsewhere belongs to a prompt-overlay or trained build, never to this file.

Method record: `meok.measurement/0.2`, run 2026-11-02T05:25Z, Ed25519-signed with items digest (per-item rows retained). Measurement, not certification — and it applies to our own artifacts first.

<!-- csoai-card-fixes:start -->

## Citation

```bibtex
@misc{csoai_csoai_unified_33_2026,
  title        = {Llama 3.2 3B Instruct, Q4KM, stock weights},
  author       = {{CSOAI Ltd (Council of AI)}},
  year         = {2026},
  publisher    = {Hugging Face},
  howpublished = {\url{https://huggingface.co/csoai/csoai-unified-33}},
  url          = {https://huggingface.co/csoai/csoai-unified-33}
}
```

<!-- csoai-card-fixes:end -->
