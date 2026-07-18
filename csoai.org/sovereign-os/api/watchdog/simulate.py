"""
GET /api/watchdog/simulate — Pre-departure route simulation
Sirius Watchdog · Phase 472 · CSOAI Ltd UK 16939677 · MIT
"""
import json
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from _lib import lake, parse_qs_for, cors_headers


def handler(req):
    method = getattr(req, "method", "GET")
    if method == "OPTIONS":
        return _resp(200, {"ok": True})
    if method not in ("GET", "POST"):
        return _resp(405, {"error": "method_not_allowed"})

    # Accept params via query string OR body
    qs = getattr(req, "query_string", b"")
    if isinstance(qs, bytes):
        qs = qs.decode()
    elif qs is None:
        qs = ""
    params = parse_qs_for(qs)

    body = {}
    if method == "POST":
        try:
            from _lib import parse_body
            body = parse_body(req) or {}
        except Exception:
            body = {}

    def _f(key, default):
        v = body.get(key) or params.get(key) or default
        try:
            return float(v)
        except Exception:
            return default

    start = {
        "lat": _f("start_lat", 51.5014),
        "lng": _f("start_lng", -0.1419),
        "area_name": body.get("start_name") or params.get("start_name") or "Origin",
    }
    end = {
        "lat": _f("end_lat", 51.508),
        "lng": _f("end_lng", -0.128),
        "area_name": body.get("end_name") or params.get("end_name") or "Destination",
    }
    mode = body.get("mode") or params.get("mode") or "balanced"

    return _resp(200, lake().simulate(start, end, mode))


def _resp(status, body):
    out = json.dumps(body).encode()
    return type("Resp", (), {
        "status_code": status,
        "headers": cors_headers(),
        "body": out,
        "body_str": out.decode(),
    })


def app(environ, start_response):
    method = environ.get("REQUEST_METHOD", "GET")
    qs = environ.get("QUERY_STRING", "")
    body = environ.get("wsgi.input")
    body_bytes = body.read() if body else b""
    fake = type("Req", (), {"method": method, "query_string": qs, "body": body_bytes})()
    resp = handler(fake)
    start_response(f"{resp.status_code} OK", list(resp.headers.items()))
    return [resp.body]
