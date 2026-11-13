"""Offline HTTP boundary tests. No GPU, model downloads or external requests."""

import concurrent.futures
import contextlib
import http.client
import io
import json
import queue
import socket
import threading
import unittest
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from unittest import mock

import proxy


KEY = "offline-test-key-not-a-real-secret-123456789"
CHAT = {"model": proxy.SERVED_MODEL, "messages": [{"role": "user", "content": "Hello"}]}
ANSWER = b'{"object":"chat.completion","choices":[{"message":{"role":"assistant","content":"Hello back"}}]}'


class _BackendHandler(BaseHTTPRequestHandler):
    def log_message(self, *_args):
        pass

    def _reply(self):
        body = self.rfile.read(int(self.headers.get("Content-Length", "0")))
        self.server.calls.append((self.command, self.path, dict(self.headers), body))
        if self.server.block is not None:
            self.server.entered.put(True)
            self.server.block.wait(3)
        if self.path == "/health":
            payload = b'{"private_backend_details":"must never leave health"}'
        elif self.path == "/v1/models":
            payload = json.dumps({"object": "list", "data": [{"id": proxy.SERVED_MODEL}]}).encode()
        else:
            payload = ANSWER
        if self.server.payload is not None:
            payload = self.server.payload
        self.send_response(self.server.status)
        self.send_header("Content-Type", self.server.content_type)
        self.send_header("X-Backend-Secret", "do-not-forward")
        if self.server.status in (301, 302, 307, 308):
            self.send_header("Location", "/invocations")
        if not self.server.omit_length:
            length = self.server.declared_length
            self.send_header("Content-Length", str(length if length is not None else len(payload)))
        self.end_headers()
        try:
            self.wfile.write(payload)
        except (BrokenPipeError, ConnectionResetError):
            pass

    do_GET = _reply
    do_POST = _reply


def _start(server):
    thread = threading.Thread(target=lambda: server.serve_forever(poll_interval=0.01), daemon=True)
    thread.start()
    return thread


def _stop(server, thread):
    server.shutdown()
    server.server_close()
    thread.join(2)


