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


if __name__ == "__main__":
    unittest.main()
