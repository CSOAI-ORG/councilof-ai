"""sov33_rho_gate.py — the fusion GATE: measure error-correlation between brains and predict, BEFORE
spending on fusion, whether an ensemble will beat the best single brain.

Grounded in the co-failure ceiling (arXiv:2606.27288): fusion helps only when members are quality-matched
AND their errors are decorrelated. This harness measures both and returns a GO / NO-GO with the honest reason.

Inputs are per-brain predictions on a held-out set (any modality reduced to per-item error). No model loading
here — you pass in each brain's outputs, so it works for the real Qwen/DeepSeek/Bamba adapters or any stand-in.
"""
import numpy as np


def per_item_errors(preds, targets):
    """preds: (n_items,) or (n_items, d) model outputs; targets same shape. Returns (n_items,) error vector."""
    preds = np.asarray(preds, float); targets = np.asarray(targets, float)
    if preds.ndim == 1:
        return np.abs(preds - targets)
    return np.linalg.norm(preds - targets, axis=1)


def rho_matrix(err_by_brain):
    """err_by_brain: dict name->(n_items,) error vectors. Returns (names, correlation matrix of errors)."""
    names = list(err_by_brain)
    E = np.array([err_by_brain[n] for n in names])          # (n_brains, n_items)
    # Pearson correlation of the error vectors — the co-failure signal
    R = np.corrcoef(E)
    return names, R


def fusion_gate(err_by_brain, rule="median", weak_tol=0.5, rho_cut=0.6):
    """The GO / NO-GO gate — RULE-AWARE. Returns a verdict dict.
    Predicts whether the fused prediction under `rule` beats the best single brain.
    - decorrelation check: mean off-diagonal error-correlation below rho_cut (fusion needs failure diversity).
    - quality check depends on the aggregation rule:
        * mean:   ANY brain much worse than best (> weak_tol relative) drags the mean → veto.
        * median: only a MAJORITY of weak brains wins the vote and drags the median → veto only then
                  (a single weak brain is robustly outvoted; that's the whole point of the median rule).
    Fusion PREDICTED to help iff decorrelated AND the rule-aware quality check passes."""
    names, R = rho_matrix(err_by_brain)
    n = len(names)
    mean_err = {m: float(np.mean(err_by_brain[m])) for m in names}
    best = min(mean_err.values())
    # count "weak" brains: more than weak_tol worse than the best member
    weak = [m for m in names if (mean_err[m] - best) / (best + 1e-9) > weak_tol]
    n_weak = len(weak)
    if rule == "mean":
        quality_ok = (n_weak == 0)                 # mean is dragged by ANY weak member
        q_reason = f"{n_weak} weak brain(s); mean fusion is dragged by any weak member"
    else:                                          # median (and other robust rules)
        quality_ok = (n_weak < (n // 2 + 1))       # only a MAJORITY of weak brains wins the vote
        q_reason = f"{n_weak}/{n} weak brain(s); median vetoes only at a majority ({n//2+1})"
    off = R[np.triu_indices(n, k=1)] if n > 1 else np.array([0.0])
    mean_rho = float(np.mean(off))
    decorrelated = mean_rho < rho_cut
    go = bool(quality_ok and decorrelated)
    if go:
        reason = f"GO ({rule}): decorrelated (ρ̄ {mean_rho:.2f}<{rho_cut}) and quality OK ({q_reason})."
    elif not decorrelated:
        reason = f"NO-GO ({rule}): members too CORRELATED (ρ̄ {mean_rho:.2f}≥{rho_cut}) — they fail together, fusion is a net liability. Add a decorrelated (different-architecture) brain."
    else:
        reason = f"NO-GO ({rule}): quality — {q_reason}. Fix member quality first."
    return {"names": names, "rule": rule, "rho_matrix": R.tolist(), "mean_rho": mean_rho,
            "mean_err": mean_err, "n_weak": n_weak, "weak_brains": weak,
            "quality_ok": quality_ok, "decorrelated": decorrelated,
            "fusion_predicted_to_help": go, "reason": reason}


def actual_fusion_gain(err_by_brain, preds_by_brain, targets, rule="median"):
    """Ground-truth check: does the fused prediction ACTUALLY beat the best single brain? Returns the delta.
    This is what the gate is trying to PREDICT — used to validate the gate."""
    names = list(preds_by_brain)
    P = np.array([np.asarray(preds_by_brain[n], float) for n in names])   # (n_brains, n_items[, d])
    fused = np.median(P, axis=0) if rule == "median" else np.mean(P, axis=0)
    fused_err = float(np.mean(per_item_errors(fused, targets)))
    best_single = min(float(np.mean(err_by_brain[n])) for n in names)
    return {"fused_err": fused_err, "best_single_err": best_single,
            "fusion_beats_best": fused_err < best_single,
            "gain": best_single - fused_err}
