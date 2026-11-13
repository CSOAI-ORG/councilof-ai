"""Explicit read-only Docker Engine API probe for a separately installed runtime."""
import http.client
import json
import socket


def probe_unix(path):
    if not isinstance(path, str) or not path.startswith("/") or len(path) > 100:
        raise ValueError("Supply an explicit absolute local Unix socket path")
    class Connection(http.client.HTTPConnection):
        def connect(self):
            self.sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
            self.sock.settimeout(2)
            self.sock.connect(path)
    conn = Connection("localhost", timeout=2)
    try:
        conn.request("GET", "/version", headers={"Host": "localhost", "Accept": "application/json"})
        response = conn.getresponse()
        body = response.read(65537)
        if response.status != 200 or len(body) > 65536:
            raise ValueError("Runtime version reply unavailable or oversized")
        value = json.loads(body)
        if not isinstance(value, dict) or not isinstance(value.get("Version"), str):
            raise ValueError("Unsupported runtime version response")
        return {"state": "VERSION_OBSERVED", "version": value["Version"],
                "api_version": value.get("ApiVersion"), "runtime_identity_verified": False,
                "request": "GET /version", "container_actions": "NOT_RUN"}
    finally:
        conn.close()
