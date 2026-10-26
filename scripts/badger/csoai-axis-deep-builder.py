#!/usr/bin/env python3
"""csoai-axis-deep-builder.py — kept as a shim so existing runners (csoai-1000x.py) still work.

The per-axis pages are now produced by scripts/surface/build-axis-pages.mjs, from THIS commit's
own /api/gspc (computed offline), with no hand-typed state, count or claim. This file used to
curl the deployed board and carry a typed paragraph per axis ("The 30-item bank", "TIE on the
live board (n=71, acc=0.5915)", a fourth separation word "UNTRIED"), which is how /axis/* came to
contradict the board (persona audit T06, 2026-10-06). It now only delegates.

Usage (arguments are passed through):
  ./csoai-axis-deep-builder.py            # writes public/axis/*.html and public/axes.html
  ./csoai-axis-deep-builder.py --check    # fails if the committed pages are stale
"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent.parent
GENERATOR = REPO / "scripts" / "surface" / "build-axis-pages.mjs"


def main() -> int:
    args = [a for a in sys.argv[1:] if not a.startswith("--axis")]
    return subprocess.call(["node", str(GENERATOR), *args], cwd=str(REPO))


if __name__ == "__main__":
    sys.exit(main())
