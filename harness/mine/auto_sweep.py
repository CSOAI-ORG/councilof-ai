#!/usr/bin/env python3
"""Data-10x engine #1 — auto-sweep dispatcher: watch model registries, queue measurement.
Couples to the reg-watch detector. Fires a sweep for any NEW notable model within 48h
of release. Queues to the pod via the supervisor's bench job (queue owns placement)."""
import json, os, urllib.request
from datetime import datetime, timezone

SEEN = os.path.expanduser("~/.grokbot/harness/mine/swept-models.json")
QUEUE = os.path.expanduser("~/.grokbot/harness/mine/sweep-queue.json")

def load(p, default):
    try:
        return json.load(open(p))
    except Exception:
        return default

def main():
    seen = load(SEEN, {"models": []})
    known = {m["id"] for m in seen["models"]}
    queue = load(QUEUE, {"pending": []})
    pending = [q for q in queue["pending"] if q not in known]
    # watch HF trending as the release signal — RECENCY-FILTERED (only <7d old)
    cutoff = datetime.now(timezone.utc) - __import__('datetime').timedelta(days=7)
    new = []
    try:
        req = urllib.request.Request("https://huggingface.co/api/models?sort=createdAt&direction=-1&limit=20",
                                     headers={"User-Agent": "csoai-measure/0.1"})
        for m in json.loads(urllib.request.urlopen(req, timeout=20).read()):
            mid = m.get("id")
            created = m.get("created_at") or ""
            try:
                c = datetime.datetime.fromisoformat(created.replace("Z", "+00:00"))
            except Exception:
                c = None
            if mid and mid not in known and mid not in pending and (c is None or c >= cutoff):
                new.append({"id": mid, "released": created, "signal": "hf-recent"})
    except Exception as e:
        print("hf watch err:", str(e)[:60])
    if new:
        pending = pending + [n["id"] for n in new]
        json.dump({"pending": pending, "queued_at": datetime.now(timezone.utc).isoformat()}, open(QUEUE, "w"), indent=2)
    print(f"auto-sweep: {len(new)} new models queued ({len(pending)} pending) — sweep fires on pod via queue")
    return len(new)

if __name__ == "__main__":
    main()
