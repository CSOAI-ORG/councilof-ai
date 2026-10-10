from __future__ import annotations

import copy
import json
import unittest
from pathlib import Path

import tempfile

from build_stablecoin_readiness import (
    build,
    find_index_commitment,
    index_commitment_state,
    measured_asset_anchor_state,
    rooted_stablecoin_probes,
    rooted_xrpl_asset_measurements,
    validate,
)


class StablecoinReadinessTruthTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.document = build(Path(".").resolve())

    def test_authoritative_coverage(self) -> None:
        validate(self.document)
        self.assertEqual(425, self.document["coverage"]["indexed_assets"])
        source_index = json.loads((Path(".") / "public/interop/stablecoin-universe-2026-09/index.json").read_text())
        current_root = json.loads((Path(".") / "public/root.json").read_text())
        root_hashes = set(current_root.get("card_sha256") or [])
        expected = rooted_xrpl_asset_measurements(Path(".").resolve(), root_hashes, source_index["assets"])
        expected_probes = rooted_stablecoin_probes(Path(".").resolve(), root_hashes, source_index["assets"])
        self.assertEqual(len(expected), self.document["coverage"]["deeply_measured_assets"])
        self.assertEqual(425 - len(expected), self.document["coverage"]["unmeasured_assets"])
        self.assertEqual(len(expected_probes), self.document["coverage"]["signed_rooted_probe_assets"])
        probed_rows = [row for row in self.document["assets"] if row["probe"]["state"] == "PROBED_SIGNED_ROOTED"]
        self.assertEqual(set(expected_probes), {row["id"] for row in probed_rows})
        self.assertEqual(
            sum(row["measurement"]["state"] == "UNMEASURED" for row in probed_rows),
            self.document["coverage"]["signed_rooted_probe_only_assets"],
        )
        self.assertTrue(all(row["probe"]["attestation_state"] == "UNMEASURED" for row in probed_rows))
        measured_symbols = {row["symbol"] for row in self.document["assets"] if row["measurement"]["state"] == "MEASURED"}
        self.assertTrue({"RLUSD", "USDC", "EURCV"}.issubset(measured_symbols))
        witness = json.loads((Path(".") / "public/interop/root-witness-latest.json").read_text())
        w_blocks = (((witness.get("witnesses") or {}).get("ots") or {}).get("bitcoin_blocks")) or []
        expected = self.document["coverage"]["deeply_measured_assets"] if w_blocks else 0
        self.assertEqual(expected, self.document["coverage"]["asset_measurements_bitcoin_anchored_via_current_root"])
        self.assertEqual(1, self.document["coverage"]["post_freeze_discovery_candidates"])
        self.assertEqual("USBDC", self.document["discovery_candidates"][0]["symbol"])
        self.assertEqual("UNMEASURED", self.document["discovery_candidates"][0]["measurement_state"])


    def test_rooted_probe_never_promotes_measurement(self) -> None:
        probed = [row for row in self.document["assets"] if row["probe"]["state"] == "PROBED_SIGNED_ROOTED"]
        self.assertTrue(probed)
        probe_only = [row for row in probed if row["measurement"]["state"] == "UNMEASURED"]
        self.assertTrue(probe_only)
        self.assertTrue(all(row["signature_state"] == "NO_ASSET_MEASUREMENT_SIGNATURE" for row in probe_only))
        self.assertTrue(all(row["root_state"] == "NO_ASSET_MEASUREMENT_IN_CURRENT_ROOT" for row in probe_only))
        self.assertTrue(all("A signed/rooted probe remains UNMEASURED" in row["probe"]["claim_boundary"] for row in probe_only))

    def test_row_witness_states_are_derived_from_shared_evidence(self) -> None:
        proof = self.document["shared_evidence"]["index_commitment"]
        rekor_state = proof["rekor"]["state"]
        ots_state = proof["opentimestamps"]["state"]
        expected_index = index_commitment_state(rekor_state, ots_state)
        expected_anchor = measured_asset_anchor_state(rekor_state, ots_state)
        self.assertTrue(all(row["index_commitment_state"] == expected_index for row in self.document["assets"]))
        measured = next(row for row in self.document["assets"] if row["measurement"]["state"] == "MEASURED")
        self.assertEqual(expected_anchor, measured["anchor_state"])

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
        # Deliberately contradict the current witness, whichever root is current.
        current = changed["assets"][0]["index_commitment_state"]
        changed["assets"][0]["index_commitment_state"] = (
            "SIGNED_ROOT_INCLUDED_REKOR_WITNESSED_OTS_PENDING_BITCOIN"
            if current.endswith("CONFIRMED_BITCOIN")
            else "SIGNED_ROOT_INCLUDED_REKOR_WITNESSED_OTS_CONFIRMED_BITCOIN"
        )
        with self.assertRaises(AssertionError):
            validate(changed)

        changed = copy.deepcopy(self.document)
        measured = next(row for row in changed["assets"] if row["measurement"]["state"] == "MEASURED")
        measured["anchor_state"] = (
            "ROOT_REKOR_WITNESSED_OTS_PENDING_BITCOIN"
            if measured["anchor_state"].endswith("CONFIRMED_BITCOIN")
            else "ROOT_REKOR_WITNESSED_OTS_CONFIRMED_BITCOIN"
        )
        with self.assertRaises(AssertionError):
            validate(changed)

    def test_indexed_asset_cannot_be_relabeled_measured(self) -> None:
        changed = copy.deepcopy(self.document)
        row = next(row for row in changed["assets"] if row["measurement"]["state"] == "UNMEASURED")
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
                row = next(row for row in changed["assets"] if row["measurement"]["state"] == "UNMEASURED")
                row[field] = value
                with self.assertRaises(AssertionError):
                    validate(changed)

    def test_each_protocol_state_remains_generic(self) -> None:
        changed = copy.deepcopy(self.document)
        changed["assets"][0]["x402_door_state"] = "ASSET_SPECIFIC_SETTLED"
        with self.assertRaises(AssertionError):
            validate(changed)

    def test_asset_specific_doors_are_read_from_the_door_registry(self) -> None:
        doors = json.loads((Path(".") / "functions" / "api" / "_wrapper_asset_doors.json").read_text())["doors"]
        ids = {str(d["stablecoin_index_id"]) for d in doors}
        with_door = [row for row in self.document["assets"] if row.get("x402_door")]
        self.assertEqual(ids, {row["id"] for row in with_door})
        self.assertEqual(len(with_door), self.document["coverage"]["asset_specific_x402_doors"])
        self.assertEqual(0, self.document["coverage"]["asset_specific_x402_settlements_verified"])
        for row in with_door:
            # a declared door is not a settlement: every reader keys "settled" off this substring
            self.assertIn("NO_ASSET_SETTLEMENT_VERIFIED", row["x402_door_state"])
        changed = copy.deepcopy(self.document)
        del next(row for row in changed["assets"] if row.get("x402_door"))["x402_door"]
        with self.assertRaises(AssertionError):
            validate(changed)

    def test_ambiguous_or_non_xrpl_symbol_stays_unmeasured(self) -> None:
        usdb = [row for row in self.document["assets"] if row["symbol"] == "USDB"]
        self.assertGreaterEqual(len(usdb), 2)
        self.assertTrue(all(row["measurement"]["state"] == "UNMEASURED" for row in usdb))

    def test_same_symbol_on_another_chain_does_not_invalidate_xrpl_measurement(self) -> None:
        changed = copy.deepcopy(self.document)
        measured = next(row for row in changed["assets"] if row["measurement"]["state"] == "MEASURED")
        peer = next(
            row for row in changed["assets"]
            if row["measurement"]["state"] == "UNMEASURED" and "XRPL" not in row["chains"]
        )
        peer["symbol"] = measured["symbol"].lower()
        validate(changed)
        self.assertEqual("UNMEASURED", peer["measurement"]["state"])
        self.assertEqual("NO_ASSET_MEASUREMENT_SIGNATURE", peer["signature_state"])

    def test_two_xrpl_rows_with_the_same_symbol_fail_validation(self) -> None:
        changed = copy.deepcopy(self.document)
        measured = next(row for row in changed["assets"] if row["measurement"]["state"] == "MEASURED")
        peer = next(
            row for row in changed["assets"]
            if row["measurement"]["state"] == "UNMEASURED" and "XRPL" in row["chains"]
        )
        peer["symbol"] = measured["symbol"].lower()
        with self.assertRaises(AssertionError):
            validate(changed)

    def test_no_amount_is_typed_on_the_public_surface(self) -> None:
        rendered = json.dumps(self.document)
        self.assertNotIn("campaign_amount", rendered)
        self.assertNotRegex(rendered, r"\b0\.01 USDC\b")

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


