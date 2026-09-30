#!/usr/bin/env python3
"""Validate out/*.safe-rv.json against the candidate profile schema, check the cross-record rules the
schema cannot express, and show that both checks can say no.

    python3 validate.py

1. Every exported record must validate against schema/safe-reverification-record-v0.1.schema.json.
2. Cross-record: every supersedes[] entry that names a record in out/ must match its canonical sha256;
   every VERIFIED_BY_RETEST must name a record in out/ whose result is PASS with a control that FAILED.
3. Negative controls: seven mutations the profile forbids, plus one broken supersession digest and one
   dangling retest id. Every one must be REJECTED. Exit 0 only if 1-3 all hold. Needs `jsonschema`.
Licence: Apache-2.0. The SAFE RFC publishes no schema of its own; this validates the candidate profile.
"""
import copy, hashlib, json, pathlib, sys
from jsonschema import Draft7Validator

HERE = pathlib.Path(__file__).resolve().parent
schema = json.loads((HERE / "schema" / "safe-reverification-record-v0.1.schema.json").read_text())
Draft7Validator.check_schema(schema)
V = Draft7Validator(schema)
recs = {p.name: json.loads(p.read_text()) for p in sorted((HERE / "records").glob("*.safe-rv.json"))}
canon = lambda o: hashlib.sha256(json.dumps(o, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()).hexdigest()


def schema_errors(d):
    return sorted(V.iter_errors(d), key=str)


def cross_errors(all_recs):
    by_id = {r["record_id"]: r for r in all_recs.values()}
    errs = []
    for name, r in all_recs.items():
        for s in r.get("supersedes", []):
            if s["record_id"] in by_id and canon(by_id[s["record_id"]]) != s["sha256"]:
                errs.append(f"{name}: supersedes {s['record_id']} with a sha256 that does not match it")
        rem = r.get("remediation") or {}
        if rem.get("state") == "VERIFIED_BY_RETEST":
            t = by_id.get(rem.get("retest_record_id"))
            if not t or t["result"]["state"] != "PASS" or t["negative_control"]["observed"] != "FAIL":
                errs.append(f"{name}: VERIFIED_BY_RETEST names no later PASS record with a failed-as-designed control")
    return errs


fails = 0
for name, d in recs.items():
    e = schema_errors(d)
    print(f"{'VALID  ' if not e else 'INVALID'} {name}")
    for x in e[:5]:
        print("   ", list(x.path), x.message[:160])
    fails += bool(e)
ce = cross_errors(recs)
print(f"{'VALID  ' if not ce else 'INVALID'} cross-record rules ({len(recs)} records)")
for x in ce:
    print("   ", x)
fails += bool(ce)

P = next(n for n, r in recs.items() if r["result"]["state"] == "PASS")
U = next(n for n, r in recs.items() if r["result"]["state"] == "UNMEASURED")
F = next(n for n, r in recs.items() if r["result"]["state"] == "FAIL")
SUP = next(n for n, r in recs.items() if any(s["record_id"] in {x["record_id"] for x in recs.values()} for s in r.get("supersedes", [])))
RET = next(n for n, r in recs.items() if (r.get("remediation") or {}).get("state") == "VERIFIED_BY_RETEST")


def m(src, fn):
    d = copy.deepcopy(recs[src]); fn(d); return d


schema_controls = [
    ("PASS with no negative control run", m(P, lambda d: d["negative_control"].update(kind="none", observed="NOT_RUN"))),
    ("PASS whose designed-to-fail control passed", m(P, lambda d: d["negative_control"].update(observed="PASS"))),
    ("UNMEASURED carrying a number", m(U, lambda d: d["result"].update(n=84))),
    ("partial read reported as a population total",
     m(F, lambda d: (d["claim"].update(claim_type="population_count"), d["result"].update(read_state="PARTIAL", state="PASS", denominator=78)))),
    ("remediation VERIFIED with no retest record", m(F, lambda d: d.update(remediation={"state": "VERIFIED_BY_RETEST", "reference": None, "retest_record_id": None}))),
    ("record with no stated limits", m(P, lambda d: d.update(limits=[]))),
    ("result state outside the vocabulary", m(P, lambda d: d["result"].update(state="CERTIFIED"))),
]
for label, doc in schema_controls:
    rejected = bool(schema_errors(doc))
    print(f"{'REJECTED' if rejected else 'ACCEPTED'} (schema) {label}")
    fails += not rejected


def cross_control(label, name, fn):
    global fails
    alt = copy.deepcopy(recs); fn(alt[name])
    rejected = bool(cross_errors(alt))
    print(f"{'REJECTED' if rejected else 'ACCEPTED'} (cross) {label}")
    fails += not rejected


cross_control("supersedes digest altered by one nibble", SUP,
              lambda d: d["supersedes"][0].update(sha256=("0" if d["supersedes"][0]["sha256"][0] != "0" else "1") + d["supersedes"][0]["sha256"][1:]))
cross_control("VERIFIED_BY_RETEST naming a record that does not exist", RET,
              lambda d: d["remediation"].update(retest_record_id="csoai:safe-rv:does-not-exist"))
print("OK" if not fails else f"{fails} FAILURE(S)")
sys.exit(1 if fails else 0)
