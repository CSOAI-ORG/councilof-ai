"""
sov33-layers/agentic/planner.py
=================================
Phase 3.3 · Planner — break a goal into a plan of tool calls

Per SOV33_BLEEDING_EDGE:
  LangGraph for stateful flows, LATS for tree search.

Honest: this is a tiny, deterministic planner — not LangGraph. Sufficient to
demonstrate the agentic pattern.
"""

import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent.parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "sov33-layers"))

from common.sovereign_core import mint_op, audit_brief

LAYER = "AGENTIC"


def plan(goal: str) -> dict:
    """Decompose the goal into a chain of tool calls.
    Each step is typed (care / sigil / route / etc.)."""
    g = goal.lower()
    plan = []

    # Always: care check first (per OOWM and Master Map)
    plan.append({"step": 1, "tool": "sovereign.care.check", "params": {"input_text": goal}})

    # Goal-specific steps
    if "audit" in g or "compliance" in g:
        plan.append({"step": 2, "tool": "sovereign.assess", "params": {"system": goal, "mindset": "meta"}})
        plan.append({"step": 3, "tool": "sovereign.passport.issue", "params": {"system_id": "spc-001"}})
    if "bft" in g or "council" in g or "vote" in g:
        plan.append({"step": 4, "tool": "sovereign.bft.vote", "params": {"proposal_id": "prop-1", "choice": "for"}})
    if "intuition" in g or "snapshot" in g:
        plan.append({"step": 5, "tool": "sovereign.7d.intuition", "params": {"trigger": "plan"}})
    if "consolidate" in g or "crosswalk" in g or "inventory" in g:
        plan.append({"step": 6, "tool": "sovereign.digest.consolidate", "params": {}})

    # Always: final sigil (the action-plan is itself a sovereign action)
    plan.append({"step": len(plan) + 1, "tool": "sovereign.sigil.mint", "params": {"op": "PLAN_FINALIZE", "intent": goal[:40]}})

    rec = mint_op(
        LAYER, "PLAN", f"plan-{goal[:40]}",
        {"goal": goal, "steps": plan},
        care_value=0.95,
    )
    return {"goal": goal, "n_steps": len(plan), "plan": plan, "digest": rec["digest"]}


if __name__ == "__main__":
    print("Phase 3.3 · Planner")
    print("=" * 60)
    goals = [
        "Audit this AI for EU AI Act compliance",
        "Run canonical crosswalk",
        "Cast BFT council vote on DEFONEOS seal",
        "Capture 7D intuition snapshot and consolidate",
    ]
    for g in goals:
        p = plan(g)
        print(f"\n  {g}")
        print(f"    {p['n_steps']} steps")
        for s in p["plan"]:
            print(f"      {s['step']}. {s['tool']:30s} {s['params']}")
    print(f"\nAudit: {audit_brief(LAYER)}")
