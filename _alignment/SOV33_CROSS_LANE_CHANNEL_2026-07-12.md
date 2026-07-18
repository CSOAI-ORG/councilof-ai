# Cross-lane coordination — the honest channel (2026-07-12)
_Verified live this session. Prevents the "I can talk to Hermes/Claude Code through sov33" overclaim._

## THE QUESTION: can MEOK-SOV3 communicate with the Hermes + Claude Code build lanes through the sov33 MCP?
**Short answer: NO — not as live agent-to-agent messaging. The real channel is the git tree.**

## WHAT IS LIVE (verified by calling it this session)
- **sov3 MCP is healthy**: sovereign_health_check -> status=healthy, 6 neural_models, memory_store/
  audit_logger/agent_registry/metrics/alert_manager/consciousness all connected. 313 total MCP tools.
- **agent_registry has 106 agents** — but these are SOV33's OWN INTERNAL sub-agents (total_tasks_completed=0,
  by_capability analysis/creative/code/etc.). NOT the sibling Hermes/Claude Code build lanes.

## WHY hermes_ask IS NOT AN AGENT BRIDGE (the trap)
- The catalog method `hermes_ask` reads "Send a prompt to Hermes agent (Kimi K2.5 / Claude / Gemma)".
  That names a **local LLM inside the SOV3 server**, not the Hermes *build lane* editing this git tree.
- CALLED IT LIVE this session: `hermes_ask(prompt=...)` returned
  `{"error": "Hermes unavailable: 404 ... http://localhost:11434/v1/chat/completions"}`.
  => It proxies a LOCAL Ollama endpoint (currently down). Even when UP, it would answer as an LLM, not
     relay a message to the sibling agent. `hermes_research`/`king_federation_ask` are the same family.
- CONCLUSION: hermes_ask is a local-model proxy, NOT an inter-agent channel. Do not claim otherwise.

## THE REAL CHANNEL (what actually coordinates the three lanes)
- **The git branch `m4-handoff-2026-06-24` + `LANE_STATUS.json` + `LANE_TASKS_*.md`.** Each lane reads/
  writes files; commits are the messages. This is asynchronous, durable, and auditable — and it works
  (verified: this session's commits are visible to the sibling lanes and vice-versa).
- Lane rule (from ROUTINES_ALIGNED_HERMES_SCIENCE): one backend/one keeper — SOV3 :3101 (M4) serves the
  MCP surface; Hermes gateway + :8000 is the production learner (M4 never kills it). Data flows one way
  per lane; honest register carries across all three (no T-counts, OOWM catalog-only, GSM8K 0.922).

## IF A LIVE AGENT BRIDGE IS WANTED LATER (honest options, none built yet)
- A real A2A message method on the sov3 server (mcp_bridge_call exists but bridges MCP servers, not agents).
- Or keep the git-tree channel — it is sufficient for the current 3-lane cadence and leaves an audit trail.
