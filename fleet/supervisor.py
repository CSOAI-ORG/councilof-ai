#!/usr/bin/env python3
"""supervisor - keep the estate's scheduled jobs alive without a human, on free substrates first.

  supervisor.py --mode primary [--dry-run]   Oracle cron, every 10 min
  supervisor.py --mode twin    [--dry-run]   hourly HF scheduled Job: takes over if Oracle is silent > 30 min
  supervisor.py --publish-code               push this directory (sha256 manifest) to the fleet dataset
  supervisor.py --install-twin [--dry-run]   create the hourly HF scheduled job (idempotent)
  supervisor.py --verify-log                 check the action log's hash chain

Per job (fleet/jobs.yaml), each run: read its health signal -> if bad: (a) retry once on its own
host, (b) then the first failover target that passes every gate (sandbox rule, budget cap, funding
GREEN for RunPod, lease). Every action is one hash-chained line in ~/fleet/actions.jsonl; the run
ends with ~/fleet/fleet_status.json and (primary) one commit of heartbeat + control lease to the
PRIVATE dataset. Stdlib except hub writes (huggingface_hub, lazily).
"""
from __future__ import annotations

import argparse
import json
import os
import shlex
import socket
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import fleetlib as fl  # noqa: E402

CODE_FILES = ["fleetlib.py", "hub.py", "portable.py", "supervisor.py", "spray.py", "spray_worker.py", "jobs.yaml"]
FLEET_DIR = os.path.expanduser(os.environ.get("FLEET_DIR", "~/fleet"))

# Bootstrap for any HF Job we start: fetch code/ from the private dataset, verify every file against
# code/MANIFEST.json (and the manifest against FLEET_CODE_SHA when pinned), then run.
BOOT = r'''set -euo pipefail
pip install -q "huggingface_hub>=1.0" >/dev/null 2>&1
python - <<'PY'
import os, json, hashlib, urllib.request
R = os.environ.get("FLEET_REPO", "csoai/fleet-heartbeat"); T = os.environ["HF_TOKEN"]
def get(p):
    q = urllib.request.Request("https://huggingface.co/datasets/%s/resolve/main/%s" % (R, p), headers={"Authorization": "Bearer " + T})
    return urllib.request.urlopen(q, timeout=60).read()
mb = get("code/MANIFEST.json"); pin = os.environ.get("FLEET_CODE_SHA")
assert not pin or hashlib.sha256(mb).hexdigest() == pin, "manifest pin mismatch"
m = json.loads(mb); os.makedirs("/fleet/inputs", exist_ok=True)
for f, h in m["files"].items():
    b = get("code/" + f); assert hashlib.sha256(b).hexdigest() == h, "sha mismatch " + f
    open("/fleet/" + f, "wb").write(b)
for f in m.get("inputs", []):
    open("/fleet/inputs/" + f, "wb").write(get("inputs/" + f))
print("fleet code", m["manifest_id"][:16], len(m["files"]), "files verified")
PY
cd /fleet
'''


def log(msg):
    print("%s %s" % (fl.iso(fl.utcnow()), msg), flush=True)


def crontab_text():
    try:
        return subprocess.run(["crontab", "-l"], capture_output=True, text=True, timeout=20).stdout
    except Exception:
        return None


def load_state(path):
    try:
        with open(path) as fh:
            return json.load(fh)
    except Exception:
        return {"jobs": {}, "budget": {}}


def hub_or_none(cfg, need=False):
    from hub import Hub, read_token
    tok = read_token()
    if not tok:
        if need:
            raise SystemExit("no HF token")
        return None
    return Hub(cfg["policy"]["heartbeat_repo"], tok, namespace=cfg["policy"].get("hf_namespace", "csoai"))


def job_secrets(hub):
    """What an HF Job we start may hold: the HF token, plus a READ-ONLY RunPod key once the owner issues one
    (~/.secrets/runpod_ro_key). Never the full RunPod key, never the board-sign token."""
    s = {"HF_TOKEN": hub.token}
    p = os.path.expanduser("~/.secrets/runpod_ro_key")
    if os.path.exists(p):
        with open(p) as fh:
            s["RUNPOD_API_KEY_RO"] = fh.read().strip()
    return s


