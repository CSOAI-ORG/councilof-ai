import ast
import importlib.util
import re
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

MODULE = Path(__file__).resolve().parent / "hf" / "hf_jobs_mill.py"
spec = importlib.util.spec_from_file_location("hf_jobs_mill", MODULE)
jobs = importlib.util.module_from_spec(spec)
assert spec.loader
spec.loader.exec_module(jobs)


class HfJobsPinsTest(unittest.TestCase):
    def test_job_pins_bank_revision_and_passes_identity_to_mill(self):
        script = jobs.job_script("governance", 1, 0, 1, "csoai/gspc-gov")
        self.assertIn('dataset_info("csoai/gspc-gov").sha', script)
        self.assertIn('revision=revision', script)
        self.assertIn('--bank-dataset csoai/gspc-gov', script)
        self.assertIn('--bank-revision "$(cat mill-in/bank-revision.txt)"', script)


class HfJobsQuotabilityTest(unittest.TestCase):
    """M-P1-7 (2026-10-07): 40 items, a 10-graded floor, and dead/in-flight rows read before the pick."""

    def setUp(self):
        self.script = jobs.job_script("safety", 36, 0, 2, "csoai/gspc-agi")
        self.mill_line = " ".join(
            ln.rstrip("\\").strip() for ln in self.script.split("python3 mill_hub_queue.py", 1)[1].split("\necho", 1)[0].splitlines()
        )

    def test_grades_min_bank_40_not_the_quotability_floor(self):
        self.assertEqual(jobs.ITEMS, 40)
        self.assertIn("--items 40", self.mill_line)
        self.assertNotIn("--items 30", self.script)

    def test_low_yield_routes_become_dead_rows_that_expire(self):
        self.assertIn("--min-graded 10", self.mill_line)
        self.assertIn("--dead mill-in/dead.jsonl", self.mill_line)
        self.assertIn("--dead-max-age-days 14", self.mill_line)

    def test_staged_dead_lists_and_quotable_cells_are_read_before_the_mill_runs(self):
        merge = self.script.index("<<'DEADMERGE'")
        inflight = self.script.index("<<'INFLIGHT'")
        mill = self.script.index("python3 mill_hub_queue.py")
        self.assertLess(merge, mill)
        self.assertLess(inflight, mill)
        self.assertIn('f.startswith("dead/")', self.script)
        self.assertIn('allow_patterns=["safety/*/unsigned-*.json"]', self.script)
        self.assertIn('body["n"] >= 30', self.script)
        self.assertIn("--inflight mill-in/inflight.jsonl", self.mill_line)

    def test_every_embedded_python_block_parses_and_the_shell_parses(self):
        blocks = re.findall(r"<<'(\w+)'\n(.*?)\n\1\n", self.script, re.S)
        names = [name for name, _ in blocks]
        for want in ("FETCH", "DEADMERGE", "INFLIGHT", "UP"):
            self.assertIn(want, names)
        for name, body in blocks:
            if name != "DECODE":
                ast.parse(body)  # a literal newline inside a string would raise here
        with tempfile.NamedTemporaryFile("w", suffix=".sh", delete=False) as fh:
            fh.write(self.script)
        self.assertEqual(subprocess.run(["bash", "-n", fh.name]).returncode, 0)
        Path(fh.name).unlink()


if __name__ == "__main__":
    unittest.main()
