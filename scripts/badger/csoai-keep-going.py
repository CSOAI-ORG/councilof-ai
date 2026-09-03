#!/usr/bin/env python3
"""csoai-keep-going.py — keep going on all the lane-doable work.

Runs every lane-doable job in sequence. Idempotent. The whole pass.
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
STATE = HERE / "_state-keep-going.json"
DID = "did:web:csoai.org#card-attestation-1"

JOBS = [
    # Lane-doable work that runs from this machine
    ("FRONT-AUDIT",   "csoai-frontend-audit.py --limit 30",                120, "audit every public page"),
    ("FRONT-IMPROVE", "csoai-frontend-improve.py",                        60,  "auto-improve every page"),
    ("OPTIMIZE",      "csoai-optimize.py",                                30,  "rank harvesters by yield"),
    ("LEARN",         "csoai-learn.py --limit 10000",                    60,  "build OWEM corpus"),
    ("IMPROVE",       "csoai-improve.py",                                 300, "retry + rerun top"),
    ("PUBLIC-COUSINS","csoai-public-models.py",                         30,  "Sept 2026 model releases"),
    ("TOP-MODELS",    "csoai-top-models.py --limit 100",                 120, "100 open models"),
    ("PUBLIC-A2A",    "csoai-public-a2a-x402-harvest.py",                120, "every public A2A+x402"),
    ("BANK-COMPLETE", "csoai-bank-complete.py",                          60,  "780 cards"),
    ("EVIDENCE",      "csoai-bank-pack.py --no-ots",                     60,  "re-package bank pack"),
    ("REGULATORY",    "csoai-regulatory-mine.py",                          30,  "168 EU/NIST/OWASP/ISO"),
    ("UK-DATA",       "csoai-uk-open-data.py",                             30,  "UK public data"),
    ("PUBLIC-DATA",   "csoai-public-data-mine.py",                         60,  "OSM/WB/Eurostat/etc"),
    ("ARCHIVE",       "csoai-archive-deep.py",                             60,  "deep archive mine"),
    ("LAYER0",        "csoai-layer0-ceremony.py --no-ots",                 60,  "Layer 0 ceremony"),
    ("EAT-4",         "csoai-eat-4.py",                                    60,  "OECD/GH/HIBP"),
    ("SEM-SCHOLAR",   "csoai-semantic-scholar.py",                         60,  "AI safety papers"),
    ("BRIDGES",       "csoai-bridges.py",                                  600, "HF + notices → CSOAI"),
    ("DOORS",         "csoai-door-docs.py",                                30,  "regenerate 40 docs"),
    ("DOOR-EXPAND",   "csoai-door-expand.py",                              30,  "40 standards atoms"),
    ("AUTO-STAGE",    "csoai-auto-stage.py",                              30,  "track queue"),
    ("MASTER-PLAN",   "csoai-master-plan.py",                             30,  "7 vectors"),
    ("MASTER-CATALOG","csoai-master-catalog.py",                           30,  "every catalog merged"),
    ("CHECKLIST",     "csoai-checklist.py",                                60,  "what's done / not"),
    ("COSE-WRAP",     "csoai-cose-wrap.py --limit 5",                     30,  "COSE_Sign1 wrap"),
    ("FACILITATOR",   "csoai-open-facilitator.py",                         30,  "MetaMask facilitator"),
    ("FACILITATOR-T", "csoai-x402-tester.py",                              60,  "x402 live tester"),
    ("BURNER",        "csoai-burner-wallet.py",                           5,   "burner wallet generator"),
    ("REVENUE-LOOP",  "csoai-revenue-loop.py --dry-run --limit 2",        120, "revenue loop probe"),
    ("DONATION",      "csoai-donation-mining.py",                          30,  "10 donation-mining rails"),
    ("FILL-GRANTS",   "csoai-fill-grants.py",                              30,  "grant payloads"),
    ("COMPASS",       "csoai-compass.py",                                 60,  "9 supply-chain actions"),
    ("X402-CHECKLIST","csoai-checklist.py",                                60,  "re-check live rails"),
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
            "tail": "\n".join(r.stdout.splitlines()[-2:]),
        }
    except subprocess.TimeoutExpired:
        return {"name": name, "script": script, "exit_code": -1, "error": "TIMEOUT",
                "elapsed_s": timeout}
    except Exception as e:
        return {"name": name, "script": script, "exit_code": -1, "error": str(e),
                "elapsed_s": round(time.time() - t0, 2)}


def main():
    ap = argparse.ArgumentParser(description="Keep going on all lane-doable work.")
    args = ap.parse_args()

    started = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    print("================================================================")
    print(f"  CSOAI — KEEP GOING ({len(JOBS)} jobs, one shot)")
    print(f"  started: {started}")
    print("================================================================")
    print()

    results = {}
    overall = time.time()
    n_ok = 0
    n_fail = 0
    for name, script, timeout, desc in JOBS:
        print(f"--- [{name}] {desc} ---")
        r = run(name, script, timeout, desc)
        results[name] = r
        if r["exit_code"] == 0:
            n_ok += 1
            tag = "✓"
        else:
            n_fail += 1
            tag = "✗"
        print(f"  {tag} {name:<16} exit={r['exit_code']:>3}  elapsed={r.get('elapsed_s', 0):>5.1f}s  {script}")
        print()

    finished = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    state = {
        "kind": "csoai.keep-going",
        "issuer": DID,
        "started": started,
        "finished": finished,
        "n_jobs": len(results),
        "n_ok": n_ok,
        "n_fail": n_fail,
        "total_elapsed_s": round(time.time() - overall, 2),
        "results": results,
    }
    STATE.write_text(json.dumps(state, indent=2, sort_keys=True))

    print(f"  finished: {finished}")
    print(f"  jobs: {len(results)}  ok: {n_ok}  fail: {n_fail}")
    print(f"  total elapsed: {round(time.time() - overall, 2)}s")
    print(f"  state: {STATE.relative_to(HERE.parent.parent)}")

    # Final OTS check
    print()
    print("=== FINAL OTS STATE (the doctrine) ===")
    sys.path.insert(0, str(HERE))
    from ots_stamp import attestation_state
    from pathlib import Path
    ots = sorted(f for f in Path(".").glob("**/*.ots") if "node_modules" not in str(f))
    states = {"bitcoin": 0, "pending": 0, "unreadable": 0}
    for f in ots:
        try:
            s = attestation_state(f.read_bytes())
            states[s.get("state", "unreadable")] += 1
        except Exception:
            states["unreadable"] += 1
    print(f"  total .ots: {len(ots)}")
    print(f"  Bitcoin-anchored: {states['bitcoin']}")
    print(f"  pending: {states['pending']}")
    print(f"  unreadable: {states['unreadable']}")
    return 0 if n_fail == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
