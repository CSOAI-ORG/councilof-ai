"""
GET /api/watchdog/reports — List reports with filters
Sirius Watchdog · Phase 472 · CSOAI Ltd UK 16939677 · MIT
"""
import json
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from _lib import (
    lake, parse_qs_for, cors_headers, SIGIL_ALGO,
)


def handler(req):
    method = getattr(req, "method", "GET")
    if method == "OPTIONS":
        return _resp(200, {"ok": True})
    if method != "GET":
        return _resp(405, {"error": "method_not_allowed"})

    qs = getattr(req, "query_string", b"")
    if isinstance(qs, bytes):
        qs = qs.decode()
    elif qs is None:
        qs = ""
    params = parse_qs_for(qs)

    filters = {
        "region": params.get("region"),
        "type_filter": params.get("type"),
        "last": params.get("last", "24h"),
        "reporter_type": params.get("reporter_type"),
        "severity_min": float(params.get("severity_min", 0.0) or 0.0),
        "limit": int(params.get("limit", 100) or 100),
    }
    results = lake().query(**filters)
    return _resp(200, {
        "count": len(results),
        "results": results,
        "sigil_algorithm": SIGIL_ALGO,
        "filters": {k: v for k, v in filters.items() if v is not None},
    })


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
    fake = type("Req", (), {"method": method, "query_string": qs})()
    resp = handler(fake)
    start_response(f"{resp.status_code} OK", list(resp.headers.items()))
    return [resp.body]
