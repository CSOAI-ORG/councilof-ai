import importlib.util
import pathlib
import unittest

PATH = pathlib.Path(__file__).with_name("claim_maintenance_public_readback.py")
spec = importlib.util.spec_from_file_location("claim_maintenance_public_readback", PATH)
mod = importlib.util.module_from_spec(spec)
assert spec.loader
spec.loader.exec_module(mod)

class ReactionCommitmentTests(unittest.TestCase):
    def test_claim_event_source(self):
        h = "a" * 64
        self.assertEqual(
            mod.reaction_commitment({"source": {"feed_bytes_sha256": h}}),
            ("claim_events", "/api/claims/events", h),
        )

    def test_snapshot_source(self):
        h = "b" * 64
        self.assertEqual(
            mod.reaction_commitment({"source_snapshot": {"path": "/spec/x.json", "sha256": h}}),
            ("snapshot", "/spec/x.json", h),
        )

    def test_missing_or_malformed_is_unknown(self):
        self.assertIsNone(mod.reaction_commitment({}))
        self.assertIsNone(mod.reaction_commitment({"source_snapshot": {"path": "https://example.com/x", "sha256": "x"}}))

if __name__ == "__main__":
    unittest.main()
