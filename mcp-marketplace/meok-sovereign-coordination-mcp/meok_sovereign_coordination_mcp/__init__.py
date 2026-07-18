"""meok-sovereign-coordination-mcp — Cross-General coordination + planning.

The Coordination MCP manages cross-General tasks (when multiple Generals
need to work on the same task), schedules, and resource allocation.

5 tools:
  1. coord_create_task    - create a cross-General task
  2. coord_assign         - assign a task to one or more Generals
  3. coord_status         - get task status
  4. coord_list           - list all tasks (filterable by status/assignee)
  5. coord_complete       - mark a task complete
"""
from __future__ import annotations
import json
import hashlib
from datetime import datetime, timezone
from typing import List, Optional

PROTOCOL = "sovereign-coordination/1.0"
VERSION = "1.0.0"

TASKS: dict = {}
GENERALS = [
    "argus", "scribe", "shield", "builder", "abacus", "lex",
    "scale", "crow", "gear", "voice", "owl", "dragon",
]


def _sign(payload: dict) -> dict:
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "coord-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


def _now_ns():
    import time as _t
    return _t.time_ns()


def coord_create_task(title: str, description: str,
                     care_floor_impact: bool = False,
                     bft_mode: str = "balanced") -> dict:
    """Create a cross-General task."""
    task_id = hashlib.sha256(f"{title}|{description}|{_now_ns()}".encode()).hexdigest()[:16]
    task = {
        "protocol": PROTOCOL, "version": VERSION,
        "task_id": task_id,
        "title": title, "description": description,
        "care_floor_impact": care_floor_impact,
        "bft_mode": bft_mode,
        "status": "PENDING",
        "assignees": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "completed_at": None,
    }
    TASKS[task_id] = task
    return _sign(task)


def coord_assign(task_id: str, assignees: List[str]) -> dict:
    """Assign a task to one or more Generals."""
    if task_id not in TASKS:
        return _sign({"error": f"unknown task: {task_id}"})
    for a in assignees:
        if a not in GENERALS:
            return _sign({"error": f"unknown general: {a}"})
    task = TASKS[task_id]
    task["assignees"] = list(set(task["assignees"] + assignees))
    task["status"] = "ASSIGNED"
    return _sign(task)


def coord_status(task_id: str) -> dict:
    """Get task status."""
    if task_id not in TASKS:
        return _sign({"error": f"unknown task: {task_id}"})
    return _sign(TASKS[task_id])


def coord_list(status: Optional[str] = None,
               assignee: Optional[str] = None) -> dict:
    """List all tasks (filterable)."""
    matching = list(TASKS.values())
    if status:
        matching = [t for t in matching if t["status"] == status]
    if assignee:
        matching = [t for t in matching if assignee in t["assignees"]]
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "tasks": matching, "count": len(matching),
        "status_filter": status, "assignee_filter": assignee,
    })


def coord_complete(task_id: str) -> dict:
    """Mark a task complete."""
    if task_id not in TASKS:
        return _sign({"error": f"unknown task: {task_id}"})
    task = TASKS[task_id]
    task["status"] = "COMPLETED"
    task["completed_at"] = datetime.now(timezone.utc).isoformat()
    return _sign(task)