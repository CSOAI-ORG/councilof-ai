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
        self.assertTrue(all(row["next_action"] == "REVIEW_ISSUER_SITE_FOR_ATTESTATION" for row in rows))

    def test_every_row_carries_a_source_registration_state(self) -> None:
        states = {"ATTESTATION_PAGE_REGISTERED", "ISSUER_SITE_REGISTERED", "NO_SOURCE_LOCATED"}
        for row in self.document["rows"]:
            reg = row["source_registration"]
            self.assertIn(reg["state"], states)
            if reg["state"] == "NO_SOURCE_LOCATED":
                self.assertTrue(reg["method_note"])
            if reg["state"] == "ISSUER_SITE_REGISTERED":
                self.assertTrue(reg["issuer_site"] and reg["issuer_site"].startswith("https://"))
                self.assertEqual("defillama-stablecoin-detail", reg["source_id"])
                self.assertTrue(reg["source_retrieved_at"])
                self.assertEqual("DIRECTORY_LEAD_UNVERIFIED", reg["verification_state"])

    def test_registration_counts_reconcile_to_425(self) -> None:
        counts = self.document["counts"]
        reg_states = [row["source_registration"]["state"] for row in self.document["rows"]]
        self.assertEqual(425, len(reg_states))
        self.assertEqual(19, reg_states.count("ATTESTATION_PAGE_REGISTERED"))
        self.assertEqual(406, reg_states.count("ISSUER_SITE_REGISTERED"))
        self.assertEqual(counts["no_source_located"], reg_states.count("NO_SOURCE_LOCATED"))
        self.assertEqual(425, counts["issuer_site_registered"])
        # every identity has a registered keyless lead; none silently blank
        self.assertEqual(0, counts["no_source_located"])

    def test_stale_and_missing_source_signals_are_derived(self) -> None:
        signals = self.document["signals"]
        for key in (
            "stale_attestation_reports",
            "deep_probed_missing_report_date",
            "deep_probed_missing_auditor",
            "no_source_located",
            "issuer_site_only_pending_review",
        ):
            self.assertIsInstance(signals[key], int)
            self.assertGreaterEqual(signals[key], 0)
        self.assertEqual(406, signals["issuer_site_only_pending_review"])
        self.assertEqual(signals["no_source_located"], self.document["counts"]["no_source_located"])

    def test_anchor_without_measurement_fails_closed(self) -> None:
        changed = copy.deepcopy(self.document)
        changed["rows"][1]["states"]["anchored"] = True
        with self.assertRaises(AssertionError):
            validate(changed)


if __name__ == "__main__":
    unittest.main()
