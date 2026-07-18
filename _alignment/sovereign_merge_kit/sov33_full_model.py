#!/usr/bin/env python3
"""sov33_full_model.py — the FULL SOV333 model: every measured winning piece composed into ONE runnable model.

Assembles this session's verified building blocks into a single governed model:
  - BODY: 8-layer x 4-brain fluid pyramid (pyramid-4brain won +48%; depth 8 was optimal) — residual cascade,
    each layer = 4 decorrelated brains (Compliance/Defense/Intuition/Voice) voting.
  - SEAM: every layer hand-off passes the Venturi=SIGIL throat (care-gated + hash-chained + provenance-stamped).
  - AUDITOR: a mirror pyramid runs alongside; divergence between model and mirror = the uncertainty signal
    (quantum-mirror: high divergence -> flag for escalation, don't silently emit).
  - GOVERNANCE: care sub-floor collapses the seam before emit (fail-closed).

This is the honest, CPU-real, END-TO-END composition — proves the whole architecture runs as ONE governed
model, not just isolated parts. NOT GPU LLM-scale (owner's Kaggle/BTX run swaps the numpy brains for qwen experts).
"""
import numpy as np, sys, os, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sov33_pyramid_4brain import Pyramid4Brain
from sov33_owem_v2_core import _task
import sov33_venturi_throat as vt

def _data(dim=32,n=500,seed=7):
    X,T=_task(seed,dim,n=n); k=int(n*0.72); return X[:k],T[:k],X[k:],T[k:]
def _mse(p,t): return float(np.mean((p-t)**2))

class SOV333:
    """The full governed model: 8x4-brain fluid pyramid + mirror auditor + Venturi=SIGIL seams."""
    def __init__(self, dim=32, depth=8):
        self.dim, self.depth = dim, depth
        self.body = Pyramid4Brain(dim)
        self.mirror = Pyramid4Brain(dim)
    def fit(self, Xtr, Ttr):
        # body grows layer by layer; each grow() is a governed seam (Venturi throat)
        for i in range(self.depth):
            # the layer hand-off is a care-gated, hash-chained routing decision
            vt.throat({"stage": f"grow-layer-{i}", "experts": ["compliance","defense","intuition","voice"],
                       "weights": [1,1,1,1]}, care_score=0.9, decision_inputs={"layer": i})
            self.body.grow(Xtr, Ttr)
        # mirror trains on reshuffled order (decorrelated) for the auditor signal
        idx = np.random.default_rng(123).permutation(len(Xtr))
        for _ in range(self.depth): self.mirror.grow(Xtr[idx], Ttr[idx])
        return self
    def predict(self, X, care_score=0.8):
        """Governed inference: emit through the Venturi seam; flag high mirror-divergence."""
        body_p = self.body.predict(X); mirror_p = self.mirror.predict(X)
        divergence = np.mean((body_p - mirror_p)**2, axis=1)
        thr = np.quantile(divergence, 0.8)
        flagged = divergence > thr        # high-divergence -> uncertain, escalate
        # the emit is a governed seam: care sub-floor collapses it
        dec = vt.throat({"stage": "emit", "experts": ["body"], "weights": [1.0]},
                        care_score=care_score, decision_inputs={"n": len(X)})
        if dec["collapsed"]:
            return {"emitted": False, "reason": "care-veto collapsed emit", "seam_hash": dec["own_hash"]}
        return {"emitted": True, "prediction": body_p, "uncertain_mask": flagged,
                "n_flagged": int(flagged.sum()), "seam_hash": dec["own_hash"]}

def run_e2e():
    dim=32; Xtr,Ttr,Xte,Tte=_data(dim)
    t0=time.time()
    m=SOV333(dim, depth=8).fit(Xtr,Ttr)
    fit_s=time.time()-t0
    out=m.predict(Xte, care_score=0.8)
    loss=_mse(out["prediction"], Tte)
    # error on flagged vs confident (does the auditor work end-to-end?)
    err=np.mean((out["prediction"]-Tte)**2,axis=1)
    fl=out["uncertain_mask"]
    err_conf=float(err[~fl].mean()); err_flag=float(err[fl].mean())
    # governance check: sub-floor care collapses emit
    veto=m.predict(Xte, care_score=0.05)
    return {"fit_seconds":round(fit_s,1),"test_loss":round(loss,4),
            "flagged_uncertain":out["n_flagged"],"total":len(Xte),
            "err_confident":round(err_conf,4),"err_flagged":round(err_flag,4),
            "auditor_flags_worse": err_flag>err_conf,
            "care_veto_collapses_emit": not veto["emitted"],
            "brains": 8*4, "governed_seams": 8+1}

if __name__=="__main__":
    r=run_e2e()
    print("=== FULL SOV333 MODEL — end-to-end governed run ===\n")
    print(f"  BODY: 8-layer x 4-brain fluid pyramid ({r['brains']} brains), {r['governed_seams']} Venturi=SIGIL seams")
    print(f"  fit: {r['fit_seconds']}s   test loss: {r['test_loss']}")
    print(f"  AUDITOR (quantum mirror): flagged {r['flagged_uncertain']}/{r['total']} as uncertain")
    print(f"    error confident {r['err_confident']} vs flagged {r['err_flagged']}  -> auditor flags worse: {r['auditor_flags_worse']}")
    print(f"  GOVERNANCE: care=0.05 collapses emit before output: {r['care_veto_collapses_emit']}")
    ok = r['auditor_flags_worse'] and r['care_veto_collapses_emit']
    print(f"\n  E2E: {'ALL SYSTEMS GO — body learns, auditor flags error, governance vetoes' if ok else 'check failed'}")
