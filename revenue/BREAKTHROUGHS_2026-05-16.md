# BREAKTHROUGH DAY BRIEF — 2026-05-16

Deep research findings for MEOK AI Labs + SOV3 — what's new, what we should integrate, what to build next.

---

## 1. MCP ecosystem (Apr–May 2026)

**Top breakthrough:** [MCP 2025-11-25 spec](https://modelcontextprotocol.io/development/roadmap) shipped:
- **Elicitation** (server prompts user mid-call with JSON schema)
- **Structured tool output** (`structuredContent`)
- **Client ID Metadata Documents** for cleaner OAuth
- Incremental scope consent + icon metadata
- **MCP Apps surface**

Claude API also shipped **Tool Search** + **Programmatic Tool Calling** for thousand-tool agents.

**Why it matters:** our 38 MCPs return free-text. Adding `structuredContent` to `meok-eu-ai-act` flagship lets Claude parse risk scores directly — kills hallucinated outputs in audits. Elicitation lets `nis2-de-register` ask "which BSI sector?" mid-flow instead of failing.

**Action (1h):** bump `meok-eu-ai-act` to 1.5.0 with `outputSchema` on `assess_risk_tier` + elicitation on missing `annex_iii_category`.

---

## 2. Compliance cliffs — 🔥 URGENT 29 MAY DEADLINE

**Top:** [ICO ADM consultation closes 29 May 2026](https://ico.org.uk/about-the-ico/ico-and-stakeholder-consultations/2026/03/ico-consultation-on-the-draft-guidance-about-automated-decision-making-including-profiling/) — Article 22C + DUAA safeguards live but no authoritative guidance.

The [Code of Practice on AI and ADM Regulations 2026 came into force 12 May](https://themodernregulator.com/icos-new-ai-rulebook-for-automated-decisions/).

**Why it matters:** every UK employer using AI in recruitment now needs Article 22C-compliant logs and a 13-day appeal window — and **there's NO MCP for that**.

**Action (THIS WEEK):**
- Ship `meok-uk-adm-article22c` MCP with: `assess_adm_decision`, `log_meaningful_human_review`, `generate_appeal_packet`
- File a consultation response by 29 May (free positioning — Nick's name on the public record alongside the big consultancies)

---

## 3. Local models for M2 (Nick's machine)

**Top:** **Qwen 3.6-35B-A3B MoE** (MLX) — strongest native tool-calling on Apple Silicon, handles nested JSON, missing-param errors, and the choice *not* to call. [Rapid-MLX](https://github.com/raullenchai/Rapid-MLX) is **4.2× faster than Ollama** with 100% tool-calling success across 17 parsers.

**Pull tonight:**
- **Voice (Sophie/Jarvis):** `mlx-community/gemma-4-e4b-it-4bit` — fast TTFT, conversational
- **Agents (SOV3):** `mlx-community/Qwen3.6-35B-A3B-Instruct-4bit` — only ~13GB active params, 25 tok/s on M2 Max
- **Reasoning:** `mlx-community/Qwen3.6-27B-Instruct-8bit`

**Action:** swap Ollama → Rapid-MLX as SOV3's backend; keep Ollama as fallback.

---

## 4. Agent frameworks

**Top:** [LangGraph 0.4 (Apr 2026)](https://medium.com/data-science-collective/langgraph-vs-crewai-vs-autogen-which-agent-framework-should-you-actually-use-in-2026-b8b2c84f1229) — improved state persistence + HITL checkpoints, 76% mid-complexity success vs CrewAI 71%. [Mastra](https://mastra.ai) (19k stars, 300k weekly npm) is the TS standard.

**Verdict:** keep Taskiq+LangGraph. Don't migrate. Add Mastra ONLY for browser-resident character agents in MEOK frontend.

**Action:** upgrade `langgraph` to 0.4.x and enable checkpoint persistence on the 47-agent council so quantum batch failures resume mid-graph.

---

## 5. Robotics / humanoid 🔥 (Asimov V8 accelerator)

**Top:** [Berkeley Humanoid Lite (RSS 2026)](https://arxiv.org/abs/2504.17249) — **$4,312 BOM**, 200×200×200mm print envelope (fits your Qidi Max4!), permissive license, ALL CAD+firmware+training on [GitHub](https://github.com/HybridRobotics/Berkeley-Humanoid-Lite). Modular 3D-printed gearboxes — direct complement to your WOLF set.

[K-Scale K-Bot](https://github.com/kscalelabs/kbot) ($8,999, Rust-based K-OS) hit $1M orders.

**Why it matters:** Berkeley Lite's gearbox files could **replace half your WOLF set** and accelerate Asimov V8 by 3 months.

**Action:** clone Berkeley Lite repo, diff its actuator spec vs your EC-A target, and print one Berkeley gearbox in PA12-CF this week as a comparison datapoint.

---

## 6. Brand tooling 🔥 (unifies your 25+ domains)

**Top:** [Penpot](https://penpot.app/design/design-tool) — open source, self-hostable, native Design Tokens, **MCP server for AI workflows** (treats designs as code/JSON).

**Why it matters:** your 25+ domains have inconsistent visual identity. Penpot's tokens give you ONE source of truth that all Vercel sites can pull from.

**Action:** self-host Penpot, define MEOK token set (orange/black palette), write a tiny script that exports tokens as Tailwind config — drop into every domain in a single PR.

---

## 7. UK GovTech gaps (no MCPs exist yet) 🎯

| Opportunity | Why no one's built it | Action |
|---|---|---|
| **Article 22C ADM compliance** (see §2) | New 12 May 2026 | Ship this week, £299/mo |
| **DRCF four-regulator agent crosswalk** | Released this month, complex | Ship this weekend, £499 one-shot |
| **ICO FOI AI-generated requests** (pub 7 May) | Brand new niche | Councils-specific MCP, £199/yr/council |
| **FCA AI engagement letter scaffolding** | Recent FCA push | £499 one-shot product |

The [DRCF (ICO+FCA+CMA+Ofcom) flagged the agent-compliance crisis](https://www.kiteworks.com/regulatory-compliance/ai-agent-compliance-risk-drcf/) — and **no crosswalk MCP exists**. Zero competition.

---

## Priority actions ranked

| # | Action | Time | Outcome | When |
|---|---|---|---|---|
| 1 | **Ship `meok-uk-adm-article22c` MCP** | 4h | New revenue line + 29 May ICO consultation submission | This weekend |
| 2 | **Ship `meok-drcf-agent-crosswalk` MCP** | 6h | £499 one-shot, zero competition | This weekend |
| 3 | **Bump 38 MCPs to MCP 2025-11-25 spec** (`structuredContent` + elicitation) | 1 day | Quality leap on existing fleet | Next week |
| 4 | **Swap Ollama → Rapid-MLX + Qwen 3.6-35B on SOV3** | 2h | 4.2× speed-up, better tool-calling | Tonight |
| 5 | **Clone Berkeley Humanoid Lite, print a comparison gearbox** | 1 print job | Asimov V8 acceleration | This week |
| 6 | **Self-host Penpot, define MEOK design tokens** | 3h | Unified brand across 25+ domains | This week |
| 7 | **Upgrade LangGraph 0.3 → 0.4 with checkpoints** | 1h | Resumable quantum batches | Next week |

---

## Sources

- [MCP roadmap](https://modelcontextprotocol.io/development/roadmap)
- [MCP 2025-06-18 spec update](https://forgecode.dev/blog/mcp-spec-updates/)
- [Code execution with MCP](https://www.anthropic.com/engineering/code-execution-with-mcp)
- [Orrick AI Act 2 Aug 2026 prep](https://www.orrick.com/en/Insights/2025/11/The-EU-AI-Act-6-Steps-to-Take-Before-2-August-2026)
- [CISA AI in OT guide](https://www.cisa.gov/news-events/news/new-joint-guide-advances-secure-integration-artificial-intelligence-operational-technology)
- [Best local LLMs Mac 2026](https://insiderllm.com/guides/best-local-llms-mac-2026/)
- [Function-calling local LLMs](https://insiderllm.com/guides/function-calling-local-llms/)
- [Rapid-MLX](https://github.com/raullenchai/Rapid-MLX)
- [LangGraph vs CrewAI vs AutoGen 2026](https://pooya.blog/blog/crewai-vs-langgraph-autogen-comparison-2026/)
- [Berkeley Humanoid Lite paper](https://arxiv.org/abs/2504.17249)
- [Berkeley Lite repo](https://github.com/HybridRobotics/Berkeley-Humanoid-Lite)
- [K-Bot repo](https://github.com/kscalelabs/kbot)
- [Penpot](https://penpot.app/design/design-tool)
- [Penpot GitHub](https://github.com/penpot/penpot)
- [ICO ADM consultation](https://ico.org.uk/about-the-ico/ico-and-stakeholder-consultations/2026/03/ico-consultation-on-the-draft-guidance-about-automated-decision-making-including-profiling/)
- [ICO ADM code The Modern Regulator](https://themodernregulator.com/icos-new-ai-rulebook-for-automated-decisions/)
- [DRCF AI agent crisis](https://www.kiteworks.com/regulatory-compliance/ai-agent-compliance-risk-drcf/)
- [ICO FOI AI guidance (May 2026)](https://www.resultsense.com/news/2026-05-07-ico-foi-ai-generated-requests-guidance/)
