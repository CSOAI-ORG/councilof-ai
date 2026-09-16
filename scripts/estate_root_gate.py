#!/usr/bin/env python3
"""Refuse to deploy if the published estate root does not match the index it claims to cover.

The defect this exists for: a summary is easy to edit and an index is expensive to rebuild, so the
two drift and the site serves a root that commits to nothing on disk. Here the root is RECOMPUTED
from the full artifact's own entries and compared to both published copies.
"""
import hashlib, json, pathlib, sys

FULL = pathlib.Path("public/interop/master-consolidation-2026-09-16.json")
SUMMARY = pathlib.Path("public/interop/master-consolidation-summary.json")

def sha256b(b): return hashlib.sha256(b).hexdigest()

def merkle(leaves):
    if not leaves: return ""
    cur = list(leaves)
    while len(cur) > 1:
        nxt = [sha256b(bytes.fromhex(cur[i]) + bytes.fromhex(cur[i+1])) for i in range(0, len(cur)-1, 2)]
        if len(cur) % 2: nxt.append(cur[-1])
        cur = nxt
    return cur[0]

def main():
    if not FULL.exists():
        print(f"  estate index absent: {FULL}"); return 1
    full = json.loads(FULL.read_text())
    recomputed = merkle([e["digest"] for e in full["entries"]])
    problems = []
    if recomputed != full["merkle_root"]:
        problems.append(f"the full artifact's own root {full['merkle_root'][:16]}… does not match "
                        f"the root recomputed from its entries {recomputed[:16]}…")
    if SUMMARY.exists():
        s = json.loads(SUMMARY.read_text())
        if s.get("merkle_root") != full["merkle_root"]:
            problems.append("the summary's root differs from the full artifact's root")
        if s.get("totals", {}).get("entries") != full["totals"]["entries"]:
            problems.append("the summary's entry count differs from the full artifact's")
    else:
        problems.append(f"summary absent: {SUMMARY}")
    if problems:
        for p in problems: print("  " + p)
        return 2
    print(f"  root recomputed from {len(full['entries'])} entries and matches both published copies")
    return 0

if __name__ == "__main__":
    if "--selftest" in sys.argv:
        ls = [sha256b(bytes([i])) for i in range(5)]
        r = merkle(ls)
        assert r == merkle(ls)
        assert merkle(ls[:-1]) != r, "a changed leaf set produced the same root — the check is vacuous"
        print("selftest OK: the root changes when the leaf set changes"); sys.exit(0)
    sys.exit(main())
