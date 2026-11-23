#!/usr/bin/env python3
"""Silent-change detector: the comparison (protocol 1, docs/research/silent-change/PROTOCOL.md).

Stdlib only. Every parameter is read from protocol.json, the pre-registered file; nothing here
is tuned after data. A "batch" is {item_id: [answer, ...K]}. Two batches of the same items are
compared with a within-item permutation test on mean total-variation distance.

A flag means: the answer distribution on the probe items moved against the baseline by more
than the model's own rerun spread. It is not a cause and not a verdict.
"""
from __future__ import annotations

import hashlib
import json
import math
import random
from collections import Counter
from pathlib import Path

HERE = Path(__file__).resolve().parent
PROTOCOL_DIR = HERE.parent.parent / "docs" / "research" / "silent-change"
PROTOCOL_PATH = PROTOCOL_DIR / "protocol.json"
PROTOCOL_MD_PATH = PROTOCOL_DIR / "PROTOCOL.md"
HARNESS_VERSION = "silent-change-detector-v1"


def load_protocol(path: Path = PROTOCOL_PATH) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def protocol_sha256() -> dict:
    """sha256 of both protocol files, written into every record."""
    return {
        "protocol_json": hashlib.sha256(PROTOCOL_PATH.read_bytes()).hexdigest(),
        "protocol_md": hashlib.sha256(PROTOCOL_MD_PATH.read_bytes()).hexdigest(),
    }


def seed_for(protocol_id: str, comparison_id: str) -> int:
    return int(hashlib.sha256((protocol_id + comparison_id).encode("utf-8")).hexdigest()[:16], 16)


def tv_distance(a: list, b: list) -> float:
    ca, cb = Counter(a), Counter(b)
    na, nb = len(a), len(b)
    cats = set(ca) | set(cb)
    return 0.5 * sum(abs(ca[c] / na - cb[c] / nb) for c in cats)


def statistic(base: dict, new: dict) -> tuple[float, dict]:
    per_item = {i: tv_distance(base[i], new[i]) for i in sorted(base)}
    return sum(per_item.values()) / len(per_item), per_item


def check_comparable(base: dict, new: dict, k: int) -> str | None:
    """None when the two batches may be compared, else the reason they may not."""
    if not base or set(base) != set(new):
        return "item sets differ"
    for i in base:
        if len(base[i]) != k or len(new[i]) != k:
            return "repeat count is not the registered K for item " + i
    return None


def compare(base: dict, new: dict, comparison_id: str, protocol: dict | None = None,
            permutations: int | None = None) -> dict:
    p = protocol or load_protocol()
    k = p["repeats_k"]
    b = permutations or p["statistic"]["permutations_b"]
    alpha, floor = p["flag_rule"]["alpha"], p["flag_rule"]["t_floor"]
    why = check_comparable(base, new, k)
    if why:
        return {"state": "INCOMPARABLE", "reason": why, "comparison_id": comparison_id}
    t_obs, per_item = statistic(base, new)
    rng = random.Random(seed_for(p["protocol_id"], comparison_id))
    pooled = {i: base[i] + new[i] for i in sorted(base)}
    ge = 0
    for _ in range(b):
        t_sum = 0.0
        for i, pool in pooled.items():
            rng.shuffle(pool)
            t_sum += tv_distance(pool[:k], pool[k:])
        if t_sum / len(pooled) >= t_obs - 1e-12:
            ge += 1
    p_value = (1 + ge) / (1 + b)
    flag = p_value <= alpha and t_obs >= floor
    return {
        "state": "FLAG" if flag else "NO_FLAG",
        "comparison_id": comparison_id,
        "T": round(t_obs, 6),
        "p_value": round(p_value, 6),
        "alpha": alpha,
        "t_floor": floor,
        "permutations": b,
        "k": k,
        "n_items": len(base),
        "per_item_tv": {i: round(v, 4) for i, v in per_item.items()},
        "says": "behaviour on the probe items moved against the baseline by more than rerun spread"
                if flag else "no movement beyond rerun spread was seen on the probe items",
        "does_not_say": "why it moved, whether it matters, or anything about items outside the probe set",
    }


def wilson(k: int, n: int, z: float = 1.959963984540054) -> list:
    if n <= 0:
        return [None, None]
    ph = k / n
    d = 1 + z * z / n
    c = (ph + z * z / (2 * n)) / d
    h = z * math.sqrt(ph * (1 - ph) / n + z * z / (4 * n * n)) / d
    return [round(max(0.0, c - h), 4), round(min(1.0, c + h), 4)]


def calibration_rates(results: dict) -> dict:
    """results: {condition: [compare() outputs]} -> flags/trials, Wilson 95%, mean T per condition.

    C0 is the false-flag rate; the others are detection rates. An INCOMPARABLE trial is counted
    in 'incomparable' and left out of the denominator, never silently dropped.
    """
    out = {}
    for cond, trials in sorted(results.items()):
        ok = [t for t in trials if t.get("state") in ("FLAG", "NO_FLAG")]
        flags = sum(1 for t in ok if t["state"] == "FLAG")
        out[cond] = {
            "trials": len(ok), "flags": flags, "rate": round(flags / len(ok), 4) if ok else None,
            "wilson95": wilson(flags, len(ok)),
            "mean_T": round(sum(t["T"] for t in ok) / len(ok), 4) if ok else None,
            "incomparable": len(trials) - len(ok),
            "role": "false-flag rate" if cond == "C0" else "detection rate",
        }
    return out
