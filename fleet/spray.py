#!/usr/bin/env python3
"""spray - N-site spray for measurement work: shard a probe list across free runners BY HOST.

  spray.py plan     --run-id R --source RESULTS.jsonl.gz --probe PROBE.py --n 30 --runners oracle,hf,kaggle
  spray.py dispatch --run-id R --runner oracle|hf|kaggle|runpod
  spray.py merge    --run-id R
  spray.py demo     --run-id R --source ... --probe ... --n 30 --runners oracle,hf,kaggle   (all three, then merge)

Rules this enforces:
  * a host is assigned to exactly ONE runner, so per-host politeness (1 connection, >= 1 s between
    requests, robots.txt, the probe's own HostGate) still holds globally, not just per runner;
  * every runner runs the SAME probe bytes (sha256-pinned in plan.json) on its sha256-pinned shard;
  * each shard's results land in the private dataset under spray/R/shard-<runner>/ (Kaggle and the
    RunPod pod hold no HF token: Oracle pulls their output and publishes it, and says so);
  * merge is COMPLETE only when every shard arrived, verifies, and covers exactly its endpoints;
    otherwise PARTIAL with totals null - a partial read is never totalled.
"""
from __future__ import annotations

import argparse
import base64
import glob
import gzip
import json
import os
import shutil
import subprocess
import sys
import tempfile
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import fleetlib as fl  # noqa: E402

OWN = ("meok.ai", "csoai.org", "councilof.ai")
KAGGLE_USER = os.environ.get("KAGGLE_USER", "nicktempleman")
KERNEL = "csoai-fleet-spray"


def local_dir(run_id):
    d = os.path.expanduser("~/fleet/spray/%s" % run_id)
    os.makedirs(d, exist_ok=True)
    return d


def hub():
    from hub import Hub, read_token
    return Hub("csoai/fleet-heartbeat", read_token())


def select(source, n, per_host_cap=3):
    """Deterministic: census rows by rank, never *.hf.space (could wake a Space), never our own estate."""
    with gzip.open(source, "rt") as f:
        src = [json.loads(l) for l in f if l.strip()]
    src.sort(key=lambda r: (r.get("rank") or 0, r["endpoint"]))
    out, per = [], {}
    for r in src:
        h = fl.host_of(r["endpoint"])
        if not h or h.endswith(".hf.space") or any(h == o or h.endswith("." + o) for o in OWN):
            continue
        if per.get(h, 0) >= per_host_cap:
            continue
        per[h] = per.get(h, 0) + 1
        out.append({"rank": r.get("rank"), "endpoint": r["endpoint"], "ranked_by": r.get("ranked_by"),
                    "transports": r.get("declared_transports") or r.get("transports")})
        if len(out) >= n:
            break
    return out


def cmd_plan(a):
    d = local_dir(a.run_id)
    runners = a.runners.split(",")
    rows = select(a.source, a.n)
    shards = fl.assign_by_host(rows, runners)
    shutil.copyfile(a.probe, os.path.join(d, "probe.py"))
    plan = {"run_id": a.run_id, "created": fl.iso(fl.utcnow()), "source": a.source,
            "probe_sha256": fl.sha256_file(os.path.join(d, "probe.py")), "min_interval_s": 1.0,
            "rule": "split BY HOST: a host is on exactly one runner", "n_endpoints": len(rows), "shards": {}}
    for name, rs in shards.items():
        p = os.path.join(d, "shard-%s.plan.jsonl.gz" % name)
        with gzip.GzipFile(p, "wb", mtime=0) as g:
            for r in rs:
                g.write((json.dumps(r, sort_keys=True) + "\n").encode())
        plan["shards"][name] = {"endpoints": [r["endpoint"] for r in rs],
                                "hosts": sorted({fl.host_of(r["endpoint"]) for r in rs}),
                                "plan_sha256": fl.sha256_file(p)}
    fl.atomic_write_json(os.path.join(d, "plan.json"), plan)
    up = {"spray/%s/%s" % (a.run_id, os.path.basename(p)): p for p in glob.glob(os.path.join(d, "*")) if os.path.isfile(p)}
    hub().upload_paths(up, "spray %s plan: %d endpoints, %s" % (a.run_id, len(rows),
                       {k: len(v["endpoints"]) for k, v in plan["shards"].items()}))
    print(json.dumps({k: {"endpoints": len(v["endpoints"]), "hosts": len(v["hosts"])} for k, v in plan["shards"].items()}))
    return plan


