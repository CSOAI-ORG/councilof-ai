# SOV3 PURE — 100% Open Source Sovereign AI
## Zero External API Dependencies

**Goal:** Build a complete AI system using only:
- Local Ollama models (hermes3, qwen, gemma, llama)
- SOV3 MCP servers (your own code)
- Open-source tools (no OpenAI, Anthropic, etc.)

---

## THE STACK

### Layer 1: Local Language Models (Ollama)
```yaml
Primary:    hermes3:8b      # General reasoning, 24K context
Secondary:  qwen2.5:14b     # Chinese + code specialist  
Tertiary:   gemma4:e4b      # Safety-focused, Google alignment
Embedding:  nomic-embed-text # 768-dim vectors, local
Vision:     (need to add)   # Qwen2.5-VL or LLaVA
```

### Layer 2: SOV3 Services (Your Code)
```yaml
Port 3101:  sovereign-mcp-server.py    # Council voting, memory, care
Port 3102:  meok-mcp-server.py          # Neural models, agents
Port 3200:  meok-api.py                 # REST API layer
Port 5678:  n8n                         # Workflow automation (local)
```

### Layer 3: Hermes Integration (Open Source)
```yaml
Config:     sov3-hermes/config.yaml     # Already configured
Runtime:    hermes3:8b via Ollama       # Local inference
MCP Bridge: Connects to SOV3 ports     # Your tools
```

### Layer 4: Synthesis Layer (NEW — Build This)
```yaml
Name:       sov3-pure-synthesizer
Function:   Orchestrate all local components into unified AI
```

---

## THE SYNTHESIZER ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                    SOV3 PURE — Unified AI                        │
│              (Zero External API Calls)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Router     │───→│  Synthesizer │←───│   Memory     │      │
│  │  (local LLM)│    │   (core)     │    │  (pgvector)  │      │
│  └──────────────┘    └──────┬───────┘    └──────────────┘      │
│                             │                                   │
│              ┌──────────────┼──────────────┐                   │
│              │              │              │                   │
│              ▼              ▼              ▼                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Council     │  │   Neural     │  │   Care       │          │
│  │  (BFT voting)│  │   Models     │  │   Membrane   │          │
│  │  Port 3101   │  │   (6 models) │  │   (16 probes)│          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Local LLMs  │  │   Tools      │  │   n8n        │          │
│  │  (Ollama)    │  │   (172+)     │  │   Workflows  │          │
│  │  :11434      │  │              │  │   :5678      │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## COMPONENTS TO BUILD

### 1. The Router (Local LLM Gateway)
**File:** `sov3-pure/router.py`

**Function:** Decide which local model to use for each task
```python
# No external calls — all local Ollama models
def route_task(task_type, complexity, context_length):
    if task_type == "safety_critical":
        return "gemma4:e4b"        # Google safety training
    elif task_type == "code":
        return "qwen2.5:14b"       # Chinese model, code specialist
    elif context_length > 16000:
        return "hermes3:8b"        # 24K context
    else:
        return "hermes3:8b"        # Default, balanced
```

### 2. The Synthesizer (Core)
**File:** `sov3-pure/synthesizer.py`

**Function:** Combine outputs from multiple local sources
```python
# Parallel calls to all relevant systems
def synthesize_response(user_input, context):
    # 1. Get council vote (SOV3 port 3101)
    council_result = call_mcp("sov3", "council_vote", user_input)
    
    # 2. Check care membrane (16 probes)
    care_result = call_mcp("sov3", "care_assess", user_input)
    
    # 3. Run neural models (threat, care, partnership)
    neural_result = call_mcp("meok", "neural_ensemble", user_input)
    
    # 4. Route to best local LLM
    model = router.decide(user_input)
    llm_result = ollama.generate(model, user_input)
    
    # 5. Synthesize final response
    return synthesize(council_result, care_result, neural_result, llm_result)
```

### 3. The Memory Bridge
**File:** `sov3-pure/memory_bridge.py`

