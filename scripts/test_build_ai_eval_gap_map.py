#!/usr/bin/env python3
"""Pure future-producer regressions; no census, network or snapshot generation."""
from __future__ import annotations

import copy
import importlib.util
import unittest
from pathlib import Path
from unittest.mock import patch


def load_producer():
    path = Path(__file__).with_name("build_ai_eval_gap_map.py")
    spec = importlib.util.spec_from_file_location("gap_map_under_test", path)
    module = importlib.util.module_from_spec(spec)
    with patch("urllib.request.urlopen", side_effect=AssertionError("Network disabled in gap-map tests")):
        spec.loader.exec_module(module)
    return module


producer = load_producer()

# Independent fixture matching the board producer's 34-axis family totals at the
# pinned base: 15 GSPC (14 model comparisons + effect-binding), 11 subjects, 8 facts.
# These are board coverage counts, not invented task scores or a fresh live census.
BOARD_34 = {
    "state": "OBSERVED",
    "source": "https://councilof.ai/api/gspc",
    "totals": {
        "axes": 34, "measured_axes": 34, "unmeasured_axes": 0,
        "by_family": {
            "gspc": {"axes": 15, "measured": 15},
            "subject": {"axes": 11, "measured": 11, "note": "Frozen subject-class methods; no aggregate score."},
            "financial": {"axes": 8, "measured": 8},
        },
        "comparison_axes": 14, "separated_leads": 0, "ties": 7, "untested_separations": 7,
        # Controlled counterfacts for validation below, not a claim about live signing or attribution.
        "financial_run_attestations": {"run_artifacts": 4, "ed25519_signed": 1, "content_addressed_unsigned": 3},
        "uncarded_leaders_dropped": 3, "uncarded_leaders_dropped_axes": ["safety", "jail", "swarm"],
        "own_leaders_excluded": 8,
        "own_leaders_excluded_axes": ["governance", "safety", "provenance", "continuity", "conformance", "swarm", "jail", "affect"],
    },
}


