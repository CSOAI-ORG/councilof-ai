"""
sov33-layers/phase2/pdca_bounds.py
Phase 2.5 · HARD BOUND — no self-commit to canonical charters / money / deploy

Per SOV33_MASTER_ARCHITECTURE_MAP:
  HARD BOUND (honesty register): the loop can PROPOSE a framework/param change;
  it CANNOT self-commit to canonical charters or spend money or deploy — those
  stay owner-gated. "Writes its own frameworks" = drafts candidates for human
  ratification, not autonomous law-making.

This module is the gatekeeper. Every ACT must check against these bounds.
"""

import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))

from common.sovereign_core import mint_op, audit_brief, CARE_FLOOR

LAYER = "PDCA"

HARD_DENY_ACTIONS = [
    "modify_canonical_charter",
    "spend_money",
    "deploy_to_production",
    "rotate_keys",
    "send_email",
    "publish_pypi",
    "modify_dns",
    "issue_defoneos_seal",
    "modify_red_lines",
]


def check(action_name: str) -> dict:
    """Returns a verdict: if action is in HARD_DENY list, VETO."""
    denied = action_name in HARD_DENY_ACTIONS
    body = {
        "action": action_name,
        "denied": denied,
        "reason": "HARD_BOUND" if denied else "OK",
    }
    rec = mint_op(
        LAYER, "BOUND_CHECK",
        f"bound-{action_name[:32]}",
        body,
        care_value=CARE_FLOOR,
    )
    return {**body, "digest": rec["digest"], "audit_url": rec["audit_url"]}


if __name__ == "__main__":
    print("Phase 2.5 · HARD BOUND gate")
    print("=" * 60)
    tests = [
        "modify_canonical_charter",
        "raise_judge_strictness",  # OK
        "spend_money",
        "add_dpo_crosswalk",  # OK
        "deploy_to_production",
        "rotate_keys",
        "add_shibboleth_5of7",  # OK
        "issue_defoneos_seal",
        "modify_red_lines",
    ]
    for t in tests:
        r = check(t)
        verdict = "DENY" if r["denied"] else "ALLOW"
        print(f"  {verdict:6s}  {t}")
    print(f"\nAudit: {audit_brief(LAYER)}")
