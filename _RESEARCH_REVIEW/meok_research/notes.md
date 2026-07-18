# Agent Orchestration Frameworks — Deep Research 2026-05-27

## Nick's Current Stack vs Market

| Nick's Framework | Market Equivalent | Maturity | Recommendation |
|-----------------|-------------------|----------|----------------|
| **clawd / Jeeves** | OpenClaw / Claude Code | Medium | Keep — good persona system |
| **.openclaw** | Custom agent + CuaDriver | Medium | Keep — macOS automation unique |
| **agenticSeek** | AutoGen / AG2 | Medium | Evaluate migration to LangGraph |
| **OpenManus** | Open-source generalist | Low | Monitor — not production-ready |
| **Hermes** | Task planner | Unknown | Evaluate vs CrewAI |
| **Kimi CLI** | CLI orchestrator | High | Keep — this is the interface |
| **Gemini CLI** | General assistant | High | Keep — research/multimodal |
| **Kilo Code** | Coding specialist | High | Keep — focused use case |

## 2026 Framework Rankings (Production Readiness)

### 1. MCP (Model Context Protocol) — 9.2/10
- **Best for**: 80% of agent use cases
- **Pros**: Simplest (35 lines), fastest build (30 min), cheapest ($0.45/run)
- **Cons**: Limited to tool calling, no complex workflows
- **Verdict**: Use as the foundation protocol

### 2. CrewAI — 9.0/10
- **Best for**: Multi-agent teams, role-based workflows
- **Pros**: Intuitive roles, best output quality (95% accuracy), 100% reliability in tests
- **Cons**: $0.68/run, limited checkpointing, can hit $7/run without exit conditions
- **Verdict**: Prototype here, migrate to LangGraph for production

### 3. LangGraph — 8.25/10
- **Best for**: Complex stateful workflows, production systems
- **Pros**: 100% reliability, graph visualization, time-travel debugging, checkpointing
- **Cons**: Steepest learning curve, 180 lines of code, 2h 45min to build
- **Verdict**: Production standard for complex agents

### 4. Microsoft AutoGen / Agent Framework — 7.8/10
- **Best for**: Azure ecosystem, conversational agents
- **Pros**: Multi-agent debate, research-backed, async event-driven
- **Cons**: v0.2→v0.4 migration was breaking, production patterns less standardized

### 5. OpenAI Swarm / Agents SDK — Medium
- **Best for**: OpenAI-native, handoff patterns
- **Pros**: Clean API, built-in tracing
- **Cons**: OpenAI models only, experimental

### 6. Google ADK — Early
- **Best for**: GCP-native deployments
- **Pros**: A2A protocol, multimodal
- **Cons**: Newest framework, ecosystem immaturity

### 7. AutoGPT — 3.2/10
- **Verdict**: NOT production-ready. 40% success rate, $3.20/run, 7h build time.

## Key Finding: OpenClaw is Well-Positioned

OpenClaw (what Nick uses) maps to the **"Claude Code / OpenClaw"** category in 2026 comparisons:
- **Best for**: Coding, business automation, research
- **Multi-agent**: Yes (native)
- **Learning curve**: Low-Medium
- **License**: Proprietary

**The ecosystem Nick has built (clawd + openclaw + Hermes + Kimi + Gemini + Kilo) is actually MORE sophisticated than most 2026 framework comparisons.** The typical comparison assumes ONE framework. Nick has 8+ agents specialized by role.

## Recommendation for CSOAI

The **Byzantine Council** (33 agents) should use a **hybrid architecture**:
1. **LangGraph** for the orchestration layer (state management, routing)
2. **MCP** for tool standardization (each agent exposes tools via MCP)
3. **CrewAI patterns** for role definitions (Safety Auditor, Risk Assessor, etc.)
4. **OpenClaw** for macOS/desktop automation
5. **Kimi CLI** as the primary human interface

This gives CSOAI the most robust, production-ready agent infrastructure possible.

---
*Sources: Presence.ai, GuruSup, Leaper.dev, AugmentCode, GitHub Gist (manduks)*
*Compiled: 2026-05-27*
