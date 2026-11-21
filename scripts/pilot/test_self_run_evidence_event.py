#!/usr/bin/env python3
"""No network: verify canonical evidence side is bound to unmodified replay bytes."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

SCRIPT = Path(__file__).with_name("self-run-evidence-event.py")
spec = importlib.util.spec_from_file_location("self_run_event", SCRIPT)
target = importlib.util.module_from_spec(spec)
spec.loader.exec_module(target)

SHA = "a" * 64
COMMIT = "b" * 40


def receipt():
    cases = [{"scenario": "pass", "execution": "EXECUTED",
              "observer": "EFFECT_READBACK_MATCHED", "actual_effect_written": True}]
    cases += [{"scenario": f"bad-{i}", "execution": "DENIED",
               "observer": "NO_EFFECT", "actual_effect_written": False} for i in range(13)]
    return {"schema": "csoai.pilot-demo/0.1", "ran_at": "2026-11-21T01:00:00.000Z",
            "source_sha256": SHA, "fixture_count": 14,
            "results": {"authorised_effect_and_readback": True, "negative_controls": True,
                        "honest_scope": True, "upstream_trial_passed": True},
            "outcome": "PASS", "independent_review": "NOT_CONDUCTED",
            "human_approval": "SYNTHETIC_KEY_ONLY", "production_authority": False,
            "gspc_measurement_admission": False, "cases": cases}


def encode(r):
    return (json.dumps(r, sort_keys=True) + "\n").encode()


class TestSelfRun(unittest.TestCase):
    def test_valid_event_is_canonical_but_unsigned(self):
        r = receipt()
        ev = target.make_event(r, encode(r), COMMIT)
        self.assertEqual(ev["state"], "CONSISTENT")
        self.assertIsNone(ev["signature"])
        self.assertIsNone(ev["value"])
        self.assertEqual(target.evidence.validate(ev), [])
        self.assertEqual(ev["observed"]["denied_without_effect"], 13)
        self.assertNotIn("human_identity", ev)

    def test_tampered_raw_receipt_detected(self):
        r = receipt()
        ev = target.make_event(r, encode(r), COMMIT)
        altered = dict(r)
        altered["ran_at"] = "2026-11-21T01:00:01.000Z"
        self.assertNotEqual(ev, target.make_event(altered, encode(altered), COMMIT))

    def test_unauthorized_effect_cannot_pass(self):
        r = receipt()
        r["cases"][3]["actual_effect_written"] = True
        ev = target.make_event(r, encode(r), COMMIT)
        self.assertEqual(ev["state"], "DIVERGENT")
        self.assertEqual(ev["observed"]["denied_without_effect"], 12)

    def test_claim_boundaries_not_overridable(self):
        r = receipt()
        r["human_approval"] = "REAL"
        with self.assertRaisesRegex(ValueError, "claim boundary"):
            target.make_event(r, encode(r), COMMIT)

    def test_population_and_git_pin_required(self):
        r = receipt()
        r["cases"].pop()
        with self.assertRaises(ValueError):
            target.make_event(r, encode(r), COMMIT)
        with self.assertRaises(ValueError):
            target.make_event(receipt(), encode(receipt()), "master")

    def test_signature_or_id_edit_detected(self):
        r = receipt()
        e = target.make_event(r, encode(r), COMMIT)
        e["observed"]["raw_receipt_sha256"] = "0" * 64
        self.assertNotEqual(target.evidence.validate(e), [])

    def test_false_success_flags_not_promoted(self):
        r = receipt()
        r["results"]["negative_controls"] = False
        ev = target.make_event(r, encode(r), COMMIT)
        self.assertEqual(ev["state"], "DIVERGENT")


if __name__ == "__main__":
    unittest.main()