# ----------------------------------------------------------------------------- dispatch
class Dispatcher:
    def __init__(self, cfg, hub, runner_name):
        self.cfg, self.hub, self.runner = cfg, hub, runner_name
        self.pol = cfg["policy"]

    def dispatch(self, job, tgt):
        t = tgt["type"]
        return getattr(self, "_" + t)(job, tgt)

    def _hf_job(self, job, tgt):
        if self.hub is None:
            return {"status": "ERROR", "why": "no hub client"}
        cmd = BOOT + "FLEET_RUNNER=hf-job python portable.py %s --inputs /fleet/inputs --publish\n" % shlex.quote(job["portable"])
        jid = self.hub.run_job(["bash", "-c", cmd], flavor=tgt.get("flavor", "cpu-basic"),
                               timeout=job.get("max_runtime_s", 1800),
                               labels={"lane": "fleet-supervisor", "role": "failover", "job": job["id"]},
                               secrets=job_secrets(self.hub))
        return {"status": "DISPATCHED", "ref": "hf-job:" + jid}

    def _runpod_backup(self, job, tgt):
        pod = tgt.get("pod_id", self.pol.get("runpod_backup_pod"))
        try:
            info = json.loads(subprocess.run([os.path.expanduser("~/bin/runpodctl"), "pod", "get", pod],
                                             capture_output=True, text=True, timeout=60).stdout)
            ip, port = info["ssh"]["ip"], info["ssh"]["port"]
            if info.get("desiredStatus") != "RUNNING":
                return {"status": "ERROR", "why": "pod %s is %s" % (pod, info.get("desiredStatus"))}
        except Exception as e:
            return {"status": "ERROR", "why": "runpodctl pod get failed: %s" % type(e).__name__}
        key = os.path.expanduser(self.pol.get("runpod_ssh_key", "~/.ssh/fleet_runpod_ed25519"))
        with open(os.path.join(HERE, "portable.py"), "rb") as fh:
            code = fh.read()
        ssh = ["ssh", "-o", "BatchMode=yes", "-o", "ConnectTimeout=15", "-o", "StrictHostKeyChecking=accept-new",
               "-i", key, "-p", str(port), "root@" + ip,
               "FLEET_RUNNER=runpod-backup python3 - %s" % shlex.quote(job["portable"])]
        try:
            p = subprocess.run(ssh, input=code, capture_output=True, timeout=job.get("max_runtime_s", 900))
            r = json.loads(p.stdout.decode())
        except Exception as e:
            return {"status": "FAILED", "why": "ssh run failed: %s" % type(e).__name__}
        if self.hub is not None:
            stamp = r["finished"].replace(":", "").replace("-", "")
            r["published_by"] = self.runner
            self.hub.put({"results/%s/latest.json" % job["portable"]: r,
                          "results/%s/%s.json" % (job["portable"], stamp): r}, None,
                         "result %s on runpod-backup ok=%s" % (job["portable"], r.get("ok")))
        return {"status": "SUCCEEDED" if r.get("ok") else "FAILED", "ref": "runpod:%s" % pod,
                "result_ok": r.get("ok")}

    def _kaggle(self, job, tgt):
        kd = os.path.expanduser(tgt["kernel_dir"])
        p = subprocess.run([os.path.expanduser("~/bin/kaggle"), "kernels", "push", "-p", kd],
                           capture_output=True, text=True, timeout=300)
        ok = p.returncode == 0 and "error" not in (p.stdout + p.stderr).lower()
        return {"status": "DISPATCHED" if ok else "FAILED", "ref": "kaggle:%s" % kd,
                "why": (p.stdout + p.stderr).strip()[-200:]}

    def _runpod_pod(self, job, tgt):
        pod = tgt["pod_id"]
        try:
            info = json.loads(subprocess.run([os.path.expanduser("~/bin/runpodctl"), "pod", "get", pod],
                                             capture_output=True, text=True, timeout=60).stdout)
        except Exception as e:
            return {"status": "ERROR", "why": "runpodctl failed: %s" % type(e).__name__}
        if job.get("gpu") and not info.get("gpuCount"):
            return {"status": "ERROR", "why": "pod %s has gpuCount 0 (CPU transfer mode)" % pod}
        return {"status": "ERROR", "why": "no launcher: GPU pod jobs start from the pod's own scheduler"}

    def _proofof_twin(self, job, tgt):
        return {"status": "ERROR", "why": "proofof.ai twin runner not deployed yet (twinrun v0 is manual)"}

    def poll(self, rec):
        ref = rec.get("ref") or ""
        if ref.startswith("hf-job:") and self.hub is not None:
            try:
                st = self.hub.job_stage(ref.split(":", 1)[1])
            except Exception as e:
                return rec.get("status"), "poll failed %s" % type(e).__name__
            m = {"COMPLETED": "SUCCEEDED", "ERROR": "FAILED", "CANCELED": "FAILED", "DELETED": "FAILED"}
            return m.get(st, "RUNNING"), st
        return rec.get("status"), None


