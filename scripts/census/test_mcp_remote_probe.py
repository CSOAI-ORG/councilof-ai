#!/usr/bin/env python3
"""Offline tests for mcp-remote-probe.py. Fixture MCP servers on 127.0.0.1 only; no internet.

Run: python3 -m unittest scripts/census/test_mcp_remote_probe.py -v
     python3 scripts/census/mcp-remote-probe.py --self-test   # suite + the must-fail control
"""
from __future__ import annotations

import gzip
import importlib.util
import json
import os
import socket
import sys
import tempfile
import threading
import time
import unittest
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

HERE = Path(__file__).resolve().parent
_SPEC = importlib.util.spec_from_file_location("mcp_remote_probe", HERE / "mcp-remote-probe.py")
P = importlib.util.module_from_spec(_SPEC)
_SPEC.loader.exec_module(P)

TOOLS_P1 = [{"name": "get_echo", "inputSchema": {"type": "object", "properties": {"message": {}}}},
            {"name": "list_items", "inputSchema": {"type": "object", "properties": {}}},
            {"name": "search", "inputSchema": {"type": "object", "properties": {"q": {}}}}]
TOOLS_P2 = [{"name": "status", "inputSchema": {"type": "object", "properties": {}}}]
# the effect-binding controls' two tools/list shapes (eb_controls.py): binds declares `nonce`
BINDS_TOOL = [{"name": "get_echo", "description": "Return the message. Read-only.",
               "inputSchema": {"type": "object", "properties": {"message": {"type": "string"},
                                                                "nonce": {"type": "string"}},
                               "required": ["message"], "additionalProperties": False}}]
NOBIND_TOOL = [{"name": "get_echo", "description": "Return the message. Read-only.",
                "inputSchema": {"type": "object", "properties": {"message": {"type": "string"}},
                                "required": ["message"]}}]


