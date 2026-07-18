#!/usr/bin/env python3
"""sov33_robustness_tune.py — push the governed-robustness board further. The current care-gated-BFT holds
flat to 4/9 adversaries. Can a REPUTATION-WEIGHTED aggregate (down-weight members that repeatedly disagree with
the robust centre) extend the safe zone to 5-6/9 and/or lower absolute error? Measured vs naive/median.

HONEST: CPU numpy council on a synthetic task. Tunes the AGGREGATION, not the members. The classic BFT limit is
<N/2 adversaries; reputation weighting can push the practical boundary by discounting persistent liars over rounds.
"""
import numpy as np, json
from sov33_owem_v2_core import OWEMPredictorV2, _task

def _mse(p,t): return float(np.mean((p-t)**2))

def council(N=9, dim=32, seed=1):
    X,T=_task(seed,dim,n=400); k=int(len(X)*.75)
    Xtr,Ttr,Xte,Tte=X[:k],T[:k],X[k:],T[k:]
    ms=[OWEMPredictorV2(dim=dim,hidden=12,seed=i+1) for i in range(N)]
    for m in ms: m.train(Xtr,Ttr,epochs=80,lr=0.1)
    return ms,Xte,Tte

def corrupt(P,mode,rng):
    return {"noise":P+rng.normal(0,2,P.shape),"flip":-P*3,"const":np.full_like(P,rng.normal())}[mode]

def naive(P): return P.mean(0)
def median(P): return np.median(P,0)
def care_bft(P):
    med=np.median(P,0); trust=1/(1+np.mean((P-med[None])**2,(1,2))); keep=trust>=np.median(trust)*0.5
    surv=P[keep]; return med if len(surv)<max(1,int(0.4*len(P))) else surv.mean(0)
def reputation(P, reps):
    """weight each member by its running reputation (low if it keeps diverging from the robust centre)."""
    med=np.median(P,0); div=np.mean((P-med[None])**2,(1,2))
    reps *= np.exp(-2.0*div)                      # decay reputation of divergent members
    reps /= reps.sum()+1e-9
    w=reps[:,None,None]
    return (w*P).sum(0)/(w.sum()+1e-9), reps

def main():
    ms,Xte,Tte=council(); N=len(ms)
    P0=np.stack([m.forward(Xte)[0] for m in ms]); rng=np.random.default_rng(42)
    R={}
    for K in range(0, N//2+2):                    # push to N/2+1 (past the classic BFT limit)
        P=P0.copy()
        for j in range(K): P[j]=corrupt(P[j],["noise","flip","const"][j%3],rng)
        reps=np.ones(N)
        # reputation needs a few rounds to learn liars -> average 3 corrupted redraws
        rep_err=[]
        for _ in range(3):
            Pr=P0.copy()
            for j in range(K): Pr[j]=corrupt(Pr[j],["noise","flip","const"][j%3],rng)
            pred,reps=reputation(Pr,reps); rep_err.append(_mse(pred,Tte))
        R[f"K{K}"]={"naive":round(_mse(naive(P),Tte),4),"median":round(_mse(median(P),Tte),4),
                    "care_bft":round(_mse(care_bft(P),Tte),4),"reputation":round(np.mean(rep_err),4)}
    clean={m:R["K0"][m] for m in R["K0"]}
    kmax=f"K{N//2+1}"                              # 5/9 = past BFT half
    degr={m:round(R[kmax][m]/max(clean[m],1e-9),1) for m in clean}
    best=min(R[kmax],key=R[kmax].get)
    out={"N":N,"board_by_K":R,"clean":clean,"at_%s"%kmax:R[kmax],"degradation_at_%s"%kmax:degr,
         "winner_past_bft_limit":best,
         "reputation_extends":bool(R[kmax]["reputation"]<=R[kmax]["care_bft"]),
         "honest":"reputation weighting discounts persistent liars over rounds; at 5/9 (past the BFT half) it can beat single-round care-bft. CPU synthetic."}
    json.dump(out,open("robustness_tune_results.json","w"),indent=2)
    print("=== ROBUSTNESS TUNE (extend past 4/9) ===")
    for K,v in R.items(): print(f"  {K}: "+"  ".join(f"{m}={v[m]}" for m in v))
    print(f"\nAt {kmax} (past BFT half): winner={best}; reputation extends={out['reputation_extends']}")
    print(f"degradation @ {kmax}: "+", ".join(f"{m} {degr[m]}x" for m in degr))

if __name__ == "__main__":
    main()
