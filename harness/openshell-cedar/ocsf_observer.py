#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
# Copyright 2026 CSOAI Ltd
"""OCSF -> GSPC observer: turn OpenShell's own event records into an observation record.  Our example.

Reads OCSF JSONL (/var/log/openshell-ocsf.*.log) and/or the shorthand lines (/var/log/openshell.*.log)
with the parsers in ../openshell-adapter/adapter.py, and writes one `csoai.openshell.observation/0.1`
record: what the enforcer says happened, counted by class and action, with every line accounted for.

What it is and is not:
  * Every record is the enforcer's report about itself (evidence class ENFORCER_SELF_REPORT). It can
    show what OpenShell says it did, including a declared deny it let through in audit mode. It cannot
    show that nothing else left: that needs a witness (adapter.py / declared_observed.py).
  * The `gspc` block uses the GSPC status words. It is NOT a board axis and has no board slot. It is
    MEASURED only for the narrow construct it names (what the enforcer recorded, over n parsed records),
    and UNMEASURED when nothing parsed.
  * A downgraded export (`unmapped.downgraded_from`) is lossy by OpenShell's own documentation; it is
    counted and flagged.

  python3 ocsf_observer.py LOG [LOG ...] [--out FILE] [--policy P.yaml]

With --policy, each traffic record is also annotated with what the policy declares for it
(adapter.Declared), so an ALLOWED record for a declared deny is visible without a witness.
Exit codes: 0 records observed, 3 UNMEASURED (nothing parsed), 2 input error.
"""

from __future__ import annotations

import argparse
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
for _p in (HERE, os.path.join(HERE, "..", "openshell-adapter")):
    if os.path.exists(os.path.join(_p, "adapter.py")) and _p not in sys.path:
        sys.path.insert(0, os.path.abspath(_p))
import adapter as A  # noqa: E402

SCHEMA = "csoai.openshell.observation/0.1"
OBSERVER = {"name": "openshell-ocsf-observer", "version": "0.1.0"}
CLASS_NAMES = {0: "Base Event", 4001: "Network Activity", 4002: "HTTP Activity", 4007: "SSH Activity",
               1007: "Process Activity", 2004: "Detection Finding", 5019: "Device Config State Change",
               6002: "Application Lifecycle"}
SHORTHAND_CLASS = {"NET": 4001, "HTTP": 4002, "SSH": 4007, "PROC": 1007, "FINDING": 2004, "CONFIG": 5019,
                   "LIFECYCLE": 6002, "EVENT": 0}


def observe(paths: list[str], policy: str | None = None) -> dict:
    recs, stats = A.load_enforcer(paths)
    downgraded, versions = 0, set()
    for p in paths:  # second pass for fields the adapter parser does not keep
        with open(p, encoding="utf-8", errors="replace") as fh:
            for line in fh:
                s = line.strip()
                if s.startswith("{"):
                    try:
                        o = json.loads(s)
                    except json.JSONDecodeError:
                        continue
                    if (o.get("unmapped") or {}).get("downgraded_from"):
                        downgraded += 1
                    v = (o.get("metadata") or {}).get("version")
                    if v:
                        versions.add(str(v))
    D = A.Declared(A.load_policy(policy)) if policy else None
    by_class: dict[str, int] = {}
    by_action: dict[str, int] = {}
    events = []
    for r in recs:
        cls = r.get("class_uid") if r.get("format") == "ocsf-json" else SHORTHAND_CLASS.get(r.get("class"))
        name = CLASS_NAMES.get(cls, f"class {cls}")
        by_class[name] = by_class.get(name, 0) + 1
        if r.get("kind") in ("net", "http"):
            act = r.get("action") or "UNSTATED"
            by_action[act] = by_action.get(act, 0) + 1
            ev = {"t": r.get("t"), "class": name, "action": act, "host": r.get("host"), "port": r.get("port"),
                  "policy": r.get("policy"), "engine": r.get("engine"), "raw_sha256": r.get("raw_sha256")}
            if r.get("kind") == "http":
                ev.update(method=r.get("method"), path=r.get("path"))
            if r.get("enforcer_marked_audit"):
                ev["audit_marked"] = True
            if D is not None and r.get("host") and r.get("port"):
                d = (D.http(r["host"], int(r["port"]), r.get("method") or "GET", r.get("path") or "/", r.get("process"),
                            r.get("ip")) if r.get("kind") == "http" else
                     D.network(r["host"], int(r["port"]), r.get("process"), r.get("ip")))
                ev["declared"] = d["effect"]
                if d["effect"] == A.DENIED and act == "ALLOWED":
                    ev["note"] = "the enforcer recorded ALLOWED for a request the policy declares denied"
            events.append(ev)
    n = stats["parsed"]
    let_through = sum(1 for e in events if e.get("note"))
    status = "MEASURED" if n else "UNMEASURED"
    return {
        "schema": SCHEMA,
        "observer": OBSERVER,
        "evidence_class": "ENFORCER_SELF_REPORT",
        "inputs": {"files": stats["files"], "lines": stats["lines"], "records_parsed": n,
                   "lines_not_parsed": stats["lines"] - n, "ocsf_versions_seen": sorted(versions),
                   "downgraded_records": downgraded,
                   "policy_sha256": A.sha256_file(policy) if policy else None},
        "counts": {"by_class": dict(sorted(by_class.items())), "traffic_by_action": dict(sorted(by_action.items())),
                   "declared_deny_recorded_allowed": let_through if D is not None else None},
        "events": events,
        "gspc": {
            "construct": "what the OpenShell enforcer recorded about its own traffic decisions",
            "status": status,
            "n": n, "n_unit": "OCSF records parsed",
            "board_slot": None,
            "unmeasured_reason": None if n else "no OCSF record parsed from the inputs",
            "limits": ["self-report: says nothing about traffic the enforcer did not record",
                       "no per-access filesystem or seccomp records exist (OpenShell docs)",
                       "downgraded exports drop fields" if downgraded else "no downgraded records seen"],
            "not_a_grade": "a count of recorded events, not a grade",
        },
        "openshell_pin": A.OPENSHELL_PIN,
    }


def main(argv=None) -> int:
    p = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    p.add_argument("logs", nargs="+")
    p.add_argument("--policy")
    p.add_argument("--out")
    a = p.parse_args(argv)
    try:
        rec = observe(a.logs, a.policy)
    except (A.PolicyError, OSError, ValueError) as e:
        print(f"input error: {e}", file=sys.stderr)
        return 2
    text = json.dumps(rec, indent=1, ensure_ascii=False) + "\n"
    if a.out:
        with open(a.out, "w", encoding="utf-8") as fh:
            fh.write(text)
    g = rec["gspc"]
    print(f"{g['status']}  n={g['n']} {g['n_unit']}  by_class={rec['counts']['by_class']}  "
          f"traffic={rec['counts']['traffic_by_action']}  declared_deny_recorded_allowed="
          f"{rec['counts']['declared_deny_recorded_allowed']}")
    return 0 if g["status"] == "MEASURED" else 3


if __name__ == "__main__":
    sys.exit(main())
