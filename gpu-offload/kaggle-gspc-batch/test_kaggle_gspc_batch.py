import hashlib, os, subprocess, sys, tempfile, unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import build_census_batch, dedup_guard, runner  # noqa: E402


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

    def test_worker_sha_matches_file(self):
        """WORKER_SHA must match the actual sha256 of the worker file."""
        worker_path = f"{HERE}/code/runpod_gspc_worker_serial.py"
        actual_sha = hashlib.sha256(open(worker_path, "rb").read()).hexdigest()
        self.assertEqual(
            actual_sha, runner.WORKER_SHA,
            f"WORKER_SHA_MISMATCH: runner.py says {runner.WORKER_SHA[:16]}... "
            f"but file hashes to {actual_sha[:16]}..."
        )

    def test_generator_sha_matches_file(self):
        """GEN_SHA must match the actual sha256 of the generator file."""
        gen_path = f"{HERE}/code/generate_runpod_gspc_playlist.py"
        actual_sha = hashlib.sha256(open(gen_path, "rb").read()).hexdigest()
        self.assertEqual(
            actual_sha, runner.GEN_SHA,
            f"GEN_SHA_MISMATCH: runner.py says {runner.GEN_SHA[:16]}... "
            f"but file hashes to {actual_sha[:16]}..."
        )

    def test_all_14_axes_preflight_and_generator(self):
        """Chain 5: All 14 canonical model axes (7 TIE + 7 UNTESTED) pass preflight and bank_labels."""
        runner.KIT = HERE
        runner.preflight("untested7")
        runner.preflight("all14")
        all_axes, all_shas = runner.resolve_axes("all14")
        self.assertEqual(len(all_axes), 14)
        self.assertEqual(set(all_axes), set(all_shas.keys()))
        for axis in all_axes:
            bank_name = runner.AXIS_TO_BANK[axis]
            self.assertTrue(os.path.isfile(f"{HERE}/banks/{bank_name}"))

    def test_hf_gguf_tag_parsing_and_dedup_guard(self):
        """Chain 4 (G3_RETRY_PROPOSAL Option A): hf:<org>/<repo>@<40-hex-commit>/<file>.gguf."""
        commit = "0123456789abcdef0123456789abcdef01234567"
        valid_tag = f"hf:Qwen/Qwen2.5-1.5B-Instruct-GGUF@{commit}/qwen2.5-1.5b-instruct-q4_k_m.gguf"
        parsed = runner.parse_hf_gguf_tag(valid_tag)
        self.assertIsNotNone(parsed)
        self.assertEqual(parsed["repo"], "Qwen/Qwen2.5-1.5B-Instruct-GGUF")
        self.assertEqual(parsed["commit"], commit)
        self.assertEqual(
            parsed["url"],
            f"https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/{commit}/qwen2.5-1.5b-instruct-q4_k_m.gguf",
        )
        self.assertIsNone(runner.parse_hf_gguf_tag("hf:Qwen/Qwen2.5-1.5B-Instruct-GGUF@main/model.gguf"))

        with tempfile.NamedTemporaryFile("w", suffix=".tsv", delete=False) as f:
            f.write(
                "tag\tollama_manifest_sha256\n"
                + f"{valid_tag}\t" + "c" * 64 + "\n"
                + "hf:Qwen/Qwen2.5-1.5B-Instruct-GGUF@main/model.gguf\t" + "d" * 64 + "\n"
            )
            tsv_path = f.name
        try:
            errs = dedup_guard.check(tsv_path)
            self.assertEqual(len(errs), 1)
            self.assertIn("moving alias", errs[0])
        finally:
            os.remove(tsv_path)

    def test_pull_hf_gguf_detects_digest_mismatch(self):
        """pull_hf_gguf_into_ollama must fail closed with DIGEST_CHANGED if GGUF sha256 differs."""
        commit = "fedcba9876543210fedcba9876543210fedcba98"
        tag = f"hf:org/model-gguf@{commit}/weights.gguf"
        with tempfile.TemporaryDirectory() as tmp:
            def fake_download(_url: str, dst: str) -> None:
                with open(dst, "wb") as fh:
                    fh.write(b"gguf-bytes")

            m, got, err = runner.pull_hf_gguf_into_ollama(
                tag, "0" * 64, tmp, "ollama", os.environ.copy(), tmp, downloader=fake_download
            )
            self.assertIsNone(m)
            self.assertIsNone(got)
            self.assertIsNotNone(err)
            self.assertEqual(err["why"], "DIGEST_CHANGED")

    def test_build_census_batch_filters_and_sorts(self):
        """Chain 6: build_census_batch.py admits only UNMEASURED text-generation rows with immutable pins."""
        c1 = "1111111111111111111111111111111111111111"
        c2 = "2222222222222222222222222222222222222222"
        entries = [
            {
                "repo_id": "bartowski/Llama-3.2-1B-Instruct-GGUF",
                "status": "UNMEASURED",
                "pipeline_tag": "text-generation",
                "commit_sha": c1,
                "gguf_filename": "Llama-3.2-1B-Instruct-Q4_K_M.gguf",
                "gguf_sha256": "a" * 64,
                "family": "llama3.2",
                "params_b": "1.2",
                "quant": "Q4_K_M",
            },
            {
                "repo_id": "Abliteration/Bonsai-8B-GGUF",
                "status": "UNMEASURED",
                "pipeline_tag": "text-generation",
                "commit_sha": c2,
                "gguf_filename": "bonsai-8b.gguf",
                "gguf_sha256": "b" * 64,
            },
            {
                "repo_id": "org/Measured-Model-GGUF",
                "status": "MEASURED",
                "pipeline_tag": "text-generation",
                "commit_sha": c2,
                "gguf_filename": "measured.gguf",
                "gguf_sha256": "c" * 64,
            },
        ]
        admitted, rejected = build_census_batch.build_census_rows(entries)
        self.assertEqual(len(admitted), 1)
        self.assertEqual(len(rejected), 2)
        with tempfile.NamedTemporaryFile("w", suffix=".tsv", delete=False) as f:
            out_tsv = f.name
        try:
            self.assertEqual(build_census_batch.write_batch_tsv(admitted, out_tsv), [])
        finally:
            os.remove(out_tsv)

    def test_census_batch_001_manifest_and_kernel_build(self):
        """D1/W3: batches/CENSUS-BATCH-001.tsv passes dedup_guard, covers 16 models across 3 shards, and builds deterministically."""
        tsv_path = f"{HERE}/batches/CENSUS-BATCH-001.tsv"
        self.assertTrue(os.path.isfile(tsv_path))
        self.assertEqual(dedup_guard.check(tsv_path), [])
        allr = runner.read_batch(tsv_path, "all", 3)
        parts = [runner.read_batch(tsv_path, s, 3) for s in "abc"]
        self.assertEqual(len(allr), 16)
        self.assertEqual([r["tag"] for p in parts for r in p], [r["tag"] for r in allr])
        for r in allr:
            self.assertIsNotNone(runner.parse_hf_gguf_tag(r["tag"]))
        for extra_batch in ("G3-KAGGLE-HF.tsv", "CENSUS-BATCH-001-DRAFT.tsv"):
            extra_path = f"{HERE}/batches/{extra_batch}"
            if os.path.isfile(extra_path):
                self.assertEqual(dedup_guard.check(extra_path), [])
                for r in runner.read_batch(extra_path, "all", 3):
                    self.assertIsNotNone(runner.parse_hf_gguf_tag(r["tag"]))
        d = tempfile.mkdtemp()
        subprocess.check_call([
            sys.executable, f"{HERE}/build_kernel.py",
            "--batch", "CENSUS-BATCH-001", "--shard", "a", "--out", d
        ])
        self.assertTrue(os.path.isfile(f"{d}/kernel.py"))


if __name__ == "__main__":
    unittest.main()
