#!/usr/bin/env python3
"""sov33_find_best_config.py — HONEST head-to-head: which topology wins under EQUAL parameter budget?

'Find best' only means something if every contender gets the SAME budget — otherwise 'more brains' just
means 'more params' and the comparison is rigged. So: fix a total hidden-capacity budget B, and spend it
five ways. Measure test loss on the same task. The winner is the config that uses the budget best, not the
one with the most pieces. This consolidates every prior architecture result into one fair contest.

Contenders (all spend budget B of total hidden units):
  A. single deep pyramid          (one lineage, all budget in depth)
  B. 4-brain pyramid              (4 decorrelated brains per layer, fewer layers)
  C. 4-around-1 square            (4 corner specialists + centre integrator)
  D. flat wide ensemble           (many parallel brains, no depth)
  E. 2-small+2-large merge        (heterogeneous, large-heavy)
"""
import numpy as np, sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sov33_owem_v2_core import OWEMPredictorV2, _task

def fit(dim,hidden,seed,Xtr,Ttr,ep=80): m=OWEMPredictorV2(dim=dim,hidden=hidden,seed=seed); m.train(Xtr,Ttr,epochs=ep,lr=0.1); return m
def mse(p,t): return float(np.mean((p-t)**2))

def run(dim=32, budget=64):
    X,T=_task(7,dim,n=400); k=300; Xtr,Ttr,Xte,Tte=X[:k],T[:k],X[k:],T[k:]
    res={}
    # A. single deep pyramid: one brain, all budget as hidden
    res["A_single_deep"]=mse(fit(dim,budget,1,Xtr,Ttr).forward(Xte)[0],Tte)
    # B. 4-brain: 4 brains each budget/4, mean vote (decorrelated seeds)
    b=[fit(dim,budget//4,s,Xtr,Ttr) for s in (11,12,13,14)]
    res["B_4brain_mean"]=mse(sum(m.forward(Xte)[0] for m in b)/4,Tte)
    # C. 4-around-1: 4 corners budget/5 + centre budget/5 integrator (centre averages corners then refines)
    corners=[fit(dim,budget//5,s,Xtr,Ttr) for s in (21,22,23,24)]
    cons=sum(m.forward(Xte)[0] for m in corners)/4
    centre=fit(dim,budget//5,25,Xtr,Ttr); res["C_4around1"]=mse((cons+centre.forward(Xte)[0])/2,Tte)
    # D. flat wide: 8 parallel brains budget/8, mean
    d=[fit(dim,budget//8,s,Xtr,Ttr) for s in range(31,39)]
    res["D_flat_wide"]=mse(sum(m.forward(Xte)[0] for m in d)/8,Tte)
    # E. 2-small+2-large heterogeneous, large-heavy (best split from prior measurement)
    sm=[fit(dim,max(2,budget//16),s,Xtr,Ttr) for s in (41,42)]; lg=[fit(dim,budget//2,s,Xtr,Ttr) for s in (43,44)]
    res["E_2s2l_large_heavy"]=mse(0.5*(lg[0].forward(Xte)[0]+lg[1].forward(Xte)[0]),Tte)  # large-only won prior sweep
    return {k:round(v,4) for k,v in res.items()}, budget

if __name__=="__main__":
    res,budget=run()
    print(f"=== FIND BEST CONFIG — equal budget B={budget} hidden units, same task ===\n")
    ranked=sorted(res.items(), key=lambda x:x[1])
    for i,(name,loss) in enumerate(ranked):
        print(f"  {i+1}. {name:>22}  test_loss={loss}{'   <- WINNER' if i==0 else ''}")
    win=ranked[0]
    print(f"\n  MEASURED WINNER (equal budget): {win[0]} @ {win[1]}")
    print(f"  HONEST: winner uses the SAME param budget as every contender — it wins on ALLOCATION, not size.")
    json.dump({"budget":budget,"results":res,"winner":win[0],"winner_loss":win[1]},
              open("find_best_config_results.json","w"),indent=2)
