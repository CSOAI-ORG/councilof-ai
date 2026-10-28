#!/usr/bin/env python3
"""Prove the discriminating-power harness can itself say no.

    python3 test_discriminating_power.py

Three things are checked here, and the third is the point.

1. The synthetic reproduction of a one-option answer menu: an item set where every item permits
   exactly one answer, and the check only asks whether the permitted label came back. Control A
   (a valid input) passes and Control B (a deliberately invalid input) also passes, so the
   instrument is NOT_DISCRIMINATING and any outcome it produced is UNVERIFIED.
2. The repaired check, which compares the raw response against the expected answer before the menu
   can rewrite it. Control A passes, Control B fails as designed, so the instrument is
   DISCRIMINATING and the outcome may be VERIFIED.
3. The harness is itself checked for discriminating power. Replacing the grader with one that
   always passes must change the derived outcome to NOT_DISCRIMINATING. A harness that cannot fail
   is the exact failure this profile exists to catch.

The synthetic corpus reproduces a failure *shape*. It names no real incident, model, deployment,
subject or organisation, and it is not a production measurement.

Needs `jsonschema` (any version with Draft7Validator). Licence: Apache-2.0.
"""
import copy, json, pathlib, sys
from jsonschema import Draft7Validator

HERE = pathlib.Path(__file__).resolve().parent
SCHEMA = json.loads((HERE / "safe-discriminating-power-v0.1.schema.json").read_text())
Draft7Validator.check_schema(SCHEMA)
VALIDATOR = Draft7Validator(SCHEMA)
FAILURES = []


def check(condition, label):
    print(f"{'PASS  ' if condition else 'FAIL  '}{label}")
    if not condition:
        FAILURES.append(label)


# --------------------------------------------------------------------- the synthetic corpus
# `raw_response` is what the subject actually emitted. `menu_normalised` is what reached the
# checker after the one-option answer menu had rewritten it. The whole failure is that the
# checker only ever saw the second one.
CORPUS = [
    {"id": "control-a-valid", "role": "must_pass", "expected": "ALPHA",
     "raw_response": "ALPHA", "menu_normalised": "ALPHA", "truly_valid": True},
    {"id": "control-b-invalid", "role": "must_fail", "expected": "ALPHA",
     "raw_response": "BETA", "menu_normalised": "ALPHA", "truly_valid": False},
]


def grader_one_option_menu(item):
    """The historical failure shape, synthetic: the item permits exactly one answer, and the check
    only asks whether the permitted label came back, so a deliberately invalid response is graded
    PASS exactly like a valid one."""
    return "PASS" if item["menu_normalised"] == "ALPHA" else "FAIL"


def grader_repaired(item):
    """The repaired check: it compares the raw response against the expected answer, before the
    answer menu can rewrite it."""
    return "PASS" if item["raw_response"] == item["expected"] else "FAIL"


def grader_always_pass(item):
    """A grader that cannot fail. Used only to prove that this harness detects one."""
    return "PASS"


def run_controls(grader, controls_executed=True):
    observed = {}
    for item in CORPUS:
        observed[item["role"]] = grader(item) if controls_executed else "NOT_RUN"
    return observed


def derive(observed, controls_executed=True):
    """Derive the verification path and the claimable outcome from the two control results.

    The rule, in code:

        Control A passes and Control B fails  -> DISCRIMINATING,        VERIFIED
        Control A passes and Control B passes  -> NOT_DISCRIMINATING,    UNVERIFIED
        the controls could not be executed     -> INSUFFICIENT_EVIDENCE, UNVERIFIED
    """
    a, b = observed.get("must_pass"), observed.get("must_fail")
    if not controls_executed or "NOT_RUN" in (a, b):
        return ("INSUFFICIENT_EVIDENCE", "UNVERIFIED",
                "A control could not be executed, so discriminating power is unmeasured. An "
                "unmeasured instrument is never a passing one.")
    if a == "PASS" and b == "FAIL":
        return ("DISCRIMINATING", "VERIFIED",
                "Control A passed and Control B failed as designed, so the instrument can "
                "discriminate and its outcome may be claimed.")
    if a == "PASS" and b == "PASS":
        return ("NOT_DISCRIMINATING", "UNVERIFIED",
                "Control A passed and Control B also passed: the instrument accepted a case built "
                "to fail, so it is not discriminating and no outcome it produced may be claimed.")
    return ("INSUFFICIENT_EVIDENCE", "UNVERIFIED",
            "Control A did not pass, so the instrument did not work even on a valid input.")