class ProxyHTTPTests(unittest.TestCase):
    def setUp(self):
        self.backend = ThreadingHTTPServer(("127.0.0.1", 0), _BackendHandler)
        self.backend.calls = []
        self.backend.status = 200
        self.backend.payload = None
        self.backend.content_type = "application/json"
        self.backend.omit_length = False
        self.backend.declared_length = None
        self.backend.block = None
        self.backend.entered = queue.Queue()
        self.backend_thread = _start(self.backend)
        self.env = {"VLLM_API_KEY": KEY,
                    "MEOK_COSMOS_BACKEND_PORT": str(self.backend.server_port)}
        self.server = proxy.make_server(self.env, bind_address=("127.0.0.1", 0))
        self.proxy_thread = _start(self.server)

    def tearDown(self):
        if self.backend.block is not None:
            self.backend.block.set()
        _stop(self.server, self.proxy_thread)
        _stop(self.backend, self.backend_thread)

    def request(self, method, path, body=None, *, key=KEY, headers=None):
        outgoing = {"Authorization": "Bearer " + key} if key is not None else {}
        if isinstance(body, dict):
            body = json.dumps(body).encode()
        if body is not None:
            outgoing["Content-Type"] = "application/json"
        outgoing.update(headers or {})
        connection = http.client.HTTPConnection("127.0.0.1", self.server.server_port, timeout=2)
        try:
            connection.request(method, path, body=body, headers=outgoing)
            response = connection.getresponse()
            return response.status, dict(response.getheaders()), response.read()
        finally:
            connection.close()

    def raw(self, request):
        with socket.create_connection(("127.0.0.1", self.server.server_port), timeout=2) as client:
            client.sendall(request)
            client.shutdown(socket.SHUT_WR)
            pieces = []
            while True:
                try:
                    chunk = client.recv(65536)
                except ConnectionResetError:
                    break
                if not chunk:
                    break
                pieces.append(chunk)
            return b"".join(pieces)

    def test_models_and_text_completion_authenticated_roundtrip(self):
        status, headers, payload = self.request("GET", "/v1/models")
        self.assertEqual(status, 200)
        self.assertEqual(json.loads(payload)["data"][0]["id"], proxy.SERVED_MODEL)
        self.assertNotIn("X-Backend-Secret", headers)
        status, _, payload = self.request("POST", "/v1/chat/completions", CHAT)
        self.assertEqual((status, payload), (200, ANSWER))
        method, path, headers, sent = self.backend.calls[-1]
        self.assertEqual((method, path), ("POST", "/v1/chat/completions"))
        self.assertEqual(headers["Authorization"], "Bearer " + KEY)
        sent = json.loads(sent)
        self.assertIs(sent["stream"], False)
        self.assertEqual(sent["max_tokens"], 1024)

    def test_missing_or_wrong_keys_never_reach_backend(self):
        for method, path, body in (("GET", "/v1/models", None),
                                   ("POST", "/v1/chat/completions", CHAT)):
            for key in (None, "wrong-key", KEY + "wrong"):
                with self.subTest(method=method, key_present=key is not None):
                    status, _, payload = self.request(method, path, body, key=key)
                    self.assertEqual(status, 401)
                    self.assertEqual(json.loads(payload), {"error": {"code": "unauthorized"}})
        self.assertEqual(self.backend.calls, [])

    def test_duplicate_authorization_is_rejected(self):
        raw = ("GET /v1/models HTTP/1.1\r\nHost: test\r\n"
               f"Authorization: Bearer {KEY}\r\nAuthorization: Bearer {KEY}\r\n\r\n").encode()
        self.assertIn(b" 401 ", self.raw(raw).split(b"\r\n", 1)[0])
        self.assertEqual(self.backend.calls, [])

    def test_private_and_variant_routes_are_never_forwarded(self):
        paths = ("/invocations", "/pause", "/resume", "/update_weights", "/sleep",
                 "/wake_up", "/metrics", "/docs", "/openapi.json", "/v1/embeddings",
                 "/v1/models?admin=1", "/v1/chat/completions/", "/v1/%6dodels",
                 "http://127.0.0.1:8000/invocations")
        for path in paths:
            for method in ("GET", "POST"):
                with self.subTest(method=method, path=path):
                    status, _, _ = self.request(method, path, CHAT if method == "POST" else None)
                    self.assertEqual(status, 404)
        for method in ("HEAD", "PUT", "DELETE", "PATCH", "OPTIONS", "TRACE", "CONNECT"):
            status, _, _ = self.request(method, "/v1/models")
            self.assertGreaterEqual(status, 400)
        self.assertEqual(self.backend.calls, [])

    def test_public_health_is_only_status_and_does_not_leak_errors(self):
        status, headers, payload = self.request("GET", "/health", key=None)
        self.assertEqual((status, payload), (200, b'{"status":"ok"}'))
        self.assertNotIn("X-Backend-Secret", headers)
        self.backend.status = 500
        status, _, payload = self.request("GET", "/health", key=None)
        self.assertEqual((status, payload), (503, b'{"status":"unavailable"}'))

    def test_only_plain_text_and_bounded_generation_are_accepted(self):
        invalid = [
            {"stream": True}, {"stream": 0}, {"model": "other-model"},
            {"max_tokens": 0}, {"max_tokens": 4097}, {"max_tokens": True},
            {"max_tokens": 2.5}, {"tools": []}, {"tool_choice": "auto"},
            {"n": 2}, {"response_format": {"type": "json_object"}},
            {"messages": [{"role": "tool", "content": "result"}]},
            {"messages": [{"role": "user", "content": [{"type": "image_url"}]}]},
            {"messages": [{"role": "user", "content": "hello", "audio": {}}]},
            {"messages": []}, {"messages": CHAT["messages"] * 65},
            {"temperature": float("nan")}, {"temperature": 3}, {"top_p": 0},
        ]
        for override in invalid:
            with self.subTest(fields=list(override)):
                status, _, _ = self.request("POST", "/v1/chat/completions", {**CHAT, **override})
                self.assertEqual(status, 400)
        self.assertEqual(self.backend.calls, [])
        status, _, _ = self.request("POST", "/v1/chat/completions",
                                    {**CHAT, "max_tokens": 4096, "temperature": 0, "top_p": 1})
        self.assertEqual(status, 200)

    def test_invalid_json_duplicate_fields_and_wrong_media_type(self):
        payloads = (b"not json", b"[]", b'{"model":"x","model":"y"}', b"\xff")
        for body in payloads:
            status, _, _ = self.request("POST", "/v1/chat/completions", body)
            self.assertEqual(status, 400)
        status, _, _ = self.request("POST", "/v1/chat/completions", CHAT,
                                    headers={"Content-Type": "text/plain"})
        self.assertEqual(status, 415)
        status, _, _ = self.request("POST", "/v1/chat/completions", CHAT,
                                    headers={"Content-Encoding": "gzip"})
        self.assertEqual(status, 415)
        self.assertEqual(self.backend.calls, [])

    def test_request_body_limit_is_enforced_before_read_or_forward(self):
        status, _, _ = self.request("POST", "/v1/chat/completions", b"{}",
                                    headers={"Content-Length": str(proxy.MAX_REQUEST_BYTES + 1)})
        self.assertEqual(status, 413)
        self.assertEqual(self.backend.calls, [])

    def test_ambiguous_framing_and_get_bodies_are_rejected(self):
        prefix = ("POST /v1/chat/completions HTTP/1.1\r\nHost: test\r\n"
                  f"Authorization: Bearer {KEY}\r\nContent-Type: application/json\r\n")
        for framing in ("Content-Length: 2\r\nContent-Length: 2\r\n",
                        "Transfer-Encoding: chunked\r\n", "Content-Length: -1\r\n",
                        "Content-Length: 2\r\nExpect: 100-continue\r\n"):
            result = self.raw((prefix + framing + "\r\n{}").encode())
            self.assertIn(b" 400 ", result.split(b"\r\n", 1)[0])
        status, _, _ = self.request("GET", "/v1/models", b"{}")
        self.assertEqual(status, 400)
        self.assertEqual(self.backend.calls, [])

    def test_header_size_is_bounded(self):
        raw = (b"GET /health HTTP/1.1\r\nHost: test\r\nX-Large: "
               + b"x" * (proxy.MAX_HEADER_LINE + 1) + b"\r\n\r\n")
        self.assertIn(b" 431 ", self.raw(raw).split(b"\r\n", 1)[0])
        self.assertEqual(self.backend.calls, [])

    def test_backend_errors_and_redirects_are_sanitized_and_not_followed(self):
        for status in (302, 307, 401, 403, 500):
            self.backend.status = status
            self.backend.payload = b'{"error":"sensitive backend path or key"}'
            received, headers, payload = self.request("GET", "/v1/models")
            self.assertEqual(received, 502)
            self.assertNotIn("Location", headers)
            self.assertNotIn(b"sensitive", payload)
        self.assertEqual(len(self.backend.calls), 5)
        self.assertTrue(all(call[1] == "/v1/models" for call in self.backend.calls))

    def test_backend_response_caps_cover_declared_and_undeclared_bodies(self):
        self.backend.declared_length = proxy.MAX_RESPONSE_BYTES + 1
        self.backend.payload = b"{}"
        status, _, _ = self.request("GET", "/v1/models")
        self.assertEqual(status, 502)
        self.backend.omit_length = True
        self.backend.payload = b"x" * (proxy.MAX_RESPONSE_BYTES + 1)
        status, _, payload = self.request("GET", "/v1/models")
        self.assertEqual(status, 502)
        self.assertLess(len(payload), 100)

    def test_exact_response_body_cap_is_accepted(self):
        self.backend.payload = b'{"text":"' + b"x" * (proxy.MAX_RESPONSE_BYTES - 11) + b'"}'
        self.assertEqual(len(self.backend.payload), proxy.MAX_RESPONSE_BYTES)
        status, _, payload = self.request("GET", "/v1/models")
        self.assertEqual(status, 200)
        self.assertEqual(len(payload), proxy.MAX_RESPONSE_BYTES)

    def test_invalid_backend_json_or_error_envelope_is_not_exposed(self):
        for payload in (b"bad backend response", b'{"error":"private"}', b"[]"):
            self.backend.payload = payload
            status, _, received = self.request("GET", "/v1/models")
            self.assertEqual(status, 502)
            self.assertNotIn(b"private", received)

    def test_client_read_timeout_never_reaches_backend(self):
        with mock.patch.object(proxy, "CLIENT_SOCKET_TIMEOUT", 0.05):
            with socket.create_connection(("127.0.0.1", self.server.server_port), timeout=2) as client:
                client.sendall(("POST /v1/chat/completions HTTP/1.1\r\nHost: test\r\n"
                                f"Authorization: Bearer {KEY}\r\nContent-Type: application/json\r\n"
                                "Content-Length: 100\r\n\r\n{").encode())
                self.assertIn(b" 408 ", client.recv(4096).split(b"\r\n", 1)[0])
        self.assertEqual(self.backend.calls, [])

    def test_backend_read_timeout_returns_generic_error(self):
        self.backend.block = threading.Event()
        with mock.patch.object(proxy, "BACKEND_TIMEOUT", 0.05):
            status, _, payload = self.request("GET", "/v1/models")
        self.backend.block.set()
        self.assertEqual(status, 502)
        self.assertEqual(json.loads(payload), {"error": {"code": "backend_unavailable"}})

    def test_worker_count_is_bounded_and_saturation_is_rejected(self):
        self.backend.block = threading.Event()
        with concurrent.futures.ThreadPoolExecutor(max_workers=proxy.MAX_WORKERS) as clients:
            futures = [clients.submit(self.request, "POST", "/v1/chat/completions", CHAT)
                       for _ in range(proxy.MAX_WORKERS)]
            try:
                for _ in range(proxy.MAX_WORKERS):
                    self.backend.entered.get(timeout=2)
                status, _, _ = self.request("GET", "/health", key=None)
                self.assertEqual(status, 503)
                self.assertEqual(len(self.backend.calls), proxy.MAX_WORKERS)
            finally:
                self.backend.block.set()
            self.assertTrue(all(future.result()[0] == 200 for future in futures))

    def test_requests_and_backend_errors_are_not_logged(self):
        captured = io.StringIO()
        with contextlib.redirect_stderr(captured):
            self.request("GET", "/invocations?private=value")
            self.request("GET", "/v1/models", key="wrong-secret")
            self.backend.status = 500
            self.request("GET", "/v1/models")
        self.assertEqual(captured.getvalue(), "")


class ConfigurationTests(unittest.TestCase):
    def test_loopback_only_backend_and_valid_port(self):
        for host in ("0.0.0.0", "192.168.1.2", "example.com", "localhost", "http://127.0.0.1",
                     "127.0.0.1.attacker.example", "::"):
            with self.subTest(host=host), self.assertRaises(ValueError):
                proxy.make_server({"VLLM_API_KEY": KEY, "MEOK_COSMOS_BACKEND_HOST": host},
                                  bind_address=("127.0.0.1", 0))
        for port in ("0", "-1", "65536", "8000/path", ""):
            with self.subTest(port=port), self.assertRaises(ValueError):
                proxy.make_server({"VLLM_API_KEY": KEY, "MEOK_COSMOS_BACKEND_PORT": port},
                                  bind_address=("127.0.0.1", 0))

    def test_secret_is_required_and_header_safe(self):
        for key in ("", "short", "x" * 32 + "\n", "x" * 32 + " ", "é" * 32):
            with self.assertRaises(ValueError):
                proxy.make_server({"VLLM_API_KEY": key}, bind_address=("127.0.0.1", 0))


if __name__ == "__main__":
    unittest.main()