def publish_pulled(run_id, shard, out, runner):
    """Oracle publishes a shard it pulled from a token-less runner; re-derives the sha first."""
    m = json.load(open(os.path.join(out, "manifest.json")))
    rp = os.path.join(out, "results.jsonl.gz")
    if m.get("results_sha256") != (fl.sha256_file(rp) if os.path.exists(rp) else None):
        raise SystemExit("pulled shard %s: results sha256 does not match its manifest" % shard)
    m["uploaded_by"] = "oracle-micro-2 (%s holds no HF token by design)" % runner
    json.dump(m, open(os.path.join(out, "manifest.json"), "w"), indent=1, sort_keys=True)
    up = {"spray/%s/shard-%s/%s" % (run_id, shard, f): os.path.join(out, f)
          for f in ("results.jsonl.gz", "not_attempted.jsonl.gz", "summary.json", "manifest.json", "probe.log")
          if os.path.exists(os.path.join(out, f))}
    hub().upload_paths(up, "spray %s shard %s (pulled from %s)" % (run_id, shard, runner))


def kaggle_kernel_dir(run_id, shard):
    d = local_dir(run_id)
    kd = os.path.join(d, "kaggle-kernel")
    os.makedirs(kd, exist_ok=True)
    blobs = {}
    for f in ("plan.json", "probe.py", "shard-%s.plan.jsonl.gz" % shard):
        blobs[f] = base64.b64encode(open(os.path.join(d, f), "rb").read()).decode()
    blobs["spray_worker.py"] = base64.b64encode(open(os.path.join(HERE, "spray_worker.py"), "rb").read()).decode()
    src = ("# csoai fleet spray shard (generated by fleet/spray.py; no credentials inside)\n"
           "import base64, os, subprocess, sys\n"
           "B = %s\n"
           "os.makedirs('/kaggle/working/in', exist_ok=True)\n"
           "for k, v in B.items():\n"
           "    open('/kaggle/working/in/' + k, 'wb').write(base64.b64decode(v))\n"
           "os.environ['FLEET_RUNNER'] = 'kaggle'\n"
           "rc = subprocess.call([sys.executable, '/kaggle/working/in/spray_worker.py', '--run-id', %r, '--shard', %r,\n"
           "                      '--plan-dir', '/kaggle/working/in', '--out', '/kaggle/working/out'])\n"
           "print('worker rc', rc)\n") % (json.dumps(blobs), run_id, shard)
    open(os.path.join(kd, "spray_kernel.py"), "w").write(src)
    json.dump({"id": "%s/%s" % (KAGGLE_USER, KERNEL), "title": KERNEL, "code_file": "spray_kernel.py",
               "language": "python", "kernel_type": "script", "is_private": True, "enable_gpu": False,
               "enable_tpu": False, "enable_internet": True, "dataset_sources": [], "competition_sources": [],
               "kernel_sources": [], "model_sources": []}, open(os.path.join(kd, "kernel-metadata.json"), "w"), indent=1)
    return kd


def kaggle(*args, timeout=300):
    p = subprocess.run([os.path.expanduser("~/bin/kaggle")] + list(args), capture_output=True, text=True, timeout=timeout)
    return p.returncode, (p.stdout + p.stderr).strip()


