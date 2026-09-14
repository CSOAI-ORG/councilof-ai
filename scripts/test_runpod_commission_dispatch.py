#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import http.server
import importlib.util
import json
import os
import subprocess
import sys
import tempfile
import threading
import unittest
from pathlib import Path
from unittest import mock
sys.path.insert(0, str(Path(__file__).resolve().parent))

SCRIPTS = Path(__file__).resolve().parent
REPO = SCRIPTS.parent
DISPATCH_SH = SCRIPTS / "pod-loops" / "commission-dispatch.sh"

import generate_runpod_gspc_playlist as playlist
import runpod_commission_dispatch as dispatch


class DispatchTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.banks = self.root / "banks"
        self.manifests = self.root / "manifests"
        self.jobs = self.root / "jobs"
        self.out = self.root / "out"
        self.banks.mkdir()
        for _, filename in playlist.AXES:
            (self.banks / filename).write_text(
                json.dumps({"prompt": "one", "expected": "YES"}) + "\n" +
                json.dumps({"prompt": "two", "expected": "NO"}) + "\n",
                encoding="utf-8",
            )
        self.model = "llama3.2:3b"
        manifest = playlist.model_manifest_path(self.manifests, self.model)
        manifest.parent.mkdir(parents=True)
        manifest.write_bytes(b"model manifest")
        self.digest = hashlib.sha256(b"model manifest").hexdigest()
        self.args = argparse.Namespace(
            bank_dir=self.banks,
            workspace_root=self.root,
            model_manifest_root=self.manifests,
            jobs_dir=self.jobs,
            output_root=self.out,
            ollama_url="http://127.0.0.1:11434",
            interval_seconds=86400,
            disk_low_water_bytes=100,
            request_timeout_seconds=10,
            max_tokens=64,
        )

    def tearDown(self) -> None:
        self.temp.cleanup()

    def feed(self, records: list[dict], schema: str = "csoai.commissions/0.2") -> dict:
        return {"schema": schema, "status": "MEASURED", "records_unreadable": 0, "commissions": records}

    def queue_feed(self, records: list[dict]) -> dict:
        return {"schema": "csoai.commission-queue/0.1", "status": "MEASURED", "records_unreadable": 0, "rows": records}

    def receipt(self, char: str) -> str:
        return char * 64

    def test_axis_specific_local_model_creates_one_pinned_idempotent_job(self) -> None:
        feed = self.feed([{"subject": self.model, "axis": "governance", "receipt_sha": self.receipt("a")}])
        writes, report = dispatch.build_dispatch(feed, self.args, {self.model: self.digest})
        self.assertEqual(len(writes), 1)
        self.assertEqual(report["admitted"][0]["axis"], "governance")
        self.assertEqual(report["refused"], [])
        self.assertEqual(dispatch.materialize(writes), (1, 0))
        self.assertEqual(dispatch.materialize(writes), (0, 1))
        config = json.loads(writes[0][0].read_text())
        self.assertEqual(config["expected_model_manifest_digest"], f"sha256:{self.digest}")
        self.assertEqual(config["expected_bank_sha256"], playlist.sha256_file(Path(config["bank"])))

    def test_subject_wide_dedupes_receipts_and_emits_all_model_axes(self) -> None:
        feed = self.feed([
            {"subject": self.model, "axis": None, "receipt_sha": self.receipt("a")},
            {"subject": self.model, "axis": "governance", "receipt_sha": self.receipt("b")},
        ])
        writes, report = dispatch.build_dispatch(feed, self.args, {self.model: self.digest})
        self.assertEqual(len(writes), len(playlist.AXES))
        self.assertEqual(len(report["admitted"]), len(playlist.AXES))

    def test_v02_uses_typed_model_and_refuses_unfulfillable_sku(self) -> None:
        feed = self.feed([
            {"subject": "friendly-display-label", "model": self.model, "fulfillment": "QUEUED", "axis": "governance", "receipt_sha": self.receipt("a")},
            {"subject": "payai-wrapper-0.01", "model": None, "fulfillment": "UNFULFILLABLE", "axis": None, "receipt_sha": self.receipt("b")},
        ])
        writes, report = dispatch.build_dispatch(feed, self.args, {self.model: self.digest})
        self.assertEqual(len(writes), 1)
        self.assertEqual(report["admitted"][0]["subject"], self.model)
        self.assertEqual(report["refused"][0]["reason"], "UNFULFILLABLE")

    def test_typed_queue_uses_model_and_skips_nonqueued_rows(self) -> None:
        feed = self.queue_feed([
            {"subject": "friendly-display-label", "model": self.model, "fulfillment": "QUEUED", "status": "QUEUED", "axis": "governance", "receipt_sha": self.receipt("a")},
            {"subject": self.model, "model": self.model, "fulfillment": "RETRIEVABLE", "status": "QUEUED", "axis": "safety", "receipt_sha": self.receipt("b")},
        ])
        writes, report = dispatch.build_dispatch(feed, self.args, {self.model: self.digest})
        self.assertEqual(len(writes), 1)
        self.assertEqual(report["admitted"][0]["subject"], self.model)
        self.assertEqual(report["admitted"][0]["axis"], "governance")

    def test_v02_skips_retrievable_records(self) -> None:
        feed = self.feed([
            {"subject": self.model, "model": self.model, "fulfillment": "RETRIEVABLE", "axis": "governance", "receipt_sha": self.receipt("a")},
        ])
        writes, report = dispatch.build_dispatch(feed, self.args, {self.model: self.digest})
        self.assertEqual(writes, [])
        self.assertEqual(report["refused"], [])

    def test_v01_remains_compatible(self) -> None:
        feed = self.feed([{"subject": self.model, "axis": "governance", "receipt_sha": self.receipt("a")}], schema="csoai.commissions/0.1")
        writes, _ = dispatch.build_dispatch(feed, self.args, {self.model: self.digest})
        self.assertEqual(len(writes), 1)

    def test_uninstalled_model_and_unsupported_axis_are_explicitly_refused(self) -> None:
        feed = self.feed([
            {"subject": "missing:latest", "axis": "governance", "receipt_sha": self.receipt("a")},
            {"subject": self.model, "axis": "regulation", "receipt_sha": self.receipt("b")},
        ])
        writes, report = dispatch.build_dispatch(feed, self.args, {self.model: self.digest})
        self.assertEqual(writes, [])
        self.assertEqual({row["reason"] for row in report["refused"]}, {"MODEL_NOT_INSTALLED", "UNSUPPORTED_AXIS"})

    def test_bad_feed_and_bad_receipt_fail_closed(self) -> None:
        with self.assertRaises(playlist.GenerationError):
            dispatch.build_dispatch({"status": "MEASURED"}, self.args, {})
        with self.assertRaises(playlist.GenerationError):
            dispatch.build_dispatch(
                self.feed([{"subject": self.model, "axis": "governance", "receipt_sha": "bad"}]),
                self.args,
                {self.model: self.digest},
            )


