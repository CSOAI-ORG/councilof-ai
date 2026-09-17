#!/usr/bin/env python3
"""Gate: every integer published in a reconciliation artifact must carry a source.

DONE WHEN 3 (M4, 2026-09-17): "Every count you publish is read from a live endpoint
AT PUBLISH TIME, never typed. Proof: grep your artifact for any integer that has no
`source` field beside it."

An integer is acceptable only if it sits inside an object that also carries `source`
and `read_at` (the counted() shape). Everything else is reported with its JSON path.
Exit 1 on any finding, so this fails closed.

Usage: python3 scripts/check_counts_have_sources.py <artifact.json> [...]
"""
from __future__ import annotations

import json
import pathlib
import sys

COUNTED_KEYS = {"value", "source", "read_at"}


def walk(node, path: str, findings: list[str]) -> None:
    if isinstance(node, dict):
        # The counted() shape: {"value": N, "source": ..., "read_at": ...}
        if "value" in node and isinstance(node["value"], int) and COUNTED_KEYS <= set(node):
            for k, v in node.items():
                if k != "value":
                    walk(v, f"{path}.{k}", findings)
            return
        for k, v in node.items():
            walk(v, f"{path}.{k}", findings)
    elif isinstance(node, list):
        for i, v in enumerate(node):
            walk(v, f"{path}[{i}]", findings)
    elif isinstance(node, bool):
        return  # bools are not counts
    elif isinstance(node, int):
        findings.append(f"{path} = {node}")


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print(__doc__)
        return 2
    bad = 0
    for arg in argv[1:]:
        p = pathlib.Path(arg)
        findings: list[str] = []
        walk(json.loads(p.read_text()), p.name, findings)
        if findings:
            bad += 1
            print(f"FAIL {p}: {len(findings)} integer(s) with no source beside them")
            for f in findings[:40]:
                print(f"   {f}")
            if len(findings) > 40:
                print(f"   … and {len(findings) - 40} more")
        else:
            print(f"OK   {p}: every integer carries a source and a read_at")
    return 1 if bad else 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