# ----------------------------------------------------------------------------- one supervision pass
def supervise(cfg, state, now, this_host, alog, dispatcher, probes, dry_run=False, observe_only=False,
              spawn=None, lease_store=None, lease_holder=None):
    """Evaluate every job; act on the ones this host owns. Returns the status dict. Pure enough to test:
    `spawn(job)` runs a retry, `dispatcher.dispatch(job, tgt)` a failover, lease_store guards both."""
    pol = cfg["policy"]
    jobs_out = {}
    for job in cfg["jobs"]:
        jid = job["id"]
        js = state["jobs"].setdefault(jid, {})
        h = fl.evaluate_health(job, now, probes)
        prev = js.get("last_state")
        # in-flight failovers: learn how they ended so the chain can advance
        for f in js.get("failovers", []):
            if f.get("status") in ("DISPATCHED", "RUNNING") and dispatcher is not None and not dry_run:
                new, raw = dispatcher.poll(f)
                if new != f.get("status"):
                    f["status"] = new
                    alog and alog.append({"at": fl.iso(now), "host": this_host, "job": jid, "action": "failover_status",
                                          "target": f["target"], "ref": f.get("ref"), "status": new, "raw": raw})
        if h["state"] not in fl.BAD:
            if prev in fl.BAD and not dry_run:
                alog and alog.append({"at": fl.iso(now), "host": this_host, "job": jid, "action": "recovered",
                                      "from": prev, "to": h["state"]})
            js["retries"], js["failovers"] = [], [f for f in js.get("failovers", []) if f.get("status") in ("DISPATCHED", "RUNNING")]
        mine = job["host"] == this_host
        verb, why = fl.decide(job, h, js, pol, now, this_host) if mine else ("none", "owned by %s" % job["host"])
        if observe_only and verb in ("retry", "failover"):
            verb, why = "record", "observe-only (control lease held by another supervisor): would " + verb
        act = None
        if verb == "retry":
            act = {"action": "retry", "why": why}
            if not dry_run:
                pid = spawn(job) if spawn else None
                js.setdefault("retries", []).append(fl.iso(now))
                act["pid"] = pid
        elif verb == "failover":
            tgt, refusals = fl.pick_target(job, js, pol, state, now)
            act = {"action": "failover", "why": why, "refused": refusals}
            if tgt is None:
                act["action"] = "failover_blocked"
            else:
                act["target"] = tgt.get("name", tgt["type"])
                if not dry_run:
                    won = True
                    if lease_store is not None:
                        won, cur = fl.take_lease(lease_store, "job-" + jid, lease_holder or this_host,
                                                 job.get("failover_cooldown_s", 3600), now)
                        if not won:
                            act.update(action="failover_skipped_lease", holder=(cur or {}).get("holder"))
                    if won:
                        try:
                            res = dispatcher.dispatch(job, tgt)
                        except Exception as e:
                            res = {"status": "ERROR", "why": "%s: %s" % (type(e).__name__, str(e)[:200])}
                        fl.budget_charge(state, tgt["type"], tgt.get("flavor"), now)
                        rec = dict(res, target=act["target"], at=fl.iso(now))
                        js.setdefault("failovers", []).append(rec)
                        act.update(res)
        elif verb == "record" and h["state"] != prev:
            act = {"action": "record", "why": why}
        if act and not dry_run and alog:
            alog.append(dict({"at": fl.iso(now), "host": this_host, "job": jid, "health": h["state"],
                              "detail": h["detail"][:200]}, **act))
        if h["state"] != prev and not dry_run:
            js["last_state"] = h["state"]
        jobs_out[jid] = {"host": job["host"], "supervise": job["supervise"], "state": h["state"], "age_s": h["age_s"],
                         "detail": h["detail"][:200], "decision": verb, "why": why}
        if act:
            jobs_out[jid]["action"] = {k: v for k, v in act.items() if k in ("action", "target", "status", "ref", "why", "refused")}
    counts = {}
    for v in jobs_out.values():
        counts[v["state"]] = counts.get(v["state"], 0) + 1
    lvl, fwhy = fl.funding_level(pol, now)
    return {"updated": fl.iso(now), "host": this_host, "dry_run": dry_run, "observe_only": observe_only,
            "n_jobs": len(jobs_out), "counts": counts, "funding": {"level": lvl, "why": fwhy},
            "bad": sorted(k for k, v in jobs_out.items() if v["state"] in fl.BAD),
            "noop": sorted(k for k, v in jobs_out.items() if v["state"] == fl.NOOP), "jobs": jobs_out}


