#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Read-only, exact-byte METR v1.1 pairing audit; not a new benchmark or inference."""
import argparse
import collections
import hashlib
import json
import math
from pathlib import Path

def unique_pairs(pairs):
    out = {}
    for key, val in pairs:
        if key in out:
            raise ValueError("duplicate JSON key")
        out[key] = val
    return out

def audit(raw, expected_sha256, model="o3_inspect"):
    if len(raw) > 40_000_000 or hashlib.sha256(raw).hexdigest() != expected_sha256:
        raise ValueError("source size or digest mismatch")
    rows = []
    run_ids = set()
    for line in raw.splitlines():
        if not line.strip():
            continue
        r = json.loads(line, object_pairs_hook=unique_pairs)
        if not isinstance(r, dict):
            raise ValueError("invalid row")
        for k in ("task_id", "model", "human_source"):
            if not isinstance(r.get(k), str) or not r[k].strip():
                raise ValueError("missing identity")
        if "task_version" not in r:
            raise ValueError("task version field absent; use null for unknown")
        v = r["task_version"]
        if v is not None and (not isinstance(v, str) or not v.strip()):
            raise ValueError("invalid task version")
        rid = r.get("run_id")
        if type(rid) not in (int, str) or rid == "" or rid in run_ids:
            raise ValueError("missing or duplicate run identity")
        run_ids.add(rid)
        if type(r.get("score_binarized")) not in (int, float) or r["score_binarized"] not in (0, 1):
            raise ValueError("invalid binary score")
        tm = r.get("human_minutes")
        if type(tm) not in (int, float) or not math.isfinite(tm) or tm <= 0:
            raise ValueError("invalid reference duration")
        rows.append(r)
    if not rows:
        raise ValueError("empty source")
    humans = [r for r in rows if r["model"] == "human" and r["human_source"] == "baseline"]
    models = [r for r in rows if r["model"] == model and model != "human"]
    if not humans or not models:
        state = "UNCHECKABLE_MISSING_COMPARATOR"
    else:
        state = None
    common = {r["task_id"] for r in humans} & {r["task_id"] for r in models}
    def version_keys(rs):
        return {(r["task_id"], r["task_version"]) for r in rs if r["task_version"] is not None}
    exact = version_keys(humans) & version_keys(models)
    return {
        "schema": "csoai.metr-pairing-source-audit/0.1",
        "source_sha256": expected_sha256, "rows": len(rows),
        "human_baseline_rows": len(humans),
        "human_estimate_rows_excluded": sum(r["model"] == "human" and r["human_source"] == "estimate" for r in rows),
        "model": model, "model_rows": len(models),
        "model_fatal_error_rows": sum(bool(r.get("fatal_error_from")) for r in models),
        "shared_task_ids": len(common), "shared_non_null_task_version_keys": len(exact),
        "human_shared_rows_missing_task_version": sum(r["task_id"] in common and r["task_version"] is None for r in humans),
        "model_shared_rows_missing_task_version": sum(r["task_id"] in common and r["task_version"] is None for r in models),
        "state": state or ("VERSION_KEYS_OVERLAP_ONLY" if exact else "TASK_ID_OVERLAP_VERSION_EQUIVALENCE_UNESTABLISHED" if common else "NO_OBSERVED_TASK_ID_OVERLAP"),
        "comparison_admitted": False, "new_inference": False, "independent_review": False,
        "limits": ["Published third-party metadata only; version-key overlap is not protocol equivalence.",
                   "No estimates counted as human attempts. No comparative score, new board entry or raw-data republication."]
    }

def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("input", type=Path)
    p.add_argument("--sha256", required=True)
    p.add_argument("--model", default="o3_inspect")
    a = p.parse_args()
    if a.input.stat().st_size > 40_000_000:
        raise SystemExit("source exceeds bound")
    print(json.dumps(audit(a.input.read_bytes(), a.sha256, a.model), indent=2))
if __name__ == "__main__":
    main()
