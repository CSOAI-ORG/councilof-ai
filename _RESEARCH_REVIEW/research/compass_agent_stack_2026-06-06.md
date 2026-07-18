# Bleeding-Edge Open-Source Agent Stack & Anthropic Surface Map for the Templeman Portfolio (MEOK / CSOAI / SOV3)

**TL;DR**
- `karpathy/autoresearch` is real, Karpathy-authored, ~80k+ stars, and is the cleanest, smallest reference loop for a self-improving agent — but it currently requires a single NVIDIA GPU, so for SOV3's Mac fleet you adopt the *pattern* (git-branch-per-experiment, single scored metric, 5-min budget, agent edits one file) rather than the code. `LLMQuant/quant-mind` is also real, MIT-licensed Python, mid-migration to the OpenAI Agents SDK, and is the right starting skeleton for a regulatory/compliance knowledge base for MEOK and CSOAI — but it is small, in active flux, and you should fork at a pinned commit.
- The highest-leverage moves this quarter are: (1) wrap SOV3's reliable memory layer in **Graphiti** (Apache-2.0 temporal KG, MCP server included) backed by FalkorDB or Neo4j, with **LightRAG** (MIT) as the document-RAG layer because it is the only major graph-RAG framework explicitly tuned for local LLMs + Ollama; (2) bolt **DSPy + GEPA** onto every SOV3 prompt that has a measurable score, so prompts get optimised automatically rather than hand-tuned; (3) port the *autoresearch loop pattern* onto a non-training scorable target inside SOV3 (e.g. retrieval-quality on a MEOK regulatory eval set) using Claude Code / Agent SDK as the harness.
- Anthropic's 2026 surface gives you almost every external-facing layer for free: **Claude Design** drafts MEOK/CSOAI front-ends and SMM client dashboards as deployable HTML/JS; **Claude for Excel/PowerPoint/Word** + Skills generates compliance docs, certification training materials and client decks with carried context; **Claude Code + Agent SDK + Plugins + Skills + the GitHub Action** are the production agent platform; **MCP** is now the universal tool protocol (stable spec 2025-11-25, donated to the Linux-Foundation–hosted Agentic AI Foundation in December 2025, with Anthropic itself reporting over 10,000 active public MCP servers at the time of the donation) — SOV3's 200+ MCP tools are now an asset, not a bet. The single largest risk is the **Morris II** adversarial-self-replicating-prompt class of attack (Cohen [Technion–Israel Institute of Technology / Cornell Tech], Bitton [Intuit, Petach-Tikva], Nassi [Cornell Tech], 2024, arXiv:2403.02817): the moment you connect a self-modifying agent loop to a RAG store that ingests external content, you must assume worm-class compromise unless you sandbox aggressively.

---

## Part 1 — Repo Verifications

### 1.1 `karpathy/autoresearch` — VERIFIED, real Karpathy repo

