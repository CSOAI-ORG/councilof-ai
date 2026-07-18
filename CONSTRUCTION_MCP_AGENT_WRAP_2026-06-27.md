# 🏗️ Construction AI MCPs — Agent-Callable Layer (M4 27JUN)

**Source:** Kimi synthesis Phase 5 — "Stop selling 'software for humans to hire equipment.' Start selling **'AI agents that autonomously hire, route, and manage construction logistics.'**"

**What I shipped this session:**

## The pattern (consistent across all 3 MCPs)

Each construction-logistics MCP now has:
- **4-6 low-level human-callable tools** (existing — for debugging, granular control)
- **1 high-level agent-callable tool** (NEW — the wedge for Kimi's "agent dependency" metric)

Other AI agents (ClawTeam, custom clients, our own SOV3 orchestrator) call the **high-level tool** which orchestrates the full workflow + returns agent-friendly structured response with `next_action` and `agent_metadata` fields.

## Per-MCP changes

### `grabhire-ai-mcp` (NEW — built from scratch, didn't exist)
- **5 tools total** (4 human + 1 agent-callable)
  - `estimate_load_volume(material, length_m, width_m, height_m)` — volume + weight + lorry loads
  - `get_grab_lorry_pricing(postcode_from, postcode_to, lorry_size, loads)` — haulage + disposal + VAT
  - `check_vehicle_availability(postcode, date_iso, lorry_size)` — fleet availability
  - `generate_waste_transfer_note(job_id, ewc_code, carrier_licence)` — UK WTN per EPA 1990
  - **`hire_grab_lorry(...)` ← THE AGENT-CALLABLE WEDGE** — one call: estimate → price → availability → WTN
- **15/15 tests pass** in `tests/test_server.py`
- **Pricing fixed**: was double-counting disposal (charged 95 per load per haulage); now correct: `haulage × loads + disposal × loads + travel`
- README + pyproject + LICENSE created

### `muckaway-ai-mcp` (existing — added `hire_skip()` tool)
- **7 tools total now** (6 human + 1 new agent-callable)
- **`hire_skip(collection_postcode, waste_type, volume_m3, requested_date_iso, ewc_code, carrier_licence)`** — one call: estimate skip size → price → find tip → generate WTN
- **4 passed / 1 skipped** in existing tests (no regressions)

### `planthire-ai-mcp` (existing — added `rent_equipment()` tool)
- **7 tools total now** (6 human + 1 new agent-callable)
- **`rent_equipment(equipment_type, postcode, hire_days, include_operator, requested_start_date_iso)`** — one call: search fleet → quote → availability → book → return PUWER 1998 safety checklist
- **4 passed / 1 skipped** in existing tests (no regressions)

## Why this matters (per Kimi)

> **"How many AI agents call our MCPs per day?"**

That's the number that determines our valuation. Not users. Not revenue. **Agent dependency.**

Before this commit:
- Construction MCPs were **human-callable** (humans open Claude Desktop, run the tools manually)
- Other AI agents couldn't easily use them (would need to call 4-6 tools in sequence to book a job)

After this commit:
- Construction MCPs are **agent-callable** (any AI agent fires ONE tool, gets a complete booking flow back)
- We become **the infrastructure that 700K-LOC competitor platforms' AI agents call**
- This is the **largest vertical wedge in the MEOK portfolio** (the 700K-LOC competitor is human-facing; we're the agent-facing layer)

## The 3 tools' agent surface

| MCP | Agent-callable tool | What it returns |
|---|---|---|
| `grabhire-ai-mcp` | `hire_grab_lorry` | estimate + pricing + availability + WTN + `next_action: confirm_job()` |
| `muckaway-ai-mcp` | `hire_skip` | skip size + pricing + tip + WTN + `next_action: confirm_booking()` |
| `planthire-ai-mcp` | `rent_equipment` | fleet search + quote + availability + booking + PUWER safety checklist + `next_action: confirm_booking()` |

All 3 return `agent_metadata.x402_price_usd: 0.05` — wired to our `meok-x402-paywall-mcp` (per Kimi's "monetize per agent-call" framing).

## Cross-lane audit

Verified via `git log` + `AGENTS.md` board that:
- Hermes/JEEVES owns SOV3 (200 tools) + council + districts + ZAMBA
- Other M4 lanes: ready-to-fire, EAT-4 MCPs, print queue, emerald-tablet
- M2: councilof-ai live app
- **No lane collision** — `mcp-marketplace/grabhire-ai-mcp/`, `muckaway-ai-mcp/`, `planthire-ai-mcp/` had no active CLAIM before this work

## Files

- `mcp-marketplace/grabhire-ai-mcp/server.py` (17K, 5 tools) — NEW
- `mcp-marketplace/grabhire-ai-mcp/tests/test_server.py` (15 tests) — NEW
- `mcp-marketplace/grabhire-ai-mcp/pyproject.toml` (mcp>=1.28.0)
- `mcp-marketplace/grabhire-ai-mcp/README.md`
- `mcp-marketplace/grabhire-ai-mcp/LICENSE` (MIT)
- `mcp-marketplace/muckaway-ai-mcp/server.py` (+130 lines for `hire_skip`)
- `mcp-marketplace/planthire-ai-mcp/server.py` (+130 lines for `rent_equipment`)

## Honest status

- All 3 construction MCPs now have a 1-call agent-callable surface
- Tests: 15+4+4 = 23 tests pass across the 3 MCPs (no regressions)
- The new tools are **unmocked** (no real fleet DB, no real WTN PDF generator) — they produce the right response shape + pricing + IDs that downstream code can act on
- Production-grade fleet integration is a separate effort (the meok-fleet-mcp is a future work item)

---

*Compiled 2026-06-27, M4 lane, against Kimi's "Clean Pivot" Phase 5 + the construction-MCP fleet.*