# Dimension 3: AI Agent Intelligence — Fine-tuning, Memory & Personality Systems

**Research Brief for Agent-47 Upgrade Pathway**
**Date**: July 2026
**Searches Conducted**: 18 independent queries across arXiv, NeurIPS proceedings, vendor documentation, and technical benchmarks
**Sources**: 40+ primary and secondary sources

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Multi-Agent Reinforcement Learning Frameworks](#2-multi-agent-reinforcement-learning-frameworks)
3. [Fine-Tuning Pipelines & Infrastructure](#3-fine-tuning-pipelines--infrastructure)
4. [Memory Architectures for Agent Persistence](#4-memory-architectures-for-agent-persistence)
5. [Personality Modeling: The Big Five OCEAN Framework](#5-personality-modeling-the-big-five-ocean-framework)
6. [Self-Improvement: Reflect-Retry-Reward Loops](#6-self-improvement-reflect-retry-reward-loops)
7. [Model Distillation for Local Inference](#7-model-distillation-for-local-inference)
8. [Constitutional AI for Multi-Agent Alignment](#8-constitutional-ai-for-multi-agent-alignment)
9. [Deployment Patterns & Production Architecture](#9-deployment-patterns--production-architecture)
10. [Implementation Roadmap for Agent-47](#10-implementation-roadmap-for-agent-47)
11. [References](#11-references)

---

## 1. Executive Summary

This research brief provides a comprehensive technical analysis of the intelligence upgrade pathway for Agent-47 across five interconnected domains: multi-agent reinforcement learning (MARL), fine-tuning infrastructure, persistent memory architectures, personality modeling, and self-improvement systems. The analysis is grounded in empirical benchmarks, production deployments, and recent research (2024-2026).

**Key Findings for CSOAI Context**:

| Capability | Current State (Agent-47) | Target State | Framework |
|---|---|---|---|
| Multi-Agent Training | None (static models) | Collaborative specialization | MARFT / M-GRPO |
| Fine-Tuning | Manual, ad-hoc | Automated pipeline | Unsloth + Distilabel |
| Memory | L1-L5 tiers (ephemeral) | Persistent, retrievable | Mem0 + Zep Graphiti |
| Personality | Static system prompts | Dynamic OCEAN profiles | Prompt-based induction |
| Self-Improvement | None | Reflect-Retry-Reward | GRPO + verifiable rewards |
| Local Inference | Cloud-dependent (70%) | 80% local (Qwen3-4B) | ECLD distillation |
| Alignment | Manual review | Constitutional governance | Multi-agent constitution |

**Critical Decision Points**:
- **MARFT** achieves +14.75% on coding tasks through multi-agent collaborative fine-tuning [^301^]
- **M-GRPO** enables scalable training of heterogeneous multi-agent systems with decoupled server architecture [^480^]
- **Mem0** reaches 94.4% on LongMemEval with 6,787 tokens/query [^502^]; **Zep** achieves 94.8% on DMR with 90% lower latency [^539^]
- **Reflect-Retry-Reward** achieves 34.7% improvement on math and 18.1% on function calling [^514^]
- **Qwen3-4B** handles ~80% of queries locally with strong reasoning capability [^515^]
- **DoRA** outperforms LoRA by 3-4% on commonsense reasoning without inference overhead [^545^]
- **KTO** outperforms DPO across all benchmarks while handling unpaired binary feedback [^499^]

---

## 2. Multi-Agent Reinforcement Learning Frameworks

### 2.1 MARFT: Multi-Agent Reinforcement Fine-Tuning

**Paper**: *MARFT: Multi-Agent Reinforcement Fine-Tuning* (arXiv 2504.16129v4) [^301^]

**Core Innovation**: MARFT treats fine-tuning as a multi-agent collaboration problem rather than a single-model optimization. Different agents assume specialized roles (Reasoner → Actor → Reviewer) within a *Language Agent Multi-Agent System (LaMAS)*, where each agent has a dedicated LoRA adapter.

**Architecture**:
```
LaMAS Pipeline:
  Reasoner → decomposes problem, creates plan
  Actor → generates solution (code/math)
  Reviewer → validates correctness
  
Each agent: Qwen2.5 base + dedicated LoRA adapter
Reward: Binary (1 for correct, 0 incorrect) or test case pass rate
```

**Experimental Results**:

| Task | Setup | Improvement |
|---|---|---|
| Math (MATH500) | Duo (Reasoner → Actor) | Significant gains over solo |
| Coding (CodeForces) | Trio (Reasoner → Coder → Reviewer) | **+14.75% over single-agent** |

**Key Implementation Details**:
- Base models: Qwen2.5-Coder-3B-Instruct (math), Qwen2.5-3B-Instruct (coding)
- Each agent equipped with dedicated LoRA adapter
- Training: MATH (7.5K entries) + CMATH (600 entries) for math; CodeForces (1,339 train, 377 test) for coding
- Evaluation: 10 random seeds, temperature 0.1
- Duo = 2 agents; Trio = 3 agents [^301^]

**For Agent-47**: The Trio architecture maps directly to the caste system:
- **Drone Caste**: Actor (execution)
- **Builder Caste**: Reasoner (planning)  
- **Guardian Caste**: Reviewer (validation)

### 2.2 M-GRPO: Multi-Agent Group Relative Policy Optimization

**Paper**: *Training Multi-Agent Systems with M-GRPO* (arXiv 2511.13288) [^480^]

**Core Innovation**: M-GRPO extends GRPO (Group Relative Policy Optimization, the algorithm powering DeepSeek-R1) to multi-agent systems. It introduces hierarchical credit assignment for vertical multi-agent systems with a main agent (planner) and multiple sub-agents (multi-turn tool executors).

**Key Technical Contributions**:

1. **Hierarchical Credit Assignment**: Computes group-relative advantages for both main and sub-agents, maintaining proper credit allocation across agent hierarchy
2. **Trajectory-Alignment Scheme**: Generates fixed-size batches despite variable sub-agent invocations
3. **Decoupled Training Pipeline**: Agents run on separate servers and exchange minimal statistics via a shared store—no cross-server backpropagation required

**Benchmark Results**:

| Method | GAIA | XBench-DeepSearch | WebWalkerQA |
|---|---|---|---|
| Single-agent GRPO | Baseline | Baseline | Baseline |
| Multi-agent GRPO (frozen subs) | Moderate | Moderate | Moderate |
| **M-GRPO** | **Best** | **Best** | **Best** |

**Deployment Pattern**:
- Main agent (planner) on server A
- Sub-agents (tool executors) on servers B, C, D
- Shared statistics store (Redis/similar)
- No end-to-end gradient flow required [^480^]

**For Agent-47**: This architecture directly supports the SOV3 King → Hive Queen → Worker hierarchy. Each caste can be trained with distinct LLMs optimized for its role.

### 2.3 Credit Assignment in Multi-Agent RL

The credit assignment problem—determining which agent contributed to a success/failure—has several established solutions:

**LICA** (NeurIPS 2020): Uses a hypernetwork-based centralized critic where latent state representations integrate into policy gradients through multiplicative association with stochastic policies [^566^].

**MAPPG** (AAAI 2023): Introduces "polarization joint action values" that increase distance between optimal and non-optimal joint actions, largely eliminating influence from other agents' non-optimal policies [^573^].

**MLCA**: Multi-Level Credit Assignment that separates macro-level and micro-level critics, updating both centralized and hierarchical models simultaneously [^575^].

**For Agent-47**: M-GRPO's hierarchical credit assignment is the most suitable given the 5-hive caste architecture. The pheromone signaling system provides a natural reward channel.

---

## 3. Fine-Tuning Pipelines & Infrastructure

### 3.1 LoRA: Low-Rank Adaptation (Foundation)

**Paper**: *LoRA: Low-Rank Adaptation of Large Language Models* (Hu et al., 2021) [^520^]

LoRA decomposes weight updates into low-rank matrices, reducing trainable parameters by 10,000x compared to full fine-tuning.

**Hyperparameters**:

| Parameter | Description | Recommended Values |
|---|---|---|
| `r` (rank) | Controls trainable parameter count | 8, 16, 32, 64, 128 |
| `lora_alpha` | Scales adaptation strength | Equal to `r` or `r * 2` |
| `lora_dropout` | Regularization | 0 (default) to 0.1 |
| `learning_rate` | Step size for updates | 1e-5 to 1e-3 |
| `target_modules` | Which layers to adapt | `q_proj, k_proj, v_proj, o_proj, gate_proj, up_proj, down_proj` |
| `weight_decay` | Regularization penalty | 0.01 - 0.1 |

**Memory Efficiency**:
- GPT-3 175B full fine-tuning: 1.2TB VRAM
- GPT-3 175B with LoRA (r=4): 350GB VRAM (3x reduction)
- Checkpoint size: from 350GB → 35MB [^520^]

### 3.2 DoRA: Weight-Decomposed Low-Rank Adaptation

**Paper**: *DoRA: Weight-Decomposed Low-Rank Adaptation* (ICML 2024 Oral, Liu et al., NVIDIA Research) [^545^]

DoRA decomposes pre-trained weights into **magnitude** and **direction** components, fine-tuning both while using LoRA for directional updates. This eliminates the accuracy gap between LoRA and full fine-tuning.

**Performance Gains over LoRA**:

| Model | Task | LoRA → DoRA Improvement |
|---|---|---|
| LLaMA-7B | Commonsense Reasoning | **+3.7%** |
| LLaMA-13B | Commonsense Reasoning | **+1.0%** |
| LLaMA-2-7B | Commonsense Reasoning | **+2.9%** |
| LLaMA-3-8B | Commonsense Reasoning | **+4.4%** |
| LLaVA-7B | Visual Instruction Tuning | **+0.6%** |

**Key Advantage**: Zero inference overhead—magnitude and direction components merge back into pre-trained weights after training [^556^].

**Implementation**:
```python
from peft import LoraConfig

config = LoraConfig(
    r=16,
    lora_alpha=16,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj",
                    "gate_proj", "up_proj", "down_proj"],
    use_dora=True,  # Enable DoRA
)
```

**Recommendation for Agent-47**: Adopt DoRA as the default fine-tuning method. Start with half the rank of LoRA configurations for comparable or superior accuracy [^558^].

### 3.3 QLoRA & Quantized Variants

**QLoRA** enables training 33B models on 24GB consumer GPUs and 65B models on 48GB GPUs by using:
- **NF4** (4-bit NormalFloat) quantization for base weights
- **Double Quantization** for memory savings
- **Paged Optimizers** to prevent OOM errors

**QA-LoRA**: Quantization-aware variant that merges LoRA updates directly in quantized domain (INT4/3/2) without post-training quantization accuracy loss [^520^].

### 3.4 Multi-LoRA Serving

**S-LoRA** (MLSys 2024) enables serving thousands of concurrent LoRA adapters [^544^]:

| System | Max Adapters (A100 80GB) | Throughput |
|---|---|---|
| PEFT | ~5 | 0.88 reg/s |
| vLLM-packed | <5 | 2.04 reg/s |
| **S-LoRA** | **2,000** | **7.64 reg/s** |

**Key Innovation**: Unified Paging manages dynamic adapter weights and KV cache tensors via a unified memory pool. Achieves up to **30x higher throughput** than PEFT [^544^].

**Production vLLM Deployment**:
```bash
vllm serve meta-llama/Llama-3.1-8B-Instruct \
  --enable-lora \
  --max-loras 8 \
  --max-lora-rank 64 \
  --lora-modules caste-drone=/adapters/drone \
                 caste-builder=/adapters/builder \
                 caste-guardian=/adapters/guardian
```

Cache hit latency: sub-millisecond. GPU cache eviction is LRU [^542^].

### 3.5 Unsloth: High-Performance Fine-Tuning

Unsloth provides 2x speedup over standard implementations with custom CUDA kernels:

**Verified Benchmarks** (Chronicals paper, Jan 2026):
- Full fine-tuning: 11,736 tokens/sec (verified with gradient flow)
- LoRA training: 2,857 tokens/sec (MAX mode)
- Supports QLoRA, LoRA, and full fine-tuning [^481^]

**Important Caveat**: Unsloth's reported 46,000 tokens/sec figure exhibited zero gradient norms under certain configurations—the model was not actually training. Always verify gradient flow [^481^].

**Unsloth Hyperparameter Defaults**:
```python
from unsloth import FastLanguageModel

model = FastLanguageModel.get_peft_model(
    model,
    r=16,                    # Suggested: 8, 16, 32, 64, 128
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj",
                    "gate_proj", "up_proj", "down_proj"],
    lora_alpha=16,
    lora_dropout=0,          # 0 is optimized
    bias="none",             # "none" is optimized
    use_gradient_checkpointing="unsloth",  # 30% memory reduction
    random_state=3407,
    use_rslora=False,        # Rank stabilized LoRA
)
```

### 3.6 Distilabel: Synthetic Data Generation

**Distilabel** is an open-source framework by Argilla for building scalable synthetic data and AI feedback pipelines [^552^] [^553^].

**Capabilities**:
- Instruction-following data generation
- DPO preference pair synthesis
- AI feedback and judgment
- Multi-step pipeline composition

**Integration with Agent-47**:
```python
from distilabel.pipeline import Pipeline
from distilabel.steps.tasks import TextGeneration

# Generate training data from agent interaction traces
with Pipeline(name="agent-synth") as pipeline:
    generate_task = TextGeneration(
        llm=agent_teacher_model,  # Claude Opus / GPT-5.5
        input_batch_size=10,
    )
    # Output: synthetic preference pairs for KTO training
```

Key datasets produced: 1M OpenHermesPreference, improved Intel Orca DPO [^552^].

### 3.7 Preference Optimization: KTO vs DPO

**KTO (Kahneman-Tversky Optimization)** consistently outperforms DPO:

| Method | Memory | Forward Passes | Paired Data Required |
|---|---|---|---|
| DPO | 2x model | 2x per step | Yes (must have pairs) |
| KTO | 2x model | 2x per step | No (binary signal only) |
| ORPO | 1x model | 1x per step | Yes (single-stage) |

**Key KTO Advantages** [^499^] [^509^]:
- Works with binary feedback (thumbs up/down) — no preference pairs needed
- After discarding 90% of desirable examples, KTO still outperforms DPO
- Better for noisy, real-world feedback data
- KTO alone matches performance of SFT + DPO combined

**For Agent-47**: KTO is ideal because pheromone signals provide binary feedback naturally. No need to construct preference pairs.

---

## 4. Memory Architectures for Agent Persistence

### 4.1 Comparative Benchmark Analysis

| Framework | Deep Memory Retrieval | LongMemEval | LoCoMo | Tokens/Query | Latency (p50) |
|---|---|---|---|---|---|
| Full Context | Baseline | Baseline | Baseline | ~26,000 | 9.87s |
| MemGPT/Letta | 93.4% | Not published | — | — | — |
| Zep | **94.8%** | +18.5% vs baseline | — | — | 1.292s |
| Mem0 (2025) | — | 49.0% | — | — | **0.148s** |
| Mem0 (2026) | — | **94.4%** | **92.5%** | **6,787** | 0.148s |
| LangMem | — | — | — | — | 17.99s (p50) |

### 4.2 Mem0: Production Memory Layer

**Architecture**: Three-tier system — user memory, session memory, agent memory scopes. Backed by hybrid vector + graph + key-value store [^502^].

**Key Features**:
- Self-editing: When facts conflict, Mem0 self-edits rather than appending duplicates
- Multi-signal retrieval: Three parallel scoring passes (semantic similarity, keyword matching, entity matching) with fused scoring
- 51,000+ GitHub stars; $24M funding; used by 100,000+ developers [^501^]

**2026 Algorithm Improvements**:
- Single-pass ADD-only extraction (agent-generated facts stored with equal weight)
- Multi-signal retrieval (semantic + BM25 + entity matching)
- Temporal query improvement: +29.6 points
- Multi-hop reasoning improvement: +23.1 points [^502^]

**API**:
```python
from mem0 import MemoryClient
client = MemoryClient(api_key="key")
client.add("I prefer Python over JavaScript", user_id="aashi")
results = client.search("programming language preferences", user_id="aashi")
```

**Search Latency**: p50: 0.148s, p95: 0.200s (lowest among all methods) [^500^]

### 4.3 Letta (formerly MemGPT)

**Origin**: UC Berkeley research project; published at arXiv:2310.08560. Raised $10M seed (Felicis) with angels including Jeff Dean and Clem Delangue [^507^].

**Architecture**: LLM-as-OS concept with tiered memory:
- **Core Memory** (RAM): Working context, always in prompt
- **Recall Memory** (Cache): Recent conversation history
- **Archival Memory** (Disk): Long-term storage, retrieved on-demand

**Agent manages memory through explicit function calls** (search_archival, core_memory_replace, etc.) [^507^].

**Benchmarks**: GPT-4 Turbo with MemGPT reached **93.4%** on Deep Memory Retrieval vs 35.3% for recursive summarization baseline. Letta Code is #1 model-agnostic open-source agent on Terminal-Bench [^501^].

### 4.4 Zep: Temporal Knowledge Graph

**Paper**: *Zep: A Temporal Knowledge Graph Architecture for Agent Memory* (arXiv:2501.13956) [^539^]

**Core Innovation**: Graphiti, a temporally-aware knowledge graph engine that tracks *when* facts were true, not just *that* they were true. Every edge carries four timestamps (valid from, valid to, observed, recorded) [^541^].

**Bi-Temporal Model**:
```
Edge: (entity) --[relationship, t_valid, t_invalid, t_observed, t_recorded]--> (entity)

When new info contradicts existing fact:
  - Close old fact's validity window (set t_invalid)
  - Create new fact with new validity window
  - History preserved, not deleted
```

**Performance**:
- DMR benchmark: **94.8%** (vs MemGPT 93.4%)
- LongMemEval: up to **18.5% accuracy improvement**
- **90% lower response latency** vs full-context baselines
- P95 retrieval latency: **300ms** [^540^]

**For Agent-47**: Zep's temporal model is ideal for tracking evolving agent relationships, hive membership changes, and BFT Council decisions over time.

### 4.5 LangMem

**LangMem** is the SDK launched by LangChain in early 2025 for agent long-term memory [^503^] [^507^].

**Three Memory Types**:
1. **Episodic**: Past interactions, conversation history
2. **Semantic**: Extracted facts, user preferences, knowledge triples
3. **Procedural**: Learned behavior rules — agents can rewrite their own system prompts based on feedback [^507^]

**Integration**:
```python
from langmem import create_memory_manager
manager = create_memory_manager(
    "anthropic:claude-3-5-sonnet-latest",
    instructions="Extract user preferences and facts",
    enable_inserts=True
)
memories = manager.invoke({"messages": conversation})
```

**Limitation**: Search latency p50: 17.99s, p95: 59.82s — impractical for interactive applications [^500^].

### 4.6 Recommendation for Agent-47's 5-Tier Memory

| CSOAI Tier | Technology | Function |
|---|---|---|
| L1 (Immediate) | Letta Core Memory | Working context in prompt |
| L2 (Short-term) | Letta Recall | Recent conversation history |
| L3 (Medium-term) | Mem0 | Agent facts, preferences, user data |
| L4 (Long-term) | Zep Graphiti | Temporal knowledge graph, relationships |
| L5 (Collective) | Custom (pheromone-encoded) | Cross-hive shared memory |

---

## 5. Personality Modeling: The Big Five OCEAN Framework

### 5.1 The Five-Factor Model in LLMs

**Paper**: *Personality-Driven Decision-Making in LLM-Based Autonomous Agents* (arXiv:2504.00727) [^536^]

The OCEAN model induces personality through prompt-based statements:

| Trait | Forward (Positive) | Reverse (Negative) |
|---|---|---|
| **O**penness | Curious, creative, exploratory | Traditional, conventional, cautious |
| **C**onscientiousness | Organized, reliable, disciplined | Careless, spontaneous, easy-going |
| **E**xtraversion | Outgoing, energetic, assertive | Reserved, quiet, introverted |
| **A**greeableness | Cooperative, trusting, empathetic | Competitive, skeptical, detached |
| **N**euroticism | Anxious, sensitive, volatile | Stable, confident, calm |

### 5.2 Personality Induction Method

Combined approach (naive + word-based descriptors):
```
"Imagine you are an extraverted person, characterised by being 
outgoing, energetic, public."
```

**Findings from Research** [^536^]:
- **Openness, Conscientiousness, Extraversion** substantially impact task prioritization, causing significant deviations from baseline schedules
- **Agreeableness and Neuroticism** have less pronounced effects (LLMs less receptive to these traits or limited task relevance)
- Effects more pronounced in GPT-4o than GPT-3.5-Turbo (greater reasoning capacity enables better trait expression)
- Temperature variation (0.1 - 1.0) modulates trait expression strength

### 5.3 Negotiation Behavior Study

**Paper**: *Exploring Big Five Personality and AI Capability Effects in LLM-Simulated Negotiation Dialogues* (arXiv:2506.15928) [^538^]

In job negotiation simulations with GPT-4o:
- **Agreeableness** and **Extraversion** are most influential on negotiation outcomes
- High Agreeableness → more concessions, lower individual score
- High Extraversion → more assertive, higher individual score
- Zero-sum dynamics confirmed: one agent's gain = other's loss
- Temperature 0.7 provides consistent results [^538^]

### 5.4 Recommended OCEAN Profiles for Agent-47 Castes

| Caste | Openness | Conscientiousness | Extraversion | Agreeableness | Neuroticism |
|---|---|---|---|---|---|
| **Drones** | 0.4 | 0.9 | 0.2 | 0.6 | 0.1 |
| **Builders** | 0.9 | 0.8 | 0.5 | 0.5 | 0.2 |
| **Guardians** | 0.5 | 0.9 | 0.7 | 0.3 | 0.1 |
| **Nexus** | 0.8 | 0.7 | 0.8 | 0.6 | 0.3 |
| **BFT Council** | 0.7 | 0.9 | 0.4 | 0.8 | 0.1 |

**Implementation**: Store OCEAN values (0.0-1.0) per agent in L3 memory. Prefix each prompt with personality induction statement. Adjust temperature based on Neuroticism score (high N = higher temperature for variability).

---

## 6. Self-Improvement: Reflect-Retry-Reward Loops

### 6.1 Reflect-Retry-Reward Framework

**Paper**: *Reflect, Retry, Reward: Self-Improving LLMs via Reinforcement Learning* (arXiv:2505.24726) [^514^] [^521^]

**Two-Stage Process**:
```
Stage 1: Task Attempt
  └─ Generate initial response to query
  └─ If correct → stop (reward the correct answer)
  └─ If incorrect → proceed to Stage 2

Stage 2: Reflection & Retry
  └─ Generate self-reflective commentary analyzing failure
  └─ Retry the task WITH reflection in context
  └─ If retry succeeds → reward the REFLECTION tokens (not the answer)
  └─ Reward computed via GRPO (Group Relative Policy Optimization)
```

**Critical Insight**: The reward goes to the **reflection tokens**, not the final answer. This teaches the model *how to think about its mistakes*, not just task-specific solutions [^516^].

**Performance Gains**:

| Task | Architecture | Improvement |
|---|---|---|
| Math equation writing | Various (1.5B - 7B) | **+34.7%** |
| Function calling | Various (1.5B - 7B) | **+18.1%** |

**Smaller Fine-Tuned Models Outperform 10x Larger Models**: A 7B parameter model trained with Reflect-Retry-Reward outperforms 70B models in the same family [^514^].

**Reward Mechanism**: Uses GRPO with binary feedback only (success/failure). No labeled datasets needed. The advantage is computed as:
```
Advantage_i = (reward_i - mean(rewards)) / std(rewards)
```

### 6.2 RISE: Recursive Introspection

**Paper**: *Teaching Language Model Agents How to Self-Improve* (NeurIPS 2024) [^568^]

RISE trains models to improve responses over sequential attempts using:
1. **On-policy rollouts**: Sample from the learner itself
2. **Best-of-N selection**: Select best revision candidates using success indicator
3. **Reward-weighted regression**: Fine-tune on both high- and low-quality rollouts
4. **Iterative procedure**: Repeat to instill general self-improvement

**Results**:
- LLaMA3-8B on GSM8K: **+8.2%** over 5 turns
- Mistral-7B on GSM8K: **+23.9%** over 5 turns
- GPT-3.5 comparison: only +4.6% over 5 turns [^568^]

### 6.3 RLVR: Reinforcement Learning with Verifiable Rewards

DeepSeek-R1 demonstrated the power of simple rule-based verification:
- **Math**: Check if answer matches known solution
- **Code**: Run compiler, return pass/fail
- **Binary rewards**: 1 for correct, 0 for wrong
- **No human preference data needed**

**GRPO replaces PPO**:
| Component | PPO | GRPO |
|---|---|---|
| Critic model | Required (full-size LLM) | Not needed |
| Reward model | Learned | Rule-based verifier |
| Models in memory | 4 (policy + reference + critic + reward) | 2 (policy + reference) |
| KL regularization | Explicit penalty | Implicit via reference |

DeepSeek R1-Zero went from **15.6% → 77.9%** on AIME 2024 with GRPO + verifiable rewards, zero SFT [^569^].

### 6.4 Self-Challenging Agents (NeurIPS 2025)

Zhou et al. introduced agents that generate their own training tasks:
- **Challenger** role: Creates new tasks with verified test code
- **Executor** role: Solves tasks; tests provide scalar reward
- RL on self-generated data **doubles performance** of LLaMA-3.1-8B on tool-use benchmarks
- Fully label-free; tasks scale with capability [^565^]

### 6.5 Implementation for Agent-47

```python
class ReflectRetryReward:
    """Self-improvement loop for agent task execution"""
    
    def execute(self, task, max_retries=3):
        # Attempt 1: Direct execution
        response = self.llm.generate(task)
        if self.verifier.verify(response, task):
            return response  # Success on first try
        
        # Attempt 2+: Reflect and retry
        for attempt in range(1, max_retries):
            reflection = self.llm.reflect(task, response, self.verifier.error)
            retry_context = f"{task}\n\nReflection: {reflection}"
            new_response = self.llm.generate(retry_context)
            
            if self.verifier.verify(new_response, task):
                # Reward reflection tokens via GRPO
                self.reward(reflection_tokens=reflection, reward=1.0)
                return new_response
            else:
                self.reward(reflection_tokens=reflection, reward=0.0)
        
        return new_response  # Best effort after max retries
```

---

## 7. Model Distillation for Local Inference

### 7.1 ECLD: Edge Compact LLM Deployment

**Paper**: *Compact LLM Deployment and World Model Assisted Offloading in Mobile Edge Computing* (2026) [^535^]

**Four-Stage Pipeline**:
```
Stage I: Sequential Model Pruning    → Remove redundant neurons/heads/layers
Stage II: Model Distillation         → Knowledge distillation for performance recovery
Stage III: Model Quantization        → Hardware-aware quantization
Stage IV: Optimized Deployment       → Format conversion + model compilation
```

**Results**:

| Model | Method | Accuracy | Storage | Energy |
|---|---|---|---|---|
| Llama-3.1-8B (original) | — | 70.30% | 15.3 GB | 0.24 Wh |
| **ECLD** | **Prune + Distill + Quantize** | **59.05%** | **3.3 GB** | **0.12 Wh** |

Storage reduction: **70-80%**. Energy reduction: **50%** [^535^].

### 7.2 Qwen3-4B: Strong-to-Weak Distillation

**Qwen3-4B** (Alibaba, April 2025) is the flagship small model for local inference [^515^] [^519^]:

**Benchmarks**:

| Benchmark | Qwen3-4B Score |
|---|---|
| MMLU-Redux | 83.7 |
| C-Eval | 77.5 |
| MATH-500 | 97.0 |
| MLogiQA | 65.9 |
| RULER (4K-128K avg) | 85.2 (non-thinking) |

**Key Capabilities**:
- Thinking and non-thinking modes
- 128K context window
- Strong multilingual performance
- Strong-to-weak distillation from larger Qwen3 models
- Outperforms Qwen2.5 7B despite being smaller [^519^]

**LLM Benchmarks Summer 2025** [^512^]:

| Model | Overall Score | Local Deployable |
|---|---|---|
| qwen/qwen3-235b-a22b | 62.8% | Yes |
| qwen/qwen3-32b | 71.1% | Yes |
| qwen/qwen3-14b | 56.1% | Yes |
| qwen/qwen3-4b | ~45% | Yes |
| deepseek/deepseek-r1-distill-qwen-32b | 21.2% | Yes |

### 7.3 Recommendation for Agent-47

**Tiered Model Strategy**:

| Query Type | Model | Location |
|---|---|---|
| Complex reasoning, code generation | Claude Opus 4.8 / GPT-5.5 | Cloud |
| Standard tasks, tool use | Qwen3-14B / DeepSeek V4 | Edge |
| Simple queries, high-frequency | Qwen3-4B | Local (on-device) |
| Emergency fallback | Qwen3-1.7B | Local (embedded) |

Target: **80% local inference** for cost reduction and latency improvement.

---

## 8. Constitutional AI for Multi-Agent Alignment

### 8.1 Anthropic's Constitutional AI Framework

**Paper**: *Constitutional AI: Harmlessness from AI Feedback* (arXiv:2212.08073) [^546^]

**Two-Phase Process**:

**Phase 1: Supervised Learning (Self-Critique)**
1. Generate initial response to prompt
2. Critique response according to constitutional principles
3. Revise response to improve harmlessness
4. Fine-tune on principle-informed revisions

**Phase 2: Reinforcement Learning (RLAIF)**
1. Generate pairs of responses to harmful prompts
2. AI evaluates preferences based on constitutional principles
3. Train reward model on combined human helpfulness + AI harmlessness data
4. Fine-tune with RL using the reward model [^557^]

**Key Principles** (sample constitution):
- Choose responses that are helpful, honest, and harmless
- Avoid responses that are obnoxious, racist, sexist, or overly reactive
- Prefer explanations over evasions when discussing sensitive topics
- Respect human autonomy and dignity

**Advantages**: Efficiency (no human harmlessness labels), transparency (natural language principles), objectivity (consistent application) [^555^]

### 8.2 Multi-Agent Constitutional Governance

For multi-agent systems, governance frameworks require [^572^] [^577^]:

1. **Agent Identity and Permissions**: Defined scope, tool access, communication permissions, resource limits
2. **Coordination Protocols**: Handoff procedures, conflict resolution, escalation paths, shared state management
3. **Inter-Agent Communication Governance**: Input validation, context isolation, audit logging, rate limiting
4. **Collective Behavior Monitoring**: Task completion rates, interaction patterns, resource utilization, emergent signals
5. **Distributed Accountability**: Decision attribution, audit trails, incident ownership, improvement loops

**Core Principles** [^577^]:
- **Decentralized control**: Distribute governance across the system
- **Adaptable rules**: Evolve governance as system learns
- **Conflict resolution**: Protocols for competing objectives
- **Trust mechanisms**: Reputation systems between agents
- **Feedback loops**: Continuous improvement pathways

### 8.3 Recommended Constitution for Agent-47

```yaml
# Agent-47 Multi-Agent Constitution
principles:
  - "An agent shall not act against the interests of the collective"
  - "An agent shall maintain transparency in decision-making"
  - "An agent shall respect the caste hierarchy for task assignment"
  - "An agent shall report anomalies to the BFT Council"
  - "An agent shall prioritize collective survival over individual optimization"
  - "An agent shall not withhold information from allied agents"
  - "An agent shall verify facts before propagating them"
  - "An agent shall degrade gracefully under resource constraints"

enforcement:
  mechanism: "constitutional_ai_rlaif"
  reward_model: "co-evolving_grm"
  audit_trail: "zep_temporal_graph"
  conflict_resolution: "bft_voting"
```

---

## 9. Deployment Patterns & Production Architecture

### 9.1 Recommended Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SOV3 King (Orchestrator)                   │
│              Claude Opus 4.8 / GPT-5.5 (Cloud)               │
│                    Constitutional Governor                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
       ┌───────────────┼───────────────┐
       │               │               │
  ┌────▼────┐    ┌────▼────┐    ┌────▼────┐
  │ Hive A  │    │ Hive B  │    │ Hive C  │
  │ Queen   │    │ Queen   │    │ Queen   │
  │(Qwen3-14B│   │(DeepSeek V4)│  │(Qwen3-8B)│
  └────┬────┘    └────┬────┘    └────┬────┘
       │              │              │
  ┌────┴──────────┐  ┌┴──────────┐  ┌┴──────────┐
  │ Workers       │  │ Workers   │  │ Workers   │
  │(Qwen3-4B local)│ │(Qwen3-4B)  │  │(Qwen3-4B)  │
  │               │  │           │  │           │
  │ + LoRA per    │  │ + LoRA per│  │ + LoRA per│
  │   caste       │  │   caste   │  │   caste   │
  │               │  │           │  │           │
  │ Memory: Mem0  │  │ Memory:   │  │ Memory:   │
  │   + Zep KG    │  │   Mem0    │  │   Mem0    │
  └───────────────┘  └───────────┘  └───────────┘
```

### 9.2 Fine-Tuning Pipeline

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌─────────────┐
│   Data      │───→│   Distilabel  │───→│  Unsloth    │───→│   vLLM +    │
│ Collection  │    │   Synthetic   │    │  DoRA       │    │   S-LoRA    │
│ (interaction│    │   Data Gen    │    │  Fine-Tune  │    │   Serving   │
│   traces)   │    │   + KTO       │    │  (DoRA r=16)│    │             │
└─────────────┘    └──────────────┘    └─────────────┘    └─────────────┘
  Pheromone           Binary feedback    3-4% gain over    2000 adapters
  signals             (KTO)              LoRA, zero        per GPU
  (binary)                               inference cost
```

### 9.3 Self-Improvement Loop

```
┌────────────────────────────────────────────────────────────────┐
│                    SELF-IMPROVEMENT CYCLE                       │
│                                                                 │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐ │
│  │  Execute  │───→│  Verify   │───→│  Reflect  │───→│  Retry    │ │
│  │  (Worker) │    │  (Rule/   │    │  (LLM     │    │  (LLM +  │ │
│  │           │    │   Test)   │    │  critique)│    │  reflect) │ │
│  └──────────┘    └────┬─────┘    └──────────┘    └────┬─────┘ │
│                       │                                │       │
│                 ┌─────▼──────┐                  ┌─────▼──────┐ │
│                 │  Success ──→── Reward via GRPO │  Failure ──→─│
│                 │  (log)     │                  │  (retry)   │ │
│                 └────────────┘                  └────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

### 9.4 Memory Flow

```
Interaction → Mem0 (extract facts) → Zep Graphiti (temporal KG)
                    ↓                          ↓
              L3 Semantic               L4 Long-term
              (searchable)              (versioned)
                    ↘                  ↙
                    ┌────────────────┐
                    │  Context        │
                    │  Assembly       │
                    │  ( fused score) │
                    └───────┬────────┘
                            │
                    ┌───────▼────────┐
                    │  LLM Prompt     │
                    │  (ranked,       │
                    │   deduplicated) │
                    └────────────────┘
```

---

## 10. Implementation Roadmap for Agent-47

### Phase 1: Infrastructure (Weeks 1-4)
- [ ] Deploy vLLM with S-LoRA for multi-adapter serving
- [ ] Set up Unsloth fine-tuning pipeline with DoRA
- [ ] Deploy Mem0 self-hosted for L3 memory
- [ ] Configure Qwen3-4B as local inference base

### Phase 2: Fine-Tuning (Weeks 5-8)
- [ ] Generate synthetic training data via Distilabel
- [ ] Train caste-specific LoRA adapters (Drone, Builder, Guardian, Nexus)
- [ ] Apply KTO preference optimization with pheromone signals
- [ ] Benchmark against off-the-shelf baselines

### Phase 3: Memory (Weeks 9-12)
- [ ] Deploy Zep Graphiti for temporal knowledge graph
- [ ] Implement 5-tier memory architecture (L1-L5)
- [ ] Integrate Mem0 + Zep hybrid retrieval
- [ ] Establish memory persistence across sessions

### Phase 4: Personality (Weeks 13-16)
- [ ] Define OCEAN profiles per caste
- [ ] Implement prompt-based personality induction
- [ ] A/B test personality-driven vs. baseline behavior
- [ ] Tune temperature per Neuroticism scores

### Phase 5: Self-Improvement (Weeks 17-20)
- [ ] Implement Reflect-Retry-Reward loop
- [ ] Deploy verifiable reward verifiers per domain
- [ ] Train with GRPO on binary feedback
- [ ] Establish continuous learning pipeline

### Phase 6: Governance (Weeks 21-24)
- [ ] Draft multi-agent constitution
- [ ] Implement RLAIF for constitutional enforcement
- [ ] Deploy BFT Council voting mechanism
- [ ] Full integration testing across all 5 hives

---

## 11. References

[^301^] MARFT: Multi-Agent Reinforcement Fine-Tuning. arXiv:2504.16129v4. https://arxiv.org/html/2504.16129v4

[^480^] Hong et al. Training Multi-Agent Systems with M-GRPO. arXiv:2511.13288. https://arxiv.org/abs/2511.13288

[^481^] Chronicals: A High-Performance Framework for LLM Fine-Tuning. arXiv:2601.02609. https://arxiv.org/html/2601.02609v1

[^499^] Seneviratne et al. Federated Fine-Tuning of Large Language Models: KTO vs DPO. arXiv:2502.14187. https://arxiv.org/abs/2502.14187

[^500^] Mem0 Research Paper. ECAI 2025. arXiv:2504.19413. https://arxiv.org/pdf/2504.19413

[^501^] Preuve.ai. AI Memory Systems Statistics 2026. https://preuve.ai/blog/ai-memory-systems-statistics-2026

[^502^] Mem0. State of AI Agent Memory 2026. https://mem0.ai/blog/state-of-ai-agent-memory-2026

[^503^] LangMem SDK for Agent Long-Term Memory. LangChain Blog. https://www.langchain.com/blog/langmem-sdk-launch

[^507^] Towards AI. The State of AI Agent Memory in 2026. https://pub.towardsai.net/the-state-of-ai-agent-memory-in-2026-0b77063c2c2b

[^508^] Atlan. Zep vs Mem0: AI Memory Layer Comparison. https://atlan.com/know/zep-vs-mem0/

[^509^] Argilla. RLHF and Alternatives: KTO. https://argilla.io/blog/mantisnlp-rlhf-part-7/

[^511^] Vectorize. Mem0 vs Letta Comparison. https://vectorize.io/articles/mem0-vs-letta

[^512^] TimeToAct. LLM Benchmarks Summer 2025. https://www.timetoact-group.at/en/insights/llm-benchmarks/llm-benchmarks-summer-2025

[^514^] Russak et al. Reflect, Retry, Reward: Self-Improving LLMs via RL. arXiv:2505.24726. https://arxiv.org/abs/2505.24726

[^515^] Qwen3 Technical Report. arXiv:2505.09388. https://arxiv.org/pdf/2505.09388

[^519^] OpenLaboratory. Qwen3 4B Model Page. https://openlaboratory.com/models/qwen3-4b/

[^520^] Aman.ai. Parameter Efficient Fine-Tuning Primer. https://aman.ai/primers/ai/parameter-efficient-fine-tuning/

[^521^] Unsloth. LoRA Hyperparameters Guide. https://unsloth.ai/docs/get-started/fine-tuning-llms-guide/lora-hyperparameters-guide

[^535^] Compact LLM Deployment in Mobile Edge Computing. arXiv:2602.13628. https://arxiv.org/html/2602.13628v1

[^536^] Newsham et al. Personality-Driven Decision-Making in LLM Agents. arXiv:2504.00727. https://arxiv.org/html/2504.00727v1

[^538^] Big Five Personality in LLM-Simulated Negotiation. arXiv:2506.15928. https://arxiv.org/html/2506.15928v2

[^539^] Rasmussen et al. Zep: A Temporal Knowledge Graph Architecture for Agent Memory. arXiv:2501.13956. https://arxiv.org/abs/2501.13956

[^540^] Neo4j. Graphiti: Knowledge Graph Memory for Agentic World. https://neo4j.com/blog/developer/graphiti-knowledge-graph-memory/

[^541^] Zep. What Is a Temporal Knowledge Graph? https://www.getzep.com/ai-agents/temporal-knowledge-graph/

[^543^] Redis. Model Distillation for LLMs Guide. https://redis.io/blog/model-distillation-llm-guide/

[^544^] S-LoRA: Serving Thousands of Concurrent LoRA Adapters. MLSys 2024. https://proceedings.mlsys.org/paper_files/paper/2024/file/906419cd502575b617cc489a1a696a67-Paper-Conference.pdf

[^545^] Liu et al. DoRA: Weight-Decomposed Low-Rank Adaptation. ICML 2024 Oral. arXiv:2402.09353. https://arxiv.org/abs/2402.09353

[^546^] Anthropic. Constitutional AI: Harmlessness from AI Feedback. arXiv:2212.08073. https://arxiv.org/pdf/2212.08073

[^548^] Future AGI. Synthetic Data for LLM Fine-Tuning 2026. https://futureagi.com/blog/synthetic-data-fine-tuning-llms/

[^549^] Distilabel Docs. Synthetic Data Generation. https://argilla-io.github.io/distilabel/1.4.0/

[^552^] Hugging Face. Distilabel Documentation. https://huggingface.co/docs/hub/en/datasets-distilabel

[^555^] GigaSpaces. What Is Constitutional AI? https://www.gigaspaces.com/data-terms/constitutional-ai

[^556^] NVIDIA. Introducing DoRA. https://developer.nvidia.com/blog/introducing-dora/

[^557^] Harvard. Evaluation and Augmentation of Inverse Constitutional AI. https://dash.harvard.edu/bitstreams/8d79fa6f-a4fc-4cd5-931d-23214597c41d/download

[^565^] Yohei Nakajima. Better Ways to Build Self-Improving AI Agents. https://yoheinakajima.com/better-ways-to-build-self-improving-ai-agents/

[^566^] Learning Implicit Credit Assignment for Cooperative MARL. NeurIPS 2020. https://proceedings.neurips.cc/paper_files/paper/2020/

[^568^] NeurIPS 2024. Teaching Language Model Agents How to Self-Improve. https://proceedings.neurips.cc/paper_files/paper/2024/file/639d992f819c2b40387d4d5170b8ffd7-Paper-Conference.pdf

[^569^] Daily Dose of DS. How Top AI Labs Are Building RL Agents in 2026. https://blog.dailydoseofds.com/p/how-top-ai-labs-are-building-rl-agents

[^572^] Swept.ai. Multi-Agent AI Governance. https://www.swept.ai/multi-agent-ai-governance

[^573^] AAAI. Learning Explicit Credit Assignment for Cooperative Multi-Agent. https://ojs.aaai.org/index.php/AAAI/article/view/26364/26136

[^577^] Axrail. Governance for Autonomous Agents. https://www.axrail.ai/post/governance-for-autonomous-agents

[^578^] IMDA. Model AI Governance Framework for Agentic AI. https://www.imda.gov.sg/-/media/imda/files/about/emerging-tech-and-research/artificial-intelligence/mgf-for-agentic-ai.pdf

---

*End of Research Brief — Dimension 3: AI Agent Intelligence*
*Total Searches: 18 independent queries | Sources: 40+ | Pages: ~12*
