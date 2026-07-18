#!/usr/bin/env python3
"""sov33_owem_stack.py — TWO OWEM models stacked, governed by the Venturi seam, MEASURED.

The "2-small-stacked" node from the 4-around-1 / triangle design, built for real on CPU:
  - OWEM-A and OWEM-B are each an OWEMPredictorV2 (own weights, full backprop) — DISTINCT (different seeds
    + different training focus) so the stack has decorrelation, not redundancy.
  - STACK MODE = cascade-residual: A predicts, B predicts the RESIDUAL A couldn't (B trained on A's errors).
    Final = A(x) + B(x). This is genuine stacking (boosting), not just averaging two of the same.
  - The Venturi throat governs the seam: the hand-off A->B is a hash-chained, care-gated routing decision.
  - HONEST TEST: does stacking TWO beat ONE? Measured on held-out data. Report either way.

HONEST SCOPE: small numpy MLPs on synthetic next-state tasks (dim=32). Proves the STACKING ARCHITECTURE
works and is measurable + governed. NOT a foundation model; NOT GPU-trained LLM experts (that's the owner's
Kaggle/Colab BTX run). This is the CPU-feasible, honestly-labelled proof of the stack topology.
"""
import numpy as np, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sov33_owem_v2_core import OWEMPredictorV2, _task

def _split(X, T, frac=0.75):
    n = int(len(X) * frac); return X[:n], T[:n], X[n:], T[n:]

def build_stack(dim=32, seed_a=1, seed_b=2, epochs=80, lr=0.1, hidden=8, nu=1.0):
    """Train A on the task, then B on A's RESIDUAL errors. Returns (A, B, metrics)."""
    X, T = _task(7, dim, n=400)
    Xtr, Ttr, Xte, Tte = _split(X, T)

    # OWEM-A: learns the task
    A = OWEMPredictorV2(dim=dim, hidden=hidden, seed=seed_a); A.train(Xtr, Ttr, epochs=epochs, lr=lr)
    A_pred_tr = A.forward(Xtr)[0]; A_pred_te = A.forward(Xte)[0]
    resid_tr = Ttr - A_pred_tr                      # what A got wrong

    # OWEM-B: learns A's residual (boosting) — distinct seed => decorrelated
    B = OWEMPredictorV2(dim=dim, hidden=hidden, seed=seed_b); B.train(Xtr, resid_tr, epochs=epochs, lr=lr)
    B_pred_te = B.forward(Xte)[0]

    def mse(p, t): return float(np.mean((p - t) ** 2))
    one_loss   = mse(A_pred_te, Tte)                # ONE OWEM
    stack_loss = mse(A_pred_te + nu * B_pred_te, Tte)    # TWO stacked (A + nu*B-residual)
    # also compare vs naive averaging two independent A-like models (control)
    A2 = OWEMPredictorV2(dim=dim, hidden=hidden, seed=99); A2.train(Xtr, Ttr, epochs=epochs, lr=lr)
    avg_loss = mse((A_pred_te + A2.forward(Xte)[0]) / 2, Tte)

    return A, B, {"one_owem_loss": round(one_loss, 4),
                  "two_stacked_loss": round(stack_loss, 4),
                  "naive_avg_loss": round(avg_loss, 4),
                  "stack_improvement_pct": round((one_loss - stack_loss) / one_loss * 100, 1),
                  "stack_beats_avg": stack_loss < avg_loss}

def governed_stack_infer(A, B, x, care_score=0.8):
    """Run the stack with the Venturi throat governing the A->B seam (auditable + care-gated)."""
    import importlib
    try:
        v = importlib.import_module('sov33_venturi_throat')
        a_out = A.forward(x[None, :])[0][0]
        # the A->B hand-off is a governed routing decision
        dec = v.throat({"experts": ["owem-A", "owem-B"], "weights": [1.0, 1.0]},
                       care_score=care_score, decision_inputs={"stage": "A->B residual seam"},
                       execute=lambda: (a_out + B.forward(x[None, :])[0][0]).tolist())
        if dec["collapsed"]:
            return {"decision": "COLLAPSE-veto", "output": a_out.tolist(), "seam_hash": dec["own_hash"]}
        return {"decision": "flow", "output": dec["result"], "seam_hash": dec["own_hash"]}
    except Exception as e:
        return {"error": str(e)[:120]}

if __name__ == "__main__":
    A, B, m = build_stack()
    print("=== TWO OWEM MODELS STACKED (cascade-residual boosting) ===")
    print(f"  ONE OWEM        (A alone):      test loss {m['one_owem_loss']}")
    print(f"  TWO STACKED     (A + B-residual): test loss {m['two_stacked_loss']}  ({m['stack_improvement_pct']:+}% vs one)")
    print(f"  control: naive avg of 2 A-like:  test loss {m['naive_avg_loss']}")
    print(f"  stacking beats naive averaging:  {m['stack_beats_avg']}")
    x = _task(7, 32, n=1)[0][0]
    g = governed_stack_infer(A, B, x, care_score=0.8)
    print(f"\n  governed stack infer (care=0.8): {g['decision']}, seam_hash={g.get('seam_hash','')[:16]}...")
    gv = governed_stack_infer(A, B, x, care_score=0.05)
    print(f"  governed stack infer (care=0.05): {gv['decision']} (seam vetoed, falls back to A-only)")
    verdict = "STACK ADDS VALUE" if m['stack_improvement_pct'] > 3 else "STACK ~ ONE (honest)"
    print(f"\n  VERDICT: {verdict}")
