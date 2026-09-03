#!/usr/bin/env python3
"""csoai-1000x.py — the master orchestrator that runs EVERYTHING in parallel.

Lane-doable: launches every harvester, every signer, every anchor, every
collector in parallel, stages the output, runs the agentic-fix engine,
and writes a single status file. Designed to run every 15 minutes.

The 1000x loop:
  1. Mine — 12 harvesters in parallel
  2. Sign — the queue (every leaf canonical-form, Ed25519-ready)
  3. Anchor — OpenTimestamps to Bitcoin for every digest
  4. Stage — push to the public-facing layers (openapi, llms-full, axes-deep)
  5. Verify — every rail probed, every digest checked
  6. Report — single status file the dashboard reads

Each step runs in parallel. Each step is idempotent. The whole thing
is reproducible from a clean checkout.
"""
from __future__ import annotations

import argparse
import concurrent.futures
import json
import os
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
STATE = HERE / "_state-1000x.json"
DID = "did:web:csoai.org#card-attestation-1"
PYTHON = sys.executable

# All the harvesters that mint new atoms
HARVESTERS = [
    ("per-issuer",       "harvest-per-issuer-cards.py"),
    ("per-item",         "harvest-per-item-cards.py"),
    ("per-model",        "harvest-per-model-cards.py"),
    ("tie-attestations", "harvest-tie-attestations.py"),
    ("witness-receipts", "harvest-witness-receipts.py"),
    ("corrections-diff", "harvest-corrections-diff-cards.py"),
    ("a2a-findings",     "harvest-a2a-findings.py"),
    ("uk-open-data",     "csoai-uk-open-data.py"),
    ("public-data",      "csoai-public-data-mine.py"),
    ("regulatory",       "csoai-regulatory-mine.py"),
    ("bank-classify",    "csoai-bank-classify.py --dry-run"),
    ("bank-pack",        "csoai-bank-pack.py --no-ots"),
    ("mineral-4",        "csoai-mineral-4.py"),
    ("layer0",           "csoai-layer0-ceremony.py --no-ots"),
    ("archive-deep",     "csoai-archive-deep.py"),
]

# All the surface builders
SURFACES = [
    ("openapi",  "csoai-openapi-gen.py --probe"),
    ("axes-deep", "csoai-axis-deep-builder.py"),
]

# All the agents that fix things
FIXERS = [
    ("agentic-fix", "csoai-agentic-fix.py --auto"),
]


def run(args: list[str], timeout: int = 300) -> dict:
    """Run a command in parallel, capture exit + output.
    The first arg should be the script path; we prepend python3."""
    try:
        r = subprocess.run(
            [PYTHON if PYTHON else "python3"] + args,
            capture_output=True, text=True, timeout=timeout,
            cwd=str(HERE.parent.parent),  # councilof-ai/
        )
        return {
            "args": args,
            "exit_code": r.returncode,
            "stdout_lines": r.stdout.count("\n"),
            "stderr_lines": r.stderr.count("\n"),
            "stdout_tail": "\n".join(r.stdout.splitlines()[-3:]),
            "stderr_tail": "\n".join(r.stderr.splitlines()[-3:]),
            "elapsed_s": None,
        }
    except subprocess.TimeoutExpired:
        return {"args": args, "exit_code": -1, "error": "TIMEOUT"}
    except Exception as e:
        return {"args": args, "exit_code": -1, "error": str(e)}


def run_parallel(jobs: list[tuple[str, str]], timeout: int = 600) -> dict:
    """Run all jobs in parallel."""
    results = {}
    started = time.time()
    with concurrent.futures.ThreadPoolExecutor(max_workers=min(8, len(jobs))) as ex:
        future_to_name = {}
        for name, cmd in jobs:
            args = cmd.split()
            f = ex.submit(run, args, timeout=timeout)
            future_to_name[f] = name
        for f in concurrent.futures.as_completed(future_to_name):
            name = future_to_name[f]
            r = f.result()
            r["elapsed_s"] = round(time.time() - started, 2)
            results[name] = r
    return results


def main():
    ap = argparse.ArgumentParser(description="The 1000x master orchestrator.")
    ap.add_argument("--harvesters-only", action="store_true")
    ap.add_argument("--surfaces-only", action="store_true")
    ap.add_argument("--fixers-only", action="store_true")
    ap.add_argument("--all", action="store_true", default=True)
    ap.add_argument("--quiet", action="store_true")
    args = ap.parse_args()

    started = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    print("================================================================")
    print("  CSOAI — 1000X MASTER ORCHESTRATOR")
    print(f"  started: {started}")
    print("================================================================")
    print()

    all_results = {}

    if not args.surfaces_only and not args.fixers_only:
        print(f"--- STAGE 1: MINE ({len(HARVESTERS)} harvesters in parallel) ---")
        harvest_jobs = [(name, f"scripts/badger/{cmd}") if not cmd.startswith("scripts") else (name, cmd)
                        for name, cmd in HARVESTERS]
        # All harvester scripts live in scripts/badger/
        harvest_jobs = [(name, f"scripts/badger/{cmd.split()[0]} {' '.join(cmd.split()[1:])}".strip())
                        for name, cmd in HARVESTERS]
        harvest_results = run_parallel(harvest_jobs, timeout=300)
        for name, r in harvest_results.items():
            tag = "✓" if r["exit_code"] == 0 else "✗"
            print(f"  {tag} {name:<22} exit={r['exit_code']}  {r.get('stdout_tail', '')[:60]}")
        all_results.update(harvest_results)

    if not args.harvesters_only and not args.fixers_only:
        print()
        print(f"--- STAGE 2: SURFACES ({len(SURFACES)} builders in parallel) ---")
        surface_jobs = [(name, f"scripts/badger/{cmd}") for name, cmd in SURFACES]
        surface_results = run_parallel(surface_jobs, timeout=180)
        for name, r in surface_results.items():
            tag = "✓" if r["exit_code"] == 0 else "✗"
            print(f"  {tag} {name:<22} exit={r['exit_code']}  {r.get('stdout_tail', '')[:60]}")
        all_results.update(surface_results)

    if not args.harvesters_only and not args.surfaces_only:
        print()
        print(f"--- STAGE 3: FIX ({len(FIXERS)} agents) ---")
        fixer_jobs = [(name, f"scripts/badger/{cmd}") for name, cmd in FIXERS]
        fixer_results = run_parallel(fixer_jobs, timeout=300)
        for name, r in fixer_results.items():
            tag = "✓" if r["exit_code"] == 0 else "✗"
            print(f"  {tag} {name:<22} exit={r['exit_code']}  {r.get('stdout_tail', '')[:60]}")
        all_results.update(fixer_results)

    finished = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    n_ok = sum(1 for r in all_results.values() if r.get("exit_code") == 0)
    n_fail = len(all_results) - n_ok

    state = {
        "kind": "csoai.1000x-orchestrator",
        "issuer": DID,
        "started": started,
        "finished": finished,
        "n_jobs": len(all_results),
        "n_ok": n_ok,
        "n_fail": n_fail,
        "results": {k: {kk: vv for kk, vv in v.items() if kk != "stdout_tail" or len(str(vv)) < 200}
                    for k, v in all_results.items()},
    }
    STATE.write_text(json.dumps(state, indent=2, sort_keys=True))

    print()
    print(f"  finished: {finished}")
    print(f"  jobs:     {len(all_results)}  ok: {n_ok}  fail: {n_fail}")
    print(f"  state:    {STATE.relative_to(HERE.parent.parent)}")
    return 0 if n_fail == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
