#!/usr/bin/env python3
"""Synthetic process-evidence regression: actual HITL profile is REQUIRED."""
import hashlib
import importlib.util
import json
from pathlib import Path
import unittest

SCRIPT = Path(__file__).with_name("self-run-evidence-event.py")
spec = importlib.util.spec_from_file_location("self_run_event", SCRIPT)
target = importlib.util.module_from_spec(spec)
spec.loader.exec_module(target)

SHA = "a" * 64
COMMIT = "b" * 40
T = 1795222800000


def receipt():
    cases = []
    for i, scenario in enumerate(target.profiles_module.SCENARIOS):
        positive = scenario == "pass"
        binding = {
            "request_sha256": hashlib.sha256(("request" + str(i)).encode()).hexdigest(),
            "approval_sha256": hashlib.sha256(("approval" + str(i)).encode()).hexdigest(),
            "authority_sha256": hashlib.sha256(("authority" + str(i)).encode()).hexdigest(),
            "scope_sha256": hashlib.sha256(("scope" + str(i)).encode()).hexdigest(),
            "invocation_sha256": hashlib.sha256(("invocation" + str(i)).encode()).hexdigest(),
            "request_id": "demo-request-001", "action": "append_bounded_marker",
            "resource_ref": "local:effects.jsonl", "decision_id": "demo-approval-001",
            "declared_decision": "DENY" if scenario == "deny" else "APPROVE",
            "principal_ref": "demo:role:reviewer-1", "authority_epoch": "demo-epoch-1",
            "decided_at_ms": T-1000, "expires_at_ms": T+60000,
            "execution_at_ms": T,
            "effect_sha256": "c"*64 if positive else None,
            "effect_receipt_sha256": "d"*64 if positive else None,
            "observer_process": "separate-local-process" if positive else "separate-local-process-no-effect",
            "authenticated_human": False,
            "source": "OWNED_LOCAL_TEST_FIXTURE"
        }
        cases.append({
            "scenario": scenario,
            "execution": "EXECUTED" if positive else "DENIED",
            "observer": "EFFECT_READBACK_MATCHED" if positive else "NO_EFFECT",
            "actual_effect_written": positive,
            "reasons": [] if positive else ["TEST_DENIAL"],
            "binding": binding,
        })
    return {
        "schema": "csoai.pilot-demo/0.1", "ran_at": "2026-11-21T01:00:00.000Z",
        "source_sha256": SHA, "fixture_count": 14,
        "results": {
            "authorised_effect_and_readback": True, "negative_controls": True,
            "honest_scope": True, "upstream_trial_passed": True
        },
        "outcome": "PASS", "independent_review": "NOT_CONDUCTED",
        "human_approval": "SYNTHETIC_KEY_ONLY",
        "production_authority": False,
        "gspc_measurement_admission": False,
        "cases": cases,
    }


def encode(r):
    return (json.dumps(r, sort_keys=True) + "\n").encode()


def proof(r, raw=None):
    raw = raw if raw is not None else encode(r)
    return target.profiles_module.records(r, raw, COMMIT)


