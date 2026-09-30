#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Probe the NAMED entries of the effect-binding server-probe list: unauthenticated initialize + tools/list only.

    probe_listed.py [--list public/interop/effect-binding-server-probe-list.json] --out DIR

The list (public/interop/effect-binding-server-probe-list.json) names servers added to the effect-binding
probe population by hand, outside the frozen, shuffled 2026-09-22 bank (n = 261). This script contacts
each one with the census probe's own code (scripts/census/mcp-remote-probe.py: robots.txt, one connection
per host, >= 1 s between requests, probe-exclusions.json honoured) in INITIALIZE-ONLY mode:

    GET /robots.txt  ->  POST initialize  ->  POST notifications/initialized  ->  POST tools/list
    (-> DELETE session, only if the server issued one)

It never sends server/discover, never calls a tool, never authenticates, never pays. So it cannot
produce an effect-binding verdict (that needs one read-only tools/call); every entry stays UNMEASURED
on that construct. What it records is whether the endpoint answers anonymously and what tools it lists.
A listing is not adoption, and an answer is not an endorsement in either direction.
"""
from __future__ import annotations

import argparse
import datetime
import hashlib
import importlib.util
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", ".."))
DEFAULT_LIST = os.path.join(REPO, "public", "interop", "effect-binding-server-probe-list.json")
SCHEMA = "csoai.effect-binding.server-probe-list/0.1"
RUN_SCHEMA = "csoai.effect-binding.listed-probe-run/0.1"


def census():
    spec = importlib.util.spec_from_file_location("mcp_remote_probe", os.path.join(REPO, "scripts", "census",
                                                                                   "mcp-remote-probe.py"))
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)

    def initialize_only(rec, sess, target, gate, sleep, modern_grader, base, version):
        # the modern server/discover step is skipped on purpose: this scope is initialize + tools/list
        rec["modern_attempt"] = {"skipped": "initialize-only scope (probe_listed.py)"}
        return "FALLBACK", "initialize-only scope", None, target, None
    m._modern = initialize_only
    return m


def load_list(path=DEFAULT_LIST):
    with open(path, encoding="utf-8") as fh:
        doc = json.load(fh)
    if doc.get("schema") != SCHEMA:
        raise ValueError(f"{path}: schema is not {SCHEMA}")
    ids = set()
    for e in doc["entries"]:
        for k in ("id", "endpoint", "transport", "scope", "effect_binding_status", "in_frozen_bank_2026_09_22"):
            if k not in e:
                raise ValueError(f"entry {e.get('id')}: missing {k}")
        if not e["endpoint"].startswith("https://"):
            raise ValueError(f"entry {e['id']}: endpoint must be https")
        if e["effect_binding_status"] != "UNMEASURED":
            raise ValueError(f"entry {e['id']}: an initialize/tools-list probe cannot measure effect binding")
        if e["id"] in ids:
            raise ValueError(f"duplicate id {e['id']}")
        ids.add(e["id"])
    return doc


def run(doc, out, cfg=None, module=None):
    M = module or census()
    cfg = cfg or {"min_interval": 1.0, "workers": 1, "connect_timeout": 10.0, "read_timeout": 20.0, "budget_s": 300}
    rows = [{"rank": i + 1, "endpoint": e["endpoint"], "ranked_by": "named-list", "transports": [e["transport"]]}
            for i, e in enumerate(doc["entries"])]
    runner = M.Runner(rows, out, cfg)
    started, finished = runner.run()
    import gzip
    with gzip.open(os.path.join(out, "results.jsonl.gz"), "rt") as fh:
        recs = [json.loads(x) for x in fh if x.strip()]
    by_ep = {r["endpoint"]: r for r in recs}
    rows_out = []
    for e in doc["entries"]:
        r = by_ep.get(e["endpoint"])
        keep = ("state", "reason", "http_status", "transport", "protocol_version_requested", "protocol_version_negotiated",
                "server_info", "capabilities", "session_issued", "tools_list_status", "tools_list_detail", "n_tools",
                "tools_complete", "tool_names", "tool_names_sha256", "requests", "exchange", "robots", "started",
                "finished") if r else ()
        rows_out.append({"id": e["id"], "endpoint": e["endpoint"],
                         **({k: r.get(k) for k in keep} if r else {"state": "NOT_ATTEMPTED",
                                                                  "reason": next((s["not_attempted"] for s in runner.skipped
                                                                                  if s["endpoint"] == e["endpoint"]), None)}),
                         "effect_binding_status": "UNMEASURED",
                         "effect_binding_why": "no tools/call in this scope; a binding verdict needs one"})
    return {"schema": RUN_SCHEMA, "started": started, "finished": finished,
            "list_sha256": hashlib.sha256(json.dumps(doc, sort_keys=True).encode()).hexdigest(),
            "scope": "GET /robots.txt, POST initialize, POST notifications/initialized, POST tools/list, "
                     "DELETE session if issued; unauthenticated; no server/discover; no tools/call",
            "probe_code": {"census_probe_sha256": _sha(os.path.join(REPO, "scripts", "census", "mcp-remote-probe.py")),
                           "this_sha256": _sha(os.path.abspath(__file__))},
            "rows": rows_out,
            "not_evidence_of": ["adoption or use of any CSOAI artifact", "any relationship with the operator",
                                "effect binding (UNMEASURED)", "security or quality of the server"]}


def _sha(p):
    with open(p, "rb") as fh:
        return hashlib.sha256(fh.read()).hexdigest()


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--list", default=DEFAULT_LIST)
    ap.add_argument("--out", required=True)
    a = ap.parse_args(argv)
    doc = load_list(a.list)
    rec = run(doc, a.out)
    with open(os.path.join(a.out, "listed-probe-run.json"), "w") as fh:
        json.dump(rec, fh, indent=1, ensure_ascii=False)
        fh.write("\n")
    for r in rec["rows"]:
        print(r["id"], r["state"], r.get("http_status"), r.get("n_tools"), (r.get("server_info") or {}).get("name"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
