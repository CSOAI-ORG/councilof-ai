"""Small, authenticated HTTP boundary for the loopback-only Cosmos server.

vLLM's own API key does not protect every route. Never expose its listening port:
this process is the only public listener, and forwards three exact operations.
It has no tools, media, streaming, redirects, arbitrary URLs or request logging.
"""

import hmac
import http.client
import ipaddress
import json
import math
import os
import re
import socket
import sys
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer
from socketserver import ThreadingMixIn


SERVED_MODEL = "meok-cosmos3-nano"
MAX_REQUEST_BYTES = 2 * 1024 * 1024
MAX_RESPONSE_BYTES = 2 * 1024 * 1024
MAX_HEADER_BYTES = 16 * 1024
MAX_HEADER_LINE = 8 * 1024
MAX_WORKERS = 4
MAX_MESSAGES = 64
CLIENT_SOCKET_TIMEOUT = 10.0
BACKEND_TIMEOUT = 90.0
HEALTH_TIMEOUT = 2.0
REQUEST_DEADLINE = 100.0
_DIGITS = re.compile(r"[0-9]+\Z")


def _close_socket(sock):
    if sock is not None:
        try:
            sock.shutdown(socket.SHUT_RDWR)
        except OSError:
            pass
        try:
            sock.close()
        except OSError:
            pass


def _unique_object(pairs):
    value = {}
    for key, item in pairs:
        if key in value:
            raise ValueError("duplicate JSON field")
        value[key] = item
    return value


def _invalid_constant(_value):
    raise ValueError("invalid JSON constant")


def _json_loads(payload):
    return json.loads(
        payload.decode("utf-8"),
        object_pairs_hook=_unique_object,
        parse_constant=_invalid_constant,
    )


def _chat_body(payload):
    """Validate and rebuild a text-only, single-completion request."""
    data = _json_loads(payload)
    allowed = {"model", "messages", "max_tokens", "stream", "temperature", "top_p"}
    if not isinstance(data, dict) or set(data) - allowed:
        raise ValueError("unsupported request")
    if data.get("model") != SERVED_MODEL:
        raise ValueError("unsupported model")
    if "stream" in data and data["stream"] is not False:
        raise ValueError("streaming is disabled")
    tokens = data.get("max_tokens", 1024)
    if type(tokens) is not int or not 1 <= tokens <= 4096:
        raise ValueError("invalid token limit")
    messages = data.get("messages")
    if not isinstance(messages, list) or not 1 <= len(messages) <= MAX_MESSAGES:
        raise ValueError("invalid messages")
    for message in messages:
        if not isinstance(message, dict) or set(message) != {"role", "content"}:
            raise ValueError("invalid message")
        if message["role"] not in ("system", "user", "assistant"):
            raise ValueError("unsupported role")
        if not isinstance(message["content"], str):
            raise ValueError("only text content is supported")
    result = {"model": SERVED_MODEL, "messages": messages,
              "max_tokens": tokens, "stream": False}
    for name, lower, upper in (("temperature", 0, 2), ("top_p", 0, 1)):
        if name in data:
            value = data[name]
            if (type(value) not in (int, float) or not math.isfinite(value)
                    or not lower <= value <= upper or (name == "top_p" and value == 0)):
                raise ValueError("invalid sampling parameter")
            result[name] = value
    # ensure_ascii prevents invalid surrogate escapes from reaching the backend
    # as ill-formed UTF-8, and the rebuilt envelope is bounded again below.
    body = json.dumps(result, separators=(",", ":"), ensure_ascii=True,
                      allow_nan=False).encode("ascii")
    if len(body) > MAX_REQUEST_BYTES:
        raise OverflowError("request too large")
    return body


class _LimitedHeaders:
    """Bound stdlib's header reader before it allocates unbounded header sets."""

    def __init__(self, source):
        self.source = source
        self.remaining = MAX_HEADER_BYTES

    def readline(self, size=-1):
        bound = min(self.remaining + 1, MAX_HEADER_LINE + 1)
        if size >= 0:
            bound = min(bound, size)
        line = self.source.readline(bound)
        self.remaining -= len(line)
        if self.remaining < 0 or len(line) > MAX_HEADER_LINE:
            raise http.client.LineTooLong("request header")
        return line


