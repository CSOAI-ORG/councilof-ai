import http.client
import json
from pathlib import Path
import sys
import threading
import unittest
import urllib.error
import urllib.request

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from rehearsal.server import make_server


class HTTPTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.httpd = make_server()
        cls.origin = f"http://127.0.0.1:{cls.httpd.server_port}"
        cls.thread = threading.Thread(target=cls.httpd.serve_forever,
                                     kwargs={"poll_interval": .05}, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.httpd.shutdown()
        cls.httpd.server_close()
        cls.thread.join(2)
        cls.httpd.app.close()

    def request(self, path, data=None, headers=None):
        values = {"Origin": self.origin, "Content-Type": "application/json"}
        values.update(headers or {})
        req = urllib.request.Request(self.origin + path,
            data=None if data is None else data.encode(), headers=values)
        try:
            response = urllib.request.urlopen(req, timeout=5)
        except urllib.error.HTTPError as error:
            response = error
        with response:
            return response.status, response.read(), response.headers

    def test_whole_local_run_export_reopen_and_comparison(self):
        status, body, _ = self.request("/api/run", '{"population":25,"intervention":"baseline"}')
        self.assertEqual(status, 200)
        result = json.loads(body)
        self.assertEqual(len(result["messages"]), 3)
        raw = json.dumps(result["bundle"])
        self.assertEqual(json.loads(self.request("/api/verify", raw)[1])["state"], "REPLAY_MATCH")
        other = json.loads(self.request("/api/run", '{"population":25}')[1])["bundle"]
        pair = json.dumps([result["bundle"], other])
        compared = json.loads(self.request("/api/compare", pair)[1])
        self.assertLess(compared["revoked_A_selection_delta"], 0)

    def test_cross_origin_and_rebinding_refused(self):
        self.assertEqual(self.request("/api/run", "{}", {"Origin":"https://elsewhere.invalid"})[0], 403)
        self.assertEqual(self.request("/api/run", "{}", {"Host":"elsewhere.invalid"})[0], 403)

    def test_event_export_is_replay_checked_and_never_grants_authority(self):
        result = json.loads(self.request("/api/run", '{"population":6}')[1])
        status, body, _ = self.request("/api/events", json.dumps(result["bundle"]))
        self.assertEqual(status, 200)
        exported = json.loads(body)
        self.assertTrue(exported["unsigned"])
        self.assertEqual(exported["event_count"], 1)
        self.assertEqual(json.loads(exported["jsonl"])["state"], "UNMEASURED")
        result["bundle"]["core"]["lesson"] = "faked success"
        self.assertEqual(self.request("/api/events", json.dumps(result["bundle"]))[0], 400)

    def test_wrong_media_and_large_body_refused(self):
        self.assertEqual(self.request("/api/run", "{}", {"Content-Type":"text/plain"})[0], 415)
        # Send oversized framing alone: a correct early refusal can close the
        # connection before a high-level client finishes uploading its body.
        conn = http.client.HTTPConnection("127.0.0.1", self.httpd.server_port, timeout=5)
        try:
            conn.putrequest("POST", "/api/run")
            conn.putheader("Origin", self.origin)
            conn.putheader("Content-Type", "application/json")
            conn.putheader("Content-Length", str(2*1024*1024+1))
            conn.endheaders()
            response = conn.getresponse()
            self.assertEqual(response.status, 413)
            self.assertIn(b"2 MiB", response.read())
        finally:
            conn.close()

    def test_duplicate_input_unknown_route_and_bounded_validation(self):
        self.assertEqual(self.request("/api/run", '{"seed":1,"seed":2}')[0], 400)
        self.assertEqual(self.request("/api/run", '{"population":99999999}')[0], 400)
        self.assertEqual(self.request("/api/execute", "{}")[0], 404)
        self.assertEqual(self.request("/../../etc/passwd")[0], 404)

    def test_served_ui_keeps_no_external_script_and_csp(self):
        status, body, headers = self.request("/")
        self.assertEqual(status, 200)
        self.assertIn(b'/app.js', body)
        self.assertNotIn(b"<script src=\"http", body)
        self.assertIn("connect-src 'self'", headers["Content-Security-Policy"])


if __name__ == "__main__":
    unittest.main()
