#!/usr/bin/env python3
"""Self-run bounded approval-effect replay -> existing csoai.evidence-event/0.1.

Read only the established csoai.pilot-demo/0.1 receipt; never mint a GSPC
measurement, a human approval, an institutional witness or a signed card.
Verifier independently rebuilds the event from the raw receipt.
"""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = Path(__file__).resolve()
EVENT_PATH = ROOT / "packages/evidence-fabric/event.py"
spec = importlib.util.spec_from_file_location("csoai_evidence_event", EVENT_PATH)
evidence = importlib.util.module_from_spec(spec)
spec.loader.exec_module(evidence)
PROFILE_PATH = ROOT / "scripts/pilot/self-run-hitl-profiles.py"
profile_spec = importlib.util.spec_from_file_location("csoai_selfrun_hitl_profiles", PROFILE_PATH)
profiles_module = importlib.util.module_from_spec(profile_spec)
profile_spec.loader.exec_module(profiles_module)

LIMITS = [
    "Synthetic test key; no authenticated human decision or production authority.",
    "Only owned local temporary files. No customer environment or live model inference.",
    "Observation and verification are Council-operated, not third-party institutional review.",
    "No GSPC measurement admission, safety certification, or external threat prevention.",
    "Event is unsigned and unanchored; hashes bind inspected bytes, not their factual truth.",
]


def _require(valid, why):
    if not valid:
        raise ValueError(why)


def _extract(receipt):
    _require(isinstance(receipt, dict) and receipt.get("schema") == "csoai.pilot-demo/0.1", "unknown receipt")
    cases = receipt.get("cases")
    _require(isinstance(cases, list) and len(cases) == receipt.get("fixture_count") == 14,
             "incorrect fixture denominator")
    _require(len({c.get("scenario") for c in cases if isinstance(c, dict)}) == 14,
             "duplicate or invalid scenarios")
    positive = [c for c in cases if c.get("scenario") == "pass"]
    negative = [c for c in cases if c.get("scenario") != "pass"]
    _require(len(positive) == 1 and len(negative) == 13, "positive/negative population mismatch")
    good = (positive[0].get("execution") == "EXECUTED" and
            positive[0].get("observer") == "EFFECT_READBACK_MATCHED" and
            positive[0].get("actual_effect_written") is True)
    blocked = sum(c.get("execution") == "DENIED" and
                  c.get("observer") == "NO_EFFECT" and
                  c.get("actual_effect_written") is False for c in negative)
    controls = receipt.get("results")
    _require(isinstance(controls, dict) and set(controls) ==
             {"authorised_effect_and_readback", "negative_controls", "honest_scope", "upstream_trial_passed"},
             "missing/extra trial controls")
    _require(receipt.get("independent_review") == "NOT_CONDUCTED" and
             receipt.get("human_approval") == "SYNTHETIC_KEY_ONLY" and
             receipt.get("production_authority") is False and
             receipt.get("gspc_measurement_admission") is False,
             "invalid claim boundary")
    _require(re.fullmatch(r"[a-f0-9]{64}", str(receipt.get("source_sha256", ""))),
             "invalid source checksum")
    date = receipt.get("ran_at")
    _require(isinstance(date, str) and re.fullmatch(
        r"\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z", date), "invalid run timestamp")
    expected = good and blocked == 13
    verdict_matches = (
        receipt.get("outcome") == ("PASS" if expected else "FAIL") and
        all(controls.values()) == expected and
        (controls["authorised_effect_and_readback"] is good) and
        (controls["negative_controls"] is (blocked == 13))
    )
    # A receipt cannot be marked CONSISTENT on flags alone. If declared flags
    # contradict observed cases, preserve it as a divergent observation.
    passed = bool(expected and verdict_matches)
    return {"valid_action_effect": bool(good), "denied_without_effect": blocked,
            "invalid_action_total": 13, "reported_outcome": receipt.get("outcome"),
            "reported_results": controls, "flags_match_effects": bool(verdict_matches),
            "scope": "SELF_TEST_ONLY", "independent_review": "NOT_CONDUCTED",
            "human_approval": "SYNTHETIC_KEY_ONLY",
            "production_authority": False, "gspc_measurement_admission": False,
            "successful": passed}


