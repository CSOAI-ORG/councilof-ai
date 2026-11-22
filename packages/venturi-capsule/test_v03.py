# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2026 CSOAI
"""capsule 0.3: the optional provisions binding. Without it every capsule and batch is byte-identical to v0.2;
with it the capsule names frozen provisions by id, hash and corpus root, and verify still holds."""
import copy, gzip, hashlib, json, pathlib, tempfile, unittest
import venturi_capsule as v
from test_adapters import ALL_FIXTURES
from adapters import cross_ledger

HERE = pathlib.Path(__file__).parent
MANIFEST = HERE / "testdata" / "frozen-provision-hashes.json"
# the bytes published at https://councilof.ai/interop/frozen-provision-hashes.json (regulatory inventory evidence_sha256)
MANIFEST_SHA256 = "e43c9bd52adeeda96b67a3ae63700c44f0aae3a44c74a0dac46fbed5f8008788"
CORPUS_ROOT = "37e2e10d53feaa9e12097f45113e1234510be0ca471e1a0848f5805db3e367c7"


def manifest():
    return v.load_provision_manifest(MANIFEST)


def cap(provisions=None, **kw):
    base = dict(kind=cross_ledger.KIND, subject_id="s1", claim={"statement": "x"}, declared={"a": 1}, observed={"a": 1},
                differential={}, sources={"record_sha256": "0" * 64}, measurement_state="CONSISTENT", limitations=["l"],
                observed_at="2026-09-27T00:00:00Z")
    base.update(kw)
    return v.make_capsule(**base, provisions=provisions)


class Manifest(unittest.TestCase):
    def test_testdata_is_the_published_manifest(self):
        self.assertEqual(hashlib.sha256(MANIFEST.read_bytes()).hexdigest(), MANIFEST_SHA256)
        m = manifest()
        self.assertEqual(m["corpus_root"], CORPUS_ROOT)
        self.assertEqual(len(m["anchors"]), m["provisions"])

    def test_tampered_manifest_refused(self):
        m = json.loads(MANIFEST.read_bytes())
        k = sorted(m["anchors"])[0]
        m["anchors"][k] = "f" * 64
        with tempfile.NamedTemporaryFile("w", suffix=".json") as f:
            json.dump(m, f); f.flush()
            with self.assertRaises(ValueError):
                v.load_provision_manifest(f.name)


class NoBindingIsV02(unittest.TestCase):
    def test_every_fixture_capsule_is_still_02_without_provisions(self):
        for name, mk in ALL_FIXTURES.items():
            for c in mk():
                self.assertEqual(c["schema"], v.SCHEMA, name)
                self.assertNotIn("provisions", c, name)

    def test_make_capsule_without_provisions_is_unchanged(self):
        c = cap()
        self.assertEqual(c["schema"], "csoai.measurement-capsule/0.2")
        self.assertNotIn("provisions", c)

    def test_v02_batch_record_bytes_keep_capsule_schema_string(self):
        with tempfile.TemporaryDirectory() as d:
            rec = v.write_batch(d, "cross_ledger", cross_ledger.KIND, ALL_FIXTURES["cross_ledger"](), {})
            self.assertEqual(rec["capsule_schema"], "csoai.measurement-capsule/0.2")
            self.assertEqual(rec["schema"], v.RECORD_SCHEMA)


class Binding(unittest.TestCase):
    def test_binding_pins_hash_and_root(self):
        m = manifest()
        b = v.provision_binding(m, [("32024R1689:50", "PREDICATE"), ("32024R1689:12", "RELEVANT_TO")])
        c = cap(provisions=b)
        self.assertEqual(c["schema"], v.SCHEMA_V03)
        self.assertEqual([e["provision_id"] for e in c["provisions"]], ["32024R1689:12", "32024R1689:50"])  # sorted
        for e in c["provisions"]:
            self.assertEqual(e["provision_sha256"], m["anchors"][e["provision_id"]])
            self.assertEqual(e["corpus_root"], CORPUS_ROOT)
        self.assertEqual(v.capsule_id(c), c["capsule_id"])
        self.assertIsNone(v.jcs_divergence(c))
        self.assertEqual(v.authority_violations(c), [])

    def test_order_of_input_does_not_change_the_capsule(self):
        m = manifest()
        a = cap(provisions=v.provision_binding(m, [("32024R1689:50", "PREDICATE"), ("32024R1689:12", "RELEVANT_TO")]))
        b = cap(provisions=v.provision_binding(m, [("32024R1689:12", "RELEVANT_TO"), ("32024R1689:50", "PREDICATE")]))
        self.assertEqual(a["capsule_id"], b["capsule_id"])

    def test_binding_changes_the_id(self):
        m = manifest()
        self.assertNotEqual(cap()["capsule_id"], cap(provisions=v.provision_binding(m, [("32024R1689:50", "PREDICATE")]))["capsule_id"])

    def test_refusals(self):
        m = manifest()
        with self.assertRaises(ValueError):
            v.provision_binding(m, [("32024R1689:999", "PREDICATE")])  # not in the manifest
        good = v.provision_binding(m, [("32024R1689:50", "PREDICATE")])[0]
        for bad in (
            [], [dict(good, relation="COMPLIES")], [dict(good, provision_sha256="xyz")],
            [dict(good, provision_id="Article 50")], [dict(good, extra=1)], [good, dict(good)],
            [good, dict(good, provision_id="32024R1689:12", corpus_root="0" * 64)],
        ):
            with self.assertRaises(ValueError, msg=repr(bad)[:80]):
                cap(provisions=bad)


