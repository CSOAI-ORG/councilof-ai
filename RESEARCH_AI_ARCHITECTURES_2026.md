# Research Synthesis: How Top AI Companies Run Their Systems

> Compiled from web research, academic papers, and industry reports
> Date: 2026-05-28 | For: MEOK Sovereign AI OS / DELBOY MODE

---

## 1. MIXTURE-OF-EXPERTS (MoE) IN PRODUCTION

### 1.1 Current State of MoE (2025-2026)

MoE is now the **dominant architecture** for large-scale LLMs. Key models:

| Model | Params (Total/Active) | Experts | Active | Org |
|-------|----------------------|---------|--------|-----|
| DeepSeek-V3 | 671B / 37B | 256+1 | 8+1 | DeepSeek |
| DeepSeek-R1 | 671B / 37B | 256+1 | 8+1 | DeepSeek |
| Kimi-K2 | 1T / 32B | 384+1 | 8+1 | Moonshot |
| Qwen3-235B | 235B / 22B | 128 | 8 | Alibaba |
| GPT-OSS | 21B-117B / 3.6B-5.1B | 32-128 | 4 | OpenAI |
| Llama 4 | 109B-400B / 17B | 16+1128 | 1+11 | Meta |
| Mixtral 8x22B | 141B / 39B | 8 | 2 | Mistral |
| Pangu Ultra | 718B / 39B | 256+1 | 8+1 | Huawei |

**Key Insight:** The industry has moved from few large experts (Mixtral: 8 experts) to many small experts (DeepSeek: 256 experts, Kimi: 384 experts). This enables finer specialization and better load balancing.

### 1.2 Routing Mechanisms

**Token Choice Routing (Classic):**
- Each token selects top-k experts via softmax over router scores
- Used by: Mixtral, early MoE models
- Problem: Load imbalance, routing collapse (all tokens go to same few experts)

**Expert Choice Routing (Google innovation):**
- Experts pick their top-k tokens instead
- Achieves perfect load balance
- Tokens can be processed by varying numbers of experts
- Used by: Google's production systems, research direction

**Dynamic Routing (Emerging):**
- Number of activated experts varies per token
- Complex tokens get more experts, simple tokens get fewer
- Under fixed computational budget
- Research: Elastic MoE, semantic parallelism

### 1.3 Load Balancing Strategies

1. **Auxiliary Loss:** Add balance loss to training objective
   - `L_total = L_moe + α * L_aux`
   - Tuned hyperparameter α trades off balance vs performance

2. **Expert Capacity:** Physical limit on tokens per expert
   - `expert_capacity = (T/E) * capacity_factor`
   - Excess tokens dropped or residual-connected

3. **Device-Level Balance:** Distribute experts evenly across GPUs
   - Prevents some GPUs being overloaded while others idle

