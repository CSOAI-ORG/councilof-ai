#!/usr/bin/env python3
"""sov33_quantum_mirror.py — the "quantum mirror": N-version divergence auditor. MEASURED.

Nick's "quantum mirror" made real and honest: run the same input through TWO decorrelated mirror models,
and the DIVERGENCE between them is the uncertainty/fault signal — mirrors AGREE => confident, mirrors DIVERGE
=> escalate/veto. This is the classic N-version programming fault detector, composed with the Venturi throat.

HONEST LABEL: NOT literal quantum, NOT wavefunction collapse. "Quantum mirror" = design metaphor. The real
mechanism is mirror-divergence as a calibrated uncertainty signal (a known, sound technique). The value: a
system that KNOWS when it might be wrong (high divergence) and escalates, rather than confidently erroring.

THE TEST THAT MATTERS: does divergence actually predict error? If high-divergence samples really are the
high-error ones, the mirror is a useful auditor. If not, it's theatre. Measured below.
"""
import numpy as np, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sov33_pyramid_4brain import Pyramid4Brain
from sov33_owem_v2_core import _task

def _data(dim=32,n=500,seed=7):
    X,T=_task(seed,dim,n=n); k=int(n*0.7); return X[:k],T[:k],X[k:],T[k:]

def measure(dim=32, depth=4):
    Xtr,Ttr,Xte,Tte=_data(dim)
    # two MIRROR pyramids: same architecture, different seeds => decorrelated
    m1=Pyramid4Brain(dim); m2=Pyramid4Brain(dim)
    for _ in range(depth): m1.grow(Xtr,Ttr)
    # mirror 2 uses a reshuffled training order (decorrelation) — same data, different path
    idx=np.random.default_rng(123).permutation(len(Xtr))
    for _ in range(depth): m2.grow(Xtr[idx],Ttr[idx])

    p1=m1.predict(Xte); p2=m2.predict(Xte)
    divergence=np.mean((p1-p2)**2, axis=1)                 # per-sample mirror disagreement
    consensus=(p1+p2)/2
    error=np.mean((consensus-Tte)**2, axis=1)             # per-sample true error

    # KEY: does divergence predict error? (correlation + does escalating high-divergence cut error?)
    corr=float(np.corrcoef(divergence, error)[0,1])
    # escalation: flag the top-20% most-divergent as "uncertain/escalate"; measure error on kept vs flagged
    thr=np.quantile(divergence,0.8)
    kept=divergence<=thr; flagged=~kept
    err_kept=float(error[kept].mean()); err_flagged=float(error[flagged].mean())
    return {"dim":dim,"depth":depth,
            "divergence_error_corr":round(corr,3),
            "err_confident_80pct":round(err_kept,4),
            "err_flagged_top20pct_divergent":round(err_flagged,4),
            "flagged_are_Nx_worse":round(err_flagged/max(1e-9,err_kept),2),
            "mirror_is_useful_auditor": corr>0.2 and err_flagged>err_kept}

if __name__=="__main__":
    r=measure()
    print("=== QUANTUM MIRROR (mirror-divergence auditor) — does divergence predict error? ===\n")
    print(f"  correlation(divergence, true error): {r['divergence_error_corr']}  (>0 means divergence flags error)")
    print(f"  error on the CONFIDENT 80% (mirrors agree):        {r['err_confident_80pct']}")
    print(f"  error on the FLAGGED top-20% (mirrors diverge):    {r['err_flagged_top20pct_divergent']}")
    print(f"  => flagged samples are {r['flagged_are_Nx_worse']}x worse than confident ones")
    print(f"\n  VERDICT: {'MIRROR IS A USEFUL AUDITOR (divergence predicts error -> escalate high-divergence)' if r['mirror_is_useful_auditor'] else 'mirror not predictive here — honest'}")
    print("  HONEST: 'quantum mirror' = metaphor; mechanism = N-version divergence (real, not literal quantum)")
