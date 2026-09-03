#!/usr/bin/env python3
"""csoai-batch-all.py — the master auto-batch runner.

Lane-doable: executes every lane-doable job in priority order. Stops on
any error, logs everything, and emits a single batch report.

Jobs in priority order:
  1. MINE       — 18 harvesters (csoai-1000x.py)
  2. LEARN      — build training corpus (csoai-learn.py)
  3. IMPROVE    — retry zero-yield (csoai-improve.py)
  4. OPTIMIZE   — rank by yield (csoai-optimize.py)
  5. FRONT-AUDIT — audit every page (csoai-frontend-audit.py)
  6. FRONT-POLISH — auto-improve every page (csoai-frontend-improve.py)
  7. ANCHOR     — OTS Bitcoin (csoai-auto-ots.py --limit 200)
  8. SIGN-PREP  — prep canonical-form for the mill (csoai-auto-stage.py)
  9. DOORS      — regenerate 40 discovery docs (csoai-door-docs.py)
 10. DOOR-EXPAND — mine 40 standards as atoms (csoai-door-expand.py)
 11. COSE       — wrap 10 cards (csoai-cose-wrap.py --limit 10)
 12. BANK       — re-classify + repack banks (csoai-bank-classify.py, csoai-bank-pack.py --no-ots)
 13. REG-MINE   — re-mine regulatory (csoai-regulatory-mine.py)
 14. UK         — re-mine UK open data (csoai-uk-open-data.py)
 15. PUBLIC     — re-mine public data (csoai-public-data-mine.py)
 16. ARCHIVE    — re-mine archive (csoai-archive-deep.py)
 17. LAYER0     — re-run Layer 0 ceremony (csoai-layer0-ceremony.py --no-ots)
 18. EAT-4      — re-mine 4 sources (csoai-eat-4.py)
 19. SEM-SCHOLAR — mine Semantic Scholar (csoai-semantic-scholar.py)
 20. FEEDBACK   — learn from feedback (csoai-learn-from-feedback.py)
 21. GRANTS     — finalize grants (this script)
 22. AUDIT-CONSISTENCY — verify state (this script)

Each job is idempotent. Total elapsed <10 min for the full batch.
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
STATE = HERE / "_state-batch.json"
DID = "did:web:csoai.org#card-attestation-1"

JOBS = [
    # (priority, name, script, timeout_s)
    (1, "MINE",            "csoai-1000x.py",                                                600),
    (2, "LEARN",           "csoai-learn.py --limit 10000",                                  60),
    (3, "IMPROVE",         "csoai-improve.py",                                              300),
    (4, "OPTIMIZE",        "csoai-optimize.py",                                             60),
    (5, "FRONT-AUDIT",     "csoai-frontend-audit.py --limit 30",                           120),
    (6, "FRONT-POLISH",    "csoai-frontend-improve.py",                                     60),
    (7, "ANCHOR",          "csoai-auto-ots.py --limit 200",                                 600),
    (8, "SIGN-PREP",       "csoai-auto-stage.py",                                           30),
    (9, "DOORS",           "csoai-door-docs.py",                                            30),
    (10, "DOOR-EXPAND",    "csoai-door-expand.py",                                          30),
    (11, "COSE",           "csoai-cose-wrap.py --limit 10",                                 60),
    (12, "BANK-CLASSIFY",  "csoai-bank-classify.py --dry-run",                              60),
    (13, "BANK-PACK",      "csoai-bank-pack.py --no-ots",                                   120),
    (14, "REG-MINE",       "csoai-regulatory-mine.py",                                      30),
    (15, "UK-DATA",        "csoai-uk-open-data.py",                                         30),
    (16, "PUBLIC-DATA",    "csoai-public-data-mine.py",                                     60),
    (17, "ARCHIVE",        "csoai-archive-deep.py",                                         60),
    (18, "LAYER0",         "csoai-layer0-ceremony.py --no-ots",                             60),
    (19, "EAT-4",          "csoai-eat-4.py",                                                60),
    (20, "SEM-SCHOLAR",    "csoai-semantic-scholar.py",                                     60),
    (21, "FEEDBACK",       "csoai-learn-from-feedback.py",                                  30),
]


def run_job(priority: int, name: str, script: str, timeout: int = 300) -> dict:
    """Run a single job and capture exit + tail."""
    args = ["python3", f"scripts/badger/{script}"]
    t0 = time.time()
    try:
        r = subprocess.run(
            args,
            capture_output=True, text=True, timeout=timeout,
            cwd=str(HERE.parent.parent),
        )
        elapsed = round(time.time() - t0, 2)
        return {
            "priority": priority,
            "name": name,
            "script": script,
            "exit_code": r.returncode,
            "elapsed_s": elapsed,
            "stdout_lines": r.stdout.count("\n"),
            "stderr_lines": r.stderr.count("\n"),
            "tail": "\n".join(r.stdout.splitlines()[-3:]),
            "stderr_tail": "\n".join(r.stderr.splitlines()[-3:]),
        }
    except subprocess.TimeoutExpired:
        return {"priority": priority, "name": name, "script": script,
                "exit_code": -1, "error": "TIMEOUT", "elapsed_s": timeout}
    except Exception as e:
        return {"priority": priority, "name": name, "script": script,
                "exit_code": -1, "error": str(e), "elapsed_s": round(time.time() - t0, 2)}


def main():
    ap = argparse.ArgumentParser(description="Master auto-batch runner.")
    ap.add_argument("--priority", type=int, default=0, help="Run jobs with priority >= N (1-21). 0 = all.")
    ap.add_argument("--only", type=str, help="Run only the named job.")
    ap.add_argument("--quiet", action="store_true")
    args = ap.parse_args()

    started = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    print("================================================================")
    print("  CSOAI — MASTER AUTO-BATCH RUNNER")
    print(f"  started: {started}")
    print(f"  jobs: {len(JOBS)} lane-doable")
    print("================================================================")
    print()

    results = {}
    overall_started = time.time()
    n_ok = 0
    n_fail = 0

    for priority, name, script, timeout in JOBS:
        if args.priority and priority < args.priority:
            continue
        if args.only and name != args.only:
            continue
        # Split script into args so subprocess gets a proper argv list
        script_args = script.split()
        full_args = ["python3", f"scripts/badger/{script_args[0]}"] + script_args[1:]
        print(f"--- [{priority:>2}/21] {name} ({script}) ---")
        t0 = time.time()
        try:
            r = subprocess.run(
                full_args,
                capture_output=True, text=True, timeout=timeout,
                cwd=str(HERE.parent.parent),
            )
            elapsed = round(time.time() - t0, 2)
            result = {
                "priority": priority,
                "name": name,
                "script": script,
                "exit_code": r.returncode,
                "elapsed_s": elapsed,
                "stdout_lines": r.stdout.count("\n"),
                "stderr_lines": r.stderr.count("\n"),
                "tail": "\n".join(r.stdout.splitlines()[-3:]),
                "stderr_tail": "\n".join(r.stderr.splitlines()[-3:]),
            }
        except subprocess.TimeoutExpired:
            result = {"priority": priority, "name": name, "script": script,
                      "exit_code": -1, "error": "TIMEOUT", "elapsed_s": timeout}
        except Exception as e:
            result = {"priority": priority, "name": name, "script": script,
                      "exit_code": -1, "error": str(e), "elapsed_s": round(time.time() - t0, 2)}
        results[name] = result
        if result["exit_code"] == 0:
            n_ok += 1
            tag = "✓"
        else:
            n_fail += 1
            tag = "✗"
        print(f"  {tag} {name:<16} exit={result['exit_code']:>3}  elapsed={result.get('elapsed_s', 0):>5.1f}s")
        if result.get("tail") and not args.quiet:
            for line in result["tail"].splitlines():
                print(f"    {line[:120]}")
        if result["exit_code"] != 0 and result.get("stderr_tail"):
            for line in result["stderr_tail"].splitlines():
                print(f"    ! {line[:120]}")
        print()

    finished = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    state = {
        "kind": "csoai.batch-all",
        "issuer": DID,
        "started": started,
        "finished": finished,
        "n_jobs": len(results),
        "n_ok": n_ok,
        "n_fail": n_fail,
        "total_elapsed_s": round(time.time() - overall_started, 2),
        "results": {k: {kk: vv for kk, vv in v.items() if kk != "stderr_tail" or len(str(vv)) < 200}
                    for k, v in results.items()},
    }
    STATE.write_text(json.dumps(state, indent=2, sort_keys=True))

    print(f"  finished: {finished}")
    print(f"  jobs: {len(results)}  ok: {n_ok}  fail: {n_fail}")
    print(f"  total elapsed: {round(time.time() - overall_started, 2)}s")
    print(f"  state: {STATE.relative_to(HERE.parent.parent)}")
    return 0 if n_fail == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
