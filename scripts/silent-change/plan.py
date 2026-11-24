#!/usr/bin/env python3
"""Silent-change calibration: the batch list and the job matrix (protocol 1, addendum 2).

The registered batches come from protocol.json (addendum_2.conditions_as_run); the pins file says
which file, temperature and system sentence each condition uses and how long a batch is planned to
take. Cutting batches into jobs changes which job runs a batch, never what a batch is.

    plan.py matrix [--scale N]    prints  matrix=<json>  for $GITHUB_OUTPUT
    plan.py list                  prints the expected batches, one trial id per line
Stdlib only.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import random
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import detector  # noqa: E402

PINS_PATH = detector.PROTOCOL_DIR / "calibration-pins.json"


def load_pins(path: Path = PINS_PATH) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def trial_id(cond: str, n: int) -> str:
    return "%s-%02d" % (cond, n)


def baseline_of(cond: str) -> str | None:
    """The baseline kind a condition is compared with; None for a baseline itself."""
    if cond in ("BASE", "BASE5"):
        return None
    return "BASE5" if cond == "C5" else "BASE"


RUNS = {"run1": "addendum_2", "run2": "addendum_3"}


def pool_size(protocol: dict, scale: int = 1) -> int:
    """Run 2: batches per baseline pool (20). A smoke run divides it, never below 3; it is never signed."""
    n = protocol["addendum_3"]["rule_2"]["baseline_pool"]["batches_per_pool"]
    return max(3, n // scale) if scale > 1 else n


def expected_batches(protocol: dict, scale: int = 1, run: str = "run1") -> list:
    """[{condition, trial_id, file}] for every registered batch. scale > 1 divides trial counts (smoke only)."""
    conds = protocol[RUNS[run]]["conditions_as_run"]
    out = []
    for cond, spec in conds.items():
        n = spec.get("trials", spec.get("batches", 1))
        if run == "run2" and cond in ("BASE", "BASE5"):
            n = pool_size(protocol, scale)
        elif scale > 1 and cond not in ("BASE", "BASE5"):
            n = max(1, n // scale)
        for i in range(1, n + 1):
            out.append({"condition": cond, "trial_id": trial_id(cond, i), "file": spec["file"]})
    return out


def shards_run2(protocol: dict, pins: dict, scale: int = 1) -> list:
    """Run 2: one batch per job (a job is the unit of independence), in a seeded shuffle so baseline and trials spread in time."""
    plan = pins["plan"]
    out = []
    for b in expected_batches(protocol, scale, "run2"):
        out.append({"shard": "r2-" + b["trial_id"].lower(), "file": b["file"],
                    "batches": b["condition"] + ":" + b["trial_id"], "n_batches": 1,
                    "planned_minutes": round(plan["est_seconds_per_batch"][b["file"]] / 60)})
    seed = int(hashlib.sha256((protocol["protocol_id"] + "run2-order").encode()).hexdigest()[:16], 16)
    random.Random(seed).shuffle(out)
    return out


def shards(protocol: dict, pins: dict, scale: int = 1, run: str = "run1") -> list:
    """Group by model file, then cut into jobs of equal size so each is planned near target_job_minutes."""
    if run == "run2":
        return shards_run2(protocol, pins, scale)
    plan = pins["plan"]
    per_job_budget = plan["target_job_minutes"] * 60
    by_file = {}
    for b in expected_batches(protocol, scale):
        by_file.setdefault(b["file"], []).append(b)
    out = []
    for f in sorted(by_file):
        batches = by_file[f]
        size = max(1, int(per_job_budget // plan["est_seconds_per_batch"][f]))
        n_jobs = math.ceil(len(batches) / size)
        each = math.ceil(len(batches) / n_jobs)  # equal-sized jobs
        for j in range(n_jobs):
            part = batches[j * each:(j + 1) * each]
            out.append({"shard": "%s-%02d" % (f, j + 1), "file": f,
                        "batches": ",".join(p["condition"] + ":" + p["trial_id"] for p in part),
                        "n_batches": len(part),
                        "planned_minutes": round(len(part) * plan["est_seconds_per_batch"][f] / 60)})
    return out


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    m = sub.add_parser("matrix")
    m.add_argument("--scale", type=int, default=1)
    m.add_argument("--run", choices=sorted(RUNS), default="run1")
    ls = sub.add_parser("list")
    ls.add_argument("--run", choices=sorted(RUNS), default="run1")
    a = ap.parse_args(argv)
    proto = detector.load_protocol()
    if a.cmd == "list":
        for b in expected_batches(proto, 1, a.run):
            print(b["trial_id"])
        return 0
    rows = shards(proto, load_pins(), max(1, a.scale), a.run)
    if len(rows) > 256:
        raise SystemExit("REFUSE: more than 256 jobs")
    print("matrix=" + json.dumps({"include": rows}, separators=(",", ":")))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
