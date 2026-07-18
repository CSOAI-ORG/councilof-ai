"""
GET /api/watchdog/stats — Aggregate statistics
Sirius Watchdog · Phase 472 · CSOAI Ltd UK 16939677 · MIT
"""
import json
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from _lib import lake, cors_headers


def handler(req):
    method = getattr(req, "method", "GET")
    if method == "OPTIONS":
        return _resp(200, {"ok": True})
    if method != "GET":
        return _resp(405, {"error": "method_not_allowed"})
    return _resp(200, lake().get_stats())


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
    fake = type("Req", (), {"method": method})()
    resp = handler(fake)
    start_response(f"{resp.status_code} OK", list(resp.headers.items()))
    return [resp.body]
