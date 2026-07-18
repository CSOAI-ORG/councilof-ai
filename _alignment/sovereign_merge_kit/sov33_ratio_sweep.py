#!/usr/bin/env python3
"""sov33_ratio_sweep.py — AUTO-FIND the fluid pyramid's per-layer mixing % (Nick's "90/10 vs 50/50 —
test, work out what is good"). Extends Claude Science's fixed-schedule test into a real optimizer, and
tests whether a LOWER ratio lets a TALLER (12-layer) pyramid win — reconciling the "8 optimal" measurement
with Nick's 12-layer instinct.

HONEST SCOPE: same CPU numpy OWEM brains as the sibling harness — proves the RATIO LAW + the depth/ratio
trade, not LLM scale. Reproduces on the shared core (sov33_owem_v2_core).
"""
import numpy as np, sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sov33_fluid_pyramid import FluidPyramid, _data

def build(nus, Xtr, Ttr, hidden=8, epochs=60):
    p = FluidPyramid(Xtr.shape[1])
    for j, nu in enumerate(nus):
        p.grow(Xtr, Ttr, hidden=hidden, nu=nu, epochs=epochs, seed=j + 1)
    return p

def main():
    Xtr, Ttr, Xte, Tte = _data(dim=32)
    RES = {}

    # 1) GLOBAL constant-ratio x depth grid: does a lower ratio let a taller pyramid keep winning?
    grid = {}
    best = {"loss": 9, "nu": None, "depth": None}
    for nu in [1.0, 0.75, 0.5, 0.35, 0.2]:
        row = []
        for depth in range(1, 13):
            p = build([nu] * depth, Xtr, Ttr)
            l = round(p.loss(Xte, Tte), 4)
            row.append(l)
            if l < best["loss"]:
                best = {"loss": l, "nu": nu, "depth": depth}
        grid[f"nu={nu}"] = row
    RES["constant_ratio_x_depth_1to12"] = grid
    RES["global_best"] = best

    # 2) GREEDY per-layer ratio search at depth 8 (auto-find the non-uniform schedule)
    CANDS = [1.0, 0.75, 0.5, 0.35, 0.2, 0.1]
    schedule = []
    for layer in range(8):
        bl, bnu = 9, 1.0
        for nu in CANDS:
            p = build(schedule + [nu], Xtr, Ttr)
            l = p.loss(Xte, Tte)
            if l < bl:
                bl, bnu = l, nu
        schedule.append(bnu)
    greedy_loss = round(build(schedule, Xtr, Ttr).loss(Xte, Tte), 4)
    flat_loss = round(build([1.0] * 8, Xtr, Ttr).loss(Xte, Tte), 4)
    RES["greedy_per_layer_depth8"] = {
        "schedule": schedule, "greedy_loss": greedy_loss, "flat1.0_loss": flat_loss,
        "greedy_beats_flat": greedy_loss < flat_loss,
        "improvement_pct": round(100 * (flat_loss - greedy_loss) / flat_loss, 1),
    }

    # 3) The reconciliation: best-ratio 12-layer vs flat-1.0 8-layer (does taller+lower win?)
    tall = round(build([best["nu"]] * 12, Xtr, Ttr).loss(Xte, Tte), 4)
    short = round(build([1.0] * 8, Xtr, Ttr).loss(Xte, Tte), 4)
    RES["twelve_vs_eight"] = {
        "12layer@bestnu": tall, "nu": best["nu"], "8layer@flat1.0": short,
        "taller_lower_wins": tall < short,
        "verdict": ("Nick's 12-layer instinct VINDICATED under a lower mixing ratio"
                    if tall < short else "8-layer flat still wins on this data; 12 needs harder data or lower nu"),
    }

    json.dump(RES, open("ratio_sweep_results.json", "w"), indent=2)
    print(json.dumps(RES, indent=1))

if __name__ == "__main__":
    main()
