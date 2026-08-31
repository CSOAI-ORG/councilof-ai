---
title: GSPC Node
emoji: 🟩
colorFrom: green
colorTo: gray
sdk: docker
app_port: 7860
pinned: false
license: mit
short_description: GSPC mill node via HF Inference Providers. Not a grade.
---

# GSPC as a Hugging Face inference-style node

Models on the Hub are called:

```
POST https://router.huggingface.co/v1/chat/completions
Authorization: Bearer $HF_INFERENCE_TOKEN
{"model":"Qwen/Qwen3-8B:featherless-ai","messages":[{"role":"user","content":"..."}]}
```

The **benchmark** is called the same way. This Space is the instrument. The subject stays a Hub slug. Weights stay on the Hub.

```
POST https://csoai-gspc-node.hf.space/v1/measure
Authorization: Bearer $HF_INFERENCE_TOKEN
{"model":"Qwen/Qwen3-8B:featherless-ai","axis":"governance","n":10}
```

- `GET /health` — node up. `writes_board: false`.
- `GET /v1/models` — this is an instrument, not a generative model.
- `POST /v1/measure` — practice mill JSON. **n&lt;30 is UNQUOTABLE.** Fail-closed on 403.
- Never writes [GET /api/gspc](https://councilof.ai/api/gspc). A listing is not MEASURED. Payment does not mint MEASURED.
- ZeroGPU is not the fleet. Batch mill is Inference Providers + Hugging Face Jobs.

Ephemeral mill (Jobs), same method:

```
hf jobs run --flavor cpu-basic -s HF_INFERENCE_TOKEN \
  python:3.12 \
  python -c 'print("use scripts/mill_hf_inference.py against router.huggingface.co/v1")'
```
