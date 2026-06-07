"""Overnight cycle-3 tests: the Free→Local seam (export → signed attestation → tamper-evident import)."""
import os
import sys
import json
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from meok_one import portability, import_bundle


class TestPortability(unittest.TestCase):
    def test_export_has_signed_attestation(self):
        b = portability.export_bundle("web")
        self.assertEqual(b.get("format"), portability.BUNDLE_FORMAT)
        self.assertIn("digest", b.get("attestation", {}))

    def test_verify_valid(self):
        self.assertTrue(portability.verify_bundle(portability.export_bundle("web"))["valid"])

    def test_tamper_detected(self):
        b = portability.export_bundle("web")
        b["characters"] = [{"id": "evil"}]
        self.assertFalse(portability.verify_bundle(b)["valid"])

    def test_import_rejects_tampered(self):
        b = portability.export_bundle("web")
        b["characters"] = [{"id": "evil"}]      # tamper after signing
        fp = os.path.join(tempfile.gettempdir(), "meok-tampered.json")
        with open(fp, "w") as f:
            f.write(json.dumps(b))
        out = import_bundle.import_bundle(fp, target_user="u_should_not_write")
        self.assertFalse(out["ok"])             # rejected on bad attestation → no write, no pollution


if __name__ == "__main__":
    unittest.main(verbosity=2)
