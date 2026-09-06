#!/usr/bin/env python3
"""Pull side of /interop/revenue-history.json.

Producer: a loop on the RunPod pod appends one row per UTC day from GET /api/revenue to the Hub dataset
csoai/revenue-history (scripts/pod-loops/revenue-snapshot.sh). This script is the ONLY writer of
public/interop/revenue-history.json: it reads that Hub file and derives the page. Nothing here is typed
by hand and the artefact is never edited directly — regenerate it (fix-producer rule).

    python3 scripts/interop/pull-revenue-history.py            # writes public/interop/revenue-history.json
    python3 scripts/interop/pull-revenue-history.py --check    # exit 1 if the committed file differs from a fresh pull

Fails closed: if the dataset cannot be read (absent, private, network) the exit code is 2 UNCHECKABLE and
the committed file is left exactly as it was — an unreadable source is never written down as an empty history.
Rows are validated (date, one_number.definition, integers-or-null) and any row that fails is listed under
`rows_rejected` rather than silently dropped.
"""
import argparse, json, sys, time, urllib.request, urllib.error
from pathlib import Path

SRC = "https://huggingface.co/datasets/csoai/revenue-history/resolve/main/revenue-history.jsonl"
OUT = Path("public/interop/revenue-history.json")
UA = "csoai-pull-revenue-history/0.1 (+https://councilof.ai/interop/)"


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.status, r.read().decode("utf-8")


def valid(row):
    on = row.get("one_number")
    if not isinstance(row.get("date"), str) or len(row["date"]) != 10:
        return "date"
    if not isinstance(on, dict) or not isinstance(on.get("definition"), str) or not on["definition"]:
        return "one_number.definition"
    for k in ("all_time", "last_30d", "settlements", "self_settlements", "zero_value_settlements"):
        v = on.get(k)
        if v is not None and not (isinstance(v, int) and not isinstance(v, bool)):
            return f"one_number.{k}"
    return None


def build(text):
    rows, rejected = [], []
    for n, line in enumerate(text.splitlines(), 1):
        if not line.strip():
            continue
        try:
            row = json.loads(line)
        except Exception:
            rejected.append({"line": n, "reason": "not json"}); continue
        why = valid(row)
        (rejected.append({"line": n, "reason": why}) if why else rows.append(row))
    by_date = {}
    for r in rows:  # last row for a date wins; the producer writes one per date, this guards a double append
        by_date[r["date"]] = r
    series = [{"date": d, "fetched_at": r.get("fetched_at"), "status": r["one_number"].get("status"),
               "all_time": r["one_number"].get("all_time"), "last_30d": r["one_number"].get("last_30d"),
               "settlements": r["one_number"].get("settlements"), "self_settlements": r["one_number"].get("self_settlements"),
               "zero_value_settlements": r["one_number"].get("zero_value_settlements"),
               "records_unreadable": r["one_number"].get("records_unreadable"),
               "settled_usdc": (r.get("settled_usdc") or {}).get("value")} for d, r in sorted(by_date.items())]
    latest = series[-1] if series else None
    return {
        "kind": "csoai.revenue-history/v0",
        "as_of": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "source": SRC,
        "producer": "scripts/pod-loops/revenue-snapshot.sh on RunPod (one row per UTC day from GET /api/revenue); "
                    "this file is derived by scripts/interop/pull-revenue-history.py and never hand-edited",
        "one_number_definition": rows[-1]["one_number"]["definition"] if rows else None,
        "null_rule": "A value is null, never 0, when the endpoint had no source that day.",
        "days": len(series), "latest": latest, "series": series, "rows_rejected": rejected,
        "not": "revenue is earned on issuance, assembly and a durable signature — never a grade; aggregate-only, no per-user data",
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--source", default=SRC)
    a = ap.parse_args()
    try:
        status, text = fetch(a.source)
    except urllib.error.HTTPError as e:
        print(f"UNCHECKABLE {a.source} -> HTTP {e.code}; {OUT} left untouched", file=sys.stderr); return 2
    except Exception as e:
        print(f"UNCHECKABLE {a.source} -> {type(e).__name__}; {OUT} left untouched", file=sys.stderr); return 2
    doc = build(text)
    if not doc["days"]:
        print("UNCHECKABLE dataset readable but holds no valid rows; nothing written", file=sys.stderr); return 2
    if a.check:
        if not OUT.exists():
            print(f"CHECK {OUT} absent", file=sys.stderr); return 1
        old = json.loads(OUT.read_text()); old.pop("as_of", None); new = dict(doc); new.pop("as_of", None)
        if old != new:
            print(f"CHECK {OUT} differs from a fresh pull ({old.get('days')} vs {doc['days']} days)", file=sys.stderr); return 1
        print(f"CHECK ok: {doc['days']} days"); return 0
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(doc, indent=2) + "\n")
    print(f"wrote {OUT}: {doc['days']} days, latest {doc['latest']['date']} all_time={doc['latest']['all_time']} "
          f"rejected={len(doc['rows_rejected'])}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
