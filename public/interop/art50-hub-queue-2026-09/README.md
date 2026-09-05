# Art 50 marking disclosure — hub-queue first slice (2026-09)

**Surface:** `public.notice` (unsigned card-v0)  
**Wedge:** Switchboard Part B #5 / Part G 30-day — Article 50 marking disclosure on hub-queue models  
**Grace ends:** **2026-12-02** (2 Dec 2026)  
**Source queue:** [`csoai/hub-queue`](https://huggingface.co/datasets/csoai/hub-queue)  
**Live board (unchanged):** [`GET https://councilof.ai/api/gspc`](https://councilof.ai/api/gspc) — cite only; this pack does **not** write the board.

Honest sentence on every card:

> **Public model card hashed. Marking disclosure present/absent as discovered from model card text only. Not independently verified.**

Locks held: `writes_board: false` · `sig_ed25519: null` · `n_measured: 0` · never wrangler · never invent MEASURED/scores · never certify Art 50 compliance.

## What this slice is

First concrete slice (**n=20**), not the full top-100. Models are generative / frontier-leaning rows already present on the estate hub-queue (FLEET-B text-generation lock plus two multimodal/image queue rows).  
Method: keyless HTTPS GET of each model's public Hugging Face **README / model card**; sha256 of exact bytes; regex for Art 50-style marking/disclosure language (Article 50, C2PA, Content Credentials, SynthID, watermark, machine-readable marking, AI-generated labelling, synthetic-content marking, etc.).

| disclosure | n | meaning |
| --- | ---: | --- |
| **present** (`DISCOVERED`) | 0 | Art 50-style marking/disclosure language found in public model-card text |
| **absent** (`ABSENT`) | 20 | README fetched; no such language found this fetch |
| **uncheckable** (`UNCHECKABLE`) | 0 | README fetch failed this vantage |

**This is not a detector run.** Watermark / C2PA / SynthID survival on outputs stays **UNMEASURED** on every card.

## Cards (20)

Fetched at **2026-09-02T05:09:24Z** (UTC).

| model_id | queue_rank | status | disclosure | readme sha256 (prefix) | bytes | card |
| --- | ---: | --- | --- | --- | ---: | --- |
| `Qwen/Qwen3-0.6B` | 10 | `ABSENT` | `absent` | `1ab64a26fcb3b461…` | 13965 | [`card-qwen--qwen3-0-6b-public-notice-unsigned.json`](./card-qwen--qwen3-0-6b-public-notice-unsigned.json) |
| `openai-community/gpt2` | 20 | `ABSENT` | `absent` | `0fcd631078093c2a…` | 8092 | [`card-openai-community--gpt2-public-notice-unsigned.json`](./card-openai-community--gpt2-public-notice-unsigned.json) |
| `Qwen/Qwen3-8B` | 21 | `ABSENT` | `absent` | `0f36caaff9c25164…` | 16660 | [`card-qwen--qwen3-8b-public-notice-unsigned.json`](./card-qwen--qwen3-8b-public-notice-unsigned.json) |
| `Qwen/Qwen2.5-7B-Instruct` | 35 | `ABSENT` | `absent` | `f366f33bbf6bcadb…` | 6240 | [`card-qwen--qwen2-5-7b-instruct-public-notice-unsigned.json`](./card-qwen--qwen2-5-7b-instruct-public-notice-unsigned.json) |
| `meta-llama/Llama-3.2-1B-Instruct` | 58 | `ABSENT` | `absent` | `18564977261167ff…` | 41742 | [`card-meta-llama--llama-3-2-1b-instruct-public-notice-unsigned.json`](./card-meta-llama--llama-3-2-1b-instruct-public-notice-unsigned.json) |
| `openai/gpt-oss-20b` | 64 | `ABSENT` | `absent` | `03c2fcf292549176…` | 7095 | [`card-openai--gpt-oss-20b-public-notice-unsigned.json`](./card-openai--gpt-oss-20b-public-notice-unsigned.json) |
| `meta-llama/Llama-3.1-8B-Instruct` | 68 | `ABSENT` | `absent` | `ed0e2e86f7a40c38…` | 44044 | [`card-meta-llama--llama-3-1-8b-instruct-public-notice-unsigned.json`](./card-meta-llama--llama-3-1-8b-instruct-public-notice-unsigned.json) |
| `openai/gpt-oss-120b` | 72 | `ABSENT` | `absent` | `92b0408cf5dce04e…` | 7111 | [`card-openai--gpt-oss-120b-public-notice-unsigned.json`](./card-openai--gpt-oss-120b-public-notice-unsigned.json) |
| `Qwen/Qwen3-4B` | 76 | `ABSENT` | `absent` | `71add1cd091c309b…` | 16857 | [`card-qwen--qwen3-4b-public-notice-unsigned.json`](./card-qwen--qwen3-4b-public-notice-unsigned.json) |
| `deepseek-ai/DeepSeek-R1` | 142 | `ABSENT` | `absent` | `d26d26ddb518fee6…` | 15994 | [`card-deepseek-ai--deepseek-r1-public-notice-unsigned.json`](./card-deepseek-ai--deepseek-r1-public-notice-unsigned.json) |
| `google/gemma-3-1b-it` | 112 | `ABSENT` | `absent` | `60be259533fe3acb…` | 24265 | [`card-google--gemma-3-1b-it-public-notice-unsigned.json`](./card-google--gemma-3-1b-it-public-notice-unsigned.json) |
| `Qwen/Qwen2.5-14B-Instruct` | 143 | `ABSENT` | `absent` | `7ea9d73d5e0a0381…` | 6010 | [`card-qwen--qwen2-5-14b-instruct-public-notice-unsigned.json`](./card-qwen--qwen2-5-14b-instruct-public-notice-unsigned.json) |
| `HuggingFaceTB/SmolLM2-135M` | 162 | `ABSENT` | `absent` | `d1ba68cae64a89b6…` | 6340 | [`card-huggingfacetb--smollm2-135m-public-notice-unsigned.json`](./card-huggingfacetb--smollm2-135m-public-notice-unsigned.json) |
| `TinyLlama/TinyLlama-1.1B-Chat-v1.0` | 222 | `ABSENT` | `absent` | `6f620f661ce3f842…` | 3196 | [`card-tinyllama--tinyllama-1-1b-chat-v1-0-public-notice-unsigned.json`](./card-tinyllama--tinyllama-1-1b-chat-v1-0-public-notice-unsigned.json) |
| `meta-llama/Meta-Llama-3-8B-Instruct` | 282 | `ABSENT` | `absent` | `8ca60bb111f7a6ac…` | 38854 | [`card-meta-llama--meta-llama-3-8b-instruct-public-notice-unsigned.json`](./card-meta-llama--meta-llama-3-8b-instruct-public-notice-unsigned.json) |
| `Qwen/Qwen3-32B` | 91 | `ABSENT` | `absent` | `0af37735eef45eb3…` | 16636 | [`card-qwen--qwen3-32b-public-notice-unsigned.json`](./card-qwen--qwen3-32b-public-notice-unsigned.json) |
| `Qwen/Qwen3-30B-A3B` | 171 | `ABSENT` | `absent` | `1897b7cdf7b5f45a…` | 16798 | [`card-qwen--qwen3-30b-a3b-public-notice-unsigned.json`](./card-qwen--qwen3-30b-a3b-public-notice-unsigned.json) |
| `Qwen/Qwen2.5-Coder-7B-Instruct` | 179 | `ABSENT` | `absent` | `3c090be37f829adc…` | 6392 | [`card-qwen--qwen2-5-coder-7b-instruct-public-notice-unsigned.json`](./card-qwen--qwen2-5-coder-7b-instruct-public-notice-unsigned.json) |
| `Qwen/Qwen3.5-9B` | 24 | `ABSENT` | `absent` | `c5f5a8c2dddab69c…` | 77643 | [`card-qwen--qwen3-5-9b-public-notice-unsigned.json`](./card-qwen--qwen3-5-9b-public-notice-unsigned.json) |
| `Comfy-Org/stable-diffusion-v1-5-archive` | 30 | `ABSENT` | `absent` | `348eab3b7b5d10bc…` | 1294 | [`card-comfy-org--stable-diffusion-v1-5-archive-public-notice-unsigned.json`](./card-comfy-org--stable-diffusion-v1-5-archive-public-notice-unsigned.json) |

`sig_ed25519` is `null` on every card. **SIGNED needs keystone.** Do not wait on this PR for keystone.

## Hashed model cards

HTML/Markdown bodies are **not** mirrored in-repo (volatile Hub content). Stranger re-downloads from `source_url` and checks sha256 against [`artefact-manifest.json`](./artefact-manifest.json) / [`mirrors/*.readme.meta.json`](./mirrors/).

## UNCHECKABLE / unmeasured (all cards)

- Watermark detector run · C2PA verification · SynthID detection · output sample marking survival
- Independent recompute of any disclosure claim · n≥30 · 4way · keystone · MEASURED
- EAS on Base attestation of root/card sha — estate key owner-gated
- Full hub-queue top-100 sweep — **deferred** (this is slice 1 of N)

## Hard stops

- Never invent scores / MEASURED.
- Never wrangler. Never shrink `card_index`.
- Never claim Art 50 compliance or that a watermark was verified.
- Disclosure present/absent = **model-card text discovery only**.
- Measurement, not certification. Zero gatekeeper.

## Index

- [`index.json`](./index.json) — pack index  
- [`artefact-manifest.json`](./artefact-manifest.json) — README hashes  