def run_kaggle(run_id, shard, wait_s=2400):
    kd = kaggle_kernel_dir(run_id, shard)
    rc, out = kaggle("kernels", "push", "-p", kd)
    print("kaggle push:", rc, out[-300:])
    if rc != 0:
        return False
    ref = "%s/%s" % (KAGGLE_USER, KERNEL)
    t0 = time.time()
    time.sleep(30)
    st = ""
    while time.time() - t0 < wait_s:
        rc, st = kaggle("kernels", "status", ref)
        if any(x in st.lower() for x in ("complete", "error", "cancel")):
            break
        time.sleep(30)
    print("kaggle status:", st[-200:])
    if "complete" not in st.lower():
        return False
    pull = tempfile.mkdtemp(prefix="kaggle-pull-", dir=local_dir(run_id))
    rc, out = kaggle("kernels", "output", ref, "-p", pull, timeout=600)
    man = glob.glob(os.path.join(pull, "**", "manifest.json"), recursive=True)
    if not man:
        print("kaggle output had no manifest:", out[-300:])
        return False
    publish_pulled(run_id, shard, os.path.dirname(man[0]), "kaggle")
    return True


def run_hf(run_id, shard, wait_s=2400):
    from supervisor import BOOT
    h = hub()
    cmd = BOOT + "FLEET_RUNNER=hf-job python spray_worker.py --run-id %s --shard %s --from-hub --out /tmp/out --publish\n" % (run_id, shard)
    jid = h.run_job(["bash", "-c", cmd], flavor="cpu-basic", timeout=1800,
                    labels={"lane": "fleet-supervisor", "role": "spray", "run": run_id}, secrets={"HF_TOKEN": h.token})
    print("hf job", jid)
    t0 = time.time()
    st = ""
    while time.time() - t0 < wait_s:
        st = h.job_stage(jid)
        if st in ("COMPLETED", "ERROR", "CANCELED", "DELETED"):
            break
        time.sleep(20)
    print("hf job stage:", st)
    return st == "COMPLETED"


def run_runpod(run_id, shard, pod="dgj6roe9sazwsd"):
    """The RunPod backup CPU pod: only when the funding watchdog says GREEN (fresh). No token goes there."""
    lvl, why = fl.funding_level({"budget": {}}, fl.utcnow())
    if lvl != "GREEN":
        print("runpod refused: funding %s (%s)" % (lvl, why))
        return False
    info = json.loads(subprocess.run([os.path.expanduser("~/bin/runpodctl"), "pod", "get", pod],
                                     capture_output=True, text=True, timeout=60).stdout)
    d = local_dir(run_id)
    tmp = tempfile.mkdtemp(prefix="rp-", dir=d)
    for f in ("plan.json", "probe.py", "shard-%s.plan.jsonl.gz" % shard):
        shutil.copy(os.path.join(d, f), tmp)
    shutil.copy(os.path.join(HERE, "spray_worker.py"), tmp)
    tar_in = subprocess.run(["tar", "czf", "-", "-C", tmp, "."], capture_output=True).stdout
    remote = ("rm -rf /tmp/fsp && mkdir -p /tmp/fsp/in && tar xzf - -C /tmp/fsp/in && cd /tmp/fsp && "
              "FLEET_RUNNER=runpod-backup python3 in/spray_worker.py --run-id %s --shard %s --plan-dir in --out out "
              ">/tmp/fsp/worker.log 2>&1; tar czf - -C /tmp/fsp out" % (run_id, shard))
    p = subprocess.run(["ssh", "-o", "BatchMode=yes", "-o", "StrictHostKeyChecking=accept-new", "-i",
                        os.path.expanduser("~/.ssh/fleet_runpod_ed25519"), "-p", str(info["ssh"]["port"]),
                        "root@" + info["ssh"]["ip"], remote], input=tar_in, capture_output=True, timeout=2400)
    subprocess.run(["tar", "xzf", "-", "-C", tmp], input=p.stdout)
    if not os.path.exists(os.path.join(tmp, "out", "manifest.json")):
        print("runpod shard produced no manifest", p.stderr[-300:])
        return False
    publish_pulled(run_id, shard, os.path.join(tmp, "out"), "runpod-backup")
    return True


