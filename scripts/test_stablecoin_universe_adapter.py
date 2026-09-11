import hashlib
import json
import tempfile
import unittest
from pathlib import Path

from adapters import stablecoin_universe


class StablecoinUniverseAdapterTest(unittest.TestCase):
    def test_commits_to_complete_index_without_overclaiming(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            path = root / stablecoin_universe.REL
            path.parent.mkdir(parents=True)
            index = {
                "observed_at": "2026-09-11T08:19:34Z",
                "source": "https://stablecoins.llama.fi/stablecoins?includePrices=true",
                "source_sha256": "ab" * 32,
                "asset_count": 2,
                "chain_count": 3,
                "deployment_count": 4,
                "assets": [{"id": "1"}, {"id": "2"}],
            }
            path.write_text(json.dumps(index, sort_keys=True) + "\n")
            out = stablecoin_universe.collect(root)
            self.assertEqual(len(out["leaves"]), 1)
            leaf = out["leaves"][0]
            self.assertEqual(leaf["payload"]["state"], "INDEXED")
            self.assertTrue(leaf["payload"]["not_all_deep_measured"])
            self.assertEqual(leaf["payload"]["index_sha256"], hashlib.sha256(path.read_bytes()).hexdigest())
            self.assertIn("not independently deep-measured", leaf["unmeasured"][0])

    def test_absent_is_not_a_failure_or_fake_leaf(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = stablecoin_universe.collect(Path(tmp))
            self.assertEqual(out["leaves"], [])
            self.assertEqual(out["sidecar"]["status"], "ABSENT")


if __name__ == "__main__":
    unittest.main()
