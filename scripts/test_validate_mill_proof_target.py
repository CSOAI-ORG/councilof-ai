from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

from validate_mill_proof_target import validate_target

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "harness" / "gspc-top100"))
from mill_hub_queue import load_revision_pins


class ProofTargetTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.queue = self.root / "queue.jsonl"
        self.queue.write_text(json.dumps({
            "id": "org/model", "rank": 7, "pipeline_tag": "text-generation",
            "measured_axes": {"safety": {"status": "UNMEASURED", "card_id": None}},
        }) + "\n")
        self.dead = self.root / "dead.jsonl"
        self.dead.write_text("")
        self.inflight = self.root / "inflight.jsonl"
        self.inflight.write_text("")
        self.metadata = {
            "id": "org/model", "sha": "a" * 40,
            "inferenceProviderMapping": {
                "nscale": {"status": "live", "task": "conversational"},
                "featherless-ai": {"status": "live", "task": "conversational"},
            },
        }

    def check(self, **kwargs):
        return validate_target("org/model", "safety", self.queue, self.dead, self.inflight,
                               fetch=lambda _: kwargs.get("metadata", self.metadata))

    def test_exact_eligible_target_pins_revision_and_usable_provider(self):
        receipt = self.check()
        self.assertEqual(receipt["model_hf_revision"], "a" * 40)
        self.assertEqual(receipt["live_mill_providers"], ["featherless-ai"])
        self.assertTrue(receipt["eligible"])
        pins = self.root / "pins.json"
        pins.write_text(json.dumps({"org/model": "a" * 40}))
        self.assertEqual(load_revision_pins(pins), {"org/model": "a" * 40})
        pins.write_text(json.dumps({"org/model": "main"}))
        with self.assertRaises(ValueError):
            load_revision_pins(pins)

    def test_rejects_non_member_dead_measured_inflight_and_unusable_metadata(self):
        cases = []
        cases.append(("member", lambda: self.queue.write_text(json.dumps({"id": "other/model", "pipeline_tag": "text-generation"}) + "\n")))
        cases.append(("dead", lambda: self.dead.write_text(json.dumps({"id": "org/model", "as_of": "2999-01-01T00:00:00Z"}) + "\n")))
        cases.append(("low-yield on this axis", lambda: self.dead.write_text(json.dumps({
            "id": "org/model", "axis": "safety", "scope": "axis", "reason": "UNCHECKABLE low-yield route: 2 of 30",
            "as_of": "2999-01-01T00:00:00Z"}) + "\n")))
        cases.append(("measured", lambda: self.queue.write_text(json.dumps({"id": "org/model", "pipeline_tag": "text-generation", "measured_axes": {"safety": {"status": "MEASURED", "card_id": "x"}}}) + "\n")))
        cases.append(("inflight", lambda: self.inflight.write_text(json.dumps({"id": "org/model", "axis": "safety"}) + "\n")))
        for name, mutate in cases:
            with self.subTest(name=name):
                self.setUp(); mutate()
                with self.assertRaises(ValueError): self.check()
        for name, metadata in (
            ("revision", {**self.metadata, "sha": "main"}),
            ("mapping", {**self.metadata, "inferenceProviderMapping": {"nscale": {"status": "live", "task": "conversational"}}}),
            ("canonical", {**self.metadata, "id": "org/other"}),
        ):
            with self.subTest(name=name), self.assertRaises(ValueError): self.check(metadata=metadata)

    def test_a_low_yield_row_on_another_axis_does_not_refuse_this_one(self):
        # A low-yield route is dead on its own axis only (mill_hub_queue.dead_row_scope).
        self.dead.write_text(json.dumps({"id": "org/model", "axis": "governance", "scope": "axis",
                                         "reason": "UNCHECKABLE low-yield route: 2 of 30",
                                         "as_of": "2999-01-01T00:00:00Z"}) + "\n")
        self.assertTrue(self.check()["eligible"])


if __name__ == "__main__":
    unittest.main()
