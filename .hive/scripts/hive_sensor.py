#!/usr/bin/env python3
"""hive_sensor.py — scan empire for actionable tasks and emit a living queue.

Reads sensor configuration from .hive/config.yaml, scans blocker/TODO/quality/post
files, classifies tasks by router and priority, and writes .hive/tasks/queue.json.
"""
from __future__ import annotations

import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from hive_notify import notify

ROOT = Path(os.environ.get("HIVE_ROOT", "/Users/nicholas/clawd"))
CONFIG = ROOT / ".hive" / "config.yaml"
QUEUE = ROOT / ".hive" / "tasks" / "queue.json"

ROUTER_PATTERNS: dict[str, str] = {
    "human-gate": r"\b(paste|key|secret|password|token|buy|purchase|Stripe dashboard|browser click|device flow|domain|namecheap|vercel|cloudflare)\b",
    "git-ops": r"\b(commit|push|merge|branch|PR|submodule|gitignore|release|tag|publish to (pypi|npm|smithery))\b",
    "infra": r"\b(restart|deploy|vercel|docker|container|port|service|dns|domain|server|launchd|systemd|plist)\b",
    "quality": r"\b(test|lint|audit|grade|fix|clean|placeholder|mismatch|AEO|SEO|schema|coverage)\b",
    "publish-loop": r"\b(post|publish|schedule|social|linkedin|twitter|reddit|blitz|distribution|buffer|substack)\b",
    "agent": r".",
}

PRIORITY_PATTERNS: dict[str, str] = {
    "P0": r"\b(MEOK_MASTER_API_KEY|kingpin|revenue blocked|critical|lawsuit|£.*k at stake|fund deadline|BLOCKED|breach|outage)\b",
    "P1": r"\b(Stripe|pricing|checkout|publish|Smithery|mcp-publisher|advisory|enterprise|grant deadline|sovereignai\.gov\.uk)\b",
    "P2": r"\b(fix|update|add|create|ship|deploy|reconcile|refactor|sweep|align|audit)\b",
    "P3": r".",
}


def load_config() -> dict[str, Any]:
    try:
        import yaml

        return yaml.safe_load(CONFIG.read_text(encoding="utf-8")) or {}
    except Exception:
        return {}


def sensor_patterns(config: dict[str, Any]) -> list[str]:
    """Return glob patterns for files the sensor should scan."""
    sensors = config.get("sensors", {})
    patterns: list[str] = []
    for key in ("blocker_files", "todo_files", "quality_files", "post_files"):
        patterns.extend(sensors.get(key, []))
    return patterns or [
        "**/TODO*.md",
        "**/todo.md",
        "**/TODO_*.md",
        "**/*BLOCKER*.md",
        "**/*QUALITY*.md",
        "**/READY_TO_POST*",
    ]


def ignore_dirs(config: dict[str, Any]) -> set[str]:
    return set(config.get("sensors", {}).get("ignore_dirs", []))


def scan_files(root: Path, patterns: list[str], ignores: set[str]) -> set[Path]:
    files: set[Path] = set()
    for p in patterns:
        for hit in root.glob(p):
            if not hit.is_file():
                continue
            if any(part in ignores for part in hit.parts):
                continue
            files.add(hit)
    return files


def extract_tasks(text: str, source: Path) -> list[dict[str, str]]:
    tasks: list[dict[str, str]] = []
    for raw in text.splitlines():
        line = raw.strip()
        if not line:
            continue
        m = re.match(r"[-*]\s+\[([ xX])\]\s+(.*)", line)
        if not m:
            m = re.match(r"\*\*(Action|TODO):\*\*\s*(.*)", line, re.I)
        if m:
            body = m.group(2).strip()
            if len(body) > 5:
                tasks.append({"source": str(source.relative_to(ROOT)), "body": body})
    return tasks


def classify_task(task: dict[str, str]) -> dict[str, str]:
    body = task["body"].lower()
    router = "agent"
    for r, pat in ROUTER_PATTERNS.items():
        if re.search(pat, body, re.I):
            router = r
            break
    priority = "P3"
    for p, pat in PRIORITY_PATTERNS.items():
        if re.search(pat, body, re.I):
            priority = p
            break
    return {"router": router, "priority": priority, **task}


def main() -> None:
    config = load_config()
    patterns = sensor_patterns(config)
    ignores = ignore_dirs(config)

    queue = {"ts": datetime.now(timezone.utc).isoformat(), "tasks": []}
    for src in sorted(scan_files(ROOT, patterns, ignores)):
        try:
            text = src.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue
        for t in extract_tasks(text, src):
            queue["tasks"].append(classify_task(t))

    QUEUE.parent.mkdir(parents=True, exist_ok=True)
    QUEUE.write_text(json.dumps(queue, indent=2), encoding="utf-8")

    by_router: dict[str, int] = {}
    by_prio: dict[str, int] = {}
    for t in queue["tasks"]:
        by_router[t["router"]] = by_router.get(t["router"], 0) + 1
        by_prio[t["priority"]] = by_prio.get(t["priority"], 0) + 1

    print(f"Hive Sensor: scanned {len(patterns)} patterns | found {len(queue['tasks'])} tasks")
    print(f"  by router: {by_router}")
    print(f"  by priority: {by_prio}")

    p0_count = by_prio.get("P0", 0)
    if p0_count:
        p0_tasks = [t for t in queue["tasks"] if t["priority"] == "P0"][:5]
        body = "\n".join(f"- [{t['router']}] {t['body'][:120]}" for t in p0_tasks)
        notify(
            f"Sensor found {p0_count} P0 tasks",
            f"Top P0 items requiring immediate attention:\n{body}",
            level="error",
        )


if __name__ == "__main__":
    main()
