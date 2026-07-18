#!/usr/bin/env python3
"""quorum_sensor.py — biological quorum sensing for the Hive.

Reads pheromone signal density from the Pheromone Router's SQLite database,
decides the current hive mode, and writes it to .hive/logs/hive_mode.json.

Modes: construction | war | migration | regicide
"""
from __future__ import annotations

import json
import sqlite3
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path("/Users/nicholas/clawd")
DB = ROOT / ".hive" / "state" / "pheromones.db"
ROUTER_URL = "http://127.0.0.1:3900"
MODE_LOG = ROOT / ".hive" / "logs" / "hive_mode.json"
HISTORY_LOG = ROOT / ".hive" / "logs" / "hive_mode_history.jsonl"

THRESHOLD = 0.6


def log(msg: str) -> None:
    ROOT.mkdir(parents=True, exist_ok=True)
    (ROOT / ".hive" / "logs" / "quorum_sensor.log").parent.mkdir(parents=True, exist_ok=True)
    with (ROOT / ".hive" / "logs" / "quorum_sensor.log").open("a", encoding="utf-8") as f:
        f.write(f"[{datetime.now(timezone.utc).isoformat()}] {msg}\n")
    print(msg)


def get_recent_counts(minutes: int = 60) -> dict[str, int]:
    try:
        if DB.exists():
            with sqlite3.connect(DB) as conn:
                rows = conn.execute(
                    "SELECT channel, COUNT(*) FROM signals WHERE ts > datetime('now', '-{} minutes') GROUP BY channel".format(minutes)
                ).fetchall()
            return dict(rows)
    except Exception as e:
        log(f"DB read failed: {e}")

    try:
        req = urllib.request.Request(f"{ROUTER_URL}/channels", method="GET")
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data.get("recent_60m", {})
    except Exception as e:
        log(f"Router fetch failed: {e}")
        return {}


def decide_mode(counts: dict[str, int]) -> str:
    total = max(1, sum(counts.values()))
    densities = {k: v / total for k, v in counts.items()}

    if densities.get("mcp.queen.gold", 0) < 0.1:
        return "regicide"
    if densities.get("mcp.alarm.red", 0) > THRESHOLD:
        return "war"
    if densities.get("mcp.trail.green", 0) > THRESHOLD:
        return "construction"
    if densities.get("mcp.swarm.deploy", 0) > THRESHOLD:
        return "migration"
    return "construction"


def main() -> None:
    counts = get_recent_counts(60)
    mode = decide_mode(counts)
    ts = datetime.now(timezone.utc).isoformat()

    record = {"ts": ts, "mode": mode, "threshold": THRESHOLD, "densities": counts}
    MODE_LOG.parent.mkdir(parents=True, exist_ok=True)
    MODE_LOG.write_text(json.dumps(record, indent=2), encoding="utf-8")

    HISTORY_LOG.parent.mkdir(parents=True, exist_ok=True)
    with HISTORY_LOG.open("a", encoding="utf-8") as f:
        f.write(json.dumps(record) + "\n")

    log(f"Hive mode: {mode} | counts={counts}")


if __name__ == "__main__":
    main()
