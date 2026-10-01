#!/usr/bin/env python3
import json, sys, unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(HERE))
import ras_xreserve_public_replay as x

CONFIG = json.loads((ROOT / "config/ras/xreserve-public-replay-v0.6.1.json").read_text())

class XReserveControls(unittest.TestCase):
    def test_config_is_read_only_and_authority_free(self):
        self.assertEqual(CONFIG["mode"], "READ_ONLY")
        self.assertEqual(CONFIG["expected_remote_domain"], 10003)
        self.assertEqual(CONFIG["expected_remote_chain"], "Stacks")
        self.assertTrue(all(v is False for v in CONFIG["authority"].values()))

    def test_domain_mapping_accepts_stacks_and_canton_separately(self):
        info = {"remoteDomains": [{"domain":10001,"chain":"Canton"},{"domain":10003,"chain":"Stacks"}]}
        m = x.validate_domain_map(info, 10003, "Stacks")
        self.assertEqual(m[10001], "Canton")
        self.assertEqual(m[10003], "Stacks")

    def test_domain_10003_cannot_be_relabelled_canton(self):
        info = {"remoteDomains": [{"domain":10001,"chain":"Canton"},{"domain":10003,"chain":"Canton"}]}
        with self.assertRaises(ValueError):
            x.validate_domain_map(info, 10003, "Stacks")

    def test_known_event_builds_240_byte_payload(self):
        event = {
            "amount_atomic":"5000000", "remote_domain":10003,
            "remote_token":"0x000000000616440caf0bbc800a33993ea85c2392aeb53696608b057573646378",
            "remote_recipient":"0x000000000000000000000016645b198e420798dcda00bc8e49711fed753c37ad",
            "local_token":"0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
            "local_depositor":"0xa1404d9e7646b0112c49ae0296d6347c956d0867",
            "max_fee_atomic":"0", "hook_data":"0x",
        }
        nonce="0x10a58118ad58610fef60b36a157691a70c42fd1fb00a037b6af95567cffd9861"
        payload=x.build_payload(event, nonce)
        self.assertEqual(len(payload), 240)
        self.assertEqual(payload[:4], bytes.fromhex("5a2e0acd"))
        self.assertEqual(int.from_bytes(payload[40:44],"big"), 10003)

if __name__ == "__main__":
    unittest.main(verbosity=2)
