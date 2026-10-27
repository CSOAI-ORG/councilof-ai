#!/usr/bin/env python3
"""The point of the sidecar: a third party can re-score the record from the bytes beside it.

These tests run against a staged export (the directory ``--out``) and prove, for every published
record:

  1. the ``_samples.jsonl`` sidecar named by the record exists, and its bytes hash to the
     checksum the record publishes;
  2. the number of sidecar lines is the ``total_rows`` the record publishes;
  3. counting the lines whose ``evaluation.is_correct`` is true, over all the lines, reproduces
     the record's published score exactly — the record is replayable;
  4. the graded-only figure the record publishes is also recomputable from the same sidecar, by
     dropping the lines the sidecar flags as unparsed;
  5. every sidecar line carries the aggregate's ``evaluation_id`` and ``model_id``, so no line
     points at a record it does not belong to;
  6. no line's ``sample_hash`` is empty and no two lines in one sidecar share a ``sample_id``.

Run:
    VENV=/path/venv python harness/eval-export/test_eee_rows_export.py --out /path/to/staging
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import sys
from pathlib import Path


def load_records(out: Path) -> list[tuple[Path, dict]]:
    records = []
    for path in sorted(out.glob("data/*/*/*/*.json")):
        records.append((path, json.loads(path.read_text())))
    return records


def main(argv=None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True, type=Path)
    a = ap.parse_args(argv)

    records = load_records(a.out)
    if not records:
        print("FAIL: no published records under " + str(a.out))
        return 1

    failures: list[str] = []
    checked_lines = 0
    for path, rec in records:
        det = rec.get("detailed_evaluation_results")
        if not det:
            failures.append(f"{path.name}: no detailed_evaluation_results — the record is not replayable")
            continue
        if det.get("format") != "jsonl":
            failures.append(f"{path.name}: format is {det.get('format')!r}, expected jsonl")
        rel = det.get("file_path", "")
        # file_path is the FULL repository-relative path ("data/<collection>/<dev>/<model>/…"),
        # so it resolves directly under the staging root.
        side = a.out / rel
        if not side.exists():
            failures.append(f"{path.name}: sidecar {rel} is missing")
            continue
        raw = side.read_bytes()
        if hashlib.sha256(raw).hexdigest() != det.get("checksum"):
            failures.append(f"{path.name}: sidecar bytes do not hash to the published checksum")
        lines = [json.loads(l) for l in raw.decode("utf-8").splitlines() if l.strip()]
        if len(lines) != det.get("total_rows"):
            failures.append(f"{path.name}: {len(lines)} sidecar lines, record says {det.get('total_rows')}")
        checked_lines += len(lines)

        result = rec["evaluation_results"][0]
        published = result["score_details"]["score"]
        details = result["score_details"].get("details", {})

        correct = sum(1 for l in lines if l["evaluation"]["is_correct"])
        replay = correct / len(lines) if lines else 0.0
        if not math.isclose(replay, published, rel_tol=0, abs_tol=5e-5):
            failures.append(f"{path.name}: replay {replay:.6f} != published {published:.6f}")

        graded = [l for l in lines if not l.get("metadata", {}).get("unparsed")]
        graded_correct = sum(1 for l in graded if l["evaluation"]["is_correct"])
        graded_only = (graded_correct / len(graded)) if graded else None
        published_graded = details.get("accuracy_graded_only")
        if graded_only is None:
            if published_graded and "UNMEASURED" not in published_graded:
                failures.append(f"{path.name}: record publishes a graded-only figure but no item was graded")
        else:
            if not published_graded or "UNMEASURED" in published_graded:
                failures.append(f"{path.name}: record does not publish the graded-only figure")
            elif not math.isclose(graded_only, float(published_graded), rel_tol=0, abs_tol=5e-5):
                failures.append(f"{path.name}: graded-only replay {graded_only:.6f} != published {published_graded}")

        model_id = rec["model_info"]["id"]
        eval_id = rec["evaluation_id"]
        result_id = result["evaluation_result_id"]
        ids = set()
        for line in lines:
            if line["evaluation_id"] != eval_id:
                failures.append(f"{path.name}: a sidecar line carries a different evaluation_id")
                break
            if line["model_id"] != model_id:
                failures.append(f"{path.name}: a sidecar line carries a different model_id")
                break
            if line["evaluation_result_id"] != result_id:
                failures.append(f"{path.name}: a sidecar line carries a different evaluation_result_id")
                break
            if not line.get("sample_hash"):
                failures.append(f"{path.name}: a sidecar line has no sample_hash")
                break
            if line["sample_id"] in ids:
                failures.append(f"{path.name}: duplicate sample_id {line['sample_id']!r}")
                break
            ids.add(line["sample_id"])

    print(f"records: {len(records)}   sidecar lines checked: {checked_lines}")
    if failures:
        print(f"FAIL: {len(failures)} problem(s)")
        for f in failures[:20]:
            print("  -", f)
        return 1
    print("PASS: every published score re-derives from the sidecar beside it, and the "
          "graded-only figure does too")
    return 0


if __name__ == "__main__":
    sys.exit(main())