def _load_worker():
    spec = importlib.util.spec_from_file_location("runpod_gspc_worker_for_dispatch", SCRIPTS / "runpod_gspc_worker.py")
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def _dead_pid() -> int:
    child = subprocess.Popen([sys.executable, "-c", "pass"])
    child.wait()
    return child.pid


class JobsDirResolutionTests(unittest.TestCase):
    """2026-09-14: the loop defaulted to jobs-21ff8f50 while the worker scanned jobs-091a616a."""

    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.workspace = self.root / "workspace"
        self.worker_home = self.workspace / "gspc-worker"
        self.state = self.worker_home / "state"
        self.live_jobs = self.worker_home / "jobs-live"
        self.stale_default = self.worker_home / "jobs-21ff8f50"
        for directory in (self.state, self.live_jobs, self.stale_default):
            directory.mkdir(parents=True)
        self.model = "llama3.2:3b"
        self.banks = self.workspace / "banks-all"
        self.banks.mkdir()
        for _, filename in playlist.AXES:
            (self.banks / filename).write_text(
                json.dumps({"prompt": "one", "expected": "YES"}) + "\n" +
                json.dumps({"prompt": "two", "expected": "NO"}) + "\n",
                encoding="utf-8",
            )
        self.manifests = self.workspace / "ollama-models" / "manifests"
        manifest = playlist.model_manifest_path(self.manifests, self.model)
        manifest.parent.mkdir(parents=True)
        manifest.write_bytes(b"model manifest")
        self.digest = hashlib.sha256(b"model manifest").hexdigest()
        self.feed = self.root / "queue.json"
        self.feed.write_text(json.dumps({
            "schema": "csoai.commission-queue/0.1", "status": "MEASURED", "records_unreadable": 0,
            "rows": [{"subject": self.model, "model": self.model, "fulfillment": "QUEUED",
                      "status": "QUEUED", "axis": "governance", "receipt_sha": "a" * 64}],
        }), encoding="utf-8")

    def tearDown(self) -> None:
        self.temp.cleanup()

    def write_worker_state(self, config_dir: Path, pid: int, lock_pid: int | None = None) -> None:
        (self.state / "health.json").write_text(json.dumps({
            "schema": "csoai.runpod-gspc-worker/0.1", "state": "WAITING",
            "config_dir": str(config_dir), "pid": pid,
        }), encoding="utf-8")
        (self.state / "worker.lock").write_text(f"{pid if lock_pid is None else lock_pid}\n", encoding="utf-8")

    def jobs_in(self, directory: Path) -> list[str]:
        return sorted(path.name for path in directory.glob("*.json"))

    def dispatch_argv(self, *extra: str) -> list[str]:
        return [
            "--input", str(self.feed), "--workspace-root", str(self.workspace),
            "--bank-dir", str(self.banks), "--model-manifest-root", str(self.manifests),
            "--output-root", str(self.workspace / "gspc-24x7"), *extra,
        ]

    # (a) python boundary
    def test_dispatcher_writes_into_worker_state_config_dir_not_default(self) -> None:
        self.write_worker_state(self.live_jobs, os.getpid())
        with mock.patch.object(playlist, "ollama_digests", return_value={self.model: self.digest}):
            rc = dispatch.main(self.dispatch_argv("--worker-state-dir", str(self.state), "--jobs-dir", str(self.stale_default)))
        self.assertEqual(rc, 0)
        self.assertEqual(len(self.jobs_in(self.live_jobs)), 1)
        self.assertEqual(self.jobs_in(self.stale_default), [])

    def test_real_worker_state_resolves_to_the_dir_the_worker_scans(self) -> None:
        worker = _load_worker()
        self.assertEqual(worker.main(["--config-dir", str(self.live_jobs), "--state-dir", str(self.state), "--once"]), 2)
        source, resolved = dispatch.resolve_jobs_dir(self.state, None)
        self.assertEqual((source, resolved), ("worker-state", self.live_jobs.resolve()))

    def test_dead_worker_state_is_not_trusted_and_explicit_fallback_is_used(self) -> None:
        self.write_worker_state(self.stale_default, _dead_pid())
        self.assertEqual(dispatch.resolve_jobs_dir(self.state, self.live_jobs), ("explicit", self.live_jobs))
        self.write_worker_state(self.stale_default, os.getpid(), lock_pid=_dead_pid())
        with self.assertRaises(playlist.GenerationError):
            dispatch.resolve_jobs_dir(self.state, None)

    # (b) python boundary
    def test_unresolved_jobs_dir_halts_without_writing(self) -> None:
        with mock.patch.object(playlist, "ollama_digests", return_value={self.model: self.digest}):
            rc = dispatch.main(self.dispatch_argv("--worker-state-dir", str(self.state)))
        self.assertEqual(rc, 2)
        self.assertEqual(self.jobs_in(self.live_jobs) + self.jobs_in(self.stale_default), [])

    # (a) and (b) through the shell loop itself, against a throwaway workspace
    def run_loop(self, extra_env: dict[str, str]) -> subprocess.CompletedProcess:
        tags = json.dumps({"models": [{"name": self.model, "digest": f"sha256:{self.digest}"}]}).encode()

        class Tags(http.server.BaseHTTPRequestHandler):
            def do_GET(self) -> None:  # noqa: N802
                self.send_response(200)
                self.send_header("Content-Length", str(len(tags)))
                self.end_headers()
                self.wfile.write(tags)

            def log_message(self, *_args: object) -> None:
                return

        server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), Tags)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        env = {
            **os.environ,
            "LANES": str(self.root / "lanes"),
            "WORKSPACE_ROOT": str(self.workspace),
            "CONTROL_REPO": str(REPO),
            "WORKER_STATE_DIR": str(self.state),
            "COMMISSION_QUEUE_URL": self.feed.as_uri(),
            "OLLAMA_URL": f"http://127.0.0.1:{server.server_address[1]}",
        }
        env.pop("WORKER_JOBS_DIR", None)
        env.update(extra_env)
        try:
            return subprocess.run(["bash", str(DISPATCH_SH), "--now"], env=env, capture_output=True, text=True, timeout=120)
        finally:
            server.shutdown()
            server.server_close()
            thread.join(timeout=2)

    def test_shell_loop_writes_jobs_where_the_worker_scans(self) -> None:
        self.write_worker_state(self.live_jobs, os.getpid())
        result = self.run_loop({"WORKER_JOBS_DIR": str(self.stale_default)})
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertEqual(len(self.jobs_in(self.live_jobs)), 1)
        self.assertEqual(self.jobs_in(self.stale_default), [])
        report = json.loads((self.root / "lanes" / "out" / "commission-dispatch-latest.json").read_text())
        self.assertEqual(report["schema"], "csoai.runpod-commission-dispatch/0.1")
        self.assertEqual((report["created"], len(report["admitted"])), (1, 1))
        self.assertIn("jobs_dir_source=worker-state", result.stdout)

    def test_shell_loop_halts_before_fetching_when_unresolved(self) -> None:
        result = self.run_loop({})
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(result.returncode, 2, result.stdout + result.stderr)
        self.assertIn("HALT worker jobs dir unresolved", result.stdout)
        self.assertFalse((self.root / "lanes" / "state" / "commission-feed.json").exists())
        self.assertEqual(self.jobs_in(self.live_jobs) + self.jobs_in(self.stale_default), [])


if __name__ == "__main__":
    unittest.main()
