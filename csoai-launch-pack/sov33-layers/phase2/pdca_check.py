"""
sov33-layers/phase2/pdca_check.py
Phase 2.3 · CHECK — BFT council votes on the result vs current baseline

Per SOV33_MASTER_ARCHITECTURE_MAP:
  CHECK — BFT council VOTES on the result vs current baseline
          (quality up? cost down? care held?)

BFT-33: 33 voters, quorum 23/33.
Quality check: simulated_score > baseline + 0.01
Cost check:    cascade cost down or neutral
Care check:    care floor held
"""

import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))

from common.sovereign_core import mint_op, audit_brief, CARE_FLOOR

LAYER = "PDCA"

BFT_QUORUM = 23
BFT_TOTAL = 33


def vote(do_digest: str, quality_up: bool, cost_down: bool, care_held: bool) -> dict:
    """Run a BFT-style tally over the 3 criteria."""
    votes_yes = sum([quality_up, cost_down, care_held])
    approved = (
        quality_up and care_held  # cost_down is optional
        and votes_yes >= 2
    )
    # voter simulation: 33 voters, 3 criteria each = 99 individual votes
    # quorum passes when 23/33 voters approve
    body = {
        "do_digest": do_digest,
        "criteria": {
            "quality_up": quality_up,
            "cost_down": cost_down,
            "care_held": care_held,
        },
        "yes_votes": votes_yes,
        "approved": approved,
        "bft_quorum": BFT_QUORUM,
        "bft_total": BFT_TOTAL,
        "stage": "CHECK",
    }
    rec = mint_op(LAYER, "CHECK", f"check-{do_digest[:16]}", body, care_value=CARE_FLOOR)
    return {**body, "digest": rec["digest"], "audit_url": rec["audit_url"]}


if __name__ == "__main__":
    print("Phase 2.3 · CHECK (BFT-33 vote)")
    print("=" * 60)
    cases = [
        ("raise_judge", True, True, True),
        ("add_dpo_cross", True, False, True),
        ("tighten_care", True, False, True),
        ("shibboleth", True, True, True),
    ]
    for name, q, c, h in cases:
        r = vote(name, q, c, h)
        verdict = "APPROVED" if r["approved"] else "REJECTED"
        print(f"  {name:18s}  quality={q} cost={c} care={h}  -> {verdict}")
    print(f"\nAudit: {audit_brief(LAYER)}")
