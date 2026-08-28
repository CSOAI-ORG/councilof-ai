#!/usr/bin/env python3
"""gate_sim.py — Monte Carlo operating characteristics of the FAIR TIES gate
(pairwise exact McNemar + Benjamini-Hochberg). Results (seed 42, 2026-08-26):
FPR single-pair 2.6-3.7%; familywise (21 pairs, BH) 3.0-4.5%.
TRP: n=30 -> 8-14% (p=0.6-0.65); n=66 -> 15-36%; n=237 -> 55-90%.
Power >= 80% requires delta >= 0.15 at n >= 200 (approx).
Honest reading: TIE = "cannot separate"; absent evidence is not evidence of absence.
"""
import random
from math import comb

def exact_mcnemar(b, c):
    n = b + c
    if n == 0:
        return 1.0
    k = min(b, c)
    return min(sum(comb(n, i) for i in range(k + 1)) * (0.5 ** n) * 2, 1.0)

def bh_any(ps):
    m = len(ps)
    return any(p <= 0.05 * (i + 1) / m for i, p in enumerate(sorted(ps)))

if __name__ == "__main__":
    random.seed(42)
    print("single-pair TPR: n x p_opp")
    for n in (30, 66, 237):
        row = []
        for pt in (0.5, 0.55, 0.6, 0.65):
            hits = sum(
                exact_mcnemar(
                    sum(1 for i in range(n) if (l := random.random() < 0.5) and not (o := random.random() < pt)),
                    sum(1 for i in range(n) if (o := random.random() < pt) and not (l := random.random() < 0.5)),
                ) < 0.05
                for _ in range(1500)
            )
            row.append(f"p={pt}:{hits/1500:.3f}")
        print(f"  n={n}: " + " ".join(row))
    print("familywise FPR (21 tied pairs, BH):")
    for n in (30, 66, 237):
        hits = 0
        for _ in range(400):
            ps = []
            for _ in range(21):
                a = [random.random() < 0.5 for _ in range(n)]
                b = [random.random() < 0.5 for _ in range(n)]
                ps.append(exact_mcnemar(sum(1 for i in range(n) if a[i] and not b[i]),
                                        sum(1 for i in range(n) if b[i] and not a[i])))
            if bh_any(ps):
                hits += 1
        print(f"  n={n}: {hits/400:.3f}")
