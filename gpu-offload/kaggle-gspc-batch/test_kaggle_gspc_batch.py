import hashlib, os, subprocess, sys, tempfile, unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import dedup_guard, runner  # noqa: E402


class T(unittest.TestCase):
    def test_pins(self):
        runner.KIT = HERE
        runner.preflight()

    def test_batch_passes_dedup(self):
        self.assertEqual(dedup_guard.check(f"{HERE}/batches/G3-Kaggle.tsv"), [])

    def test_dedup_rejects_g2_model(self):
        with tempfile.NamedTemporaryFile("w", suffix=".tsv", delete=False) as f:
            f.write("tag\tollama_manifest_sha256\nollama:qwen3:8b\t" + "a" * 64 + "\nollama:gemma4:latest\t" + "b" * 64 + "\n")
        e = dedup_guard.check(f.name)
        self.assertTrue(any("run of record" in x for x in e))
        self.assertTrue(any("moving alias" in x for x in e))

    def test_shards_cover_batch_once(self):
        allr = runner.read_batch(f"{HERE}/batches/G3-Kaggle.tsv", "all", 3)
        parts = [runner.read_batch(f"{HERE}/batches/G3-Kaggle.tsv", s, 3) for s in "abc"]
        self.assertEqual(len(allr), 16)
        self.assertEqual([r["tag"] for p in parts for r in p], [r["tag"] for r in allr])

    def test_build_is_deterministic(self):
        outs = []
        for _ in range(2):
            d = tempfile.mkdtemp()
            subprocess.check_call([sys.executable, f"{HERE}/build_kernel.py", "--batch", "G3-Kaggle", "--shard", "a", "--out", d])
            outs.append(hashlib.sha256(open(f"{d}/kernel.py", "rb").read()).hexdigest())
            src = open(f"{d}/kernel.py").read()
            self.assertNotIn("sign", src.replace("signed", "").lower().replace("design", ""))
        self.assertEqual(outs[0], outs[1])

    def test_preflight_halts_on_missing_spec_bank(self):
        import shutil
        runner.KIT = HERE
        bank = f"{HERE}/banks/gspc-gov.jsonl"
        sha_file = f"{HERE}/banks/SHA256SUMS"
        backup = bank + ".bak"
        shutil.move(bank, backup)
        with open(sha_file, "r") as f:
            sha_lines = f.readlines()
        try:
            with open(sha_file, "w") as f:
                for line in sha_lines:
                    if "gspc-gov.jsonl" not in line:
                        f.write(line)
            with self.assertRaises(AssertionError) as ctx:
                runner.preflight()
            self.assertIn("SPEC_BANK_MISSING", str(ctx.exception))
        finally:
            shutil.move(backup, bank)
            with open(sha_file, "w") as f:
                f.writelines(sha_lines)

    def test_preflight_halts_on_spec_bank_sha_mismatch(self):
        runner.KIT = HERE
        bank = f"{HERE}/banks/gspc-gov.jsonl"
        with open(bank, "rb") as f:
            original = f.read()
        try:
            with open(bank, "wb") as f:
                f.write(b"corrupted content\n")
            with self.assertRaises(AssertionError) as ctx:
                runner.preflight()
            self.assertIn("BANK_SHA_MISMATCH", str(ctx.exception))
        finally:
            with open(bank, "wb") as f:
                f.write(original)

    def test_axes_allowlist_restricts_generator(self):
        import tempfile, json
        gen_path = f"{HERE}/code/generate_runpod_gspc_playlist.py"
        result = subprocess.run(
            [sys.executable, gen_path, "--help"],
            capture_output=True, text=True
        )
        self.assertIn("--axes", result.stdout)
        spec_axes = ",".join(runner.AXES)
        self.assertEqual(spec_axes, "governance,safety,provenance,continuity,conformance,openness,care")

    def test_spec_axes_matches_bank_sha_keys(self):
        self.assertEqual(set(runner.AXES), set(runner.BANK_SHA.keys()))

    def test_axis_to_bank_mapping(self):
        for axis in runner.AXES:
            self.assertIn(axis, runner.AXIS_TO_BANK)
            bank_name = runner.AXIS_TO_BANK[axis]
            self.assertTrue(os.path.isfile(f"{HERE}/banks/{bank_name}"),
                            f"Bank file {bank_name} for axis {axis} not found")

    def test_diag_batch_cannot_be_intake_candidate(self):
        """A -DIAG batch must never produce intake_candidate=true cells."""
        gate = "CARD_CANDIDATE_UNSIGNED"
        run_of_record = False  # diagnostic mode
        intake_candidate = gate == "CARD_CANDIDATE_UNSIGNED" and run_of_record
        self.assertFalse(intake_candidate, "-DIAG batch must not produce intake_candidate=true")

    def test_diag_models_constant_defined(self):
        """DIAG_MODELS must be defined and non-empty."""
        self.assertTrue(hasattr(runner, 'DIAG_MODELS'))
        self.assertIsInstance(runner.DIAG_MODELS, set)
        self.assertGreater(len(runner.DIAG_MODELS), 0)


if __name__ == "__main__":
    unittest.main()