def spawn_retry(job):
    logs = os.path.expanduser("~/lanes/logs")
    os.makedirs(logs, exist_ok=True)
    out = open(os.path.join(logs, "fleet-retry-%s.log" % job["id"]), "a")
    cmd = "timeout %d bash -c %s" % (int(job.get("max_runtime_s", 1800)), shlex.quote(job["command"]))
    p = subprocess.Popen(["bash", "-c", cmd], stdout=out, stderr=out, stdin=subprocess.DEVNULL, start_new_session=True)
    return p.pid


# ----------------------------------------------------------------------------- code publishing
def code_manifest(cfg):
    files = {f: fl.sha256_file(os.path.join(HERE, f)) for f in CODE_FILES if os.path.exists(os.path.join(HERE, f))}
    inputs = [os.path.basename(fl.expand(p)) for p in cfg["policy"].get("twin_inputs", []) if os.path.exists(fl.expand(p))]
    m = {"files": files, "inputs": inputs}
    m["manifest_id"] = fl.sha256_bytes(fl.canon(m).encode())
    return m


def publish_code(cfg, hub, force=False):
    m = code_manifest(cfg)
    cur = hub.read_json("code/MANIFEST.json")
    if cur and cur.get("manifest_id") == m["manifest_id"] and not force:
        return False, m
    files = {"code/" + f: open(os.path.join(HERE, f), "rb").read() for f in m["files"]}
    for p in cfg["policy"].get("twin_inputs", []):
        if os.path.exists(fl.expand(p)):
            files["inputs/" + os.path.basename(fl.expand(p))] = open(fl.expand(p), "rb").read()
    files["code/MANIFEST.json"] = (json.dumps(m, indent=1, sort_keys=True) + "\n").encode()
    hub.put(files, None, "fleet code %s" % m["manifest_id"][:16])
    return True, m


