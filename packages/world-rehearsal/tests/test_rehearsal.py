import copy
import json
from pathlib import Path
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from rehearsal.engine import simulate, SimulationPermit, configure
from rehearsal.evidence import bundle_for, verify, compare, strict_json
from rehearsal.dependencies import fabric, tempo
from rehearsal.messaging import RehearsalMessages


class RehearsalTests(unittest.TestCase):
    def test_replay_is_exact_without_random_global_state(self):
        a = bundle_for(simulate({"seed": 19, "population": 100}))
        self.assertEqual(a, bundle_for(simulate({"seed": 19, "population": 100})))
        self.assertEqual(verify(a)["state"], "REPLAY_MATCH")

    def test_different_seed_has_different_identity(self):
        self.assertNotEqual(simulate({"seed": 1})["scenario_id"],
                            simulate({"seed": 2})["scenario_id"])

    def test_aware_branch_avoids_revoked_evidence_and_baseline_exposes_it(self):
        a, b = (simulate({"intervention": mode}) for mode in ("baseline", "evidence-aware"))
        self.assertGreater(a["frames"][-1]["revoked_A_selected"], 0)
        self.assertEqual(b["frames"][-1]["revoked_A_selected"], 0)
        self.assertEqual(a["frames"][:3], b["frames"][:3])

    def test_aggregate_population_accounting(self):
        for frame in simulate({"population": 103})["frames"]:
            self.assertEqual(sum(frame["counts"]) + frame["undecided"], 103)

    def test_globe_sample_is_not_population_count(self):
        core = simulate({})
        self.assertEqual(len(core["sampled_nodes"]), 120)
        self.assertEqual(core["counters"]["population_records"], 1000)
        self.assertEqual(core["counters"]["model_calls"], 0)
        self.assertEqual(core["counters"]["human_participants"], 0)
        self.assertEqual(core["counters"]["surrogate_updates"], 0)

    def test_bounded_work_and_boolean_inputs_refused(self):
        for bad in ({"population": 10001}, {"population": True}, {"rounds": 51},
                    {"seed": -1}, {"intervention": "remote"}, {"command": "echo unsafe"},
                    {"population": 1.5}):
            with self.subTest(bad=bad), self.assertRaises(ValueError):
                configure(bad)

    def test_expired_simulation_leaves_population_unchanged(self):
        core = simulate({"permit_expires_tick": 0, "population": 14})
        self.assertEqual(core["counters"]["fixture_lookup_updates"], 0)
        self.assertTrue(all(f["undecided"] == 14 for f in core["frames"]))

    def test_scope_expiry_revocation_and_one_use(self):
        permit = SimulationPermit("one", 3)
        self.assertEqual(permit.consume("two", "advance-simulation", 0), "SCOPE_MISMATCH")
        self.assertEqual(permit.consume("one", "shell", 0), "SCOPE_MISMATCH")
        self.assertEqual(permit.consume("one", "advance-simulation", 3), "EXPIRED")
        self.assertEqual(permit.consume("one", "advance-simulation", 0), "ALLOWED")
        self.assertEqual(permit.consume("one", "advance-simulation", 0), "REPLAY_REFUSED")
        permit.revoked = True
        self.assertEqual(permit.consume("one", "advance-simulation", 1), "REVOKED")

    def test_imported_queue_keeps_time_priority_and_sequence(self):
        q = tempo.Tempo()
        q.push(1, "readout", "late", priority=9)
        q.push(0, "decision", "first")
        q.push(0, "decision", "second")
        self.assertEqual(q.pop_batch(), (0, "decision", ["first", "second"]))
        self.assertEqual(q.pop_batch(), (1, "readout", ["late"]))

    def test_canonical_event_reused_and_keeps_limits(self):
        event = bundle_for(simulate({}))["evidence_events"][0]
        self.assertEqual(event["schema"], "csoai.evidence-event/0.1")
        self.assertEqual(fabric.validate(event), [])
        self.assertEqual(event["state"], "UNMEASURED")
        self.assertIsNone(event["value"])
        self.assertIsNone(event["signature"])

    def test_edited_result_is_refused_even_with_recomputed_local_hash(self):
        bundle = bundle_for(simulate({}))
        bundle["core"]["frames"][-1]["revoked_A_selected"] = 999
        bundle["bundle_id"] = "sha256:" + fabric.sha256_hex(
            fabric.jcs({k:v for k,v in bundle.items() if k != "bundle_id"}))
        with self.assertRaises(ValueError):
            verify(bundle)

    def test_added_signature_or_authority_is_refused(self):
        for key, value in (("signature", "pretend"), ("human_authority", True)):
            bundle = bundle_for(simulate({}))
            bundle[key] = value
            with self.assertRaises(ValueError):
                verify(bundle)

    def test_wrong_engine_or_event_cannot_reopen(self):
        bundle = bundle_for(simulate({}))
        bundle["engine_fingerprint"] = "0" * 64
        with self.assertRaises(ValueError):
            verify(bundle)
        bundle = bundle_for(simulate({}))
        bundle["evidence_events"][0]["observed"]["counters"]["model_calls"] = 1
        with self.assertRaises(ValueError):
            verify(bundle)

    def test_duplicate_keys_and_nonfinite_are_refused(self):
        for raw in ('{"seed":1,"seed":2}', '{"core":{"a":1,"a":2}}', '{"x":NaN}'):
            with self.assertRaises(ValueError):
                strict_json(raw)

    def test_controlled_compare_and_changed_context_refusal(self):
        a = bundle_for(simulate({"intervention": "baseline"}))
        b = bundle_for(simulate({"intervention": "evidence-aware"}))
        self.assertLess(compare(a, b)["revoked_A_selection_delta"], 0)
        with self.assertRaises(ValueError):
            compare(a, bundle_for(simulate({"seed": 999})))

    def test_upstream_messages_real_store_and_unknown_identity_refusal(self):
        with tempfile.TemporaryDirectory() as directory:
            bus = RehearsalMessages(Path(directory) / "chat")
            try:
                messages = bus.publish(simulate({"population": 10}))
                self.assertEqual([m["from"] for m in messages],
                                 ["planner", "challenger", "planner"])
                with self.assertRaises(ValueError):
                    bus.request("invalid-token", "send", {"chat": bus.channel, "text": "fake"})
                with self.assertRaises(ValueError):
                    bus.request(bus.tokens["planner"], "user_add", {"id": "fake"})
            finally:
                bus.close()

    def test_upstream_membership_prevents_unauthorised_reader(self):
        with tempfile.TemporaryDirectory() as directory:
            bus = RehearsalMessages(Path(directory) / "chat")
            try:
                outsider = bus.store.add_user("outsider", "Outside")
                with self.assertRaises(Exception):
                    bus.request(outsider, "read", {"chat": bus.channel, "last": 5})
            finally:
                bus.close()


if __name__ == "__main__":
    unittest.main()
