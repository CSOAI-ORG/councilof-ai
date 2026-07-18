# 🖥️ Stand up the sovereign daily-driver — concrete run order (2026-07-14)
_Primary-verified install commands (GitHub READMEs, [P]). Honest hardware tiers up front — because the big
model needs a bigger Mac than the current 16GB one._

## ⚠ Hardware reality first (honest)
- **Current Mac = 16GB** (our own compute-pool note). The DeepSeek-V4-Flash-MLX engine needs **48GB** (built on
  M5 Pro), because dense weights stay resident in RAM while only experts stream from SSD. **Flash (158B) will NOT
  fit on 16GB.** Don't claim it runs on the current machine.
- **What DOES run on 16GB now:** Qwen3-4B / Qwen3-8B (Apache-2.0) via MLX or Ollama — fast, and enough to stand up
  the governed daily-driver + do the merge work. The T-base (Flash/Pro) is a **48GB-Mac or cloud** step.

## TIER A — runnable on the 16GB Mac TODAY (the sovereign daily-driver)
```bash
# 1. Fast local base (Apache-2.0), the small+large reflex/verify tiers
ollama pull qwen3:4b          # small/reflex
ollama pull qwen3:8b          # larger local ceiling on 16GB
# (or MLX: pip install mlx-lm ; python -m mlx_lm.generate --model mlx-community/Qwen3-4B-4bit ...)

# 2. Merge tooling — runs on CPU / low VRAM (our brain-merge laws, for real)
pip install mergekit
#   soup two same-base Qwen3-4B fine-tunes:  mergekit-yaml soup.yml ./merged  (method: linear/ties/dare)
pip install mergenetic       # evolutionary merge-recipe search (our ratio-sweep, at scale) — score vs GSM8K

# 3. Wrap with the sovereign governance (already built, this repo)
#    care-gated-BFT + SIGIL seam + signed memory + OSCAL card around the Ollama/MLX call.
#    (sov33_venturi_throat.py = the verified seam; sov33_governed_robustness_bench.py = the #1 board)
```
**Result today:** a governed local sovereign on Qwen3-4B/8B — real, licensed, care-gated, running on 16GB.

## TIER B — the T-base (needs a 48GB+ Mac OR cloud) [P-verified commands]
```bash
# DeepSeek-V4-Flash on Apple Silicon via SSD expert-streaming (~4.5-5 tok/s on 48GB M-series)
hf download mlx-community/DeepSeek-V4-Flash-4bit --local-dir mlx-ckpt
python oracle/build_dense_companion.py
pip install -r requirements.txt          # from github.com/ssd-moe/deepseek-v4-flash-mlx (MIT engine)
./scripts/serve-http.sh
curl localhost:18091/v1/chat/completions -d '{"model":"deepseek-v4-flash",...}'
```
```bash
# OR MoE-Infinity (GPU + host/SSD offload; DeepSeek-V2/V3/V4-Flash, Qwen3-MoE, Mixtral, GPT-OSS...)
pip install moe-infinity
python - <<'PY'
from moe_infinity import MoE
m = MoE("deepseek-ai/DeepSeek-V4-Flash", {"offload_path":"./offload","device_memory_ratio":0.75})
PY
# OpenAI-compatible server: python -m moe_infinity.entrypoints.openai.api_server_v2 --model <id> --offload-dir ./offload
```

## TIER C — frontier escalation (server / API)
- DeepSeek-V4-Pro (862B) or the 1.6T base → cloud GPU; the mirror-auditor routes only high-divergence items here
  (measured: escalate must be genuinely stronger).

## The honest one-page plan
1. **Today (16GB):** Qwen3-4B/8B + MergeKit + the governance wrapper → a real governed sovereign, now.
2. **48GB Mac or cloud:** DeepSeek-V4-Flash via ssd-moe-mlx or MoE-Infinity → the ~40 tok/s daily driver.
3. **Server:** DeepSeek-V4-Pro/1.6T-base for frontier escalation.
- **Moat at every tier:** care-gated-BFT + SIGIL seam + signed memory + OSCAL. We adopt the base + inference +
  merge; we own the governance.

## Sources [P]
[ssd-moe/deepseek-v4-flash-mlx](https://github.com/ssd-moe/deepseek-v4-flash-mlx) · [MoE-Infinity](https://github.com/EfficientMoE/MoE-Infinity) · [MergeKit](https://github.com/arcee-ai/mergekit) · [Mergenetic](https://arxiv.org/pdf/2505.11427) · HF deepseek-ai model list (V4-Flash 158B / V4-Pro 862B / V4-Pro-Base 1.6T).