# ----------------------------------------------------------------------------- modes
def primary(cfg, args):
    pol = cfg["policy"]
    os.makedirs(FLEET_DIR, exist_ok=True)
    this = pol["primary_host"]
    now = fl.utcnow()
    state_p = os.path.join(FLEET_DIR, "supervisor_state.json")
    state = load_state(state_p)
    hub = None if args.no_hub else hub_or_none(cfg)
    probes = {"crontab": crontab_text()}
    if hub is not None:
        probes["hf_last_modified"] = hub.last_modified
    observe_only, control = False, None
    if hub is not None:
        try:
            control, _ = hub.get("lease/control.json")
        except Exception as e:
            log("hub read failed: %s" % type(e).__name__)
        if fl.lease_state(control, now) == "HELD" and control.get("holder") != this:
            observe_only = True
    alog = fl.ActionLog(os.path.join(FLEET_DIR, "actions.jsonl"))
    disp = Dispatcher(cfg, hub, this)
    st = supervise(cfg, state, now, this, alog, disp, probes, dry_run=args.dry_run, observe_only=observe_only,
                   spawn=spawn_retry, lease_store=hub, lease_holder="oracle-supervisor")
    st["control"] = {"holder": (control or {}).get("holder"), "expires_at": (control or {}).get("expires_at")}
    if args.dry_run:
        fl.atomic_write_json(os.path.join(FLEET_DIR, "fleet_status.dryrun.json"), st)
        print(json.dumps({k: st[k] for k in ("updated", "n_jobs", "counts", "bad", "funding", "observe_only")}, indent=1))
        for k, v in st["jobs"].items():
            if v["decision"] != "none" or v["state"] != fl.OK:
                print("  %-28s %-18s %-8s %s" % (k, v["state"], v["decision"], v["why"][:90]))
        return 0
    fl.atomic_write_json(state_p, state)
    fl.atomic_write_json(os.path.join(FLEET_DIR, "fleet_status.json"), st)
    if hub is not None:
        hb = {k: st[k] for k in ("updated", "host", "n_jobs", "counts", "bad", "funding", "observe_only")}
        hb["jobs"] = {k: {"state": v["state"], "age_s": v["age_s"]} for k, v in st["jobs"].items()}
        try:
            if observe_only:
                hub.put({"heartbeat/oracle.json": hb}, None, "heartbeat oracle (observe-only)")
            else:
                won, cur = fl.take_lease(hub, "control", this, pol["control_lease_ttl_s"], now,
                                         extra_files={"heartbeat/oracle.json": hb}, message="heartbeat oracle + control lease")
                if not won:
                    hub.put({"heartbeat/oracle.json": hb}, None, "heartbeat oracle (control held by %s)" % (cur or {}).get("holder"))
            changed, m = publish_code(cfg, hub)
            if changed:
                alog.append({"at": fl.iso(now), "host": this, "action": "publish_code", "manifest_id": m["manifest_id"]})
        except Exception as e:
            log("heartbeat publish failed: %s: %s" % (type(e).__name__, str(e)[:200]))
            alog.append({"at": fl.iso(now), "host": this, "action": "heartbeat_failed", "why": type(e).__name__})
    publish_public(args)
    log("pass done: %s bad=%s noop=%s" % (st["counts"], st["bad"], st["noop"]))
    return 0


def publish_public(args):
    """The normal path for the PUBLIC csoai/fleet-status summary: after every primary pass, run the
    whitelist publisher (publish_fleet_status.py; it publishes only on change or hourly). Never fatal
    to the pass; a 401 from the Hub is logged verbatim-by-class so the owner can re-mint the token."""
    if getattr(args, "no_hub", False) or getattr(args, "no_public", False):
        return
    pub = os.path.join(HERE, "publish_fleet_status.py")
    if not os.path.exists(pub):
        log("public status: publisher absent at %s; not published" % pub)
        return
    try:
        p = subprocess.run([sys.executable, pub, "--status", os.path.join(FLEET_DIR, "fleet_status.json")],
                           capture_output=True, text=True, timeout=180)
        out = (p.stdout + p.stderr).strip().splitlines()
        tail = out[-1][:200] if out else ""
        if "401" in (p.stdout + p.stderr):
            tail = "HF 401 Unauthorized: the Oracle HF token must be re-minted by the owner; " + tail
        log("public status rc=%d %s" % (p.returncode, tail))
    except Exception as e:
        log("public status publish failed: %s" % type(e).__name__)


