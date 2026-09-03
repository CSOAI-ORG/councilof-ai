#!/usr/bin/env python3
"""csoai-optimize.py — the optimizer: which harvesters produce the most?

Lane-doable: walks every JSONL file in _queue/, counts atoms, computes
bytes-per-atom + atoms-per-run, ranks harvesters by efficiency, and
emits a single optimization report. The miner reads this report to
focus the next cron on the harvesters with the highest yield.

This is the SELF-IMPROVEMENT layer:
  1. Measure (count atoms per harvester)
  2. Rank (sort by yield)
  3. Suggest (which to keep, which to drop)
  4. Emit (the report the dashboard reads)
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
QUEUE = HERE / "_queue"
OUT = HERE / "_queue" / "optimize"
DID = "did:web:csoai.org#card-attestation-1"


def main():
    ap = argparse.ArgumentParser(description="The optimizer.")
    args = ap.parse_args()

    print("================================================================")
    print("  CSOAI — OPTIMIZER (which harvesters produce the most?)")
    print("================================================================")
    print()

    OUT.mkdir(parents=True, exist_ok=True)

    harvester_stats = {}
    for jsonl in sorted(QUEUE.glob("**/*.jsonl")):
        if jsonl.name.startswith("_state"):
            continue
        if jsonl.parent.name.startswith("_"):
            continue
        kind = jsonl.parent.name
        if kind not in harvester_stats:
            harvester_stats[kind] = {"n_files": 0, "n_atoms": 0, "n_bytes": 0}
        harvester_stats[kind]["n_files"] += 1
        with open(jsonl) as f:
            for line in f:
                line = line.strip()
                if line:
                    harvester_stats[kind]["n_atoms"] += 1
                    harvester_stats[kind]["n_bytes"] += len(line)

    # Compute efficiency
    ranked = []
    for kind, stats in harvester_stats.items():
        n = stats["n_atoms"]
        b = stats["n_bytes"]
        ranked.append({
            "kind": kind,
            "n_files": stats["n_files"],
            "n_atoms": n,
            "n_bytes": b,
            "avg_bytes_per_atom": round(b / max(1, n), 1),
            "atoms_per_file": round(n / max(1, stats["n_files"]), 1),
        })
    ranked.sort(key=lambda x: -x["n_atoms"])

    # Print the ranking
    print(f"  {'kind':<28} {'files':>6} {'atoms':>7} {'bytes':>10} {'avg/atom':>10}")
    print(f"  {'-'*28} {'-'*6} {'-'*7} {'-'*10} {'-'*10}")
    total_atoms = 0
    total_bytes = 0
    for r in ranked:
        print(f"  {r['kind']:<28} {r['n_files']:>6} {r['n_atoms']:>7} {r['n_bytes']:>10} {r['avg_bytes_per_atom']:>10}")
        total_atoms += r["n_atoms"]
        total_bytes += r["n_bytes"]
    print(f"  {'-'*28} {'-'*6} {'-'*7} {'-'*10} {'-'*10}")
    print(f"  {'TOTAL':<28} {'':>6} {total_atoms:>7} {total_bytes:>10}")

    # Suggestions
    print()
    print("  SUGGESTIONS (the self-improvement layer):")
    top = [r for r in ranked if r["n_atoms"] > 50]
    mid = [r for r in ranked if 10 < r["n_atoms"] <= 50]
    zero = [r for r in ranked if r["n_atoms"] <= 10]
    print(f"    top (keep, mine more):    {len(top)} harvesters")
    print(f"    mid (stable, normal run): {len(mid)} harvesters")
    print(f"    zero (review, drop?):     {len(zero)} harvesters")

    if top:
        print(f"\n    TOP 5 (focus next cron here):")
        for r in top[:5]:
            print(f"      {r['kind']:<28} {r['n_atoms']:>5} atoms")

    if zero:
        print(f"\n    ZERO YIELD (consider dropping):")
        for r in zero[:5]:
            print(f"      {r['kind']:<28} {r['n_atoms']:>5} atoms")

    # Emit the report
    report = {
        "kind": "csoai.optimizer-report",
        "issuer": DID,
        "as_of": datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z"),
        "totals": {
            "n_harvesters": len(ranked),
            "n_atoms": total_atoms,
            "n_bytes": total_bytes,
            "avg_bytes_per_atom": round(total_bytes / max(1, total_atoms), 1),
        },
        "ranking": ranked,
        "suggestions": {
            "top": [r["kind"] for r in top],
            "mid": [r["kind"] for r in mid],
            "zero": [r["kind"] for r in zero],
        },
        "next_actions": [
            "Re-run the top 5 harvesters on the next cron cycle (they have proven yield)",
            "Investigate the zero-yield harvesters (might need rate-limit tuning)",
            "Add more harvesters in the empty categories (e.g. arxiv, wikidata)",
            "Build the auto-OTS for the top-yield harvesters first",
        ],
    }
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    out_path = OUT / f"optimize-{stamp}.json"
    out_path.write_text(json.dumps(report, indent=2, sort_keys=True))
    print()
    print(f"  report: {out_path}")
    print(f"  next_actions: focus on TOP harvesters, investigate ZERO harvesters")
    return 0


if __name__ == "__main__":
    sys.exit(main())
