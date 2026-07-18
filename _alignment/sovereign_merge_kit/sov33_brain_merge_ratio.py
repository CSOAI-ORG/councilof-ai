#!/usr/bin/env python3
"""sov33_brain_merge_ratio.py — the 2-small + 2-large OWEM brain: MEASURED best mixing ratio. CPU numpy.

Answers "what's the best split (90/10? 50/50?) for 4 models merged into one OWEM brain" — HONESTLY, by
sweeping it and measuring, not declaring. Critical distinction enforced here:

  This is an OUTPUT-ENSEMBLE merge (router blends 4 heterogeneous models' outputs), NOT a weight-average.
  Weight-merge (SLERP/TIES) needs identical architecture; you cannot weight-merge DeepSeek+GLM+Kimi+Qwen.
  So "90/10" = the CONTRIBUTION weight on small-vs-large members, a real knob we can sweep.

Setup: 4 brain members = 2 "small" (low capacity, hidden=6) + 2 "large" (high capacity, hidden=64), each a
distinct OWEM trained on the same task with a different seed (decorrelated). We blend their predictions with
a small/large split s: output = (s/2)*(small1+small2) + ((1-s)/2)*(large1+large2). Sweep s, measure test loss.
Also test the honest question: do the small members ADD anything, or should it be large-only?
"""
import numpy as np, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sov33_owem_v2_core import OWEMPredictorV2, _task

def _fit(dim, hidden, seed, Xtr, Ttr, epochs=80):
    m=OWEMPredictorV2(dim=dim, hidden=hidden, seed=seed); m.train(Xtr,Ttr,epochs=epochs,lr=0.1); return m

def run(dim=32):
    X,T=_task(7,dim,n=400); k=int(400*0.75); Xtr,Ttr,Xte,Tte=X[:k],T[:k],X[k:],T[k:]
    def mse(p,t): return float(np.mean((p-t)**2))
    smalls=[_fit(dim,6,s,Xtr,Ttr) for s in (11,12)]      # 2 small (capacity-limited)
    larges=[_fit(dim,64,s,Xtr,Ttr) for s in (21,22)]     # 2 large (high capacity)
    Ps=[m.forward(Xte)[0] for m in smalls]; Pl=[m.forward(Xte)[0] for m in larges]
    solo={"small_avg":mse((Ps[0]+Ps[1])/2,Tte),"large_avg":mse((Pl[0]+Pl[1])/2,Tte)}
    rows=[]
    for s in [0.0,0.1,0.2,0.3,0.5,0.7,0.9,1.0]:   # s = weight on SMALL members
        pred=(s/2)*(Ps[0]+Ps[1]) + ((1-s)/2)*(Pl[0]+Pl[1])
        rows.append({"small_weight":s,"large_weight":round(1-s,1),"loss":round(mse(pred,Tte),4)})
    best=min(rows,key=lambda r:r["loss"])
    # honest control: equal 4-way (all get 0.25) vs best swept vs large-only
    equal=mse(0.25*(Ps[0]+Ps[1]+Pl[0]+Pl[1]),Tte)
    return {"solo":{k:round(v,4) for k,v in solo.items()},"sweep":rows,"best":best,
            "equal_4way":round(equal,4),"large_only":round(solo["large_avg"],4)}

if __name__=="__main__":
    r=run()
    print("=== 2-SMALL + 2-LARGE OWEM BRAIN — measured mixing ratio ===\n")
    print(f"  solo: 2-small avg={r['solo']['small_avg']}  2-large avg={r['solo']['large_avg']}\n")
    print(f"  {'small_wt':>9} {'large_wt':>9} {'test_loss':>10}")
    for x in r["sweep"]:
        mark="  <- BEST" if x["small_weight"]==r["best"]["small_weight"] else ""
        print(f"  {x['small_weight']:>9} {x['large_weight']:>9} {x['loss']:>10}{mark}")
    print(f"\n  equal 4-way (0.25 each): {r['equal_4way']}")
    print(f"  large-only (small_wt=0):  {r['large_only']}")
    b=r["best"]
    print(f"\n  MEASURED BEST SPLIT: small={b['small_weight']} / large={b['large_weight']} -> loss {b['loss']}")
    verdict = ("small members ADD value" if b["small_weight"]>0 and b["loss"]<r["large_only"]
               else "large-only wins; small members don't help THIS task")
    print(f"  HONEST VERDICT: {verdict}")
    print(f"  (output-ensemble merge across heterogeneous members — NOT a weight-average; ratio is a real knob)")
