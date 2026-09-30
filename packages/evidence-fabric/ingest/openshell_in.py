#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""openshell-adapter rows.json (declared policy vs enforcer record vs independent witness) -> evidence events.

    python3 ingest/openshell_in.py OUT/rows.json --read-at 2026-09-28T13:43:00Z --control DIVERGENT > events.jsonl

One event per row. HELD -> CONSISTENT, DIVERGED -> DIVERGENT, a row with no independent witness -> UNMEASURED.
--control is the result the adapter returned on its must-fail fixture in the same run (it must be DIVERGENT);
anything else makes every event NOT_DISCRIMINATING. The OpenShell OCSF records the adapter reads are the input;
this is the OUTPUT side: render/ocsf.py turns these events into OCSF Detection Findings.
"""
import argparse, hashlib, json, os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import event as E  # noqa: E402

STATE = {"HELD": "CONSISTENT", "DIVERGED": "DIVERGENT"}


def ingest(raw, *, read_at, control, subject, source_url=None):
    d = json.loads(raw)
    sha = hashlib.sha256(raw).hexdigest()
    ad = d.get("adapter", {})
    out = []
    for r in d["rows"]:
        st = STATE.get(r.get("comparison"), "UNMEASURED") if r.get("witness") else "UNMEASURED"
        if control != "DIVERGENT" and st in ("CONSISTENT", "DIVERGENT"):
            st = "NOT_DISCRIMINATING"
        nc = ({"id": "must-fail-deny-declared-egress", "expected": "DIVERGENT", "got": "DIVERGENT"} if control == "DIVERGENT"
              else {"id": "must-fail-deny-declared-egress", "expected": None, "got": control or "NOT_RUN"})
        a = r.get("attempt", {})
        what = f"{r.get('kind')} {a.get('method', '')} {a.get('host', a.get('path', ''))}:{a.get('port', '')}{a.get('path', '') if a.get('host') else ''}".strip()
        out.append(E.build(
            subject={"kind": "sandbox_run", "locator": f"{subject}#row-{r.get('row')}", "declared_by": f"policy sha256:{d.get('inputs', {}).get('policy_sha256')}"},
            claim={"text": f"The sandbox policy declares {r.get('declared', {}).get('effect')} for {what}; the enforcer recorded "
                           f"{r.get('enforcer', {}).get('claim')}; the independent witness saw left={(r.get('witness') or {}).get('left')}.",
                   "source_url": source_url, "source_sha256": sha, "read_at": read_at},
            method={"id": "openshell-declared-observed", "version": str(ad.get("version", "?")), "code_sha256": None, "holder": "csoai"},
            declared=r.get("declared"), observed={"enforcer": r.get("enforcer"), "witness": r.get("witness"), "comparison": r.get("comparison"), "code": r.get("code")},
            state=st, value=None, negative_control=nc,
            limits=["One sandbox run: rows describe these attempts, not every path the policy allows or denies.",
                    "The witness is our flow observation outside the sandbox; without it a row is UNMEASURED.",
                    "OpenShell is NVIDIA's (Apache-2.0); this is our adapter, not an NVIDIA integration."]))
    return out


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("rows"); ap.add_argument("--read-at", required=True); ap.add_argument("--control", required=True)
    ap.add_argument("--subject", default="urn:example:openshell-sandbox"); ap.add_argument("--source-url")
    a = ap.parse_args(argv)
    for ev in ingest(open(a.rows, "rb").read(), read_at=a.read_at, control=a.control, subject=a.subject, source_url=a.source_url):
        sys.stdout.write(json.dumps(ev, ensure_ascii=False, sort_keys=True) + "\n")


if __name__ == "__main__":
    main()
