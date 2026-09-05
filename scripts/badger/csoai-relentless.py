#!/usr/bin/env python3
"""csoai-relentless.py — the final execution pass.

Lane-doable: executes every planned batch in one shot:
  1. Frontend audit + improve (8.8/10 → 9+/10)
  2. Bridge commit (HF → CSOAI card → OTS) with REAL stamper
  3. COMPASS pieces (9 supply-chain actions)
  4. Optimise + improve + learn-from-feedback
  5. Public cousins mine
  6. Top 100 open models mine
  7. A2A + x402 harvest
  8. Bank complete map
  9. Auto-OTS via the CANONICAL ots_stamp.py
 10. Auto-stage
 11. Master schedule

Output: a single state file showing n_ok / n_fail / per-job stats.
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
STATE = HERE / "_state-relentless.json"
DID = "did:web:csoai.org#card-attestation-1"

# Use the canonical OTS stamper
sys.path.insert(0, str(HERE))
from ots_stamp import attestation_state  # noqa: E402

JOBS = [
    # name, script, timeout, description
    ("FRONT-AUDIT",   "csoai-frontend-audit.py --limit 30",                120, "audit every public page as end user"),
    ("FRONT-IMPROVE", "csoai-frontend-improve.py",                        60,  "auto-add OG + JSON-LD + lid to every page"),
    ("BRIDGES",       "csoai-bridges.py",                                  600, "HF + notices → CSOAI card + REAL OTS (via ots_stamp)"),
    ("COMPASS",       "csoai-compass.py",                                 60,  "9 supply-chain actions"),
    ("OPTIMIZE",      "csoai-optimize.py",                                30,  "rank harvesters by yield"),
    ("IMPROVE",       "csoai-improve.py",                                 300, "retry zero-yield, re-run top"),
    ("LEARN",         "csoai-learn.py --limit 10000",                    60,  "build the OWEM training corpus"),
    ("FEEDBACK",      "csoai-learn-from-feedback.py",                    30,  "propose fixes for low-yield harvesters"),
    ("PUBLIC-COUSINS","csoai-public-models.py",                         30,  "Sept 2026 model releases"),
    ("TOP-MODELS",    "csoai-top-models.py --limit 100",                 120, "100 open-source models"),
    ("PUBLIC-A2A",    "csoai-public-a2a-x402-harvest.py",                120, "every public A2A + x402 surface"),
    ("BANK-COMPLETE", "csoai-bank-complete.py",                          60,  "26 banks × 5 chains × 6 stablecoins"),
    ("AUTO-STAGE",    "csoai-auto-stage.py",                              30,  "track the queue"),
    ("MASTER-PLAN",   "csoai-master-plan.py",                             30,  "the 7 vectors"),
    ("CHECKLIST",     "csoai-checklist.py",                                60,  "what's done / what's not"),
    ("MASTER-CATALOG","csoai-master-catalog.py",                           30,  "every catalog merged"),
    ("EVIDENCE",      "csoai-bank-pack.py --no-ots",                     60,  "re-package the bank pack"),
    ("REGULATORY",    "csoai-regulatory-mine.py",                          30,  "168 EU AI Act + NIST + OWASP + ISO atoms"),
]


def run(name: str, script: str, timeout: int, desc: str) -> dict:
    args = ["python3", f"scripts/badger/{script}"]
    t0 = time.time()
    try:
        r = subprocess.run(args, capture_output=True, text=True, timeout=timeout,
                            cwd=str(HERE.parent.parent))
        elapsed = round(time.time() - t0, 2)
        return {
            "name": name,
            "script": script,
            "exit_code": r.returncode,
            "elapsed_s": elapsed,
            "stdout_lines": r.stdout.count("\n"),
            "stderr_lines": r.stderr.count("\n"),
            "tail": "\n".join(r.stdout.splitlines()[-3:]),
        }
    except subprocess.TimeoutExpired:
        return {"name": name, "script": script, "exit_code": -1, "error": "TIMEOUT",
                "elapsed_s": timeout}
    except Exception as e:
        return {"name": name, "script": script, "exit_code": -1, "error": str(e),
                "elapsed_s": round(time.time() - t0, 2)}


def main():
    ap = argparse.ArgumentParser(description="Final relentless execution.")
    args = ap.parse_args()

    started = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    print("================================================================")
    print("  CSOAI — RELENTLESS EXECUTION PASS")
    print(f"  {len(JOBS)} jobs, one shot")
    print("================================================================")
    print()

    results = []
    overall_started = time.time()
    n_ok = 0
    n_fail = 0
    for name, script, timeout, desc in JOBS:
        print(f"--- [{name}] {desc} ---")
        r = run(name, script, timeout, desc)
        results.append(r)
        if r["exit_code"] == 0:
            n_ok += 1
            tag = "✓"
        else:
            n_fail += 1
            tag = "✗"
        print(f"  {tag} {name:<14} exit={r['exit_code']:>3}  elapsed={r.get('elapsed_s', 0):>6.1f}s  {script}")
        if r.get("tail") and r["exit_code"] != 0:
            print(f"    {r['tail'][:120]}")
        print()

    finished = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    total_elapsed = round(time.time() - overall_started, 2)
    state = {
        "kind": "csoai.relentless",
        "issuer": DID,
        "started": started,
        "finished": finished,
        "n_jobs": len(results),
        "n_ok": n_ok,
        "n_fail": n_fail,
        "total_elapsed_s": total_elapsed,
        "results": {r["name"]: r for r in results},
    }
    STATE.write_text(json.dumps(state, indent=2, sort_keys=True))

    # Final honest OTS measurement
    print()
    print("=== FINAL OTS STATE (the doctrine: a stamp is not an anchor) ===")
    try:
        from pathlib import Path
        ots_files = sorted([f for f in Path(".").glob("**/*.ots") if "node_modules" not in str(f)])
        n_bitcoin = 0
        n_pending = 0
        n_unreadable = 0
        for f in ots_files:
            try:
                s = attestation_state(f.read_bytes())
                state_name = s.get("state", "unknown")
                if state_name == "bitcoin":
                    n_bitcoin += 1
                elif state_name == "pending":
                    n_pending += 1
                else:
                    n_unreadable += 1
            except Exception:
                n_unreadable += 1
        print(f"  total .ots:     {len(ots_files)}")
        print(f"  Bitcoin-anchored: {n_bitcoin}")
        print(f"  pending:        {n_pending}")
        print(f"  unreadable:      {n_unreadable}")
    except Exception as e:
        print(f"  could not measure: {e}")

    print()
    print(f"  finished: {finished}")
    print(f"  jobs: {len(results)}  ok: {n_ok}  fail: {n_fail}")
    print(f"  total elapsed: {total_elapsed}s")
    print(f"  state: {STATE.relative_to(HERE.parent.parent)}")
    return 0 if n_fail == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
