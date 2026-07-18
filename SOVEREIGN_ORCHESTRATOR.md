# Sovereign Orchestrator — SOV3 watches, learns, and carries on (design, 2026-06-26)

The vision: load SOV3 + MEOK OS on your PC; the sovereign **watches your windows, learns your patterns, auto-continues the routine, and only interrupts you for the calls that actually need you** — so you stop typing "go/eat/continue" all day. Governed + signed, not blind auto-pilot.

## It's ~80% built from parts you already have
| Role | Existing piece (verified on machine) |
|---|---|
| Brain | SOV3 live (:3101, healthy) + King hive + `swarm_orchestrate` / `coord_*` / `next_best_action` / `get_unified_context` |
| Federation | `sov3_federation.py` · `sov3_king_federation.py` · `mcp_bridge.py` + `mcp_federation_call/_catalog/_search` · `mcp_bridge_discover` |
| Hands | `computer-use` + `macos-computer-use` skills (screenshot, read screen, key/type) — wire, don't build |
| Eyes (on you) | MEOK Aware presence layer (you-vs-stranger, attention) |
| Learning | `per_feature_queen.py` + `os_telemetry.jsonl` + `track()` |
| Cockpit | MEOK OS (the dashboard) |
| Accountability | SIGIL (sign every auto-action) + the 33/36-node BFT council (ratify) |

## How SOV3 connects to "all 100,000" MCPs — honestly
**Not** 100k live connections. **Federation + lazy discovery:** SOV3 keeps a *catalog* (it already has `mcp_federation_catalog`), `mcp_bridge_discover`s on demand, calls via `mcp_federation_call`, and **caches what's useful**. Scaling to 100k = growing the catalog + a router (`sov3_olm_router.py`) that picks the right MCP per task — not holding 100k sockets. The honest frame: **don't own 1% of MCPs — be the governance layer the other 99% route through.** Owning-by-count is a vanity metric; the moat is the 22 bridges + 20 A2A substrate + signing + council that the 100k *lack*.

## The Orchestrator loop (governed autonomy, not runaway)
```
every N seconds:
  for each watched window:
    observe()    → screenshot + read → state ∈ {idle/awaiting-input, working, novel/risky, error}
    classify()   → ROUTINE (whitelisted "continue") | JUDGMENT (novel/risky/destructive)
    if ROUTINE and ACT armed:   act("continue")   → SIGIL-sign the keystroke
    if JUDGMENT:                escalate to MEOK OS ("Window 3 wants to publish — approve?")
    record everything to SIGIL (replayable: every auto-"go" + why)
  honor kill-switch + rate-limit every tick
```
**Your "go/eat/continue" is your governance gate.** The orchestrator offloads only the *routine* continues (whitelisted) and escalates every *judgment* call to you — so you keep your checkpoint on the things that matter, and the queen widens the whitelist only as it learns you.

## Non-negotiable safety (an AI driving your keyboard across other AI sessions)
1. **Dry-run by default** — observes + proposes + signs, but does NOT type until you explicitly arm `ACT=1`.
2. **Kill-switch** — a file (`~/.sov3/orchestrator.STOP`) or MEOK OS button halts all action instantly.
3. **Whitelist, not blacklist** — auto-act only on known-safe "continue" states; everything else escalates.
4. **Per-window rate-limit** — max auto-continues/hour; novel state resets to escalate.
5. **SIGIL on every action** — full replayable trail of what it sent and why; council-ratifiable.
6. **Never auto-confirm destructive prompts** — publish/deploy/delete/pay always escalate to you.

## Build sequence (de-risked)
1. **Observer (dry-run)** — watch ONE whitelisted window, detect idle, log + SIGIL-sign the *proposed* "continue", escalate the rest. **No typing.** ← *prototype shipped: `sovereign_orchestrator.py`*
2. **MEOK OS escalation panel** — the cockpit shows pending escalations + a one-click approve/deny + the kill-switch.
3. **Arm one window** — `ACT=1` on a single low-risk window, per-action confirm, watch the SIGIL trail.
4. **Queen learns your go-patterns** → widens the routine whitelist (council-ratified widenings only).
5. **Scale to all 6 windows** — once proven safe on one.

## Honest verdict
Yes — SOV3 can watch you, run the routine across your windows, learn, and carry on. The parts exist. The discipline that makes it *yours and safe* (not a runaway) is the governed loop: **Queen learns when you'd say go · Council governs what's safe to auto-do · Aware knows you're there · computer-use is the hands · SIGIL signs it all.** This is the capstone of everything built this session.
