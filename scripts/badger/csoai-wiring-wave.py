#!/usr/bin/env python3
"""Retired substrate-output generator.

This script previously manufactured a release-style manifest from file counts
and hard-coded PASS rows. In particular it described a 33/33 BFT quorum,
multiplayer games, paid settlement, anchors, and end-to-end behavior that its
own code never exercised. Those outputs are not evidence and must not be
regenerated.

Use the live capability fabric, GSPC board, signed-card verifier, and individual
release gates instead. Missing or unexercised capabilities remain UNCHECKABLE.
"""

from __future__ import annotations


RETIRED_GENERATOR = True
REASON_CODE = "HARDCODED_PASS_ROWS_ARE_NOT_EVIDENCE"


def main() -> None:
    print("csoai-wiring-wave: RETIRED")
    print(f"reason_code: {REASON_CODE}")
    print("No manifest was generated. Read live, independently checkable evidence instead.")
    raise SystemExit(2)


if __name__ == "__main__":
    main()
