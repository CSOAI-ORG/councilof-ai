#!/usr/bin/env python3
"""sov33_fractal_nest.py — the pyramid becomes a NODE in a larger pyramid (the 33-cubed nesting), MEASURED.

Nick's fractal: one 4-brain pyramid is itself a single node inside a bigger pyramid. The honest question:
does a PYRAMID-OF-PYRAMIDS beat a FLAT pyramid with the SAME total brain budget? Nesting only earns its
complexity if specialization (each sub-pyramid owns a region of the problem) beats one deep monolith.

Mechanism (real, testable):
  - FLAT baseline: one deep 4-brain pyramid, D layers -> D*4 brains.
  - NESTED: split the input space into R regions (a router assigns each sample to a region by a learned
    partition), train a SHALLOWER 4-brain sub-pyramid per region, then a top-level combine. Same brain budget
    (R sub-pyramids * d layers * 4 = D*4). Governed by the Venturi seam at the region-routing hand-off.

HONEST SCOPE: small numpy MLPs on a synthetic task with genuine regional structure (mixture of linear maps),
so region-specialization CAN help. Proves the fractal-nesting topology is real + measurable, and reports
honestly whether nesting beats flat at equal budget. NOT GPU LLM experts (owner run).
"""
import numpy as np, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sov33_pyramid_4brain import Pyramid4Brain
from sov33_owem_v2_core import OWEMPredictorV2

def _regional_task(dim=32, n=600, R=3, seed=11):
    """Data with R genuine regions, each a different linear+tanh map -> specialization CAN help."""
    rng = np.random.default_rng(seed)
    X = rng.normal(0, 1, (n, dim))
    region = rng.integers(0, R, n)                       # true region label
    maps = [rng.normal(0, 1/np.sqrt(dim), (dim, dim)) for _ in range(R)]
    T = np.zeros((n, dim))
    for i in range(n): T[i] = np.tanh(X[i] @ maps[region[i]])
    return X, T, region

def _split(X, T, reg, frac=0.75):
    k = int(len(X)*frac); return X[:k],T[:k],reg[:k], X[k:],T[k:],reg[k:]
def _mse(p,t): return float(np.mean((p-t)**2))

def _route(Xtr, regtr, Xte):
    """Learn a simple region router (nearest-centroid in input space) — the Venturi region hand-off."""
    R = int(regtr.max())+1
    cent = np.array([Xtr[regtr==r].mean(0) if (regtr==r).any() else Xtr.mean(0) for r in range(R)])
    def assign(X): return np.argmin(((X[:,None,:]-cent[None,:,:])**2).sum(-1), axis=1)
    return assign, R

def measure(dim=32, total_depth=6, R=3):
    X,T,reg = _regional_task(dim, R=R)
    Xtr,Ttr,regtr, Xte,Tte,regte = _split(X,T,reg)

    # FLAT: one deep 4-brain pyramid, total_depth layers = total_depth*4 brains
    flat = Pyramid4Brain(dim)
    for _ in range(total_depth): flat.grow(Xtr, Ttr)
    flat_loss = _mse(flat.predict(Xte), Tte)
    flat_brains = total_depth*4

    # NESTED: R sub-pyramids (each total_depth//R layers), routed by region. Same total brains.
    d = max(1, total_depth//R)
    assign, Rr = _route(Xtr, regtr, Xte)
    subs = []
    for r in range(Rr):
        idx = regtr==r
        sp = Pyramid4Brain(dim)
        if idx.any():
            for _ in range(d): sp.grow(Xtr[idx], Ttr[idx])
        subs.append(sp)
    # inference: route each test sample to its region's sub-pyramid
    a_te = assign(Xte)
    pred = np.zeros_like(Tte)
    for r in range(Rr):
        m = a_te==r
        if m.any(): pred[m] = subs[r].predict(Xte[m])
    nested_loss = _mse(pred, Tte)
    nested_brains = Rr*d*4

    return {"dim":dim,"regions":Rr,
            "flat_depth":total_depth,"flat_brains":flat_brains,"flat_loss":round(flat_loss,4),
            "nested_subpyramids":Rr,"nested_depth_each":d,"nested_brains":nested_brains,"nested_loss":round(nested_loss,4),
            "nested_better_pct":round((flat_loss-nested_loss)/flat_loss*100,1),
            "nested_wins":nested_loss<flat_loss,
            "note":"equal-ish brain budget; nesting wins only if regional specialization beats one monolith"}

if __name__=="__main__":
    r=measure()
    print("=== FRACTAL NESTING: pyramid-of-pyramids vs flat pyramid (equal brain budget) ===\n")
    print(f"  FLAT  : 1 pyramid x {r['flat_depth']} layers = {r['flat_brains']} brains -> loss {r['flat_loss']}")
    print(f"  NESTED: {r['nested_subpyramids']} sub-pyramids x {r['nested_depth_each']} layers x 4 = {r['nested_brains']} brains -> loss {r['nested_loss']}")
    print(f"\n  nested vs flat: {r['nested_better_pct']:+}%  ({'NESTING WINS (specialization pays)' if r['nested_wins'] else 'flat wins/ties — honest'})")
    print(f"\n  => a pyramid becomes a node in a larger pyramid; nesting earns its keep WHEN the problem has")
    print(f"     regional structure a router can exploit. This is the 33-cubed fractal, measured.")
