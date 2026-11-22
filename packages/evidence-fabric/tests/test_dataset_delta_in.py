import json
import sys
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(HERE / "ingest"))
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE.parents[1] / "scripts" / "security"))

import event as E
import dataset_delta_in as D


def fixture(state="REVIEW_REQUIRED"):
    return {"schema": "csoai.dataset-delta/0.1", "kind": "UNSIGNED_REVISION_COMPARISON", "state": state,
            "dataset": "csoai/synthetic", "baseline_revision": "a"*40, "candidate_revision": "b"*40,
            "baseline_manifest_sha256": "1"*64, "baseline_file_sha256": "2"*64, "candidate_file_sha256": "3"*64,
            "counts": {"baseline": 150, "candidate": 150, "changed": 1, "added": 0, "removed": 0},
            "baseline_authenticated": False, "human_source_approval": "NOT_ESTABLISHED",
            "model_behaviour": "NOT_TESTED", "agent_effect": "NOT_TESTED", "gspc_admission": "NOT_REQUESTED"}


class EvidenceAdapterTests(unittest.TestCase):
    def test_valid_comparison_is_partial_unsigned_event(self):
        e = D.ingest(json.dumps(fixture()).encode(), read_at="2026-11-22T03:00:00Z")
        self.assertEqual(e["state"], "PARTIAL")
        self.assertIsNone(e["value"])
        self.assertEqual(e["negative_control"]["got"], "NOT_RUN")
        self.assertIsNone(e["signature"])
        self.assertEqual(E.validate(e), [])
        self.assertEqual(e["event_id"], E.compute_event_id(e))

    def test_false_unmodified_claim_refused(self):
        data = fixture("UNCHANGED")
        data["counts"]["changed"] = 0
        with self.assertRaisesRegex(D.InvalidInput, "UNCHANGED_WITH_DIFFERENT_BYTES"):
            D.ingest(json.dumps(data).encode(), read_at="2026-11-22T03:00:00Z")

    def test_declared_authority_promoted_refused(self):
        data = fixture()
        data["baseline_authenticated"] = True
        with self.assertRaisesRegex(D.InvalidInput, "AUTHORITY_PROMOTION"):
            D.ingest(json.dumps(data).encode(), read_at="2026-11-22T03:00:00Z")

    def test_fake_measurement_refused(self):
        data = fixture()
        data["model_behaviour"] = "MEASURED"
        with self.assertRaisesRegex(D.InvalidInput, "MEASUREMENT_PROMOTION"):
            D.ingest(json.dumps(data).encode(), read_at="2026-11-22T03:00:00Z")

    def test_denominator_invalid_refused(self):
        data = fixture()
        data["counts"]["candidate"] = 151
        with self.assertRaisesRegex(D.InvalidInput, "INCONSISTENT_DENOMINATOR"):
            D.ingest(json.dumps(data).encode(), read_at="2026-11-22T03:00:00Z")

    def test_unknown_kind_refused(self):
        data = fixture()
        data["kind"] = "SIGNED_GSPC_MEASUREMENT"
        with self.assertRaisesRegex(D.InvalidInput, "SCHEMA"):
            D.ingest(json.dumps(data).encode(), read_at="2026-11-22T03:00:00Z")

    def test_unsigned_state_with_matching_raw_bytes_refused(self):
        data = fixture("RAW_ONLY_CHANGE")
        data["counts"]["changed"] = 0
        data["candidate_file_sha256"] = data["baseline_file_sha256"]
        with self.assertRaisesRegex(D.InvalidInput, "RAW_ONLY_WITH_IDENTICAL_BYTES"):
            D.ingest(json.dumps(data).encode(), read_at="2026-11-22T03:00:00Z")

    def test_changed_record_cannot_claim_identical_file_bytes(self):
        data = fixture()
        data["candidate_file_sha256"] = data["baseline_file_sha256"]
        with self.assertRaisesRegex(D.InvalidInput, "RECORD_DELTA_WITH_IDENTICAL_FILE_HASH"):
            D.ingest(json.dumps(data).encode(), read_at="2026-11-22T03:00:00Z")

    def test_bad_read_at_refused(self):
        with self.assertRaisesRegex(D.InvalidInput, "BAD_READ_AT"):
            D.ingest(json.dumps(fixture()).encode(), read_at="yesterday")

    def test_bad_json_refused(self):
        with self.assertRaisesRegex(D.InvalidInput, "BAD_JSON_OR_CLOCK_INPUT"):
            D.ingest(b"{", read_at="2026-11-22T03:00:00Z")


    def test_real_guard_output_is_renderable_partial_event(self):
        import dataset_delta_guard as G
        baseline_rows = [{"id": f"case-{i:04d}", "text": f"control {i}", "policy": "DENY"} for i in range(150)]
        baseline_bytes = b"\n".join(G.canonical(row) for row in baseline_rows) + b"\n"
        doc = G.parse_baseline(G.canonical(G.make_baseline(
            baseline_bytes, dataset="csoai/synthetic", revision="a" * 40)))
        baseline_rows[42]["policy"] = "ALLOW"
        candidate_bytes = b"\n".join(G.canonical(row) for row in baseline_rows) + b"\n"
        comparison = G.compare(doc, candidate_bytes, current_revision="b" * 40)
        self.assertEqual(comparison["counts"]["changed"], 1)
        event = D.ingest(G.canonical(comparison), read_at="2026-11-22T03:00:00Z")
        self.assertEqual(event["state"], "PARTIAL")
        self.assertEqual(event["observed"]["comparison_state"], "REVIEW_REQUIRED")
        self.assertEqual(event["observed"]["counts"]["changed"], 1)
        self.assertEqual(event["observed"]["producer_verified"], False)
        self.assertEqual(E.validate(event), [])
        self.assertIsNone(event["value"])


if __name__ == "__main__":
    unittest.main()
