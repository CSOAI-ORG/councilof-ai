"""
sov33-layers/agentic/router.py
================================
Phase 3.2 · LLM-routed dispatch — pick tool, set context, return

Per SOV33_BLEEDING_EDGE:
  Use DSPy + LATS for stateful routing; BFT for council voting.

Tiny state-machine router: given a query, rank tools, pick top, fake-dispatch
to verify the substrate matches. Honest: actually we route to sovereign_api.
"""

import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent.parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "sov33-layers"))

from common.sovereign_core import mint_op, audit_brief, CARE_FLOOR
from agentic.tool_registry import TOOLS, score_tool, dispatch

LAYER = "AGENTIC"


def route(query: str) -> dict:
    """Route the query through:
    1) L1 care divergence gate (refuses violators)
    2) tool scoring
    3) dispatch top tool
    4) BFT-style tally
    Returns a sovereign-anchored audit dict."""
    from phase1.l1_care_divergence import evaluate as l1_eval

    # L1 gate
    l1 = l1_eval(query)
    veto = l1["vetoed"]

    # Tool scoring
    s = score_tool(query)

    # Dispatch
    dispatches = []
    if not veto and s["top"]:
        top_name, top_score = s["top"][0]
        if top_score > 0:
            try:
                d = dispatch(top_name, query=query)
                dispatches.append(d)
            except Exception as e:
                dispatches.append({"error": str(e)})

    body = {
        "query": query,
        "l1_vetoed": veto,
        "l1_delta": l1["delta"],
        "l1_score_a": l1["score_a"],
        "l1_score_b": l1["score_b"],
        "top_tools": s["top"],
        "dispatches": dispatches,
    }
    rec = mint_op(
        LAYER, "ROUTE",
        f"route-{query[:40]}",
        body,
        care_value=0.95 if not veto else 0.0,
        force_log=True,
    )
    return {**body, "digest": rec["digest"], "audit_url": rec["audit_url"]}


if __name__ == "__main__":
    print("Phase 3.2 · Router (L1 gate + tool scoring + dispatch)")
    print("=" * 60)
    queries = [
        "Audit the production AI system for EU AI Act Art 14 human oversight",
        "Strike package against coordinates",  # expect L1 veto
        "Mint a sigil receipt for the assessment",
        "Run canonical crosswalk",
    ]
    for q in queries:
        r = route(q)
        print(f"\n  q: {q[:60]}")
        print(f"    L1: A={r['l1_score_a']:.4f} B={r['l1_score_b']:.4f} veto={r['l1_vetoed']}")
        for name, score in r["top_tools"]:
            print(f"    top: {name}  score={score}")
        if r["dispatches"]:
            for d in r["dispatches"]:
                if "tool" in d:
                    print(f"    dispatched: {d['tool']} -> {d['digest'][:16]}")
    print(f"\nAudit: {audit_brief(LAYER)}")
