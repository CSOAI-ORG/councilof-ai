"""
sov33-layers/phase2/pdca_audit.py
Phase 2.6 · Audit log — every cycle SIGIL-stored

Per SOV33_MASTER_ARCHITECTURE_MAP:
  "Every cycle is SIGIL-logged → fully auditable."
"""

import sys
import json
from pathlib import Path

ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))

from common.sovereign_core import mint_op, audit_brief, chain_length, CSOAI_CHARTER_SHA

LAYER = "PDCA-AUDIT"


def audit(plan_digest: str, do_digest: str, check_digest: str, act_digest: str) -> dict:
    """Bind the 4 PDCA phases into one auditable cycle."""
    body = {
        "cycle": "PDCA-1",
        "plan_digest": plan_digest,
        "do_digest": do_digest,
        "check_digest": check_digest,
        "act_digest": act_digest,
        "charter": CSOAI_CHARTER_SHA[:16] + "...",
    }
    rec = mint_op(
        LAYER, "PDCA_CYCLE",
        f"cycle-{plan_digest[:8]}",
        body,
        care_value=0.96,
    )
    return {**body, "digest": rec["digest"], "audit_url": rec["audit_url"]}


def list_cycles() -> list:
    """List every completed PDCA cycle."""
    log = Path.home() / ".sovereign" / "layerPDCA-AUDIT_chain.jsonl"
    if not log.exists():
        return []
    out = []
    for line in log.read_text().splitlines():
        if not line.strip():
            continue
        out.append(json.loads(line))
    return out


if __name__ == "__main__":
    print("Phase 2.6 · AUDIT log")
    print("=" * 60)
    a = audit(
        "plan_raise_judge_…",
        "do_sandbox_sim_…",
        "check_BFT_quorum_…",
        "act_propose_to_human_…",
    )
    for k, v in a.items():
        print(f"  {k:18s} {v}")
    cycles = list_cycles()
    print(f"\nTotal cycles: {len(cycles)}")
    print(f"\nAudit: {audit_brief(LAYER)}")
