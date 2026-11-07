import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from cisco_catalog_intake import normalize
from fetch_cisco_catalog import SameHostRedirect
from sync_cisco_catalog import sync
import tempfile
from datetime import datetime, timezone
import hashlib


class ARDIntakeTests(unittest.TestCase):
    def setUp(self):
        self.manifest = {
            "entries": [
                {
                    "identifier": "urn:air:example:agent:test",
                    "displayName": "Example agent",
                    "type": "application/a2a-agent-card+json",
                    "url": "https://example.test/.well-known/agent-card.json",
                    "representativeQueries": ["test discovery"],
                    "trustManifest": {"identity": "example.test"},
                },
                {"identifier": "bad", "displayName": "both refs", "type": "x",
                 "url": "https://example.test/card", "data": {"card": True}},
            ]
        }
        self.raw = json.dumps(self.manifest).encode()

    def test_valid_record_is_quarantined_not_measured_or_called(self):
        result = normalize(self.raw, "https://ai-catalog.outshift.io/.well-known/ard.json", "2026-09-28T00:00:00Z")
        self.assertEqual(result["reported_entries"], 2)
        self.assertEqual(result["candidate_count"], 1)
        item = result["candidates"][0]
        self.assertEqual(item["intake"]["state"], "QUARANTINED_DISCOVERY_ONLY")
        self.assertFalse(item["intake"]["endpoint_contacted"])
        self.assertFalse(item["intake"]["signature_verified"])
        self.assertFalse(item["intake"]["gspc_measurement"])
        self.assertEqual(item["directory_claims"]["trust_manifest_state"], "PRESENT_UNVERIFIED")

    def test_bad_value_or_reference_entry_is_rejected(self):
        result = normalize(self.raw, "https://ai-catalog.outshift.io/.well-known/ard.json")
        self.assertEqual(result["rejected_count"], 1)
        self.assertIn("must_have_exactly_one_of_url_or_data", result["rejected"][0]["reason"])

    def test_duplicate_identifier_is_rejected(self):
        obj = json.loads(self.raw)
        obj["entries"].append(obj["entries"][0])
        result = normalize(json.dumps(obj).encode(), "https://ai-catalog.outshift.io/.well-known/ard.json")
        self.assertEqual(result["candidate_count"], 1)
        self.assertIn("duplicate_identifier", result["rejected"][1]["reason"])

    def test_invalid_manifest_shape_fails_closed(self):
        with self.assertRaises(ValueError):
            normalize(b'{"items":[]}', "https://ai-catalog.outshift.io/.well-known/ard.json")

    def test_oversized_manifest_fails_closed(self):
        with self.assertRaises(ValueError):
            normalize(b" " * (32 * 1024 * 1024 + 1), "https://ai-catalog.outshift.io/.well-known/ard.json")

    def test_fetcher_rejects_off_host_redirect(self):
        handler = SameHostRedirect()
        with self.assertRaises(ValueError):
            handler.redirect_request(None, None, 302, "Found", {}, "https://attacker.test/manifest.json")

    def test_full_snapshot_pipeline_emits_quarantined_receipt_and_source_event(self):
        raw = json.dumps({"entries": [{"identifier": "urn:air:example:agent:test",
            "displayName": "Example", "type": "application/a2a-agent-card+json",
            "url": "https://example.test/card"}]}).encode()
        now = datetime.now(timezone.utc).isoformat()
        receipt = {"schema": "csoai.ard-fetch-receipt/0.1",
                   "requested_uri": "https://ai-catalog.outshift.io/.well-known/ard.json",
                   "final_uri": "https://ai-catalog.outshift.io/.well-known/ard.json",
                   "retrieved_at": now, "http_status": 200, "bytes": len(raw),
                   "sha256": hashlib.sha256(raw).hexdigest()}
        def fake_fetch():
            return raw, receipt
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp) / "run"
            result = sync(out, fetcher=fake_fetch)
            self.assertEqual(result["reported_entries"], 1)
            self.assertFalse(result["gspc_measurement"])
            self.assertEqual(result["admission"], "NOT_ATTEMPTED")
            candidate = json.loads((out / "candidates.jsonl").read_text().splitlines()[0])
            event = json.loads((out / "source-change-event.json").read_text())
            self.assertEqual(candidate["intake"]["state"], "QUARANTINED_DISCOVERY_ONLY")
            self.assertEqual(event["type"], "ai.csoai.gspc.SOURCE_CHANGED")
            with self.assertRaises(FileExistsError):
                sync(out, fetcher=fake_fetch)


if __name__ == "__main__":
    unittest.main()
