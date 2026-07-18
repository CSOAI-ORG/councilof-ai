# Facet: AI Agent Intelligence, Fine-tuning & Memory Architectures

## Research Brief for CSOAI Agent-47 Platform
**Date**: July 2025
**Scope**: 46 AI agents across 5 hives (Finance, Creative, Operations, Governance, Research)
**Searches Conducted**: 15 independent queries across 9 research domains

---

## Executive Summary

This research brief synthesizes findings across nine critical domains for enhancing CSOAI Agent-47's multi-agent platform. The platform currently uses off-the-shelf models (Claude, GPT, Kimi, DeepSeek) with 46 agents across 5 hives. The research identifies concrete opportunities for making agents smarter, more consistent, and more personalized through:

1. **Memory Architecture**: Tiered OS-style memory systems (Letta/MemGPT pattern) with vector+graph hybrid stores
2. **Fine-tuning Pipelines**: Unsloth for speed, Llama-Factory for accessibility, multi-stage alignment via DPO/KTO/IPO
3. **Multi-Agent RL**: MARFT paradigm for principled multi-agent fine-tuning with LoRA adapters per agent
4. **Personality Modeling**: Big Five (OCEAN) trait prompting with relationship graphs
5. **Constitutional AI**: Debate-based training and self-correction loops via GRPO
6. **Agent Specialization**: Multi-LoRA composition for domain-specific inference per hive
7. **Self-Improvement**: Auto-generated training data, recursive refinement, debate-to-distill
8. **Emergent Coordination**: Quorum-sensing algorithms and collective decision-making patterns
9. **Model Distillation**: Local model deployment with cloud escalation for complex reasoning

---

## 1. Agent Memory Systems

### 1.1 Landscape Overview (2026)

The agent memory landscape has matured significantly, with five major frameworks leading production deployments [^331^][^333^][^372^]:

| Framework | Memory Class | Architecture | Open Source | GitHub Stars | Best For |
|-----------|-------------|--------------|-------------|--------------|----------|
| **Mem0** | Personalization + institutional | Vector + Graph (dual-store) | Apache 2.0 | ~48K | Fastest integration, managed service |
| **Hindsight** | Institutional learning | Multi-strategy hybrid | MIT | ~4K | Long-term learning (SOTA on LongMemEval) |
| **Letta** | Both (OS-style) | Tiered: core/recall/archival | Apache 2.0 | ~21K | Stateful agents with explicit memory control |
| **Zep/Graphiti** | Temporal | Temporal Knowledge Graph | Open (Graphiti) | ~24K | Temporal reasoning, "when did this change?" |
| **LangMem** | Personalization | Flat key-value + vector | MIT | ~1.3K | LangGraph teams only |
| **Cognee** | Institutional | KG + Vector | Open core | ~12K | Enterprise knowledge control planes |

### 1.2 Key Architectural Pattern: OS-Style Tiered Memory

The dominant architecture, popularized by the MemGPT paper (UC Berkeley) and productized by **Letta**, treats the LLM as an operating system [^372^][^373^][^374^]:

- **Core Memory** (like RAM): Always in-context. Holds user persona, agent persona, current task. Small, hot, fast.
- **Recall Memory** (like swap): Conversation history. Scrollable, searchable, swappable.
- **Archival Memory** (like disk): External vector store. Massive, cheap, retrieved on demand.

**Critical insight**: The agent itself decides what moves between tiers via explicit tool calls (`memory.insert()`, `memory.search()`, `memory.swap()`). The original MemGPT paper achieved **93.4% on Deep Memory Retrieval** [^372^].

