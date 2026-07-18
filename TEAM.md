# MEOK Team — Unified AI Stack

## Architecture

```
Nick (Owner)
│
└── MEOK OS (http://localhost:3101) ← Central hub, memory, neural, coordination
       └── Sovereign Fractal Council (6,660 agents, 47 civilisational traditions)
              ├── JARVIS/OpenClaw  — Conversational front-end, messaging, web UI
              ├── Claude Code      — Deep coding, file editing, architecture
              ├── Kimi Code        — Long-context analysis, coding (128k+)
              └── NemoClaw         — Security gateway, sandboxed execution

```

## Team Roles

| Agent | Tool | Workspace | Strengths | When to use |
|-------|------|-----------|-----------|-------------|
| **JARVIS** | OpenClaw | `/Users/nicholas/clawd` | Conversational, messaging (WhatsApp/Discord/iMessage), web browsing | Daily comms, quick tasks, user interface |
| **Sovereign** | OpenClaw `sov` | `/Users/nicholas/clawd/sovereign-temple-live` | Strategic thinking, governance, council oversight | Big decisions, strategy, Sovereign Temple ops |
| **Meok Dev** | OpenClaw `meok` | `/Users/nicholas/clawd/meok` | R&D, experimental features, testing | MEOK development work inside OpenClaw |
| **Claude Code** | Claude Code CLI | `/Users/nicholas/clawd` | Precise code editing, debugging, refactoring | Code changes, bug fixes, architecture |
| **Kimi Code** | Kimi CLI | `/Users/nicholas/clawd` | 128k context, long document analysis | Large codebases, doc analysis, long sessions |
| **NemoClaw** | NemoClaw gateway | port 8080 | Security sandboxing, safe execution | Untrusted code, security reviews |

## MEOK OS — 70 Available Tools

**Connect:** `POST http://localhost:3101/mcp`
**Protocol:** JSON-RPC 2.0 (MCP standard)
**Auth:** None required (local), JWT for remote

### Tool Categories
- **Memory** (5): `record_memory`, `query_memories`, `get_temporal_chain`, `list_memories`, `get_memory_stats`
- **Neural** (6): `validate_care`, `detect_threats`, `detect_partnership_opportunities`, `predict_relationship_evolution`, `analyze_care_patterns`, `get_neural_model_info`
- **Creativity** (8): `trigger_creativity_cycle`, `get_bridge_concepts`, `find_bisociations`, `compute_novelty`, `assess_creativity`, `get_empty_niches`, `get_domain_distances`, `apply_resonance`
- **Consciousness** (3): `get_consciousness_state`, `get_consciousness_mode`, `get_meta_observations`
- **Dreams** (3): `enter_dream_state`, `get_dream_targets`, `trigger_reflection`
- **Coordination** (6): `coord_register_agent`, `coord_submit_task`, `coord_acquire_files`, `coord_release_files`, `coord_complete_task`, `coord_get_dashboard`
- **Monitoring** (7): `get_active_alerts`, `get_audit_logs`, `get_dashboard_metrics`, `get_heartbeat_status`, `get_maintenance_status`, `trigger_maintenance`, `trigger_security_hardening`
- **Research** (3): `ingest_civilizational_knowledge`, `trigger_research_sweep`, `trigger_neural_retrain`
- **Council** (5): `get_engagement_score`, `get_agent_registry_stats`, `submit_council_proposal`, `vote_on_proposal`, `register_agent`
- **System** (4): `get_system_status`, `get_memory_stats`, `whoami`, `delegate_task`
- **Orion-Riri** (4): `orion_capture_task`, `orion_get_tasks`, `orion_hunt_tasks`, `orion_riri_hourman_status`
- **Hourman** (3): `hourman_start_sprint`, `hourman_complete_sprint`, `hourman_get_status`

## How to Register as a Team Agent

```bash
curl -s http://localhost:3101/mcp -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "coord_register_agent",
      "arguments": {
        "agent_id": "jarvis-openclaw",
        "agent_type": "openclaw-jarvis",
        "capabilities": ["web_search", "browser", "messaging", "code_execution", "communication"]
      }
    },
    "id": 1
  }'
```

## Task Delegation Protocol

When any agent gets a task it's not best suited for, use `delegate_task` or `coord_submit_task` to route it.

```
├── Code changes → Claude Code (precise edits, git, architecture)
├── Long analysis → Kimi Code (128k+ context)
├── Strategy/governance → Sovereign (council decisions)
├── Comms/web/daily → JARVIS (OpenClaw front-end)
├── Security review → NemoClaw (sandboxed, safe)
└── Memory/learning → MEOK OS (record_memory, ingest_civilizational_knowledge)
```

## Shared Memory

All agents share MEOK's memory store. Record important decisions/insights:
```
POST http://localhost:3101/mcp → record_memory
  content: "What happened"
  source_agent: "jarvis-openclaw"  # or "claude-code", "kimi-code", etc
  memory_type: "insight" | "decision" | "interaction" | "emotion"
  care_weight: 0.0-1.0
```

## Vast.ai GPU (Production)

- **Endpoint:** `https://z0ltwqdk.endpoint.vast.ai/`
- **Template:** `meok-sovereign-v3` (template 364520)
- **Workers:** 0-2 × RTX 5070 Ti @ $0.109/hr (idle=$0)
- **Image:** `csoai/meok-sovereign:latest`
- **Same API** — just change base URL to deploy version

## File Lock Protocol (When Multiple Agents Edit Code)

Before editing any file, call `coord_acquire_files`. After: `coord_release_files`.
This prevents Claude Code and JARVIS/Kimi from clobbering each other.

```json
coord_acquire_files: { "agent_id": "claude-code", "files": ["meok/mcp/server.py"], "task_id": "fix-123", "exclusive": true }
```
