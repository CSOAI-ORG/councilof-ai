# 🔀 SOV3 :3101 toolset reconciliation — ground truth for Track C (M4, 2026-07-11)

**Headline: there are NOT two divergent :3101 builds. There is ONE build (the run-local /
keeper build) that is already a SUPERSET of both families.** The earlier "divergence" flag was
(a) the server being mid-restart when probed, and (b) a tool-name mismatch. Reconciliation is
therefore a **3-line script fix, not a server merge.**

## What the LIVE :3101 actually exposes (measured 2026-07-11, keeper build)
- **313 tools total**, spanning BOTH families on one server:
  - **51 federation-class**: `mcp_federation_catalog/call/search/stats`, `king_federation_ask`,
    `federated_rag`, `lapis_dashboard`, `sov_charter_query`, `sov_crosswalk_get`, `sov_council_reason`,
    `sigil_emit`, `sov_sigil_emit`, `sov_protocol_discover`, … (SIGIL / council / charter / OSCAL layer)
  - **38 hermes/k25-class**: `hermes_ask/research`, `k25_analyze_image/ui_to_code`, `olm_route_query`,
    `quantum_*`, `kimi_*`, `nemotron_*`, `guardian_*`, `family_*`
- So `hermes_ask` AND `mcp_federation_catalog` AND `sigil_emit` AND `lapis_dashboard` are **all present
  on the same endpoint.** The "hermes/k25 build vs federation build" split does not exist at runtime.

## The only real gap: 4 tool-names the daily-federation-refresh arcana calls that don't exist here
| script calls | on live :3101? | reality |
|---|---|---|
| `mcp_federation_catalog` | ✅ | present |
| `sigil_emit` / `sov_sigil_emit` | ✅ | both present |
| `lapis_dashboard` | ✅ | present |
| `bootstrap_agent` (looped ×33) | ❌ | **no bootstrap tool exists** on this build |
| `federate_command` | ❌ | closest is `federated_rag` (different purpose) |
| `schedule_task` | ❌ | no generic scheduler tool |
| `reflect_on_history` | ❌ | **real name is `trigger_reflection`** |

## Recommended reconciliation (hand-off to merge execution)
**Canonical = the current keeper build. No server merge needed.** The fix is in the *consumer*
(`bin/sov3-daily-federation-refresh.sh` arcana tail), not the server:
1. `reflect_on_history` → **rename to `trigger_reflection`** (exists).
2. `bootstrap_agent` ×33, `federate_command`, `schedule_task` → **either drop** (they target tools this
   build never had — they were VM-era arcana) **or** decide the canonical build should grow them and add
   them to `sovereign-mcp-server.py`. Track C's call.
3. The arcana tail is already fire-and-forget; guard each call so a missing tool never aborts the cron
   (my hardened script uses `set -e` — wrap the arcana in `|| true` or a tool-exists check).

## Net for the record
The routines audit's "two SOV3 tool-sets diverge → reconcile" is **downgraded**: one canonical 313-tool
build already unifies both families; only 4 stale VM-era arcana tool-names in one cron script need
fixing. Cheap, safe, no risk to the running brain. Ready for Track C to green-light the 3 edits above;
I'll execute on their word (per the lane split: Track C analysis → Claude Code merge execution).
