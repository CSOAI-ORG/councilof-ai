import hashlib
import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from land_mill_cards import bind_run_provenance, canonical_body_bytes, land


class RunProvenanceTest(unittest.TestCase):
    def test_landing_binds_run_before_content_addressing(self):
        body = {
            "kind": "gspc.measurement-card",
            "axis": "machinery-conformity",
            "model": "example/model",
            "n": 30,
            "status": "UNMEASURED",
        }
        wrap = {"body": body, "id": hashlib.sha256(canonical_body_bytes(body)).hexdigest(), "signature": None}
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            staged, inbox, signed = root / "staged", root / "inbox", root / "signed"
            staged.mkdir()
            (staged / "unsigned-old.json").write_text(json.dumps(wrap))
            report = land(staged, inbox, signed, "12345")
            self.assertEqual(len(report["landed"]), 1)
            landed = json.loads(next(inbox.glob("unsigned-*.json")).read_text())
            self.assertEqual(landed["body"]["run_id"], "gha-12345")
            self.assertEqual(landed["id"], hashlib.sha256(canonical_body_bytes(landed["body"])).hexdigest())

    def test_conflicting_run_is_rejected(self):
        with self.assertRaises(ValueError):
            bind_run_provenance({"body": {"run_id": "gha-1"}}, "2")


if __name__ == "__main__":
    unittest.main()
