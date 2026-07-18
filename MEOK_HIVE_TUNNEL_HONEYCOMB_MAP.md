# MEOK — Hive / Tunnel / Honeycomb: the unified map

_By Claude (Opus 4.8), 2026-06-07. Grounded in real reads + live e2e on this Mac + the GCP VM.
This map SUPERSEDES and reconciles three earlier, partly-conflicting docs:_
- `COUNCIL_OF_MCPS_ARCHITECTURE.md` (May 18) — Ralph/33-node/9-MoE — **design only, never built**
- `MEOK_MCP_TUNNEL_MAP.md` (Jun 1) — the tunnel/gateway — **real, keep**
- `hive-staging/**` + `HIVE_BUILD_DASHBOARD.md` (Jun 7) — 28 hive configs — **scaffold, re-point onto the engine below**

---

## The one model (Nick's words → real components)

```
                          🍯 HONEYCOMB  =  SOV3  (:3101, live)
                          queen of queens · honey collector
                  memory · care NNs · council · 1394 episodes · 0.788
                                   ▲   ▲   ▲
                       honey (lessons) gossiped UP via the TUNNEL
                                   │   │   │
        ┌──────────────────────────┼───┼───┼──────────────────────────┐
        │                          │   │   │                          │
   👑 meok queen            👑 grabhire queen   👑 councilof queen   … ×28
   (a hive)                 (a hive)            (a hive)
        │                          │                    │
        └─────────── each queen = ONE meok-one engine, parameterised by ───────────┘
                       that hive's stack.yml  (NOT a new evoagentx stack)

   a queen does 3 things, all already built in meok-one:
     • MoE routing   = router.ask / brains  (pick the model per task)
     • BFT govern    = sovereign_council    (12 lenses, safety-veto + vote)
     • safe tools    = tunnels.safe_call    (3-tier: read auto / write confirm / prohibited refused)

                                   │
                          🛣️ TUNNEL = tool_gateway.invoke()  (the ONE choke point)
                                   │   + Cloudflare (api.meok.ai, sov3.meok.ai)
                       ┌───────────┼───────────┐
                       ▼           ▼           ▼
                 SOV3 110 tools  315 MEOK MCPs  32 session MCPs (Stripe/Gmail/Vercel…)
```

**Hive** = one business. **Queen** = that business's MoE+BFT brain (one shared engine, per-hive config).
**Tunnel** = the safe gateway every queen calls tools through. **Honeycomb** = SOV3, collecting what
every hive learns. **Honey** = (1) cross-hive lessons up to SOV3; (2) in business terms, GEO authority + revenue.

---

## The decision that kills the duplication

`hive-staging/` invented a parallel 7-layer stack (evoagentx + letta + cognee + memoria) that
**isn't installed and doesn't run**. Meanwhile `meok-one/` already has the working engine:
`brains.py` (left/right/council), `bft_lab.py` (the exact "12-around-1 vs 33-BFT" harness),
`sovereign.py::sovereign_council` (BFT-of-MoEs), `router.py` (MoE), `tunnels.py` (safe gateway).

> **A queen is meok-one, scoped by a hive's stack.yml. 28 queens = 28 config files on 1 engine.**

The new bridge that does this: **`meok-one/meok_one/hive_queen.py`** (built today).
`queen(domain, message, brain="council")` reads `hive-staging/<domain>-hive/stack.yml`
(tools, scope, palette, roster), runs the MoE/BFT, and gossips the lesson up to SOV3.

Governance collapses to **ONE** BFT layer = SOV3's `sovereign_council` (live). Do **not** build
Ralph + a separate 33-node CouncilOf MCP. Ralph's "retry-until-done" becomes the Hermes (L6)
loop; the 33-node vote becomes `sovereign_council` quorum + SOV3's `submit_council_proposal`.

Memory collapses to **ONE** upward path: hive interaction → `hive_queen.gossip()` →
`safe_call("record_memory")` → SOV3 honeycomb. Everything else stays hive-local.

---

## E2E results (real, this session)

| Check | Result |
|---|---|
| `meok-one` imports clean | ✅ |
| Router aliases added: `m3` (minimax-m3:cloud), `gemma4:e4b` — **free, no key** | ✅ |
| `m3` answers via local Ollama | ✅ ("yes I am online") — but the cloud-proxy is **flaky** under load |
| `gemma4:e4b` answers via local Ollama | ✅ (~11s/short reply) |
| `load_hive('meok')` parses stack.yml (tools, scope, palette, roster) | ✅ |
| Bug fixed: stack.yml `tier:` (business) vs engine billing tier | ✅ |
| Queen council runs free-local on the 16 GB Mac | ❌ **too slow** — 420-tok drafts blow the 60s timeout; M3 proxy flaky → `0/N draft` |
| VM Ollama reachable + fast (`qwen2.5:3b` → instant) | ✅ |
| Queen council on **GCP VM roster** (qwen2.5:3b + llama3.2:3b) | ⏳ verifying (see below) |
| Honey reaches SOV3 honeycomb via tunnel | ✅ `safe_call("record_memory")` → `world:sov3, executed:true` (needs `source_agent` arg — fixed) |
| SME identity framing (queen answers AS the vertical) | ✅ added to `hive_queen.py` (verify on VM) |