class IndexCommitmentSelectionTest(unittest.TestCase):
    """Fixture repo: never reads the real tree, so it runs whatever state master is in."""

    INDEX = "a" * 64

    def write_card(self, repo: Path, sha: str, *, index: str | None = None, sig: str | None = "c2ln") -> None:
        cards = repo / "public/cards"
        cards.mkdir(parents=True, exist_ok=True)
        body = {
            "sha256": sha,
            "sig_ed25519": sig,
            "payload": {"kind": "csoai.stablecoin-index.commitment/v1", "index_sha256": index or self.INDEX},
        }
        (cards / f"{sha[:16]}.json").write_text(json.dumps({"card": body}))

    def test_superseded_signed_duplicate_does_not_block_the_rooted_one(self) -> None:
        # 15 Sep 2026: the 11 Sep card (no product block) and the re-minted card both on disk.
        with tempfile.TemporaryDirectory() as d:
            repo = Path(d)
            self.write_card(repo, "1" * 64)
            self.write_card(repo, "2" * 64)
            path, body = find_index_commitment(repo, self.INDEX, {"2" * 64})
            self.assertEqual(body["sha256"], "2" * 64)
            self.assertEqual(path.name, "2" * 16 + ".json")

    def test_signed_but_absent_from_root_still_fails(self) -> None:
        with tempfile.TemporaryDirectory() as d:
            repo = Path(d)
            self.write_card(repo, "1" * 64)
            self.write_card(repo, "2" * 64)
            with self.assertRaisesRegex(SystemExit, "absent from the current public root"):
                find_index_commitment(repo, self.INDEX, {"3" * 64})

    def test_two_rooted_commitments_still_fail(self) -> None:
        with tempfile.TemporaryDirectory() as d:
            repo = Path(d)
            self.write_card(repo, "1" * 64)
            self.write_card(repo, "2" * 64)
            with self.assertRaisesRegex(SystemExit, "exactly one current-root-included"):
                find_index_commitment(repo, self.INDEX, {"1" * 64, "2" * 64})

    def test_unsigned_commitment_never_counts_even_if_rooted(self) -> None:
        with tempfile.TemporaryDirectory() as d:
            repo = Path(d)
            self.write_card(repo, "1" * 64, sig=None)
            with self.assertRaisesRegex(SystemExit, "no signed index commitment"):
                find_index_commitment(repo, self.INDEX, {"1" * 64})

    def test_commitment_to_another_index_never_counts(self) -> None:
        with tempfile.TemporaryDirectory() as d:
            repo = Path(d)
            self.write_card(repo, "1" * 64, index="b" * 64)
            with self.assertRaisesRegex(SystemExit, "no signed index commitment"):
                find_index_commitment(repo, self.INDEX, {"1" * 64})


if __name__ == "__main__":
    unittest.main()
