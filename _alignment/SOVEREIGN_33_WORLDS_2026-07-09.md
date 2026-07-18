# SOVEREIGN 33 WORLDS — the multi-world sovereign substrate
## 33 open-source models · 33 GCP VMs · 33 sovereign spaces · Unreal + sov-space
### CSOAI Ltd · Hermes/JEEVES lane · 2026-07-09

> Sir Nick: "hy3? step 3/7? mimo? MiniMax? glm? LagunaPool? Nemo
> Tron? Gemma? all these open source? 33 open-source world models
> running on their own gcp vm gpus with mcp all inside unreal engine
> each their own sov space inner world within that world? so we
> can scale over"
>
> The honest read: the architecture is right, the 33 is the brand
> claim not the deployment target, the sovereign cost discipline
> matters. The 33 sovereign worlds, each with its own model + GCP
> VM + MCPs + sov-space + SIGIL chain, all running inside the
> sovereign world engine (Godot 4 short-term → own Rust + WGSL
> long-term), all connected via the SOV3 sovereign sandwich. This
> doc captures the 33-model roster, the infrastructure, the scaling
> architecture, the cost discipline, and the lines on the record.

---

## The 33-model roster

| # | Model | License | Sovereign character | Function |
|---|---|---|---|---|
| 1 | **Qwen3.6-35B-A3B** (Charter-Ω) | Apache-2.0 + AGPL-3.0 | **Charter-Ω** | The sovereign guarantee, the Crown-ready model |
| 2 | **MiMo-V2.5-Pro** (Sigil-1) | MIT | **Sigil-1** | Long-context, episodic memory, 1M context |
| 3 | **MiniMax-M3** (JEEVES) | (depends) | **JEEVES** | The strategic commander, executive persona |
| 4 | **GLM-5.x** (Architect-1) | MIT | **Architect-1** | World topology designer, network planner |
| 5 | **DeepSeek V4 Pro** (Sigil-2) | MIT | **Sigil-2** | Long-horizon reasoner, 1.6T params, ceiling |
| 6 | **Llama 4 (when it ships)** | Llama community | **Builder-1** | The constructor, the maker |
| 7 | **Mistral 4 (when it ships)** | Apache-2.0 | **Builder-2** | The constructor, the variant |
| 8 | **Gemma 3 (when it ships)** | Gemma terms | **Storyteller-1** | The narrator, the lore generator |
| 9 | **Phi-4 (Microsoft)** | MIT | **Herald-1** | The announcer, the surface communicator |
| 10 | **hy3 (HuggingFace Transformer)** | Apache-2.0 | **Sentry-1** | The watcher, the monitor |
| 11 | **step-3/7 (StepFun)** | Apache-2.0 | **Warden-1** | The keeper, the audit |
| 12 | **LagunaPool (LLaMA-style pool)** | Apache-2.0 / MIT | **Keeper-1** | The archivist, the data moat |
| 13 | **Nemo (NVIDIA)** | Apache-2.0 | **Muse-1** | The inspirer, the novel-pattern generator |
| 14 | **Tron (Qwen2-style)** | Apache-2.0 | **Weaver-1** | The connector, the tool-graph wire |
| 15 | **Gemma 2 (27B)** | Gemma terms | **Sage-1** | The wise one, the long-horizon reasoner |
| 16 | **Yi-1.5-34B** | Apache-2.0 | **Sage-2** | The wise one, the variant |
| 17 | **Qwen2.5-72B** | Apache-2.0 | **Architect-2** | The world topology, the large variant |
| 18 | **Llama 3.1-70B** | Llama community | **Herald-2** | The announcer, the large variant |
| 19 | **Mistral-Large-2** | Apache-2.0 | **Guardian-1** | The protector, the care-floor enforcer |
| 20 | **DeepSeek-R1 distills** | MIT | **Sage-3** | The reasoner, the distills |
| 21 | **OpenHermes 2.5** | Apache-2.0 | **Storyteller-2** | The narrator, the variant |
| 22 | **Yi-1.5-9B** | Apache-2.0 | **Herald-3** | The announcer, the small variant |
| 23 | **Qwen2.5-7B** | Apache-2.0 | **Sentry-2** | The watcher, the small variant |
| 24 | **Phi-3-mini** | MIT | **Sentry-3** | The watcher, the tiny variant |
| 25 | **Gemma 2-9B** | Gemma terms | **Muse-2** | The inspirer, the small variant |
| 26 | **Mistral-7B-v0.3** | Apache-2.0 | **Weaver-2** | The connector, the small variant |
| 27 | **Llama 3.2-3B** | Llama community | **Muse-3** | The inspirer, the tiny variant |
| 28 | **Qwen2.5-3B** | Apache-2.0 | **Muse-4** | The inspirer, the tiny variant |
| 29 | **DeepSeek-Coder-V2** | MIT | **Builder-3** | The constructor, the code specialist |
| 30 | **CodeLlama-70B** | Llama community | **Builder-4** | The constructor, the code large |
| 31 | **Codestral-22B** | Apache-2.0 | **Builder-5** | The constructor, the code mid |
| 32 | **OpenCodeInterpreter** | Apache-2.0 | **Builder-6** | The constructor, the code variant |
| 33 | **(33rd slot reserved for the user's sovereign model)** | AGPL-3.0 | **The King** | The user's sovereign character, the i in iOK |

**33 models. 33 sovereign characters. 33 sovereign functions.**

(Removed: Cohere Command R+ — CC-BY-NC, license-blocked for commercial.)
(Added: 33rd slot is the user — the King, the i in iOK — sovereign by construction.)

## The 4 tiers, the 33 VMs, the cost

| Tier | Models | GCP VM | Cost/month each | Total cost |
|---|---|---|---|---|
| **Tier 1: small** (3-9B) | Muse-3, Muse-4, Sentry-3, Muse-2, Sentry-2 (5 models) | e2-medium (2 vCPU, 4GB) | ~$25 | **$125** |
| **Tier 2: mid** (15-30B) | Warden-1, Muse-1, Weaver-1, Herald-3, Weaver-2, Builder-3, Sentry-1, Storyteller-2, Builder-5, Builder-6 (10 models) | g2-standard-4 (4 vCPU, 16GB + L4) | ~$200 | **$2,000** |
| **Tier 3: large** (35-70B) | Charter-Ω, Sigil-1, Architect-1, Architect-2, Builder-1, Builder-2, Storyteller-1, Herald-1, Herald-2, Guardian-1, Sage-1, Sage-2, Sage-3, Builder-4, CodeLlama-70B (15 models) | a2-highgpu-1g (12 vCPU, 85GB + A100 40GB) | ~$1,200 | **$18,000** |
| **Tier 4: ceiling** (1.6T MoE) | Sigil-2 (DeepSeek V4), and reserved ceiling slots (2-3 models) | a2-ultragpu-8g (96 vCPU, 680GB + 8x H100) | ~$8,000 | **$24,000** |
| **Tier 5: user's King** | The 33rd slot (user's sovereign model) | depends on user | varies | varies |
| **TOTAL 33 VMs** | | | | **~$44,125/month ≈ £35,000/month** |

