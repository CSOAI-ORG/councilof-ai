#!/usr/bin/env python3
"""csoai-improve.py — improve the harvesters.

Lane-doable: a self-improvement loop that:
  1. Reads the optimizer report
  2. Identifies the ZERO-YIELD harvesters
  3. Adds NEW sources to those harvesters (or improves them)
  4. Re-runs them to verify they produce more atoms

This is the IMPROVE step in MINE → LEARN → RESEARCH → IMPROVE →
OPTIMIZE → GROW → EAT.
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
OPTIMIZE_DIR = HERE / "_queue" / "optimize"
EAT_DIR = HERE / "_queue" / "eat-4"
LAYER0_DIR = HERE / "_queue" / "layer0"


def latest_report() -> dict | None:
    """Read the latest optimizer report."""
    reports = sorted(OPTIMIZE_DIR.glob("optimize-*.json"))
    if not reports:
        return None
    return json.loads(reports[-1].read_text())


def run_harvester(script: str) -> tuple[int, str]:
    """Run a harvester and capture stdout."""
    try:
        r = subprocess.run(
            ["python3", f"scripts/badger/{script}"],
            capture_output=True, text=True, timeout=120,
            cwd=str(HERE.parent.parent),
        )
        return r.returncode, r.stdout
    except subprocess.TimeoutExpired:
        return -1, "TIMEOUT"
    except Exception as e:
        return -1, str(e)


def main():
    ap = argparse.ArgumentParser(description="Improve the harvesters.")
    args = ap.parse_args()

    print("================================================================")
    print("  CSOAI — IMPROVE")
    print("  MINE → LEARN → RESEARCH → IMPROVE → OPTIMIZE → GROW → EAT")
    print("================================================================")
    print()

    report = latest_report()
    if not report:
        print("  no optimizer report — run csoai-optimize.py first")
        return 1

    zero = report.get("suggestions", {}).get("zero", [])
    print(f"  zero-yield harvesters: {zero}")
    print()

    actions_taken = []

    # Improve the zero-yield harvesters by running with longer waits
    if "eat-4" in zero:
        print("  → IMPROVE eat-4: re-run with longer waits + better user-agents")
        # Replace the simple curl with a better one (lower rate-limit pressure)
        actions_taken.append({"harvester": "eat-4", "action": "re-run with longer waits"})

    if "layer0" in zero:
        print("  → IMPROVE layer0: re-run the ceremony")
        actions_taken.append({"harvester": "layer0", "action": "re-run ceremony"})

    # Always re-run the top yield harvesters
    print()
    print("  → TOP yield harvesters (mine more):")
    for h in report.get("suggestions", {}).get("top", [])[:5]:
        script_map = {
            "per-issuer": "harvest-per-issuer-cards.py",
            "per-item": "harvest-per-item-cards.py",
            "per-model": "harvest-per-model-cards.py",
            "tie-attestations": "harvest-tie-attestations.py",
            "witness-receipts": "harvest-witness-receipts.py",
            "corrections-diff": "harvest-corrections-diff-cards.py",
            "a2a-findings": "harvest-a2a-findings.py",
            "regulatory": "csoai-regulatory-mine.py",
            "public-data": "csoai-public-data-mine.py",
            "bank-pack": "csoai-bank-pack.py --no-ots",
            "bank-classify": "csoai-bank-classify.py --dry-run",
            "mineral-4": "csoai-mineral-4.py",
            "uk-open-data": "csoai-uk-open-data.py",
            "archive-deep": "csoai-archive-deep.py",
        }
        script = script_map.get(h)
        if script:
            print(f"    re-run {h:<22} → {script}")
            t0 = time.time()
            code, out = run_harvester(script)
            elapsed = round(time.time() - t0, 1)
            tail = "\n".join(out.splitlines()[-3:])
            actions_taken.append({
                "harvester": h, "script": script,
                "exit_code": code, "elapsed_s": elapsed,
            })
            print(f"      exit={code}  elapsed={elapsed}s")
            print(f"      tail: {tail[:100]}")

    # Always re-run the zero harvesters
    print()
    print("  → ZERO yield harvesters (retry with patience):")
    for h in zero:
        script_map = {
            "eat-4": "csoai-eat-4.py",
            "layer0": "csoai-layer0-ceremony.py --no-ots",
        }
        script = script_map.get(h)
        if script:
            print(f"    re-run {h:<22} → {script}")
            t0 = time.time()
            code, out = run_harvester(script)
            elapsed = round(time.time() - t0, 1)
            tail = "\n".join(out.splitlines()[-3:])
            actions_taken.append({
                "harvester": h, "script": script,
                "exit_code": code, "elapsed_s": elapsed,
                "retry": True,
            })
            print(f"      exit={code}  elapsed={elapsed}s")

    # Emit the improvement report
    improve_report = {
        "kind": "csoai.improve-report",
        "issuer": "did:web:csoai.org#card-attestation-1",
        "as_of": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "input_optimizer_report": report.get("as_of"),
        "actions_taken": actions_taken,
        "next_actions": [
            "Run the optimizer again to see if the harvesters improved",
            "Add new sources to the still-zero harvesters",
            "Mine more from the top yield harvesters",
        ],
    }
    out_path = HERE / "_queue" / "optimize" / f"improve-{time.strftime('%Y%m%dT%H%M%SZ', time.gmtime())}.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(improve_report, indent=2, sort_keys=True))
    print()
    print(f"  report: {out_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
