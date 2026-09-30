#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
# Copyright 2026 CSOAI Ltd
"""Round trip: OpenShell YAML -> Cedar (translate.py) -> the `cedar` CLI's decisions, compared request by
request with the declared model in ../openshell-adapter/adapter.py over a generated request grid.

  OVER_ALLOW   Cedar allows what the declared model does not permit.            never acceptable
  UNDER_ALLOW  Cedar denies what the model permits, and no element is UNCHECKABLE. not acceptable
  FAIL_CLOSED  Cedar denies what the model permits, and the report names an UNCHECKABLE element there.
  AGREE        same decision.

The reference is our Python re-implementation of OpenShell's rego (adapter.py). Where that model is
wrong, this suite inherits the error; see DESIGN.md.

  python3 roundtrip.py POLICY.yaml [--cedar PATH] [--out DIR]   exit 0 no OVER/UNDER_ALLOW, 1 otherwise
"""

from __future__ import annotations

import argparse
import concurrent.futures as cf
import ipaddress
import json
import os
import shutil
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)
import translate as T  # noqa: E402

A = T.A
METHODS = ["GET", "HEAD", "POST", "DELETE"]
PATHS = ["/", "/simple/", "/index.json", "/pkgs/a/b", "/pkgs/x/latest", "/admin/users"]
OTHER_BINARY = "/usr/bin/wget"


def find_cedar(explicit: str | None = None) -> str | None:
    for c in (explicit, os.environ.get("CEDAR"), shutil.which("cedar"), "/workspace/tools/rust/cargo/bin/cedar"):
        if c and os.path.exists(c):
            return c
    return None


def _host_samples(h: str) -> list[str]:
    h = str(h).lower()
    if h.startswith("**."):
        s = h[3:]
        return [f"a.{s}", f"a.b.{s}", s]
    if h.startswith("*."):
        s = h[2:]
        return [f"a.{s}", f"a.b.{s}", s, f".{s}"]
    return [h, f"x.{h}"]


def _in_out(cidr: str) -> list[str]:
    net = ipaddress.ip_network(cidr, strict=False)
    inside = str(net.network_address + 1) if net.num_addresses > 1 else str(net.network_address)
    outside = str(net.network_address - 1) if int(net.network_address) > 0 else "203.0.113.9"
    return [inside, outside]


def grid(doc: dict) -> list[dict]:
    rules = doc.get("network_policies") or {}
    bins, hosts, ports, ips = {OTHER_BINARY}, set(), {80, 6443}, {}
    listed = set()
    for rule in rules.values():
        if not isinstance(rule, dict):
            continue
        for b in rule.get("binaries") or []:
            p = str((b or {}).get("path", ""))
            bins.add(p[:-2] + "tool" if p.endswith("/**") else p)
        for ep in rule.get("endpoints") or []:
            if not isinstance(ep, dict):
                continue
            ps = ep.get("ports") or ([ep["port"]] if "port" in ep else [])
            ports.update(p for p in ps if isinstance(p, int))
            for h in _host_samples(ep.get("host", "hostless.example")):
                hosts.add(h)
                listed.update((h, p) for p in ps if isinstance(p, int))
                if ep.get("allowed_ips"):
                    ips[h] = [x for c in ep["allowed_ips"] for x in _in_out(c)] + [None]
    hosts.update({"other.example", "127.0.0.1", "169.254.169.254", "localhost"})
    reqs = []
    for b in sorted(bins):
        for h in sorted(hosts):
            lit = A._is_ip(h)
            for p in sorted(ports):
                for ip in (ips.get(h) or [str(lit) if lit else None]):
                    base = {"binary": b, "host": h, "port": p, "ip": ip}
                    reqs.append({**base, "action": "connect"})
                    for m in (METHODS if (h, p) in listed else ["GET"]):
                        for path in (PATHS if (h, p) in listed else ["/"]):
                            reqs.append({**base, "action": "http_request", "method": m, "path": path})
    fs = doc.get("filesystem_policy") or {}
    roots = set(fs.get("read_only") or []) | set(fs.get("read_write") or []) | {"/usr", "/tmp", "/sandbox", "/nope"}
    for r in sorted(roots):
        r = r.rstrip("/") or "/"
        for p in {r, r + "/x", r + "/x/y"}:
            p = p.replace("//", "/")
            for act in ("fs_read", "fs_write"):
                reqs.append({"action": act, "path": p})
    return reqs


def reference(D, r: dict) -> dict:
    if r["action"] == "connect":
        return D.network(r["host"], r["port"], r["binary"], r["ip"])
    if r["action"] == "http_request":
        return D.http(r["host"], r["port"], r["method"], r["path"], r["binary"], r["ip"])
    return D.fs(r["path"], "read" if r["action"] == "fs_read" else "write")


def _uid(t: str, i: str) -> dict:
    return {"type": f"OpenShell::{t}", "id": i}


def _entities(reqs: list[dict]) -> list[dict]:
    seen, out = set(), []

    def add(e):
        k = (e["uid"]["type"], e["uid"]["id"])
        if k not in seen:
            seen.add(k)
            out.append(e)
    add({"uid": _uid("Sandbox", "sandbox"), "attrs": {}, "parents": []})
    for r in reqs:
        if r["action"] in ("connect", "http_request"):
            add({"uid": _uid("Binary", r["binary"]), "attrs": {"path": r["binary"]}, "parents": []})
            attrs = {"host": r["host"], "port": r["port"]}
            if r["ip"]:
                attrs["ip"] = {"__extn": {"fn": "ip", "arg": r["ip"]}}
            add({"uid": _uid("Endpoint", _eid(r)), "attrs": attrs, "parents": []})
        else:
            add({"uid": _uid("File", r["path"]), "attrs": {"path": r["path"]}, "parents": []})
    return out