class Fixture(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"
    stats = None  # set per server

    def log_message(self, *a):
        pass

    def setup(self):
        super().setup()
        with self.stats["lock"]:
            self.stats["open"] += 1
            self.stats["max_open"] = max(self.stats["max_open"], self.stats["open"])

    def finish(self):
        try:
            super().finish()
        finally:
            with self.stats["lock"]:
                self.stats["open"] -= 1

    def _rec(self, method):
        with self.stats["lock"]:
            self.stats["reqs"].append((time.monotonic(), method, self.path, dict(self.headers)))

    def _send(self, code, body=b"", ctype="application/json", headers=None):
        if isinstance(body, (dict, list)):
            body = json.dumps(body).encode()
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        for k, v in (headers or {}).items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(body)

    def _body(self):
        n = int(self.headers.get("Content-Length") or 0)
        try:
            return json.loads(self.rfile.read(n) or b"{}")
        except ValueError:
            return {}

    def do_GET(self):
        self._rec("GET")
        p = self.path
        if p == "/robots.txt":
            return self._send(200, b"User-agent: *\nDisallow: /private\n", "text/plain")
        if p.startswith("/legacy") or p.startswith("/sseonly"):
            self.send_response(200)
            self.send_header("Content-Type", "text/event-stream")
            self.end_headers()
            self.wfile.write(b"event: endpoint\ndata: /legacy/messages?sessionId=abc\n\n")
            self.wfile.flush()
            time.sleep(0.2)
            return
        if p.startswith("/emptystream"):
            self.send_response(200)
            self.send_header("Content-Type", "text/event-stream")
            self.send_header("Content-Length", "0")
            self.end_headers()
            return
        return self._send(405, b"method not allowed", "text/plain")

    def do_DELETE(self):
        self._rec("DELETE")
        return self._send(200, b"")

    def _modern(self, req, p, supported):
        """A 2026-07-28 server per basic/versioning + streamable-http: header validation, -32022,
        server/discover, tools/list with _meta. Returns True if it answered."""
        m, rid = req.get("method"), req.get("id")
        meta = ((req.get("params") or {}).get("_meta") or {})
        want = meta.get("io.modelcontextprotocol/protocolVersion")
        hv, hm = self.headers.get("MCP-Protocol-Version"), self.headers.get("Mcp-Method")
        sse = p.startswith("/modernsse")

        def send(obj, code=200):
            if sse and code == 200:
                return self._send(200, f"event: message\ndata: {json.dumps(obj)}\n\n".encode(), "text/event-stream")
            return self._send(code, obj)
        if want is None:
            if p.startswith("/dualera") or p.startswith("/pinnedlegacy"):
                return False  # no modern _meta: a dual-era server serves it as legacy
            return self._send(400, {"jsonrpc": "2.0", "id": rid, "error": {  # legacy client -> modern-only server
                "code": -32020, "message": "missing MCP-Protocol-Version / _meta"}})
        if p.startswith("/hdrmismatch") or hv != want or hm != m:
            return self._send(400, {"jsonrpc": "2.0", "id": rid, "error": {"code": -32020, "message": "Header mismatch"}})
        if want not in supported:
            return self._send(400, {"jsonrpc": "2.0", "id": rid, "error": {
                "code": -32022, "message": "Unsupported protocol version",
                "data": {"supported": supported, "requested": want}}})
        if m == "server/discover":
            return send({"jsonrpc": "2.0", "id": rid, "result": {
                "resultType": "complete", "supportedVersions": supported, "capabilities": {"tools": {}},
                "_meta": {"io.modelcontextprotocol/serverInfo": {"name": "fixture" + p.replace("/", "-"), "version": "2.0"}},
                "ttlMs": 1000, "cacheScope": "public"}})
        if m == "tools/list":
            cur = (req.get("params") or {}).get("cursor")
            if cur is None:
                return send({"jsonrpc": "2.0", "id": rid, "result": {"resultType": "complete", "tools": TOOLS_P1, "nextCursor": "p2"}})
            return send({"jsonrpc": "2.0", "id": rid, "result": {"resultType": "complete", "tools": TOOLS_P2}})
        if m == "tools/call":
            with self.stats["lock"]:
                self.stats["tools_call"] = self.stats.get("tools_call", 0) + 1
        return self._send(404, {"jsonrpc": "2.0", "id": rid, "error": {"code": -32601, "message": "Method not found"}})

    def do_POST(self):
        self._rec("POST")
        req = self._body()
        m, rid, p = req.get("method"), req.get("id"), self.path
        with self.stats["lock"]:
            self.stats.setdefault("methods", []).append((p, m, ((req.get("params") or {}).get("protocolVersion")
                                                               or ((req.get("params") or {}).get("_meta") or {}).get(
                                                                   "io.modelcontextprotocol/protocolVersion"))))
        modern = {"/modern": ["2026-07-28"], "/dualera": ["2026-07-28", "2025-11-25"],
                  "/futureonly": ["2099-01-01"], "/pinnedlegacy": ["2025-06-18"], "/hdrmismatch": ["2026-07-28"]}
        for prefix, sup in modern.items():
            if p.startswith(prefix):
                if self._modern(req, p, sup) is not False:
                    return
                break
        if p.startswith("/claimsmodern") and m == "initialize":  # legacy handshake naming the modern version
            return self._send(200, {"jsonrpc": "2.0", "id": rid, "result": {
                "protocolVersion": "2026-07-28", "capabilities": {"tools": {}},
                "serverInfo": {"name": "fixture-claimsmodern", "version": "1.0"}}})
        if p.startswith("/pinnedlegacy") and m == "initialize":
            ask = (req.get("params") or {}).get("protocolVersion")
            return self._send(200, {"jsonrpc": "2.0", "id": rid, "result": {
                "protocolVersion": ask if ask == "2025-06-18" else "2025-06-18", "capabilities": {"tools": {}},
                "serverInfo": {"name": "fixture-pinnedlegacy", "version": "1.0"}}})
        init = {"jsonrpc": "2.0", "id": rid, "result": {
            "protocolVersion": "2025-06-18", "capabilities": {"tools": {}},
            "serverInfo": {"name": "fixture" + p.replace("/", "-"), "version": "1.0"}}}
        if p.startswith("/auth401"):
            return self._send(401, {"error": "unauthorized"}, headers={"WWW-Authenticate": 'Bearer resource_metadata="x"'})
        if p.startswith("/forbid403"):
            return self._send(403, b"forbidden", "text/plain")
        if p.startswith("/html"):
            return self._send(200, b"<html>hello</html>", "text/html")
        if p.startswith("/jsonnotmcp"):
            return self._send(200, {"status": "ok"})
        if p.startswith("/notfound"):
            return self._send(404, b"not found", "text/plain")
        if p.startswith("/legacy"):
            return self._send(405, b"", "text/plain")
        if p.startswith("/emptystream"):
            return self._send(404, b"", "text/plain")
        if p.startswith("/slow"):
            time.sleep(1.5)
            return self._send(200, init)
        if p.startswith("/rpcerr"):
            return self._send(200, {"jsonrpc": "2.0", "id": rid, "error": {"code": -32603, "message": "internal"}})
        if p.startswith("/rpcauth"):
            return self._send(200, {"jsonrpc": "2.0", "id": rid,
                                    "error": {"code": -32001, "message": "Unauthorized: missing API key"}})
        if p.startswith("/err500"):
            return self._send(500, b"boom", "text/plain")
        if p.startswith("/moved"):
            return self._send(301, b"", "text/plain", {"Location": "https://elsewhere.example/mcp"})
        if p.startswith("/rl-once") or p.startswith("/rl-always"):
            with self.stats["lock"]:
                self.stats["rl"] = self.stats.get("rl", 0) + 1
                first = self.stats["rl"] == 1
            if p.startswith("/rl-always") or first:
                return self._send(429, b"slow down", "text/plain", {"Retry-After": "0"})
        if m == "initialize":
            if p.startswith("/ssejson"):
                body = f"event: message\ndata: {json.dumps(init)}\n\n".encode()
                return self._send(200, body, "text/event-stream", {"Mcp-Session-Id": "s1"})
            return self._send(200, init, headers={"Mcp-Session-Id": "s1"} if p.startswith("/json") else None)
        if m == "notifications/initialized":
            return self._send(202, b"")
        if m == "tools/list":
            cur = (req.get("params") or {}).get("cursor")
            if p.startswith("/binds"):
                return self._send(200, {"jsonrpc": "2.0", "id": rid, "result": {"tools": BINDS_TOOL}})
            if p.startswith("/nobind"):
                return self._send(200, {"jsonrpc": "2.0", "id": rid, "result": {"tools": NOBIND_TOOL}})
            if p.startswith("/bigsse"):  # one SSE data line far longer than one readline()
                big = [{"name": f"tool_{i:04d}", "description": "x" * 200,
                        "inputSchema": {"type": "object", "properties": {}}} for i in range(400)]
                body = f"event: message\ndata: {json.dumps({'jsonrpc': '2.0', 'id': rid, 'result': {'tools': big}})}\n\n"
                return self._send(200, body.encode(), "text/event-stream")
            if p.startswith("/endless"):
                return self._send(200, {"jsonrpc": "2.0", "id": rid,
                                        "result": {"tools": TOOLS_P2, "nextCursor": "again"}})
            if p.startswith("/notools"):
                return self._send(200, {"jsonrpc": "2.0", "id": rid, "error": {"code": -32601, "message": "Method not found"}})
            if cur is None:
                return self._send(200, {"jsonrpc": "2.0", "id": rid, "result": {"tools": TOOLS_P1, "nextCursor": "p2"}})
            return self._send(200, {"jsonrpc": "2.0", "id": rid, "result": {"tools": TOOLS_P2}})
        if m == "tools/call":  # must never be reached
            with self.stats["lock"]:
                self.stats["tools_call"] = self.stats.get("tools_call", 0) + 1
            return self._send(200, {"jsonrpc": "2.0", "id": rid, "result": {}})
        return self._send(200, {"jsonrpc": "2.0", "id": rid, "error": {"code": -32601, "message": "nope"}})


class Server:
    def __init__(self):
        stats = {"lock": threading.Lock(), "open": 0, "max_open": 0, "reqs": []}
        handler = type("H", (Fixture,), {"stats": stats})
        self.httpd = ThreadingHTTPServer(("127.0.0.1", 0), handler)
        self.httpd.handle_error = lambda *a: None  # a client that timed out closes the pipe: expected
        self.httpd.daemon_threads = True
        self.stats = stats
        self.base = f"http://127.0.0.1:{self.httpd.server_address[1]}"
        threading.Thread(target=self.httpd.serve_forever, daemon=True).start()

    def close(self):
        self.httpd.shutdown()
        self.httpd.server_close()


def closed_port():
    s = socket.socket()
    s.bind(("127.0.0.1", 0))
    port = s.getsockname()[1]
    s.close()
    return port


CFG = {"min_interval": 0.02, "workers": 4, "connect_timeout": 1.0, "read_timeout": 0.6, "budget_s": 60}

# path -> expected state, or "STATE/era" where the era is part of what is graded
# (the suite the broken graders must fail)
EXPECT = {
    "/json/mcp": "RESPONDED/legacy", "/ssejson/mcp": "RESPONDED", "/binds/mcp": "RESPONDED",
    "/nobind/mcp": "RESPONDED", "/rl-once/mcp": "RESPONDED", "/endless/mcp": "RESPONDED",
    "/notools/mcp": "RESPONDED", "/bigsse/mcp": "RESPONDED",
    "/auth401/mcp": "AUTH_REQUIRED", "/forbid403/mcp": "AUTH_REQUIRED", "/rpcauth/mcp": "AUTH_REQUIRED",
    "/rpcerr/mcp": "MCP_ERROR", "/legacy/sse": "SSE_ENDPOINT_ONLY",
    "/html/mcp": "NOT_MCP", "/jsonnotmcp/mcp": "NOT_MCP", "/notfound/mcp": "NOT_MCP",
    "/moved/mcp": "NOT_MCP", "/emptystream/mcp": "NOT_MCP",
    "/err500/mcp": "UNREACHABLE", "/slow/mcp": "TIMEOUT",
    # MCP 2026-07-28 (modern) fixtures
    "/modern/mcp": "RESPONDED/modern", "/modernsse/mcp": "RESPONDED/modern", "/dualera/mcp": "RESPONDED/modern",
    "/pinnedlegacy/mcp": "RESPONDED/legacy", "/claimsmodern/mcp": "RESPONDED/legacy",
    "/futureonly/mcp": "MCP_ERROR", "/hdrmismatch/mcp": "MCP_ERROR",
}


def run_suite(grader, srv, expect=EXPECT, modern_grader=None):
    """-> {path: (expected, got)} for each fixture, one probe per path, sequential."""
    gate = P.HostGate(CFG["min_interval"])
    out = {}
    for path, want in expect.items():
        row = {"rank": 1, "endpoint": srv.base + path, "ranked_by": "test", "transports": ["streamable-http"]}
        rec = P.probe_endpoint(row, gate, CFG, grader, sleep=lambda s: None,
                               modern_grader=modern_grader or P.grade_discover)
        got = rec["state"] + (f"/{rec.get('era')}" if "/" in want else "")
        out[path] = (want, got, rec)
    return out


class States(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.srv = Server()
        cls.res = run_suite(P.grade_initialize, cls.srv)

    @classmethod
    def tearDownClass(cls):
        cls.srv.close()

    def test_every_fixture_state(self):
        bad = {p: (w, g) for p, (w, g, _r) in self.res.items() if w != g}
        self.assertEqual(bad, {})

    def test_responded_fields_and_pagination(self):
        r = self.res["/json/mcp"][2]
        self.assertEqual(r["protocol_version"], "2025-06-18")
        self.assertEqual(r["server_info"]["name"], "fixture-json-mcp")
        self.assertEqual(r["n_tools"], 4)
        self.assertTrue(r["tools_complete"])
        self.assertEqual(r["tools_pages"], 2)
        names = sorted(["get_echo", "list_items", "search", "status"])
        import hashlib
        self.assertEqual(r["tool_names_sha256"], hashlib.sha256("\n".join(names).encode()).hexdigest())
        self.assertEqual(r["session_delete_status"], 200)  # session id was issued -> DELETE sent
        self.assertEqual(r["initialized_notification_status"], 202)

    def test_sse_response_body_is_read(self):
        r = self.res["/ssejson/mcp"][2]
        self.assertEqual(r["transport"], "streamable-http(sse-response)")
        self.assertEqual(r["n_tools"], 4)

    def test_sse_line_longer_than_one_read_is_reassembled(self):
        r = self.res["/bigsse/mcp"][2]
        self.assertEqual((r["tools_list_status"], r["n_tools"], r["tools_complete"]), ("ok", 400, True))

    def test_unfollowed_cursor_is_incomplete(self):
        r = self.res["/endless/mcp"][2]
        self.assertFalse(r["tools_complete"])
        self.assertEqual(r["tools_pages"], P.MAX_TOOL_PAGES)
        self.assertIn("nextCursor left unfollowed", r["tools_list_detail"])

    def test_tools_list_error_is_recorded_not_invented(self):
        r = self.res["/notools/mcp"][2]
        self.assertEqual(r["tools_list_status"], "error")
        self.assertNotIn("n_tools", r)

    def test_retry_once_then_ok(self):
        self.assertEqual(self.res["/rl-once/mcp"][2]["retries"], 1)

    def test_effect_binding_p1_controls(self):
        self.assertTrue(self.res["/binds/mcp"][2]["p1_binding_fields"])
        self.assertEqual(self.res["/nobind/mcp"][2]["p1_binding_fields"], [])

    def test_timeout_reason_names_phase(self):
        self.assertEqual(self.res["/slow/mcp"][2]["reason"], "read timeout")

    def test_legacy_rows_record_offered_requested_negotiated(self):
        r = self.res["/json/mcp"][2]
        self.assertEqual((r["era"], r["protocol_versions_offered"], r["protocol_version_requested"],
                          r["protocol_version_negotiated"]),
                         ("legacy", ["2026-07-28", "2025-11-25"], "2025-11-25", "2025-06-18"))
        self.assertEqual(r["modern_attempt"]["verdict"], "FALLBACK")

    def test_modern_only_server_needs_no_handshake(self):
        r = self.res["/modern/mcp"][2]
        self.assertEqual((r["era"], r["protocol_version_requested"], r["protocol_version_negotiated"],
                          r["protocol_version"]), ("modern", "2026-07-28", "2026-07-28", "2026-07-28"))
        self.assertEqual(r["server_supported_versions"], ["2026-07-28"])
        self.assertEqual(r["server_info"]["name"], "fixture-modern-mcp")
        self.assertEqual((r["n_tools"], r["tools_complete"], r["tools_pages"]), (4, True, 2))
        self.assertEqual(r["protocol_versions_offered"], ["2026-07-28"])
        self.assertNotIn("session_delete_status", r)
        self.assertNotIn("initialized_notification_status", r)
        sent = [m for path, m, _v in self.srv.stats["methods"] if path == "/modern/mcp"]
        self.assertEqual(sent, ["server/discover", "tools/list", "tools/list"])  # no initialize, ever

    def test_modern_headers_and_meta_on_every_request(self):
        for _t, m, path, h in self.srv.stats["reqs"]:
            if m == "POST" and path == "/modern/mcp":
                self.assertEqual(h.get("MCP-Protocol-Version"), "2026-07-28")
                self.assertIn(h.get("Mcp-Method"), ("server/discover", "tools/list"))
        vs = {v for path, _m, v in self.srv.stats["methods"] if path == "/modern/mcp"}
        self.assertEqual(vs, {"2026-07-28"})

    def test_modern_sse_bodies(self):
        r = self.res["/modernsse/mcp"][2]
        self.assertEqual((r["era"], r["transport"], r["n_tools"]), ("modern", "streamable-http(sse-response)", 4))

    def test_dual_era_server_stays_modern(self):
        r = self.res["/dualera/mcp"][2]
        self.assertEqual((r["era"], r["protocol_version_negotiated"]), ("modern", "2026-07-28"))
        self.assertEqual(r["server_supported_versions"], ["2026-07-28", "2025-11-25"])
        self.assertNotIn("initialize", [m for path, m, _v in self.srv.stats["methods"] if path == "/dualera/mcp"])

    def test_unsupported_version_retries_with_a_listed_legacy_version(self):
        r = self.res["/pinnedlegacy/mcp"][2]
        self.assertEqual((r["era"], r["protocol_versions_offered"], r["protocol_version_requested"],
                          r["protocol_version_negotiated"]),
                         ("legacy", ["2026-07-28", "2025-06-18"], "2025-06-18", "2025-06-18"))
        self.assertEqual(r["server_supported_versions"], ["2025-06-18"])
        self.assertEqual(r["modern_attempt"]["verdict"], "UNSUPPORTED")
        asked = [v for path, m, v in self.srv.stats["methods"] if path == "/pinnedlegacy/mcp" and m == "initialize"]
        self.assertEqual(asked, ["2025-06-18"])  # the listed version, not our default

    def test_no_mutual_version_is_an_error_not_a_fallback(self):
        r = self.res["/futureonly/mcp"][2]
        self.assertIn("no mutually supported protocol version", r["reason"])
        self.assertEqual((r["era"], r["server_supported_versions"], r["protocol_version_negotiated"]),
                         ("modern", ["2099-01-01"], None))
        self.assertNotIn("initialize", [m for path, m, _v in self.srv.stats["methods"] if path == "/futureonly/mcp"])

    def test_recognised_modern_error_never_falls_back(self):
        r = self.res["/hdrmismatch/mcp"][2]
        self.assertIn("-32020", r["reason"])
        self.assertEqual([m for path, m, _v in self.srv.stats["methods"] if path == "/hdrmismatch/mcp"],
                         ["server/discover"])

    def test_legacy_handshake_answering_the_modern_version_is_recorded_as_such(self):
        r = self.res["/claimsmodern/mcp"][2]
        self.assertEqual((r["era"], r["protocol_version_requested"], r["protocol_version_negotiated"]),
                         ("legacy", "2025-11-25", "2026-07-28"))

    def test_no_tool_was_ever_called(self):
        self.assertEqual(self.srv.stats.get("tools_call", 0), 0)
        methods = set()
        for _t, m, path, h in self.srv.stats["reqs"]:
            methods.add(m)
            self.assertEqual(h.get("User-Agent"), P.UA)
            self.assertNotIn("Authorization", h)
        self.assertLessEqual(methods, {"GET", "POST", "DELETE"})


class Unreachable(unittest.TestCase):
    def test_refused_and_dns(self):
        gate = P.HostGate(0)
        r = P.probe_endpoint({"endpoint": f"http://127.0.0.1:{closed_port()}/mcp", "transports": []}, gate, CFG)
        self.assertEqual((r["state"], r["reason"]), ("UNREACHABLE", "connection refused"))
        r = P.probe_endpoint({"endpoint": "http://no-such-host.invalid/mcp", "transports": []}, gate, CFG)
        self.assertEqual(r["state"], "UNREACHABLE")
        self.assertTrue(r["reason"].startswith("dns"))

    def test_rate_limited_twice_stops_host(self):
        srv = Server()
        try:
            gate = P.HostGate(0)
            r = P.probe_endpoint({"endpoint": srv.base + "/rl-always/mcp", "transports": []}, gate, CFG,
                                 sleep=lambda s: None)
            self.assertEqual(r["state"], "UNREACHABLE")
            self.assertEqual(r["retries"], 1)
            self.assertIn("127.0.0.1", gate.stopped)
        finally:
            srv.close()


class Limiter(unittest.TestCase):
    def test_one_connection_per_host_and_min_interval(self):
        srv = Server()
        try:
            rows = [{"rank": i, "endpoint": srv.base + p, "ranked_by": "t", "transports": ["streamable-http"]}
                    for i, p in enumerate(["/json/a", "/json/b", "/nobind/c", "/binds/d"], 1)]
            cfg = dict(CFG, min_interval=0.15, workers=4)
            starts = []

            class RecordingGate(P.HostGate):
                def pace(self, host):
                    super().pace(host)
                    starts.append(self.last[host])  # the release stamp the limiter itself enforces
            with tempfile.TemporaryDirectory() as d:
                run = P.Runner(rows, d, cfg, gate=RecordingGate(cfg["min_interval"]))
                run.run()
            self.assertEqual(srv.stats["max_open"], 1)
            gaps = [b - a for a, b in zip(starts, starts[1:])]
            self.assertGreaterEqual(min(gaps), 0.15)  # client side: the limiter's own promise
            ts = sorted(t for t, *_ in srv.stats["reqs"])
            srv_gaps = [b - a for a, b in zip(ts, ts[1:])]
            self.assertGreaterEqual(min(srv_gaps), 0.15 * 0.7)  # server side: plus network jitter
            self.assertEqual(sorted(r["state"] for r in run.results), ["RESPONDED"] * 4)
        finally:
            srv.close()

    def test_robots_disallow_and_hf_space_are_not_attempted(self):
        srv = Server()
        try:
            rows = [{"rank": 1, "endpoint": srv.base + "/private/mcp", "ranked_by": "t", "transports": []},
                    {"rank": 2, "endpoint": "https://someone-space.hf.space/mcp", "ranked_by": "t", "transports": []},
                    {"rank": 3, "endpoint": srv.base + "/json/ok", "ranked_by": "t", "transports": []}]
            with tempfile.TemporaryDirectory() as d:
                run = P.Runner(rows, d, dict(CFG, workers=1))
                started, finished = run.run()
                s = P.summarise(run, started, finished, None, len(rows))
            self.assertEqual(s["n_attempted"], 1)
            self.assertEqual(s["read_state"], "PARTIAL")
            reasons = " ".join(x["not_attempted"] for x in run.skipped)
            self.assertIn("robots.txt disallows", reasons)
            self.assertIn("hf.space", reasons)
            self.assertFalse(any("/private/" in path for _t, m, path, _h in srv.stats["reqs"] if m == "POST"))
        finally:
            srv.close()

    def test_summary_counts_requested_and_negotiated_from_runner_rows(self):
        srv = Server()
        try:
            rows = [{"rank": 1, "endpoint": srv.base + "/modern/a", "ranked_by": "t", "transports": []},
                    {"rank": 2, "endpoint": srv.base + "/json/b", "ranked_by": "t", "transports": []},
                    {"rank": 3, "endpoint": srv.base + "/claimsmodern/c", "ranked_by": "t", "transports": []}]
            with tempfile.TemporaryDirectory() as d:
                run = P.Runner(rows, d, dict(CFG, workers=1))
                started, finished = run.run()
                s = P.summarise(run, started, finished, None, len(rows))
            self.assertEqual(s["responded"]["requested_to_negotiated"],
                             {"modern: 2026-07-28 -> 2026-07-28": 1, "legacy: 2025-11-25 -> 2025-06-18": 1,
                              "legacy: 2025-11-25 -> 2026-07-28": 1})
            self.assertEqual(sorted(s["responded"]["era"].items()), [("legacy", 2), ("modern", 1)])
            self.assertEqual(s["schema"], "csoai.census-probe/0.2")
        finally:
            srv.close()

    def test_budget_spent_is_partial_never_exhausted(self):
        rows = [{"rank": 1, "endpoint": "http://127.0.0.1:9/mcp", "ranked_by": "t", "transports": []}]
        with tempfile.TemporaryDirectory() as d:
            run = P.Runner(rows, d, dict(CFG, budget_s=0))
            started, finished = run.run()
            s = P.summarise(run, started, finished, None, 1)
        self.assertEqual((s["n_attempted"], s["read_state"]), (0, "PARTIAL"))
        self.assertEqual(s["n_not_attempted"], 1)


class Merge(unittest.TestCase):
    def test_reprobe_replaces_rows_and_keeps_run1(self):
        srv = Server()
        try:
            rows = [{"rank": 1, "endpoint": srv.base + "/json/a", "ranked_by": "t", "transports": []},
                    {"rank": 2, "endpoint": srv.base + "/bigsse/b", "ranked_by": "t", "transports": []}]
            with tempfile.TemporaryDirectory() as main, tempfile.TemporaryDirectory() as rep:
                for d, rs in ((main, rows), (rep, rows[1:])):
                    run = P.Runner(rs, d, dict(CFG, workers=1))
                    st, fin = run.run()
                    with open(os.path.join(d, "summary.json"), "w") as fh:
                        json.dump(P.summarise(run, st, fin, None, len(rs)), fh)
                s = P.merge_reprobe(main, rep, "test fix")
                merged = P.read_jsonl_gz(os.path.join(main, "results.jsonl.gz"))
                self.assertTrue(os.path.exists(os.path.join(main, "results.run1.jsonl.gz")))
            self.assertEqual(s["n_attempted"], 2)
            self.assertEqual(s["corrections"][0]["endpoints_reprobed"], 1)
            self.assertEqual([m.get("reprobe") for m in merged], [None, "test fix"])
            self.assertEqual(s["requests"]["total"], s["requests"]["run1"]["total"] + s["requests"]["reprobe"]["total"])
        finally:
            srv.close()


class Exclusions(unittest.TestCase):
    def test_excluded_endpoint_is_skipped_before_any_request(self):
        d = tempfile.mkdtemp()
        f = os.path.join(d, "x.json")
        with open(f, "w") as fh:
            json.dump({"schema": "csoai.probe-exclusions/0.1",
                       "entries": [{"id": "obj-1", "match": "host", "value": "a.example"}]}, fh)
        ex = P.load_exclusions(f)
        r = P.Runner([{"rank": 1, "endpoint": "https://mcp.a.example/mcp"}], d, {"min_interval": 0.0, "budget_s": 5}, exclusions=ex)
        self.assertIsNone(r._next())
        self.assertEqual(r.skipped[0]["not_attempted"], "excluded at the operator's request (probe-exclusions.json: obj-1)")
        self.assertEqual(sum(r.gate.requests.values()) if r.gate.requests else 0, 0)


class Control(unittest.TestCase):
    def test_broken_grader_fails_the_suite(self):
        srv = Server()
        try:
            res = run_suite(P.broken_grade_initialize, srv, modern_grader=P.broken_grade_discover)
        finally:
            srv.close()
        wrong = [p for p, (w, g, _r) in res.items() if w != g]
        self.assertGreater(len(wrong), 0, "a defective grader passed the suite: the suite proves nothing")


def self_test():
    srv = Server()
    try:
        real = run_suite(P.grade_initialize, srv)
        broken = run_suite(P.broken_grade_initialize, srv, modern_grader=P.broken_grade_discover)
    finally:
        srv.close()
    real_bad = sorted(p for p, (w, g, _r) in real.items() if w != g)
    broken_bad = sorted(p for p, (w, g, _r) in broken.items() if w != g)
    ok = not real_bad and bool(broken_bad)
    print(json.dumps({"self_test": "PASS" if ok else "FAIL",
                      "grader": f"{len(real) - len(real_bad)}/{len(real)} fixtures graded as expected",
                      "grader_mismatches": real_bad,
                      "control_broken_grader": ("FAILED the suite as required" if broken_bad
                                                else "PASSED the suite - the suite is vacuous"),
                      "control_mismatches": broken_bad}))
    return 0 if ok else 1


if __name__ == "__main__":
    unittest.main()
