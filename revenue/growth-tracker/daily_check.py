#!/usr/bin/env python3
"""
Daily growth-progress check — eats our own dog food (BFT Progress Council MCP).

Records today's growth metrics and runs the 5-voter council against the last
N days of work. If 3-of-5 voters say STALL or DRIFT, halt current strategy
and force a replan.

Run via cron: 0 9 * * * cd ~/clawd && python3 revenue/growth-tracker/daily_check.py
"""
import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

# Path to the BFT Progress Council voters
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "mcp-marketplace" / "bft-progress-council-mcp"))

# Mock mcp module so server.py imports cleanly
class _MockTool:
    def __init__(self, name): pass
    def tool(self, *a, **k):
        def deco(f): return f
        return deco
    def run(self): pass

if "mcp" not in sys.modules:
    import types
    mcp_pkg = types.ModuleType("mcp")
    mcp_pkg.server = types.ModuleType("mcp.server")
    mcp_pkg.server.fastmcp = types.ModuleType("mcp.server.fastmcp")
    mcp_pkg.server.fastmcp.FastMCP = _MockTool
    sys.modules["mcp"] = mcp_pkg
    sys.modules["mcp.server"] = mcp_pkg.server
    sys.modules["mcp.server.fastmcp"] = mcp_pkg.server.fastmcp

from server import COUNCIL  # type: ignore


METRICS_FILE = Path(__file__).parent / "growth_metrics.json"


def load_metrics() -> dict:
    if METRICS_FILE.exists():
        return json.loads(METRICS_FILE.read_text())
    return {"goal": "Hit £3,333/day MRR by 2026-08-20", "days": []}


def save_metrics(m: dict) -> None:
    METRICS_FILE.write_text(json.dumps(m, indent=2))


def record_today(stats: dict) -> None:
    m = load_metrics()
    m["days"].append({
        "ts": time.time(),
        "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        **stats,
    })
    save_metrics(m)


def vote_on_last_n_days(n: int = 10) -> dict:
    m = load_metrics()
    days = m["days"][-n:]
    if not days:
        return {"verdict": "PROGRESS", "reason": "no history yet"}

    # Translate growth metrics → voter-compatible action records.
    # Each day = 1 "action"; outcome = a string summarising visible progress.
    actions = []
    for d in days:
        # Action: what we did today (count outbound + commits + new MCPs as "actions")
        new_mcps = d.get("new_mcps", 0)
        commits = d.get("commits", 0)
        outbound = d.get("outbound_emails_sent", 0)
        actions.append({
            "ts": d.get("ts", 0),
            "action": f"shipped: {new_mcps}new_mcps, {commits}commits, {outbound}outbound",
            "outcome": f"mrr=£{d.get('mrr_gbp', 0)} signups={d.get('signups', 0)} stars={d.get('github_stars_delta', 0)}",
        })

    goal = m.get("goal", "Hit £3,333/day MRR by 2026-08-20")
    votes = []
    tally = {"PROGRESS": 0, "STALL": 0, "DRIFT": 0, "BLOCKED": 0}
    for name, fn in COUNCIL:
        verdict, reason = fn(actions, goal)
        votes.append({"voter": name, "verdict": verdict, "reason": reason})
        tally[verdict] += 1

    halt_verdicts = ["STALL", "DRIFT", "BLOCKED"]
    halt_votes = sum(tally[v] for v in halt_verdicts)
    if halt_votes >= 3:
        verdict = max(halt_verdicts, key=lambda v: tally[v])
        action_recommended = {
            "STALL": "PIVOT — current channels not delivering. Try partnership or paid outreach.",
            "DRIFT": "RE-ANCHOR — building wrong things. Return to the £3,333/day plan.",
            "BLOCKED": "ESCALATE — environmental blockers (DNS, Stripe, key rotation). Fix Nick handoff list.",
        }[verdict]
    else:
        verdict = "PROGRESS"
        action_recommended = "CONTINUE — keep shipping current channel mix."

    return {
        "verdict": verdict,
        "action_recommended": action_recommended,
        "tally": tally,
        "votes": votes,
        "days_inspected": len(actions),
        "goal": goal,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


if __name__ == "__main__":
    # Demo: record today + show vote
    today_stats = {
        "new_mcps_published": 5,  # bft + token-budget + acp + iso-42005 + gods-eye
        "commits": 30,
        "outbound_emails_sent": 0,  # waiting on Nick mailbox setup
        "mrr_gbp": 0,
        "signups": 0,
        "github_stars_delta": 0,
    }
    record_today(today_stats)
    result = vote_on_last_n_days(n=10)
    print(json.dumps(result, indent=2))
