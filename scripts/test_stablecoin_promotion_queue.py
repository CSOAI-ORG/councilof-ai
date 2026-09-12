from __future__ import annotations

import copy
import unittest
from pathlib import Path

from build_stablecoin_promotion_queue import build, validate


class StablecoinPromotionQueueTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.document = build(Path(".").resolve())

    def test_all_425_rows_have_one_rank_and_next_action(self) -> None:
        validate(self.document)
        self.assertEqual(425, self.document["population"])
        self.assertEqual(list(range(1, 426)), [row["rank"] for row in self.document["rows"]])
        self.assertTrue(all(row["next_action"] for row in self.document["rows"]))

    def test_current_evidence_counts_stay_truthful(self) -> None:
        counts = self.document["counts"]
        self.assertEqual(19, counts["primary_source_registered"])
        self.assertEqual(19, counts["deep_probed"])
        self.assertEqual(1, counts["measured"])
        self.assertEqual(1, counts["anchored"])
        self.assertEqual(0, counts["asset_specific_x402_settled"])

    def test_rlusd_advances_to_protocol_door_action(self) -> None:
        row = next(row for row in self.document["rows"] if row["symbol"] == "RLUSD")
        self.assertTrue(row["states"]["measured"])
        self.assertTrue(row["states"]["anchored"])
        self.assertEqual("PUBLISH_ASSET_SPECIFIC_PROTOCOL_DOORS", row["next_action"])

    def test_unregistered_assets_never_skip_source_registration(self) -> None:
        rows = [row for row in self.document["rows"] if not row["states"]["primary_source_registered"]]
        self.assertEqual(406, len(rows))
        self.assertTrue(all(row["next_action"] == "REGISTER_PRIMARY_SOURCES" for row in rows))

    def test_anchor_without_measurement_fails_closed(self) -> None:
        changed = copy.deepcopy(self.document)
        changed["rows"][1]["states"]["anchored"] = True
        with self.assertRaises(AssertionError):
            validate(changed)


if __name__ == "__main__":
    unittest.main()
