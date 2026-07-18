#!/usr/bin/env python3
"""sov33_mirror_auditor.py — the MIRROR AUDITOR as a MEASURED mechanism (not a flag stub).
A 2nd decorrelated stack predicts alongside the main one; per-item DIVERGENCE between them is the
uncertainty signal. Test the two real claims: (1) does divergence CORRELATE with actual error?
(2) does ESCALATING the high-divergence items to a bigger model REDUCE total loss?

HONEST SCOPE: CPU numpy brains. Proves the auditor MECHANISM (divergence→escalate) works and by how much,
not LLM scale. If escalation doesn't help, it says so.
"""
import numpy as np, sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sov33_pyramid_4brain import Pyramid4Brain, _data, _mse
from sov33_owem_v2_core import OWEMPredictorV2

def build_pyramid(Xtr, Ttr, depth=8, hidden=8, seed0=0):
    p = Pyramid4Brain(dim=Xtr.shape[1], hidden=hidden)
    # decorrelate by offsetting the base seed of the 4-brain layers
    for L in range(depth):
        # reuse grow but shift seeds via a fresh FourBrainLayer through the module's grow (seed=len(layers))
        p.grow(Xtr, Ttr)
    return p

def main():
    Xtr, Ttr, Xte, Tte = _data(dim=32)
    main_p = Pyramid4Brain(dim=32);
    mirror = Pyramid4Brain(dim=32)
    # main + mirror both 8-layer 4-brain, but mirror's brains use different seeds (base_seed offset via order)
    for _ in range(8): main_p.grow(Xtr, Ttr)
    # decorrelate mirror: train on a bootstrap resample so it genuinely differs
    rng = np.random.default_rng(999); idx = rng.integers(0, len(Xtr), len(Xtr))
    for _ in range(8): mirror.grow(Xtr[idx], Ttr[idx])

    pm = main_p.predict(Xte); pr = mirror.predict(Xte)
    err = np.mean((pm - Tte) ** 2, axis=1)                 # true per-item error of main
    div = np.mean((pm - pr) ** 2, axis=1)                  # main-vs-mirror divergence (the signal)
    corr = float(np.corrcoef(div, err)[0, 1])

    # (2) escalation: flag top-25% divergence, replace those preds with a BIGGER model's preds
    big = OWEMPredictorV2(dim=32, hidden=32, seed=7); big.train(Xtr, Ttr, epochs=120, lr=0.1)
    pbig = big.forward(Xte)[0]
    k = int(0.25 * len(Xte)); flag = np.argsort(-div)[:k]
    escalated = pm.copy(); escalated[flag] = pbig[flag]

    base_loss = round(_mse(pm, Tte), 4)
    esc_loss = round(_mse(escalated, Tte), 4)
    # control: escalate 25% RANDOM items (does targeting by divergence beat random?)
    rnd = rng.choice(len(Xte), k, replace=False); esc_rand = pm.copy(); esc_rand[rnd] = pbig[rnd]
    rand_loss = round(_mse(esc_rand, Tte), 4)

    out = {"divergence_error_corr": round(corr, 3),
           "corr_is_signal": corr > 0.2,
           "base_loss_no_escalation": base_loss,
           "loss_escalate_top25pct_divergence": esc_loss,
           "loss_escalate_25pct_RANDOM_control": rand_loss,
           "escalation_helps": esc_loss < base_loss,
           "targeting_beats_random": esc_loss < rand_loss,
           "improvement_pct": round(100 * (base_loss - esc_loss) / base_loss, 1),
           "honest": "CPU brains. Proves divergence→escalate mechanism + whether targeting by divergence beats random. Not LLM scale."}
    json.dump(out, open("mirror_auditor_results.json", "w"), indent=2)
    print("=== MIRROR AUDITOR — measured escalation mechanism ===\n")
    print(f"divergence↔error correlation : {out['divergence_error_corr']}  ({'SIGNAL' if out['corr_is_signal'] else 'weak'})")
    print(f"loss no-escalation           : {base_loss}")
    print(f"loss escalate top-25% diverg : {esc_loss}  ({out['improvement_pct']:+}%)")
    print(f"loss escalate 25% RANDOM     : {rand_loss}  (control)")
    print(f"\nescalation helps: {out['escalation_helps']}   targeting beats random: {out['targeting_beats_random']}")

if __name__ == "__main__":
    main()
