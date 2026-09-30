# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2026 CSOAI
"""v0.2: schema names, RFC 6962 Merkle domain separation (known-answer vectors fixed here), JCS byte-equality,
and verify for both versions."""
import gzip, hashlib, json, pathlib, tempfile, unittest
import venturi_capsule as v
from test_adapters import ALL_FIXTURES
from adapters import cross_ledger

# Known-answer vectors: leaves = sha256(bytes([i])) for i in range(n), sorted; root per MERKLE_V02.
KAT = {
    0: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    1: "d9de27625445003d8a9739a851e3ff8d41c0683630b4d63a88327a6aaa37c409",
    2: "972ffe9bfd6c300760b69f0cefe0b3cdf1d1d2e8afbb804d3db8f2f012be99e3",
    3: "32578241d441e9b27013c7644c81a497973b785eae08cfde9a8df961fc5258e9",
    4: "1275da9ad59ab36339807028edf1d092db7c36ac4dbf19313b48b8307c9c6b11",
    5: "3afa2f51d328742e875597963a14ba48e21ab491403b5e89e1e72409978707db",
    7: "b1eaacd75bf1a07207e544bc4e77cc86aab906bd8cbc4ba6e5ccd1309f69ef10",
    8: "6a421a28811ab0ccf665da010a8a9308466faa4ff65e7d963adc4546bef43466",
    13: "419b573433b9c8400ab54561d3177bb4c7e421901e4ec0a376fd833926e32393",
}


def ids(n):
    return [v.sha(bytes([i])) for i in range(n)]


def H(b):
    return hashlib.sha256(b).digest()


def rfc6962_reference(leaves):
    """RFC 6962 section 2.1, written out independently of the module's implementation."""
    if not leaves:
        return H(b"")
    if len(leaves) == 1:
        return H(b"\x00" + leaves[0])
    k = 1 << ((len(leaves) - 1).bit_length() - 1)
    return H(b"\x01" + rfc6962_reference(leaves[:k]) + rfc6962_reference(leaves[k:]))


class Schema(unittest.TestCase):
    def test_public_schema_strings(self):
        self.assertEqual(v.SCHEMA, "csoai.measurement-capsule/0.2")
        self.assertEqual(v.RECORD_SCHEMA, "csoai.measurement-capsule-batch/0.2")
        self.assertEqual(v.INDEX_SCHEMA, "csoai.measurement-capsule-index/0.2")

    def test_no_internal_name_in_any_capsule(self):
        for name, mk in ALL_FIXTURES.items():
            for c in mk():
                self.assertEqual(c["schema"], v.SCHEMA, name)
                self.assertNotIn("venturi", json.dumps(c).lower(), name)


class Merkle(unittest.TestCase):
    def test_known_answer_vectors(self):
        for n, want in KAT.items():
            self.assertEqual(v.merkle_root(ids(n)), want, n)

    def test_matches_independent_rfc6962_reference(self):
        for n in range(0, 40):
            leaves = sorted(bytes.fromhex(i) for i in ids(n))
            self.assertEqual(v.merkle_root(ids(n)), rfc6962_reference(leaves).hex(), n)

    def test_one_leaf_is_its_leaf_hash_not_the_id(self):
        a = ids(1)[0]
        self.assertEqual(v.merkle_root([a]), H(b"\x00" + bytes.fromhex(a)).hex())
        self.assertNotEqual(v.merkle_root([a]), a)

    def test_a_node_cannot_be_passed_off_as_a_leaf(self):
        a, b = sorted(ids(2))
        node = H(b"\x01" + H(b"\x00" + bytes.fromhex(a)) + H(b"\x00" + bytes.fromhex(b))).hex()
        self.assertEqual(v.merkle_root([a, b]), node)
        self.assertNotEqual(v.merkle_root([node]), node)  # presenting the node as a one-leaf tree gives another root
        # must-fail control: the v0.1 rule had no domain separation, and there the substitution succeeds
        v01_node = H(bytes.fromhex(a) + bytes.fromhex(b)).hex()
        self.assertEqual(v.merkle_root_v01([v01_node]), v.merkle_root_v01([a, b]))

    def test_a_leaf_cannot_be_the_concatenation_of_two_children(self):
        a, b = sorted(ids(2))
        with self.assertRaises(ValueError):
            v.merkle_root([a + b])

    def test_odd_count_splits_never_promotes(self):
        a, b, c = sorted(ids(3))
        L = lambda x: H(b"\x00" + bytes.fromhex(x))
        want = H(b"\x01" + H(b"\x01" + L(a) + L(b)) + L(c)).hex()
        self.assertEqual(v.merkle_root([a, b, c]), want)

    def test_order_independent(self):
        x = ids(9)
        self.assertEqual(v.merkle_root(x), v.merkle_root(list(reversed(x))))


