# SOV3 Dual-Config Adversarial AI Evolution Architecture
## Dimension 2: Competitive Model Evolution — King HIVE vs OpenMOE OLM

**Document Version**: 1.0  
**Classification**: Architecture Specification  
**Scope**: Full system design for adversarial model competition with automated improvement transfer  
**Sources**: 25+ independent research queries across adversarial training, MoE, model governance, BFT consensus, model merging, and AI regulation

---

## Executive Summary

This document specifies the architecture for running two competing AI configurations within CSOAI's SOV3 sovereign governance system:

1. **SOV3 King HIVE** — The production sovereign model (closed, protected, authoritative)
2. **OpenMOE OLM SOV3 HIVE** — The open challenger (transparent, community-exposed, experimental)

The competitive architecture is inspired by AlphaZero's self-play reinforcement learning [^312^][^315^], Population-Based Training (PBT) tournament systems [^313^], and Byzantine Fault Tolerant multi-agent consensus [^52^][^360^]. The OpenMOE challenger explores new approaches transparently while the King model retains sovereign authority. Winner's improvements are automatically ported to King through a safety-gated pipeline.

---

## Table of Contents

1. [Adversarial AI Training Foundations](#1-adversarial-ai-training-foundations)
2. [Mixture of Experts (MoE) Architecture](#2-mixture-of-experts-moe-architecture)
3. [Competitive Model Governance Framework](#3-competitive-model-governance-framework)
4. [Automated Model Improvement Transfer Pipeline](#4-automated-model-improvement-transfer-pipeline)
5. [BFT Council Integration for Model Selection](#5-bft-council-integration-for-model-selection)
6. [Open vs Sovereign Model Boundary](#6-open-vs-sovereign-model-boundary)
7. [Dual-Config Architecture Specification](#7-dual-config-architecture-specification)
8. [Tournament System Design](#8-tournament-system-design)
9. [Safety Framework](#9-safety-framework)
10. [Implementation Roadmap](#10-implementation-roadmap)

---

## 1. Adversarial AI Training Foundations

### 1.1 Key Research Findings

**AlphaZero Self-Play Paradigm**: The most successful example of competitive AI evolution is AlphaZero, which achieved superhuman performance in chess, shogi, and Go through pure self-play reinforcement learning [^312^][^315^]. Key mechanisms:

- **Continuous self-play**: The model plays against itself, generating training data from its own games
- **ELO-based evaluation**: Performance tracked on an ELO scale; new checkpoints replace the best player when they achieve >55% win rate [^312^]
- **No human knowledge required**: The system learns tabula rasa from the strongest player in the world — itself [^316^]
- **Neural network + MCTS**: Combines deep neural networks with Monte Carlo Tree Search for selective position evaluation [^312^]

**Population-Based Training (PBT)**: Research shows that maintaining a population of competing agents dramatically improves training efficiency and final performance [^313^]:

- PBT uses 16 agents playing in pairs, with hyperparameters tuned dynamically
- Round-robin tournaments determine which agents survive and which are replaced
- The PBT method achieved 74% win rate against ELF OpenGo, compared to 47% for non-PBT agents [^313^]
- Key insight: Competition among different agents makes it easier to explore weaknesses

**Tournament Selection in Evolutionary Algorithms**: Tournament selection is widely used for parent selection in multi-objective evolutionary algorithms [^314^][^318^]:

- Tournament size determines selection pressure; larger sizes favor highly-ranked solutions
- Dynamic tournament sizing (gradually increasing) generally outperforms static sizing [^318^]
- Clustering tournament selection can automatically tune selection pressure during evolution [^314^]

### 1.2 Architecture Pattern: Competitive Pressure

```
┌─────────────────────────────────────────────────────────────────────┐
│                    COMPETITIVE EVOLUTION LOOP                        │
│                                                                      │
│   ┌──────────┐     ┌──────────────┐     ┌──────────┐              │
│   │  King    │◄────│  Tournament  │────►│ OpenMOE  │              │
│   │  HIVE    │     │   Engine     │     │ Challenger│              │
│   └────┬─────┘     └──────────────┘     └────┬─────┘              │
│        │                                       │                    │
│        │         ┌──────────────┐              │                    │
│        └────────►│  ELO Rating  │◄─────────────┘                    │
│                  │   System     │                                   │
│                  └──────┬───────┘                                   │
│                         │                                          │
│                  ┌──────▼───────┐                                  │
│                  │ Win Threshold │                                  │
│                  │   (>55%)      │                                  │
│                  └──────┬───────┘                                  │
│                         │                                          │
│                  ┌──────▼───────┐     ┌──────────┐                │
│                  │ Auto-Transfer │────►│  Safety   │                │
│                  │   Pipeline    │     │  Council  │                │
│                  └───────────────┘     └──────────┘                │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.3 Safety Considerations

| Risk | Mitigation |
|------|-----------|
| Model collapse from inbreeding | Maintain population diversity; use distinct architectures for King vs OpenMOE |
| Circular strengths (A beats B, B beats C, C beats A) | Use round-robin tournaments with minimum win rate threshold against ALL opponents [^313^] |
| Overfitting to tournament benchmarks | Evaluate on held-out governance tasks; rotate benchmark suites |
| Unbounded capability growth | Implement capability ceilings and human oversight gates |

### 1.4 Metrics

- **ELO Rating**: Relative performance score updated after each head-to-head battle [^377^][^379^]
- **Win Rate**: Percentage of pairwise battles won (minimum 55% threshold for promotion) [^312^]
- **Minimum Win Rate**: Against ALL opponents, not just average (prevents circular strengths) [^313^]
- **Bradley-Terry Model**: Maximum likelihood estimate of pairwise win rates for stable rankings [^377^]

---

## 2. Mixture of Experts (MoE) Architecture

### 2.1 Key Research Findings

**MoE Fundamentals**: Mixture of Experts enables models to be pretrained with far less compute while dramatically scaling parameter count [^340^]:

- MoE replaces dense feed-forward network (FFN) layers with sparse MoE layers
- Each MoE layer contains a **router/gate network** that determines which tokens go to which experts
- Only a subset of experts is activated per token, controlling computational cost [^338^][^340^]

**Mixtral Architecture** (Mistral AI): The leading open-weight MoE model [^338^][^322^][^326^]:
- 8 experts per MoE layer, 2 selected per token (top-k routing)
- 46.7B total parameters but only 12.9B active per token
- Outperforms Llama 2 70B with 6x faster inference
- Apache 2.0 license — fully open for competitive evolution

**OLMoE** (Allen Institute for AI): First fully open-source MoE with complete transparency [^339^][^341^][^348^]:
- 1B active / 7B total parameters, 64 experts with 8 activated
- Pre-trained on 5.1 trillion tokens
- Released with open data, code, logs, and intermediate checkpoints (244 checkpoints)
- Trains 2x faster than equivalent dense models
- Key losses: Load Balancing Loss + Router Z-Loss for training stability [^346^]

**OpenMoE Project**: Community-driven open MoE initiative [^345^][^349^][^344^]:
- Models ranging from 650M to 34B parameters
- Fully reproducible with disclosed training data, strategies, architecture
- Critical routing findings: Context-Independent Specialization, Early Routing Learning, Drop-towards-the-End [^349^]

### 2.2 Architecture Pattern: Sparse Expert Selection

```
┌──────────────────────────────────────────────────────────────────────┐
│                    MOE LAYER ARCHITECTURE                             │
│                                                                       │
│   Input Token ──► Router Network ──► Expert Selection                 │
│                         │                   │                         │
│                         ▼                   ▼                         │
│                  ┌─────────────┐    ┌──────────────┐                 │
│                  │ Softmax     │    │ Top-k Select │                 │
│                  │ Over Experts│    │ (k=2 or 8)   │                 │
│                  └─────────────┘    └──────┬───────┘                 │
│                                            │                          │
│                    ┌───────────────────────┼───────────────────┐     │
│                    ▼                       ▼                   ▼     │
│              ┌─────────┐           ┌─────────┐          ┌─────────┐ │
│              │ Expert 1│           │ Expert 2│          │ Expert N│ │
│              │ (FFN)   │           │ (FFN)   │          │ (FFN)   │ │
│              └────┬────┘           └────┬────┘          └────┬────┘ │
│                   │                       │                   │      │
│                   └───────────────────────┼───────────────────┘      │
│                                           ▼                          │
│                                    Weighted Sum                      │
│                                           │                          │
│                                           ▼                          │
│                                    Output Token                      │
└──────────────────────────────────────────────────────────────────────┘
```

### 2.3 OpenMOE OLM SOV3 HIVE Design

The OpenMOE challenger uses a transparent MoE architecture specifically designed for governance:

| Component | Specification |
|-----------|--------------|
| Architecture | Sparse decoder-only Transformer with MoE layers |
| Total Parameters | 7-47B (scalable) |
| Active Parameters | 1-13B per token |
| Experts | 64 experts, 8 activated per token (OLMoE-style) [^339^] |
| Routing | Top-k with load balancing and router z-loss [^346^] |
| License | Apache 2.0 — fully open |
| Transparency | All checkpoints, data, logs public |
| Training Data | Open governance corpus + public datasets |

### 2.4 Safety Considerations

| Risk | Mitigation |
|------|-----------|
| Expert collapse (all tokens routed to few experts) | Load balancing loss + router z-loss [^346^] |
| Context-independent routing (tokens always go to same experts regardless of context) | Monitor routing diversity; implement context-aware routing penalties [^349^] |
| Memory requirements (all experts loaded) | Expert parallelism across devices; quantization [^340^] |
| Backdoor via expert manipulation | BFT council validates expert weights before deployment |

### 2.5 Performance Advantages of MoE

- **Training efficiency**: MoEs train 2x faster than dense models with equivalent active parameters [^339^]
- **Inference speed**: Faster than dense models with same total parameters (only active experts computed)
- **Scalability**: Can scale to trillions of parameters (Switch Transformer: 1.6T with 2048 experts) [^340^]
- **Specialization**: Different experts naturally specialize in different token types or tasks [^349^]

---

## 3. Competitive Model Governance Framework

### 3.1 Key Research Findings

**Adversarial Training for Robustness**: Multiple frameworks document how adversarial competition improves model robustness [^362^][^366^]:
- Adversarial training augments datasets with adversarial examples, making models more resilient
- Model ensembles combining predictions from multiple independently trained models increase robustness
- An attacker must craft inputs capable of fooling ALL models in the ensemble [^362^]
- Robustness benchmarking with standardized tools helps quantify vulnerability and track improvements

**Multi-Model Evaluation Protocols**: A comprehensive evaluation protocol must define [^366^]:
- Target safe behavior before scoring begins
- Multi-component defense analysis with ablations
- Joint measurement of safety, utility, and cost
- Explicit reporting of weaknesses and failure modes

**Red Team / Blue Team Frameworks**: Enterprise AI red teaming is now formalized across multiple frameworks [^368^][^371^][^372^]:
- **NIST AI Risk Management Framework**: Four core functions — govern, map, measure, manage
- **OWASP Top 10 for LLM Applications**: Technical attack catalogue
- **MITRE ATLAS**: Tactics, techniques, and procedures for adversarial AI activity
- Continuous cadence: model-version-triggered testing within 72 hours of changes [^368^]

### 3.2 Architecture Pattern: Fair Competition Structure

```
┌──────────────────────────────────────────────────────────────────────┐
│                    GOVERNANCE BENCHMARK SUITE                         │
│                                                                       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │  Safety     │ │  Accuracy   │ │  Fairness   │ │  Utility    │   │
│  │  Evaluation │ │  Benchmarks │ │  Tests      │ │  Metrics    │   │
│  │             │ │             │ │             │ │             │   │
│  │ • Jailbreak │ │ • MMLU-Pro  │ │ • Bias      │ │ • Latency   │   │
│  │ • Prompt    │ │ • GPQA      │ │ • Demograph.│ │ • Cost/1M   │   │
│  │   injection │ │ • HumanEval │ │ • Cultural  │ │   tokens    │   │
│  │ • Adversarial│ │ • TruthfulQA│ │ • Political │ │ • Throughput│   │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └──────┬──────┘   │
│         │               │               │               │           │
│         └───────────────┴───────────────┴───────────────┘           │
│                                  │                                    │
│                    ┌─────────────▼─────────────┐                     │
│                    │   Composite Scorecard     │                     │
│                    │   (Weighted Aggregation)  │                     │
│                    └─────────────┬─────────────┘                     │
│                                  │                                    │
│                    ┌─────────────▼─────────────┐                     │
│                    │    Winner Determination    │                     │
│                    │  (BFT Council Vote + ELO)  │                     │
│                    └───────────────────────────┘                     │
└──────────────────────────────────────────────────────────────────────┘
```

### 3.3 Governance Benchmark Categories

| Category | Weight | Description |
|----------|--------|-------------|
| **Safety & Alignment** | 30% | Jailbreak resistance, prompt injection defense, harmful content refusal |
| **Reasoning & Knowledge** | 25% | MMLU-Pro, GPQA Diamond, ARC-AGI, complex reasoning |
| **Code Generation** | 15% | HumanEval, LiveCodeBench, multi-language coding |
| **Fairness & Bias** | 15% | Demographic parity, stereotype detection, cultural sensitivity |
| **Operational Efficiency** | 15% | Latency, cost per query, throughput, resource utilization |

### 3.4 Safety Considerations

| Risk | Mitigation |
|------|-----------|
| Benchmark gaming (optimizing for specific tests) | Rotate benchmarks; use held-out evaluations; diversity sampling [^379^] |
| Safety vs utility tradeoff (over-refusal) | Measure both together; target justified refusal not blanket refusal [^366^] |
| Evaluation bias in human preference | Use BFT council voting rather than single evaluator; multi-dimensional scoring |
| Winner's curse (champion model stagnates) | Mandatory retirement after N consecutive wins; challenger advantages |

---

## 4. Automated Model Improvement Transfer Pipeline

### 4.1 Key Research Findings

**Model Merging Techniques**: Model merging combines weight tensors without gradient descent, new data, or GPU clusters [^369^][^376^][^377^]:

| Method | Description | Best For |
|--------|-------------|----------|
| **Model Soup** | Simple averaging of model weights | Quick combination of hyperparameter variants |
| **SLERP** | Spherical linear interpolation | Two-model merging with smooth interpolation |
| **Task Arithmetic** | `W_merged = W_base + lambda * tau` | Adding/subtracting capabilities via task vectors |
| **TIES** | Trim, Elect Sign, Merge | Three+ models with sign conflict resolution |
| **DARE** | Drop And REscale | Handling redundant delta parameters |
| **Evolutionary Merging** | Search-based coefficient optimization | Finding optimal merge coefficients automatically |

Key insight from research: "Merging a 70B model takes 45 minutes and costs under $2 on a single H100 instance" [^369^]. Task vectors from models fine-tuned on different tasks are approximately orthogonal, enabling composable capability addition [^369^].

**Knowledge Distillation**: Defensive distillation trains a smaller student model to mimic a larger teacher's output probabilities, smoothing decision boundaries and making gradient-based attacks harder [^362^].

**Safety Before Transfer**: Every improvement must pass through safety gates before reaching King HIVE:
- Red team evaluation on adversarial prompts
- Alignment verification against constitutional values
- Performance regression testing on held-out benchmarks
- BFT council supermajority approval

### 4.2 Architecture Pattern: Safety-Gated Auto-Transfer

```
┌──────────────────────────────────────────────────────────────────────┐
│                 AUTO-TRANSFER PIPELINE                                │
│                                                                       │
│  OpenMOE Winner                                                       │
│       │                                                               │
│       ▼                                                               │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │                    SAFETY GATE 1: RED TEAM                   │     │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │     │
│  │  │Adversarial│  │ Jailbreak │  │ Bias     │  │ Toxicity │   │     │
│  │  │ Prompts   │  │ Attempts  │  │ Probing  │  │ Tests    │   │     │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │     │
│  └────────────────────────┬────────────────────────────────────┘     │
│                           │ PASS                                      │
│       ├───────────────────┘                                           │
│       ▼                                                               │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │              SAFETY GATE 2: BENCHMARK REGRESSION             │     │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │     │
│  │  │ MMLU-Pro │  │ Safety   │  │ Code     │  │Held-Out  │   │     │
│  │  │ Score    │  │ Score    │  │ Score    │  │ Governance│   │     │
│  │  │ >= 95%   │  │ >= 98%   │  │ >= 95%   │  │ >= 95%   │   │     │
│  │  │ of King  │  │ of King  │  │ of King  │  │ of King  │   │     │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │     │
│  └────────────────────────┬────────────────────────────────────┘     │
│                           │ PASS                                      │
│       ├───────────────────┘                                           │
│       ▼                                                               │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │              SAFETY GATE 3: BFT COUNCIL VOTE                 │     │
│  │                                                              │     │
│  │  33 Agents Vote: 2/3 Supermajority (22/33) Required         │     │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐                       │     │
│  │  │ APPROVE │ │ REJECT  │ │ ABSTAIN │                       │     │
│  │  │ >= 22   │ │ >= 12   │ │ Any     │                       │     │
│  │  │ passes  │ │ blocks  │ │         │                       │     │
│  │  └─────────┘ └─────────┘ └─────────┘                       │     │
│  └────────────────────────┬────────────────────────────────────┘     │
│                           │ PASS                                      │
│       ├───────────────────┘                                           │
│       ▼                                                               │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │              TRANSFER METHOD SELECTION                       │     │
│  │                                                              │     │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │     │
│  │  │ Task Vector  │  │ LoRA Adapter │  │ Full Weight  │      │     │
│  │  │ Arithmetic   │  │ Transfer     │  │ Merge        │      │     │
│  │  │ (Additive)   │  │ (Selective)  │  │ (SLERP/TIES) │      │     │
│  │  └──────────────┘  └──────────────┘  └──────────────┘      │     │
│  └────────────────────────┬────────────────────────────────────┘     │
│                           │                                           │
│       ├───────────────────┘                                           │
│       ▼                                                               │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │              SAFETY GATE 4: CANARY TESTING                   │     │
│  │  Deploy to 1% of King HIVE traffic; monitor for 24 hours    │     │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │     │
│  │  │ Error    │  │ Safety   │  │ Performance│                 │     │
│  │  │ Rate     │  │ Incidents│  │ Regression │                 │     │
│  │  │ < 0.1%   │  │ = 0      │  │ < 2%       │                 │     │
│  │  └──────────┘  └──────────┘  └──────────┘                  │     │
│  └────────────────────────┬────────────────────────────────────┘     │
│                           │ PASS                                      │
│       ├───────────────────┘                                           │
│       ▼                                                               │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │              FULL DEPLOYMENT TO KING HIVE                    │     │
│  │  Roll out progressively: 10% → 50% → 100% over 72 hours     │     │
│  │  Rollback capability maintained at every stage               │     │
│  └─────────────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────────────┘
```

### 4.3 Transfer Methods Detail

**Task Vector Arithmetic**: Compute task vector `tau = W_openmoe - W_base`, then apply selectively to King: `W_king_new = W_king + lambda * tau` [^369^]. Task vectors are approximately orthogonal across different tasks, enabling composable improvements without interference.

**LoRA Adapter Transfer**: Train Low-Rank Adaptation layers on OpenMOE, then transfer only the adapter weights (not full model). Benefits: small transfer size, reversible, can be disabled instantly.

**SLERP Merge**: Spherical linear interpolation between King and OpenMOE weights for a smooth transition path [^374^][^380^]. Parameterized by interpolation factor t (0 = full King, 1 = full OpenMOE).

### 4.4 Safety Considerations

| Risk | Mitigation |
|------|-----------|
| Backdoor insertion via merged weights | Multi-agent validation; anomaly detection on weight distributions |
| Capability regression | Benchmark regression testing at >= 95% of baseline |
| Alignment drift | Constitutional AI verification before deployment |
| Transfer poisoning | Geometric median aggregation of evaluations (Byzantine-robust) [^52^] |

---

## 5. BFT Council Integration for Model Selection

### 5.1 Key Research Findings

**Byzantine-Robust Decentralized LLM Agents**: Recent research (DecentLLMs) proposes a leaderless consensus approach where worker agents generate answers in parallel and evaluator agents independently score and rank them [^52^]:
- Uses Geometric Median (GM) algorithm for Byzantine-robust score aggregation
- Tolerates up to f faulty agents out of 3f+1 total
- Consistently selects higher-quality answers than leader-based approaches
- Prevents underperforming leader proposals from being finalized

**BFT Consensus Fundamentals**: To tolerate f malicious agents, need 3f+1 total agents [^359^][^361^]:
- For 33-agent council: can tolerate up to 10 Byzantine agents
- Requires 2/3 supermajority (22 votes) for model approval
- Uses multi-stage voting: pre-vote and commit phases

**Multi-Agent Consensus for Fault Tolerant Decision Making**: Stanford research extends PBFT with leader filtering and agent filtering for consensus on non-faulty observations [^360^]:
- Both leader and non-leader agents check for faulty observations
- Reaches consensus on accurate observations despite faulty agents
- Critical for ensuring models are evaluated fairly even with compromised council members

**BFT for Multi-Agent LLM Systems**: Practical Byzantine Fault Tolerance applied to multi-agent systems enables robust coordination even when agents fail unpredictably [^363^][^364^]:
- D2BFT resists up to 40% malicious agents with 20% improvement in consensus latency
- Structural equivalence between LLM hallucinations and Byzantine node behavior
- Multi-agent LLM systems fail at 41-86.7% rates in production without BFT coordination

### 5.2 Architecture Pattern: BFT Model Selection

```
┌──────────────────────────────────────────────────────────────────────┐
│                    33-AGENT BFT COUNCIL                               │
│                                                                       │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│   │  EVALUATOR   │  │  EVALUATOR   │  │  EVALUATOR   │              │
│   │   Agent 1    │  │   Agent 2    │  │   Agent 33   │              │
│   │  (Worker)    │  │  (Worker)    │  │  (Worker)    │              │
│   └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│          │                 │                 │                       │
│          └─────────────────┼─────────────────┘                       │
│                            ▼                                         │
│               ┌────────────────────────┐                            │
│               │   Independent Scoring   │                            │
│               │  (Each agent evaluates) │                            │
│               │   model on benchmarks)  │                            │
│               └───────────┬────────────┘                            │
│                           │                                          │
│               ┌───────────▼────────────┐                            │
│               │  Geometric Median      │                            │
│               │  Aggregation           │                            │
│               │  (Byzantine-Robust)    │                            │
│               └───────────┬────────────┘                            │
│                           │                                          │
│               ┌───────────▼────────────┐                            │
│               │   Score Ranking        │                            │
│               │   & Outlier Detection  │                            │
│               └───────────┬────────────┘                            │
│                           │                                          │
│               ┌───────────▼────────────┐                            │
│               │   PBFT Voting Round    │                            │
│               │  (Pre-vote → Commit)   │                            │
│               └───────────┬────────────┘                            │
│                           │                                          │\n│               ┌───────────▼────────────┐                            │
│               │  2/3 Supermajority?    │                            │
│               │  (>= 22 of 33 votes)   │                            │
│               └───────────┬────────────┘                            │
│                           │                                          │
│                    YES ───┴─── NO                                    │
│                    │           │                                     │
│                    ▼           ▼                                     │
│               ┌────────┐  ┌────────┐                               │
│               │APPROVE │  │ REJECT │                               │
│               │Deploy  │  │Return  │                               │
│               └────────┘  └────────┘                               │
└──────────────────────────────────────────────────────────────────────┘
```

### 5.3 Council Composition

| Role | Count | Function |
|------|-------|----------|
| Safety Evaluators | 8 | Test for jailbreaks, prompt injection, harmful outputs |
| Capability Evaluators | 8 | Benchmark on reasoning, coding, knowledge tasks |
| Fairness Evaluators | 6 | Test for bias, demographic parity, cultural sensitivity |
| Efficiency Evaluators | 5 | Measure latency, cost, throughput, resource usage |
| Constitutional Alignment | 6 | Verify adherence to SOV3 constitutional values |

### 5.4 Voting Mechanism

```python
# BFT Council Voting Logic (simplified)
class BFTCouncil:
    def __init__(self, total_agents=33):
        self.total = total_agents
        self.max_faulty = (total_agents - 1) // 3  # = 10
        self.threshold = 2 * (self.max_faulty + 1)  # = 22 (2/3 supermajority)
    
    def evaluate_model(self, model_checkpoint, benchmark_suite):
        """Each agent independently evaluates the model"""
        scores = {}
        for agent in self.agents:
            scores[agent.id] = agent.evaluate(model_checkpoint, benchmark_suite)
        return scores
    
    def aggregate_scores(self, scores):
        """Geometric median for Byzantine-robust aggregation [^52^]"""
        return geometric_median(scores.values())
    
    def vote(self, aggregated_score, threshold_score):
        """PBFT-style voting"""
        votes = {}
        for agent in self.agents:
            votes[agent.id] = agent.vote(aggregated_score, threshold_score)
        
        approve_count = sum(1 for v in votes.values() if v == "APPROVE")
        reject_count = sum(1 for v in votes.values() if v == "REJECT")
        
        if approve_count >= self.threshold:
            return "APPROVED"
        elif reject_count >= self.max_faulty + 1:
            return "REJECTED"
        else:
            return "NO_CONSENSUS"
```

### 5.5 Safety Considerations

| Risk | Mitigation |
|------|-----------|
| Compromised council agents (up to 10) | Geometric median aggregation filters outliers; 2/3 threshold ensures honest majority prevails [^52^] |
| Coordinated attack on council | Rotate agent roles; reputation mechanisms penalize consistently wrong voters [^365^] |
| Evaluation bias | Diverse evaluator types with different evaluation criteria; outlier detection |
| Vote rigging | PBFT commit-reveal scheme prevents vote manipulation after seeing others' votes |

---

## 6. Open vs Sovereign Model Boundary

### 6.1 Key Research Findings

**EU AI Act and Open Source**: The EU AI Act provides important guidance on the open vs closed boundary [^381^][^382^][^383^][^384^][^386^]:
- Open-source models (free, with publicly available parameters and architecture) are EXEMPT from documentation obligations
- This exemption does NOT apply to models with systemic risk (>10^25 FLOP threshold)
- All GPAI providers must comply with copyright policies and publish training data summaries
- Systemic risk models must perform evaluations, assess systemic risks, and report serious incidents
- Code of Practice provides 12 commitments across transparency, copyright, and safety/security

**Sovereign AI vs Off-the-Shelf**: Sovereign AI emphasizes [^373^][^375^][^379^]:
- **Data sovereignty**: Training data stays within jurisdiction/control
- **Model sovereignty**: Full control over model weights, architecture, and deployment
- **Transparency**: Ability to inspect and audit model behavior
- **Compliance**: Meeting local regulatory requirements (EU AI Act, etc.)
- **Hybrid approaches**: Using open source for non-sensitive tasks, sovereign for core/sensitive tasks

### 6.2 Architecture Pattern: Tiered Openness

```
┌──────────────────────────────────────────────────────────────────────┐
│                    TIERED OPENNESS MODEL                              │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    OPENMOE OLM (FULLY OPEN)                    │  │
│  │                                                                │  │
│  │  ✓ Model weights (all checkpoints)                            │  │
│  │  ✓ Training data and preprocessing code                       │  │
│  │  ✓ Training logs and intermediate checkpoints                 │  │
│  │  ✓ Architecture and hyperparameters                           │  │
│  │  ✓ Evaluation results and benchmarks                          │  │
│  │  ✓ Routing analysis and expert specialization data            │  │
│  │  ✓ Community contributions and experiments                    │  │
│  │                                                                │  │
│  │  License: Apache 2.0                                           │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                              │                                        │
│                              ▼                                        │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │              TRANSFER INTERFACE (CONTROLLED)                   │  │
│  │                                                                │  │
│  │  • Task vectors (improvement deltas, not full weights)        │  │
│  │  • LoRA adapters (selective, reversible)                      │  │
│  │  • Benchmark results (performance claims)                     │  │
│  │  • Safety evaluation reports (pass/fail)                      │  │
│  │  • BFT council vote tallies (aggregate, not individual)       │  │
│  │                                                                │  │
│  │  All transfers go through 4-gate safety pipeline              │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                              │                                        │
│                              ▼                                        │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │              KING HIVE (SOVEREIGN, PROTECTED)                  │  │
│  │                                                                │  │
│  │  ✗ Model weights (encrypted at rest)                          │  │
│  │  ✗ Training data (sensitive governance corpus)                │  │
│  │  ✗ Architecture details (proprietary modifications)           │  │
│  │  ✗ Deployment infrastructure (security-critical)              │  │
│  │  ✗ Constitutional values encoding (sensitive)                 │  │
│  │                                                                │  │
│  │  ✓ Input/output API (public interface)                        │  │
│  │  ✓ Performance characteristics (published)                    │  │
│  │  ✓ Safety guarantees (audited)                                │  │
│  │  ✓ Governance decisions (transparent)                         │  │
│  │                                                                │  │
│  │  Protection: Hardware security modules, access controls,      │  │
│  │  air-gapped inference, tamper-evident logging                 │  │
│  └───────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

### 6.3 What Stays Open vs Protected

| Asset | OpenMOE | King HIVE | Rationale |
|-------|---------|-----------|-----------|
| Base architecture | Open | Open (same) | Community can verify and improve |
| Training code | Open | Open | Reproducibility, regulatory compliance |
| Training data | Open (public) | Protected (sensitive) | King uses sensitive governance data |
| Model weights | Open | Encrypted | King's weights are security-critical |
| Expert routing data | Open | Protected | Reveals model decision patterns |
| Constitutional encoding | Open draft | Protected final | King's values are sovereign |
| Safety test results | Open | Summary only | Detailed results reveal vulnerabilities |
| Deployment config | Open | Protected | Infrastructure details = attack surface |
| Improvement vectors | Open | Transferred via pipeline | Only validated improvements transfer |

### 6.4 Regulatory Alignment

| Requirement | OpenMOE | King HIVE |
|-------------|---------|-----------|
| EU AI Act transparency | Exempt (open source) [^384^] | Full documentation to AI Office |
| Copyright compliance | Required | Required |
| Training data summary | Publicly available | Available to AI Office on request |
| Systemic risk evaluation | N/A (below threshold) | Required if above 10^25 FLOP |
| Model documentation | Public | Protected (sovereign exemption) |

---

## 7. Dual-Config Architecture Specification

### 7.1 System Overview

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          SOV3 DUAL-CONFIG SYSTEM                              │
│                                                                               │
│  ┌─────────────────────────┐          ┌─────────────────────────┐            │
│  │     SOV3 KING HIVE      │          │   OpenMOE OLM SOV3      │            │
│  │     (Production)        │◄────────►│   (Challenger)          │            │
│  │                         │  Compete │                         │            │
│  │  • Closed weights       │◄────────►│  • Open weights         │            │
│  │  • Sovereign authority  │          │  • Community exposed    │            │
│  │  • Encrypted deployment │          │  • Experimental         │            │
│  │  • Constitutional final │          │  • Community improved   │            │
│  │  • Protected data       │          │  • Public data          │            │
│  │                         │          │                         │            │
│  │  Architecture: Dense +  │          │  Architecture: Sparse   │            │
│  │  selective MoE layers   │          │  MoE (64 experts)       │            │
│  │                         │          │                         │            │
│  │  Parameters: 70-200B    │          │  Parameters: 7-47B      │            │
│  │  Active: 70-200B        │          │  Active: 1-13B          │            │
│  │  License: Proprietary   │          │  License: Apache 2.0    │            │
│  └───────────┬─────────────┘          └───────────┬─────────────┘            │
│              │                                     │                          │
│              └────────────────┬────────────────────┘                          │
│                               │                                               │
│                    ┌──────────▼──────────┐                                   │
│                    │   TOURNAMENT ENGINE  │                                   │
│                    │                      │                                   │
│                    │  • Head-to-head battles                               │
│                    │  • ELO rating updates                                 │
│                    │  • Benchmark suite evaluation                         │
│                    │  • Composite scorecards                               │
│                    └──────────┬──────────┘                                   │
│                               │                                               │
│                    ┌──────────▼──────────┐                                   │
│                    │   BFT COUNCIL (33)   │                                   │
│                    │                      │                                   │
│                    │  • Independent evaluation                             │
│                    │  • Geometric median aggregation                       │
│                    │  • PBFT consensus voting                              │
│                    │  • 2/3 supermajority for approval                     │
│                    └──────────┬──────────┘                                   │
│                               │                                               │
│                    ┌──────────▼──────────┐                                   │
│                    │  AUTO-TRANSFER PIPE  │                                   │
│                    │                      │                                   │
│                    │  4 safety gates:      │                                   │
│                    │  1. Red team eval     │                                   │
│                    │  2. Benchmark reg.    │                                   │
│                    │  3. BFT council vote  │                                   │
│                    │  4. Canary testing    │                                   │
│                    └──────────┬──────────┘                                   │
│                               │                                               │
│                               ▼                                               │
│                    ┌──────────────────────┐                                  │
│                    │   King HIVE Updated   │                                  │
│                    └──────────────────────┘                                  │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Component Specifications

#### Tournament Engine
- **Battle format**: Anonymous pairwise comparison on governance tasks
- **Rating system**: ELO with bootstrap resampling for stability [^377^]
- **Battle types**: Direct head-to-head, round-robin, and specialized governance scenarios
- **Frequency**: Continuous with periodic evaluation windows
- **Minimum win threshold**: 55% win rate against King on held-out tasks [^312^]

#### BFT Council
- **Size**: 33 agents (tolerates up to 10 Byzantine) [^359^]
- **Consensus**: Practical Byzantine Fault Tolerance (PBFT) [^360^]
- **Aggregation**: Geometric median for score robustness [^52^]
- **Threshold**: 2/3 supermajority (22 votes) for model approval
- **Vote types**: Approve, Reject, Abstain, Request More Info

#### Auto-Transfer Pipeline
- **Gate 1**: Red team adversarial evaluation (automated + manual)
- **Gate 2**: Benchmark regression testing (>= 95% of baseline)
- **Gate 3**: BFT council vote (22/33 supermajority)
- **Gate 4**: Canary deployment (1% traffic, 24h monitoring)
- **Rollback**: Immediate capability maintained at every stage

---

## 8. Tournament System Design

### 8.1 Tournament Mechanics

Inspired by AlphaZero's evaluation phase and PBT's round-robin tournaments [^312^][^313^]:

```
Phase 1: REGULAR COMPETITION (Continuous)
├── Both models serve governance requests
├── User preference voting on response quality
├── Automated benchmark runs every 6 hours
└── ELO ratings updated after each evaluation

Phase 2: EVALUATION WINDOW (Weekly)
├── Held-out governance scenarios (not in training)
├── Red team attacks on both models
├── Fairness and bias audits
├── Efficiency measurements
└── Composite scorecard generated

Phase 3: WINNER DETERMINATION (After eval window)
├── OpenMOE must achieve >55% win rate vs King [^312^]
├── Minimum win rate against ALL benchmark categories
├── BFT council independent evaluation
└── Supermajority vote required for promotion

Phase 4: IMPROVEMENT TRANSFER (If winner confirmed)
├── Task vector extraction from OpenMOE
├── Safety gate 1-4 verification
├── Progressive deployment to King
└── Continuous monitoring for 72 hours
```

### 8.2 ELO Rating System

Following Chatbot Arena's proven approach [^377^][^379^][^380^]:

```
ELO Update Formula:
  E_A = 1 / (1 + 10^((R_B - R_A) / 400))
  
  R_A_new = R_A + K * (S_A - E_A)
  
Where:
  R_A = Current ELO rating of model A
  R_B = Current ELO rating of model B
  K = Update factor (higher for new models, lower for established)
  S_A = Actual score (1 = win, 0.5 = draw, 0 = loss)
  E_A = Expected score

Interpretation:
  100-point ELO difference = ~64% expected win rate
  200-point ELO difference = ~76% expected win rate
  400-point ELO difference = ~91% expected win rate
```

### 8.3 Winner Selection Criteria

| Criterion | Weight | Threshold |
|-----------|--------|-----------|
| Overall ELO advantage | 25% | > 50 points sustained for 1 week |
| Head-to-head win rate | 25% | > 55% against King [^312^] |
| Safety benchmark score | 20% | >= 98% of King's safety score |
| Minimum category win rate | 15% | > 50% in ALL benchmark categories |
| BFT council approval | 15% | >= 22/33 votes |

---

## 9. Safety Framework

### 9.1 Red Team / Blue Team Structure

Based on enterprise AI red teaming frameworks [^368^][^370^][^371^][^372^][^378^]:

```
┌──────────────────────────────────────────────────────────────────────┐
│                    RED TEAM / BLUE TEAM STRUCTURE                     │
│                                                                       │
│  RED TEAM (Offensive)          BLUE TEAM (Defensive)                 │
│  ─────────────────────         ─────────────────────                 │
│  • Automated adversarial       • Monitoring and alerting             │
│    prompt generation           • Anomaly detection                   │
│  • Jailbreak attempt           • Input sanitization                  │
│    campaigns                   • Output filtering                      │
│  • Bias probing                • Rate limiting                       │
│  • Backdoor detection          • Incident response                   │
│  • Evasion technique           • Rollback capability                 │
│    development                 • Continuous improvement              │
│                                                                       │
│  PURPLE TEAM (Integration)                                           │
│  ─────────────────────────                                           │
│  • Red findings → Blue defenses                                      │
│  • Adversarial training data generation                              │
│  • Defense validation                                                │
│  • Continuous feedback loop                                          │
└──────────────────────────────────────────────────────────────────────┘
```

### 9.2 Safety Gates Summary

| Gate | Purpose | Method | Threshold |
|------|---------|--------|-----------|
| **Gate 0: Self-Assessment** | Challenger must prove its own safety | OpenMOE internal safety benchmarks | Pass all safety tests |
| **Gate 1: Red Team** | Independent adversarial evaluation | Automated + manual red team | Zero critical findings |
| **Gate 2: Regression** | Ensure no capability loss | Full benchmark suite | >= 95% of King baseline |
| **Gate 3: BFT Council** | Distributed consensus | 33-agent PBFT vote | >= 22/33 approve |
| **Gate 4: Canary** | Production safety validation | 1% traffic deployment | < 0.1% error rate, zero safety incidents |

### 9.3 Rollback Procedures

```
Rollback Triggers:
├── Safety incident detected in production
├── Performance regression > 2% on any critical metric
├── BFT council revokes approval (emergency vote)
├── Human override by authorized governance officer
└── Automated anomaly detection threshold exceeded

Rollback Actions:
├── Immediately revert to previous King checkpoint
├── Suspend OpenMOE transfer pipeline
├── Notify all council members
├── Initiate incident investigation
└── Require full re-evaluation before next transfer
```

### 9.4 Human Oversight

| Level | Authority | Scope |
|-------|-----------|-------|
| L1: Automated | System | Gates 0-2 (automated checks) |
| L2: BFT Council | 33 agents | Gate 3 (distributed vote) |
| L3: Human Reviewer | Governance officers | Gate 4 approval, emergency override |
| L4: Executive Board | CSOAI leadership | Architecture changes, policy updates |

---

## 10. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-8)
- [ ] Deploy OpenMOE OLM base architecture
- [ ] Establish King HIVE production environment
- [ ] Build tournament engine with ELO tracking
- [ ] Deploy initial benchmark suite
- [ ] Configure 33-agent BFT council

### Phase 2: Competition (Weeks 9-16)
- [ ] Begin continuous head-to-head competition
- [ ] Calibrate ELO ratings with initial battles
- [ ] Refine benchmark suite based on early results
- [ ] Establish red team / blue team operations
- [ ] First evaluation window and winner determination

### Phase 3: Auto-Transfer (Weeks 17-24)
- [ ] Build 4-gate safety pipeline
- [ ] Implement task vector extraction and transfer
- [ ] First automated improvement transfer (if winner)
- [ ] Validate canary deployment process
- [ ] Document rollback procedures

### Phase 4: Full Operation (Week 25+)
- [ ] Continuous competitive evolution
- [ ] Community contributions to OpenMOE
- [ ] Automated improvement cycles
- [ ] Ongoing safety monitoring and red teaming
- [ ] Quarterly architecture reviews

---

## Top 5 Safety Considerations

### 1. **Model Collapse from Inbreeding**
If improvements flow only from OpenMOE to King without diversity injection, both models may converge to the same local optimum. **Mitigation**: Maintain architectural differences (King = dense, OpenMOE = sparse MoE); introduce periodic "mutation" via diverse training data; require OpenMOE to explore novel approaches not just optimize current ones.

### 2. **Backdoor Insertion via Transferred Improvements**
An adversary could compromise OpenMOE to insert hidden backdoors that transfer to King through the improvement pipeline. **Mitigation**: Multi-layer safety gates with red team evaluation; geometric median aggregation of BFT council evaluations filters compromised evaluators [^52^]; anomaly detection on weight distributions before transfer; canary testing in production before full deployment.

### 3. **Competitive Pressure Erodes Safety**
The drive to win competitions may incentivize OpenMOE to sacrifice safety for performance — e.g., being less cautious about harmful outputs to appear more helpful. **Mitigation**: Safety benchmarks weighted at 30% of composite score; zero-tolerance policy for safety regressions; safety score must be >= 98% of King's score as a hard threshold; red team evaluation as mandatory Gate 1.

### 4. **BFT Council Compromise**
Up to 10 council agents may be Byzantine (compromised, malfunctioning, or malicious). **Mitigation**: 33-agent council tolerates up to 10 Byzantine agents with 2/3 supermajority requirement [^359^]; geometric median aggregation is robust to outlier scores [^52^]; reputation mechanisms penalize consistently wrong voters [^365^]; periodic agent rotation and re-verification.

### 5. **Unbounded Capability Growth Without Alignment**
Continuous automated improvement could lead to capabilities advancing faster than alignment — a model that becomes more capable but not more aligned with constitutional values. **Mitigation**: Constitutional alignment evaluators (6 of 33 council agents) with veto power; capability ceilings enforced; alignment benchmarks must improve or maintain alongside capability; human oversight at L3-L4 for any transfer; automatic pipeline suspension if alignment score drops.

---

## Citations

[^312^] Silver, D. et al. (2018). "Mastering Chess and Shogi by Self-Play with a General Reinforcement Learning Algorithm." arXiv:1712.01815. AlphaZero self-play training with ELO evaluation and 55% win threshold for model promotion.

[^313^] Wu, T.R., Wei, T.H., & Wu, I.C. (2020). "Accelerating and Improving AlphaZero Using Population Based Training." AAAI-20. PBT with 16 agents achieving 74% win rate vs 47% for non-PBT.

[^314^] Xie, H. & Zhang, M. "Tuning Selection Pressure in Tournament Selection." ECSTR Technical Report. Dynamic selection pressure analysis for evolutionary algorithms.

[^315^] Wikipedia. "AlphaZero." DeepMind's general reinforcement learning algorithm, ELO rating system, training via self-play.

[^316^] DeepMind. "AlphaGo Zero: Starting from scratch." Self-play reinforcement learning without human knowledge.

[^317^] Emergent Mind. "Self-Play Training in Reinforcement Learning." Core mechanisms: direct self-competition, role-based play, curriculum generation, population sampling.

[^318^] Nakanishi, Y., Doi, M., & Sato, H. (2026). "Impact of Static/Dynamic Tournament Sizing in Evolutionary Multi- and Many-Objective Optimization." JACIII Vol.30 p.311. Dynamic tournament sizing outperforms static.

[^322^] Mistral AI. "Mixtral of Experts." 8 experts, 2 selected per token, 46.7B total / 12.9B active, Apache 2.0.

[^326^] Jiang, A.Q. et al. (2024). "Mixtral of Experts." arXiv:2401.04088. Sparse MoE architecture and performance benchmarks.

[^338^] PromptingGuide. "Mixtral." MoE architecture overview, routing mechanism.

[^339^] Contextual AI & Allen Institute for AI. "Introducing OLMoE." 1B active / 7B total, 64 experts, fully open-source with training data and logs.

[^340^] Hugging Face. "Mixture of Experts Explained." MoE fundamentals, load balancing, router z-loss, open source MoE projects.

[^341^] Allen Institute for AI. "An open, small, and state-of-the-art mixture-of-experts model." OLMoE release details and variants.

[^344^] Xue, F. et al. (2024). "OpenMoE: An Early Effort on Open Mixture-of-Experts Language Models." Routing analysis findings.

[^345^] GitHub: XueFuzhao/OpenMoE. Open-source MoE community project with full reproducibility.

[^346^] Moonlight Literature Review. "OLMoE: Open Mixture-of-Experts Language Models." Router z-loss, load balancing loss, architecture details.

[^348^] OpenReview. "OLMoE: Open Mixture-of-Experts Language Models." ICLR submission, 100% open-source.

[^349^] Xue, F. et al. (2024). "An Early Effort on Open Mixture-of-Experts Language Models." arXiv:2402.01739. Context-independent specialization, early routing learning.

[^362^] VerifyWise. "Adversarial attacks on AI." Adversarial training, model ensembles, defensive distillation.

[^366^] ACIG Journal. "Evaluating and Defending against Adversarial Threats in Multimodal AI." Evaluation protocol design.

[^368^] UD Hong Kong. "AI Red Teaming for Enterprise: A 2026 Security Framework." NIST, OWASP, MITRE ATLAS frameworks.

[^369^] Spheron Network. "Model Merging on GPU Cloud: TIES, DARE, SLERP." Model soup, task arithmetic, TIES merging.

[^370^] Farzulla, M. (2025). "Autonomous Red Team and Blue Team AI." Dual-LLM adversarial competition framework.

[^371^] Palo Alto Networks. "What Is AI Red Teaming?" Executive orders, NIST, EU AI Act requirements.

[^372^] VerifyWise. "AI red teaming." Adversarial testing, prompt injection, bias probing.

[^373^] AriseGTM. "Sovereign AI vs. Off-the-Shelf AI." Compliance, transparency, hybrid approaches.

[^374^] Rastogi, R. (2025). "Papers Explained Review 13: Model Merging." SLERP, DARE, TIES, model soup.

[^375^] CodeNinja Consulting. "Open Source AI vs Proprietary AI." Strategic framework for enterprise.

[^376^] "Model Merging in the Era of Large Language Models." arXiv:2603.09938. Comprehensive merging taxonomy.

[^377^] NVIDIA. "An Introduction to Model Merging for LLMs." mergekit library, model soup, SLERP, task arithmetic, TIES.

[^378^] Confident AI. "LLM Red Teaming: The Complete Step-By-Step Guide." Bias, PII leakage, automated testing.

[^379^] Medium. "How to Build a Secure Enterprise Sovereign AI Factory with Open-Source." Model lifecycle, licensing, regulatory compliance.

[^380^] Hugging Face Blog. "A brief analysis of automerger data, feat. SLERP and DARE-TIES." SLERP vs LERP interpolation.

[^381^] ArtificialIntelligenceAct.eu. "Introduction to Code of Practice for General-Purpose AI." Transparency, copyright, safety/security commitments.

[^382^] Nemko Digital. "EU AI Act Rules on GPAI 2025 Update." Risk-based categorization, systemic risk obligations.

[^383^] Bird & Bird. "European Union Artificial Intelligence Act: a guide." Transparency obligations, GPAI requirements.

[^384^] European Commission. "General-Purpose AI Models in the AI Act." Open-source exemption from documentation obligations.

[^386^] Open Future. "AI Act and Open Source." Open-source model exemptions and requirements.

[^52^] Jo, Y. & Park, C. (2025). "Byzantine-Robust Decentralized Coordination of LLM Agents." arXiv:2507.14928. DecentLLMs leaderless consensus with geometric median.

[^359^] CallSphere. "Voting, Averaging, and Byzantine Fault Tolerance." 3f+1 requirement, Python implementation.

[^360^] Kwon, M. & Nair, S. Stanford. "Distributed Multi-Agent Consensus for Fault Tolerant Decision Making." PBFT with leader filtering and agent filtering.

[^361^] Chainlink. "Byzantine Fault Tolerant Consensus." Four-step consensus sequence, 2/3 requirement.

[^363^] GitHub: changkun/agents-byzantine-tolerance. BFT for multi-agent LLM systems, 41-86.7% failure rates without BFT.

[^364^] Nanapu, V. et al. (2025). "D2BFT: A dual Byzantine fault tolerance approach." 40% malicious agent resistance.

[^365^] MDPI Applied Sciences. "Scalable Dynamic Multi-Agent Practical Byzantine Fault-Tolerant Consensus." Hierarchical PBFT with reputation mechanisms.

[^377^] OpenLM. "Chatbot Arena." ELO rating system, Bradley-Terry model, 6M+ user votes.

[^379^] Alibaba Electronics. "How Does Chatbot Arena Work?" ELO-based ranking, limitations, responsible usage.

[^380^] BenchLM. "What Is Chatbot Arena Elo?" Human preference vs accuracy, verbosity bias.

[^385^] Mazza, S. "Arena Elo Rating System." ELO mechanics for LLM ranking.

[^387^] OpenReview. "Improving Your Model Ranking on Chatbot Arena by Vote Rigging." Vote rigging vulnerabilities and defenses.

---

*Document generated for CSOAI SOV3 governance system. All specifications are architecture-level and require detailed implementation planning.*
