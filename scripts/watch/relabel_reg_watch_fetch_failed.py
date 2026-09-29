#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Derive reg-watch-derived/relabel-fetch-failed-20260929.json from reg-watch-events/ (read-only).

Under the change-detection rule adopted 29 Sep 2026 (harness-router-20260929 winner gated_fetchok_2fetch), a fetch
whose body hashes to e3b0c442... (the empty string) is FETCH_FAILED, never an observation. Every historical
provision-change event with that hash on either side is relabelled FETCH_FAILED HERE, in a new derived file.
The event files themselves are history and are never rewritten: each row pins the event file's sha256.

  python3 scripts/watch/relabel_reg_watch_fetch_failed.py [--check]
"""
import hashlib, json, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
EVENTS = ROOT / "reg-watch-events"
OUT = ROOT / "reg-watch-derived" / "relabel-fetch-failed-20260929.json"
EMPTY = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"


def build():
    rows, n = [], 0
    for p in sorted(EVENTS.glob("*.json")):
        n += 1
        b = p.read_bytes(); d = json.loads(b)
        prev, cur = d["previous"]["body_sha256"], d["current"]["body_sha256"]
        if EMPTY not in (prev, cur):
            continue
        rows.append({"event_file": f"reg-watch-events/{p.name}", "event_sha256": hashlib.sha256(b).hexdigest(),
                     "instrument": d["instrument"], "detected_at": d["detected_at"],
                     "original_detection_basis": d.get("detection_basis"),
                     "empty_body_side": "previous" if prev == EMPTY else "current",
                     "relabel": "FETCH_FAILED",
                     "why": ("the " + ("previous" if prev == EMPTY else "current") + " body hashes to the empty string: "
                             "that side was a failed fetch, so the event was not evidence of a change")})
    return {"schema": "csoai.reg-watch-relabel/0.1", "derived_from": "reg-watch-events/*.json (unchanged)",
            "rule": "fetch_ok = HTTP 2xx and a non-empty body whose sha256 != e3b0c442...; an event with an empty-body "
                    "side is FETCH_FAILED, not a provision change (harness-router-20260929, change-detection winner "
                    "gated_fetchok_2fetch; owner ruling 29 Sep 2026 'adopt the winners')",
            "history_rewritten": False, "n_events_read": n, "n_relabelled": len(rows),
            "n_not_relabelled": n - len(rows),
            "not_relabelled_note": "the remaining events had two non-empty, different bodies and no confirming fetch: "
                                   "UNKNOWN under the new rule (neither confirmed nor refuted); left as recorded",
            "events": rows}


if __name__ == "__main__":
    doc = build()
    text = json.dumps(doc, indent=1, sort_keys=True) + "\n"
    if "--check" in sys.argv:
        ok = OUT.exists() and OUT.read_text() == text
        print(("OK " if ok else "STALE ") + str(OUT.relative_to(ROOT))); sys.exit(0 if ok else 1)
    OUT.parent.mkdir(parents=True, exist_ok=True); OUT.write_text(text)
    print(f"wrote {OUT.relative_to(ROOT)}: {doc['n_relabelled']} of {doc['n_events_read']} events relabelled FETCH_FAILED")