def twin(cfg, args):
    """Runs inside the hourly HF Job. Standby unless Oracle's heartbeat is older than silence_s."""
    pol = cfg["policy"]
    now = fl.utcnow()
    hub = hub_or_none(cfg, need=True)
    hb = hub.read_json("heartbeat/oracle.json")
    ts = fl.parse_ts((hb or {}).get("updated"))
    age = (now - ts).total_seconds() if ts else None
    control, _ = hub.get("lease/control.json")
    rec = {"at": fl.iso(now), "oracle_heartbeat": (hb or {}).get("updated"), "oracle_age_s": None if age is None else int(age),
           "control_holder": (control or {}).get("holder"), "dry_run": args.dry_run}
    lease_name = "control"
    if args.drill_takeover:  # exercise the takeover path without contesting the real control lease
        rec["drill"], lease_name, age = True, "control-drill", None
    if age is not None and age <= pol["silence_s"]:
        rec["action"] = "standby"
        if not args.dry_run:
            if (control or {}).get("holder") == "hf-twin":
                fl.release_lease(hub, "control", "hf-twin", now)
                rec["action"] = "released_control"
            hub.put({"heartbeat/hf-twin.json": rec}, None, "twin standby (oracle age %ss)" % rec["oracle_age_s"])
        print(json.dumps(rec, indent=1))
        return 0
    rec["action"] = "takeover"
    if args.dry_run:
        rec["would_run"] = pol["twin_critical"]
        print(json.dumps(rec, indent=1))
        return 0
    won, cur = fl.take_lease(hub, lease_name, "hf-twin", pol["twin_lease_ttl_s"], now)
    if not won:
        rec["action"] = "takeover_lost_lease"
        rec["holder"] = (cur or {}).get("holder")
        hub.put({"heartbeat/hf-twin.json": rec}, None, "twin: control held by %s" % rec["holder"])
        print(json.dumps(rec, indent=1))
        return 0
    import portable
    ran = []
    for jid in pol["twin_critical"]:
        job = next(j for j in cfg["jobs"] if j["id"] == jid)
        name = job["portable"]
        last = hub.read_json("results/%s/latest.json" % name)
        lt = fl.parse_ts((last or {}).get("finished"))
        period = job.get("twin_period_s", 3600)
        if lt and (now - lt).total_seconds() < period - 300:
            ran.append({"job": jid, "skipped": "result %s is within its %ss period" % (last["finished"], period)})
            continue
        won, cur = fl.take_lease(hub, "job-" + jid, "hf-twin", job.get("max_runtime_s", 1800), now)
        if not won:
            ran.append({"job": jid, "skipped": "lease held by %s" % (cur or {}).get("holder")})
            continue
        os.environ["FLEET_RUNNER"] = "hf-twin"
        r = portable.run(name, os.path.join(HERE, "inputs"))
        r["takeover"] = True
        r["drill"] = bool(args.drill_takeover)
        stamp = r["finished"].replace(":", "").replace("-", "")
        hub.put({"results/%s/latest.json" % name: r, "results/%s/%s.json" % (name, stamp): r,
                 "takeovers/%s-%s.json" % (stamp, jid): dict(rec, job=jid, ok=r.get("ok"))}, None,
                "twin takeover ran %s ok=%s" % (jid, r.get("ok")))
        fl.release_lease(hub, "job-" + jid, "hf-twin", fl.utcnow())
        ran.append({"job": jid, "ok": r.get("ok"), "state": r.get("state")})
    rec["ran"] = ran
    if args.drill_takeover:
        fl.release_lease(hub, lease_name, "hf-twin", fl.utcnow())
    hub.put({"heartbeat/hf-twin.json": rec}, None, "twin took over%s: %d jobs" % (" (drill)" if args.drill_takeover else "", len(ran)))
    print(json.dumps(rec, indent=1))
    return 0


def install_twin(cfg, args):
    pol = cfg["policy"]
    hub = hub_or_none(cfg, need=True)
    existing = [s for s in hub.api.list_scheduled_jobs(namespace=pol["hf_namespace"])
                if (s.job_spec.labels or {}).get("role") == "fleet-twin"]
    if existing:
        print("already scheduled:", [(s.id, s.schedule, s.suspend) for s in existing])
        return 0
    cmd = BOOT + "python supervisor.py --mode twin\n"
    spec = dict(image="python:3.12", command=["bash", "-c", cmd], schedule=pol["twin_schedule"], flavor="cpu-basic",
                timeout=1800, concurrency=False, secrets=job_secrets(hub),
                labels={"lane": "fleet-supervisor", "role": "fleet-twin"}, namespace=pol["hf_namespace"])
    if args.dry_run:
        print("would create scheduled job:", {k: v for k, v in spec.items() if k != "secrets"})
        return 0
    s = hub.api.create_scheduled_job(**spec)
    print("created scheduled job", s.id, s.schedule)
    return 0


