"""Loopback-only rehearsal host. No remote models, commands, or production writes."""
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import mimetypes
from pathlib import Path
import tempfile
import threading
import time
from urllib.parse import urlsplit
from .dependencies import ROOT
from .engine import simulate
from .evidence import bundle_for, strict_json, verify, compare
from .messaging import RehearsalMessages

MAX_BODY = 2 * 1024 * 1024
STATIC = ROOT / "static"


class Application:
    def __init__(self):
        self.temp = tempfile.TemporaryDirectory(prefix="csoai-rehearsal-")
        self.messages = RehearsalMessages(Path(self.temp.name) / "messages")
        self.lock = threading.Lock()

    def close(self):
        self.messages.close()
        self.temp.cleanup()


def make_server(port=0):
    if type(port) is not int or not 0 <= port <= 65535:
        raise ValueError("Invalid port")
    app = Application()

    class Handler(BaseHTTPRequestHandler):
        protocol_version = "HTTP/1.0"
        timeout = 8

        def log_message(self, *args):
            pass

        def reply(self, status, value, mime="application/json"):
            body = value if isinstance(value, bytes) else json.dumps(value).encode()
            self.send_response(status)
            self.send_header("Content-Type", mime)
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.send_header("Referrer-Policy", "no-referrer")
            self.send_header("Content-Security-Policy",
                "default-src 'self'; script-src 'self'; style-src 'self'; "
                "connect-src 'self'; img-src 'self' data:; object-src 'none'; "
                "base-uri 'none'; form-action 'none'; frame-ancestors 'self'")
            self.end_headers()
            self.wfile.write(body)

        def valid_host(self):
            return self.headers.get("Host") == f"127.0.0.1:{self.server.server_port}"

        def do_GET(self):
            if not self.valid_host():
                self.reply(403, {"error": "Unexpected host"})
                return
            path = urlsplit(self.path).path
            if path == "/api/health":
                self.reply(200, {"state": "LOCAL_CANDIDATE", "model_calls": 0,
                    "human_authority": False, "external_effects": False,
                    "messaging": "SWARMCHAT_STORE", "canonical_events": "csoai.evidence-event/0.1",
                    "container_runtime": "NOT_CONNECTED"})
                return
            file = {"/": "index.html", "/app.js": "app.js", "/app.css": "app.css"}.get(path)
            if not file:
                self.reply(404, {"error": "Not found"})
                return
            self.reply(200, (STATIC / file).read_bytes(),
                       mimetypes.guess_type(file)[0] or "application/octet-stream")

        def do_POST(self):
            if not self.valid_host() or self.headers.get("Origin") != f"http://127.0.0.1:{self.server.server_port}":
                self.reply(403, {"error": "Same-origin request required"})
                return
            if self.headers.get("Content-Type", "").split(";")[0].strip() != "application/json":
                self.reply(415, {"error": "JSON required"})
                return
            length = self.headers.get("Content-Length", "")
            if not length.isdecimal() or not 1 <= int(length) <= MAX_BODY:
                self.reply(413, {"error": "Body must be between 1 byte and 2 MiB"})
                return
            try:
                raw = self.rfile.read(int(length))
                if len(raw) != int(length):
                    raise ValueError("Incomplete body")
                params = strict_json(raw)
                with app.lock:
                    path = urlsplit(self.path).path
                    if path == "/api/run":
                        started = time.monotonic()
                        core = simulate(params)
                        bundle = bundle_for(core)
                        messages = app.messages.publish(core)
                        result = {"bundle": bundle, "messages": [
                            {"from": m["from"], "text": m["text"]} for m in messages],
                            "elapsed_ms": round((time.monotonic() - started) * 1000, 3)}
                    elif path == "/api/verify":
                        result = verify(params)
                    elif path == "/api/compare":
                        if not isinstance(params, list) or len(params) != 2:
                            raise ValueError("Select exactly two bundles")
                        result = compare(*params)
                    else:
                        self.reply(404, {"error": "Not found"})
                        return
                self.reply(200, result)
            except (ValueError, KeyError, TypeError, RecursionError) as error:
                # Input error details are fixed locally, never remote bodies or credentials.
                self.reply(400, {"error": str(error)[:240]})

    try:
        httpd = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    except BaseException:
        app.close()
        raise
    httpd.daemon_threads = True
    httpd.app = app
    return httpd


def serve(port):
    httpd = make_server(port)
    print(f"Rehearsal candidate: http://127.0.0.1:{httpd.server_port}", flush=True)
    print("Synthetic fixtures; no model calls or production authority. Ctrl-C stops.", flush=True)
    try:
        httpd.serve_forever(poll_interval=0.1)
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()
        httpd.app.close()