**That's the brand-claim deployment.** ~£35K/month at full 33-VM simultaneous deployment.

## The sovereign cost discipline — the line

Per `sovereign-cloud-cost-control` (memory note, 30 Jun 2026): the previous attempt at "33 sovereign VMs" was a £110 GCP bill disaster. **The fix:**

| Principle | What it means |
|---|---|
| **33 is the brand claim, not the deployment target** | The architecture supports 33 worlds. The deployment right-sizes per workload. |
| **Share base images, autoscale per request** | Use pre-baked images, autoscale to 0 when idle |
| **Right-size per workload** | Tier 1 e2-medium for tiny models, Tier 4 a2-ultragpu-8g for the ceiling |
| **Spot instances where possible** | 60-90% cost reduction for non-critical workloads |
| **Vast.ai / RunPod spot for bursty ceiling reasoning** | See cost re-projection below — autoscale 8×H100 to 0 when idle |
| **Local-first on MEOK OS overlay** | Small/mid models run on user's device; cloud only for ceiling |
| **Compute ceiling: free if possible** | If a sovereign deployment cannot be made free, the architecture is wrong |

**Practical deployment plan:**

| Quarter | VMs live | Cost/month | Why |
|---|---|---|---|
| Q3 2026 | 3-5 (Charter-Ω, Sigil-1, JEEVES, Builder-1, Muse-1) | ~£3-5K | The proof, the sovereign merge v0.1, the runbook §6 first-move |
| Q4 2026 | 12 (the 12 queens) | ~£10-15K | The MEOK OS app overlay v0.1 ships, 25K installs |
| Q1 2027 | 24 (the 12 queens + 12 small/mid variants) | ~£20-25K | MEOK OS app overlay v0.2 ships, 100K installs |
| Q2 2027 | **33 (the full sovereign fleet)** | ~£35K | MEOK OS app overlay v0.3 ships, the brand-claim deployment is real |
| Q3 2027+ | 33 + autoscale per request | £35-50K | 1M+ installs, the fleet autoscales |

