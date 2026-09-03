#!/usr/bin/env python3
"""csoai-learn.py — the learning loop.

Lane-doable: every harvest we do creates atoms. The atoms are in JSONL
files under _queue/. This script:
  1. Walks every JSONL file in _queue/
  2. Extracts the measurement + evidence + as_of fields
  3. Builds a training-style JSONL for downstream OWEM models
  4. Computes per-kind stats: how many, when, what schemas

The output is a single learning-corpus-<ts>.jsonl that contains
one record per atom with:
  - prompt: "CSOAI did you measure <subject> on <axis>?"
  - response: the measurement + evidence
  - timestamp: the as_of
  - source: the queue dir

This is the feed for the sovereign OWEM retraining cycle.
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
QUEUE = HERE / "_queue"
OUT = HERE / "_queue" / "learn"
MAX_PAYLOAD = 3072


def learn_record(atom: dict) -> dict:
    """Convert an atom into a training-style (prompt, response) pair."""
    subject = atom.get("subject", {})
    scope = atom.get("scope", {})
    measurement = atom.get("measurement", {})
    axis = scope.get("axis", "unknown")
    kind = scope.get("kind", "unknown")
    subj_kind = subject.get("kind", "unknown")
    subj_source = subject.get("source", "unknown")
    status = measurement.get("status", "DISCOVERED")

    prompt = (
        f"CSOAI: did you measure {subj_source} ({subj_kind}) "
        f"on the {axis} axis ({kind})?"
    )
    response = (
        f"Status: {status}. "
        f"Evidence: {json.dumps(measurement.get('evidence', {}), separators=(',', ':'))[:300]} "
        f"Source: {measurement.get('source_url', 'unknown')}. "
        f"As of {atom.get('as_of', 'unknown')}. "
        f"Issuer: {atom.get('issuer', 'unknown')}."
    )
    return {
        "prompt": prompt,
        "response": response,
        "axis": axis,
        "kind": kind,
        "subj_kind": subj_kind,
        "subj_source": subj_source,
        "status": status,
        "as_of": atom.get("as_of"),
    }


def main():
    ap = argparse.ArgumentParser(description="Build the learning corpus.")
    ap.add_argument("--limit", type=int, default=10000)
    args = ap.parse_args()

    print("================================================================")
    print("  CSOAI — LEARNING CORPUS BUILDER")
    print("================================================================")
    print()

    OUT.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    out_path = OUT / f"learn-corpus-{stamp}.jsonl"
    stats = {}
    total = 0

    with open(out_path, "w") as f:
        for jsonl in sorted(QUEUE.glob("**/*.jsonl")):
            if jsonl.name.startswith("_state"):
                continue
            if jsonl.parent.name.startswith("_"):
                continue
            kind = jsonl.parent.name
            stats[kind] = stats.get(kind, 0)
            with open(jsonl) as src:
                for line in src:
                    line = line.strip()
                    if not line or len(line) > MAX_PAYLOAD:
                        continue
                    try:
                        atom = json.loads(line)
                    except Exception:
                        continue
                    rec = learn_record(atom)
                    f.write(json.dumps(rec, separators=(",", ":")) + "\n")
                    stats[kind] += 1
                    total += 1
                    if total >= args.limit:
                        break
            if total >= args.limit:
                break

    print(f"  wrote {total} training pairs")
    print(f"  by kind:")
    for k, n in sorted(stats.items()):
        print(f"    {k:<28} {n}")
    print()
    print(f"  corpus: {out_path}")
    print()
    print(f"  Next: feed to OOWEM retraining (RunPod / Kaggle / Oracle micro)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
