#!/usr/bin/env python3
"""A presence baseline: which of these names are on this page today, so a removal is detectable.

A list of named adopters, a testimonial, a set of proof-points — all of them can be edited away
without anyone being told. The only way an outside reader ever notices is if someone wrote down
what was there before. That is all this does: for a page and a list of names, record which names
appear in the page's VISIBLE text today, with the page's byte digest and the time.

It is not a measurement of anything about the names. It is a baseline, so that a later run can
say "this name was present on <date> and is not present now" — which is an observed change
requiring review, and never an allegation.
"""
from __future__ import annotations

import json
import re
import sys

try:
    from . import common as c
except ImportError:
    import common as c  # type: ignore


def diff(before: dict, after: dict) -> dict:
    """What changed between two baselines of the same page."""
    b = {k for k, v in (before.get("names") or {}).items() if v.get("present")}
    a = {k for k, v in (after.get("names") or {}).items() if v.get("present")}
    removed, added = sorted(b - a), sorted(a - b)
    return {
        "removed_since_baseline": removed,
        "added_since_baseline": added,
        "page_bytes_changed": before.get("page_sha256") != after.get("page_sha256"),
        "observed_change_requiring_review": bool(removed),
        "review_note": ("a name present at the baseline is not present now. This is an observed change "
                        "requiring review. It is not an allegation, and there are many ordinary reasons a "
                        "page changes")
        if removed else None,
    }


def capture(url: str, names: list[str], label: str = "", quote_chars: int = 220) -> dict:
    r = c.get(url, timeout=60)
    src = c.source(r, label or "page carrying the list")
    if not r["ok"]:
        return {"state": "UNMEASURED", "reason": f"{url}: {r['reason']}", "sources": [src]}
    text = c.visible_text(r["body"])
    out: dict[str, dict] = {}
    for n in names:
        m = re.search(r"\b" + re.escape(n) + r"\b", text, re.I)
        out[n] = {"present": bool(m),
                  "quote": (text[max(0, m.start() - quote_chars // 2): m.end() + quote_chars // 2].strip()
                            if m else None)}
    present = [n for n, v in out.items() if v["present"]]
    return {
        "state": "BASELINE_RECORDED",
        "measured_at": c.now_iso(),
        "method": ("fetch the page keylessly and record, for each name, whether it appears in the page's "
                   "VISIBLE text (script and style stripped), with the page's byte digest"),
        "window": "a single point reading at measured_at; a baseline, not a series",
        "denominator": {"names_checked": len(names), "names_present": len(present)},
        "url": url,
        "page_sha256": r["sha256"],
        "page_bytes": r["bytes"],
        "names": out,
        "present": present,
        "absent": [n for n in names if n not in present],
        "sources": [src],
        "does_not_prove": [
            "presence on a page is the page's statement, not a verified fact about the named party",
            "absence today says nothing about whether the name was ever there, or ever will be",
            "this is a baseline for later comparison; on its own it establishes nothing about any party",
        ],
    }


if __name__ == "__main__":
    print(json.dumps(capture(sys.argv[1], sys.argv[2].split(",")), indent=1, ensure_ascii=False))
