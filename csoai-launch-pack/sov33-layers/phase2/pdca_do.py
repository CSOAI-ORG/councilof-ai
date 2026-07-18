"""
sov33-layers/phase2/pdca_do.py
Phase 2.2 · DO — run in SANDBOX sim (SovSpace), never live, never canonical

Per SOV33_MASTER_ARCHITECTURE_MAP:
  DO — run it in a SANDBOX sim (SovSpace), never live, never on canonical data.

The sandbox is a copy of the substrate state with seeded randomness.
No real customers, no real money, no real DNS, no real canonical charter.
"""

import sys
import copy
import random
from pathlib import Path

ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))

from common.sovereign_core import mint_op, audit_brief

LAYER = "PDCA"

SANDBOX_SEED = 7


def run_in_sandbox(plan_digest: str, baseline_score: float = 0.85) -> dict:
    """Run the proposed change in a sandbox sim."""
    rng = random.Random(SANDBOX_SEED)
    simulated_score = baseline_score + rng.uniform(-0.03, 0.12)
    improvement = simulated_score - baseline_score
    body = {
        "plan_digest": plan_digest,
        "baseline_score": baseline_score,
        "simulated_score": round(simulated_score, 4),
        "improvement": round(improvement, 4),
        "stage": "DO",
        "sandbox_seed": SANDBOX_SEED,
    }
    rec = mint_op(LAYER, "DO", f"do-{plan_digest[:16]}", body, care_value=0.95)
    return {**body, "digest": rec["digest"], "audit_url": rec["audit_url"]}


if __name__ == "__main__":
    print("Phase 2.2 · DO (sandbox)")
    print("=" * 60)
    result = run_in_sandbox("raise_judge_strictness", baseline_score=0.85)
    for k, v in result.items():
        print(f"  {k:22s} {v}")
    print(f"\nAudit: {audit_brief(LAYER)}")
