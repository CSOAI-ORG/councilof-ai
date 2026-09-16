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
        self.assertEqual(
            self.document["coverage"]["deeply_measured_assets"],
            len([r for r in self.document["assets"] if r["measurement"]["state"] == "MEASURED"]),
        )
        self.assertEqual(
            self.document["coverage"]["unmeasured_assets"],
            425 - self.document["coverage"]["deeply_measured_assets"],
        )
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
        self.assertTrue(all(row["index_commitment_state"] == expected_index for row in self.document["assets"]))
        measured = [row for row in self.document["assets"] if row["measurement"]["state"] == "MEASURED"]
        if measured:
            self.assertEqual(expected_anchor, measured[0]["anchor_state"])

    def test_confirmed_witness_state_spelling(self) -> None:
        self.assertEqual(
            "SIGNED_ROOT_INCLUDED_REKOR_WITNESSED_OTS_CONFIRMED_BITCOIN",
            index_commitment_state("WITNESSED", "CONFIRMED_BITCOIN"),
        )
        self.assertEqual(
            "ROOT_REKOR_WITNESSED_OTS_CONFIRMED_BITCOIN",
            measured_asset_anchor_state("WITNESSED", "CONFIRMED_BITCOIN"),
        )

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
        current = changed["assets"][0]["index_commitment_state"]
        changed["assets"][0]["index_commitment_state"] = (
            "SIGNED_ROOT_INCLUDED_REKOR_WITNESSED_OTS_PENDING_BITCOIN"
            if current.endswith("CONFIRMED_BITCOIN")
            else "SIGNED_ROOT_INCLUDED_REKOR_WITNESSED_OTS_CONFIRMED_BITCOIN"
        )
        with self.assertRaises(AssertionError):
            validate(changed)

        changed = copy.deepcopy(self.document)
        measured_list = [row for row in changed["assets"] if row["measurement"]["state"] == "MEASURED"]
        if measured_list:
            measured = measured_list[0]
            measured["anchor_state"] = (
                "ROOT_REKOR_WITNESSED_OTS_PENDING_BITCOIN"
                if measured["anchor_state"].endswith("CONFIRMED_BITCOIN")
                else "ROOT_REKOR_WITNESSED_OTS_CONFIRMED_BITCOIN"
            )
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

    def test_absence_from_a_register_is_unchecked_never_not_registered(self) -> None:
        rendered = json.dumps(self.document)
        for word in ("NOT_REGISTERED", "UNREGISTERED", "NOT_LISTED"):
            self.assertNotIn(word, rendered)
        usdt = next(row for row in self.document["assets"] if row["symbol"] == "USDT" and row["name"] == "Tether")
        self.assertEqual("UNCHECKED", usdt["regulatory_status"]["registers"]["esma_mica_interim_emt"]["state"])
        changed = copy.deepcopy(self.document)
        changed["assets"][0]["regulatory_status"]["registers"]["esma_mica_interim_emt"] = {"state": "NOT_REGISTERED"}
        with self.assertRaises(AssertionError):
            validate(changed)

    def test_register_listing_must_cite_a_pinned_file(self) -> None:
        usdc = next(row for row in self.document["assets"] if row["id"] == "2")
        self.assertEqual("TOKEN_WHITE_PAPER_LISTED", usdc["regulatory_status"]["registers"]["esma_mica_interim_emt"]["state"])
        changed = copy.deepcopy(self.document)
        row = next(r for r in changed["assets"] if r["id"] == "2")
        row["regulatory_status"]["registers"]["esma_mica_interim_emt"]["evidence"]["file_sha256"] = "0" * 64
        with self.assertRaises(AssertionError):
            validate(changed)
        changed = copy.deepcopy(self.document)
        row = next(r for r in changed["assets"] if r["regulatory_status"]["registers"]["nydfs_greenlist"]["state"] == "UNCHECKED")
        row["regulatory_status"]["registers"]["nydfs_greenlist"] = {"state": "LISTED_ON_GREENLIST", "evidence": {}}
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
