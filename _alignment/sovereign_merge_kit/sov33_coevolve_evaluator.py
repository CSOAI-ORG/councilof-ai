"""sov33_coevolve_evaluator.py — Red Queen co-evolving evaluator (arXiv:2606.26294).

The failure we hit this session: a fixed eval battery SATURATED (both brains 100%, rho=null) — the test
stopped discriminating. Red Queen Godel Machine's fix: co-evolve the EVALUATOR alongside the agent, so
as the agent improves, the test gets harder and keeps measuring real signal (Van Valen's Red Queen: you
must keep running to stay in place).

HONEST: this proposes HARDER held-out items when the battery saturates. It does NOT invent answers — a
harder item still needs a real gold anchor. Propose-only: new items are queued for human review before
entering the canonical battery (a bad eval item is as dangerous as a bad training example).

  saturation(scores)     -> is the battery no longer discriminating? (all-pass / all-fail / zero-variance)
  propose_harder(battery, scores) -> flag that harder items are needed + which topics to deepen
"""
import statistics

def saturation(scores):
    """scores = list of 0/1 (or floats). Saturated if no variance to measure (all same)."""
    if not scores: return {"saturated": True, "reason": "no scores"}
    mean = statistics.mean(scores)
    var = statistics.pvariance(scores) if len(scores)>1 else 0.0
    sat = (mean >= 0.98) or (mean <= 0.02) or (var < 1e-6)
    return {"saturated": sat, "mean": round(mean,3), "variance": round(var,4),
            "reason": ("all-pass — battery too easy" if mean>=0.98 else
                       "all-fail — battery too hard/broken" if mean<=0.02 else
                       "zero-variance" if var<1e-6 else "discriminating (healthy)")}

def propose_harder(battery, scores, per_item=None):
    """Red Queen: when saturated, PROPOSE harder items (human-ratified before entering canonical battery)."""
    s = saturation(scores)
    if not s["saturated"]:
        return {"action": "none", "eval_health": s, "note": "battery still discriminates — no change"}
    # which items everyone got right (too easy) -> deepen those topics
    too_easy = []
    if per_item:
        too_easy = [i for i,sc in enumerate(per_item) if sc==1][:5]
    return {"action": "PROPOSE_HARDER", "eval_health": s,
            "deepen_item_indices": too_easy,
            "proposal": "add multi-hop / edge-case variants of the too-easy items; each needs a real gold anchor",
            "requires_human_approval": True,
            "source": "Red Queen Godel Machine arXiv:2606.26294 (co-evolving evaluator)"}

if __name__ == "__main__":
    print("saturated (all pass):", saturation([1,1,1,1,1]))
    print("healthy:", saturation([1,0,1,1,0]))
    print("propose (all-pass):", propose_harder(["q1","q2","q3"], [1,1,1], per_item=[1,1,1]))
