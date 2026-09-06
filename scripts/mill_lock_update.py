#!/usr/bin/env python3
"""Merge mill-out rows into HF2200.lock.json. n_measured is counted from models[].status."""
from __future__ import annotations

import json
import sys
from pathlib import Path

MEASURED_STATUSES = frozenset({"practice-mill", "MEASURED"})


def apply_mill(lock: dict, mill: dict) -> dict:
    measured = {
        row.get("slug"): row
        for row in mill.get("rows") or []
        if row.get("slug") and row.get("status")
    }
    as_of = mill.get("as_of")
    for m in lock.get("models") or []:
        slug = m.get("slug")
        row = measured.get(slug)
        if not row:
            continue
        cur = m.get("status") or "UNMEASURED"
        st = row.get("status")
        if cur in MEASURED_STATUSES:
            continue
        if st == "practice-mill":
            m["status"] = "practice-mill"
            m["last_mill"] = as_of
            if row.get("n") is not None:
                m["n"] = row["n"]
        elif st == "UNCHECKABLE":
            m["status"] = "UNCHECKABLE"
            m["last_mill"] = as_of
            reason = row.get("reason") or ""
            if reason:
                m["reason"] = reason[:200]
    lock["n_locked"] = len(lock.get("models") or [])
    lock["n_measured"] = sum(
        1
        for m in (lock.get("models") or [])
        if (m.get("status") or "UNMEASURED") in MEASURED_STATUSES
    )
    return lock


def apply_dir(lock: dict, root: Path) -> dict:
    for p in sorted(root.rglob("hf_inf_*.json")):
        mill = json.loads(p.read_text())
        apply_mill(lock, mill)
    return lock


def main() -> int:
    lock_path = Path(sys.argv[1])
    mill_root = Path(sys.argv[2])
    lock = json.loads(lock_path.read_text())
    apply_dir(lock, mill_root)
    lock_path.write_text(json.dumps(lock, indent=2) + "\n")
    print("n_measured", lock["n_measured"], "n_locked", lock["n_locked"])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
