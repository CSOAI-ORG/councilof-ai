"""Real loopback transport controls for the post-deploy probe; no external network."""
from __future__ import annotations

import importlib.util
import json
import os
from pathlib import Path
import shutil
import socket
import subprocess
import sys
import threading
import time
import unittest
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from unittest.mock import patch
import urllib.error

HELPER = Path(__file__).with_name("post-deploy-probe.py")
SPEC = importlib.util.spec_from_file_location("post_deploy_probe", HELPER)
probe = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(probe)
PRIVATE = "PRIVATE_DIAGNOSTIC_SENTINEL"


class Handler(BaseHTTPRequestHandler):
    seen = []

    def log_message(self, *_args):
        pass

    def do_HEAD(self):
        self.do_GET()

    def do_GET(self):
        self.seen.append((self.path, self.command, self.headers.get("User-Agent")))
        if self.path.startswith("/redirect"):
            self.send_response(302)
            self.send_header("Location", f"http://localhost:{self.server.server_port}/ok?token={PRIVATE}")
            self.end_headers()
            return
        if self.path.startswith("/delayed"):
            time.sleep(0.3)
        if self.path.startswith("/partial"):
            self.send_response(200)
            self.send_header("Content-Length", "2")
            self.end_headers()
            try:
                self.wfile.write(b"x")
                self.wfile.flush()
                time.sleep(0.3)
                self.wfile.write(b"y")
            except (BrokenPipeError, ConnectionResetError):
                pass
            return
        denied = self.path.startswith("/secret") or (
            self.path.startswith("/ua") and (self.headers.get("User-Agent") or "").startswith("Python-urllib/")
        )
        self.send_response(403 if denied else 200, PRIVATE if denied else None)
        self.send_header("X-Private-Diagnostic", PRIVATE)
        self.end_headers()
        if self.command != "HEAD":
            try:
                self.wfile.write(PRIVATE.encode())
            except (BrokenPipeError, ConnectionResetError):
                pass


class TransportTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if not shutil.which("curl"):
            raise RuntimeError("curl is required to qualify the actual probe transport")
        cls.environment = patch.dict(os.environ, {"NO_PROXY": "127.0.0.1,localhost", "no_proxy": "127.0.0.1,localhost"})
        cls.environment.start()
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.origin = f"http://127.0.0.1:{cls.server.server_port}"

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join()
        cls.environment.stop()

    def cli(self, *args):
        result = subprocess.run([sys.executable, str(HELPER), *args], text=True, capture_output=True, timeout=5)
        self.assertEqual(result.stderr, "")
        return result.returncode, json.loads(result.stdout)

    def test_real_default_urllib_403_is_not_replaced_by_the_application_control(self):
        default_exit, default = self.cli("--client", "urllib", self.origin + "/ua")
        control_exit, control = self.cli("--client", "urllib", "--application-control", self.origin + "/ua")
        self.assertEqual(default_exit, 1)
        self.assertEqual(default["http_status"], 403)
        self.assertEqual(default["exception"], "HTTPError")
        self.assertFalse(default["ok"])
        self.assertEqual(default["user_agent_mode"], "default")
        self.assertEqual(control_exit, 0)
        self.assertEqual(control["http_status"], 200)
        self.assertTrue(control["ok"])
        self.assertEqual(control["user_agent_mode"], "application-control")
        seen = [ua for path, method, ua in Handler.seen if path == "/ua" and method == "GET"]
        self.assertTrue(seen[-2].startswith("Python-urllib/"))
        self.assertEqual(seen[-1], probe.CONTROL_USER_AGENT)

    def test_application_control_can_fail_independently(self):
        status, result = self.cli("--client", "urllib", "--application-control", self.origin + "/secret")
        self.assertEqual(status, 1)
        self.assertEqual(result["http_status"], 403)
        self.assertFalse(result["ok"])

    def test_real_curl_get_and_head_200(self):
        for method in ("GET", "HEAD"):
            status, result = self.cli("--client", "curl", "--method", method, self.origin + "/ok")
            self.assertEqual(status, 0)
            self.assertEqual(result["curl_exit"], 0)
            self.assertEqual(result["http_status"], 200)
            self.assertEqual(result["final_host"], "127.0.0.1")
            self.assertEqual(result["method"], method)
        self.assertIn(("/ok", "HEAD"), [(path, method) for path, method, _ in Handler.seen])

    def test_received_curl_403_is_distinct_from_a_transport_failure(self):
        result = probe.curl_probe(self.origin + "/secret", timeout=2)
        self.assertFalse(result["ok"])
        self.assertEqual(result["curl_exit"], 0)
        self.assertEqual(result["http_status"], 403)
        self.assertEqual(result["final_host"], "127.0.0.1")

    def test_refused_connection_has_no_invented_status_or_response_host(self):
        with socket.socket() as reserved:
            reserved.bind(("127.0.0.1", 0))
            # A bound, non-listening port remains reserved and rejects connections.
            target = f"http://127.0.0.1:{reserved.getsockname()[1]}/?secret={PRIVATE}"
            curl = probe.curl_probe(target, timeout=1)
            plain = probe.urllib_probe(target, timeout=1)
        self.assertEqual(curl["curl_exit"], 7)
        self.assertEqual(plain["exception"], "URLError")
        for result in (curl, plain):
            self.assertFalse(result["ok"])
            self.assertIsNone(result["http_status"])
            self.assertIsNone(result["final_host"])
            self.assertNotIn(PRIVATE, json.dumps(result))

    def test_curl_timeout_before_headers_has_one_exit_code_and_no_http_status(self):
        result = probe.curl_probe(self.origin + "/delayed", timeout=0.05)
        self.assertEqual(result["curl_exit"], 28)
        self.assertIsNone(result["http_status"])
        self.assertIsNone(result["final_host"])
        self.assertFalse(result["ok"])
        self.assertNotIn("000000", json.dumps(result))

    def test_partial_200_with_transport_error_cannot_pass(self):
        result = probe.curl_probe(self.origin + "/partial", timeout=0.05)
        self.assertEqual(result["curl_exit"], 28)
        self.assertEqual(result["http_status"], 200)
        self.assertEqual(result["final_host"], "127.0.0.1")
        self.assertFalse(result["ok"])

    def test_redirect_records_actual_response_host_without_effective_url(self):
        for call in (probe.curl_probe, probe.urllib_probe):
            result = call(self.origin + "/redirect", timeout=2)
            self.assertTrue(result["ok"])
            self.assertEqual(result["http_status"], 200)
            self.assertEqual(result["final_host"], "localhost")
            self.assertNotIn(PRIVATE, json.dumps(result))
            self.assertNotIn("/ok", json.dumps(result))

    def test_http_error_diagnostics_do_not_emit_body_headers_url_or_exception_message(self):
        for client in ("curl", "urllib"):
            status, result = self.cli("--client", client, self.origin + "/secret?token=" + PRIVATE)
            self.assertEqual(status, 1)
            self.assertEqual(result["http_status"], 403)
            encoded = json.dumps(result)
            for forbidden in (PRIVATE, "X-Private", "/secret", "token="):
                self.assertNotIn(forbidden, encoded)

    def test_non_http_urllib_exception_does_not_claim_a_final_host(self):
        with patch.object(probe.urllib.request, "urlopen", side_effect=urllib.error.URLError(PRIVATE)):
            result = probe.urllib_probe("https://example.invalid/?token=" + PRIVATE)
        self.assertEqual(result["exception"], "URLError")
        self.assertIsNone(result["http_status"])
        self.assertIsNone(result["final_host"])
        self.assertNotIn(PRIVATE, json.dumps(result))


if __name__ == "__main__":
    unittest.main()
