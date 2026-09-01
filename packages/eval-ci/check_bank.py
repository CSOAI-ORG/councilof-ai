#!/usr/bin/env python3
"""eval-CI gate: fail the PR on a SILENT frozen-bank edit (J32).

The real, non-negotiable half of continuous-eval-as-CI:

  For every bank pinned in bank.lock.json, recompute its sha256 and compare to the pin.
  - match     -> OK.
  - mismatch  -> FAIL. The bank changed but its pin did not: a silent edit. Whoever changed
                 the bank must update bank.lock.json in the SAME PR (a visible, reviewable
                 diff that declares the change and triggers a re-run + delta card).
  - missing   -> FAIL closed. A pinned bank that vanished cannot be verified; "cannot check"
                 is never a pass.

Three-state, structurally: this checker can only print OK for a bank it actually hashed and
matched. It cannot report success for a path it could not read.

Usage:  python3 packages/eval-ci/check_bank.py            # check all pins, exit non-zero on any failure
        python3 packages/eval-ci/check_bank.py --selftest # prove the gate catches a silent edit
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LOCK = Path(__file__).resolve().parent / "bank.lock.json"


def sha256(p: Path) -> str | None:
    if not p.exists():
        return None
    return hashlib.sha256(p.read_bytes()).hexdigest()


def check(lock_path: Path, root: Path) -> tuple[int, list[str]]:
    lock = json.loads(lock_path.read_text())
    lines: list[str] = []
    failed = 0
    checked = 0
    for b in lock.get("banks", []):
        p = root / b["path"]
        got = sha256(p)
        if got is None:
            lines.append(f"FAIL  {b['path']}  MISSING (pinned bank not found — fail closed)")
            failed += 1
        elif got != b["sha256"]:
            lines.append(
                f"FAIL  {b['path']}  SILENT EDIT: pin={b['sha256'][:16]} file={got[:16]} "
                f"— update bank.lock.json in this PR and emit a delta card"
            )
            failed += 1
        else:
            lines.append(f"OK    {b['path']}  {got[:16]} ({b.get('lines','?')} lines)")
            checked += 1
    if checked == 0 and failed == 0:
        lines.append("FAIL  no banks pinned — a gate that checks nothing must not pass")
        failed += 1
    return failed, lines


def _selftest() -> int:
    with tempfile.TemporaryDirectory() as d:
        root = Path(d)
        bank = root / "bank.jsonl"
        bank.write_text('{"a":1}\n')
        good = hashlib.sha256(bank.read_bytes()).hexdigest()
        lock = root / "lock.json"
        lock.write_text(json.dumps({"banks": [{"axis": "x", "path": "bank.jsonl", "sha256": good, "lines": 1}]}))
        f, _ = check(lock, root)
        assert f == 0, "clean bank must pass"
        bank.write_text('{"a":2}\n')  # silent edit
        f, out = check(lock, root)
        assert f == 1 and any("SILENT EDIT" in l for l in out), "silent edit must fail"
        bank.unlink()  # missing
        f, out = check(lock, root)
        assert f == 1 and any("MISSING" in l for l in out), "missing bank must fail closed"
    print("selftest OK: gate passes clean, fails silent-edit, fails-closed on missing")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--selftest", action="store_true")
    args = ap.parse_args()
    if args.selftest:
        return _selftest()
    failed, lines = check(LOCK, ROOT)
    for l in lines:
        print(l)
    if failed:
        print(f"\n::error::eval-CI bank gate FAILED — {failed} pin(s) violated. Do not merge a silent bank edit.")
        return 1
    print(f"\neval-CI bank gate OK — {len(lines)} pin(s) verified.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
