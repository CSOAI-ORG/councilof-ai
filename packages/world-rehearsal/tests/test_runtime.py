from pathlib import Path
import io
import sys
import unittest
from unittest.mock import patch
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from rehearsal.runtime import probe_unix


class RuntimeTests(unittest.TestCase):
    def test_probe_is_explicit_local_get_only(self):
        for invalid in ("relative.sock", "http://remote.invalid", "", None):
            with self.assertRaises(ValueError):
                probe_unix(invalid)
        # Protocol fixture: exercise HTTP request/response parsing without a real runtime.
        class FixtureSocket:
            def __init__(self):
                self.sent = b""
                self.closed = False
            def settimeout(self, timeout):
                self.timeout = timeout
            def connect(self, path):
                self.path = path
            def sendall(self, data):
                self.sent += data
            def makefile(self, mode):
                body = b'{"Version":"fixture","ApiVersion":"1.47"}'
                return io.BytesIO(b"HTTP/1.1 200 OK\r\nContent-Length: " +
                                  str(len(body)).encode() + b"\r\n\r\n" + body)
            def close(self):
                self.closed = True
        fixture = FixtureSocket()
        with patch("rehearsal.runtime.socket.socket", return_value=fixture):
            result = probe_unix("/explicit/engine.sock")
        self.assertEqual(result["state"], "VERSION_OBSERVED")
        self.assertFalse(result["runtime_identity_verified"])
        self.assertEqual(result["container_actions"], "NOT_RUN")
        self.assertTrue(fixture.sent.startswith(b"GET /version HTTP/1.1\r\n"))
        self.assertNotIn(b"POST", fixture.sent)
        self.assertEqual(fixture.path, "/explicit/engine.sock")
        self.assertEqual(fixture.timeout, 2)
        self.assertTrue(fixture.closed)