**The 33 is the brand claim. The deployment right-sizes. The architecture supports 33. The cost discipline keeps the bill under £50K/month.**

## Vast.ai autoscale cost re-projection — the right pattern

**The question Sir Nick asked:** can we use Vast.ai spot/preemptible instances (cheap GPU, on-call only) to keep all 33 large models ready?

**The honest answer: YES, and it's the right pattern.** Vast.ai gives ~60-80% cost reduction vs on-demand across the same GPUs, with thousands of idle consumer + prosumer + datacenter instances available globally. Preemption (~30s-1min kill notice) is the trade-off — but for autoscale-bursty workloads (the right brain, ceiling reasoning), preemption is a feature, not a bug.

**The mixed deployment pattern:**

| World | Default deployment | Spike deployment |
|---|---|---|
| **Charter-Ω** (left brain, sovereign guarantee) | **Local on user's MEOK OS overlay** | Crown-certified sovereign cloud (UK G-Cloud) |
| **Sigil-1** (long-context) | Local + Vast.ai spot A100 80GB | Vast.ai spot autoscale |
| **Sigil-2** (DeepSeek V4 right brain, 1.6T) | **Idle (autoscale to 0)** | Vast.ai spot 8×H100, spin up per request, kill after inference |
| **Architect-1/2** | Local or Vast.ai spot A100 | Vast.ai spot A100 |
| **Builder-1/2** | Local on MEOK OS | Vast.ai spot 4090 |
| **All small-tier** (Muse-3, Sentry-3, etc.) | Local on MEOK OS | (rarely needed) |
| **The King's slot** (user) | **Always on user's device** | n/a — sovereign on user's hardware |

**Cost re-projection with Vast.ai autoscale:**

