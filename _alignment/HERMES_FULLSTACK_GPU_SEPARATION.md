# HERMES FULL-STACK — GPU separation so the Mac is NEVER eaten by large models
# Principle: each large model runs on its OWN remote GPU endpoint. Mac runs only light orchestration.

## THE LAYERS (who runs WHERE — this is the whole point)
| Layer | Runs on | Load | Why |
|---|---|---|---|
| SOV4 router / governed shim | **Mac** (localhost:8802) | tiny (routing + care-gate + sign) | must be local, near-zero GPU |
| SOV3 (0.5B student) | **Mac** (ollama) | ~1GB | small enough for Mac, fine |
| GLM-5.2 / DeepSeek-V4 / Kimi-K2.6 | **remote GPU, one each** | 5-7 GPU each | NEVER on Mac — this is what was eating it |
| DeepSeek-V4-Flash (158B) / Qwen3.6-35B | **remote, 1 GPU each** | 1 GPU | cheap frontier-family, own GPU |

## THE FIX — each large model = its OWN endpoint the shim CALLS (not hosts)
The Mac's shim does NOT load large weights. It makes an HTTP call to a remote endpoint that holds them:
```
Mac shim (:8802)  --HTTP-->  GLM endpoint    (remote GPU host A, :8810)
                  --HTTP-->  DeepSeek endpoint(remote GPU host B, :8811)
                  --HTTP-->  Kimi endpoint    (remote GPU host C, :8812)
                  --local-->  SOV3 ollama     (Mac, small, fine)
```
Result: three big models run on three separate remote GPUs. Mac stays cool. No GPU eaten locally.

## TWO WAYS to give each large model its own GPU (pick per budget)
### OPTION A — CALL hosted APIs (zero GPU rental, per-token) — RECOMMENDED START
  Each frontier model is already hosted by its lab / NVIDIA NIM. The shim just needs the endpoint URL+key:
    GLM-5.2      -> zhipu API  or nvidia NIM
    DeepSeek-V4  -> deepseek API or nvidia NIM
    Kimi-K2.6    -> moonshot API or nvidia NIM
  Setup = add {name: url, key} to the shim's MODELS map. NO GPU, NO SSH, NO server admin. Mac untouched.
  This is the honest fastest "each on its own GPU" — someone else's GPU, you pay per token.

### OPTION B — HOST each on your own rented GPU (Modal/Lightning), one model per GPU node
  For when you want to own/LoRA the weights. Each model gets a dedicated Modal GPU service:
    modal serve glm_endpoint.py      # GLM on its own node
    modal serve deepseek_endpoint.py # DeepSeek on its own node
    modal serve kimi_endpoint.py     # Kimi on its own node
  Each exposes an OpenAI-compatible URL the Mac shim calls. Still: Mac untouched, each model isolated on its GPU.
  SSH note: your micro SSH boxes CANNOT host these (1-2GB RAM). SSH is only for coordinating, not serving large weights.

## WHY SSH-SPREAD ISN'T THE ANSWER (honest)
"Spread one big model across SSH boxes" needs NVLink/InfiniBand-class interconnect. Normal SSH network is
1000x too slow — the model would crawl. The right pattern is ONE model = ONE GPU node (Option A rented-free
via API, or Option B one Modal node each), NOT one model smeared across many small boxes.

## SETUP CHECKLIST (Hermes runs on Mac)
1. Shim MODELS map: add remote endpoint URL+key per large model (Option A) — Mac calls out, holds nothing.
2. SOV3 stays local ollama (small, fine).
3. SOV4 router picks which endpoint per prompt -> care-gate -> sign. Already built.
4. GATE: send one prompt per tab, confirm it routes to the REMOTE endpoint (check Mac GPU stays idle).

## STANDING
- Mac never loads a >10GB model. If a tab tries, it's misconfigured — route it remote.
- Option A (API) first (no spend, no admin). Option B (Modal host) only when owning/LoRA-ing weights.
- Confirm each endpoint answers before calling a tab "working" (functional test, not "configured").
