## 3. Agent Design & Model Assignment

The AGENT-47 swarm does not run on a single model. That would be like asking one brain to simultaneously compose poetry, audit financial statements, and interpret constitutional law — each task would starve the others. Instead, frontier MoE models are assigned to each of the 46 agents based on cognitive complexity, context-window depth, and per-token cost. The result is a five-tier hierarchy spanning from a $5-per-million-token sovereign brain to self-hosted models costing fractions of a cent.

### 3.1 The Sovereign Tier (King + Key Advisors)

The sovereign tier — the SOV3 King and three advisors on the King's Council — consumes four of the 46 agent slots. These agents make decisions that cascade to every other node and require the highest reasoning depth and longest context retention. This tier alone accounts for roughly 35-40% of total inference budget, a deliberate concentration of resources on the agents whose outputs shape everything else.

#### 3.1.1 SOV3 King: Claude Opus 4.8 with Dynamic Workflows

The SOV3 King runs on Claude Opus 4.8, which leads the SWE-Bench Pro benchmark at 69.2% — it correctly resolves nearly seven in ten real-world software engineering tasks on first attempt [^155^]. This is not merely a coding credential; SWE-Bench Pro measures the full decision cycle of reading requirements, planning, executing, and verifying — a loop that mirrors the King's own perceive-deliberate-decide-command cycle.

Opus 4.8 ships with Dynamic Workflows: native capability to spawn and coordinate hundreds of parallel sub-agents, each working on a facet of a larger problem [^155^]. A strategic directive like "restructure the Finance Hive's risk model" decomposes into parallel sub-tasks across code analysis, data retrieval, and compliance, then recombines into a coherent plan. The King does not think linearly; it thinks like a swarm itself.

The 1-million-token context window is non-negotiable: the King must hold the constitutional framework, all five hives' current state, the pheromone ledger, and the human sovereign's recent commands in working memory. At $5.00 per million input tokens, the King is the swarm's most expensive agent — but it commands 45 subordinates, making per-subordinate coordination cost trivial [^155^]. Critically, Opus 4.8 is 4× more honest than its 4.7 predecessor, essential for interpreting constitutional constraints and refusing unlawful commands [^155^].

#### 3.1.2 The King's Council: Three Specialist Advisors

The three advisors create cognitive diversity that prevents groupthink. The **Swarm Coordinator** runs on Kimi K2.6, a 1-trillion-parameter MoE (32 billion active per token) at $0.95 per million input tokens, managing up to 300 sub-agents through 4,000 coordinated steps [^from research brief^]. Its modified MIT license permits self-hosting on 4×H100, providing an escape hatch if API access is disrupted.

The **Strategic Analyst** runs on DeepSeek V4 Pro, a 1.6-trillion-parameter MoE with 49 billion active per token and 1-million-token context [^from research brief^]. At $1.74 per million tokens — one-third the cost of Opus 4.8 — it delivers 55.4% SWE-Bench Pro and 66.6% MCPAtlas scores. Its Apache 2.0 license and self-hosting capability are decisive for processing sensitive competitive intelligence within sovereign infrastructure.

The **Long-Horizon Planner** runs on Gemini 3.5 Pro with an industry-leading 2-million-token context and "Deep Think" mode [^170^]. This advisor handles multi-week planning — predicting bottlenecks, anticipating inter-hive conflicts, and scheduling cyclical activities. The 2M context is essential for ingesting weeks of tick-level logs and generating coherent plans spanning thousands of future ticks.

### 3.2 The Specialist Tier (Hive Leaders + Roamers)

The specialist tier comprises thirteen agents — five Hive Leaders, five Roamers, and three additional specialists — each assigned a frontier or high-capability open-weight model matched to its domain. Where the sovereign tier optimizes for general reasoning depth, the specialist tier optimizes for domain-specific performance.

#### 3.2.1 Finance Hive: Quantitative Modeling and Trading Intelligence