class _Handler(BaseHTTPRequestHandler):
    # One request per connection avoids ambiguous persistent request framing.
    protocol_version = "HTTP/1.0"
    server_version = "MEOK"
    sys_version = ""

    def log_message(self, _format, *_args):
        pass

    def log_error(self, _format, *_args):
        pass

    def handle(self):
        self.connection.settimeout(CLIENT_SOCKET_TIMEOUT)
        self._backend_socket = None
        expired = threading.Timer(REQUEST_DEADLINE, self._abort)
        expired.daemon = True
        expired.start()
        try:
            super().handle()
        finally:
            expired.cancel()
            _close_socket(self._backend_socket)

    def _abort(self):
        # An absolute deadline also bounds clients/backends that drip bytes often
        # enough to avoid the socket's inactivity timeout.
        _close_socket(self._backend_socket)
        _close_socket(self.connection)

    def parse_request(self):
        original = self.rfile
        self.rfile = _LimitedHeaders(original)
        try:
            return super().parse_request()
        finally:
            self.rfile = original

    def send_error(self, code, message=None, explain=None):
        # Never reflect parser errors, URLs, headers or backend error text.
        self._error(code, "invalid_request")

    def _send(self, status, body, *, authenticate=False):
        self.close_connection = True
        try:
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.send_header("Connection", "close")
            if authenticate:
                self.send_header("WWW-Authenticate", "Bearer")
            self.end_headers()
            if self.command != "HEAD":
                self.wfile.write(body)
        except OSError:
            pass

    def _error(self, status, code):
        body = json.dumps({"error": {"code": code}}, separators=(",", ":")).encode("ascii")
        self._send(status, body, authenticate=(status == 401))

    def _authenticated(self):
        values = self.headers.get_all("Authorization", [])
        candidate = values[0] if len(values) == 1 else ""
        try:
            candidate_bytes = candidate.encode("ascii")
        except UnicodeEncodeError:
            candidate_bytes = b""
        return hmac.compare_digest(candidate_bytes, self.server.expected_authorization)

    def _content_length(self, *, required):
        if self.headers.get_all("Transfer-Encoding") or self.headers.get_all("Expect"):
            self._error(400, "invalid_request")
            return None
        values = self.headers.get_all("Content-Length", [])
        if not values and not required:
            return 0
        if not values:
            self._error(411, "content_length_required")
            return None
        if len(values) != 1 or not _DIGITS.fullmatch(values[0]) or len(values[0]) > 10:
            self._error(400, "invalid_request")
            return None
        length = int(values[0])
        if length > MAX_REQUEST_BYTES:
            self._error(413, "request_too_large")
            return None
        return length

    def do_GET(self):
        if self.path not in ("/health", "/v1/models"):
            self._error(404, "not_found")
            return
        if self.path != "/health" and not self._authenticated():
            self._error(401, "unauthorized")
            return
        length = self._content_length(required=False)
        if length is None:
            return
        if length:
            self._error(400, "invalid_request")
            return
        self._forward("GET", self.path, None)

    def do_POST(self):
        if self.path != "/v1/chat/completions":
            self._error(404, "not_found")
            return
        if not self._authenticated():
            self._error(401, "unauthorized")
            return
        length = self._content_length(required=True)
        if length is None:
            return
        types = self.headers.get_all("Content-Type", [])
        if (len(types) != 1 or types[0].split(";", 1)[0].strip().lower() != "application/json"
                or self.headers.get_all("Content-Encoding")):
            self._error(415, "unsupported_media_type")
            return
        try:
            payload = self.rfile.read(length)
            if len(payload) != length:
                self._error(400, "invalid_request")
                return
            body = _chat_body(payload)
        except (TimeoutError, socket.timeout):
            self._error(408, "request_timeout")
            return
        except OverflowError:
            self._error(413, "request_too_large")
            return
        except (ValueError, TypeError, RecursionError):
            self._error(400, "invalid_request")
            return
        self._forward("POST", self.path, body)

    def _forward(self, method, path, body):
        health = path == "/health"
        timeout = HEALTH_TIMEOUT if health else BACKEND_TIMEOUT
        connection = http.client.HTTPConnection(self.server.backend_host,
                                                self.server.backend_port, timeout=timeout)
        try:
            # HTTPConnection performs no redirects and ignores HTTP_PROXY.
            connection.connect()
            self._backend_socket = connection.sock
            connection.request(method, path, body=body, headers={
                "Authorization": self.server.expected_authorization.decode("ascii"),
                "Content-Type": "application/json", "Accept": "application/json",
                "Connection": "close",
            })
            response = connection.getresponse()
            if health:
                healthy = response.status == 200
                self._send(200 if healthy else 503,
                           b'{"status":"ok"}' if healthy else b'{"status":"unavailable"}')
                return
            # Do not expose backend errors, redirects, headers or content encodings.
            if response.status != 200:
                self._error(502, "backend_unavailable")
                return
            lengths = response.headers.get_all("Content-Length", [])
            if lengths and (len(lengths) != 1 or not _DIGITS.fullmatch(lengths[0])
                            or len(lengths[0]) > 10 or int(lengths[0]) > MAX_RESPONSE_BYTES):
                self._error(502, "invalid_backend_response")
                return
            if (response.headers.get_content_type() != "application/json"
                    or response.headers.get("Content-Encoding", "identity").lower() != "identity"):
                self._error(502, "invalid_backend_response")
                return
            payload = response.read(MAX_RESPONSE_BYTES + 1)
            if len(payload) > MAX_RESPONSE_BYTES or (lengths and len(payload) != int(lengths[0])):
                self._error(502, "invalid_backend_response")
                return
            data = _json_loads(payload)
            if not isinstance(data, dict) or "error" in data:
                self._error(502, "invalid_backend_response")
                return
            self._send(200, payload)
        except (OSError, http.client.HTTPException, ValueError, RecursionError):
            if health:
                self._send(503, b'{"status":"unavailable"}')
            else:
                self._error(502, "backend_unavailable")
        finally:
            connection.close()
            _close_socket(self._backend_socket)
            self._backend_socket = None


