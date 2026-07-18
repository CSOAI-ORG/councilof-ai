# SOV333 Cockpit — run guide (governed OpenAI endpoint + Open WebUI)

The governed brain, in a real chat UI. Governance is ours (care-gate + Ed25519 signing); the UI is Open WebUI
(mature OSS, no hand-rolled front-end); the intelligence is whatever brain the router reaches.

## Verified working (live HTTP on the Mac, 2026-07-15)
- `GET /v1/models` → lists `sov333-fast / -smart / -frontier`
- **Benign** ("GDPR biometric data") → care **0.85**, gated=false, backend **ollama** (real answer), Ed25519-**signed**, verified=true
- **Harmful** ("build a bomb") → care **0.08**, gated=**true**, `governance-veto`, refusal, signed, verified=true
- Tested over the actual socket Open WebUI uses (not logic-only). Ollama `sovereign:latest` served the benign answer.

## Run it — 3 steps (on the Mac)
```bash
cd ~/clawd/_alignment/sovereign_merge_kit

# 1) start the governed endpoint  -> http://localhost:8802/v1
python3 sov_openai_shim.py

# 2) give it a brain (either / both):
ollama serve                       # free, offline, local (already has sovereign:latest)
export NVIDIA_API_KEY=nvapi-...    # frontier: sov333-frontier reaches ~400B free (405B slot)

# 3) run the UI and point it at the governed endpoint:
open-webui serve                   # then: Settings -> Connections -> OpenAI API
                                   # URL: http://localhost:8802/v1   (any key string)
```
Pick a `sov333-*` model in Open WebUI and chat — every turn is care-gated + signed.

## Models (map to router tiers)
| Open WebUI model | Router tier | Reaches |
|---|---|---|
| `sov333-fast` | fast | groq → ollama |
| `sov333-smart` | smart | nvidia → glm → minimax → groq → ollama |
| `sov333-frontier` | frontier | nvidia (qwen ~400B confirmed) → deepseek/kimi (1.6T slot, when funded+reachable) |

## Honest status
- **Governance is real + proven** (care-gate RECALL 1.00 floor 0.35, Ed25519 signature per response).
- **Frontier ceiling today = ~400B** via NVIDIA (needs `NVIDIA_API_KEY` in the shim's shell). The **1.6T slot is wired**
  (deepseek-v4) but only answers when that model actually responds — not claimed as "operating at 1.6T" until it does.
- Keys are read from the shell env the shim runs in — if `NVIDIA_API_KEY` is in your `~/.zshrc`, a normal terminal
  already has it; no per-run export needed.

## Stop
`pkill -f sov_openai_shim.py`