The Finance Hive Leader runs on GPT-5.5, scoring 58.6% on SWE-Bench Pro with a 76.4 Agentic Index [^164^]. At $1.50 per million input tokens — one-third the price of Opus 4.8 — it occupies a sweet spot of high reasoning at moderate cost [^164^]. The Finance Hive's core function is financial modeling: forecasting, portfolio optimization, and Monte Carlo simulation. GPT-5.5's Codex integration enables it to write and execute its own Python and SQL for quantitative analysis.

Trading algorithms run on MiniMax M3, a 230-billion-parameter MoE with only 9.8 billion active per token, priced at $0.30 per million input tokens. MiniMax M3 scores 59.0% SWE-Bench Pro and an industry-leading 83.5% BrowseComp, making it exceptional at both writing trading algorithms and gathering real-time market data [^from research brief^]. Risk sub-agents use DeepSeek V4 Pro for deep analysis and DeepSeek V4 Flash — at $0.14 per million tokens, the swarm's cheapest API-grade model — for routine monitoring [^from research brief^].

#### 3.2.2 Creative Hive: Design, Content, and Long-Form Generation

The Creative Hive Leader runs on Claude Sonnet 4.8 at $3.00 per million input tokens — between Gemini Flash's speed and Opus 4.8's reasoning depth, ideal for design briefs and narrative content [^from research brief^]. Real-time generation runs on Gemini 3.5 Flash at $0.15 per million input tokens and 284 tokens per second, the swarm's fastest model [^147^].

Long-form creative projects run on Llama 4 Scout, a 109-billion-parameter open-weight model with a 10-million-token context window — 10× larger than any API-bound model and free to self-host [^from research brief^]. For maintaining character voice across thousands of narrative pages, Scout's context advantage outweighs its ~24% SWE-Bench Pro score. Self-hosted on Groq, it delivers 2,600 tokens per second.

#### 3.2.3 Operations Hive: Logistics, Fleet, and Multilingual Coordination

The Operations Hive Leader runs on Kimi K2.6, repurposed from swarm coordination to logistics optimization. K2.6's native A2A protocol support makes it ideal for fleet routing, where every logistics decision ripples through multiple downstream agents [^from research brief^].

Multilingual operations run on Qwen3.7 Max, scoring 60.6% SWE-Bench Pro with 35-hour autonomous endurance — essential for long-running optimization jobs [^from research brief^]. Infrastructure automation runs on Mixtral 8x22B, a 141-billion-parameter Apache 2.0 model at $0.90 per million tokens with strong tool-use capability [^from research brief^].

#### 3.2.4 Governance Hive: Regulatory Reasoning and Constitutional Interpretation

The Governance Hive Leader also runs on Claude Opus 4.8 — regulatory reasoning demands the highest honesty standard available. Opus 4.8's 4× honesty improvement enables constitutional interpretation without creative loophole-seeking [^155^]. This hive determines whether hive restructures comply with the founding charter, whether financial instruments violate risk limits, and whether research crosses ethical boundaries.

Subordinate compliance agents run on models fine-tuned on CSOAI's 13-framework regulatory corpus (EU AI Act, CULLNA, CEMPUS, KABAA, and nine additional frameworks). Distilled from larger teachers into Mistral Small 3.1 or Llama 4, they achieve 85-90% of teacher accuracy at 5% of inference cost.

#### 3.2.5 Research Hive: Data Science and Long-Sequence Analysis

The Research Hive Leader runs on DeepSeek V4 Pro — self-hostable, Apache 2.0-licensed, processing multi-terabyte datasets within sovereign infrastructure. Long-sequence analysis runs on Mamba-3, the third-generation state-space model scaling linearly $O(n)$ rather than quadratically $O(n^2)$ [^from Wave 8 brief^]. At 128,000-token contexts, Mamba-3 is 2.4× faster and uses 2.4× less memory than transformers — essential for detecting patterns in months of simulation telemetry. Domain verticals deploy fine-tuned Qwen3.7 Max or DeepSeek V4 variants scoring above 80% on domain benchmarks.

