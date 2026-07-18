"""
sov33-layers/phase2/pdca_act.py
Phase 2.4 · ACT — propose to human for ratification

Per SOV33_MASTER_ARCHITECTURE_MAP:
  ACT — if quorum passes AND care-floor held AND SIGIL-signed → propose to human.
        Human ratifies. Every cycle is SIGIL-logged → fully auditable.

This module emits the ratification request to a human queue.
It does NOT auto-execute. The human (Sir) must explicitly ratify.
"""

import sys
import os
from pathlib import Path
from datetime import datetime, timezone

ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))

from common.sovereign_core import mint_op, audit_brief, CARE_FLOOR

LAYER = "PDCA"

RATIFICATION_QUEUE = Path.home() / ".sovereign" / "ratification_queue.jsonl"


def propose_to_human(check_digest: str, change: str, expected_gain: float) -> dict:
    """Emit a ratification proposal. Human-only action."""
    ts = datetime.now(timezone.utc).isoformat()
    body = {
        "check_digest": check_digest,
        "change": change,
        "expected_gain": expected_gain,
        "stage": "ACT",
        "ts": ts,
        "ratified_by_human": False,
    }
    rec = mint_op(
        LAYER, "ACT",
        f"act-{change[:40]}", body,
        care_value=CARE_FLOOR,
    )
    # write to human queue (stage-not-fire)
    RATIFICATION_QUEUE.parent.mkdir(parents=True, exist_ok=True)
    with open(RATIFICATION_QUEUE, "a") as f:
        f.write(__import__("json").dumps({**body, "digest": rec["digest"]}) + "\n")

    return {**body, "digest": rec["digest"], "audit_url": rec["audit_url"]}


def list_pending() -> list:
    """List pending ratification proposals."""
    if not RATIFICATION_QUEUE.exists():
        return []
    return [__import__("json").loads(l) for l in RATIFICATION_QUEUE.read_text().splitlines() if l.strip()]


if __name__ == "__main__":
    print("Phase 2.4 · ACT (propose to human)")
    print("=" * 60)
    p = propose_to_human(
        "check-raise_judge-strictness-abcd",
        "raise_judge_strictness",
        expected_gain=0.08,
    )
    for k, v in p.items():
        print(f"  {k:18s} {v}")
    print(f"\nPending queue: {len(list_pending())} entries")
    print(f"  {RATIFICATION_QUEUE}")
    print(f"\nAudit: {audit_brief(LAYER)}")