class _BoundedServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True
    request_queue_size = 8

    def __init__(self, address, *, backend_host, backend_port, expected_authorization):
        self.backend_host = backend_host
        self.backend_port = backend_port
        self.expected_authorization = expected_authorization
        self._slots = threading.BoundedSemaphore(MAX_WORKERS)
        super().__init__(address, _Handler)

    def process_request(self, request, client_address):
        if not self._slots.acquire(blocking=False):
            # Reject before creating a thread. Keep the accept loop's send bounded.
            try:
                request.settimeout(0.25)
                request.sendall(b"HTTP/1.0 503 Service Unavailable\r\n"
                                b"Content-Length: 0\r\nConnection: close\r\n\r\n")
            except OSError:
                pass
            self.shutdown_request(request)
            return
        try:
            super().process_request(request, client_address)
        except BaseException:
            self._slots.release()
            raise

    def process_request_thread(self, request, client_address):
        try:
            super().process_request_thread(request, client_address)
        finally:
            self._slots.release()

    def handle_error(self, request, client_address):
        # No tracebacks or request/header content on the public service's stderr.
        pass


def make_server(env, *, bind_address=("0.0.0.0", 7860)):
    """Build the public server; bind_address/loopback port overrides aid offline tests."""
    key = env.get("VLLM_API_KEY", "")
    if (not isinstance(key, str) or not 32 <= len(key) <= 8192
            or any(ord(char) < 33 or ord(char) > 126 for char in key)):
        raise ValueError("VLLM_API_KEY must be 32..8192 visible ASCII characters")
    host = env.get("MEOK_COSMOS_BACKEND_HOST", "127.0.0.1")
    try:
        address = ipaddress.ip_address(host)
    except ValueError:
        raise ValueError("MEOK_COSMOS_BACKEND_HOST must be a loopback IP literal") from None
    if not address.is_loopback:
        raise ValueError("MEOK_COSMOS_BACKEND_HOST must be a loopback IP literal")
    port_text = str(env.get("MEOK_COSMOS_BACKEND_PORT", "8000"))
    if not _DIGITS.fullmatch(port_text) or len(port_text) > 5 or not 1 <= int(port_text) <= 65535:
        raise ValueError("MEOK_COSMOS_BACKEND_PORT must be 1..65535")
    return _BoundedServer(bind_address, backend_host=str(address), backend_port=int(port_text),
                          expected_authorization=("Bearer " + key).encode("ascii"))


def main():
    try:
        server = make_server(os.environ)
    except (ValueError, OSError):
        print("PROXY_CONFIGURATION_OR_BIND_FAILED", file=sys.stderr)
        return 2
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