def drill(cfg, args):
    """Exercise one failover path for real, through the same gates (budget, funding, sandbox), and log it."""
    import time
    job = next(j for j in cfg["jobs"] if j["id"] == args.drill)
    tgt = next(t for t in job.get("failover", []) if t.get("name", t["type"]) == args.target)
    now = fl.utcnow()
    state_p = os.path.join(FLEET_DIR, "supervisor_state.json")
    state = load_state(state_p)
    ok, why = fl.target_allowed(job, tgt, cfg["policy"], state, now)
    alog = fl.ActionLog(os.path.join(FLEET_DIR, "actions.jsonl"))
    if not ok:
        alog.append({"at": fl.iso(now), "host": cfg["policy"]["primary_host"], "job": job["id"], "action": "drill_refused",
                     "target": args.target, "why": why})
        print("REFUSED:", why)
        return 2
    hub = hub_or_none(cfg, need=True)
    res = Dispatcher(cfg, hub, cfg["policy"]["primary_host"]).dispatch(job, tgt)
    fl.budget_charge(state, tgt["type"], tgt.get("flavor"), now)
    fl.atomic_write_json(state_p, state)
    t0 = time.time()
    while (res.get("ref") or "").startswith("hf-job:") and res.get("status") in ("DISPATCHED", "RUNNING") and time.time() - t0 < 900:
        time.sleep(15)
        res["status"], raw = Dispatcher(cfg, hub, "").poll(res)
    r = hub.read_json("results/%s/latest.json" % job["portable"])
    alog.append({"at": fl.iso(fl.utcnow()), "host": cfg["policy"]["primary_host"], "job": job["id"], "action": "drill",
                 "target": args.target, "status": res.get("status"), "ref": res.get("ref"),
                 "result_runner": (r or {}).get("runner"), "result_ok": (r or {}).get("ok"), "result_finished": (r or {}).get("finished")})
    print(json.dumps({"dispatch": res, "result": {k: (r or {}).get(k) for k in ("runner", "ran_on", "ok", "finished", "http", "state", "why")}}, indent=1))
    return 0 if res.get("status") == "SUCCEEDED" else 1


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--mode", choices=["primary", "twin"])
    ap.add_argument("--config", default=os.path.join(HERE, "jobs.yaml"))
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--no-hub", action="store_true")
    ap.add_argument("--no-public", action="store_true", help="skip the public csoai/fleet-status publish after the pass")
    ap.add_argument("--publish-code", action="store_true")
    ap.add_argument("--install-twin", action="store_true")
    ap.add_argument("--verify-log", action="store_true")
    ap.add_argument("--drill", metavar="JOB", help="dispatch JOB's failover --target for real (gated, logged)")
    ap.add_argument("--target")
    ap.add_argument("--drill-takeover", action="store_true", help="twin: act as if Oracle were silent, on lease control-drill")
    a = ap.parse_args(argv)
    cfg = fl.load_config(a.config)
    if a.verify_log:
        ok, n = fl.ActionLog(os.path.join(FLEET_DIR, "actions.jsonl")).verify()
        print("chain", "OK" if ok else "BROKEN", n, "lines")
        return 0 if ok else 1
    if a.publish_code:
        hub = hub_or_none(cfg, need=True)
        hub.ensure_repo()
        changed, m = publish_code(cfg, hub, force=True)
        print("published" if changed else "unchanged", m["manifest_id"])
        return 0
    if a.install_twin:
        return install_twin(cfg, a)
    if a.drill:
        return drill(cfg, a)
    if a.mode == "primary":
        return primary(cfg, a)
    if a.mode == "twin":
        return twin(cfg, a)
    ap.error("--mode, --publish-code, --install-twin or --verify-log")


if __name__ == "__main__":
    sys.exit(main())
