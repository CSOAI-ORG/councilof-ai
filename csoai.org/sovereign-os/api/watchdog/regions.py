"""
GET /api/watchdog/regions — Top regions by signal density
Sirius Watchdog · Phase 472 · CSOAI Ltd UK 16939677 · MIT
"""
import json
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from _lib import lake, parse_qs_for, cors_headers, SIGIL_ALGO


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
    limit = int(params.get("limit", 20) or 20)

    heatmap = lake().heatmap()
    sorted_regions = sorted(
        heatmap.items(),
        key=lambda x: x[1]["total"],
        reverse=True,
    )[:limit]
    return _resp(200, {
        "top_regions": [{"region": name, **data} for name, data in sorted_regions],
        "count": len(sorted_regions),
        "sigil_algorithm": SIGIL_ALGO,
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
