#!/usr/bin/env python3
"""corrections_latency.py — measure what the corrections ledger can support, and say what it cannot.

TUI-4 (admission, signing, roots, corrections). The brief orders: "maintain
append-only correction/retraction records and measure correction latency."

Measured finding up front, stated where a reader hits it:

  CORRECTION LATENCY (error introduced -> corrected) IS NOT MEASURABLE from the
  current ledger schema. Every entry carries exactly one date (the record date).
  There is no error_introduced_at, no first_observed_at, no corrected_at. A
  single timestamp cannot produce a latency, and this script does not pretend
  otherwise: latency fields are emitted as UNMEASURED with the schema gap named,
  never estimated, never zero-filled. The minimal schema extension that makes
  latency measurable is proposed at the bottom of the report.

What IS measured (from the live ledger, or --file for offline review):

  * entry count and cadence (entries per ISO week, first/last dates)
  * status classes (CORRECTED* vs RECORDED* vs anything else — counted exactly,
    not smoothed)
  * evidence-bearing entries: how many name a concrete artifact (PR #, commit
    hex, tx hash, signed file) a stranger could follow
  * self-consistency: duplicate ids, out-of-order dates, missing required fields

Input: GET https://councilof.ai/api/corrections (default) or --file PATH.
Output: JSON report to stdout; exit 0 always (this is a measurement reader,
not a gate — a failing consistency check appears in the report, not the exit code).
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import urllib.request
from collections import Counter
from datetime import date, datetime, timezone

UA = {"User-Agent": "csoai-corrections-latency/1 (+https://councilof.ai)"}
LIVE = "https://councilof.ai/api/corrections"

REQUIRED = ("id", "date", "what_was_wrong", "how_caught", "fix", "status")
EVIDENCE_RE = re.compile(r"(#\d{3,5}\b|\b[0-9a-f]{40}\b|0x[0-9a-f]{16,64}|\b[0-9a-f]{7,12}\b.*commit)", re.I)


def load(args) -> dict:
    if args.file:
        return json.loads(open(args.file, encoding="utf-8").read())
    req = urllib.request.Request(LIVE, headers=UA)
    return json.loads(urllib.request.urlopen(req, timeout=30).read())


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--file", help="read a saved ledger JSON instead of the live API")
    args = ap.parse_args()

    as_of = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    try:
        ledger = load(args)
    except Exception as exc:
        print(json.dumps({"kind": "csoai.corrections-latency/0.1", "as_of": as_of,
                          "status": "UNCHECKABLE",
                          "reason": f"ledger unreadable: {type(exc).__name__}: {str(exc)[:140]}"}, indent=1))
        return 0

    entries = ledger.get("corrections") or []
    ids = [e.get("id") for e in entries]
    dates = [e.get("date") for e in entries if e.get("date")]
    parsed = []
    for d in dates:
        try:
            parsed.append(date.fromisoformat(d))
        except ValueError:
            pass

    weeks = Counter(f"{d.isocalendar().year}-W{d.isocalendar().week:02d}" for d in parsed)
    status_class = Counter()
    for e in entries:
        s = (e.get("status") or "").upper()
        status_class["CORRECTED*" if s.startswith("CORRECTED") else
                     ("RECORDED*" if s.startswith("RECORDED") else "OTHER")] += 1
    missing_status = sum(1 for e in entries if not e.get("status"))
    evidence_bearing = sum(1 for e in entries
                           if EVIDENCE_RE.search((e.get("fix") or "") + " " + (e.get("how_caught") or "")))
    dupes = [i for i, n in Counter(ids).items() if n > 1]
    missing_fields = [{"id": e.get("id"), "missing": [f for f in REQUIRED if not e.get(f)]}
                      for e in entries if any(not e.get(f) for f in REQUIRED)]
    out_of_order = sum(1 for a, b in zip(parsed, parsed[1:]) if b > a)  # ledger is newest-first

    report = {
        "kind": "csoai.corrections-latency/0.1",
        "as_of": as_of,
        "source": args.file or LIVE,
        "entries": len(entries),
        "cadence": {
            "first_record": min(dates) if dates else None,
            "latest_record": max(dates) if dates else None,
            "entries_per_week": dict(sorted(weeks.items())),
        },
        "status_classes": dict(status_class),
        "status_field_absent": missing_status,
        "evidence_bearing_entries": evidence_bearing,
        "consistency": {
            "duplicate_ids": dupes or "none",
            "non_iso_dates": len(dates) - len(parsed),
            "entries_newer_than_previous_row (ledger is newest-first; >0 = order violation)": out_of_order,
            "entries_missing_required_fields": missing_fields or "none",
        },
        "correction_latency": {
            "state": "UNMEASURED",
            "reason": ("one date per entry (the record date). error_introduced_at and "
                       "corrected_at do not exist in the schema, so introduction->correction "
                       "latency cannot be computed without inventing values, which this lane "
                       "never does."),
            "minimal_schema_extension": {
                "first_observed_at": "nullable ISO-8601 — when the error was first seen, where known",
                "corrected_at": "nullable ISO-8601 — when the fix landed, where evidenced",
                "rule": "absent means unknown; never backfill by guessing",
            },
        },
        "scope": "cadence and completeness measurement of the corrections ledger; never a certification",
    }
    print(json.dumps(report, indent=1, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
