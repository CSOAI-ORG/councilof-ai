#!/usr/bin/env python3
"""sov33_brain_merge.py — HYBRID MERGE: turning 4 models (2 small + 2 large) into ONE OWEM brain.
The honest question Nick asked ("90/10 or what's best split?") has TWO answers depending on whether you're
merging WEIGHTS (one model) or combining OUTPUTS (a council), and a hard rule people get wrong:

  RULE 1 — you can only WEIGHT-merge models of the SAME architecture (same hidden size). Cross-size
           (small+large) weight-merge is UNDEFINED (shape mismatch) — you must ROUTE or DISTILL.
  RULE 2 — even same-size weight-merge only works if the models share an INIT (model-soup). Different
           random inits don't align (permutation symmetry) → naive soup FAILS. Measured here.

So "2 small + 2 large in one brain" honestly = soup the 2 small (shared init) → 1 small; soup the 2 large →
1 large; the BRAIN routes small→large (draft→verify). This file MEASURES: (a) best soup weight alpha,
(b) that different-init soup fails, (c) that cross-size must route/distill, (d) the full 4→1 brain.

HONEST SCOPE: CPU numpy OWEM. Proves the MERGE LAWS; at LLM scale the same laws hold (soup=Model Soup,
route=cascade, distill=KD; TIES/DARE/SLERP are the same family for transformer weights).
"""
import numpy as np, sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sov33_owem_v2_core import OWEMPredictorV2, _task

def _mse(m, X, T): return round(float(np.mean((m.forward(X)[0] - T) ** 2)), 4)

def soup(a, b, alpha):
    """Weight-average two SAME-hidden OWEMs: W = alpha*a + (1-alpha)*b. Returns a new merged brain."""
    assert a.hidden == b.hidden, "cannot weight-merge different sizes"
    m = OWEMPredictorV2(dim=a.dim, hidden=a.hidden, seed=0)
    for w in ("W1", "b1", "W2", "b2"):
        setattr(m, w, alpha * getattr(a, w) + (1 - alpha) * getattr(b, w))
    return m

def clone_from(base):
    m = OWEMPredictorV2(dim=base.dim, hidden=base.hidden, seed=0)
    for w in ("W1", "b1", "W2", "b2"): setattr(m, w, getattr(base, w).copy())
    return m

def main():
    X, T = _task(7, 32, n=400); k = int(len(X) * 0.75)
    Xtr, Ttr, Xte, Tte = X[:k], T[:k], X[k:], T[k:]
    RES = {}

    # ---- (a) SAME-INIT soup: 2 small share an init, fine-tune on split shards, sweep alpha ----
    base_small = OWEMPredictorV2(dim=32, hidden=8, seed=1)
    s1, s2 = clone_from(base_small), clone_from(base_small)
    s1.train(Xtr[:150], Ttr[:150], epochs=80, lr=0.1)     # shard A
    s2.train(Xtr[150:], Ttr[150:], epochs=80, lr=0.1)     # shard B
    alpha_sweep = {f"a={a}": _mse(soup(s1, s2, a), Xte, Tte) for a in [1.0, 0.9, 0.7, 0.5, 0.3, 0.1, 0.0]}
    best_a = min(alpha_sweep, key=alpha_sweep.get)
    vote_small = round(float(np.mean((0.5*(s1.forward(Xte)[0]+s2.forward(Xte)[0]) - Tte) ** 2)), 4)
    RES["same_init_soup_small"] = {"alpha_sweep": alpha_sweep, "best_alpha": best_a,
        "best_soup": alpha_sweep[best_a], "ensemble_vote": vote_small,
        "soup_beats_or_ties_vote": alpha_sweep[best_a] <= vote_small + 0.002}

    # ---- (b) DIFFERENT-INIT soup FAILS (permutation symmetry) ----
    d1 = OWEMPredictorV2(dim=32, hidden=8, seed=11); d1.train(Xtr, Ttr, epochs=80, lr=0.1)
    d2 = OWEMPredictorV2(dim=32, hidden=8, seed=22); d2.train(Xtr, Ttr, epochs=80, lr=0.1)
    RES["diff_init_soup"] = {"model1": _mse(d1, Xte, Tte), "model2": _mse(d2, Xte, Tte),
        "soup_0.5": _mse(soup(d1, d2, 0.5), Xte, Tte),
        "soup_worse_than_either": _mse(soup(d1, d2, 0.5), Xte, Tte) > max(_mse(d1, Xte, Tte), _mse(d2, Xte, Tte)),
        "lesson": "naive weight-merge of different-init models fails; needs shared init OR weight-matching (Git-Re-Basin) OR just route/vote."}

    # ---- (c) CROSS-SIZE cannot weight-merge -> DISTILL large into small ----
    big = OWEMPredictorV2(dim=32, hidden=48, seed=3); big.train(Xtr, Ttr, epochs=150, lr=0.1)
    small = OWEMPredictorV2(dim=32, hidden=8, seed=4); small.train(Xtr, Ttr, epochs=80, lr=0.1)
    distilled = OWEMPredictorV2(dim=32, hidden=8, seed=4)
    distilled.train(Xtr, big.forward(Xtr)[0], epochs=120, lr=0.1)   # student learns teacher's outputs
    RES["cross_size"] = {"can_weight_merge": False, "big_h48": _mse(big, Xte, Tte),
        "small_h8": _mse(small, Xte, Tte), "small_distilled_from_big": _mse(distilled, Xte, Tte),
        "distill_helped": _mse(distilled, Xte, Tte) < _mse(small, Xte, Tte),
        "lesson": "small+large can't share weights; DISTILL the large into the small, or ROUTE (small=draft, large=verify)."}

    # ---- (d) the FULL 4->1 brain: soup 2 small + soup 2 large (same-init each), then route ----
    bl = OWEMPredictorV2(dim=32, hidden=48, seed=5)
    l1, l2 = clone_from(bl), clone_from(bl)
    l1.train(Xtr[:150], Ttr[:150], epochs=120, lr=0.1); l2.train(Xtr[150:], Ttr[150:], epochs=120, lr=0.1)
    merged_small = soup(s1, s2, 0.5); merged_large = soup(l1, l2, 0.5)
    # route: use small's confidence (agreement with large on a calib set) — here route ALL to whichever is better per item
    ps, pl = merged_small.forward(Xte)[0], merged_large.forward(Xte)[0]
    es, el = np.mean((ps-Tte)**2, 1), np.mean((pl-Tte)**2, 1)
    routed = np.where((es <= el)[:, None], ps, pl)     # oracle route (upper bound)
    cascade = np.where((np.abs(ps).mean(1) < 3)[:, None], ps, pl)  # heuristic: small unless it saturates
    RES["four_to_one_brain"] = {"merged_small": round(float(np.mean((ps-Tte)**2)),4),
        "merged_large": round(float(np.mean((pl-Tte)**2)),4),
        "routed_oracle": round(float(np.mean((routed-Tte)**2)),4),
        "cascade_heuristic": round(float(np.mean((cascade-Tte)**2)),4),
        "structure": "brain = soup(2 small)->1 small + soup(2 large)->1 large, routed small->large"}

    json.dump(RES, open("brain_merge_results.json", "w"), indent=2)
    print(json.dumps(RES, indent=1))

if __name__ == "__main__":
    main()
