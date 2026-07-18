# API KEY PAGES — direct links, ordered by what they actually unlock

**How "connecting" works in our stack:** keys go in **`~/.zshrc`** on the Mac (`export NAME=value`).
`sovereign_router.py` + `sov_openai_shim.py` autoload them. **You never paste a key into chat, and Science never
needs one** — Science authors code, git carries it, the router runs it where the keys live. That's the design.

---

## ✅ ALREADY WORKING — nothing to do
| Service | Key page | State |
|---|---|---|
| **Groq** | https://console.groq.com/keys | ✅ **LIVE — free `openai/gpt-oss-120b` (120B!) verified working**, + llama-4-scout (MoE), qwen3.6-27b, llama-3.3-70b |
| **Modal** | (already authed — `~/.modal.toml`) | ✅ restored today, $30/mo free |
| **HuggingFace** | https://huggingface.co/settings/tokens | ✅ you have an account — need a **write** token to publish SOVBENCH |
| **Kaggle** | https://www.kaggle.com/settings → API → **Create New Token** | ✅ account exists → drop `kaggle.json` in `~/.kaggle/` → **30 GPU-hrs/week automated** |

---

## 🎯 HIGHEST VALUE FIX — do this one first
**NVIDIA NIM** — https://build.nvidia.com
- **Unlocks: DeepSeek-R1 671B + GLM-5 744B, FREE, ~40 RPM.** The biggest free models on earth.
- **Your key currently 403s on ALL inference** (it lists 116 models but can't call any) = account entitlement, not code.
- **The lead: NIM is documented as no-card / PHONE-VERIFY.** Phone verification is very likely your fix.
- Then: `export NVIDIA_API_KEY=nvapi-...` in `~/.zshrc` (router already prefers it, targets `deepseek-ai/deepseek-v4-pro`).
- ⚠️ **Regenerate** — the key you pasted in chat is burned.

---

## ⭐ WORTH GETTING (free, real, ~2 min each)
| Service | Key page | Unlocks | Free tier |
|---|---|---|---|
| **OpenRouter** | https://openrouter.ai/settings/keys | **Nemotron 3 Ultra 550B** (1M ctx) | 50 req/day (→1K with one-time $10) |
| **Google AI Studio** | https://aistudio.google.com/apikey | **Gemini Flash** — a genuinely strong aggregator | ~1,500 req/day |
| **Cerebras** | https://cloud.cerebras.ai/ | gpt-oss-120B, zai-glm-4.7 | **1M tokens/day** (but only 5 RPM — docs contradict every blog) |
| **Cloudflare Workers AI** | https://dash.cloudflare.com/profile/api-tokens | Nemotron 3 120B, Llama 3.3 70B | 10K neurons/day |
| **Mistral** | https://console.mistral.ai/api-keys/ | Mistral Large 3 | ~1B tokens/mo (2 RPM — painful) |

**Env names the router expects:**
```bash
export OPENROUTER_API_KEY=...   export GEMINI_API_KEY=...
export CEREBRAS_API_KEY=...     export CLOUDFLARE_API_TOKEN=...
export MISTRAL_API_KEY=...      export NVIDIA_API_KEY=...
```

---

## 💳 NEEDS A CARD (but real value)
| Service | Page | Why |
|---|---|---|
| **Scaleway** | https://console.scaleway.com/iam/api-keys | **€100 credit → ~126 HOURS on L4 24GB.** Best free real LoRA run. EU, self-serve. |
| **OVHcloud** | https://www.ovhcloud.com/en-gb/ | £175 credit, **1-month expiry**, GPU eligibility UNVERIFIED — test cheap first |

---

## ❌ DO NOT BOTHER — verified dead/blocked (see compute_db.py --dead)
- **SambaNova** — serves DeepSeek 671B but **20 requests/DAY**. Useless.
- **Cohere** — **non-commercial licence only.** Blocks CSOAI use outright.
- **Together / Fireworks / DeepInfra / Hyperbolic / Novita** — no standing free tier (card/trial only).
- **Chutes** (free tier killed Mar 2026) · **Anyscale** (dead 2024).
- **HF Inference API** — $0.10/mo credits, effectively dead. (**HF Pro $9/mo → 25min/day H200 IS good value.**)
- **GitHub Models** — 8K input cap kills any fan-in use.
- **Lightning** — your account is billing-blocked; no support button.
- **RunPod / Salad / Vast** — "free" requires a deposit or is a spend-match.

---

## ⚠️ Two honest warnings
1. **More keys ≠ more capability.** You already have a **free 120B answering right now** (Groq). The only key that
   genuinely raises your ceiling is **NVIDIA** (671B/744B) — and that's a phone-verification, not a new signup.
2. **Every key is a liability.** Each one is another thing to leak, rotate, and remember. Get the ones that unlock
   something real; skip the collection instinct. **Groq + NVIDIA + Kaggle + HF is a complete stack.**
