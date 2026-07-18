"""
sov33-layers/phase2/pdca_plan.py
Phase 2.1 · PLAN — DRUM tick proposes a candidate change

Per SOV33_MASTER_ARCHITECTURE_MAP "PDCA + DRUM Self-Evolution Loop":
  PLAN — DRUM tick proposes a candidate change.
         Examples: "raise judge strictness", "add a crosswalk".
"""

import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))

from common.sovereign_core import mint_op, audit_brief

LAYER = "PDCA"


def propose(candidate: str, rationale: str, expected_gain: float) -> dict:
    body = {
        "candidate": candidate,
        "rationale": rationale,
        "expected_gain": expected_gain,
        "stage": "PLAN",
    }
    rec = mint_op(LAYER, "PLAN", f"plan-{candidate[:40]}", body, care_value=0.95)
    return {**body, "digest": rec["digest"], "audit_url": rec["audit_url"]}


if __name__ == "__main__":
    print("Phase 2.1 · PLAN")
    print("=" * 60)
    candidates = [
        ("raise_judge_strictness", "1 hard task was too lenient (L4 gap)", 0.08),
        ("add_dpo_crosswalk", "GDPR Art 22 automated decision lacks crosswalk", 0.05),
        ("tighten_care_floor", "0.95 too lenient for sovereign-class actions", 0.10),
        ("add_shibboleth_5of7", "Custodian threshold needs N-version cross-check", 0.07),
    ]
    for c, r, g in candidates:
        out = propose(c, r, g)
        print(f"  {c:32s}  gain={g:.2f}  digest={out['digest'][:16]}...")
    print(f"\nAudit: {audit_brief(LAYER)}")
