"""
GET /api/watchdog/heatmap — Aggregated heat map per region
Sirius Watchdog · Phase 472 · CSOAI Ltd UK 16939677 · MIT
"""
import json
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from _lib import (
    lake, parse_qs_for, cors_headers, SIGIL_ALGO, CARE_FLOOR,
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
    layer = params.get("layer")  # optional category filter: safety/infrastructure/...
    zoom = params.get("zoom", "L1")

    heat = lake().heatmap()
    # Apply optional layer filter
    if layer:
        for region, data in heat.items():
            data["by_type"] = {k: v for k, v in data.get("by_type", {}).items() if k == layer}

    return _resp(200, {
        "regions": heat,
        "zoom": zoom,
        "layer": layer,
        "region_count": len(heat),
        "sigil_algorithm": SIGIL_ALGO,
        "care_floor": CARE_FLOOR,
        "generated_at": _now(),
    })


def _now() -> str:
    from datetime import datetime, timezone
    return datetime.now(timezone.utc).isoformat()


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
