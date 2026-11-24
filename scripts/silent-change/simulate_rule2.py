#!/usr/bin/env python3
"""Synthetic simulation behind the expected false-flag rate and power in addendum 3 (rule 2).

    python3 -I simulate_rule2.py [repetitions]

Structure taken from the pilot: identical answers inside a batch (a batch's share of label A on an item is 0 or 1);
`hot` near-tie items take label A with probability 1/2 in each job; changes move whole items. 20 items, 20 pool
batches (one per job), one new batch. A FLAG is S(new; pool) > max leave-one-out score. This proves nothing about a
real model; it checks that the rule behaves as addendum 3 says it should in the structure the pilot showed.
"""
from __future__ import annotations

import random
import sys


def score(new: list, pool: list) -> float:
    n = len(pool)
    return sum(abs(new[i] - sum(b[i] for b in pool) / n) for i in range(len(new))) / len(new)


def batch(hot: int, flip: int, rng: random.Random, nitems: int = 20, pi: float = 0.5) -> list:
    s = [0.0] * nitems
    for i in range(hot):
        s[i] = 1.0 if rng.random() < pi else 0.0
    for j in range(flip):
        s[nitems - 1 - j] = 1.0 - s[nitems - 1 - j]
    return s


def flagged(hot: int, flip: int, n_pool: int, rng: random.Random) -> bool:
    pool = [batch(hot, 0, rng) for _ in range(n_pool)]
    theta = max(score(pool[j], pool[:j] + pool[j + 1:]) for j in range(n_pool))
    return score(batch(hot, flip, rng), pool) > theta + 1e-12


def rate(hot: int, flip: int, n_pool: int = 20, reps: int = 4000, seed: int = 1) -> float:
    rng = random.Random(seed)
    return sum(flagged(hot, flip, n_pool, rng) for _ in range(reps)) / reps


def main(argv=None) -> int:
    reps = int((argv or sys.argv[1:] or ["4000"])[0])
    print("20 pool batches, 20 items; rows: near-tie items; columns: items flipped in the new batch")
    print("%-9s %-12s %-12s %-14s %-14s" % ("near-tie", "0 (no change)", "1 item", "2 (C1-like)", "3 (C3-like)"))
    for hot in (0, 1, 2, 3, 5):
        print("%-9d %-12.4f %-12.4f %-14.4f %-14.4f" % ((hot,) + tuple(rate(hot, f, 20, reps) for f in (0, 1, 2, 3))))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
