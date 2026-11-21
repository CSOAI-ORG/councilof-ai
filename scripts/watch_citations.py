#!/usr/bin/env python3
"""Cited-numbers watch: check what a consumer cited against the live board.

Input: a JSON file of citations. Two forms:
  {"axis": "governance", "cited": {"n": 237, "fleet_mean": 0.49, "separation": "TIE"}, "cited_at": "..."}
  {"axis": "care", "cited_revision": "csoai/gspc-care@<sha>"}

Output: one csoai.citation-watch/1 record. Every citation gets a state:
  CONSISTENT   — the live board still carries the cited numbers
  DIVERGENT    — the board moved; the diff says which fields
  UNMEASURED   — the axis is no longer measured on the board
  NOT_FOUND    — the axis name is not on the board at all
A deliberately wrong expectation must come out DIVERGENT (negative control), and a whole-record digest is stamped so
the watch result itself is citable.
"""
import json, sys, hashlib, urllib.request, datetime

BOARD = "https://councilof.ai/api/gspc"
FIELDS = ("n", "fleet_mean", "separation")

def get(url):
    req = urllib.request.Request(url, headers={"user-agent": "csoai-citation-watch/1"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()

def main(citations_path, out=None):
    cites = json.load(open(citations_path))
    board = json.loads(get(BOARD))
    axes = {a["axis"]: a for a in board.get("axes", [])}
    rows = []
    for c in cites:
        name = c.get("axis")
        cited = c.get("cited") or {}
        row = {"axis": name, "cited_at": c.get("cited_at"), "cited": cited or None,
               "cited_revision": c.get("cited_revision")}
        a = axes.get(name)
        if a is None:
            row.update(state="NOT_FOUND", live=None)
        elif a.get("status") != "MEASURED":
            row.update(state="UNMEASURED", live={"status": a.get("status")})
        else:
            live = {k: a.get(k) for k in FIELDS}
            diff = {k: {"cited": cited.get(k), "live": live[k]} for k in FIELDS
                    if cited and cited.get(k) != live[k]}
            if not cited:
                row.update(state="CONSISTENT", live=live,
                           note="no cited numbers supplied; revision/axis presence only")
            elif diff:
                row.update(state="DIVERGENT", live=live, diff=diff)
            else:
                row.update(state="CONSISTENT", live=live)
        rows.append(row)
    doc = {
        "schema": "csoai.citation-watch/1",
        "checked_at": datetime.datetime.now(datetime.UTC).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "board": {"schema": board.get("schema"), "measured_on": board.get("measured_on"),
                  "url": BOARD, "as_of_source": "measured_on is the board's own stamp; root.json as_of anchors the card set"},
        "citations": rows,
        "counts": {},
        "limits": [
            "A CONSISTENT state means the live board still carries the cited numbers; it does not validate the measurement behind them.",
            "This checks the board surface only. Dataset-level drift is the separate board-reconciliation check.",
            "Watch results are dated and digested; cite the digest, not 'the watch page'.",
        ],
    }
    counts = {}
    for r in rows:
        counts[r["state"]] = counts.get(r["state"], 0) + 1
    doc["counts"] = counts
    body = json.dumps(doc, sort_keys=True, ensure_ascii=False).encode()
    doc["digest"] = "sha256:" + hashlib.sha256(body).hexdigest()
    text = json.dumps(doc, indent=1, ensure_ascii=False)
    if out:
        open(out, "w").write(text)
    else:
        print(text)
    return doc

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else None)