- **URL:** https://github.com/karpathy/autoresearch
- **Owner:** Andrej Karpathy (real, same account as `nanoGPT`, `nanochat`, `llm.c`, `micrograd`).
- **Stars / forks:** ~78k–85k stars and ~11.4k–12.3k forks observed across crawls in March–May 2026 (the repo grew very fast; the user's claimed "~25k stars / ~3k forks / ~7 contributors" is stale — by mid-2026 it is in the 84k-star tier). The "Fortune called it 'The Karpathy Loop' / 42k stars" figure circulating in PM-blog write-ups is a Q1 2026 snapshot.
- **License:** check repo (Karpathy's other repos are MIT; treat as MIT-style until you read LICENSE).
- **Language:** Python (PyTorch).
- **What it actually does:** Strips `nanochat` down to a ~630-line single-GPU LLM training core (`prepare.py` fixed, `train.py` editable, `program.md` instructions). An autonomous coding agent is pointed at `program.md`, creates a `autoresearch/<tag>` git branch, edits `train.py`, runs a 5-minute training budget, greps `val_bpb` from `run.log`, commits if it improves, `git reset` if it does not. The git history *is* the research trail. Karpathy's framing (README, March 2026): "give an AI agent a small but real LLM training setup and let it experiment autonomously overnight."
- **Relationship to nanochat / nanoGPT:** Lineage is `nanoGPT` (pretraining only) → `nanochat` (full ChatGPT-style stack, Oct 2025, ~55k stars, $100 training run) → `autoresearch` (March 2026 spin-off: nanochat's single-file training core, made agent-editable). Karpathy explicitly directs people who want broader platform support back to nanochat.
- **Maturity:** Demo / reference implementation, not production. Karpathy explicitly says he is "not 100% sure that I want to take this on personally right now" for CPU/MPS support; that work is left to forks. A community fork ecosystem already exists (e.g. `VectorInstitute/helix`, `VectorInstitute/helix-examples`) generalising the loop to non-training scorable problems.
- **Hardware constraint vs SOV3:** *Requires a single NVIDIA GPU* — explicitly does not support CPU or Apple MPS in the master branch. **Therefore: you cannot run upstream autoresearch on your M4 Air or M2 Air directly.** Smaller-compute forks exist; the README signals Karpathy will link to them as they mature.
- **How this informs SOV3's self-improvement loop (adopt the pattern, not the code):**
  1. **One file, one metric, one branch per experiment.** Pick a scorable target inside SOV3 (e.g. retrieval-quality F1 on a held-out MEOK Article 50 regulatory question set, or median-latency-per-agent-turn). Lower-is-better, vocab/size-invariant.
  2. **Fixed wall-clock budget per experiment.** 5 min on Karpathy's GPU; for SOV3's M-series cluster, pick something like 90 s of evaluation rather than 5 min of training.
  3. **Agent edits a single file** (a prompt template, a `dspy` signature, an MCP tool spec) and you reset on regression.
  4. **`results.tsv` untracked, branches advance only on improvement.** This gives you a verifiable git-trail of every change an agent made and why.
  5. **Use Claude Code / Agent SDK as the harness** (see Part 3): pre-built sandboxing, permission modes, `PreToolUse` hooks for safety. Do not invent your own loop runner — Claude Code already does the grep/branch/reset/log dance.
  6. **Use the `program.md` pattern as a SKILL.md** in SOV3 — it is already exactly the format Anthropic Skills use.

### 1.2 `LLMQuant/quant-mind` (QuantMind) — VERIFIED, but small and in active migration

- **URL:** https://github.com/LLMQuant/quant-mind
- **Owner:** The LLMQuant community organisation (open-source community focused on AI + quant finance; six initiatives including Quant Wiki, Quant Paper, Quant Mind, LLMQuant Skills).
- **Stars / contributors:** ~262 stars, ~35 forks, ~10 open issues, very active recent commits (PR5 "flows + magic apex layer", PR6 "mind/memory MVP + trajectory archive", PR7 planned). This is a small, in-flux research codebase — not a 25k-star public utility.
- **License:** MIT (confirmed).
- **Language:** Python 3.8+, async-first (`uv` install, `asyncio`-based flows).
- **What it does:** A two-stage context-engineering framework: (i) **knowledge extraction** — multimodal parsing of papers/news/blogs/SEC filings, summarisation, domain-tagging; (ii) **intelligent retrieval** — semantic search + multi-hop reasoning + knowledge-aware generation. Published as a workshop paper at NeurIPS-adjacent venues (arXiv 2509.21507, "QuantMind: A Context-Engineering Based Knowledge Framework for Quantitative Finance"; the user's "NeurIPS 2025 workshop" claim is at least consistent with the arXiv timestamp). Note: the architecture diagram is a roadmap aspiration — the README itself notes the project is mid-migration to OpenAI Agents SDK, with the `mind/` memory layer scheduled for PR6/PR7.
- **Maturity:** Pre-1.0 research framework. **Do not depend on it for production today.** Fork at a pinned commit, lift the patterns.
- **Repurposing across the portfolio:**
  - **MEOK — EU AI Act regulatory knowledge base.** Replace `ArxivIdentifier` with `EURLexIdentifier` / `CommissionGuidanceIdentifier`. The two-stage pipeline (extract → structured knowledge units → semantic + graph retrieval) is exactly the right shape for an Article 50 compliance corpus that has to answer "does this disclosure satisfy 50(2)?" with citations.
  - **CSOAI — compliance / standards knowledge base.** Same shape, different corpus (ISO/IEC 42001, NIST AI RMF, IEEE 7000-series, sectoral guidance). The certification body and CASA training materials become structured "knowledge units" that the training agent can synthesise on demand.
  - **SOV3 — memory / knowledge layer.** Less ideal than the dedicated memory stack below (Graphiti / Mem0 / LightRAG), because QuantMind is finance-shaped. Use QuantMind's *paper-flow* + *batch_run* pattern, not its current storage layer.
- **Verdict:** **Adopt (as a pattern + skeleton, pinned fork)** for MEOK and CSOAI. **Study, do not adopt** for SOV3 core memory.

---

## Part 2 — Wider Open-Source Sweep (verified 2025–2026)

### 2.1 Self-improving / self-evolving agents

| Project | Repo | License | Stars (approx, mid-2026) | What's novel | SOV3 fit | Tag |
|---|---|---|---|---|---|---|
| **autoresearch** | karpathy/autoresearch | MIT-style (verify) | ~80k+ | Minimal git-branch-as-research-trail loop on a single-file LLM training target | Pattern only (NVIDIA-only) | **Study + port pattern** |
| **DSPy** | stanfordnlp/dspy | MIT | very large public adoption (Shopify and Dropbox case studies in DSPy docs) | Programs-not-prompts: typed signatures, modules, optimizers | Already a 10× leverage point for SOV3's 46 agents | **Adopt** |
| **GEPA** | gepa-ai/gepa | MIT (per DSPy docs) | Accepted at ICLR 2026 (Oral) per arxiv.org/abs/2507.19457 and dspy.ai/api/optimizers/GEPA/overview/; Agrawal et al., July 2025 | Reflective Pareto-frontier prompt evolution. Per the GEPA paper: **+10% aggregate over GRPO across all tasks (Qwen3-8B: 61.28 vs 51.14), up to +19% on individual tasks, +13% over MIPROv2, using up to 35× fewer rollouts than GRPO's fixed 24,000**. DSPy docs state GEPA requires "as few as 10 examples and 20–100 evaluations." Metric can return *text* feedback, not just a scalar. | Highest-ROI optimiser to bolt onto each SOV3 prompt with a score | **Adopt** |
| **SEAL** (Self-Adapting LLMs) | Continual-Intelligence/SEAL | MIT (per VentureBeat coverage and code) | research repo, smaller star count | RL outer loop trains the model to generate its own self-edits (LoRA finetuning data + hyperparams); MIT, 2 A100/H100 GPUs needed | Not runnable on M-series; **study** the self-edit concept and consider as a future cloud workload | **Study** |
| **Darwin Gödel Machine** | jennyzzt/dgm (official, Sakana AI) | check repo (warns explicitly about safety; Anthropic + OpenAI API keys; Docker sandbox) | active research repo | Population-based self-improvement that *modifies its own coding agent's source* and validates on SWE-bench / Polyglot; 20%→50% SWE-bench, 14.2%→30.7% Polyglot | Study the empirical-validation-not-formal-proof loop; **do not run unsandboxed** | **Study (extreme caution)** |
| **DGM-local Ollama fork** | mmtmn/Darwin-Godel-Machine | check repo | small | Local-only DGM via Ollama + Llama 3 | Closer to SOV3 hardware, but inherits all the self-modification risk | **Study** |
| **ADAS / Meta Agent Search** | ShengranHu/ADAS | check repo (ICLR 2025) | ~1.5k+ | Meta-agent programs new agents in code; transfers across domains | Use for *agent topology* search across SOV3's 46 agents | **Study** |
| **Letta** (formerly MemGPT) | letta-ai/letta | check repo (Apache-style; open core, hosted commercial) | very large | OS-style memory-as-state, self-editing core/recall/archival memory, Letta Code skills/subagents | Strong if you want SOV3 agents to *manage their own memory* | **Adopt or Study** |

**License flags:** DSPy, GEPA, SEAL, LightRAG, Graphiti, MIT/Apache — all commercially OK. The DGM repos and ADAS carry **executes-untrusted-model-generated-code** warnings in their READMEs; treat as research code.

### 2.2 Knowledge graph + RAG construction (local-LLM friendly)

| Project | Repo | License | Local-LLM / Ollama support | Best fit | Tag |
|---|---|---|---|---|---|
| **Microsoft GraphRAG** | microsoft/graphrag | MIT | Yes via OpenAI-compatible endpoints | Heavy / batch / community-summary GraphRAG; expensive | Study |
| **LightRAG** | HKUDS/LightRAG | MIT | **Yes — explicit Ollama support, OpenAI-compatible LLM_BINDING, Phi-4 local demonstrated** | EMNLP 2025; dual-level (graph + vector); incremental updates; **best fit for SOV3** | **Adopt** for MEOK/CSOAI regulatory KB |
| **nano-graphrag** | gusye1234/nano-graphrag | check (MIT typical) | Yes | Hackable lightweight GraphRAG; LightRAG is based on it | Reference |
| **Graphiti** | getzep/graphiti | Apache-2.0 | Anthropic / Groq / OpenAI / Sentence-Transformers / Gemini embeddings — local embeddings supported | **Temporal context graph with validity windows**; bi-temporal model; built-in MCP server (`zepai/knowledge-graph-mcp`); FalkorDB default, Neo4j optional. ~26.7k stars | **Adopt** for SOV3 agent memory (especially "what was true on date X" for compliance audits) |
| **Zep** (commercial wrapper) | getzep/zep | Apache-2.0 (open source); commercial cloud | n/a (commercial) | Managed Graphiti; only if you want SaaS | Skip (self-host Graphiti instead) |
| **Cognee** | topoteretes/cognee | Apache-2.0 typically | Yes | Hybrid KG + vector; "AI memory" framing; built-in entity linking in 2026 algorithm | Adopt or Study |
| **iText2KG** | AuvaLab/itext2kg | check | Yes | Zero-shot incremental KG construction from any text using user-defined "blueprints"; Neo4j integrator | **Adopt** as the extraction layer feeding LightRAG/Graphiti |
| **fast-graphrag** | circlemind-ai/fast-graphrag | check | Yes | Lightweight; integrates iText2KG | Study |
| **KAG** | OpenSPG/KAG | check | Yes | Knowledge-augmented generation focused on logical reasoning | Study |
| **R2R** | SciPhi-AI/R2R | check | Yes | Production RAG-as-a-service stack | Study |
| **HippoRAG 2** | OSU-NLP-Group/HippoRAG | check | Yes | Personalized PageRank diffusion on passage nodes | Study |
| **LeanRAG / PathRAG / CausalRAG** | various | research | Mostly research code | Newer 2025–26 graph-RAG variants benchmarked in HugRAG/TagRAG papers | Watch |

**Concrete recommendation for SOV3 / MEOK / CSOAI:** **Stack = iText2KG (extraction, zero-shot, user-defined blueprint) → Graphiti (temporal context graph with MCP server, FalkorDB) → LightRAG (graph + vector RAG, Ollama-bound) → DSPy/GEPA (optimised query/synthesis prompts).** This entire stack is MIT/Apache, runs against Ollama on the Mac fleet (a Phi-4-class local model has been demonstrated end-to-end with LightRAG), and exposes itself to SOV3's agents via MCP.

### 2.3 Multi-agent orchestration — new/notable since the prior research

| Project | Notes | Tag |
|---|---|---|
| **DSPy GEPA + LangGraph** (combined pattern, Patnaik Oct 2025) | DSPy modules wrapped in a LangGraph DAG, with GEPA optimising prompts at each node — this is the cleanest demonstration of "orchestrator + optimiser" that fits SOV3 | **Adopt the pattern** |
| **Letta Code** | Letta's own coding agent; #1 on Terminal-Bench (per Letta blog); skills + subagents + Conversations API for shared memory across users | Study |
| **OpenAI Agents SDK** | QuantMind is migrating to it; relevant only as a comparison point | Skip (you are Anthropic-aligned) |
| **VectorInstitute/helix** + **helix-examples** | Generalises Karpathy's autoresearch loop to any scorable problem; tracks the git-history-as-research-trail idea explicitly | **Adopt as scaffolding** for porting autoresearch to SOV3 |

### 2.4 Agent memory systems — production landscape mid-2026

| System | License | Architecture | LoCoMo benchmark | SOV3 fit |
|---|---|---|---|---|
| **Mem0** | Apache-2.0 (open source) + cloud | Passive extraction, vector + optional graph (Kuzu/Neptune Analytics built-in), 20+ vector backends | Per arXiv:2504.19413 (Chhikara et al., ECAI 2025): Mem0 scores 66.9% overall on LoCoMo LLM-as-a-Judge vs OpenAI Memory's 52.9% (26% relative gain); 91% lower p95 latency and 90% fewer tokens than full-context. As of April 2026, Mem0's new token-efficient algorithm reaches **91.6–92.5 on LoCoMo using <7,000 tokens/retrieval vs 25,000+ for full-context** (mem0.ai/blog/state-of-ai-agent-memory-2026). | **Strong fit** for SOV3 "remember the user / project" |
| **Letta (MemGPT)** | Apache-2.0 | Self-editing OS-style memory blocks (core/recall/archival), agent runtime | Letta team disputes Mem0's MemGPT numbers; their filesystem-only benchmark hit 74.0% with GPT-4o mini | Adopt if you want the *agent* to own memory; heavier lock-in |
| **Zep / Graphiti** | Apache-2.0 (Graphiti open) | Temporal KG with validity windows | Mem0 paper: ~66%; Zep counter: 75.14% corrected | **Adopt Graphiti** for compliance/temporal-correctness use cases |
| **Cognee** | Apache | KG + vector hybrid; 2026 entity-linking inside | Not directly published on LoCoMo | Study |
| **A-MEM** | research | Zettelkasten-style linked memory notes that evolve as related info arrives | Cited in Mem0 paper, accepted for LOCOMO benchmarking | Study |
| **LangMem** | MIT (LangChain) | Native LangGraph memory layer | n/a | Skip unless on LangGraph |

**License flags:** All four primary contenders (Mem0, Letta, Graphiti/Zep open core, Cognee) are Apache-style and commercially safe; **only Zep Cloud** (the managed product on top of Graphiti) is SaaS-priced.

---

## Part 3 — Anthropic Product Surface (verified June 2026) Mapped to the Portfolio

### 3.1 Claude Code

- **CLI:** Now installable via `curl -fsSL https://claude.ai/install.sh | bash`, plus npm package; ships with bundled skills (`/code-review`, `/batch`, `/debug`, `/loop`, `/claude-api`).
- **GitHub Action:** Official repo `anthropics/claude-code-action` (MIT). Supports PR review, issue triage, code generation, deployable on Anthropic API / AWS Bedrock / Vertex AI / Microsoft Foundry / OIDC Workload Identity Federation. Now at v1.0 GA (release notes indicate breaking changes from v0.x).
- **Plugins / Plugin Marketplace:** Documented at `code.claude.com/docs/en/plugin-marketplaces`. A plugin is a directory with `.claude-plugin/plugin.json` that can bundle `commands/`, `agents/`, `skills/`, `hooks/`, and `.mcp.json` MCP servers. Official Anthropic marketplace lives at `anthropics/claude-plugins-official`. Install with `claude plugin marketplace add owner/repo` and `claude plugin install <name>@<marketplace>`.
- **Champion Kit:** Anthropic's official Claude Code adoption playbook for internal champions ("A guide for internal champions driving adoption" — published on both `code.claude.com/docs/en/champion-kit` and `support.claude.com/en/articles/14555399`). Includes a 30-day rollout plan and responses to common concerns.
- **Subagents:** YAML-frontmatter Markdown files in `.claude/agents/` (project) or `~/.claude/agents/` (user). Frontmatter fields: `description`, `prompt`, `tools`, `disallowedTools`, `model`, `permissionMode`, `mcpServers`, `hooks`, `maxTurns`, `skills`, `initialPrompt`, `memory`, `effort`, `background`, `isolation`, `color`. Plugin subagents cannot use `hooks`, `mcpServers`, or `permissionMode` for security reasons.
- **Skills (Agent Skills):** `SKILL.md` files in skill directories. Open standard at `agentskills.io` ("originally developed by Anthropic, released as an open standard"). Progressive disclosure: name+description always in system prompt; body loaded on activation; scripts/references/assets bundled. Anthropic open-sourced 17 official skills at `anthropics/skills`, including PowerPoint/Excel/Word/PDF (the "document skills") and skill-creator, mcp-builder, claude-api skill.
- **Hooks:** 25 lifecycle events. Blocking: `UserPromptSubmit`, `PreToolUse`, `PermissionRequest`, `Stop/SubagentStop`, `PreCompact`. Informational: `SessionStart/End`, `PostToolUse(Failure)`, `SubagentStart`, `Notification`. Exit code 2 = hard block.
- **Output Styles:** Configurable response formatting profiles.
- **Permission Modes:** `default`, `acceptEdits`, `plan`, `bypassPermissions`, plus the new `auto` mode (research preview) — replaces `--dangerously-skip-permissions` with a classifier that escalates after "3 consecutive denials or 20 total" (Anthropic engineering blog). `bypassPermissions` is documented as "Only use this in fully isolated environments like containers, VMs, or ephemeral CI runners."
- **Sandboxing:** Claude Code now ships filesystem isolation + network egress controls using OS primitives (bubblewrap on Linux, seatbelt on macOS, VM-based on Cowork). Anthropic reports sandboxing "safely reduces permission prompts by 84%" in internal usage. Subagent return-check uses a classifier to review the subagent's full action history before results return to the orchestrator — explicit defence against prompt-injection-in-content (i.e. Morris II class).

**Portfolio mapping:**
- **SOV3:** Use Claude Code (or Agent SDK programmatically) as the *harness* for the autoresearch-pattern self-improvement loop. Encode each of SOV3's 46 agents as either (a) a long-lived FastAPI process or (b) a Claude Code subagent definition for episodic tasks; bridge via MCP. Use `PreToolUse` hooks for hard blocks on `rm -rf`, on writes outside SOV3's working tree, and on outbound HTTP to non-allow-listed hosts. Use `acceptEdits` for routine work; **never** use `bypassPermissions` outside an ephemeral container.
- **MEOK:** Use the GitHub Action for PR review on the Article-50 attestation library; use Skills to package the compliance writing patterns (e.g. a "draft-50-2-disclosure" SKILL.md).
- **CSOAI:** Use the Champion Kit playbook *literally* — it is a 30-day adoption template that maps neatly onto how CSOAI itself certifies organisations.
- **Trade SMM business:** Plugin marketplace lets you ship client-specific skill bundles (e.g. "northeast-plumber-content-pack").

### 3.2 Claude Agent SDK (Python + TypeScript)

- **Renamed September 29, 2025** from "Claude Code SDK" to "Claude Agent SDK" alongside Sonnet 4.5 / Claude Code 2.0.
- **Repos:** `anthropics/claude-agent-sdk-python` (MIT, Python 3.10+), `anthropics/claude-agent-sdk-typescript` (MIT, bundles native Claude Code binary as optional dep).
- **Primary APIs:** `query()` (stateless one-shot async iterator) and `ClaudeSDKClient` (bidirectional, supports custom in-process MCP tools via `@tool` decorator and `create_sdk_mcp_server`).
- **Multi-provider:** Anthropic API, AWS Bedrock (`CLAUDE_CODE_USE_BEDROCK=1`), Claude Platform on AWS (`CLAUDE_CODE_USE_ANTHROPIC_AWS=1`), Google Vertex AI (`CLAUDE_CODE_USE_VERTEX=1`), Microsoft Foundry (`CLAUDE_CODE_USE_FOUNDRY=1`).
- **Notable integration milestone:** Apple announced Xcode 26.3 integrates Claude Agent SDK natively (Feb 3, 2026) — using hooks + subagents + Xcode Previews as visual verification.
- **Managed Agents** (REST, hosted by Anthropic; Anthropic runs the sandbox) is the alternative; "Claude Managed Agents can now operate in a sandbox you control and connect to your private MCP servers" was announced at Code w/ Claude SF 2026.

**Portfolio mapping:**
- **MEOK production agents** (watermarking pipeline, C2PA signing, attestation verification) → Agent SDK in Python; in-process MCP tools for crypto operations so private keys never leave the process.
- **SOV3 control plane** → Agent SDK as the outer loop around your existing FastAPI + Postgres + LanceDB stack. Each scheduled job becomes a `query()` call; each long-lived swarm member uses `ClaudeSDKClient`.

### 3.3 Claude Skills (Agent Skills / SKILL.md)

- **Format:** Folder containing `SKILL.md` with YAML frontmatter (`name`, `description` required) plus optional `scripts/`, `references/`, `assets/`, `evals/`.
- **Discovery:** `name` + `description` always in system prompt at startup; full body loaded on relevance trigger; code can be executed as deterministic tools.
- **Cross-surface:** Skills work in Claude.ai (paid plans), Claude Code (filesystem), Claude API (Skills API with beta header `skills-2025-10-02`), Microsoft Foundry (governed, versioned, traceable), AWS (Claude Platform). Note: skills **do not auto-sync across surfaces** — you have to upload to each separately.
- **Document skills** (the pre-built suite, source-available, not OSS): `pdf`, `pptx` (pandas + openpyxl-style design rules), `xlsx` (financial colour conventions, formula-error validation), `docx` (tracked changes, TOC, multi-column). All produce real files via the Skills API; files expire after 24 h in the Files API.
- **Open repo:** `anthropics/skills` — 17 open-source skills incl. `skill-creator`, `mcp-builder`, `claude-api`.

**Portfolio mapping (very high leverage):**
- **MEOK:** A `eu-ai-act-attestation` skill that emits a signed JSON attestation + a C2PA manifest from any model output blob.
- **CSOAI:** A `casa-training-module` skill that turns a topic outline into a Word workbook + PowerPoint deck + multiple-choice eval set, all in the CSOAI brand.
- **Trade SMM:** A `weekly-content-pack` skill per client niche (plumber, joiner, electrician) that emits 7 posts + 4 reels + 1 newsletter in a tracked-changes Word doc.
- **SOV3:** A `sov3-autoresearch` skill that *is* the agent loop — point Claude Code at it and walk away.

### 3.4 MCP (Model Context Protocol)

- **Stable spec:** `2025-11-25` (modelcontextprotocol.io/specification/2025-11-25). A release candidate `2026-07-28` is published as the largest revision since launch — *"a stateless core that scales on ordinary HTTP infrastructure"* — final publication targeted July 28, 2026.
- **Governance:** Donated by Anthropic to the **Agentic AI Foundation** (a directed fund under the Linux Foundation) in December 2025; co-founders include Anthropic, Block, and OpenAI.
- **Adoption:** OpenAI integrated MCP across ChatGPT desktop in March 2025; Microsoft announced Windows 11 MCP preview at Build 2025; integrated by Block, Apollo, Zed, Replit, Codeium, Sourcegraph, Cursor, and many others. **Anthropic reported over 10,000 active public MCP servers at the time of the Linux Foundation donation in December 2025.** Community telemetry additionally cites "97 million monthly SDK downloads across Python and TypeScript" (Pento/dev.to community sources; this latter number is third-party only).
- **Claude product surface:** `.mcp.json` in Claude Code projects; Connectors UI in Cowork and claude.ai (Pro/Max/Team/Enterprise); custom MCP servers in Excel/PowerPoint add-ins; in-process SDK MCP servers via the Agent SDK.

**Portfolio mapping:** SOV3's 200+ MCP tools are now **the right bet**, not a side project. Concretely:
- Wrap your watermarking, signing, attestation, C2PA, retrieval, and DB-write tools as MCP servers using the SDK MCP pattern (in-process where they hold secrets, sub-process otherwise).
- Publish a small Anthropic-style plugin marketplace internal to your org (`templeman/sov3-marketplace`) so Claude Code, Cowork, Excel, PowerPoint and the Agent SDK all see the same tool surface.
- For MEOK: ship an MCP server `meok-article50` that exposes `attest(model_output) → signed_attestation` and `verify(attestation) → ok|fail|reason`. Anyone using Claude — including external auditors — can call it.

### 3.5 Artifacts and Claude Design

- **Artifacts (March 2026 help-centre baseline):** Standalone content (>15 lines, reusable) in a side panel; supports code, SVG, Mermaid, React components, HTML, Markdown, .docx/.pptx/.xlsx/.pdf downloads, and PDF rendering.
- **Live Artifacts (April 2026):** Dashboards/trackers that refresh on each open via MCP connectors (Notion, Slack, Google Sheets, Gmail, custom MCP).
- **AI-powered Artifacts:** Embed Claude calls in the artifact itself; end users authenticate with their own Claude account so usage hits their quota, not yours.
- **Persistent storage:** Pro/Max/Team/Enterprise.
- **Claude Design (Anthropic Labs, research preview, April 2026):** "Generates polished design systems, website prototypes, interactive websites, slide decks, one-pagers and similar artifacts." Output is real HTML + Tailwind/CSS + JS — no proprietary format, no lock-in. Canva integration ("Canva in Claude Design") imports drafts into Canva's Visual Suite as editable designs; Figma integration ("Claude Code to Figma") captures running UI into editable Figma frames.

**Portfolio mapping:**
- **MEOK front-end:** Use Claude Design to draft the compliance dashboard (signed-attestation viewer, C2PA verification panel, attestation history); export as static HTML and host yourself.
- **CSOAI training materials:** Slide decks via Claude Design + Canva for visual polish; certificates as artifact PDFs.
- **Client SMM dashboards:** Per-client artifact dashboards that pull from each client's analytics via custom MCP connectors (Live Artifacts).
- **SOV3 command-centre UI:** Build the agent-state visualiser as an artifact connected to your SOV3 MCP server; iterate in Claude until correct, then check the static HTML into the SOV3 repo.

### 3.6 Claude Cowork

- **What it is:** Agentic desktop knowledge-work mode (Claude Desktop's third tab, alongside Chat and Code), launched as a research preview Jan 2026, Windows GA Feb 10 2026.
- **Architecture:** macOS uses Apple `VZVirtualMachine` (Virtualization Framework) with a custom Linux root filesystem; downloads/boots automatically. **Local MCP servers were recently moved outside the VM** — Anthropic: "treating them like any software a user might choose to install."
- **Configuration:** Reuses `~/.claude/settings.json` and auto-discovers skills from `~/.claude/skills/`. Default model is Opus 4.5 (vs Sonnet 4.5 for Claude Code).
- **Mobile dispatch:** Send tasks from iOS/Android to the desktop Cowork session (desktop must be running and awake).
- **Connectors:** Hundreds of Anthropic-reviewed connectors (AWS Marketplace, n8n, Honeycomb, Fellow.ai, etc.) plus custom MCPs.
- **No persistent memory between sessions** (per Anthropic docs); use Instructions and Skills for continuity.
- **Plugins:** On Jan 30 2026 Anthropic Labs released 11 official Cowork plugins (Sales, Legal, etc.).

**Portfolio mapping:**
- **Trade SMM business:** Cowork is the daily driver for the social-media production line — point it at a client folder, run a `weekly-content-pack` skill, get a draft batch and review.
- **CSOAI:** Cowork drafts certification reports, training-handbook updates, audit-finding summaries.
- **Farm:** Cowork can run scheduled "weekly summary" tasks against your farm-records folder.

### 3.7 Claude in Chrome / Excel / PowerPoint / Word / Outlook

- **Claude for Chrome:** Browser-side agent (default Sonnet 4.5); navigates, fills forms, pulls research; **enabled as a connector inside Cowork** so a single desktop task can do "research the web → produce the deck." Safety guardrails: "Avoid financial transactions, password management, or anything involving sensitive personal data"; users pre-approve actions per site; Claude still asks before irreversible actions.
- **Claude for Excel:** GA on all paid plans (Pro from Jan 2026). Reads workbook including formulas/named ranges; can sort/filter, edit pivots, apply conditional formatting, set data validation. Cell-level citations. Supports custom MCP connectors (S&P Global, LSEG, Daloopa, PitchBook, Moody's, FactSet integrations confirmed).
- **Claude for PowerPoint:** GA on all paid plans. Reads slide master / layouts / fonts / colours; respects brand kits.
- **Claude for Word:** GA on all paid plans, April 2026; tracked changes are native; uses heading styles + numbering automatically.
- **Claude for Outlook:** Beta on all paid plans; triages inbox, drafts replies.
- **Shared Context (March 2026):** Excel ↔ PowerPoint ↔ Word ↔ Outlook now carry one conversation across open files. Skills enabled in Claude settings apply automatically inside the add-ins.
- **MCP in add-ins:** Custom connectors supported (with warning); third-party gateway pattern (Bedrock / Vertex / Foundry) lets enterprises route without a Claude account.

**Portfolio mapping:**
- **MEOK regulatory drafting:** Word + Claude → compliance documents with tracked changes auditors can follow.
- **CSOAI certification training:** PowerPoint for instructor decks; Excel for assessment scoring sheets with named ranges Claude can reason about; Word for handbooks and certificates.
- **Trade SMM client reporting:** Excel monthly metrics → PowerPoint client review decks → Outlook client emails, all in one Cowork-driven session.
- **Farm finance:** Excel-resident model + Claude as financial-modelling copilot.

### 3.8 Anthropic features explicitly relevant to MEOK / CSOAI / robotics

- **Sandboxing + permission modes + classifier-driven auto mode** (above) is exactly the operational answer to running a fleet of agents on your own metal.
- **OpenTelemetry → SIEM telemetry from Cowork** (per claude.com/product/cowork): "streams tool calls, file access, and approval states to your SIEM through OpenTelemetry, enabling data mapping to the Compliance API." This is directly useful evidence for an Article 50 / EU AI Act audit trail.
- **Bedrock / Vertex / Foundry deployment options** mean MEOK and CSOAI can offer "data-resident-in-EU" deployments to clients who need them.
- **Skills as portable, version-controlled, source-available capability units** map perfectly onto CSOAI's certification idea — a "CSOAI-certified skill" is a defensible product (signed SKILL.md + eval set + Maternal-Covenant alignment statement).
- **Provenance / watermarking:** Anthropic's product docs do not bundle a content-provenance product, so MEOK's C2PA + watermark + signed attestation is a genuine **complementary** offer, not a competitor.

---

## Part 4 — Prioritised Action List (this week → this quarter)

### This week (≤7 days, no new infra)
1. **Pin a QuantMind fork.** `git clone LLMQuant/quant-mind`, checkout the latest tagged commit before PR6 lands cleanly, push to your org, freeze. Do not touch upstream's mid-migration mess.
2. **Install Graphiti's MCP server (`zepai/knowledge-graph-mcp`) on the M4 Air.** FalkorDB default; expose it to SOV3 over Tailscale. This becomes the temporal memory layer for every agent that currently relies on PostgreSQL/pgvector for "what did the user say last week."
3. **Wire DSPy into one SOV3 agent** (start with whichever has the clearest scorable target — probably retrieval-relevance on a small MEOK question set). Convert that agent's prompt to a DSPy signature. Run one `bootstrap_fewshot` pass for the baseline.
4. **Sign Templeman up to Claude Max ($100/mo)** if not already, so Cowork + Excel/PowerPoint/Word add-ins + Chrome extension + Skills API access are all live, and the Agent SDK can be exercised against your Max quota for prototyping (production stays on a separate API key — see security caveats).
5. **Adopt one Anthropic Skill format end-to-end.** Take your existing "draft a CSOAI weekly status report" or "make a SMM client weekly pack" workflow and write it as `SKILL.md` + `scripts/` + `references/`. Drop into `~/.claude/skills/` and verify it auto-triggers.
6. **Install the Claude Code GitHub Action** on the MEOK and SOV3 repos. PR review is free leverage.
7. **Add one PreToolUse hook to Claude Code** that blocks `rm -rf`, `curl <non-allow-listed-host>`, and writes outside the working tree. Exit code 2. This is your first deterministic-not-probabilistic safety rail.

### This month (≤30 days, integration work)
8. **Run a GEPA optimisation pass** over your 5 highest-traffic SOV3 prompts. Per the DSPy docs, GEPA needs "as few as 10 examples and 20–100 evaluations" — typical budget is ~$2–$3 per task per the Madura experiment write-up. Document the before/after metric in a `results.tsv` à la autoresearch.
9. **Build the local LightRAG + iText2KG + Graphiti stack** behind a single FastAPI MCP server on the M4 Air. Index the EU AI Act consolidated text + Article 50 guidance + ISO/IEC 42001 + NIST AI RMF. This becomes the **MEOK Regulatory Knowledge Base** product — start charging EU enterprises for query access.
10. **Port the autoresearch loop pattern to a SOV3 self-improvement target.** Pick *retrieval F1 on the MEOK regulatory eval set* as the scored metric. Time budget: 60 seconds per experiment. File the agent edits: a DSPy program defining the retrieval signature. Use Claude Code as the harness, with a hook that vetoes any change that touches a file outside `experiments/`.
11. **Publish a CSOAI plugin marketplace** at `github.com/csoai/claude-plugins` containing your training skills, your Maternal-Covenant alignment SKILL.md, and your CASA assessment skills. This is product packaging *and* CSOAI credentialing in one move.
12. **Stand up Cowork as the trade-SMM content factory.** One Cowork session per client, with a per-client folder, a skill bundle, and an MCP connector to that client's analytics. Replace the "manually open every client's Notion + Canva + Buffer" loop.
13. **Write the SOV3 sandbox brief.** Document, in MEOK's own attestation format, exactly which agents have which permissions, which MCP tools, and which deny-lists. This artefact is itself a compliance product.

### This quarter (≤90 days, strategic)
14. **Move SOV3's outer loop to the Claude Agent SDK** in Python, treating your existing 46-agent FastAPI surface as in-process MCP tools (`create_sdk_mcp_server` per process) and your 200+ MCP tools as sub-process MCP servers. This gives you the same sandboxing/permission model Anthropic uses, for free.
15. **Add Letta or Mem0 as a stateful-user-memory layer** alongside Graphiti (which handles temporal facts). Mem0 if you want minimal lock-in; Letta if you want agents to self-edit memory. Mem0 first.
16. **Ship MEOK 1.0 as: Claude Skill + MCP server + signed-attestation library + C2PA wrapper.** Anyone using Claude (or any MCP-compatible agent) calls `attest()` and `verify()`. Price per call.
17. **Ship CSOAI's first certified-skill product** ("CSOAI-Verified Skill" = signed SKILL.md + eval set + Maternal-Covenant alignment review). Free trial of certification on three open-source skills you already use; that is your case-study marketing.
18. **Evaluate Darwin Gödel Machine / ADAS in a hard-walled VM** for SOV3 agent-topology search. Do not run on the M-series fleet. Use a rented EC2 g4dn or a Sakana-style cloud sandbox.

### Benchmarks / thresholds that change the plan
- **If LightRAG's local-LLM retrieval F1 < 0.65** on the MEOK regulatory eval, move to OpenAI-hosted embeddings or to GraphRAG-with-Gemma-3-27B on a beefier rented box.
- **If GEPA's optimised prompts do not move metric by ≥10 pts on at least one SOV3 agent**, the issue is the eval set, not the optimiser — fix the eval first. (The GEPA paper's headline gain over GRPO is +10% aggregate on Qwen3-8B — if you cannot reproduce that on a single task you have an eval or a logging problem.)
- **If autoresearch-pattern runs cost >$10/day** in tokens and the metric is not moving, kill the loop and switch the budget to manual experiment design.
- **If any agent in the SOV3 fleet ever ingests external content and writes to a shared MCP/RAG store without an Anthropic-style classifier in between**, stop and add one before the next deploy. This is the Morris II line — see caveats.

---

## Caveats — Security, Self-Replication, and What's Self-Reported

- **Morris II / adversarial self-replicating prompts (Cohen [Technion–Israel Institute of Technology / Cornell Tech], Bitton [Intuit, Petach-Tikva], Nassi [Cornell Tech]; arXiv:2403.02817, updated v2).** The canonical zero-click GenAI worm class: an attacker plants an adversarial prompt in a payload (email, document, URL) that, when ingested by a RAG-using agent, causes the model to (i) replicate the prompt in its output, (ii) execute a payload (spam, data exfiltration), and (iii) propagate the prompt back into the shared RAG store, infecting downstream agents. Per the paper's own scope statement, the authors "demonstrated it against GenAI-powered email assistants in two use cases (spamming and exfiltrating personal data), under two settings (black-box and white-box accesses), using two types of input data (text and images) and against three different GenAI models (Gemini Pro, ChatGPT 4.0, and LLaVA)." **Every architecture choice in SOV3 must be made with this threat model in front of you.** Specifically:
  - Any RAG store that ingests external content (email, scraped web, client uploads) MUST be treated as a hostile input boundary.
  - Self-improving agents that rewrite their own prompts (GEPA, DSPy optimisers, autoresearch-style loops) MUST run only against trusted training data — never against live RAG corpora that include third-party content.
  - The Anthropic `auto` mode classifier and the subagent return-check classifier (Anthropic engineering, "claude-code-auto-mode": "Before results go back to the orchestrator, the classifier reviews the subagent's full action history") are your first line of defence; the second is hooks (`PreToolUse` deny rules) and sandboxing (filesystem + egress isolation).
  - **Never run `bypassPermissions` outside an ephemeral VM.** Anthropic's docs are explicit on this and the cost-of-being-wrong is your farm and your reputation.
- **DGM / ADAS / SEAL all carry explicit "executes-untrusted-model-generated-code" warnings.** Even on a clean repo, the *whole point* of these systems is that the model writes the next iteration's code. Run only inside a disposable VM with no production credentials mounted and no network egress to internal hosts.
- **Self-reported / unverified items in this report:**
  - autoresearch star count and contributor count vary wildly across sources (78k → 84k stars between March and May 2026 snapshots). The user's claimed "25k stars / 3k forks / 7 contributors" is stale — verify against the live GitHub header before quoting.
  - QuantMind's "NeurIPS 2025 workshop" claim is consistent with the arXiv preprint (2509.21507) but the workshop acceptance itself was not independently verified in this research run.
  - "97M monthly MCP SDK downloads" is community/third-party blog (Pento, dev.to), not Anthropic primary source. **The "10,000+ active MCP servers" figure is now confirmed as reported by Anthropic itself at the time of the December 2025 Linux Foundation donation.**
  - `anthropics/claude-code-action` star count was not retrieved live; check repo header before publishing externally.
  - LoCoMo benchmark numbers are **vendor-published** by Mem0 and disputed by Letta; treat all single-vendor benchmark claims with caution.
  - "Skills API still in beta" inferred from the beta header `skills-2025-10-02` still being required in mid-2026; Anthropic may have GA-renamed it by the time this report is read.
  - The "Maternal Covenant" alignment framework is the user's own; nothing in this research run validates or invalidates it.
- **Licence reminder:** DSPy, GEPA, LightRAG (MIT) and Graphiti, Cognee, Mem0 open core, Letta (Apache-style) are all commercially fine. Anthropic Skills format is an open standard; the *document skills* (pptx/xlsx/docx/pdf in `anthropics/skills`) are **source-available, not OSS** — read them, learn from them, do not redistribute them as part of a commercial CSOAI product without legal review. The Claude Code CLI itself ships under Anthropic Commercial Terms even though the SDKs are MIT.