### The load-bearing finding
**The 16 GB Mac is the dev/orchestration box, not an inference box.** A real multi-node BFT
council needs either the **GCP VM** (fast local models) or an **OpenRouter key** (cloud roster).
Free-local single-brain works; free-local 3–4-node council does not. Plan around this — it's the
same constraint as the known "M4 crashes under load."

---

## What works / what doesn't / what's redundant

**Works (keep, build on):**
- `tool_gateway` tunnel — real, tested, 3-tier safety, 100% classifier. The spine.
- SOV3 honeycomb — live, real memory/care/council.
- `meok-one` engine (brains/bft_lab/sovereign/router) — the real queen.
- Hive `stack.yml` schema — genuinely good config; reuse it as the queen's parameters.

**Redundant / conflicting (collapse):**
- 3 governance designs → 1 (`sovereign_council`).
- 3 memory systems (agentmemory/memoria/cognee + SOV3 + mex) → 1 upward honey path; rest hive-local.
- evoagentx hive stacks → replaced by `hive_queen.py` on the proven engine.

**Doesn't fit yet (honest):**
- "28 always-on queens" would melt the Mac → queens are **lazy/on-demand through the tunnel**,
  and inference lives on the VM.
- grabhire's `stack.yml` tools are recruitment/resume/lead-scoring (not haulage) — **data-quality
  fix** needed before its queen is a real haulage SME.

---

## MiniMax M3 (wired this session)
- Registered as router alias **`m3` → `minimax-m3:cloud`** (local Ollama, FREE, no OpenRouter key).
- Also already present as cloud alias `minimax` → `minimax/minimax-m3` (needs OpenRouter).
- Role in the dual-agent protocol: **M3 = a council expert lens + auditor** (Claude builds / M3 audits / Nick sovereign).
- Caveat: the Ollama cloud proxy for M3 is intermittently slow/empty — fine as one council node,
  not as the sole companion.

---

## Build order (Nick's chain) — status
1. **One real queen (meok-hive)** — ✅ built (`hive_queen.py`), e2e proven (engine + config + honey; council on VM verifying).
2. **Push the 28 hives** — pending (gh CSOAI-ORG auth ready; push the configs + a queen entrypoint).
3. **GEO honey layer** — pending (/constellation hub + cross-hive citation matrix, from the SEO doc).
4. **This map** — ✅ (this file).
5. **E2E test + audit** — in progress; M3 as auditor next.
6. **Improve** — SME framing, VM roster default, lazy-start, grabhire tool data-quality.
7. **Deep research / take further** — OpenRouter key unlocks frontier councils; lens→tool mapping over 459 tools.

## Kimi treasure-hunt — honest triage (2026-06-07)
Kimi's "20 missing repos" report assessed against the REAL stack:
- **Already have (skip):** mem0 (`~/.mem0`), claude-mem (`~/.claude-mem`), OpenHands (`~/.openhands`),
  Letta (hive L4), FastMCP (hive L5), browser-use (kimi-webbridge + Claude-in-Chrome).
- **Real gap, integrated today:** **observability.** Built **Langfuse-lite** = JSONL trace
  (`data/hive_traces.jsonl`) written by the execution TUI on every king/queen/audit call.
  Full Langfuse rejected — needs Docker+Postgres, won't fit the 16GB Mac.
- **Worth a later look:** PageIndex (vectorless RAG, 98.7% FinanceBench), Pydantic-AI (type-safe agents),
  Graphiti (temporal KG) — none urgent; current memory/RAG path is adequate.

## MEOK Execution TUI (the UX hand-over)
`meok-one/tools/meok_tui.py` — the control tab: talk to the King, it routes to a Queen,
answer returns, honey to the honeycomb, **every call traced**. Commands: `/hives /health
/trace /honey /fan /queen /audit /quit`. Run: `python3 tools/meok_tui.py`.
Also `tools/m3_tui.py` — standalone MiniMax M3 chat + `/audit`.

## Files
- `meok-one/tools/meok_tui.py` — MEOK execution console + observability **[new]**
- `meok-one/tools/m3_tui.py` — MiniMax M3 TUI (chat + auditor) **[new]**
- `meok-one/meok_one/hive_king.py` — the King (route + fan-out over 28 queens) **[new]**
- `meok-one/meok_one/hive_queen.py` — the bridge (one engine, any hive) **[new]**
- `meok-one/meok_one/router.py` — `m3` + `gemma4:e4b` aliases **[edited]**
- `meok-one/meok_one/{brains,sovereign,tunnels,bft_lab}.py` — the engine (unchanged)
- `hive-staging/<domain>-hive/stack.yml` — per-queen config (source of truth)
