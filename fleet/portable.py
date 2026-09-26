#!/usr/bin/env python3
"""portable - the jobs that can run on ANY runner (Oracle, HF Jobs, the RunPod backup CPU pod).

Stdlib only, Python >= 3.8 (the backup pod has 3.8). Each job returns one JSON result; nothing here
holds a credential except what the runner passes in the environment. `--publish` (needs
huggingface_hub + HF_TOKEN) writes results/<job>/latest.json to the fleet dataset; without it the
result goes to --out / stdout and the dispatcher publishes it (that is how Kaggle and the RunPod pod
work: they never hold the HF token).

  portable.py root-check      two GETs against councilof.ai (same grammar as oracle-root-check.sh)
  portable.py domain-watch    RDAP expiry + HTTPS landing for the owned domains (inputs/domains.json)
  portable.py funding-ro      RunPod balance/runway, READ-ONLY; needs RUNPOD_API_KEY_RO or it is UNMEASURED
  portable.py bundle-verify   download csoai/councilof-ai-bundle latest.bundle and `git bundle verify` it
                              (the takeover cannot re-bundle: the source bare repo lives on Oracle)
"""
from __future__ import annotations

import datetime
import hashlib
import json
import os
import socket
import subprocess
import sys
import tempfile
import urllib.error
import urllib.request

UA = "csoai-fleet-portable/0.1 (+https://councilof.ai)"


def now():
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _get(url, timeout=30, headers=None):
    h = {"User-Agent": UA}
    h.update(headers or {})
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers=h), timeout=timeout) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        return e.code, e.read() if hasattr(e, "read") else b""
    except Exception as e:  # network: recorded, not raised
        return type(e).__name__, b""


def root_check(inputs=None):
    rc, rb = _get("https://councilof.ai/root.json")
    pc, pb = _get("https://councilof.ai/interop/root-witness-pointer.json")
    out = {"http": "%s/%s" % (rc, pc)}
    try:
        d = json.loads(rb)
        out.update(root_as_of=d.get("as_of"), cards=d.get("card_count"), merkle=(d.get("merkle_root") or "")[:16],
                   root_sha=hashlib.sha256(rb).hexdigest()[:16])
    except Exception as e:
        out.update(root_error=type(e).__name__)
    try:
        p = json.loads(pb)
        out.update(pointer_as_of=p.get("as_of"), drift=(p.get("drift") or {}).get("status"),
                   pointer_cards=(p.get("live_root") or {}).get("card_count"))
    except Exception as e:
        out.update(pointer_error=type(e).__name__)
    out["ok"] = out["http"] == "200/200" and "root_error" not in out
    return out


def domain_watch(inputs=None):
    p = os.path.join(inputs or ".", "domains.json")
    if not os.path.exists(p):
        return {"ok": False, "state": "UNMEASURED", "why": "no inputs/domains.json on this runner"}
    reg = json.load(open(p))
    today = datetime.date.today()
    rows = []
    for d in reg["domains"]:
        if d.get("owned") is not True:
            continue
        code, body = _get("https://rdap.org/domain/" + d["domain"], headers={"Accept": "application/rdap+json"})
        exp = None
        try:
            for e in json.loads(body).get("events", []):
                if e.get("eventAction") == "expiration":
                    exp = e["eventDate"][:10]
        except Exception:
            pass
        days = (datetime.date.fromisoformat(exp) - today).days if exp else None
        hc, _ = _get("https://" + d["domain"], timeout=15)
        lvl = "UNKNOWN" if days is None else ("RED" if days < 21 else "AMBER" if days < 60 else "GREEN")
        rows.append({"domain": d["domain"], "expires": exp, "days_left": days, "level": lvl, "https": hc})
    return {"ok": all(r["level"] != "UNKNOWN" for r in rows), "domains": rows}


