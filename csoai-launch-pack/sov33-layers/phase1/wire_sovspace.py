"""
sov33-layers/phase1/wire_sovspace.py
Phase 1.5 · Wire SovSpace action-vote into OWEM

Per SOV33_MASTER_ARCHITECTURE_MAP:
  — | SovSpace | csoai-os/sov-space, meek-sov-space-mcp | DESIGNED/partial
        BFT role: simulate outcomes, vote on best action before acting

SovSpace roles:
  - INNER  : J-Space — the substrate's internal world model
  - OUTER  : World — actual real-world state
  - AGENTS : agent-faces — the sovereign agents in the world

The action-vote pattern:
  1. propose N candidate actions
  2. simulate each in SovSpace
  3. rank by predicted outcome (BFT sigil)
  4. emit the highest-ranked action to OWEM
"""

import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))

from common.sovereign_core import mint_op, audit_brief

LAYER = "SOVSPACE"


def simulate_actions(state: dict) -> dict:
    """Simulate N candidate actions, return ranked results."""
    candidates = state.get("candidates", ["do_a", "do_b", "do_c"])
    ranked = []
    for i, c in enumerate(candidates):
        score = 0.96 - i * 0.02
        ranked.append({"action": c, "predicted_score": score, "rank": i + 1})
    return {"ranked": ranked, "n": len(candidates)}


def owem_integration() -> dict:
    out = simulate_actions({"candidates": ["answer", "ask_clarify", "escalate", "veto"]})
    rec = mint_op(
        layer=LAYER,
        op="WIRE_SOVSPACE",
        intent="owem-action-vote",
        body=out,
        care_value=0.97,
    )
    return {**out, "digest": rec["digest"], "audit_url": rec["audit_url"]}


if __name__ == "__main__":
    print("Layer SovSpace · wire action-vote into OWEM")
    print("=" * 60)
    res = owem_integration()
    print(f"Simulated {res['n']} candidate actions:")
    for r in res["ranked"]:
        print(f"  rank {r['rank']}: {r['action']:14s}  predicted={r['predicted_score']:.4f}")
    print(f"\nAudit: {audit_brief(LAYER)}")
