#!/usr/bin/env python3
"""sov33_ratio_4brain.py — (c) does per-layer RATIO + 4-BRAIN layers COMPOUND?
Combines the two measured wins: 4-brain layers (+48%) and taller+lower-ratio (12@0.5 beats 8@1.0).
Question: does a 12-layer, ratio-0.5, 4-brain pyramid beat every simpler variant? Measured head-to-head.

HONEST SCOPE: CPU numpy OWEM brains — proves whether the two laws stack, not LLM scale.
"""
import numpy as np, sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sov33_pyramid_4brain import FourBrainLayer, _data, _mse
from sov33_owem_v2_core import OWEMPredictorV2

class RatioPyramid:
    """Residual pyramid; per-layer nu (mixing) and per-layer brain-count (1 or 4)."""
    def __init__(self, dim=32, hidden=8, four=True):
        self.dim, self.hidden, self.four, self.layers = dim, hidden, four, []
    def predict(self, X):
        out = np.zeros((len(X), self.dim))
        for L, nu in self.layers: out = out + nu * (L.predict(X) if self.four else L.forward(X)[0])
        return out
    def grow(self, Xtr, Ttr, nu, epochs=60):
        resid = Ttr - self.predict(Xtr)
        if self.four:
            L = FourBrainLayer(dim=self.dim, hidden=self.hidden, base_seed=len(self.layers)); L.train(Xtr, resid, epochs=epochs)
        else:
            L = OWEMPredictorV2(dim=self.dim, hidden=self.hidden, seed=len(self.layers)+1); L.train(Xtr, resid, epochs=epochs)
        self.layers.append((L, nu))
    def loss(self, X, T): return _mse(self.predict(X), T)

def build(four, nu, depth, Xtr, Ttr):
    p = RatioPyramid(four=four)
    for _ in range(depth): p.grow(Xtr, Ttr, nu=nu)
    return p

def main():
    Xtr, Ttr, Xte, Tte = _data(dim=32)
    variants = {
        "1brain_8L_nu1.0  (Claude-Sci baseline)": build(False, 1.0, 8, Xtr, Ttr),
        "4brain_8L_nu1.0  (+48% win)":            build(True,  1.0, 8, Xtr, Ttr),
        "1brain_12L_nu0.5 (ratio win)":           build(False, 0.5, 12, Xtr, Ttr),
        "4brain_12L_nu0.5 (COMPOUND?)":           build(True,  0.5, 12, Xtr, Ttr),
    }
    res = {k: round(p.loss(Xte, Tte), 4) for k, p in variants.items()}
    best = min(res, key=res.get)
    base = res["1brain_8L_nu1.0  (Claude-Sci baseline)"]
    out = {"losses": res, "winner": best, "winner_loss": res[best],
           "compound_vs_baseline_pct": round(100*(base-res[best])/base, 1),
           "compounds": best.startswith("4brain_12L"),
           "honest": "CPU numpy brains — tests whether the 4-brain law and the depth/ratio law stack. Scale-real is the GPU run."}
    json.dump(out, open("ratio_4brain_results.json", "w"), indent=2)
    print("=== (c) DO 4-BRAIN + PER-LAYER RATIO COMPOUND? ===\n")
    for k, v in sorted(res.items(), key=lambda kv: kv[1]): print(f"  {v:.4f}   {k}")
    print(f"\nWINNER: {best}  ({out['compound_vs_baseline_pct']:+}% vs baseline)")
    print("COMPOUNDS ✔ (4-brain + tall + low-ratio is best)" if out["compounds"]
          else "does NOT fully compound — honest: the two laws partly overlap")

if __name__ == "__main__":
    main()
