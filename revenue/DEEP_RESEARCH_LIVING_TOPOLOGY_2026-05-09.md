# Deep Research: Living Topology Architecture
**Generated:** 2026-05-09
**Sources:** 3 parallel research agents (Hy3+memory, bridge patterns, visual graphs)

---

## THE VISION

SOV3 becomes the living brain that knows EVERYTHING — every domain, every MCP, every Stripe product, every directory submission, every file change, every session. When you open Claude Code or OpenCode, it auto-syncs with SOV3. When Hermes gets a WhatsApp message, SOV3 records it. When n8n runs a workflow, the result feeds back. Nothing is lost. Ever.

A 3D force-directed graph shows the entire empire spinning in real-time — click any node to see its connections, status, revenue, and health.

---

## HY3 = TENCENT HUNYUAN 3

- 295B MoE model (21B active params), open-sourced April 2026
- GitHub: github.com/Tencent-Hunyuan/Hy3-preview
- Scores high on SWE-bench, BrowseComp, agentic benchmarks
- Handles MCP toolchain orchestration up to 495 steps
- Too large for M4 locally — needs multi-GPU (vast.ai could run it)
- NOT a topology tool — it's a reasoning backbone for complex agent tasks

---

## THE STACK (7 Layers)

### Layer 1: NATS JetStream (Event Bus)
```bash
brew install nats-server
nats-server -js
```
- Single binary, sub-millisecond, persistent streams, no Docker
- Every agent publishes events: `agent.claude.file-edit`, `agent.hermes.whatsapp`, etc.
- SOV3 subscribes to `agent.>` and records everything
- Python: `nats-py`, Node: `nats.js`

### Layer 2: Graphiti + FalkorDB Lite (Knowledge Graph)
- **Graphiti** (github.com/getzep/graphiti, 24K stars): temporal knowledge graph with built-in MCP server
- Tracks entities + relationships WITH time validity windows
- **FalkorDB Lite**: embedded graph DB, no server, M4 ARM64 native
- Stores the entire topology as a queryable graph

### Layer 3: Hindsight (Shared Memory)
- github.com/vectorize-io/hindsight, 91.4% accuracy on LongMemEval
- Runs fully local with Ollama (no API keys)
- Built-in MCP server + embedded PostgreSQL + pgvector
- Fact extraction + entity resolution + cross-encoder reranking
- Multiple agents connect simultaneously via MCP

### Layer 4: AgentGateway (MCP Mesh)
- github.com/agentgateway/agentgateway, v1.0.0, Linux Foundation
- Rust binary, proxies both MCP and A2A protocols
- Single endpoint aggregating SOV3 + Hermes + all 234 MCPs
- Alternatives: MetaMCP (Docker), deco MCP Mesh

### Layer 5: react-force-graph-3d (Visual Topology)
- github.com/vasturiano/react-force-graph, ~3K stars
- 3D force-directed graph in Next.js (WebGL/Three.js)
- Handles 500+ nodes, real-time updates via WebSocket
- Click any node to see connections, status, revenue
- Topology data: 61 nodes, 54 edges already built at `_TOPOLOGY/live_graph.json`

### Layer 6: watchdog + Git Hooks (File Watching)
- Python watchdog daemon watches `~/clawd/` recursively
- On file change: generate embedding, upsert pgvector, publish NATS event
- Git post-commit hook: publishes to NATS
- Closes the loop: every code change → SOV3 memory

### Layer 7: GitNexus (Codebase Topology)
- github.com/abhigyanpatwari/GitNexus
- Tree-sitter AST analysis → knowledge graph
- 7 MCP tools: dependency mapping, blast-radius, Mermaid diagrams
- Works with Claude Code natively

---

## DEPLOY SCHEDULE

| Day | What | Time | Result |
|-----|------|------|--------|
| 1 | NATS JetStream + watchdog daemon | 2h | Event bus live, file changes auto-captured |
| 2 | Hindsight alongside SOV3 | 2h | Shared memory with MCP server |
| 3 | Wire SOV3 + Hermes + n8n to NATS | 3h | All agents share state in real-time |
| 4 | AgentGateway as MCP mesh | 2h | Single endpoint for all 234 MCPs |
| 5 | react-force-graph-3d dashboard | 4h | Live 3D spinning empire topology |
| 6 | Graphiti + FalkorDB Lite | 3h | Temporal knowledge graph |
| 7 | GitNexus for codebase awareness | 1h | Full repo dependency mapping |

---

## ALTERNATIVE TOOLS (ranked)

### Memory Layer Alternatives
| Tool | Stars | Maturity | MCP? | Best For |
|------|-------|----------|------|----------|
| Mem0 OpenMemory | 53K | Production | Yes (official) | Highest adoption, easiest setup |
| Letta (ex-MemGPT) | 15K | Production | Yes | Autonomous self-editing memory |
| Cognee | 15K | Production | Yes | Hybrid graph+vector, n8n integration |

### Graph Visualization Alternatives
| Tool | Stars | 3D? | Scale | Best For |
|------|-------|-----|-------|----------|
| Sigma.js | 11K | No | 100K+ nodes | Pure 2D performance |
| AntV G6/Graphin | 11K | Partial | 10K+ | Chinese ecosystem, React wrapper |
| Cytoscape.js | 10K | No | 5K+ | Graph theory algorithms |

### Agent Orchestration
| Tool | MCP? | Local? | Best For |
|------|------|--------|----------|
| LangGraph | Yes (adapter) | Yes | Stateful agent graphs with checkpointing |
| Temporal.io | No | Yes (brew) | Durable execution with replay |
| Prefect | No | Yes (pip) | Scheduled topology sweeps |

---

## WHAT THIS MEANS FOR NICK

Once deployed, this stack gives you:

1. **Zero context loss** — Every file change, every session, every message feeds into SOV3
2. **One query to know everything** — "What's the status of eu-ai-act-compliance-mcp?" returns: version, directories, Stripe product, GitHub repo, download count, last commit, related domains
3. **Visual empire map** — 3D spinning graph of 500+ entities, click to drill down
4. **Agent coordination** — Claude Code, Hermes, n8n, and custom agents all share ONE brain
5. **Temporal awareness** — Graphiti tracks WHEN things changed, not just what they are
6. **No more "where are we?"** — SOV3 always knows. Every new session starts with full context.

---

## CURRENT STATE (already done today)

- [x] SOV3 business knowledge: 9 comprehensive memories injected
- [x] Embedding backfill: 5,427/5,427 (100%) — semantic search fully working
- [x] nomic-embed-text pulled and operational
- [x] vast.ai API deployed (llama3.1:8b + llama3.2:3b + nomic-embed-text)
- [x] Topology graph data: 61 nodes, 54 edges at `_TOPOLOGY/live_graph.json`
- [x] Auto-sync hook added to Claude Code settings
- [x] Session sync script at `sovereign-temple/sov3_session_sync.sh`
