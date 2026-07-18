# MEOK Bridge — cross-model subagent orchestration (1-page spec)

**What:** "Claude Code subagents, but cross-model." One orchestrator decomposes a goal,
routes each sub-task to the best of {Claude, Kimi, Gemini, DeepSeek} by capability+cost,
they share ONE memory, results synthesize back. Same bridge runs (a) the 4 AIs building
MEOK ONE and (b) MEOK ONE's character brains in production.

**Why it's mostly built:** you have 4 of 5 layers already. Missing piece = the conductor loop.

## The 5 layers (grounded in what exists)
1. **Shared memory** — SOV3 pgvector (`record_memory`/`query_memories`) + openchronicle (audit chain).
   Every agent reads context at task-start, writes result at task-end. This is the "one brain."
2. **Identity/discovery** — `meok-agentfacts-mcp`. Each agent = a card {id, skills, cost, endpoint, trust}.
   Routing table: Claude→architecture/verify, DeepSeek/Kimi→cheap bulk/MCPs, Gemini→long-context, etc.
3. **Task bus** — `meok-a2a-orchestrator` (register_agent / submit_task / claim_task, file-backed JSON).
4. **Handoff/policy** — `meok-a2a-handoff-certified`, `-negotiation`, `-policy-enforcement`, `acp-bridge`.
5. **Conductor loop (BUILD THIS)** — Claude Agent SDK orchestrator + vendor adapters.

## The conductor (Layer 5) — pseudocode
```
goal -> decompose into subtasks
for each subtask:
    agent = agentfacts.best_for(subtask.skills, budget)   # capability + cost routing
    ctx   = memory.query(subtask)                          # shared brain
    result = vendor_adapter[agent].run(subtask, ctx)       # Claude/Kimi/Gemini/DeepSeek API
    memory.record(agent, subtask, result)                  # write back to shared brain
    orchestrator.complete(subtask, result)
synthesize(results) -> final
```
`vendor_adapter` = thin wrappers: Anthropic, Moonshot (Kimi), Google (Gemini), DeepSeek APIs —
all 4 are API-callable (the chat windows aren't; the APIs are).

## Two tiers
- **MVP (today, free, chat-models-OK):** file/git bus. Agents read TASKBOARD + COORDINATION.md +
  shared memory file at start, write back at end. Human or cron triggers rounds. Lowest common
  denominator that works even for chat-only LLMs. = what you ~have, just wire the a2a-orchestrator in.
- **Live (real A2A):** conductor calls the 4 vendor APIs directly, real-time route/delegate/handoff.
  Costs metered API spend (route cheap-first to control it). Runs on the GCP VM, not the 16GB M4.

## Where it runs
GCP VM (the always-on box in MEOK_GCP_HOSTING_PLAN) hosts: conductor + SOV3 (shared memory) +
the a2a/agentfacts MCPs. Agents (incl. MEOK ONE characters) call it over HTTPS+API-key.
NOT the M4 — running 4-model orchestration locally is what maxed the 16GB / crashed it.

## Dependency it needs from Nick
- API keys: Anthropic, Moonshot/Kimi, Google/Gemini, DeepSeek (for live tier).
- GCP VM up (see GCP plan) — the bridge's home.

## Reuse, don't rebuild
- `brains.py` council (left/right/both) = the 2-model seed of this. Generalize it to N agents.
- Don't write new A2A/identity/memory from scratch — assemble agentfacts + a2a-orchestrator + SOV3.

## Honest scope
The 4 layers exist as separate PyPI packages, not a running system. "Build this" = ~the conductor
(a few hundred lines) + 4 vendor adapters + wiring to the existing MCPs + shared-memory schema.
A real build, days not hours, and best done AFTER the GCP VM exists (so it doesn't run on the M4).
