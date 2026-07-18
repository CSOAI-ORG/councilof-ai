"""
GET /api/watchdog/ws/heatmap — Live heatmap stream (WS-equivalent via SSE)
========================================================================
Phase 472 · Sirius Watchdog · CSOAI Ltd UK 16939677 · MIT

Streams the live heatmap (aggregated by region) as events change.
Each event contains the current region aggregation + a delta payload.

SSE event types:
  - "snapshot"  — initial heatmap on connect
  - "update"    — every 5s when the heatmap changes
  - "heartbeat" — 15s keep-alive

This is the WebSocket-style live heatmap endpoint adapted to Vercel's
serverless constraints. Same UX: open the connection, receive deltas,
auto-reconnect on drop.
"""
import json
import sys
import os
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from _lib import lake, SIGIL_ALGO


def handler(req):
    method = getattr(req, "method", "GET")
    if method == "OPTIONS":
        return _preflight()
    if method != "GET":
        return _bad_method()

    headers = {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "X-Sovereign-Endpoint": "watchdog-heatmap-sse",
        "X-Sigil-Algorithm": SIGIL_ALGO,
    }

    def gen():
        last_beat = time.time()
        last_snapshot = None
        # Initial snapshot
        snap = _snapshot()
        last_snapshot = json.dumps(snap["regions"], sort_keys=True)
        yield _sse("snapshot", snap)
        yield _sse("ready", {"watchdog": "online", "sigil_algorithm": SIGIL_ALGO})

        while True:
            time.sleep(5.0)  # emit every 5s
            cur = lake().heatmap()
            cur_fp = json.dumps(cur, sort_keys=True)
            now = time.time()
            if cur_fp != last_snapshot:
                last_snapshot = cur_fp
                yield _sse("update", {
                    "regions": cur,
                    "region_count": len(cur),
                    "ts": now,
                })
            if now - last_beat >= 15:
                yield _sse("heartbeat", {"ts": now, "total_reports": lake().stats.get("total_reports", 0)})
                last_beat = now

    return _resp(200, headers, gen())


def _snapshot() -> dict:
    heat = lake().heatmap()
    return {
        "regions": heat,
        "region_count": len(heat),
        "generated_at": _now(),
        "sigil_algorithm": SIGIL_ALGO,
    }


def _now() -> str:
    from datetime import datetime, timezone
    return datetime.now(timezone.utc).isoformat()


def _sse(event_name: str, data: dict) -> bytes:
    return ("\n".join([f"event: {event_name}", f"data: {json.dumps(data, default=str)}", "", ""])).encode()


def _resp(status, headers, body):
    if hasattr(body, "__iter__") and not isinstance(body, (bytes, str)):
        body_iter = body
        body_bytes = b""
    else:
        body_iter = iter([body])
        body_bytes = body if isinstance(body, bytes) else (body.encode() if isinstance(body, str) else b"")

    return type("Resp", (), {
        "status_code": status,
        "headers": headers,
        "body": body_bytes,
        "__iter__": lambda self: iter(body_iter),
        "Body": body_iter,
    })


def _preflight():
    return _resp(200, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Content-Type": "text/plain",
    }, "ok")


def _bad_method():
    return _resp(405, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
    }, json.dumps({"error": "method_not_allowed"}).encode())


def app(environ, start_response):
    method = environ.get("REQUEST_METHOD", "GET")
    fake = type("Req", (), {"method": method})()
    resp = handler(fake)
    start_response(f"{resp.status_code} OK", list(resp.headers.items()))
    return resp.Body
