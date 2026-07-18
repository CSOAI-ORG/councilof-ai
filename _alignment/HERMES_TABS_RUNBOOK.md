> **SUPERSEDED ROSTER NOTICE (2026-07-16):** model versions below are one generation old (DeepSeek-V3/Kimi-K2/GLM-4.5). Current-gen canonical roster is in `SOV_FRONTIER_COMPUTE_GATES.md`: Kimi-K2.6 1.059T / DeepSeek-V4-Pro 861B MIT / GLM-5.2 753B MIT / DeepSeek-V4-Flash 158B MIT (1-GPU) / Qwen3.6-35B Apache (1-GPU). Use those. The phases/method below still hold; only the version strings changed.

# HERMES TABS — one tab per model, alongside SOV3 + SOV4 (runs on Nick's Mac)
# For Claude Code. Confirmed HF specs 2026-07-16. Serving = Mac-side (sandbox can't reach Ollama/local ports).

## THE TABS
| Tab | Model | Source | Serve-how | Status |
|---|---|---|---|---|
| SOV3   | Qwen2.5-0.5B + sov3 adapter | local, trained | ollama create sov3 | EXISTS — keep dev |
| SOV4   | governor/router over the experts | sov33.py (117 caps) | governed shim :8802 | EXISTS — keep dev |
| GLM    | GLM-4.5 (358B, MIT) | HF zai-org/GLM-4.5 | vLLM/SGLang, 8-GPU | NEW — start here (smallest+MIT) |
| DeepSeek| DeepSeek-V3 (684B) | HF deepseek-ai/DeepSeek-V3 | vLLM multi-GPU | NEW |
| Kimi   | Kimi-K2 (1.03T) | HF moonshotai/Kimi-K2-Instruct | vLLM multi-node | NEW — biggest, last |

## SERVING SCRIPT (each expert -> OpenAI-compatible endpoint the shim can route to)
```bash
# per expert, on a GPU host (Modal/Lightning/rented node) — NOT the Mac for the big ones
pip install vllm
python -m vllm.entrypoints.openai.api_server \
  --model zai-org/GLM-4.5 \
  --tensor-parallel-size 8 \
  --quantization fp8 \
  --port 8810           # GLM=8810, DeepSeek=8811, Kimi=8812
# the governed shim (sov_openai_shim.py) then routes to these ports through the care-gate + SIGIL
```

## WIRING INTO SOV4 (the governor already exists)
In sov_openai_shim.py MODELS map, add each expert endpoint:
  "sov4-glm":     "http://<glm-host>:8810/v1"
  "sov4-deepseek":"http://<deepseek-host>:8811/v1"
  "sov4-kimi":    "http://<kimi-host>:8812/v1"
SOV4 routes a prompt -> picks expert -> care-gate FLOOR 0.35 -> Ed25519 sign -> return. Already built.

## THE HONEST ORDER (cheapest-provable first — DRUM rule: bank one before next)
1. GLM-4.5 (358B, MIT, smallest) — stand up the tab, prove one governed answer end-to-end. GATE: real prompt -> signed answer.
2. LoRA GLM on the 4,645-example corpus (Science lane, Modal). GATE: tuned > base on held-out.
3. DeepSeek-V3 tab. 4. Kimi-K2 tab (biggest spend, last).
5. SOV4 fuses GLM+DeepSeek — measure fused vs best-single. GATE: fused >= best single, or fusion is decoration (say so).

## LICENSE GATES (before publishing ANY of these)
- GLM-4.5: MIT ✓ (publish OK)
- DeepSeek-V3: license field empty on API — READ the card's LICENSE file before publish.
- Kimi-K2: "other" — READ Moonshot terms before publish.

## STANDING RULES (anti-drift gate — binds Hermes too)
- No tab "done" without a real prompt producing a signed answer (functional test, not "server started").
- Confirm size+license from HF card before spending GPU $.
- Prove GLM (smallest) before DeepSeek/Kimi. No scope-inflation.
