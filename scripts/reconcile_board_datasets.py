#!/usr/bin/env python3
"""Reconcile the live board against the public axis-live.jsonl of the dataset each axis names.

No token, no scraping: GET /api/gspc and the dataset files it points at. Exits 1 on any disagreement so a
scheduled run turns a silent drift into a red check.
"""
import json, sys, urllib.request, concurrent.futures as cf

BOARD = "https://councilof.ai/api/gspc"
FIELDS = ("n", "fleet_mean", "separation")

def get(url, timeout=30):
    req = urllib.request.Request(url, headers={"user-agent": "csoai-reconcile/1"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()

def check(axis):
    ds = axis.get("dataset") or ""
    name = axis.get("axis")
    if not ds or "/" not in ds:
        return {"axis": name, "dataset": None, "result": "NO_DATASET"}
    url = f"https://huggingface.co/datasets/{ds}/resolve/main/axis-live.jsonl"
    try:
        doc = json.loads(get(url).decode().splitlines()[0])
    except Exception as exc:
        return {"axis": name, "dataset": ds, "result": "UNREACHABLE", "detail": f"{type(exc).__name__}: {exc}"}
    diff = {k: {"dataset": doc.get(k), "board": axis.get(k)} for k in FIELDS if doc.get(k) != axis.get(k)}
    return {"axis": name, "dataset": ds, "result": "MATCH" if not diff else "DIVERGENT", "diff": diff or None}

def main():
    board = json.loads(get(BOARD))
    axes = [a for a in board.get("axes", []) if a.get("status") == "MEASURED"]
    with cf.ThreadPoolExecutor(max_workers=8) as ex:
        rows = list(ex.map(check, axes))
    counts = {}
    for r in rows:
        counts[r["result"]] = counts.get(r["result"], 0) + 1
    for r in rows:
        if r["result"] not in ("MATCH", "NO_DATASET"):
            print(json.dumps(r, sort_keys=True))
    print(json.dumps({"measured_axes": len(axes), "counts": counts,
                      "board_schema": board.get("schema")}, sort_keys=True))
    return 0 if counts.get("DIVERGENT", 0) == 0 and counts.get("UNREACHABLE", 0) == 0 else 1

if __name__ == "__main__":
    sys.exit(main())