4. **Shared Experts:** Some experts always active (DeepSeek's "shared expert")
   - Captures common knowledge, reduces routing variance

### 1.4 Inference Optimization

**From research papers and production systems:**

- **Prefix Cache Affinity:** Route requests with overlapping prompts to replicas with warm KV cache → cuts TTFT by 60%
- **Disaggregated Prefill/Decode:** Separate nodes for prompt processing vs token generation
- **Expert Parallelism (EP):** Distribute experts across GPUs; all2all communication for token dispatch
- **Model Multiplexing:** Load models on demand, cache in memory for LoRA adapters
- **Power of Two Choices:** Load balancing algorithm for routing
- **Micro-batching:** `@serve.batch` to group small requests into GPU-efficient batches
- **Canary/Shadow Deployments:** Traffic splitting for safe model updates

**Key Production Stacks:**
- **vLLM + Ray Serve:** Continuous batching + autoscaling
- **SGLang:** Structured generation + efficient serving
- **Cloudflare AI Gateway:** Routing, caching, rate limiting, guardrails
- **Anyscale:** Ray-based distributed inference

---

## 2. SAFETY & GOVERNANCE LAYERS

### 2.1 How Top Labs Handle Safety

**OpenAI:**
- Moderation API (multi-class classifier)
- RLHF + Constitutional AI patterns
- Red team partnerships
- Usage policies enforced at API layer
- No public MoE details for GPT-4

**Anthropic:**
- Constitutional AI (self-critique + revision)
- Safety classifiers layered before/after model
- Claude's "harmlessness" training
- Enterprise compliance features

**Google DeepMind:**
- Sparrow/GlaDOS safety research
- Expert Choice routing for balanced computation
- Pathways infrastructure for multi-modal, multi-task
- Internal safety review boards

**Meta:**
- Llama Guard 3 8B for real-time moderation
- Purple Llama for responsible deployment
- Open-weight model with usage licenses

### 2.2 Cloudflare AI Gateway Patterns (Production-Ready)

From the research, these are immediately adoptable:

1. **Metadata Headers:** Attach `user_id`/`team_id` to every request for usage analytics and billing attribution
2. **Rate Limiting:** Sliding/fixed-window per gateway and per customer
3. **Dynamic Routing with Fallbacks:** Auto-route to backup provider if primary is down
4. **Guardrails (Llama Guard 3):** Real-time moderation of prompts AND responses
5. **DLP Profiles:** Scan for PII/financial data, block before reaching model
6. **Retry Policies:** Exponential backoff at gateway layer, not application code
7. **Custom Cost Tracking:** Override provider pricing for internal chargeback
8. **Logpush:** Stream logs to external storage for audit trails

### 2.3 BFT in Production Systems

- **Hyperledger Fabric:** PBFT for enterprise blockchain
- **Tendermint/Cosmos:** BFT consensus for blockchain (now CometBFT)
- **Hotstuff:** Used by Diem (Meta's blockchain), Azure BFT
- **DiemBFT:** Variant of Hotstuff with pacemaker

**Key insight for MEOK:** Our PBFT-MoE is novel because it combines BFT consensus with domain-expert specialization. No production system we found does exactly this. We're pioneering "governance-native AI."

---

## 3. BILLING & REVENUE SYSTEMS

### 3.1 Stripe for AI APIs

**Metered Billing Pattern:**
- Create Stripe products with `usage_type: "metered"`
- Report usage via `usage_records` API
- Stripe auto-generates invoices based on consumption
- Supports tiered pricing, volume discounts, overage

**Credit System Pattern:**
- Customer buys credit pack upfront
- Deduct credits per API call/token
- Low balance triggers auto-recharge or notification
- Common in OpenAI, Anthropic enterprise

**Subscription + Overage:**
- Base subscription includes quota
- Overage billed at metered rate
- Tier upgrades auto-applied when quota exceeded

### 3.2 Usage-Based Billing Architecture

```
API Gateway → Usage Recorder (per request)
  → Aggregator (hourly/daily rollups)
  → Stripe Usage Records API
  → Invoice generated
  → Webhook confirms payment
  → Revenue ledger updated
```

### 3.3 Cost Attribution

**Per-Request Cost Tracking:**
- Model ID + token count → cost calculation
- Customer ID + API key → attribution
- Product/feature → P&L segmentation
- Region/provider → optimization insights

**Key Metrics:**
- Cost per 1K tokens (by model)
- Gross margin per customer
- LTV/CAC ratio
- Payback period

---

## 4. DESIGN PATTERNS FOR MEOK ADOPTION

### 4.1 Immediate Adoptions

| Pattern | Source | MEOK Application |
|---------|--------|-----------------|
| Metadata headers for attribution | Cloudflare AI Gateway | Attach `customer_id`/`tier` to every MCP call |
| Dynamic provider fallback | Cloudflare AI Gateway | ModelRouter auto-fallback if provider down |
| Prefix cache affinity | Anyscale Ray Serve | Route similar prompts to warm cache |
| Disaggregated prefill/decode | vLLM/SGLang | Separate fast/expensive nodes by task |
| Usage metering + Stripe | Stripe docs | DELBOY MODE metered billing |
| Credit system | OpenAI/Anthropic | Prepay credits for MCP tools |
| Expert capacity limiting | GShard/Switch Transformer | Prevent council overload |
| Shared experts | DeepSeek-V3 | Always-active governance experts |

### 4.2 Novel MEOK Innovations

| Innovation | Why It's Unique |
|------------|----------------|
| PBFT-MoE Governance | No other system combines BFT with domain-expert councils |
| Two-Tier Consensus | Binary PBFT + dimensional EigenBFT = quality + agreement |
| Extreme Simulations | Chaos injection as regular operations, not just testing |
| DELBOY MODE | Revenue as a first-class nervous system, not an afterthought |
| Care Ethics (GAP 6) | Revenue optimization with explicit fairness constraints |

---

## 5. KEY ACADEMIC PAPERS

| Paper | Authors | Year | Relevance |
|-------|---------|------|-----------|
| Outrageously Large Neural Networks (MoE) | Shazeer et al. | 2017 | Foundation |
| GShard: Scaling Giant Models | Lepikhin et al. | 2021 | Production MoE |
| Switch Transformers | Fedus et al. | 2022 | Simplified MoE |
| DeepSeekMoE | Dai et al. | 2024 | Fine-grained MoE |
| Expert Choice Routing | Zhou et al. | 2022 | Load balancing |
| Semantic Parallelism for MoE | - | 2025 | Inference optimization |
| Steering MoE via Expert (De)Activation | - | 2025 | Controllable behavior |
| Elastic MoE | - | 2025 | Inference-time scalability |
| MegaScale-MoE | - | 2025 | Large-scale training |

---

*Research compiled for DELBOY MODE and MEOK Sovereign AI OS architecture decisions.*
