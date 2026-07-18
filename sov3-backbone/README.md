# SOV3 Sovereign Backbone (scaffold)

Local-model backbone + model-agnostic router. **No weights are downloaded by this
scaffold.** The ~80GB DeepSeek-V4-Flash pull is double-gated and waits on Nick's go.

## Files
- `serve_backbone.sh` — builds llama.cpp, (gated) downloads `deepseek-ai/DeepSeek-V4-Flash`
  (MIT), converts to GGUF, quantizes **Q4_K_M**, serves an OpenAI-compatible `/v1`
  endpoint on `127.0.0.1:8080`.
- `router.py` — routes across three backends:
  - **sovereign-OFFLINE tier:** DeepSeek-V4-Flash (local, MIT) + Nemotron-3-Ultra
    (cloud, OpenMDW-1.1). Used when a request is flagged sovereign/offline or local
    is forced.
  - **council brain (DEFAULT):** Claude Opus 4.8 — the app's default brain.

## The gated download (run only when Nick says GO)
The download is guarded TWO ways so it cannot fire accidentally:
1. set the env flag, and
2. uncomment the download line inside `serve_backbone.sh`.

```bash
# 1. permit + build llama.cpp
export SOV3_ALLOW_DOWNLOAD=1
export SOV3_BUILD_LLAMA=1

# 2. in serve_backbone.sh, uncomment this single line:
#    huggingface-cli download "$MODEL_REPO" --local-dir "$HF_DIR" --local-dir-use-symlinks False

# 3. run (on a box with >=200GB free + >=64GB RAM/VRAM — NOT the 16GB laptop):
bash serve_backbone.sh
```

The raw `huggingface-cli` line, for reference:
```bash
huggingface-cli download deepseek-ai/DeepSeek-V4-Flash \
  --local-dir "$HOME/sov3-models/DeepSeek-V4-Flash-hf" \
  --local-dir-use-symlinks False
```

## Disk / hardware notes
- Peak transient disk during convert+quantize: **~200GB** (80 raw + 80 f16 + 45 Q4).
- Steady-state to serve: **~45GB** (the Q4_K_M GGUF only).
- Inference RAM/VRAM: **>= ~45GB** + KV-cache headroom.
- **Current M4 laptop = 16GB RAM, ~6.5GB free disk → cannot do this.** Use a rented
  GPU (1xH100/A100 80GB) or a >=64GB-unified Mac with a >=250GB external NVMe for
  staging. Only the ~45GB Q4 GGUF needs to travel after it is produced once.

## Next step (documented, not built): sleep-time compute
Letta's **"sleep-time compute"** (Lin et al., 2025, arXiv:2504.13171) — the agent
spends idle/offline cycles pre-computing and reorganizing memory/context so that
online queries are answered faster and cheaper. This is a real, citable paper, and
it is the natural enhancement for **`living_daemon.py`**, which already runs a
SCAN → HUNT → SYNTHESIZE → ORCHESTRATE loop on a heartbeat/cron.

- Existing daemon: `/Users/nicholas/Documents/kimi/workspace/ecosystem_living/living_daemon.py`
  (loop over `blocker_radar` / `research_hunter` / `synthesis_engine` / `hive_orchestrator`).
- Wiring idea: route the daemon's idle synthesis passes to the **sovereign-offline
  tier** (local DeepSeek / Nemotron) via `router.py` so sleep-time compute is free
  and on-sovereign-infra, reserving the Claude council brain for live requests.

## Explicitly DROPPED
- **anima-kernel / Φ "consciousness measurement"** — fake package. NOT scaffolded,
  not a dependency, no placeholder. Do not reintroduce.
