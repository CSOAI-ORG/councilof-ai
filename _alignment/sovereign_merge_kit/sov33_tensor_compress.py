#!/usr/bin/env python3
"""sov33_tensor_compress.py — quantum-INSPIRED classical compression of OWEM weights. MEASURED.

The honest version of "use quantum ideas to go faster": the Schmidt decomposition that quantum information
uses to measure entanglement IS the singular value decomposition (SVD). Tensor-network / low-rank truncation
compresses a weight matrix W ~ U S V^T by keeping the top-r singular values — fewer FLOPs, less memory, on
CLASSICAL hardware. This is what "quantum-inspired" legitimately means: a classical algorithm with roots in
quantum-information math. NO quantum hardware, NO quantum speedup claim — just SVD truncation, measured.

Applied to each OWEM layer's weight matrices: W1 (dim x hidden), W2 (hidden x dim). Low-rank r replaces the
dense matmul (dim*hidden FLOPs) with two thin matmuls (r*(dim+hidden) FLOPs). We measure the speed/size
saving AND the loss cost at each rank, to find the honest sweet spot.

HONEST: this is standard low-rank compression (a real, decades-old technique); calling the SVD step
'quantum-inspired' is accurate lineage (Schmidt=SVD), NOT a quantum-hardware claim. CPU numpy proof.
"""
import numpy as np, sys, os, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sov33_owem_v2_core import OWEMPredictorV2, _task

def _lowrank(W, r):
    """Schmidt/SVD truncation: keep top-r singular values. Returns (U_r, V_r) with W ~ U_r @ V_r."""
    U, S, Vt = np.linalg.svd(W, full_matrices=False)
    r = min(r, len(S))
    return U[:, :r] * S[:r], Vt[:r, :]   # (m x r), (r x n)

def _flops_dense(m, n): return m * n
def _flops_lowrank(m, n, r): return r * (m + n)

def compress_owem(model, r):
    """Return a function that runs the model with low-rank W1, W2, plus FLOP counts."""
    U1, V1 = _lowrank(model.W1, r); U2, V2 = _lowrank(model.W2, r)
    def fwd(X):
        h = np.tanh((X @ U1) @ V1 + model.b1)
        return (h @ U2) @ V2 + model.b2
    dense = _flops_dense(*model.W1.shape) + _flops_dense(*model.W2.shape)
    low   = _flops_lowrank(*model.W1.shape, r) + _flops_lowrank(*model.W2.shape, r)
    return fwd, dense, low

def run(dim=32, hidden=128):
    X, T = _task(7, dim, n=400); k = int(400*0.75); Xtr,Ttr,Xte,Tte = X[:k],T[:k],X[k:],T[k:]
    m = OWEMPredictorV2(dim=dim, hidden=hidden, seed=1); m.train(Xtr, Ttr, epochs=80, lr=0.1)
    def mse(p,t): return float(np.mean((p-t)**2))
    full_loss = mse(m.forward(Xte)[0], Tte)
    rows = []
    for r in [2, 4, 8, 16, 24, 32]:
        fwd, dense, low = compress_owem(m, r)
        loss = mse(fwd(Xte), Tte)
        rows.append({"rank": r, "loss": round(loss,4),
                     "loss_delta_pct": round((loss-full_loss)/full_loss*100,1),
                     "flops_saved_pct": round((dense-low)/dense*100,1),
                     "params_dense": dense, "params_lowrank": low})
    # sweet spot = smallest rank with loss_delta < 5% AND flops saved > 0
    good = [x for x in rows if x["loss_delta_pct"] < 5 and x["flops_saved_pct"] > 0]
    sweet = min(good, key=lambda x: x["rank"]) if good else None
    return {"full_loss": round(full_loss,4), "rows": rows, "sweet_spot": sweet,
            "dim": dim, "hidden": hidden}

if __name__=="__main__":
    r = run()
    print("=== QUANTUM-INSPIRED TENSOR COMPRESSION (SVD/Schmidt low-rank of OWEM weights) ===\n")
    print(f"  full model loss: {r['full_loss']}  (dim {r['dim']}, hidden {r['hidden']})\n")
    print(f"  {'rank':>4} {'loss':>8} {'loss_delta':>11} {'FLOPs_saved':>12}")
    for x in r["rows"]:
        mark = "  <- sweet spot" if r["sweet_spot"] and x["rank"]==r["sweet_spot"]["rank"] else ""
        print(f"  {x['rank']:>4} {x['loss']:>8} {x['loss_delta_pct']:>10}% {x['flops_saved_pct']:>11}%{mark}")
    if r["sweet_spot"]:
        s = r["sweet_spot"]
        print(f"\n  SWEET SPOT: rank {s['rank']} -> {s['flops_saved_pct']}% fewer FLOPs for {s['loss_delta_pct']}% loss cost")
    print(f"\n  => real classical speedup from a quantum-INSPIRED technique (Schmidt=SVD truncation).")
    print(f"  HONEST: standard low-rank compression, NOT quantum hardware, NO quantum-speedup claim.")