**Letta's competitive positioning** [^373^]:
- Born from MemGPT research, now YC-backed with $10M seed
- Model-agnostic (OpenAI, Anthropic, Mistral, local models)
- Letta Code scored 42.5% on Terminal-Bench (#1 open-source model-agnostic agent)
- Core innovation: agent as autonomous memory manager

### 1.3 Vector + Graph Hybrid Approaches

**Mem0's dual-store architecture** [^337^][^338^][^339^]:
- **Extraction phase**: LLM analyzes conversations, identifies salient facts
- **Update phase**: Intelligent operations (ADD, UPDATE, DELETE, NOOP) against hybrid store
- Achieves **90%+ reduction in token costs**, 26% better accuracy, 91% lower latency vs. full-context
- Graph-enhanced Mem0g: stores memories as directed labeled graphs, excels on temporal reasoning (58.13% vs. OpenAI's 21.71% on time-sensitive questions)
- Benchmark on LOCOMO: Mem0 achieves 66.88% LLM-as-Judge score with p95 latency of just 0.200 seconds [^339^]

**Zep/Graphiti temporal knowledge graph** [^333^]:
- Key differentiator: temporal awareness -- knows when each fact was learned, updated, and how it relates to others
- Enables reasoning like "you used to prefer Python, but in March you switched to Rust"
- Graphiti: open-source temporally-aware graph engine for dynamic conversational data

**Hindsight: SOTA on LongMemEval** [^433^]:
- Eliminates shortcomings of both RAG and knowledge graphs
- Independently verified by Virginia Tech and The Washington Post
- Production use at Fortune 500 enterprises
- Two-line integration via LLM Wrapper

### 1.4 Memory Framework Selection for CSOAI Agent-47

**Recommendation**: Hybrid approach:
- **Letta** for long-running agents needing OS-style memory management (Research hive, Governance hive)
- **Mem0** for fast personalization across Finance and Operations hives
- **Zep/Graphiti** for temporal reasoning in Finance (tracking changing market conditions, evolving compliance rules)

### 1.5 Four Memory Types Required

Per the 2026 engineering consensus [^372^], production agents need:
1. **Working memory**: Current context window
2. **Episodic memory**: Specific past events and conversations
3. **Semantic memory**: Extracted facts, preferences, entities
4. **Procedural memory**: Agent's own instructions, learned behaviors

---

## 2. Fine-tuning Pipelines

### 2.1 Framework Comparison

| Framework | Speed vs Baseline | VRAM | Multi-GPU | Best For |
|-----------|-------------------|------|-----------|----------|
| **Unsloth** | 2-5x faster | 70% less | Single GPU only | Speed-focused, single GPU research |
| **Axolotl** | 1x (standard) | Good with FSDP2 | Full multi-GPU, multi-node | Production teams, FSDP/DeepSpeed |
| **LLaMA-Factory** | 1-2x (with Unsloth backend) | Moderate | DeepSpeed | Beginners, zero-code, 100+ models |
| **TRL** | 1x (standard) | Standard | Limited | RLHF, DPO, alignment research |
| **TorchTune** | 1.2x (with compile) | Moderate | FSDP2 native | PyTorch developers |

**Key finding**: LLaMA-Factory with Unsloth backend trains within 6% of native Unsloth speed -- you often don't have to choose between ease and performance [^330^][^332^].

### 2.2 Detailed Framework Analysis

**Unsloth** (53.9K+ stars) [^330^][^332^][^335^]:
- Custom Triton kernels for attention, MLP layers, RoPE embeddings
- On A100 40GB: Llama-3.1 8B QLoRA in 3.2 hours vs. Axolotl's 5.8 hours
- Consumer GPUs viable: 7B model fits on RTX 4090 (24GB), 70B on A100 80GB
- February 2026: MoE training support, FP8 training, embedding model fine-tuning
- Limitation: Speed gains from custom kernels can lag behind new model architectures
- Multi-node training still developing

**Axolotl** [^332^][^335^]:
- YAML-first configuration, Docker recommended
- Full multi-GPU, multi-node with FSDP2 or DeepSpeed
- First-class multimodal support (vision-language models)
- GRPO implementation available

**LLaMA-Factory** (37K+ stars, ACL 2024 paper) [^330^][^332^]:
- Web UI at localhost:7860 -- zero-code fine-tuning
- Broadest model support (100+ templates)
- Can use Unsloth as backend for speed
- DeepSpeed integration out of the box

### 2.3 Alignment Techniques: DPO, IPO, KTO, and Variants

**Direct Preference Optimization (DPO)** [^344^][^347^][^349^][^351^]:
- Simplifies RLHF by eliminating explicit reward model
- Two-stage: SFT then DPO
- beta parameter typically 0.1-0.5
- Risk: optimizes at sequence level, neglects token-level influence; training destabilization from sampling distribution shifts

**Identity Preference Optimization (IPO)** [^347^][^351^]:
- Reformulates preference learning as regression with target margin 1/(2*beta)
- Squared loss creates self-correcting gradients
- **Advantage**: Prevents unbounded preference growth that occurs with DPO
- Shows advantages when training for many epochs or with high-confidence preference data

**Kahneman-Tversky Optimization (KTO)** [^347^][^351^]:
- Incorporates prospect theory insights: humans are more sensitive to bad outcomes than equivalent good ones
- Works with **unpaired binary feedback** (thumbs-up/down) without requiring direct comparisons
- Key hyperparameters: lambda_u/lambda_d loss aversion ratio (1.0-2.0), KL reference momentum (0.9-0.99)
- **Empirical finding**: KTO outperforms DPO across all tasks except multi-task understanding [^351^]

**ORPO (Odds Ratio Preference Optimization)** [^347^]:
- Eliminates reference model entirely -- single-stage training
- Reduces memory requirements by half
- Can reduce wall-clock time by 40-50% vs. two-stage approaches

**Comparative Performance** (from TI-DPO paper) [^344^]:

| Method | MMLU | GSM8K | GPQA | HumanEval | TruthfulQA | IFEval | Average |
|--------|------|-------|------|-----------|------------|--------|---------|
| SFT | 64.0 | 68.0 | 22.7 | 59.3 | 55.5 | 70.5 | 56.7 |
| DPO | 65.3 | 69.3 | 24.0 | 61.0 | 56.7 | 70.0 | 57.7 |
| IPO | 63.0 | 65.3 | 20.3 | 57.3 | 52.7 | 66.7 | 54.2 |
| KTO | 66.3 | 70.3 | 25.3 | 62.0 | 57.7 | 70.5 | 58.7 |
| GRPO | 70.7 | 75.7 | 28.0 | 64.3 | 59.9 | 74.0 | 62.1 |

**Practical Guidelines** [^347^]:
- **DPO**: Default choice. Degrades only with very long training or noisy data.
- **IPO**: Use when training for many epochs. Better calibration.
- **KTO**: Use when you have naturally unpaired binary feedback.
- **ORPO**: Use for rapid iteration. 40-50% faster training.

### 2.4 Recommendations for CSOAI Agent-47

1. **Use LLaMA-Factory with Unsloth backend** for most hive fine-tuning (best speed/ease tradeoff)
2. **Use Axolotl** for multi-GPU distributed training of larger domain models
3. **Start with KTO** for alignment (handles unpaired feedback well, top performance)
4. **Use GRPO** for reasoning-intensive hives (Research, Finance) -- shows highest average scores

---

## 3. Multi-Agent Reinforcement Learning

### 3.1 MARFT: Multi-Agent Reinforcement Fine-Tuning

**MARFT** (arXiv 2025) is the foundational paradigm for fine-tuning LLM-based multi-agent systems [^301^][^336^][^429^][^430^]:

**Core Innovation**: Adapts policy optimization methods (PPO) to multi-agent LLM context, addressing the unique challenges of LLM-based Multi-Agent Systems (LaMAS):
- Hierarchical organization and asynchronous execution
- Agents dynamically decompose tasks and adapt workflows
- Sequential decision-making patterns (not synchronous like traditional MARL)

**Two Instantiations**:
1. **MARFT-A** (Action-level): Optimizes entire agent responses as single actions
2. **MARFT-T** (Token-level): Refines individual token probabilities within responses

**Key Implementation Details**:
- Uses frozen transformer + trainable MLP critic head
- Each agent gets dedicated **LoRA adapter** on shared base model
- Action normalization addresses length bias (longer responses shouldn't be penalized)
- Agent-by-agent update restores monotonic improvement guarantee

**Results vs. Baseline (IPPO/MAPoRL)** [^429^]:
- **CodeForces**: MARFT-A scores 48.74 vs. IPPO's ~42 (6+ point improvement)
- **AIME math**: MARFT-A achieves 12.14% vs. IPPO's 10.92%
- **Stability**: MARFT-A standard error +/-0.56 vs. IPPO's +/-1.27 (2x more stable)
- IPPO suffers catastrophic performance collapse after ~150 steps; MARFT maintains robust upward trend

**LaMAS Organization Patterns**:
- **Solo**: Single agent baseline
- **Duo** (Reasoner -> Actor): +3 p.p. on math, +4 scores (~14.75%) on coding
- **Trio** (Reasoner -> Coder -> Reviewer): +2 scores (~6.81%) improvement over vanilla

### 3.2 CORY: Cooperative Multi-Agent RL (NeurIPS 2024)

**CORY** [^345^][^348^][^352^][^353^] extends RL fine-tuning to sequential cooperative MARL:

**Architecture**:
- Duplicates LLM into two agents: **Pioneer** and **Observer**
- Pioneer generates response from query; Observer generates response from query + pioneer's response
- Collective reward: r_CORY = r_pioneer + r_observer (both benefit from mutual improvement)

**Key Mechanisms**:
1. **Knowledge Transfer**: Observer leverages pioneer's output via in-context learning
2. **Role Exchange**: Agents periodically swap roles to prevent prompt bias

**Results**:
- Outperforms PPO on policy optimality, resistance to distribution collapse, and training robustness
- Tested on GPT-2 and Llama-2 with IMDB Review and GSM8K datasets
- Collects task reward from both agents' performance simultaneously

**Limitation**: Requires duplicating LLM into two copies (doubles computational resources); can be alleviated through parameter sharing [^348^]

### 3.3 MAGRPO: Multi-Agent Group Relative Policy Optimization (AAAI 2026)

**MAGRPO** [^354^] addresses multi-agent, multi-turn collaboration:

- Models LLM collaboration as cooperative MARL problem
- Multi-Agent, multi-turn algorithm building on GRPO + MARL techniques
- Demonstrates agents generating high-quality responses through effective cooperation
- Tested on coding collaboration tasks
- Key metric: ~200 tok/s throughput, +40-50% returns, cooperative@k gains [^430^]

### 3.4 Established MARL Algorithms: Performance Comparison

Comprehensive benchmarking across SMAC, MPE, LBF, RWARE, PettingZoo, and Overcooked [^375^][^376^]:

| Algorithm | Type | Best Environments | Key Strengths |
|-----------|------|-------------------|---------------|
| **MAPPO** | On-policy actor-critic | RWARE, Spread, Pressure Plate | Most consistent overall; highest returns in majority of tasks |
| **QMIX** | Off-policy value-based | SMAC, PettingZoo | Good in fully cooperative with dense rewards; fails in sparse reward environments |
| **MADDPG** | Centralized policy gradient | Some MPE tasks | Performs worse than most algorithms; struggles with discrete actions |
| **COMA** | On-policy policy gradient | Spread only | Very low performance overall; high variance in counterfactual advantage |
| **HAPPO** | On-policy actor-critic | RWARE, Pressure Plate | Good in specific tasks but inconsistent |
| **VDN** | Value decomposition | SMAC, MPE, LBF | Effective where global utility is linear function of individual utilities |

**Key Finding for LLM Agents**: MAPPO's combination of on-policy optimization with surrogate objective provides best sample efficiency and stability. QMIX and VDN require dense rewards (which LLM agent environments often lack). MADDPG's Gumbel-Softmax reparameterization causes significant bias in discrete action spaces [^376^].

### 3.5 Recommendation for CSOAI Agent-47

1. **Adopt MARFT paradigm** as the primary fine-tuning approach for multi-agent hives
2. **Use MAPPO as the base algorithm** within MARFT (most stable, best performance)
3. **Assign dedicated LoRA adapters** per agent role (Duo/Trio patterns)
4. **Consider CORY** for high-stakes hives (Finance, Governance) where distribution collapse is a critical risk

---

## 4. Personality Modeling

### 4.1 Big Five (OCEAN) Trait Framework

The Big Five personality model is the dominant framework for AI agent personality [^355^][^357^][^358^][^359^]:

**Five Traits**:
- **Openness to Experience**: Creativity, curiosity, preference for variety
- **Conscientiousness**: Organization, dependability, self-discipline
- **Extraversion**: Sociability, assertiveness, positive emotionality
- **Agreeableness**: Trust, altruism, cooperation
- **Neuroticism** (Emotional Stability): Anxiety, negative emotionality

### 4.2 LLM Personality Alignment Research

**SOTOPIA Evaluation Framework** [^355^][^380^]:
- Social simulation platform for evaluating agent interactions
- Seven dimensions: Goal Completion, Believability, Knowledge Acquisition, Secret Keeping, Relationship Change, Social Rule Compliance, Financial Benefits
- Enables systematic study of how personality traits affect multi-agent negotiation

**Personality Alignment Benchmarking** (6 LLMs tested) [^357^]:

| Model | Best Trait Alignment | Weakest Trait | Overall Reliability |
|-------|---------------------|---------------|---------------------|
| GPT-4o Mini | Extraversion (1.15/4.93) | None significant | **Strongest** |
| Gemini 2.0 Flash Lite | Conscientiousness (1.41/5.00) | Low Extraversion (1.17) | Strong |
| Gemma 2 | Neuroticism (1.00/4.98) | Low Agreeableness (1.33) | Strong |
| Llama 3.2 | Moderate overall | Multiple traits show misalignment | Moderate |
| Mistral NeMo | Moderate overall | Low Extraversion (1.64) | Moderate |
| Claude 3 Haiku | Weakest overall | Low Conscientiousness (3.36) | Weakest |

**Key Finding**: All LLMs show misalignment in low-trait configurations (e.g., when asked to be disagreeable, many models still show cooperative behavior). This reveals a critical blind spot at the core of personality prompting [^357^].

### 4.3 Personality Stability and Adaptation

Research on personality trait change reveals [^358^]:
- **Finding 1**: LLM systems exhibit reproducible native personality baselines with high reliability (ICC > 0.91)
- **Finding 2**: Situations drive personality change -- location and event contexts cause measurable trait shifts
- **Finding 3**: Different models respond differently to the same situations (Gemini shows enhanced adaptability; AutoGen suffers extreme instability)
- **Location effects**: Campus (+9.0 Openness), Bar (+7.7 Extraversion), Home (-19.9 Conscientiousness for AutoGen)

### 4.4 Trait Modulation Keys (TMK) Framework

The TMK prompting framework [^359^] pairs:
- **Personality Keys**: Big Five trait descriptors (e.g., "introverted...", "energetic...talkative")
- **Style Cues Keys**: Concise, neutral tone, limited hype, positive social wording

**Control fidelity validation**:
- Extraversion: 96.5% accuracy hitting target levels
- Openness: 94.7% accuracy
- Agreeableness: 84.6% accuracy
- Conscientiousness: 83.5% accuracy
- Emotional Stability: 83.3% accuracy

**Key Finding**: Medium-intensity personality (all traits at level 3) is perceived most positively by users in goal-oriented tasks. Greater user-CA personality alignment yields more favorable perceptions [^359^].

### 4.5 Recommendations for CSOAI Agent-47

1. **Implement TMK-style personality prompting** for each hive, with trait levels calibrated to role:
   - **Finance**: High Conscientiousness, moderate Neuroticism (risk-aware)
   - **Creative**: High Openness, High Extraversion
   - **Operations**: High Conscientiousness, High Agreeableness
   - **Governance**: High Conscientiousness, high Emotional Stability
   - **Research**: High Openness, moderate Extraversion

2. **Track relationship graphs** between agents using Sotopia-Eval dimensions
3. **Monitor personality drift** across interactions -- traits should be stable but adapt to context
4. **Use GPT-4o Mini or Gemma 2** for best personality alignment fidelity

---

## 5. Constitutional AI for Agents

### 5.1 The Specification Trap

A critical 2026 paper [^432^] argues that static content-based value alignment (RLHF, Constitutional AI, IRL) is structurally insufficient:
- Hume's is-ought gap: behavioral data underdetermines normative content
- Berlin's value pluralism: human values resist consistent formalization
- Extended frame problem: any value encoding misfits future contexts
- **Implication**: For CSOAI Agent-47, constitutional principles must be **living documents** that evolve through process, not just static rules

### 5.2 Multi-Agent Debate as Alignment Mechanism

**Debate-Train-Evolve Framework** [^382^]:
- Multiple agents debate until consensus or error exposure
- High-quality reasoning traces distilled into training data
- Single policy fine-tuned with GRPO on debate traces
- Evolved agent replaces committee -- one forward pass outperforms the committee

**CortexDebate** [^385^]:
- Sparse debating graph among LLM agents (mimics human brain cortex)
- Reduces input context burden by up to 70.79%
- McKinsey Trust Formula for evaluating agent credibility
- Outperforms SOTA MAD methods: +9% on GSM-IC, +10% on MATH, +12.33% on ARCC

**MADKE (Knowledge-Enhanced Debate)** [^388^]:
- Shared retrieval knowledge pool solves "cognitive island" problem
- Adaptive knowledge selection per agent per round
- Qwen1.5-72B-Chat surpasses GPT-4 by +1.26% on average across 6 datasets

### 5.3 Self-Correction via GRPO

**Self-Improving LLMs via RL** [^354^]:
- Correct only failed cases identified by external verifier
- Convert binary feedback into self-reflective prompts
- Model trained to use self-reflection to succeed at second attempt
- **Key insight**: Bootstraps solely from model's own outputs, without external LLMs
- **Guaranteed improvement**: Corrections applied only to initially incorrect examples

### 5.4 Recommendations for CSOAI Agent-47

1. **Implement debate-based training** for Governance hive (highest stakes)
2. **Use GRPO-based self-correction loops** for all agents -- guaranteed improvement property
3. **Treat constitutional principles as living documents** that evolve through multi-agent deliberation
4. **Adopt sparse debating graphs** (CortexDebate style) to manage context burden across 46 agents

---

## 6. Agent Specialization

### 6.1 Multi-LoRA Composition Architecture

**Multi-LoRA** enables one base model to serve multiple domains via composable adapters [^350^][^427^][^428^][^431^]:

**The "Multiple Expertise" Analogy** [^428^]:
- **Traditional Fine-tuning**: Learn medicine -> forget when learning law -> forget when learning coding
- **Multi-LoRA**: Medical compartment (LoRA 1), Legal compartment (LoRA 2), Programming compartment (LoRA 3) -- all coexist, can be combined

**Key Benefits**:
- Parameter efficiency: adapters typically <1% of base model size
- Runtime adaptation: switch adapters without reloading base model
- Simpler MLOps: centralize inference around one model
- Prevents catastrophic forgetting

### 6.2 Deployment Patterns

**Approach 1: Merge with Base Model** [^350^]:
```python
from peft import PeftModel
model = PeftModel.from_pretrained(base_model, lora_path)
model.merge_and_unload()  # Standalone, no latency overhead
```
- Best for: Fixed task assignment, maximum inference speed
- Trade-off: One model per task, less flexible

**Approach 2: Dynamic Loading** [^350^][^427^]:
```python
from vllm import LLM
llm = LLM(model="base-model", enable_lora=True)
outputs = llm.generate(prompts, lora_request=LoRARequest("adapter", 1, lora_path))
```
- Best for: Variable tasks, domain switching per request
- Ray Serve LLM: LRU adapter cache with `max_num_adapters_per_replica`

**Approach 3: Adapter Selector** [^431^]:
- Train a "selector" LoRA that identifies domain and task
- Automatically routes to the correct specialized adapter
- K-means-based data selection for selector training
- Cross-domain multi-task scenarios without catastrophic forgetting

### 6.3 CSOAI Agent-47 Hive Specialization Map

| Hive | Base Model | LoRA Adapter 1 | LoRA Adapter 2 | LoRA Adapter 3 |
|------|-----------|----------------|----------------|----------------|
| **Finance** | Qwen2.5-7B | Market analysis | Risk assessment | Compliance |
| **Creative** | Qwen2.5-7B | Content generation | Style adaptation | Brand voice |
| **Operations** | Qwen2.5-3B | Process optimization | Resource allocation | Quality assurance |
| **Governance** | Qwen2.5-7B | Policy analysis | Audit trails | Decision logging |
| **Research** | Qwen2.5-7B | Literature review | Hypothesis generation | Data analysis |

### 6.4 Recommendations

1. **Use shared base model** (e.g., Qwen2.5-7B-Instruct) across all hives
2. **Train domain-specific LoRA adapters** per hive function
3. **Implement dynamic adapter loading** for runtime flexibility
4. **Consider Adapter Selector pattern** for automatic domain/task routing
5. **Budget ~1% of base model parameters per adapter** (e.g., 70M params for 7B base)

---

## 7. Self-Improving Agents

### 7.1 The Self-Improvement Question

A 2025 ACL paper [^378^] systematically asks: "Can LLMs bootstrap reasoning capabilities through self-improvement without external supervision?"

**Key Challenge**: Methods that rely on external seed datasets or stronger teacher models cannot achieve true self-improvement.

**Finding**: When trained solely on self-generated data, LLMs may fail (discussed as "model collapse"). However, certain approaches show promise:

### 7.2 GRPO-Based Self-Improvement

**Reflect-Retry-Reward Mechanism** [^354^]:
1. Model prompted to complete task
2. If initial response correct -> stop
3. If incorrect -> generate self-reflection on improvement
4. Retry with self-reflection included
5. If second attempt succeeds -> model learns effective self-reflection
6. Training uses GRPO (no external LLM required)

**Guarantee**: Performance improves or is maintained, since corrections only applied to initially incorrect examples.

### 7.3 Multi-Agent Debate for Self-Improvement

**Debate-Train-Evolve** [^382^]:
- Debate traces from multi-agent discussion distilled into training data
- GRPO fine-tuning on distilled reasoning traces
- Evolved single model outperforms the original committee
- Future inference requires just one forward pass

### 7.4 Synthetic Data Generation

**Notable approaches** [^381^]:
- **Recursive Introspection** (NeurIPS 2024): Teaching LLM agents how to self-improve
- **Self-Play with Execution Feedback**: Improving instruction-following capabilities
- **SPAR**: Self-play with tree-search refinement
- **Absolute Zero**: Reinforced self-play reasoning with zero data
- **WizardLM/WizardCoder**: Evol-Instruct for complex instruction generation

### 7.5 Recommendations for CSOAI Agent-47

1. **Implement Reflect-Retry-Reward loops** with GRPO for all 46 agents
2. **Use external verifier** appropriate to each hive (code executor, math checker, compliance rules)
3. **Run debate sessions** between agents in the same hive to generate training data
4. **Maintain "self-improvement budget"** -- track improvement rate to detect model collapse
5. **Bootstrap from stronger models initially**, then transition to self-generated data

---

## 8. Emergent Coordination

### 8.1 Biological Inspiration: Quorum Sensing

Research on ant colony decision-making provides a biological blueprint for multi-agent consensus [^356^]:

**Rock Ant Colony Migration Process**:
1. Active ants evaluate candidate nest quality against personal threshold
2. If approved, recruit other active ants via "tandem running"
3. Each ant has different quorum threshold
4. When quorum reached -> transport passive ants to new nest
5. If nest quality below threshold -> reverse transport back to old nest

**Algorithmic Translation**:
- Each agent evaluates solution quality against personal threshold theta
- Quorum check: compare number of active agents to quorum phi
- Gaussian observation noise (N(0, n_a/10)) models real-world uncertainty
- Majority synching bias enables adaptation to group decisions

### 8.2 Digital Stigmergy Patterns

While specific digital stigmergy research for LLM agents is nascent, the principles apply:
- **Environment as shared memory**: Agents deposit "pheromones" (intermediate results) in shared state
- **Indirect coordination**: Agents read what others have written, not direct communication
- **Amplification**: Good solutions get reinforced through repeated access
- **Decay**: Old information fades, preventing stale coordination

### 8.3 Collective Decision-Making for Agent-47

**Recommended Consensus Architecture**:
1. **Proposal Phase**: Each agent in hive generates solution + quality estimate
2. **Evaluation Phase**: Each agent evaluates proposals against own threshold
3. **Quorum Phase**: Count approvals; if quorum reached, proceed
4. **Execution Phase**: Approved solution executed, results deposited in shared state
5. **Feedback Phase**: Results inform future threshold calibration

### 8.4 Recommendations

1. **Implement quorum-sensing consensus** for Governance hive decisions
2. **Use shared state as "digital pheromone trail"** -- deposit intermediate results, not just final answers
3. **Vary quorum thresholds by agent role** (senior agents have higher thresholds)
4. **Include decay mechanism** for outdated information

---

## 9. Model Distillation & Edge Deployment

### 9.1 Local LLM Deployment Landscape

**Small LLM State of the Art** (2026) [^383^][^386^]:

| Model | Size | Key Strength |
|-------|------|-------------|
| Phi-3.5 Mini | 3.8B | Best reasoning in class |
| Llama-3.2 | 1-3B | Fastest mobile LLM |
| Qwen3-4B | 4B | Rivals Qwen2.5-72B on reasoning |
| MobileLLM-R1 | ~1B | 2-5x better reasoning than 2x larger models |
| DeepSeek-R1-Distill | 1.5B-70B | Reasoning distillation from 641B base |

**Key Insight**: Reasoning isn't purely a function of parameter count -- it's about training methodology. Distillation from strong reasoning models + RL post-training is crucial [^383^].

### 9.2 Edge Compact LLM Deployment (ECLD) Framework

The ECLD framework [^381^] provides a principled pipeline:

**Four Stages**:
1. **Model Pruning**: Structured pruning of width/depth/attention heads
2. **Knowledge Distillation**: Recover performance from pruned model
3. **Quantization**: 4-bit for smartphones, 8-bit for edge servers
4. **Hardware-Aware Deployment**: Compile to optimized binaries

**Results**:
- **70-80% storage reduction** (Llama-3.1-8B: 15.3GB -> 3.3GB)
- **50% energy reduction** per query
- Preserved accuracy, often **lower hallucination** than quantization-only baselines

### 9.3 KV-Cache Optimization

**PagedAttention** (vLLM) [^379^]:
- Borrows virtual memory paging from OS
- Eliminates up to 60% memory fragmentation
- Default in modern serving stacks (vLLM, TensorRT-LLM, SGLang)

**Key Optimizations** [^377^][^379^][^360^]:
1. **KV Cache Reuse**: Only new token processed, all previous cached
2. **Prefix Caching**: Shared system prompts/RAG context cached across turns
3. **Continuous Batching**: 2-4x effective throughput vs. static batching
4. **FP8/INT8 Quantization**: Doubles throughput at small quality cost
5. **Speculative Decoding**: Small draft model generates k tokens; large model verifies all k in one pass (70% acceptance rates with EAGLE-3)
6. **Hierarchical KV Cache**: Cold pages spill to CPU RAM/SSD

**Five Eras of KV Cache Evolution** [^360^]:
1. Basic KV Cache (2022)
2. PagedAttention + Prefix Caching (2023)
3. Heterogeneous (speculative decoding, VLMs, quantized, SWA, Mamba) (2024)
4. Distributed (disaggregated inference, cache-aware load balancing) (2025+)
5. Full datacenter-scale management (2025+)

### 9.4 Speculative Decoding

**How it works** [^379^]:
- Small draft model generates k candidate tokens cheaply
- Large target model verifies all k in single forward pass
- Accepted tokens committed; rejected trigger fallback
- **EAGLE-3 and Medusa-2**: ~70% acceptance rates on common chat data
- **Result**: 1.5-3x decode throughput

### 9.5 Hybrid Local-Cloud Architecture

**Recommended Architecture for CSOAI Agent-47**:

```
Request -> Router -> Complexity Assessment -> [Local Model | Cloud Model]
                      |
                      v
              Simple query (local):
              - 3B parameter model for Operations hive
              - Pattern matching, routine tasks
              - <200ms latency
                      |
                      v
              Medium complexity (local+edge):
              - 7B parameter model with LoRA
              - Domain-specific tasks
              - 500ms-2s latency
                      |
                      v
              Complex reasoning (cloud):
              - Full-scale Claude/GPT/DeepSeek
              - Novel problem solving, strategic analysis
              - Variable latency
```

**Cost optimization**: 80% of requests handled locally, 20% escalated to cloud

### 9.6 Recommendations

1. **Deploy Qwen3-4B or Llama-3.2-3B** as local base model for simple queries
2. **Use speculative decoding** (EAGLE-3) for 1.5-3x throughput improvement
3. **Implement KV-cache prefix caching** for shared system prompts across 46 agents
4. **Route 80% of queries to local models**, 20% to cloud for complex reasoning
5. **Apply ECLD pipeline** (prune -> distill -> quantize) for edge-optimized variants

---

## 10. Integrated Implementation Roadmap for CSOAI Agent-47

### Phase 1: Foundation (Weeks 1-4)
- Deploy **Letta** for Research and Governance hives (OS-style memory)
- Deploy **Mem0** for Finance and Operations hives (fast personalization)
- Deploy **Zep/Graphiti** for temporal reasoning in Finance
- Set up **LLaMA-Factory + Unsloth** fine-tuning pipeline
- Implement **Big Five TMK personality prompting** per hive

### Phase 2: Specialization (Weeks 5-8)
- Train **domain-specific LoRA adapters** per hive (5 hives x 3 adapters each)
- Implement **Multi-LoRA dynamic loading** with adapter selector
- Begin **MARFT-based fine-tuning** of Duo/Trio agent configurations
- Deploy **local Qwen3-4B** with speculative decoding for 80% of queries

### Phase 3: Intelligence (Weeks 9-12)
- Implement **GRPO self-improvement loops** with hive-specific verifiers
- Deploy **multi-agent debate training** (CortexDebate-style sparse graphs)
- Implement **quorum-sensing consensus** for Governance decisions
- Launch **Reflect-Retry-Reward** cycles for continuous improvement

### Phase 4: Optimization (Weeks 13-16)
- Apply **ECLD distillation** pipeline for edge-optimized models
- Implement **KV-cache optimization** (prefix caching, continuous batching)
- Fine-tune **constitutional principles** through multi-agent deliberation
- Monitor and adjust personality alignment across all 46 agents

---

## 11. Key Metrics and Success Criteria

| Dimension | Metric | Target |
|-----------|--------|--------|
| Memory | LongMemEval score | >65% |
| Speed | Inference latency (local) | <200ms p95 |
| Accuracy | Hive-specific task accuracy | +15% vs. baseline |
| Personality | TMK control fidelity | >85% per trait |
| Coordination | MARFT team reward stability | SE <1.0 |
| Cost | Token cost reduction | 70% vs. full-context |
| Self-Improvement | Iteration-to-iteration improvement | +2% per cycle |

---

## 12. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Model collapse in self-improvement | Medium | High | External verifier, improvement budget |
| Personality drift over time | Medium | Medium | Periodic re-alignment, ICC monitoring |
| Memory context poisoning | Medium | High | Audit trails, human-in-the-loop for critical decisions |
| Multi-agent coordination failure | Low | High | Quorum thresholds, fallback to solo mode |
| Distribution collapse in MARFT | Low | High | CORY-style role exchange, KL divergence monitoring |

---

## References

[^301^] MARFT: Multi-Agent Reinforcement Fine-Tuning (arXiv 2025)
[^330^] Unsloth vs Axolotl vs LLaMA-Factory - The AI Engineer (2026)
[^331^] Best AI Agent Memory Systems in 2026: 8 Frameworks Compared
[^332^] Axolotl vs Unsloth vs TorchTune: Best LLM Fine-Tuning Frameworks in 2026
[^333^] AI Agent Memory Frameworks in 2026: Memory vs. Context
[^336^] MARFT: Multi-Agent Reinforcement Fine-Tuning (alphaXiv)
[^337^] Agent memory: Letta vs Mem0 vs Zep vs Cognee
[^338^] AI Agent Memory Systems in 2026: Mem0, Zep, Hindsight Compared
[^339^] Mem0: Building Production-Ready AI Agents (arXiv 2025)
[^344^] Token-Importance Guided Direct Preference Optimization (arXiv 2025)
[^345^] CORY: Coevolving with the Other You (arXiv 2024)
[^347^] DPO Variants: IPO, KTO, ORPO & cDPO for LLM Alignment (2026)
[^348^] Fine-Tuning LLM with Sequential Cooperative Multi-Agent RL (NeurIPS 2024)
[^349^] MixDPO: Supervised Fine-Tuning on Ambiguous Pairs (ICLR 2026)
[^350^] How to Serve Multi-LoRA Adapters (Inferless)
[^351^] Evaluating DPO and its Variants Across Multiple Tasks (ACL 2025)
[^352^] CORY GitHub Repository
[^354^] Self-Improving LLMs via Reinforcement Learning (arXiv 2025)
[^355^] Exploring Big Five Personality and AI Capability Effects (arXiv 2025)
[^356^] Consensus-Achieving Algorithm for Robot Swarms (IntechOpen 2026)
[^357^] Evaluating LLM Alignment under Big Five Personality (CEUR-WS 2025)
[^358^] Exploring Personality Trait Change of LLM-Based AI Systems (OpenReview)
[^359^] Vibe Check: LLM CA Personality Effects on User Perceptions (CHI 2026)
[^360^] The Five Eras of KVCache (Modular 2026)
[^372^] AI Agent Memory Systems: A 2026 Engineering Guide
[^373^] Letta: Ry Walker Research (2026)
[^375^] Extended Benchmarking of Multi-Agent Reinforcement Learning (AAMAS 2025)
[^376^] Benchmarking Multi-Agent Deep Reinforcement Learning (NeurIPS 2021)
[^377^] KV Cache Explained: Efficient Attention for LLM Generation (2026)
[^378^] Can Language Models Bootstrap Reasoning Capabilities? (ACL 2025)
[^379^] LLM Inference in 2026: How It Works, Latency & Cost
[^380^] Best Letta Alternatives for AI Agent Memory in 2026
[^381^] Compact LLM Deployment and World Model Assisted Offloading (arXiv 2026)
[^382^] Debate, Train, Evolve: Self-Evolution of LLM Reasoning (arXiv 2025)
[^383^] On-Device LLMs: State of the Union, 2026
[^385^] CortexDebate: Sparse Multi-Agent Debate (ACL 2025)
[^386^] Small LLMs, On-Device AI & Edge Deployment (Medium 2025)
[^387^] LLM Distillation vs Quantization (Exxact)
[^388^] Knowledge-Enhanced Reasoning in Multi-Agent Debate (Neurocomputing 2025)
[^429^] MARFT: Multi-Agent Reinforcement Fine-Tuning (OpenReview)
[^430^] Multiagent Finetuning Strategies (Emergent Mind 2025)
[^431^] Adapters Selector: Cross-domains and Multi-tasks LoRA (COLING 2025)
[^432^] The Specification Trap: Why Static Value Alignment Is Insufficient (2026)
[^433^] Hindsight: Agent Memory That Learns (GitHub)
[^434^] Best Open Source Agent Memory Frameworks 2026
