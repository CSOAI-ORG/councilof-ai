import json
import tempfile
import unittest
from pathlib import Path

import stablecoin_failure_diagnostics as diag
from test_stablecoin_promotion_queue import REPO, controlled_inputs
import build_stablecoin_promotion_queue as queue


class StablecoinFailureDiagnosticsTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.inputs = controlled_inputs()
        for rel, payload in self.inputs.items():
            self.write(rel, payload)
        # Preserve the frozen index bytes, not merely a reserialized equivalent.
        (self.root / queue.INDEX_REL).write_bytes((REPO / queue.INDEX_REL).read_bytes())
        self.write(queue.OUTPUT_REL, queue.build(self.root))

    def write(self, rel, payload):
        path = self.root / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(payload))
        return path

    def test_synthetic_probe_loss_retains_exact_changed_id_and_input_hashes(self):
        before = diag.snapshot(self.root, "a" * 40)
        deep = self.inputs[queue.DEEP_REL]
        next(r for r in deep["rows"] if r["id"] == "286")["measurement_state"] = "UNMEASURED"
        self.write(queue.DEEP_REL, deep)
        self.write(queue.OUTPUT_REL, queue.build(self.root))
        after = diag.snapshot(self.root, "a" * 40)
        report = diag.failure_report(after, before)
        self.assertEqual("PINNED_425", after["index_state"])
        self.assertEqual(425, len(after["rows"]))
        self.assertEqual(["286"], report["changed_ids"])
        row = next(r for r in after["rows"] if r["id"] == "286")
        self.assertEqual("UNMEASURED", row["deep_state"])
        self.assertFalse(row["queue_replay_ready"])
        self.assertNotEqual(before["inputs"][2]["sha256"], after["inputs"][2]["sha256"])

    def test_raw_provider_content_urls_and_unknown_fields_never_escape(self):
        secret = "PRIVATE_SENTINEL_NOT_FOR_DIAGNOSTICS"
        deep = self.inputs[queue.DEEP_REL]
        deep["rows"][0].update(findings=[secret], excerpt=secret,
                               attestation_page="https://example.invalid/?token=" + secret)
        self.write(queue.DEEP_REL, deep)
        key = deep["rows"][0]["id"]
        self.write(queue.DEEP_REL.parent / "mirrors" / (key + ".meta.json"),
                   {"http": 503, "sha256": "b" * 64, "source_url": secret, "error": secret})
        output = diag.snapshot(self.root, secret)
        self.assertNotIn(secret, json.dumps(output))
        self.assertIsNone(output["source_revision"])
        row = next(r for r in output["rows"] if r["id"] == key)
        self.assertEqual(503, row["mirror_http"])
        self.assertEqual("b" * 64, row["mirror_sha256"])

    def test_invalid_status_digest_state_and_baseline_fields_are_filtered(self):
        secret = "PRIVATE_SENTINEL"
        snapshot = diag.snapshot(self.root)
        snapshot["extra"] = secret
        snapshot["rows"][0].update(mirror_http=True, mirror_sha256=secret,
                                    deep_state=secret, queue_action=secret, queue_measured=secret)
        report = diag.failure_report(diag.snapshot(self.root), snapshot)
        self.assertNotIn(secret, json.dumps(report))
        row = report["before"]["rows"][0]
        self.assertIsNone(row["mirror_http"])
        self.assertIsNone(row["mirror_sha256"])
        self.assertIsNone(row["queue_measured"])
        self.assertEqual("UNKNOWN", row["deep_state"])
        self.assertEqual("UNKNOWN", row["queue_action"])

    def test_missing_or_malformed_inputs_are_explicit_and_not_successful_evidence(self):
        (self.root / queue.READINESS_REL).unlink()
        (self.root / queue.DEEP_REL).write_text("{INVALID PRIVATE_SENTINEL")
        snapshot = diag.snapshot(self.root)
        self.assertEqual("MISSING", snapshot["inputs"][1]["state"])
        self.assertEqual("INVALID_JSON", snapshot["inputs"][2]["state"])
        self.assertNotIn("PRIVATE_SENTINEL", json.dumps(snapshot))
        self.assertTrue(all(r["measurement_state"] == "UNKNOWN" for r in snapshot["rows"]))

    def test_oversize_and_symlink_inputs_are_not_read_into_diagnostics(self):
        path = self.root / "oversize.json"
        path.write_text("x" * 17)
        data, receipt, raw = diag.read_json(path, 16)
        self.assertEqual("OVERSIZE", receipt["state"])
        self.assertIsNone(raw)
        target = self.root / queue.DEEP_REL
        target.unlink()
        target.symlink_to(path)
        self.assertEqual("SYMLINK", diag.snapshot(self.root)["inputs"][2]["state"])

    def test_unverified_index_never_supplies_diagnostic_identities(self):
        self.write(queue.INDEX_REL, {"assets": [{"id": "274", "symbol": "FORGED"}]})
        snapshot = diag.snapshot(self.root)
        self.assertEqual("UNVERIFIED", snapshot["index_state"])
        self.assertEqual([], snapshot["rows"])

    def test_missing_baseline_is_unknown_not_an_empty_successful_run(self):
        report = diag.failure_report(diag.snapshot(self.root), {})
        self.assertEqual("UNAVAILABLE", report["baseline_state"])
        self.assertIsNone(report["before"])
        self.assertEqual([], report["changed_ids"])
        self.assertLess(len(json.dumps(report).encode()), diag.MAX_REPORT)

    def test_projection_limits_reject_forged_or_oversized_baseline(self):
        baseline = diag.snapshot(self.root)
        baseline["rows"].append(baseline["rows"][0])
        self.assertIsNone(diag.clean_snapshot(baseline))
        baseline = diag.snapshot(self.root)
        baseline["inputs"][0]["path"] = "/private/credential"
        self.assertIsNone(diag.clean_snapshot(baseline))


if __name__ == "__main__":
    unittest.main()
