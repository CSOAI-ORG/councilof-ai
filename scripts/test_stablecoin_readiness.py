from __future__ import annotations

import copy
import unittest
from pathlib import Path

from build_stablecoin_readiness import build, validate


class StablecoinReadinessTruthTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.document = build(Path(".").resolve())

    def test_authoritative_coverage(self) -> None:
        validate(self.document)
        self.assertEqual(425, self.document["coverage"]["indexed_assets"])
        self.assertEqual(1, self.document["coverage"]["deeply_measured_assets"])
        self.assertEqual(424, self.document["coverage"]["unmeasured_assets"])
        self.assertEqual(0, self.document["coverage"]["asset_measurements_bitcoin_anchored_via_current_root"])
        self.assertEqual(1, self.document["coverage"]["post_freeze_discovery_candidates"])
        self.assertEqual("USBDC", self.document["discovery_candidates"][0]["symbol"])
        self.assertEqual("UNMEASURED", self.document["discovery_candidates"][0]["measurement_state"])

    def test_indexed_asset_cannot_be_relabeled_measured(self) -> None:
        changed = copy.deepcopy(self.document)
        row = next(row for row in changed["assets"] if row["symbol"] != "RLUSD")
        row["measurement"]["state"] = "MEASURED"
        row["measurement"]["depth"] = "PARTIAL_ONE_CHAIN"
        with self.assertRaises(AssertionError):
            validate(changed)

    def test_unmeasured_asset_cannot_claim_signature_or_anchor(self) -> None:
        for field, value in (
            ("signature_state", "SIGNED"),
            ("root_state", "ROOT_INCLUDED"),
            ("anchor_state", "BITCOIN_ANCHORED"),
        ):
            with self.subTest(field=field):
                changed = copy.deepcopy(self.document)
                row = next(row for row in changed["assets"] if row["symbol"] != "RLUSD")
                row[field] = value
                with self.assertRaises(AssertionError):
                    validate(changed)

    def test_each_protocol_state_remains_generic(self) -> None:
        changed = copy.deepcopy(self.document)
        changed["assets"][0]["x402_door_state"] = "ASSET_SPECIFIC_SETTLED"
        with self.assertRaises(AssertionError):
            validate(changed)


if __name__ == "__main__":
    unittest.main()
