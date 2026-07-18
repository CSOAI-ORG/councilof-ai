# FREE COMPUTE REGISTRY — verified 2026-07-17 (CC lane, 3 parallel sweeps)

**~70 catalogued. ~30 genuinely usable.** Every entry marked ✅ works / ⚠️ caveat / ❌ dead-or-gated.
Not padded to 100 — a dead link costs a wasted morning. This is what *actually* works.

## 🏆 THE HEADLINE — apply this week
**[UKRI AIRR Rapid Access](https://www.ukri.org/opportunity/isambard-ai-and-dawn-airr-supercomputers-rapid-access-route/)
— 20,000 GH200 GPU hours, FREE.** Eligibility: **UK-registered SME with a Companies House number.** No VC, no
academic affiliation, no equity. Open rolling, ~2 weeks, light-touch. **CSOAI Ltd qualifies exactly.**
This single item outvalues every hyperscaler credit tier combined. 3-month use window is the only constraint.

## 1. FREE GPU FOR TRAINING (LoRA/QLoRA 7B–14B)
| Platform | Real allowance | Card? | 7-14B? |
|---|---|---|---|
| ✅ **Kaggle** | **30 GPU-hr/WEEK**, T4×2 or P100, 9–12h sessions, background exec | No | **Best free option** |
| ✅ **Modal** | **$30/mo recurring** ≈ 12h A100-80GB / 51h T4 | No | **Yes — our proven substrate** |
| ✅ **Lightning** | 15 credits/mo = 10h A100-40GB (⚠️ "80 free hrs" is T4-only marketing) | No | Yes, 4h session cap |
| ⚠️ **Colab** | T4, ~12h session, **quota unpublished** | No | 7B yes, 14B marginal |
| ⚠️ **Intel Tiber** | free Gaudi2/Max JupyterLab, **no card** | **No** | Maybe (Optimum-Habana, not CUDA) |
| ⚠️ **Beam** | $30/mo claimed (**UNVERIFIED** — page now shows only Team $89) | Likely no | Yes if real |
| ⚠️ **TPU Research Cloud** | free TPU v4/v5 by application; **VM+storage billed to you** | GCP acct | Awkward (JAX/xla) |
| ❌ **SageMaker Studio Lab** | **CLOSING to new customers 30 Jul 2026** | No | Don't build on it |
| ❌ **Saturn Cloud** | **free tier appears GONE** (listicles are stale) | — | No |
| ❌ **Paperspace** | free = M4000 8GB Maxwell (decoy); usable GPUs need paid plan | — | No |
| ❌ **RunPod** | **no free tier** — bonus needs $10 deposit; "$500 free" is affiliate bait | Yes | No |
| ❌ **Cerebrium** | "Hobby Free" = free *platform fee*, **compute billed** | Yes | No |
| ❌ **Banana.dev** | **DEAD** (shut 31 Mar 2024) | — | — |
| ❌ Deepnote / Datalore / Replit / JarvisLabs / Replicate / Baseten / fal | no free GPU for arbitrary QLoRA | — | No |

## 2. FREE INFERENCE APIs — the 100B+ question
| Provider | Free allowance | Biggest free model | Card? |
|---|---|---|---|
| 🎯 **Groq** | 30 RPM / 1K RPD / 200K TPD | **gpt-oss-120B ✅ VERIFIED WORKING** (+llama-4-scout MoE, qwen3.6) | **No** |
| ✅ **NVIDIA NIM** | ~40 RPM | **DeepSeek-R1 671B, GLM-5 744B** | No (**phone verify** — likely our 403 fix!) |
| ✅ **OpenRouter** | 50 RPD (→1K with one-time $10) | **Nemotron 3 Ultra 550B** | No |
| ⚠️ **Cerebras** | **5 RPM** / 1M TPD (docs contradict every blog) | gpt-oss-120B | No |
| ⚠️ **Mistral** | 2 RPM / ~1B tok/mo | Mistral Large 3 | No |
| ⚠️ **Cloudflare Workers AI** | 10K neurons/day | Nemotron 120B | No |
| ⚠️ **Google AI Studio** | Flash ~1500 RPD | Gemini Flash (strong aggregator despite closed params) | No |
| ❌ **SambaNova** | **20 req/DAY** — useless for MoA | DeepSeek-V3.1 671B | No |
| ❌ **Cohere** | **non-commercial only** | Command A 111B | No |
| ❌ **Chutes** (free tier killed Mar 2026) · **Anyscale** (dead 2024) · **Together** (no real free tier) · **Fireworks/DeepInfra/Hyperbolic/Novita** (card/trial only) |

**⚠️ Stale-info warning:** the popular `free-llm-api-resources` GitHub list is WRONG in places (still shows
Llama-405B on OpenRouter, 30 RPM on Cerebras). Treat as discovery index, not truth.

## 3. CLOUD TIERS + CREDITS — what a bootstrapped UK founder ACTUALLY gets
| Program | Amount | Verdict |
|---|---|---|
| 🎯 **UKRI AIRR Rapid** | **20,000 GH200 hrs** | ✅ **APPLY — UK SME, no VC needed** |
| ✅ **AWS Activate Founders** | **$5,000** | bootstrapped is the *qualifying* condition |
| ✅ **Microsoft Founders Hub** | $1K → **$5,000** | self-serve, solo founders OK |
| ✅ **Google for Startups** | **$2,000** | bootstrapped tier |
| ✅ **NVIDIA Inception** | free + $10K DLI + **partner credits (Nebius AI Lift)** | no equity/fee — real route to 5 figures |
| ✅ **Modal Startups** | up to **$25,000** | no VC referral needed |
| ✅ **Intel Liftoff** | Tiber credits (amount UNVERIFIED) | no equity |
| ✅ **Oracle Free Tier** | ⚠️ **A1 ARM halved 4→2 OCPU Jun 2026** (our box is AMD micro — unaffected) | still best always-on free |
| ✅ **GitHub Codespaces** 120 core-hrs/mo · **Render** 750 hrs/mo (only surviving PaaS free tier) · **HF Pro $9/mo → 25min/day H200** |
| ❌ **VC-GATED — do NOT chase:** AWS Portfolio ($100–200K), Google $20–350K tiers, Oracle for Startups ($100K), MS $150K, CoreWeave (US-only?) — **all require a VC/accelerator on the cap table** |
| ❌ **AIRR Innovator** (50–150K GPU-hrs) — closed 16 Jan 2026; watch next cycle |
| ⚠️ **EuroHPC AI Factories** — UK eligibility **UNVERIFIED/contested**; worth one email to their helpdesk |

**Honest ceiling:** bootstrapped hyperscaler credits ≈ **$12K total**, not six figures. Anyone quoting $350K is selling something.
**Free tiers are contracting:** Fly, Railway, Gitpod Classic, Chutes, Anyscale all killed theirs; AWS swapped 12-months-free for 6-month expiring credits.

## The stack that actually works today (£0)
**Train:** Kaggle (30h/wk) + Modal ($30/mo) — stack monthly, no cards.
**Serve/infer:** Groq (gpt-oss-120B **free, verified**) + NVIDIA NIM (671B, once phone-verified).
**Always-on:** Oracle free VM (our `sovereign-hermes`).
**Next-level:** apply to UKRI AIRR → 20,000 GH200 hrs.

---
# GAP SWEEP 2 (2026-07-17) — the categories the first pass missed

## ⭐ REAL FINDS (worth your time)
| Platform | Free allowance | Catch |
|---|---|---|
| **[Scaleway](https://www.scaleway.com/)** ⭐ | **€100 credit, GPU-eligible, self-serve, EU** → **L4 24GB @ €0.79/h = ~126 HOURS** | Card required; voucher emailed ≤24h. **Best genuinely-free real LoRA run available.** |
| **[Prime Intellect](https://www.primeintellect.ai/)** ⭐ | **Fast Compute Grants $500–$100k**, "anyone from anywhere can apply", 5–10 day turnaround | Needs a genuine open-research angle. Highest ceiling of anything self-serve. ($130M Series A Jul 2026 — very alive.) Live grants page UNVERIFIED |
| **[Nosana](https://nosana.io/)** | **$50 free credits, self-serve** (only no-application crypto freebie) | 3090 ~$0.19/h |
| **[OVHcloud](https://www.ovhcloud.com/en-gb/)** | **£175** (UK page, GBP) | **1-month expiry**; GPU eligibility **UNVERIFIED** — test cheap first |

## 🇨🇳 The Chinese platforms — generous, and HARD-BLOCKED for a UK founder
**This is what western listicles never tell you: the wall is real-name ID verification, not payment.**
- **Baidu AI Studio** — genuinely **the most generous free GPU on earth** (daily sign-in = 8h V100-32GB / 2h A100; ~120h with referrals). ❌ Real-name accepts only a Chinese ID / permanent-residence permit / HK-Macau-Taiwan permit. **A UK passport is not on the list.** Also **PaddlePaddle-only** — PyTorch gets wiped on restart. Hostile to HF/PEFT even if you got in.
- **Alibaba PAI-DSW** — A10-24GB trial CU-hours (⚠️ figures conflict: 5,000 CU-h is stale, current docs say 750). ❌ aliyun.com real-name. **Gotcha: auto-converts to pay-as-you-go on expiry — real bill risk.**
- **ModelScope** (A10 24GB, 36–100h — ideal QLoRA spec) ❌ needs Alibaba real-name · **Tencent Cloud Studio** ❌ CN-site only · **AutoDL** ❌ +86 phone only · **OpenBayes/Featurize** ❌ CN payment · **Huawei ModelArts** — **no free GPU at all** (CPU-only flavor; verified in docs)
- **Only unblocked lead:** Alibaba Cloud **International** (alibabacloud.com) takes passports + Visa/MC, 50 trial points (~$50) — but **PAI/DSW GPU trial eligibility UNVERIFIED**. Worth 10 min of testing.

## ❌ STRIKE LIST — listicles are recommending corpses
- **Genesis Cloud — DEAD.** Site 404s; German records show *GmbH i.L.* (**in liquidation since Aug 2025**).
- **Noteable — DEAD** (Dec 2023, domain parked). **Databricks Community Edition — DEAD** (retired 1 Jan 2026).
  Its replacement *Free Edition* does have an undocumented serverless GPU — but **non-commercial ToS + US-only regions** → **off-limits for CSOAI work**.
- **Gensyn** — you **cannot rent a GPU**; mainnet is a *prediction market*, RL Swarm paused.
- **Render** (3D render farm, no shell) · **Bittensor** (incentive network, not rental) — category errors.
- **Lepton AI** — acquired by NVIDIA, no self-serve free tier. **DataCrunch** → renamed **Verda**, no free tier.
- **Akash** — $100/30d trial **excludes H100/H200/A100/4090/5090** — every card you'd want.
- **Vast.ai** — the "$2,500 free" is a **spend-MATCH, not a grant**; they explicitly screen out people "seeking free compute without committed spending."
- **Salad** — cheapest 24GB (~$0.18/h) but **no free trial** and **credit card only — debit/prepaid rejected**.
- **Binder** (2GB RAM) · **CoCalc** (no internet on free) · **Hex** (0.5 vCPU) — off by an order of magnitude.
- No free tier, paid only: Verda, Hyperstack, Crusoe, Latitude.sh, Massed Compute, Jarvislabs, Seeweb, TensorDock ($5 = minimum deposit, not bonus), Fluidstack (enterprise-only now), Nebius ($25 min).

## 🔍 WHY the "100 free GPU sites" lists exist — the tell
**Spheron pivoted** (its own docs now say *"Spheron is not a blockchain network"*) — **and Spheron's blog publishes the "Free GPU Credits 2026" listicles that rank for these searches.** That's their SEO content, not an offer. The affiliate farms (runpodreferral.com, aicreditmart, costbench) invent precise-sounding numbers for the same reason.
**Conclusion: the "100 sites" lists are largely an SEO artefact.** The real number of usable free GPU sources is ~30 — which is what this registry holds.

## Revised action order
1. **Scaleway €100 → 126h L4 24GB** — self-serve, EU, works today. The best free real LoRA run.
2. **Prime Intellect Fast Compute Grants** — email them; highest ceiling, open to anyone.
3. **UKRI AIRR 20,000 GH200 hrs** — still the biggest prize (draft ready).
4. Nothing here displaces **Modal** (restored, working) or **Kaggle** (30h/wk, needs kaggle.json).
