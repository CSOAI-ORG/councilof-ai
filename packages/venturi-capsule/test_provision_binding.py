# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2026 CSOAI
"""Capsule 0.3 provisions binding at production: only what the committed map maps is bound, every binding is
pinned to the frozen manifest, and unmapped adapters (a2a_card, claim_watch among them) stay 0.2 byte-for-byte."""
import gzip, json, pathlib, tempfile, unittest
import provision_binding as pb
import venturi_capsule as v

ROOT = pb.REPO_ROOT
SCHEMA_FILE = ROOT / "public/measurement-capsules/capsule-provisions-0.3.schema.json"
PMAP, MANIFEST = pb.load()


def cap(kind, i=0):
    return v.make_capsule(kind=kind, subject_id=f"subject:{i}", claim="fixture", declared={"x": i}, observed={"x": i},
                          differential={"equal": True}, sources={"fixture": "sha256:" + "0" * 64},
                          measurement_state="CONFIRMED", limitations=["fixture"], observed_at="2026-11-22T00:00:00Z")


def read_batch(out):
    rec = json.loads((pathlib.Path(out) / "record.json").read_text())
    with gzip.open(pathlib.Path(out) / "capsules.jsonl.gz", "rt") as g:
        return rec, [json.loads(l) for l in g if l.strip()]


@unittest.skipIf(PMAP is None, "capsule-provision map not present in this checkout")
class ProvisionBinding(unittest.TestCase):
    def route_mapping(self):
        rows = [m for m in PMAP["mappings"] if m["source"] == "route"]
        self.assertTrue(rows, "the map has no route mapping to exercise")
        return rows[0]

    def test_unmapped_adapters_stay_02(self):
        for u in PMAP["unmapped_adapters"]:
            self.assertEqual(pb.classify(u["adapter"], PMAP), "UNMAPPED")
            self.assertEqual(pb.bindings_for(u["adapter"], f"measurement.{u['adapter']}", PMAP, MANIFEST), [])
        for adapter, kind in (("a2a_card", "measurement.a2a_card_signature"), ("claim_watch", "measurement.claim_watch")):
            caps = [cap(kind, i) for i in range(3)]
            with tempfile.TemporaryDirectory() as d:
                rec = v.write_batch(d, adapter, kind, iter(caps), {})
                _, got = read_batch(d)
            self.assertEqual(rec["capsule_schema"], pb.SCHEMA_02)
            self.assertNotIn("provision_binding", rec)
            self.assertEqual(sorted(v.canon(c) for c in got), sorted(v.canon(c) for c in caps))

    def test_unclassified_adapter_is_not_bound(self):
        self.assertEqual(pb.classify("not_an_adapter", PMAP), "UNCLASSIFIED")
        self.assertEqual(pb.bindings_for("not_an_adapter", "measurement.none", PMAP, MANIFEST), [])

    def test_mapped_kind_binds_pinned_provisions_at_production(self):
        m = self.route_mapping()
        caps = [cap(m["kind"], i) for i in range(4)]
        with tempfile.TemporaryDirectory() as d:
            rec = v.write_batch(d, "route_fixture", m["kind"], iter(caps), {})
            res, _, ids = v.verify_batch(d, check_signature=False)
            _, got = read_batch(d)
        self.assertEqual(rec["capsule_schema"], pb.SCHEMA_03)
        self.assertEqual(rec["provision_binding"]["provision_ids"], [m["provision_id"]])
        self.assertEqual(rec["provision_binding"]["corpus_root"], MANIFEST["corpus_root"])
        self.assertEqual(len(got), 4)
        for c in got:
            self.assertEqual(c["schema"], pb.SCHEMA_03)
            self.assertEqual(c["provisions"], [{"corpus_root": MANIFEST["corpus_root"], "provision_id": m["provision_id"],
                                                "provision_sha256": MANIFEST["anchors"][m["provision_id"]], "relation": m["relation"]}])
            self.assertEqual(pb.check_binding(c["provisions"], c["schema"], MANIFEST), ("PINNED", []))
            self.assertEqual(v.capsule_id(c), c["capsule_id"])
        self.assertEqual(res["provisions"], "4/4 capsules bind a provision; every binding PINNED to the frozen manifest")

    def test_binding_matches_the_published_0_3_schema(self):
        try:
            import jsonschema
        except ImportError:
            self.skipTest("jsonschema not installed")
        schema = json.loads(SCHEMA_FILE.read_text())
        m = self.route_mapping()
        b = v.bind_capsule(cap(m["kind"]), pb.bindings_for("route_fixture", m["kind"], PMAP, MANIFEST), MANIFEST)
        jsonschema.Draft202012Validator(schema).validate(b)
        bad = dict(b, provisions=[dict(b["provisions"][0], relation="COMPLIES")])
        self.assertFalse(jsonschema.Draft202012Validator(schema).is_valid(bad))

    def test_bind_never_changes_the_input_capsule(self):
        m = self.route_mapping()
        c = cap(m["kind"])
        before = v.canon(c)
        b = v.bind_capsule(c, pb.bindings_for("route_fixture", m["kind"], PMAP, MANIFEST), MANIFEST)
        self.assertEqual(v.canon(c), before)
        self.assertNotEqual(b["capsule_id"], c["capsule_id"])
        with self.assertRaises(ValueError):
            v.bind_capsule(b, b["provisions"], MANIFEST)

    def test_unpinned_or_malformed_bindings_are_refused(self):
        m = self.route_mapping()
        good = pb.bindings_for("route_fixture", m["kind"], PMAP, MANIFEST)[0]
        for bad, state in ((dict(good, provision_sha256="0" * 64), "NOT_PINNED"),
                           (dict(good, corpus_root="1" * 64), "NOT_PINNED"),
                           (dict(good, provision_id="32024R1689:999999"), "NOT_PINNED"),
                           (dict(good, relation="COMPLIES"), "MALFORMED"),
                           (dict(good, extra=1), "MALFORMED")):
            self.assertEqual(pb.check_binding([bad], pb.SCHEMA_03, MANIFEST)[0], state)
            with self.assertRaises(ValueError):
                v.bind_capsule(cap(m["kind"]), [bad], MANIFEST)
        self.assertEqual(pb.check_binding([good], pb.SCHEMA_02, MANIFEST)[0], "SCHEMA_MISMATCH")
        with self.assertRaises(ValueError):
            v.make_capsule(kind=m["kind"], subject_id="s", claim="c", declared={}, observed={}, differential={},
                           sources={}, measurement_state="CONFIRMED", limitations=[], observed_at="2026-11-22T00:00:00Z",
                           provisions=[dict(good, provision_sha256="0" * 64)])

    def test_map_not_pinned_to_the_manifest_fails_closed(self):
        tampered = json.loads(json.dumps(PMAP))
        tampered["corpus_root"] = "0" * 64
        with tempfile.TemporaryDirectory() as d:
            for rel, doc in ((pb.MAP_PATH, tampered), (pb.MANIFEST_PATH, MANIFEST)):
                p = pathlib.Path(d) / rel
                p.parent.mkdir(parents=True, exist_ok=True)
                p.write_text(json.dumps(doc))
            with self.assertRaises(ValueError):
                pb.load(d)
            self.assertEqual(pb.load(pathlib.Path(d) / "elsewhere"), (None, None))


if __name__ == "__main__":
    unittest.main()
