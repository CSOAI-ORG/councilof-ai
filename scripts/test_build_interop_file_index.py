#!/usr/bin/env python3
"""test_build_interop_file_index.py — the producer must reproduce the published index, and it
must refuse to publish a wrong one.

WHY THIS TEST EXISTS. The published index was produced by scripts/build-interop-file-index.py,
but the builder did not exclude its own output from the measurement: the exclusion lived in the
CALLER (scripts/rebuild-interop-file-index.py deleted the previous index before running it).
So the builder as documented could NOT reproduce the published index -- run it on a checked-out
tree and it produced one extra row, a self-row, and a different file. MEASURED 2026-11-07: the
committed artefact was a 16,327-row measurement whose 16,327 digests all matched the bytes on
disk, while the builder over the same corpus produced 16,328 rows.

It also labelled every path "pages" when the exclusions manifest was missing, which is a false
statement about how a door behaves -- the one thing this index must not do.

These are the failure modes this test pins. Each one asserts the FIXED behaviour.
"""
import json, os, shutil, subprocess, sys, tempfile, unittest

HERE = os.path.dirname(os.path.abspath(__file__))
BUILDER = os.path.join(HERE, "build-interop-file-index.py")

EXCLUSIONS = {
    "schema": "csoai.deploy-exclusions/0.2",
    "entries": [
        {"path": "interop/ots", "kind": "dir"},
        {"path": "interop/mill-cards-unsigned", "kind": "dir"},
        {"path": "cards", "kind": "dir"},
    ],
}


def build(corpus, out, exclusions, *extra):
    return subprocess.run(
        [sys.executable, BUILDER, corpus, out, exclusions, *extra],
        capture_output=True, text=True,
    )


class BuildInteropFileIndex(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp(prefix="interop-index-test-")
        self.corpus = os.path.join(self.tmp, "corpus")
        self.excl = os.path.join(self.tmp, "deploy-exclusions.json")
        os.makedirs(os.path.join(self.corpus, "ots"))
        os.makedirs(os.path.join(self.corpus, "mill"))
        with open(os.path.join(self.corpus, "readme.md"), "w") as f:
            f.write("readme\n")
        with open(os.path.join(self.corpus, "ots", "proof.ots.invalid"), "wb") as f:
            f.write(b"retired-bytes")
        with open(os.path.join(self.corpus, "mill", "card.json"), "w") as f:
            f.write("{}\n")
        with open(self.excl, "w") as f:
            json.dump(EXCLUSIONS, f)

    def tearDown(self):
        shutil.rmtree(self.tmp, ignore_errors=True)

    def test_the_index_does_not_index_itself(self):
        out = os.path.join(self.tmp, "file-index.json")
        # A previous index sits in the corpus root, exactly as in the repository.
        with open(os.path.join(self.corpus, "file-index.json"), "w") as f:
            f.write('{"files":[]}')
        res = build(self.corpus, out, self.excl)
        self.assertEqual(res.returncode, 0, res.stderr)
        with open(out) as f:
            doc = json.load(f)
        paths = [r["path"] for r in doc["files"]]
        self.assertNotIn("/interop/file-index.json", paths,
                         "the index must not index its own previous output")
        self.assertEqual(paths, ["/interop/mill/card.json",
                                 "/interop/ots/proof.ots.invalid",
                                 "/interop/readme.md"])

    def test_a_mirror_directory_is_labelled_hf_mirror(self):
        out = os.path.join(self.tmp, "file-index.json")
        res = build(self.corpus, out, self.excl)
        self.assertEqual(res.returncode, 0, res.stderr)
        with open(out) as f:
            doc = json.load(f)
        served = {r["path"]: r["served"] for r in doc["files"]}
        self.assertEqual(served["/interop/ots/proof.ots.invalid"], "hf-mirror")
        self.assertEqual(served["/interop/mill/card.json"], "pages")
        self.assertEqual(doc["counts"]["by_served"], {"pages": 2, "hf-mirror": 1})

    def test_it_refuses_to_build_without_the_exclusions_manifest(self):
        out = os.path.join(self.tmp, "file-index.json")
        res = build(self.corpus, out, os.path.join(self.tmp, "absent.json"))
        self.assertEqual(res.returncode, 2, res.stdout + res.stderr)
        self.assertFalse(os.path.exists(out),
                         "no index may be written when the served labels cannot be known")
        self.assertIn("served labels", res.stderr)

    def test_check_passes_when_the_index_describes_the_corpus(self):
        out = os.path.join(self.tmp, "file-index.json")
        self.assertEqual(build(self.corpus, out, self.excl).returncode, 0)
        res = build(self.corpus, out, self.excl, "--check")
        self.assertEqual(res.returncode, 0, res.stdout + res.stderr)
        self.assertIn("OK", res.stdout)

    def test_check_fails_when_the_corpus_moved_without_the_index(self):
        out = os.path.join(self.tmp, "file-index.json")
        self.assertEqual(build(self.corpus, out, self.excl).returncode, 0)
        with open(os.path.join(self.corpus, "readme.md"), "w") as f:
            f.write("readme, changed\n")
        res = build(self.corpus, out, self.excl, "--check")
        self.assertEqual(res.returncode, 1, res.stdout + res.stderr)
        self.assertIn("changed", res.stdout)
        self.assertIn("/interop/readme.md", res.stdout)

    def test_check_ignores_as_of_and_source_commit(self):
        out = os.path.join(self.tmp, "file-index.json")
        self.assertEqual(build(self.corpus, out, self.excl, "abc123").returncode, 0)
        with open(out) as f:
            doc = json.load(f)
        doc["as_of"] = "1999-01-01T00:00:00Z"
        doc["source_commit"] = "0000000"
        with open(out, "w") as f:
            json.dump(doc, f)
        res = build(self.corpus, out, self.excl, "--check")
        self.assertEqual(res.returncode, 0, res.stdout + res.stderr)

    def test_check_reports_an_added_and_a_removed_path(self):
        out = os.path.join(self.tmp, "file-index.json")
        self.assertEqual(build(self.corpus, out, self.excl).returncode, 0)
        os.remove(os.path.join(self.corpus, "mill", "card.json"))
        with open(os.path.join(self.corpus, "extra.json"), "w") as f:
            f.write("{}\n")
        res = build(self.corpus, out, self.excl, "--check")
        self.assertEqual(res.returncode, 1, res.stdout + res.stderr)
        self.assertIn("added", res.stdout)
        self.assertIn("removed", res.stdout)


if __name__ == "__main__":
    unittest.main()
