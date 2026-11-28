#!/usr/bin/env python3
"""python3 scripts/test_measurement_capsule_layout.py — the generator side of the shared vectors."""
import importlib.util, json, pathlib, subprocess, sys, tempfile, unittest

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

    def test_chained_daily_index_lays_out_under_v02(self):
        self.assertEqual(layout.INDEX_SCHEMAS["csoai.measurement-capsule-index/0.3"], "0.2")
        self.assertNotIn("csoai.measurement-capsule-index/0.4", layout.INDEX_SCHEMAS)

    def test_bundle_shards_are_complete(self):
        files = json.loads((FIX / "layout-bundle.json").read_text())["files"]
        shards = [k for k in files if "/endpoints/" in k]
        self.assertEqual(len(shards), 256)


    def test_download_index_uses_public_paths_and_preserves_signed_bytes(self):
        rows = []
        with tempfile.TemporaryDirectory() as tmp:
            folder = pathlib.Path(tmp)
            for ordinal in range(2):
                batch = folder / str(ordinal)
                batch.mkdir()
                cid = f"{ordinal + 1:064x}"
                root = layout.merkle_root("0.2", [cid])
                capsule_bytes = json.dumps({"capsule_id": cid}).encode() + b"\n"
                (batch / "capsules.jsonl").write_bytes(capsule_bytes)
                record = {
                    "schema": "csoai.measurement-capsule-batch/0.2", "merkle_root": root,
                    "capsules_file": {"path": "capsules.jsonl", "sha256": layout.sha(capsule_bytes)},
                }
                raw = json.dumps(record).encode()
                (batch / "record.json").write_bytes(raw)
                rows.append({"dir": str(batch), "adapter": "replay", "merkle_root": root, "record_sha256": layout.sha(raw)})
            root = layout.merkle_root("0.2", [f"{n:064x}" for n in (1, 2)])
            index_bytes = json.dumps({"schema": "csoai.measurement-capsule-index/0.3", "index_root": root, "batches": rows}).encode()
            (folder / "index.json").write_bytes(index_bytes)
            (folder / "index.signed.json").write_bytes(b"unchanged sidecar")
            args = [sys.executable, str(HERE / "measurement_capsule_layout.py"), "--index", str(folder / "index.json")]
            for flag in ([], ["--no-capsules"]):
                with self.subTest(flags=flag):
                    output = folder / ("no-archives" if flag else "full")
                    subprocess.run(args + ["--out", str(output)] + flag, capture_output=True, check=True)
                    vdir = output / "v0.2"
                    self.assertEqual((vdir / "index.json").read_bytes(), index_bytes)
                    self.assertEqual((vdir / "index.signed.json").read_bytes(), b"unchanged sidecar")
                    raw = (vdir / "downloads.json").read_text()
                    self.assertNotIn(str(folder), raw)
                    manifest = json.loads(raw)
                    self.assertEqual(manifest["index_sha256"], layout.sha(index_bytes))
                    self.assertEqual(manifest["index_root"], root)
                    self.assertEqual(len(manifest["batches"]), 2)
                    for row, source in zip(manifest["batches"], rows):
                        self.assertEqual(row["batch"], f"replay-{source['merkle_root'][:12]}")
                        self.assertEqual(row["record_sha256"], source["record_sha256"])
                        names = {"record.json", "leaves.json"} | (set() if flag else {"capsules.jsonl"})
                        self.assertEqual(set(row["paths"]), names)
                        for name, path in row["paths"].items():
                            self.assertEqual(path, f"/measurement-capsules/v0.2/{row['batch']}/{name}")
                            self.assertTrue((vdir / row["batch"] / name).is_file())

    def test_layout_rejects_anchor_manifest_mismatches_before_writing(self):
        root = layout.merkle_root("0.2", [])
        index = {"date": "2026-11-26", "schema": "csoai.measurement-capsule-index/0.3",
                 "index_root": root, "batches": []}
        index_raw = json.dumps(index).encode()
        proof_raw = b"timestamp-proof-bytes"
        manifest = {"date": index["date"], "index": {"index_root": root, "sha256": layout.sha(index_raw)},
                    "opentimestamps": {"proof_sha256": layout.sha(proof_raw)}}
        with tempfile.TemporaryDirectory() as tmp:
            folder = pathlib.Path(tmp)
            (folder / "index.json").write_bytes(index_raw)
            proof = folder / "index.json.ots"
            anchors = folder / "anchors.json"
            output = folder / "site"
            args = [sys.executable, str(HERE / "measurement_capsule_layout.py"),
                    "--index", str(folder / "index.json"), "--out", str(output), "--anchors", str(anchors)]
            for field, value, error in (("date", "2026-11-25", "ANCHORS_INDEX_MISMATCH"),
                                        ("index_root", "0" * 64, "ANCHORS_INDEX_MISMATCH"),
                                        ("sha256", "0" * 64, "ANCHORS_INDEX_MISMATCH"),
                                        ("proof_sha256", "0" * 64, "ANCHORS_PROOF_MISMATCH")):
                with self.subTest(field=field):
                    altered = json.loads(json.dumps(manifest))
                    if field == "date":
                        altered[field] = value
                    else:
                        section = "opentimestamps" if field == "proof_sha256" else "index"
                        altered[section][field] = value
                    anchors.write_text(json.dumps(altered))
                    proof.write_bytes(proof_raw)
                    result = subprocess.run(args, capture_output=True, text=True)
                    self.assertNotEqual(result.returncode, 0)
                    self.assertIn(error, result.stderr)
                    self.assertFalse(output.exists())
            anchors.write_text(json.dumps(manifest))
            proof.unlink()
            result = subprocess.run(args, capture_output=True, text=True)
            self.assertIn("ANCHORS_PROOF_MISMATCH", result.stderr)
            self.assertFalse(output.exists())
            proof.write_bytes(proof_raw)
            result = subprocess.run(args, capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual((output / "v0.2" / "index.json.ots").read_bytes(), proof_raw)
            self.assertEqual((output / "v0.2" / "anchors.json").read_bytes(), anchors.read_bytes())
            proof.unlink()
            manifest["opentimestamps"]["proof_sha256"] = None
            anchors.write_text(json.dumps(manifest))
            unsigned_output = folder / "site-without-proof"
            args[args.index(str(output))] = str(unsigned_output)
            result = subprocess.run(args, capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertFalse((unsigned_output / "v0.2" / "index.json.ots").exists())


if __name__ == "__main__":
    unittest.main()
