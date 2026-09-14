import importlib.util
import sys
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


if __name__ == "__main__":
    unittest.main()