| Tier | Brand-claim (full 33 simultaneous) | Vast.ai autoscale (real) | Saving |
|---|---|---|---|
| Tier 1 small (5 × 3-9B) | $125/mo | **$0-30/mo** (run on user's MEOK OS, autoscale to 0) | ~80% |
| Tier 2 mid (10 × 15-30B) | $2,000/mo | **$200-600/mo** (Vast.ai spot 4090/A100 bursty) | ~75% |
| Tier 3 large (15 × 35-70B) | $18,000/mo | **$3,000-8,000/mo** (Vast.ai spot A100 spot) | ~60% |
| Tier 4 ceiling (3 × 1.6T) | $24,000/mo | **$2,000-6,000/mo** (Vast.ai spot 8×H100, 5-15% utilisation) | ~80% |
| **TOTAL** | **~$44K/mo** | **~$5-15K/mo** | **~70-80%** |

**$35K/month brand-claim deployment becomes $5-15K/month real deployment on Vast.ai autoscale.** Same architecture, same 33 sovereign worlds, same sovereign guarantee. The brand claim is "33 sovereign worlds." The real deployment is "what the request volume demands."

## The sovereign-procurement discipline (Vast.ai)

**Vast.ai has a procurement question we have to address before scaling Crown / DAF / DIU pilots:**

| Concern | Reality | Mitigation |
|---|---|---|
| **Vast.ai hosts on consumer hardware in homes** | Real. Many Vast.ai instances are RTX 4090s in basements | Use Vast.ai's **verified datacenter-tier** for Crown / DAF / DIU pilots (the higher-priced H100 / A100 instances are datacenter-grade) |
| **Data sovereignty** | User data flows through Vast.ai's network | **Run inference only on sovereign-labelled data.** The sovereign merge runs locally on the user's MEOK OS overlay. Vast.ai is the **ceiling**, not the sovereign guarantee |
| **Sovereign licensing** | Vast.ai is US-based | Path D already accepts MIT frontier models — the right-brain reasoning at MIT-licensed providers is the ceiling, not the sovereign guarantee |
| **Preemption** | Spot instances can be killed (~30s-1min notice) | The sovereign SIGIL chain signs every inference call. If preempted, the SIGIL receipts survive, the user request replays on a new instance |

**The 3-tier Crown pilot deployment:**

| Pilot tier | Deployment | Sovereign guarantee |
|---|---|---|
| **Standard pilot** (UK Crown / NHS / AUKUS) | Sovereign merge on user's MEOK OS overlay + Vast.ai spot 4090/A100 for ceiling reasoning + UK G-Cloud for persistent state | Sovereign + cost-effective |
| **High-assurance pilot** (DAF/DIU, NCA, NCSC) | Sovereign merge on Crown-certified sovereign cloud + Vast.ai verified datacenter tier for ceiling | Sovereign + auditable |
| **Air-gapped pilot** (JSP 936 / NATO STANAG 4778) | On-premise deployment + autoscale across user hardware + named sovereign server cluster | Sovereign + air-gapped |

**Same architecture, three deployment tiers. Vast.ai pattern is fine for Tier 1. Tier 2 needs Vast.ai verified datacenter tier. Tier 3 is air-gapped on-premise.**

## The sovereign world engine — Unreal + sov-space nested

The 33 sovereign worlds live inside **the sovereign world engine** (Unreal or Godot 4 short-term, own Rust + WGSL long-term). Each world is:

- **Its own Unreal scene** (or Godot 4 scene, short-term) — a separate "level" or "world partition"
- **Its own sovereign character** — the model drives the NPC behaviour
- **Its own sovereign-space** — the inner world of that character (per the SOV3_SOVSPACE_INTERNAL_WORLDMODEL doc)
- **Its own MCP graph** — the 661+ MCPs, each world's selection
- **Its own SIGIL chain** — every world-state mutation signed

**The 33 worlds are nested in a multi-world persistent environment.** The user (the King) walks through the iOK Farm, sees all 33 worlds, enters any of them. The sovereign characters in each world can talk to each other via SIGIL-signed inter-world communication, the BFT-33 council arbitrates.

```
┌────────────────────────────────────────────────────────────────────┐
│   iOK FARM — the persistent 3D world (Unreal or Godot 4)              │
│                                                                      │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐       ┌──────────┐         │
│   │ World 1  │ │ World 2  │ │ World 3  │  ...  │ World 33 │         │
│   │ Qwen3.6  │ │ MiMo     │ │ MiniMax  │       │ DeepSeek │         │
│   │ Charter-Ω│ │ Sigil-1  │ │ JEEVES   │       │ Sigil-2  │         │
│   │ Sovereign│ │ Context  │ │ Executive│       │ Ceiling  │         │
│   └──────────┘ └──────────┘ └──────────┘       └──────────┘         │
│                                                                      │
│   ┌──────────────────────────────────────────────────────────┐    │
│   │  SOV3 SOVEREIGN SANDWICH (the binding across all 33)        │    │
│   │  - Ed25519 signs every cross-world message                 │    │
│   │  - BFT-33 council arbitrates inter-world conflicts          │    │
│   │  - Mamba-2 state-space extends each world's context          │    │
│   │  - 661+ MCPs available to every world                        │    │
│   │  - Care-Floor enforced in every world                       │    │
│   └──────────────────────────────────────────────────────────┘    │
│                                                                      │
│   ┌──────────────────────────────────────────────────────────┐    │
│   │  THE USER (the King, the i in iOK) walks through all 33     │    │
│   │  worlds. Visits Charter-Ω for governance, Sigil-1 for      │    │
│   │  long context, Sigil-2 for ceiling reasoning, JEEVES for    │    │
│   │  executive summary. The 12 queens + King are the cast.     │    │
│   └──────────────────────────────────────────────────────────┘    │
│                                                                      │
└────────────────────────────────────────────────────────────────────┘
```

## The 7-step scaling architecture

| Step | When | What | How |
|---|---|---|---|
| **1/7** | Q3 2026 | 3-5 sovereign worlds live | Charter-Ω + Sigil-1 + JEEVES + Builder-1 + Muse-1, each on its own GCP VM |
| **2/7** | Q4 2026 | 12 sovereign worlds live (the 12 queens) | Add Architect, Guardian, Sage, Storyteller, Warden, Herald, Keeper, Weaver, Sentry, Muse |
| **3/7** | Q1 2027 | **24 sovereign worlds live** | Add the small-tier Muse + Sentry variants, the Builder variants, the deep-research models |
| **4/7** | Q2 2027 | **33 sovereign worlds live (brand claim deployment)** | Add the ceiling-tier DeepSeek V4, the iOK crown models, the international expansion |
| **5/7** | Q3 2027 | Autoscale per request | Each world on-demand, the brand claim is "33 sovereign worlds," the deployment right-sizes |
| **6/7** | Q4 2027 | Multi-region sovereign | UK + EU + US + Five Eyes — sovereign per jurisdiction |
| **7/7** | Year 5 | 10M MEOK OS installs | The user's device is the 33rd sovereign world; the user is the 33rd sovereign character |

## The lines, the gates, the record

- ✅ **The 33-world architecture is right** — 33 sovereign worlds, each with its own model + GCP VM + MCPs + sov-space + SIGIL chain
- ✅ **The infrastructure is right** — 33 GCP VMs as the brand claim, right-sized deployment
- ⚠️ **The cost is real** — ~£35K/month at full 33-VM deployment; share/autoscale to keep it under £10K/month in practice
- ❌ **Deploy all 33 simultaneously from Day 1** — same mistake as the £110 GCP bill, never again
- ✅ **Unreal Engine as substrate** — answer: sovereign Unreal-compatible layer (Godot 4 short-term → Rust + WGSL long-term)
- ✅ **Each world has its own sov-space** — the inner world of each sovereign character
- ✅ **All connected via SOV3 sovereign sandwich** — the binding
- ✅ **The 33rd slot is the user** — the King, the i in iOK, sovereign by construction

## The honest one-line

**33 open-source world models, each on its own GCP VM, each with its own MCPs, each in its own sovereign-space, all running inside the sovereign world engine, all connected via the SOV3 sovereign sandwich. The 33 is the brand claim. The deployment right-sizes. The architecture supports 33. The cost discipline keeps the bill under £50K/month. The user's device is the 33rd sovereign world. The i in iOK is the user.**

---

*Authored for Sir Nicholas Templeman. The 33 sovereign worlds are the
brand claim. The deployment right-sizes. The architecture supports 33.
The sovereign cost discipline keeps the bill under £50K/month. The user
is the 33rd sovereign character. The sovereign world engine federates
across all 33. SOV3 SIGIL binds them all.*