class BatchesAndVerify(unittest.TestCase):
    def _caps03(self):
        m = manifest()
        out = []
        for c in ALL_FIXTURES["cross_ledger"]():
            c = copy.deepcopy(c); c.pop("capsule_id")
            c["schema"] = v.SCHEMA_V03
            c["provisions"] = v.provision_binding(m, [("32024R1689:50", "RELEVANT_TO")])
            c["capsule_id"] = v.capsule_id(c)
            out.append(c)
        return out

    def test_03_batch_builds_and_verifies(self):
        with tempfile.TemporaryDirectory() as d:
            rec = v.write_batch(d, "cross_ledger", cross_ledger.KIND, self._caps03(), {})
            self.assertEqual(rec["capsule_schema"], v.SCHEMA_V03)
            res, _, ids = v.verify_batch(d, check_signature=False)
            self.assertEqual(res["capsules"], 3)
            self.assertEqual(v.merkle_root(ids), rec["merkle_root"])

    def test_mixed_batch_names_both_schemas(self):
        with tempfile.TemporaryDirectory() as d:
            caps = ALL_FIXTURES["cross_ledger"]()[:1] + self._caps03()[1:]
            rec = v.write_batch(d, "cross_ledger", cross_ledger.KIND, caps, {})
            self.assertEqual(rec["capsule_schema"], [v.SCHEMA, v.SCHEMA_V03])
            v.verify_batch(d, check_signature=False)

    def test_verify_refuses_a_malformed_binding(self):
        with tempfile.TemporaryDirectory() as d:
            v.write_batch(d, "cross_ledger", cross_ledger.KIND, self._caps03(), {})
            p = pathlib.Path(d)
            rec = json.loads((p / "record.json").read_text())
            lines = gzip.decompress((p / "capsules.jsonl.gz").read_bytes()).decode().splitlines()
            c = json.loads(lines[0]); c["provisions"][0]["relation"] = "COMPLIES"; c["capsule_id"] = v.capsule_id(c)
            lines[0] = v.canon(c).decode()
            ids = sorted(json.loads(l)["capsule_id"] for l in lines)
            lines = sorted(lines, key=lambda l: json.loads(l)["capsule_id"])
            raw = ("\n".join(lines) + "\n").encode()
            (p / "capsules.jsonl.gz").write_bytes(gzip.compress(raw, mtime=0))
            rec["capsules_file"].update(sha256=v.file_sha(p / "capsules.jsonl.gz"), uncompressed_sha256=v.sha(raw))
            rec["merkle_root"] = v.merkle_root(ids)
            (p / "record.json").write_text(json.dumps(rec))
            with self.assertRaises(AssertionError):
                v.verify_batch(d, check_signature=False)

    def test_02_capsule_smuggling_provisions_refused(self):
        with tempfile.TemporaryDirectory() as d:
            c = copy.deepcopy(ALL_FIXTURES["cross_ledger"]()[0]); c.pop("capsule_id")
            c["provisions"] = v.provision_binding(manifest(), [("32024R1689:50", "PREDICATE")])
            c["capsule_id"] = v.capsule_id(c)
            with self.assertRaises(ValueError):  # schema says 0.2 but carries the field
                v.write_batch(d, "cross_ledger", cross_ledger.KIND, [c], {})


if __name__ == "__main__":
    unittest.main()
