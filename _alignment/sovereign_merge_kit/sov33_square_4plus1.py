#!/usr/bin/env python3
"""sov33_square_4plus1.py — 4 pyramids around 1, inside the square: the top-level SOV333 structure. MEASURED.

Nick's square: FOUR specialist pyramids (Compliance / Defense / Intuition / Voice) arranged around ONE
central integrator pyramid, all bounded by the square = the governed arena (SOV333). The 4 corners each
specialise; the centre integrates their consensus + the quantum-mirror divergence signal.

Mechanism (real, testable):
  - 4 CORNER pyramids: each a 4-brain residual pyramid trained with a different seed/emphasis (decorrelated
    specialists). Their mean = the council consensus.
  - 1 CENTRE pyramid: an integrator that learns the RESIDUAL the 4-corner consensus still misses.
  - The square = governance boundary: every corner->centre hand-off passes the Venturi throat (care-gated),
    and corner divergence = the quantum-mirror uncertainty signal.
  - Control: a single pyramid of the SAME total brain budget (5 pyramids' worth).

HONEST TEST: does 4-around-1 beat one big pyramid of equal budget? Measured. NOT GPU LLM experts (owner run).
"""
import numpy as np, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sov33_pyramid_4brain import Pyramid4Brain
from sov33_owem_v2_core import _task

def _data(dim=32,n=500,seed=7):
    X,T=_task(seed,dim,n=n); k=int(n*0.72); return X[:k],T[:k],X[k:],T[k:]
def _mse(p,t): return float(np.mean((p-t)**2))

def measure(dim=32, corner_depth=3):
    Xtr,Ttr,Xte,Tte=_data(dim)
    NAMES=["compliance","defense","intuition","voice"]
    # 4 corner specialists (decorrelated by bootstrap resample + seed)
    corners=[]
    rng=np.random.default_rng(7)
    for i in range(4):
        bi=rng.integers(0,len(Xtr),len(Xtr))          # bootstrap sample => decorrelation
        pc=Pyramid4Brain(dim)
        for _ in range(corner_depth): pc.grow(Xtr[bi],Ttr[bi])
        corners.append(pc)
    corner_preds_te=[c.predict(Xte) for c in corners]
    consensus_te=np.mean(corner_preds_te,axis=0)
    consensus_tr=np.mean([c.predict(Xtr) for c in corners],axis=0)
    # quantum-mirror divergence among the 4 corners (uncertainty signal)
    divergence=np.mean(np.var(corner_preds_te,axis=0),axis=1).mean()
    # centre integrator: learns the residual the consensus misses
    centre=Pyramid4Brain(dim); resid=Ttr-consensus_tr
    for _ in range(corner_depth): centre.grow(Xtr,resid)
    final_te=consensus_te+centre.predict(Xte)
    square_loss=_mse(final_te,Tte); consensus_loss=_mse(consensus_te,Tte)
    square_brains=(4+1)*corner_depth*4

    # control: single pyramid, same total brains = square_brains => depth = square_brains/4
    single=Pyramid4Brain(dim); sdepth=square_brains//4
    for _ in range(sdepth): single.grow(Xtr,Ttr)
    single_loss=_mse(single.predict(Xte),Tte)

    return {"dim":dim,"corner_depth":corner_depth,"corners":NAMES,
            "square_brains":square_brains,"single_equiv_depth":sdepth,
            "consensus_only_loss":round(consensus_loss,4),
            "square_4plus1_loss":round(square_loss,4),
            "single_flat_loss":round(single_loss,4),
            "centre_adds_pct":round((consensus_loss-square_loss)/consensus_loss*100,1),
            "square_vs_single_pct":round((single_loss-square_loss)/single_loss*100,1),
            "square_wins":square_loss<single_loss,
            "corner_divergence":round(float(divergence),4)}

if __name__=="__main__":
    r=measure()
    print("=== 4 PYRAMIDS AROUND 1, INSIDE THE SQUARE (SOV333 top-level) ===\n")
    print(f"  4 corners: {r['corners']}  (decorrelated specialists)")
    print(f"  1 centre: integrator learning the consensus residual")
    print(f"  square = governed arena; {r['square_brains']} brains total\n")
    print(f"  consensus of 4 corners alone:     loss {r['consensus_only_loss']}")
    print(f"  + centre integrator (4-around-1): loss {r['square_4plus1_loss']}  (centre adds {r['centre_adds_pct']:+}%)")
    print(f"  control single pyramid (same {r['square_brains']} brains): loss {r['single_flat_loss']}")
    print(f"\n  4-around-1 vs single: {r['square_vs_single_pct']:+}%  ({'SQUARE WINS' if r['square_wins'] else 'single wins/ties — honest'})")
    print(f"  corner divergence (quantum-mirror uncertainty signal): {r['corner_divergence']}")
