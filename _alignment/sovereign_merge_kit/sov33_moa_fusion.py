#!/usr/bin/env python3
"""sov33_moa_fusion.py — Mixture-of-Agents emergence fusion (research-grounded).

The two conditions the literature proves are required for emergence (fused > best single):
  1. DIVERSE PROPOSERS by ARCHITECTURE (MoE / dense-reasoning / SSM), not fine-tunes of one base.
  2. STRONG AGGREGATOR that SYNTHESIZES (not selects) — above the crossover threshold.

This wires both onto SOV1's governed seam: care-gate FIRST, then MoA-synthesize, then sign.
Proposers are ARCHITECTURE-TAGGED so we never mistake 3-same-base for diversity again.
Honest: with no reachable brains this proves the FUSION PATH + governance; real quality needs
live different-arch brains passed as `proposers`.
"""
import os, sys
HERE=os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0,HERE)
from sov33_care_local import score_local, FLOOR

# the 3 REQUIRED-DIVERSE proposer slots — by ARCHITECTURE (the fix for the failed same-base merge)
PROPOSER_ARCHS = {
    "SOV3_MoE":   {"arch":"MoE",            "role":"breadth/knowledge"},
    "SOV33_MoM":  {"arch":"dense-reasoning","role":"depth/multi-step"},
    "SOV333_OWM": {"arch":"SSM/Mamba",      "role":"world-state/long-context"},
}

def _diversity_ok(proposer_tags):
    """Emergence condition 1: proposers must span >=2 KNOWN distinct architectures (not identical).
    Unknown/untagged proposers do NOT count as diversity — that was the same-base illusion that
    failed Node1. Only architectures registered in PROPOSER_ARCHS count."""
    archs = {PROPOSER_ARCHS[t]["arch"] for t in proposer_tags if t in PROPOSER_ARCHS}
    return len(archs) >= 2, sorted(archs)

def moa_fuse(prompt, proposers=None, aggregator=None):
    """MoA emergence fusion. proposers: {tag: answer_text} from diverse-arch brains.
    aggregator: callable(prompt, [answers])->synthesized text (should be a STRONG brain).
    Returns the governed, signed fused decision + honest emergence-precondition check."""
    care, intent = score_local(prompt)
    if care < FLOOR:
        return {"fused": None, "gated": True, "care_score": round(care,2),
                "reason": "care-floor veto before fusion"}
    tags = list(proposers.keys()) if proposers else list(PROPOSER_ARCHS.keys())
    div_ok, archs = _diversity_ok(tags)
    # gather proposer outcomes (proxy if none supplied — proves the PATH)
    answers = proposers if proposers else {t: f"[{PROPOSER_ARCHS[t]['arch']} proposer: {prompt[:40]}]" for t in tags}
    # STRONG AGGREGATOR SYNTHESIZES (not selects) — the crossover-threshold condition
    if aggregator:
        try: synthesized = aggregator(prompt, list(answers.values()))
        except Exception as e: synthesized = f"[aggregator error: {str(e)[:60]}]"
        agg_mode = "strong-synthesize"
    else:
        synthesized = "[aggregator not supplied — path proven, quality pending live strong brain]"
        agg_mode = "proxy"
    # sign the fused decision through the governed throat
    import importlib
    v = importlib.import_module("sov33_venturi_throat")
    rec = v.throat({"experts":tags,"weights":[1.0]*len(tags),"mode":"MoA-synthesize"},
                   care_score=care, decision_inputs={"archs":archs})
    try:
        hb = importlib.import_module("sov33_nn_hive_bus")
        hb.on_decision(prompt, "moa-fused", "moa-fusion")
    except Exception: pass
    return {"fused": synthesized, "gated": False, "care_score": round(care,2),
            "proposer_archs": archs, "diversity_ok": div_ok, "aggregator_mode": agg_mode,
            "emergence_precondition": ("MET: diverse-arch + aggregator" if (div_ok and aggregator)
                                       else "NOT MET: "+("need >=2 archs " if not div_ok else "")+("need strong aggregator" if not aggregator else "")),
            "signed": bool(rec.get("own_hash")), "own_hash": rec.get("own_hash","")[:16],
            "honest": "path+governance proven; emergence claim requires measured merged>best-single on held-out battery"}

def selftest():
    # diverse-arch proxy (path proof)
    a = moa_fuse("What are EU AI Act transparency obligations?")
    # explicitly-identical proposers -> diversity must FAIL (guards against same-base illusion)
    b = moa_fuse("test", proposers={"SOV3_MoE":"x","SOV3_MoE_dup":"y"})
    return {"diverse_path_signed": a["signed"], "diverse_archs": a["proposer_archs"],
            "identical_diversity_ok": b["diversity_ok"], "precondition_honest": a["emergence_precondition"]}

if __name__=="__main__":
    import json; print(json.dumps(selftest(), indent=2))
