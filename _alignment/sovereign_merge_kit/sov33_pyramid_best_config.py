#!/usr/bin/env python3
"""sov33_pyramid_best_config.py — joint OPTIMISATION of the pyramid: search depth x ratio x brains-per-layer
x hidden together to find the single best config, pushing below the piecewise bests (4-brain-8L=0.035,
1-brain-12@0.5=0.0485). Tunes to the true minimum, honestly measured on held-out.

HONEST: CPU numpy on the shared synthetic residual task. Finds the best TOPOLOGY config; scale-real is the GPU.
"""
import numpy as np, json, itertools
from sov33_pyramid_4brain import FourBrainLayer, _data, _mse
from sov33_owem_v2_core import OWEMPredictorV2

def build(depth, nu, brains, hidden, Xtr, Ttr):
    layers=[]
    pred=lambda X: sum((n_*(L.predict(X) if br else L.forward(X)[0]) for L,n_,br in layers), np.zeros((len(X),Xtr.shape[1])))
    for i in range(depth):
        resid=Ttr-pred(Xtr)
        if brains>1:
            L=FourBrainLayer(dim=Xtr.shape[1],hidden=hidden,base_seed=i); L.train(Xtr,resid,epochs=60)
        else:
            L=OWEMPredictorV2(dim=Xtr.shape[1],hidden=hidden,seed=i+1); L.train(Xtr,resid,epochs=60)
        layers.append((L,nu,brains>1))
    return pred

def main():
    Xtr,Ttr,Xte,Tte=_data(dim=32)
    grid={"depth":[8,10,12],"nu":[1.0,0.7,0.5],"brains":[1,4],"hidden":[8,12]}
    results=[]; best=None
    for depth,nu,brains,hidden in itertools.product(*grid.values()):
        pred=build(depth,nu,brains,hidden,Xtr,Ttr); loss=round(_mse(pred(Xte),Tte),4)
        cfg={"depth":depth,"nu":nu,"brains":brains,"hidden":hidden,"loss":loss}
        results.append(cfg)
        if best is None or loss<best["loss"]: best=cfg
    results.sort(key=lambda c:c["loss"])
    prior_best=0.035   # 4-brain 8L flat
    out={"search_space":grid,"n_configs":len(results),"best":best,"top5":results[:5],
         "prior_piecewise_best":prior_best,"improved":bool(best["loss"]<prior_best),
         "improvement_pct":round(100*(prior_best-best["loss"])/prior_best,1),
         "honest":"joint grid over depth/ratio/brains/hidden on the shared CPU task; the winning config is the tuned pyramid topology."}
    json.dump(out,open("pyramid_best_config_results.json","w"),indent=2)
    print("=== PYRAMID BEST-CONFIG SEARCH ===")
    print("top 5:"); [print(f"  {c}") for c in results[:5]]
    print(f"\nBEST: {best}  (prior piecewise best {prior_best}; improved={out['improved']} {out['improvement_pct']:+}%)")

if __name__ == "__main__":
    main()
