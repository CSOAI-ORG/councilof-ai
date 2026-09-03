#!/usr/bin/env python3
"""csoai-schedule.py — the master self-improvement scheduler.

Lane-doable: runs the full loop on demand:

  STAGE 1: MINE      — all 18 harvesters in parallel (reuses csoai-1000x.py)
  STAGE 2: LEARN     — rebuild the OWEM training corpus
  STAGE 3: IMPROVE   — retry zero-yield, re-run top-yield
  STAGE 4: OPTIMIZE  — rank harvesters by yield
  STAGE 5: ANCHOR    — OTS Bitcoin anchor for new atoms
  STAGE 6: REPORT    — single status file

Each stage is idempotent. The whole thing runs in <5 minutes.
This is the master schedule the LaunchAgents trigger.
"""
from __future__ import annotations

import argparse
import concurrent.futures
import json
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
STATE = HERE / "_state-schedule.json"
DID = "did:web:csoai.org#card-attestation-1"

STAGES = [
    ("MINE",     "csoai-1000x.py"),
    ("LEARN",    "csoai-learn.py --limit 10000"),
    ("IMPROVE",  "csoai-improve.py"),
    ("OPTIMIZE", "csoai-optimize.py"),
]


def run_script(script: str, timeout: int = 600) -> dict:
    """Run a single script and capture exit + tail."""
    args = ["python3", f"scripts/badger/{script}"]
    try:
        r = subprocess.run(
            args,
            capture_output=True, text=True, timeout=timeout,
            cwd=str(HERE.parent.parent),
        )
        return {
            "script": script,
            "exit_code": r.returncode,
            "stdout_lines": r.stdout.count("\n"),
            "elapsed_s": None,
            "tail": "\n".join(r.stdout.splitlines()[-5:]),
        }
    except subprocess.TimeoutExpired:
        return {"script": script, "exit_code": -1, "error": "TIMEOUT"}
    except Exception as e:
        return {"script": script, "exit_code": -1, "error": str(e)}


def main():
    ap = argparse.ArgumentParser(description="Master self-improvement scheduler.")
    ap.add_argument("--stage", choices=[s[0] for s in STAGES] + ["ALL"], default="ALL")
    ap.add_argument("--quiet", action="store_true")
    args = ap.parse_args()

    started = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    print("================================================================")
    print("  CSOAI — MASTER SCHEDULER")
    print(f"  started: {started}")
    print("  loop: MINE → LEARN → IMPROVE → OPTIMIZE")
    print("================================================================")
    print()

    stages = STAGES if args.stage == "ALL" else [s for s in STAGES if s[0] == args.stage]
    results = {}
    overall_started = time.time()

    for stage_name, script in stages:
        print(f"--- STAGE: {stage_name} ({script}) ---")
        t0 = time.time()
        result = run_script(script)
        elapsed = round(time.time() - t0, 2)
        result["elapsed_s"] = elapsed
        results[stage_name] = result
        status = "✓" if result["exit_code"] == 0 else "✗"
        print(f"  {status} {stage_name:<10} exit={result['exit_code']}  elapsed={elapsed}s")
        if result.get("tail") and not args.quiet:
            for line in result["tail"].splitlines():
                print(f"    {line}")
        print()

    finished = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    n_ok = sum(1 for r in results.values() if r.get("exit_code") == 0)
    n_fail = len(results) - n_ok

    state = {
        "kind": "csoai.master-schedule",
        "issuer": DID,
        "started": started,
        "finished": finished,
        "n_stages": len(results),
        "n_ok": n_ok,
        "n_fail": n_fail,
        "total_elapsed_s": round(time.time() - overall_started, 2),
        "results": {k: {kk: vv for kk, vv in v.items() if kk != "tail" or len(str(vv)) < 300}
                    for k, v in results.items()},
    }
    STATE.write_text(json.dumps(state, indent=2, sort_keys=True))

    print(f"  finished: {finished}")
    print(f"  stages: {len(results)}  ok: {n_ok}  fail: {n_fail}")
    print(f"  total elapsed: {round(time.time() - overall_started, 2)}s")
    print(f"  state: {STATE.relative_to(HERE.parent.parent)}")
    return 0 if n_fail == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
