#!/usr/bin/env python3
"""sov33_pyramid_4brain.py — the pyramid where EACH LAYER is a 4-brain OWEM. 8 layers x 4 brains = 32 brains.

Nick's refinement: each pyramid layer is not one predictor but a STACK OF 4 OWEM BRAINS
(Compliance / Defense / Intuition / Voice) — the SOV33 4-brain structure. The 4 brains are DIVERSE
(different seeds = decorrelated) and combined per layer (mean = the ensemble vote). The layer then feeds
the residual up to the next 4-brain layer. We measured earlier that 8 layers is optimal — so this is the
8-layer x 4-brain pyramid, 32 brains total.

HONEST TEST: does a 4-BRAIN layer actually beat a 1-BRAIN layer? Measured head-to-head, same depth.
(If 4-brain ties 1-brain, say so — decorrelation only helps if the brains genuinely disagree.)

HONEST SCOPE: small numpy MLPs on a synthetic task. Proves the 4-brain-per-layer TOPOLOGY is real and
measurable. NOT 32 GPU-trained LLM experts (owner's Kaggle/BTX run). The brain NAMES (Compliance/Defense/
Intuition/Voice) are the governance roles; here they're modelled as decorrelated ensemble members.
"""
import numpy as np, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sov33_owem_v2_core import OWEMPredictorV2, _task

BRAINS = ["compliance", "defense", "intuition", "voice"]

def _data(dim=32, n=400, seed=7):
    X, T = _task(seed, dim, n=n); k = int(n * 0.75)
    return X[:k], T[:k], X[k:], T[k:]
def _mse(p, t): return float(np.mean((p - t) ** 2))

class FourBrainLayer:
    """One pyramid layer = 4 decorrelated OWEM brains, combined by mean vote."""
    def __init__(self, dim=32, hidden=8, base_seed=0):
        self.brains = [OWEMPredictorV2(dim=dim, hidden=hidden, seed=base_seed*4 + i + 1) for i in range(4)]
    def train(self, X, T, epochs=60, lr=0.1):
        for b in self.brains: b.train(X, T, epochs=epochs, lr=lr)
    def predict(self, X):
        return np.mean([b.forward(X)[0] for b in self.brains], axis=0)   # 4-brain vote

class Pyramid4Brain:
    """Stacked residual 4-brain layers. Each layer's ensemble learns the residual below."""
    def __init__(self, dim=32, hidden=8):
        self.dim, self.hidden, self.layers = dim, hidden, []
    def predict(self, X):
        out = np.zeros((len(X), self.dim))
        for L in self.layers: out = out + L.predict(X)
        return out
    def grow(self, Xtr, Ttr, epochs=60):
        resid = Ttr - self.predict(Xtr)
        L = FourBrainLayer(dim=self.dim, hidden=self.hidden, base_seed=len(self.layers))
        L.train(Xtr, resid, epochs=epochs); self.layers.append(L)
    def loss(self, X, T): return _mse(self.predict(X), T)

class Pyramid1Brain:
    """Control: same depth, but each layer is ONE brain (not 4)."""
    def __init__(self, dim=32, hidden=8):
        self.dim, self.hidden, self.layers = dim, hidden, []
    def predict(self, X):
        out = np.zeros((len(X), self.dim))
        for m in self.layers: out = out + m.forward(X)[0]
        return out
    def grow(self, Xtr, Ttr, epochs=60):
        resid = Ttr - self.predict(Xtr)
        m = OWEMPredictorV2(dim=self.dim, hidden=self.hidden, seed=len(self.layers)+1)
        m.train(Xtr, resid, epochs=epochs); self.layers.append(m)
    def loss(self, X, T): return _mse(self.predict(X), T)

def measure(depth=8, dim=32):
    Xtr, Ttr, Xte, Tte = _data(dim)
    p4 = Pyramid4Brain(dim); p1 = Pyramid1Brain(dim)
    curve4, curve1 = [], []
    for _ in range(depth):
        p4.grow(Xtr, Ttr); p1.grow(Xtr, Ttr)
        curve4.append(round(p4.loss(Xte, Tte), 4)); curve1.append(round(p1.loss(Xte, Tte), 4))
    return {"depth": depth, "brains_per_layer": 4, "total_brains": depth*4,
            "curve_4brain": curve4, "curve_1brain": curve1,
            "final_4brain": curve4[-1], "final_1brain": curve1[-1],
            "4brain_better_pct": round((curve1[-1]-curve4[-1])/curve1[-1]*100, 1),
            "4brain_wins": curve4[-1] < curve1[-1]}

if __name__ == "__main__":
    r = measure(depth=8)
    print(f"=== 8-LAYER x 4-BRAIN PYRAMID ({r['total_brains']} brains total) ===\n")
    print("layer | 1-brain/layer | 4-brain/layer")
    for i,(a,b) in enumerate(zip(r['curve_1brain'], r['curve_4brain']),1):
        print(f"  {i:2}  |    {a:.4f}    |    {b:.4f}  {'<- 4-brain better' if b<a else ''}")
    print(f"\nFINAL @ depth 8:  1-brain {r['final_1brain']}   4-brain {r['final_4brain']}")
    print(f"4-brain layers vs 1-brain layers: {r['4brain_better_pct']:+}%  ({'4-BRAIN WINS' if r['4brain_wins'] else 'ties/loses — honest'})")
    print(f"\ntotal brains = 8 layers x 4 = {r['total_brains']}")
