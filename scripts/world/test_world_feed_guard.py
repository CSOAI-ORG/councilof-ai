import hashlib
import json
from pathlib import Path
import tempfile
import unittest
from datetime import datetime, timedelta, timezone

from build_city_projection import build
from pull_verified_micro2_bundle import check_freshness, validate_bundle


class Micro2ImportTests(unittest.TestCase):
    def setUp(self):
        self.row = {
            "tick": 7, "time": 1790155504303, "city_time": 2,
            "city": "sov-town", "label": "DESIGN", "population": 0,
            "residential": 0, "commercial": 0, "industrial": 0,
            "powered": True, "certifications_active": 3,
        }
        delta = (json.dumps(self.row) + "\n").encode()
        manifest = {
            "delta_sha256": hashlib.sha256(delta).hexdigest(),
            "rows": 1, "latest": self.row, "city": "sov-town",
            "label": "DESIGN", "generated_at": "2026-09-23T09:25:30Z",
        }
        self.files = {
            "manifest.json": json.dumps(manifest).encode(),
            "delta.jsonl": delta,
            "latest.json": json.dumps(self.row).encode(),
        }

    def test_valid_bundle(self):
        receipt = validate_bundle(self.files)
        self.assertEqual(receipt["rows"], 1)
        self.assertEqual(receipt["source_delta_sha256"], hashlib.sha256(self.files["delta.jsonl"]).hexdigest())

    def test_rejects_manifest_from_another_cycle(self):
        manifest = json.loads(self.files["manifest.json"])
        manifest["delta_sha256"] = "0" * 64
        self.files["manifest.json"] = json.dumps(manifest).encode()
        with self.assertRaisesRegex(ValueError, "SHA-256"):
            validate_bundle(self.files)

    def test_rejects_latest_from_another_cycle(self):
        other = dict(self.row, time=self.row["time"] + 1000)
        self.files["latest.json"] = json.dumps(other).encode()
        with self.assertRaisesRegex(ValueError, "latest row differs"):
            validate_bundle(self.files)

    def test_rejects_stale_source(self):
        now = datetime(2026, 9, 23, 9, 30, tzinfo=timezone.utc)
        check_freshness({"source_generated_at": (now - timedelta(minutes=20)).isoformat()}, 30, now)
        with self.assertRaisesRegex(ValueError, "freshness"):
            check_freshness({"source_generated_at": (now - timedelta(minutes=31)).isoformat()}, 30, now)

    def test_public_projection_omits_certification_field(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for name, data in self.files.items():
                (root / name).write_bytes(data)
            public = build(root)
        self.assertEqual(public["schema"], "csoai.simulation-city-snapshot/1")
        self.assertEqual(public["source"]["rows_checked"], 1)
        self.assertNotIn("certifications_active", public["rows"][0])
        self.assertEqual(public["rows"][0]["tick"], 7)


if __name__ == "__main__":
    unittest.main()
