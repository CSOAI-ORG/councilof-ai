"""
POST /api/watchdog/report — Submit a watchdog report
Sirius Watchdog · Phase 472 · CSOAI Ltd UK 16939677 · MIT
"""
import json
import sys
import os

# Make sibling _lib importable when running as a Vercel Python function
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from _lib import (
    lake, parse_body, cors_headers, CARE_FLOOR, SIGIL_ALGO, CROWN_LINEAGE,
)


def handler(req):
    """Vercel Python serverless handler."""
    method = getattr(req, "method", "POST")
    if method == "OPTIONS":
        return _options()
    if method != "POST":
        return _bad_method()

    body = parse_body(req)
    r, ok, reason = lake().submit(**body)
    payload = {
        "accepted": ok,
        "reason": reason,
        "report_id": r.id if ok else None,
        "sigil": r.sigil if r else None,
        "sigil_algorithm": SIGIL_ALGO,
        "care_floor": CARE_FLOOR,
        "bft_pass": ok,
        "crown_lineage": CROWN_LINEAGE,
        "timestamp": r.timestamp if r else None,
    }
    return _resp(200 if ok else 400, payload)


def _resp(status, body):
    out = json.dumps(body).encode()
    return type("Resp", (), {
        "status_code": status,
        "headers": cors_headers(),
        "body": out,
        "body_str": out.decode(),
    })


def _options():
    return _resp(200, {"ok": True})


def _bad_method():
    return _resp(405, {"error": "method_not_allowed"})


# Optional WSGI shim for local testing
def app(environ, start_response):
    method = environ.get("REQUEST_METHOD", "POST")
    body = environ.get("wsgi.input")
    body_bytes = body.read() if body else b""
    fake = type("Req", (), {"method": method, "body": body_bytes})()
    resp = handler(fake)
    start_response(f"{resp.status_code} OK", list(resp.headers.items()))
    return [resp.body]
