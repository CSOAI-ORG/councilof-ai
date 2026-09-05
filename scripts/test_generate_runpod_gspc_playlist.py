#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

HERE = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location(
    "generate_runpod_gspc_playlist", HERE / "generate_runpod_gspc_playlist.py"
)
assert SPEC and SPEC.loader
generator = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = generator
SPEC.loader.exec_module(generator)


class PlaylistGeneratorTests(unittest.TestCase):
    def test_builds_every_axis_with_byte_and_model_pins(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            bank_dir = root / "banks"
            manifest_root = root / "manifests"
            jobs_dir = root / "jobs"
            output_root = root / "out"
            bank_dir.mkdir()
            for _, filename in generator.AXES:
                (bank_dir / filename).write_text(
                    json.dumps({"text": "one", "expected": "YES"})
                    + "\n"
                    + json.dumps({"text": "two", "expected": "NO"})
                    + "\n",
                    encoding="utf-8",
                )

            model = "qwen:test"
            manifest = generator.model_manifest_path(manifest_root, model)
            manifest.parent.mkdir(parents=True)
            manifest.write_bytes(b"immutable manifest")
            digest = generator.sha256_file(manifest)
            args = generator.parser().parse_args(
                [
                    "--bank-dir",
                    str(bank_dir),
                    "--workspace-root",
                    str(root),
                    "--model-manifest-root",
                    str(manifest_root),
                    "--jobs-dir",
                    str(jobs_dir),
                    "--output-root",
                    str(output_root),
                    "--models",
                    model,
                ]
            )
            with mock.patch.object(
                generator, "ollama_digests", return_value={model: digest}
            ):
                jobs = generator.build_configs(args)

            self.assertEqual(len(jobs), len(generator.AXES))
            self.assertIn("safety", jobs[0][0].name)
            for path, config in jobs:
                self.assertEqual(
                    config["expected_bank_sha256"],
                    generator.sha256_file(Path(config["bank"])),
                )
                self.assertEqual(
                    config["expected_model_manifest_digest"], f"sha256:{digest}"
                )
                self.assertEqual(config["allowed_labels"], ["NO", "YES"])
                generator.write_exclusive(
                    path, generator.canonical_bytes(config) + b"\n"
                )
            with self.assertRaises(FileExistsError):
                generator.write_exclusive(
                    jobs[0][0], generator.canonical_bytes(jobs[0][1]) + b"\n"
                )


if __name__ == "__main__":
    unittest.main()