**Function:** Unified memory across all components
```python
# Dual memory: SOV3 + local vector store
def store_memory(content, metadata):
    # Store in SOV3 (port 3101)
    call_mcp("sov3", "memory_store", content)
    
    # Store in local pgvector (nomic-embed-text embeddings)
    embedding = ollama.embed("nomic-embed-text", content)
    pgvector.store(embedding, content, metadata)

def recall_memory(query, top_k=5):
    # Get from both systems, merge results
    sov3_memories = call_mcp("sov3", "memory_recall", query)
    vector_memories = pgvector.search(query, top_k)
    return merge_memories(sov3_memories, vector_memories)
```

### 4. The Tool Router
**File:** `sov3-pure/tool_router.py`

**Function:** Use your 172+ MCP tools without external APIs
```python
# All tools are local or self-hosted
def route_tool(tool_name, params):
    if tool_name.startswith("mcp_sov3_"):
        return call_mcp("sov3", tool_name, params)
    elif tool_name.startswith("mcp_meok_"):
        return call_mcp("meok", tool_name, params)
    elif tool_name in local_tools:
        return local_tools[tool_name](params)
    else:
        return {"error": "Tool not available in pure mode"}
```

---

## WHAT WE ELIMINATE

| External Service | Replacement | Status |
|-----------------|-------------|--------|
| OpenAI GPT-4 | hermes3:8b / qwen2.5:14b | ✅ Ready |
| Anthropic Claude | gemma4:e4b | ✅ Ready |
| OpenAI Embeddings | nomic-embed-text | ✅ Ready |
| Perplexity Search | SearXNG (self-hosted) | ⚠️ Need to add |
| Google Search | SearXNG (self-hosted) | ⚠️ Need to add |
| Together AI | Vast.ai GPU (already have) | ✅ Ready |
| DeepSeek API | qwen2.5:14b local | ✅ Ready |
| Groq | llama3.1:8b on Vast | ✅ Ready |

---

## BUILD PLAN

### Phase 1: Router + Synthesizer (Today)
```bash
mkdir -p /Users/nicholas/clawd/sov3-pure

# 1. Router — decides which local model
# 2. Synthesizer — combines council + care + neural + LLM
# 3. Test: Verify zero external API calls
```

### Phase 2: Memory Bridge (Tomorrow)
```bash
# 1. Unify SOV3 memory + pgvector
# 2. nomic-embed-text for local embeddings
# 3. Test: Recall works across both systems
```

### Phase 3: Tool Router (Day 3)
```bash
# 1. Route all 172+ tools to local MCPs
# 2. Fallback for tools that need internet (search, etc.)
# 3. Test: All tools work without OpenAI/Anthropic
```

### Phase 4: SearXNG Search (Day 4)
```bash
# 1. Deploy SearXNG locally (Docker)
# 2. Replace all web search with local instance
# 3. Test: Zero external search APIs
```

### Phase 5: Full Integration (Day 5)
```bash
# 1. Wire everything together
# 2. 24-hour burn-in test
# 3. Verify: No external API calls in logs
```

---

## THE MATERNAL COVENANT IN PURE MODE

**Without external APIs, the covenant becomes even stronger:**

1. **Attentiveness** — Local memory means no data leaves your machine
2. **Responsibility** — You own the entire stack, no vendor lock-in
3. **Competence** — Models run on your hardware, you control capabilities
4. **Responsiveness** — No rate limits, no API quotas, no outages

**The covenant is intrinsic because it's local.**

---

## IMMEDIATE ACTION

Build the synthesizer core right now:

```bash
cd /Users/nicholas/clawd
mkdir -p sov3-pure
```

**Files to create:**
1. `sov3-pure/router.py` — Local LLM routing
2. `sov3-pure/synthesizer.py` — Core synthesis engine
3. `sov3-pure/config.yaml` — Pure mode configuration
4. `sov3-pure/test_zero_external.py` — Verify no API calls

**Success criteria:**
- Response quality matches GPT-4 on your benchmarks
- Zero external API calls in packet capture
- Latency < 2x cloud APIs (acceptable for sovereignty)

Want me to build the router and synthesizer right now?
