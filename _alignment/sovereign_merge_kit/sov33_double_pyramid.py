#!/usr/bin/env python3
"""sov33_double_pyramid.py — "AS ABOVE, SO BELOW": two mirrored pyramids in one XXL model. MEASURED.

Nick's hexagram/double-pyramid: an UPRIGHT pyramid (widening capacity going up: coarse->fine residual)
mirrored by an INVERTED pyramid (narrowing: fine->coarse), the two meeting at the capstone — one XXL SOV333
model. This is an HOURGLASS: capacity expands then contracts (or vice-versa). The honest test: does the
mirrored double-pyramid beat a single same-budget pyramid?

Mechanism (real, testable):
  - ABOVE (upright): 4-brain residual layers with INCREASING capacity (hidden 4->8->16->...) — coarse to fine.
  - BELOW (inverted): 4-brain residual layers with DECREASING capacity (...->16->8->4) — fine to coarse,
    learning what the upright pyramid still missed.
  - The two share the residual stream and meet at the capstone (final combine), governed by the Venturi seam.
  - Control: a single flat pyramid of the SAME total brain budget + same total capacity.

HONEST SCOPE: small numpy MLPs, synthetic task. Proves the double-pyramid topology is real + measurable and
reports honestly whether the mirror helps. NOT GPU LLM experts (owner run). "As above so below" is the design
metaphor; the mechanism is a capacity-symmetric residual hourglass.
"""
import numpy as np, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sov33_pyramid_4brain import FourBrainLayer
from sov33_owem_v2_core import _task

def _data(dim=32,n=400,seed=7):
    X,T=_task(seed,dim,n=n); k=int(n*0.75); return X[:k],T[:k],X[k:],T[k:]
def _mse(p,t): return float(np.mean((p-t)**2))

def _residual_stack(Xtr,Ttr,dim,hiddens):
    """Train a stack of 4-brain layers with the given per-layer capacities; return layers + train pred."""
    layers=[]; pred=np.zeros((len(Xtr),dim))
    for h in hiddens:
        resid=Ttr-pred
        L=FourBrainLayer(dim=dim,hidden=h,base_seed=len(layers)); L.train(Xtr,resid,epochs=60)
        layers.append(L); pred=pred+L.predict(Xtr)
    return layers

def _predict(layers,X,dim):
    out=np.zeros((len(X),dim))
    for L in layers: out=out+L.predict(X)
    return out

def measure(dim=32):
    Xtr,Ttr,Xte,Tte=_data(dim)
    # DOUBLE (as above so below): upright widening 4->8->16 then inverted narrowing 16->8->4
    above=[4,8,16]; below=[16,8,4]
    dl=_residual_stack(Xtr,Ttr,dim,above+below)
    double_loss=_mse(_predict(dl,Xte,dim),Tte)
    double_brains=len(above+below)*4; double_cap=sum(above+below)

    # SINGLE control: flat pyramid, same #layers, same TOTAL capacity spread evenly
    nlayers=len(above+below); even=double_cap//nlayers
    sl=_residual_stack(Xtr,Ttr,dim,[even]*nlayers)
    single_loss=_mse(_predict(sl,Xte,dim),Tte)

    return {"dim":dim,"above_caps":above,"below_caps":below,
            "double_brains":double_brains,"double_total_capacity":double_cap,"double_loss":round(double_loss,4),
            "single_flat_loss":round(single_loss,4),"single_layer_cap":even,
            "double_better_pct":round((single_loss-double_loss)/single_loss*100,1),
            "double_wins":double_loss<single_loss}

if __name__=="__main__":
    r=measure()
    print("=== AS ABOVE, SO BELOW: double mirrored pyramid vs single flat (equal budget) ===\n")
    print(f"  ABOVE (upright, widening): 4-brain layers hidden {r['above_caps']}")
    print(f"  BELOW (inverted, narrowing): 4-brain layers hidden {r['below_caps']}")
    print(f"  meeting at the capstone -> one XXL SOV333 model ({r['double_brains']} brains, capacity {r['double_total_capacity']})\n")
    print(f"  DOUBLE (hourglass): loss {r['double_loss']}")
    print(f"  SINGLE (flat, {r['single_layer_cap']}/layer, same budget): loss {r['single_flat_loss']}")
    print(f"\n  double vs single: {r['double_better_pct']:+}%  ({'DOUBLE WINS (mirror helps)' if r['double_wins'] else 'flat wins/ties — honest'})")
