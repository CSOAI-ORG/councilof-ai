import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]


class CLITests(unittest.TestCase):
    def cli(self, *args):
        return subprocess.run([sys.executable, "-B", str(ROOT / "main.py"), *map(str, args)],
                              capture_output=True, text=True, timeout=5)

    def test_independent_cli_comparison_and_canonical_consumer(self):
        with tempfile.TemporaryDirectory() as directory:
            paths = []
            for mode in ("baseline", "evidence-aware"):
                result = self.cli("run", "--population", 6, "--intervention", mode)
                self.assertEqual(result.returncode, 0, result.stderr)
                path = Path(directory) / (mode + ".json")
                path.write_text(result.stdout)
                paths.append(path)
            result = self.cli("compare", *paths)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual(json.loads(result.stdout)["new_revoked_A_selection_delta"], -21)
            result = self.cli("events", paths[1])
            self.assertEqual(result.returncode, 0, result.stderr)
            event = json.loads(result.stdout)
            self.assertEqual(event["state"], "UNMEASURED")
            self.assertIsNone(event["value"])
            self.assertIsNone(event["signature"])
            output = Path(directory) / "events.jsonl"
            output.write_text(result.stdout)
            accepted = subprocess.run([sys.executable, "-B", str(ROOT.parent / "evidence-fabric/event.py"),
                                       "validate", str(output)], capture_output=True, text=True, timeout=5)
            self.assertEqual(accepted.returncode, 0, accepted.stdout + accepted.stderr)

    def test_expired_cli_and_refused_export_are_not_success_receipts(self):
        result = self.cli("run", "--permit-expires-tick", 0)
        self.assertEqual(result.returncode, 0, result.stderr)
        value = json.loads(result.stdout)
        self.assertIn("does not test evidence handling", value["core"]["lesson"])
        with tempfile.TemporaryDirectory() as directory:
            value["core"]["lesson"] = "faked success"
            path = Path(directory) / "changed.json"
            path.write_text(json.dumps(value))
            result = self.cli("events", path)
            self.assertEqual(result.returncode, 2)
            self.assertEqual(result.stdout, "")
            self.assertNotIn("Traceback", result.stderr)

    def test_nonregular_and_oversized_inputs_refuse_without_hanging(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for target in (root, root / "oversized.json"):
                if target != root:
                    target.write_bytes(b"x" * (2 * 1024 * 1024 + 1))
                result = self.cli("verify", target)
                self.assertEqual(result.returncode, 2)
                self.assertEqual(result.stdout, "")
            if hasattr(os, "mkfifo"):
                pipe = root / "pipe"
                os.mkfifo(pipe)
                result = self.cli("verify", pipe)
                self.assertEqual(result.returncode, 2)
                self.assertIn("regular bundle file", result.stderr)
