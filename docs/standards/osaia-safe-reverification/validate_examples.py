#!/usr/bin/env python3
"""Validate the example records against the profile each one declares, and prove the schemas can say no.

    python3 validate_examples.py

Every file in examples/ must validate against the schema its `profile` names. Then each example is
mutated into a record its profile forbids, and every mutation must be REJECTED. A schema that
accepts all of them is not checking anything.

Needs `jsonschema` (any version with Draft7Validator). Licence: Apache-2.0.
"""
import copy, json, pathlib, sys
from jsonschema import Draft7Validator

HERE = pathlib.Path(__file__).resolve().parent

# One schema per profile. An example declares which profile it belongs to, and is checked against
# that schema — a record is never checked against a profile it does not claim.
SCHEMA_BY_PROFILE = {
    "safe-reverification/0.1-draft": "safe-reverification-record-v0.1.schema.json",
    "csoai.safe-discriminating-power/0.1": "safe-discriminating-power-v0.1.schema.json",
    "csoai.safe-review-outcome/0.1": "safe-review-outcome-v0.1.schema.json",
}
DEFAULT_SCHEMA = "safe-reverification-record-v0.1.schema.json"

_validators = {}


def validator_for(profile):
    name = SCHEMA_BY_PROFILE.get(profile, DEFAULT_SCHEMA)
    if name not in _validators:
        schema = json.loads((HERE / name).read_text())
        Draft7Validator.check_schema(schema)
        _validators[name] = Draft7Validator(schema)
    return _validators[name]


fails = 0
examples = {p.name: json.loads(p.read_text()) for p in sorted((HERE / "examples").glob("*.json"))}
for name, doc in examples.items():
    v = validator_for(doc.get("profile"))
    errs = sorted(v.iter_errors(doc), key=str)
    print(f"{'VALID  ' if not errs else 'INVALID'} {name}")
    for e in errs[:5]:
        print("   ", list(e.path), e.message[:160])
    fails += bool(errs)


def mutate(src, fn):
    d = copy.deepcopy(examples[src]); fn(d); return d


# ---------------------------------------------------------------- safe-reverification/0.1-draft
v = validator_for("safe-reverification/0.1-draft")


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
    ("PASS with no negative control run", P, m_pass_without_control, v),
    ("PASS whose designed-to-fail control passed", P, m_pass_control_accepted, v),
    ("UNMEASURED carrying a number", U, m_unmeasured_with_number, v),
    ("partial read reported as a population total", F, m_partial_population_as_total, v),
    ("remediation VERIFIED with no retest record", F, m_verified_without_retest, v),
    ("record with no stated limits", P, m_no_limits, v),
    ("result state outside the vocabulary", P, m_unknown_state, v),
]

# ------------------------------------------------ csoai.safe-discriminating-power/0.1 (SAFE #32)
vdp = validator_for("csoai.safe-discriminating-power/0.1")
DP_D, DP_ND, DP_IE = ("discriminating-power-discriminating.json",
                      "discriminating-power-not-discriminating.json",
                      "discriminating-power-insufficient-evidence.json")


def m_discriminating_but_control_passed(d):
    d["controls"]["must_fail"]["observed"] = "PASS"


def m_not_discriminating_claims_verified(d):
    d["outcome"]["claimed_outcome"] = "VERIFIED"


def m_insufficient_claims_verified(d):
    d["outcome"]["claimed_outcome"] = "VERIFIED"


def m_discriminating_with_control_not_run(d):
    d["controls"]["must_fail"]["observed"] = "NOT_RUN"


def m_relabelled_discriminating(d):
    d["outcome"]["verification_path"] = "DISCRIMINATING"


controls += [
    ("DISCRIMINATING claimed while the must-fail control passed", DP_D, m_discriminating_but_control_passed, vdp),
    ("DISCRIMINATING claimed while the must-fail control did not run", DP_D, m_discriminating_with_control_not_run, vdp),
    ("NOT_DISCRIMINATING claiming a verified outcome", DP_ND, m_not_discriminating_claims_verified, vdp),
    ("INSUFFICIENT_EVIDENCE claiming a verified outcome", DP_IE, m_insufficient_claims_verified, vdp),
    ("a NOT_DISCRIMINATING record relabelled as DISCRIMINATING", DP_ND, m_relabelled_discriminating, vdp),
]

# --------------------------------------------------- csoai.safe-review-outcome/0.1 (SAFE PR #64)
vro = validator_for("csoai.safe-review-outcome/0.1")
RO_CF = "review-outcome-control-fail.json"
RO_DF = "review-outcome-evidence-delivery-failure.json"
RO_UR = "review-outcome-missing-evidence-unresolved.json"


def m_missing_evidence_as_fail(d):
    d["underlying_control_outcome"] = "FAIL"


def m_missing_evidence_as_pass(d):
    d["underlying_control_outcome"] = "PASS"


def m_delivery_failure_attributed_to_control(d):
    d["attribution"] = "CONTROL"


def m_established_delivery_failure_attributed_to_control(d):
    d["attribution"] = "CONTROL"


def m_established_delivery_failure_claims_fail(d):
    d["underlying_control_outcome"] = "FAIL"


def m_unknown_layer(d):
    d["layer"] = "vibes"


controls += [
    ("missing evidence recorded as a control FAIL", RO_UR, m_missing_evidence_as_fail, vro),
    ("missing evidence recorded as a control PASS", RO_UR, m_missing_evidence_as_pass, vro),
    ("an unresolved absence attributed to the control", RO_UR, m_delivery_failure_attributed_to_control, vro),
    ("an established delivery failure attributed to the control", RO_DF,
     m_established_delivery_failure_attributed_to_control, vro),
    ("an established delivery failure recorded as a control FAIL", RO_DF,
     m_established_delivery_failure_claims_fail, vro),
    ("review of a layer the framework does not have", RO_CF, m_unknown_layer, vro),
]

for label, src, fn, validator in controls:
    rejected = not validator.is_valid(mutate(src, fn))
    print(f"{'rejected' if rejected else 'ACCEPTED (control failed)'}  {label}")
    fails += not rejected

print("RESULT", "PASS" if not fails else f"FAIL ({fails})")
sys.exit(1 if fails else 0)
