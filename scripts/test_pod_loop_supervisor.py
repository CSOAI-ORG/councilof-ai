#!/usr/bin/env python3
"""Fresh-install checks for the Linux pod scheduler/supervisor boundary."""
from __future__ import annotations

import fcntl
import os
import shutil
import signal
import subprocess
import sys
import tempfile
import time
import unittest
from pathlib import Path


SOURCE = Path(__file__).resolve().parent / "pod-loops"


class StaticInstallContractTests(unittest.TestCase):
    def test_scheduler_does_not_require_repository_shells_to_be_executable(self) -> None:
        scheduler = (SOURCE / "scheduler.sh").read_text()
        for name in (
            "watchdog.sh",
            "root-check.sh",
            "bazaar-conformance.sh",
            "settlement-dry.sh",
            "revenue-snapshot.sh",
            "hubcard-refresh.sh",
        ):
            self.assertIn(f'bash "$LOOPS/{name}"', scheduler)
        self.assertNotIn('chmod +x "$LOOPS"/*.sh', (SOURCE / "start.sh").read_text())


@unittest.skipUnless(
    sys.platform.startswith("linux") and Path("/proc").is_dir() and shutil.which("flock"),
    "process-identity integration requires Linux /proc and flock",
)
class LinuxFreshInstallTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.lanes = Path(self.temporary.name) / "lanes"
        self.loops = self.lanes / "loops"
        self.loops.mkdir(parents=True)
        for name in ("lib.sh", "start.sh", "stop.sh", "supervise.sh"):
            shutil.copyfile(SOURCE / name, self.loops / name)
            (self.loops / name).chmod(0o644)
        (self.loops / "scheduler.sh").write_text(
            "#!/bin/bash\n"
            "set -u\n"
            ". \"$(dirname \"$0\")/lib.sh\"\n"
            "exec 8>\"$STATE/scheduler.lock\"\n"
            "flock -n 8 || exit 0\n"
            "while true; do sleep 60 8>&-; done\n"
        )
        (self.loops / "scheduler.sh").chmod(0o644)
        self.environment = os.environ | {"LANES": str(self.lanes)}
        self.supervisor_pid: int | None = None

    def tearDown(self) -> None:
        if self.supervisor_pid is not None:
            try:
                os.kill(self.supervisor_pid, signal.SIGTERM)
            except ProcessLookupError:
                pass

    def run_script(self, name: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            ["bash", str(self.loops / name)],
            env=self.environment,
            capture_output=True,
            text=True,
            timeout=15,
            check=False,
        )

    def test_nonexecutable_fresh_install_reaches_real_scheduler_readiness(self) -> None:
        started = self.run_script("start.sh")
        self.assertEqual(started.returncode, 0, started.stdout + started.stderr)
        self.assertIn("verified scheduler child", started.stdout)
        self.supervisor_pid = int((self.lanes / "state/supervisor.pid").read_text())

        repeated = self.run_script("start.sh")
        self.assertEqual(repeated.returncode, 0, repeated.stdout + repeated.stderr)
        self.assertIn("already running", repeated.stdout)

        stopped = self.run_script("stop.sh")
        self.assertEqual(stopped.returncode, 0, stopped.stdout + stopped.stderr)
        deadline = time.monotonic() + 5
        while time.monotonic() < deadline:
            if subprocess.run(
                ["flock", "-n", str(self.lanes / "state/supervisor.lock"), "true"],
                check=False,
            ).returncode == 0:
                self.supervisor_pid = None
                break
            time.sleep(0.05)
        self.assertIsNone(self.supervisor_pid, "supervisor lease remained held after stop")

    def test_supervisor_lease_without_scheduler_is_not_ready(self) -> None:
        state = self.lanes / "state"
        state.mkdir(parents=True)
        with (state / "supervisor.lock").open("a+") as lease:
            fcntl.flock(lease.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
            result = self.run_script("start.sh")
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("no verified scheduler child is ready", result.stdout)


if __name__ == "__main__":
    unittest.main()
