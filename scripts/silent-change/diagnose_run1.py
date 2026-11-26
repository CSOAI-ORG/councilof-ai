#!/usr/bin/env python3
"""Reproduce the counts of docs/research/silent-change/DIAGNOSIS-RUN1.md from run 1's per-batch rows.

    python3 -I diagnose_run1.py <dir of downloaded artifacts: calibration-<shard>/batch-*.json, or a flat dir of batch-*.json>

Reads rows only; prints counts; writes nothing; scores nothing with the new rule. The job a batch ran in is the artifact
folder it came from (the rows themselves do not record it). Stdlib only.
"""
from __future__ import annotations

import collections
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import detector  # noqa: E402


def load(root: Path) -> tuple[dict, dict]:
    b, job = {}, {}
    for f in sorted(root.rglob("batch-*.json")):
        d = json.loads(f.read_text(encoding="utf-8"))
        tid = d.get("trial_id") or f.stem[len("batch-"):]
        b[tid] = d
        job[tid] = f.parent.name[len("calibration-"):] if f.parent.name.startswith("calibration-") else f.parent.name
    return b, job


def diagnose(b: dict, job: dict) -> dict:
    items = sorted(b["BASE-01"]["answers"])
    cond = lambda t: t.split("-")[0]  # noqa: E731
    out = {"batches": len(b), "items": len(items)}
    single = sum(1 for d in b.values() for i in items if len(set(d["answers"][i])) == 1)
    out["item_batches_with_one_answer_value"] = [single, len(b) * len(items)]
    base = b["BASE-01"]["answers"]
    c0 = sorted(t for t in b if cond(t) == "C0")
    per_trial = {t: (sum(1 for i in items if detector.tv_distance(base[i], b[t]["answers"][i]) > 0),
                     round(detector.statistic(base, b[t]["answers"])[0], 4)) for t in c0}
    out["c0_items_moved_vs_baseline_histogram"] = dict(collections.Counter(n for n, _ in per_trial.values()))
    moved = collections.Counter(i for t in c0 for i in items if detector.tv_distance(base[i], b[t]["answers"][i]) > 0)
    out["c0_items_that_ever_moved"] = dict(moved)
    by = collections.defaultdict(set)
    for t, d in b.items():
        for i in moved:
            by[(cond(t), job[t], i)].add(d["answers"][i][0])
    out["moving_item_answer_by_condition_and_job"] = {"%s | %s | %s" % k: sorted(v) for k, v in sorted(by.items())}
    jobs_of = collections.defaultdict(set)
    for t in b:
        jobs_of[cond(t)].add(job[t])
    out["jobs_per_condition"] = {c: len(j) for c, j in sorted(jobs_of.items())}
    for c in ("C0", "C1", "C2", "C3", "C4", "C5"):
        bt = "BASE5-01" if c == "C5" else "BASE-01"
        sets = collections.Counter(tuple(i for i in items if b[t]["answers"][i] != b[bt]["answers"][i])
                                   for t in sorted(b) if cond(t) == c)
        out["moved_item_sets_" + c] = [{"trials": n, "items": list(s)} for s, n in sets.most_common()]
    out["first_answers"] = dict(collections.Counter(d["answers"][i][0] for d in b.values() for i in items))
    out["max_transport_error_share"] = max(d["transport_error_share"] for d in b.values())
    return out


def main(argv=None) -> int:
    root = Path((argv or sys.argv[1:])[0])
    b, job = load(root)
    print(json.dumps(diagnose(b, job), indent=1, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