class GapMapProducerTest(unittest.TestCase):
    def setUp(self):
        self.network = patch("urllib.request.urlopen", side_effect=AssertionError("Network disabled in gap-map tests"))
        self.network.start()
        self.addCleanup(self.network.stop)

    def test_current_34_axis_family_coverage_cannot_be_emitted_as_unmeasured(self):
        board = copy.deepcopy(BOARD_34)
        row = producer.csoai_gaps(board)[0]
        self.assertEqual(row["value"], 11)
        self.assertEqual(row["declared"], 11)
        self.assertEqual(row["state"], "MEASURED=11")
        self.assertIn("11 carry a measurement", row["gap"])
        self.assertIn("0 remain unmeasured", row["gap"])
        self.assertNotIn("whole subject axis family is declared and unmeasured", row["gap"])
        self.assertEqual(row["field_path"], "/api/gspc totals.by_family.subject.measured")
        self.assertEqual(row["note"], board["totals"]["by_family"]["subject"]["note"])
        self.assertEqual(board, BOARD_34)

    def test_future_partial_coverage_and_observed_zero_are_derived(self):
        for measured, unmeasured in [(7, 4), (0, 11)]:
            with self.subTest(measured=measured):
                board = copy.deepcopy(BOARD_34)
                board["totals"]["by_family"]["subject"]["measured"] = measured
                row = producer.csoai_gaps(board)[0]
                self.assertEqual(row["value"], measured)
                self.assertEqual(row["state"], f"MEASURED={measured}")
                self.assertIn(f"{unmeasured} remain unmeasured", row["gap"])

    def test_missing_or_inconsistent_family_counts_remain_null_and_uncheckable(self):
        cases = [None, {}, {"axes": 11}, {"measured": 11}, {"axes": 11, "measured": 12},
                 {"axes": 11, "measured": -1}, {"axes": 11, "measured": "11"},
                 {"axes": 11, "measured": False}, {"axes": True, "measured": 0}]
        for family in cases:
            with self.subTest(family=family):
                board = copy.deepcopy(BOARD_34)
                if family is None:
                    del board["totals"]["by_family"]["subject"]
                else:
                    board["totals"]["by_family"]["subject"] = family
                row = producer.csoai_gaps(board)[0]
                self.assertIsNone(row["value"])
                self.assertEqual(row["state"], "UNCHECKABLE")
                self.assertNotIn("MEASURED=0", row["state"])
                self.assertIn("UNCHECKABLE", row["gap"])
        self.assertEqual(producer.csoai_gaps({"state": "UNREACHABLE"})[0]["state"], "UNREACHABLE")

    def test_mlcommons_metadata_separates_public_harness_from_controlled_benchmarks(self):
        rows = {r["reader"]: r for r in producer.CANDIDATES}
        for name in ["mlcommons_modelbench", "mlcommons_ailuminate"]:
            with self.subTest(reader=name):
                row = rows[name]
                self.assertNotEqual(row["access"], "PUBLIC_OPEN_SOURCE")
                self.assertEqual(row["repo"], "mlcommons/modelbench")
                self.assertEqual(row["observation_scope"], "PUBLIC_HARNESS_REPOSITORY_METADATA_ONLY")
                self.assertIn("confidential", row["resource_access_note"].lower())
                self.assertEqual(row["publication_policy_url"], "https://mlcommons.org/ailuminate/citing-results/")
                self.assertIn("Official", row["publication_note"])
                self.assertIn("Practice", row["publication_note"])
                self.assertIn("internal only", row["publication_note"])
                self.assertEqual(row["reviewed_on"], "2026-11-06")
                self.assertIn("both observe ModelBench", row.get("shared_repository_note", ""))
                self.assertIn("not two distinct runners", row.get("shared_repository_note", ""))
                self.assertIsNone(row["count"])
        suite = rows["mlcommons_ailuminate"]
        self.assertEqual(suite.get("benchmark_source"), "https://mlcommons.org/ailuminate/")
        self.assertEqual(suite.get("benchmark_versions"), {"safety": "1.2.1", "jailbreak": "1.1", "assessment_standard": "1.4"})
        self.assertEqual(set(suite["method_sources"]), {
            "https://mlcommons.org/ailuminate/safety/", "https://mlcommons.org/ailuminate/assessment-standard/",
        })
        self.assertNotIn("AILuminate v1.1 risk-assessment suite", suite["count_note"])
        harness = rows["mlcommons_modelbench"]
        self.assertEqual(harness["code_license"], "Apache-2.0")
        self.assertIn("/a23357d9cc07af9ac25d4f22b397f4842a1d485e/LICENSE.md", harness["code_license_source"])

    def test_repository_observation_cannot_erase_benchmark_rights_or_claim_runtime_execution(self):
        row = next(r for r in producer.CANDIDATES if r["reader"] == "mlcommons_ailuminate")
        before = copy.deepcopy(row)
        repo = {"html_url": "https://github.com/mlcommons/modelbench", "default_branch": "main",
                "license": {"spdx_id": "Apache-2.0"}}
        with patch.object(producer, "_json", return_value=(repo, "OK", "a" * 64)) as fetch_repo:
            observed = producer.observe(row, producer.board_phrase(BOARD_34))
        fetch_repo.assert_called_once_with("https://api.github.com/repos/mlcommons/modelbench")
        self.assertEqual(observed["state"], "OBSERVED")
        self.assertEqual(observed["observation_scope"], "PUBLIC_HARNESS_REPOSITORY_METADATA_ONLY")
        self.assertEqual(observed["benchmark_source"], "https://mlcommons.org/ailuminate/")
        self.assertEqual(observed["publication_note"], row["publication_note"])
        self.assertEqual(observed["resource_access_note"], row["resource_access_note"])
        self.assertEqual(observed["license_observed"], "Apache-2.0")
        self.assertIsNone(observed["count"])
        self.assertEqual(row, before)

    def test_separation_and_leader_attribution_follow_changed_reported_counts(self):
        board = copy.deepcopy(BOARD_34)
        board["totals"].update({"separated_leads": 1, "ties": 6,
            "uncarded_leaders_dropped": 2, "uncarded_leaders_dropped_axes": ["safety", "jail"],
            "own_leaders_excluded": 1, "own_leaders_excluded_axes": ["care"]})
        rows = producer.csoai_gaps(board)
        self.assertEqual((rows[1]["value"], rows[1]["ties"], rows[1]["untested_separations"]), (1, 6, 7))
        self.assertEqual(rows[1]["state"], "SEPARATED_LEADS=1")
        self.assertIn("SEPARATED 1, TIE 6, UNTESTED 7", rows[1]["gap"])
        self.assertEqual((rows[3]["value"], rows[3]["axes"]), (2, ["safety", "jail"]))
        self.assertEqual(rows[3]["state"], "UNCARDED_LEADERS_DROPPED=2")
        self.assertIn("reports 2 axes", rows[3]["gap"])
        self.assertEqual((rows[4]["value"], rows[4]["axes"]), (1, ["care"]))
        self.assertEqual(rows[4]["state"], "OWN_MODELS_EXCLUDED=1")
        self.assertIn("reports 1 axis", rows[4]["gap"])

    def test_signing_is_reported_and_never_a_fixed_partial_or_verified_claim(self):
        for runs, signed, unsigned in [(4, 1, 3), (4, 4, 0), (4, 0, 4), (0, 0, 0)]:
            with self.subTest(runs=runs, signed=signed, unsigned=unsigned):
                board = copy.deepcopy(BOARD_34)
                board["totals"]["financial_run_attestations"] = {
                    "run_artifacts": runs, "ed25519_signed": signed, "content_addressed_unsigned": unsigned}
                row = producer.csoai_gaps(board)[2]
                self.assertEqual((row["run_artifacts"], row["value"], row["content_addressed_unsigned"]), (runs, signed, unsigned))
                self.assertEqual(row["state"], f"REPORTED_ED25519_SIGNED={signed}")
                self.assertIn(f"{signed} labelled Ed25519-signed and {unsigned} content-addressed unsigned", row["gap"])
                self.assertIn("does not cryptographically verify signatures", row["gap"])

    def test_observed_zero_attribution_and_separation_are_not_missing_counts(self):
        board = copy.deepcopy(BOARD_34)
        board["totals"].update({"comparison_axes": 0, "separated_leads": 0, "ties": 0, "untested_separations": 0,
            "uncarded_leaders_dropped": 0, "uncarded_leaders_dropped_axes": [],
            "own_leaders_excluded": 0, "own_leaders_excluded_axes": []})
        rows = producer.csoai_gaps(board)
        for index in [1, 3, 4]:
            self.assertEqual(rows[index]["value"], 0)
            self.assertTrue(rows[index]["state"].endswith("=0"))
        self.assertEqual(rows[3]["axes"], [])
        self.assertEqual(rows[4]["axes"], [])

    def test_board_coverage_uses_slot_units_without_claiming_a_task_catalog_is_absent(self):
        board = copy.deepcopy(BOARD_34)
        board["totals"].update({"axes": 36, "measured_axes": 34, "unmeasured_axes": 2})
        rows = producer.csoai_gaps(board)
        self.assertEqual((rows[5]["value"], rows[5]["measured_axes"], rows[5]["unmeasured_axes"]), (36, 34, 2))
        self.assertEqual(rows[5]["state"], "DECLARED_SLOTS=36")
        self.assertIn("36 axis slots: 34 measured and 2 unmeasured", rows[5]["gap"])
        self.assertIn("Axis slots and repository task modules are different units", rows[5]["gap"])
        self.assertNotIn("not a published catalogue", rows[5]["gap"])
        self.assertEqual([row["field_path"] for row in rows], [
            "/api/gspc totals.by_family.subject.measured", "/api/gspc totals.separated_leads",
            "/api/gspc totals.financial_run_attestations.ed25519_signed", "/api/gspc totals.uncarded_leaders_dropped",
            "/api/gspc totals.own_leaders_excluded", "/api/gspc totals.axes",
        ])

    def test_missing_and_invalid_counterfacts_are_null_not_hard_coded_claims(self):
        fields = [
            (1, "separated_leads"), (1, "ties"), (1, "untested_separations"),
            (3, "uncarded_leaders_dropped"), (4, "own_leaders_excluded"),
            (5, "axes"), (5, "measured_axes"), (5, "unmeasured_axes"),
        ]
        for index, field in fields:
            for value in [None, -1, "1", True, 1.5]:
                with self.subTest(field=field, value=value):
                    board = copy.deepcopy(BOARD_34)
                    board["totals"][field] = value
                    row = producer.csoai_gaps(board)[index]
                    self.assertIsNone(row["value"])
                    self.assertEqual(row["state"], "UNCHECKABLE")
        for field in ["run_artifacts", "ed25519_signed", "content_addressed_unsigned"]:
            for value in [None, -1, "1", True, 1.5]:
                with self.subTest(attestation_field=field, value=value):
                    board = copy.deepcopy(BOARD_34)
                    board["totals"]["financial_run_attestations"][field] = value
                    row = producer.csoai_gaps(board)[2]
                    self.assertIsNone(row["value"])
                    self.assertEqual(row["state"], "UNCHECKABLE")
        for field, index in [("uncarded_leaders_dropped", 3), ("own_leaders_excluded", 4)]:
            board = copy.deepcopy(BOARD_34)
            del board["totals"][field]
            self.assertIsNone(producer.csoai_gaps(board)[index]["value"])

    def test_inconsistent_counter_partitions_and_attribution_lists_are_uncheckable(self):
        updates = [
            (1, {"separated_leads": 1}),
            (1, {"comparison_axes": True}),
            (1, {"comparison_axes": 35}),
            (2, {"financial_run_attestations": {"run_artifacts": 4, "ed25519_signed": 4, "content_addressed_unsigned": 1}}),
            (5, {"measured_axes": 35}),
        ]
        for index, update in updates:
            with self.subTest(update=update):
                board = copy.deepcopy(BOARD_34)
                board["totals"].update(update)
                row = producer.csoai_gaps(board)[index]
                self.assertIsNone(row["value"])
                self.assertEqual(row["state"], "UNCHECKABLE")
        for field, index in [("uncarded_leaders_dropped_axes", 3), ("own_leaders_excluded_axes", 4)]:
            for value in [None, "safety", ["safety", "safety"], [{"axis": "safety"}], []]:
                with self.subTest(field=field, value=value):
                    board = copy.deepcopy(BOARD_34)
                    board["totals"][field] = value
                    row = producer.csoai_gaps(board)[index]
                    self.assertIsNone(row["value"])
                    self.assertIsNone(row["axes"])
                    self.assertEqual(row["state"], "UNCHECKABLE")
            board = copy.deepcopy(BOARD_34)
            del board["totals"][field]
            self.assertEqual(producer.csoai_gaps(board)[index]["state"], "UNCHECKABLE")

    def test_malformed_board_and_nested_shapes_do_not_throw_or_create_zeroes(self):
        for malformed in [None, [], "counter", 1, True]:
            with self.subTest(shape=malformed):
                row = producer.csoai_gaps(malformed)[0]
                self.assertIsNone(row["value"])
                self.assertEqual(row["state"], "UNCHECKABLE")
                board = copy.deepcopy(BOARD_34)
                board["totals"] = malformed
                rows = producer.csoai_gaps(board)
                self.assertEqual(len(rows), 6)
                self.assertTrue(all(row["value"] is None and row["state"] == "UNCHECKABLE" for row in rows))
                for field, index in [("by_family", 0), ("financial_run_attestations", 2)]:
                    board = copy.deepcopy(BOARD_34)
                    board["totals"][field] = malformed
                    row = producer.csoai_gaps(board)[index]
                    self.assertIsNone(row["value"])
                    self.assertEqual(row["state"], "UNCHECKABLE")
                board = copy.deepcopy(BOARD_34)
                board["totals"]["by_family"]["subject"] = malformed
                row = producer.csoai_gaps(board)[0]
                self.assertIsNone(row["value"])
                self.assertEqual(row["state"], "UNCHECKABLE")


if __name__ == "__main__":
    unittest.main()
