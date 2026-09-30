#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""The published disclosure-completeness sets are what build_records.py makes from their own pinned candidates.

    python3 scripts/measurements/disclosure-completeness/test_build_records.py

For every public/interop/disclosure-completeness-*/ set: rebuild each record from the candidate it carries
(measurement.* plus the candidate fields the record states) and require the published record.json, set.json,
method/adapters.py and verify.py to come back byte for byte. Negative controls: a changed result, a changed input pin
and a changed method sha each fail. Optional: CONSUMER_BLOBS=<dir of blobs named by sha256> also re-runs every
measurement from its input bytes (verify.py --recompute) and requires MATCH, and a tampered result DIFFERS.
"""
import copy, filecmp, glob, importlib.util, json, os, shutil, sys, tempfile, unittest

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
sys.path.insert(0, HERE)
import build_records as B  # noqa: E402

CANDIDATE_DOCTRINE = ("Deterministic facts recomputable from the pinned input bytes. No ranking, no leader, "
                      "not a certification. UNMEASURED stays UNMEASURED. A listing is never adoption.")
CANDIDATE_PUBLICATION = "NOT PUBLISHED. Signing and publication only via the gated board-sign + land step."


def sets():
    return sorted(glob.glob(os.path.join(ROOT, "public", "interop", "disclosure-completeness-*", "set.json")))


def candidates_of(set_dir):
    st = json.load(open(os.path.join(set_dir, "set.json")))
    out = {}
    for r in st["records"]:
        rec = json.load(open(os.path.join(set_dir, r["path"])))
        m = rec["measurement"]
        out[m["measure"]] = {"schema": "csoai.consumer-candidate/0.1", "measure": m["measure"], "candidate_id": m["candidate_id"],
                             "status": "CANDIDATE_UNSIGNED", "kind": "deterministic_fact", "generated_at": rec["computed_at"],
                             "inputs": m["inputs"], "inputs_digest_sha256": m["inputs_digest_sha256"], "method": m["method"],
                             "licence": rec["licence"]["upstream"], "result": m["result"], "unmeasured": m["unmeasured"],
                             "doctrine": CANDIDATE_DOCTRINE, "publication": CANDIDATE_PUBLICATION}
    return st, out


def build_into(tmp, set_dir, cands):
    st = json.load(open(os.path.join(set_dir, "set.json")))
    return B.build(cands, os.path.join(set_dir, "method", "adapters.py"), st["date"], tmp)


class Reproduces(unittest.TestCase):
    def test_at_least_one_set(self):
        self.assertTrue(sets(), "no published disclosure-completeness set")

    def test_published_bytes_rebuild(self):
        for sj in sets():
            d = os.path.dirname(sj)
            st, cands = candidates_of(d)
            with tempfile.TemporaryDirectory() as tmp:
                out = build_into(tmp, d, cands)
                names = ["set.json", "verify.py", os.path.join("method", "adapters.py")] + [r["path"] for r in st["records"]]
                for n in names:
                    self.assertTrue(filecmp.cmp(os.path.join(out, n), os.path.join(d, n), shallow=False), "%s: %s differs" % (st["set"], n))
            self.assertTrue(filecmp.cmp(os.path.join(d, "verify.py"), os.path.join(HERE, "verify.py"), shallow=False),
                            "published verify.py is the repo's verify.py")

    def test_controls_fail(self):
        d = os.path.dirname(sets()[-1])
        st, cands = candidates_of(d)
        some = sorted(cands)[0]
        slug = B.MEASURES[some]["slug"]
        for name, mutate in [("result", lambda c: c["result"].__setitem__("control", 1)),
                             ("input pin", lambda c: c["inputs"][0].__setitem__("sha256", "0" * 64)),
                             ("method sha", lambda c: c["method"].__setitem__("code_sha256", "0" * 64))]:
            cc = copy.deepcopy(cands); mutate(cc[some])
            with tempfile.TemporaryDirectory() as tmp:
                try:
                    out = build_into(tmp, d, cc)
                except SystemExit:
                    continue  # the producer refused: the control holds
                same = filecmp.cmp(os.path.join(out, slug, "record.json"), os.path.join(d, slug, "record.json"), shallow=False)
                self.assertFalse(same, "control '%s' rebuilt identical bytes" % name)

    def test_no_ranking_fields_and_unmeasured_kept(self):
        banned_keys = {"rank", "ranking", "leader", "grade", "score", "winner"}
        def keys(o):
            if isinstance(o, dict):
                for k, v in o.items():
                    yield k; yield from keys(v)
            elif isinstance(o, list):
                for v in o:
                    yield from keys(v)
        for sj in sets():
            d = os.path.dirname(sj)
            st = json.load(open(sj))
            for r in st["records"]:
                rec = json.load(open(os.path.join(d, r["path"])))
                self.assertFalse(banned_keys & set(keys(rec)), "%s carries a ranking field" % r["record_id"])
                if rec["measurement"]["measure"] == "swebench.logs_pointer_share":
                    self.assertEqual(rec["headline"]["logs_pointer_resolves"], "UNMEASURED")
                if rec["measurement"]["measure"] == "openrouter_hf.declared_field_agreement":
                    h = rec["headline"]
                    self.assertEqual(sum(h["context_length"].values()), h["models_naming_a_hf_repo"])
                    self.assertEqual(sum(h["licence"].values()), h["models_naming_a_hf_repo"])


@unittest.skipUnless(os.environ.get("CONSUMER_BLOBS"), "CONSUMER_BLOBS not set: recompute from input bytes skipped")
class Recomputes(unittest.TestCase):
    def test_every_record_recomputes_and_a_tamper_differs(self):
        for sj in sets():
            d = os.path.dirname(sj)
            st = json.load(open(sj))
            spec = importlib.util.spec_from_file_location("dcverify", os.path.join(d, "verify.py"))
            v = importlib.util.module_from_spec(spec); spec.loader.exec_module(v)
            ad = v.load_adapters(os.path.join(d, "method", "adapters.py"), st["method_code_sha256"])
            for r in st["records"]:
                rec = json.load(open(os.path.join(d, r["path"])))
                state, detail = v.recompute(ad, rec, os.environ["CONSUMER_BLOBS"])
                self.assertEqual(state, "MATCH", "%s: %s" % (r["record_id"], detail))
                bad = copy.deepcopy(rec); bad["measurement"]["result"]["control"] = 1
                self.assertEqual(v.recompute(ad, bad, os.environ["CONSUMER_BLOBS"])[0], "DIFFERS")


if __name__ == "__main__":
    unittest.main(verbosity=2)
