#!/usr/bin/env python3
"""Data-10x engine #1 — auto-sweep dispatcher: watch model registries, queue measurement.
Couples to the reg-watch detector. Queues to the pod via the supervisor's bench job
(queue owns placement).

RECENCY FILTER (repaired 2026-08-26). It previously never fired. Two faults, one hiding
the other:

  1. `datetime.datetime.fromisoformat(...)` was called on the imported *class*, so every
     model raised `AttributeError: type object 'datetime.datetime' has no attribute
     'datetime'`.
  2. A bare `except` swallowed that AttributeError and set the parsed date to None, and
     the guard `(c is None or c >= cutoff)` then admitted every model — while the output
     was labelled "RECENCY-FILTERED".

Also fixed: the HF payload field is `createdAt`, not `created_at`, so even a corrected
call would have parsed nothing.

Rules now: only a model whose release date PARSES and is within the window is queued as
recent. A model whose date is missing or unparseable is NOT admitted and NOT silently
dropped — it is counted and reported as `date-unknown`. The except catches only the
parse errors a bad date string produces (ValueError/TypeError); a programming error such
as the original AttributeError propagates and the run fails loudly.
"""
import json, os, sys, urllib.request
from datetime import datetime, timedelta, timezone

SEEN = os.path.expanduser("~/.grokbot/harness/mine/swept-models.json")
QUEUE = os.path.expanduser("~/.grokbot/harness/mine/sweep-queue.json")
WINDOW_DAYS = 7
HF_URL = "https://huggingface.co/api/models?sort=createdAt&direction=-1&limit=20"


def load(p, default):
    try:
        return json.load(open(p))
    except FileNotFoundError:
        return default
    except (json.JSONDecodeError, OSError) as e:
        print(f"warn: {p} unreadable ({type(e).__name__}: {e}) — using default")
        return default


def parse_created(m):
    """Return (datetime|None, raw). None means the date could not be parsed — which is
    'unknown', never 'recent'."""
    raw = m.get("createdAt") or m.get("created_at") or ""
    if not raw:
        return None, raw
    try:
        return datetime.fromisoformat(str(raw).replace("Z", "+00:00")), raw
    except (ValueError, TypeError):
        return None, raw


def classify(m, cutoff):
    """'recent' | 'stale' | 'date-unknown' — a model is only ever queued when 'recent'."""
    c, _ = parse_created(m)
    if c is None:
        return "date-unknown"
    if c.tzinfo is None:
        c = c.replace(tzinfo=timezone.utc)
    return "recent" if c >= cutoff else "stale"


def main():
    seen = load(SEEN, {"models": []})
    known = {m["id"] for m in seen["models"]}
    queue = load(QUEUE, {"pending": []})
    pending = [q for q in queue["pending"] if q not in known]

    cutoff = datetime.now(timezone.utc) - timedelta(days=WINDOW_DAYS)
    counts = {"recent": 0, "stale": 0, "date-unknown": 0, "already-known": 0}
    new, unknown_dates = [], []
    try:
        req = urllib.request.Request(HF_URL, headers={"User-Agent": "csoai-measure/0.1"})
        models = json.loads(urllib.request.urlopen(req, timeout=20).read())
    except Exception as e:                       # network only — never a parse error
        print("hf watch err:", str(e)[:60])
        models = []

    for m in models:
        mid = m.get("id")
        if not mid:
            continue
        if mid in known or mid in pending:
            counts["already-known"] += 1
            continue
        verdict = classify(m, cutoff)
        counts[verdict] += 1
        if verdict == "recent":
            _, raw = parse_created(m)
            new.append({"id": mid, "released": raw, "signal": "hf-recent"})
        elif verdict == "date-unknown":
            unknown_dates.append(mid)

    if new:
        pending = pending + [n["id"] for n in new]
        json.dump({"pending": pending, "queued_at": datetime.now(timezone.utc).isoformat()},
                  open(QUEUE, "w"), indent=2)

    print(f"auto-sweep: seen {len(models)} models from HF | window {WINDOW_DAYS}d "
          f"(cutoff {cutoff.isoformat()})")
    print(f"  recent={counts['recent']} stale={counts['stale']} "
          f"date-unknown={counts['date-unknown']} already-known={counts['already-known']}")
    if unknown_dates:
        print(f"  NOT queued, date unparseable (reported, never admitted as recent): "
              f"{', '.join(unknown_dates[:5])}" + (" ..." if len(unknown_dates) > 5 else ""))
    print(f"auto-sweep: {len(new)} new models queued ({len(pending)} pending) — "
          "sweep fires on pod via queue")
    return len(new)


def _selftest():
    """Prove the filter fires: feed it exactly the inputs it used to wave through."""
    ok = True

    def expect(name, cond, detail=""):
        nonlocal ok
        print(f"  {'PASS' if cond else 'FAIL'}  {name}" + (f" — {detail}" if not cond and detail else ""))
        ok = ok and cond

    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(days=WINDOW_DAYS)
    cases = [
        ({"createdAt": (now - timedelta(days=1)).isoformat().replace("+00:00", "Z")}, "recent"),
        ({"createdAt": (now - timedelta(days=6, hours=23)).isoformat()}, "recent"),
        ({"createdAt": (now - timedelta(days=8)).isoformat().replace("+00:00", "Z")}, "stale"),
        ({"createdAt": (now - timedelta(days=400)).isoformat()}, "stale"),
        ({"createdAt": ""}, "date-unknown"),
        ({"createdAt": "not-a-date"}, "date-unknown"),
        ({}, "date-unknown"),
        # the old bug's blind spot: HF sends createdAt, the code read created_at
        ({"created_at": (now - timedelta(days=400)).isoformat()}, "stale"),
    ]
    for payload, want in cases:
        got = classify(payload, cutoff)
        expect(f"{str(payload)[:46]:48s} -> {want}", got == want, f"got {got}")
    expect("an unknown date is never treated as recent",
           classify({"createdAt": "garbage"}, cutoff) != "recent")
    print("  selftest:", "OK" if ok else "FAILED")
    return 0 if ok else 1


if __name__ == "__main__":
    if "--selftest" in sys.argv:
        sys.exit(_selftest())
    main()
