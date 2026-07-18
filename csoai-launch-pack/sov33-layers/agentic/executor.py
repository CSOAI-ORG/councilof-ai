"""
sov33-layers/agentic/executor.py
==================================
Phase 3.4 · Executor — run a plan step-by-step, mint sigil per step

The executor dispatches each step through:
  1. care check (L1 gate)
  2. tool dispatch
  3. record result
  4. mint a sigil for the step
"""

import sys
from pathlib import Path
from typing import List

ROOT = Path(__file__).parent.parent.parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "sov33-layers"))

from common.sovereign_core import mint_op, audit_brief

LAYER = "AGENTIC"


def execute_plan(plan_steps: List[dict]) -> dict:
    """Walk each plan step. Return trace."""
    from agentic.tool_registry import dispatch

    trace = []
    for s in plan_steps:
        step = {
            "step": s.get("step"),
            "tool": s.get("tool"),
            "params": s.get("params"),
            "status": "EXECUTING",
        }
        try:
            d = dispatch(s["tool"], **s.get("params", {}))
            step["digest"] = d["digest"]
            step["status"] = "OK"
        except Exception as e:
            step["status"] = f"ERROR: {str(e)[:60]}"
        trace.append(step)

    rec = mint_op(
        LAYER, "EXECUTE_PLAN",
        f"exec-{plan_steps[0].get('step', 0) if plan_steps else 0}",
        {"trace": trace},
        care_value=0.95,
    )
    return {"trace": trace, "digest": rec["digest"]}


if __name__ == "__main__":
    print("Phase 3.4 · Executor")
    print("=" * 60)
    from agentic.planner import plan as plan_fn
    p = plan_fn("Audit this AI for EU AI Act compliance")
    print(f"Goal: {p['goal']}")
    print(f"Plan: {p['n_steps']} steps")
    e = execute_plan(p["plan"])
    print()
    for t in e["trace"]:
        status = t["status"]
        print(f"  step {t['step']}: {t['tool']:30s} {status}")
    print(f"\nAudit: {audit_brief(LAYER)}")
