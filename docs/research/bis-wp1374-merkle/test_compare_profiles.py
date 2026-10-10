# SPDX-License-Identifier: Apache-2.0
"""Synthetic pinned outputs, profile contrast, proof/input controls and CLI failures."""
from __future__ import annotations

import copy
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

import bis_reference as reference
import compare_profiles as example

HERE = Path(__file__).resolve().parent


class MerkleProfileTests(unittest.TestCase):
    def setUp(self):
        self.fixture = json.loads((HERE / "vectors.json").read_text(encoding="utf-8"))
        self.negative = self.fixture["negative_controls"]

    def test_pinned_root_outputs(self):
        result = example.compare(self.fixture)
        self.assertEqual(len(result["root_vectors"]), 4)
        self.assertEqual([row["profiles_equal"] for row in result["root_vectors"]],
                         [True, True, False, True])
        self.assertTrue(result["count_binding_confirmed"])
        self.assertTrue(result["proof_count_binding_confirmed"])

    def test_six_leaf_profiles_have_distinct_pinned_roots(self):
        row = next(row for row in self.fixture["root_vectors"]
                   if row["id"] == "root-size-6")
        self.assertEqual(reference.merkle_root_from_hex_hashes(row["fingerprints"]),
                         row["reference_root"])
        self.assertEqual(example.upfront_padding_root(row["fingerprints"]),
                         row["upfront_padding_root"])
        self.assertNotEqual(row["reference_root"], row["upfront_padding_root"])

    def test_duplicate_last_leaf_still_changes_count_bound_root(self):
        row = self.fixture["count_binding"]
        a = reference.merkle_root_from_hex_hashes(row["input_fingerprints_3"])
        b = reference.merkle_root_from_hex_hashes(row["input_fingerprints_4"])
        self.assertEqual(a, row["wrapped_root_3"])
        self.assertEqual(b, row["wrapped_root_4"])
        self.assertNotEqual(a, b)

    def test_original_proof_and_tampered_count(self):
        row = self.fixture["proof_count"]
        leaf = row["input_fingerprints"][row["leaf_index"]]
        proof = [(s["sibling"], s["orientation"]) for s in row["proof"]]
        self.assertEqual(reference.root_from_inclusion_proof(leaf, proof, 6),
                         row["expected_root"])
        self.assertEqual(reference.root_from_inclusion_proof(leaf, proof, 7),
                         row["tampered_count_root"])
        self.assertNotEqual(row["expected_root"], row["tampered_count_root"])

    def test_recorded_proof_mutations_do_not_match_original_root(self):
        leaf = self.negative["fingerprints"][1]
        for row in self.negative["observations"]:
            if row["id"] in ("M04-flipped-orientation", "M04-reordered-siblings",
                              "M04-mutated-sibling-byte"):
                with self.subTest(control=row["id"]):
                    result = reference.root_from_inclusion_proof(
                        leaf, row["input"]["proof"], row["input"]["count"])
                    self.assertEqual(result, row["observed"]["value"])
                    self.assertNotEqual(result, self.negative["root"])

    def test_invalid_proof_orientation_is_rejected(self):
        proof = copy.deepcopy(self.negative["proof"])
        proof[0][1] = "X"
        with self.assertRaises(ValueError):
            reference.root_from_inclusion_proof(self.negative["fingerprints"][1], proof, 3)

    def test_reference_width_acceptance_is_preserved_and_explicit(self):
        for row in self.negative["observations"]:
            if row["id"].startswith("M05-fingerprint-width-"):
                with self.subTest(control=row["id"]):
                    self.assertEqual(reference.merkle_root_from_hex_hashes(
                        row["input"]["fingerprints"]), row["observed"]["value"])

    def test_example_input_policy_rejects_reference_ambiguous_widths(self):
        for width in (0, 63, 65):
            with self.subTest(width=width), self.assertRaises(ValueError):
                example.upfront_padding_root([(b"\x11" * width).hex()])

    def test_example_input_policy_accepts_both_hex_cases(self):
        values = self.fixture["root_vectors"][-1]["fingerprints"]
        self.assertEqual(example.upfront_padding_root(values),
                         example.upfront_padding_root([v.lower() for v in values]))

    def test_invalid_hex_empty_list_and_non_string_are_rejected(self):
        for values in ([], ["NOT_HEX"], [None], "11" * 64):
            with self.subTest(values=values), self.assertRaises(ValueError):
                example.upfront_padding_root(values)
        for values in ([], ["NOT_HEX"]):
            with self.subTest(reference_values=values), self.assertRaises(ValueError):
                reference.merkle_root_from_hex_hashes(values)

    def test_changed_root_expectation_is_not_silently_regenerated(self):
        changed = copy.deepcopy(self.fixture)
        changed["root_vectors"][0]["reference_root"] = "00" * 64
        with self.assertRaisesRegex(ValueError, "Pinned expectation mismatch"):
            example.compare(changed)

    def test_source_provenance_mismatch_is_rejected(self):
        changed = copy.deepcopy(self.fixture)
        changed["source"]["sha256"] = "00" * 32
        with self.assertRaisesRegex(ValueError, "provenance mismatch"):
            example.compare(changed)

    def test_unexecuted_verification_claim_cannot_be_promoted(self):
        changed = copy.deepcopy(self.fixture)
        changed["limits"]["ledger_tested"] = True
        with self.assertRaisesRegex(ValueError, "unexecuted verification claims"):
            example.compare(changed)

    def test_non_synthetic_fixture_is_rejected(self):
        changed = copy.deepcopy(self.fixture)
        changed["synthetic_input_only"] = False
        with self.assertRaisesRegex(ValueError, "synthetic vector fixture"):
            example.compare(changed)

    def test_cli_is_portable_and_does_not_import_the_upstream_application(self):
        with tempfile.TemporaryDirectory() as directory:
            result = subprocess.run([sys.executable, str(HERE / "compare_profiles.py")],
                                    cwd=directory, capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        payload = json.loads(result.stdout)
        self.assertEqual(payload["limits"], example.LIMITS)
        self.assertEqual(payload["source"]["commit"], example.SOURCE_COMMIT)

    def test_cli_rejects_tampered_fixture_with_no_success_payload(self):
        changed = copy.deepcopy(self.fixture)
        changed["proof_count"]["tampered_count_root"] = "00" * 64
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "wrong.json"
            path.write_text(json.dumps(changed), encoding="utf-8")
            result = subprocess.run([sys.executable, str(HERE / "compare_profiles.py"),
                                     "--vectors", str(path)],
                                    cwd=directory, capture_output=True, text=True)
        self.assertEqual(result.returncode, 1)
        self.assertEqual(result.stdout, "")
        self.assertIn("proof/count expectation mismatch", result.stderr)


if __name__ == "__main__":
    unittest.main()
