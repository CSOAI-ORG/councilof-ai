#!/usr/bin/env python3
"""CL-1 — restatement watch over a cumulative counter that cannot be recomputed.

"$34,177,623,388,199 transaction value enabled" is a running total published by its own subject.
There is no public dataset from which a stranger can recompute it, so it cannot be verified, and
this harness does not pretend to. What a stranger CAN do is watch it: capture the figure from the
page on a schedule, keep every dated reading with the byte digest of the page it came from, and
notice if the series ever moves DOWN — a downward move in a cumulative counter is a restatement,
and a restatement that happens silently is exactly the thing a claim register exists to catch.

One capture is not a measurement. Until the series holds readings from at least two distinct UTC
dates the state is UNMEASURED and the artifact says so in those words. The series is published
as JSONL beside the registry so anyone can extend it or check ours against their own.

A downward move is reported as `observed change requiring review`. It is never reported as an
error, a correction, a misstatement or a falsehood: a counter may be legitimately restated for
reasons that are none of our business, and this harness has no access to any of them.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

try:
    from . import common as c
except ImportError:
    import common as c  # type: ignore

DEFAULT_SERIES_DIR = Path(__file__).resolve().parents[2] / "public" / "claims" / "series"


def extract_labelled_number(text: str, label: str, look_back: int = 120) -> tuple[int | None, str | None]:
    """The last comma-grouped number in the `look_back` characters before `label`, on VISIBLE text.

    Anchored on the label rather than on the value, so the extractor keeps working when the number
    changes (which is the entire point) and stops working loudly if the label goes away.
    """
    m = re.search(re.escape(label), text, re.I)
    if not m:
        return None, None
    prefix = text[max(0, m.start() - look_back): m.start()]
    nums = re.findall(r"\d{1,3}(?:,\d{3})+", prefix)
    if not nums:
        return None, None
    window = text[max(0, m.start() - look_back): m.end() + 20].strip()
    return int(nums[-1].replace(",", "")), window


def load_series(path: Path) -> list[dict]:
    if not path.exists():
        return []
    return [json.loads(l) for l in path.read_text(encoding="utf-8").splitlines() if l.strip()]


def analyse(series: list[dict]) -> dict:
    """Pure: what a series of dated readings does and does not support. Planted data in the tests."""
    pts = sorted([s for s in series if isinstance(s.get("value"), int)], key=lambda s: s["observed_at"])
    dates = sorted({s["observed_at"][:10] for s in pts})
    changes, decreases = [], []
    for a, b in zip(pts, pts[1:]):
        if b["value"] != a["value"]:
            ch = {"from_observed_at": a["observed_at"], "to_observed_at": b["observed_at"],
                  "from": a["value"], "to": b["value"], "delta": b["value"] - a["value"],
                  "direction": "up" if b["value"] > a["value"] else "down"}
            changes.append(ch)
            if ch["direction"] == "down":
                decreases.append(ch)
    measured = len(dates) >= 2
    return {
        "state": "CLAIM_MEASURED" if measured else "UNMEASURED",
        "reason": None if measured else (
            f"the series holds {len(pts)} reading(s) on {len(dates)} distinct UTC date(s). One capture is "
            "not a measurement: a restatement watch needs at least two dated points before it can report "
            "anything about how the figure behaves, so this claim stays UNMEASURED"),
        "observations": len(pts),
        "distinct_utc_dates": len(dates),
        "first_observed_at": pts[0]["observed_at"] if pts else None,
        "last_observed_at": pts[-1]["observed_at"] if pts else None,
        "first_value": pts[0]["value"] if pts else None,
        "last_value": pts[-1]["value"] if pts else None,
        "changes": changes,
        "downward_revisions": decreases,
        "observed_change_requiring_review": bool(decreases),
        "review_note": ("the series moved DOWN between two readings. A cumulative counter that decreases has "
                        "been restated. This is an observed change requiring review; it is not an allegation, "
                        "an error or a finding that anything was misstated")
        if decreases else None,
    }


def capture(url: str, label: str, claim_id: str, series_dir: Path = DEFAULT_SERIES_DIR,
            write: bool = True) -> dict:
    r = c.get(url, timeout=60)
    src = c.source(r, f"page carrying the label {label!r}")
    if not r["ok"]:
        return {"state": "UNMEASURED", "reason": f"{url}: {r['reason']}", "sources": [src]}
    value, window = extract_labelled_number(c.visible_text(r["body"]), label)
    if value is None:
        return {"state": "UNMEASURED",
                "reason": f"the label {label!r} was not found on the page, or carried no comma-grouped "
                          "number before it; the figure is not read rather than guessed",
                "sources": [src]}
    point = {"claim_id": claim_id, "observed_at": r["accessed_utc"], "value": value,
             "rendered": window, "url": url, "page_sha256": r["sha256"], "page_bytes": r["bytes"]}
    path = series_dir / f"{claim_id}.jsonl"
    if write:
        series_dir.mkdir(parents=True, exist_ok=True)
        with path.open("a", encoding="utf-8") as fh:
            fh.write(json.dumps(point, ensure_ascii=False) + "\n")
    series = load_series(path) if write else [point]
    out = analyse(series)
    out.update({
        "measured_at": c.now_iso(),
        "method": ("fetch the page keylessly; on its VISIBLE text take the last comma-grouped number "
                   f"immediately before the label {label!r}; append the reading with the page's byte digest "
                   "to a published JSONL series; compare consecutive readings for a downward move"),
        "window": f"{out['first_observed_at']} .. {out['last_observed_at']}" if out["observations"] else None,
        "denominator": {"readings_in_series": out["observations"],
                        "distinct_utc_dates": out["distinct_utc_dates"],
                        "minimum_dates_for_a_measurement": 2},
        "latest": point,
        "series_file": f"/claims/series/{claim_id}.jsonl",
        "sources": [src],
        "does_not_prove": [
            "the figure itself is not verified and cannot be: no public dataset recomputes it, so this "
            "harness watches how it is published and never asserts that it is right or wrong",
            "no reading before the first one in the series: the watch begins when it begins",
            "a page that renders the figure only in client-side JavaScript would read as absent here, which "
            "would be a limit of the reader, not a statement about the publisher",
        ],
    })
    return out


if __name__ == "__main__":
    print(json.dumps(capture(sys.argv[1] if len(sys.argv) > 1 else "https://chain.link/",
                             sys.argv[2] if len(sys.argv) > 2 else "transaction value enabled",
                             sys.argv[3] if len(sys.argv) > 3 else "CL-1",
                             write=("--no-write" not in sys.argv)), indent=1, ensure_ascii=False))
