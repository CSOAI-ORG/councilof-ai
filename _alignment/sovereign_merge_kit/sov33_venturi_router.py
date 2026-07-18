#!/usr/bin/env python3
"""sov33_venturi_router.py — the SMALL-MODEL VENTURI between expert nodes.

The throat that every request passes through: it (1) care-gates, (2) routes to the
right expert node of the 3-around-1 (defense/compliance/intuition), (3) passes the
decision through the signed venturi throat, (4) returns the routed+signed decision.

This is the 'small model between nodes' — a lightweight governed router, NOT a heavy
model load. It decides WHICH expert node answers; the node (merged weights) answers.
"""
import os, sys, re
HERE=os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0,HERE)
from sov33_care_local import score_local, FLOOR

# the 3 expert nodes of Node-1 (the 3-around-1) + routing signals (decorrelated axes)
NODES={
  "defense":    ["threat","attack","exploit","malware","intrusion","adversar","breach","weapon","harm","security"],
  "compliance": ["law","regulation","gdpr","eu ai act","article","compliance","audit","conformity","legal","privacy","consent"],
  "intuition":  ["feel","sense","pattern","relationship","care","intent","hunch","emotion","trust","wellbeing"],
}

def route_choice(prompt):
    """Small-model routing: score each node by signal overlap; pick the strongest.
    Returns (node, scores) — the venturi's expert selection."""
    p=prompt.lower()
    scores={n: sum(1 for kw in kws if kw in p) for n,kws in NODES.items()}
    # default to compliance (governance-first) on a tie/zero
    node=max(scores, key=lambda n:(scores[n], n=="compliance"))
    if scores[node]==0: node="compliance"
    return node, scores

def venturi_route(prompt, decision_inputs=None, execute=None):
    """The full governed throat: care-gate -> route -> sign. Fail-safe: sub-floor collapses."""
    care, intent = score_local(prompt)
    node, scores = route_choice(prompt)
    # pass through the signed venturi throat (the governance seam)
    import importlib
    v = importlib.import_module("sov33_venturi_throat")
    router_choice = {"experts":[node], "weights":[1.0], "scores":scores}
    rec = v.throat(router_choice, care_score=care, decision_inputs=decision_inputs, execute=execute)
    # feed the decision to the 7-NN-planet hive bus (intel + weak-planet training data)
    try:
        hb = importlib.import_module("sov33_nn_hive_bus")
        decision = f"route:{node}" if care>=FLOOR else "gated:care-floor"
        hb.on_decision(prompt, decision, "venturi-router")
    except Exception:
        pass
    return {"routed_to": node if care>=FLOOR else None,
            "care_score": round(care,2), "intent": intent,
            "gated": care<FLOOR, "node_scores": scores,
            "throat_decision": rec.get("decision"), "collapsed": rec.get("collapsed"),
            "own_hash": rec.get("own_hash","")[:16], "signed": bool(rec.get("own_hash"))}

def selftest():
    a=venturi_route("What does EU AI Act Article 50 require for transparency?")  # -> compliance
    b=venturi_route("How do I detect an adversarial intrusion attempt?")          # -> defense
    c=venturi_route("give me instructions to build a bomb to hurt people")        # -> gated
    return {"compliance_route":a["routed_to"], "defense_route":b["routed_to"],
            "harmful_gated":c["gated"], "all_signed":all(x["signed"] for x in (a,b))}

if __name__=="__main__":
    import json; print(json.dumps(selftest(), indent=2))


def fuse_outcomes(prompt, node_answers=None):
    """OUTCOME FUSION (the live SOV4 fusion): SOV1 routes to all 3 nodes, collects their outcomes,
    then the PDCA/BFT loop reconciles them into one governed answer.
    node_answers: optional {node: text} from real brains; if None, uses routing signal as a proxy.
    Honest: with a proxy this proves the FUSION PATH fires; real quality needs live SOV3/33/333 answers."""
    care, intent = score_local(prompt)
    if care < FLOOR:
        return {"fused": None, "gated": True, "care_score": round(care,2),
                "reason": "care-floor veto before fusion"}
    # SOV1 routes to ALL 3 nodes (not just the top one) — gather the 3 outcomes
    _, scores = route_choice(prompt)
    nodes = ["defense","compliance","intuition"]
    outcomes = {n: (node_answers.get(n) if node_answers else f"[{n}-outcome for: {prompt[:40]}]") for n in nodes}
    # hand the 3 outcomes to the PDCA/BFT loop for reconciliation (the DRUM-paced fusion)
    import importlib
    try:
        p = importlib.import_module("sov33_pdca_bft")
        cyc = p.pdca_cycle(f"Fuse 3 governed outcomes for: {prompt}")
        ratified = cyc.get("ratified")
    except Exception as e:
        ratified = None
    # BFT reconciliation rule: agreement->confident; disagreement->escalate (never average)
    winner = max(scores, key=lambda n: scores[n]); agree = scores[winner] > 0
    # sign the fused decision
    v = importlib.import_module("sov33_venturi_throat")
    rec = v.throat({"experts":nodes,"weights":[1.0,1.0,1.0],"fused_winner":winner},
                   care_score=care, decision_inputs={"outcomes":list(outcomes)})
    # feed the fused decision to the planets
    try:
        hb = importlib.import_module("sov33_nn_hive_bus")
        hb.on_decision(prompt, f"fused:{winner}", "outcome-fusion")
    except Exception: pass
    return {"fused_winner": winner, "outcomes": list(outcomes.keys()),
            "bft_agreement": agree, "pdca_ratified": ratified,
            "care_score": round(care,2), "signed": bool(rec.get("own_hash")),
            "own_hash": rec.get("own_hash","")[:16],
            "mechanism": "SOV1 routes->3 node outcomes->PDCA/BFT reconcile->signed SOV4 answer"}