The table below consolidates the full model assignment across all 46 agents:

| Tier | Agent Role | Model | Key Spec | Cost ($/1M input) | Context | License |
|------|-----------|-------|----------|------------------|---------|---------|
| **Sovereign (4)** | SOV3 King | Claude Opus 4.8 | 69.2% SWE-Bench, Dynamic Workflows | $5.00 | 1M | Proprietary |
| | Swarm Coordinator | Kimi K2.6 | 300 sub-agents, 4,000 steps | $0.95 | 256K | Modified MIT |
| | Strategic Analyst | DeepSeek V4 Pro | 1.6T params, 49B active | $1.74 | 1M | Apache 2.0 |
| | Long-Horizon Planner | Gemini 3.5 Pro | 2M context, Deep Think | TBA | 2M | Proprietary |
| **Specialist (13)** | Finance Hive Lead | GPT-5.5 | 58.6% SWE-Bench, Codex agents | $1.50 | 1M | Proprietary |
| | Trading Algorithms | MiniMax M3 | 59% SWE-Bench, 83.5 BrowseComp | $0.30 | 1M | Open-weight |
| | Creative Hive Lead | Claude Sonnet 4.8 | Extended thinking, balanced cost | $3.00 | 1M | Proprietary |
| | Real-time Content | Gemini 3.5 Flash | 284 tok/sec | $0.15 | 1M | Proprietary |
| | Long-form Creative | Llama 4 Scout | 10M context, 2,600 t/s (Groq) | Free | 10M | Llama 3.1 |
| | Operations Lead | Kimi K2.6 | 86.3% BrowseComp, A2A native | $0.95 | 256K | Modified MIT |
| | Multilingual Ops | Qwen3.7 Max | 60.6% SWE-Bench, 35h autonomous | $1.25 | 1M | Proprietary |
| | Infrastructure Auto | Mixtral 8x22B | 141B params, strong tool use | $0.90 | 64K | Apache 2.0 |
| | Governance Lead | Claude Opus 4.8 | 4× more honest than 4.7 | $5.00 | 1M | Proprietary |
| | Compliance Agents | Custom fine-tuned | 13-framework corpus | ~$0.10 | 128K | Apache 2.0 |
| | Research Lead | DeepSeek V4 Pro | Self-hostable, data science | $1.74 | 1M | Apache 2.0 |
| | Long-sequence Analysis | Mamba-3 | Linear $O(n)$ scaling | Self-host | 128K | Apache 2.0 |
| | Domain Research | Qwen3.7 Max fine-tuned | Vertical specialists | $1.25 | 1M | Proprietary |
| **Background (21)** | Routine Workers | Llama 4 Scout/Maverick | 109B/400B params, low cost | Free | 1M-10M | Llama 3.1 |
| | Cost-efficient Batch | Mistral Small 3.1 | ~500 t/s, reliable | $0.20 | 128K | Apache 2.0 |
| | High-volume Parsing | DeepSeek V4 Flash | 284B params, 13B active | $0.14 | 1M | Apache 2.0 |
| | API Backup Workers | GPT-5.5 | Volume discount eligible | $1.50 | 1M | Proprietary |
| **Peripheral (8)** | Occasional Tasks | Free tier rotation | Groq, Cerebras, OpenRouter | $0 | Varies | Varies |

The table reveals deliberate concentration of premium spend at the top. The four sovereign agents consume frontier models at $5.00, $3.00, and $1.74 per million tokens because their decisions cascade to all 42 subordinates. The thirteen specialists deploy a balanced mix: five on frontier APIs, five on cost-optimized open-weight or mid-tier models, and three on specialized architectures (Mamba-3, self-hosted DeepSeek V4 Pro, Gemini Flash). The twenty-nine background and peripheral agents drive the per-agent average to roughly $0.30 per million tokens through self-hosted open weights and free-tier stacking.

### 3.3 The Background Tier (Hive Workers)

