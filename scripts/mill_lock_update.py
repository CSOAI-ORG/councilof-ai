#!/usr/bin/env python3
"""Merge mill-out rows into a fleet lock. n_measured is counted from models[].status."""
from __future__ import annotations

import json
import sys
from pathlib import Path

def apply_mill(lock: dict, mill: dict) -> dict:
    measured = {
        row.get("slug"): row
        for row in mill.get("rows") or []
        if row.get("status") == "practice-mill" and row.get("slug")
    }
    as_of = mill.get("as_of")
    for m in lock.get("models") or []:
        slug = m.get("slug")
        if slug in measured:
            m["status"] = "practice-mill"
            m["last_mill"] = as_of
            if measured[slug].get("n") is not None:
                m["n"] = measured[slug]["n"]
    lock["n_locked"] = len(lock.get("models") or [])
    lock["n_measured"] = sum(
        1
        for m in (lock.get("models") or [])
        if (m.get("status") or "UNMEASURED") not in ("UNMEASURED", "", None)
    )
    return lock


def main() -> int:
    lock_path = Path(sys.argv[1])
    mill_path = Path(sys.argv[2])
    lock = json.loads(lock_path.read_text())
    mill = json.loads(mill_path.read_text())
    apply_mill(lock, mill)
    lock_path.write_text(json.dumps(lock, indent=2) + "\n")
    print("n_measured", lock["n_measured"], "n_locked", lock["n_locked"])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
