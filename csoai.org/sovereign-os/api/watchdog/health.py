"""
GET /api/watchdog/health — Service health check
Sirius Watchdog · Phase 472 · CSOAI Ltd UK 16939677 · MIT
"""
import json
import sys
import os
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from _lib import lake, cors_headers


def handler(req):
    method = getattr(req, "method", "GET")
    if method == "OPTIONS":
        return _resp(200, {"ok": True})
    if method != "GET":
        return _resp(405, {"error": "method_not_allowed"})

    stats = lake().get_stats()
    return _resp(200, {
        "status": "online",
        "version": "1.0.0",
        "license": "MIT + CC0 1.0",
        "crown_lineage": "1795-2026",
        "service": "public-watchdog",
        "phase": 472,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "total_reports": stats.get("total_reports", 0),
        "data_lake_size_mb": stats.get("data_lake_size_mb", 0),
        "endpoints": [
            "POST /api/watchdog/report",
            "GET /api/watchdog/reports",
            "GET /api/watchdog/heatmap",
            "GET /api/watchdog/regions",
            "GET /api/watchdog/simulate",
            "GET /api/watchdog/stats",
            "GET /api/watchdog/health",
            "GET /api/watchdog/live (SSE — WS-equivalent on Vercel)",
            "GET /api/watchdog/ws/heatmap (SSE — heatmap live stream)",
        ],
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
    fake = type("Req", (), {"method": method})()
    resp = handler(fake)
    start_response(f"{resp.status_code} OK", list(resp.headers.items()))
    return [resp.body]
