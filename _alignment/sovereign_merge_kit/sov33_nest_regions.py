#!/usr/bin/env python3
"""sov33_nest_regions.py — NEST-ONLY-WITH-REGIONS, measured. Tests the build-spec law:
'4-around-1 (pyramid of pyramids) wins ONLY with genuine regional structure + accurate routing; a single
deep pyramid wins on a single-domain task.' Sweeps region SEPARATION and confirms the crossover.

Setup: K=4 regions, each its own linear world-map M_k = (1-sep)*M_shared + sep*M_k_distinct.
  sep=0 → all regions identical (no real structure)   sep=1 → fully distinct regions.
Compare at each sep:  ONE deep pyramid (8 layers, all data)  vs  NEST (4 sub-pyramids of 4 layers, routed
by TRUE region label = perfect routing) .

HONEST SCOPE: CPU numpy brains + perfect routing (upper bound). Proves WHEN nesting helps, not LLM scale.
"""
import numpy as np, sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sov33_pyramid_4brain import Pyramid4Brain, _mse

def regional_data(sep, dim=32, per=150, seed=3):
    rng = np.random.default_rng(seed)
    Msh = rng.normal(0, 1/np.sqrt(dim), (dim, dim))
    Xtr, Ttr, gtr, Xte, Tte, gte = [], [], [], [], [], []
    for k in range(4):
        Mk = rng.normal(0, 1/np.sqrt(dim), (dim, dim))
        M = (1-sep)*Msh + sep*Mk
        X = rng.normal(0, 1, (per, dim)); T = np.tanh(X @ M)
        c = int(per*0.75)
        Xtr.append(X[:c]); Ttr.append(T[:c]); gtr += [k]*c
        Xte.append(X[c:]); Tte.append(T[c:]); gte += [k]*(per-c)
    return (np.vstack(Xtr), np.vstack(Ttr), np.array(gtr),
            np.vstack(Xte), np.vstack(Tte), np.array(gte))

def one_pyramid(Xtr, Ttr, Xte, Tte, depth=8):
    p = Pyramid4Brain(dim=Xtr.shape[1])
    for _ in range(depth): p.grow(Xtr, Ttr)
    return round(_mse(p.predict(Xte), Tte), 4)

def nest(Xtr, Ttr, gtr, Xte, Tte, gte, depth=4):
    pred = np.zeros_like(Tte)
    for k in range(4):
        subp = Pyramid4Brain(dim=Xtr.shape[1])
        mtr = gtr == k
        for _ in range(depth): subp.grow(Xtr[mtr], Ttr[mtr])
        mte = gte == k
        pred[mte] = subp.predict(Xte[mte])
    return round(_mse(pred, Tte), 4)

def main():
    rows = {}
    for sep in [0.0, 0.25, 0.5, 0.75, 1.0]:
        Xtr, Ttr, gtr, Xte, Tte, gte = regional_data(sep)
        o = one_pyramid(Xtr, Ttr, Xte, Tte)
        n = nest(Xtr, Ttr, gtr, Xte, Tte, gte)
        rows[f"sep={sep}"] = {"one_deep_pyramid": o, "nest_4around1": n,
                              "nest_wins": n < o, "nest_better_pct": round(100*(o-n)/o, 1)}
    # crossover: where does nest start winning?
    wins = [s for s, r in rows.items() if r["nest_wins"]]
    out = {"sweep": rows,
           "nest_wins_at": wins,
           "single_domain_sep0_nest_wins": rows["sep=0.0"]["nest_wins"],
           "law_confirmed": (not rows["sep=0.0"]["nest_wins"]) and rows["sep=1.0"]["nest_wins"],
           "honest": "CPU brains + PERFECT routing (upper bound). Real router would be worse; nesting needs BOTH real regions AND good routing."}
    json.dump(out, open("nest_regions_results.json", "w"), indent=2)
    print("=== NEST-ONLY-WITH-REGIONS — measured crossover ===\n")
    print("separation | one-deep-pyramid | nest-4around1 | winner")
    for s, r in rows.items():
        w = "NEST" if r["nest_wins"] else "one-pyramid"
        print(f"  {s:9} |     {r['one_deep_pyramid']:.4f}     |    {r['nest_4around1']:.4f}   | {w} ({r['nest_better_pct']:+}%)")
    print(f"\nLAW CONFIRMED (nest LOSES at sep=0, WINS at sep=1): {out['law_confirmed']}")
    print(f"nest wins at: {wins}")

if __name__ == "__main__":
    main()
