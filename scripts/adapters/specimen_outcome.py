#!/usr/bin/env python3
"""Record a specimen outcome — the morning-after command (EP3 / TUI-3).

A specimen is worthless if the outcome never lands. This is the one-command
close-out: a human supplies the observed result WITH a source URL (the result
is never scraped blind and never typed without a source), the entry flips to
OUTCOME_RECORDED, and the next hourly public-root run signs the updated
specimen leaf — the pre-commit and the outcome end up in the same signed root,
which is the entire point of the ledger.

Usage (Sep 16, after the cloture vote):
  python3 scripts/adapters/specimen_outcome.py \
      --entry specimen-2026-09-11-clarity-hype \
      --result "cloture failed" --detail "vote 51-47; 60 needed" \
      --source "https://www.senate.gov/legislative/LIS/roll_call_votes/vote1192/..." 

Refuses: unknown entry id, missing --source, a --result longer than one line.
Never touches keys. Never signs. The publisher signs on its next hourly run.
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LEDGER = ROOT / "public" / "interop" / "watch" / "specimen-ledger.json"


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--entry", required=True, help="specimen entry id")
    ap.add_argument("--result", required=True, help="one line: what happened")
    ap.add_argument("--detail", default="", help="e.g. vote count, official numbers")
    ap.add_argument("--source", required=True, help="primary source URL for the result")
    ap.add_argument("--date", default=None, help="outcome date ISO (default: today, UTC)")
    args = ap.parse_args()

    if not args.source.startswith("http"):
        print("refusing: --source must be a URL", file=sys.stderr)
        return 1
    if "\n" in args.result or len(args.result) > 200:
        print("refusing: --result is one line, <=200 chars", file=sys.stderr)
        return 1

    ledger = json.loads(LEDGER.read_text(encoding="utf-8"))
    entry = next((e for e in ledger.get("entries", []) if e.get("id") == args.entry), None)
    if entry is None:
        print(f"refusing: no entry {args.entry!r}", file=sys.stderr)
        return 1
    if entry.get("outcome") is not None:
        print(f"refusing: {args.entry} already has an outcome — append a new entry instead of rewriting history", file=sys.stderr)
        return 1

    recorded = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    entry["outcome"] = {
        "result": args.result,
        "detail": args.detail,
        "source": args.source,
        "outcome_date": args.date or recorded[:10],
        "recorded_at": recorded,
    }
    entry["status"] = "OUTCOME_RECORDED"
    # The verdict line is arithmetic against what was archived, written once:
    ref = entry.get("reference_state_at_archive") or {}
    entry["outcome"]["measured_against"] = {
        "hype_claims": [c.get("claim") for c in entry.get("hype_claims_observed") or []],
        "reference_at_archive": ref,
        "rule": "The hype is measured against the record, not against the price. The record is this ledger's archived_at; the result carries a primary source.",
    }

    LEDGER.write_text(json.dumps(ledger, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"recorded: {args.entry} -> OUTCOME_RECORDED ({args.result})")
    print("next: python3 scripts/adapters/watch_gaps.py  (regenerates the snapshot; the hourly root signs the updated leaf)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
