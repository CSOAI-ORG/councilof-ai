#!/usr/bin/env python3
"""Offline tests: source status is NOT an incident or a geolocated event."""
from __future__ import annotations
import copy
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import build_graph as g


AT = "2026-11-24T01:30:00Z"


def fixture():
    run = "20261124T010000Z"
    snap = "2026-11-24T01:00:00Z"
    artifact = "/interop/watchdog-intake/" + run + ".json"
    statuses = ["REACHABLE", "REACHABLE", "UNCHECKABLE"]
    latest = {"schema": g.LATEST_SCHEMA, "run_id": run, "as_of": snap,
              "run_artifact": artifact, "sources_probed": 3, "reachable": 2,
              "unreachable": 0, "uncheckable": 1}
    index = {"schema": g.INDEX_SCHEMA, "run_id": run, "as_of": snap,
             "run_artifact": artifact,
             "totals": {"sources_probed": 3, "reachable": 2, "unreachable": 0, "uncheckable": 1},
             "signals": [
                 {"source_id": f"source-{i}", "state": s,
                  "body_sha256": ("a" * 64 if s == "REACHABLE" else None),
                  "name": "NO_REPORT_TEXT_INCLUDED"}
                 for i, s in enumerate(statuses)
             ]}
    return latest, index


def encoded(obj):
    return json.dumps(obj, sort_keys=True).encode()


