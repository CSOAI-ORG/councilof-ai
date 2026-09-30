#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Offline tests for probe_listed.py: the list is well formed, and the probe sends initialize +
tools/list only (never server/discover, never tools/call) against a local fake MCP server."""
import http.server
import json
import os
import sys
import tempfile
import threading
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import probe_listed as P  # noqa: E402

SEEN = []


class Fake(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def do_GET(self):
        SEEN.append(("GET", self.path, None))
        self.send_response(404)
        self.end_headers()

    def do_DELETE(self):
        SEEN.append(("DELETE", self.path, None))
        self.send_response(200)
        self.end_headers()

    def do_POST(self):
        body = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))) or b"{}")
        SEEN.append(("POST", self.path, body.get("method")))
        rid = body.get("id")
        if body.get("method") == "initialize":
            res = {"protocolVersion": body["params"]["protocolVersion"], "capabilities": {"tools": {}},
                   "serverInfo": {"name": "fake", "version": "0"}}
        elif body.get("method") == "tools/list":
            res = {"tools": [{"name": "search_docs", "inputSchema": {"type": "object"}}]}
        elif rid is None:
            self.send_response(202)
            self.end_headers()
            return
        else:
            out = json.dumps({"jsonrpc": "2.0", "id": rid, "error": {"code": -32601, "message": "nope"}}).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(out)))
            self.end_headers()
            self.wfile.write(out)
            return
        out = json.dumps({"jsonrpc": "2.0", "id": rid, "result": res}).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(out)))
        self.end_headers()
        self.wfile.write(out)


class ListFile(unittest.TestCase):
    def test_committed_list_is_valid_and_names_the_cuda_docs_endpoint(self):
        doc = P.load_list()
        eps = {e["endpoint"] for e in doc["entries"]}
        self.assertIn("https://api.copilot.nsight.ngc.nvidia.com/mcp/cuda-docs", eps)
        for e in doc["entries"]:
            self.assertEqual(e["effect_binding_status"], "UNMEASURED")
            self.assertFalse(e["in_frozen_bank_2026_09_22"])

    def test_a_measured_status_is_refused(self):
        doc = P.load_list()
        doc["entries"][0]["effect_binding_status"] = "MEASURED"
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as fh:
            json.dump(doc, fh)
        try:
            with self.assertRaises(ValueError):
                P.load_list(fh.name)
        finally:
            os.unlink(fh.name)


class InitializeOnly(unittest.TestCase):
    def test_only_initialize_and_tools_list_are_sent(self):
        srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), Fake)
        t = threading.Thread(target=srv.serve_forever, daemon=True)
        t.start()
        try:
            SEEN.clear()
            url = f"http://127.0.0.1:{srv.server_address[1]}/mcp"
            doc = {"schema": P.SCHEMA, "entries": [{"id": "fake", "endpoint": url, "transport": "streamable-http",
                                                    "scope": "x", "effect_binding_status": "UNMEASURED",
                                                    "in_frozen_bank_2026_09_22": False}]}
            with tempfile.TemporaryDirectory() as d:
                rec = P.run(doc, d, {"min_interval": 0.0, "workers": 1, "connect_timeout": 5.0,
                                     "read_timeout": 5.0, "budget_s": 60})
        finally:
            srv.shutdown()
        methods = [m for verb, _p, m in SEEN if verb == "POST"]
        self.assertEqual(methods, ["initialize", "notifications/initialized", "tools/list"])
        self.assertNotIn("server/discover", methods)
        self.assertNotIn("tools/call", methods)
        row = rec["rows"][0]
        self.assertEqual((row["state"], row["n_tools"]), ("RESPONDED", 1))
        self.assertEqual(row["effect_binding_status"], "UNMEASURED")


if __name__ == "__main__":
    unittest.main(verbosity=2)
