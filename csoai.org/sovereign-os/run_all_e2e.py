#!/usr/bin/env python3
"""
Sovereign E2E runner — single entry point for all sovereign-os tests
CSOAI Ltd UK 16939677 · MIT License · 1 July 2026

Runs ALL sovereign-os E2E tests in one command. Exits 0 only if all green.

Usage:
    python3 run_all_e2e.py             # run all
    python3 run_all_e2e.py --quick     # skip integration (faster)
    python3 run_all_e2e.py --verbose   # show per-test detail
"""
import os
import subprocess
import sys
import time
from pathlib import Path

SOVEREIGN_OS = Path("/Users/nicholas/clawd/csoai.org/sovereign-os")
PYTHON = "/Users/nicholas/.hermes/hermes-agent/venv/bin/python3.11"

# (path, label, cwd_override, is_quick)
RUNNERS = [
    ("backend/test_e2e_runner.py",   "Dragon Mode E2E (19 tests)",          "backend",     False),
    ("dragon-mode/test_dragon_e2e.py", "Dragon Mode Doctrine E2E (12 tests)", "dragon-mode", False),
    ("test_primitives_e2e.py",        "Primitives E2E (Crypto/MoE/Threat) (24 tests)", None, False),
    ("backend/test_e2e.py",           "Bridge E2E (vision bridge)",          "backend",     True),
]


def run_one(rel_path, label, cwd_override):
    full_path = SOVEREIGN_OS / rel_path
    if not full_path.exists():
        return None, f"missing: {full_path}"
    t0 = time.time()
    try:
        cwd = str(SOVEREIGN_OS / cwd_override) if cwd_override else str(SOVEREIGN_OS)
        result = subprocess.run(
            [PYTHON, str(full_path)],
            capture_output=True, text=True,
            cwd=cwd,
            timeout=120,
        )
        elapsed = time.time() - t0
        passed = (result.returncode == 0)
        # Extract "X passed, Y failed" from output
        summary = ""
        for line in result.stdout.split('\n'):
            if 'passed' in line.lower() and 'failed' in line.lower():
                summary = line.strip()
                break
        if not summary:
            summary = f"exit {result.returncode}"
        return passed, f"{label}: {summary} ({elapsed:.1f}s)"
    except subprocess.TimeoutExpired:
        return False, f"{label}: TIMEOUT (>120s)"
    except Exception as e:
        return False, f"{label}: ERROR {e}"


def main():
    args = sys.argv[1:]
    quick = "--quick" in args
    verbose = "--verbose" in args

    print("=" * 70)
    print("  🜏✅ SOVEREIGN E2E RUNNER — All Tests, One Command")
    print("  CSOAI Ltd UK 16939677 · MIT License · 1 July 2026")
    print("=" * 70)
    print()
    print(f"  Python: {PYTHON}")
    print(f"  Sovereign OS: {SOVEREIGN_OS}")
    print(f"  Mode: {'quick' if quick else 'full'}")
    print(f"  Verbose: {verbose}")
    print()

    t0 = time.time()
    results = []
    for rel_path, label, cwd_override, is_quick in RUNNERS:
        if quick and is_quick:
            print(f"  [SKIP] {label} (--quick)")
            continue
        passed, msg = run_one(rel_path, label, cwd_override)
        results.append((passed, msg))

        marker = "✓" if results[-1][0] else "✗"
        print(f"  {marker} {results[-1][1]}")

    elapsed = time.time() - t0
    passed = sum(1 for ok, _ in results if ok)
    failed = sum(1 for ok, _ in results if not ok)
    total_tests = passed + failed
    print()
    print("─" * 70)
    print(f"  TOTAL: {passed} passed, {failed} failed (in {elapsed:.1f}s)")
    print("─" * 70)
    if failed == 0:
        print()
        print("  ✅ ALL TEST SUITES GREEN")
        print("  Care Floor 0.95. BFT 12-around-1. SIGIL Ed25519 + PQC.")
        print("  Public. Auditable. Sovereign. Solve et Coagula.")
        print()
        return 0
    else:
        print()
        print("  ❌ FAILURES — see above")
        return 1


if __name__ == "__main__":
    sys.exit(main())