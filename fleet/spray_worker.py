#!/usr/bin/env python3
"""spray_worker - run ONE shard of a spray run on whatever runner this is.

  spray_worker.py --run-id R --shard NAME --plan-dir DIR --out OUT          (Kaggle, RunPod: no token)
  spray_worker.py --run-id R --shard NAME --from-hub --out OUT --publish    (Oracle, HF Jobs)

Refuses to run unless the probe script and the shard plan match the sha256 pins in plan.json.
Writes OUT/manifest.json: which endpoints this shard accounted for (attempted + not attempted),
state counts, and the sha256 of results.jsonl.gz, so the merge can check arrival and integrity.
Stdlib only (Python >= 3.8); --publish needs huggingface_hub.
"""
from __future__ import annotations

import argparse
import collections
import datetime
import gzip
import hashlib
import json
import os
import socket
import subprocess
import sys


def sha(p):
    h = hashlib.sha256()
    with open(p, "rb") as fh:
        for c in iter(lambda: fh.read(1 << 20), b""):
            h.update(c)
    return h.hexdigest()


def now():
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def rows(p):
    if not os.path.exists(p):
        return []
    with gzip.open(p, "rt") as f:
        return [json.loads(l) for l in f if l.strip()]


def build_manifest(run_id, shard, plan, out, started, runner):
    res = rows(os.path.join(out, "results.jsonl.gz"))
    skipped = rows(os.path.join(out, "not_attempted.jsonl.gz"))
    states = collections.Counter(r.get("state") for r in res)
    if skipped:
        states["NOT_ATTEMPTED"] += len(skipped)
    rp = os.path.join(out, "results.jsonl.gz")
    return {"run_id": run_id, "shard": shard, "runner": runner, "ran_on": socket.gethostname(),
            "started": started, "finished": now(), "probe_sha256": plan["probe_sha256"],
            "plan_sha256": plan["shards"][shard]["plan_sha256"],
            "results_sha256": sha(rp) if os.path.exists(rp) else None,
            "endpoints_seen": sorted({r["endpoint"] for r in res} | {r["endpoint"] for r in skipped}),
            "hosts": plan["shards"][shard]["hosts"], "states": dict(states), "n_rows": len(res)}


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--run-id", required=True)
    ap.add_argument("--shard", required=True)
    ap.add_argument("--plan-dir")
    ap.add_argument("--from-hub", action="store_true")
    ap.add_argument("--repo", default="csoai/fleet-heartbeat")
    ap.add_argument("--out", required=True)
    ap.add_argument("--publish", action="store_true")
    ap.add_argument("--workers", type=int, default=4)
    ap.add_argument("--budget-s", type=float, default=900)
    a = ap.parse_args(argv)
    runner = os.environ.get("FLEET_RUNNER", a.shard)
    d = a.plan_dir or os.path.join(a.out, "_in")
    os.makedirs(d, exist_ok=True)
    os.makedirs(a.out, exist_ok=True)
    pre = "spray/%s/" % a.run_id
    hub = None
    if a.from_hub or a.publish:
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        from hub import Hub, read_token
        hub = Hub(a.repo, read_token())
    if a.from_hub:
        for f in ("plan.json", "probe.py", "shard-%s.plan.jsonl.gz" % a.shard):
            b = hub.read_bytes(pre + f)
            if b is None:
                raise SystemExit("missing %s%s on the hub" % (pre, f))
            with open(os.path.join(d, f), "wb") as fh:
                fh.write(b)
    plan = json.load(open(os.path.join(d, "plan.json")))
    probe, sp = os.path.join(d, "probe.py"), os.path.join(d, "shard-%s.plan.jsonl.gz" % a.shard)
    if sha(probe) != plan["probe_sha256"]:
        raise SystemExit("REFUSED: probe sha256 %s != pin %s" % (sha(probe), plan["probe_sha256"]))
    if sha(sp) != plan["shards"][a.shard]["plan_sha256"]:
        raise SystemExit("REFUSED: shard plan sha256 mismatch")
    started = now()
    p = subprocess.run([sys.executable, probe, "--plan", sp, "--out", a.out, "--workers", str(a.workers),
                        "--budget-s", str(a.budget_s), "--min-interval", str(plan.get("min_interval_s", 1.0))],
                       capture_output=True, text=True)
    with open(os.path.join(a.out, "probe.log"), "w") as fh:
        fh.write(p.stdout[-20000:] + p.stderr[-20000:])
    m = build_manifest(a.run_id, a.shard, plan, a.out, started, runner)
    m["probe_rc"] = p.returncode
    with open(os.path.join(a.out, "manifest.json"), "w") as fh:
        json.dump(m, fh, indent=1, sort_keys=True)
    if a.publish:
        up = {}
        for f in ("results.jsonl.gz", "not_attempted.jsonl.gz", "summary.json", "manifest.json", "probe.log"):
            if os.path.exists(os.path.join(a.out, f)):
                up["%sshard-%s/%s" % (pre, a.shard, f)] = os.path.join(a.out, f)
        hub.upload_paths(up, "spray %s shard %s (%s) %d rows" % (a.run_id, a.shard, runner, m["n_rows"]))
    print(json.dumps({k: m[k] for k in ("shard", "runner", "ran_on", "n_rows", "states", "results_sha256")}, indent=1))
    return 0 if p.returncode == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
