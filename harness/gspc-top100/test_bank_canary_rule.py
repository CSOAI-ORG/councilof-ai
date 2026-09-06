#!/usr/bin/env python3
"""The canary rule: a contamination sentinel must never be a graded bank item.

Why this exists
---------------
Three conventions are live across the frozen banks and nothing wrote down which is
which, so `n` means different things on different axes:

  gspc-agi, gspc-care   {"_canary": "GSPC-CANARY-GUID <axis>-csoai-2026"}
                        a standalone row with no `expected` -> not a bank item, excluded
                        from n. CORRECT.

  gspc-affect           `_canary` is a FIELD on every row, null on 41 of 42; the one
                        canary row carries `_canary: "KINGFISHER"` and `expected: null`
                        -> excluded from n by the same rule. CORRECT.

  gspc-swarm            {"case": "__CANARY__ drop", "expected": "CANARY", ...}
                        carries an `expected`, so it IS counted as a bank item AND
                        "CANARY" becomes an allowed label. WRONG on both counts.

A canary exists to detect a model that has memorised the bank. Counting it as an item
inflates n by one and adds a label no real item uses, which is how swarm ended up
reporting a label set that is 39/41 one value.

THE RULE. A canary row is identified by a canary marker (`_canary`, or a `__CANARY__`
sentinel in any string field). It MUST NOT carry a non-null `expected`. Bank readers
count items by `expected`, so this one property is what keeps a canary out of n and out
of the allowed-label set, in every bank, without the reader needing to know which
convention a bank uses.

This test does NOT edit any bank. The banks are frozen and cards are pinned to their
digests; a violating bank is superseded with a new version, never edited in place.
"""
from __future__ import annotations

import json
import sys
import urllib.request
from pathlib import Path

BANKS = (
    "gspc-agi", "gspc-prv", "gspc-asi", "gspc-mcp", "gspc-oss", "gspc-mach",
    "gspc-xr", "gspc-det", "gspc-art5", "gspc-affect", "gspc-jail", "gspc-swarm",
    "gspc-care", "gspc-gov",
)
BASE = "https://huggingface.co/datasets/csoai/{}/resolve/main/items.jsonl"
CANARY_KEYS = ("_canary", "canary")
CANARY_SENTINEL = "__CANARY__"


def is_canary(row: dict) -> bool:
    """A row is a canary if it carries a canary marker in a key or a sentinel string."""
    for k in CANARY_KEYS:
        if k in row and row.get(k) not in (None, ""):
            return True
    for v in row.values():
        if isinstance(v, str) and CANARY_SENTINEL in v:
            return True
    return False


def load(name: str, token: str) -> list[dict] | None:
    req = urllib.request.Request(
        BASE.format(name),
        headers={"Authorization": f"Bearer {token}"} if token else {},
    )
    try:
        text = urllib.request.urlopen(req, timeout=60).read().decode("utf-8")
    except Exception:
        return None  # UNCHECKABLE, never "no violations"
    rows = []
    for line in text.splitlines():
        line = line.strip()
        if line:
            try:
                rows.append(json.loads(line))
            except json.JSONDecodeError:
                pass
    return rows


def check(rows: list[dict]) -> list[str]:
    out = []
    for i, r in enumerate(rows, 1):
        if is_canary(r) and r.get("expected") not in (None, ""):
            out.append(f"row {i}: canary carries expected={r['expected']!r} — it will be counted in n")
    return out


def selftest() -> int:
    """The check must catch a violating row AND pass a compliant one."""
    cases = [
        ("a standalone sentinel with no expected must PASS",
         [{"_canary": "GSPC-CANARY-GUID x"}, {"request": "q", "expected": "COMPLY"}], 0),
        ("a canary FIELD with expected null must PASS",
         [{"item": "q", "_canary": "KINGFISHER", "expected": None}], 0),
        ("a canary carrying an expected must FAIL",
         [{"case": "__CANARY__ drop", "expected": "CANARY"}], 1),
        ("a normal item is never mistaken for a canary",
         [{"request": "q", "expected": "REFUSE"}], 0),
    ]
    bad = 0
    for label, rows, want in cases:
        got = len(check(rows))
        ok = got == want
        bad += not ok
        print(f"  {'ok  ' if ok else 'FAIL'} {label} (violations {got}, want {want})")
    if bad:
        print(f"\nselftest FAILED: {bad} of {len(cases)}", file=sys.stderr)
        return 1
    print(f"\n{len(cases)} passed — the rule provably catches a counted canary and passes a compliant one.")
    return 0


def main() -> int:
    if "--selftest" in sys.argv[1:]:
        return selftest()
    import os

    token = (os.environ.get("HF_TOKEN") or "").strip()
    if not token:
        cached = Path.home() / ".cache" / "huggingface" / "token"
        if cached.is_file():
            token = cached.read_text(encoding="utf-8").strip()
    violations = 0
    unreadable = 0
    for name in BANKS:
        rows = load(name, token)
        if rows is None:
            print(f"  UNCHECKABLE {name} — could not read the bank")
            unreadable += 1
            continue
        bad = check(rows)
        canaries = sum(1 for r in rows if is_canary(r))
        print(f"  {name:14s} rows={len(rows):4d} canaries={canaries} " + ("OK" if not bad else "VIOLATION"))
        for b in bad:
            print(f"      {b}")
        violations += len(bad)
    print(f"\nbanks checked={len(BANKS)-unreadable} unreadable={unreadable} violations={violations}")
    if unreadable:
        # An unread bank is not a clean bank.
        return 2
    return 1 if violations else 0


if __name__ == "__main__":
    raise SystemExit(main())
