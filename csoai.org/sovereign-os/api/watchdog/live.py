"""
GET /api/watchdog/live — Real-time stream of new watchdog reports
==============================================================
Phase 472 · Sirius Watchdog · CSOAI Ltd UK 16939677 · MIT

This is the LIVE STREAM ENDPOINT. Vercel serverless Python functions do not
support raw WebSocket upgrade, so this endpoint implements the WS-equivalent
as Server-Sent Events (SSE):

  - Same request shape as WS (one persistent HTTP connection)
  - Server pushes events as they arrive (new reports from any POST)
  - Auto-reconnect friendly (EventSource native browser API)
  - Care Floor 0.95 + BFT applied before fan-out

Event types pushed:
  - "report"    — a new validated WatchdogReport
  - "heartbeat" — keep-alive every 15s (on the wire too)
  - "snapshot"  — initial 25 most-recent reports on connect

SSE wire format:
  HTTP/1.1 200 OK
  Content-Type: text/event-stream
  Cache-Control: no-cache
  Connection: keep-alive

  event: snapshot
  data: {"count": 25, "results": [...]}

  event: report
  data: {"id": "...", "timestamp": "...", ...}

Usage from browser/agent:
  const ev = new EventSource('/api/watchdog/live');
  ev.addEventListener('snapshot', (e) => { /* initial */ });
  ev.addEventListener('report', (e) => { const d = JSON.parse(e.data); ... });
"""
import json
import sys
import os
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from _lib import lake, SIGIL_ALGO


def handler(req):
    """Vercel Python serverless handler for SSE.

    Vercel functions support streaming responses: return an object with a
    `body` iterable + `headers` + `status_code`. The platform streams the
    chunks as they're yielded.
    """
    method = getattr(req, "method", "GET")
    if method == "OPTIONS":
        return _preflight()
    if method != "GET":
        return _bad_method()

    q = lake().subscribe()
    headers = {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",  # disable nginx buffering
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Last-Event-ID",
        "X-Sovereign-Endpoint": "watchdog-live-sse",
        "X-Sigil-Algorithm": SIGIL_ALGO,
    }

    def gen():
        try:
            # 1. Snapshot of recent reports so the client renders immediately
            recent = lake().recent(25)
            snap = {"count": len(recent), "results": recent, "kind": "snapshot"}
            yield _sse("snapshot", snap)
            yield _sse("ready", {"watchdog": "online", "sigil_algorithm": SIGIL_ALGO})

            last_beat = time.time()
            last_history = last_beat
            while True:
                try:
                    # Block up to 1s for a new report
                    evt = q.get(timeout=1.0)
                    yield _sse("report", evt)
                except Exception:
                    pass

                now = time.time()
                # Heartbeat every 15s (also keeps proxies from idle-killing)
                if now - last_beat >= 15:
                    yield _sse("heartbeat", {"ts": now, "total_reports": lake().stats.get("total_reports", 0)})
                    last_beat = now
                # Periodic history refresh every 30s
                if now - last_history >= 30:
                    recent = lake().recent(10)
                    yield _sse("history", {"count": len(recent), "results": recent})
                    last_history = now
        finally:
            try:
                lake().unsubscribe(q)
            except Exception:
                pass

    return _resp(200, headers, gen())


def _sse(event_name: str, data: dict) -> bytes:
    """Format one SSE event."""
    lines = [f"event: {event_name}", f"data: {json.dumps(data, default=str)}", "", ""]
    return ("\n".join(lines)).encode()


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
        "Body": body_iter,  # WSGI streaming
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