class WatchdogCounterfactualTests(unittest.TestCase):
    def test_source_fresh_count_truth(self):
        l, i = fixture()
        x = g.validate_snapshot(l, i, AT)
        self.assertEqual(x["source_count"], 3)
        self.assertEqual(x["state"], "SOURCE_SNAPSHOT_WITHIN_POLICY")
        self.assertEqual(x["source_states"], {"REACHABLE": 2, "UNCHECKABLE": 1})
        self.assertTrue(all(z["incident_count"] is None for z in x["sources"]))

    def test_stale_not_promoted_to_fresh(self):
        l, i = fixture()
        x = g.validate_snapshot(l, i, "2026-11-27T01:30:00Z")
        self.assertEqual(x["state"], "SOURCE_SNAPSHOT_STALE")

    def test_mismatch_run_prevents_public_truth_claim(self):
        l, i = fixture()
        i["run_id"] = "20261123T010000Z"
        with self.assertRaisesRegex(g.Hold, "SOURCE_INDEX_RUN_MISMATCH"):
            g.validate_snapshot(l, i, AT)

    def test_mismatch_observation_time_prevents_join(self):
        l, i = fixture()
        i["as_of"] = "2026-11-24T01:01:00Z"
        with self.assertRaisesRegex(g.Hold, "SOURCE_INDEX_TIME_MISMATCH"):
            g.validate_snapshot(l, i, AT)

    def test_future_observation_refused(self):
        l, i = fixture()
        with self.assertRaisesRegex(g.Hold, "FUTURE_OR_UNKNOWN_OBSERVATION"):
            g.validate_snapshot(l, i, "2026-11-24T00:10:00Z")

    def test_duplicate_sources_refused(self):
        l, i = fixture()
        i["signals"][1]["source_id"] = i["signals"][0]["source_id"]
        with self.assertRaisesRegex(g.Hold, "INVALID_SOURCE_SIGNAL_ID_STATE"):
            g.validate_snapshot(l, i, AT)

    def test_bad_source_id_refused(self):
        l, i = fixture()
        i["signals"][0]["source_id"] = "../secrets"
        with self.assertRaises(g.Hold):
            g.validate_snapshot(l, i, AT)

    def test_reachable_source_without_body_hash_is_uncheckable(self):
        l, i = fixture()
        i["signals"][0]["body_sha256"] = None
        with self.assertRaisesRegex(g.Hold, "REACHABLE_SOURCE_UNPINNED"):
            g.validate_snapshot(l, i, AT)

    def test_source_total_mismatch_refused(self):
        l, i = fixture()
        l["sources_probed"] = 30
        with self.assertRaisesRegex(g.Hold, "SOURCE_COUNT_INCONSISTENCY"):
            g.validate_snapshot(l, i, AT)

    def test_run_artifact_mismatch_refused(self):
        l, i = fixture()
        l["run_artifact"] = "/interop/watchdog-intake/other.json"
        with self.assertRaisesRegex(g.Hold, "SOURCE_POINTER_MISMATCH"):
            g.validate_snapshot(l, i, AT)

    def test_wrong_schema_refused(self):
        l, i = fixture()
        i["schema"] = "pretend-event-data"
        with self.assertRaisesRegex(g.Hold, "INDEX_SCHEMA_UNCHECKABLE"):
            g.validate_snapshot(l, i, AT)

    def test_naive_or_impossible_utc_refused(self):
        for time in ("2026-11-24", "2026-11-24T01:30:00+00:00", "2026-02-30T00:00:00Z"):
            with self.subTest(time=time), self.assertRaises(g.Hold):
                g.utc(time)

    def test_invalid_age_setting_refused(self):
        l, i = fixture()
        for value in (False, 0, -1, float("nan"), 24*100):
            with self.subTest(value=value), self.assertRaises(g.Hold):
                g.validate_snapshot(l, i, AT, max_age_hours=value)

    def test_real_world_claims_must_stay_false_and_no_incident_ingest(self):
        l, i = fixture()
        report = g.render_graph(encoded(l), encoded(i), AT)
        self.assertEqual(report["schema"], g.SCHEMA)
        self.assertEqual(report["synthetic_hypotheses"], 10)
        self.assertFalse(report["independent_public_event_verification"])
        self.assertFalse(report["actual_human_authority_verified"])
        self.assertFalse(report["actual_recipient_effect_verified"])
        self.assertFalse(report["external_effects_performed"])
        self.assertFalse(report["incident_records_ingested"])
        self.assertFalse(report["production_board_modified"])
        self.assertIsNone(report["incident_count"])
        self.assertTrue(all(n.get("location") is None and n.get("geolocation") is None for n in report["nodes"]))

    def test_no_causal_connection_source_to_synthetic_path(self):
        l, i = fixture()
        x = g.render_graph(encoded(l), encoded(i), AT)
        forbidden = [e for e in x["edges"]
                     if e["from"].startswith("source:") and e["to"].startswith("hypothesis:")]
        self.assertFalse(forbidden)
        self.assertEqual(len(x["nodes"]), 16)
        self.assertEqual(len(x["edges"]), 23)

    def test_source_narrative_is_not_copied_to_graph(self):
        l, i = fixture()
        i["signals"][0]["name"] = "<script>private-report-text</script>"
        x = g.render_graph(encoded(l), encoded(i), AT)
        self.assertNotIn("private-report-text", json.dumps(x))
        self.assertNotIn("NO_REPORT_TEXT_INCLUDED", json.dumps(x))

    def test_twin_import_reuses_canonical_model(self):
        twin = g.load_twin()
        paths = g.hypothetical_paths(twin)
        self.assertEqual(len(paths), 10)
        kinds = {p["simulated_result_state"] for p in paths}
        self.assertIn("SIMULATED_CONTROL_BREACH", kinds)
        self.assertIn("SIMULATED_EFFECT_UNCHECKABLE", kinds)
        self.assertIn("SIMULATED_NO_EFFECT", kinds)
        self.assertIn("SIMULATED_PERMITTED_EFFECT_WITH_SYNTHETIC_RECEIPT", kinds)
        self.assertTrue(all(p["actual_human_authority_verified"] is False for p in paths))

    def test_missing_twin_is_not_green(self):
        with self.assertRaisesRegex(g.Hold, "CANONICAL_FAULT_TWIN_NOT_FOUND"):
            g.load_twin(Path("/definitely/not/a/file.py"))

    def test_json_corruption_is_not_an_empty_incident_set(self):
        l, i = fixture()
        with self.assertRaisesRegex(g.Hold, "SOURCE_NOT_JSON"):
            g.render_graph(b"{invalid", encoded(i), AT)

    def test_readback_makes_no_mutation_to_input(self):
        l, i = fixture()
        copy_l, copy_i = copy.deepcopy(l), copy.deepcopy(i)
        g.render_graph(encoded(l), encoded(i), AT)
        self.assertEqual(l, copy_l)
        self.assertEqual(i, copy_i)


if __name__ == "__main__":
    unittest.main(verbosity=2)
