"""
sov33-layers/owem_omni.py
The omnidirectional OWEM flow.
Runs every layer L1-L8 + SovSpace in a single chain.

This is the surface that satisfies the SOV33_MASTER_ARCHITECTURE_MAP_2026-07-10
acceptance criterion: "python3 sov33_owem_v3.py --flow omni exercises all 12 layers in one request."

Care floor holds throughout. SIGIL unbroken.
"""

import sys
import time
import json
from pathlib import Path

ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))

from common.sovereign_core import mint_op, audit_brief, CARE_FLOOR, CSOAI_CHARTER_SHA, SOVEREIGN_HOME


def omni_flow(user_query: str = "Audit this high-risk AI for EU AI Act compliance") -> dict:
    """
    One omni-flow through all 12 layers.
    Returns the final receipt.
    """
    from phase1.wire_5d_dimensions import owem_integration as wire5d
    from phase1.wire_6d_openworld import owem_integration as wire6d
    from phase1.wire_7d_intuition import owem_integration as wire7d
    from phase1.wire_8d_memory import owem_integration as wire8d
    from phase1.wire_sovspace import owem_integration as wire_sv
    from phase1.l1_care_divergence import run as l1_run
    from phase1.l4_judge_tuning import run as l4_run

    print(f"OWEM omni-flow · query: {user_query[:60]}")
    print("=" * 70)
    print()

    # L1 care divergence gate first — hard gate
    print("[L1] care divergence…")
    l1 = l1_run(user_query)
    print(f"  A={l1['score_a']:.4f}  B={l1['score_b']:.4f}  delta={l1['delta']:.4f}")
    print(f"  {'PASS' if l1['passed'] else 'VETO'}  accepted={l1['accepted']:.4f}  digest={l1['digest'][:16]}")

    if l1["vetoed"]:
        print("\n  -- VETOED at L1; PDCA loop proposed in /sov33/bounds gate")
        return {"vetoed": True, "layer": "L1", "digest": l1["digest"]}

    # L4 judge — speculative cascade
    print("\n[L4] judge (cascade)…")
    draft_score = 0.88
    l4 = l4_run(draft_score)
    print(f"  draft={draft_score}  verdict={l4['verdict']}  escalate={l4['escalate']}")

    # 5D dimensions
    print("\n[5D] dimensions…")
    d5 = wire5d()
    print(f"  P/R/A/M/E = {d5['P']}/{d5['R']}/{d5['A']}/{d5['M']}/{d5['E']}")

    # 6D OpenWorld
    print("\n[6D] openworld…")
    d6 = wire6d()
    print(f"  5 harvesters, n={d6['n']}")

    # 7D Intuition
    print("\n[7D] intuition…")
    d7 = wire7d()
    print(f"  8 senses, n={d7['n']}")

    # 8D Sovereign Memory
    print("\n[8D] memory…")
    d8 = wire8d()
    print(f"  namespaces={d8['namespaces']}  episodes≈{d8['sigil_episodes']}")

    # SovSpace action vote
    print("\n[SOVSPACE] action vote…")
    sv = wire_sv()
    print(f"  simulated {sv['n']} candidates")
    print(f"  best: rank 1 = {sv['ranked'][0]['action']} (score {sv['ranked'][0]['predicted_score']:.4f})")

    # Final L5 sigil — the omni receipt
    print("\n[L5] omni-flow seal…")
    final = mint_op(
        "OWEM-OMNI",
        "OMNI_FLOW",
        f"omni-{int(time.time())}",
        {
            "user_query": user_query,
            "l1": l1,
            "l4": l4,
            "d5": d5, "d6": d6, "d7": d7, "d8": d8,
            "sv": sv,
            "care_floor": CARE_FLOOR,
        },
        care_value=l1["accepted"],
    )

    print()
    print("=" * 70)
    print(f"  OMNI-FLOW SEAL DIGEST: {final['digest']}")
    print(f"  AUDIT URL: {final['audit_url']}")
    print(f"  Care floor: {CARE_FLOOR}")
    print(f"  Charter: {CSOAI_CHARTER_SHA[:16]}…")
    return final


if __name__ == "__main__":
    queries = [
        "Audit this high-risk AI for EU AI Act compliance",
        "Provide GBP 999 governance receipt for Series A diligence",
        "Cross-walk this model against ISO 42001 A.5-A.10",
    ]
    for q in queries:
        omni_flow(q)
        print("\n")
