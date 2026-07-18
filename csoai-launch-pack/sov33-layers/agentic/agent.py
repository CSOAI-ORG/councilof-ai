"""
sov33-layers/agentic/agent.py
=================================
Phase 3.6 · The Agent — planner + router + executor + bft_council

The end-to-end agentic layer. Given a goal, it:
  1. plans the steps
  2. routes each through care gate
  3. executes (with sigil per step)
  4. returns a BFT-anchored result

This is the layer that USES all 12 sovereign layers + all 12 mind-sets.
It does NOT do offensive work. It does NOT touch money/dns/secrets.
Care floor 0.95 enforced. Stage-not-fire.
"""

import sys
from pathlib import Path
from typing import List

ROOT = Path(__file__).parent.parent.parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "sov33-layers"))

from common.sovereign_core import mint_op, audit_brief, CSOAI_CHARTER_SHA

LAYER = "AGENTIC"


class SovereignAgent:
    """A tiny sovereign agent: plan -> route -> execute -> bft."""

    def __init__(self, name: str = "sovereign-agent"):
        self.name = name

    def run(self, goal: str) -> dict:
        from agentic.planner import plan
        from agentic.executor import execute_plan
        from agentic.bft_council import vote

        # Plan
        p = plan(goal)
        steps = p["plan"]

        # Execute (each step care-checked)
        e = execute_plan(steps)
        trace = e["trace"]
        all_ok = all(t["status"] == "OK" for t in trace)

        # BFT vote (post-execution ratification)
        verdict_text = "agentic-loop-completed" if all_ok else "agentic-loop-partial"
        v = vote(f"{self.name}-{verdict_text}", "for" if all_ok else "amend")

        # Final omni receipt
        body = {
            "agent": self.name,
            "goal": goal,
            "n_steps": len(steps),
            "n_ok": sum(1 for t in trace if t["status"] == "OK"),
            "trace": trace,
            "bft_tally": v["tally"],
            "bft_quorum_ok": v["quorum_ok"],
        }
        rec = mint_op(
            LAYER, "AGENT_RUN", f"agent-{goal[:40]}",
            body,
            care_value=0.96 if all_ok else 0.85,
            force_log=True,
        )
        return {**body, "digest": rec["digest"], "audit_url": rec["audit_url"]}


if __name__ == "__main__":
    print("Phase 3.6 · THE AGENT — full agentic loop")
    print("=" * 70)
    a = SovereignAgent("audit-agent-1")
    goals = [
        "Audit this AI for EU AI Act compliance",
        "Run canonical crosswalk and capture 7D intuition snapshot",
    ]
    for g in goals:
        print(f"\n>>> Goal: {g}")
        r = a.run(g)
        print(f"    steps: {r['n_steps']}  ok: {r['n_ok']}/{r['n_steps']}")
        print(f"    BFT tally: {r['bft_tally']}  quorum_ok: {r['bft_quorum_ok']}")
        print(f"    digest: {r['digest'][:24]}")
    print()
    print(f"\nFinal Layer audit: {audit_brief(LAYER)}")
    print(f"\nCharter SHA: {CSOAI_CHARTER_SHA[:16]}...")