def run_oracle(run_id, shard):
    out = os.path.join(local_dir(run_id), "out-" + shard)
    env = dict(os.environ, FLEET_RUNNER="oracle-micro-2")
    return subprocess.call([sys.executable, os.path.join(HERE, "spray_worker.py"), "--run-id", run_id, "--shard", shard,
                            "--from-hub", "--out", out, "--publish"], env=env) == 0


def cmd_dispatch(a):
    fn = {"oracle": lambda: run_oracle(a.run_id, "oracle"), "hf": lambda: run_hf(a.run_id, "hf"),
          "kaggle": lambda: run_kaggle(a.run_id, "kaggle"), "runpod": lambda: run_runpod(a.run_id, "runpod")}[a.runner]
    ok = fn()
    print(a.runner, "OK" if ok else "FAILED")
    return 0 if ok else 1


def cmd_merge(a):
    h = hub()
    pre = "spray/%s/" % a.run_id
    plan = h.read_json(pre + "plan.json")
    mans = {}
    for name in plan["shards"]:
        m = h.read_json(pre + "shard-%s/manifest.json" % name)
        if m:
            b = h.read_bytes(pre + "shard-%s/results.jsonl.gz" % name)
            m["results_sha256_recomputed"] = fl.sha256_bytes(b) if b is not None else None
        mans[name] = m
    v = fl.merge_verdict(plan, mans)
    v.update(run_id=a.run_id, merged_at=fl.iso(fl.utcnow()),
             runners={k: {"runner": (m or {}).get("runner"), "ran_on": (m or {}).get("ran_on"),
                          "n_endpoints": len(plan["shards"][k]["endpoints"]), "hosts": len(plan["shards"][k]["hosts"]),
                          "uploaded_by": (m or {}).get("uploaded_by", "the runner itself"),
                          "states": (m or {}).get("states")} for k, m in mans.items()},
             what_this_is="a re-probe of %d census endpoints with the pinned census probe (sha256 %s), sharded by host; "
                          "discovery-probe states, not a measurement of any server's quality" % (plan["n_endpoints"], plan["probe_sha256"][:16]))
    h.put({pre + "merge.json": v}, None, "spray %s merge: %s" % (a.run_id, v["state"]))
    fl.atomic_write_json(os.path.join(local_dir(a.run_id), "merge.json"), v)
    print(json.dumps({k: v[k] for k in ("state", "totals", "per_shard", "problems")}, indent=1))
    return 0 if v["state"] == "COMPLETE" else 3


def cmd_demo(a):
    import threading
    cmd_plan(a)
    res = {}
    ths = [threading.Thread(target=lambda r=r: res.__setitem__(r, {"hf": lambda: run_hf(a.run_id, "hf"),
                                                                    "kaggle": lambda: run_kaggle(a.run_id, "kaggle"),
                                                                    "runpod": lambda: run_runpod(a.run_id, "runpod"),
                                                                    "oracle": lambda: run_oracle(a.run_id, "oracle")}[r]()))
           for r in a.runners.split(",")]
    for t in ths:
        t.start()
    for t in ths:
        t.join()
    print("runners:", res)
    return cmd_merge(a)


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("cmd", choices=["plan", "dispatch", "merge", "demo"])
    ap.add_argument("--run-id", required=True)
    ap.add_argument("--source")
    ap.add_argument("--probe")
    ap.add_argument("--n", type=int, default=30)
    ap.add_argument("--runners", default="oracle,hf,kaggle")
    ap.add_argument("--runner")
    a = ap.parse_args(argv)
    return {"plan": lambda: (cmd_plan(a), 0)[1], "dispatch": lambda: cmd_dispatch(a),
            "merge": lambda: cmd_merge(a), "demo": lambda: cmd_demo(a)}[a.cmd]()


if __name__ == "__main__":
    sys.exit(main())