def make_event(receipt, raw_bytes, source_commit, profiles):
    _require(re.fullmatch(r"[a-f0-9]{40}", source_commit or ""), "exact source commit required")
    obs = _extract(receipt)
    expected_profiles = profiles_module.records(receipt, raw_bytes, source_commit)
    profiles_module.validate_records(expected_profiles)
    _require(profiles == expected_profiles, "HITL profile pack is not reconstructed from receipt")
    references = profiles_module.digests(expected_profiles)
    _require(len(references) == 14, "must bind all fourteen actual process profiles")
    state = "CONSISTENT" if obs["successful"] else "DIVERGENT"
    negative_got = ("DENIED_WITHOUT_EFFECT" if obs["denied_without_effect"] == 13
                    else "UNEXPECTED_EFFECT_OR_UNOBSERVED")
    # Event schema enforces a discriminating negative control on consistent records.
    control = {"id": "invalid-authority-file-effect",
               "expected": "DENIED_WITHOUT_EFFECT" if obs["successful"] else None,
               "got": negative_got}
    return evidence.build(
        subject={"kind": "sandbox_run", "locator": "github:CSOAI-ORG/councilof-ai@" +
                 source_commit + "#approval-effect-demo"},
        claim={"text": "Self-run synthetic approval to observed-effect fixture experiment",
               "source_url": "https://github.com/CSOAI-ORG/councilof-ai/blob/" + source_commit +
                             "/harness/hitl/approval-effect-demo.mjs",
               "source_sha256": receipt["source_sha256"], "read_at": receipt["ran_at"]},
        method={"id": "approval-effect-self-replay", "version": "0.1",
                "holder": "csoai", "code_sha256": hashlib.sha256(SCRIPT.read_bytes()).hexdigest()},
        declared={"fixture_count": 14, "invalid_control_count": 13,
                  "allowed_control_count": 1, "expect_invalid_effect": False,
                  "experiment": "synthetic-only",
                  "process_profile": "csoai.hitl-authority-effect/0.1"},
        observed={k: v for k, v in obs.items() if k != "successful"} | {
            "raw_receipt_sha256": hashlib.sha256(raw_bytes).hexdigest(),
            "observed_at": receipt["ran_at"],
            "hitl_process_profiles": references,
            "profile_count": len(references)},
        state=state, value=None, negative_control=control, limits=LIMITS
    )


def read_receipt(path):
    data = Path(path).read_bytes()
    _require(len(data) < 250_000, "receipt too large")
    return json.loads(data), data


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="command", required=True)
    for cmd in ("make", "verify"):
        p = sub.add_parser(cmd)
        p.add_argument("--receipt", required=True)
        p.add_argument("--commit", required=True)
        p.add_argument("--event", required=True)
        p.add_argument("--profiles", required=True)
    a = ap.parse_args()
    receipt, raw = read_receipt(a.receipt)
    raw_profiles = Path(a.profiles).read_bytes()
    _require(0 < len(raw_profiles) < 500000, "profile pack missing or too large")
    process_profiles = json.loads(raw_profiles)
    expected = make_event(receipt, raw, a.commit, process_profiles)
    if a.command == "make":
        path = Path(a.event)
        with path.open("x", encoding="utf8") as f:
            json.dump(expected, f, sort_keys=True, indent=2)
            f.write("\n")
        print(json.dumps({"event_id": expected["event_id"], "state": expected["state"],
                          "receipt_sha256": hashlib.sha256(raw).hexdigest(),
                          "bound_hitl_profiles": len(process_profiles),
                          "event_is_signed": False, "gspc_admitted": False}))
        return 1 if expected["state"] != "CONSISTENT" else 0
    got = json.loads(Path(a.event).read_text(encoding="utf8"))
    errors = evidence.validate(got)
    _require(not errors and got == expected, "event differs from reconstructed source: " + "; ".join(errors))
    print(json.dumps({"verified": True, "event_id": got["event_id"],
                      "state": got["state"], "signed": False,
                      "bound_hitl_profiles": len(process_profiles),
                      "institutionally_independent": False}))
    return 1 if got["state"] != "CONSISTENT" else 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (ValueError, OSError, json.JSONDecodeError) as ex:
        print("UNCHECKABLE:", str(ex), file=sys.stderr)
        sys.exit(2)
