#!/usr/bin/env python3
"""python3 scripts/test_measurement_capsule_layout.py — the generator side of the shared vectors."""
import importlib.util, json, pathlib, unittest

HERE = pathlib.Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("layout", HERE / "measurement_capsule_layout.py")
layout = importlib.util.module_from_spec(spec); spec.loader.exec_module(layout)
FIX = HERE.parent / "functions/_lib/__fixtures__/measurement"


class Vectors(unittest.TestCase):
    def test_endpoint_normalisation_matches_the_typescript_vectors(self):
        for raw, want in json.loads((FIX / "endpoint-vectors.json").read_text())["vectors"]:
            self.assertEqual(layout.normalise_endpoint(raw), want, raw)

    def test_merkle_matches_the_reference_roots(self):
        v = json.loads((FIX / "capsule-vectors.json").read_text())
        for name, ver in (("v02", "0.2"), ("v01", "0.1")):
            for n, root in v[name]["roots_by_size"].items():
                self.assertEqual(layout.merkle_root(ver, v[name]["ids"][: int(n)]), root, (name, n))

    def test_bundle_shards_are_complete(self):
        files = json.loads((FIX / "layout-bundle.json").read_text())["files"]
        shards = [k for k in files if "/endpoints/" in k]
        self.assertEqual(len(shards), 256)


if __name__ == "__main__":
    unittest.main()
