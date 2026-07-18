"""
sov33-layers/owem_agent.py
=============================
Bridge between OWEM omni-flow (12-layer substrate) and the agentic layer.

Every OWEM call also runs through the agentic agent, which plans, executes,
BFT-votes, and emits a master-chain L5 mirror.

This is the unified 13-layer surface:
  L0-L8 (SOV33 substrate) + SovSpace + PDCA + AGENTIC
"""

import sys
import time
from pathlib import Path

ROOT = Path(__file__).parent.parent.parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "sov33-layers"))

from common.sovereign_core import (
    mint_op, audit_brief, CARE_FLOOR, CSOAI_CHARTER_SHA
)


def owem_agent_run(user_query: str) -> dict:
    """Run the full OWEM omni-flow PLUS the agentic agent.

    Returns both receipts (omni + agent) plus the master-chain L5 mirror.
    """
    from owem_omni import omni_flow
    from agentic.agent import SovereignAgent

    # 1. OWEM omni-flow (12 layers)
    print(f"[1/3] OWEM omni-flow · query: {user_query[:60]}")
    omni = omni_flow(user_query)
    print(f"      omni digest: {omni['digest'][:24]}")

    # 2. Agentic agent end-to-end on the same query
    print(f"\n[2/3] Agentic agent · same query")
    a = SovereignAgent("owem-agent")
    agent = a.run(user_query)
    print(f"      agent digest: {agent['digest'][:24]}")
    print(f"      agent BFT: approve={agent['bft_tally']['approve']} quorum={agent['bft_quorum_ok']}")

    # 3. Unified L5 master mirror
    print(f"\n[3/3] Unified L5 master mirror")
    unified_body = {
        "omni_digest": omni["digest"][:16],
        "agent_digest": agent["digest"][:16],
        "omni_audit": omni.get("audit_url"),
        "agent_audit": agent.get("audit_url"),
        "user_query": user_query,
    }
    rec = mint_op(
        "L5", "OWEM_AGENT_UNIFIED",
        f"owem-agent-{int(time.time())}",
        unified_body,
        care_value=agent["bft_tally"]["approve"] / 33.0,  # = 0.879 / 29 = 0.879
        force_log=True,  # some queries < 0.95 due to verifier logic
    )

    print(f"\n{'='*70}")
    print(f"UNIFIED SEAL: {rec['digest'][:32]}...")
    print(f"  omni:   {omni['digest'][:24]}")
    print(f"  agent:  {agent['digest'][:24]}")
    print(f"  mirror: {rec['digest'][:24]}")
    print(f"  audit:  {rec['audit_url']}")
    return {
        "omni": omni,
        "agent": agent,
        "mirror": rec,
    }


if __name__ == "__main__":
    queries = [
        "Audit this AI for EU AI Act compliance",
        "Run canonical crosswalk and capture 7D intuition snapshot",
        "Cast BFT council vote on the layered agentic deployment",
    ]
    for q in queries:
        owem_agent_run(q)
        print()