The background tier comprises twenty-one agents — the worker bees of each hive — handling routine, repetitive, and high-volume tasks. The design philosophy is "good enough, fast enough, cheap enough": a worker classifying log entries or routing notifications requires competence, not genius.

#### 3.3.1 Model Assignment by Workload Pattern

Three model families serve the background tier, assigned by workload pattern. **Self-hosted Llama 4 Scout and Maverick** handle the majority of tasks. Scout (109B total, 17B active, 10M context) and Maverick (400B total, 17B active, 1M context) are free to self-host under the Llama 3.1 License [^from research brief^]. On Groq's free tier, Scout delivers 2,600 tokens per second. The 10M context is particularly valuable for workers maintaining long-running state.

**Mistral Small 3.1** handles tasks requiring stronger reasoning than Llama delivers but not justifying a frontier call. At 22 billion dense parameters, it achieves ~35% SWE-Bench Pro — sufficient for code review and documentation — at $0.20 per million tokens and ~500 tokens per second [^from research brief^]. Apache 2.0 licensing permits self-hosting on a single consumer GPU.

**DeepSeek V4 Flash** — at $0.14 per million input tokens, the cheapest API-grade model — handles highest-volume tasks: log ingestion, metric collection, and health checks [^from research brief^]. Flash activates only 13 billion parameters per token but retains the 1-million-token context, making it ideal for batch-processing low-complexity data at scale.

**GPT-5.5** serves as overflow backup for edge cases exceeding Llama or Mistral capability. At $1.50 per million tokens with volume discounts, it provides frontier reasoning for exceptions [^164^]. This overflow pattern reduces background-tier costs by ~40% versus running all workers on a single mid-tier model.

#### 3.3.2 Worker Specialization: Domain Fine-Tuning

Each background worker is fine-tuned on its hive's domain data, creating narrow specialists rather than general-purpose assistants. The pipeline distills knowledge from teacher models (DeepSeek V4 Pro, Qwen3.7 Max, Claude Sonnet 4.8) into student models (Mistral Small 3.1 or Llama 4 Scout), using supervised fine-tuning plus GRPO reinforcement learning to align outputs with hive-specific standards.

Finance Hive workers train on the FishKeeper aquaculture dataset, learning aquaculture-specific accounting conventions. A 22-billion-parameter Mistral worker matches 100-billion-parameter frontier accuracy on FishKeeper tasks at one-tenth the cost. Operations Hive workers train on GrabHire construction logistics data; Governance Hive workers train on the LandLaw legal corpus, achieving 94% accuracy on jurisdiction and subject-matter classification — a task requiring frontier models without domain training.

Fine-tuning pays for itself within the first month. A custom Mistral Small 3.1 costs ~$50 to produce (LoRA/QLoRA on one A100) and runs at $0.20 per million tokens or zero marginal cost self-hosted. Equivalent frontier accuracy costs $1.25-$5.00 per million tokens — a 6-25× advantage.

### 3.4 Cost Architecture

The swarm runs at three budget tiers — Hobby ($50/month), Professional ($500/month), and Enterprise ($5,000/month) — each maintaining the full 46-agent population but with different model assignments, activity levels, and infrastructure backends. The cost architecture is a constraint that shapes which agents are awake, which models they run, and how deeply they reason.

#### 3.4.1 Three Compute Tiers

The Hobby tier targets experimenters validating swarm architecture before production. Sovereign agents run on Claude Sonnet 4.6 via OpenRouter (a downgrade from Opus 4.8 but still capable of core coordination), while specialist and background tiers run on free-tier providers: Llama 4 Scout via Groq (1,000 requests/day free), Mistral Small via OpenRouter (50-200K tokens/day free), and DeepSeek V4 Flash at $0.14 per million for critical agents [^from research brief^]. Hobby achieves its price through free-tier stacking across eight providers — Groq, Cerebras, OpenRouter, Google AI Studio, Mistral AI, Cloudflare Workers AI, NVIDIA NIM, and GitHub Models — collectively providing ~$225/month in equivalent free inference [^from research brief^]. Only 15-20 agents are active at any time; the remainder rotate on a schedule.

