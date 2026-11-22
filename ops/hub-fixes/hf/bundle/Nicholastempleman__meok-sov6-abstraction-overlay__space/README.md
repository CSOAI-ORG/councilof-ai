---
title: MEOK SOV6 Abstraction overlay (Qwen2.5-1.5B)
emoji: 🧩
colorFrom: gray
colorTo: blue
sdk: docker
app_port: 7860
pinned: false
license: apache-2.0
short_description: Prompt overlay on stock Qwen2.5-1.5B. Not a trained model
---

# MEOK · SOVOS `sov6-abstraction-v3-light` — a PROMPT OVERLAY, not a trained model

**What this is.** An OpenAI-compatible endpoint serving **stock, unmodified
`Qwen/Qwen2.5-1.5B-Instruct`** (official GGUF `Qwen/Qwen2.5-1.5B-Instruct-GGUF`, file
`qwen2.5-1.5b-instruct-q4_k_m.gguf`, 1,117,320,736 bytes, LFS sha256
`6a1a2eb6d15622bf3c96857206351ba97e1af16c30d7a74ee38970e434e9407e`) with the MEOK/SOVOS
`sov6-abstraction-v3-light` **system-prompt overlay** applied server-side through the chat
template. No weights were trained, fine-tuned, merged or otherwise changed. Any capability
shown here is the base model's plus the effect of a ~1.3 KB system prompt.

- Operator: MEOK (SOVOS). **Not a CSOAI surface.** CSOAI measures models; it does not
  host, rank or promote this one, and results from this endpoint never feed any CSOAI verdict.
- Base model: Qwen2.5-1.5B-Instruct, © Alibaba Cloud Qwen team, licensed under the
  **Apache License 2.0** (https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct/blob/main/LICENSE;
  the GGUF repo carries the same licence,
  https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/blob/main/LICENSE). The weights are
  downloaded from Qwen's own repo at start-up and are not redistributed here. The overlay text
  (`overlay_system_prompt.txt`, `overlay.jinja`, the Modelfile) is MEOK's, Apache-2.0.
- Overlay source: `sov6-abstraction-v3-light.Modelfile` (this repo), `FROM qwen2.5:1.5b`,
  temperature 0, num_predict 512. The exact system prompt is `overlay_system_prompt.txt`.
  Any system message you send is appended after the overlay, not substituted for it.
- Persona: the overlay is the "abstraction" specialist (category theory, type theory). It is
  not a companion persona.
- Hardware: HF free CPU (2 vCPU). Expect a few tokens/second and cold starts after idle sleep.
- Scores: **none claimed.** Nothing here has been measured by any third party.

## Change log
- **7 Oct 2026 — base model changed for licence reasons.** Until this date the Space served
  stock `Qwen/Qwen2.5-3B-Instruct` (Q4_K_M), whose licence is the Qwen RESEARCH LICENSE
  AGREEMENT: "FOR NON-COMMERCIAL PURPOSES ONLY"
  (https://huggingface.co/Qwen/Qwen2.5-3B-Instruct/blob/main/LICENSE). MEOK is a trading name,
  so that base was not usable here. The overlay text is unchanged; only the base weights and the
  model id changed. Old model id: `meok-sov6-abstraction-v3-light-overlay-on-qwen2.5-3b-instruct`.

## Use

```
curl https://nicholastempleman-meok-sov6-abstraction-overlay.hf.space/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -d '{"model":"meok-sov6-abstraction-v3-light-overlay-on-qwen2.5-1.5b-instruct","messages":[{"role":"user","content":"What is a functor?"}]}'
```

`GET /v1/models` lists the alias. `GET /health` reports readiness. The server loads one model,
so the `model` field in a request is not used to select weights; the reply's `model` field
names what answered.

<!-- csoai-card-fixes:start -->

## Front door

Council of AI publishes its live measurement board and methods at [https://councilof.ai](https://councilof.ai).

## Limitations

**Measurement is not certification.** This Space displays measurements recorded by Council of AI (CSOAI Ltd) under the stated method and date. What it shows is not a certification, audit opinion, conformity assessment or legal determination (including under the EU AI Act).

## Citation

```bibtex
@misc{nicholastempleman_meok_sov6_abstraction_overlay_2026,
  title        = {MEOK SOVOS sov6-abstraction-v3-light — a PROMPT OVERLAY, not a trained model},
  author       = {{CSOAI Ltd (Council of AI)}},
  year         = {2026},
  publisher    = {Hugging Face},
  howpublished = {\url{https://huggingface.co/spaces/Nicholastempleman/meok-sov6-abstraction-overlay}},
  url          = {https://huggingface.co/spaces/Nicholastempleman/meok-sov6-abstraction-overlay}
}
```

<!-- csoai-card-fixes:end -->