class JCS(unittest.TestCase):
    def test_every_fixture_capsule_is_byte_equal_to_jcs(self):
        import rfc8785
        for name, mk in ALL_FIXTURES.items():
            for c in mk():
                self.assertEqual(v.canon(c), rfc8785.dumps(c), name)
                self.assertIsNone(v.jcs_divergence(c), name)

    def test_control_divergence_fails_the_build(self):
        # 1.0 serialises as "1.0" here and as "1" under JCS; 2**60 is outside JCS's integer domain
        for bad in (1.0, 2 ** 60, 1e-7):
            c = ALL_FIXTURES["cross_ledger"]()[0]
            c["observed"]["x"] = bad
            c["capsule_id"] = v.capsule_id(c)
            self.assertIsNotNone(v.jcs_divergence(c), bad)
            with tempfile.TemporaryDirectory() as d, self.assertRaises(SystemExit):
                v.write_batch(d, "cross_ledger", cross_ledger.KIND, [c], {})


class VerifyBothVersions(unittest.TestCase):
    def test_v02_batch(self):
        with tempfile.TemporaryDirectory() as d:
            rec = v.write_batch(d, "cross_ledger", cross_ledger.KIND, ALL_FIXTURES["cross_ledger"](), {})
            self.assertEqual(rec["schema"], v.RECORD_SCHEMA); self.assertEqual(rec["merkle"], v.MERKLE_V02)
            self.assertEqual(rec["canonicalisation"]["jcs_byte_equal"], "3/3")
            res, _, _ = v.verify_batch(d, check_signature=False)
            self.assertIn("v0.2", res["merkle_root"]); self.assertEqual(res["jcs_byte_equal"], "3/3")

    def test_v01_batch_keeps_v01_rule(self):
        with tempfile.TemporaryDirectory() as d:
            caps = ALL_FIXTURES["cross_ledger"]()
            lines = b"".join(v.canon(c) + b"\n" for c in sorted(caps, key=lambda c: c["capsule_id"]))
            (pathlib.Path(d) / "capsules.jsonl").write_bytes(lines)
            i = [c["capsule_id"] for c in caps]
            rec = {"schema": v.RECORD_SCHEMA_V01, "n_capsules": 3, "merkle_root": v.merkle_root_v01(i),
                   "capsules_file": {"path": "capsules.jsonl", "sha256": v.sha(lines)}}
            (pathlib.Path(d) / "record.json").write_text(json.dumps(rec))
            res, _, _ = v.verify_batch(d, check_signature=False)
            self.assertIn("v0.1", res["merkle_root"])
            rec["merkle_root"] = v.merkle_root(i)  # control: a v0.1 record carrying a v0.2 root does not verify
            (pathlib.Path(d) / "record.json").write_text(json.dumps(rec))
            with self.assertRaises(AssertionError):
                v.verify_batch(d, check_signature=False)

    def test_unknown_schema_refused(self):
        with tempfile.TemporaryDirectory() as d:
            v.write_batch(d, "cross_ledger", cross_ledger.KIND, ALL_FIXTURES["cross_ledger"](), {})
            p = pathlib.Path(d) / "record.json"
            r = json.loads(p.read_text()); r["schema"] = "csoai.something-else/9"; p.write_text(json.dumps(r))
            with self.assertRaises(AssertionError):
                v.verify_batch(d, check_signature=False)


if __name__ == "__main__":
    unittest.main()