The Professional tier at $500/month is the recommended configuration for serious deployments. All 46 agents are active during an 8-hour daily window, with the sovereign tier on Opus 4.8 and K2.6, specialists on a balanced mix of frontier and mid-tier models, and background agents on DeepSeek V4 Flash and Mistral Small 3.1. OpenRouter serves as the primary gateway with cost-quality tradeoff set to 5, while SGLang provides prefix caching at 70% hit rate on shared system prompts [^from research brief^]. The monthly budget allocates roughly $100 to Opus 4.8 (300M input + 100M output tokens), $150 to Kimi K2.6 and MiniMax M3, $100 to DeepSeek V4 Pro/Flash, $60 to Qwen3.7, $30 to Gemini 3.5 Flash, and $60 to Mistral Small, Llama 4 local inference, and OpenRouter fees [^from research brief^].

The Enterprise tier at $5,000/month delivers 24/7 persistence with all frontier models active continuously. This requires self-hosted infrastructure: a 4×H100 cluster running Kimi K2.6 and DeepSeek V4 Pro via vLLM or SGLang, plus API access for proprietary models (Opus 4.8, GPT-5.5, Gemini) that cannot be self-hosted [^from research brief^]. RadixAttention prefix caching pushes hit rates above 80%. The budget allocates approximately $400 to Claude Opus 4.8 (2B input + 600M output tokens), $350 to Kimi K2.6, $500 to GPT-5.5 (800M + 250M tokens), $300 to MiniMax M3 (2B + 800M tokens), $260 to DeepSeek V4 Pro (1.5B + 500M tokens), $250 to Qwen3.7 Max (1B + 400M tokens), $140 to DeepSeek V4 Flash for background agents (3B + 1B tokens), $150 to Gemini 3.5 Flash, and $1,200 for the self-hosted 4×H100 cluster [^from research brief^].

| Tier | Monthly Cost | Agents Active | Activity Window | Key Models | Infrastructure | Cache Hit |
|------|-------------|---------------|-----------------|------------|----------------|-----------|
| **Hobby** | $50 | 15-20 (rotating) | 4 hrs/day, intermittent | Sonnet 4.6, Llama 4 Scout, DeepSeek Flash | Free-tier APIs only, no self-host | 0% (no cache) |
| **Professional** | $500 | All 46 | 8 hrs/day | Opus 4.8, K2.6, GPT-5.5, MiniMax M3, DeepSeek Pro/Flash | OpenRouter primary, SGLang cache | 70% |
| **Enterprise** | $5,000 | All 46 | 24/7 continuous | All frontier + self-hosted open models | 4×H100 self-hosted + API for proprietary | 80%+ |

The three-tier structure creates a clear upgrade path. A developer validates the swarm at $50/month, deploys all 46 agents at $500/month, and scales to persistent-world production at $5,000/month without rewriting agent code — only routing configuration and activity schedules change. The Hobby tier is a larval stage, the Professional tier a pupal metamorphosis, and the Enterprise tier the adult hive in full operation.

#### 3.4.2 The SOV3 Domain Router: Parameter-Gated Compute

The most aggressive cost optimization is the SOV3 Domain Router — a custom routing layer that implements the MoE principle at swarm level. Its governing principle: send every request to the smallest model capable of handling it. The router maintains a capability matrix across twelve dimensions — reasoning depth, coding accuracy, context length, multimodal breadth, tool-use proficiency, honesty alignment, speed, cost, self-host availability, license type, swarm coordination, and domain specialization. When an agent submits a request, the router classifies task complexity, matches against the matrix, and routes to the cheapest model whose capabilities exceed requirements. If the selected model fails, the router cascades to the next model up the capability ladder.