def build_record(observed, path, claimed, reason, controls_executed=True):
    return {
        "profile": "csoai.safe-discriminating-power/0.1",
        "record_id": "synthetic-one-option-menu",
        "issued_at": "2026-10-26T06:00:00Z",
        "method": {
            "method_id": "synthetic.single.option.menu.v0.1",
            "method_version": "0.1",
            "procedure": "python3 test_discriminating_power.py",
            "reproduction": "re_execution",
            "controls_executed": controls_executed,
            "declared_failure_modes": [
                "A one-option answer menu normalises every response to the permitted label before "
                "the check runs.",
                "A grader that compares only the normalised label cannot distinguish a valid "
                "response from an invalid one."],
            "noise_floor": None},
        "controls": {
            "must_pass": {"control_id": "control-a-valid", "expectation": "PASS",
                          "observed": observed.get("must_pass"),
                          "description": "A valid input that must produce PASS."},
            "must_fail": {"control_id": "control-b-invalid", "expectation": "FAIL",
                          "observed": observed.get("must_fail"),
                          "description": "A deliberately invalid input that must produce FAIL."}},
        "outcome": {"verification_path": path, "claimed_outcome": claimed, "reason": reason},
        "claim": {"subject": "synthetic item set",
                  "scope": "A two-item control set. No production corpus is in scope.",
                  "statement": "The verification method can produce the intended negative outcome."},
        "limits": ["Synthetic corpus. It reproduces a failure shape; it is not a production measurement.",
                   "No real incident, model, deployment or subject is named or implied."]}


print("== 1. the one-option menu cannot produce a negative result ==")
obs = run_controls(grader_one_option_menu)
path, claimed, reason = derive(obs)
check(obs["must_pass"] == "PASS", "Control A (valid input) passed")
check(obs["must_fail"] == "PASS", "Control B (deliberately invalid input) also passed")
check(path == "NOT_DISCRIMINATING", f"derived verification_path is NOT_DISCRIMINATING (got {path})")
check(claimed == "UNVERIFIED", f"no outcome may be claimed (got {claimed})")
rec = build_record(obs, path, claimed, reason)
check(VALIDATOR.is_valid(rec), "the derived record validates against the profile schema")

print()
print("== 2. the repaired check can ==")
obs2 = run_controls(grader_repaired)
path2, claimed2, reason2 = derive(obs2)
check(obs2["must_pass"] == "PASS", "Control A (valid input) passed")
check(obs2["must_fail"] == "FAIL", "Control B (deliberately invalid input) failed as designed")
check(path2 == "DISCRIMINATING", f"derived verification_path is DISCRIMINATING (got {path2})")
check(claimed2 == "VERIFIED", f"the outcome may be claimed (got {claimed2})")
rec2 = build_record(obs2, path2, claimed2, reason2)
check(VALIDATOR.is_valid(rec2), "the derived record validates against the profile schema")

print()
print("== 3. this harness is itself discriminating ==")
obs3 = run_controls(grader_always_pass)
path3, claimed3, _ = derive(obs3)
check(path3 == "NOT_DISCRIMINATING",
      f"a grader that always passes is detected as NOT_DISCRIMINATING (got {path3})")
obs4 = run_controls(grader_repaired, controls_executed=False)
path4, claimed4, _ = derive(obs4)
check(path4 == "INSUFFICIENT_EVIDENCE",
      f"controls that could not be executed give INSUFFICIENT_EVIDENCE (got {path4})")
check(claimed4 == "UNVERIFIED", "an unmeasured instrument never claims an outcome")

print()
print("== 4. the schema can say no ==")
bad1 = copy.deepcopy(rec2)
bad1["controls"]["must_fail"]["observed"] = "PASS"
check(not VALIDATOR.is_valid(bad1),
      "rejected: DISCRIMINATING claimed while the must-fail control passed")
bad2 = copy.deepcopy(rec)
bad2["outcome"]["claimed_outcome"] = "VERIFIED"
check(not VALIDATOR.is_valid(bad2),
      "rejected: NOT_DISCRIMINATING claiming a verified outcome")
bad3 = copy.deepcopy(rec)
bad3["outcome"]["verification_path"] = "DISCRIMINATING"
check(not VALIDATOR.is_valid(bad3),
      "rejected: a NOT_DISCRIMINATING record relabelled as DISCRIMINATING")
bad4 = copy.deepcopy(rec4 if False else rec2)
bad4["controls"]["must_fail"]["observed"] = "NOT_RUN"
check(not VALIDATOR.is_valid(bad4),
      "rejected: DISCRIMINATING claimed while the must-fail control did not run")

print()
print("RESULT", "PASS" if not FAILURES else f"FAIL ({len(FAILURES)})")
for f in FAILURES:
    print("   failed:", f)
sys.exit(1 if FAILURES else 0)
