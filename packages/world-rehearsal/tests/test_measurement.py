import copy
from pathlib import Path
import sys
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from rehearsal.measurement import configure_suite, run_suite, verify_suite, measure_core
from rehearsal.engine import simulate, digest
from rehearsal.dependencies import fabric


class MeasurementTests(unittest.TestCase):
    def small(self):
        return run_suite({"population": 25, "seeds": [42], "rounds": 6})

    def test_exact_replay_and_no_authority(self):
        report = self.small()
        self.assertEqual(report, self.small())
        verdict = verify_suite(report)
        self.assertEqual(verdict["state"], "REPLAY_MATCH")
        for key in ("signature_verified", "independent_observer", "human_authority",
                    "gspc_admitted", "promotion_allowed"):
            self.assertIs(verdict[key], False)

    def test_population_model_and_human_units_do_not_collapse(self):
        c = self.small()["counters"]
        self.assertEqual(c["population_records_per_episode"], 25)
        self.assertEqual(c["paired_cases"], 4)
        self.assertEqual(c["simulation_episodes"], 8)
        self.assertEqual(c["simulated_record_instances"], 200)
        self.assertEqual(c["scheduled_record_ticks"], 1200)
        for name in ("actual_model_calls", "active_model_agents",
                     "model_response_replays", "consenting_human_participants"):
            self.assertEqual(c[name], 0)

    def test_controls_and_effect_are_separate(self):
        report = self.small()
        self.assertTrue(report["summary"]["controls_pass"])
        self.assertGreater(report["summary"]["discriminating_pairs"], 0)
        self.assertLess(report["summary"]["candidate_minus_baseline_revoked_decisions"], 0)
        for p in report["pairs"]:
            self.assertEqual(p["runs"]["baseline"]["metrics"]["completed_decisions"],
                             p["runs"]["evidence-aware"]["metrics"]["completed_decisions"])
        unchanged = next(p for p in report["pairs"] if p["case"] == "unchanged-control")
        self.assertEqual(unchanged["candidate_minus_baseline_revoked_decisions"], 0)

    def test_no_decisions_is_unknown_rate_not_perfection(self):
        expired = next(p for p in self.small()["pairs"] if p["case"] == "expired-control")
        for r in expired["runs"].values():
            self.assertEqual(r["metrics"]["completed_decisions"], 0)
            self.assertEqual(r["metrics"]["blocked_decision_slots"], 150)
            self.assertIsNone(r["metrics"]["revoked_evidence_decision_rate"])

    def test_retained_state_is_not_counted_as_a_new_decision(self):
        core = simulate({"population": 100, "rounds": 6, "permit_expires_tick": 2,
                         "revocation_tick": 3, "intervention": "baseline"})
        m = measure_core(core)
        self.assertEqual(m["completed_decisions"], 200)
        self.assertEqual(m["revoked_evidence_decisions"], 0)
        self.assertGreater(m["retained_revoked_record_ticks"], 0)
        self.assertEqual(m["blocked_decision_slots"], 400)

    def test_bounded_work_rejects_duplicates_booleans_and_unknown_backends(self):
        for params in (None, {"seeds": []}, {"seeds": [1, 1]}, {"seeds": [True]},
                       {"seeds": list(range(9))}, {"seeds": [-1]}, {"seeds": [2**32]},
                       {"population": True}, {"rounds": 3}, {"model": "remote"},
                       {"seeds": list(range(8)), "population": 10000, "rounds": 50}):
            with self.subTest(params=params), self.assertRaises(ValueError):
                configure_suite(params)

    def test_tamper_refused_even_if_outer_digest_recomputed(self):
        report = self.small()
        report["counters"]["consenting_human_participants"] = 1
        report["report_id"] = "sha256:" + digest({k:v for k,v in report.items() if k != "report_id"})
        with self.assertRaises(ValueError):
            verify_suite(report)

    def test_forged_better_candidate_refused(self):
        report = self.small()
        report["pairs"][0]["runs"]["baseline"]["metrics"]["revoked_evidence_decisions"] = 99999
        with self.assertRaises(ValueError):
            verify_suite(report)

    def test_missing_extra_or_wrong_engine_fields_refused(self):
        original = self.small()
        for mutate in (lambda r:r.pop("summary"), lambda r:r.update(signature="pretend"),
                       lambda r:r.update(engine_fingerprint="0"*64)):
            report = copy.deepcopy(original);mutate(report)
            with self.assertRaises(ValueError):
                verify_suite(report)

    def test_canonical_event_has_no_board_score_or_signature(self):
        event = self.small()["evidence_events"][0]
        self.assertEqual(fabric.validate(event), [])
        self.assertEqual(event["state"], "UNMEASURED")
        self.assertIsNone(event["value"])
        self.assertIsNone(event["signature"])

    def test_plumbing_can_be_nondiscriminating(self):
        # Both named branches use the baseline: controls can still pass, but no gain exists.
        def unchanged(params):
            return simulate({**params, "intervention": "baseline"})
        with patch("rehearsal.measurement.simulate", side_effect=unchanged):
            report = self.small()
        self.assertTrue(report["summary"]["controls_pass"])
        self.assertEqual(report["summary"]["discriminating_pairs"], 0)
        self.assertFalse(report["summary"]["model_improvement_established"])

    def test_declared_controls_detect_candidate_refusal_gaming(self):
        def abstaining(params):
            return simulate({**params, "permit_expires_tick": 0}) if params["intervention"] == "evidence-aware" else simulate(params)
        with patch("rehearsal.measurement.simulate", side_effect=abstaining):
            report = self.small()
        self.assertFalse(report["summary"]["controls_pass"])
        self.assertFalse(report["summary"]["promotion_allowed"])
