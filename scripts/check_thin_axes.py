#!/usr/bin/env python3
"""Live GSPC n<30 must have a written reason in docs/THIN-AXIS-REASONS-2026-09-06.md."""
from __future__ import annotations

import json
import sys
import urllib.request
from pathlib import Path

REASONS = Path(__file__).resolve().parents[1] / "docs/THIN-AXIS-REASONS-2026-09-06.md"
BOARD = "https://councilof.ai/api/gspc"


def main() -> int:
    req = urllib.request.Request(BOARD, headers={"User-Agent": "csoai-thin-axes/0.1"})
    with urllib.request.urlopen(req, timeout=20) as r:
        board = json.loads(r.read())
    reasons = REASONS.read_text()
    thin = []
    missing = []
    for a in board.get("axes") or []:
        n = a.get("n")
        axis = a.get("axis")
        if n is None or n >= 30:
            continue
        row = {"axis": axis, "n": n, "status": a.get("status"), "reason": axis in reasons}
        thin.append(row)
        if axis not in reasons:
            missing.append(axis)
    out = {"source": BOARD, "thin": thin, "missing_reasons": missing}
    print(json.dumps(out, indent=2))
    if missing:
        print("FAIL missing reasons:", missing, file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
