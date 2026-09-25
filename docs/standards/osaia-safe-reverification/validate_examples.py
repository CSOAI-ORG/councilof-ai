#!/usr/bin/env python3
"""Validate the example records against the draft schema, and prove the schema can say no.

    python3 validate_examples.py

Every file in examples/ must validate. Then each example is mutated into a record the profile
forbids, and every mutation must be REJECTED. A schema that accepts all of them is not checking
anything. Needs `jsonschema` (any version with Draft7Validator). Licence: Apache-2.0.
"""
import copy, json, pathlib, sys
from jsonschema import Draft7Validator

HERE = pathlib.Path(__file__).resolve().parent
schema = json.loads((HERE / "safe-reverification-record-v0.1.schema.json").read_text())
Draft7Validator.check_schema(schema)
v = Draft7Validator(schema)
fails = 0

examples = {p.name: json.loads(p.read_text()) for p in sorted((HERE / "examples").glob("*.json"))}
for name, doc in examples.items():
    errs = sorted(v.iter_errors(doc), key=str)
    print(f"{'VALID  ' if not errs else 'INVALID'} {name}")
    for e in errs[:5]:
        print("   ", list(e.path), e.message[:160])
    fails += bool(errs)


def mutate(src, fn):
    d = copy.deepcopy(examples[src]); fn(d); return d


def m_pass_without_control(d):
    d["negative_control"].update(kind="none", observed="NOT_RUN")


def m_pass_control_accepted(d):
    d["negative_control"]["observed"] = "PASS"


def m_unmeasured_with_number(d):
    d["result"]["n"] = 35873


def m_partial_population_as_total(d):
    d["result"].update(read_state="PARTIAL", state="PASS", denominator=35873)


def m_verified_without_retest(d):
    d["remediation"] = {"state": "VERIFIED_BY_RETEST", "reference": None, "retest_record_id": None}


def m_no_limits(d):
    d["limits"] = []


def m_unknown_state(d):
    d["result"]["state"] = "CERTIFIED"


P, F, U = ("example-pass-a2a-card-census-integrity.json", "example-fail-agent-interop-census-completeness.json",
           "example-unmeasured-mcp-registry-all-versions.json")
controls = [
    ("PASS with no negative control run", P, m_pass_without_control),
    ("PASS whose designed-to-fail control passed", P, m_pass_control_accepted),
    ("UNMEASURED carrying a number", U, m_unmeasured_with_number),
    ("partial read reported as a population total", F, m_partial_population_as_total),
    ("remediation VERIFIED with no retest record", F, m_verified_without_retest),
    ("record with no stated limits", P, m_no_limits),
    ("result state outside the vocabulary", P, m_unknown_state),
]
for label, src, fn in controls:
    rejected = not v.is_valid(mutate(src, fn))
    print(f"{'rejected' if rejected else 'ACCEPTED (control failed)'}  {label}")
    fails += not rejected

print("RESULT", "PASS" if not fails else f"FAIL ({fails})")
sys.exit(1 if fails else 0)
