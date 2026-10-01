import unittest
from pathlib import Path

OTS_MAGIC = bytes.fromhex("004f70656e54696d657374616d7073000050726f6f6600bf89e2e884e89294")

class MaintenanceProofBytesTests(unittest.TestCase):
    def test_published_maintenance_ots_sidecars_are_binary_timestamps(self):
        repo = Path(__file__).resolve().parents[2]
        names = (
            "claimreg-ondo-chainlink-maintenance-20260928T023900Z.json.ots",
            "claimreg-ondo-chainlink-maintenance-20260928T023900Z.signed.json.ots",
        )
        for name in names:
            p = repo / "public" / "claims" / name
            body = p.read_bytes()
            self.assertGreater(len(body), len(OTS_MAGIC), name)
            self.assertTrue(body.startswith(OTS_MAGIC), f"{name} is not an OpenTimestamps detached proof")

if __name__ == "__main__":
    unittest.main()