def _eid(r: dict) -> str:
    return f"{r['host']}:{r['port']}" + (f"@{r['ip']}" if r["ip"] else "")


def _request_json(r: dict) -> dict:
    if r["action"] in ("connect", "http_request"):
        ctx = {"method": r["method"], "path": r["path"]} if r["action"] == "http_request" else {}
        return {"principal": 'OpenShell::Binary::' + json.dumps(r["binary"]),
                "action": 'OpenShell::Action::' + json.dumps(r["action"]),
                "resource": 'OpenShell::Endpoint::' + json.dumps(_eid(r)), "context": ctx}
    return {"principal": 'OpenShell::Sandbox::"sandbox"', "action": 'OpenShell::Action::' + json.dumps(r["action"]),
            "resource": 'OpenShell::File::' + json.dumps(r["path"]), "context": {}}


def cedar_validate(cedar: str, policies: str, schema: str) -> tuple[bool, str]:
    p = subprocess.run([cedar, "validate", "--schema", schema, "--policies", policies, "--deny-warnings"],
                       capture_output=True, text=True)
    return p.returncode == 0, (p.stdout + p.stderr).strip()


def cedar_decide(cedar: str, policies: str, schema: str, entities: str, req_path: str) -> str:
    p = subprocess.run([cedar, "authorize", "--policies", policies, "--schema", schema, "--entities", entities,
                        "--request-json", req_path], capture_output=True, text=True)
    out = p.stdout.strip().splitlines()
    word = out[0].strip().upper() if out else ""
    if word not in ("ALLOW", "DENY"):
        raise RuntimeError(f"cedar authorize said {p.stdout!r} {p.stderr!r} for {req_path}")
    return word


def relevant_uncheckable(report: dict, r: dict) -> bool:
    net = r["action"] in ("connect", "http_request")
    pre = ("network_policies", "network_middlewares", "policy") if net else ("filesystem_policy", "policy")
    return any(e["status"] == T.UNCHECKABLE and e["source"].startswith(pre) for e in report["elements"])


def run(doc: dict, cedar: str, workdir: str, cedar_text: str | None = None, report: dict | None = None,
        workers: int = 8) -> dict:
    if cedar_text is None:
        cedar_text, report = T.translate(doc)
    os.makedirs(workdir, exist_ok=True)
    pol, sch, ent = (os.path.join(workdir, f) for f in ("policy.cedar", "openshell.cedarschema", "entities.json"))
    with open(pol, "w") as fh:
        fh.write(cedar_text)
    with open(sch, "w") as fh:
        fh.write(T.SCHEMA)
    ok, vlog = cedar_validate(cedar, pol, sch)
    reqs = grid(doc)
    with open(ent, "w") as fh:
        json.dump(_entities(reqs), fh)
    D = A.Declared(doc)
    paths = []
    for i, r in enumerate(reqs):
        rp = os.path.join(workdir, f"req-{i:05d}.json")
        with open(rp, "w") as fh:
            json.dump(_request_json(r), fh)
        paths.append(rp)
    with cf.ThreadPoolExecutor(workers) as ex:
        words = list(ex.map(lambda rp: cedar_decide(cedar, pol, sch, ent, rp), paths))
    rows, counts = [], {}
    for r, w in zip(reqs, words):
        ref = reference(D, r)
        eff = ref["effect"]
        if w == "ALLOW" and eff != A.PERMITTED:
            cls = "OVER_ALLOW"
        elif w == "DENY" and eff == A.PERMITTED:
            cls = "FAIL_CLOSED" if relevant_uncheckable(report, r) else "UNDER_ALLOW"
        else:
            cls = "AGREE"
        counts[cls] = counts.get(cls, 0) + 1
        rows.append({**r, "cedar": w, "reference": eff, "class": cls})
    return {"validate_ok": ok, "validate_log": vlog, "requests": len(reqs), "counts": dict(sorted(counts.items())),
            "rows": rows, "report": report}


def main(argv=None) -> int:
    p = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    p.add_argument("policy")
    p.add_argument("--cedar")
    p.add_argument("--out")
    a = p.parse_args(argv)
    cedar = find_cedar(a.cedar)
    if not cedar:
        print("cedar CLI not found (set CEDAR or --cedar)", file=sys.stderr)
        return 2
    doc = T.load(a.policy)
    with tempfile.TemporaryDirectory() as wd:
        res = run(doc, cedar, wd)
    bad = [x for x in res["rows"] if x["class"] in ("OVER_ALLOW", "UNDER_ALLOW")]
    summary = {"policy": os.path.basename(a.policy), "policy_sha256": A.sha256_file(a.policy),
               "cedar_validate": "ok" if res["validate_ok"] else res["validate_log"],
               "requests": res["requests"], "counts": res["counts"], "translation_status": res["report"]["status"],
               "failures": bad[:20]}
    if a.out:
        with open(a.out, "w") as fh:
            json.dump(summary, fh, indent=1)
            fh.write("\n")
    print(json.dumps({k: v for k, v in summary.items() if k != "failures"}))
    for x in bad[:20]:
        print("  ", x)
    return 0 if res["validate_ok"] and not bad else 1


if __name__ == "__main__":
    sys.exit(main())
