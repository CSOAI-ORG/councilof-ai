#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Assemble one signed-batch directory from a member's *.events.jsonl files.

    python3 batch.py DIR --member NAME --as-of <UTC>

Writes DIR/events.jsonl (all events, sorted by event_id), DIR/render/{ocsf.jsonl,otel.json,evidence.sarif,
intoto.jsonl,hec.ndjson}, and DIR/batch.json (the unsigned csoai.evidence-batch/0.1 record to board-sign).
Every event is validated first; one invalid event stops the batch.
"""
import argparse, glob, json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import event as E  # noqa: E402
from render import ocsf, otel, sarif, intoto, ecs_hec  # noqa: E402


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("dir"); ap.add_argument("--member", required=True); ap.add_argument("--as-of", required=True)
    a = ap.parse_args(argv)
    evs = []
    for p in sorted(glob.glob(os.path.join(a.dir, "*.events.jsonl"))):
        evs += E.read_jsonl(p)
    evs.sort(key=lambda e: e["event_id"])
    for e in evs:
        E.check_renderable(e)
    ep = os.path.join(a.dir, "events.jsonl")
    E.write_jsonl(ep, evs)
    R = os.path.join(a.dir, "render"); os.makedirs(R, exist_ok=True)
    dump = lambda o: json.dumps(o, ensure_ascii=False, sort_keys=True, indent=1) + "\n"
    open(os.path.join(R, "ocsf.jsonl"), "w").write("".join(json.dumps(ocsf.render(e), sort_keys=True, ensure_ascii=False) + "\n" for e in evs))
    open(os.path.join(R, "otel.json"), "w").write(dump(otel.render_batch(evs)))
    open(os.path.join(R, "evidence.sarif"), "w").write(dump(sarif.render_batch(evs)))
    open(os.path.join(R, "intoto.jsonl"), "w").write("".join(json.dumps(intoto.statement(e), sort_keys=True, ensure_ascii=False) + "\n" for e in evs))
    open(os.path.join(R, "hec.ndjson"), "w").write("".join(json.dumps(ecs_hec.hec(e), sort_keys=True, ensure_ascii=False) + "\n" for e in evs))
    b = E.batch_record(a.member, ep, a.as_of, evs)
    open(os.path.join(a.dir, "batch.json"), "w").write(json.dumps(b, indent=1, ensure_ascii=False) + "\n")
    print(json.dumps({"member": a.member, "events": len(evs), "states": b["state_counts"], "events_sha256": b["events_file"]["sha256"]}))


if __name__ == "__main__":
    main()
