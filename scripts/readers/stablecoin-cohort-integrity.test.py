#!/usr/bin/env python3
"""Integrity checks for the 2026-09-12 stablecoin observation cohort."""

from __future__ import annotations

import hashlib
import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
COHORT_PATH = ROOT / "tui2-measurements" / "tui2-cohort-2026-09-12.json"
CARDS = ROOT / "public" / "interop" / "stablecoin-cohort-2026-09"
CATALOG_PATH = ROOT / "docs" / "tui2" / "DEDUPLICATED-CATALOG.json"
COVERAGE_PATH = ROOT / "public" / "interop" / "coverage-register.json"


def load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def canonical_bytes(value: object) -> bytes:
    return json.dumps(
        value, sort_keys=True, separators=(",", ":"), ensure_ascii=False
    ).encode("utf-8")


def exact_atomic(raw: str, decimals: int) -> str:
    digits = str(raw).zfill(decimals + 1)
    if decimals == 0:
        return digits
    return f"{digits[:-decimals]}.{digits[-decimals:]}"


class StablecoinCohortIntegrityTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.cohort = load(COHORT_PATH)
        cls.catalog = load(CATALOG_PATH)
        cls.coverage = load(COVERAGE_PATH)["stablecoin_universe_2026_09"]
        cls.cards = [load(path) for path in sorted(CARDS.glob("card-*-unsigned.json"))]

    def test_identity_counts_are_unioned_by_registry_id(self) -> None:
        identities = {row["subject_identity"] for row in self.cohort["measurements"]}
        symbols = {row["subject"] for row in self.cohort["measurements"]}
        self.assertEqual(len(identities), 12)
        self.assertEqual(len(symbols), 11)
        self.assertEqual(self.cohort["assets_measured"], 12)
        self.assertEqual(self.coverage["deep_measured_asset_identity_union"], 12)
        self.assertEqual(self.coverage["signed_staged_asset_identity_overlap"], 1)
        self.assertEqual(self.coverage["unmeasured_asset_identities"], 413)
        self.assertEqual(self.catalog["summary"]["measured_subjects"], 12)
        self.assertEqual(self.catalog["summary"]["unmeasured_subjects"], 413)

    def test_same_symbol_different_assets_are_separate(self) -> None:
        usdv = [r for r in self.cohort["measurements"] if r["subject"] == "USDV"]
        self.assertEqual({r["subject_identity"] for r in usdv}, {
            "defillama-stablecoin:143",
            "defillama-stablecoin:398",
        })
        card_ids = {
            c["payload"].get("subject_identity")
            for c in self.cards
            if c["payload"].get("subject_symbol") == "USDV"
        }
        self.assertEqual(card_ids, {
            "defillama-stablecoin:143",
            "defillama-stablecoin:398",
        })

    def test_supply_values_do_not_use_json_floats(self) -> None:
        for row in self.cohort["measurements"]:
            if "normalized_supply" in row:
                self.assertIsInstance(row["normalized_supply"], str)
            if row["chain"] in {"ethereum", "base"}:
                self.assertEqual(
                    row["normalized_supply"],
                    exact_atomic(row["raw_supply"], row["decimals"]),
                )
        for card in self.cards:
            for reading in card["payload"].get("chain_readings", []):
                for key in ("totalSupply", "balances_authorized", "obligations"):
                    if key in reading:
                        self.assertIsInstance(reading[key], str)

    def test_replay_and_finality_are_not_overclaimed(self) -> None:
        for row in self.cohort["measurements"]:
            self.assertEqual(row["replay_result"], "NOT_REPLAYED_AT_RECORDED_HEIGHT")
            self.assertEqual(row["replay_scope"], "COMMAND_RERUNS_CURRENT_STATE")
            self.assertNotIn("finalized_block", row)
            self.assertNotIn("finalized_ledger", row)
            if row["chain"] in {"ethereum", "base"}:
                self.assertIn("NOT_INDEPENDENTLY_PROVEN_FINAL", row["block_finality"])

    def test_card_hashes_and_dependencies_match(self) -> None:
        cohort_sha = hashlib.sha256(COHORT_PATH.read_bytes()).hexdigest()
        catalog_sha = hashlib.sha256(CATALOG_PATH.read_bytes()).hexdigest()
        self.assertEqual(len(self.cards), 13)
        for card in self.cards:
            self.assertEqual(card["sha256"], hashlib.sha256(canonical_bytes(card["payload"])).hexdigest())
            evidence = card["payload"].get("evidence")
            if evidence:
                self.assertEqual(evidence["sha256"], cohort_sha)
        commitment = next(
            card for card in self.cards
            if card["payload"]["kind"] == "csoai.deduplicated-catalog.commitment/v1"
        )
        self.assertEqual(commitment["payload"]["catalog_sha256"], catalog_sha)
        self.assertEqual(commitment["payload"]["deep_reading_asset_identity_union"], 12)


if __name__ == "__main__":
    unittest.main()
