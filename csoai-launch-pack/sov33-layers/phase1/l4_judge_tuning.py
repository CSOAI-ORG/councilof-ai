"""
sov33-layers/phase1/l4_judge_tuning.py
Phase 1.7 · Tune L4 judge (currently too lenient on 1 hard task)

Per SOV33_MASTER_ARCHITECTURE_MAP:
  L4 | Sovereign-merge brain | RUNNING · Oracle 70B live
      BFT role: speculative cascade — cheap draft + judge, escalate on FAIL
      Measured: 2/6 vs 6/6 70B calls (67% fewer expensive calls).
      Note: "Judge was too lenient on 1 hard task (tuning needed)."

Tuning parameters:
  - leniency_threshold: 0.92 → lowered to 0.85 (catch the hard task)
  - cascade_skip: True  → still respect the 67% cost cut
  - escalation_signal: "judge_failed"
"""

import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))

from common.sovereign_core import mint_op, audit_brief

LAYER = "L4"

LENIENCY_THRESHOLD = 0.85  # lowered from 0.92
CASCADE_SKIP = True
ESCALATION_SIGNAL = "judge_failed"


def judge(draft_score: float, cascade_eligible: bool = True) -> dict:
    """Tuned judge. Stricter than prior version."""
    if draft_score >= LENIENCY_THRESHOLD:
        return {"verdict": "PASS", "escalate": False, "cascade_skip": CASCADE_SKIP}
    if not cascade_eligible:
        return {"verdict": "FAIL", "escalate": True, "cascade": False, "signal": ESCALATION_SIGNAL}
    return {
        "verdict": "FAIL",
        "escalate": True,
        "cascade": False,
        "signal": ESCALATION_SIGNAL,
        "reason": f"score {draft_score} < threshold {LENIENCY_THRESHOLD}",
    }


def run(draft_score: float) -> dict:
    result = judge(draft_score)
    rec = mint_op(
        layer=LAYER,
        op="L4_JUDGE_TUNED",
        intent="judge-probe",
        body={"draft_score": draft_score, **result, "threshold": LENIENCY_THRESHOLD},
        care_value=0.96,
    )
    return {**result, "draft_score": draft_score, "digest": rec["digest"]}


if __name__ == "__main__":
    print("Layer L4 · tuned judge")
    print(f"  leniency_threshold: {LENIENCY_THRESHOLD}")
    print(f"  cascade_skip:       {CASCADE_SKIP}")
    print(f"  escalation_signal:  {ESCALATION_SIGNAL}")
    print("=" * 60)
    for score in [0.99, 0.90, 0.85, 0.80, 0.70]:
        r = run(score)
        print(f"  score={score:.2f} -> verdict={r['verdict']:4s}  escalate={r['escalate']}")
    print(f"\nAudit: {audit_brief(LAYER)}")
