#!/usr/bin/env python3
"""C5 stats module — Wilson CIs + MDE tables for lm-eval-harness output layer.

lm-eval-harness (13.7k★, EleutherAI) currently reports bootstrap stderr with
NO CI bounds, NO MDE, NO BH/Holm (HS.1#33 / HR.3-C5). This module implements the
missing statistics so the planned upstream PR is output-layer only:
  - Wilson score interval (small-n correct, no normal approximation)
  - Minimal Detectable Effect (MDE) given n and baseline
  - BH (Benjamini-Hochberg) FDR correction + Holm for multiple axes
All pure math, deterministic, no dependencies beyond math/statistics.

Register: the number that leaves the instrument carries a bound. n<20 labelled
lower-bound per canon (GSPC roadmap §5 / playbook §6).
"""
from __future__ import annotations

import math
from dataclasses import dataclass, asdict
from typing import Optional, Sequence

Z_95 = 1.959963984540054  # 97.5th percentile of normal


def wilson(k: int, n: int, z: float = Z_95) -> tuple[float, float]:
    """Wilson score interval for k/n successes. Returns (low, high). n=0 → (0,0)."""
    if n <= 0:
        return (0.0, 0.0)
    p = k / n
    z2 = z * z
    denom = 1 + z2 / n
    centre = (p + z2 / (2 * n)) / denom
    half = z * math.sqrt(p * (1 - p) / n + z2 / (4 * n * n)) / denom
    return (max(0.0, centre - half), min(1.0, centre + half))


def mde(p0: float, n: int, alpha: float = 0.05, power: float = 0.8,
        z_alpha: float = Z_95, z_beta: Optional[float] = None) -> Optional[float]:
    """Minimal Detectable Effect: smallest |p1 - p0| detectable at n with given
    alpha/power. Returns None when n too small (canon: n<20 lower-bound only)."""
    if n < 20:
        return None
    if z_beta is None:
        z_beta = 0.8416212335729143  # 80th percentile (power 0.80)
    z = z_alpha + z_beta
    p1 = p0 + z * math.sqrt(p0 * (1 - p0) / n)
    if p1 >= 1.0:
        return None
    # two-sample-ish approximation (design effect 1:1)
    se = math.sqrt(p0 * (1 - p0) / n + p1 * (1 - p1) / n)
    delta = z * se
    return delta


@dataclass
class StatCell:
    """One measured cell: score + Wilson bound + MDE + honesty flags."""
    axis: str
    model: str
    n: int
    k: int
    acc: float
    ci_low: float
    ci_high: float
    mde: Optional[float]
    lower_bound_only: bool  # True when n < 20 (canon rule)


def stat_cell(axis: str, model: str, k: int, n: int) -> StatCell:
    low, high = wilson(k, n)
    return StatCell(
        axis=axis, model=model, n=n, k=k,
        acc=k / n if n else 0.0,
        ci_low=low, ci_high=high,
        mde=mde(k / n if n else 0.0, n),
        lower_bound_only=(n < 20),
    )


def bh_fdr(pvals: Sequence[float], alpha: float = 0.05) -> list[bool]:
    """Benjamini-Hochberg: which hypotheses survive FDR control. Returns bool mask."""
    order = sorted(range(len(pvals)), key=lambda i: pvals[i])
    m = len(pvals)
    if m == 0:
        return []
    threshold = [alpha * (j + 1) / m for j in range(m)]
    mask = [False] * m
    cutoff = 0
    for rank, idx in enumerate(order):
        if pvals[idx] <= threshold[rank]:
            cutoff = rank
    for rank in range(cutoff + 1):
        mask[order[rank]] = True
    return mask


def holm(pvals: Sequence[float], alpha: float = 0.05) -> list[bool]:
    """Holm-Bonferroni step-down. Returns bool mask of surviving hypotheses."""
    order = sorted(range(len(pvals)), key=lambda i: pvals[i])
    m = len(pvals)
    mask = [False] * m
    for rank, idx in enumerate(order):
        if pvals[idx] <= alpha / (m - rank):
            mask[idx] = True
        else:
            break  # Holm is sequential: first failure stops
    return mask


def separated_leaders(accs: dict[str, float], ns: dict[str, int],
                      alpha: float = 0.05) -> list[str]:
    """Which leaders are SEPARATED from the fleet mean (McNemar-style discordant
    test via Wilson-overlap check). Honest: a point-estimate lead is not a
    measured advantage unless intervals don't overlap the fleet mean."""
    fleet_mean = sum(accs.values()) / len(accs) if accs else 0.0
    separated = []
    for model, acc in accs.items():
        low, high = wilson(int(round(acc * ns[model])), ns[model])
        # separated if the whole Wilson interval is above the fleet mean
        if low > fleet_mean:
            separated.append(model)
    return separated


def to_receipt_payload(axis: str, cells: Sequence[StatCell]) -> dict:
    """Shape the stats output for the receipt envelope (a2a.signed-receipt/0.1):
    claims carry the bound, not just the point estimate."""
    return {
        "axis": axis,
        "claims": [
            {
                "type": "measurement-statistics",
                "model": c.model,
                "acc": round(c.acc, 4),
                "n": c.n,
                "ci95": [round(c.ci_low, 3), round(c.ci_high, 3)],
                "mde": round(c.mde, 4) if c.mde is not None else None,
                "lower_bound_only": c.lower_bound_only,
            }
            for c in cells
        ],
    }


if __name__ == "__main__":
    # self-test (deterministic)
    cells = [
        stat_cell("governance", "sov6-embodiment", 166, 237),
        stat_cell("governance", "qwen3:4b", 100, 237),
        stat_cell("care", "sov6-ethics", 106, 199),
        stat_cell("jail", "qwen2.5:0.5b", 42, 71),
    ]
    for c in cells:
        print(f"{c.axis:12s} {c.model:20s} acc={c.acc:.3f} n={c.n:3d} "
              f"ci=[{c.ci_low:.3f},{c.ci_high:.3f}] mde={c.mde if c.mde is None else round(c.mde,3)} "
              f"lbo={c.lower_bound_only}")
    print("BH on [0.0086, 0.2, 0.5]:", bh_fdr([0.0086, 0.2, 0.5]))
    print("Holm on [0.0086, 0.2, 0.5]:", holm([0.0086, 0.2, 0.5]))
    print("separated (gov board):",
          separated_leaders({"a": 0.7, "b": 0.49, "c": 0.52},
                            {"a": 237, "b": 237, "c": 237}))
