#!/usr/bin/env python3
import importlib.util
import json
import subprocess
import tempfile
import unittest
from pathlib import Path


HERE = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location(
    "runpod_reviewed_control", HERE / "runpod_reviewed_control.py"
)
control = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(control)


def call(*args: str, cwd: Path) -> str:
    return subprocess.run(args, cwd=cwd, text=True, capture_output=True, check=True).stdout.strip()


class ReviewedControlTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        root = Path(self.tmp.name)
        self.remote = root / "remote.git"
        self.seed = root / "seed"
        self.repo = root / "repo"
        call("git", "init", "--bare", str(self.remote), cwd=root)
        call("git", "init", "-b", "master", str(self.seed), cwd=root)
        call("git", "config", "user.email", "test@example.invalid", cwd=self.seed)
        call("git", "config", "user.name", "test", cwd=self.seed)
        (self.seed / "scripts/pod-loops").mkdir(parents=True)
        self._write_dispatcher()
        call("git", "add", ".", cwd=self.seed)
        call("git", "commit", "-m", "initial", cwd=self.seed)
        call("git", "remote", "add", "origin", str(self.remote), cwd=self.seed)
        call("git", "push", "-u", "origin", "master", cwd=self.seed)
        call("git", "symbolic-ref", "HEAD", "refs/heads/master", cwd=self.remote)
        call("git", "clone", str(self.remote), str(self.repo), cwd=root)
        self.allowed = {str(self.remote)}
        self.report = root / "report.json"
        self.lock = root / "control.lock"

    def tearDown(self):
        self.tmp.cleanup()

    def _write_dispatcher(self):
        script = self.seed / "scripts/pod-loops/commission-dispatch.sh"
        script.write_text(
            "#!/bin/bash\n"
            "set -eu\n"
            "rev=$(git -C \"$CONTROL_REPO\" rev-parse HEAD)\n"
            f"python3 -c 'import json; json.dump({{\"schema\":\"csoai.runpod-commission-dispatch/0.1\",\"source_revision\":\"'$rev'\",\"admitted\":[{{\"subject\":\"private\"}}],\"refused\":[{{\"subject\":\"private\",\"reason\":\"model-not-installed\"}}],\"created\":1,\"already_present\":2}},open(\"{self.tmp.name}/report.json\",\"w\"))'\n",
            encoding="utf-8",
        )

    def run_control(self, apply=False):
        return control.run(
            self.repo,
            apply=apply,
            report_path=self.report,
            lock_path=self.lock,
            allowed_origins=self.allowed,
        )

    def test_dry_run_is_default_shape_and_does_not_dispatch(self):
        result = self.run_control()
        self.assertEqual(result["state"], "DRY_RUN_OK")
        self.assertFalse(result["dispatch_attempted"])
        self.assertFalse(result["restart_attempted"])
        self.assertFalse(result["secrets_read"])
        self.assertFalse(self.report.exists())

    def test_refuses_dirty_checkout(self):
        (self.repo / "dirty.txt").write_text("no")
        with self.assertRaisesRegex(control.Refusal, "dirty"):
            self.run_control(apply=True)
        self.assertFalse(self.report.exists())

    def test_refuses_noncanonical_origin(self):
        with self.assertRaisesRegex(control.Refusal, "canonical"):
            control.run(
                self.repo,
                apply=False,
                report_path=self.report,
                lock_path=self.lock,
                allowed_origins={"https://example.invalid/wrong.git"},
            )

    def test_apply_deploys_reviewed_master_dispatches_and_sanitizes(self):
        (self.seed / "reviewed.txt").write_text("reviewed")
        call("git", "add", ".", cwd=self.seed)
        call("git", "commit", "-m", "reviewed", cwd=self.seed)
        call("git", "push", "origin", "master", cwd=self.seed)
        target = call("git", "rev-parse", "HEAD", cwd=self.seed)

        result = self.run_control(apply=True)
        self.assertEqual(result["state"], "APPLIED_AND_DISPATCHED")
        self.assertEqual(result["deployed_revision"], target)
        self.assertEqual(call("git", "rev-parse", "HEAD", cwd=self.repo), target)
        self.assertEqual(result["telemetry"]["admitted_count"], 1)
        self.assertEqual(result["telemetry"]["refused_count"], 1)
        self.assertEqual(
            result["telemetry"]["refusal_reason_counts"], {"model-not-installed": 1}
        )
        rendered = json.dumps(result)
        self.assertNotIn("private", rendered)
        self.assertFalse(result["restart_attempted"])

    def test_report_must_bind_deployed_revision(self):
        self.report.write_text(
            json.dumps(
                {
                    "schema": "csoai.runpod-commission-dispatch/0.1",
                    "source_revision": "0" * 40,
                    "admitted": [],
                    "refused": [],
                    "created": 0,
                    "already_present": 0,
                }
            )
        )
        with self.assertRaisesRegex(control.Refusal, "not bound"):
            control.sanitize_report(self.report, "1" * 40)


if __name__ == "__main__":
    unittest.main()
