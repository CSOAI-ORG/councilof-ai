#!/usr/bin/env python3
"""pheromone_router.py — swarm pheromone signal router for the Hive.

Implements the Operation Hive Mind pheromone protocol layer:
  mcp.alarm.red, mcp.trail.green, mcp.queen.gold, mcp.territory.mark,
  mcp.swarm.deploy, mcp.caste.transform, mcp.cleanup.black, mcp.gate.guard

Signals are persisted in SQLite and exposed via a tiny HTTP API.
"""
from __future__ import annotations

import json
import sqlite3
import threading
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, urlparse

ROOT = Path("/Users/nicholas/clawd")
DB = ROOT / ".hive" / "state" / "pheromones.db"
LOG = ROOT / ".hive" / "logs" / "pheromone_router.log"
PORT = 3900

CHANNELS = {
    "alarm": "mcp.alarm.red",
    "trail": "mcp.trail.green",
    "queen": "mcp.queen.gold",
    "mark": "mcp.territory.mark",
    "deploy": "mcp.swarm.deploy",
    "primer": "mcp.caste.transform",
    "cleanup": "mcp.cleanup.black",
    "guard": "mcp.gate.guard",
}


def init_db() -> None:
    DB.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(DB) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS signals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                channel TEXT NOT NULL,
                agent_id TEXT,
                payload TEXT,
                ts TEXT NOT NULL
            )
            """
        )
        conn.execute("CREATE INDEX IF NOT EXISTS idx_channel_ts ON signals(channel, ts)")


def log(msg: str) -> None:
    LOG.parent.mkdir(parents=True, exist_ok=True)
    with LOG.open("a", encoding="utf-8") as f:
        f.write(f"[{datetime.now(timezone.utc).isoformat()}] {msg}\n")


def emit(channel: str, agent_id: str, payload: dict[str, Any]) -> None:
    if channel not in CHANNELS.values():
        raise ValueError(f"Unknown channel: {channel}")
    with sqlite3.connect(DB) as conn:
        conn.execute(
            "INSERT INTO signals (channel, agent_id, payload, ts) VALUES (?, ?, ?, ?)",
            (channel, agent_id or "anon", json.dumps(payload), datetime.now(timezone.utc).isoformat()),
        )


def recent_counts(minutes: int = 60) -> dict[str, int]:
    since = datetime.now(timezone.utc).isoformat()
    with sqlite3.connect(DB) as conn:
        rows = conn.execute(
            "SELECT channel, COUNT(*) FROM signals WHERE ts > datetime('now', '-{} minutes') GROUP BY channel".format(minutes)
        ).fetchall()
    return {channel: 0 for channel in CHANNELS.values()} | dict(rows)


def latest_signals(limit: int = 20) -> list[dict[str, Any]]:
    with sqlite3.connect(DB) as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute(
            "SELECT * FROM signals ORDER BY ts DESC LIMIT ?", (limit,)
        ).fetchall()
    return [dict(r) for r in rows]


class Handler(BaseHTTPRequestHandler):
    def log_message(self, format: str, *args: Any) -> None:
        log(format % args)

    def _json(self, status: int, data: dict[str, Any]) -> None:
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode("utf-8"))

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/health":
            self._json(200, {"status": "healthy", "port": PORT})
        elif parsed.path == "/channels":
            self._json(200, {"channels": CHANNELS, "recent_60m": recent_counts(60)})
        elif parsed.path == "/signals":
            qs = parse_qs(parsed.query)
            limit = int(qs.get("limit", ["20"])[0])
            self._json(200, {"signals": latest_signals(limit)})
        else:
            self._json(404, {"detail": "Not Found"})

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path != "/emit":
            self._json(404, {"detail": "Not Found"})
            return
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length).decode("utf-8"))
            channel = body.get("channel")
            if channel not in CHANNELS.values():
                self._json(400, {"detail": f"Unknown channel. Use one of: {list(CHANNELS.values())}"})
                return
            emit(channel, body.get("agent_id"), body.get("payload", {}))
            self._json(200, {"status": "emitted", "channel": channel})
        except Exception as e:
            self._json(500, {"detail": str(e)})


def main() -> None:
    init_db()
    server = HTTPServer(("127.0.0.1", PORT), Handler)
    log(f"Pheromone Router listening on http://127.0.0.1:{PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
