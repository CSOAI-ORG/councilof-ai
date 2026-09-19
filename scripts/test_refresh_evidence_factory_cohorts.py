"""Evidence boundary checks using temporary output and mocked public responses."""
import importlib.util
import io
from contextlib import redirect_stdout
import json
from pathlib import Path
import subprocess
import tempfile
import time
import unittest
from unittest.mock import patch
import urllib.error

SPEC = importlib.util.spec_from_file_location("cohorts", Path(__file__).with_name("refresh_evidence_factory_cohorts.py"))
cohorts = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(cohorts)


class CohortBoundaryTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        cohorts.ROOT = self.root / "output"
        cohorts.SOURCE = self.root / "source"
        cohorts.REVISION = "a" * 40
        cohorts.START = time.monotonic()
        cohorts.DEADLINE = 600
        cohorts.MAX_BYTES = 1024

    def tearDown(self):
        self.tmp.cleanup()

    def test_wrong_or_unvalidated_ledger_cannot_be_observed(self):
        pin = {"hash": "b" * 64, "index": 123}
        valid = {"ledger_hash": pin["hash"], "ledger_index": 123, "validated": True}
        self.assertTrue(cohorts.valid_ledger(valid, pin))
        for replacement in ({"validated": False}, {"validated": None},
                            {"ledger_index": 124}, {"ledger_hash": "c" * 64}):
            self.assertFalse(cohorts.valid_ledger({**valid, **replacement}, pin))
        self.assertFalse(cohorts.valid_ledger(None, pin))

    def test_existing_output_is_never_overwritten(self):
        cohorts.ROOT.mkdir()
        sentinel = cohorts.ROOT / "receipt.json"
        sentinel.write_text("immutable")
        with self.assertRaisesRegex(RuntimeError, "overwrite"):
            cohorts.setup()
        self.assertEqual(sentinel.read_text(), "immutable")

    def test_changed_input_is_rejected_before_output_or_network(self):
        cohorts.SOURCE.mkdir()
        (cohorts.SOURCE / "input.json").write_bytes(b"changed")
        result = subprocess.CompletedProcess([], 0, stdout=b"pinned")
        with patch.object(cohorts, "INPUTS", ["input.json"]), \
                patch.object(cohorts.subprocess, "run", return_value=result), \
                patch.object(cohorts.urllib.request, "urlopen") as network:
            with self.assertRaisesRegex(ValueError, "input differs"):
                cohorts.setup()
        self.assertFalse(cohorts.ROOT.exists())
        network.assert_not_called()

    def test_http_error_body_is_archived_without_becoming_success(self):
        error = urllib.error.HTTPError("https://example.test/source", 403, "Forbidden", {}, io.BytesIO(b"denied"))
        with patch.object(cohorts.urllib.request, "urlopen", side_effect=error):
            meta, raw = cohorts.fetch("test", "error", "https://example.test/source")
        self.assertEqual(meta["status"], "UNCHECKABLE")
        self.assertEqual(meta["http"], 403)
        self.assertEqual(raw, b"denied")
        self.assertEqual(meta["body_sha256"], cohorts.sha(raw))
        self.assertNotIn("headers", meta)

    def test_overlarge_body_is_prefix_and_not_fetched_success(self):
        class Response(io.BytesIO):
            status = 200
            headers = {"Content-Type": "text/html"}
            def geturl(self):
                return "https://example.test/source"
        with patch.object(cohorts.urllib.request, "urlopen", return_value=Response(b"x" * 1025)):
            meta, raw = cohorts.fetch("test", "large", "https://example.test/source")
        self.assertEqual(len(raw), 1024)
        self.assertEqual(meta["status"], "UNCHECKABLE")
        self.assertEqual(meta["error"], "BODY_LIMIT_EXCEEDED_ARCHIVE_IS_PREFIX")

    def test_deadline_retains_disposition_without_network(self):
        cohorts.START = time.monotonic() - 601
        with patch.object(cohorts.urllib.request, "urlopen") as network:
            meta, raw = cohorts.fetch("test", "expired", "https://example.test/source")
        network.assert_not_called()
        self.assertIsNone(raw)
        self.assertEqual(meta["status"], "UNCHECKABLE")
        self.assertEqual(meta["error"], "LANE_DEADLINE_EXHAUSTED")

    def test_unresolved_identity_stays_unmeasured_and_has_no_account_call(self):
        p = cohorts.ROOT / "inputs/public/interop/xrpl-16.json"
        p.parent.mkdir(parents=True)
        p.write_text(json.dumps({"as_of": "2026-09-01", "rows": [{"name": "Unknown", "r_address": None}]}))
        with patch.object(cohorts, "rpc", return_value=(None, None, [{"reason": "unavailable"}])) as rpc:
            cohorts.xrpl()
        self.assertEqual(rpc.call_count, 1)
        result = json.loads((cohorts.ROOT / "xrpl/observations.json").read_text())["rows"][0]
        self.assertEqual(result["account_state"], "UNMEASURED")
        self.assertIsNone(result["supply"])
        self.assertEqual(result["reason"], "FROZEN_COHORT_HAS_NO_ISSUER_ADDRESS")

    def test_failed_lane_returns_nonzero_and_preserves_failure_receipt(self):
        result = subprocess.CompletedProcess([], 0, stdout="a" * 40 + "\n")
        with patch.object(cohorts.subprocess, "run", return_value=result), \
                patch.object(cohorts, "setup", side_effect=lambda: cohorts.ROOT.mkdir()), \
                patch.object(cohorts, "stablecoins", side_effect=ValueError("source schema changed")), \
                patch.object(cohorts, "xrpl", return_value={"rows": 0}), \
                patch.object(cohorts, "swift", return_value={"rows": 0}), \
                patch.object(cohorts, "write_dispositions"), redirect_stdout(io.StringIO()):
            code = cohorts.main(["--source-repo", str(cohorts.SOURCE), "--source-revision", "a" * 40,
                                 "--output-dir", str(cohorts.ROOT)])
        self.assertEqual(code, 1)
        receipt = json.loads((cohorts.ROOT / "receipt.json").read_text())
        self.assertEqual(receipt["lanes"]["stablecoins"]["status"], "FAILED")
        self.assertIn("source schema changed", receipt["lanes"]["stablecoins"]["error"])

    def test_dispositions_retain_failed_lanes_and_do_not_promote_historical_claims(self):
        docs = {
            "stablecoin-universe-2026-09/index.json": {"observed_at": "2026-09-01", "assets": [{"id": "1", "priority_score": 1}]},
            "stablecoin-deep-2026-09/sources.json": {"sources": [{"id": "1", "attestation_page": "https://example.test"}]},
            "xrpl-16.json": {"as_of": "2026-09-01", "rows": [{"name": "Unresolved Asset", "r_address": None, "control_facts": "MEASURED"}]},
            "swift-census.json": {"as_of": "2026-09-01", "sources": {"press": {"url": "https://example.test"}},
                "rows": [{"id": "bank-a", "name": "Bank A", "source": ["press"], "status": "LIVE"}]},
        }
        for relative, document in docs.items():
            p = cohorts.ROOT / "inputs/public/interop" / relative
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_text(json.dumps(document))
        cohorts.write_dispositions({"stablecoins": {"status": "FAILED"}, "xrpl": {"status": "FAILED"}, "swift": {"status": "FAILED"}})
        rows = json.loads((cohorts.ROOT / "run-dispositions.json").read_text())["rows"]
        self.assertEqual(len(rows), 3)
        self.assertEqual([r["execution_state"] for r in rows], ["UNCHECKABLE", "UNMEASURED", "UNMEASURED"])
        self.assertTrue(all(r["registry_admission"] is False for r in rows))
        self.assertTrue(all(r["evidence_path"] is None for r in rows))
        self.assertIsNone(rows[1]["observations"]["asset_supply"])
        self.assertEqual(rows[2]["observations"]["source_content_claim_review"], "NOT_PERFORMED")


if __name__ == "__main__":
    unittest.main()