def funding_ro(inputs=None):
    key = os.environ.get("RUNPOD_API_KEY_RO")
    if not key:
        return {"ok": False, "state": "UNMEASURED",
                "why": "no read-only RunPod key on this runner (owner ask); the full key is deliberately not copied off Oracle"}
    q = json.dumps({"query": "query { myself { clientBalance currentSpendPerHr } }"}).encode()
    req = urllib.request.Request("https://api.runpod.io/graphql", data=q,
                                 headers={"Authorization": "Bearer " + key, "Content-Type": "application/json",
                                          "User-Agent": UA})
    try:
        d = json.load(urllib.request.urlopen(req, timeout=30))["data"]["myself"]
    except Exception as e:
        return {"ok": False, "state": "UNMEASURED", "why": "RunPod read failed: %s" % type(e).__name__}
    bal, burn = float(d["clientBalance"]), float(d["currentSpendPerHr"])
    run = round(bal / burn, 1) if burn > 0 else 99999
    lvl = "STOP" if run < 6 else "RED" if run < 24 else "AMBER" if run < 72 else "GREEN"
    return {"ok": True, "balance_usd": bal, "spend_usd_per_hr": burn, "runway_h": run, "level": lvl,
            "note": "read-only: this runner never stops a pod"}


def bundle_verify(inputs=None):
    from huggingface_hub import hf_hub_download, HfApi
    tok = os.environ.get("HF_TOKEN")
    repo = "csoai/councilof-ai-bundle"
    info = HfApi(token=tok).dataset_info(repo)
    d = tempfile.mkdtemp()
    p = hf_hub_download(repo, "latest.bundle", repo_type="dataset", local_dir=d, token=tok)
    h = hashlib.sha256()
    with open(p, "rb") as fh:
        for c in iter(lambda: fh.read(1 << 20), b""):
            h.update(c)
    subprocess.run(["git", "init", "-q", d + "/g"], check=True)
    v = subprocess.run(["git", "-C", d + "/g", "bundle", "verify", p], capture_output=True, text=True)
    heads = subprocess.run(["git", "bundle", "list-heads", p], capture_output=True, text=True, cwd=d + "/g").stdout.splitlines()
    return {"ok": v.returncode == 0, "bundle_sha256": h.hexdigest(), "bytes": os.path.getsize(p),
            "heads": len(heads), "dataset_last_modified": str(info.last_modified),
            "verify_tail": (v.stderr or v.stdout).strip().splitlines()[-1:] if (v.stderr or v.stdout) else [],
            "note": "verify-only takeover: a fresh bundle needs the Oracle bare repo"}


JOBS = {"root-check": root_check, "domain-watch": domain_watch, "funding-ro": funding_ro, "bundle-verify": bundle_verify}


def run(name, inputs=None):
    started = now()
    try:
        r = JOBS[name](inputs)
    except Exception as e:
        r = {"ok": False, "error": "%s: %s" % (type(e).__name__, str(e)[:300])}
    r.update(job=name, started=started, finished=now(), ran_on=socket.gethostname(),
             runner=os.environ.get("FLEET_RUNNER", "unknown"))
    return r


def main(argv):
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("job", choices=sorted(JOBS))
    ap.add_argument("--inputs")
    ap.add_argument("--out")
    ap.add_argument("--publish", action="store_true", help="write results/<job>/latest.json to the fleet dataset")
    ap.add_argument("--repo", default="csoai/fleet-heartbeat")
    a = ap.parse_args(argv)
    r = run(a.job, a.inputs)
    s = json.dumps(r, indent=1, sort_keys=True)
    if a.out:
        with open(a.out, "w") as fh:
            fh.write(s + "\n")
    print(s)
    if a.publish:
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        from hub import Hub, read_token
        hb = Hub(a.repo, read_token())
        stamp = r["finished"].replace(":", "").replace("-", "")
        hb.put({"results/%s/latest.json" % a.job: r, "results/%s/%s.json" % (a.job, stamp): r}, None,
               "result %s on %s ok=%s" % (a.job, r["runner"], r.get("ok")))
    return 0 if r.get("ok") or r.get("state") == "UNMEASURED" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
