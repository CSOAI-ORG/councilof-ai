import copy
import json
import tempfile
import unittest
from pathlib import Path

import institutional_rails as ir

class InstitutionalRailsTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.catalog = ir.load_json(ir.CATALOG)
        cls.events = ir.load_jsonl(ir.SOURCE_EVENTS)

    def test_current_source_renders_and_keeps_acceptance_orthogonal(self):
        outputs = ir.render(self.catalog, self.events, "producer-test")
        feed = outputs[ir.OUT / "events.jsonl"].decode().splitlines()
        self.assertEqual(len(feed), len(self.events))
        rows = [json.loads(line) for line in feed]
        agora = next(row for row in rows if row["rail_id"] == "bis-agora")
        self.assertEqual(agora["new_state"], "SETTLED")
        self.assertEqual(agora["finality"]["state"], "UNMEASURED")
        self.assertEqual(agora["acceptance"]["state"], "UNMEASURED")

    def test_scheduled_event_cannot_advance_state(self):
        event = copy.deepcopy(self.events[0])
        event["event_status"] = "SCHEDULED"
        with self.assertRaisesRegex(ValueError, "scheduled events cannot advance state"):
            ir.render(self.catalog, [event], "producer-test")

    def test_proposal_cannot_be_called_deployed_without_deployment_evidence(self):
        event = copy.deepcopy(next(e for e in self.events if e["rail_id"] == "dtcc-collateral-appchain"))
        event["new_state"] = "DEPLOYED"
        with self.assertRaisesRegex(ValueError, "DEPLOYED requires object field deployment_evidence"):
            ir.render(self.catalog, [event], "producer-test")

    def test_transaction_does_not_become_settlement_without_settlement_evidence(self):
        event = copy.deepcopy(self.events[0])
        event["new_state"] = "SETTLED"
        event.pop("live_evidence", None)
        event["transaction"] = {"state": "OBSERVED"}
        with self.assertRaisesRegex(ValueError, "SETTLED requires object field settlement"):
            ir.render(self.catalog, [event], "producer-test")

    def test_final_requires_measured_finality(self):
        event = copy.deepcopy(next(e for e in self.events if e["rail_id"] == "bis-agora"))
        event["new_state"] = "FINAL"
        with self.assertRaisesRegex(ValueError, "FINAL requires measured finality"):
            ir.render(self.catalog, [event], "producer-test")

    def test_same_canonical_event_cannot_be_split_into_two_discoveries(self):
        first = copy.deepcopy(self.events[0])
        second = copy.deepcopy(first)
        second["source_event_id"] = first["source_event_id"] + "-other-implication"
        with self.assertRaisesRegex(ValueError, "canonical source/event duplicate"):
            ir.render(self.catalog, [first, second], "producer-test")

    def test_non_correction_regression_is_rejected(self):
        first = copy.deepcopy(self.events[0])
        second = copy.deepcopy(first)
        second.update({
            "source_event_id": "ccip-followup-regression",
            "prior_state": "LIVE",
            "new_state": "PROPOSED",
            "event_at": "2026-10-02",
            "observed_at": "2026-10-02T00:00:00Z",
            "canonical_source": {**second["canonical_source"], "url": second["canonical_source"]["url"] + "?revision=2"},
            "canonical_event": {**second["canonical_event"], "title": "CCIP follow-up"},
        })
        with self.assertRaisesRegex(ValueError, "state regression requires CORRECTION"):
            ir.render(self.catalog, [first, second], "producer-test")

    def test_regulatory_action_cannot_enter_without_required_identity_fields(self):
        event = copy.deepcopy(next(e for e in self.events if e.get("regulatory")))
        event["regulatory"].pop("subject", None)
        with self.assertRaisesRegex(ValueError, "regulatory.*subject must be a non-empty string"):
            ir.render(self.catalog, [event], "producer-test")

    def test_request_time_is_not_a_field_in_generated_snapshot(self):
        outputs = ir.render(self.catalog, self.events, "producer-test")
        snapshot = json.loads(outputs[ir.OUT / "snapshot.json"])
        self.assertEqual(snapshot["as_of"], "2026-10-01T05:24:27Z")
        self.assertNotIn("generated_at", snapshot)
        self.assertNotIn("request_time", snapshot)

    def test_unknown_canonical_source_kind_is_rejected(self):
        event = copy.deepcopy(self.events[0])
        event["canonical_source"]["kind"] = "unclassified_third_party_source"
        with self.assertRaisesRegex(ValueError, "unsupported canonical source kind"):
            ir.render(self.catalog, [event], "producer-test")

    def test_code_plane_cannot_enable_automatic_promotion(self):
        code_plane = ir.load_json(ir.CODE_PLANE_BASELINE)
        code_plane["execution"]["automatic_promotion"] = True
        with self.assertRaisesRegex(ValueError, "automatic promotion must be false"):
            ir.render(
                self.catalog,
                self.events,
                "producer-test",
                code_plane_baseline=code_plane,
            )

    def test_code_plane_source_must_remain_review_required(self):
        code_plane = ir.load_json(ir.CODE_PLANE_BASELINE)
        code_plane["sources"][0]["promotion_state"] = "AUTO_PROMOTE"
        with self.assertRaisesRegex(ValueError, "must remain REVIEW_REQUIRED"):
            ir.render(
                self.catalog,
                self.events,
                "producer-test",
                code_plane_baseline=code_plane,
            )

    def test_watch_universe_rejects_duplicate_target_id(self):
        universe = ir.load_json(ir.WATCH_UNIVERSE)
        universe["targets"].append(copy.deepcopy(universe["targets"][0]))
        with self.assertRaisesRegex(ValueError, "duplicate target id"):
            ir.render(
                self.catalog,
                self.events,
                "producer-test",
                watch_universe=universe,
            )

    def test_watch_universe_requires_expected_rails(self):
        universe = ir.load_json(ir.WATCH_UNIVERSE)
        universe["targets"][0]["expected_rail_ids"] = []
        with self.assertRaisesRegex(ValueError, "expected_rail_ids must be a non-empty array"):
            ir.render(
                self.catalog,
                self.events,
                "producer-test",
                watch_universe=universe,
            )

    def test_existing_public_ledger_must_be_exact_prefix(self):
        with tempfile.TemporaryDirectory() as td:
            path = Path(td) / "events.jsonl"
            path.write_bytes(b'{"a":1}\n')
            ir.assert_append_only(path, b'{"a":1}\n{"a":2}\n')
            with self.assertRaisesRegex(ValueError, "not an exact prefix"):
                ir.assert_append_only(path, b'{"a":9}\n{"a":2}\n')

if __name__ == "__main__":
    unittest.main()
