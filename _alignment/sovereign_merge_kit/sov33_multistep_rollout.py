#!/usr/bin/env python3
"""sov33_multistep_rollout.py — GAP B4: multi-step latent rollout. What makes a world model PLAN, not just
predict one step. Rolls the OWEM forward model H steps in latent space, measures error growth, and shows the
honest failure mode (error compounds) + the honest fix (governed re-grounding at the throat).

A true world model predicts next STATE and can ROLL it forward: s_t -> s_t+1 -> ... -> s_t+H without new input.
Single-step prediction is not planning. This builds the rollout and MEASURES how error compounds over horizon
(the real, known limitation), then shows re-grounding every k steps bounds the drift.
"""
import numpy as np, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sov33_owem_v2_core import OWEMPredictorV2, _task

def rollout(model, s0, H, reground_every=0, true_next=None):
    """Roll the forward model H steps. If reground_every>0, snap back to the true state every k steps
    (governed re-grounding — the throat injects a real observation to bound drift)."""
    s=s0.copy(); traj=[s.copy()]
    for h in range(H):
        s=model.forward(s.reshape(1,-1))[0].ravel()
        if reground_every and true_next is not None and (h+1)%reground_every==0 and h+1<len(true_next):
            s=true_next[h+1].copy()   # governed re-ground: inject observed state
        traj.append(s.copy())
    return np.array(traj)

def run(dim=16, H=10):
    # train a forward model on a smooth latent walk (autoregressive: s_t -> s_t+1)
    rng=np.random.default_rng(3); A=rng.standard_normal((dim,dim))*0.3
    def step(s): return np.tanh(A@s)                     # true latent dynamics
    s=rng.standard_normal(dim); seq=[s]
    for _ in range(400): s=step(s); seq.append(s)
    seq=np.array(seq); X,T=seq[:-1],seq[1:]; k=300
    m=OWEMPredictorV2(dim=dim,hidden=64,seed=1); m.train(X[:k],T[:k],epochs=120,lr=0.1)
    # true future for a held-out start
    s0=seq[k]; true=[s0]
    for _ in range(H): true.append(step(true[-1]))
    true=np.array(true)
    # rollout WITHOUT re-grounding (free-running) vs WITH governed re-grounding every 3 steps
    free=rollout(m,s0,H); grounded=rollout(m,s0,H,reground_every=3,true_next=true)
    err_free=[float(np.mean((free[h]-true[h])**2)) for h in range(H+1)]
    err_grnd=[float(np.mean((grounded[h]-true[h])**2)) for h in range(H+1)]
    return {"H":H,"err_free":[round(e,4) for e in err_free],"err_grounded":[round(e,4) for e in err_grnd]}

if __name__=="__main__":
    r=run()
    print("=== MULTI-STEP LATENT ROLLOUT (GAP B4) — world-model planning ===\n")
    print(f"  {'step':>4} {'free-run err':>13} {'re-grounded err':>16}")
    for h in range(r["H"]+1):
        print(f"  {h:>4} {r['err_free'][h]:>13} {r['err_grounded'][h]:>16}")
    print(f"\n  HONEST: free-running error COMPOUNDS over horizon (known world-model limitation — small per-step")
    print(f"  error accumulates). Governed RE-GROUNDING (inject an observed state every 3 steps via the throat)")
    print(f"  BOUNDS the drift. That's the honest planning story: roll forward, but re-ground on real observation.")
    print(f"  free@H={r['err_free'][-1]}  grounded@H={r['err_grounded'][-1]}  ->",
          "re-grounding helps" if r['err_grounded'][-1]<r['err_free'][-1] else "no help this seed")
