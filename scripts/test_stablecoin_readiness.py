from __future__ import annotations

import copy
import json
import unittest
from pathlib import Path

from build_stablecoin_readiness import (
    build,
    index_commitment_state,
    measured_asset_anchor_state,
    validate,
)


class StablecoinReadinessTruthTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.document = build(Path(".").resolve())

    def test_authoritative_coverage(self) -> None:
        validate(self.document)
        self.assertEqual(425, self.document["coverage"]["indexed_assets"])
        self.assertEqual(1, self.document["coverage"]["deeply_measured_assets"])
        self.assertEqual(424, self.document["coverage"]["unmeasured_assets"])
        witness = json.loads((Path(".") / "public/interop/root-witness-latest.json").read_text())
        w_blocks = (((witness.get("witnesses") or {}).get("ots") or {}).get("bitcoin_blocks")) or []
        expected = self.document["coverage"]["deeply_measured_assets"] if w_blocks else 0
        self.assertEqual(expected, self.document["coverage"]["asset_measurements_bitcoin_anchored_via_current_root"])
        self.assertEqual(1, self.document["coverage"]["post_freeze_discovery_candidates"])
        self.assertEqual("USBDC", self.document["discovery_candidates"][0]["symbol"])
        self.assertEqual("UNMEASURED", self.document["discovery_candidates"][0]["measurement_state"])

    def test_row_witness_states_are_derived_from_shared_evidence(self) -> None:
        proof = self.document["shared_evidence"]["index_commitment"]
        rekor_state = proof["rekor"]["state"]
        ots_state = proof["opentimestamps"]["state"]
        expected_index = index_commitment_state(rekor_state, ots_state)
        expected_anchor = measured_asset_anchor_state(rekor_state, ots_state)
        self.assertEqual("SIGNED_ROOT_INCLUDED_REKOR_WITNESSED_OTS_CONFIRMED_BITCOIN", expected_index)
        self.assertTrue(all(row["index_commitment_state"] == expected_index for row in self.document["assets"]))
        measured = next(row for row in self.document["assets"] if row["measurement"]["state"] == "MEASURED")
        self.assertEqual("ROOT_REKOR_WITNESSED_OTS_CONFIRMED_BITCOIN", expected_anchor)
        self.assertEqual(expected_anchor, measured["anchor_state"])

    def test_pending_witness_keeps_legacy_public_state_spelling(self) -> None:
        self.assertEqual(
            "SIGNED_ROOT_INCLUDED_REKOR_WITNESSED_OTS_PENDING_BITCOIN",
            index_commitment_state("WITNESSED", "STAMPED_PENDING_BITCOIN"),
        )
        self.assertEqual(
            "ROOT_REKOR_WITNESSED_OTS_PENDING_BITCOIN",
            measured_asset_anchor_state("WITNESSED", "STAMPED_PENDING_BITCOIN"),
        )

    def test_stale_row_witness_state_fails_validation(self) -> None:
        changed = copy.deepcopy(self.document)
        changed["assets"][0]["index_commitment_state"] = (
            "SIGNED_ROOT_INCLUDED_REKOR_WITNESSED_OTS_PENDING_BITCOIN"
        )
        with self.assertRaises(AssertionError):
            validate(changed)

        changed = copy.deepcopy(self.document)
        measured = next(row for row in changed["assets"] if row["measurement"]["state"] == "MEASURED")
        measured["anchor_state"] = "ROOT_REKOR_WITNESSED_OTS_PENDING_BITCOIN"
        with self.assertRaises(AssertionError):
            validate(changed)

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

    def test_public_root_refreshes_readiness_after_witnesses(self) -> None:
        workflow = (Path(".") / ".github/workflows/public-root.yml").read_text()
        witness_final = workflow.index("python scripts/witness_public_root.py --refresh-eas")
        readiness = workflow.index("python scripts/build_stablecoin_readiness.py")
        commit = workflow.index("- name: commit published tree")
        self.assertLess(witness_final, readiness)
        self.assertLess(readiness, commit)
        self.assertIn(
            "git add public/interop/stablecoin-universe-2026-09/readiness.json",
            workflow[commit:],
        )


if __name__ == "__main__":
    unittest.main()