This pattern delivers MoE-style efficiency across the entire swarm. DeepSeek V4 Pro activates only 49 billion of its 1.6 trillion parameters per token — a 32.6× sparsity ratio [^from research brief^]. MiniMax M3 is even more extreme: 9.8 billion of 230 billion activate per token, a 23.5× ratio [^from research brief^]. The router extends this principle across models: only the parameters of the smallest capable model activate per request. A log classification routing to Mistral Small 3.1 (22B dense) consumes 2.2% of the compute that routing to Opus 4.8 (~500B) would require. A code generation task routing to MiniMax M3 (9.8B active) consumes 0.6% of equivalent dense-model compute.

| Routing Decision | Typical Task | Model Selected | Active Params | Equiv. Dense Cost | Actual Cost | Savings |
|-----------------|-------------|--------------|---------------|-------------------|-------------|---------|
| Log classification, alert routing | Background monitoring | Mistral Small 3.1 | 22B | 22B dense | 22B | 1.0× (baseline) |
| Code review, simple bug fix | Specialist coding | MiniMax M3 | 9.8B | 230B dense | 9.8B | 23.5× |
| Architecture design, 1M ctx | Sovereign planning | DeepSeek V4 Pro | 49B | 1.6T dense | 49B | 32.6× |
| Complex reasoning, tool chains | King-level directive | Claude Opus 4.8 | ~50B | ~500B dense | ~50B | 10.0× |
| **Weighted average** | All tasks (swarm-mixed) | SOV3 Router blend | **~37B** | **~203B avg** | **~37B** | **5.5×** |

The weighted average across the full swarm, given Professional-tier task distribution, is approximately 37 billion active parameters per request against an equivalent dense-model average of 203 billion — a **5.5× compute savings** from routing alone [^from research brief^]. This multiplier stacks on top of tier-specific optimizations: Hobby stacks free tiers, Professional adds 70% prefix caching, and Enterprise pushes cache efficiency above 80% while self-hosting the most expensive open-weight models. The result is 46 agents running at a per-agent inference cost below what a single general-purpose frontier model would consume without routing optimization.

#### 3.4.3 The GRPO "Market-as-Critic" Approach

The final optimization eliminates a bottleneck plaguing multi-agent systems: human review of agent outputs. Forty-six agents generating decisions every 30 seconds produce more outputs than any human can review in real time. The GRPO (Group Relative Policy Optimization) "Market-as-Critic" framework removes this bottleneck by treating the swarm itself as quality arbiter.

When an agent faces a complex decision — a financial trade, a creative design choice, a governance ruling — it generates five candidate solutions with varied reasoning paths. These publish to the A2A bus as a "proposal bundle." Other agents in the same hive, plus one randomly selected agent from each other hive, vote using a pheromone-weighted scoring function that weights votes by the voter's track record. The highest-scoring candidate executes automatically; no human reviews individual decisions.

The swarm learns from outcomes through GRPO reinforcement learning. Positive outcomes — profitable trades, accepted designs, compliant rulings — reinforce the reasoning pattern that generated the winning candidate. Negative outcomes penalize the pattern. Over thousands of ticks, each agent's model converges on reasoning patterns validated by the swarm's collective intelligence, without human-labeled training data [^from Wave 8 brief^]. GRPO — the same algorithm driving DeepSeek-R1's reasoning — matches or exceeds supervised fine-tuning on complex tasks while requiring zero human annotation [^from Wave 8 brief^].

The cost impact is transformative. Human review at the Professional tier — assuming two hours daily at $50/hour — adds $100/month in labor and introduces minutes of latency per decision. GRPO "Market-as-Critic" reduces this to zero marginal labor cost and sub-second collective decisions, while improving quality through multi-agent ensemble voting. Five diverse models voting on five diverse solutions capture more cognitive diversity than any single human reviewer.

The constraint-first variant — where humans vote on strategy and agents execute within boundaries — draws from modern DAO governance research [^from Wave 8 brief^]. In AGENT-47, the human sovereign proposes strategic constraints ("reduce Finance Hive risk exposure by 20% this quarter"), and the swarm's internal market determines tactical implementation. Humans set the guardrails; the swarm navigates the road.