class TestSelfRun(unittest.TestCase):
    def test_valid_event_binds_real_profile_without_human_approval(self):
        r = receipt()
        pack = proof(r)
        target.profiles_module.validate_records(pack)
        ev = target.make_event(r, encode(r), COMMIT, pack)
        self.assertEqual(ev["state"], "CONSISTENT")
        self.assertIsNone(ev["signature"])
        self.assertIsNone(ev["value"])
        self.assertEqual(target.evidence.validate(ev), [])
        self.assertEqual(ev["observed"]["denied_without_effect"], 13)
        self.assertEqual(ev["observed"]["profile_count"], 14)
        self.assertEqual(ev["observed"]["hitl_process_profiles"], target.profiles_module.digests(pack))
        self.assertEqual([p["effect"]["state"] for p in pack].count("OBSERVED"), 1)
        self.assertEqual([p["invocation"]["state"] for p in pack].count("REJECTED"), 13)
        self.assertTrue(all(x["authority"]["principal_ref"].startswith("synthetic-test-principal:")
                            for x in pack))
        self.assertTrue(all(x["provenance"]["signature_ref"] is None for x in pack))
        self.assertNotIn("human_identity", ev)

    def test_older_aggregate_only_record_is_refused(self):
        r = receipt()
        with self.assertRaisesRegex(ValueError, "reconstructed"):
            target.make_event(r, encode(r), COMMIT, [])

    def test_tampered_raw_receipt_changes_profile_ids_and_event(self):
        r = receipt()
        ev = target.make_event(r, encode(r), COMMIT, proof(r))
        r["ran_at"] = "2026-11-21T01:00:01.000Z"
        self.assertNotEqual(ev, target.make_event(r, encode(r), COMMIT, proof(r)))

    def test_unauthorized_effect_cannot_be_relabelled_as_stopped(self):
        r = receipt()
        r["cases"][3]["actual_effect_written"] = True
        with self.assertRaisesRegex(ValueError, "effect observation changed"):
            target.make_event(r, encode(r), COMMIT, proof(r))

    def test_claim_boundaries_not_overridable(self):
        r = receipt()
        r["human_approval"] = "REAL"
        with self.assertRaises(ValueError):
            target.make_event(r, encode(r), COMMIT, proof(r))

    def test_population_and_git_pin_required(self):
        r = receipt()
        r["cases"].pop()
        with self.assertRaises(ValueError):
            target.make_event(r, encode(r), COMMIT, [])
        r = receipt()
        with self.assertRaisesRegex(ValueError, "source commit"):
            target.make_event(r, encode(r), "master", proof(r))

    def test_signature_or_id_edit_detected(self):
        r = receipt()
        e = target.make_event(r, encode(r), COMMIT, proof(r))
        e["observed"]["raw_receipt_sha256"] = "0" * 64
        self.assertNotEqual(target.evidence.validate(e), [])

    def test_false_success_flags_do_not_pass(self):
        r = receipt()
        r["results"]["negative_controls"] = False
        ev = target.make_event(r, encode(r), COMMIT, proof(r))
        self.assertEqual(ev["state"], "DIVERGENT")

    def test_profile_packet_change_is_detected(self):
        r = receipt()
        pack = proof(r)
        pack[0]["effect"]["effect_digest"]["value"] = "0" * 64
        with self.assertRaisesRegex(ValueError, "not reconstructed"):
            target.make_event(r, encode(r), COMMIT, pack)

    def test_wrong_decision_or_effect_is_rejected(self):
        r = receipt()
        r["cases"][0]["binding"]["declared_decision"] = "DENY"
        with self.assertRaisesRegex(ValueError, "positive effect evidence"):
            proof(r)
        r = receipt()
        r["cases"][0]["binding"]["effect_sha256"] = None
        with self.assertRaisesRegex(ValueError, "positive effect evidence"):
            proof(r)

    def test_profile_contract_has_real_request_effect_and_verification(self):
        r = receipt()
        pack = proof(r)
        success = pack[0]
        self.assertEqual(success["profile"], "csoai.hitl-authority-effect/0.1")
        self.assertEqual(success["request"]["action"], "append_bounded_marker")
        self.assertEqual(success["authority"]["decision"], "APPROVE")
        self.assertEqual(success["invocation"]["state"], "EXECUTED")
        self.assertEqual(success["effect"]["state"], "OBSERVED")
        self.assertEqual(success["verification"]["state"], "VERIFIED")
        self.assertTrue(all(x["effect"]["state"] == "NONE" for x in pack[1:]))
        self.assertTrue(all(x["verification"]["state"] == "PARTIAL" for x in pack[1:]))


if __name__ == "__main__":
    unittest.main()
