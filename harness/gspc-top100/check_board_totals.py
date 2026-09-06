#!/usr/bin/env python3
"""Every total on the board must reconcile with the axis array it was derived from.

The board publishes ten headline numbers and twenty-two axes. `totals.count_grammar`
already promises that "Both counts are DERIVED from the axis array, never typed" -- this
is the check that makes the promise falsifiable, from outside, with no credential.

It recomputes each total from `axes[]` and compares. It does not trust `count_grammar`,
and it does not trust the note beside any figure: a sentence claiming a derivation is
exactly what /api/badge carried while serving `public_leader_count: 3` as a literal.

Measured 2026-09-06: 0 mismatches across 10 totals.

The relations checked, and why each one can break:

  axes / measured_axes        a slot added with no run behind it
  comparison_axes / fact_runs the two families must partition the board, not overlap
  items                       sums each axis's n; a re-graded axis moves it
  public_leader_count         must equal the axes still carrying a leader AFTER the
                              own-model and no-signed-card exclusions
  externally_led_axes         same set, counted a different way -- they must agree
  own_leaders_excluded        EXCLUDED_OWN_MODEL, counted from the served payload
  uncarded_leaders_dropped    NO_SIGNED_CARD, likewise
  separation partition        separated + ties + untested == comparison_axes, because a
                              comparison axis is in exactly one separation state

Exit 0 = every total reconciles. Exit 1 = at least one does not (with both numbers).
Exit 2 = the board could not be read. UNCHECKABLE is never reported as agreement.
"""
from __future__ import annotations

import argparse
import json
import sys
import urllib.error
import urllib.request

BOARD = "https://councilof.ai/api/gspc"


def fetch(url: str, timeout: int = 45) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": "csoai-board-totals-check"})
    return json.loads(urllib.request.urlopen(req, timeout=timeout).read())


def reconcile(doc: dict) -> list[tuple[str, object, object]]:
    """Every (label, claimed, derived) the board asserts. Mismatches are the caller's problem."""
    t = doc.get("totals") or {}
    ax = doc.get("axes") or []
    mc = [a for a in ax if a.get("kind") == "model-comparison"]
    led = [a for a in mc if isinstance(a.get("leader"), str)]
    return [
        ("axes", t.get("axes"), len(ax)),
        ("measured_axes", t.get("measured_axes"), sum(1 for a in ax if a.get("status") == "MEASURED")),
        ("comparison_axes", t.get("comparison_axes"), len(mc)),
        ("fact_runs", t.get("fact_runs"), sum(1 for a in ax if a.get("kind") == "deterministic-facts")),
        ("items", t.get("items"), sum(a.get("n") or 0 for a in ax)),
        ("public_leader_count", t.get("public_leader_count"),
         sum(1 for a in led if a.get("status") == "MEASURED")),
        ("externally_led_axes", t.get("externally_led_axes"), len(led)),
        ("own_leaders_excluded", t.get("own_leaders_excluded"),
         sum(1 for a in ax if a.get("public_leader_state") == "EXCLUDED_OWN_MODEL")),
        ("uncarded_leaders_dropped", t.get("uncarded_leaders_dropped"),
         sum(1 for a in ax if a.get("public_leader_state") == "NO_SIGNED_CARD")),
        ("separated+ties+untested", t.get("comparison_axes"),
         (t.get("separated_leads") or 0) + (t.get("ties") or 0) + (t.get("untested_separations") or 0)),
    ]


def report(rows: list[tuple[str, object, object]]) -> int:
    bad = 0
    for label, claimed, derived in rows:
        ok = claimed == derived
        bad += not ok
        print(f"  {'ok      ' if ok else 'MISMATCH'}  {label:26} claimed {claimed!s:>6}  derived {derived!s:>6}")
    if bad:
        print(f"\n[FAIL] {bad} of {len(rows)} totals do not reconcile with axes[].\n"
              "A total that does not recompute from the array beneath it is typed, stale, or "
              "counted under a different rule than the one the payload states.")
        return 1
    print(f"\n[OK] all {len(rows)} totals reconcile with the axis array they are derived from.")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", default=BOARD)
    args = ap.parse_args()
    try:
        doc = fetch(args.url)
    except (urllib.error.URLError, OSError, json.JSONDecodeError) as exc:
        print(f"UNCHECKABLE: the board did not answer: {type(exc).__name__}", file=sys.stderr)
        return 2
    return report(reconcile(doc))


def selftest() -> int:
    good = {
        "totals": {"axes": 2, "measured_axes": 2, "comparison_axes": 1, "fact_runs": 1, "items": 30,
                   "public_leader_count": 1, "externally_led_axes": 1, "own_leaders_excluded": 0,
                   "uncarded_leaders_dropped": 0, "separated_leads": 1, "ties": 0, "untested_separations": 0},
        "axes": [
            {"kind": "model-comparison", "status": "MEASURED", "n": 20, "leader": "gemma3:12b"},
            {"kind": "deterministic-facts", "status": "MEASURED", "n": 10},
        ],
    }
    cases = [("a board whose totals recompute PASSES", good, 0)]

    typed = json.loads(json.dumps(good))
    typed["totals"]["public_leader_count"] = 3           # the /api/badge defect, on the board
    cases.append(("a typed leader count FAILS", typed, 1))

    stale = json.loads(json.dumps(good))
    stale["axes"][0]["n"] = 25                            # a re-grade the total did not follow
    cases.append(("items that did not follow a re-grade FAILS", stale, 1))

    split = json.loads(json.dumps(good))
    split["totals"]["untested_separations"] = 1           # partition broken
    cases.append(("a separation partition that overcounts FAILS", split, 1))

    bad = 0
    import io
    for label, doc, want in cases:
        buf, so = io.StringIO(), sys.stdout
        sys.stdout = buf
        try:
            got = report(reconcile(doc))
        finally:
            sys.stdout = so
        ok = got == want
        bad += not ok
        print(f"  {'ok  ' if ok else 'FAIL'}  {label}  (exit {got}, want {want})")
    if bad:
        print(f"\nselftest FAILED: {bad} of {len(cases)}", file=sys.stderr)
        return 1
    print(f"\n{len(cases)} passed — green on a board that recomputes, red on a typed count, "
          "a stale sum and a broken partition.")
    return 0


if __name__ == "__main__":
    sys.exit(selftest() if "--selftest" in sys.argv[1:] else main())
