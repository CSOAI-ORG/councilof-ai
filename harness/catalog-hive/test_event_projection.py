import json
import sys
import tempfile
import unittest
from pathlib import Path

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE.parents[1] / "condor"))
from event_projection import build_event, atomic_create
from condor.gspc_event_contract import GSPCCloudEvent


class CatalogEventProjectionTests(unittest.TestCase):
    def setUp(self):
        self.fetch = {
            "schema": "csoai.ard-fetch-receipt/0.1",
            "requested_uri": "https://ai-catalog.outshift.io/.well-known/ard.json",
            "final_uri": "https://ai-catalog.outshift.io/.well-known/ard.json",
            "retrieved_at": "2026-09-28T10:00:00Z",
            "http_status": 200,
            "bytes": 123,
            "sha256": "a" * 64,
        }
        self.intake = {
            "schema": "csoai.ard-intake-receipt/0.1",
            "source_uri": self.fetch["final_uri"],
            "retrieved_at": self.fetch["retrieved_at"],
            "manifest_sha256": self.fetch["sha256"],
            "manifest_bytes": self.fetch["bytes"],
            "reported_entries": 3,
            "candidate_count": 2,
            "rejected_count": 1,
        }

    def test_emits_only_descriptive_source_changed_event(self):
        event = build_event(self.fetch, self.intake)
        validated = GSPCCloudEvent.model_validate(event)
        self.assertEqual(validated.type, "ai.csoai.gspc.SOURCE_CHANGED")
        self.assertEqual(event["authority"], "descriptive")
        self.assertEqual(event["execution"], "disabled")
        self.assertEqual(event["data"]["discovery_state"], "QUARANTINED_DISCOVERY_ONLY")
        self.assertFalse(event["data"]["gspc_measurement"])
        self.assertEqual(event["data"]["layer0_admission"], "NOT_ATTEMPTED")
        self.assertEqual(event["data"]["signature"], "NOT_CREATED")
        self.assertEqual(event["data"]["anchor"], "NOT_CREATED")

    def test_digest_mismatch_fails_closed(self):
        self.intake["manifest_sha256"] = "b" * 64
        with self.assertRaisesRegex(ValueError, "digest does not match"):
            build_event(self.fetch, self.intake)

    def test_non_200_fails_closed(self):
        self.fetch["http_status"] = 503
        with self.assertRaisesRegex(ValueError, "HTTP 200"):
            build_event(self.fetch, self.intake)

    def test_off_host_source_fails_closed(self):
        self.fetch["final_uri"] = "https://attacker.example/ard.json"
        with self.assertRaisesRegex(ValueError, "pinned Cisco"):
            build_event(self.fetch, self.intake)

    def test_output_is_create_only(self):
        with tempfile.TemporaryDirectory() as tmp:
            target = Path(tmp) / "event.json"
            atomic_create(target, b'{"first":true}')
            with self.assertRaises(FileExistsError):
                atomic_create(target, b'{"second":true}')
            self.assertEqual(json.loads(target.read_bytes()), {"first": True})


if __name__ == "__main__":
    unittest.main()
